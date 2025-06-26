#!/bin/bash

# Install dependencies for comprehensive audit system
echo "🔧 Installing dependencies for comprehensive audit system..."

# Add jsdom for HTML parsing in enhanced Firecrawl client
pnpm add jsdom

# Add types for jsdom
pnpm add -D @types/jsdom

echo "✅ Dependencies installed successfully!"
echo ""
echo "📦 Added packages:"
echo "  - jsdom (for HTML parsing and DOM analysis)"
echo "  - @types/jsdom (TypeScript types)"
echo ""
echo "🚀 You can now run the comprehensive audit system!" 