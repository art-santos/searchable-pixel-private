# AEO Scorecard

The AEO (AI Engine Optimization) scorecard summarizes metrics from a site audit so you can quickly gauge how well a page is optimized for AI-driven search and discovery.

## API Usage

The feature exposes a small REST API:

### `POST /api/aeo-scorecard`

Create a new scorecard job.

**Body JSON**

```json
{
  "url": "https://example.com",
  "userId": "<uuid>",
  "options": { "maxPages": 50 }
}
```

**Response**

```json
{
  "id": "<scorecard-id>",
  "status": "queued"
}
```

### `GET /api/aeo-scorecard/[id]`

Fetch the final scorecard for the given id.

**Response JSON**

```json
{
  "id": "<scorecard-id>",
  "status": "completed",
  "aeoScore": 84,
  "issues": {
    "critical": 1,
    "warning": 3,
    "info": 5
  },
  "metrics": {
    "contentQuality": 75,
    "technical": 80,
    "mediaAccessibility": 90
  }
}
```

### `GET /api/aeo-scorecard/[id]/status`

Check the progress of a running job.

**Response**

```json
{
  "id": "<scorecard-id>",
  "status": "in-progress",
  "processedPages": 20,
  "totalPages": 50
}
```

### `GET /api/aeo-scorecard/history`

List the most recent scorecard jobs for the current user.

**Response**

```json
[
  {
    "crawl_id": "<scorecard-id>",
    "site_url": "example.com",
    "created_at": "2024-05-15T12:00:00Z",
    "status": "completed",
    "aeo_score": 82
  }
]
```

## Scoring Rubric

The language model scores each page on a 0-100 scale using these aspects:

- **Content quality** – clarity of copy, headings and meta description.
- **Technical health** – valid status codes and canonical markup.
- **Media accessibility** – descriptive alt text or transcripts.
- **Schema usage** – presence of relevant structured data.

Issues should be returned in this format so they can be saved with a severity:

```json
{ "severity": "high|medium|low", "message": "Description of the issue" }
```

Severity levels map to:

- **high** – problems that prevent indexing or understanding.
- **medium** – issues that reduce optimization effectiveness.
- **low** – minor recommendations.

### Weighted Site Score

The final AEO score combines multiple metrics:

- 50% average page AI visibility score returned by the LLM
- 20% content quality (share of pages with readable text)
- 20% technical health (share of pages with successful status codes)
- 10% media accessibility (average image or video alt coverage)

This weighting highlights which area lowered the score even if there are no critical issues.
