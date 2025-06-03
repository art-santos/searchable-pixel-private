# Split Component Library

This directory contains UI primitives and custom components used across the dashboard.

```
components/
  ui/      # generic reusable elements (buttons, cards, progress bar, ...)
  custom/  # app specific pieces (selectors, metric items, ...)
```

## Examples

```tsx
import { ProgressBar } from '@/components/ui/progress-bar'
import { MetricItem } from '@/components/custom/metric-item'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
```

These components follow the dark theme with sharp corners and Geist fonts.

See `docs/example.tsx` for a quick preview of how the primitives can be composed together.
