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
    description: 'Track AI visibility across all major models.',
    monthlyPrice: 100,
    annualPrice: 80,
    features: [
      'Unlimited AI crawler tracking',
      'Bot activity monitoring',
      'Access to Snapshots',
      'Basic analytics dashboard'
    ],
    buttonText: 'Start Visibility',
    buttonStyle: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]',
    badge: '🟢',
    badgeColor: 'bg-green-500'
  },
  {
    id: 'plus',
    name: 'Plus',
    description: 'Everything in Visibility, plus visitor identification.',
    monthlyPrice: 200,
    annualPrice: 160,
    features: [
      'Everything in Visibility',
      'Includes 3,750 monthly visitor credits',
      'Real-time visitor feed',
      'Slack/email alerts',
      'CSV export'
    ],
    isRecommended: true,
    buttonText: 'Start Plus',
    buttonStyle: 'bg-white hover:bg-[#f5f5f5] text-black',
    badge: '🟡',
    badgeColor: 'bg-yellow-500'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Everything in Visibility, plus advanced features.',
    monthlyPrice: 800,
    annualPrice: 640,
    features: [
      'Everything in Visibility',
      'Includes 15,000 monthly visitor credits',
      'Advanced filtering',
      'Multi-domain support (3 included)',
      'Lead scoring + routing',
      'Priority support'
    ],
    buttonText: 'Start Pro',
    buttonStyle: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]',
    badge: '🔴',
    badgeColor: 'bg-red-500'
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