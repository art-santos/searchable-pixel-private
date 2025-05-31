# @split.dev/analytics NPM Package - Internal Documentation

## What Does This Package Do?

The `@split.dev/analytics` package helps website owners track when AI bots (like ChatGPT, Claude, Perplexity) visit their websites. Think of it as Google Analytics, but specifically for AI crawlers instead of human visitors.

## How It Works (Simple Version)

1. **Bot Detection**: When someone visits a website, the package looks at their "user agent" (like an ID card that browsers send) to see if it's an AI bot
2. **Data Collection**: If it's a bot, we record:
   - Which bot it was (GPTBot, Claude-Web, etc.)
   - What page they visited
   - When they visited
   - How long the page took to load
3. **Batch & Send**: Instead of sending each visit immediately, we collect them in batches (like a mail carrier collecting letters) and send them to our API every 5 seconds or when we have 10 visits
4. **Dashboard Display**: The data shows up in the user's Split dashboard

## The Three Ways to Use It

### 1. Next.js/Vercel (Easiest)
```javascript
// Just one file: middleware.ts
export { middleware } from '@split.dev/analytics/middleware'
```
That's it! The package automatically tracks all AI visits.

### 2. Express/Node.js Servers
```javascript
// Add as middleware
app.use(createNodeMiddleware({ apiKey: 'their_key' }))
```

### 3. Custom Integration
```javascript
// For any other setup
const wasAIBot = await trackCrawler(config, {
  url: request.url,
  userAgent: request.headers['user-agent']
})
```

## Key Features

- **15+ AI Bots Detected**: GPTBot (OpenAI), Claude-Web (Anthropic), Bingbot (Microsoft), etc.
- **Privacy First**: No personal data, no cookies, no tracking pixels
- **Smart Batching**: Groups events together to reduce API calls
- **Automatic Retries**: If sending fails, it tries again (up to 3 times)
- **Zero Dependencies**: Lightweight, doesn't bloat the user's app

## The Technical Flow

```
Website Visit → Check User Agent → Is it AI? → Yes → Collect Data → Batch Events → Send to API
                                   ↓
                                   No → Do Nothing
```

## File Structure Explained

- `src/constants.ts` - List of all AI bots we know about
- `src/detector.ts` - The "brain" that identifies if a visitor is an AI bot
- `src/tracker.ts` - Collects and sends the data to our API
- `src/middleware.ts` - Special integration for Next.js
- `src/index.ts` - Main file that exports everything

## How the Batching Works

Instead of:
```
Visit 1 → Send to API immediately
Visit 2 → Send to API immediately  
Visit 3 → Send to API immediately
```

We do:
```
Visit 1 → Add to queue
Visit 2 → Add to queue
Visit 3 → Add to queue
(5 seconds pass OR 10 visits collected)
→ Send all at once to API
```

This is more efficient and reduces server load.

## API Key System

- Users generate API keys in their dashboard
- Keys look like: `split_live_abc123xyz...`
- We store only the hash (like a fingerprint) - never the actual key
- Each key can be restricted to specific domains

## What Happens on Our API Side

1. Receives batched events
2. Validates the API key
3. Stores raw visit data
4. Updates daily statistics (for faster dashboard loading)
5. Makes data available in the dashboard

## Common Questions

**Q: Why not use Google Analytics?**
A: GA blocks bot traffic by design and requires JavaScript (which bots don't run)

**Q: How accurate is bot detection?**
A: Very accurate for major AI bots. We check exact user agent strings.

**Q: What if our API is down?**
A: Events are queued and retried. If all retries fail, they're lost (acceptable for analytics)

**Q: Can users modify what data is sent?**
A: Yes, through metadata and custom handlers

## Future Improvements

1. More AI bot patterns
2. Geographic detection (what country is the bot from)
3. Response content analysis (what did the bot see)
4. Webhook support for real-time alerts

## Testing the Package Locally

```bash
cd packages/split-analytics
npm install
npm run build
npm link

# In a test project
npm link @split.dev/analytics
```

## Publishing Updates

```bash
npm version patch  # or minor/major
npm run build
npm publish
```

Remember: This package is the "eyes" that see AI visitors. The API is the "brain" that processes them. The dashboard is the "display" that shows insights. 