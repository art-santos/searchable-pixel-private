// Known AI crawler user agents
export const AI_CRAWLERS = {
  // OpenAI
  'GPTBot': { company: 'OpenAI', bot: 'GPTBot', category: 'ai-training' },
  'ChatGPT-User': { company: 'OpenAI', bot: 'ChatGPT-User', category: 'ai-assistant' },
  'CCBot': { company: 'Common Crawl', bot: 'CCBot', category: 'ai-training' },
  
  // Anthropic
  'Claude-Web': { company: 'Anthropic', bot: 'Claude-Web', category: 'ai-assistant' },
  'ClaudeBot': { company: 'Anthropic', bot: 'ClaudeBot', category: 'ai-training' },
  
  // Google
  'Google-Extended': { company: 'Google', bot: 'Google-Extended', category: 'ai-training' },
  'Googlebot': { company: 'Google', bot: 'Googlebot', category: 'search-ai' },
  
  // Microsoft
  'Bingbot': { company: 'Microsoft', bot: 'Bingbot', category: 'search-ai' },
  
  // Others
  'PerplexityBot': { company: 'Perplexity', bot: 'PerplexityBot', category: 'ai-search' },
  'YouBot': { company: 'You.com', bot: 'YouBot', category: 'ai-search' },
  'Bytespider': { company: 'ByteDance', bot: 'Bytespider', category: 'ai-training' },
  'Diffbot': { company: 'Diffbot', bot: 'Diffbot', category: 'ai-extraction' },
  'FacebookBot': { company: 'Meta', bot: 'FacebookBot', category: 'social-ai' },
  'facebookexternalhit': { company: 'Meta', bot: 'facebookexternalhit', category: 'social-ai' },
  
  // Research/Academic
  'Amazonbot': { company: 'Amazon', bot: 'Amazonbot', category: 'ai-assistant' },
  'Applebot': { company: 'Apple', bot: 'Applebot', category: 'search-ai' },
} as const

export type CrawlerInfo = typeof AI_CRAWLERS[keyof typeof AI_CRAWLERS]

// Default API endpoint
export const DEFAULT_API_ENDPOINT = 'https://split.dev/api/crawler-events'

// Batch settings
export const BATCH_SIZE = 10
export const BATCH_INTERVAL_MS = 5000 // 5 seconds
export const MAX_RETRY_ATTEMPTS = 3
export const RETRY_DELAY_MS = 1000 