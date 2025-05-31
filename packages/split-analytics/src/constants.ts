// Known AI crawler user agents
export const AI_CRAWLERS = {
  // OpenAI (3 main crawlers)
  'GPTBot': { company: 'OpenAI', bot: 'GPTBot', category: 'ai-training' },
  'ChatGPT-User': { company: 'OpenAI', bot: 'ChatGPT-User', category: 'ai-assistant' },
  'OAI-SearchBot': { company: 'OpenAI', bot: 'OAI-SearchBot', category: 'ai-search' },
  
  // Anthropic
  'Claude-Web': { company: 'Anthropic', bot: 'Claude-Web', category: 'ai-assistant' },
  'ClaudeBot': { company: 'Anthropic', bot: 'ClaudeBot', category: 'ai-training' },
  'anthropic-ai': { company: 'Anthropic', bot: 'anthropic-ai', category: 'ai-training' },
  
  // Google/Alphabet
  'Google-Extended': { company: 'Google', bot: 'Google-Extended', category: 'ai-training' },
  'Googlebot': { company: 'Google', bot: 'Googlebot', category: 'search-ai' },
  'Googlebot-Image': { company: 'Google', bot: 'Googlebot-Image', category: 'search-ai' },
  'Googlebot-News': { company: 'Google', bot: 'Googlebot-News', category: 'search-ai' },
  'Google-InspectionTool': { company: 'Google', bot: 'Google-InspectionTool', category: 'search-ai' },
  
  // Microsoft
  'Bingbot': { company: 'Microsoft', bot: 'Bingbot', category: 'search-ai' },
  'msnbot': { company: 'Microsoft', bot: 'msnbot', category: 'search-ai' },
  'BingPreview': { company: 'Microsoft', bot: 'BingPreview', category: 'search-ai' },
  
  // Perplexity
  'PerplexityBot': { company: 'Perplexity', bot: 'PerplexityBot', category: 'ai-search' },
  
  // Meta/Facebook
  'FacebookBot': { company: 'Meta', bot: 'FacebookBot', category: 'social-ai' },
  'facebookexternalhit': { company: 'Meta', bot: 'facebookexternalhit', category: 'social-ai' },
  'Meta-ExternalAgent': { company: 'Meta', bot: 'Meta-ExternalAgent', category: 'ai-training' },
  
  // Other AI Search Engines
  'YouBot': { company: 'You.com', bot: 'YouBot', category: 'ai-search' },
  'Neeva': { company: 'Neeva', bot: 'Neeva', category: 'ai-search' },
  'Phind': { company: 'Phind', bot: 'Phind', category: 'ai-search' },
  
  // Chinese AI Companies
  'Bytespider': { company: 'ByteDance', bot: 'Bytespider', category: 'ai-training' },
  'Baiduspider': { company: 'Baidu', bot: 'Baiduspider', category: 'search-ai' },
  'Sogou': { company: 'Sogou', bot: 'Sogou', category: 'search-ai' },
  
  // E-commerce & Enterprise
  'Amazonbot': { company: 'Amazon', bot: 'Amazonbot', category: 'ai-assistant' },
  'LinkedInBot': { company: 'LinkedIn', bot: 'LinkedInBot', category: 'social-ai' },
  'Twitterbot': { company: 'Twitter', bot: 'Twitterbot', category: 'social-ai' },
  
  // Apple
  'Applebot': { company: 'Apple', bot: 'Applebot', category: 'search-ai' },
  'Applebot-Extended': { company: 'Apple', bot: 'Applebot-Extended', category: 'ai-training' },
  
  // Data Extraction & Analysis
  'Diffbot': { company: 'Diffbot', bot: 'Diffbot', category: 'ai-extraction' },
  'DataForSeoBot': { company: 'DataForSEO', bot: 'DataForSeoBot', category: 'ai-extraction' },
  'SemrushBot': { company: 'Semrush', bot: 'SemrushBot', category: 'ai-extraction' },
  'AhrefsBot': { company: 'Ahrefs', bot: 'AhrefsBot', category: 'ai-extraction' },
  
  // Common Crawl & Research
  'CCBot': { company: 'Common Crawl', bot: 'CCBot', category: 'ai-training' },
  'ia_archiver': { company: 'Internet Archive', bot: 'ia_archiver', category: 'archival' },
  
  // Other Notable AI Crawlers
  'PetalBot': { company: 'Petal Search', bot: 'PetalBot', category: 'search-ai' },
  'SeznamBot': { company: 'Seznam', bot: 'SeznamBot', category: 'search-ai' },
  'Yandex': { company: 'Yandex', bot: 'YandexBot', category: 'search-ai' },
  'DuckDuckBot': { company: 'DuckDuckGo', bot: 'DuckDuckBot', category: 'search-ai' },
  'Qwantify': { company: 'Qwant', bot: 'Qwantify', category: 'search-ai' },
} as const

export type CrawlerInfo = typeof AI_CRAWLERS[keyof typeof AI_CRAWLERS]

// Default API endpoint
export const DEFAULT_API_ENDPOINT = 'https://split.dev/api/crawler-events'

// Batch settings
export const BATCH_SIZE = 10
export const BATCH_INTERVAL_MS = 5000 // 5 seconds
export const MAX_RETRY_ATTEMPTS = 3
export const RETRY_DELAY_MS = 1000 