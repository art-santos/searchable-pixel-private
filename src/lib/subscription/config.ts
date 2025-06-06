export const PLANS = {
  free: { order: 0, name: 'Free', value: 'free' },
  plus: { order: 1, name: 'Plus', value: 'plus' },
  pro: { order: 2, name: 'Pro', value: 'pro' },
  enterprise: { order: 3, name: 'Enterprise', value: 'enterprise' }
} as const

export type PlanType = keyof typeof PLANS

export const LIMITS = {
  free: {
    domains: { max: 1 },
    dataRetention: 30, // days
    crawlerLogs: -1, // unlimited
    snapshots: { max: 0, period: 'month' as const },
    attributionCredits: { included: 0, price: 0.25 },
    aiAttribution: false,
  },
  plus: {
    domains: { max: 1 },
    dataRetention: 30, // 30-day AI crawler logs
    crawlerLogs: -1, // unlimited
    snapshots: { max: 10, period: 'month' as const },
    attributionCredits: { included: 0, price: 0.25 },
    aiAttribution: true,
    basicInsights: true,
  },
  pro: {
    domains: { max: 1 },
    dataRetention: 90, // 90-day AI crawler logs
    crawlerLogs: -1, // unlimited
    snapshots: { max: 50, period: 'month' as const },
    attributionCredits: { included: 500, price: 0.15 },
    aiAttribution: true,
    advancedInsights: true,
    slackAlerts: true,
    apiAccess: true,
  },
  enterprise: {
    domains: { max: 1 },
    dataRetention: -1, // unlimited
    crawlerLogs: -1, // unlimited
    snapshots: { max: -1, period: 'month' as const }, // unlimited
    attributionCredits: { included: 'custom', price: 0.10 },
    aiAttribution: true,
    advancedInsights: true,
    crmIntegrations: true,
    prioritySupport: true,
    customModels: true,
    sla: true,
    apiAccess: true,
  },
} as const

export const FEATURES = {
  // Core AI attribution features
  'ai-attribution': ['plus', 'pro', 'enterprise'],
  'basic-insights': ['plus'],
  'advanced-insights': ['pro', 'enterprise'],
  'visitor-leads': ['pro', 'enterprise'], // RB2B-style feature (not yet implemented)
  
  // Snapshots feature (not yet implemented)
  'snapshots': ['plus', 'pro', 'enterprise'],
  
  // Platform features
  'slack-alerts': ['pro', 'enterprise'],
  'api-access': ['pro', 'enterprise'],
  'crm-integrations': ['enterprise'],
  'priority-support': ['enterprise'],
  'custom-models': ['enterprise'],
  'sla': ['enterprise'],
  'multi-domain': ['pro', 'enterprise'], // through add-ons
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

// Helper to calculate attribution credit overage cost
export function calculateAttributionOverage(used: number, included: number | string, plan: PlanType): number {
  if (typeof included === 'string') return 0 // Custom plans
  if (used <= included) return 0
  
  const overage = used - included
  const pricePerCredit = LIMITS[plan].attributionCredits.price as number
  return overage * pricePerCredit
} 