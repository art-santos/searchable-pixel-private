# Quick Start: AI Tracking Pixel Setup

Get AI crawler tracking working on your website in under 5 minutes.

## What You'll Get

🤖 **Track 25+ AI Crawlers** - GPTBot, ClaudeBot, PerplexityBot, and more  
🏆 **AI-to-Human Conversions** - See when AI platforms send you human visitors  
📊 **Real-time Analytics** - Monitor AI activity across your entire website  

## Step 1: Get Your Tracking Code

1. Go to [Settings → Tracking Pixel](../settings?tab=tracking-pixel) in your Split.dev dashboard
2. Copy the basic tracking code (looks like this):

```html
<img src="https://split.dev/api/track/YOUR_WORKSPACE_ID/pixel.gif" style="display:none" width="1" height="1" alt="" />
```

## Step 2: Add to Your Website

Choose your platform and follow the steps:

### Framer ⚡️ Most Popular
1. Open your Framer project
2. Click **Settings** (⚙️) → **SEO & Meta**
3. Paste code in **"Head"** field
4. **Publish** your site

### Webflow
1. Go to **Site Settings** → **Custom Code**
2. Paste code in **"Head Code"** section
3. **Publish** your site

### WordPress
1. **Appearance** → **Theme Editor** → **header.php**
2. Paste before `</head>` tag
3. **Save** changes

### Shopify
1. **Online Store** → **Themes** → **Edit code**
2. Open **theme.liquid**
3. Paste before `</head>`
4. **Save**

### HTML/Static Sites
1. Open your HTML files
2. Paste in `<head>` section
3. Save and upload

### Squarespace
1. **Settings** → **Advanced** → **Code Injection**
2. Paste in **"Header"** field
3. **Save**

## Step 3: Test Your Setup

1. Go back to your Split.dev dashboard
2. Click the **"Test Pixel"** button
3. You should see: "Tracking pixel test successful!"

## Step 4: Start Tracking

That's it! Your website is now tracking:

- **AI Crawlers**: GPTBot, ClaudeBot, PerplexityBot, etc.
- **AI-to-Human Conversions**: When ChatGPT users visit your site
- **Campaign Attribution**: Track which AI platforms drive the most value

## What Happens Next?

### Immediate (Within Minutes)
- AI crawler visits start appearing in your dashboard
- Test events show up to confirm tracking works

### Within Hours
- Real AI crawler data begins accumulating
- Pattern analysis becomes available

### Within Days
- AI-to-human conversion tracking shows results
- Comprehensive analytics and insights available

## Advanced Setup (Optional)

Want to track campaigns or specific pages? Use the advanced code:

```html
<img src="https://split.dev/api/track/YOUR_ID/pixel.gif?page=homepage&c=summer-campaign" style="display:none" width="1" height="1" alt="" />
```

**Parameters:**
- `page=homepage` - Track specific pages
- `c=summer-campaign` - Track campaigns or sources
- `url=https://example.com` - Override detected URL

## Troubleshooting

**Not seeing data?**
- Use the Test Pixel button to verify setup
- Check that the code is in the `<head>` section
- Confirm your workspace ID is correct

**Pixel not loading?**
- Check browser network tab for errors
- Verify no ad blockers are interfering
- Ensure CORS is properly configured

## Need Help?

- 📖 [Full Documentation](../features/tracking-pixel-implementation.md)
- 🔧 [Troubleshooting Guide](../troubleshooting/tracking-pixel.md)
- 💬 Contact support through your dashboard

---

**Time to setup**: ~5 minutes  
**Time to first data**: ~1 hour  
**Platforms supported**: All major website builders + custom HTML 