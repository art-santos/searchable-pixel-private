<?php
/**
 * Split Analytics Admin Interface
 */
class SplitAnalyticsAdmin {
    
    /**
     * Add admin menu items
     */
    public static function addAdminMenu() {
        // Add settings page under Settings menu
        add_options_page(
            __('Split Analytics Settings', 'split-analytics'),
            __('Split Analytics', 'split-analytics'),
            'manage_options',
            'split-analytics',
            array('SplitAnalyticsAdmin', 'displaySettingsPage')
        );
        
        // Add dashboard widget
        add_action('wp_dashboard_setup', array('SplitAnalyticsAdmin', 'addDashboardWidget'));
    }
    
    /**
     * Display the settings page
     */
    public static function displaySettingsPage() {
        // Check user permissions
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'split-analytics'));
        }
        
        include SPLIT_ANALYTICS_PLUGIN_DIR . 'admin/partials/settings-page.php';
    }
    
    /**
     * Add dashboard widget
     */
    public static function addDashboardWidget() {
        wp_add_dashboard_widget(
            'split_analytics_dashboard',
            __('AI Crawler Activity', 'split-analytics'),
            array('SplitAnalyticsAdmin', 'displayDashboardWidget'),
            array('SplitAnalyticsAdmin', 'dashboardWidgetConfig')
        );
    }
    
    /**
     * Display dashboard widget content
     */
    public static function displayDashboardWidget() {
        $analytics = new SplitAnalytics();
        $settings = new SplitAnalyticsSettings();
        
        // Check if configured
        if (!$settings->isConfigured()) {
            echo '<div class="split-analytics-widget-error">';
            echo '<h4>' . __('Split Analytics Not Configured', 'split-analytics') . '</h4>';
            echo '<p>' . __('Please configure your API key to start tracking AI crawler visits.', 'split-analytics') . '</p>';
            echo '<p><a href="' . admin_url('options-general.php?page=split-analytics') . '" class="button button-primary">' . __('Configure Now', 'split-analytics') . '</a></p>';
            echo '</div>';
            return;
        }
        
        // Get statistics
        $stats = $analytics->getCrawlerStats(7);
        
        if (empty($stats['by_crawler'])) {
            echo '<div class="split-analytics-widget-empty">';
            echo '<h4>' . __('No AI Crawler Activity', 'split-analytics') . '</h4>';
            echo '<p>' . __('No AI crawler visits detected in the last 7 days.', 'split-analytics') . '</p>';
            echo '<p class="description">' . __('AI crawlers like ChatGPT, Claude, and Perplexity will appear here when they visit your site.', 'split-analytics') . '</p>';
            echo '</div>';
            return;
        }
        
        // Display statistics
        echo '<div class="split-analytics-widget">';
        
        // Summary
        echo '<div class="split-analytics-summary">';
        echo '<h4>' . sprintf(_n('%d crawler visit', '%d crawler visits', $stats['total_visits'], 'split-analytics'), $stats['total_visits']) . ' ' . __('in the last 7 days', 'split-analytics') . '</h4>';
        echo '</div>';
        
        // Crawler table
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead>';
        echo '<tr>';
        echo '<th>' . __('Crawler', 'split-analytics') . '</th>';
        echo '<th>' . __('Company', 'split-analytics') . '</th>';
        echo '<th>' . __('Visits', 'split-analytics') . '</th>';
        echo '<th>' . __('Last Visit', 'split-analytics') . '</th>';
        echo '</tr>';
        echo '</thead>';
        echo '<tbody>';
        
        $maxDisplay = 10;
        $count = 0;
        
        foreach ($stats['by_crawler'] as $visit) {
            if ($count >= $maxDisplay) break;
            
            echo '<tr>';
            echo '<td><strong>' . esc_html($visit->crawler_name) . '</strong></td>';
            echo '<td>' . esc_html($visit->crawler_company) . '</td>';
            echo '<td>' . esc_html($visit->visit_count) . '</td>';
            echo '<td>' . esc_html(human_time_diff(strtotime($visit->last_visit))) . ' ' . __('ago', 'split-analytics') . '</td>';
            echo '</tr>';
            
            $count++;
        }
        
        echo '</tbody>';
        echo '</table>';
        
        // Footer links
        echo '<div class="split-analytics-widget-footer">';
        echo '<p>';
        echo '<a href="' . admin_url('options-general.php?page=split-analytics') . '">' . __('View Settings', 'split-analytics') . '</a> | ';
        echo '<a href="https://split.dev/dashboard" target="_blank">' . __('Split Dashboard', 'split-analytics') . '</a>';
        echo '</p>';
        echo '</div>';
        
        echo '</div>';
    }
    
    /**
     * Dashboard widget configuration
     */
    public static function dashboardWidgetConfig() {
        if (isset($_POST['split_analytics_widget_days'])) {
            $days = intval($_POST['split_analytics_widget_days']);
            update_user_meta(get_current_user_id(), 'split_analytics_widget_days', $days);
        }
        
        $days = get_user_meta(get_current_user_id(), 'split_analytics_widget_days', true);
        if (empty($days)) {
            $days = 7;
        }
        
        echo '<p><label for="split_analytics_widget_days">' . __('Show data for:', 'split-analytics') . '</label>';
        echo '<select id="split_analytics_widget_days" name="split_analytics_widget_days">';
        echo '<option value="7"' . selected($days, 7, false) . '>' . __('Last 7 days', 'split-analytics') . '</option>';
        echo '<option value="30"' . selected($days, 30, false) . '>' . __('Last 30 days', 'split-analytics') . '</option>';
        echo '<option value="90"' . selected($days, 90, false) . '>' . __('Last 90 days', 'split-analytics') . '</option>';
        echo '</select></p>';
    }
    
    /**
     * Add admin notices
     */
    public static function adminNotices() {
        $screen = get_current_screen();
        
        // Only show on dashboard and plugin pages
        if (!in_array($screen->id, array('dashboard', 'settings_page_split-analytics'))) {
            return;
        }
        
        $settings = new SplitAnalyticsSettings();
        
        // Configuration notice
        if (!$settings->isConfigured()) {
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p><strong>' . __('Split Analytics:', 'split-analytics') . '</strong> ';
            echo __('Plugin is installed but not configured. ', 'split-analytics');
            echo '<a href="' . admin_url('options-general.php?page=split-analytics') . '">' . __('Configure now', 'split-analytics') . '</a>';
            echo ' to start tracking AI crawler visits.</p>';
            echo '</div>';
        }
        
        // Show success message after saving settings
        if (isset($_GET['settings-updated']) && $_GET['page'] === 'split-analytics') {
            echo '<div class="notice notice-success is-dismissible">';
            echo '<p>' . __('Split Analytics settings saved successfully!', 'split-analytics') . '</p>';
            echo '</div>';
        }
    }
    
    /**
     * Add plugin action links
     */
    public static function pluginActionLinks($links) {
        $settings_link = '<a href="' . admin_url('options-general.php?page=split-analytics') . '">' . __('Settings', 'split-analytics') . '</a>';
        array_unshift($links, $settings_link);
        
        $dashboard_link = '<a href="https://split.dev/dashboard" target="_blank">' . __('Dashboard', 'split-analytics') . '</a>';
        array_push($links, $dashboard_link);
        
        return $links;
    }
    
    /**
     * Add plugin meta links
     */
    public static function pluginMetaLinks($links, $file) {
        if ($file === plugin_basename(SPLIT_ANALYTICS_PLUGIN_FILE)) {
            $links[] = '<a href="https://split.dev/docs" target="_blank">' . __('Documentation', 'split-analytics') . '</a>';
            $links[] = '<a href="https://split.dev/support" target="_blank">' . __('Support', 'split-analytics') . '</a>';
        }
        
        return $links;
    }
    
    /**
     * Display admin statistics page (if needed in future)
     */
    public static function displayStatsPage() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'split-analytics'));
        }
        
        $analytics = new SplitAnalytics();
        $stats = $analytics->getCrawlerStats(30);
        
        echo '<div class="wrap">';
        echo '<h1>' . __('Split Analytics - Crawler Statistics', 'split-analytics') . '</h1>';
        
        if (empty($stats['by_crawler'])) {
            echo '<div class="notice notice-info">';
            echo '<p>' . __('No crawler activity found in the last 30 days.', 'split-analytics') . '</p>';
            echo '</div>';
        } else {
            // Display detailed statistics
            echo '<div class="split-analytics-stats">';
            
            // Total visits
            echo '<div class="postbox">';
            echo '<h3 class="hndle">' . __('Overview', 'split-analytics') . '</h3>';
            echo '<div class="inside">';
            echo '<p><strong>' . sprintf(__('Total crawler visits in the last 30 days: %d', 'split-analytics'), $stats['total_visits']) . '</strong></p>';
            echo '</div>';
            echo '</div>';
            
            // Crawler breakdown
            echo '<div class="postbox">';
            echo '<h3 class="hndle">' . __('Crawler Breakdown', 'split-analytics') . '</h3>';
            echo '<div class="inside">';
            echo '<table class="wp-list-table widefat fixed striped">';
            echo '<thead><tr>';
            echo '<th>' . __('Crawler', 'split-analytics') . '</th>';
            echo '<th>' . __('Company', 'split-analytics') . '</th>';
            echo '<th>' . __('Visits', 'split-analytics') . '</th>';
            echo '<th>' . __('Last Visit', 'split-analytics') . '</th>';
            echo '</tr></thead>';
            echo '<tbody>';
            
            foreach ($stats['by_crawler'] as $visit) {
                echo '<tr>';
                echo '<td>' . esc_html($visit->crawler_name) . '</td>';
                echo '<td>' . esc_html($visit->crawler_company) . '</td>';
                echo '<td>' . esc_html($visit->visit_count) . '</td>';
                echo '<td>' . esc_html(human_time_diff(strtotime($visit->last_visit))) . ' ' . __('ago', 'split-analytics') . '</td>';
                echo '</tr>';
            }
            
            echo '</tbody></table>';
            echo '</div>';
            echo '</div>';
            
            // Popular pages
            if (!empty($stats['popular_pages'])) {
                echo '<div class="postbox">';
                echo '<h3 class="hndle">' . __('Most Visited Pages', 'split-analytics') . '</h3>';
                echo '<div class="inside">';
                echo '<table class="wp-list-table widefat fixed striped">';
                echo '<thead><tr>';
                echo '<th>' . __('URL', 'split-analytics') . '</th>';
                echo '<th>' . __('Visits', 'split-analytics') . '</th>';
                echo '</tr></thead>';
                echo '<tbody>';
                
                foreach ($stats['popular_pages'] as $page) {
                    echo '<tr>';
                    echo '<td><a href="' . esc_url($page->url) . '" target="_blank">' . esc_html($page->url) . '</a></td>';
                    echo '<td>' . esc_html($page->visit_count) . '</td>';
                    echo '</tr>';
                }
                
                echo '</tbody></table>';
                echo '</div>';
                echo '</div>';
            }
            
            echo '</div>';
        }
        
        echo '</div>';
    }
    
    /**
     * Initialize admin hooks
     */
    public static function init() {
        // Add admin notices
        add_action('admin_notices', array('SplitAnalyticsAdmin', 'adminNotices'));
        
        // Add plugin links
        add_filter('plugin_action_links_' . plugin_basename(SPLIT_ANALYTICS_PLUGIN_FILE), array('SplitAnalyticsAdmin', 'pluginActionLinks'));
        add_filter('plugin_row_meta', array('SplitAnalyticsAdmin', 'pluginMetaLinks'), 10, 2);
    }
}

// Initialize admin hooks
add_action('admin_init', array('SplitAnalyticsAdmin', 'init')); 