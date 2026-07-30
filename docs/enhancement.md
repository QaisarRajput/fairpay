# FairPay — Enhancement Plan

> **Purpose:** 10× the visual impact, data storytelling depth, and UX quality of the existing FairPay implementation.
> **Scope:** Additive improvements only — no existing schemas, ETL logic, or math are changed. All enhancements consume the already-committed CPI JSON in `data/cpi/`.
> **Format:** Mirrors `instructions.md` (GitHub Pages Application Standard v2). Each section is an execution constraint, not a suggestion.
> **Execution model:** This document is the plan a coding agent executes. Checkbox states: `[ ]` not started · `[~]` in progress · `[x]` complete.

---

## §0 — Gap audit: what instructions.md required that was not built

Before adding anything new, close the delta between the standard and what shipped.

| Required by standard | Shipped? | Gap |
|---|---|---|
| SVG wordmark/icon logo, crisp at 32px & 512px (§10) | ✗ | Placeholder `<p>FairPay</p>` text only |
| Dark mode via `class="dark"` + manual toggle persisting to `localStorage` (§11) | ✗ | Only `prefers-color-scheme` media query; no user toggle |
| Sticky app bar: logo · theme toggle · translucent backdrop-blur (§12) | ✗ | No app bar at all — flat stack of panels |
| Brand assets: OG hero banner composited from logo + tagline (§10) | ✗ | No banner; `opengraph-image.tsx` exists but has no logo graphic |
| Dynamic per-page OG image (§15) | ✗ | Stub file exists, no real visual output |
| Result card that is OG-previewable as a shareable visual (§0.3) | ✗ | Share button copies URL; no visual card |

All six gaps are addressed in §1–§3 below as baseline requirements before any visualization work starts.

---

## §1 — Visual identity: logo, app bar, and dark-mode toggle

### 1.1 SVG logo

**File:** `apps/web/public/logo.svg` (also inline-importable as React component `<Logo />`).

**Design spec:**
- A compact logotype: a bold `$` glyph interlocked with a small upward-arrow icon, both in `--accent` (`#0e7c66` light / `#2dd4a7` dark).
- The word "FairPay" in `700` weight Inter next to the mark, in `--text`.
- The mark alone (without wordmark) must be legible at 16×16px and stunning at 512px — test both.
- All paths use only `currentColor` so the SVG inherits any parent color in context.
- Zero external dependencies — hand-coded `<svg>` with no raster fallback.
- Export three forms: `logo-full.svg` (mark + wordmark), `logo-mark.svg` (mark only for square contexts), `logo-dark.svg` (inverted palette for use on dark or accent backgrounds).

**Implementation:**
1. Create `apps/web/app/components/logo.tsx` — renders `<svg>` inline so it participates in the React tree and can be CSS-animated.
2. Use in the app bar (§1.2), OG generator (§5), and `app/manifest.ts`.

### 1.2 Sticky app bar

**File:** `apps/web/app/components/app-bar.tsx`

**Anatomy (left → right):**

```
[ <Logo /> FairPay ]                        [ Theme toggle ]
```

On tablet+, expand to:

```
[ <Logo /> FairPay ]   Home  Blog  About    [ Theme toggle ]
```

**Visual rules:**
- `position: sticky; top: 0; z-index: 100`.
- `background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);` — the glassmorphism frosted-glass effect.
- `border-bottom: 1px solid var(--border)` at rest.
- Height: 56px desktop, 48px mobile.
- Collapse on scroll-down (translate `-100%`), reveal on scroll-up — CSS transition `200ms ease`.
- In `@media (orientation: landscape) and (max-height: 540px)`: logo mark only (no wordmark), 40px height.

**Theme toggle:**
- A single `<button aria-label="Toggle color scheme">` showing a sun icon in dark mode, moon icon in light mode.
- On click: toggle `document.documentElement.classList.toggle('dark')` and persist to `localStorage.setItem('fairpay.theme', ...)`.
- On mount: read `localStorage`, fall back to `window.matchMedia('(prefers-color-scheme: dark)').matches`. The inline `<script>` in `<head>` runs this before first paint — zero FOUC.

**Route:** Add `<AppBar />` to `apps/web/app/layout.tsx` above `<div id="main-content">`. The `main` shell gets `padding-top: 56px` to clear the bar.

### 1.3 Dark mode completion

The CSS tokens in `globals.css` already define dark values under `@media (prefers-color-scheme: dark)`. Migrate them from the media query to `html.dark { ... }` so the manual toggle (§1.2) takes effect instantly without reloading. Keep the media query only as a fallback for users who never clicked the toggle.

```css
/* Replace the @media block with */
html.dark {
  --bg: #0e0e10;
  --surface: #17171a;
  /* ... rest of dark tokens */
}
/* Keep media query as initial default before JS hydrates */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --bg: #0e0e10;
    /* ... same values */
  }
}
```

### 1.4 Inline head script (no-FOUC)

In `apps/web/app/layout.tsx`, add before the closing `</head>`:

```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    var stored = localStorage.getItem('fairpay.theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  })();
` }} />
```

This runs synchronously before paint — the only safe way to prevent flicker.

---

## §2 — Chart and visualization system

### 2.0 Library choice

Use **Recharts** (already React-native, tree-shakable, accessible via `role="img"` + `<title>` on SVG). Add once to `apps/web/package.json`:

```
"recharts": "^2.15.0"
```

All chart components live in `apps/web/app/components/charts/`. Every chart is a `'use client'` component (Recharts requires DOM). Every chart SSR-guards with a `mounted` state to prevent hydration mismatch:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <div className="chart-skeleton" aria-hidden="true" />;
```

All charts respect `prefers-reduced-motion` — when `reduce`, disable all animations (`isAnimationActive={false}` on Recharts elements).

All charts expose an `aria-label` on the wrapping `<figure>` and a visually-hidden `<figcaption>` with a plain-text summary of what the chart shows — screenreaders get the data even without a visual.

### 2.1 Salary vs inflation timeline (Line chart)

**Component:** `apps/web/app/components/charts/salary-vs-inflation-chart.tsx`

**Purpose:** The single most important visualization. Shows the user's salary path versus the CPI-adjusted break-even line on the same axes. The gap between them is the real raise or real loss made visceral.

**Data shape:**
```ts
type TimelinePoint = {
  month: string;        // "2021-06"
  nominalSalary: number | null;   // null for interpolated months
  breakEvenLine: number;          // S_0 * C(t)/C(t_0) for each month
  cpiIndex: number;               // raw CPI index value for the selected series
};
```

Construct `breakEvenLine` for every month between `fromDate` and `toDate` using the already-loaded CPI series points. This gives a smooth inflation band, not just two endpoints.

**Visual design:**
- X-axis: months formatted as `MMM YY` at reasonable tick intervals (every 6 months for ranges < 5 years, yearly for longer).
- Left Y-axis: salary in USD (formatted `$XXk`).
- Two lines:
  - **Nominal salary**: horizontal step line from `fromPay` to `toPay` — light solid stroke in `--text-muted`.
  - **Break-even (CPI-adjusted) line**: smooth curve showing what the salary would need to be at each month to keep pace with inflation. Color: `--accent` gradient stroke, slightly thicker.
- **Shaded region** between the two lines:
  - If `toPay > breakEvenLine` at `toDate`: shade green (`--gain` at 15% opacity) — "you outran inflation."
  - If `toPay < breakEvenLine`: shade red (`--loss` at 15% opacity) — "inflation ate your raise."
- A tooltip on hover showing `Month`, `Your salary`, `Break-even target`, and `Gap ($amount)`.
- Responsive: `<ResponsiveContainer width="100%" height={240}>`.

**Placement:** Replaces the current three-number `result-grid` in the Reality Check panel. The three numbers move to a condensed stat row _above_ the chart.

### 2.2 Category divergence radial bar chart

**Component:** `apps/web/app/components/charts/category-radar-chart.tsx`

**Purpose:** Show at a glance which spending categories hurt most versus helped most. The current UI shows only the single worst offender as one text line — this replaces that with a full picture.

**Data:** All 9 category `realPct` values from `categoryDivergence()`, already computed in the calculator.

**Visual design — Radial bar (sunburst ring) chart:**
- A `RadialBarChart` with 9 bars, each an arc segment.
- Each bar length encodes the `realPct` value relative to the range `[min, max]` across all 9 categories.
- Color-coded by value:
  - `realPct > 0`: green gradient (`--gain` core, lighter fill).
  - `realPct < 0 && > -5%`: amber warning.
  - `realPct < -5%`: red gradient (`--loss` core).
- Category labels at each bar's end. The worst category label gets `font-weight: 700` and a `⚠` prefix.
- Center text: two lines — "Worst:" and the category name + its `realPct`.
- Tooltip on hover shows full label + pct.
- Size: 260px × 260px on desktop, scales down to 200px on mobile portrait.
- Placement: in the Reality Check panel, below the line chart, in a two-column grid (chart left, category list right) at ≥ 720px; stacked on mobile.

**Alternative when `prefers-reduced-motion: reduce`:** Render a ranked horizontal bar list instead of the radial animation.

### 2.3 Category impact horizontal bar chart

**Component:** `apps/web/app/components/charts/category-bars-chart.tsx`

**Purpose:** A ranked, scannable breakdown of all 9 categories sorted worst-to-best by real impact. Complements the radial chart with precise values.

**Visual design:**
- `BarChart` horizontal (layout="vertical"), bars sorted descending by `realPct`.
- X-axis range centered at 0: negative bars extend left in `--loss`, positive extend right in `--gain`.
- A vertical reference line at `x=0` labeled "break-even."
- Bar labels show category name (left) and pct value (right of bar end).
- The user's overall real change % shown as a diamond marker overlaid on the "All items" bar.
- Height: auto from bar count × row height (32px per row → 288px for 9 categories).
- Responsive width: `100%`.

**Placement:** In its own full-width panel below the Reality Check panel, visible only once a calculation result exists. Title: "Where inflation hit hardest."

### 2.4 CPI trend explorer (line chart with range brush)

**Component:** `apps/web/app/components/charts/cpi-trend-chart.tsx`

**Purpose:** Let users see the full historical CPI trajectory for the selected series, not just the endpoints they entered. This is the "data storytelling" moment — seeing the COVID-era spike, energy shocks, etc.

**Data:** Full points array from the loaded `CpiSeries` (already in client cache after calculation).

**Visual design:**
- `ComposedChart` with a `Line` for CPI index values over time.
- A `Brush` component at the bottom as a mini-map/range selector — drag endpoints to zoom the main chart's time range. Default range: `fromDate` − 6 months to `toDate` + 3 months, showing the user's context window.
- Two `ReferenceLine` vertical markers at `fromDate` and `toDate` with labels "Your start" / "Your end."
- A `ReferenceArea` between them shaded lightly in `--accent` at 8% opacity.
- X-axis: year labels. Y-axis: index value (no currency — just the raw CPI index).
- Tooltip: `Month`, `CPI index value`.
- Series selector: clicking a category name in the legend swaps the displayed series (triggers a re-fetch if not cached — `loadSeries()` already handles this).
- Height: 220px main area + 40px brush.
- Placed in a new collapsible panel: "CPI history" — collapsed by default, expanded on click (no layout shift — uses a CSS `max-height` transition).

### 2.5 Offer comparison chart (grouped bar)

**Component:** `apps/web/app/components/charts/offer-chart.tsx`

**Purpose:** The current offer comparison is a ranked text list. Visualize it as a grouped bar chart so the scale difference is visceral.

**Data:** The `offerRanking` array (already computed in `CalculatorClient`).

**Visual design:**
- `BarChart` vertical, grouped: for each offer a pair of bars — nominal salary (grey) and real value in from-date dollars (accent color).
- A `ReferenceLine` horizontal at the user's current real value labeled "Your current real salary."
- Bars labeled with offer name and real %.
- Color rule: real bar is `--gain` if above reference line, `--loss` if below.
- Height: 220px.
- Visible only when ≥ 1 offer has a value. Replaces the current `<ol className="ranking">` (keep the ol as a visually-hidden accessible fallback only).

### 2.6 Real purchasing power meter (animated gauge)

**Component:** `apps/web/app/components/charts/purchasing-power-gauge.tsx`

**Purpose:** The most emotionally resonant single widget — a circular gauge showing "how much of your original purchasing power you've retained." Fills to 100% if you broke even, goes below for a real loss, above for a real gain. Pairs with the count-up animation.

**Visual design:**
- SVG arc gauge (hand-coded, no Recharts — simpler here):
  - 270° arc (3/4 circle, open at bottom).
  - Track: `--border` stroke.
  - Fill: `--gain` if `realPct ≥ 0`, `--loss` if `< 0`. Animated `stroke-dashoffset` transition.
  - Center: large pct text in `clamp(1.8rem, 3vw, 2.4rem)` with `--gain`/`--loss` color.
  - Sub-label: "real change" in `--text-muted`.
  - Tick marks at 0%, 100%, and the actual break-even point.
- Size: 180×180px, placed at the top of the Reality Check panel as the hero metric. The three-number stat row moves below it.
- Animation: `stroke-dashoffset` from 0 to final value over 700ms, cubic-ease-out. Gated on `prefers-reduced-motion`.

### 2.7 Salary history sparklines (micro-charts)

**Component:** `apps/web/app/components/charts/timeline-sparkline.tsx`

**Purpose:** In the salary timeline panel, alongside each input row, show a tiny sparkline of the selected CPI series at that month's value — giving context for what inflation was doing at each moment the user entered a salary.

**Visual design:**
- Inline SVG sparkline, 80×24px.
- Shows the CPI value ±12 months around that entry's date.
- A dot marks the exact month.
- Tooltip on hover shows the CPI index value for that month.
- Renders only after CPI data is loaded — shows a 1px grey placeholder line while loading.

### 2.8 Inflation heatmap calendar

**Component:** `apps/web/app/components/charts/inflation-heatmap.tsx`

**Purpose:** Show the *monthly change* in CPI (month-over-month %) as a GitHub-style contribution heatmap. Immediately reveals which months had the sharpest inflation spikes.

**Data:** Derive month-over-month % from consecutive CPI series points: `(C(t) - C(t-1)) / C(t-1) * 100`.

**Visual design:**
- Grid of cells: columns = years (or months if zoomed), rows = months 1–12.
- Cell color: 5-stop sequential scale from `--loss` (strong positive MoM inflation spike, bad for workers) through white at 0% to `--gain` (deflation, rare).
- Cell size: 14×14px on desktop, 10×10px mobile.
- Row/column labels: month abbreviation left, year top.
- Tooltip on hover: `Month YYYY`, `MoM change: +X.X%`.
- Year selection: "Show last 5 years" default; toggle buttons for 10 year and full history.
- Placed in the CPI history panel (§2.4), as a tab alternative to the line chart ("Chart | Heatmap").

---

## §3 — Result card redesign and shareable visual

### 3.1 Visual result card

**Current:** Three numbers in plain grid divs.

**New layout (within the Reality Check panel):**

```
┌─────────────────────────────────────────────────┐
│  [Purchasing Power Gauge 180px]                  │
│                                                   │
│  ─ Break-even target   $92,530                   │
│  ─ Real value of pay   $76,084                   │
│  ─ Real change         -4.9% [badge]             │
│                                                   │
│  [Salary vs Inflation Line Chart]                 │
│                                                   │
│  "Toughest category: Food (-7.9%)"                │
│  [Share result] [See category breakdown ↓]       │
└─────────────────────────────────────────────────┘
```

**Typography:**
- The three stat numbers: `clamp(1.3rem, 2.2vw, 1.7rem)` in `JetBrains Mono` — monospace makes financial numbers easier to scan.
- The badge for real change: colored pill (`--gain`/`--loss` background, white text), not plain text.

### 3.2 Shareable OG card generator (dynamic per result)

**File:** `apps/web/app/share-card/route.tsx` (or `app/api/og/route.tsx` if not using static export — for static export this is a pre-generated route using URL params).

Since this is `output: 'export'`, generate the OG image server-side at build time using `opengraph-image.tsx` which already exists. Enhance it to:
- Accept URL params (`from`, `to`, `fromPay`, `toPay`, `series`, `realPct`, `breakEvenAmt`).
- Render a card with: FairPay logo, large pct value in gain/loss color, salary inputs, and a mini bar comparing nominal vs real value.
- Use `satori` inside `opengraph-image.tsx` for the full compositing.
- The share URL passed to `navigator.share()` already embeds these params — the OG preview bots will hit the URL and get the tailored card.

---

## §4 — Dashboard layout redesign

### 4.1 Page structure

Replace the current flat `shell` grid with a proper dashboard layout:

```
┌──────────────────────────────────────────────────────────────┐
│  APP BAR (sticky, blur, logo, theme toggle)                   │
├──────────────────────────────────────────────────────────────┤
│  HERO                                                         │
│  "Did You Actually Get a Raise?"                              │
│  + Persuasion stat ("Since 2020, $80k is now worth $68k")     │
│  + Primary CTA [Check My Raise →]                             │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌──────────────────────────────────┐ │
│  │ SALARY TIMELINE    │  │ REALITY CHECK                    │ │
│  │ input form         │  │ gauge + stat row                  │ │
│  │ + sparklines       │  │ + salary vs inflation line chart  │ │
│  │                    │  │ + share / breakdown buttons       │ │
│  └────────────────────┘  └──────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  CATEGORY IMPACT (full-width panel, appears on calc result)   │
│  [radial chart] [horizontal bar chart]                        │
├──────────────────────────────────────────────────────────────┤
│  OFFER COMPARISON (full-width, grouped bar chart)             │
├──────────────────────────────────────────────────────────────┤
│  CPI HISTORY (collapsible — line chart + heatmap tabs)        │
├──────────────────────────────────────────────────────────────┤
│  FAQ  |  AD SLOT  |  FOOTER                                   │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Hero persuasion stat (dynamic, pre-computed)

At build time in `page.tsx`, compute one compelling comparison from the real CPI data and hardcode it as a `<StatHighlight>` in the hero. Example:

> "Since Jan 2020, $80,000 in wages has the real buying power of **$68,941** today."

Pick `fromDate = '2020-01'`, `toDate = latest CPI date`, `amount = 80000`. Compute with the server-side `calc` package at build time (no client fetch needed here — read the JSON directly via `fs`). This gives every new visitor an immediate, data-true hook before they enter anything.

**Implementation:**
```tsx
// apps/web/app/page.tsx (server component)
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { breakEven, realValue } from '@fairpay/calc';
import { CpiSeries } from '@fairpay/schema';

const seriesPath = resolve(process.cwd(), '../../data/cpi/CPIAUCSL.json');
const rawSeries = CpiSeries.parse(JSON.parse(await readFile(seriesPath, 'utf8')));
const sinceJan2020Real = realValue(80_000, '2020-01', latestDate, rawSeries.points);
// → $68,941 (or whatever the real number is)
```

This is the most impactful single UX change — real data in the hero is the viral hook.

### 4.3 Responsive column behavior

| Viewport | Layout |
|---|---|
| Mobile (< 640px) | Single column. Gauge centered above stats. Charts 100% width. CPI history collapsed. |
| Tablet (640–1023px) | Two columns: timeline left (44%), reality check right (56%). Category + offer below full-width. |
| Desktop (≥ 1024px) | Two columns above, then full-width sections below. Max-width 1280px. |

---

## §5 — Dynamic OG image with real chart data

**File:** `apps/web/app/opengraph-image.tsx` (already exists — enhance it)

**Current:** Stub that generates nothing meaningful.

**New:** Using `satori`, generate a 1200×630 card:

```
Background: dark surface (#17171a) with subtle radial gradient in --accent at 5% opacity

Left half:
  FairPay logo (SVG rendered by satori)
  "Did You Actually Get a Raise?"
  "fairpay.hubs.dpdns.org"

Right half (if result params present in URL):
  Large pct value: "-4.9%" in --loss color
  Sub-label: "real change, 2021–2024"
  Two stats: "Needed: $92,530" and "Got: $88,000"
  A minimal SVG bar pair (satori-rendered, no Recharts) showing nominal vs real
```

The `opengraph-image.tsx` reads `searchParams` for `realPct`, `breakEvenAmt`, `fromPay`, `toPay`, `from`, `to`. The share button in the calculator already builds a URL with these — OG bots will see the per-result card.

---

## §6 — Animation and motion system

All animations must be gated on `prefers-reduced-motion: no-preference`. No animation fires by default in a reduced-motion context — the final value is set immediately.

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Purchasing power gauge fill | `stroke-dashoffset` from 0 to value | 700ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like) |
| Stat numbers count-up | Current RAF loop in calculator | 550ms | `1 - (1-t)^3` (ease-out cubic) |
| Charts | Recharts `isAnimationActive` + `animationDuration` | 600ms | Recharts default ease |
| App bar hide/reveal | `transform: translateY(-100%)` | 200ms | `ease` |
| Dark mode switch | `color-scheme` + CSS var transitions | 200ms | `ease` |
| Panel entrance | `opacity: 0 → 1` + `translateY(8px → 0)` via `IntersectionObserver` | 300ms | `ease-out` |
| Chart section reveal | `max-height: 0 → auto` for CPI history accordion | 350ms | `ease` |

**Motion classes (add to `globals.css`):**
```css
@media (prefers-reduced-motion: no-preference) {
  .animate-enter {
    animation: enterUp 300ms ease-out both;
  }
  @keyframes enterUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}
```

---

## §7 — New page: `/inflation` — Inflation Explorer

**File:** `apps/web/app/inflation/page.tsx` (static, server component)

**Purpose:** Standalone data-exploration page that lets any visitor — not just someone who entered salaries — browse the full CPI history for any of the 9 series. This is the long-tail SEO content page and the "wow, this data is amazing" discovery moment.

**At build time**, read all 9 series from `data/cpi/` and pre-compute:
- The overall CPI change since 1947 (CPIAUCSL first available point).
- The highest single-month MoM spike across all time.
- The 5-year trailing change for each category.
- The year-over-year change for the latest 12 months.

**Page layout:**

```
Hero: "US Inflation Since 1947 — all 9 categories, one chart"

Tabs: All items | Food | Housing | Transportation | Medical | ...

[Full CPI trend chart for selected series — full width, 360px height]
[Heatmap calendar — full width]

Stats row (pre-computed at build time):
"Cumulative since 1947: +1,847%" | "Worst month ever: Jun 2022 +1.3% MoM" | "Last 12 months: +2.8%"

[Category comparison table: 5-year and 10-year changes for all 9]
```

All data here is pre-computed at build time — zero client fetch until a tab is selected (lazy-load series on tab click).

**SEO:** `generateMetadata` producing title "US CPI Inflation Data — All Categories Since 1947 | FairPay", description, canonical. Add to `sitemap.ts`.

---

## §8 — Typography and visual refinements

### 8.1 Type scale

Upgrade from ad-hoc sizes to a proper 6-step scale:

| Step | Size | Use |
|---|---|---|
| `--t-xs` | `clamp(0.75rem, 1vw, 0.8rem)` | Labels, badges, chart ticks |
| `--t-sm` | `clamp(0.85rem, 1.2vw, 0.9rem)` | Subtle text, captions |
| `--t-base` | `clamp(0.95rem, 1.5vw, 1rem)` | Body text |
| `--t-md` | `clamp(1.1rem, 1.8vw, 1.25rem)` | Panel headings |
| `--t-lg` | `clamp(1.4rem, 2.5vw, 1.7rem)` | Stat numbers |
| `--t-xl` | `clamp(1.8rem, 3.7vw, 2.8rem)` | Hero h1 |

Apply `font-variant-numeric: tabular-nums` globally on all numeric data — numbers no longer jump in width as they animate.

### 8.2 Color tokens — add semantic chart palette

Extend `globals.css` with chart-specific tokens that stay consistent across light and dark:

```css
:root {
  /* existing tokens ... */

  /* Chart palette — 9 category colors, accessible in both modes */
  --chart-1: #0e7c66;   /* all-items / accent */
  --chart-2: #f59e0b;   /* food */
  --chart-3: #3b82f6;   /* housing */
  --chart-4: #ef4444;   /* transportation */
  --chart-5: #8b5cf6;   /* medical */
  --chart-6: #ec4899;   /* apparel */
  --chart-7: #14b8a6;   /* recreation */
  --chart-8: #f97316;   /* education */
  --chart-9: #84cc16;   /* energy */

  /* Semantic */
  --chart-positive: var(--gain);
  --chart-negative: var(--loss);
  --chart-neutral: var(--text-muted);
  --chart-reference: var(--accent);
}
```

Each category in the radial chart, horizontal bars, and CPI trend chart always maps to the same color.

### 8.3 Panel polish

- Add `transition: box-shadow 200ms ease, border-color 200ms ease` to `.panel` — subtle lift on hover (shadow increases slightly).
- On the result panel, add a thin left border accent: `border-left: 3px solid var(--accent)` — distinguishes it as the outcome panel.
- Add `backdrop-filter: blur(4px)` to the `privacy-pill` to give it a frosted chip look.

---

## §9 — Micro-interactions and empty states

### 9.1 Loading skeleton

While the CPI index is loading, the Reality Check panel shows animated skeleton bars instead of an empty box:

```tsx
// apps/web/app/components/charts/chart-skeleton.tsx
// CSS: pulsing gradient shimmer from --surface-muted to --border, 1.5s infinite
```

### 9.2 Empty state for charts

If the user has not entered enough data to compute a result:
- The Reality Check panel shows an illustration (SVG, inline, matches brand colors) of a small upward-trend chart with a "Enter your salary history above to see your results" caption.
- The Category Impact panel shows a greyed-out blurred preview of what the charts would look like, with a "Complete the form above" overlay — psychological incentive to fill in data.

### 9.3 Result success animation

When a valid result is first computed (transition from `result === null` to `result !== null`):
1. The Reality Check panel border color briefly pulses with `--accent` (200ms flash).
2. The gauge fills from 0 to value.
3. Stat numbers count up simultaneously.
4. Chart lines draw in from left.

All in sequence (not parallel) so the eye follows a natural left-to-right, top-to-bottom reading path.

---

## §10 — Implementation checklist

### Phase A — Foundation (do first, unblocks everything)

- [ ] **A1** Create `apps/web/app/components/logo.tsx` — inline SVG, mark + wordmark variants
- [ ] **A2** Create `apps/web/app/components/app-bar.tsx` — sticky, glassmorphism, scroll behavior
- [ ] **A3** Fix dark mode to `html.dark` class strategy + inline head script + manual toggle in AppBar
- [ ] **A4** Wire `<AppBar />` into `layout.tsx`; add `padding-top` to shell
- [ ] **A5** Add `recharts` to `apps/web/package.json`; verify treeshaking in build

### Phase B — Core visualizations

- [ ] **B1** `purchasing-power-gauge.tsx` — animated SVG arc gauge, placement in result panel
- [ ] **B2** `salary-vs-inflation-chart.tsx` — line chart with shaded gap region
- [ ] **B3** `category-radar-chart.tsx` — radial bar with color coding
- [ ] **B4** `category-bars-chart.tsx` — horizontal sorted bar, zero-centered axis
- [ ] **B5** Integrate B1–B4 into `calculator-client.tsx`, replacing text-only outputs
- [ ] **B6** `offer-chart.tsx` — grouped bar replacing the ranked text list
- [ ] **B7** `chart-skeleton.tsx` — pulsing shimmer while loading
- [ ] **B8** Add chart-specific CSS tokens to `globals.css`

### Phase C — Advanced features

- [ ] **C1** `cpi-trend-chart.tsx` — full history line + Brush range selector
- [ ] **C2** `inflation-heatmap.tsx` — MoM calendar heatmap, tabbed with line chart
- [ ] **C3** `timeline-sparkline.tsx` — inline 80×24px sparklines in salary rows
- [ ] **C4** CPI history collapsible panel in `calculator-client.tsx`
- [ ] **C5** Build-time hero persuasion stat in `page.tsx`

### Phase D — Polish and SEO

- [ ] **D1** Enhance `opengraph-image.tsx` with satori-rendered result card
- [ ] **D2** Create `apps/web/app/inflation/page.tsx` — Inflation Explorer page
- [ ] **D3** Add `/inflation` to `sitemap.ts` and `site-footer.tsx` nav
- [ ] **D4** Typography scale in `globals.css` + `tabular-nums`
- [ ] **D5** Panel hover transitions, left-border accent on result panel
- [ ] **D6** Empty state SVG + blurred preview overlay
- [ ] **D7** Entrance animations via `IntersectionObserver` for below-fold panels
- [ ] **D8** Update `not-found.tsx` to use new AppBar
- [ ] **D9** Full build + Lighthouse CI pass — all four categories ≥ threshold

---

## §11 — Dependencies to add

| Package | Version | Why |
|---|---|---|
| `recharts` | `^2.15.0` | All chart components (§2). Tree-shakable, React-native, accessible. |

No other new dependencies. Specifically:
- **No D3** — Recharts covers every chart type needed without requiring manual SVG math.
- **No framer-motion** — CSS transitions + RAF-based count-up cover all animation needs; framer-motion would add ~50 KB.
- **No chart.js / victory / nivo** — Recharts is already the right size and React-idiomatic.
- The satori-based OG generation is already in the project (used by `opengraph-image.tsx`).

---

## §12 — Data access pattern for visualizations

**Rule (no changes to ETL or schema):** Every chart consumes data that is already loaded by the calculator's `loadSeries()` / `loadIndex()` mechanism. No new fetch calls, no new endpoints.

Pass data down from `CalculatorClient` to chart components as props:
```tsx
// CalculatorClient already has: indexData, result, allSeries (after first calc)
<SalaryVsInflationChart
  series={result.selectedSeries}
  fromDate={result.from.periodMonth}
  toDate={result.to.periodMonth}
  salaryFrom={result.from.amount}
  salaryTo={result.to.amount}
/>
```

For the CPI history panel, defer loading all-series data until the panel is expanded — use an `IntersectionObserver` or a `details` `ontoggle` event to trigger the `loadSeries` calls.

For the build-time hero stat (§4.2), read directly from `data/cpi/CPIAUCSL.json` using `fs` in the server component — zero client overhead.

---

## §13 — Build size constraint

Adding Recharts will increase the JS bundle. Ensure the size check still passes:

1. Import only the specific Recharts components used:
   ```ts
   import { LineChart, Line, XAxis, YAxis } from 'recharts';
   // NOT: import * from 'recharts'
   ```
2. Wrap every chart in `React.lazy()` + `Suspense` with the skeleton fallback — charts are below-the-fold and do not need to be in the initial bundle.
3. After adding charts, re-run `pnpm check:size` and adjust the threshold in `scripts/check-size.ts` if the baseline legitimately grew (recharts is ~65 KB gzipped for a full import; selective imports bring it to ~25–35 KB).

---

## §14 — Testing the new components

For each chart component, add a minimal assert-based self-check in the component file (development only, `if (process.env.NODE_ENV === 'development')`) that:
- Calls the data-transform function with known inputs and asserts the output shape.
- This is the "one runnable check per non-trivial logic" rule from the standard (§0).

Example for the salary vs inflation chart's data builder:
```ts
// ponytail: self-check for buildTimelinePoints()
if (process.env.NODE_ENV === 'development') {
  const pts = buildTimelinePoints(mockSeries, '2021-06', '2024-06', 80_000, 88_000);
  console.assert(pts[0]?.nominalSalary === 80_000, 'first point nominal must equal salaryFrom');
  console.assert(typeof pts[0]?.breakEvenLine === 'number', 'breakEvenLine must be numeric');
}
```

---

## §15 — Accessibility requirements for charts (additions to §14 of instructions.md)

- Every chart `<figure>` has `role="img"` and `aria-labelledby` pointing to a `<figcaption>` that is visually-hidden but describes the key insight (e.g. "Line chart showing your salary of $88,000 is $4,530 below the inflation break-even target of $92,530 for the period June 2021 to June 2024.").
- The visually-hidden caption is generated dynamically from the `result` object — not hardcoded.
- All chart interactive elements (tooltip trigger areas) are keyboard-accessible: `tabIndex={0}`, `onKeyDown` support for arrow key navigation between data points.
- The `prefers-reduced-motion` fallback for every chart is a static table with the same data — not just a static image.

---

## §16 — Definition of done

A phase is "done" when **all** of the following are true:

1. `pnpm lint` — zero warnings.
2. `pnpm typecheck` — zero errors.
3. `pnpm -w build` — clean static export, no new warnings.
4. `pnpm check:size` — bundle within threshold.
5. The app renders the new chart in a real browser at 320px, 768px, and 1440px without horizontal overflow.
6. Dark mode: toggle the theme; all charts re-render with correct dark token values.
7. Reduced motion: add `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` to DevTools — every chart shows its final value immediately, no frozen mid-animation.
8. Keyboard: tab through the page; every chart's figure is reachable and announces its accessible caption.
9. The empty state (no result computed yet) looks intentional and polished — not blank white rectangles.
10. The result state (result computed) flows hero → timeline → chart → category → offer without visual inconsistency.
