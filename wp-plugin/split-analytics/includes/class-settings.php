<?php
/**
 * Split Analytics Settings Management
 */
class SplitAnalyticsSettings {
    
    private $options;
    private $optionName = 'split_analytics_options';
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->options = get_option($this->optionName, $this->getDefaultOptions());
    }
    
    /**
     * Initialize settings for WordPress Settings API
     */
    public static function initSettings() {
        register_setting(
            'split_analytics_options_group',
            'split_analytics_options',
            array(
                'sanitize_callback' => array('SplitAnalyticsSettings', 'sanitizeOptions'),
                'default' => self::getDefaultOptions()
            )
        );
        
        // Main Settings Section
        add_settings_section(
            'split_analytics_main_section',
            __('Main Settings', 'split-analytics'),
            array('SplitAnalyticsSettings', 'mainSectionCallback'),
            'split-analytics'
        );
        
        // API Key Field
        add_settings_field(
            'api_key',
            __('API Key', 'split-analytics'),
            array('SplitAnalyticsSettings', 'apiKeyCallback'),
            'split-analytics',
            'split_analytics_main_section'
        );
        
        // Enable Tracking Field
        add_settings_field(
            'enable_tracking',
            __('Enable Tracking', 'split-analytics'),
            array('SplitAnalyticsSettings', 'enableTrackingCallback'),
            'split-analytics',
            'split_analytics_main_section'
        );
        
        // Debug Mode Field
        add_settings_field(
            'debug_mode',
            __('Debug Mode', 'split-analytics'),
            array('SplitAnalyticsSettings', 'debugModeCallback'),
            'split-analytics',
            'split_analytics_main_section'
        );
        
        // Advanced Settings Section
        add_settings_section(
            'split_analytics_advanced_section',
            __('Advanced Settings', 'split-analytics'),
            array('SplitAnalyticsSettings', 'advancedSectionCallback'),
            'split-analytics'
        );
        
        // Exclude Paths Field
        add_settings_field(
            'exclude_paths',
            __('Exclude Paths', 'split-analytics'),
            array('SplitAnalyticsSettings', 'excludePathsCallback'),
            'split-analytics',
            'split_analytics_advanced_section'
        );
        
        // Include Paths Field
        add_settings_field(
            'include_paths',
            __('Include Paths Only', 'split-analytics'),
            array('SplitAnalyticsSettings', 'includePathsCallback'),
            'split-analytics',
            'split_analytics_advanced_section'
        );
        
        // Data Retention Field
        add_settings_field(
            'data_retention_days',
            __('Data Retention (Days)', 'split-analytics'),
            array('SplitAnalyticsSettings', 'dataRetentionCallback'),
            'split-analytics',
            'split_analytics_advanced_section'
        );
    }
    
    /**
     * Get default options
     */
    public static function getDefaultOptions() {
        return array(
            'api_key' => '',
            'enable_tracking' => true,
            'debug_mode' => false,
            'exclude_paths' => array(),
            'include_paths' => array(),
            'data_retention_days' => 90
        );
    }
    
    /**
     * Main settings section callback
     */
    public static function mainSectionCallback() {
        echo '<p>' . __('Configure your Split Analytics settings below. Get your API key from the', 'split-analytics') . ' <a href="https://split.dev/dashboard" target="_blank">' . __('Split Analytics Dashboard', 'split-analytics') . '</a>.</p>';
    }
    
    /**
     * Advanced settings section callback
     */
    public static function advancedSectionCallback() {
        echo '<p>' . __('Advanced configuration options for fine-tuning your AI crawler tracking.', 'split-analytics') . '</p>';
    }
    
    /**
     * API Key field callback
     */
    public static function apiKeyCallback() {
        $options = get_option('split_analytics_options', self::getDefaultOptions());
        $value = isset($options['api_key']) ? $options['api_key'] : '';
        
        echo '<input type="password" id="api_key" name="split_analytics_options[api_key]" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<button type="button" id="toggle_api_key" class="button button-secondary" style="margin-left: 10px;">' . __('Show', 'split-analytics') . '</button>';
        echo '<button type="button" id="test_connection" class="button button-secondary" style="margin-left: 10px;">' . __('Test Connection', 'split-analytics') . '</button>';
        echo '<div id="test_result" style="margin-top: 10px;"></div>';
        echo '<p class="description">' . sprintf(__('Get your API key from the <a href="%s" target="_blank">Split Analytics Dashboard</a>. Keys start with "split_live_" or "split_test_".', 'split-analytics'), 'https://split.dev/dashboard') . '</p>';
    }
    
    /**
     * Enable Tracking field callback
     */
    public static function enableTrackingCallback() {
        $options = get_option('split_analytics_options', self::getDefaultOptions());
        $value = isset($options['enable_tracking']) ? $options['enable_tracking'] : true;
        
        echo '<input type="checkbox" id="enable_tracking" name="split_analytics_options[enable_tracking]" value="1" ' . checked(1, $value, false) . ' />';
        echo '<label for="enable_tracking">' . __('Track AI crawler visits to this website', 'split-analytics') . '</label>';
        echo '<p class="description">' . __('Uncheck to temporarily disable tracking without removing the plugin.', 'split-analytics') . '</p>';
    }
    
    /**
     * Debug Mode field callback
     */
    public static function debugModeCallback() {
        $options = get_option('split_analytics_options', self::getDefaultOptions());
        $value = isset($options['debug_mode']) ? $options['debug_mode'] : false;
        
        echo '<input type="checkbox" id="debug_mode" name="split_analytics_options[debug_mode]" value="1" ' . checked(1, $value, false) . ' />';
        echo '<label for="debug_mode">' . __('Enable debug logging', 'split-analytics') . '</label>';
        echo '<p class="description">' . __('Enable this to see detailed logs in your WordPress debug.log file. Disable in production.', 'split-analytics') . '</p>';
    }
    
    /**
     * Exclude Paths field callback
     */
    public static function excludePathsCallback() {
        $options = get_option('split_analytics_options', self::getDefaultOptions());
        $value = isset($options['exclude_paths']) ? $options['exclude_paths'] : array();
        
        $pathString = is_array($value) ? implode("\n", $value) : '';
        
        echo '<textarea id="exclude_paths" name="split_analytics_options[exclude_paths]" rows="5" cols="50" class="large-text">' . esc_textarea($pathString) . '</textarea>';
        echo '<p class="description">' . __('Enter regex patterns (one per line) for paths to exclude from tracking. Example: /admin/.* to exclude admin pages.', 'split-analytics') . '</p>';
        echo '<p class="description"><strong>' . __('Common patterns:', 'split-analytics') . '</strong></p>';
        echo '<ul style="margin-left: 20px;">';
        echo '<li><code>/admin/.*</code> - ' . __('Exclude admin pages', 'split-analytics') . '</li>';
        echo '<li><code>/wp-.*</code> - ' . __('Exclude WordPress system pages', 'split-analytics') . '</li>';
        echo '<li><code>.*\\.json$</code> - ' . __('Exclude JSON files', 'split-analytics') . '</li>';
        echo '<li><code>/api/.*</code> - ' . __('Exclude API endpoints', 'split-analytics') . '</li>';
        echo '</ul>';
    }
    
    /**
     * Include Paths field callback
     */
    public static function includePathsCallback() {
        $options = get_option('split_analytics_options', self::getDefaultOptions());
        $value = isset($options['include_paths']) ? $options['include_paths'] : array();
        
        $pathString = is_array($value) ? implode("\n", $value) : '';
        
        echo '<textarea id="include_paths" name="split_analytics_options[include_paths]" rows="5" cols="50" class="large-text">' . esc_textarea($pathString) . '</textarea>';
        echo '<p class="description">' . __('Enter regex patterns (one per line) for paths to ONLY track. If specified, only matching paths will be tracked. Leave empty to track all paths (except excluded ones).', 'split-analytics') . '</p>';
        echo '<p class="description"><strong>' . __('Example patterns:', 'split-analytics') . '</strong></p>';
        echo '<ul style="margin-left: 20px;">';
        echo '<li><code>/blog/.*</code> - ' . __('Only track blog pages', 'split-analytics') . '</li>';
        echo '<li><code>.*/(post|page)/.*</code> - ' . __('Only track posts and pages', 'split-analytics') . '</li>';
        echo '<li><code>/product/.*</code> - ' . __('Only track product pages', 'split-analytics') . '</li>';
        echo '</ul>';
    }
    
    /**
     * Data Retention field callback
     */
    public static function dataRetentionCallback() {
        $options = get_option('split_analytics_options', self::getDefaultOptions());
        $value = isset($options['data_retention_days']) ? $options['data_retention_days'] : 90;
        
        echo '<input type="number" id="data_retention_days" name="split_analytics_options[data_retention_days]" value="' . esc_attr($value) . '" min="30" max="365" class="small-text" />';
        echo '<label for="data_retention_days">' . __('days', 'split-analytics') . '</label>';
        echo '<p class="description">' . __('How long to keep local visit data before automatic cleanup. Minimum 30 days, maximum 365 days.', 'split-analytics') . '</p>';
    }
    
    /**
     * Sanitize options
     */
    public static function sanitizeOptions($input) {
        $sanitized = array();
        $defaults = self::getDefaultOptions();
        
        // API Key
        if (isset($input['api_key'])) {
            $sanitized['api_key'] = sanitize_text_field($input['api_key']);
        }
        
        // Enable Tracking
        $sanitized['enable_tracking'] = isset($input['enable_tracking']) ? true : false;
        
        // Debug Mode
        $sanitized['debug_mode'] = isset($input['debug_mode']) ? true : false;
        
        // Exclude Paths
        if (isset($input['exclude_paths'])) {
            $paths = explode("\n", $input['exclude_paths']);
            $sanitized['exclude_paths'] = array_filter(array_map('trim', $paths));
        } else {
            $sanitized['exclude_paths'] = array();
        }
        
        // Include Paths
        if (isset($input['include_paths'])) {
            $paths = explode("\n", $input['include_paths']);
            $sanitized['include_paths'] = array_filter(array_map('trim', $paths));
        } else {
            $sanitized['include_paths'] = array();
        }
        
        // Data Retention
        if (isset($input['data_retention_days'])) {
            $days = intval($input['data_retention_days']);
            $sanitized['data_retention_days'] = max(30, min(365, $days));
        } else {
            $sanitized['data_retention_days'] = $defaults['data_retention_days'];
        }
        
        return $sanitized;
    }
    
    /**
     * Check if tracking is enabled
     */
    public function isTrackingEnabled() {
        return !empty($this->options['enable_tracking']);
    }
    
    /**
     * Check if debug mode is enabled
     */
    public function isDebugEnabled() {
        return !empty($this->options['debug_mode']);
    }
    
    /**
     * Get API key
     */
    public function getApiKey() {
        return isset($this->options['api_key']) ? $this->options['api_key'] : '';
    }
    
    /**
     * Check if API key is valid format
     */
    public function hasValidApiKey() {
        $apiKey = $this->getApiKey();
        return !empty($apiKey) && (strpos($apiKey, 'split_live_') === 0 || strpos($apiKey, 'split_test_') === 0);
    }
    
    /**
     * Get all options
     */
    public function getOptions() {
        return $this->options;
    }
    
    /**
     * Get single option
     */
    public function getOption($key, $default = null) {
        return isset($this->options[$key]) ? $this->options[$key] : $default;
    }
    
    /**
     * Update single option
     */
    public function updateOption($key, $value) {
        $this->options[$key] = $value;
        update_option($this->optionName, $this->options);
    }
    
    /**
     * Reset options to defaults
     */
    public function resetToDefaults() {
        $this->options = $this->getDefaultOptions();
        update_option($this->optionName, $this->options);
    }
    
    /**
     * Export settings for backup
     */
    public function exportSettings() {
        return array(
            'version' => SPLIT_ANALYTICS_VERSION,
            'timestamp' => current_time('mysql'),
            'settings' => $this->options
        );
    }
    
    /**
     * Import settings from backup
     */
    public function importSettings($data) {
        if (!isset($data['settings']) || !is_array($data['settings'])) {
            return false;
        }
        
        // Sanitize imported settings
        $sanitized = self::sanitizeOptions($data['settings']);
        $this->options = $sanitized;
        update_option($this->optionName, $this->options);
        
        return true;
    }
    
    /**
     * Get data retention days
     */
    public function getDataRetentionDays() {
        return $this->getOption('data_retention_days', 90);
    }
    
    /**
     * Get exclude paths
     */
    public function getExcludePaths() {
        return $this->getOption('exclude_paths', array());
    }
    
    /**
     * Get include paths
     */
    public function getIncludePaths() {
        return $this->getOption('include_paths', array());
    }
    
    /**
     * Check if settings are properly configured
     */
    public function isConfigured() {
        return $this->hasValidApiKey() && $this->isTrackingEnabled();
    }
    
    /**
     * Get configuration status for admin display
     */
    public function getConfigurationStatus() {
        $status = array(
            'api_key' => $this->hasValidApiKey(),
            'tracking_enabled' => $this->isTrackingEnabled(),
            'configured' => $this->isConfigured()
        );
        
        return $status;
    }
} 