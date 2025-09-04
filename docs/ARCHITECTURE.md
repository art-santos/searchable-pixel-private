# Project Architecture

This document outlines the architecture of the project in its current, simplified state.

## 1. Overview

The application is a full-stack web application built with Next.js and Supabase. It is designed to provide a core user workflow for traffic monitoring.

*   **Framework:** Next.js (App Router)
*   **Backend:** Next.js API Routes (Serverless Functions)
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **Styling:** Tailwind CSS
*   **Deployment:** Vercel (assumed, as is standard for Next.js)

## 2. Frontend

The frontend is built with React and Next.js.

*   **Directory Structure:**
    *   `src/app/`: Contains the pages and layouts, following the Next.js App Router conventions.
    *   `src/components/`: Contains reusable React components.
    *   `src/lib/`: Contains utility functions and libraries.
*   **UI Components:** The UI is built using a combination of custom components and components from a UI library (likely shadcn/ui, given the presence of `components.json` and the use of Radix UI).
*   **State Management:** State is managed using a combination of React's built-in state management (`useState`, `useEffect`) and context providers (`src/contexts/`).

## 3. Backend

The backend is implemented as serverless functions using Next.js API Routes.

*   **API Routes:** Located in `src/app/api/`, these endpoints handle all communication with the database and external services.
*   **Key Endpoints:**
    *   `/api/auth/*`: Handles user authentication (login, signup, password reset).
    *   `/api/workspaces/*`: Manages user workspaces.
    *   `/api/api-keys/*`: Manages API keys for tracking.
    *   `/api/track/*`: Collects tracking data from the user's website.

## 4. Database

The database is a PostgreSQL instance managed by Supabase.

*   **Schema:** The database schema is defined and managed through SQL migration files located in `supabase/migrations/`.
*   **Key Tables:**
    *   `users`: Stores user information (from Supabase Auth).
    *   `workspaces`: Stores user workspaces.
    *   `api_keys`: Stores API keys for tracking.
    *   `crawler_visits`: Stores the traffic data collected from the user's website.
*   **Database Client:** The application uses the `@supabase/supabase-js` library to interact with the database.

## 5. Authentication

Authentication is handled by Supabase Auth.

*   **Providers:** The application uses email/password-based authentication.
*   **Session Management:** Supabase's client libraries handle session management and JWT refreshing.
*   **Middleware:** `src/middleware.ts` protects routes by checking for a valid user session.

## 6. Styling

The application is styled using Tailwind CSS.

*   **Configuration:** `tailwind.config.ts` and `postcss.config.js` define the Tailwind CSS configuration.
*   **Utility Classes:** The UI is built using Tailwind's utility classes directly in the JSX.

## 7. Key Data Flows

### User Registration:
1.  User submits the signup form.
2.  The frontend calls the `/api/auth/signup` endpoint.
3.  The backend uses Supabase Auth to create a new user.
4.  A new workspace and API key are created for the user in the database.

### Traffic Monitoring:
1.  The user embeds the tracking script on their website.
2.  The script sends a request to the `/api/track/[workspaceId]/pixel.gif` endpoint for each page view.
3.  The backend API route receives the request, validates the API key, and records the visit in the `crawler_visits` table.
4.  The user can view the collected data on the dashboard, which fetches the data from the `crawler_visits` table via API routes.

## 8. Folder Structure

```
.
├── components.json
├── create-test-user.sql
├── database
│   └── migrations
│       ├── 001_create_projects_schema.sql
│       ├── 002_add_aeo_audit_fields.sql
│       └── 002_add_snapshot_integration.sql
├── docs
│   └── ARCHITECTURE.md
├── email-templates
│   ├── README.md
│   └── reset-password.html
├── env-new-pricing.example
├── FILES_TO_DELETE.md
├── FUNCTIONALITIES_AND_DEPENDENCIES_THAT_CAN_BE_DELETED_WITHOUT_AFFECTING_CORE.md
├── FUNCTIONALITIES.md
├── lib
│   ├── quick-performance-score.ts
│   └── services
│       └── enhanced-firecrawl-client.ts
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── postcss.config.mjs
├── public
│   ├── avatars
│   │   └── sam-hogan.png
│   ├── BingSiteAuth.xml
│   ├── blog
│   │   ├── ... (omitted for brevity)
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── images
│   │   ├── ... (omitted for brevity)
│   ├── llms.txt
│   ├── robots.txt
│   └── wp-plugin
│       └── split-analytics.zip
├── README.md
├── scripts
│   ├── ... (omitted for brevity)
├── server_output.log
├── src
│   ├── app
│   │   ├── ... (omitted for brevity)
│   ├── components
│   │   ├── ... (omitted for brevity)
│   ├── content
│   │   └── blog
│   ├── contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── WorkspaceContext.tsx
│   ├── fonts
│   │   ├── cal-sans.css
│   │   └── CalSans-SemiBold.woff2
│   ├── hooks
│   │   ├── ... (omitted for brevity)
│   ├── layouts
│   │   └── AuthenticatedLayout.tsx
│   ├── lib
│   │   ├── ... (omitted for brevity)
│   ├── middleware.ts
│   ├── services
│   │   ├── firecrawl-client.ts
│   │   └── scorecard
│   ├── test
│   │   └── onboarding-database-test.ts
│   └── types
│       ├── attribution.ts
│       ├── blog.ts
│       ├── max-visibility.ts
│       ├── stripe.ts
│       └── vanta.d.ts
├── step-by-step-implementation-fixed.md
├── step-by-step-implementation.md
├── supabase
│   ├── functions
│   │   └── process-snapshot
│   ├── migrations
│   │   ├── ... (omitted for brevity)
│   └── supabase
│       └── ... (omitted for brevity)
├── tailwind.config.js
├── tailwind.config.ts
├── tsconfig.json
├── update-visibility-schema.sql
├── USER_WORKFLOW.md
├── vercel.json
└── vercel.json.example
```
