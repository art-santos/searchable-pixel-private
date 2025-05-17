## 1. Overall Project

### 1.1 Main README

Your root README gives a bird's-eye view of Split as a Next.js/Tailwind web app:

# Split

    A modern, responsive web application built with Next.js and Tailwind CSS. Split features a clean, intuitive
interface for [your application purpose].

## Features

- 🎨 Modern UI with smooth transitions and animations
- 📱 Fully responsive design (mobile-first approach)
- 🎯 Interactive navigation with dropdown menus
- 💫 Custom components with hover effects
- 🔍 SEO optimized
- 🚀 Performance optimized

## Tech Stack

- Next.js
- React
- Tailwind CSS
- TypeScript
- Lucide Icons

### 1.2 Project Structure (per README)

## Project Structure


src/
  ├── components/     # React components
  ├── styles/         # Global styles and Tailwind config
  ├── pages/          # Next.js pages
  └── public/         # Static assets

    Beyond `src/`, at the repo root you also have:

    | Directory           | Purpose                                                                 |
    |:--------------------|:------------------------------------------------------------------------|
    | `docs/`             | Written guides (UI component docs, Site Audit spec, etc.)               |
    | `migrations/`       | Markdown summaries for database migrations                              |
    | `supabase/migrations` | SQL migration files for Supabase schema                              |
    | `scripts/`          | Helper scripts (e.g. migrate-supabase.js, test-supabase.js)              |
    | `split/`            | A standalone CLI package ("create-split") for wiring Split into Next.js  |
    | config files        | Tailwind, PostCSS, Next.js, Vercel, shadcn config, etc.                 |

    ---

    ## 2. Frontend Web Application (Next.js + Tailwind)

    The bulk of your app lives under `src/`, using Next.js's App Router plus shadcn/ui components and Supabase for
auth/data.

    ### 2.1 App Routes

    Under `src/app/` you've got route segments for user flows:

    - `dashboard/`
    - `site-audit/`
    - `content-strategy/`
    - `performance-reports/`
    - `keywords/`
    - `settings/`
    - `site-connector/`
    - `api-keys/`
    - `profile/`
    - plus top-level pages like `login/` and a landing page.

    *(These live in `src/app/…`, each containing its own React page, layout, and API routes.)*

    ### 2.2 UI Components (shadcn/ui)

    You've configured and documented a custom component library via shadcn/ui:

    ```markdown
    # Shadcn UI Master Documentation

    This document aggregates usage details for various Shadcn UI components. It focuses on how to install, import, and
 integrate each component, as well as common usage scenarios and best practices…

The components.json file shows your shadcn setup (aliases, Tailwind integration, icon library):

    {
      "$schema": "https://ui.shadcn.com/schema.json",
      "style": "new-york",
      "rsc": true,
      "tsx": true,
      …
      "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils",
        "ui": "@/components/ui",
        …
      },
      "iconLibrary": "lucide"
    }

components.json (./components.json)

### 2.3 Styles & Config

    * tailwind.config.js / .ts — your Tailwind setup
    * postcss.config.js / .mjs — PostCSS
    * next.config.js / .ts / .mjs — Next.js configuration
    * vercel.json — Vercel deployment settings
    * Global CSS in src/app/globals.css per components.json

---------------------------------------------------------------------------------------------------------------------

## 3. Site Audit Feature

A core part of Split is the Site Audit engine, which crawls sites for SEO and "AI Engine Optimization" (AEO) metrics
via Firecrawl.

### 3.1 Feature Overview (docs/site-audit.md)

    # Site Audit Feature

    The Site Audit feature in Split uses Firecrawl to analyze websites for SEO and AI Engine Optimization (AEO).

    ## Features

    ### Core Analysis
    - **Content Structure Analysis**: Evaluates headings, content structure, readability, and semantic HTML
    - **Technical Checks**: Tests status codes, redirects, broken links, and page load issues
    - **AI Visibility Scoring**: Assesses how well content is optimized for AI engines
    …
    ### Enhanced Analysis
    - **Document Analysis**: Handles PDF, DOCX, and other document formats
    - **Media Accessibility**: Evaluates image alt text, video captions, and transcript availability
    - **Interactive Testing**: Performs actions to test popups, cookie banners, and dynamic content
    - **AI-Powered Extraction**: Uses LLMs to extract website purpose and audience information
    - **Screenshots**: Captures visual representation of the website during crawling

### 3.2 Implementation Summary (migrations/site-audit-implementation.md)

    # Site Audit Implementation Summary

    ## Overview of Changes

    We've enhanced the site audit feature with comprehensive Firecrawl integration, focusing on six core areas:

    1. **Web crawling**: Enhanced Firecrawl client with support for documents, interactive actions
    2. **AEO analysis**: Improved analyzer with document, schema, and media accessibility analysis
    3. **Technical scanning**: Added robots.txt parsing and interactive testing
    …
    6. **Dashboard visualization**: Updated UI with detailed metrics and insights

### 4. Supabase Integration

You rely on Supabase for authentication, data storage, and migrations.

### 4.1 SQL Migrations (supabase/migrations)

A series of timestamped SQL scripts live under supabase/migrations—for agents credentials, encryption keys, site audit
 tables, etc. For example, the Site Audit tables migration:

    -- Sites table to store site information
    CREATE TABLE IF NOT EXISTS public.sites (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      domain TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_crawled_at TIMESTAMP WITH TIME ZONE,
    …

And you also have an update-schema migration under migrations/supabase:

    -- This migration updates the schema for the site audit feature to support enhanced Firecrawl capabilities

    ALTER TABLE crawls
    ADD COLUMN IF NOT EXISTS document_percentage SMALLINT DEFAULT 0,
    …

### 4.2 Migration Script (scripts/migrate-supabase.js)

A Node.js script to apply the above SQL via Supabase RPC:

    #!/usr/bin/env node
    …
    // Migration script for the site audit schema updates
    async function main() {
      console.log('Starting Supabase migration…');
      …
      const migrationPath = path.join(__dirname, '../migrations/supabase/site-audit-schema-update.sql');
      …
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      …
      const { data, error } = await supabase.rpc('exec_sql', {
        query: migrationSql
      });
      …
    }
    main();

### 4.3 Supabase Connection Test (test-supabase.js)

A quick script to verify your env vars and connectivity:

    // Simple script to test Supabase connection
    …
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing environment variables:');
      …
    }

## 5. "create-split" CLI Package

Under split/ you maintain an NPM package (published as create-split) that scaffolds Split into an existing Next.js
project.

### 5.1 CLI README (split/README.md)

    # create-split

    > Connect your Next.js site to Split's AI content delivery system

    This CLI tool configures your Next.js project to receive AI-generated content from Split, the AI content delivery
platform designed for Next.js sites.

    ## Installation & Usage

    You can use this tool directly with npx:

    ```bash
    npx create-split

This will:

    1. Install a webhook endpoint in your Next.js project
    2. Set up the necessary environment variables
    3. Create content directories
    4. Update your sitemap.xml and llms.txt files
    5. Register your site with Split

    ### 5.2 Core CLI Entrypoint (split/index.ts)

    The CLI orchestrates a series of "steps" (create content folder, install webhook, update sitemap/llms.txt,
register site):

    ```ts
    import chalk from 'chalk';
    import { installWebhook } from './steps/installWebhook';
    import { createContentFolder } from './steps/createContentFolder';
    …
    export interface CLIOptions {
      domain: string;
      contentPath: string;
      hasBlog: boolean;
      usesTailwind: boolean;
      usesAppRouter: boolean;
      agentId?: string;
      agentSecret?: string;
      verifyWebhook?: boolean;
    }
    /**
     * …series of prompts and step execution…
     */

### 5.3 Modular Steps (split/steps)

Each task is factored into its own file:

    split/steps/
    ├ createContentFolder.ts
    ├ installWebhook.ts
    ├ promptUser.ts
    ├ registerSite.ts
    ├ updateLlmsTxt.ts
    └ updateSitemap.ts

(Above is representative; see the directory for all step modules.)

### 5.4 Templates (split/templates)

The package ships template files for content and pages:

    split/templates/
    ├ blog-renderer-app-tailwind.tsx
    ├ blog.css
    ├ example-post.mdx
    ├ split-agent-app.ts
    └ split-agent-pages.ts

split/templates/blog-renderer-app-tailwind.tsx (./split/templates/blog-renderer-app-tailwind.tsx)

(Other templates live alongside; see the folder for details.)

---------------------------------------------------------------------------------------------------------------------

## 6. Supporting Documentation & Config

    * Animations guide: animations.md
    * Shadcn UI docs: docs/shadcn.md
    * Site audit spec: docs/site-audit.md
    * AEO scorecard API: docs/aeo-scorecard.md

---------------------------------------------------------------------------------------------------------------------

### Summary

In a nutshell, your Split repo consists of:

┌──────────────────────┬────────────────────────────────────────┬─────────────────────────────────────────────────────
──────────────────────────────────┐
│ Area                 │ Location                               │ Purpose                                             
                                  │
├──────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────
──────────────────────────────────┤
│ Frontend App         │ src/                                   │ Next.js + Tailwind web application (dashboard,
site-audit, content strategy, etc.)    │
├──────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────
──────────────────────────────────┤
│ UI Component Library │ components.json, docs/shadcn.md        │ shadcn/ui–based design system configuration and docs
                                  │
├──────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────
──────────────────────────────────┤
│ Site Audit Engine    │ src/app/site-audit, docs/, migrations/ │ Firecrawl-powered SEO + AEO crawler, plus
documentation and migration summaries       │
├──────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────
──────────────────────────────────┤
│ Supabase Backend     │ supabase/migrations/, scripts/         │ SQL schema migrations and Node.js scripts for
database setup and testing              │
├──────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────
──────────────────────────────────┤
│ create-split CLI     │ split/                                 │ A standalone NPM package to wire Split's AI content
delivery into any Next.js project │
├──────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────
──────────────────────────────────┤
│ Configuration & Docs │ root & docs/                           │ README, guides, Tailwind/PostCSS/Next/Vercel
configs, animation specs                 │
└──────────────────────┴────────────────────────────────────────┴─────────────────────────────────────────────────────
──────────────────────────────────┘

This should give you (or any new contributor) a clear map of what lives where and how the pieces fit together. Let me
know if you'd like more detail on any particular module! 