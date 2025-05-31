# @split.dev/analytics

> **Simple AI crawler tracking for any website. Zero dependencies, lightweight, reliable.**

Track when AI crawlers like GPTBot, Claude, Perplexity, and others visit your website. Get insights into your AI visibility and optimize your content for AI training and search.

[![npm version](https://badge.fury.io/js/@split.dev%2Fanalytics.svg)](https://www.npmjs.com/package/@split.dev/analytics)
[![Downloads](https://img.shields.io/npm/dm/@split.dev/analytics.svg)](https://www.npmjs.com/package/@split.dev/analytics)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green.svg)](https://www.npmjs.com/package/@split.dev/analytics)

## ✨ Features

- 🤖 **Detects 35+ AI crawlers** - GPTBot, ClaudeBot, Perplexity, Google Extended, and more
- ⚡ **Zero dependencies** - Lightweight and fast, won't bloat your app
- 🔒 **Privacy-first** - No personal data collection, just crawler analytics
- 📊 **Real-time dashboard** - View your AI crawler traffic at [split.dev](https://split.dev)
- 🛠️ **Framework agnostic** - Works with Next.js, React, Node.js, or any JavaScript app
- 🚀 **Easy setup** - Get started in under 2 minutes
- ✅ **Production ready** - Non-blocking tracking, comprehensive error handling
- 🔧 **Built-in testing** - Test your integration with `--test` and `--test-api` commands

## 🚀 Quick Start

### 1. Install

```bash
npm install @split.dev/analytics
```

### 2. Get API Key

<<<<<<< HEAD
### 1. Get Your API Key

Sign up at [split.dev](https://split.dev) and generate an API key from your dashboard.

### 2. Verify Your Connection

Before sending any tracking data, you can verify your API connection:

```javascript
import { ping } from '@split.dev/analytics'

// Test your API connection
const response = await ping({
  apiKey: 'your-api-key-here'
})

if (response.status === 'ok') {
  console.log('Connected to Split Analytics!')
  console.log('Workspace:', response.connection.workspace)
} else {
  console.error('Connection failed:', response.message)
}
```

### 3. Next.js Setup

For Next.js applications, add the middleware to track AI crawlers automatically:
=======
Sign up at [split.dev](https://split.dev) and get your API keys from the dashboard.
>>>>>>> 8236b93 (fixed package)

**Key Types:**
- **Test Keys** (`split_test_*`) - For development, testing, and CI/CD. Don't count toward usage limits.
- **Live Keys** (`split_live_*`) - For production use. Count toward your plan's usage limits.

### 3. Test Installation

```bash
# Test package installation
npx @split.dev/analytics --test

# Test API connection  
npx @split.dev/analytics --test-api YOUR_API_KEY
```

### 4. Add to Your App

**Next.js (Recommended)**

Create `middleware.ts` in your project root:

```typescript
import { createSplitMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createSplitMiddleware({
  apiKey: process.env.SPLIT_API_KEY!
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

**React/Node.js/Other**

```javascript
import { SplitAnalytics, isAICrawler } from '@split.dev/analytics'

const analytics = new SplitAnalytics({
  apiKey: process.env.SPLIT_API_KEY
})

// Auto-detect and track crawler visits
if (isAICrawler(navigator.userAgent)) {
  analytics.autoTrack({
    url: window.location.href,
    userAgent: navigator.userAgent
  })
}
```

**Environment Variables**

```bash
# Development
SPLIT_API_KEY=split_test_1234567890abcdef

# Production  
SPLIT_API_KEY=split_live_1234567890abcdef
```

## 🔧 API Reference

### Core Functions

```typescript
// Test connection
const result = await ping({ apiKey: 'your-key' })

// Create analytics instance
const analytics = new SplitAnalytics({ apiKey: 'your-key' })

// Check if user agent is a crawler
const isCrawler = isAICrawler(userAgent)

// Get crawler details
const info = getCrawlerInfo(userAgent)

// Track a visit
await analytics.track({
  url: 'https://example.com',
  userAgent: 'GPTBot/1.0',
  crawler: { name: 'GPTBot', company: 'OpenAI', category: 'ai-training' }
})

// Auto-detect and track
await analytics.autoTrack({
  url: 'https://example.com',
  userAgent: userAgent
})
```

### Next.js Middleware

```typescript
// Simple setup
import { createSplitMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createSplitMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  debug: process.env.NODE_ENV === 'development'
})

// Add to existing middleware
import { trackCrawlerVisit } from '@split.dev/analytics/middleware'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Your existing logic here...
  
  // Add Split Analytics (non-blocking)
  trackCrawlerVisit(request, {
    apiKey: process.env.SPLIT_API_KEY!
  }).catch(console.error)
  
  return response
}
```

## 🤖 Detected AI Crawlers

We detect 35+ AI crawlers including:

| Company | Crawlers | Purpose |
|---------|----------|---------|
| **OpenAI** | GPTBot, ChatGPT-User, OAI-SearchBot | Training, browsing, search |
| **Anthropic** | ClaudeBot, Claude-Web | Training, browsing |
| **Google** | Google-Extended, Googlebot | AI training, search |
| **Microsoft** | Bingbot, BingPreview | Copilot, search |
| **Perplexity** | PerplexityBot | AI search |
| **Meta** | FacebookBot, Meta-ExternalAgent | Social AI, training |
| **Others** | YouBot, CCBot, Bytespider, Applebot | Various AI applications |

## 🔍 Testing & Debugging

### Built-in Test Commands

```bash
# Test package installation
npx @split.dev/analytics --test

# Test API connection with your key
npx @split.dev/analytics --test-api split_test_your_key

# Run in your project
npm test  # if package is installed locally
```

### Debug Mode

```javascript
const analytics = new SplitAnalytics({
  apiKey: 'your-key',
  debug: true  // Enable detailed logging
})
```

### Test Installation Programmatically

```javascript
import { testInstallation } from '@split.dev/analytics'

const results = await testInstallation({
  apiKey: 'your-key'  // optional
})

console.log(results)
// {
//   packageImport: true,
//   crawlerDetection: true,
//   apiConnection: true,
//   apiConnectionDetails: { ... }
// }
```

## 📊 Working Examples

Check the `examples/` folder for complete implementations:

- `nextjs-basic.js` - Simple Next.js middleware setup
- `nextjs-with-auth.js` - Integration with existing auth middleware

## 🔒 Privacy & Security

- **Zero personal data collection** - Only crawler visit metadata
- **No cookies or tracking pixels** - Pure server-side analytics  
- **GDPR compliant** - No personal information processed
- **Secure transmission** - All data encrypted in transit

## 🆘 Troubleshooting

### Common Issues

**"Invalid API key format"**
- Ensure key starts with `split_live_` or `split_test_`
- Get keys from: [split.dev/dashboard](https://split.dev/dashboard)

**"Network error"**
- Check internet connection
- Verify API endpoint is accessible
- Try test key first: `npx @split.dev/analytics --test-api YOUR_KEY`

**"Middleware routing conflicts"**
- Ensure `NextResponse.next()` is returned properly
- Use `trackCrawlerVisit()` for existing middleware
- Enable debug mode to see detailed logs

**"TypeScript errors"**
- Update to latest version: `npm install @split.dev/analytics@latest`
- Check that imports match documentation
- Enable `skipLibCheck` in tsconfig.json if needed

### Get Help

- **Documentation**: [docs.split.dev](https://docs.split.dev)
- **Dashboard**: [split.dev](https://split.dev)
- **Issues**: [GitHub Issues](https://github.com/split-dev/analytics/issues)

## 🎯 What's New in v2.0.0

- ✅ **Fixed middleware routing conflicts** - No more API route issues
- ✅ **Improved error messages** - Specific, actionable error information
- ✅ **Complete TypeScript support** - Full type definitions for all exports
- ✅ **Built-in testing utilities** - `--test` and `--test-api` commands
- ✅ **Better debugging** - Comprehensive debug mode and logging
- ✅ **Working examples** - Copy-paste ready Next.js integrations
- ✅ **Non-blocking tracking** - Won't slow down your application
- ✅ **API key validation** - Clear validation and helpful guidance

## 📝 License

MIT © Split Analytics

---

**Made with ❤️ by the Split team** • [split.dev](https://split.dev) 