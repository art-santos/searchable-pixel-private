export interface OnboardingOverlayProps {
  children: React.ReactNode
  onComplete?: () => void
}

export type OnboardingStep = 'workspace' | 'analytics' | 'content' | 'cms' | 'scanning' | 'results' | 'paywall'

export interface WorkspaceData {
  name: string
  workspaceName: string
}

export interface AnalyticsData {
  provider: 'vercel' | 'ga4' | 'plausible' | null
  domain: string
  isConnected: boolean
  isSkipped: boolean
}

export interface ContentData {
  keywords: string[]
  businessOffering: string
  knownFor: string
  competitors: string[]
}

export interface CmsData {
  cms: string
}

export interface AnalyticsProvider {
  id: 'vercel' | 'ga4' | 'plausible'
  name: string
  description: string
  setupUrl: string
  instructions: string
}

export interface CmsOption {
  id: string
  name: string
}

export interface OnboardingState {
  showOnboarding: boolean
  currentStep: OnboardingStep
  progress: number
  isLoading: boolean
  showSkipWarning: boolean
  visibilityScore: number
  isAnnual: boolean
  visibilityData: any | null
  backgroundAnalysisStarted: boolean
  analysisEventSource: EventSource | null
  analysisProgress: number
  analysisMessage: string
  analysisStep: string
  companyId: string | null
  runId: string | null
  workspaceData: WorkspaceData
  analyticsData: AnalyticsData
  contentData: ContentData
  cmsData: CmsData
  newKeyword: string
  newCompetitor: string
}

export interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
  isRecommended?: boolean
  buttonText: string
  buttonStyle: string
  badge?: string
  badgeColor?: string
  hasCredits?: boolean
  baseCredits?: number
  maxCredits?: number
  isEnterprise?: boolean
} 