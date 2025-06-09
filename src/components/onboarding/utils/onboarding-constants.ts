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
    description: 'Start tracking AI crawler traffic with 10 lines of code',
    monthlyPrice: 30,
    annualPrice: 25, // ~17% discount
    features: [
      '1 domain',
      'Simple code snippet setup',
      'Basic crawler tracking',
      'Total daily crawl count',
      '7-day crawl history',
      'Snapshot reports: 10/month',
      'Email alerts (first crawl only)'
    ],
    buttonText: 'Start Starter',
    buttonStyle: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]',
    badge: '🧪',
    badgeColor: 'bg-blue-500',
    limitations: [
      'Add-ons available immediately, billed monthly'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Full visibility + analytics for serious projects',
    monthlyPrice: 100,
    annualPrice: 83, // ~17% discount
    features: [
      '1 domain',
      'Full crawler breakdown',
      'Bot name, company, timestamp, page path',
      '90-day crawl history',
      'Snapshot reports: 50/month',
      'Smart alerts (spike detection, bot-specific alerts)',
      'Page-level crawler logs',
      'API access',
      'CSV export',
      'PDF audit report export'
    ],
    isRecommended: true,
    buttonText: 'Start Pro',
    buttonStyle: 'bg-white hover:bg-[#f5f5f5] text-black',
    badge: '⚡️',
    badgeColor: 'bg-yellow-500'
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For agencies & multi-site operations',
    monthlyPrice: 400,
    annualPrice: 333, // ~17% discount
    features: [
      '5 domains included',
      'Unlimited snapshots',
      'All Pro features',
      'Team access (up to 5 users)',
      'Slack/Discord alerts',
      'Workspace analytics (cross-domain rollup)',
      'Anomaly detection & scheduled reports',
      'Priority support'
    ],
    buttonText: 'Start Team',
    buttonStyle: 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]',
    badge: '🧑‍🤝‍🧑',
    badgeColor: 'bg-purple-500'
  }
]

export const ADD_ON_PRICING = [
  {
    id: 'extra_domain',
    name: 'Extra Domain',
    description: 'Add an additional domain',
    price: 100,
    unit: 'per month',
    availableFor: ['pro', 'team'],
    features: [
      'Monitor additional domain',
      'Separate analytics dashboard',
      'Individual crawler tracking'
    ]
  },
  {
    id: 'edge_alerts',
    name: 'Edge Alerts',
    description: 'Real-time webhook alerts for crawler spikes or new bot activity',
    price: 10,
    unit: 'per month',
    availableFor: ['starter', 'pro', 'team'],
    features: [
      'Real-time webhook notifications',
      'Crawler spike detection',
      'New bot activity alerts',
      'Custom threshold settings'
    ]
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