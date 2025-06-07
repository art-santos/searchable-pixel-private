<?php
/**
 * Split Analytics API Client
 */
class SplitAnalyticsApiClient {
    
    private $apiEndpoint;
    private $timeout;
    private $userAgent;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->apiEndpoint = 'https://split.dev/api';
        $this->timeout = 30;
        $this->userAgent = 'Split Analytics WordPress Plugin/' . SPLIT_ANALYTICS_VERSION;
    }
    
    /**
     * Send crawler events to the API
     * 
     * @param array $events Array of crawler events
     * @return bool True if successful, false otherwise
     */
    public function sendEvents($events) {
        $settings = new SplitAnalyticsSettings();
        $apiKey = $settings->getApiKey();
        
        if (empty($apiKey)) {
            if ($settings->isDebugEnabled()) {
                error_log('Split Analytics API: No API key configured');
            }
            return false;
        }
        
        $payload = array(
            'events' => $events
        );
        
        $response = $this->makeRequest('POST', '/crawler-events', $payload, $apiKey);
        
        if ($settings->isDebugEnabled()) {
            if ($response['success']) {
                error_log('Split Analytics API: Successfully sent ' . count($events) . ' events');
            } else {
                error_log('Split Analytics API: Failed to send events - ' . $response['message']);
            }
        }
        
        return $response['success'];
    }
    
    /**
     * Test API connection
     * 
     * @param string $apiKey API key to test (optional, uses settings if not provided)
     * @return array Response with success status and message
     */
    public function ping($apiKey = null) {
        if (empty($apiKey)) {
            $settings = new SplitAnalyticsSettings();
            $apiKey = $settings->getApiKey();
        }
        
        if (empty($apiKey)) {
            return array(
                'success' => false,
                'message' => __('No API key provided', 'split-analytics')
            );
        }
        
        // Validate API key format
        if (!$this->isValidApiKeyFormat($apiKey)) {
            return array(
                'success' => false,
                'message' => __('Invalid API key format. Keys should start with "split_live_" or "split_test_"', 'split-analytics')
            );
        }
        
        $response = $this->makeRequest('GET', '/ping', null, $apiKey);
        
        return $response;
    }
    
    /**
     * Validate API key format
     * 
     * @param string $apiKey The API key to validate
     * @return bool True if valid format
     */
    private function isValidApiKeyFormat($apiKey) {
        return (strpos($apiKey, 'split_live_') === 0 || strpos($apiKey, 'split_test_') === 0);
    }
    
    /**
     * Make HTTP request to API
     * 
     * @param string $method HTTP method (GET, POST, etc.)
     * @param string $endpoint API endpoint path
     * @param array $data Request data (for POST requests)
     * @param string $apiKey API key for authentication
     * @return array Response array with success status and data/message
     */
    private function makeRequest($method, $endpoint, $data = null, $apiKey = null) {
        $url = $this->apiEndpoint . $endpoint;
        
        // Prepare headers
        $headers = array(
            'Content-Type' => 'application/json',
            'User-Agent' => $this->userAgent,
            'Accept' => 'application/json'
        );
        
        if ($apiKey) {
            $headers['Authorization'] = 'Bearer ' . $apiKey;
        }
        
        // Prepare request arguments
        $args = array(
            'method' => $method,
            'headers' => $headers,
            'timeout' => $this->timeout,
            'sslverify' => true,
            'user-agent' => $this->userAgent
        );
        
        // Add body for POST requests
        if ($method === 'POST' && $data) {
            $args['body'] = wp_json_encode($data);
        }
        
        // Make the request
        $response = wp_remote_request($url, $args);
        
        // Handle WordPress HTTP errors
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => sprintf(__('Network error: %s', 'split-analytics'), $response->get_error_message())
            );
        }
        
        $responseCode = wp_remote_retrieve_response_code($response);
        $responseBody = wp_remote_retrieve_body($response);
        
        // Parse JSON response
        $decodedResponse = json_decode($responseBody, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return array(
                'success' => false,
                'message' => sprintf(__('Invalid JSON response: %s', 'split-analytics'), json_last_error_msg())
            );
        }
        
        // Handle different response codes
        switch ($responseCode) {
            case 200:
            case 201:
                return array(
                    'success' => true,
                    'data' => $decodedResponse
                );
                
            case 400:
                return array(
                    'success' => false,
                    'message' => isset($decodedResponse['message']) ? $decodedResponse['message'] : __('Bad request', 'split-analytics')
                );
                
            case 401:
                return array(
                    'success' => false,
                    'message' => __('Invalid API key. Please check your key in the Split Analytics dashboard.', 'split-analytics')
                );
                
            case 403:
                return array(
                    'success' => false,
                    'message' => __('API key access denied. Verify your key has the correct permissions.', 'split-analytics')
                );
                
            case 404:
                return array(
                    'success' => false,
                    'message' => __('API endpoint not found. This might be a temporary issue with the Split Analytics service.', 'split-analytics')
                );
                
            case 429:
                return array(
                    'success' => false,
                    'message' => __('Rate limit exceeded. Please wait a moment and try again.', 'split-analytics')
                );
                
            case 500:
            case 502:
            case 503:
            case 504:
                return array(
                    'success' => false,
                    'message' => __('Split Analytics server error. Please try again later.', 'split-analytics')
                );
                
            default:
                return array(
                    'success' => false,
                    'message' => sprintf(__('HTTP %d: %s', 'split-analytics'), $responseCode, wp_remote_retrieve_response_message($response))
                );
        }
    }
    
    /**
     * Get account information
     * 
     * @return array Account information or error
     */
    public function getAccountInfo() {
        $response = $this->makeRequest('GET', '/account');
        return $response;
    }
    
    /**
     * Get usage statistics
     * 
     * @param array $params Query parameters (optional)
     * @return array Usage statistics or error
     */
    public function getUsageStats($params = array()) {
        $endpoint = '/usage';
        if (!empty($params)) {
            $endpoint .= '?' . http_build_query($params);
        }
        
        $response = $this->makeRequest('GET', $endpoint);
        return $response;
    }
    
    /**
     * Set custom API endpoint (for testing)
     * 
     * @param string $endpoint Custom API endpoint URL
     */
    public function setApiEndpoint($endpoint) {
        $this->apiEndpoint = rtrim($endpoint, '/');
    }
    
    /**
     * Set request timeout
     * 
     * @param int $timeout Timeout in seconds
     */
    public function setTimeout($timeout) {
        $this->timeout = max(5, intval($timeout));
    }
    
    /**
     * Get current API endpoint
     * 
     * @return string Current API endpoint
     */
    public function getApiEndpoint() {
        return $this->apiEndpoint;
    }
    
    /**
     * Test network connectivity to the API
     * 
     * @return array Test result
     */
    public function testConnectivity() {
        $url = $this->apiEndpoint . '/ping';
        
        $response = wp_remote_get($url, array(
            'timeout' => 10,
            'sslverify' => true,
            'user-agent' => $this->userAgent
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => sprintf(__('Network connectivity test failed: %s', 'split-analytics'), $response->get_error_message())
            );
        }
        
        $responseCode = wp_remote_retrieve_response_code($response);
        
        if ($responseCode === 200 || $responseCode === 401) {
            // 200 = success, 401 = server is reachable but no auth provided (expected)
            return array(
                'success' => true,
                'message' => __('Network connectivity test passed', 'split-analytics')
            );
        } else {
            return array(
                'success' => false,
                'message' => sprintf(__('Network connectivity test failed with HTTP %d', 'split-analytics'), $responseCode)
            );
        }
    }
    
    /**
     * Batch send with retry logic
     * 
     * @param array $events Events to send
     * @param int $maxRetries Maximum number of retries
     * @return bool Success status
     */
    public function sendEventsWithRetry($events, $maxRetries = 3) {
        $attempt = 0;
        
        while ($attempt < $maxRetries) {
            $success = $this->sendEvents($events);
            
            if ($success) {
                return true;
            }
            
            $attempt++;
            
            if ($attempt < $maxRetries) {
                // Wait before retrying (exponential backoff)
                $waitTime = pow(2, $attempt);
                sleep($waitTime);
            }
        }
        
        // Log final failure
        $settings = new SplitAnalyticsSettings();
        if ($settings->isDebugEnabled()) {
            error_log('Split Analytics API: Failed to send events after ' . $maxRetries . ' attempts');
        }
        
        return false;
    }
} 