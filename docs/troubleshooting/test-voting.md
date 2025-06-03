# Testing the Voting System

## To test the voting system:

1. Make sure you're logged in (the voting requires authentication)
2. Open the dashboard
3. Click "Connect Analytics" on either empty card
4. Look for platforms marked "Coming soon" with vote counts
5. Click the upvote button next to any platform
6. You should see:
   - The vote count increase
   - The button turn green
   - A toast notification
   - The button become disabled

## Database Check

After voting, you can verify in Supabase:
- Check the `platform_votes` table for your vote
- Check the `platform_vote_counts` view for aggregated counts

## API Testing

You can test the API directly:

```bash
# Get current votes (no auth needed)
curl http://localhost:3000/api/platform-votes

# Submit a vote (requires auth cookie)
curl -X POST http://localhost:3000/api/platform-votes \
  -H "Content-Type: application/json" \
  -d '{"platformId": "wordpress"}'
```

## Common Issues

1. **401 Error**: You're not logged in
2. **Votes not persisting**: Check Supabase connection
3. **No toast notifications**: Check if toast provider is set up

## What Should Happen

When the voting system is working correctly:

1. **Before voting:**
   - Platforms show current vote count from database
   - Your previously voted platforms show green buttons
   - Unvoted platforms have clickable upvote buttons

2. **During voting:**
   - Button shows loading state (if implemented)
   - API call is made to `/api/platform-votes`

3. **After voting:**
   - Vote count increases by 1
   - Button turns green
   - Toast shows success message
   - Button is disabled
   - Vote is saved to database

4. **On dialog reopen:**
   - Your votes are remembered
   - Current vote counts are fetched from database 