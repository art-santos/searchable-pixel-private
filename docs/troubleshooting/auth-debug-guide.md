# Authentication Debug Guide

## Current Issue
You're logged in but the voting API doesn't recognize your authentication.

## Debug Steps

### 1. Check Authentication Status
Visit: `http://localhost:3000/api/auth/check`

This will show:
- What cookies are present
- If Supabase can find your session
- If Supabase can find your user

### 2. Look for Cookie Errors
The logs show: `Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"...`

This suggests the auth cookie format might be corrupted.

### 3. Try These Solutions

#### Option A: Clear Cookies and Re-login
1. Open DevTools → Application → Cookies
2. Clear all cookies for localhost:3000
3. Refresh the page
4. Log in again
5. Try voting

#### Option B: Check Supabase Auth Settings
Make sure in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

#### Option C: Force Refresh Auth
In your browser console:
```javascript
// This will refresh your auth session
window.location.reload()
```

### 4. What to Look For

When you click vote, check the console for:
```
[API] Available cookies: [...]
[API] Auth cookies found: 1 or more
[API] POST /platform-votes - User: some-uuid-here
```

If you see "User: not logged in", the auth isn't working.

## Common Causes

1. **Cookie corruption** - Clear and re-login
2. **Session expired** - Re-login
3. **Supabase configuration** - Check env vars
4. **Cookie domain mismatch** - Should be localhost:3000

## Quick Test

After logging in, immediately visit:
- `/api/auth/check` - Should show your user ID
- Then try voting - Should work if auth check passed 