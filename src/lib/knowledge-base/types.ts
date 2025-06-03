// Knowledge Base Types
export interface KnowledgeItem {
  id: string
  content: string
  tag: string
  createdAt: string
  wordCount: number
  confidenceScore?: number
  sourceContext?: string
  extractionBatchId?: string
}

export interface ExtractedKnowledge {
  content: string
  tag: string
  confidence: number
  reasoning: string
  sourceContext: string
}

export interface KnowledgeFilters {
  tag?: string
  search?: string
  limit?: number
  offset?: number
}

export interface GroupedKnowledge {
  'company-overview': string[]
  'target-audience': string[]
  'pain-points': string[]
  'positioning': string[]
  'product-features': string[]
  'use-cases': string[]
  'competitor-notes': string[]
  'sales-objections': string[]
  'brand-voice': string[]
  'keywords': string[]
  'other': string[]
}

export interface ExtractionResult {
  extractedItems: ExtractedKnowledge[]
  batchId: string
  processingTime: number
  totalWordCount: number
}

export interface CompletenessScore {
  score: number // 0-1
  breakdown: {
    [tag: string]: {
      count: number
      weight: number
      contribution: number
    }
  }
  suggestions: string[]
}

// Available tags - matches the existing UI
export const AVAILABLE_TAGS = [
  'company-overview',
  'target-audience', 
  'pain-points',
  'positioning',
  'product-features',
  'use-cases',
  'competitor-notes',
  'sales-objections',
  'brand-voice',
  'keywords',
  'other'
] as const

export type KnowledgeTag = typeof AVAILABLE_TAGS[number]

// Tag metadata for the UI
export const TAG_METADATA: Record<KnowledgeTag, {
  label: string
  description: string
  weight: number // for completeness scoring
}> = {
  'company-overview': {
    label: 'Company Overview',
    description: 'Core business description, what the company does',
    weight: 1.0
  },
  'target-audience': {
    label: 'Target Audience',
    description: 'Who the customers/users are, demographics, company types',
    weight: 0.9
  },
  'pain-points': {
    label: 'Pain Points',
    description: 'Problems customers face, challenges addressed',
    weight: 0.8
  },
  'positioning': {
    label: 'Positioning',
    description: 'How company differentiates, unique value props',
    weight: 0.9
  },
  'product-features': {
    label: 'Product Features',
    description: 'Specific capabilities, features, functionalities',
    weight: 0.7
  },
  'use-cases': {
    label: 'Use Cases',
    description: 'How customers use the product, scenarios, applications',
    weight: 0.7
  },
  'competitor-notes': {
    label: 'Competitor Notes',
    description: 'Mentions of competitors, competitive positioning',
    weight: 0.8
  },
  'sales-objections': {
    label: 'Sales Objections',
    description: 'Common objections and responses',
    weight: 0.6
  },
  'brand-voice': {
    label: 'Brand Voice',
    description: 'Tone, messaging style, communication guidelines',
    weight: 0.5
  },
  'keywords': {
    label: 'Keywords',
    description: 'Important terms, phrases, industry jargon',
    weight: 0.4
  },
  'other': {
    label: 'Other',
    description: 'Information that doesn\'t fit other categories',
    weight: 0.3
  }
} 