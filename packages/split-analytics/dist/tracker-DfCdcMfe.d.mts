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
    readonly CCBot: {
        readonly company: "Common Crawl";
        readonly bot: "CCBot";
        readonly category: "ai-training";
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
    readonly Bingbot: {
        readonly company: "Microsoft";
        readonly bot: "Bingbot";
        readonly category: "search-ai";
    };
    readonly PerplexityBot: {
        readonly company: "Perplexity";
        readonly bot: "PerplexityBot";
        readonly category: "ai-search";
    };
    readonly YouBot: {
        readonly company: "You.com";
        readonly bot: "YouBot";
        readonly category: "ai-search";
    };
    readonly Bytespider: {
        readonly company: "ByteDance";
        readonly bot: "Bytespider";
        readonly category: "ai-training";
    };
    readonly Diffbot: {
        readonly company: "Diffbot";
        readonly bot: "Diffbot";
        readonly category: "ai-extraction";
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
    readonly Amazonbot: {
        readonly company: "Amazon";
        readonly bot: "Amazonbot";
        readonly category: "ai-assistant";
    };
    readonly Applebot: {
        readonly company: "Apple";
        readonly bot: "Applebot";
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
}

export { AI_CRAWLERS as A, CrawlerTracker as C, type TrackerConfig as T, type UnknownCrawlerInfo as U, type CrawlerDetectionResult as a, type CrawlerEvent as b, type CrawlerInfo as c, detectAICrawler as d, extractRequestMetadata as e };
