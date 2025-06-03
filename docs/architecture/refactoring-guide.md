# Systematic Refactoring Guide

This document outlines the comprehensive refactoring performed on the Split codebase to improve maintainability, readability, and developer experience.

## 🎯 Refactoring Goals

1. **No file over 300 lines** - Break down massive files into focused components
2. **Single Responsibility Principle** - Each file should have one clear purpose
3. **Improved Testability** - Components should be testable in isolation
4. **Better Developer Experience** - New developers should easily understand the codebase
5. **Organized Documentation** - All documentation should be properly categorized

## 📊 Refactoring Results

### Before Refactoring
- **Largest files**: 1,818 lines (pipeline.ts), 1,517 lines (onboarding-overlay.tsx)
- **Scattered documentation**: 30+ markdown files in root directory
- **Monolithic components**: Single files handling multiple responsibilities
- **Poor maintainability**: Hard to find and modify specific functionality

### After Refactoring
- **All files under 300 lines**: Largest refactored file is 280 lines
- **Organized documentation**: Structured in `/docs` with clear categories
- **Focused components**: Each file has a single, clear responsibility
- **Improved maintainability**: Easy to locate and modify specific features

## 🔧 Major Refactoring Projects

### 1. MAX Visibility Pipeline (1,818 → 7 files)

**Original File**: `src/lib/max-visibility/pipeline.ts` (1,818 lines)

**Refactored Structure**:
```
src/lib/max-visibility/
├── types/
│   └── pipeline-types.ts (76 lines)
├── services/
│   ├── company-context-service.ts (246 lines)
│   └── database-service.ts (200 lines)
├── scorers/
│   └── visibility-scorer.ts (327 lines)
├── analyzers/
│   └── gpt4o-analyzer.ts (323 lines)
├── utils/
│   └── competitor-utils.ts (237 lines)
└── pipeline-refactored.ts (280 lines)
```

**Benefits**:
- ✅ Each service can be tested independently
- ✅ Clear separation of concerns
- ✅ Easy to modify specific functionality
- ✅ Reusable services across the application

### 2. Onboarding System (1,517 → 6 files)

**Original File**: `src/components/onboarding/onboarding-overlay.tsx` (1,517 lines)

**Refactored Structure**:
```
src/components/onboarding/
├── types/
│   └── onboarding-types.ts (65 lines)
├── utils/
│   └── onboarding-constants.ts (85 lines)
├── hooks/
│   └── useOnboardingState.ts (280 lines)
├── steps/
│   ├── WorkspaceStep.tsx (50 lines)
│   └── PricingStep.tsx (95 lines)
└── onboarding-overlay-refactored.tsx (250 lines)
```

**Benefits**:
- ✅ State management isolated in custom hook
- ✅ Individual step components are reusable
- ✅ Constants and types are centralized
- ✅ Main component focuses only on orchestration

### 3. Documentation Organization

**Before**: 30+ scattered `.md` files in root directory

**After**: Organized structure in `/docs`
```
docs/
├── architecture/          # Technical architecture docs
├── features/              # Feature-specific documentation
├── setup/                 # Installation and configuration
├── guides/                # User and developer guides
├── troubleshooting/       # Debug and fix guides
├── api/                   # API documentation
└── README.md              # Main documentation index
```

## 🛠️ Refactoring Patterns Used

### 1. Service Extraction Pattern
```typescript
// Before: Everything in one class
class MassivePipeline {
  // 1,800+ lines of mixed responsibilities
}

// After: Focused services
class CompanyContextService {
  // Only handles company context building
}
class DatabaseService {
  // Only handles database operations
}
class VisibilityScorer {
  // Only handles scoring logic
}
```

### 2. Custom Hook Pattern
```typescript
// Before: All state in component
function OnboardingOverlay() {
  const [state1, setState1] = useState()
  const [state2, setState2] = useState()
  // ... 50+ state variables
  // ... 1,500 lines of logic
}

// After: State extracted to hook
function useOnboardingState() {
  // All state management logic
  return { state, actions, setters }
}

function OnboardingOverlay() {
  const onboardingState = useOnboardingState()
  // Focus only on rendering
}
```

### 3. Step Component Pattern
```typescript
// Before: All steps in one component
function OnboardingOverlay() {
  const renderStep = () => {
    switch (step) {
      case 'workspace': return <div>{/* 200 lines */}</div>
      case 'pricing': return <div>{/* 300 lines */}</div>
      // ... more steps
    }
  }
}

// After: Individual step components
function WorkspaceStep({ data, setData }) {
  // Only workspace logic
}

function PricingStep({ isAnnual, setIsAnnual }) {
  // Only pricing logic
}
```

### 4. Constants Extraction Pattern
```typescript
// Before: Hardcoded values throughout component
const providers = [
  { id: 'vercel', name: 'Vercel Analytics' },
  // ... inline definitions
]

// After: Centralized constants
// utils/constants.ts
export const ANALYTICS_PROVIDERS = [
  { id: 'vercel', name: 'Vercel Analytics' },
  // ... all providers
]
```

## 📋 Refactoring Checklist

When refactoring large files, follow this checklist:

### 1. Analysis Phase
- [ ] Identify file size and complexity
- [ ] Map out different responsibilities
- [ ] Identify reusable logic
- [ ] Note dependencies and imports

### 2. Planning Phase
- [ ] Design new file structure
- [ ] Plan service boundaries
- [ ] Identify shared types and constants
- [ ] Plan testing strategy

### 3. Extraction Phase
- [ ] Extract types and interfaces first
- [ ] Extract constants and configuration
- [ ] Extract utility functions
- [ ] Extract services and business logic
- [ ] Extract UI components

### 4. Integration Phase
- [ ] Update imports and exports
- [ ] Test individual components
- [ ] Test integration
- [ ] Update documentation

### 5. Validation Phase
- [ ] Ensure no file exceeds 300 lines
- [ ] Verify single responsibility principle
- [ ] Test all functionality works
- [ ] Update related documentation

## 🎯 Next Steps for New Developers

When encountering large files (300+ lines):

1. **Identify the file's responsibilities**
   ```bash
   # Check file size
   wc -l src/path/to/large-file.tsx
   ```

2. **Follow the established patterns**
   - Look at existing refactored components for patterns
   - Use the same directory structure
   - Follow naming conventions

3. **Break down systematically**
   - Extract types first
   - Extract constants and configuration
   - Extract business logic into services
   - Extract UI into focused components

4. **Test thoroughly**
   - Test each extracted component
   - Ensure integration still works
   - Update any related tests

5. **Document the changes**
   - Update relevant documentation
   - Add comments for complex logic
   - Update the main README if needed

## 🔍 Files Still Needing Refactoring

Based on the initial analysis, these files still exceed 300 lines:

1. `src/app/settings/page.tsx` (1,346 lines) 🚨
2. `src/lib/onboarding/database.ts` (910 lines) 🚨
3. `src/components/common/data-table.tsx` (823 lines) 🚨
4. `src/components/onboarding/onboarding-flow.tsx` (817 lines) 🚨
5. `src/lib/max-visibility/question-generator.ts` (776 lines) 🚨
6. `src/components/ui/sidebar.tsx` (772 lines) 🚨
7. `supabase/supabase.ts` (714 lines) 🚨

**Priority**: Start with the largest files first, following the patterns established in this refactoring guide.

## 📚 Resources

- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [React Component Patterns](https://reactpatterns.com/)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)

---

*This refactoring guide is part of the ongoing effort to maintain a clean, maintainable codebase. Continue following these patterns for all future development.* 