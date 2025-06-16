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
const STRIPE_PRO_MONTHLY_PRICE_ID = requireEnvVar('STRIPE_PRO_MONTHLY_PRICE_ID')
const STRIPE_PRO_ANNUAL_PRICE_ID = requireEnvVar('STRIPE_PRO_ANNUAL_PRICE_ID')
const STRIPE_TEAM_MONTHLY_PRICE_ID = requireEnvVar('STRIPE_TEAM_MONTHLY_PRICE_ID')
const STRIPE_TEAM_ANNUAL_PRICE_ID = requireEnvVar('STRIPE_TEAM_ANNUAL_PRICE_ID')
const STRIPE_EXTRA_DOMAINS_PRICE_ID = requireEnvVar('STRIPE_EXTRA_DOMAINS_PRICE_ID')
const STRIPE_EDGE_ALERTS_PRICE_ID = requireEnvVar('STRIPE_EDGE_ALERTS_PRICE_ID')

// Initialize Stripe
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
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

// Get price ID based on plan and billing period
export function getPriceId(planId: string, isAnnual: boolean): string | null {
  const priceIds: Record<string, string> = {
    starter_monthly: STRIPE_STARTER_MONTHLY_PRICE_ID,
    starter_annual: STRIPE_STARTER_ANNUAL_PRICE_ID,
    pro_monthly: STRIPE_PRO_MONTHLY_PRICE_ID,
    pro_annual: STRIPE_PRO_ANNUAL_PRICE_ID,
    team_monthly: STRIPE_TEAM_MONTHLY_PRICE_ID,
    team_annual: STRIPE_TEAM_ANNUAL_PRICE_ID,
  }

  const billing = isAnnual ? 'annual' : 'monthly'
  const key = `${planId}_${billing}`
  
  return priceIds[key] || null
}

// Get add-on pricing IDs for fixed monthly billing
export function getAddOnPriceId(type: 'extra_domains' | 'edge_alerts'): string | null {
  const addOnPriceIds: Record<string, string> = {
    extra_domains: STRIPE_EXTRA_DOMAINS_PRICE_ID,
    edge_alerts: STRIPE_EDGE_ALERTS_PRICE_ID,
  }
  
  return addOnPriceIds[type] || null
}

// Map Stripe subscription to our plan names
export function mapSubscriptionToPlan(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id

  const priceMap: Record<string, string> = {
    [STRIPE_STARTER_MONTHLY_PRICE_ID]: 'starter',
    [STRIPE_STARTER_ANNUAL_PRICE_ID]: 'starter',
    [STRIPE_PRO_MONTHLY_PRICE_ID]: 'pro',
    [STRIPE_PRO_ANNUAL_PRICE_ID]: 'pro',
    [STRIPE_TEAM_MONTHLY_PRICE_ID]: 'team',
    [STRIPE_TEAM_ANNUAL_PRICE_ID]: 'team',
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
  addOns = {},
  trialDays = 0,
  successUrl,
  cancelUrl
}: {
  planId: string
  isAnnual?: boolean
  customerId?: string
  customerEmail: string
  addOns?: {
    extraDomains?: number
    edgeAlerts?: boolean
  }
  trialDays?: number
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const priceId = getPriceId(planId, isAnnual)
  if (!priceId) {
    throw new Error(`Invalid plan ID: ${planId}`)
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: priceId,
      quantity: 1,
    }
  ]

  // Add extra domains add-on
  if (addOns.extraDomains && addOns.extraDomains > 0) {
    const domainPriceId = getAddOnPriceId('extra_domains')
    if (domainPriceId) {
      lineItems.push({
        price: domainPriceId,
        quantity: addOns.extraDomains,
      })
    }
  }

  // Add edge alerts add-on
  if (addOns.edgeAlerts) {
    const edgeAlertsPriceId = getAddOnPriceId('edge_alerts')
    if (edgeAlertsPriceId) {
      lineItems.push({
        price: edgeAlertsPriceId,
        quantity: 1,
      })
    }
  }

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
      }
    },
    // Add metadata to help link the customer back to the user
    metadata: {
      plan_id: planId,
      billing_period: isAnnual ? 'annual' : 'monthly',
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

// Add subscription add-ons to an existing subscription
export async function addSubscriptionAddOns(
  subscriptionId: string,
  addOns: Array<{
    type: 'extra_domains' | 'edge_alerts'
    quantity: number
  }>
): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const itemsToAdd = addOns.map(addOn => {
      const priceId = getAddOnPriceId(addOn.type)
      if (!priceId) {
        throw new Error(`No price ID found for ${addOn.type}`)
      }
      
      return {
        price: priceId,
        quantity: addOn.quantity
      }
    })
    
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        ...subscription.items.data.map(item => ({ id: item.id })),
        ...itemsToAdd
      ],
      proration_behavior: 'always_invoice'
    })
    
    return true
  } catch (error) {
    console.error('Error adding subscription add-ons:', error)
    return false
  }
}

// Remove subscription add-ons
export async function removeSubscriptionAddOns(
  subscriptionId: string,
  addOnTypes: Array<'extra_domains' | 'edge_alerts'>
): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const addOnPriceIds = addOnTypes.map(type => getAddOnPriceId(type)).filter(Boolean)
    
    const itemsToKeep = subscription.items.data.filter(item => 
      !addOnPriceIds.includes(item.price.id)
    )
    
    await stripe.subscriptions.update(subscriptionId, {
      items: itemsToKeep.map(item => ({ id: item.id })),
      proration_behavior: 'always_invoice'
    })
    
    return true
  } catch (error) {
    console.error('Error removing subscription add-ons:', error)
    return false
  }
}

// Update subscription add-on quantities
export async function updateSubscriptionAddOn(
  subscriptionId: string,
  addOnType: 'extra_domains' | 'edge_alerts',
  newQuantity: number
): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const addOnPriceId = getAddOnPriceId(addOnType)
    
    if (!addOnPriceId) {
      throw new Error(`No price ID found for ${addOnType}`)
    }
    
    const existingItem = subscription.items.data.find(item => 
      item.price.id === addOnPriceId
    )
    
    if (existingItem) {
      // Update existing add-on
      await stripe.subscriptionItems.update(existingItem.id, {
        quantity: newQuantity,
        proration_behavior: 'always_invoice'
      })
    } else {
      // Add new add-on
      await stripe.subscriptionItems.create({
        subscription: subscriptionId,
        price: addOnPriceId,
        quantity: newQuantity,
        proration_behavior: 'always_invoice'
      })
    }
    
    return true
  } catch (error) {
    console.error('Error updating subscription add-on:', error)
    return false
  }
}

// Get subscription details with add-ons
export async function getSubscriptionWithAddOns(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    })
    
    const mainPlan = mapSubscriptionToPlan(subscription)
    const addOns: Record<string, number> = {}
    
    subscription.items.data.forEach(item => {
      if (item.price.id === STRIPE_EXTRA_DOMAINS_PRICE_ID) {
        addOns.extra_domains = item.quantity || 0
      } else if (item.price.id === STRIPE_EDGE_ALERTS_PRICE_ID) {
        addOns.edge_alerts = item.quantity || 0
      }
    })
    
    return {
      subscription,
      plan: mainPlan,
      addOns,
      isTrialing: hasActiveTrial(subscription),
      trialEndDate: getTrialEndDate(subscription)
    }
  } catch (error) {
    console.error('Error getting subscription details:', error)
    return null
  }
}

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