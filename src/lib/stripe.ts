import Stripe from 'stripe'

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
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
    visibility_monthly: process.env.STRIPE_VISIBILITY_MONTHLY_PRICE_ID!,
    visibility_annual: process.env.STRIPE_VISIBILITY_ANNUAL_PRICE_ID!,
    plus_monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID!,
    plus_annual: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID!,
    pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  }

  const billing = isAnnual ? 'annual' : 'monthly'
  const key = `${planId}_${billing}`
  
  return priceIds[key] || null
}

// Map Stripe subscription to our plan names
export function mapSubscriptionToPlan(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id
  
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_VISIBILITY_MONTHLY_PRICE_ID!]: 'visibility',
    [process.env.STRIPE_VISIBILITY_ANNUAL_PRICE_ID!]: 'visibility',
    [process.env.STRIPE_PLUS_MONTHLY_PRICE_ID!]: 'plus',
    [process.env.STRIPE_PLUS_ANNUAL_PRICE_ID!]: 'plus',
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: 'pro',
    [process.env.STRIPE_PRO_ANNUAL_PRICE_ID!]: 'pro',
  }
  
  return priceMap[priceId] || 'free'
} 