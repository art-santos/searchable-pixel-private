/**
 * Split Analytics Admin JavaScript
 */
jQuery(document).ready(function($) {
    
    // Test API connection
    $('#test_connection').on('click', function() {
        const button = $(this);
        const apiKey = $('#api_key').val();
        const resultDiv = $('#test_result');
        
        if (!apiKey) {
            resultDiv.html('<span class="error">' + splitAnalytics.strings.error + ' API key is required</span>');
            return;
        }
        
        // Show loading state
        button.prop('disabled', true).text(splitAnalytics.strings.testing);
        resultDiv.html('<span class="loading"><span class="split-analytics-loading"></span>Testing connection...</span>');
        
        // Make AJAX request
        $.ajax({
            url: splitAnalytics.ajaxUrl,
            type: 'POST',
            data: {
                action: 'split_analytics_test_connection',
                nonce: splitAnalytics.nonce,
                api_key: apiKey
            },
            success: function(response) {
                if (response.success) {
                    resultDiv.html('<span class="success">' + splitAnalytics.strings.success + '</span>');
                    $('#api_status').html('<span class="status-good">Connected</span>');
                } else {
                    resultDiv.html('<span class="error">' + splitAnalytics.strings.error + ' ' + response.data + '</span>');
                }
            },
            error: function() {
                resultDiv.html('<span class="error">' + splitAnalytics.strings.error + ' Network error</span>');
            },
            complete: function() {
                button.prop('disabled', false).text('Test Connection');
            }
        });
    });
    
    // Toggle API key visibility
    $('#toggle_api_key').on('click', function() {
        const button = $(this);
        const input = $('#api_key');
        
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            button.text('Hide');
        } else {
            input.attr('type', 'password');
            button.text('Show');
        }
    });
    
    // Clear local data
    $('#clear_data').on('click', function() {
        if (!confirm(splitAnalytics.strings.confirmClear)) {
            return;
        }
        
        const button = $(this);
        
        button.prop('disabled', true).text('Clearing...');
        
        $.ajax({
            url: splitAnalytics.ajaxUrl,
            type: 'POST',
            data: {
                action: 'split_analytics_clear_data',
                nonce: splitAnalytics.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert('Data cleared successfully: ' + response.data);
                    location.reload();
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function() {
                alert('Network error occurred');
            },
            complete: function() {
                button.prop('disabled', false).text('Clear Local Data');
            }
        });
    });
    
    // Export settings
    $('#export_settings').on('click', function() {
        const settingsData = $('#split-analytics-settings').text();
        
        if (!settingsData) {
            alert('No settings data available to export');
            return;
        }
        
        const blob = new Blob([settingsData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = 'split-analytics-settings-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });
    
    // Import settings
    $('#import_settings').on('click', function() {
        $('#import_file').click();
    });
    
    $('#import_file').on('change', function(e) {
        const file = e.target.files[0];
        
        if (!file) {
            return;
        }
        
        if (file.type !== 'application/json') {
            alert('Please select a JSON file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.settings) {
                    alert('Invalid settings file format');
                    return;
                }
                
                if (confirm('This will replace your current settings. Are you sure?')) {
                    // Fill form fields with imported data
                    const settings = data.settings;
                    
                    if (settings.api_key) {
                        $('#api_key').val(settings.api_key);
                    }
                    
                    if (settings.enable_tracking !== undefined) {
                        $('#enable_tracking').prop('checked', settings.enable_tracking);
                    }
                    
                    if (settings.debug_mode !== undefined) {
                        $('#debug_mode').prop('checked', settings.debug_mode);
                    }
                    
                    if (settings.exclude_paths && Array.isArray(settings.exclude_paths)) {
                        $('#exclude_paths').val(settings.exclude_paths.join('\n'));
                    }
                    
                    if (settings.include_paths && Array.isArray(settings.include_paths)) {
                        $('#include_paths').val(settings.include_paths.join('\n'));
                    }
                    
                    if (settings.data_retention_days) {
                        $('#data_retention_days').val(settings.data_retention_days);
                    }
                    
                    alert('Settings imported successfully. Please save the form to apply changes.');
                }
            } catch (error) {
                alert('Error reading settings file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        
        // Reset the file input
        $(this).val('');
    });
    
    // Auto-save indication
    let saveTimeout;
    $('input, textarea, select').on('change', function() {
        clearTimeout(saveTimeout);
        
        // Show unsaved changes indicator
        if (!$('.unsaved-changes').length) {
            $('.split-analytics-actions').prepend('<div class="unsaved-changes" style="color: #dba617; margin-bottom: 10px; font-weight: 500;">⚠ You have unsaved changes</div>');
        }
        
        // Auto-hide after 5 seconds if user doesn't save
        saveTimeout = setTimeout(function() {
            $('.unsaved-changes').fadeOut();
        }, 5000);
    });
    
    // Remove unsaved changes indicator when form is submitted
    $('form').on('submit', function() {
        $('.unsaved-changes').remove();
    });
    
    // Enhanced tooltips for complex fields
    if (typeof jQuery.fn.tooltip !== 'undefined') {
        $('[title]').tooltip({
            position: {
                my: "left top",
                at: "left bottom+10"
            }
        });
    }
    
    // Expandable sections
    $('.crawler-list').on('click', '.crawler-company h4', function() {
        $(this).siblings('ul').slideToggle(200);
        $(this).toggleClass('expanded');
    });
    
    // Keyboard shortcuts
    $(document).on('keydown', function(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            $('form').submit();
        }
        
        // Ctrl+T to test connection (if API key is filled)
        if (e.ctrlKey && e.keyCode === 84) {
            e.preventDefault();
            if ($('#api_key').val()) {
                $('#test_connection').click();
            }
        }
    });
    
    // Real-time API key format validation
    $('#api_key').on('input', function() {
        const apiKey = $(this).val();
        const resultDiv = $('#test_result');
        
        if (apiKey.length === 0) {
            resultDiv.empty();
            return;
        }
        
        if (!apiKey.startsWith('split_live_') && !apiKey.startsWith('split_test_')) {
            resultDiv.html('<span class="error">Invalid API key format. Keys should start with "split_live_" or "split_test_"</span>');
        } else {
            resultDiv.empty();
        }
    });
    
    // Character counter for textarea fields
    $('textarea').each(function() {
        const textarea = $(this);
        const maxLength = textarea.attr('maxlength');
        
        if (maxLength) {
            const counter = $('<div class="char-counter" style="text-align: right; font-size: 11px; color: #666; margin-top: 5px;"></div>');
            textarea.after(counter);
            
            function updateCounter() {
                const current = textarea.val().length;
                counter.text(current + ' / ' + maxLength);
                
                if (current > maxLength * 0.9) {
                    counter.css('color', '#d63638');
                } else if (current > maxLength * 0.8) {
                    counter.css('color', '#dba617');
                } else {
                    counter.css('color', '#666');
                }
            }
            
            textarea.on('input', updateCounter);
            updateCounter();
        }
    });
    
    // Auto-refresh stats every 30 seconds (if on settings page)
    if ($('.split-analytics-overview').length) {
        setInterval(function() {
            // Only refresh if page is visible
            if (!document.hidden) {
                location.reload();
            }
        }, 30000);
    }
    
    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $($(this).attr('href'));
        
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 50
            }, 500);
        }
    });
    
    // Form validation before submit
    $('form').on('submit', function(e) {
        const apiKey = $('#api_key').val();
        
        if (apiKey && !apiKey.startsWith('split_live_') && !apiKey.startsWith('split_test_')) {
            e.preventDefault();
            alert('Please enter a valid API key format (starting with "split_live_" or "split_test_")');
            $('#api_key').focus();
            return false;
        }
        
        // Validate regex patterns in exclude/include paths
        const excludePaths = $('#exclude_paths').val().split('\n').filter(path => path.trim());
        const includePaths = $('#include_paths').val().split('\n').filter(path => path.trim());
        
        const testRegex = function(patterns, fieldName) {
            for (let i = 0; i < patterns.length; i++) {
                try {
                    new RegExp(patterns[i]);
                } catch (regexError) {
                    e.preventDefault();
                    alert(`Invalid regex pattern in ${fieldName} (line ${i + 1}): ${patterns[i]}`);
                    return false;
                }
            }
            return true;
        };
        
        if (!testRegex(excludePaths, 'Exclude Paths') || !testRegex(includePaths, 'Include Paths')) {
            return false;
        }
    });
});

// Dashboard widget refresh functionality
if (typeof wp !== 'undefined' && wp.heartbeat) {
    wp.heartbeat.interval('fast');
    
    $(document).on('heartbeat-send', function(e, data) {
        data['split_analytics_widget_refresh'] = true;
    });
    
    $(document).on('heartbeat-tick', function(e, data) {
        if (data['split_analytics_widget_data']) {
            $('#split_analytics_dashboard .inside').html(data['split_analytics_widget_data']);
        }
    });
} 