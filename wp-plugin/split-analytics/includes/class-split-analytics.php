<?php
/**
 * Core Split Analytics functionality
 */
class SplitAnalytics {
    
    private $apiClient;
    private $crawlerDetector;
    private $settings;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->apiClient = new SplitAnalyticsApiClient();
        $this->crawlerDetector = new SplitAnalyticsCrawlerDetector();
        $this->settings = new SplitAnalyticsSettings();
    }
    
    /**
     * Check if this is a crawler and track if so
     */
    public function maybeTrackCrawler() {
        // Check if tracking is enabled
        if (!$this->settings->isTrackingEnabled()) {
            if ($this->settings->isDebugEnabled()) {
                error_log('Split Analytics: Tracking is disabled');
            }
            return false;
        }
        
        // Get user agent
        $userAgent = $this->getUserAgent();
        if (empty($userAgent)) {
            if ($this->settings->isDebugEnabled()) {
                error_log('Split Analytics: No user agent found');
            }
            return false;
        }
        
        // Detect crawler
        $crawlerInfo = $this->crawlerDetector->detectCrawler($userAgent);
        if (!$crawlerInfo) {
            if ($this->settings->isDebugEnabled()) {
                error_log('Split Analytics: Not an AI crawler - ' . substr($userAgent, 0, 100));
            }
            return false;
        }
        
        // Check path filters
        if (!$this->shouldTrackCurrentPath()) {
            if ($this->settings->isDebugEnabled()) {
                error_log('Split Analytics: Path excluded from tracking');
            }
            return false;
        }
        
        // Log the visit
        $visitId = $this->logCrawlerVisit($crawlerInfo, $userAgent);
        
        if ($visitId) {
            // Schedule batch send (non-blocking)
            $this->scheduleBatchSend();
            
            if ($this->settings->isDebugEnabled()) {
                error_log("Split Analytics: Successfully tracked {$crawlerInfo['name']} visit (ID: $visitId)");
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get user agent from request headers
     */
    private function getUserAgent() {
        return isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field($_SERVER['HTTP_USER_AGENT']) : '';
    }
    
    /**
     * Check if current path should be tracked based on include/exclude filters
     */
    private function shouldTrackCurrentPath() {
        $currentPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $options = $this->settings->getOptions();
        
        // Check exclude patterns
        if (!empty($options['exclude_paths'])) {
            foreach ($options['exclude_paths'] as $pattern) {
                if (!empty($pattern) && preg_match('#' . $pattern . '#', $currentPath)) {
                    return false;
                }
            }
        }
        
        // Check include patterns (if any are specified, only those paths are tracked)
        if (!empty($options['include_paths'])) {
            foreach ($options['include_paths'] as $pattern) {
                if (!empty($pattern) && preg_match('#' . $pattern . '#', $currentPath)) {
                    return true;
                }
            }
            return false; // No include patterns matched
        }
        
        return true; // No filters or not excluded
    }
    
    /**
     * Log crawler visit to database
     */
    private function logCrawlerVisit($crawlerInfo, $userAgent) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'split_analytics_visits';
        
        // Collect additional data
        $metadata = $this->collectMetadata();
        $currentUrl = $this->getCurrentUrl();
        $ipAddress = $this->getClientIpAddress();
        
        $data = array(
            'url' => $currentUrl,
            'user_agent' => $userAgent,
            'crawler_name' => $crawlerInfo['name'],
            'crawler_company' => $crawlerInfo['company'],
            'crawler_category' => $crawlerInfo['category'],
            'visit_time' => current_time('mysql'),
            'sent_to_api' => 0,
            'metadata' => wp_json_encode($metadata),
            'ip_address' => $ipAddress,
            'response_code' => http_response_code() ?: 200,
            'response_time' => null // Will be calculated later if needed
        );
        
        $result = $wpdb->insert($table_name, $data);
        
        if ($result === false) {
            if ($this->settings->isDebugEnabled()) {
                error_log('Split Analytics: Database insert failed - ' . $wpdb->last_error);
            }
            return false;
        }
        
        return $wpdb->insert_id;
    }
    
    /**
     * Get current URL
     */
    private function getCurrentUrl() {
        $protocol = is_ssl() ? 'https://' : 'http://';
        $host = $_SERVER['HTTP_HOST'];
        $requestUri = $_SERVER['REQUEST_URI'];
        return esc_url_raw($protocol . $host . $requestUri);
    }
    
    /**
     * Get client IP address (respects proxies)
     */
    private function getClientIpAddress() {
        $ipKeys = array('HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR');
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    }
    
    /**
     * Collect metadata about the request and WordPress context
     */
    private function collectMetadata() {
        global $wp_query;
        
        $metadata = array(
            'timestamp' => current_time('mysql'),
            'method' => $_SERVER['REQUEST_METHOD'],
            'wordpress_version' => get_bloginfo('version'),
            'plugin_version' => SPLIT_ANALYTICS_VERSION,
            'user_agent_hash' => md5($this->getUserAgent()),
            'request_uri' => $_SERVER['REQUEST_URI']
        );
        
        // Add WordPress-specific context
        if (is_home() || is_front_page()) {
            $metadata['page_type'] = 'homepage';
        } elseif (is_single()) {
            $metadata['page_type'] = 'post';
            $metadata['post_id'] = get_the_ID();
            $metadata['post_type'] = get_post_type();
            $metadata['post_title'] = get_the_title();
            $metadata['post_date'] = get_the_date('Y-m-d H:i:s');
            $metadata['post_author'] = get_the_author();
            
            // Categories and tags
            $categories = get_the_category();
            if ($categories) {
                $metadata['categories'] = wp_list_pluck($categories, 'name');
            }
            
            $tags = get_the_tags();
            if ($tags) {
                $metadata['tags'] = wp_list_pluck($tags, 'name');
            }
            
        } elseif (is_page()) {
            $metadata['page_type'] = 'page';
            $metadata['page_id'] = get_the_ID();
            $metadata['page_title'] = get_the_title();
        } elseif (is_category()) {
            $metadata['page_type'] = 'category';
            $metadata['category_id'] = get_queried_object_id();
            $metadata['category_name'] = single_cat_title('', false);
        } elseif (is_tag()) {
            $metadata['page_type'] = 'tag';
            $metadata['tag_id'] = get_queried_object_id();
            $metadata['tag_name'] = single_tag_title('', false);
        } elseif (is_author()) {
            $metadata['page_type'] = 'author';
            $metadata['author_id'] = get_queried_object_id();
            $metadata['author_name'] = get_the_author();
        } elseif (is_search()) {
            $metadata['page_type'] = 'search';
            $metadata['search_query'] = get_search_query();
        } elseif (is_archive()) {
            $metadata['page_type'] = 'archive';
        } else {
            $metadata['page_type'] = 'other';
        }
        
        // WooCommerce integration
        if (function_exists('is_woocommerce')) {
            if (is_shop()) {
                $metadata['page_type'] = 'shop';
            } elseif (is_product()) {
                $metadata['page_type'] = 'product';
                $metadata['product_id'] = get_the_ID();
                $metadata['product_title'] = get_the_title();
            } elseif (is_cart()) {
                $metadata['page_type'] = 'cart';
            } elseif (is_checkout()) {
                $metadata['page_type'] = 'checkout';
            } elseif (is_account_page()) {
                $metadata['page_type'] = 'account';
            }
        }
        
        // Yoast SEO integration
        if (class_exists('WPSEO_Frontend')) {
            $metadata['seo_title'] = wp_get_document_title();
            
            // Get meta description if available
            $wpseo_frontend = WPSEO_Frontend::get_instance();
            if (method_exists($wpseo_frontend, 'metadesc')) {
                $meta_desc = $wpseo_frontend->metadesc(false);
                if ($meta_desc) {
                    $metadata['meta_description'] = $meta_desc;
                }
            }
        }
        
        // Add theme information
        $theme = wp_get_theme();
        $metadata['theme_name'] = $theme->get('Name');
        $metadata['theme_version'] = $theme->get('Version');
        
        // Add language/locale
        $metadata['locale'] = get_locale();
        
        return apply_filters('split_analytics_metadata', $metadata);
    }
    
    /**
     * Schedule batch sending if not already scheduled
     */
    private function scheduleBatchSend() {
        if (!wp_next_scheduled('split_analytics_batch_send')) {
            wp_schedule_single_event(time() + 30, 'split_analytics_batch_send');
        }
    }
    
    /**
     * Send batched visits to API
     */
    public function batchSendToApi() {
        if (!$this->settings->hasValidApiKey()) {
            if ($this->settings->isDebugEnabled()) {
                error_log('Split Analytics: No valid API key for batch send');
            }
            return false;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'split_analytics_visits';
        
        // Get unsent visits (batch of 50)
        $visits = $wpdb->get_results(
            "SELECT * FROM $table_name WHERE sent_to_api = 0 ORDER BY visit_time ASC LIMIT 50"
        );
        
        if (empty($visits)) {
            if ($this->settings->isDebugEnabled()) {
                error_log('Split Analytics: No unsent visits for batch send');
            }
            return true;
        }
        
        // Convert to API format
        $events = array();
        foreach ($visits as $visit) {
            $events[] = array(
                'url' => $visit->url,
                'userAgent' => $visit->user_agent,
                'timestamp' => $visit->visit_time,
                'crawler' => array(
                    'name' => $visit->crawler_name,
                    'company' => $visit->crawler_company,
                    'category' => $visit->crawler_category
                ),
                'metadata' => json_decode($visit->metadata, true),
                'ipAddress' => $visit->ip_address,
                'responseCode' => $visit->response_code
            );
        }
        
        // Send to API
        $success = $this->apiClient->sendEvents($events);
        
        if ($success) {
            // Mark as sent
            $visitIds = wp_list_pluck($visits, 'id');
            $placeholders = implode(',', array_fill(0, count($visitIds), '%d'));
            
            $wpdb->query(
                $wpdb->prepare(
                    "UPDATE $table_name SET sent_to_api = 1 WHERE id IN ($placeholders)",
                    $visitIds
                )
            );
            
            if ($this->settings->isDebugEnabled()) {
                error_log("Split Analytics: Successfully sent " . count($visits) . " events to API");
            }
            
            return true;
        } else {
            if ($this->settings->isDebugEnabled()) {
                error_log("Split Analytics: Failed to send " . count($visits) . " events to API");
            }
            
            return false;
        }
    }
    
    /**
     * Get crawler statistics
     */
    public function getCrawlerStats($days = 7) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'split_analytics_visits';
        
        $stats = array();
        
        // Total visits in period
        $stats['total_visits'] = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name WHERE visit_time >= DATE_SUB(NOW(), INTERVAL %d DAY)",
                $days
            )
        );
        
        // Visits by crawler
        $stats['by_crawler'] = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT crawler_name, crawler_company, COUNT(*) as visit_count, MAX(visit_time) as last_visit 
                 FROM $table_name 
                 WHERE visit_time >= DATE_SUB(NOW(), INTERVAL %d DAY)
                 GROUP BY crawler_name, crawler_company 
                 ORDER BY visit_count DESC 
                 LIMIT 20",
                $days
            )
        );
        
        // Most visited pages
        $stats['popular_pages'] = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT url, COUNT(*) as visit_count 
                 FROM $table_name 
                 WHERE visit_time >= DATE_SUB(NOW(), INTERVAL %d DAY)
                 GROUP BY url 
                 ORDER BY visit_count DESC 
                 LIMIT 10",
                $days
            )
        );
        
        // Daily activity
        $stats['daily_activity'] = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT DATE(visit_time) as date, COUNT(*) as visits 
                 FROM $table_name 
                 WHERE visit_time >= DATE_SUB(NOW(), INTERVAL %d DAY)
                 GROUP BY DATE(visit_time) 
                 ORDER BY date DESC",
                $days
            )
        );
        
        return $stats;
    }
} 