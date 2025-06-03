import { AnalyticsProvider, CmsOption, PricingPlan } from '../types/onboarding-types'

export const ANALYTICS_PROVIDERS: AnalyticsProvider[] = [
  { 
    id: 'vercel', 
    name: 'Vercel Analytics', 
    description: 'Web vitals & traffic data',
    setupUrl: 'https://vercel.com/analytics',
    instructions: 'Go to your Vercel dashboard → Analytics → Enable for your project'
  },
  { 
    id: 'ga4', 
    name: 'Google Analytics 4', 
    description: 'Comprehensive user insights',
    setupUrl: 'https://analytics.google.com',
    instructions: 'Create a GA4 property → Get your Measurement ID → Add tracking code'
  },
  { 
    id: 'plausible', 
    name: 'Plausible Analytics', 
    description: 'Privacy-focused analytics',
    setupUrl: 'https://plausible.io',
    instructions: 'Add your domain → Get tracking script → Install on your site'
  }
]

export const CMS_OPTIONS: CmsOption[] = [
  { id: 'nextjs', name: 'Next.js Pages' },
  { id: 'notion', name: 'Notion' },
  { id: 'contentful', name: 'Contentful' },
  { id: 'wordpress', name: 'WordPress' },
  { id: 'webflow', name: 'Webflow' },
  { id: 'ghost', name: 'Ghost' },
  { id: 'custom', name: 'Custom/Other' }
]

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'visibility',
    name: 'Visibility',
    description: 'Track your AI presence',
    monthlyPrice: 40,
    annualPrice: 32,
    features: [
      'Daily visibility scans',
      'Citation analysis',
      'Single domain tracking',
      'Email alerts'
    ],
    buttonText: 'Start Visibility',
    buttonStyle: 'bg-[#333] hover:bg-[#444] text-white'
  },
  {
    id: 'plus',
    name: 'Plus',
    description: 'Scale your AI visibility',
    monthlyPrice: 200,
    annualPrice: 160,
    features: [
      'Daily MAX visibility scans',
      '10 monthly AI articles',
      'Competitor benchmarking',
      'Keyword trend analysis',
      'Priority support'
    ],
    isRecommended: true,
    buttonText: 'Start Plus',
    buttonStyle: 'bg-white text-black hover:bg-[#f5f5f5]'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Full-stack AEO powerhouse',
    monthlyPrice: 1000,
    annualPrice: 800,
    features: [
      'Everything in Plus',
      '30 premium articles',
      'Unlimited MAX scans',
      'Multi-brand tracking',
      'Up to 3 domains'
    ],
    buttonText: 'Start Pro',
    buttonStyle: 'bg-[#333] hover:bg-[#444] text-white'
  }
]

export const ONBOARDING_STEPS = {
  WORKSPACE: 'workspace' as const,
  ANALYTICS: 'analytics' as const,
  CONTENT: 'content' as const,
  CMS: 'cms' as const,
  SCANNING: 'scanning' as const,
  RESULTS: 'results' as const,
  PAYWALL: 'paywall' as const
}

export const STEP_PROGRESS = {
  [ONBOARDING_STEPS.WORKSPACE]: 16,
  [ONBOARDING_STEPS.ANALYTICS]: 33,
  [ONBOARDING_STEPS.CONTENT]: 50,
  [ONBOARDING_STEPS.CMS]: 66,
  [ONBOARDING_STEPS.SCANNING]: 83,
  [ONBOARDING_STEPS.RESULTS]: 100,
  [ONBOARDING_STEPS.PAYWALL]: 100
} 