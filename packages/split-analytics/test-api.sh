#!/bin/bash

echo "🧪 Testing Split Analytics API endpoints..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API key is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./test-api.sh YOUR_API_KEY [--local]${NC}"
    echo "Get your API key from: https://split.dev/dashboard"
    echo "Use --local flag to test against localhost:3000"
    exit 1
fi

API_KEY="$1"

# Check if --local flag is provided
if [ "$2" = "--local" ]; then
    BASE_URL="http://localhost:3000/api"
    echo -e "${YELLOW}Testing against local development server${NC}"
else
    BASE_URL="https://split.dev/api"
    echo -e "${YELLOW}Testing against production server${NC}"
fi

echo -e "\n🔑 Using API key: ${API_KEY:0:8}..."
echo -e "🌐 Endpoint: $BASE_URL"

# Test 1: Test crawler-events endpoint (GET for basic connectivity)
echo -e "\n📡 Testing crawler-events endpoint..."
PING_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    "$BASE_URL/crawler-events")

if [ "$PING_RESPONSE" = "200" ]; then
    echo -e "✅ ${GREEN}API endpoint reachable${NC}"
else
    echo -e "❌ ${RED}API endpoint test failed (HTTP $PING_RESPONSE)${NC}"
fi

# Test 2: Test crawler event submission
echo -e "\n📊 Testing crawler event submission..."
TRACK_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "events": [{
            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "domain": "test.example.com",
            "path": "/test-api-verification",
            "crawlerName": "GPTBot",
            "crawlerCompany": "OpenAI",
            "crawlerCategory": "ai-training",
            "userAgent": "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
            "statusCode": 200,
            "responseTimeMs": 150,
            "metadata": {
                "source": "test-api-script"
            }
        }]
    }' \
    "$BASE_URL/crawler-events")

# Get response body and status code separately for better debugging
TRACK_BODY=$(curl -s -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "events": [{
            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "domain": "test.example.com",
            "path": "/test-api-verification",
            "crawlerName": "GPTBot",
            "crawlerCompany": "OpenAI",
            "crawlerCategory": "ai-training",
            "userAgent": "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
            "statusCode": 200,
            "responseTimeMs": 150,
            "metadata": {
                "source": "test-api-script"
            }
        }]
    }' \
    "$BASE_URL/crawler-events")

TRACK_STATUS=$(echo "$TRACK_BODY" | grep -o '"success":true' || echo "")

if [ "$TRACK_RESPONSE" = "200" ] && [ -n "$TRACK_STATUS" ]; then
    echo -e "✅ ${GREEN}Crawler event tracking successful${NC}"
    echo -e "   Response: ${TRACK_BODY}"
else
    echo -e "❌ ${RED}Crawler event tracking failed (HTTP $TRACK_RESPONSE)${NC}"
    echo -e "   Response: ${TRACK_BODY}"
fi

# Test 3: Test with another crawler type
echo -e "\n🤖 Testing with Claude crawler..."
CRAWLER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "events": [{
            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "domain": "test.example.com", 
            "path": "/test-claude-detection",
            "crawlerName": "ClaudeBot",
            "crawlerCompany": "Anthropic",
            "crawlerCategory": "ai-training",
            "userAgent": "Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://www.anthropic.com)",
            "statusCode": 200,
            "responseTimeMs": 120,
            "metadata": {
                "source": "test-api-script"
            }
        }]
    }' \
    "$BASE_URL/crawler-events")

if [ "$CRAWLER_RESPONSE" = "200" ]; then
    echo -e "✅ ${GREEN}Claude crawler detection working${NC}"
else
    echo -e "❌ ${RED}Claude crawler detection failed (HTTP $CRAWLER_RESPONSE)${NC}"
fi

echo -e "\n🎉 API tests complete!"
echo -e "\n📊 Check your dashboard at https://split.dev/dashboard to see the test events" 