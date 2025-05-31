<<<<<<< HEAD
import { T as TrackerConfig, P as PingResponse } from './tracker-Bp_2fBD6.js';
export { A as AI_CRAWLERS, a as CrawlerDetectionResult, b as CrawlerEvent, c as CrawlerInfo, C as CrawlerTracker, U as UnknownCrawlerInfo, d as detectAICrawler, e as extractRequestMetadata } from './tracker-Bp_2fBD6.js';
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
export interface SplitConfig {
    /** Your Split Analytics API key */
    apiKey: string;
    /** Custom API endpoint (optional) */
    apiEndpoint?: string;
    /** Enable debug logging */
    debug?: boolean;
}
export interface PingResponse {
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
export interface CrawlerInfo {
    /** Crawler name (e.g., 'GPTBot') */
    name: string;
    /** Company that owns the crawler (e.g., 'OpenAI') */
    company: string;
    /** Category of the crawler */
    category: 'ai-training' | 'ai-assistant' | 'ai-search' | 'search-ai' | 'social-ai' | 'ai-extraction' | 'archival';
}
export interface CrawlerVisit {
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
export interface TrackingEvent extends Omit<CrawlerVisit, 'timestamp'> {
}
export interface AutoTrackOptions {
    /** Full URL that was visited */
    url: string;
    /** User agent string (can be null) */
    userAgent: string | null;
    /** HTTP method used */
    method?: string;
    /** HTTP status code returned */
    statusCode?: number;
<<<<<<< HEAD
    responseTimeMs?: number;
}): Promise<boolean>;

export { PingResponse, TrackerConfig, createNodeMiddleware, ping, trackCrawler };
=======
    /** Response time in milliseconds */
    responseTime?: number;
}
export interface ISplitAnalytics {
    ping(): Promise<PingResponse>;
    track(visit: TrackingEvent): Promise<boolean>;
    autoTrack(options: AutoTrackOptions): Promise<boolean>;
    isAICrawler(userAgent: string | null): boolean;
    getCrawlerInfo(userAgent: string | null): CrawlerInfo | null;
}
export declare class SplitAnalytics implements ISplitAnalytics {
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
export declare function createSplit(config: SplitConfig): SplitAnalytics;
/**
 * Quick ping function without creating an instance
 */
export declare function ping(config: SplitConfig): Promise<PingResponse>;
/**
 * Quick track function without creating an instance
 */
export declare function track(config: SplitConfig, visit: TrackingEvent): Promise<boolean>;
/**
 * Detect if a user agent is an AI crawler
 */
export declare function isAICrawler(userAgent: string | null): boolean;
/**
 * Get crawler information from user agent
 */
export declare function getCrawlerInfo(userAgent: string | null): CrawlerInfo | null;
/**
 * Test utility to verify package installation and basic functionality
 * This is primarily for debugging and integration testing
 */
export declare function testInstallation(config?: Partial<SplitConfig>): Promise<{
    packageImport: boolean;
    crawlerDetection: boolean;
    apiConnection: boolean;
    apiConnectionDetails?: PingResponse;
}>;
>>>>>>> 8236b93 (fixed package)
