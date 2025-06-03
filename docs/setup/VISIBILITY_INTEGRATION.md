# AI Visibility Scoring Integration

This document describes the integration of AI visibility scoring functionality from the `feat/visibility` branch into the main onboarding flow on `master`.

## Overview

The AI visibility scoring system has been successfully integrated into the onboarding/signup flow, providing users with immediate value after account creation by analyzing their website's visibility in AI search results.

## New User Flow

The updated user journey is now:

1. **Homepage** → User enters their website URL
2. **`/start`** → Onboarding flow (email, keywords, business details)
3. **`/signup`** → User creates account
4. **`/visibility-score`** → **NEW**: AI visibility analysis and scoring
5. **`/dashboard`** → Main application dashboard

## Key Features Added

### 🎯 Post-Signup Visibility Analysis
- New `/visibility-score` page that runs immediately after account creation
- Uses onboarding data (website URL, keywords, business info) for personalized analysis
- Shows real-time progress during the 2-3 minute analysis process
- Displays comprehensive visibility metrics and actionable suggestions

### 🧠 AEO (AI Engine Optimization) Pipeline
- **Question Generation**: AI generates 50+ search queries based on website content
- **SERP Analysis**: Tests how the website appears in search results
- **URL Classification**: Categorizes results as owned, operated, or earned coverage
- **Visibility Scoring**: Calculates comprehensive visibility scores (0-100)

### 📊 Visibility Components
- **AEO Score Card**: Main visibility score with breakdown
- **Overall Score History**: Trending performance over time
- **Direct Citation Card**: Owned vs operated vs earned appearances
- **Suggestions Card**: AI-generated improvement recommendations

## Technical Implementation

### Core Libraries Added
- `src/lib/aeo/qgen.ts` - AI question generation using OpenAI
- `src/lib/aeo/serper.ts` - Search engine results via Serper.dev
- `src/lib/aeo/classify.ts` - URL classification logic
- `src/lib/aeo/score.ts` - Visibility scoring algorithm
- `src/lib/aeo/storage.ts` - Analysis data management

### API Endpoints
- `POST /api/aeo/start` - Starts the visibility analysis pipeline
- `GET /api/aeo/start` - Server-sent events for real-time progress
- `GET /api/visibility-test` - Fetches existing visibility data
- `POST /api/visibility-test/analyze` - Alternative analysis endpoint

### React Components
- `AEOPipeline` - Real-time analysis modal with progress tracking
- `AEOScoreCard` - Main score display with metrics breakdown
- `OverallAEOCard` - Score history and trending
- `DirectCitationCard` - Coverage analysis (owned/operated/earned)
- `SuggestionsCard` - AI recommendations for improvement

## Required Environment Variables

The visibility functionality requires these API keys:

```bash
# OpenAI for question generation
OPENAI_API_KEY=sk-...

# Serper.dev for search engine results
SERPER_API_KEY=...

# Firecrawl for website crawling
FIRECRAWL_API_KEY=fc-...
```

## Dependencies Added

- `openai@^4.103.0` - OpenAI API client
- `p-queue@^8.1.0` - Rate limiting for API calls

## How It Works

1. **User completes onboarding** and creates account
2. **Signup redirects to `/visibility-score`** instead of dashboard
3. **Analysis begins** when user clicks "Get My AI Visibility Score"
4. **5-step pipeline runs**:
   - Crawl website content
   - Generate 50+ search questions
   - Search for each question
   - Classify all URLs in results
   - Calculate visibility scores
5. **Real-time progress shown** via server-sent events
6. **Results displayed** with comprehensive metrics and suggestions
7. **User continues to dashboard** with full context

## Integration Benefits

- **Immediate value**: Users see tangible results right after signup
- **Personalized analysis**: Uses their specific website and business details
- **Onboarding retention**: Engaging experience that demonstrates product value
- **Data collection**: Builds user profile from the start
- **Smooth transition**: Natural flow from onboarding to core product

## Usage Notes

- Analysis takes 2-3 minutes depending on website size
- Requires valid API keys for all three services
- Results are stored temporarily and can be accessed later
- Onboarding data is cleared after successful analysis
- Users can re-run analysis from `/visibility-test` page

## Files Modified

### New Files
- `src/app/visibility-score/page.tsx` - Post-signup visibility scoring page
- `src/app/visibility-test/` - Complete visibility testing interface
- `src/lib/aeo/` - Core AEO analysis libraries
- `src/app/api/aeo/` - Analysis API endpoints

### Modified Files
- `src/components/auth/signup-form.tsx` - Updated redirect to `/visibility-score`
- `package.json` - Added required dependencies

## Next Steps

1. **Set up API keys** in your environment
2. **Test the full flow** from `/start` to `/dashboard`
3. **Customize scoring logic** as needed
4. **Add additional metrics** or visualizations
5. **Integrate with existing dashboard** for ongoing analysis

The visibility scoring system is now fully integrated and ready for production use! 