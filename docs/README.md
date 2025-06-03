# Split Documentation

Welcome to the Split documentation! This guide will help you understand, set up, and work with the Split platform.

## 📁 Documentation Structure

### 🏗️ Architecture
- **[MAX Visibility Pipeline Architecture](./architecture/max-visibility-pipeline-architecture.md)** - Complete technical architecture of the MAX Visibility assessment system
- **[MAX Visibility Overview](./architecture/max-visibility.md)** - High-level overview of the MAX Visibility feature

### ✨ Features
- **[Knowledge Base Integration](./features/knowledge-base-integration-feature-map.md)** - How the knowledge base enhances company analysis
- **[Visibility Testing](./features/visibility-test.md)** - Testing and validation of visibility features

### ⚙️ Setup & Configuration
- **[Analytics Implementation](./setup/analytics-implementation-guide.md)** - Setting up analytics tracking
- **[Visibility Integration](./setup/VISIBILITY_INTEGRATION.md)** - Integrating visibility features
- **[Crawler Build](./setup/crawler-build.md)** - Building and configuring the web crawler
- **[NPM Package Setup](./setup/npm-package.md)** - Setting up the Split Analytics NPM package
- **[Stripe Setup](./stripe-setup.md)** - Payment processing configuration
- **[Cron Setup](./cron-setup.md)** - Scheduled task configuration

### 📖 Guides
- **[User Journey](./guides/userpath.md)** - Complete user experience flow
- **[Content Strategy](./guides/content.md)** - Content creation and management
- **[Animation System](./guides/animations.md)** - Using the animation system
- **[Anime.js Integration](./guides/animejs.md)** - Advanced animations with Anime.js
- **[Keywords Guide](./guides/keywords.md)** - Keyword research and optimization

### 🔧 Troubleshooting
- **[Authentication Debug](./troubleshooting/auth-debug-guide.md)** - Debugging authentication issues
- **[Voting System Issues](./troubleshooting/)** - Voting-related troubleshooting
  - [Voting Auth Requirements](./troubleshooting/voting-auth-requirement.md)
  - [Voting Fixes Summary](./troubleshooting/voting-fixes-summary.md)
  - [Voting Troubleshooting](./troubleshooting/voting-troubleshooting.md)
  - [Voting System Summary](./troubleshooting/voting-system-summary.md)
  - [Test Voting](./troubleshooting/test-voting.md)
- **[Database Issues](./troubleshooting/)** - Database-related fixes
  - [Database Fix](./troubleshooting/database_fix.md)
  - [Database Migration](./troubleshooting/db_migration.md)

### 🎨 UI Components
- **[ShadCN Components](./shadcn.md)** - Complete ShadCN UI component library
- **[SBAC System](./sbac.md)** - Smart Button Action Component system
- **[SBAC Implementation](./sbac-implementation-plan.md)** - Implementation guide for SBAC
- **[SBAC Usage Guide](./sbac-phase3-usage-guide.md)** - How to use SBAC components
- **[SBAC Summary](./sbac-summary.md)** - Overview of SBAC features
- **[SBAC Upgrade Dialog](./sbac-upgrade-dialog-demo.md)** - Upgrade dialog implementation

### 📊 Analytics & Scoring
- **[AEO Scorecard](./aeo-scorecard.md)** - Answer Engine Optimization scoring
- **[AEO Scorecard Plan](./aeo-scorecard-plan.md)** - Implementation plan for AEO scoring
- **[Site Audit](./site-audit.md)** - Website audit functionality

## 🚀 Quick Start

1. **New Developer Setup**
   - Read the [Architecture Overview](./architecture/max-visibility.md)
   - Follow the [Setup Guide](./setup/analytics-implementation-guide.md)
   - Review the [User Journey](./guides/userpath.md)

2. **Feature Development**
   - Check [Features Documentation](./features/)
   - Review [UI Components](./shadcn.md)
   - Follow [Troubleshooting Guides](./troubleshooting/)

3. **Deployment**
   - Configure [Analytics](./setup/analytics-implementation-guide.md)
   - Set up [Stripe](./stripe-setup.md)
   - Configure [Cron Jobs](./cron-setup.md)

## 📋 Code Organization

### Refactored Components

The codebase has been systematically refactored to improve maintainability:

#### MAX Visibility Pipeline
- **Original**: `src/lib/max-visibility/pipeline.ts` (1,818 lines)
- **Refactored into**:
  - `src/lib/max-visibility/types/pipeline-types.ts` - Type definitions
  - `src/lib/max-visibility/services/company-context-service.ts` - Company context building
  - `src/lib/max-visibility/services/database-service.ts` - Database operations
  - `src/lib/max-visibility/scorers/visibility-scorer.ts` - Scoring algorithms
  - `src/lib/max-visibility/analyzers/gpt4o-analyzer.ts` - GPT-4o analysis
  - `src/lib/max-visibility/utils/competitor-utils.ts` - Competitor analysis utilities
  - `src/lib/max-visibility/pipeline-refactored.ts` - Clean orchestration

#### Onboarding System
- **Original**: `src/components/onboarding/onboarding-overlay.tsx` (1,518 lines)
- **Refactored into**:
  - `src/components/onboarding/types/onboarding-types.ts` - Type definitions
  - `src/components/onboarding/utils/onboarding-constants.ts` - Constants and configuration
  - `src/components/onboarding/hooks/useOnboardingState.ts` - State management hook
  - `src/components/onboarding/steps/WorkspaceStep.tsx` - Individual step components
  - `src/components/onboarding/steps/PricingStep.tsx` - Pricing step component
  - `src/components/onboarding/onboarding-overlay-refactored.tsx` - Clean orchestration

### Benefits of Refactoring
- ✅ **Single Responsibility Principle** - Each file has one clear purpose
- ✅ **Testability** - Components can be tested independently
- ✅ **Maintainability** - Easy to find and modify specific functionality
- ✅ **Readability** - Clean, focused code
- ✅ **Reusability** - Services can be used independently

## 🤝 Contributing

When working on this codebase:

1. **Keep files under 300 lines** - Break down large files into focused components
2. **Use the established patterns** - Follow the refactored architecture
3. **Document your changes** - Update relevant documentation
4. **Test thoroughly** - Ensure components work independently

## 📞 Support

For questions or issues:
- Check the [Troubleshooting Guide](./troubleshooting/)
- Review the [Architecture Documentation](./architecture/)
- Consult the [Feature Documentation](./features/)

---

*This documentation is maintained as part of the Split platform. Last updated: $(date)*