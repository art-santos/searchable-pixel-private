/**
 * Utility functions for AI crawler detection and handling
 * Based on AEO best practices
 */

/**
 * Detects if the user agent is an AI crawler
 */
export const isAiCrawler = (userAgent: string = ''): boolean => {
  return /GPTBot|ClaudeBot|PerplexityBot|ChatGPT-User|Google-Extended|CCBot|Anthropic-AI|Cohere-AI/i.test(userAgent);
}

/**
 * Get the specific AI crawler name from user agent
 */
export const getAiCrawlerName = (userAgent: string = ''): string | null => {
  if (!isAiCrawler(userAgent)) return null;
  
  const crawlers = {
    'GPTBot': 'OpenAI (bulk ingestion)',
    'ChatGPT-User': 'OpenAI (user-initiated browse)',
    'OAI-SearchBot': 'OpenAI (search system)',
    'ClaudeBot': 'Anthropic Claude (training)',
    'Claude-User': 'Anthropic Claude (user browsing)',
    'PerplexityBot': 'Perplexity AI',
    'Google-Extended': 'Google AI',
    'AppleBot': 'Apple AI/Siri',
    'CCBot': 'Common Crawl',
    'Anthropic-AI': 'Anthropic Claude',
    'Cohere-AI': 'Cohere AI'
  };
  
  for (const [crawlerUA, crawlerName] of Object.entries(crawlers)) {
    if (userAgent.includes(crawlerUA)) {
      return crawlerName;
    }
  }
  
  return 'Unknown AI Crawler';
} 