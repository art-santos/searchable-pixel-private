<<<<<<< HEAD
"use strict";var y=Object.defineProperty;var v=Object.getOwnPropertyDescriptor;var B=Object.getOwnPropertyNames;var k=Object.prototype.hasOwnProperty;var R=(o,e)=>{for(var t in e)y(o,t,{get:e[t],enumerable:!0})},x=(o,e,t,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of B(e))!k.call(o,a)&&a!==t&&y(o,a,{get:()=>e[a],enumerable:!(r=v(e,a))||r.enumerable});return o};var P=o=>x(y({},"__esModule",{value:!0}),o);var G={};R(G,{AI_CRAWLERS:()=>l,CrawlerTracker:()=>i,createNodeMiddleware:()=>D,detectAICrawler:()=>s,extractRequestMetadata:()=>c,ping:()=>M,trackCrawler:()=>_});module.exports=P(G);var l={GPTBot:{company:"OpenAI",bot:"GPTBot",category:"ai-training"},"ChatGPT-User":{company:"OpenAI",bot:"ChatGPT-User",category:"ai-assistant"},"OAI-SearchBot":{company:"OpenAI",bot:"OAI-SearchBot",category:"ai-search"},"Claude-Web":{company:"Anthropic",bot:"Claude-Web",category:"ai-assistant"},ClaudeBot:{company:"Anthropic",bot:"ClaudeBot",category:"ai-training"},"anthropic-ai":{company:"Anthropic",bot:"anthropic-ai",category:"ai-training"},"Google-Extended":{company:"Google",bot:"Google-Extended",category:"ai-training"},Googlebot:{company:"Google",bot:"Googlebot",category:"search-ai"},"Googlebot-Image":{company:"Google",bot:"Googlebot-Image",category:"search-ai"},"Googlebot-News":{company:"Google",bot:"Googlebot-News",category:"search-ai"},"Google-InspectionTool":{company:"Google",bot:"Google-InspectionTool",category:"search-ai"},Bingbot:{company:"Microsoft",bot:"Bingbot",category:"search-ai"},msnbot:{company:"Microsoft",bot:"msnbot",category:"search-ai"},BingPreview:{company:"Microsoft",bot:"BingPreview",category:"search-ai"},PerplexityBot:{company:"Perplexity",bot:"PerplexityBot",category:"ai-search"},FacebookBot:{company:"Meta",bot:"FacebookBot",category:"social-ai"},facebookexternalhit:{company:"Meta",bot:"facebookexternalhit",category:"social-ai"},"Meta-ExternalAgent":{company:"Meta",bot:"Meta-ExternalAgent",category:"ai-training"},YouBot:{company:"You.com",bot:"YouBot",category:"ai-search"},Neeva:{company:"Neeva",bot:"Neeva",category:"ai-search"},Phind:{company:"Phind",bot:"Phind",category:"ai-search"},Bytespider:{company:"ByteDance",bot:"Bytespider",category:"ai-training"},Baiduspider:{company:"Baidu",bot:"Baiduspider",category:"search-ai"},Sogou:{company:"Sogou",bot:"Sogou",category:"search-ai"},Amazonbot:{company:"Amazon",bot:"Amazonbot",category:"ai-assistant"},LinkedInBot:{company:"LinkedIn",bot:"LinkedInBot",category:"social-ai"},Twitterbot:{company:"Twitter",bot:"Twitterbot",category:"social-ai"},Applebot:{company:"Apple",bot:"Applebot",category:"search-ai"},"Applebot-Extended":{company:"Apple",bot:"Applebot-Extended",category:"ai-training"},Diffbot:{company:"Diffbot",bot:"Diffbot",category:"ai-extraction"},DataForSeoBot:{company:"DataForSEO",bot:"DataForSeoBot",category:"ai-extraction"},SemrushBot:{company:"Semrush",bot:"SemrushBot",category:"ai-extraction"},AhrefsBot:{company:"Ahrefs",bot:"AhrefsBot",category:"ai-extraction"},CCBot:{company:"Common Crawl",bot:"CCBot",category:"ai-training"},ia_archiver:{company:"Internet Archive",bot:"ia_archiver",category:"archival"},PetalBot:{company:"Petal Search",bot:"PetalBot",category:"search-ai"},SeznamBot:{company:"Seznam",bot:"SeznamBot",category:"search-ai"},Yandex:{company:"Yandex",bot:"YandexBot",category:"search-ai"},DuckDuckBot:{company:"DuckDuckGo",bot:"DuckDuckBot",category:"search-ai"},Qwantify:{company:"Qwant",bot:"Qwantify",category:"search-ai"}},h="https://split.dev/api/crawler-events",u=10,d=5e3,m=3,f=1e3;function s(o){if(!o)return{isAICrawler:!1,userAgent:""};for(let[r,a]of Object.entries(l))if(o.includes(r))return{isAICrawler:!0,crawler:a,userAgent:o};let e=o.toLowerCase(),t=["ai-crawler","ai-bot","llm-crawler","training-bot","ml-bot"];for(let r of t)if(e.includes(r))return{isAICrawler:!0,crawler:{company:"Unknown",bot:r,category:"unknown"},userAgent:o};return{isAICrawler:!1,userAgent:o}}function c(o){let e={},t=o.headers.referer||o.headers.referrer;t&&(e.referer=Array.isArray(t)?t[0]:t);let r=o.headers.accept;r&&(e.accept=Array.isArray(r)?r.join(", "):r);let a=o.headers["accept-encoding"];a&&(e.acceptEncoding=Array.isArray(a)?a.join(", "):a);let n=o.headers["accept-language"];return n&&(e.acceptLanguage=Array.isArray(n)?n[0]:n),e}var i=class{constructor(e){this.eventQueue=[];this.batchTimer=null;this.isSending=!1;this.config={apiKey:e.apiKey,apiEndpoint:e.apiEndpoint||h,batchSize:e.batchSize||u,batchIntervalMs:e.batchIntervalMs||d,debug:e.debug||!1,onError:e.onError||(t=>console.error("[Split Analytics]",t))}}async track(e){let t={...e,timestamp:new Date().toISOString()};this.eventQueue.push(t),this.config.debug&&console.log("[Split Analytics] Event queued:",t),this.eventQueue.length>=this.config.batchSize?await this.flush():this.scheduleBatch()}createEvent(e,t,r){let a=new URL(t.url);return{domain:a.hostname,path:a.pathname,crawlerName:e.bot,crawlerCompany:e.company,crawlerCategory:e.category,userAgent:this.getHeaderValue(t.headers["user-agent"])||"",statusCode:t.statusCode,responseTimeMs:t.responseTimeMs,metadata:r}}scheduleBatch(){this.batchTimer||(this.batchTimer=setTimeout(async()=>{this.batchTimer=null,this.eventQueue.length>0&&await this.flush()},this.config.batchIntervalMs))}async flush(){if(this.isSending||this.eventQueue.length===0)return;this.isSending=!0;let e=[...this.eventQueue];this.eventQueue=[];try{await this.sendBatch(e)}catch(t){this.eventQueue.unshift(...e),this.config.onError(t)}finally{this.isSending=!1}}async sendBatch(e,t=1){try{let r=await fetch(this.config.apiEndpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.apiKey}`,"X-Split-Version":"0.1.0"},body:JSON.stringify({events:e})});if(!r.ok)throw new Error(`API error: ${r.status} ${r.statusText}`);this.config.debug&&console.log(`[Split Analytics] Sent ${e.length} events`)}catch(r){if(t<m){let a=f*Math.pow(2,t-1);return this.config.debug&&console.log(`[Split Analytics] Retry attempt ${t} after ${a}ms`),await new Promise(n=>setTimeout(n,a)),this.sendBatch(e,t+1)}throw r}}getHeaderValue(e){if(e)return Array.isArray(e)?e[0]:e}destroy(){this.batchTimer&&(clearTimeout(this.batchTimer),this.batchTimer=null),this.flush().catch(()=>{})}async ping(){try{let e=this.config.apiEndpoint.replace(/\/events$/,"/ping"),t=await fetch(e,{method:"GET",headers:{Authorization:`Bearer ${this.config.apiKey}`,"X-Split-Version":"0.1.0"}}),r=await t.json();return t.ok?(this.config.debug&&console.log("[Split Analytics] Ping successful:",r),r):{status:"error",message:r.message||`API error: ${t.status}`}}catch(e){return this.config.debug&&console.error("[Split Analytics] Ping failed:",e),{status:"error",message:e instanceof Error?e.message:"Connection failed"}}}};async function M(o){let e=new i(o),t=await e.ping();return e.destroy(),t}function D(o){let e=new i(o);return function(r,a,n){let b=Date.now();try{let g=r.headers["user-agent"]||"",p=s(g);if(!p.isAICrawler||!p.crawler)return n();let w=p.crawler,A=a.end;a.end=function(...C){let T=Date.now()-b,E=`${r.headers.host}${r.url}`,I=e.createEvent(w,{url:E,headers:r.headers,statusCode:a.statusCode,responseTimeMs:T},c({headers:r.headers}));return e.track(I).catch(S=>{o.debug&&console.error("[Split Analytics] Failed to track event:",S)}),A.apply(this,C)},n()}catch(g){o.debug&&console.error("[Split Analytics] Middleware error:",g),n()}}}async function _(o,e){let t=s(e.userAgent);if(!t.isAICrawler||!t.crawler)return!1;let r=new i(o),a=r.createEvent(t.crawler,{url:e.url,headers:{"user-agent":e.userAgent,...e.headers||{}},statusCode:e.statusCode,responseTimeMs:e.responseTimeMs},e.headers?c({headers:e.headers}):void 0);return await r.track(a),r.destroy(),!0}0&&(module.exports={AI_CRAWLERS,CrawlerTracker,createNodeMiddleware,detectAICrawler,extractRequestMetadata,ping,trackCrawler});
//# sourceMappingURL=index.js.map
=======
/**
 * @split.dev/analytics
 * Simple AI crawler tracking for any website
 * Zero external dependencies, lightweight, reliable
 */
// ============================================================================
// CRAWLER DETECTION - 20+ AI CRAWLERS
// ============================================================================
const AI_CRAWLERS = {
    // OpenAI (3 main crawlers)
    'GPTBot': { name: 'GPTBot', company: 'OpenAI', category: 'ai-training' },
    'ChatGPT-User': { name: 'ChatGPT-User', company: 'OpenAI', category: 'ai-assistant' },
    'OAI-SearchBot': { name: 'OAI-SearchBot', company: 'OpenAI', category: 'ai-search' },
    // Anthropic
    'Claude-Web': { name: 'Claude-Web', company: 'Anthropic', category: 'ai-assistant' },
    'ClaudeBot': { name: 'ClaudeBot', company: 'Anthropic', category: 'ai-training' },
    'anthropic-ai': { name: 'anthropic-ai', company: 'Anthropic', category: 'ai-training' },
    // Google/Alphabet
    'Google-Extended': { name: 'Google-Extended', company: 'Google', category: 'ai-training' },
    'Googlebot': { name: 'Googlebot', company: 'Google', category: 'search-ai' },
    'Googlebot-Image': { name: 'Googlebot-Image', company: 'Google', category: 'search-ai' },
    'Googlebot-News': { name: 'Googlebot-News', company: 'Google', category: 'search-ai' },
    // Microsoft
    'Bingbot': { name: 'Bingbot', company: 'Microsoft', category: 'search-ai' },
    'msnbot': { name: 'msnbot', company: 'Microsoft', category: 'search-ai' },
    'BingPreview': { name: 'BingPreview', company: 'Microsoft', category: 'search-ai' },
    // Perplexity
    'PerplexityBot': { name: 'PerplexityBot', company: 'Perplexity', category: 'ai-search' },
    // Meta/Facebook
    'FacebookBot': { name: 'FacebookBot', company: 'Meta', category: 'social-ai' },
    'facebookexternalhit': { name: 'facebookexternalhit', company: 'Meta', category: 'social-ai' },
    'Meta-ExternalAgent': { name: 'Meta-ExternalAgent', company: 'Meta', category: 'ai-training' },
    // Other AI Search Engines
    'YouBot': { name: 'YouBot', company: 'You.com', category: 'ai-search' },
    'Neeva': { name: 'Neeva', company: 'Neeva', category: 'ai-search' },
    'Phind': { name: 'Phind', company: 'Phind', category: 'ai-search' },
    // Chinese AI Companies
    'Bytespider': { name: 'Bytespider', company: 'ByteDance', category: 'ai-training' },
    'Baiduspider': { name: 'Baiduspider', company: 'Baidu', category: 'search-ai' },
    'Sogou': { name: 'Sogou', company: 'Sogou', category: 'search-ai' },
    // E-commerce & Enterprise
    'Amazonbot': { name: 'Amazonbot', company: 'Amazon', category: 'ai-assistant' },
    'LinkedInBot': { name: 'LinkedInBot', company: 'LinkedIn', category: 'social-ai' },
    'Twitterbot': { name: 'Twitterbot', company: 'Twitter', category: 'social-ai' },
    // Apple
    'Applebot': { name: 'Applebot', company: 'Apple', category: 'search-ai' },
    'Applebot-Extended': { name: 'Applebot-Extended', company: 'Apple', category: 'ai-training' },
    // Data Extraction & Analysis
    'Diffbot': { name: 'Diffbot', company: 'Diffbot', category: 'ai-extraction' },
    'DataForSeoBot': { name: 'DataForSeoBot', company: 'DataForSEO', category: 'ai-extraction' },
    'SemrushBot': { name: 'SemrushBot', company: 'Semrush', category: 'ai-extraction' },
    'AhrefsBot': { name: 'AhrefsBot', company: 'Ahrefs', category: 'ai-extraction' },
    // Common Crawl & Research
    'CCBot': { name: 'CCBot', company: 'Common Crawl', category: 'ai-training' },
    'ia_archiver': { name: 'ia_archiver', company: 'Internet Archive', category: 'archival' },
    // Other Notable AI Crawlers
    'PetalBot': { name: 'PetalBot', company: 'Petal Search', category: 'search-ai' },
    'SeznamBot': { name: 'SeznamBot', company: 'Seznam', category: 'search-ai' },
    'Yandex': { name: 'YandexBot', company: 'Yandex', category: 'search-ai' },
    'DuckDuckBot': { name: 'DuckDuckBot', company: 'DuckDuckGo', category: 'search-ai' },
    'Qwantify': { name: 'Qwantify', company: 'Qwant', category: 'search-ai' },
};
function detectCrawler(userAgent) {
    if (!userAgent)
        return null;
    for (const [key, info] of Object.entries(AI_CRAWLERS)) {
        if (userAgent.includes(key)) {
            return info;
        }
    }
    return null;
}
// ============================================================================
// CORE SPLIT ANALYTICS CLASS
// ============================================================================
export class SplitAnalytics {
    constructor(config) {
        if (!config.apiKey) {
            throw new Error('[Split Analytics] API key is required');
        }
        // Validate API key format
        if (!config.apiKey.startsWith('split_live_') && !config.apiKey.startsWith('split_test_')) {
            throw new Error('[Split Analytics] Invalid API key format. Keys should start with "split_live_" or "split_test_"');
        }
        this.config = {
            apiKey: config.apiKey,
            apiEndpoint: config.apiEndpoint || 'https://split.dev/api',
            debug: config.debug || false
        };
        if (this.config.debug) {
            console.log('[Split Analytics] Initialized with:', {
                endpoint: this.config.apiEndpoint,
                keyType: config.apiKey.startsWith('split_test_') ? 'test' : 'live',
                debug: this.config.debug
            });
        }
    }
    /**
     * Test connection to Split Analytics API
     */
    async ping() {
        try {
            // Validate API key format first
            if (!this.config.apiKey.startsWith('split_live_') && !this.config.apiKey.startsWith('split_test_')) {
                return {
                    status: 'error',
                    message: 'Invalid API key format. Keys should start with "split_live_" or "split_test_"'
                };
            }
            const response = await fetch(`${this.config.apiEndpoint}/ping`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': '@split.dev/analytics npm package'
                }
            });
            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
                }
                catch {
                    // Handle different HTTP status codes with helpful messages
                    switch (response.status) {
                        case 401:
                            errorMessage = 'Invalid API key. Check your key in the Split Analytics dashboard.';
                        case 403:
                            errorMessage = 'API key access denied. Verify your key has the correct permissions.';
                            break;
                        case 404:
                            errorMessage = 'API endpoint not found. This might be a temporary issue with the Split Analytics service.';
                            break;
                        case 429:
                            errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
                            break;
                        case 500:
                            errorMessage = 'Split Analytics server error. Please try again later.';
                            break;
                        default:
                            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                }
                if (this.config.debug) {
                    console.error('[Split Analytics] Ping failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        url: `${this.config.apiEndpoint}/ping`,
                        apiKeyPrefix: this.config.apiKey.substring(0, 12) + '...'
                    });
                }
                return {
                    status: 'error',
                    message: errorMessage
                };
            }
            const data = await response.json();
            if (this.config.debug) {
                console.log('[Split Analytics] Ping successful:', data);
            }
            return data;
        }
        catch (error) {
            let message;
            if (error instanceof TypeError && error.message.includes('fetch')) {
                message = 'Network error: Unable to connect to Split Analytics. Check your internet connection.';
            }
            else if (error instanceof Error) {
                message = `Connection error: ${error.message}`;
            }
            else {
                message = 'Unknown connection error';
            }
            if (this.config.debug) {
                console.error('[Split Analytics] Ping failed:', {
                    error,
                    endpoint: `${this.config.apiEndpoint}/ping`,
                    apiKeyPrefix: this.config.apiKey.substring(0, 12) + '...'
                });
            }
            return {
                status: 'error',
                message,
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Track a crawler visit
     */
    async track(visit) {
        try {
            const fullVisit = {
                ...visit,
                timestamp: new Date().toISOString()
            };
            if (this.config.debug) {
                console.log('[Split Analytics] Tracking visit:', {
                    url: fullVisit.url,
                    crawler: fullVisit.crawler?.name,
                    userAgent: fullVisit.userAgent.substring(0, 50) + '...'
                });
            }
            const response = await fetch(`${this.config.apiEndpoint}/crawler-events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': '@split.dev/analytics npm package'
                },
                body: JSON.stringify({ events: [fullVisit] })
            });
            if (!response.ok) {
                if (this.config.debug) {
                    console.error('[Split Analytics] Track failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        url: fullVisit.url,
                        crawler: fullVisit.crawler?.name
                    });
                }
                return false;
            }
            if (this.config.debug) {
                console.log('[Split Analytics] Successfully tracked:', fullVisit.crawler?.name || 'unknown crawler');
            }
            return true;
        }
        catch (error) {
            if (this.config.debug) {
                console.error('[Split Analytics] Track error:', {
                    error: error instanceof Error ? error.message : error,
                    url: visit.url,
                    crawler: visit.crawler?.name
                });
            }
            return false;
        }
    }
    /**
     * Automatically detect and track crawler from request
     */
    async autoTrack(options) {
        const crawler = detectCrawler(options.userAgent);
        if (!crawler) {
            if (this.config.debug) {
                console.log('[Split Analytics] No crawler detected in user agent:', options.userAgent?.substring(0, 50) + '...');
            }
            return false; // Not a crawler, nothing to track
        }
        if (this.config.debug) {
            console.log('[Split Analytics] Auto-detected crawler:', crawler.name);
        }
        return this.track({
            url: options.url,
            userAgent: options.userAgent || '',
            crawler,
            metadata: {
                method: options.method,
                statusCode: options.statusCode,
                responseTime: options.responseTime
            }
        });
    }
    isAICrawler(userAgent) {
        return detectCrawler(userAgent) !== null;
    }
    getCrawlerInfo(userAgent) {
        return detectCrawler(userAgent);
    }
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Create a new Split Analytics instance
 */
export function createSplit(config) {
    return new SplitAnalytics(config);
}
/**
 * Quick ping function without creating an instance
 */
export async function ping(config) {
    const split = new SplitAnalytics(config);
    return split.ping();
}
/**
 * Quick track function without creating an instance
 */
export async function track(config, visit) {
    const split = new SplitAnalytics(config);
    return split.track(visit);
}
/**
 * Detect if a user agent is an AI crawler
 */
export function isAICrawler(userAgent) {
    return detectCrawler(userAgent) !== null;
}
/**
 * Get crawler information from user agent
 */
export function getCrawlerInfo(userAgent) {
    return detectCrawler(userAgent);
}
/**
 * Test utility to verify package installation and basic functionality
 * This is primarily for debugging and integration testing
 */
export async function testInstallation(config) {
    const result = {
        packageImport: true, // If we got here, import worked
        crawlerDetection: false,
        apiConnection: false,
        apiConnectionDetails: undefined
    };
    try {
        // Test crawler detection
        const testUserAgent = 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)';
        const isCrawler = isAICrawler(testUserAgent);
        const crawlerInfo = getCrawlerInfo(testUserAgent);
        result.crawlerDetection = isCrawler && crawlerInfo?.name === 'GPTBot';
        // Test API connection if config provided
        if (config?.apiKey) {
            const pingResult = await ping({
                apiKey: config.apiKey,
                apiEndpoint: config.apiEndpoint,
                debug: config.debug
            });
            result.apiConnection = pingResult.status === 'ok';
            result.apiConnectionDetails = pingResult;
        }
    }
    catch (error) {
        // Tests failed, but at least package import worked
    }
    return result;
}
>>>>>>> 8236b93 (fixed package)
