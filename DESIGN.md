# Design System

## Strategy

Restrained monochromatic. No accent colors. Hierarchy through luminance, weight, and size alone. Sharp corners everywhere (0 radius). The aesthetic is brutalist-adjacent but refined — not harsh, just precise. Think Anthropic's website meets a monospace terminal: dark, sharp, confident.

## Color

All colors OKLCH. Hue 0 (achromatic). No chroma on any token.

| Token | Value | Usage |
|---|---|---|
| `--color-base` | `oklch(0.13 0 0)` | Body background, deepest layer |
| `--color-surface` | `oklch(0.17 0 0)` | Cards, panels, sidebar |
| `--color-elevated` | `oklch(0.22 0 0)` | Hover states, active items, raised elements |
| `--color-ink` | `oklch(0.95 0 0)` | Primary text (headings, body) |
| `--color-muted` | `oklch(0.65 0 0)` | Secondary text, labels, descriptions |
| `--color-dim` | `oklch(0.45 0 0)` | Disabled, placeholders, deep background text |
| `--color-line` | `oklch(0.25 0 0)` | Borders, dividers, subtle separators |
| `--color-line-strong` | `oklch(0.32 0 0)` | Active borders, focused outlines, emphasis lines |

### Semantic overrides

| Token | Value | Usage |
|---|---|---|
| `--color-success` | `oklch(0.65 0.12 145)` | Execution completed, saved (low chroma, used sparingly) |
| `--color-danger` | `oklch(0.60 0.15 25)` | Errors, delete confirmations (low chroma, used sparingly) |
| `--color-warning` | `oklch(0.70 0.10 85)` | Warnings (low chroma, used sparingly) |

Semantic colors only appear on status indicators and validation messages — never as accent or identity colors.

## Typography

| Role | Font | Weight | Size | Line height |
|---|---|---|---|---|
| Display | Inter | 700 | clamp(2rem, 4vw, 3.5rem) | 1.1 |
| H1 | Inter | 700 | 1.5rem | 1.3 |
| H2 | Inter | 600 | 1.25rem | 1.3 |
| H3 | Inter | 600 | 1rem | 1.4 |
| Body | Inter | 400 | 0.875rem | 1.6 |
| Caption | Inter | 400 | 0.75rem | 1.5 |
| Code/Mono | JetBrains Mono | 400 | 0.8125rem | 1.6 |
| Label | Inter | 500 | 0.75rem | 1.4 | uppercase 0.05em tracking |

Font feature settings: `"cv02", "cv03", "cv04", "cv11"` on body.

## Spacing

4px base unit. Scale: 4, 8, 12, 16, 24, 32, 48, 64.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--space-8` | 64px |

## Radius

All corners are 0. No border-radius anywhere.

| Token | Value |
|---|---|
| `--radius-sm` | 0 |
| `--radius-md` | 0 |
| `--radius-lg` | 0 |
| `--radius-full` | 0 |

## Shadows

Shadows are the primary depth indicator (no color, no radius).

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px oklch(0 0 0 / 0.3)` |
| `--shadow-md` | `0 2px 8px oklch(0 0 0 / 0.4)` |
| `--shadow-lg` | `0 4px 16px oklch(0 0 0 / 0.5)` |

## Components

### Button

- Primary: `background: var(--color-ink); color: var(--color-base);` — inverted, high contrast
- Secondary: `background: transparent; border: 1px solid var(--color-line-strong); color: var(--color-ink);`
- Ghost: `background: transparent; color: var(--color-muted);` — hover fills `var(--color-elevated)`
- Height: 36px (sm), 40px (md)
- Padding: 0 16px
- Border-radius: 0

### Input

- Background: `var(--color-surface)`
- Border: 1px solid `var(--color-line)`
- Focus: border → `var(--color-ink)`
- Text: `var(--color-ink)`
- Placeholder: `var(--color-dim)`
- Height: 40px, padding: 0 12px
- Border-radius: 0

### Card / Panel

- Background: `var(--color-surface)`
- Border: 1px solid `var(--color-line)`
- Border-radius: 0
- No shadow by default; `--shadow-md` on elevation

### Sidebar

- Background: `var(--color-surface)`
- Width: 240px (desktop), drawer on mobile
- Border-right: 1px solid `var(--color-line)`
- Active item: `background: var(--color-elevated)`

### Node (Flow Editor)

- Background: `var(--color-surface)`
- Border: 1px solid `var(--color-line-strong)`
- Border-radius: 0
- Selected: `border-color: var(--color-ink)`

### Badge / Status

- Background: `var(--color-elevated)`
- Text: `var(--color-muted)`
- Border-radius: 0
- Semantic variants use semantic colors at 15% opacity for bg

## Motion

- Durations: 150ms (micro), 250ms (transitions), 400ms (panels)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quart) for exits; `cubic-bezier(0.33, 1, 0.68, 1)` (ease-out-cubic) for enters
- `prefers-reduced-motion: reduce` → all durations 0.01ms
- No bounce, no elastic, no overshoot

## Z-index scale

| Token | Value |
|---|---|
| `--z-base` | 0 |
| `--z-dropdown` | 100 |
| `--z-sticky` | 200 |
| `--z-overlay` | 300 |
| `--z-modal` | 400 |
| `--z-toast` | 500 |
| `--z-tooltip` | 600 |

## Iconography

- Style: Outline, 1.5px stroke
- Size: 16px (inline), 20px (navigation), 24px (empty states)
- Color: inherits text color

## Responsive breakpoints

| Name | Width |
|---|---|
| Mobile | < 640px |
| Tablet | 640–1024px |
| Desktop | > 1024px |
