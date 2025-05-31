import { NextRequest, NextResponse } from 'next/server';
import { T as TrackerConfig, c as CrawlerInfo, U as UnknownCrawlerInfo } from './tracker-DfCdcMfe.js';

interface MiddlewareConfig extends TrackerConfig {
    exclude?: string[];
    include?: string[];
    addCrawlerHeaders?: boolean;
    onCrawlerDetected?: (request: NextRequest, crawler: CrawlerInfo | UnknownCrawlerInfo) => void | Promise<void>;
}
/**
 * Create Next.js middleware for AI crawler tracking
 */
declare function createCrawlerMiddleware(config: MiddlewareConfig): (request: NextRequest) => Promise<NextResponse<unknown>>;
/**
 * Cleanup function to call when shutting down
 */
declare function destroyTracker(): void;

export { type MiddlewareConfig, createCrawlerMiddleware, destroyTracker };
