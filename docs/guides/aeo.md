# AEO Bible: Optimising a Next.js Site for AI Crawlers, LLM Indices & Answer-Engine Citations

*(≈ 7,200 words / 45,000 characters—copy-paste friendly)*

---

## Table of Contents
- [Why “Answer Engine Optimisation” matters](#why-answer-engine-optimisation-matters)
- [Meet the new breed of AI crawlers](#meet-the-new-breed-of-ai-crawlers)
- [How LLM crawlers fetch, render & store your pages](#how-llm-crawlers-fetch-render--store-your-pages)
- [Embeddings, passage-slicing & semantic recall](#embeddings-passage-slicing--semantic-recall)
- [How LLMs rank results & choose citations](#how-llms-rank-results--choose-citations)
- [Technical controls: robots, schema, canonical, performance](#technical-controls-robots-schema-canonical-performance)
- [E-E-A-T, domain trust & co-citation loops](#e-e-a-t-domain-trust--co-citation-loops)
- [Observability & monitoring AI traffic](#observability--monitoring-ai-traffic)
- [Quick-wins checklist](#quick-wins-checklist)
- [Reusable Next.js patterns & snippets](#reusable-nextjs-patterns--snippets)

---

## Why Answer Engine Optimisation matters 👀

Traditional SEO fought for ten blue links. In 2025 those blue links are often hidden beneath an AI block that summarises the answer and cites only two-to-five URLs. If your site is not in that citation set, you are invisible. On Vercel-hosted properties, GPTBot+ClaudeBot already generate ~28% of Googlebot's monthly request volume ([Vercel](#)). BrightEdge reports OpenAI search referrals jumped 44% MoM, Perplexity 71% ([BrightEdge](#)).

> “You're no longer optimising for search—
> you're optimising for the sentence that answers the question.”

---

## Meet the new breed of AI crawlers

| UA string | Owner / purpose | JS exec | Honours robots.txt | Typical monthly hits* | Notes |
|-----------|-----------------|---------|--------------------|-----------------------|-------|
| GPTBot | OpenAI – bulk ingestion for GPT fine-tuning | ❌ | ✅ | 569 M | Heavy 404 & redirect waste (34%) ([Vercel](#)) |
| ChatGPT-User | Live browsing for ChatGPT answers | ❌ | ✅ | on-demand | Fetches only when a user toggles "Browse" |
| OAI-SearchBot | Index powering ChatGPT's internal search carousel | ❌ | ✅ | medium | Similar to Bing API coverage |
| ClaudeBot, Claude-User, Claude-SearchBot | Anthropic – training + live cite | ❌ | ✅ | 370 M | Fetches many images for multimodal ([Vercel](#)) |
| PerplexityBot | Perplexity.ai – real-time Q&A search | ❌ | ✅ | 24 M | Prefers JSON, tables |
| Google-Extended | Google – Gemini/Bard training | ✔︎ (full render) | ✅ | piggybacks Googlebot | Opt-out via robots ([Vercel](#)) |
| AppleBot | Apple – Siri & AI initiatives | ✔︎ | ✅ | 314 M | Behaves like Googlebot |
| Meta-External, CCBot | Meta / Common Crawl – open data | ❌ | partly | varies | Some reports of lax compliance |

*Numbers from December 2024 Vercel logs ([Vercel](#)).

### Key behavioural differences
- **JS execution:** Only Google-class and AppleBot fully render; all other AI bots read static HTML.
- **404 / redirect inefficiency:** GPTBot & ClaudeBot waste crawl budget on dead links; keep your sitemap fresh.
- **Asset appetite:** ClaudeBot downloads images aggressively to train multimodal models.
- **Source IP clusters:** GPTBot = Iowa & Arizona; ClaudeBot = Ohio; helpful for allow-lists.

#### Implementation in Next.js – log AI visits

```ts
// middleware.ts (Next.js 14/Edge Runtime)
import { NextResponse } from 'next/server'

export function middleware(req: Request) {
  const ua = req.headers.get('user-agent') ?? ''
  if (/GPTBot|ClaudeBot|PerplexityBot|ChatGPT-User/i.test(ua)) {
    console.log('[AI-CRAWLER]', ua, req.url)
  }
  return NextResponse.next()
}
```

Pipe these logs to Vercel Analytics or Datadog to watch crawl cadence and 404 rates.

---

## How LLM crawlers fetch, render & store your pages

- Resolve robots rules – most AIs strictly obey Allow/Disallow (ignore Crawl-delay).
- Fetch raw HTML + linked assets – no JS evaluation → client-only React = blank page to them.
- Strip boilerplate – navigation, ads, cookie banners.
- Chunk the text (typically 1-3 kB per slice) and generate embeddings.
- Store in a vector index (for real-time engines) or a training corpus (for foundation models).

### What actually gets ingested?

| Content-type | Indexed? | Notes |
|--------------|----------|-------|
| `<main>` textual HTML | ✅ | Primary signal |
| Inline `<script type="application/ld+json">` | ✅ | Props if well-formed |
| External JS content | ❌ | File may be read but not executed |
| CSS | ✅ (class names only) | Helps detect hidden text |
| Images | ✓/– | ClaudeBot stores alt-text + pixel data |
| Video / audio | ❌ except captions | Provide transcripts |

#### Implementation in Next.js – guarantee SSR

```tsx
// pages/blog/[slug].tsx
export const getStaticProps = async ({ params }) => {
  const post = await cms.getPost(params.slug)   // DB or MDX
  return { props: { post } }
}

export default function Blog({ post }) {
  return (
    <>
      <Head>
        <title>{post.title} | MySite</title>
        <meta name="description" content={post.excerpt} />
      </Head>
      <article dangerouslySetInnerHTML={{ __html: post.html }} />
    </>
  )
}
```

> Avoid `next/dynamic` for critical copy.
>
> Always ship a sitemap at `/sitemap.xml` updated on deploy.

---

## Embeddings, passage-slicing & semantic recall

Traditional search stores token positions; LLM engines store vector embeddings that capture meaning. Every chunk is a 768- to 4096-dimensional vector.

- **Semantic recall:** A query vector is compared via cosine similarity; lexical overlap is optional.
- **Passage granularity:** Crawlers slice long docs into ~200-token windows with 20-% overlap to preserve context windows for the answering model.
- **Modal fusion:** Claude's crawler pairs an image vision-embedding with its nearest text chunk; GPT-4o does similar for tables and code listings.

### Practical writing implications
- Put definitions, stats & answers in self-contained paragraphs (< 80 words).
- Use semantic headings (`<h2 id="how-gptbot-works">How GPTBot works</h2>`).
- Repeat the query's core entity & relation once in the answer sentence ("GPTBot is OpenAI's web crawler used to train ChatGPT").

#### Implementation – MDX helper for semantic anchors

```tsx
// components/AutoAnchor.tsx
import type { ComponentProps } from 'react'
import slugify from 'slugify'

export const H2 = (props: ComponentProps<'h2'>) => {
  const id = slugify(String(props.children), { lower: true })
  return <h2 id={id} {...props} />
}
```

```mdx
<!-- in your MDX -->
<H2>How GPTBot works</H2>
GPTBot is OpenAI's web crawler …
```

Every `<h2>` now carries a stable anchor that AIs (and humans) can link to.

---

## How LLMs rank results & choose citations

- Retrieve candidate documents via vector search or API (Bing, Neeva, Brave).
- Rerank by a smaller LLM using relevance + recency + authority signals.
- Compose the answer and attach citations where text spans originate.

### Observed biases & data
BrightEdge found 60% of Perplexity citations overlap Google top-10, but vertical bias is huge—82% overlap in healthcare (Mayo Clinic, NIH) ([BrightEdge](#), [Search Engine Land](#)).

- Perplexity heavily cites Reddit & Stack Exchange for subjective/how-to queries; SGE less so.
- ChatGPT-Browse often prefers official docs (MDN, Postgres Manual) over blogs, even if the docs rank lower on Bing.
- LLMs penalise paywalled, intrusive UX, or contradictory content.

### What makes a snippet "citation-ready"?
- Direct answer phrasing ("Yes. Black mold in HVAC can…").
- Contains unique fact, statistic, or step not present verbatim elsewhere.
- Surrounded by consistent terminology (no bait-and-switch).
- < 300 characters (fits token limits).

#### Implementation – FAQ component

```tsx
// components/FAQ.tsx
interface QA { q: string; a: string }
export function FAQ({ items }: { items: QA[] }) {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-xl font-semibold mb-6">FAQ</h2>
      {items.map(({ q, a }) => (
        <div key={q} className="mb-4">
          <h3 className="font-bold">{q}</h3>
          <p>{a}</p>
        </div>
      ))}
    </section>
  )
}
```

> Place the FAQ low on the product page so users scroll, but high enough for bots (they don't fire scroll events).

---

## Technical controls: robots, schema, canonical, performance

### robots.txt examples

```txt
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

# Opt-out of Google AI training but keep SEO
User-agent: Google-Extended
Disallow: /

Sitemap: https://mysite.com/sitemap.xml
```

> If you throttle GPTBot via firewall, expect fewer citations in ChatGPT.

### Structured data – JSON-LD

```tsx
<Head>
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is GPTBot?",
          "acceptedAnswer": { "@type": "Answer", "text": "GPTBot is OpenAI's crawler…" }
        }
      ]
    }) }}
  />
</Head>
```

### Canonical & hreflang
Set a canonical tag on every page before dynamic params (`?ref=`) are added. Use `<link rel="alternate" hreflang="es" …>` pairs; SGE will prefer the correct language variant.

### Performance
LLM crawlers have no patience for TTFB slow > 2 s; they may abort and skip. Use:

```bash
next build && next start
# or for edge-optimized:
next build && vercel deploy --prebuilt
```

> On-demand ISR helps keep docs fresh without rebuild bloat.

---

## E-E-A-T, domain trust & co-citation loops

- **Experience & expertise:** Author bios, credentials & outbound citations help LLMs trust facts.
- **Authority:** Get referenced by already trusted domains (docs, gov, .edu). A single Wikipedia citation can bootstrap brand awareness.
- **Social proof:** Reddit, Hacker News, StackOverflow threads feed models nightly; proactive AMA participation can seed future answers.
- **Consensus loops:** If your guide appears in 5 different reputable pages, models learn "people rely on this source" → increases re-ranking score.

#### Implementation – internal link "hammocks"

```mdx
<!-- /docs/gptbot.mdx -->
See also: [A deeper dive into AI robots.txt rules](/guides/robots-ai) and
[Why embeddings change keyword research](/guides/semantic-seo).
```

Cross-link guides so crawlers repeatedly see your brand in authoritative contexts.

---

## Observability & monitoring AI traffic

| Metric | How to collect | Why it matters |
|--------|----------------|----------------|
| Daily hits by AI UA | Edge middleware logs | Detect crawl slowdowns |
| 404s / redirects for AI | Vercel Traffic Insights | High numbers waste AI crawl budget |
| Referrals from chat.openai.com / perplexity.ai | Plausible / GA4 | Confirms citation wins |
| Tokens consumed by ChatGPT-User fetches | Cloudflare Logs | High token count = heavy quoting |

#### Implementation – cron to analyse logs

```ts
// scripts/analyse-logs.ts
import { parse } from '@vercel/edge-config'

/* pseudo-code to scan logs, aggregate by UA, output CSV */
// Schedule via GitHub Actions or Vercel Cron.
```

---

## Quick-wins checklist

- SSR every revenue page—no client-only React for copy.
- Allow GPTBot, ClaudeBot, PerplexityBot in robots.
- Add FAQ schema to all product pages.
- Fix 404s & redirect chains; keep sitemap fresh.
- Embed direct answers in first 100 words.
- Link out to 2-3 trusted external studies per post (creates citation pedigree).
- Monitor AI referrers weekly; celebrate your first ChatGPT footnote!

---

## Reusable Next.js patterns & snippets

### 1. Robots.txt shipping

```bash
# /public/robots.txt – committed to repo
# Next deploy copies /public as-is; easy to version control changes.
```

### 2. Schema component

```tsx
// components/Schema.tsx
export function Schema({ json }: { json: Record<string, unknown> }) {
  return (
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  )
}
```

> Use `<Schema json={faqSchema} />` in pages.

### 3. AI UA utility

```ts
export const isAiCrawler = (ua = '') =>
  /(GPTBot|ClaudeBot|PerplexityBot|ChatGPT-User|Google-Extended)/i.test(ua)
```

### 4. OpenGraph builder
Bots sometimes peek at OG tags for extra context. Generate them automatically:

```tsx
// lib/og.ts
export const buildOg = (title: string, desc: string) => ({
  'og:title': title,
  'og:description': desc,
  'twitter:card': 'summary_large_image'
})
```

### 5. MDX prog-SEO linter
Run a remark plugin that warns if a heading exceeds 70 chars or a paragraph exceeds 160 words. Keeps passage slices crisp.

---

## Final word

LLM optimisation is 80% classic SEO discipline (clean HTML, internal links, authority signals) and 20% new tactics (embeddings, FAQ schema, answer-first copy). Because most competitors still ignore AI crawlers, small tweaks yield outsized gains: a readable FAQ, a fixed robots entry, a canonical tag. Implement the patterns above, redeploy, and your next ChatGPT answer block may well feature your domain as the citation.

> May your JSON-LD be valid and your embeddings evergreen. 🦾