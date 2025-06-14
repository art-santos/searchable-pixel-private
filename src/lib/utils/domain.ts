export function isValidDomain(domain: string): boolean {
  const trimmed = domain.trim().toLowerCase()
  const pattern = /^(?!https?:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
  return pattern.test(trimmed)
}

