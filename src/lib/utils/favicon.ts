/**
 * Favicon utility for retrieving domain favicons with fallbacks
 */

const FAVICON_CACHE = new Map<string, string>()
const FALLBACK_ICON = '/images/split-icon-white.svg'

/**
 * Get favicon URL for a domain with various fallback strategies
 */
export async function getFaviconUrl(domain: string): Promise<string> {
  if (!domain) return FALLBACK_ICON
  
  // Check cache first
  if (FAVICON_CACHE.has(domain)) {
    return FAVICON_CACHE.get(domain)!
  }

  // Clean domain (remove protocol, www, etc.)
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]

  // Try multiple favicon sources in order of preference
  const faviconSources = [
    `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`,
    `https://${cleanDomain}/favicon.ico`,
    `https://${cleanDomain}/favicon.png`,
    `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`,
  ]

  for (const source of faviconSources) {
    try {
      const response = await fetch(source, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      
      if (response.ok) {
        FAVICON_CACHE.set(domain, source)
        return source
      }
    } catch (error) {
      // Continue to next source
      continue
    }
  }

  // All sources failed, use fallback
  FAVICON_CACHE.set(domain, FALLBACK_ICON)
  return FALLBACK_ICON
}

/**
 * Preload favicon for a domain (fire and forget)
 */
export function preloadFavicon(domain: string): void {
  if (!domain || FAVICON_CACHE.has(domain)) return
  
  getFaviconUrl(domain).catch(() => {
    // Silently fail, cache will be set to fallback
  })
}

/**
 * Clear favicon cache
 */
export function clearFaviconCache(): void {
  FAVICON_CACHE.clear()
}

/**
 * Get cached favicon or fallback immediately (no async)
 */
export function getCachedFaviconUrl(domain: string): string {
  if (!domain) return FALLBACK_ICON
  return FAVICON_CACHE.get(domain) || FALLBACK_ICON
} 