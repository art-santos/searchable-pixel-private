import { createTransport } from 'nodemailer';

export interface EmailCandidate {
  email: string;
  pattern: string;
  confidence: number;
}

export interface EmailVerificationResult {
  email: string;
  status: 'verified' | 'invalid' | 'unknown' | 'timeout';
  reason?: string;
}

export class EmailGenerator {
  
  /**
   * Generate email patterns based on contact name and company domain
   * Optimized order: first@ (24%) > flast@ (15%) based on deliverability data
   */
  generateEmailPatterns(fullName: string, domain: string): EmailCandidate[] {
    const names = this.parseFullName(fullName);
    if (!names.first || !names.last || !domain) {
      return [];
    }

    const patterns: EmailCandidate[] = [
      {
        email: `${names.first}.${names.last}@${domain}`,
        pattern: 'first.last',
        confidence: 0.35
      },
      {
        email: `${names.first}@${domain}`,
        pattern: 'first',
        confidence: 0.24 // Optimized: moved up from 15% to 24%
      },
      {
        email: `${names.first[0]}${names.last}@${domain}`,
        pattern: 'flast',
        confidence: 0.15 // Moved down from 20% to 15%
      },
      {
        email: `${names.last}@${domain}`,
        pattern: 'last',
        confidence: 0.10
      },
      {
        email: `${names.first}${names.last}@${domain}`,
        pattern: 'firstlast',
        confidence: 0.10
      }
    ];

    return patterns.map(p => ({
      ...p,
      email: p.email.toLowerCase()
    }));
  }

  private parseFullName(fullName: string): { first: string; last: string } {
    const cleaned = fullName
      .replace(/[^\w\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
    
    const parts = cleaned.split(' ');
    
    return {
      first: parts[0] || '',
      last: parts[parts.length - 1] || ''
    };
  }

  /**
   * Verify email deliverability using SMTP check
   * Uses simple MX record validation for speed
   */
  async verifyFirst(emailCandidates: EmailCandidate[]): Promise<EmailVerificationResult | null> {
    // Sort by confidence (highest first)
    const sortedEmails = emailCandidates.sort((a, b) => b.confidence - a.confidence);
    
    for (const candidate of sortedEmails) {
      console.log(`[EMAIL] Verifying: ${candidate.email} (${candidate.pattern})`);
      
      const result = await this.verifyEmail(candidate.email);
      
      if (result.status === 'verified') {
        console.log(`[EMAIL] ✅ Verified: ${candidate.email}`);
        return result;
      }
      
      console.log(`[EMAIL] ❌ Failed: ${candidate.email} - ${result.reason}`);
    }

    return null;
  }

  private async verifyEmail(email: string): Promise<EmailVerificationResult> {
    try {
      const domain = email.split('@')[1];
      
      // Basic format validation
      if (!this.isValidEmailFormat(email)) {
        return {
          email,
          status: 'invalid',
          reason: 'Invalid email format'
        };
      }

      // MX record check
      const hasMX = await this.checkMXRecord(domain);
      if (!hasMX) {
        return {
          email,
          status: 'invalid',
          reason: 'No MX record found'
        };
      }

      // For MVP: if MX exists, consider it verified
      // TODO: Add deeper SMTP verification later
      return {
        email,
        status: 'verified',
        reason: 'MX record exists'
      };

    } catch (error) {
      console.error(`Email verification error for ${email}:`, error);
      return {
        email,
        status: 'unknown',
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async checkMXRecord(domain: string): Promise<boolean> {
    try {
      // Use DNS resolution to check MX records
      const dns = await import('dns').then(m => m.promises);
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords.length > 0;
    } catch (error) {
      console.error(`MX check failed for ${domain}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const emailGenerator = new EmailGenerator(); 