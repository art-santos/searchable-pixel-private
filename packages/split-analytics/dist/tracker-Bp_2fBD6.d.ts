declare const AI_CRAWLERS: {
    readonly GPTBot: {
        readonly company: "OpenAI";
        readonly bot: "GPTBot";
        readonly category: "ai-training";
    };
    readonly 'ChatGPT-User': {
        readonly company: "OpenAI";
        readonly bot: "ChatGPT-User";
        readonly category: "ai-assistant";
    };
    readonly 'OAI-SearchBot': {
        readonly company: "OpenAI";
        readonly bot: "OAI-SearchBot";
        readonly category: "ai-search";
    };
    readonly 'Claude-Web': {
        readonly company: "Anthropic";
        readonly bot: "Claude-Web";
        readonly category: "ai-assistant";
    };
    readonly ClaudeBot: {
        readonly company: "Anthropic";
        readonly bot: "ClaudeBot";
        readonly category: "ai-training";
    };
    readonly 'anthropic-ai': {
        readonly company: "Anthropic";
        readonly bot: "anthropic-ai";
        readonly category: "ai-training";
    };
    readonly 'Google-Extended': {
        readonly company: "Google";
        readonly bot: "Google-Extended";
        readonly category: "ai-training";
    };
    readonly Googlebot: {
        readonly company: "Google";
        readonly bot: "Googlebot";
        readonly category: "search-ai";
    };
    readonly 'Googlebot-Image': {
        readonly company: "Google";
        readonly bot: "Googlebot-Image";
        readonly category: "search-ai";
    };
    readonly 'Googlebot-News': {
        readonly company: "Google";
        readonly bot: "Googlebot-News";
        readonly category: "search-ai";
    };
    readonly 'Google-InspectionTool': {
        readonly company: "Google";
        readonly bot: "Google-InspectionTool";
        readonly category: "search-ai";
    };
    readonly Bingbot: {
        readonly company: "Microsoft";
        readonly bot: "Bingbot";
        readonly category: "search-ai";
    };
    readonly msnbot: {
        readonly company: "Microsoft";
        readonly bot: "msnbot";
        readonly category: "search-ai";
    };
    readonly BingPreview: {
        readonly company: "Microsoft";
        readonly bot: "BingPreview";
        readonly category: "search-ai";
    };
    readonly PerplexityBot: {
        readonly company: "Perplexity";
        readonly bot: "PerplexityBot";
        readonly category: "ai-search";
    };
    readonly FacebookBot: {
        readonly company: "Meta";
        readonly bot: "FacebookBot";
        readonly category: "social-ai";
    };
    readonly facebookexternalhit: {
        readonly company: "Meta";
        readonly bot: "facebookexternalhit";
        readonly category: "social-ai";
    };
    readonly 'Meta-ExternalAgent': {
        readonly company: "Meta";
        readonly bot: "Meta-ExternalAgent";
        readonly category: "ai-training";
    };
    readonly YouBot: {
        readonly company: "You.com";
        readonly bot: "YouBot";
        readonly category: "ai-search";
    };
    readonly Neeva: {
        readonly company: "Neeva";
        readonly bot: "Neeva";
        readonly category: "ai-search";
    };
    readonly Phind: {
        readonly company: "Phind";
        readonly bot: "Phind";
        readonly category: "ai-search";
    };
    readonly Bytespider: {
        readonly company: "ByteDance";
        readonly bot: "Bytespider";
        readonly category: "ai-training";
    };
    readonly Baiduspider: {
        readonly company: "Baidu";
        readonly bot: "Baiduspider";
        readonly category: "search-ai";
    };
    readonly Sogou: {
        readonly company: "Sogou";
        readonly bot: "Sogou";
        readonly category: "search-ai";
    };
    readonly Amazonbot: {
        readonly company: "Amazon";
        readonly bot: "Amazonbot";
        readonly category: "ai-assistant";
    };
    readonly LinkedInBot: {
        readonly company: "LinkedIn";
        readonly bot: "LinkedInBot";
        readonly category: "social-ai";
    };
    readonly Twitterbot: {
        readonly company: "Twitter";
        readonly bot: "Twitterbot";
        readonly category: "social-ai";
    };
    readonly Applebot: {
        readonly company: "Apple";
        readonly bot: "Applebot";
        readonly category: "search-ai";
    };
    readonly 'Applebot-Extended': {
        readonly company: "Apple";
        readonly bot: "Applebot-Extended";
        readonly category: "ai-training";
    };
    readonly Diffbot: {
        readonly company: "Diffbot";
        readonly bot: "Diffbot";
        readonly category: "ai-extraction";
    };
    readonly DataForSeoBot: {
        readonly company: "DataForSEO";
        readonly bot: "DataForSeoBot";
        readonly category: "ai-extraction";
    };
    readonly SemrushBot: {
        readonly company: "Semrush";
        readonly bot: "SemrushBot";
        readonly category: "ai-extraction";
    };
    readonly AhrefsBot: {
        readonly company: "Ahrefs";
        readonly bot: "AhrefsBot";
        readonly category: "ai-extraction";
    };
    readonly CCBot: {
        readonly company: "Common Crawl";
        readonly bot: "CCBot";
        readonly category: "ai-training";
    };
    readonly ia_archiver: {
        readonly company: "Internet Archive";
        readonly bot: "ia_archiver";
        readonly category: "archival";
    };
    readonly PetalBot: {
        readonly company: "Petal Search";
        readonly bot: "PetalBot";
        readonly category: "search-ai";
    };
    readonly SeznamBot: {
        readonly company: "Seznam";
        readonly bot: "SeznamBot";
        readonly category: "search-ai";
    };
    readonly Yandex: {
        readonly company: "Yandex";
        readonly bot: "YandexBot";
        readonly category: "search-ai";
    };
    readonly DuckDuckBot: {
        readonly company: "DuckDuckGo";
        readonly bot: "DuckDuckBot";
        readonly category: "search-ai";
    };
    readonly Qwantify: {
        readonly company: "Qwant";
        readonly bot: "Qwantify";
        readonly category: "search-ai";
    };
};
type CrawlerInfo = typeof AI_CRAWLERS[keyof typeof AI_CRAWLERS];

interface UnknownCrawlerInfo {
    company: string;
    bot: string;
    category: string;
}
interface CrawlerDetectionResult {
    isAICrawler: boolean;
    crawler?: CrawlerInfo | UnknownCrawlerInfo;
    userAgent: string;
}
/**
 * Detects if a user agent string belongs to an AI crawler
 */
declare function detectAICrawler(userAgent: string | null): CrawlerDetectionResult;
/**
 * Extract additional metadata from the request
 */
declare function extractRequestMetadata(request: {
    headers: Record<string, string | string[] | undefined>;
    url?: string;
    method?: string;
}): Record<string, any>;

interface CrawlerEvent {
    timestamp: string;
    domain: string;
    path: string;
    crawlerName: string;
    crawlerCompany: string;
    crawlerCategory: string;
    userAgent: string;
    statusCode?: number;
    responseTimeMs?: number;
    country?: string;
    metadata?: Record<string, any>;
}
interface TrackerConfig {
    apiKey: string;
    apiEndpoint?: string;
    batchSize?: number;
    batchIntervalMs?: number;
    debug?: boolean;
    onError?: (error: Error) => void;
}
interface PingResponse {
    status: 'ok' | 'error';
    connection?: {
        authenticated: boolean;
        keyName: string;
        workspace: string;
        domain: string | null;
    };
    message?: string;
    timestamp?: string;
}
declare class CrawlerTracker {
    private config;
    private eventQueue;
    private batchTimer;
    private isSending;
    constructor(config: TrackerConfig);
    /**
     * Track a crawler visit
     */
    track(event: Omit<CrawlerEvent, 'timestamp'>): Promise<void>;
    /**
     * Create a tracking event from request data
     */
    createEvent(crawler: CrawlerInfo | UnknownCrawlerInfo, request: {
        url: string;
        headers: Record<string, string | string[] | undefined>;
        statusCode?: number;
        responseTimeMs?: number;
    }, metadata?: Record<string, any>): Omit<CrawlerEvent, 'timestamp'>;
    /**
     * Schedule a batch send
     */
    private scheduleBatch;
    /**
     * Send all queued events
     */
    flush(): Promise<void>;
    /**
     * Send a batch of events with retry logic
     */
    private sendBatch;
    /**
     * Helper to get header value
     */
    private getHeaderValue;
    /**
     * Cleanup resources
     */
    destroy(): void;
    /**
     * Ping the API to verify connection and API key validity
     */
    ping(): Promise<PingResponse>;
}

export { AI_CRAWLERS as A, CrawlerTracker as C, type PingResponse as P, type TrackerConfig as T, type UnknownCrawlerInfo as U, type CrawlerDetectionResult as a, type CrawlerEvent as b, type CrawlerInfo as c, detectAICrawler as d, extractRequestMetadata as e };
