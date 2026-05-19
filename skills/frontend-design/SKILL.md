---
name: frontend-design
description: Build good-looking web interfaces. Use when building web apps, websites, landing pages, HTML pages, one-off tools, demos, or when the user mentions UI, design, styling, or making something look better.
---
# Frontend design

Practical tactics for designing and building frontend interfaces. About making things look good and work well, not about frameworks.

## Start with the creative vision

Before touching code, understand the emotional and aesthetic goal.

### Tone

What feeling? Professional/trustworthy? Playful/fun? Calm/minimal? Energetic/bold? Tone affects colors, typography, spacing, imagery, micro-interactions.

Match existing design language first. Consistency > novelty.

### Aesthetics

Look at references. What interfaces with similar purpose do you admire? What makes them work? Borrow principles, not pixels.

## Add constraints

Constraints eliminate decision fatigue.

### Spacing scale

Base unit 4px or 8px. Stick to multiples: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`. No magic numbers like 13px or 47px.

### Type scale

Ratio 1.25 or 1.333: `12, 14, 16, 20, 24, 32, 40, 48`. Each size has a purpose (body, subheading, heading, display).

### Color palette

Start minimal: one primary/accent color, neutrals (white, black, 3-4 grays), red for errors, green for success. Fewer colors = more intentional use.

### Layout grid

12-column grid with consistent gutters.

## Design in the browser

Design directly in HTML/CSS — real rendering, real responsiveness, no handoff problems, version controlled. Start mobile-first.

## Common patterns

**Cards**: consistent padding (16-24px), subtle border/shadow, clear hierarchy (image → title → description → action).

**Forms**: labels above inputs, one column, clear error states (red border + message below), 44px minimum touch targets.

**Navigation**: primary nav 5-7 items max, current page obvious, mobile via hamburger/bottom nav.

**Empty states**: show what would be here, how to add content, illustration if appropriate.

**Loading states**: skeleton screens > spinners, show progress for long ops, don't block whole UI.

## Avoiding generic AI aesthetics

- Be specific: "dark theme, blue-to-purple gradient, compact density, inspired by trading terminals" > "modern dashboard"
- Limit palette, commit to type scale, use consistent spacing
- Borrow principles from real references, not pixels
- Edit ruthlessly: simplify until too simple, then add back one thing
- Test with real content, not lorem ipsum

## Responsive design

Mobile-first. Breakpoints: mobile ≤640px, tablet 641-1024px, desktop ≥1025px. Columns/font sizes/navigation change; colors/brand/core functionality stay.

## Accessibility basics

- Color contrast 4.5:1 minimum
- Visible focus rings for keyboard nav
- Meaningful alt text
- Semantic HTML (headings, lists, buttons)
- Touch targets 44×44px minimum

## Quick checklist

- Consistent spacing from scale
- Clear typography hierarchy
- Colors meet contrast requirements
- Works on mobile
- Visible focus states
- Loading/error/empty states handled
- Tested with real content
