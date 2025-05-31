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
  // Using services that return the favicon directly (not a redirect)
  const faviconSources = [
    // Google's favicon service - most reliable
    `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`,
    // Clearbit's logo API (works well for companies)
    `https://logo.clearbit.com/${cleanDomain}`,
    // Icon Horse API
    `https://icon.horse/icon/${cleanDomain}`,
    // Favicon.cc service
    `https://api.faviconkit.com/${cleanDomain}/144`,
  ]

  // For development, we can also try direct favicon access
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    faviconSources.push(`https://${cleanDomain}/favicon.ico`)
  }

  // Test each source by loading it as an image
  for (const source of faviconSources) {
    try {
      const isValid = await testImageUrl(source)
      if (isValid) {
        FAVICON_CACHE.set(domain, source)
        return source
      }
    } catch (error) {
      // Continue to next source
      console.log(`Failed to load favicon from ${source}`)
      continue
    }
  }

  // All sources failed, use fallback
  FAVICON_CACHE.set(domain, FALLBACK_ICON)
  return FALLBACK_ICON
}

/**
 * Test if an image URL loads successfully
 */
function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const timeout = setTimeout(() => {
      img.src = ''
      resolve(false)
    }, 3000) // 3 second timeout
    
    img.onload = () => {
      clearTimeout(timeout)
      // Check if image has valid dimensions
      if (img.width > 0 && img.height > 0) {
        resolve(true)
      } else {
        resolve(false)
      }
    }
    
    img.onerror = () => {
      clearTimeout(timeout)
      resolve(false)
    }
    
    // Remove crossOrigin for better compatibility
    img.src = url
  })
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