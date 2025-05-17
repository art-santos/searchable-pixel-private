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
