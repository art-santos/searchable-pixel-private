export function isValidDomain(domain: string): boolean {
  const trimmed = domain.trim().toLowerCase()
  const pattern = /^(?!https?:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
  return pattern.test(trimmed)
}

export function cleanDomain(url: string): string {
  if (!url) return ''
  
  let domain = url.trim().toLowerCase()
  
  // Remove protocol
  if (domain.startsWith('https://')) {
    domain = domain.substring(8)
  } else if (domain.startsWith('http://')) {
    domain = domain.substring(7)
  }
  
  // Remove www.
  if (domain.startsWith('www.')) {
    domain = domain.substring(4)
  }
  
  // Remove path and query params
  domain = domain.split('/')[0]
  
  return domain
}

