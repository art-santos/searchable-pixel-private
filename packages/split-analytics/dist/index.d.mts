<<<<<<< HEAD
import { T as TrackerConfig, P as PingResponse } from './tracker-Bp_2fBD6.mjs';
export { A as AI_CRAWLERS, a as CrawlerDetectionResult, b as CrawlerEvent, c as CrawlerInfo, C as CrawlerTracker, U as UnknownCrawlerInfo, d as detectAICrawler, e as extractRequestMetadata } from './tracker-Bp_2fBD6.mjs';
import { IncomingMessage, ServerResponse } from 'http';

/**
 * Ping the Split Analytics API to verify connection and API key validity
 */
declare function ping(config: TrackerConfig): Promise<PingResponse>;
/**
 * Express/Node.js middleware for crawler tracking
=======
/**
 * @split.dev/analytics
 * Simple AI crawler tracking for any website
 * Zero external dependencies, lightweight, reliable
>>>>>>> 8236b93 (fixed package)
 */
interface SplitConfig {
    /** Your Split Analytics API key */
    apiKey: string;
    /** Custom API endpoint (optional) */
    apiEndpoint?: string;
    /** Enable debug logging */
    debug?: boolean;
}
interface PingResponse {
    status: 'ok' | 'error';
    message?: string;
    connection?: {
        authenticated: boolean;
        keyName: string;
        workspace: string;
        domain: string | null;
    };
    timestamp?: string;
}
interface CrawlerVisit {
    url: string;
    userAgent: string;
    timestamp: string;
    crawler?: {
        name: string;
        company: string;
        category: string;
    };
    metadata?: {
        method?: string;
        statusCode?: number;
        responseTime?: number;
        [key: string]: any;
    };
}
declare class SplitAnalytics {
    private config;
    constructor(config: SplitConfig);
    /**
     * Test connection to Split Analytics API
     */
    ping(): Promise<PingResponse>;
    /**
     * Track a crawler visit
     */
    track(visit: Omit<CrawlerVisit, 'timestamp'>): Promise<boolean>;
    /**
     * Automatically detect and track crawler from request
     */
    autoTrack(request: {
        url: string;
        userAgent: string | null;
        method?: string;
        statusCode?: number;
        responseTime?: number;
    }): Promise<boolean>;
}
/**
 * Create a new Split Analytics instance
 */
declare function createSplit(config: SplitConfig): SplitAnalytics;
/**
 * Quick ping function without creating an instance
 */
declare function ping(config: SplitConfig): Promise<PingResponse>;
/**
 * Quick track function without creating an instance
 */
declare function track(config: SplitConfig, visit: Omit<CrawlerVisit, 'timestamp'>): Promise<boolean>;
/**
 * Detect if a user agent is an AI crawler
 */
declare function isAICrawler(userAgent: string | null): boolean;
/**
 * Get crawler information from user agent
 */
declare function getCrawlerInfo(userAgent: string | null): {
    readonly name: "GPTBot";
    readonly company: "OpenAI";
    readonly category: "ai-training";
} | {
    readonly name: "ChatGPT-User";
    readonly company: "OpenAI";
    readonly category: "ai-assistant";
} | {
    readonly name: "OAI-SearchBot";
    readonly company: "OpenAI";
    readonly category: "ai-search";
} | {
    readonly name: "Claude-Web";
    readonly company: "Anthropic";
    readonly category: "ai-assistant";
} | {
    readonly name: "ClaudeBot";
    readonly company: "Anthropic";
    readonly category: "ai-training";
} | {
    readonly name: "anthropic-ai";
    readonly company: "Anthropic";
    readonly category: "ai-training";
} | {
    readonly name: "Google-Extended";
    readonly company: "Google";
    readonly category: "ai-training";
} | {
    readonly name: "Googlebot";
    readonly company: "Google";
    readonly category: "search-ai";
} | {
    readonly name: "Googlebot-Image";
    readonly company: "Google";
    readonly category: "search-ai";
} | {
    readonly name: "Googlebot-News";
    readonly company: "Google";
    readonly category: "search-ai";
} | {
    readonly name: "Bingbot";
    readonly company: "Microsoft";
    readonly category: "search-ai";
} | {
    readonly name: "msnbot";
    readonly company: "Microsoft";
    readonly category: "search-ai";
} | {
    readonly name: "BingPreview";
    readonly company: "Microsoft";
    readonly category: "search-ai";
} | {
    readonly name: "PerplexityBot";
    readonly company: "Perplexity";
    readonly category: "ai-search";
} | {
    readonly name: "FacebookBot";
    readonly company: "Meta";
    readonly category: "social-ai";
} | {
    readonly name: "facebookexternalhit";
    readonly company: "Meta";
    readonly category: "social-ai";
} | {
    readonly name: "Meta-ExternalAgent";
    readonly company: "Meta";
    readonly category: "ai-training";
} | {
    readonly name: "YouBot";
    readonly company: "You.com";
    readonly category: "ai-search";
} | {
    readonly name: "Neeva";
    readonly company: "Neeva";
    readonly category: "ai-search";
} | {
    readonly name: "Phind";
    readonly company: "Phind";
    readonly category: "ai-search";
} | {
    readonly name: "Bytespider";
    readonly company: "ByteDance";
    readonly category: "ai-training";
} | {
    readonly name: "Baiduspider";
    readonly company: "Baidu";
    readonly category: "search-ai";
} | {
    readonly name: "Sogou";
    readonly company: "Sogou";
    readonly category: "search-ai";
} | {
    readonly name: "Amazonbot";
    readonly company: "Amazon";
    readonly category: "ai-assistant";
} | {
    readonly name: "LinkedInBot";
    readonly company: "LinkedIn";
    readonly category: "social-ai";
} | {
    readonly name: "Twitterbot";
    readonly company: "Twitter";
    readonly category: "social-ai";
} | {
    readonly name: "Applebot";
    readonly company: "Apple";
    readonly category: "search-ai";
} | {
    readonly name: "Applebot-Extended";
    readonly company: "Apple";
    readonly category: "ai-training";
} | {
    readonly name: "Diffbot";
    readonly company: "Diffbot";
    readonly category: "ai-extraction";
} | {
    readonly name: "DataForSeoBot";
    readonly company: "DataForSEO";
    readonly category: "ai-extraction";
} | {
    readonly name: "SemrushBot";
    readonly company: "Semrush";
    readonly category: "ai-extraction";
} | {
    readonly name: "AhrefsBot";
    readonly company: "Ahrefs";
    readonly category: "ai-extraction";
} | {
    readonly name: "CCBot";
    readonly company: "Common Crawl";
    readonly category: "ai-training";
} | {
    readonly name: "ia_archiver";
    readonly company: "Internet Archive";
    readonly category: "archival";
} | {
    readonly name: "PetalBot";
    readonly company: "Petal Search";
    readonly category: "search-ai";
} | {
    readonly name: "SeznamBot";
    readonly company: "Seznam";
    readonly category: "search-ai";
} | {
    readonly name: "YandexBot";
    readonly company: "Yandex";
    readonly category: "search-ai";
} | {
    readonly name: "DuckDuckBot";
    readonly company: "DuckDuckGo";
    readonly category: "search-ai";
} | {
    readonly name: "Qwantify";
    readonly company: "Qwant";
    readonly category: "search-ai";
} | null;

<<<<<<< HEAD
export { PingResponse, TrackerConfig, createNodeMiddleware, ping, trackCrawler };
=======
export { type CrawlerVisit, type PingResponse, SplitAnalytics, type SplitConfig, createSplit, getCrawlerInfo, isAICrawler, ping, track };
>>>>>>> 8236b93 (fixed package)
