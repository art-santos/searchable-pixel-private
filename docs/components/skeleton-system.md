# Skeleton Loader System

A comprehensive skeleton loading system following animation best practices for elegant, minimalistic loading states across the application.

## Core Principles

Based on our [Animation Principles](../guides/animations.md), our skeleton system follows:

- **Performant**: Uses CSS transforms and optimized animations
- **Accessible**: Respects `prefers-reduced-motion` settings
- **Fast & Responsive**: Short durations (under 300ms) with ease-out timing
- **Natural Feel**: Smooth gradient sweeps that mimic real content loading
- **Purposeful**: Clearly indicates loading state and content structure

## Base Components

### `Skeleton`

The foundational skeleton component with customizable animation speed and pulse effects.

```tsx
import { Skeleton } from "@/components/ui/skeleton"

// Basic usage
<Skeleton className="h-4 w-32" />

// With custom speed
<Skeleton className="h-6 w-48" speed="fast" />

// Without pulse animation
<Skeleton className="h-8 w-full" pulse={false} />
```

**Props:**
- `speed`: 'fast' (1s), 'normal' (2s), 'slow' (3s)
- `pulse`: Boolean to enable/disable gradient sweep animation
- Standard div props (className, style, etc.)

### `SkeletonText`

Multi-line text skeleton with natural line length variation.

```tsx
import { SkeletonText } from "@/components/ui/skeleton"

// Single line
<SkeletonText />

// Multiple lines (last line is 75% width)
<SkeletonText lines={3} />
```

### `SkeletonCircle`

Circular skeleton for avatars, icons, and profile images.

```tsx
import { SkeletonCircle } from "@/components/ui/skeleton"

// Different sizes
<SkeletonCircle size="sm" />  // 24x24px
<SkeletonCircle size="md" />  // 32x32px (default)
<SkeletonCircle size="lg" />  // 48x48px
<SkeletonCircle size="xl" />  // 64x64px
```

### `SkeletonCard`

Container skeleton that matches our card styling.

```tsx
import { SkeletonCard } from "@/components/ui/skeleton"

<SkeletonCard>
  <SkeletonText lines={2} />
  <Skeleton className="h-8 w-24 mt-4" />
</SkeletonCard>
```

## Specialized Skeletons

### `ChartSkeleton`

Animated skeleton for charts and graphs with realistic data visualization elements.

```tsx
import { ChartSkeleton } from "@/components/skeletons"

<ChartSkeleton 
  showHeader={true}
  showStats={true}
  className="h-96"
/>
```

**Features:**
- Animated bars with staggered reveal
- Y-axis and X-axis label placeholders
- Grid line simulation
- Optional header with title and stats
- Smooth scale animations from bottom origin

### `ListSkeleton`

Flexible list skeleton for various content types with animated item reveals.

```tsx
import { ListSkeleton } from "@/components/skeletons"

// Crawler attribution list
<ListSkeleton 
  itemType="crawler"
  items={5}
  showProgress={true}
/>

// Page attribution list
<ListSkeleton 
  itemType="page"
  items={6}
  showProgress={true}
/>

// Basic list
<ListSkeleton 
  itemType="basic"
  items={10}
/>
```

**Item Types:**
- `crawler`: Icon + name/subtitle + percentage + progress bar
- `page`: Larger icon + title/metadata + stats + vertical progress
- `basic`: Simple icon + two-line text + optional value

### `AttributionPageSkeleton`

Complete page skeleton for the attribution page layout.

```tsx
import { AttributionPageSkeleton } from "@/components/skeletons"

// Matches 60/40 layout with chart and cards
<AttributionPageSkeleton />
```

### Snapshot Skeletons

Specialized skeletons for the snapshots feature with dark theme styling.

#### `SnapshotPageSkeleton`

Main snapshot page loading state with centered layout.

```tsx
import { SnapshotPageSkeleton } from "@/components/skeletons"

<SnapshotPageSkeleton />
```

#### `SnapshotHistorySkeleton`

History sidebar with snapshot items featuring favicons and status indicators.

```tsx
import { SnapshotHistorySkeleton } from "@/components/skeletons"

<SnapshotHistorySkeleton />
```

#### `SnapshotReportSkeleton`

Individual snapshot report page with circular score display and detailed content areas.

```tsx
import { SnapshotReportSkeleton } from "@/components/skeletons"

<SnapshotReportSkeleton />
```

#### `SnapshotProcessingSkeleton`

Processing steps with dynamic status indicators (completed, processing, pending).

```tsx
import { SnapshotProcessingSkeleton } from "@/components/skeletons"

<SnapshotProcessingSkeleton />
```

#### `SnapshotHistoryEmptySkeleton`

Empty state skeleton for history sidebar when no snapshots exist.

```tsx
import { SnapshotHistoryEmptySkeleton } from "@/components/skeletons"

<SnapshotHistoryEmptySkeleton />
```

### `TableSkeleton`

Flexible table skeleton for data tables with expandable rows and customizable columns.

```tsx
import { TableSkeleton } from "@/components/skeletons"

// Attribution source table
<TableSkeleton 
  rows={8}
  columns={[
    { span: 4, align: 'left' },
    { span: 2, align: 'center' },
    { span: 2, align: 'center' },
    { span: 2, align: 'center' },
    { span: 2, align: 'right' }
  ]}
  showExpandableRows={true}
/>

// Attribution page table
<TableSkeleton 
  rows={8}
  columns={[
    { span: 6, align: 'left' },
    { span: 3, align: 'center' },
    { span: 3, align: 'right' }
  ]}
  showExpandableRows={true}
/>
```

**Features:**
- Customizable column layout with grid spans
- Expandable row animations (first 3 rows expand automatically)
- Staggered row reveals with proper timing
- Icon placeholders and realistic content structure
- Supports different column alignments (left, center, right)

## Animation Features

### Staggered Reveals

All skeleton components use staggered animations to create natural loading sequences:

```tsx
// List items appear with 50ms delays
const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
}
```

### Progressive Loading

Chart skeletons animate bars from bottom to top, simulating data population:

```tsx
const barVariants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] // Custom easing for natural feel
    }
  }
}
```

### Gradient Sweep

The base skeleton uses a moving gradient to indicate active loading:

```css
.skeleton {
  background: linear-gradient(to right, #e5e7eb, #f3f4f6, #e5e7eb);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Accessibility

### Reduced Motion Support

All animations respect `prefers-reduced-motion`:

```tsx
const shouldReduceMotion = useReducedMotion()

if (shouldReduceMotion) {
  return <StaticSkeleton />
}

return <AnimatedSkeleton />
```

When motion is reduced:
- Gradient sweeps are disabled
- Stagger animations become instant
- Scale/transform animations are simplified

### Screen Reader Friendly

Skeletons include appropriate ARIA attributes:

```tsx
<div 
  role="status" 
  aria-label="Loading content"
  className="skeleton"
>
  <span className="sr-only">Loading...</span>
</div>
```

## Usage Guidelines

### When to Use Skeletons

✅ **Use skeletons for:**
- Data fetching operations
- Page transitions
- Component mounting delays
- Network-dependent content

❌ **Don't use skeletons for:**
- User-initiated actions (buttons, forms)
- Instant state changes
- Very short loading times (<100ms)

### Performance Considerations

- Skeletons are optimized for 60fps performance
- Use CSS transforms over layout-triggering properties
- Limit concurrent animations to prevent jank
- Consider using `will-change` for heavy animations

### Design Consistency

- Match skeleton dimensions to real content
- Use consistent animation speeds across similar content types
- Maintain proper spacing and alignment
- Respect dark/light theme variations

## Implementation Examples

### In Components

```tsx
function DataCard({ data, isLoading }) {
  if (isLoading) {
    return (
      <ListSkeleton 
        itemType="basic"
        items={3}
        className="h-64"
      />
    )
  }

  return (
    <Card>
      {data.map(item => (
        <DataItem key={item.id} {...item} />
      ))}
    </Card>
  )
}
```

### In Pages

```tsx
function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsData()

  if (isLoading) {
    return <AttributionPageSkeleton />
  }

  return <AnalyticsContent data={data} />
}
```

### Custom Skeletons

For unique layouts, combine base components:

```tsx
function CustomSkeleton() {
  return (
    <SkeletonCard>
      <div className="flex items-center gap-4">
        <SkeletonCircle size="lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <SkeletonText lines={2} />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </SkeletonCard>
  )
}
```

## Migration Guide

Replace existing loading states:

```tsx
// Before
{isLoading ? (
  <div className="flex justify-center">
    <Loader2 className="animate-spin" />
  </div>
) : (
  <Content />
)}

// After  
{isLoading ? (
  <ListSkeleton itemType="basic" items={5} />
) : (
  <Content />
)}
```

This creates a more sophisticated, content-aware loading experience that better prepares users for the incoming content structure. 