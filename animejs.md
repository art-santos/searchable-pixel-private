# Anime.js – Comprehensive Guide for LLM Coding Agents

> **Anime.js** (pronounced "an-uh-may") is a lightweight JavaScript animation library with a simple yet powerful API. It works seamlessly with CSS properties, SVG attributes, DOM elements, and JavaScript objects, making it a versatile tool for web animations.

This guide provides an information-dense overview of Anime.js, tailored for advanced coding agents and developers. We'll cover everything from basic setup to real-world examples, including code snippets and commentary on key parameters and behaviors.

## Table of Contents

1. [Basic Setup and Syntax](#basic-setup-and-syntax)
2. [Core Animation Parameters](#core-animation-parameters)
3. [DOM Element Animation](#dom-element-animation)
4. [SVG Animation](#svg-animation)
5. [CSS Property Animation](#css-property-animation)
6. [JavaScript Object Animation](#javascript-object-animation)
7. [Timeline Sequencing](#timeline-sequencing)
8. [Scroll-based & Triggered Animations](#scroll-based--triggered-animations)
9. [Performance Optimization Tips](#performance-optimization-tips)
10. [Real Project Examples](#real-project-examples)
11. [Conclusion](#conclusion)

---

## Basic Setup and Syntax

Anime.js can be included in projects through multiple methods:

### Installation Options

#### CDN Usage (Global)
Include the minified script in an HTML file. This exposes a global `anime` object (for v3) or an `anime` namespace containing the `animate` function (for v4).

```html
<!-- Using Anime.js v4 from CDN (iife build) -->
<script src="https://cdn.jsdelivr.net/npm/animejs/lib/anime.iife.min.js"></script>
<script>
  const { animate, stagger } = anime;  // Extract functions from global anime object (v4)
</script>
```

#### NPM Installation (ESM)
Install via npm and import into your script:

```bash
npm install animejs
```

```javascript
import { animate, createTimeline, stagger } from 'animejs'; // ESM import for Anime.js v4
```

> **Note:** Anime.js v4 is modular and ESM-first, meaning you import named functions like `animate()` instead of a default export.

### Basic Usage

Once included, using Anime.js is straightforward – all animations are created with a single function call. In v4, the primary function is `animate(targets, options)`.

```javascript
// Animate a DOM element with class "box"
animate('.box', {  
  translateX: 250,           // move 250px to the right  
  rotate: '1turn',           // rotate 360 degrees  
  duration: 1000,            // run for 1000ms (1s)  
  easing: 'easeInOutQuad'    // use a quadratic easing in/out  
});
```

This example moves the `.box` element 250px to the right while rotating it one full turn over 1 second with an ease-in-out timing.

> **Version Note:** In Anime.js v3, you would call `anime({ targets: ..., ... })` with a global function. In v4, the API was revamped to use `animate()` and other named exports, though the core concepts remain the same.

---

## Core Animation Parameters

When defining an animation, Anime.js accepts a variety of parameters that control what to animate and how the animation behaves:

### Essential Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `targets` | Elements or objects to animate | `'.item'`, `document.querySelector('#logo')`, `[el1, el2]` |
| `duration` | Animation length in milliseconds (default: 1000ms) | `2000` |
| `delay` | Wait time before starting (default: 0) | `500` |
| `easing`/`ease` | Timing function for acceleration | `'easeInOutQuad'`, `'outElastic(1, .5)'` |
| `loop` | Number of additional repetitions | `3`, `true` (infinite) |
| `alternate` | Reverse direction on alternate loops | `true` |
| `reversed` | Start animation in reverse | `true` |
| `autoplay` | Start immediately (default: true) | `false` |

### Animation Properties

You can animate multiple types of properties simultaneously:

- **CSS properties**: `opacity`, `backgroundColor`, `width`, `fontSize`
- **CSS transforms**: `translateX`, `rotate`, `scale`
- **DOM attributes**: `value`, any HTML attribute
- **SVG attributes**: `d` path data, `points`, `fill`
- **JavaScript object properties**: any numeric property

### Callbacks

Hook into animation lifecycle events:

```javascript
animate('.element', {
  translateX: 100,
  duration: 1000,
  onBegin: () => console.log('Animation started'),
  onUpdate: () => console.log('Frame updated'),
  onComplete: () => console.log('Animation finished'),
  onLoop: () => console.log('Loop iteration completed')
});
```

### Playback Control Methods

Animations return an instance with control methods:

- `play()` – start or resume
- `pause()` – pause the animation
- `reverse()` – reverse direction (can be called mid-animation)
- `restart()` – restart from beginning
- `seek(time)` – jump to specific time (ms or percentage)
- `cancel()` – stop and reset immediately

### Complete Example

```javascript
animate('.square', {
  translateX: 100,      // move 100px to the right
  scale: 2,             // double the size
  opacity: 0.5,         // fade to half opacity
  duration: 400,        // 400ms each loop
  delay: 250,           // wait 250ms before starting
  ease: 'out(3)',       // cubic easing-out (power of 3)
  loop: 3,              // repeat animation 3 times (runs 4 iterations total)
  alternate: true,      // alternate direction each loop (forwards then backwards)
  autoplay: false,      // do not start automatically
  onBegin: () => { console.log('Animation started'); },
  onLoop: () => { console.log('Loop iteration finished'); },
  onUpdate: () => { /* called on every frame */ }
});
```

---

## DOM Element Animation

Animating standard DOM elements is the core use case of Anime.js. The library automatically handles DOM queries, style updates, and property interpolation.

### Target Selection

```javascript
// CSS selector (animates all matches)
animate('.item', { opacity: 0.5 });

// Direct DOM element reference
animate(document.querySelector('#logo'), { rotate: '45deg' });

// Array of elements
animate([el1, el2, el3], { translateY: -20 });

// NodeList
animate(document.querySelectorAll('.card'), { scale: 1.1 });
```

### CSS Properties

Most CSS style properties can be directly animated:

```javascript
animate('.panel', {
  width: '300px',              // animate width to 300px
  backgroundColor: '#ffcc00',   // transition background color
  fontSize: '1.5rem',          // change font size
  borderRadius: '10px',        // round corners
  duration: 1000,
  easing: 'linear'
});
```

### CSS Transforms

Transform properties are automatically combined into a single CSS `transform`:

```javascript
animate('.element', {
  translateX: '50%',     // move right by 50% of element width
  translateY: 100,       // move down 100px
  rotate: '1turn',       // rotate 360 degrees
  scale: 1.5,           // scale to 150%
  duration: 800
});
```

### Unit Handling

Anime.js provides flexible unit handling:

```javascript
animate('.box', {
  width: 200,           // defaults to 'px' → '200px'
  height: '50vh',       // respects specified units
  translateX: '+=100',  // relative change: move 100px right from current position
  rotate: '-=45deg'     // relative change: rotate 45deg counter-clockwise
});
```

### Color Animation

Colors can be animated using various formats:

```javascript
animate('.text', {
  color: '#ff0000',                    // hex color
  backgroundColor: ['#fff', '#000'],   // from white to black
  borderColor: 'rgb(255, 100, 50)',   // RGB format
  duration: 1200
});
```

### Staggered Animations

Use the `stagger()` utility to animate multiple elements with delays:

```javascript
import { animate, stagger } from 'animejs';

animate('.list-item', {
  opacity: [0, 1],            // fade from transparent to opaque
  translateY: [-20, 0],       // slide up from 20px below
  duration: 500,
  delay: stagger(100),        // each item waits an extra 100ms
  easing: 'easeOutQuad'
});

// Advanced stagger options
animate('.grid-item', {
  scale: [0, 1],
  delay: stagger(50, {
    start: 300,        // start delay
    from: 'center',    // stagger from center outward
    grid: [3, 3]       // 3x3 grid pattern
  })
});
```

### HTML Attributes

Animate any HTML attribute by name:

```javascript
// Animate progress bar value
animate('progress', { 
  value: [0, 100], 
  duration: 2000 
});

// Animate input field value
animate('#counter', { 
  value: [0, 999], 
  duration: 3000,
  easing: 'easeOutExpo'
});
```

---

## SVG Animation

Anime.js excels at SVG animation, providing powerful tools for animating SVG-specific attributes and performing complex shape morphing.

### Basic SVG Attribute Animation

Animate any SVG attribute directly:

```javascript
animate('circle.myCircle', {
  r: 80,            // animate radius
  cx: 100,          // animate x position
  cy: 50,           // animate y position
  fill: '#00FF00',  // animate fill color
  stroke: '#FF0000', // animate stroke color
  duration: 1500,
  easing: 'easeInOutSine'
});
```

### Path Morphing

One of the most impressive SVG features is morphing between path shapes:

```javascript
import { animate, svg } from 'animejs';

const path1 = document.querySelector('#shape1');
const path2 = document.querySelector('#shape2');

animate(path1, {
  d: svg.morphTo(path2),    // morph path1's "d" attribute to match path2's shape
  duration: 1000,
  easing: 'easeInOutQuad'
});
```

**Requirements for morphing:**
- Both paths should have similar complexity
- Use `svg.morphTo(targetPath, { precision: 1 })` to adjust morph quality

### Line Drawing Effects

Create "drawing" animations by manipulating stroke properties:

```javascript
const path = document.querySelector('#outline');
const length = path.getTotalLength();

// Set up for drawing effect
path.setAttribute('stroke-dasharray', length);
path.setAttribute('stroke-dashoffset', length);

// Animate the drawing
animate(path, {
  strokeDashoffset: [length, 0],  // from invisible to fully drawn
  duration: 2000,
  easing: 'easeOutCubic'
});
```

### Motion Along a Path

Animate elements along SVG paths using v4's motion utilities:

```javascript
import { animate, svg } from 'animejs';

// Create motion path from SVG
const motionPath = svg.createMotionPath('#path-element');

animate('.moving-object', {
  ...motionPath.at(100),  // animate to 100% along path
  duration: 2000,
  easing: 'easeInOutQuad'
});
```

### Complete SVG Example

```xml
<svg viewBox="0 0 200 200">
  <path id="blob1" d="M50,100 Q100,50 150,100 Q100,150 50,100" fill="#ff0000"/>
  <path id="blob2" d="M75,100 Q100,25 125,100 Q100,175 75,100" fill="#0000ff" style="display:none"/>
</svg>
```

```javascript
// Morph blob1 into blob2's shape and color
animate('#blob1', {
  d: svg.morphTo('#blob2'),      // morph path data
  fill: '#0000ff',               // change fill color
  duration: 1200,
  easing: 'easeInOutExpo'
});
```

---

## CSS Property Animation

This section focuses on animating CSS properties on HTML elements, including layout properties, colors, and CSS custom properties.

### Layout & Style Properties

```javascript
animate('.box', {
  height: ['100px', '200px'],           // animate height
  padding: '2rem',                      // animate padding
  backgroundColor: ['#fff', '#3498db'], // color transition
  borderRadius: ['0px', '50%'],         // round corners
  duration: 1000,
  easing: 'easeInOutQuad'
});
```

### CSS Variables (Custom Properties)

Animate CSS custom properties in v4:

```javascript
animate('.button', {
  '--accent-color': ['#00FFFF', '#FF00FF'], // animate CSS variable
  '--border-width': ['2px', '4px'],
  duration: 2000
});
```

### Auto Unit Conversion

Anime.js handles unit conversion intelligently:

```javascript
animate('.element', {
  width: ['100px', '50%'],    // converts between units when possible
  fontSize: [16, '2rem'],     // pixel to rem conversion
  duration: 800
});
```

### Complex Properties

For complex CSS properties, provide complete from/to values:

```javascript
animate('.card', {
  boxShadow: [
    '0 2px 4px rgba(0,0,0,0.1)', 
    '0 8px 16px rgba(0,0,0,0.3)'
  ],
  background: [
    'linear-gradient(45deg, #fff, #f0f0f0)',
    'linear-gradient(45deg, #333, #666)'
  ],
  duration: 600
});
```

---

## JavaScript Object Animation

Anime.js can animate plain JavaScript objects, useful for custom values, counters, or integrating with canvas/WebGL.

### Basic Object Animation

```javascript
const data = { count: 0, progress: 0 };

animate(data, { 
  count: 100,       // animate from 0 to 100
  progress: 1,      // animate from 0 to 1
  duration: 1000,
  easing: 'linear',
  onUpdate: () => {
    console.log(`Count: ${Math.round(data.count)}, Progress: ${data.progress.toFixed(2)}`);
    // Update UI elements here
    document.querySelector('#counter').textContent = Math.round(data.count);
  }
});
```

### Multiple Properties

```javascript
let gameState = { x: 0, y: 0, health: 100, score: 0 };

animate(gameState, {
  x: 500,
  y: 300,
  health: 75,
  score: 1000,
  duration: 2000,
  easing: 'easeOutQuad',
  onUpdate: () => {
    // Update game rendering
    updatePlayerPosition(gameState.x, gameState.y);
    updateUI(gameState.health, gameState.score);
  }
});
```

### Integration with Canvas

```javascript
const canvasData = { 
  rotation: 0, 
  radius: 50, 
  opacity: 1 
};

animate(canvasData, {
  rotation: Math.PI * 2,  // full rotation
  radius: 100,            // expand radius
  opacity: 0.3,           // fade
  duration: 3000,
  onUpdate: () => {
    // Clear and redraw canvas
    clearCanvas();
    drawCircle(canvasData.radius, canvasData.rotation, canvasData.opacity);
  }
});
```

---

## Timeline Sequencing

For complex animation sequences, Anime.js provides Timeline functionality to orchestrate multiple animations with precise timing control.

### Creating a Timeline

```javascript
import { createTimeline } from 'animejs';

const tl = createTimeline({ 
  autoplay: false, 
  defaults: { 
    duration: 750,
    easing: 'easeInOutSine' 
  } 
});
```

### Adding Animations

Use `timeline.add(targets, animationParams, [position])` to schedule animations:

```javascript
const tl = createTimeline({ defaults: { duration: 750, easing: 'easeInOutSine' } });

tl.add('.circle',   { translateX: '15rem' }, 0)          // start at t=0
  .add('.triangle', { translateX: '15rem', rotate: '1turn' }, 0) // parallel with circle
  .add('.square',   { translateX: '15rem' }, '+=500');    // 500ms after previous ends
```

### Timeline Positioning

Position animations using various timing options:

```javascript
const tl = createTimeline();

// Absolute timing
tl.add('.elem1', { opacity: 1 }, 0)        // at 0ms
  .add('.elem2', { opacity: 1 }, 1000);    // at 1000ms

// Relative timing
tl.add('.elem3', { scale: 1.2 }, '+=200')  // 200ms after last
  .add('.elem4', { rotate: 45 }, '<=-100'); // 100ms before last ends (overlap)

// Label-based timing
tl.label('intro', 500)                      // set label at 500ms
  .add('.elem5', { y: -20 }, 'intro+=300'); // 300ms after 'intro' label
```

### Timeline Control

```javascript
const tl = createTimeline({ autoplay: false });

// Control methods
tl.play();           // start timeline
tl.pause();          // pause timeline
tl.reverse();        // reverse direction
tl.seek(1500);       // jump to 1500ms
tl.restart();        // restart from beginning
```

### Timeline Callbacks

```javascript
const tl = createTimeline({
  onBegin: () => console.log('Sequence started'),
  onComplete: () => console.log('Sequence finished'),
  onUpdate: () => console.log('Timeline updating')
});

// Insert function calls at specific times
tl.call(() => {
  console.log('Midpoint reached');
  playSound('beep');
}, 1000);
```

### Nested Timelines

Sync multiple timelines together:

```javascript
const mainTimeline = createTimeline();
const subTimeline = createTimeline({ autoplay: false });

// Build sub-timeline
subTimeline.add('.particle', { scale: [0, 1], duration: 300 })
          .add('.particle', { opacity: 0, duration: 200 });

// Insert sub-timeline into main timeline
mainTimeline.add('.title', { opacity: 1 }, 0)
           .sync(subTimeline, 500);  // start sub-timeline at 500ms
```

### Complex Sequence Example

```javascript
const pageIntro = createTimeline({ 
  defaults: { easing: 'easeOutQuart' }
});

pageIntro
  // Phase 1: Logo appears
  .add('.logo', { 
    opacity: [0, 1], 
    scale: [0.8, 1], 
    duration: 800 
  }, 0)
  
  // Phase 2: Navigation slides in (overlapping)
  .add('.nav-item', { 
    translateY: [-30, 0], 
    opacity: [0, 1], 
    delay: stagger(100),
    duration: 600 
  }, 400)
  
  // Phase 3: Main content fades in
  .add('.hero-title', { 
    opacity: [0, 1], 
    translateY: [20, 0], 
    duration: 1000 
  }, '+=200')
  
  // Phase 4: Call-to-action button
  .add('.cta-button', { 
    scale: [0, 1], 
    duration: 400,
    easing: 'easeOutBack(1.7)' 
  });
```

---

## Scroll-based & Triggered Animations

Animate in response to scroll events using Anime.js v4's built-in ScrollObserver or traditional intersection observers.

### ScrollObserver (v4)

The `onScroll()` function creates a ScrollObserver for scroll-triggered animations:

```javascript
import { onScroll, animate } from 'animejs';

animate('.reveal-box', {
  opacity: [0, 1],
  translateY: [50, 0], 
  autoplay: onScroll({ 
    target: '.reveal-box',    // element to observe
    axis: 'y',                // scroll axis ('x' or 'y')
    offset: ['0% 100%'],      // trigger when element enters viewport
    sync: 'playOnce'          // play once when triggered
  })
});
```

### ScrollObserver Options

```javascript
animate('.parallax-element', {
  translateY: [-100, 100],
  autoplay: onScroll({
    target: '.parallax-element',
    container: '.scroll-container',  // custom scroll container
    offset: ['0% 100%', '100% 0%'],  // start and end trigger points
    sync: 'seek',                    // sync animation progress to scroll position
    debug: true,                     // show debug indicators
    onEnter: () => console.log('Element entered viewport'),
    onLeave: () => console.log('Element left viewport')
  })
});
```

### Traditional Intersection Observer

For simpler scroll triggers or compatibility:

```javascript
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animate(entry.target, { 
        opacity: [0, 1], 
        translateY: [-20, 0], 
        duration: 1000 
      });
      observer.unobserve(entry.target); // trigger once
    }
  });
}, { 
  threshold: 0.5,    // trigger when 50% visible
  rootMargin: '0px 0px -50px 0px'  // offset trigger area
});

document.querySelectorAll('.fade-in').forEach(el => {
  observer.observe(el);
});
```

### Scroll-Synced Progress Animation

Tie animation progress directly to scroll position:

```javascript
const progressBar = animate('.progress-bar', {
  scaleX: [0, 1],
  duration: 1000,
  autoplay: onScroll({
    sync: 'seek',              // sync to scroll position
    offset: ['0% 100%', '100% 0%']  // full page scroll range
  })
});
```

### Multiple Scroll Triggers

```javascript
// Stagger multiple elements based on scroll
const scrollTimeline = createTimeline({
  autoplay: onScroll({
    target: '.scroll-section',
    sync: 'playOnce'
  })
});

scrollTimeline
  .add('.item-1', { opacity: [0, 1], duration: 600 }, 0)
  .add('.item-2', { opacity: [0, 1], duration: 600 }, 200)
  .add('.item-3', { opacity: [0, 1], duration: 600 }, 400);
```

---

## Performance Optimization Tips

High performance is critical for smooth animations. Follow these best practices:

### 1. Prefer Transform and Opacity

Use GPU-accelerated properties whenever possible:

```javascript
// ✅ Good - GPU accelerated
animate('.element', {
  translateX: 100,    // instead of 'left'
  translateY: 50,     // instead of 'top'
  scale: 1.2,         // instead of 'width'/'height'
  opacity: 0.5,       // always performant
  duration: 500
});

// ❌ Avoid - triggers layout/paint
animate('.element', {
  left: '100px',      // causes layout recalculation
  width: '200px',     // triggers reflow
  height: '150px',    // expensive operation
  duration: 500
});
```

### 2. Batch Animations

Use timelines and stagger instead of multiple individual animations:

```javascript
// ✅ Good - single timeline
const tl = createTimeline();
elements.forEach((el, i) => {
  tl.add(el, { opacity: 1, translateY: 0 }, i * 100);
});

// ❌ Avoid - multiple separate animations
elements.forEach((el, i) => {
  setTimeout(() => {
    animate(el, { opacity: 1, translateY: 0 });
  }, i * 100);
});
```

### 3. Optimize Heavy Animations

```javascript
// Use will-change CSS for heavy animations
.animated-element {
  will-change: transform, opacity;
}

// Remove will-change when animation completes
animate('.element', {
  scale: 1.5,
  duration: 1000,
  onComplete: (el) => {
    el.style.willChange = 'auto';
  }
});
```

### 4. Throttle Scroll-Based Animations

```javascript
// ✅ Good - using built-in ScrollObserver (optimized)
animate('.element', {
  translateY: [-50, 50],
  autoplay: onScroll({ sync: 'seek' })
});

// ❌ Avoid - manual scroll handler (not throttled)
window.addEventListener('scroll', () => {
  const progress = window.scrollY / document.body.scrollHeight;
  animation.seek(progress * animation.duration);
});
```

### 5. Limit Concurrent Animations

```javascript
// Monitor active animations
let activeAnimations = 0;
const MAX_ANIMATIONS = 10;

function smartAnimate(target, params) {
  if (activeAnimations >= MAX_ANIMATIONS) {
    // Queue or skip animation
    return;
  }
  
  activeAnimations++;
  return animate(target, {
    ...params,
    onComplete: () => {
      activeAnimations--;
      params.onComplete?.();
    }
  });
}
```

### 6. Use Frame Rate Limiting

For heavy animations, consider reducing frame rate:

```javascript
animate('.heavy-element', {
  rotate: '360deg',
  duration: 2000,
  frameRate: 30,  // reduce from default 60fps
  easing: 'linear'
});
```

### 7. Optimize onUpdate Callbacks

```javascript
// ✅ Good - minimal work in callback
animate(data, {
  value: 100,
  onUpdate: () => {
    element.textContent = Math.round(data.value);
  }
});

// ❌ Avoid - heavy work in callback
animate(data, {
  value: 100,
  onUpdate: () => {
    // Expensive DOM queries
    const elements = document.querySelectorAll('.update-me');
    elements.forEach(el => {
      el.style.width = data.value + '%';
      el.classList.toggle('active', data.value > 50);
    });
  }
});
```

---

## Real Project Examples

### Example 1: UI Button Hover Effect

Create smooth interactive button animations:

**HTML:**
```html
<button class="magic-btn">Hover Me</button>
```

**CSS:**
```css
.magic-btn {
  background: #3498db;
  color: #fff;
  padding: 1em 2em;
  border: none;
  border-radius: 4px;
  transition: none; /* disable default transitions */
  cursor: pointer;
}
```

**JavaScript:**
```javascript
const btn = document.querySelector('.magic-btn');

const hoverTimeline = createTimeline({ 
  autoplay: false, 
  duration: 300,
  easing: 'easeOutCubic'
});

hoverTimeline.add(btn, {
  scale: 1.05,                 // subtle scale up
  backgroundColor: '#48C78E',  // color shift
  boxShadow: '0 4px 15px rgba(72, 199, 142, 0.4)'
});

btn.addEventListener('mouseenter', () => hoverTimeline.play());
btn.addEventListener('mouseleave', () => hoverTimeline.reverse());
```

### Example 2: Hamburger Menu Icon Animation

Transform hamburger menu to close icon:

**HTML:**
```html
<svg id="menuIcon" width="24" height="24" viewBox="0 0 24 24">
  <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/>
  <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/>
  <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2"/>
</svg>
```

**JavaScript:**
```javascript
const menuLines = document.querySelectorAll('#menuIcon line');
const menuToggle = createTimeline({ 
  autoplay: false, 
  duration: 400, 
  easing: 'easeInOutQuad' 
});

// Define hamburger → X transformation
menuToggle
  .add(menuLines[0], { 
    translateY: 6,           // move to center
    rotate: 45,              // rotate 45°
    transformOrigin: '50% 50%'
  }, 0)
  .add(menuLines[2], { 
    translateY: -6,          // move to center  
    rotate: -45,             // rotate -45°
    transformOrigin: '50% 50%'
  }, 0)
  .add(menuLines[1], { 
    opacity: 0,              // hide middle line
    scale: 0
  }, 0);

let isOpen = false;
document.getElementById('menuIcon').addEventListener('click', () => {
  isOpen = !isOpen;
  isOpen ? menuToggle.play() : menuToggle.reverse();
});
```

### Example 3: SVG Path Morphing

Morph between play and pause icons:

**HTML:**
```html
<svg width="60" height="60" viewBox="0 0 60 60">
  <path id="playIcon" d="M20,15 L45,30 L20,45 Z" fill="#333"/>
  <path id="pauseIcon" d="M20,15 L25,15 L25,45 L20,45 Z M35,15 L40,15 L40,45 L35,45 Z" 
        fill="#333" style="opacity: 0"/>
</svg>
```

**JavaScript:**
```javascript
const playPath = document.getElementById('playIcon');
const pausePath = document.getElementById('pauseIcon');
let isPlaying = false;

playPath.addEventListener('click', () => {
  isPlaying = !isPlaying;
  
  animate(playPath, {
    d: svg.morphTo(isPlaying ? pausePath : playPath),
    duration: 400,
    easing: 'easeInOutQuad'
  });
});
```

### Example 4: Staggered Card Grid Entrance

Animate cards entering with stagger effect:

**HTML:**
```html
<div class="card-grid">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
  <div class="card">Card 4</div>
  <div class="card">Card 5</div>
  <div class="card">Card 6</div>
</div>
```

**CSS:**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}
```

**JavaScript:**
```javascript
const cards = document.querySelectorAll('.card');

animate(cards, {
  opacity: [0, 1],
  translateY: [30, 0],
  scale: [0.9, 1],
  duration: 600,
  delay: stagger(120, { start: 400 }),  // 400ms initial delay, then 120ms between each
  easing: 'easeOutQuart'
});
```

### Example 5: Loading Animation Sequence

Create a sophisticated loading animation:

**HTML:**
```html
<div class="loader">
  <div class="loader-text">Loading</div>
  <div class="loader-bar">
    <div class="loader-progress"></div>
  </div>
  <div class="loader-dots">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </div>
</div>
```

**JavaScript:**
```javascript
const loadingSequence = createTimeline({
  loop: true,
  defaults: { easing: 'easeInOutQuad' }
});

// Phase 1: Text appears
loadingSequence.add('.loader-text', {
  opacity: [0, 1],
  translateY: [-20, 0],
  duration: 500
}, 0);

// Phase 2: Progress bar fills
loadingSequence.add('.loader-progress', {
  scaleX: [0, 1],
  duration: 2000,
  easing: 'easeOutExpo'
}, 300);

// Phase 3: Dots animate in sequence
loadingSequence.add('.dot', {
  scale: [0.5, 1],
  opacity: [0.3, 1],
  duration: 200,
  delay: stagger(150)
}, 800);

// Phase 4: Brief pause then fade out
loadingSequence.add('.loader', {
  opacity: [1, 0.7],
  duration: 300
}, '+=500');
```

### Example 6: Scroll-Triggered Content Reveal

Progressive content revelation on scroll:

**JavaScript:**
```javascript
// Reveal sections as they come into view
const revealSections = document.querySelectorAll('.reveal-section');

revealSections.forEach(section => {
  const elements = section.querySelectorAll('.reveal-item');
  
  animate(elements, {
    opacity: [0, 1],
    translateY: [40, 0],
    duration: 800,
    delay: stagger(100),
    easing: 'easeOutQuart',
    autoplay: onScroll({
      target: section,
      offset: ['0% 90%'],  // trigger when section is 10% visible
      sync: 'playOnce'
    })
  });
});
```

---

## Conclusion

This comprehensive guide covers Anime.js from basic setup through advanced techniques. The library's declarative approach makes it highly suitable for both human developers and AI coding agents.

### Key Takeaways

1. **Unified API**: Single function calls handle complex multi-property animations
2. **Flexible Targeting**: Animate DOM elements, SVG attributes, CSS properties, and JavaScript objects
3. **Powerful Sequencing**: Timelines provide precise control over animation choreography
4. **Modern Features**: Built-in scroll triggers and performance optimizations
5. **Performance-First**: GPU-accelerated transforms and opacity for smooth animations

### Best Practices Summary

- **Prefer transforms over layout properties** for performance
- **Use timelines** for complex sequences instead of multiple animations
- **Leverage stagger()** for elegant list and grid animations
- **Optimize scroll-based animations** with built-in ScrollObserver
- **Test on real devices** to ensure smooth performance

### Next Steps

- Explore the [official documentation](https://animejs.com) for latest features
- Experiment with the provided examples
- Join the community for inspiration and advanced techniques
- Consider combining with other libraries for specialized use cases

Anime.js provides the perfect balance of simplicity and power, making it an excellent choice for creating engaging web animations. Whether building subtle micro-interactions or complex animated sequences, its consistent API and comprehensive feature set make it a reliable tool for any animation project.

---

*Happy animating! 🎬*