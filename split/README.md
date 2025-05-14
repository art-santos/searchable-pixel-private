# create-split

> Connect your Next.js site to Split's AI content delivery system

This CLI tool configures your Next.js project to receive AI-generated content from Split, the AI content delivery platform designed for Next.js sites.

## Installation & Usage

You can use this tool directly with npx:

```bash
npx create-split
```

This will:
1. Install a webhook endpoint in your Next.js project
2. Set up the necessary environment variables
3. Create content directories
4. Update your sitemap.xml and llms.txt files
5. Register your site with Split

## Prerequisites

- A Next.js project
- Credentials from your [Split dashboard](https://split.dev)

## How it Works

Split delivers AI-generated content to your site through a secure webhook. This CLI tool configures your Next.js project to:

1. Accept content through a secure webhook endpoint
2. Store content in a designated directory
3. Make content discoverable to search engines and LLMs

## API Credentials

You'll need to generate API credentials from your Split dashboard. These consist of:
- `SPLIT_AGENT_ID`: A unique identifier for your site
- `SPLIT_AGENT_SECRET`: A secret key used to verify webhook requests

## Manual Setup

If you prefer to set things up manually:

1. Add your credentials to `.env.local`:
   ```
   SPLIT_AGENT_ID=your_agent_id
   SPLIT_AGENT_SECRET=your_agent_secret
   ```

2. Create an API endpoint at `/api/split-agent` in your Next.js project
3. Create a content directory for AI-generated content
4. Update your sitemap.xml to include Split content

## License

MIT 