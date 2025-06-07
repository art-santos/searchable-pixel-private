<?php
/**
 * Split Analytics Settings Page Template
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

$settings = new SplitAnalyticsSettings();
$analytics = new SplitAnalytics();
$stats = $analytics->getCrawlerStats(30);
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="split-analytics-admin">
        <div class="split-analytics-header">
            <div class="split-analytics-logo">
                <h2><?php _e('Split Analytics', 'split-analytics'); ?></h2>
                <p class="description"><?php _e('Track AI crawler visits from ChatGPT, Claude, Perplexity and 30+ others', 'split-analytics'); ?></p>
            </div>
            
            <div class="split-analytics-status">
                <?php
                $status = $settings->getConfigurationStatus();
                if ($status['configured']) {
                    echo '<span class="status-indicator status-active"></span>';
                    echo '<strong>' . __('Active', 'split-analytics') . '</strong>';
                    echo '<p>' . __('AI crawler tracking is enabled', 'split-analytics') . '</p>';
                } else {
                    echo '<span class="status-indicator status-inactive"></span>';
                    echo '<strong>' . __('Not Active', 'split-analytics') . '</strong>';
                    echo '<p>' . __('Configure settings below to start tracking', 'split-analytics') . '</p>';
                }
                ?>
            </div>
        </div>
        
        <?php if (!empty($stats['by_crawler'])): ?>
        <div class="split-analytics-overview">
            <h3><?php _e('Recent Activity (Last 30 Days)', 'split-analytics'); ?></h3>
            <div class="split-analytics-stats-grid">
                <div class="stat-box">
                    <div class="stat-number"><?php echo esc_html($stats['total_visits']); ?></div>
                    <div class="stat-label"><?php _e('Total Visits', 'split-analytics'); ?></div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?php echo esc_html(count($stats['by_crawler'])); ?></div>
                    <div class="stat-label"><?php _e('Different Crawlers', 'split-analytics'); ?></div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?php echo esc_html(count($stats['popular_pages'])); ?></div>
                    <div class="stat-label"><?php _e('Pages Visited', 'split-analytics'); ?></div>
                </div>
                <div class="stat-box">
                    <a href="https://split.dev/dashboard" target="_blank" class="button button-primary">
                        <?php _e('View Full Dashboard', 'split-analytics'); ?>
                    </a>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <div class="split-analytics-content">
            <div class="split-analytics-main">
                <form method="post" action="options.php">
                    <?php
                    settings_fields('split_analytics_options_group');
                    do_settings_sections('split-analytics');
                    ?>
                    
                    <div class="split-analytics-actions">
                        <?php submit_button(__('Save Settings', 'split-analytics'), 'primary', 'submit', false); ?>
                        <button type="button" id="clear_data" class="button button-secondary" style="margin-left: 10px;">
                            <?php _e('Clear Local Data', 'split-analytics'); ?>
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="split-analytics-sidebar">
                <div class="postbox">
                    <h3 class="hndle"><?php _e('Supported AI Crawlers', 'split-analytics'); ?></h3>
                    <div class="inside">
                        <div class="crawler-list">
                            <?php
                            $detector = new SplitAnalyticsCrawlerDetector();
                            $crawlers = $detector->getCrawlersByCompany();
                            
                            foreach ($crawlers as $company => $companyCrawlers) {
                                echo '<div class="crawler-company">';
                                echo '<h4>' . esc_html($company) . '</h4>';
                                echo '<ul>';
                                foreach ($companyCrawlers as $crawler) {
                                    $categoryIcon = '';
                                    switch ($crawler['category']) {
                                        case 'ai-training':
                                            $categoryIcon = '🎓';
                                            break;
                                        case 'ai-assistant':
                                            $categoryIcon = '🤖';
                                            break;
                                        case 'ai-search':
                                            $categoryIcon = '🔍';
                                            break;
                                        case 'search-ai':
                                            $categoryIcon = '📊';
                                            break;
                                        default:
                                            $categoryIcon = '⚙️';
                                    }
                                    echo '<li>' . $categoryIcon . ' ' . esc_html($crawler['name']) . '</li>';
                                }
                                echo '</ul>';
                                echo '</div>';
                            }
                            ?>
                        </div>
                        <p class="description">
                            <?php _e('The plugin automatically detects all these AI crawlers and more.', 'split-analytics'); ?>
                        </p>
                    </div>
                </div>
                
                <div class="postbox">
                    <h3 class="hndle"><?php _e('Quick Actions', 'split-analytics'); ?></h3>
                    <div class="inside">
                        <ul class="quick-actions">
                            <li>
                                <a href="https://split.dev/dashboard" target="_blank" class="button button-secondary">
                                    <?php _e('Open Split Dashboard', 'split-analytics'); ?>
                                </a>
                            </li>
                            <li>
                                <a href="https://split.dev/docs" target="_blank" class="button button-secondary">
                                    <?php _e('View Documentation', 'split-analytics'); ?>
                                </a>
                            </li>
                            <li>
                                <button type="button" id="export_settings" class="button button-secondary">
                                    <?php _e('Export Settings', 'split-analytics'); ?>
                                </button>
                            </li>
                            <li>
                                <button type="button" id="import_settings" class="button button-secondary">
                                    <?php _e('Import Settings', 'split-analytics'); ?>
                                </button>
                                <input type="file" id="import_file" accept=".json" style="display: none;">
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div class="postbox">
                    <h3 class="hndle"><?php _e('System Information', 'split-analytics'); ?></h3>
                    <div class="inside">
                        <table class="system-info">
                            <tr>
                                <td><?php _e('Plugin Version:', 'split-analytics'); ?></td>
                                <td><?php echo esc_html(SPLIT_ANALYTICS_VERSION); ?></td>
                            </tr>
                            <tr>
                                <td><?php _e('WordPress Version:', 'split-analytics'); ?></td>
                                <td><?php echo esc_html(get_bloginfo('version')); ?></td>
                            </tr>
                            <tr>
                                <td><?php _e('PHP Version:', 'split-analytics'); ?></td>
                                <td><?php echo esc_html(PHP_VERSION); ?></td>
                            </tr>
                            <tr>
                                <td><?php _e('Database Records:', 'split-analytics'); ?></td>
                                <td>
                                    <?php
                                    global $wpdb;
                                    $table_name = $wpdb->prefix . 'split_analytics_visits';
                                    $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
                                    echo esc_html($count ?: 0);
                                    ?>
                                </td>
                            </tr>
                            <tr>
                                <td><?php _e('API Status:', 'split-analytics'); ?></td>
                                <td>
                                    <span id="api_status">
                                        <?php
                                        if ($settings->hasValidApiKey()) {
                                            echo '<span class="status-good">' . __('Connected', 'split-analytics') . '</span>';
                                        } else {
                                            echo '<span class="status-error">' . __('Not Connected', 'split-analytics') . '</span>';
                                        }
                                        ?>
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <?php if (!empty($stats['by_crawler'])): ?>
                <div class="postbox">
                    <h3 class="hndle"><?php _e('Recent Crawlers', 'split-analytics'); ?></h3>
                    <div class="inside">
                        <table class="recent-crawlers">
                            <?php
                            $maxDisplay = 5;
                            $count = 0;
                            foreach ($stats['by_crawler'] as $visit) {
                                if ($count >= $maxDisplay) break;
                                echo '<tr>';
                                echo '<td><strong>' . esc_html($visit->crawler_name) . '</strong><br>';
                                echo '<small>' . esc_html($visit->crawler_company) . '</small></td>';
                                echo '<td>' . esc_html($visit->visit_count) . ' visits</td>';
                                echo '</tr>';
                                $count++;
                            }
                            ?>
                        </table>
                        <?php if (count($stats['by_crawler']) > $maxDisplay): ?>
                        <p><a href="https://split.dev/dashboard" target="_blank"><?php _e('View all in dashboard →', 'split-analytics'); ?></a></p>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<script type="application/json" id="split-analytics-settings">
<?php echo wp_json_encode($settings->exportSettings()); ?>
</script> 