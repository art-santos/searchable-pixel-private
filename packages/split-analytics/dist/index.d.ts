/**
 * @split.dev/analytics
 * Simple AI crawler tracking for any website
 * Zero external dependencies, lightweight, reliable
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
        plan?: string;
    };
    timestamp?: string;
}
interface CrawlerInfo {
    /** Crawler name (e.g., 'GPTBot') */
    name: string;
    /** Company that owns the crawler (e.g., 'OpenAI') */
    company: string;
    /** Category of the crawler */
    category: 'ai-training' | 'ai-assistant' | 'ai-search' | 'search-ai' | 'social-ai' | 'ai-extraction' | 'archival';
}
interface CrawlerVisit {
    /** Full URL that was visited */
    url: string;
    /** User agent string */
    userAgent: string;
    /** ISO timestamp of the visit */
    timestamp: string;
    /** Detected crawler information */
    crawler?: CrawlerInfo;
    /** Additional metadata about the request */
    metadata?: {
        method?: string;
        statusCode?: number;
        responseTime?: number;
        pathname?: string;
        [key: string]: any;
    };
}
interface TrackingEvent extends Omit<CrawlerVisit, 'timestamp'> {
}
interface AutoTrackOptions {
    /** Full URL that was visited */
    url: string;
    /** User agent string (can be null) */
    userAgent: string | null;
    /** HTTP method used */
    method?: string;
    /** HTTP status code returned */
    statusCode?: number;
    /** Response time in milliseconds */
    responseTime?: number;
}
interface ISplitAnalytics {
    ping(): Promise<PingResponse>;
    track(visit: TrackingEvent): Promise<boolean>;
    autoTrack(options: AutoTrackOptions): Promise<boolean>;
    isAICrawler(userAgent: string | null): boolean;
    getCrawlerInfo(userAgent: string | null): CrawlerInfo | null;
}
declare class SplitAnalytics implements ISplitAnalytics {
    private config;
    constructor(config: SplitConfig);
    /**
     * Test connection to Split Analytics API
     */
    ping(): Promise<PingResponse>;
    /**
     * Track a crawler visit
     */
    track(visit: TrackingEvent): Promise<boolean>;
    /**
     * Automatically detect and track crawler from request
     */
    autoTrack(options: AutoTrackOptions): Promise<boolean>;
    isAICrawler(userAgent: string | null): boolean;
    getCrawlerInfo(userAgent: string | null): CrawlerInfo | null;
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
declare function track(config: SplitConfig, visit: TrackingEvent): Promise<boolean>;
/**
 * Detect if a user agent is an AI crawler
 */
declare function isAICrawler(userAgent: string | null): boolean;
/**
 * Get crawler information from user agent
 */
declare function getCrawlerInfo(userAgent: string | null): CrawlerInfo | null;
/**
 * Test utility to verify package installation and basic functionality
 * This is primarily for debugging and integration testing
 */
declare function testInstallation(config?: Partial<SplitConfig>): Promise<{
    packageImport: boolean;
    crawlerDetection: boolean;
    apiConnection: boolean;
    apiConnectionDetails?: PingResponse;
}>;

export { type AutoTrackOptions, type CrawlerInfo, type CrawlerVisit, type ISplitAnalytics, type PingResponse, SplitAnalytics, type SplitConfig, type TrackingEvent, createSplit, getCrawlerInfo, isAICrawler, ping, testInstallation, track };
