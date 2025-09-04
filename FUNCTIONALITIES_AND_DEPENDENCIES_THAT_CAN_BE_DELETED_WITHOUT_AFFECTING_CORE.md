# Core Workflow Analysis: Deletable vs. Essential Components

This document analyzes the project's components to distinguish between the essential parts required for the core user workflow and the parts that can be safely removed.

## 1. Core User Workflow

The essential user workflow is defined as:
1.  **Onboarding:** User registration and login.
2.  **Setup:** Receiving a unique API key and a workspace ID.
3.  **Integration:** Receiving a tracking script to embed on a website.
4.  **Verification:** Checking if the script is correctly installed.
5.  **Monitoring:** Viewing collected traffic data on a dashboard.

---

## 2. Essential Components (DO NOT DELETE)

The following functionalities, files, and dependencies are **required** for the core workflow.

### Essential Functionalities:
*   **Authentication:** For user sign-up, login, and password management.
*   **Workspaces:** To create and manage user workspaces.
*   **API Keys:** To generate and manage API keys for tracking.
*   **Tracking:** To provide the tracking script and collect data.
*   **Dashboard:** To display the API key, script, installation status, and traffic data.

### Essential Files & Folders:
*   `src/app/login/`, `src/app/signup/`, `src/app/reset-password/`
*   `src/app/dashboard/` (specifically pages and components for displaying traffic data)
*   `src/app/api/auth/`
*   `src/app/api/workspaces/`
*   `src/app/api/api-keys/`
*   `src/app/api/track/`
*   `src/app/api/tracking/`
*   `src/components/auth/`
*   `src/components/dashboard/` (components related to traffic monitoring)
*   `src/components/workspace/`
*   `src/lib/supabase/`
*   `supabase/migrations/` (migrations related to `users`, `workspaces`, `api_keys`, `crawler_visits`)

### Essential Dependencies:
*   `@supabase/auth-helpers-nextjs`, `@supabase/supabase-js`, `@supabase/auth-ui-react`
*   `next`, `react`, `react-dom`
*   `recharts`, `@tanstack/react-table` (for the dashboard)
*   `resend`, `nodemailer` (highly recommended for sending verification and password reset emails)
*   `zod`, `react-hook-form` (for form validation), `tailwind` All tailwind must remain

---

## 3. Deletable Components

The following components are **not essential** for the core workflow and can be removed.

### Deletable Functionalities:
*   **Billing & Subscription**
*   **Leads & CRM**
*   **Advanced Auditing & Analysis** (AEO, complex visibility tests)
*   **Blog & Marketing Pages**
*   **Admin Panel**

### Deletable Files and Folders:
*   **Root Level:** All `.md` files (except this one), all `.sql` files, `archive/`, `docs/`, `wp-plugin/`, and various one-off scripts.
*   **`src/app/`:** `(marketing)/`, `admin/`, `api/admin/`, `api/billing/`, `api/credits/`, `api/leads/`, `api/stripe/`, `api/subscription/`, `api/aeo/`, `api/audit/`, `dashboard/leads/`, `leads-early-access/`, `payment-required/`.
*   **`src/components/`:** `billing/`, `blog/`, `leads/`, `subscription/`, `admin/`, and any dashboard components not related to traffic monitoring.
*   **`src/lib/`:** `aeo/`, `visibility/`, `subscription/`, `stripe.ts`, `perplexity/`, `question-generator.ts`.
*   **`supabase/migrations/`:** Migrations related to billing, leads, and advanced auditing.

### Deletable Dependencies:
*   `@stripe/react-stripe-js`, `@stripe/stripe-js`, `stripe`
*   `openai`, `@ai-sdk/openai`
*   `cheerio`, `puppeteer`, `@mendable/firecrawl-js`
*   `gray-matter`, `remark`, `remark-html`, `react-markdown`