# Tula Carbon analytics design system

This document describes the reusable chart geometry, data contracts, visual tokens, and interaction rules used by the analytics dashboard. The **Analysis** navigation item opens the interactive component showcase in `src/components/AnalyticsShowcase.tsx`.

## Component map

| File | Responsibility |
| --- | --- |
| `src/index.css` | Color, surface, spacing, radius, and motion tokens. |
| `src/utils/analytics.ts` | Shared formatters (`formatCompactTonnes`, `scaleByGross`), scope colors, and delta badge helpers. |
| `src/data/intelligenceData.ts` | Deterministic org hierarchy, Scope 1/2/3 breakdowns, net-zero compound model, MACC, and quality denominators. |
| `src/components/charts/AnalyticsCard.tsx` | Shared composable card surface (`title`, optional `badge`, optional `actions` — avoid taglines/subtitles). |
| `src/components/charts/AnalyticsCharts.tsx` | Reusable SVG chart geometry (`DotMatrixChart`, `StripedBarChart`, `CapsuleDivergingChart`, `WaterfallBridgeChart`, `NetZeroForecastChart`, `MaccChart`, `MicroDotMatrix`, etc.). |
| `src/components/GlobalFilterBar.tsx` | Hierarchical org filter, scope/granularity/method toggles, and slide-out advanced filter drawer. |
| `src/components/AnalyticsShowcase.tsx` | Responsive chart catalog connected to the selected dashboard year. |
| `src/components/TotalEmissionsCard.tsx` | Scope composition and inventory KPIs. |
| `src/components/NetZeroRoadmapCard.tsx` | Interactive 2020–2040 trajectory & compound reduction rate planner. |
| `src/components/MonthlyTimelineCard.tsx` | Monthly/quarterly diverging, YoY paired, and striped emissions views. |
| `src/components/EmissionsOffsetCard.tsx` | Segmented project status gauge. |
| `src/components/TopEmittersCard.tsx` | Expandable Business Unit hierarchy, facility, and source rankings. |

## Color and surface tokens

The base palette is defined on `:root` in `src/index.css`. Prefer these tokens in chart components; semantic status colors stay reserved for approved, warning, submitted, and error states.

| Token family | Use |
| --- | --- |
| `--text-primary`, `--text-secondary`, `--text-tertiary` | Chart labels, annotations, and muted axis text. |
| `--bg-canvas`, `--bg-surface`, `--bg-subtle`, `--border-default` | Application shell, cards, and guides. |
| `--scope-1`, `--scope-2`, `--scope-3` | Persistent series identity: violet, orange, and blue. |
| `--chart-violet-*`, `--chart-blue-*`, `--chart-teal-*`, `--chart-amber-*`, `--chart-rose-*` | Sequential and diverging chart tones. |
| `--chart-inactive`, `--chart-grid` | Inactive marks and low contrast guides. |
| `--radius-chart`, `--card-padding`, `--card-gap` | Reusable chart geometry and layout. |
| `--motion-fast`, `--motion-normal`, `--motion-chart`, `--motion-stagger` | Interaction and entrance timing. |

Use scope colors consistently within the same report. Use green, amber, and red to communicate actual status or change semantics; do not assign those colors to arbitrary data categories.

## Geometry library

Import primitives from `src/components/charts/AnalyticsCharts.tsx`:

| Primitive | Component | Data shape |
| --- | --- | --- |
| Dot matrix | `DotMatrixChart` | One `ChartPoint` per reporting period; mark density scales to the largest value. |
| Striped or hatched bars | `StripedBarChart`, `HatchedColumns` | Shared labels plus one or more `ChartSeries`. |
| Diverging capsules | `CapsuleDivergingChart` | Signed `ChartPoint` values around a zero baseline. |
| Segmented radial gauge | `SegmentedRadialGauge` | Numeric `value` and `max`; segment count reflects progress. |
| Separated donut | `SegmentedDonut` | Positive values with category label and stable color. |
| Connected stacked area | `ConnectedStackedArea` | One aligned value array per series. |
| Bubble plot | `RoundedBubblePlot` | Measured x, y, and size values for each point. |
| Smooth area/line | `SmoothAreaChart` | Ordered values with a stable reporting-period label. |
| Target/baseline | `TargetBulletChart` | Actual, target or baseline, and axis maximum. |
| Segmented progress | `SegmentedProgress` | Percent value and meaningful label. |

`AnalyticsCard` composes the shared surface, title, optional data badge, and optional actions without taglines or helper prose:

```tsx
<AnalyticsCard title="Scope emissions" badge={<span className="font-data text-[10px]">tCO₂e</span>}>
  <StripedBarChart labels={months} series={scopeSeries} unit="tCO₂e" />
</AnalyticsCard>
```

## Data rules

- Keep data transformation outside the SVG geometry where practical. Chart components receive display-ready values and labels.
- Use the dashboard record or a documented source as the chart input. Do not generate random values or invent production risk, completeness, target, or verification data.
- Label illustrative examples as illustrative. Keep sample records separate from production records.
- Preserve missing data as missing. Do not silently convert absent values into zero or interpolate values across a gap.
- Tooltips should include the exact value and unit, reporting period, source, and comparison when those fields exist in the source record.
- Aggregations, such as quarterly scope totals, should be deterministic and trace back to their underlying monthly records.

## Interaction and accessibility

- Hover and keyboard focus identify the same point. Arrow keys move between time-series marks; Enter or Space toggles persistent selection where applicable.
- A selected mark remains emphasized until the user selects another mark or clears the selection. Neighboring marks recede gently.
- SVG marks expose labels and exact values through accessible names; chart regions expose a concise summary.
- Use a visible focus ring, readable contrast, and touch-sized controls for controls outside the SVG.
- Use `ChartStatus` for loading, empty, and error states. Show retry only when the owning data operation can actually be retried.
- Disabled controls should explain that they are unavailable; they should not imply a successful action.

## Motion

- Card reveals play once as a card enters the viewport. Use a short opacity and 8–12px position change.
- Chart geometry reveals use a 400–900ms window with small per-mark delays. Tooltip and selection feedback should stay around 120–250ms.
- Avoid continuous decorative motion. Do not restart a chart reveal on every scroll pass.
- Use `useReducedMotion()` for Framer Motion components. CSS also disables transitions and animation under `prefers-reduced-motion: reduce`.
- Keep interaction feedback independent of entrance animation so charts remain usable when motion is reduced.

## Showcase and verification

The Analysis page uses the currently selected reporting year. It demonstrates each geometry against the existing emissions ledger, project portfolio, or facility records. Facility trend is plotted from the recorded year-over-year value; the bubble size follows reported emissions. The loading, empty, and error previews are explicitly marked as state examples and do not replace the underlying dashboard data.

For local development, run `npm run dev`. Run `npm run lint` for TypeScript checking and `npm run build` for a production build.
