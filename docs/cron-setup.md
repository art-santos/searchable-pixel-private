# Cron Job Setup for SBAC

## Overview
The SBAC system requires periodic tasks to:
1. Reset monthly usage counters based on billing cycles
2. Clean up old data according to retention policies

## Setting Up Your Cron Secret Token

### 1. Generate a Secure Token
```bash
# Generate a secure random token
openssl rand -base64 32
```

### 2. Add to Environment Variables
Add the generated token to your `.env.local` file:
```env
CRON_SECRET_TOKEN=your_generated_token_here
```

### 3. Deploy Your Application
Make sure this environment variable is set in your production environment (Vercel, etc.)

## Cron Service Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel Deployments)

Add to your `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/reset-usage",
    "schedule": "0 0 * * *"
  }]
}
```

**Note**: Vercel automatically adds authentication headers to cron requests. You'll need to update the endpoint to check for Vercel's cron authentication:

```typescript
// Update your /api/cron/reset-usage/route.ts
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  // For Vercel cron jobs
  const authHeader = headers().get('authorization')
  
  // Vercel adds this header for cron jobs
  if (process.env.VERCEL) {
    const cronSecret = headers().get('x-vercel-cron-signature')
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    // For external cron services
    const expectedToken = process.env.CRON_SECRET_TOKEN
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  // ... rest of your code
}
```

### Option 2: Cron-job.org (Free External Service)

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL**: `https://yourdomain.com/api/cron/reset-usage`
   - **Schedule**: Daily at midnight (0 0 * * *)
   - **Request Method**: POST
   - **Request Headers**: 
     ```
     Authorization: Bearer YOUR_CRON_SECRET_TOKEN
     ```

### Option 3: GitHub Actions

Create `.github/workflows/cron-usage-reset.yml`:
```yaml
name: Reset Usage Counters

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  reset-usage:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reset Usage API
        env:
          CRON_TOKEN: ${{ secrets.CRON_SECRET_TOKEN }}
          API_URL: ${{ secrets.API_URL }}
        run: |
          curl -X POST $API_URL/api/cron/reset-usage \
            -H "Authorization: Bearer $CRON_TOKEN" \
            -H "Content-Type: application/json"
```

Add secrets in GitHub repository settings:
- `CRON_SECRET_TOKEN`: Your generated token
- `API_URL`: Your production URL (e.g., https://yourdomain.com)

### Option 4: Upstash (Serverless Cron)

If using Upstash for Redis/Kafka, they offer QStash for serverless cron:

```typescript
// Install: npm install @upstash/qstash
import { Client } from "@upstash/qstash"

const client = new Client({ token: process.env.QSTASH_TOKEN })

// Schedule the job
await client.publishJSON({
  url: "https://yourdomain.com/api/cron/reset-usage",
  headers: {
    Authorization: `Bearer ${process.env.CRON_SECRET_TOKEN}`
  },
  cron: "0 0 * * *"
})
```

## Testing Your Cron Job

### Local Testing
In development, you can test the endpoint directly:
```bash
# Since we allow GET in development
curl http://localhost:3000/api/cron/reset-usage
```

### Production Testing
Test with your token:
```bash
curl -X POST https://yourdomain.com/api/cron/reset-usage \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN" \
  -H "Content-Type: application/json"
```

## Monitoring

### 1. Add Logging
The cron endpoint already logs success/failure. Consider adding:
- Webhook notifications on failure
- Database logs for audit trail
- Monitoring service integration (Sentry, LogRocket)

### 2. Health Checks
Consider adding a health check endpoint:
```typescript
// /api/cron/health/route.ts
export async function GET() {
  const lastReset = await getLastResetTimestamp()
  const isHealthy = Date.now() - lastReset < 25 * 60 * 60 * 1000 // 25 hours
  
  return NextResponse.json({
    healthy: isHealthy,
    lastReset: new Date(lastReset).toISOString()
  })
}
```

## Schedule Recommendations

### Daily Reset (Recommended)
- **Schedule**: `0 0 * * *` (midnight UTC)
- **Why**: Ensures all users get timely resets regardless of timezone

### Alternative Schedules
- **Hourly Check**: `0 * * * *` - More frequent but uses more resources
- **Twice Daily**: `0 0,12 * * *` - Good balance for global users

## Security Best Practices

1. **Rotate Tokens Regularly**: Change your CRON_SECRET_TOKEN monthly
2. **Use HTTPS Only**: Never call cron endpoints over HTTP
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **IP Whitelisting**: If your cron service supports it, whitelist their IPs
5. **Monitoring**: Set up alerts for failed or suspicious cron attempts

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check token is correctly set in environment
   - Verify Authorization header format

2. **Function Timeout**
   - Consider implementing pagination for large user bases
   - Use background jobs for heavy processing

3. **Duplicate Resets**
   - Implement idempotency checks
   - Use database locks if needed 