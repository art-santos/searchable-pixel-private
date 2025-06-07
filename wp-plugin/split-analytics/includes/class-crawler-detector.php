<?php
/**
 * AI Crawler Detection Class
 */
class SplitAnalyticsCrawlerDetector {
    
    /**
     * Known AI crawlers with their information
     */
    private $crawlers = array(
        // OpenAI (3 main crawlers)
        'GPTBot' => array('name' => 'GPTBot', 'company' => 'OpenAI', 'category' => 'ai-training'),
        'ChatGPT-User' => array('name' => 'ChatGPT-User', 'company' => 'OpenAI', 'category' => 'ai-assistant'),
        'OAI-SearchBot' => array('name' => 'OAI-SearchBot', 'company' => 'OpenAI', 'category' => 'ai-search'),
        
        // Anthropic
        'Claude-Web' => array('name' => 'Claude-Web', 'company' => 'Anthropic', 'category' => 'ai-assistant'),
        'ClaudeBot' => array('name' => 'ClaudeBot', 'company' => 'Anthropic', 'category' => 'ai-training'),
        'anthropic-ai' => array('name' => 'anthropic-ai', 'company' => 'Anthropic', 'category' => 'ai-training'),
        
        // Google/Alphabet
        'Google-Extended' => array('name' => 'Google-Extended', 'company' => 'Google', 'category' => 'ai-training'),
        'Googlebot' => array('name' => 'Googlebot', 'company' => 'Google', 'category' => 'search-ai'),
        'Googlebot-Image' => array('name' => 'Googlebot-Image', 'company' => 'Google', 'category' => 'search-ai'),
        'Googlebot-News' => array('name' => 'Googlebot-News', 'company' => 'Google', 'category' => 'search-ai'),
        'Googlebot-Video' => array('name' => 'Googlebot-Video', 'company' => 'Google', 'category' => 'search-ai'),
        
        // Microsoft
        'Bingbot' => array('name' => 'Bingbot', 'company' => 'Microsoft', 'category' => 'search-ai'),
        'msnbot' => array('name' => 'msnbot', 'company' => 'Microsoft', 'category' => 'search-ai'),
        'BingPreview' => array('name' => 'BingPreview', 'company' => 'Microsoft', 'category' => 'search-ai'),
        'adidxbot' => array('name' => 'adidxbot', 'company' => 'Microsoft', 'category' => 'search-ai'),
        
        // Perplexity
        'PerplexityBot' => array('name' => 'PerplexityBot', 'company' => 'Perplexity', 'category' => 'ai-search'),
        
        // Meta/Facebook
        'FacebookBot' => array('name' => 'FacebookBot', 'company' => 'Meta', 'category' => 'social-ai'),
        'facebookexternalhit' => array('name' => 'facebookexternalhit', 'company' => 'Meta', 'category' => 'social-ai'),
        'Meta-ExternalAgent' => array('name' => 'Meta-ExternalAgent', 'company' => 'Meta', 'category' => 'ai-training'),
        
        // Other AI Search Engines
        'YouBot' => array('name' => 'YouBot', 'company' => 'You.com', 'category' => 'ai-search'),
        'Neeva' => array('name' => 'Neeva', 'company' => 'Neeva', 'category' => 'ai-search'),
        'Phind' => array('name' => 'Phind', 'company' => 'Phind', 'category' => 'ai-search'),
        
        // Chinese AI Companies
        'Bytespider' => array('name' => 'Bytespider', 'company' => 'ByteDance', 'category' => 'ai-training'),
        'Baiduspider' => array('name' => 'Baiduspider', 'company' => 'Baidu', 'category' => 'search-ai'),
        'Sogou' => array('name' => 'Sogou', 'company' => 'Sogou', 'category' => 'search-ai'),
        'YisouSpider' => array('name' => 'YisouSpider', 'company' => 'Yisou', 'category' => 'search-ai'),
        
        // E-commerce & Enterprise
        'Amazonbot' => array('name' => 'Amazonbot', 'company' => 'Amazon', 'category' => 'ai-assistant'),
        'LinkedInBot' => array('name' => 'LinkedInBot', 'company' => 'LinkedIn', 'category' => 'social-ai'),
        'Twitterbot' => array('name' => 'Twitterbot', 'company' => 'Twitter', 'category' => 'social-ai'),
        
        // Apple
        'Applebot' => array('name' => 'Applebot', 'company' => 'Apple', 'category' => 'search-ai'),
        'Applebot-Extended' => array('name' => 'Applebot-Extended', 'company' => 'Apple', 'category' => 'ai-training'),
        
        // Data Extraction & Analysis
        'Diffbot' => array('name' => 'Diffbot', 'company' => 'Diffbot', 'category' => 'ai-extraction'),
        'DataForSeoBot' => array('name' => 'DataForSeoBot', 'company' => 'DataForSEO', 'category' => 'ai-extraction'),
        'SemrushBot' => array('name' => 'SemrushBot', 'company' => 'Semrush', 'category' => 'ai-extraction'),
        'AhrefsBot' => array('name' => 'AhrefsBot', 'company' => 'Ahrefs', 'category' => 'ai-extraction'),
        'MJ12bot' => array('name' => 'MJ12bot', 'company' => 'Majestic', 'category' => 'ai-extraction'),
        
        // Common Crawl & Research
        'CCBot' => array('name' => 'CCBot', 'company' => 'Common Crawl', 'category' => 'ai-training'),
        'ia_archiver' => array('name' => 'ia_archiver', 'company' => 'Internet Archive', 'category' => 'archival'),
        'archive.org_bot' => array('name' => 'archive.org_bot', 'company' => 'Internet Archive', 'category' => 'archival'),
        
        // Other Notable AI Crawlers
        'PetalBot' => array('name' => 'PetalBot', 'company' => 'Petal Search', 'category' => 'search-ai'),
        'SeznamBot' => array('name' => 'SeznamBot', 'company' => 'Seznam', 'category' => 'search-ai'),
        'YandexBot' => array('name' => 'YandexBot', 'company' => 'Yandex', 'category' => 'search-ai'),
        'DuckDuckBot' => array('name' => 'DuckDuckBot', 'company' => 'DuckDuckGo', 'category' => 'search-ai'),
        'Qwantify' => array('name' => 'Qwantify', 'company' => 'Qwant', 'category' => 'search-ai'),
        
        // Academic and Research
        'ResearchBot' => array('name' => 'ResearchBot', 'company' => 'Research', 'category' => 'ai-training'),
        'ScholarBot' => array('name' => 'ScholarBot', 'company' => 'Scholar', 'category' => 'ai-training'),
        
        // Emerging AI Companies
        'AnthropicBot' => array('name' => 'AnthropicBot', 'company' => 'Anthropic', 'category' => 'ai-training'),
        'CohereBot' => array('name' => 'CohereBot', 'company' => 'Cohere', 'category' => 'ai-training'),
        'HuggingFaceBot' => array('name' => 'HuggingFaceBot', 'company' => 'HuggingFace', 'category' => 'ai-training'),
    );
    
    /**
     * Detect if a user agent is an AI crawler
     * 
     * @param string $userAgent The user agent string
     * @return array|false Crawler info or false if not detected
     */
    public function detectCrawler($userAgent) {
        if (empty($userAgent)) {
            return false;
        }
        
        // Check cache first
        $cache_key = 'split_crawler_' . md5($userAgent);
        $cached = wp_cache_get($cache_key, 'split_analytics');
        
        if ($cached !== false) {
            return $cached;
        }
        
        // Perform detection
        $result = $this->performDetection($userAgent);
        
        // Cache result for 5 minutes
        wp_cache_set($cache_key, $result, 'split_analytics', 300);
        
        return $result;
    }
    
    /**
     * Perform the actual crawler detection
     * 
     * @param string $userAgent The user agent string
     * @return array|false Crawler info or false if not detected
     */
    private function performDetection($userAgent) {
        // Convert to lowercase for case-insensitive matching
        $userAgentLower = strtolower($userAgent);
        
        // Check each known crawler pattern
        foreach ($this->crawlers as $pattern => $info) {
            $patternLower = strtolower($pattern);
            
            // Simple string contains check
            if (strpos($userAgentLower, $patternLower) !== false) {
                // Verify it's not a false positive by checking for common browser patterns
                if (!$this->isFalsePositive($userAgent, $pattern)) {
                    return $info;
                }
            }
        }
        
        // Check for generic AI bot patterns
        $genericPatterns = array(
            'bot', 'crawler', 'spider', 'scraper', 'agent', 'ai'
        );
        
        foreach ($genericPatterns as $genericPattern) {
            if (strpos($userAgentLower, $genericPattern) !== false) {
                // Additional checks to confirm it's an AI-related bot
                if ($this->isLikelyAIBot($userAgent)) {
                    return array(
                        'name' => 'Unknown AI Bot',
                        'company' => 'Unknown',
                        'category' => 'ai-unknown'
                    );
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if this might be a false positive
     * 
     * @param string $userAgent The user agent string
     * @param string $pattern The matched pattern
     * @return bool True if it's likely a false positive
     */
    private function isFalsePositive($userAgent, $pattern) {
        $userAgentLower = strtolower($userAgent);
        
        // Common browser patterns that might contain bot-like strings
        $browserPatterns = array(
            'mozilla/', 'chrome/', 'safari/', 'firefox/', 'edge/', 'opera/',
            'webkit', 'gecko', 'trident', 'android', 'iphone', 'ipad'
        );
        
        $browserPatternCount = 0;
        foreach ($browserPatterns as $browserPattern) {
            if (strpos($userAgentLower, $browserPattern) !== false) {
                $browserPatternCount++;
            }
        }
        
        // If it has multiple browser patterns, it's likely a real browser
        if ($browserPatternCount >= 2) {
            // But still allow some specific patterns that can appear in browsers
            $allowedInBrowsers = array('googlebot', 'bingbot', 'facebookexternalhit');
            $patternLower = strtolower($pattern);
            
            return !in_array($patternLower, $allowedInBrowsers);
        }
        
        return false;
    }
    
    /**
     * Check if this is likely an AI bot based on additional signals
     * 
     * @param string $userAgent The user agent string
     * @return bool True if it's likely an AI bot
     */
    private function isLikelyAIBot($userAgent) {
        $userAgentLower = strtolower($userAgent);
        
        // AI-related keywords
        $aiKeywords = array(
            'gpt', 'claude', 'ai', 'neural', 'machine learning', 'ml',
            'artificial intelligence', 'nlp', 'language model',
            'training', 'research', 'academic', 'crawl', 'index'
        );
        
        foreach ($aiKeywords as $keyword) {
            if (strpos($userAgentLower, $keyword) !== false) {
                return true;
            }
        }
        
        // Check for bot-like structure (simple bot user agents)
        $simpleBotPatterns = array(
            '/^[a-zA-Z]+Bot\/\d+\.\d+$/',
            '/^[a-zA-Z]+Crawler\/\d+\.\d+$/',
            '/^[a-zA-Z]+Spider\/\d+\.\d+$/',
            '/Bot\s+\d+\.\d+/',
            '/Crawler\s+\d+\.\d+/'
        );
        
        foreach ($simpleBotPatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if a user agent is an AI crawler (boolean)
     * 
     * @param string $userAgent The user agent string
     * @return bool True if it's an AI crawler
     */
    public function isAiCrawler($userAgent) {
        return $this->detectCrawler($userAgent) !== false;
    }
    
    /**
     * Get all supported crawlers
     * 
     * @return array List of all known crawlers
     */
    public function getSupportedCrawlers() {
        return $this->crawlers;
    }
    
    /**
     * Get crawlers grouped by company
     * 
     * @return array Crawlers grouped by company
     */
    public function getCrawlersByCompany() {
        $grouped = array();
        
        foreach ($this->crawlers as $pattern => $info) {
            $company = $info['company'];
            if (!isset($grouped[$company])) {
                $grouped[$company] = array();
            }
            $grouped[$company][] = $info;
        }
        
        return $grouped;
    }
    
    /**
     * Get crawlers by category
     * 
     * @return array Crawlers grouped by category
     */
    public function getCrawlersByCategory() {
        $grouped = array();
        
        foreach ($this->crawlers as $pattern => $info) {
            $category = $info['category'];
            if (!isset($grouped[$category])) {
                $grouped[$category] = array();
            }
            $grouped[$category][] = $info;
        }
        
        return $grouped;
    }
    
    /**
     * Add a custom crawler pattern
     * 
     * @param string $pattern The pattern to match in user agent
     * @param array $info Crawler information (name, company, category)
     */
    public function addCustomCrawler($pattern, $info) {
        $this->crawlers[$pattern] = $info;
    }
    
    /**
     * Get statistics about crawler types
     * 
     * @return array Statistics about different crawler categories
     */
    public function getCrawlerStatistics() {
        $stats = array(
            'total_crawlers' => count($this->crawlers),
            'by_category' => array(),
            'by_company' => array()
        );
        
        foreach ($this->crawlers as $info) {
            // Count by category
            $category = $info['category'];
            if (!isset($stats['by_category'][$category])) {
                $stats['by_category'][$category] = 0;
            }
            $stats['by_category'][$category]++;
            
            // Count by company
            $company = $info['company'];
            if (!isset($stats['by_company'][$company])) {
                $stats['by_company'][$company] = 0;
            }
            $stats['by_company'][$company]++;
        }
        
        return $stats;
    }
} 