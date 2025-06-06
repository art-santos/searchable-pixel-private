import { PlanType } from './config'

export interface RouteConfig {
  path: string
  requiredPlan?: PlanType
  feature?: string
  softBlock?: boolean // If true, allow access but show upgrade UI
  redirectTo?: string
}

// Define protected routes and their requirements
export const ROUTE_ACCESS: RouteConfig[] = [
  // Domain management - Pro only
  {
    path: '/domains/manage',
    requiredPlan: 'pro',
    feature: 'multi-domain',
    softBlock: false,
  },
  {
    path: '/domains/add',
    requiredPlan: 'pro',
    feature: 'multi-domain',
    softBlock: false,
  },
  
  // Analytics routes - soft blocks to show upgrade prompts
  {
    path: '/analytics/competitors',
    requiredPlan: 'plus',
    feature: 'competitor-analysis',
    softBlock: true, // Show preview with upgrade prompt
  },
  {
    path: '/analytics/custom-reports',
    requiredPlan: 'pro',
    feature: 'custom-reports',
    softBlock: true,
  },
  
  // API/Webhooks - Pro only
  {
    path: '/settings/webhooks',
    requiredPlan: 'pro',
    feature: 'webhooks',
    softBlock: false,
  },
]

// Helper to check if a route requires subscription
export function getRouteConfig(pathname: string): RouteConfig | null {
  // Normalize pathname
  const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
    ? pathname.slice(0, -1) 
    : pathname
  
  // Check for exact match first
  const exactMatch = ROUTE_ACCESS.find(route => route.path === normalizedPath)
  if (exactMatch) return exactMatch
  
  // Check for prefix match (e.g., /content/* matches /content)
  const prefixMatch = ROUTE_ACCESS.find(route => 
    normalizedPath.startsWith(route.path + '/') || normalizedPath === route.path
  )
  
  return prefixMatch || null
}

// Check if user needs to be redirected based on their plan
export function checkRouteAccess(
  pathname: string, 
  userPlan: PlanType
): { 
  allowed: boolean
  config: RouteConfig | null
  shouldRedirect: boolean 
} {
  const routeConfig = getRouteConfig(pathname)
  
  // No restrictions for this route
  if (!routeConfig || !routeConfig.requiredPlan) {
    return { allowed: true, config: null, shouldRedirect: false }
  }
  
  // Check if user's plan meets the requirement
  const planOrder = {
    free: 0,
    visibility: 1,
    plus: 2,
    pro: 3
  }
  
  const userPlanOrder = planOrder[userPlan]
  const requiredPlanOrder = planOrder[routeConfig.requiredPlan]
  
  const hasAccess = userPlanOrder >= requiredPlanOrder
  
  return {
    allowed: hasAccess || routeConfig.softBlock,
    config: routeConfig,
    shouldRedirect: !hasAccess && !routeConfig.softBlock
  }
}

// Get all features available for a plan
export function getAvailableRoutes(userPlan: PlanType): string[] {
  const planOrder = {
    free: 0,
    visibility: 1,
    plus: 2,
    pro: 3
  }
  
  const userPlanOrder = planOrder[userPlan]
  
  return ROUTE_ACCESS
    .filter(route => {
      if (!route.requiredPlan) return true
      const requiredOrder = planOrder[route.requiredPlan]
      return userPlanOrder >= requiredOrder
    })
    .map(route => route.path)
} 