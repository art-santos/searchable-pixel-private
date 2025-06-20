export interface IPInfoResponse {
  ip: string;
  org: string;
  city: string;
  region: string;
  country: string;
  type: 'business' | 'isp' | 'hosting' | 'education';
  domain?: string;
  company?: string;
}

export interface CompanyInfo {
  name: string;
  domain: string;
  city: string;
  region: string;
  country: string;
  type: string;
}

export class IPInfoClient {
  private apiKey: string;
  private baseUrl = 'https://ipinfo.io';

  constructor() {
    this.apiKey = process.env.IPINFO_TOKEN!;
    if (!this.apiKey) {
      throw new Error('IPINFO_TOKEN environment variable is required');
    }
  }

  async lookup(ip: string): Promise<CompanyInfo | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150); // 150ms timeout

      const response = await fetch(`${this.baseUrl}/${ip}?token=${this.apiKey}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Split-Leads/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`IPInfo API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: any = await response.json();
      console.log(`[IPInfo] Raw response for ${ip}:`, JSON.stringify(data));

      // Handle both basic and paid IPInfo responses
      let companyName = '';
      let domain = '';
      let isBusiness = false;

      if (data.asn) {
        // Paid plan response with ASN details
        companyName = data.asn.name || '';
        domain = data.asn.domain || '';
        isBusiness = data.asn.type === 'business';
        console.log(`[IPInfo] Using ASN data: ${companyName}, domain: ${domain}, type: ${data.asn.type}`);
      } else if (data.org) {
        // Basic plan response with org field (format: "AS15169 Google LLC")
        const orgMatch = data.org.match(/AS\d+\s+(.+)$/);
        companyName = orgMatch ? orgMatch[1] : data.org || '';
        isBusiness = true; // We'll filter with keywords below
        console.log(`[IPInfo] Using org field: ${companyName}`);
      }

      if (!companyName) {
        console.log('[IPInfo] No company name found');
        return null;
      }

      // For paid plan, trust the type field
      if (data.asn?.type && data.asn.type !== 'business') {
        console.log(`[IPInfo] Skipping non-business type: ${data.asn.type}`);
        return null;
      }

      // For basic plan (no type field), filter out known ISPs and hosting providers
      if (!data.asn?.type) {
        const lowerOrg = companyName.toLowerCase();
        const ispKeywords = ['comcast', 'verizon', 'at&t', 'spectrum', 'cox', 'charter', 'centurylink', 'frontier', 'windstream', 'mediacom', 'cable', 'broadband', 'telecom', 'communications', 'internet service', 'isp'];
        const hostingKeywords = ['amazon web services', 'aws', 'google cloud', 'microsoft azure', 'digitalocean', 'linode', 'vultr', 'ovh', 'hosting', 'datacenter', 'cloud'];
        
        const isISP = ispKeywords.some(keyword => lowerOrg.includes(keyword));
        const isHosting = hostingKeywords.some(keyword => lowerOrg.includes(keyword));
        
        if (isISP || isHosting) {
          console.log(`[IPInfo] Skipping non-business IP: ${companyName} (ISP: ${isISP}, Hosting: ${isHosting})`);
          return null;
        }
      }

      // Use domain from ASN data if available, otherwise extract from company name
      if (!domain) {
        domain = data.domain || this.extractDomainFromCompany(companyName);
      }

      return {
        name: companyName,
        domain: domain || '',
        city: data.city || '',
        region: data.region || '',
        country: data.country || '',
        type: 'business' // We've already filtered out non-businesses
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('IPInfo lookup timeout for IP:', ip);
      } else {
        console.error('IPInfo lookup error:', error);
      }
      return null;
    }
  }

  private extractDomainFromCompany(companyName: string): string {
    // Simple domain extraction heuristics
    const cleanName = companyName
      .toLowerCase()
      .replace(/\b(inc|llc|corp|corporation|ltd|limited|co)\b/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    // Common mappings
    const domainMappings: Record<string, string> = {
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'amazon': 'amazon.com',
      'apple': 'apple.com',
      'meta': 'meta.com',
      'netflix': 'netflix.com',
      'salesforce': 'salesforce.com',
      'oracle': 'oracle.com',
      'adobe': 'adobe.com',
      'shopify': 'shopify.com'
    };

    const firstWord = cleanName.split(' ')[0];
    if (domainMappings[firstWord]) {
      return domainMappings[firstWord];
    }

    // Fallback: use first word + .com
    return firstWord ? `${firstWord}.com` : '';
  }
}

// Singleton instance
export const ipinfoClient = new IPInfoClient(); 