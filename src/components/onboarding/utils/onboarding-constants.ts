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
    id: 'starter',
    name: 'Starter',
    description: 'Visibility Tracking Made Simple',
    monthlyPrice: 30,
    annualPrice: 25,
    features: [
      'Unlimited AI-Crawler Tracking',
      'Snapshot Audits',
      'Historical Dashboards',
      'Single Workspace',
      'Email support during business hours'
    ],
    buttonText: 'Start with Starter',
    buttonStyle: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]',
    badge: '🔍',
    badgeColor: 'bg-blue-500'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Turn Visibility Into Pipeline',
    monthlyPrice: 100,
    annualPrice: 83,
    features: [
      'Everything in Starter',
      '250 Lead Credits Included',
      'CSV Export of enriched contacts',
      'Zapier & Make.com Webhook integrations',
      'Three Seats & Multiple Workspaces',
      'Priority email & chat support'
    ],
    isRecommended: true,
    buttonText: 'Customize Pro',
    buttonStyle: 'bg-white hover:bg-[#f5f5f5] text-black',
    badge: '⚡️',
    badgeColor: 'bg-yellow-500',
    hasCredits: true,
    baseCredits: 250,
    maxCredits: 10000
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Data at Scale, Integrated Your Way',
    monthlyPrice: 1500,
    annualPrice: 1250,
    features: [
      'Custom Credit Packages (1,500+/mo)',
      'Direct Connectors (Salesforce, HubSpot, etc.)',
      'Unlimited Seats & Workspaces',
      'Organization-wide SSO (SAML/SCIM)',
      'Dedicated Success Engineer',
      'Private API & Custom Fields',
      'Quarterly business reviews'
    ],
    buttonText: 'Contact Sales',
    buttonStyle: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]',
    badge: '🏢',
    badgeColor: 'bg-purple-500',
    isEnterprise: true
  }
]

// Credit pricing tiers for Pro plan
export const CREDIT_PRICING_TIERS = [
  { credits: 250, pricePerCredit: 0.40, totalPrice: 100 },
  { credits: 500, pricePerCredit: 0.36, totalPrice: 180 },
  { credits: 1000, pricePerCredit: 0.30, totalPrice: 300 },
  { credits: 2500, pricePerCredit: 0.26, totalPrice: 650 },
  { credits: 5000, pricePerCredit: 0.22, totalPrice: 1100 },
  { credits: 10000, pricePerCredit: 0.18, totalPrice: 1800 }
]

// Remove old add-on pricing - no longer needed
export const ADD_ON_PRICING = []

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