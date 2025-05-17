# Plan to Complete AEO Scorecard API

## Overview

The goal is to deliver the REST API described in `docs/aeo-scorecard.md`.
The repository already contains crawler and scoring logic but lacks dedicated
endpoints to manage scorecard jobs. We will reuse the crawler service to run
site audits and expose new routes under `/api/aeo-scorecard`.

## Tasks

1. **Create job service**
   - New module `src/services/scorecard/job.ts` handles creating a scorecard
     job, checking status and fetching results.
   - It will rely on existing functions `startSiteAudit`, `getSiteAuditStatus`
     and `getSiteAuditResults` from the crawler service.
   - The scorecard job ID will be the underlying `crawlId` from the crawler.
2. **Add API routes**
   - `POST /api/aeo-scorecard` starts a new job.
   - `GET /api/aeo-scorecard/[id]/status` returns progress information.
   - `GET /api/aeo-scorecard/[id]` returns the final scorecard once completed.
3. **Refactor structure**
   - Move existing LLM scoring helper into a new folder under
     `src/services/scorecard` so related code lives together.
   - Update imports in the crawler service accordingly.
4. **Documentation**
   - Keep `docs/aeo-scorecard.md` as the contract for API behaviour.
   - This plan is stored in `docs/aeo-scorecard-plan.md`.


## UI Integration

To surface the scorecard in the application, the site audit page will be updated
to trigger jobs through the new endpoints and display progress.

1. Call `POST /api/aeo-scorecard` when the user starts an audit.
2. Poll `GET /api/aeo-scorecard/[id]/status` and compute progress using the
   returned page counts.
3. When the job completes, load the full audit results from the existing site
   audit results API and render them with the current components.
4. Provide a history dropdown that reads from `GET /api/aeo-scorecard/history`
   so users can revisit previous scorecards.
