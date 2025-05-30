export const PLANS = {
  free: { order: 0, name: 'Free', value: 'free' },
  visibility: { order: 1, name: 'Visibility', value: 'visibility' },
  plus: { order: 2, name: 'Plus', value: 'plus' },
  pro: { order: 3, name: 'Pro', value: 'pro' }
} as const

export type PlanType = keyof typeof PLANS

export const LIMITS = {
  free: {
    scans: { max: 4, period: 'month' as const },
    scanType: 'basic' as const,
    articles: { max: 0, period: 'month' as const },
    domains: { max: 1 },
    dataRetention: 90, // days
  },
  visibility: {
    scans: { max: 30, period: 'month' as const },
    scanType: 'basic' as const,
    articles: { max: 0, period: 'month' as const },
    domains: { max: 1 },
    dataRetention: 180,
  },
  plus: {
    scans: { max: -1, period: 'month' as const }, // unlimited
    scanType: 'max' as const,
    articles: { max: 10, period: 'month' as const },
    domains: { max: 1 },
    dataRetention: 360,
  },
  pro: {
    scans: { max: -1, period: 'month' as const },
    scanType: 'max' as const,
    articles: { max: 30, period: 'month' as const },
    domains: { max: 3 },
    dataRetention: -1, // unlimited
  },
} as const

export const FEATURES = {
  // Scanning features
  'basic-scan': ['free', 'visibility', 'plus', 'pro'],
  'max-scan': ['plus', 'pro'],
  'bulk-scan': ['pro'],
  
  // Content features
  'view-content': ['free', 'visibility', 'plus', 'pro'],
  'generate-content': ['plus', 'pro'],
  'premium-content': ['pro'],
  
  // Analytics features
  'basic-analytics': ['free', 'visibility', 'plus', 'pro'],
  'citation-analysis': ['visibility', 'plus', 'pro'],
  'competitor-analysis': ['plus', 'pro'],
  'custom-reports': ['pro'],
  
  // Platform features
  'webhooks': ['pro'],
  'priority-support': ['plus', 'pro'],
  'multi-domain': ['pro'],
} as const

export type FeatureType = keyof typeof FEATURES

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
export function formatLimit(limit: number): string {
  if (limit === -1) return 'Unlimited'
  if (limit === 0) return 'Not available'
  return limit.toString()
} 