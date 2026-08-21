---
name: implementation-rules
description: >-
  Baseline coding rules for preventing common AI-generated frontend anti-patterns.
  Covers color palettes, typography, layout structure, spacing, motion, and
  accessibility, while preserving explicit briefs and established design systems.
  Use when writing frontend code. Triggers include CSS, styling, components,
  layout, Tailwind, animation, fonts, color, spacing, and accessibility.
---

# Implementation Rules

Apply these baseline rules to every frontend change, not just new pages.

## Precedence and rule types

When guidance conflicts, follow this order:

1. The user's explicit request and binding brand requirements.
2. The project's established design system, tokens, and documented conventions.
3. A deliberately selected style skill or preset for the current surface.
4. The defaults in this file.

Accessibility, content reachability, responsive flow, and interaction correctness remain requirements. The aesthetic anti-defaults in Color, Typography, and Layout are overridable heuristics: they prevent accidental template choices, but they must not erase an intentional warm palette, single-family type system, branded gradient, or other justified direction. When an override is deliberate, keep it consistent and verify the resulting implementation instead of silently fighting it.

## Color

- **DO** pick an intentional, cohesive palette. **DON'T** use purple/violet gradients or generic "AI palettes." **Why**: default gradients signal no design decision was made.
- **DO** use clean white, off-white, or dark backgrounds. **DON'T** use cream/beige/sand (`OKLCH` L 0.84–0.97, C < 0.06, hue 40–100). **Why**: warm-paper backgrounds are the most common AI-generated cliché.
- **DO** use solid text colors. **DON'T** use `background-clip: text` with gradients for headings. **Why**: gradient text is illegible at small sizes and a strong AI tell.
- **DO** tint text toward the background hue on colored surfaces. **DON'T** use pure gray text (`#888`, `gray-500`) on colored backgrounds. **Why**: gray on color looks dirty and unconsidered.
- **DO** use `OKLCH` for new color definitions; add 0.005–0.015 chroma to neutrals for warmth. **DON'T** default to hex or `rgb()` for palette work. **Why**: `OKLCH` is perceptually uniform and prevents muddy mixes.

## Typography

- **DO** pick fonts specific to the brand. **DON'T** default to Inter, Roboto, Fraunces, Geist, Space Grotesk, Plus Jakarta Sans, Instrument Sans, Mona Sans, Recoleta, Lato, Montserrat, or Open Sans. **Why**: overused fonts make every site look templated.
- **DO** use ≥2 font families (display + body) with cross-axis pairing. **DON'T** ship a single-family page. **Why**: one font across all roles reads as unfinished.
- **DO** keep hero serif restrained in size and weight. **DON'T** use oversized italic serif (Fraunces/Recoleta/Playfair ≥48px) as a hero default. **Why**: the giant italic serif hero is the #1 typography tell.
- **DO** use eyebrows sparingly (max 1 per 3 sections). **DON'T** put a tracked-uppercase label above every section heading. **Why**: eyebrow-on-every-section is a mechanical template rhythm.
- **DO** label sections by topic. **DON'T** use `01`, `02`, `03` numbered section markers as default scaffolding. **Why**: numbered sections are a lazy organizational crutch.
- **DO** place icons side-by-side or inline with headings. **DON'T** stack icon tiles centered above every heading. **Why**: the icon-above-heading stack is a generic landing-page pattern.
- **DO** cap display headings at `6rem`; use `clamp()` for fluid scaling. **DON'T** set static `font-size` that overflows small viewports. **Why**: unclamped display type breaks layout on mobile.
- **DO** use `text-wrap: balance` on headings and `text-wrap: pretty` on prose paragraphs. **DON'T** let browsers use default greedy wrapping. **Why**: balanced wrapping improves readability without manual `<br>` tags.

## Layout

- **DO** use consistent card borders. **DON'T** add side-stripe accent borders (`border-left` ≥2px with thin other sides) on cards. **Why**: the accent-stripe card is a dated and overused pattern.
- **DO** keep card hierarchy flat. **DON'T** nest cards inside cards. **Why**: nested card patterns add visual noise without hierarchy value.
- **DO** vary spacing to create visual rhythm. **DON'T** use the same spacing value for >60% of gaps on a page. **Why**: monotonous spacing reads as unconsidered.
- **DO** use `display: flex` or `display: grid` for page structure. **DON'T** use `position: absolute` for primary layout. **Why**: absolute positioning breaks responsive behavior and content flow.

## Motion

- **DO** use exponential easing (`cubic-bezier` quart/quint/expo out). **DON'T** use bounce or elastic easing. **Why**: bouncy easing feels playful to the point of unprofessional.
- **DO** animate only `transform` and `opacity`. **DON'T** animate `width`, `height`, `padding`, `margin`, or other layout-triggering properties. **Why**: layout-property animations cause expensive reflows and jank.
- **DO** animate the card container on hover. **DON'T** apply `scale` or `rotate` directly to `<img>` elements on hover. **Why**: image-only hover transforms clip content and break composition.

## Accessibility

- **DO** verify WCAG AA contrast on every visible element (4.5:1 body, 3:1 large text, 4.5:1 placeholders). **DON'T** assume the palette passes — measure it. **Why**: inaccessible contrast fails legal requirements and excludes users.
- **DO** cap body text line length at `65–75ch`. **DON'T** let body copy span full viewport width. **Why**: lines longer than 75ch cause eye fatigue and reduce reading speed.

## General

- **DO** define a semantic z-index scale in a constants file (dropdown → sticky → modal → toast → tooltip). **DON'T** scatter arbitrary `z-10`, `z-50` values across components. **Why**: undocumented z-index leads to stacking bugs that are hard to debug.
- **DO** render popovers and menus via Dialog API, portal, or `position: fixed` at the document root. **DON'T** nest them inside `overflow: hidden` or `overflow: clip` containers. **Why**: clipped popovers are invisible to the user — a broken interaction.
