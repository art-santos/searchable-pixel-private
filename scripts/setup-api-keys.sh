#!/bin/bash

echo "🔑 Split Leads API Key Setup"
echo "=========================="
echo ""
echo "This script will help you set up the required API keys for full enrichment."
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "📄 Found existing .env.local file"
    echo "Do you want to update it? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "Keeping existing configuration."
        exit 0
    fi
fi

echo ""
echo "📋 You'll need API keys from:"
echo "1. IPInfo - https://ipinfo.io/account/token"
echo "2. Exa - https://dashboard.exa.ai/api-keys"
echo ""
echo "Press Enter when you have these ready..."
read -r

# Get Supabase credentials
echo ""
echo "Enter your Supabase URL:"
read -r SUPABASE_URL

echo "Enter your Supabase Anon Key:"
read -r SUPABASE_ANON_KEY

echo "Enter your Supabase Service Role Key:"
read -r SUPABASE_SERVICE_KEY

# Get enrichment API keys
echo ""
echo "Enter your IPInfo Token:"
read -r IPINFO_TOKEN

echo "Enter your Exa API Key:"
read -r EXA_API_KEY

# Create .env.local file
cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Enrichment APIs
IPINFO_TOKEN=$IPINFO_TOKEN
EXA_API_KEY=$EXA_API_KEY

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo ""
echo "✅ Created .env.local file!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: node scripts/test-leads-direct-enrichment.js"
echo "2. This will show full enrichment results with real API calls" 