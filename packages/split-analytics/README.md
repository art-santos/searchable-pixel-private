# @split.dev/analytics

🚀 **Simple AI crawler tracking for any website**

Zero dependencies, lightweight, reliable tracking of AI crawlers like ChatGPT, Claude, Perplexity, and 20+ others.

## ⚡ Quick Start

```bash
npm install @split.dev/analytics
```

## Configuration

**IMPORTANT:** Set your API endpoint to your own domain:

```javascript
import { createSplitMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createSplitMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  apiEndpoint: process.env.NEXT_PUBLIC_URL + '/api', // YOUR domain, not split.dev
  debug: process.env.NODE_ENV === 'development'
})
```

## Environment Variables

```bash
# Your API key from Split Analytics dashboard
SPLIT_API_KEY=split_live_your_key_here

# Your website's URL (important!)
NEXT_PUBLIC_URL=https://yourdomain.com
```

## Next.js Setup

1. Create `middleware.ts` in your project root:

```typescript
import { createSplitMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createSplitMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  apiEndpoint: process.env.NEXT_PUBLIC_URL + '/api',
  debug: process.env.NODE_ENV === 'development'
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

2. The package will automatically track AI crawlers visiting your site!

**That's it!** AI crawler visits will appear in your [Split Dashboard](https://split.dev/dashboard) within 5-10 seconds.

---

## 📋 Complete Setup Guide

### 1. Get Your API Key

1. Sign up at [split.dev](https://split.dev)
2. Go to **Settings** → **API Keys** 
3. Click **"Generate Live Key"**
4. Copy the key immediately (you won't see it again)

### 2. Install Package

```bash
npm install @split.dev/analytics
# or
yarn add @split.dev/analytics
# or  
pnpm add @split.dev/analytics
```

### 3. Add Environment Variable

```bash
# .env.local (Next.js)
SPLIT_API_KEY=split_live_your_actual_key_here

# .env (Node.js)
SPLIT_API_KEY=split_live_your_actual_key_here
```

### 4. Implement Tracking

#### Next.js Middleware (Recommended)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { trackCrawlerVisit } from '@split.dev/analytics/middleware'

export async function middleware(request: NextRequest) {
  // Add Split Analytics tracking
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit(request, {
      apiKey: process.env.SPLIT_API_KEY,
      debug: process.env.NODE_ENV === 'development'
    }).then((wasTracked) => {
      if (wasTracked && process.env.NODE_ENV === 'development') {
        console.log('✅ AI crawler tracked successfully')
      }
    }).catch((error) => {
      console.error('❌ Split Analytics error:', error)
    })
  }
  
  // Your existing middleware logic here...
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

#### Express/Node.js

```javascript
const express = require('express')
const { trackCrawlerVisit } = require('@split.dev/analytics')

const app = express()

app.use(async (req, res, next) => {
  // Track crawler visits (non-blocking)
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit({
      url: req.url,
      userAgent: req.headers['user-agent'],
      method: req.method
    }, {
      apiKey: process.env.SPLIT_API_KEY,
      debug: process.env.NODE_ENV === 'development'
    }).catch(console.error)
  }
  
  next()
})
```

### 5. Test Your Setup

**Trigger an AI crawler visit:**
1. Use ChatGPT Search on your website
2. Check your logs for: `✅ AI crawler tracked successfully`
3. Wait 5-10 seconds (batching delay)
4. Check your [Split Dashboard](https://split.dev/dashboard)

---

## 🔧 Troubleshooting

### "API returns 401 Unauthorized"

**Cause:** API key validation failing

**Solutions:**
1. **Check your API key format:**
   ```bash
   echo $SPLIT_API_KEY
   # Should start with: split_live_ or split_test_
   ```

2. **Verify key exists in Split Dashboard:**
   - Go to Settings → API Keys
   - Confirm your key is listed and active

3. **Check for extra characters:**
   ```bash
   # Remove any quotes or whitespace
   SPLIT_API_KEY=split_live_abc123  # ✅ Correct
   SPLIT_API_KEY="split_live_abc123"  # ❌ Has quotes
   SPLIT_API_KEY= split_live_abc123   # ❌ Has space
   ```

### "Crawler detected but no data in dashboard"

**Cause:** Authentication issues or data format problems

**Solutions:**
1. **Check if you're logged into Split Dashboard**
2. **Verify API key belongs to your account**
3. **Enable debug mode to see detailed logs:**
   ```typescript
   trackCrawlerVisit(request, {
     apiKey: process.env.SPLIT_API_KEY,
     debug: true // Shows detailed logging
   })
   ```

### "No crawler visits detected"

**Cause:** Middleware not detecting AI crawlers

**Debug steps:**
1. **Add debug logging:**
   ```typescript
   const userAgent = request.headers.get('user-agent')
   console.log('User-Agent:', userAgent)
   
   trackCrawlerVisit(request, {
     apiKey: process.env.SPLIT_API_KEY,
     debug: true
   }).then((wasTracked) => {
     console.log('Tracking result:', wasTracked ? 'SUCCESS' : 'NOT_DETECTED')
   })
   ```

2. **Test with known crawler:**
   ```bash
   # Simulate ChatGPT visit
   curl -H "User-Agent: Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)" \
        https://your-website.com
   ```

### "5-10 second delay before data appears"

**This is normal!** Events are batched for efficiency:
- **Single visit:** 5 second delay (batching)
- **10+ visits:** Immediate sending
- **Production:** Consider this normal behavior

**To reduce delay (not recommended):**
```typescript
import { SplitAnalytics } from '@split.dev/analytics'

const analytics = new SplitAnalytics({
  apiKey: process.env.SPLIT_API_KEY,
  batchIntervalMs: 1000 // 1 second (increases API calls)
})
```

---

## 🎯 Supported AI Crawlers

The package automatically detects 25+ AI crawlers:

### **OpenAI**
- `GPTBot` (training)
- `ChatGPT-User` (search)  
- `OAI-SearchBot` (search)

### **Anthropic**
- `ClaudeBot` (training)
- `Claude-Web` (assistant)

### **Google**
- `Google-Extended` (training)
- `Googlebot` (search)

### **Microsoft**
- `Bingbot` (search)
- `BingPreview` (search)

### **Others**
- `PerplexityBot` (Perplexity)
- `FacebookBot` (Meta)
- `Bytespider` (ByteDance)
- `CCBot` (Common Crawl)
- And 15+ more...

---

## 🔍 Advanced Usage

### Custom Event Tracking

```typescript
import { SplitAnalytics } from '@split.dev/analytics'

const analytics = new SplitAnalytics({
  apiKey: process.env.SPLIT_API_KEY,
  debug: true
})

// Manual tracking
await analytics.track({
  url: 'https://example.com/page',
  userAgent: 'GPTBot/1.0',
  crawler: {
    name: 'GPTBot',
    company: 'OpenAI', 
    category: 'ai-training'
  },
  metadata: {
    source: 'manual-tracking',
    custom: 'data'
  }
})
```

### Test API Connection

```typescript
import { ping } from '@split.dev/analytics'

const result = await ping({
  apiKey: process.env.SPLIT_API_KEY,
  debug: true
})

console.log('Connection:', result.status) // 'ok' or 'error'
```

### Environment-Specific Keys

```bash
# Use test keys in development
SPLIT_API_KEY=split_test_your_test_key_here  # Development
SPLIT_API_KEY=split_live_your_live_key_here  # Production
```

---

## 🚨 Common Mistakes

### ❌ Blocking the response
```typescript
// DON'T do this - blocks every request
export async function middleware(request: NextRequest) {
  await trackCrawlerVisit(request, config) // ❌ Blocks response
  return NextResponse.next()
}
```

### ✅ Non-blocking approach
```typescript
// DO this - doesn't block responses
export async function middleware(request: NextRequest) {
  trackCrawlerVisit(request, config).catch(console.error) // ✅ Non-blocking
  return NextResponse.next()
}
```

### ❌ Missing error handling
```typescript
// DON'T do this - can crash your app
trackCrawlerVisit(request, config) // ❌ No error handling
```

### ✅ Proper error handling
```typescript
// DO this - never crashes your app
trackCrawlerVisit(request, config).catch((error) => {
  console.error('Split Analytics error:', error) // ✅ Handles errors
})
```

### ❌ Wrong matcher config
```typescript
// DON'T track static files
export const config = {
  matcher: '/(.*)', // ❌ Tracks everything
}
```

### ✅ Optimized matcher
```typescript
// DO exclude static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] // ✅ Optimized
}
```

---

## 💡 Best Practices

### 1. **Environment Variables**
```bash
# Use different keys per environment
SPLIT_API_KEY_DEV=split_test_...
SPLIT_API_KEY_PROD=split_live_...
```

### 2. **Error Monitoring**
```typescript
trackCrawlerVisit(request, config).catch((error) => {
  // Send to your error monitoring service
  console.error('Split Analytics error:', error)
  // Sentry.captureException(error)
})
```

### 3. **Performance**
```typescript
// Only enable debug in development
const config = {
  apiKey: process.env.SPLIT_API_KEY,
  debug: process.env.NODE_ENV === 'development'
}
```

### 4. **Testing**
```bash
# Test your implementation
npx @split.dev/analytics --test-api YOUR_API_KEY
```

---

## 📊 Dashboard Features

Once set up, your [Split Dashboard](https://split.dev/dashboard) shows:

- **📈 Crawler Visits**: Timeline of AI crawler activity
- **🏢 Attribution by Source**: Which AI companies are crawling you
- **📍 Geographic Data**: Where crawlers are coming from  
- **⚡ Response Times**: How fast your site responds to crawlers
- **📄 Popular Pages**: Most crawled content
- **🔍 Search Trends**: What AI models are interested in

---

## 🆘 Need Help?

1. **Check the [troubleshooting section](#🔧-troubleshooting)**
2. **Enable debug mode** and check logs
3. **Test your API key**: `npx @split.dev/analytics --test-api YOUR_KEY`
4. **Join our Discord**: [discord.gg/split](https://discord.gg/split)
5. **Email support**: [help@split.dev](mailto:help@split.dev)

---

## 📝 Changelog

### v2.1.0
- ✅ **Fixed data format compatibility** (url + crawler object)
- ✅ **Improved error handling** (never crashes your app)
- ✅ **Enhanced debugging** (detailed logs in debug mode)
- ✅ **Better documentation** (this README!)

### v2.0.0
- ✅ **Added 25+ AI crawler detection**
- ✅ **Batching for performance** (5-second default)
- ✅ **Next.js middleware helpers**
- ✅ **Automatic retry logic**

---

## 🤝 Contributing

Found a bug? Missing a crawler? [Open an issue](https://github.com/split-dev/analytics/issues) or submit a PR!

---

**Built with ❤️ by the Split team** 