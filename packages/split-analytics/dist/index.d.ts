import { T as TrackerConfig } from './tracker-DfCdcMfe.js';
export { A as AI_CRAWLERS, a as CrawlerDetectionResult, b as CrawlerEvent, c as CrawlerInfo, C as CrawlerTracker, U as UnknownCrawlerInfo, d as detectAICrawler, e as extractRequestMetadata } from './tracker-DfCdcMfe.js';
import { IncomingMessage, ServerResponse } from 'http';

/**
 * Express/Node.js middleware for crawler tracking
 */
declare function createNodeMiddleware(config: TrackerConfig): (req: IncomingMessage & {
    url?: string;
}, res: ServerResponse, next: () => void) => void;
/**
 * Simple tracking function for custom implementations
 */
declare function trackCrawler(config: TrackerConfig, request: {
    url: string;
    userAgent: string;
    headers?: Record<string, string | string[] | undefined>;
    statusCode?: number;
    responseTimeMs?: number;
}): Promise<boolean>;

export { TrackerConfig, createNodeMiddleware, trackCrawler };
