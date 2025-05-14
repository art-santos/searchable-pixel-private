# Animation Principles for Smooth & Delightful UIs

Based on insights from [Emil Kowalski's "Great Animations"](https://emilkowal.ski/ui/great-animations).

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