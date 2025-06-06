#!/bin/bash

# Split AI Crawler Attribution - Database Cleanup Script
# This script safely runs the database cleanup migration

set -e  # Exit on any error

echo "🚀 Split AI Crawler Attribution - Database Cleanup"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20250106000000_database_cleanup_for_attribution.sql" ]; then
    echo "❌ Error: Migration file not found!"
    echo "   Make sure you're running this from the project root directory"
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found!"
    echo "   Please install it: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "🔍 Pre-migration checks..."
echo ""

# Check current status
echo "📊 Current database status:"
supabase status

echo ""
echo "⚠️  IMPORTANT WARNINGS:"
echo "   - This will DELETE old visibility and content generation data"
echo "   - Crawler tracking data will be PRESERVED and enhanced"
echo "   - User accounts, workspaces, and billing data will be PRESERVED"
echo "   - Old API endpoints for visibility/content will stop working"
echo ""

# Confirm with user
read -p "Do you want to proceed with the cleanup? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "❌ Migration cancelled by user"
    exit 0
fi

echo "🗄️  Creating database backup..."
# Note: This would need to be customized based on your backup strategy
# For now, just remind the user
echo "   ⚠️  REMINDER: Make sure you have a recent database backup!"
echo "   📖 Backup guide: https://supabase.com/docs/guides/platform/backups"
echo ""

read -p "Do you have a recent backup? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "❌ Please create a backup first before proceeding"
    exit 1
fi

echo "🔄 Running database cleanup migration..."
echo ""

# Apply the migration
if supabase db push; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎉 Your database is now clean and attribution-ready!"
    echo ""
    echo "📋 Summary of changes:"
    echo "   ✅ Removed: Old visibility system (max_visibility_*)"
    echo "   ✅ Removed: Old content generation (knowledge_base_items, etc.)"
    echo "   ✅ Removed: Site audit tables (not needed for attribution)"
    echo "   ✅ Enhanced: crawler_visits table with attribution fields"
    echo "   ✅ Added: attribution_reports, content_attribution tables"
    echo "   ✅ Added: crawler_detection_rules with default AI patterns"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Update your API clients to use new attribution endpoints"
    echo "   2. Transform visibility page → attribution dashboard"
    echo "   3. Transform content page → reports & setup"
    echo "   4. Implement company enrichment (rb2b integration)"
    echo ""
    echo "📖 See DATABASE_CLEANUP_SUMMARY.md for full details"
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Check the error messages above"
    echo "   Your database should be unchanged"
    echo "   You may need to fix issues and try again"
    exit 1
fi

echo ""
echo "🔍 Verifying migration..."

# Quick verification
echo "📊 Checking new tables exist..."
if supabase db inspect --table crawler_detection_rules > /dev/null 2>&1; then
    echo "   ✅ crawler_detection_rules table created"
else
    echo "   ❌ crawler_detection_rules table missing"
fi

if supabase db inspect --table attribution_reports > /dev/null 2>&1; then
    echo "   ✅ attribution_reports table created"
else
    echo "   ❌ attribution_reports table missing"
fi

if supabase db inspect --table content_attribution > /dev/null 2>&1; then
    echo "   ✅ content_attribution table created"
else
    echo "   ❌ content_attribution table missing"
fi

echo ""
echo "🎯 Ready to build your AI Crawler Attribution system!"
echo "   Happy coding! 🚀" 