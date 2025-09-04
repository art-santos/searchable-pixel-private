### 1. Authentication

*   **Description**: Handles user signup, login, password reset, and authentication callbacks.
*   **Files**:
    *   `src/components/auth/signup-form.tsx`
    *   `src/components/auth/login-form.tsx`
    *   `src/app/auth/callback/route.ts`
    *   `src/app/auth/auth-code-error/page.tsx`
    *   `src/app/api/test-auth/route.ts`
    *   `src/app/api/debug-auth/route.ts`
    *   `src/app/api/auth/reset-password/route.ts`
    *   `src/app/api/auth/forgot-password/route.ts`
    *   `src/app/api/auth/check/route.ts`
    *   `src/app/login/page.tsx`
    *   `src/app/signup/page.tsx`
    *   `src/app/reset-password/page.tsx`
    *   `src/app/forgot-password/page.tsx`
    *   `src/middleware.ts`
*   **Dependencies**:
    *   `@supabase/auth-helpers-nextjs`
    *   `@supabase/supabase-js`
    *   `@supabase/auth-ui-react`
    *   `next`
    *   `react`
    *   `zod`
    *   `react-hook-form`

### 2. API

*   **Description**: The backend API for the application, handling various functionalities.
*   **Files**: The API is organized into subdirectories within `src/app/api`. Key endpoint groups include:
    *   `admin`: Admin-related functionalities.
    *   `aeo`, `aeo-scorecard`, `audit`, `visibility-test`: Endpoints for auditing and analysis.
    *   `auth`: Authentication endpoints.
    *   `billing`, `stripe`, `subscription`, `credits`: Billing and subscription management.
    *   `leads`: Lead management.
    *   `workspaces`: Workspace management.
    *   `dashboard`: Endpoints for the dashboard.
    *   `users`: User management.
    *   `projects`: Project management.
*   **Dependencies**:
    *   `next`
    *   `stripe`
    *   `@supabase/supabase-js`
    *   `resend`
    *   `nodemailer`
    *   `openai`
    *   `@ai-sdk/openai`

### 3. Dashboard

*   **Description**: The main user interface after login, displaying data visualizations and key metrics.
*   **Files**:
    *   `src/app/dashboard/page.tsx`
    *   `src/app/dashboard/layout.tsx`
    *   `src/app/dashboard/components/`: This directory contains numerous components for displaying information on the dashboard, such as charts, cards, and scorecards.
    *   `src/app/dashboard/attribution/`: Components and pages related to attribution.
*   **Dependencies**:
    *   `next`
    *   `react`
    *   `recharts`
    *   `@tanstack/react-table`
    *   `lucide-react`
    *   `shadcn-ui`
    *   `framer-motion`

### 4. Billing & Subscription

*   **Description**: Manages user subscriptions, payments, billing preferences, and credit system.
*   **Files**:
    *   `src/components/billing/billing-preferences.tsx`
    *   `src/components/subscription/*`
    *   `src/lib/subscription/*`
    *   `src/app/api/billing/*`
    *   `src/app/api/subscription/*`
    *   `src/app/api/stripe/*`
    *   `src/app/api/credits/*`
*   **Dependencies**:
    *   `stripe`
    *   `@stripe/react-stripe-js`
    *   `@stripe/stripe-js`
    *   `next`
    *   `react`

### 5. Leads

*   **Description**: Functionality related to lead generation, enrichment, and management.
*   **Files**:
    *   `src/components/leads/leads-early-access-dialog.tsx`
    *   `src/app/leads-early-access/page.tsx`
    *   `src/app/dashboard/leads/websets-demo/page.tsx`
    *   `src/app/dashboard/leads/page.tsx`
    *   `src/app/api/leads/*`
*   **Dependencies**:
    *   `next`
    *   `react`
    *   `@supabase/supabase-js`

### 6. Auditing and Analysis

*   **Description**: Core functionality for analyzing websites, including AEO (AI Engine Optimization), visibility tests, and other audits.
*   **Files**:
    *   `src/lib/aeo/*`
    *   `src/lib/visibility/analyzer.ts`
    *   `src/app/api/audit/*`
    *   `src/app/api/aeo/*`
    *   `src/app/api/aeo-scorecard/*`
    *   `src/app/api/visibility-test/*`
    *   `src/app/dashboard/components/aeo-scorecard/*`
*   **Key Tables**:
    *   `public.crawler_visits`: This table is central to the auditing and analysis functionality. It stores detailed information about each crawler visit to a user's website. The table is created and modified in the following migration file: `supabase/migrations/20240000000006_add_crawler_tracking.sql`.
*   **Dependencies**:
    *   `next`
    *   `react`
    *   `openai`
    *   `@ai-sdk/openai`
    *   `cheerio`
    *   `puppeteer`
    *   `@mendable/firecrawl-js`

### 7. Workspaces

*   **Description**: Allows users to organize their projects and data into separate workspaces.
*   **Files**:
    *   `src/components/workspace/*`
    *   `src/app/w/[workspaceId]/page.tsx`
    *   `src/app/create-workspace/page.tsx`
    *   `src/app/api/workspaces/*`
    *   `src/app/api/track/[workspaceId]/*`
*   **Dependencies**:
    *   `next`
    *   `react`
    *   `@supabase/supabase-js`

### 8. Blog & Marketing

*   **Description**: The public-facing website, including the blog, marketing pages, and legal documents.
*   **Files**:
    *   `src/app/(marketing)/*`
    *   `src/content/blog/*`
    *   `src/components/blog/*`
*   **Dependencies**:
    *   `next`
    *   `react`
    *   `gray-matter`
    *   `remark` and `remark-html`
    *   `react-markdown`
