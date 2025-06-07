<?php
/**
 * Plugin Name: Split Analytics - AI Crawler Tracking
 * Plugin URI: https://split.dev
 * Description: Track AI crawler visits from ChatGPT, Claude, Perplexity and 30+ others. Simple, lightweight, privacy-focused.
 * Version: 2.0.0
 * Author: Split Analytics
 * Author URI: https://split.dev
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: split-analytics
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SPLIT_ANALYTICS_VERSION', '2.0.0');
define('SPLIT_ANALYTICS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SPLIT_ANALYTICS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SPLIT_ANALYTICS_PLUGIN_FILE', __FILE__);

/**
 * Main plugin class
 */
class SplitAnalyticsPlugin {
    
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->loadDependencies();
        $this->initHooks();
    }
    
    /**
     * Load required files
     */
    private function loadDependencies() {
        require_once SPLIT_ANALYTICS_PLUGIN_DIR . 'includes/class-split-analytics.php';
        require_once SPLIT_ANALYTICS_PLUGIN_DIR . 'includes/class-crawler-detector.php';
        require_once SPLIT_ANALYTICS_PLUGIN_DIR . 'includes/class-api-client.php';
        require_once SPLIT_ANALYTICS_PLUGIN_DIR . 'includes/class-settings.php';
        
        if (is_admin()) {
            require_once SPLIT_ANALYTICS_PLUGIN_DIR . 'includes/class-admin.php';
        }
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function initHooks() {
        // Initialize plugin
        add_action('init', array($this, 'init'));
        
        // Track crawler visits on frontend
        add_action('wp', array($this, 'trackCrawlerVisit'));
        
        // Admin hooks
        if (is_admin()) {
            add_action('admin_menu', array('SplitAnalyticsAdmin', 'addAdminMenu'));
            add_action('admin_init', array('SplitAnalyticsSettings', 'initSettings'));
            add_action('admin_enqueue_scripts', array($this, 'enqueueAdminScripts'));
        }
        
        // AJAX hooks
        add_action('wp_ajax_split_analytics_test_connection', array($this, 'ajaxTestConnection'));
        add_action('wp_ajax_split_analytics_clear_data', array($this, 'ajaxClearData'));
        
        // Activation/deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        register_uninstall_hook(__FILE__, array('SplitAnalyticsPlugin', 'uninstall'));
        
        // Cron hooks
        add_action('split_analytics_batch_send', array($this, 'handleBatchSend'));
        add_action('split_analytics_cleanup', array($this, 'handleCleanup'));
    }
    
    /**
     * Initialize plugin (load textdomain, etc.)
     */
    public function init() {
        // Load textdomain for translations
        load_plugin_textdomain('split-analytics', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Track crawler visits on frontend requests
     */
    public function trackCrawlerVisit() {
        // Only track on frontend, not admin, AJAX, or cron
        if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
            return;
        }
        
        // Skip if this is a REST API request
        if (defined('REST_REQUEST') && REST_REQUEST) {
            return;
        }
        
        // Initialize analytics and track
        $analytics = new SplitAnalytics();
        $analytics->maybeTrackCrawler();
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueueAdminScripts($hook) {
        // Only load on our settings page
        if ($hook !== 'settings_page_split-analytics') {
            return;
        }
        
        wp_enqueue_style(
            'split-analytics-admin',
            SPLIT_ANALYTICS_PLUGIN_URL . 'admin/css/admin-styles.css',
            array(),
            SPLIT_ANALYTICS_VERSION
        );
        
        wp_enqueue_script(
            'split-analytics-admin',
            SPLIT_ANALYTICS_PLUGIN_URL . 'admin/js/admin-scripts.js',
            array('jquery'),
            SPLIT_ANALYTICS_VERSION,
            true
        );
        
        // Localize script for AJAX
        wp_localize_script('split-analytics-admin', 'splitAnalytics', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('split_analytics_nonce'),
            'strings' => array(
                'testing' => __('Testing connection...', 'split-analytics'),
                'success' => __('Connection successful!', 'split-analytics'),
                'error' => __('Connection failed:', 'split-analytics'),
                'confirmClear' => __('Are you sure you want to clear all data? This cannot be undone.', 'split-analytics')
            )
        ));
    }
    
    /**
     * AJAX handler for testing API connection
     */
    public function ajaxTestConnection() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'split_analytics_nonce')) {
            wp_die(__('Security check failed', 'split-analytics'));
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_die(__('Insufficient permissions', 'split-analytics'));
        }
        
        $api_key = sanitize_text_field($_POST['api_key']);
        
        if (empty($api_key)) {
            wp_send_json_error(__('API key is required', 'split-analytics'));
        }
        
        // Test connection
        $api_client = new SplitAnalyticsApiClient();
        $result = $api_client->ping($api_key);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result['message']);
        }
    }
    
    /**
     * AJAX handler for clearing data
     */
    public function ajaxClearData() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'split_analytics_nonce')) {
            wp_die(__('Security check failed', 'split-analytics'));
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_die(__('Insufficient permissions', 'split-analytics'));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'split_analytics_visits';
        
        $deleted = $wpdb->query("DELETE FROM $table_name");
        
        if ($deleted !== false) {
            wp_send_json_success(sprintf(__('Cleared %d records', 'split-analytics'), $deleted));
        } else {
            wp_send_json_error(__('Failed to clear data', 'split-analytics'));
        }
    }
    
    /**
     * Handle batch sending via cron
     */
    public function handleBatchSend() {
        $analytics = new SplitAnalytics();
        $analytics->batchSendToApi();
    }
    
    /**
     * Handle data cleanup via cron
     */
    public function handleCleanup() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'split_analytics_visits';
        
        // Delete visits older than 90 days
        $wpdb->query(
            "DELETE FROM $table_name WHERE visit_time < DATE_SUB(NOW(), INTERVAL 90 DAY)"
        );
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables
        $this->createTables();
        
        // Set default options
        add_option('split_analytics_version', SPLIT_ANALYTICS_VERSION);
        add_option('split_analytics_options', array(
            'api_key' => '',
            'enable_tracking' => true,
            'debug_mode' => false,
            'exclude_paths' => array(),
            'include_paths' => array()
        ));
        
        // Schedule cron jobs
        if (!wp_next_scheduled('split_analytics_cleanup')) {
            wp_schedule_event(time(), 'weekly', 'split_analytics_cleanup');
        }
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('split_analytics_batch_send');
        wp_clear_scheduled_hook('split_analytics_cleanup');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin uninstall
     */
    public static function uninstall() {
        global $wpdb;
        
        // Remove database table
        $table_name = $wpdb->prefix . 'split_analytics_visits';
        $wpdb->query("DROP TABLE IF EXISTS $table_name");
        
        // Remove options
        delete_option('split_analytics_version');
        delete_option('split_analytics_options');
        
        // Clear any remaining scheduled events
        wp_clear_scheduled_hook('split_analytics_batch_send');
        wp_clear_scheduled_hook('split_analytics_cleanup');
    }
    
    /**
     * Create database tables
     */
    private function createTables() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'split_analytics_visits';
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            url varchar(500) NOT NULL,
            user_agent text NOT NULL,
            crawler_name varchar(100) NOT NULL,
            crawler_company varchar(100) NOT NULL,
            crawler_category varchar(50) NOT NULL,
            visit_time datetime DEFAULT CURRENT_TIMESTAMP,
            sent_to_api tinyint(1) DEFAULT 0,
            metadata longtext,
            ip_address varchar(45),
            response_code smallint,
            response_time float,
            PRIMARY KEY (id),
            KEY crawler_name (crawler_name),
            KEY crawler_company (crawler_company),
            KEY visit_time (visit_time),
            KEY sent_to_api (sent_to_api),
            KEY url_hash (url(191))
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}

// Initialize the plugin
SplitAnalyticsPlugin::getInstance(); 