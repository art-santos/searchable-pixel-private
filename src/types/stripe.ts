export interface StripeSubscription {
  id: string
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid'
  plan: 'free' | 'visibility' | 'plus' | 'pro'
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

export interface StripeCustomer {
  id: string
  email: string
  name?: string
}

export interface CheckoutSessionMetadata {
  planId: string
  billing: 'monthly' | 'annual'
  userId?: string
} 