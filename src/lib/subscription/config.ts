export const PLANS = {
  starter: { order: 0, name: 'Starter', value: 'starter' },
  pro: { order: 1, name: 'Pro', value: 'pro' },
  team: { order: 2, name: 'Team', value: 'team' },
  admin: { order: 999, name: 'Admin', value: 'admin' }
} as const

export type PlanType = keyof typeof PLANS

export const LIMITS = {
  starter: {
    domains: { max: 1 },
    dataRetention: 1, // Only 24 hours
    timeframes: ['Last 24 hours'], // Only 24h timeframe
    snapshots: { max: 10, period: 'month' as const },
    aiAttribution: true,
    basicInsights: true,
  },
  pro: {
    domains: { max: 1 },
    dataRetention: 365, // Up to 365 days
    timeframes: ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 365 days'],
    snapshots: { max: 50, period: 'month' as const },
    aiAttribution: true,
    advancedInsights: true,
    apiAccess: true,
  },
  team: {
    domains: { max: 5 }, // 5 domains included
    dataRetention: 365, // Up to 365 days
    timeframes: ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 365 days'],
    snapshots: { max: 100, period: 'month' as const },
    aiAttribution: true,
    advancedInsights: true,
    apiAccess: true,
    teamAccess: true,
    prioritySupport: true,
  },
  admin: {
    domains: { max: -1 }, // Unlimited domains
    dataRetention: -1, // Unlimited retention
    timeframes: ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 365 days'],
    snapshots: { max: -1, period: 'month' as const }, // Unlimited snapshots
    aiAttribution: true,
    advancedInsights: true,
    apiAccess: true,
    teamAccess: true,
    prioritySupport: true,
    adminAccess: true,
  },
} as const

export const FEATURES = {
  // Core AI attribution features
  'ai-attribution': ['starter', 'pro', 'team', 'admin'],
  'basic-insights': ['starter', 'pro', 'team', 'admin'],
  'advanced-insights': ['pro', 'team', 'admin'],
  
  // Snapshots feature
  'snapshots': ['starter', 'pro', 'team', 'admin'],
  
  // Platform features
  'api-access': ['pro', 'team', 'admin'],
  'team-access': ['team', 'admin'],
  'priority-support': ['team', 'admin'],
  'multi-domain': ['team', 'admin'], // 5 included for team, unlimited for admin
  'admin-access': ['admin'],
  
  // Timeframe access
  'extended-timeframes': ['pro', 'team', 'admin'], // 90 days, 365 days
  'basic-timeframes': ['starter'], // 24 hours only
} as const

export type FeatureType = keyof typeof FEATURES

// Attribution credit pack pricing
export const CREDIT_PACKS = {
  small: { credits: 100, price: 25 },
  medium: { credits: 500, price: 100 },
  large: { credits: 2000, price: 300 }
} as const

// Helper to get subscription limits for a plan
export function getSubscriptionLimits(plan: PlanType) {
  return LIMITS[plan]
}

// Helper to check if a plan has access to a feature
export function hasFeatureAccess(plan: PlanType, feature: FeatureType): boolean {
  return FEATURES[feature]?.includes(plan) ?? false
}

// Helper to compare plan levels
export function comparePlans(plan1: PlanType, plan2: PlanType): number {
  return PLANS[plan1].order - PLANS[plan2].order
}

// Helper to check if plan is at least a certain level
export function isAtLeastPlan(currentPlan: PlanType, requiredPlan: PlanType): boolean {
  return comparePlans(currentPlan, requiredPlan) >= 0
}

// Helper to get upgrade path
export function getUpgradePath(currentPlan: PlanType): PlanType[] {
  const currentOrder = PLANS[currentPlan].order
  return (Object.keys(PLANS) as PlanType[])
    .filter(plan => PLANS[plan].order > currentOrder)
    .sort((a, b) => PLANS[a].order - PLANS[b].order)
}

// Helper to format limit display
export function formatLimit(limit: number | string): string {
  if (limit === -1) return 'Unlimited'
  if (limit === 0) return 'Not available'
  if (typeof limit === 'string') return limit
  return limit.toString()
}

// Helper to get allowed timeframes for a plan
export function getAllowedTimeframes(plan: PlanType): string[] {
  return LIMITS[plan].timeframes || ['Last 24 hours']
}

// Helper to check if a plan has access to a specific timeframe
export function hasTimeframeAccess(plan: PlanType, timeframe: string): boolean {
  const allowedTimeframes = getAllowedTimeframes(plan)
  return allowedTimeframes.includes(timeframe)
} 