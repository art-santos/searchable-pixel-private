# Changelog

<<<<<<< HEAD
All notable changes to this project will be documented in this file.

## [0.1.1] - 2025-05-31

### Added
- New `ping()` function to verify API connection and validate API keys
- `PingResponse` type export for TypeScript users
- Connection verification example in README
- Better error messages for connection failures

### Fixed
- ESM/CJS export paths in package.json

## [0.1.0] - 2025-05-30

### Initial Release
- AI crawler detection for 50+ crawlers
- Automatic tracking middleware for Next.js
- Node.js/Express middleware support
- Custom implementation support
- Automatic batching and retry logic
- TypeScript support 
=======
All notable changes to `@split.dev/analytics` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### 🎉 Major Release - Complete Rewrite

This is a complete rewrite of the package with a focus on simplicity, reliability, and zero dependencies.

### ✨ Added
- **Zero dependencies** - Completely self-contained package
- **Simple API** - Clean, intuitive interface with just the functions you need
- **TypeScript support** - Full TypeScript definitions included
- **Health check** - `ping()` function to test API connectivity
- **Auto-detection** - `autoTrack()` method for easy crawler detection and tracking
- **Utility functions** - `isAICrawler()` and `getCrawlerInfo()` for custom logic
- **Next.js middleware** - Simple middleware creation for automatic tracking
- **Existing middleware support** - `trackCrawlerVisit()` helper for existing setups
- **Framework agnostic** - Works with React, Vue, Node.js, Express, Gatsby, etc.
- **Debug mode** - Comprehensive logging for troubleshooting
- **Privacy-first** - No personal data collection, GDPR compliant

### 🤖 Crawler Detection
- GPTBot (OpenAI)
- ChatGPT-User (OpenAI)
- OAI-SearchBot (OpenAI)
- ClaudeBot (Anthropic)
- Claude-Web (Anthropic)
- Google-Extended (Google)
- Googlebot (Google)
- Bingbot (Microsoft)
- PerplexityBot (Perplexity)
- FacebookBot (Meta)
- CCBot (Common Crawl)
- YouBot (You.com)
- Bytespider (ByteDance)
- Applebot (Apple)

### 🔧 Configuration
- Simple configuration object with just `apiKey`, `apiEndpoint`, and `debug`
- Regex-based include/exclude patterns for middleware
- Custom metadata support for tracking additional information

### 📚 Documentation
- Comprehensive README with examples for all frameworks
- Clear API reference with TypeScript definitions
- Troubleshooting guide
- Privacy and security documentation
- Multiple integration examples

### 🔄 Migration from 0.x

**Before (0.x):**
```javascript
import { CrawlerTracker, detectAICrawler } from '@split.dev/analytics'

const tracker = new CrawlerTracker({
  apiKey: 'key',
  batchSize: 10,
  batchIntervalMs: 5000
})

const detection = detectAICrawler(userAgent)
if (detection.isAICrawler) {
  await tracker.track(event)
}
```

**After (1.0.0):**
```javascript
import { SplitAnalytics, isAICrawler } from '@split.dev/analytics'

const analytics = new SplitAnalytics({
  apiKey: 'key'
})

if (isAICrawler(userAgent)) {
  await analytics.autoTrack({
    url: 'https://example.com',
    userAgent: userAgent
  })
}
```

### ⚠️ Breaking Changes
- Complete API rewrite - not compatible with 0.x versions
- Removed batching system (now handles requests individually for reliability)
- Removed complex configuration options
- Simplified crawler detection interface
- New middleware API for Next.js

---

## [0.1.2] - 2024-12-18

### Fixed
- Fixed ping endpoint URL construction bug

## [0.1.1] - 2024-12-18

### Added
- Initial ping functionality
- API key validation

### Fixed
- ESM/CJS export issues

## [0.1.0] - 2024-12-18

### Added
- Initial release
- Basic crawler detection
- Next.js middleware
- Node.js support
- Batching system 
>>>>>>> 8236b93 (fixed package)
