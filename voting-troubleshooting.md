# Voting System Troubleshooting

## Issues Fixed

1. **Cookie Parsing Errors**: Fixed async cookie handling in API routes
2. **Added Fallback Data**: If API fails, mock vote counts will display
3. **Added Test Endpoint**: `/api/platform-votes/test` to check database setup

## To Check Your Setup

### 1. Test the Database
Visit: `http://localhost:3000/api/platform-votes/test`

This will show:
- If `platform_votes` table exists
- If `platform_vote_counts` view exists
- If you're authenticated

### 2. Check Browser Console
Open DevTools and look for `[Voting]` logs:
- `[Voting] Fetched votes:` - Shows if API is working
- `[Voting] Using mock data` - Shows if using fallback

### 3. Check Network Tab
When opening the dialog:
- Look for `/api/platform-votes` request
- Check response status and data

### 4. Database Migration
If tables don't exist, you need to run the migration:
```bash
# In Supabase dashboard:
# 1. Go to SQL Editor
# 2. Paste and run the migration from:
#    supabase/migrations/20240000000005_add_platform_votes.sql
```

## What You Should See

1. **In the Dialog**:
   - Platforms like WordPress, Webflow should show vote counts
   - Upvote buttons next to "Coming soon" platforms
   - Buttons turn green when clicked

2. **In Console**:
   - Vote counts being fetched
   - Vote submission logs
   - Any errors clearly marked

## Common Fixes

1. **No vote counts showing**:
   - Check if you see "Using mock data" in console
   - Visit the test endpoint to check database

2. **Can't vote**:
   - Make sure you're logged in
   - Check for 401 errors in console

3. **Database issues**:
   - Manually run the migration in Supabase
   - Check Supabase connection is working 