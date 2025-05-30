'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedFeature } from './protected-feature'
import { PlanType, FeatureType } from '@/lib/subscription/config'
import { useSubscription } from '@/hooks/useSubscription'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPlan?: PlanType
  feature?: FeatureType
  fallback?: ReactNode
  checkHeaders?: boolean // Check middleware headers for soft blocks
}

export function ProtectedRoute({
  children,
  requiredPlan,
  feature,
  fallback,
  checkHeaders = true
}: ProtectedRouteProps) {
  const router = useRouter()
  const { subscription, loading } = useSubscription()
  const [softBlocked, setSoftBlocked] = useState(false)
  const [headerPlan, setHeaderPlan] = useState<PlanType | null>(null)
  const [headerFeature, setHeaderFeature] = useState<string | null>(null)
  
  // Check headers set by middleware
  useEffect(() => {
    if (checkHeaders && typeof window !== 'undefined') {
      // In client components, we need to check if we were soft blocked
      const urlParams = new URLSearchParams(window.location.search)
      const isSoftBlock = urlParams.get('softBlock') === 'true'
      const requiredFromHeader = urlParams.get('requiredPlan') as PlanType
      const featureFromHeader = urlParams.get('feature')
      
      if (isSoftBlock) {
        setSoftBlocked(true)
        setHeaderPlan(requiredFromHeader)
        setHeaderFeature(featureFromHeader)
      }
    }
  }, [checkHeaders])
  
  // If soft blocked by middleware, show upgrade UI
  if (softBlocked && headerPlan) {
    return (
      <ProtectedFeature
        requiredPlan={headerPlan}
        feature={headerFeature as FeatureType}
        soft={true}
      >
        {children}
      </ProtectedFeature>
    )
  }
  
  // Use the ProtectedFeature component for consistency
  return (
    <ProtectedFeature
      requiredPlan={requiredPlan}
      feature={feature}
      fallback={fallback}
      soft={false}
    >
      {children}
    </ProtectedFeature>
  )
} 