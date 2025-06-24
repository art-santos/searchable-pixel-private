import Stripe from 'stripe'

function requireEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value
}

// Load required environment variables for new pricing model
const STRIPE_SECRET_KEY = requireEnvVar('STRIPE_SECRET_KEY')
const STRIPE_STARTER_MONTHLY_PRICE_ID = requireEnvVar('STRIPE_STARTER_MONTHLY_PRICE_ID')
const STRIPE_STARTER_ANNUAL_PRICE_ID = requireEnvVar('STRIPE_STARTER_ANNUAL_PRICE_ID')

// Initialize Stripe
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Helper function to format price for display
export function formatPrice(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

// Get price ID based on plan, billing period, and credits (for Pro plan)
export function getPriceId(planId: string, isAnnual: boolean, credits?: number): string | null {
  // For Pro plan, use credit-based pricing
  if (planId === 'pro') {
    return getProPriceIdByCredits(credits || 250, isAnnual) // Default to 250 credits
  }

  // For Starter plan, use standard pricing
  if (planId === 'starter') {
    return isAnnual ? STRIPE_STARTER_ANNUAL_PRICE_ID : STRIPE_STARTER_MONTHLY_PRICE_ID
  }

  return null
}

// Get Pro plan price ID based on credit amount
export function getProPriceIdByCredits(credits: number, isAnnual: boolean): string | null {
  const billing = isAnnual ? 'annual' : 'monthly'
  
  // Use the new credit-based price IDs
  const creditPriceIds: Record<string, string> = {
    // Monthly credit tiers
    '250_monthly': process.env.STRIPE_PRO_250_MONTHLY_PRICE_ID || '',
    '500_monthly': process.env.STRIPE_PRO_500_MONTHLY_PRICE_ID || '',
    '1000_monthly': process.env.STRIPE_PRO_1000_MONTHLY_PRICE_ID || '',
    '2500_monthly': process.env.STRIPE_PRO_2500_MONTHLY_PRICE_ID || '',
    '5000_monthly': process.env.STRIPE_PRO_5000_MONTHLY_PRICE_ID || '',
    '10000_monthly': process.env.STRIPE_PRO_10000_MONTHLY_PRICE_ID || '',
    
    // Annual credit tiers
    '250_annual': process.env.STRIPE_PRO_250_ANNUAL_PRICE_ID || '',
    '500_annual': process.env.STRIPE_PRO_500_ANNUAL_PRICE_ID || '',
    '1000_annual': process.env.STRIPE_PRO_1000_ANNUAL_PRICE_ID || '',
    '2500_annual': process.env.STRIPE_PRO_2500_ANNUAL_PRICE_ID || '',
    '5000_annual': process.env.STRIPE_PRO_5000_ANNUAL_PRICE_ID || '',
    '10000_annual': process.env.STRIPE_PRO_10000_ANNUAL_PRICE_ID || '',
  }
  
  const key = `${credits}_${billing}`
  const priceId = creditPriceIds[key]
  
  // Return the price ID if it exists and is not empty
  return priceId || null
}

// Removed: Add-on functionality no longer supported

// Map Stripe subscription to our plan names
export function mapSubscriptionToPlan(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id

  // First check metadata for plan_id (most reliable for new subscriptions)
  const planFromMetadata = subscription.metadata?.plan_id
  if (planFromMetadata && ['starter', 'pro'].includes(planFromMetadata)) {
    return planFromMetadata
  }

  // Fallback to price ID mapping
  const priceMap: Record<string, string> = {
    [STRIPE_STARTER_MONTHLY_PRICE_ID]: 'starter',
    [STRIPE_STARTER_ANNUAL_PRICE_ID]: 'starter',
  }

  // Add all Pro credit-based price IDs
  const proCreditPriceIds = [
    process.env.STRIPE_PRO_250_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_250_ANNUAL_PRICE_ID,
    process.env.STRIPE_PRO_500_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_500_ANNUAL_PRICE_ID,
    process.env.STRIPE_PRO_1000_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_1000_ANNUAL_PRICE_ID,
    process.env.STRIPE_PRO_2500_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_2500_ANNUAL_PRICE_ID,
    process.env.STRIPE_PRO_5000_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_5000_ANNUAL_PRICE_ID,
    process.env.STRIPE_PRO_10000_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_10000_ANNUAL_PRICE_ID,
  ].filter(Boolean)

  // Check if it's a Pro credit-based price ID
  if (proCreditPriceIds.includes(priceId)) {
    return 'pro'
  }
  
  return priceMap[priceId] || 'starter' // default to starter, no free plan
}

// Check if subscription includes trial
export function hasActiveTrial(subscription: Stripe.Subscription): boolean {
  return subscription.status === 'trialing' && 
         subscription.trial_end !== null && 
         subscription.trial_end > Math.floor(Date.now() / 1000)
}

// Get trial end date
export function getTrialEndDate(subscription: Stripe.Subscription): Date | null {
  if (!subscription.trial_end) return null
  return new Date(subscription.trial_end * 1000)
}

// Create checkout session with trial support
export async function createCheckoutSession({
  planId,
  isAnnual = false,
  customerId,
  customerEmail,
  credits,
  trialDays = 0,
  successUrl,
  cancelUrl
}: {
  planId: string
  isAnnual?: boolean
  customerId?: string
  customerEmail: string
  credits?: number
  trialDays?: number
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const priceId = getPriceId(planId, isAnnual, credits)
  if (!priceId) {
    throw new Error(`Invalid plan ID: ${planId}${credits ? ` with ${credits} credits` : ''}`)
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: priceId,
      quantity: 1,
    }
  ]

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    subscription_data: {
      metadata: {
        plan_id: planId,
        billing_period: isAnnual ? 'annual' : 'monthly',
        ...(credits && { credits: credits.toString() }),
      }
    },
    // Add metadata to help link the customer back to the user
    metadata: {
      plan_id: planId,
      billing_period: isAnnual ? 'annual' : 'monthly',
      ...(credits && { credits: credits.toString() }),
    }
  }

  // Add trial if specified (typically for starter plan)
  if (trialDays > 0) {
    sessionParams.subscription_data!.trial_period_days = trialDays
  }

  // Use existing customer if provided
  if (customerId) {
    sessionParams.customer = customerId
    delete sessionParams.customer_email
  } else {
    // If creating a new customer, ensure email is set
    sessionParams.customer_email = customerEmail
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

// Removed: All add-on functionality no longer supported

// Create customer portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// Validate webhook signature
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret)
} 