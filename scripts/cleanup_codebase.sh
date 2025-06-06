#!/bin/bash

# Codebase Cleanup Script - Remove Content & Visibility Systems
# This script removes files and directories related to content generation and visibility tracking

set -e  # Exit on any error

echo "🧹 Split Codebase Cleanup - Content & Visibility Systems"
echo "========================================================"
echo ""

echo "⚠️  This will PERMANENTLY DELETE:"
echo "   📁 src/app/api/max-visibility/"
echo "   📁 src/app/visibility/"  
echo "   📁 src/lib/max-visibility/"
echo "   📁 src/app/api/knowledge-base/"
echo "   📁 src/lib/knowledge-base/"
echo "   📄 Multiple individual files (hooks, components, test files)"
echo ""

read -p "Are you sure you want to proceed? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "❌ Cleanup cancelled by user"
    exit 0
fi

echo "🗑️  Removing visibility system directories..."

if [ -d "src/app/api/max-visibility" ]; then
    rm -rf src/app/api/max-visibility/
    echo "   ✅ Removed src/app/api/max-visibility/"
else
    echo "   ⏭️  src/app/api/max-visibility/ not found (already removed)"
fi

if [ -d "src/app/visibility" ]; then
    rm -rf src/app/visibility/
    echo "   ✅ Removed src/app/visibility/"
else
    echo "   ⏭️  src/app/visibility/ not found (already removed)"
fi

if [ -d "src/lib/max-visibility" ]; then
    rm -rf src/lib/max-visibility/
    echo "   ✅ Removed src/lib/max-visibility/"
else
    echo "   ⏭️  src/lib/max-visibility/ not found (already removed)"
fi

echo ""
echo "🗑️  Removing content generation directories..."

if [ -d "src/app/api/knowledge-base" ]; then
    rm -rf src/app/api/knowledge-base/
    echo "   ✅ Removed src/app/api/knowledge-base/"
else
    echo "   ⏭️  src/app/api/knowledge-base/ not found (already removed)"
fi

if [ -d "src/lib/knowledge-base" ]; then
    rm -rf src/lib/knowledge-base/
    echo "   ✅ Removed src/lib/knowledge-base/"
else
    echo "   ⏭️  src/lib/knowledge-base/ not found (already removed)"
fi

echo ""
echo "🗑️  Removing individual files..."

FILES_TO_REMOVE=(
    "src/hooks/useMaxVisibility.ts"
    "src/hooks/useKnowledgeBase.ts"
    "src/app/content/components/knowledge-base-tab.tsx"
    "test-workspace-isolation.js"
    "run-workspace-migration.js"
    "scripts/check-competitors.js"
)

for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "   ✅ Removed $file"
    else
        echo "   ⏭️  $file not found (already removed)"
    fi
done

echo ""
echo "✅ File cleanup completed!"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "📝 1. Edit src/app/content/page.tsx:"
echo "      - Remove KnowledgeBaseTab import"
echo "      - Remove 'knowledge' tab from tabs array"
echo "      - Remove KnowledgeBaseTab JSX"
echo ""
echo "📝 2. Edit src/app/api/workspaces/[workspaceId]/settings/route.ts:"
echo "      - Remove max_visibility_days references"
echo ""
echo "📝 3. Edit src/app/api/usage/current/route.ts:"
echo "      - Remove max_visibility_runs query"
echo ""
echo "📝 4. Edit src/hooks/useWorkspaceData.ts:"
echo "      - Remove max_visibility_runs references"
echo ""
echo "📝 5. Edit src/components/onboarding/onboarding-flow.tsx:"
echo "      - Remove knowledgeBase field and logic"
echo ""
echo "📝 6. Edit src/lib/onboarding/database.ts:"
echo "      - Remove knowledgeBase interface field"
echo ""
echo "📝 7. Edit supabase/supabase.ts:"
echo "      - Remove generated_content types"
echo ""
echo "🧪 8. Test the build:"
echo "      npm run build (or pnpm build)"
echo ""
echo "📖 See CODEBASE_CLEANUP_LIST.md for detailed instructions"
echo ""
echo "🎉 Ready to start building your AI Crawler Attribution system!" 