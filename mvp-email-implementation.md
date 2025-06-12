# Split MVP Email Notifications - Phase 1

## Core Email Types (MVP Only)

### 1. Welcome Email
**Trigger**: Immediately after successful user signup
**Purpose**: Professional first impression + basic guidance

**Content**:
- Split branding and welcome message
- "You're ready to track AI crawlers on your website"
- Single CTA: "Set up tracking" → Dashboard
- Links: Documentation, Support email

### 2. Email Verification
**Trigger**: During signup process
**Purpose**: Verify email ownership and activate account

**Content**:
- Simple "Verify your email address" subject
- One-click verification button
- 24-hour expiration
- Fallback verification URL
- Resend option if not received

### 3. Password Reset
**Trigger**: User requests password reset
**Purpose**: Secure account access recovery

**Content**:
- "Reset your Split password" subject
- Secure reset button (1-hour expiration)
- Security note: "If you didn't request this, ignore this email"
- Alternative: contact support

### 4. First Crawler Detected 🎉
**Trigger**: First AI crawler visit tracked for user
**Purpose**: Celebration + encourage engagement

**Content**:
- "🎉 Your first AI crawler detected!"
- Which crawler: "GPTBot visited your homepage"
- Simple stats: "Detected at [timestamp]"
- CTA: "View your analytics" → Dashboard
- Note: "This is just the beginning"

### 5. Weekly Analytics Summary
**Trigger**: Every Monday morning (if user has >0 crawler visits)
**Purpose**: Keep users engaged with their data

**Content**:
- "Your weekly AI crawler report"
- Key metrics: Total visits, unique crawlers, top pages
- Simple comparison: "↑ 23% from last week"
- CTA: "View detailed analytics" → Dashboard

## Technical Implementation

### Database Schema Updates
```sql
-- Add email preferences to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN last_weekly_email TIMESTAMP;

-- Email verification tokens
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens  
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Resend Integration Setup

#### 1. Environment Variables
```bash
# Add to .env.local
RESEND_API_KEY=re_xxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev  # Use Resend's shared domain for MVP
SUPPORT_EMAIL=sam@split.dev
```

#### 2. Email Domain Setup

**For MVP (Quick Start):**
Use Resend's shared domain - no setup required:
- `FROM_EMAIL=onboarding@resend.dev`

**For Production (Custom Domain):**
1. **Add Domain in Resend Dashboard:**
   - Go to [Resend Dashboard](https://resend.com/domains) → Domains
   - Click "Add Domain"
   - Enter `split.dev`

2. **Add DNS Records:**
   Resend will provide DNS records to add to your domain:
   ```
   # Example records (yours will be different)
   TXT  _resend.split.dev  "resend-verification=abc123..."
   TXT  split.dev          "v=spf1 include:_spf.resend.com ~all"
   CNAME resend._domainkey.split.dev  resend1._domainkey.resend.com
   TXT  _dmarc.split.dev   "v=DMARC1; p=quarantine; rua=mailto:dmarc@split.dev"
   ```

3. **Verify Domain:**
   - Wait for DNS propagation (5-30 minutes)
   - Click "Verify" in Resend dashboard
   - Once verified, update: `FROM_EMAIL=notifications@split.dev`

#### 3. Email Service
```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) => {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    
    console.log('Email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email failed:', error);
    return { success: false, error };
  }
};
```

#### 4. Email Templates
```typescript
// src/lib/email-templates.ts
export const templates = {
  welcome: (name: string) => ({
    subject: "Welcome to Split Analytics!",
    html: `
      <h1>Welcome to Split, ${name}!</h1>
      <p>You're now ready to track AI crawlers visiting your website.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
         style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Set up tracking
      </a>
      <p>Questions? Email us at ${process.env.SUPPORT_EMAIL}</p>
    `
  }),
  
  emailVerification: (name: string, token: string) => ({
    subject: "Verify your Split email address",
    html: `
      <h1>Verify your email, ${name}</h1>
      <p>Click the button below to verify your email address:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}"
         style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `
  }),
  
  passwordReset: (name: string, token: string) => ({
    subject: "Reset your Split password",
    html: `
      <h1>Reset your password, ${name}</h1>
      <p>Click the button below to reset your password:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}"
         style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Reset Password
      </a>
      <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    `
  }),
  
  firstCrawler: (name: string, crawlerName: string, page: string) => ({
    subject: "🎉 Your first AI crawler detected!",
    html: `
      <h1>🎉 Congratulations, ${name}!</h1>
      <p><strong>${crawlerName}</strong> just visited your website!</p>
      <p>Page visited: <code>${page}</code></p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        View Analytics
      </a>
      <p>This is just the beginning. More AI crawlers will discover your content!</p>
    `
  }),
  
  weeklyReport: (name: string, stats: { totalVisits: number; uniqueCrawlers: number; topPage: string; growth: number }) => ({
    subject: "Your weekly AI crawler report",
    html: `
      <h1>Weekly Report for ${name}</h1>
      <h2>This week's highlights:</h2>
      <ul>
        <li><strong>${stats.totalVisits}</strong> total crawler visits</li>
        <li><strong>${stats.uniqueCrawlers}</strong> unique AI crawlers</li>
        <li>Top page: <code>${stats.topPage}</code></li>
        <li>Growth: <strong>${stats.growth > 0 ? '↑' : '↓'} ${Math.abs(stats.growth)}%</strong> from last week</li>
      </ul>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        View Detailed Analytics
      </a>
    `
  })
};
```

### Integration Points

#### 1. Signup Flow
```typescript
// After successful user creation
await sendEmail({
  to: user.email,
  ...templates.welcome(user.name)
});

await sendEmail({
  to: user.email,
  ...templates.emailVerification(user.name, verificationToken)
});
```

#### 2. Crawler Detection
```typescript
// In your crawler tracking logic
const isFirstCrawler = await checkIfFirstCrawlerForUser(userId);
if (isFirstCrawler) {
  await sendEmail({
    to: user.email,
    ...templates.firstCrawler(user.name, crawlerName, page)
  });
}
```

#### 3. Weekly Cron Job
```typescript
// src/lib/cron/weekly-emails.ts
export async function sendWeeklyReports() {
  const usersWithActivity = await getUsersWithCrawlerActivity();
  
  for (const user of usersWithActivity) {
    const stats = await getWeeklyStats(user.id);
    await sendEmail({
      to: user.email,
      ...templates.weeklyReport(user.name, stats)
    });
  }
}
```

## Implementation Checklist

### Setup (Day 1)
- [ ] Install Resend package: `pnpm add resend` ✅ (Already installed)
- [ ] Add environment variables to `.env.local` ✅ (Done)
- [ ] Set up email domain (use `onboarding@resend.dev` for MVP) ✅ (Ready)
- [ ] Create email service utility ✅ (Done)
- [ ] Set up basic email templates ✅ (Done)

### Database (Day 1)
- [ ] Add email verification columns to users table
- [ ] Create email_verifications table
- [ ] Create password_resets table

### Core Emails (Day 2-3)
- [x] Welcome email on signup ✅
- [ ] Email verification flow
- [ ] Password reset flow  
- [x] First crawler detection email ✅

### Weekly Reports (Day 4)
- [x] Weekly stats calculation ✅
- [x] Cron job setup ✅ (`/api/cron/weekly-emails`)
- [x] Email preference management ✅

### Testing (Day 5)
- [ ] Test all email flows in development
- [ ] Verify email templates render correctly
- [ ] Test unsubscribe functionality

## Next Steps After MVP

Once Phase 1 is working:
1. Add email preference center
2. Implement proper email templates with Split branding
3. Add email analytics/tracking
4. Security alerts (login from new device)
5. API quota warnings

This MVP approach gets you professional email notifications quickly while laying the foundation for more advanced features later. 