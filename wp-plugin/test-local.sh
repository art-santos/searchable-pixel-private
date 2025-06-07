#!/bin/bash

echo "🧪 Split Analytics Local Testing Script"
echo "========================================"

# WordPress site URL
SITE_URL="http://localhost:8080"

# Check if WordPress is running
echo "📋 Checking if WordPress is accessible..."
if curl -s "$SITE_URL" > /dev/null; then
    echo "✅ WordPress is running at $SITE_URL"
else
    echo "❌ WordPress is not accessible. Make sure Docker is running: docker-compose up -d"
    exit 1
fi

echo ""
echo "🤖 Testing AI Crawler Detection..."
echo "--------------------------------"

# Array of AI crawler user agents to test
declare -a crawlers=(
    "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)"
    "Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)"
    "Claude-Web/1.0"
    "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)"
    "Mozilla/5.0 (compatible; Google-Extended/1.0; +https://developers.google.com/search/docs/crawlers)"
    "Mozilla/5.0 (compatible; anthropic-ai; +https://www.anthropic.com/)"
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
)

declare -a names=(
    "OpenAI GPTBot"
    "ChatGPT User"
    "Claude"
    "Perplexity"
    "Google Extended"
    "Anthropic"
    "Regular Browser"
)

# Test each crawler
for i in "${!crawlers[@]}"; do
    echo "Testing: ${names[$i]}"
    echo "User-Agent: ${crawlers[$i]}"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "User-Agent: ${crawlers[$i]}" \
        "$SITE_URL" 2>/dev/null)
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Request successful (HTTP $http_code)"
    else
        echo "⚠️  Request returned HTTP $http_code"
    fi
    echo "---"
done

echo ""
echo "📊 Check WordPress Admin for Analytics Data:"
echo "   Admin URL: $SITE_URL/wp-admin"
echo "   Go to: Split Analytics > Dashboard"
echo ""
echo "🔍 Check Database Directly:"
echo "   docker-compose exec db mysql -u wordpress -pwordpress wordpress"
echo "   SELECT * FROM wp_split_analytics_visits ORDER BY visit_time DESC LIMIT 10;"
echo ""
echo "📝 Check Debug Logs:"
echo "   docker-compose logs wordpress | grep 'Split Analytics'" 