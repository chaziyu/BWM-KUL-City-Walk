# Part B — UI/UX Enhancement

## Phase 5 — Create a Unified Design System

**Goal:** Make the interface feel intentional rather than feature-by-feature.

### Define tokens

```text
Colour
Typography
Spacing
Radius
Shadow
Button sizes
Icon sizes
Modal widths
Animation duration
Accessibility contrast
```

### Recommended visual direction

Move away from generic purple SaaS styling.

Use a heritage-oriented system:

* Deep ink / charcoal
* Warm ivory / paper background
* Bronze or terracotta accent
* One serif display typeface for landmark headings
* One clean sans-serif font for interface text
* One consistent icon library instead of mixing many emojis

### Build reusable UI components

```text
Button
Icon button
Bottom sheet
Modal
Card
Tag
Progress indicator
Site badge
Toast
Loading skeleton
Empty state
Error state
```

### Responsive redesign priorities

1. Replace scattered floating controls with one expandable action tray.
2. Use a bottom sheet for selected site details.
3. Keep one primary action visible at a time.
4. Ensure all buttons remain reachable with one hand on mobile.
5. Test keyboard open state, landscape mode, and smaller Android devices.

### Done when

* All modals use shared spacing, typography, and actions.
* Landing, map, passport, and chat look like one product.
* No screen has more than one dominant CTA.