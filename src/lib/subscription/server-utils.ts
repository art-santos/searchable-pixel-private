import { headers } from 'next/headers'
import { PlanType } from './config'

export interface SubscriptionHeaders {
  userPlan: PlanType | null
  isSoftBlocked: boolean
  requiredPlan: PlanType | null
  feature: string | null
}

/**
 * Read subscription-related headers set by middleware
 * This can only be used in server components
 */
export function getSubscriptionHeaders(): SubscriptionHeaders {
  const headersList = headers()
  
  const userPlan = headersList.get('X-User-Plan') as PlanType | null
  const isSoftBlocked = headersList.get('X-Subscription-Soft-Block') === 'true'
  const requiredPlan = headersList.get('X-Required-Plan') as PlanType | null
  const feature = headersList.get('X-Feature')
  
  return {
    userPlan,
    isSoftBlocked,
    requiredPlan,
    feature
  }
}

/**
 * Check if the current request is soft blocked
 */
export function isSoftBlocked(): boolean {
  const headersList = headers()
  return headersList.get('X-Subscription-Soft-Block') === 'true'
}

/**
 * Get the user's plan from headers
 */
export function getUserPlanFromHeaders(): PlanType {
  const headersList = headers()
  return (headersList.get('X-User-Plan') || 'free') as PlanType
} 