# AI Visibility Infrastructure

## Overview

This project is a full-stack platform that enables companies to measure, improve, and automate their visibility across AI-powered search engines like ChatGPT, Perplexity, and Gemini.

It consists of three tightly integrated systems:

1. LLM Visibility Intelligence  
2. Technical Site Auditing & AEO Optimization  
3. Automated Content Publishing via `split` npm package

---

## 1. LLM Visibility Intelligence

### What It Does

Quantifies how often and where your brand is mentioned in AI-generated responses by simulating structured queries across LLMs.

### Key Features

- 100-prompt scan per domain:
  - 30 direct prompts (e.g. “What is [Brand]?”)
  - 70 indirect prompts (e.g. “Top tools for [Category]”)
- Multi-source querying:
  - Perplexity API (real-time citations)
  - GPT-4o simulated output (bias check)
- Tiered scoring system:
  - Tier 1: Top 3 mention → +10
  - Tier 2: Mentioned lower → +5
  - Tier 3: Implied reference → +2
  - Tier 4: Not mentioned → 0 (or penalty for direct)

### Visibility Output

- Total Visibility Score (0–100)
- Direct Score / Indirect Score breakdown
- Cross-platform ranking (e.g. #24/117 in Perplexity)
- Source-level citations and trendline over time
- Action Plan: Suggested content to improve visibility gaps

---

## 2. Site Audit & AEO Optimization

### What It Does

Audits your site for LLM-readiness, technical SEO structure, and Answer Engine Optimization (AEO) using a deep crawler and structured content analysis.

### Key Features

- Crawls all site pages:
  - Status codes, meta tags, canonical tags, OG data
  - Text-to-code ratio, heading structure, schema presence
  - Duplicate content, low-content pages, broken links
- AEO Scoring:
  - Checks for `FAQPage`, `HowTo`, `QAPage`, `Article` schema
  - LLM promptability (quotable content)
  - Markdown/HTML formatting and semantic structure
- llms.txt + sitemap.xml validator
- Quote extraction tester (LLM picks your best answers)

### Audit Output

- Per-page Technical Score and AEO Score
- LLM Readiness Score (composite)
- Issue breakdown with autofix instructions
- Weekly snapshot history
- Exportable reports (JSON/CSV/PDF)

---

## 3. split – Headless CMS Integration

### What It Does

Allows developers to programmatically publish AI-generated blog posts, FAQs, and comparison pages directly into their app or site with structured metadata and full SEO/LLM compliance.

### Capabilities

- Renders content via React Server Components for SEO
- Injects blog pages at `/blogs/[slug]`
- Auto-wires:
  - Schema markup
  - Metadata
  - Canonical tags
  - `llms.txt` updates

### Setup Instructions

Install the package:

```bash
npm install split
Create a dynamic route in your app:

tsx
Copy
Edit
// app/blogs/[slug]/page.tsx
import { BlogPost } from "split";

export default function Blog({ params }) {
  return <BlogPost slug={params.slug} />;
}
Add your API key to .env:

env
Copy
Edit
SPLIT_API_KEY=your-key-here

Deploy. Blog posts generated from the Split platform will now render on your domain, fully indexable and schema-compliant.