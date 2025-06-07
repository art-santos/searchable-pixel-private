=== Split Analytics - AI Crawler Tracking ===
Contributors: splitanalytics
Tags: ai, crawler, analytics, chatgpt, claude, perplexity, bot, tracking
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 2.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Track AI crawler visits from ChatGPT, Claude, Perplexity and 30+ others. Simple, lightweight, privacy-focused analytics.

== Description ==

**Split Analytics** helps you understand which AI crawlers are visiting your WordPress site. Track visits from ChatGPT, Claude, Perplexity, Google AI, and 30+ other AI crawlers with zero dependencies and complete privacy.

### 🚀 Key Features

* **30+ AI Crawler Detection** - Automatically detects ChatGPT, Claude, Perplexity, Bingbot, and many more
* **Zero Dependencies** - Completely self-contained, no external libraries required
* **Privacy-First** - GDPR compliant, no personal data collection
* **Real-time Dashboard** - See crawler activity in WordPress admin and Split Analytics dashboard
* **Server-Side Tracking** - Works even though AI crawlers don't execute JavaScript
* **WordPress Integration** - Native dashboard widget, settings page, and hooks
* **Advanced Filtering** - Include/exclude specific paths with regex patterns
* **Automatic Cleanup** - Configurable data retention and automatic cleanup

### 🤖 Supported AI Crawlers

**OpenAI**: GPTBot, ChatGPT-User, OAI-SearchBot
**Anthropic**: ClaudeBot, Claude-Web, anthropic-ai
**Google**: Google-Extended, Googlebot
**Microsoft**: Bingbot, BingPreview, msnbot
**Meta**: FacebookBot, facebookexternalhit, Meta-ExternalAgent
**Others**: PerplexityBot, YouBot, Amazonbot, Applebot, CCBot, and many more

### 📊 What You'll Learn

* Which AI companies are crawling your content
* Most popular pages among AI crawlers
* Crawler activity trends over time
* Geographic distribution of crawler visits
* Response times and performance metrics

### 🔧 Easy Setup

1. Install the plugin
2. Get your free API key from [Split Analytics](https://split.dev)
3. Enter your API key in Settings → Split Analytics
4. Start tracking immediately!

### 💡 Why Track AI Crawlers?

* **Content Strategy** - Understand what content AI finds valuable
* **SEO Insights** - See how AI search engines discover your site
* **Traffic Analysis** - Separate AI crawler traffic from human visitors
* **Compliance** - Monitor which AI companies are using your content
* **Performance** - Optimize your site for AI crawler efficiency

== Installation ==

### Automatic Installation

1. Go to Plugins → Add New in your WordPress admin
2. Search for "Split Analytics"
3. Click "Install Now" and then "Activate"
4. Go to Settings → Split Analytics to configure

### Manual Installation

1. Download the plugin zip file
2. Go to Plugins → Add New → Upload Plugin
3. Choose the zip file and click "Install Now"
4. Activate the plugin
5. Go to Settings → Split Analytics to configure

### Configuration

1. Sign up for a free account at [split.dev](https://split.dev)
2. Go to your dashboard and generate an API key
3. In WordPress, go to Settings → Split Analytics
4. Enter your API key and enable tracking
5. Save settings and start tracking!

== Frequently Asked Questions ==

= Do AI crawlers execute JavaScript? =

No, AI crawlers like ChatGPT, Claude, and Perplexity typically don't execute JavaScript. That's why Split Analytics uses server-side tracking to capture these visits that traditional analytics tools miss.

= Is this plugin GDPR compliant? =

Yes! Split Analytics only tracks AI crawlers (bots), not human visitors. No personal data is collected, making it GDPR compliant by design.

= Does this slow down my website? =

No. The plugin is designed to be lightweight with zero dependencies. Tracking happens server-side and doesn't impact page load times for your visitors.

= What's the difference between free and paid plans? =

The plugin is free to use. Split Analytics offers paid plans for advanced features like longer data retention, detailed analytics, and API access. Check [split.dev](https://split.dev) for current pricing.

= Can I track crawlers without the Split Analytics service? =

The plugin stores crawler visits locally in your WordPress database, so you can see basic activity in your WordPress admin. However, the full analytics dashboard and advanced features require a Split Analytics account.

= How accurate is crawler detection? =

Very accurate! We maintain an extensive database of 30+ AI crawler user agents and update it regularly. The plugin also includes fallback detection for unknown AI crawlers.

= Can I exclude certain pages from tracking? =

Yes! You can use regex patterns to exclude specific paths (like admin pages) or include only certain paths (like blog posts) in the advanced settings.

= Does this work with caching plugins? =

Yes! Since tracking happens at the server level before caching, it works with all popular caching plugins including WP Rocket, W3 Total Cache, and WP Super Cache.

== Screenshots ==

1. **Dashboard Widget** - See AI crawler activity right in your WordPress dashboard
2. **Settings Page** - Easy configuration with API key testing and advanced options
3. **Crawler Detection** - View all 30+ supported AI crawlers and their categories
4. **Local Statistics** - Basic analytics available directly in WordPress admin
5. **Split Dashboard** - Advanced analytics and insights at split.dev

== Changelog ==

= 2.0.0 - 2024-12-20 =
* Complete rewrite for improved performance and reliability
* Added support for 30+ AI crawlers including new ones from Meta, Apple, and ByteDance
* Zero dependencies - completely self-contained
* Enhanced WordPress integration with dashboard widget
* Improved admin interface with real-time testing
* Added advanced filtering options with regex support
* Better error handling and debugging options
* GDPR compliance improvements
* Performance optimizations

= 1.0.0 - 2024-12-01 =
* Initial release
* Basic AI crawler detection for major crawlers
* WordPress admin integration
* Split Analytics API integration

== Upgrade Notice ==

= 2.0.0 =
Major update with improved performance, 30+ crawler support, and enhanced WordPress integration. Backup your settings before upgrading.

== Privacy Policy ==

Split Analytics is designed with privacy in mind:

* **No Personal Data**: We only track AI crawlers (bots), never human visitors
* **No Cookies**: The plugin doesn't set or use any cookies
* **No External Scripts**: No tracking pixels or external JavaScript loaded
* **Local Storage**: Crawler visits are stored locally in your WordPress database
* **Optional Cloud**: Sending data to Split Analytics is optional and can be disabled
* **Data Control**: You control data retention and can clear all data anytime

== Support ==

Need help? We're here for you:

* **Documentation**: [docs.split.dev](https://docs.split.dev)
* **Support Forum**: Use the WordPress.org support forum for this plugin
* **Email Support**: [support@split.dev](mailto:support@split.dev)
* **Discord Community**: [discord.gg/split](https://discord.gg/split)

== Contributing ==

Split Analytics is open source! Contribute on [GitHub](https://github.com/split-dev/analytics-wordpress).

== Links ==

* [Split Analytics Website](https://split.dev)
* [Documentation](https://docs.split.dev)
* [API Documentation](https://docs.split.dev/api)
* [GitHub Repository](https://github.com/split-dev/analytics-wordpress)
* [Support](https://split.dev/support) 