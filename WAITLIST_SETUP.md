# Waitlist Setup Guide

## Overview
The Split application includes a waitlist feature that can be toggled on/off. When enabled, all signup attempts will redirect to the waitlist page where users can join the early access list.

## Configuration

### Environment Variable
To enable the waitlist, set the following environment variable:

```
NEXT_PUBLIC_WAITLIST_ENABLED=true
```

### Where to Set It

1. **Local Development** - Add to `.env.local`:
   ```
   NEXT_PUBLIC_WAITLIST_ENABLED=true
   ```

2. **Vercel Production** - Add in Vercel Dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `NEXT_PUBLIC_WAITLIST_ENABLED` with value `true`

## How It Works

### When Enabled (NEXT_PUBLIC_WAITLIST_ENABLED=true):
- `/signup` redirects to `/waitlist`
- All "Get Started" buttons go to `/waitlist`
- Hero email input goes to `/waitlist`
- Users can join the early access waitlist

### When Disabled (default):
- `/waitlist` redirects to `/signup`
- All "Get Started" buttons go to `/signup`
- Normal signup flow is active

## Current Implementation

### Updated Routes:
1. **Landing Page Hero** - Email input → `/waitlist`
2. **Top Navigation Bar** - "Get Started" button → `/waitlist`
3. **CTA Section** - "Get your site ranked" button → `/waitlist`
4. **Mobile Menu** - "Get Started" button → `/waitlist`
5. **Direct Access** - `/signup` → redirects to `/waitlist`

### Database Storage:
Waitlist submissions are stored in the `waitlist` table with:
- User information (name, email, website)
- Hosting platform
- Interests selected
- Submission timestamp

### Email Integration:
The waitlist integrates with Loops for email automation when users join.

## Toggling the Feature

To switch between waitlist and normal signup:

1. Change the environment variable value
2. Redeploy the application
3. No code changes needed - it's all controlled by the env var

## Important Notes

- The `NEXT_PUBLIC_` prefix is required for the variable to be available in the browser
- Changes to environment variables require a rebuild/redeploy
- The waitlist page shows real-time position numbers starting from #46 