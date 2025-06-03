# Animation Principles for Smooth & Delightful UIs

Based on insights from [Emil Kowalski's "Great Animations"](https://emilkowal.ski/ui/great-animations) and ["CSS Transforms"](https://emilkowal.ski/ui/css-transforms).

This document outlines key principles to follow when implementing animations to ensure they are effective, performant, and enhance the user experience.

## Core Principles

1.  **Natural Feel:**
    *   Aim for animations that mimic real-world physics (e.g., using spring physics).
    *   Avoid instantaneous changes; transitions should feel organic.

2.  **Fast & Responsive:**
    *   Keep durations short, typically under 300ms.
    *   Use `ease-out` easing for a snappy, responsive feel.
    *   Fast animations improve perceived performance.

3.  **Purposeful:**
    *   Animations should clarify, guide, or provide feedback (e.g., state changes, loading indicators, relationship between elements).
    *   Avoid purely decorative animations that don't add value.
    *   Do **not** animate frequently repeated, user-initiated actions (e.g., keyboard shortcuts).

4.  **Performant:**
    *   Prioritize animating CSS `transform` and `opacity` properties, as they are cheaper for the browser to render.
    *   Use hardware-accelerated CSS transitions or the Web Animations API (WAAPI) for animations that need to run smoothly even if the main JavaScript thread is busy.
    *   Aim for a consistent 60 frames per second (FPS).

5.  **Interruptible:**
    *   Ensure animations can be smoothly interrupted and transition to a new state if the user interacts mid-animation.
    *   CSS transitions handle this naturally. Libraries like Framer Motion also offer support.

6.  **Accessible:**
    *   Respect the `prefers-reduced-motion` media query.
    *   Provide simpler, less distracting alternatives (e.g., fades instead of bounces) for users who prefer reduced motion.

7.  **Cohesive & "Feels Right":**
    *   Ensure the animation's style (easing, duration, type) aligns with the overall application design and brand aesthetic.
    *   Test and iterate until the animation "feels right" in context. Reviewing animations after a break can help spot imperfections. 

## CSS Transforms Deep Dive

The `transform` property is fundamental to creating performant web animations. Here's how to use different transform functions effectively:

### 1. Translation (`translate`)

```css
/* Basic usage */
transform: translate(x, y);
transform: translateX(x);
transform: translateY(y);
```

Key points:
- Doesn't affect document flow - other elements remain in place
- Percentage values are relative to the element's own size
- Great for:
  - Toast notifications (e.g., `translateY(-100%)`)
  - Drawers/modals (e.g., `translateY(100%)`)
  - Intro animations
  - Any position-based animations

### 2. Scale (`scale`)

```css
/* Basic usage */
transform: scale(value);          /* Uniform scaling */
transform: scale(x, y);           /* Independent axis scaling */
transform: scaleX(value);         /* Single axis */
transform: scaleY(value);
```

Best practices:
- Scales children elements automatically
- Avoid scaling from 0 - combine with opacity instead (e.g., scale(0.95) to scale(1))
- Great for:
  - Click feedback
  - Hover effects
  - Entry/exit animations
  - Card expansions

### 3. Rotation (`rotate`)

```css
/* Basic usage */
transform: rotate(deg);           /* 2D rotation */
transform: rotateX(deg);          /* 3D rotation around X axis */
transform: rotateY(deg);          /* 3D rotation around Y axis */
```

Use cases:
- Interactive elements (e.g., icons, buttons)
- 3D card effects
- Coin flip animations
- Loading indicators

### 4. Transform Origin

```css
transform-origin: center;         /* Default */
transform-origin: top left;       /* Position-based */
transform-origin: 100% 0%;       /* Percentage-based */
```

- Controls the anchor point for transform animations
- Critical for rotation and scale animations
- Can create more natural-feeling animations by matching the origin to the interaction point

### Best Practices

1. **Percentage-Based Values:**
   - Use percentages for translations when possible
   - Makes animations responsive and less prone to breakage
   - Example: `translateY(-100%)` for toast notifications

2. **Combining Transforms:**
   - Layer multiple transforms for complex animations
   - Order matters: `transform: translateY(100%) scale(0.95) rotate(5deg)`

3. **Performance:**
   - Use `transform` over properties that trigger layout (like `margin` or `top`)
   - Combine with `will-change` for better performance when needed
   - Use `transform-style: preserve-3d` for 3D effects

4. **Animation Tips:**
   - Start with subtle values (e.g., scale(0.95) instead of scale(0))
   - Combine with opacity for natural enter/exit animations
   - Use appropriate timing functions for different types of movement

### Example: Toast Animation

```css
.toast {
  transform: translateY(0);
  opacity: 1;
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

.toast-enter {
  transform: translateY(-100%);
  opacity: 0;
}

.toast-exit {
  transform: translateY(100%);
  opacity: 0;
}
``` 