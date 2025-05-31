# Debug Voting System

## What to Check in Browser Console

When you open the Connect Analytics dialog, you should see:

1. **Initial Fetch**:
   ```
   [Voting] Fetched votes: {...}
   [Voting] platformVotes state updated: {...}
   ```

2. **When Viewing Platforms**:
   ```
   [Voting] Display count for wordpress: {fromState: ..., fromPlatform: 0, displaying: ...}
   ```

3. **When Clicking Vote**:
   ```
   [Voting] Attempting to vote for: wordpress
   [Voting] Response: 200 {success: true, voteCount: ...}
   [Voting] Vote successful for wordpress New count: ...
   [Voting] platformVotes state updated: {...}
   ```

## Possible Issues

### 1. Vote Count Not Returned
Check if the POST response includes `voteCount`:
- Open Network tab
- Click vote button
- Check response body of POST /api/platform-votes

### 2. State Not Updating
If you see the success log but count doesn't change:
- Check if `platformVotes state updated` shows new count
- Check if platform IDs match exactly

### 3. Database View Issue
The `platform_vote_counts` view might not be updating:
- Visit `/api/platform-votes/test`
- Check if vote appears in the view

## Quick Fix to Test
Try refreshing the dialog after voting:
1. Vote for a platform
2. Close dialog
3. Open dialog again
4. Check if count increased

## Manual Database Check
In Supabase SQL Editor:
```sql
-- Check votes
SELECT * FROM platform_votes ORDER BY voted_at DESC;

-- Check counts
SELECT * FROM platform_vote_counts;
``` 