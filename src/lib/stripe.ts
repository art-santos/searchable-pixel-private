import Stripe from 'stripe'

function requireEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value
}

// Load required environment variables
const STRIPE_SECRET_KEY = requireEnvVar('STRIPE_SECRET_KEY')
const STRIPE_VISIBILITY_MONTHLY_PRICE_ID = requireEnvVar('STRIPE_VISIBILITY_MONTHLY_PRICE_ID')
const STRIPE_VISIBILITY_ANNUAL_PRICE_ID = requireEnvVar('STRIPE_VISIBILITY_ANNUAL_PRICE_ID')
const STRIPE_PLUS_MONTHLY_PRICE_ID = requireEnvVar('STRIPE_PLUS_MONTHLY_PRICE_ID')
const STRIPE_PLUS_ANNUAL_PRICE_ID = requireEnvVar('STRIPE_PLUS_ANNUAL_PRICE_ID')
const STRIPE_PRO_MONTHLY_PRICE_ID = requireEnvVar('STRIPE_PRO_MONTHLY_PRICE_ID')
const STRIPE_PRO_ANNUAL_PRICE_ID = requireEnvVar('STRIPE_PRO_ANNUAL_PRICE_ID')
const STRIPE_AI_LOGS_METERED_PRICE_ID = requireEnvVar('STRIPE_AI_LOGS_METERED_PRICE_ID')
const STRIPE_EXTRA_ARTICLES_PRICE_ID = requireEnvVar('STRIPE_EXTRA_ARTICLES_PRICE_ID')
const STRIPE_EXTRA_DOMAINS_PRICE_ID = requireEnvVar('STRIPE_EXTRA_DOMAINS_PRICE_ID')

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
    visibility_monthly: STRIPE_VISIBILITY_MONTHLY_PRICE_ID,
    visibility_annual: STRIPE_VISIBILITY_ANNUAL_PRICE_ID,
    plus_monthly: STRIPE_PLUS_MONTHLY_PRICE_ID,
    plus_annual: STRIPE_PLUS_ANNUAL_PRICE_ID,
    pro_monthly: STRIPE_PRO_MONTHLY_PRICE_ID,
    pro_annual: STRIPE_PRO_ANNUAL_PRICE_ID,
  }

  const billing = isAnnual ? 'annual' : 'monthly'
  const key = `${planId}_${billing}`
  
  return priceIds[key] || null
}

// Get metered pricing IDs for usage-based billing (AI logs only)
export function getMeteredPriceId(type: 'ai_logs'): string | null {
  const meteredPriceIds: Record<string, string> = {
    ai_logs: STRIPE_AI_LOGS_METERED_PRICE_ID,
  }
  
  return meteredPriceIds[type] || null
}

// Get add-on pricing IDs for fixed monthly billing (domains, articles)
export function getAddOnPriceId(type: 'extra_articles' | 'extra_domains'): string | null {
  const addOnPriceIds: Record<string, string> = {
    extra_articles: STRIPE_EXTRA_ARTICLES_PRICE_ID,
    extra_domains: STRIPE_EXTRA_DOMAINS_PRICE_ID,
  }
  
  return addOnPriceIds[type] || null
}

// Map Stripe subscription to our plan names
export function mapSubscriptionToPlan(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id

  const priceMap: Record<string, string> = {
    [STRIPE_VISIBILITY_MONTHLY_PRICE_ID]: 'visibility',
    [STRIPE_VISIBILITY_ANNUAL_PRICE_ID]: 'visibility',
    [STRIPE_PLUS_MONTHLY_PRICE_ID]: 'plus',
    [STRIPE_PLUS_ANNUAL_PRICE_ID]: 'plus',
    [STRIPE_PRO_MONTHLY_PRICE_ID]: 'pro',
    [STRIPE_PRO_ANNUAL_PRICE_ID]: 'pro',
  }
  
  return priceMap[priceId] || 'free'
}

// Create or update metered usage for a subscription (AI logs only)
export async function reportMeteredUsage({
  subscriptionId,
  meteredType,
  quantity,
  timestamp = Math.floor(Date.now() / 1000)
}: {
  subscriptionId: string
  meteredType: 'ai_logs'
  quantity: number
  timestamp?: number
}): Promise<Stripe.UsageRecord | null> {
  try {
    // Get the subscription to find the metered item
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items']
    })
    
    // Find the metered price ID for this type
    const meteredPriceId = getMeteredPriceId(meteredType)
    if (!meteredPriceId) {
      console.error(`No metered price ID configured for ${meteredType}`)
      return null
    }
    
    // Find the subscription item for this metered price
    const meteredItem = subscription.items.data.find(
      item => item.price.id === meteredPriceId
    )
    
    if (!meteredItem) {
      console.error(`No subscription item found for metered type ${meteredType}`)
      return null
    }
    
    // Create usage record
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      meteredItem.id,
      {
        quantity,
        timestamp,
        action: 'set' // Use 'set' to report absolute usage, 'increment' for additions
      }
    )
    
    return usageRecord
  } catch (error) {
    console.error('Error reporting metered usage:', error)
    return null
  }
}

// Add metered items to an existing subscription (AI logs only)
export async function addMeteredItemsToSubscription(
  subscriptionId: string,
  items: Array<{
    type: 'ai_logs'
    quantity?: number
  }>
): Promise<boolean> {
  try {
    const itemsToAdd = items.map(item => {
      const priceId = getMeteredPriceId(item.type)
      if (!priceId) {
        throw new Error(`No price ID found for ${item.type}`)
      }
      
      return {
        price: priceId,
        quantity: item.quantity || 1
      }
    })
    
    await stripe.subscriptions.update(subscriptionId, {
      items: itemsToAdd,
      proration_behavior: 'always_invoice'
    })
    
    return true
  } catch (error) {
    console.error('Error adding metered items to subscription:', error)
    return false
  }
}

// Add fixed-price add-ons to an existing subscription (domains, articles)
export async function addSubscriptionAddOns(
  subscriptionId: string,
  addOns: Array<{
    type: 'extra_articles' | 'extra_domains'
    quantity: number
  }>
): Promise<boolean> {
  try {
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
      items: itemsToAdd,
      proration_behavior: 'always_invoice'
    })
    
    return true
  } catch (error) {
    console.error('Error adding subscription add-ons:', error)
    return false
  }
} 