# Workspace API Keys Documentation

## Overview

Workspace API keys provide a secure way to access Split Analytics data scoped to specific workspaces. Unlike user-level API keys that have access to all workspaces, workspace API keys are restricted to a single workspace, providing better security and isolation.

## Key Features

- **Workspace Isolation**: Each key only accesses data from its assigned workspace
- **Backwards Compatible**: Existing user API keys continue to work
- **Granular Permissions**: Control what each key can do
- **Audit Trail**: Track when keys are used
- **Rate Limiting**: Workspace-specific rate limits

## Getting Started

### 1. Access Workspace Settings

Navigate to your workspace settings:
1. Go to your dashboard
2. Click "Workspace Settings" in the quick actions
3. Select the "API Keys" tab

### 2. Create a New API Key

1. Click "Create API Key"
2. Enter a descriptive name (optional)
3. Choose key type:
   - **Live**: For production use
   - **Test**: For development (doesn't count toward usage)
4. Click "Create Key"

⚠️ **Important**: Copy your API key immediately after creation. You won't be able to see it again!

### 3. Use Your API Key

Use the key with the `@split.dev/analytics` npm package:

```javascript
import { SplitAnalytics } from '@split.dev/analytics'

const split = new SplitAnalytics({
  apiKey: 'split_live_xxxxx', // Your workspace API key
  debug: true // Optional: Enable debug logging
})

// Test the connection
const pingResult = await split.ping()
console.log('Connection status:', pingResult)

// Track crawler visits
await split.autoTrack({
  url: request.url,
  userAgent: request.headers.get('user-agent'),
  method: request.method,
  statusCode: 200
})
```

## API Key Management

### Viewing API Keys

Your workspace can have up to 10 active API keys. Each key shows:
- Name and creation date
- Last used timestamp
- Active/inactive status
- Masked key preview

### Revoking API Keys

To revoke a key:
1. Find the key in your list
2. Click the delete icon
3. Confirm deletion

Revoked keys stop working immediately.

## Migration from User Keys

### Existing Keys Continue Working

Your existing user-level API keys will continue to work. They'll automatically use your primary workspace for data access.

### Should You Migrate?

Consider migrating to workspace keys if you:
- Have multiple workspaces and want better isolation
- Need different keys for different environments
- Want to grant limited access to team members (coming soon)

### How to Migrate

1. Create new workspace API keys
2. Update your integration to use the new keys
3. Test thoroughly
4. Revoke old user keys when ready

## API Endpoints

All existing endpoints work with workspace keys:

### /api/ping
Test your API key connection:
```bash
curl https://split.dev/api/ping \
  -H "Authorization: Bearer split_live_xxxxx"
```

### /api/crawler-events
Track crawler visits:
```bash
curl https://split.dev/api/crawler-events \
  -H "Authorization: Bearer split_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "url": "https://example.com",
      "userAgent": "Mozilla/5.0 (compatible; GPTBot/1.0)",
      "crawler": {
        "name": "GPTBot",
        "company": "OpenAI",
        "category": "ai-training"
      },
      "timestamp": "2024-01-01T00:00:00Z"
    }]
  }'
```

## Workspace Settings

Each workspace has configurable settings:

### Crawler Tracking
- Enable/disable crawler tracking
- Configure allowed/blocked crawlers

### Data Retention
- Crawler logs: 7-365 days
- Max visibility data: 30-730 days

### API Rate Limits
- Requests per minute: 1-1,000
- Requests per day: 100-1,000,000

### Notifications
- Email alerts for important events
- Webhook integration (optional)

## Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use environment variables** to store keys
3. **Rotate keys regularly** for enhanced security
4. **Use test keys** for development environments
5. **Monitor key usage** through last used timestamps

## Troubleshooting

### Invalid API Key Error

- Verify the key starts with `split_live_` or `split_test_`
- Check if the key has been revoked
- Ensure you're using the correct workspace

### Permission Denied

- Verify the key has the required permissions
- Check workspace settings for restrictions

### Rate Limit Exceeded

- Check your workspace's rate limit settings
- Consider upgrading your plan for higher limits

## FAQ

**Q: Can I use the same API key across multiple workspaces?**
A: No, workspace API keys are scoped to a single workspace. Use user keys if you need multi-workspace access.

**Q: What happens to my data if I delete an API key?**
A: Your data remains intact. Only the key's access is revoked.

**Q: Can I recover a deleted API key?**
A: No, deleted keys cannot be recovered. You'll need to create a new one.

**Q: Do test keys have any limitations?**
A: Test keys work identically to live keys but don't count toward your usage limits.

## Support

Need help? Contact us:
- Documentation: https://docs.split.dev
- Email: support@split.dev
- Discord: https://discord.gg/split 