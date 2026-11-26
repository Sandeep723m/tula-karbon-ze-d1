import React, { useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Inbox, LoaderCircle, RotateCcw } from 'lucide-react';

export type ChartPoint = {
  label: string;
  value: number;
  unit?: string;
  source?: string;
  comparison?: string;
};

export type ChartSeries = {
  id: string;
  label: string;
  color: string;
  values: number[];
  pattern?: 'stripe' | 'hatch' | 'solid';
  source?: string;
  sources?: (string | undefined)[];
  comparisons?: (string | undefined)[];
};

export function ChartStatus({ state, message, onRetry }: { state: 'loading' | 'empty' | 'error'; message?: string; onRetry?: () => void }) {
  const reduceMotion = useReducedMotion();
  if (state === 'loading') return <div role="status" className="flex items-center gap-3 rounded-xl border border-[#E7E8ED] bg-white/45 p-4 text-[12px] text-[#62636D]"><LoaderCircle className={`h-4 w-4 text-[#6248D5] ${reduceMotion ? '' : 'animate-spin'}`}/><span>{message ?? 'Loading chart data…'}</span></div>;
  if (state === 'empty') return <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#C8C8D0] bg-white/35 p-4 text-[12px] text-[#62636D]"><Inbox className="h-4 w-4 text-[#878891]"/><span>{message ?? 'No records are available for this period.'}</span></div>;
  return <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2]/75 p-3 text-[12px] text-[#991B1B]"><div className="flex items-center gap-2"><AlertCircle className="h-4 w-4"/><span>{message ?? 'Chart data could not be loaded.'}</span></div>{onRetry && <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white/80 px-2.5 py-1.5 font-medium hover:bg-white"><RotateCcw className="h-3 w-3"/>Retry</button>}</div>;
}

type ChartDataProps = {
  label: string;
  unit?: string;
  source?: string;
  comparison?: string;
};

const focusNeighbor = (event: React.KeyboardEvent<SVGGElement>, offset: -1 | 1) => {
  const points = Array.from(event.currentTarget.parentElement?.querySelectorAll<SVGGElement>('[data-chart-point]') ?? []);
  const index = points.indexOf(event.currentTarget);
  const next = points[(index + offset + points.length) % points.length];
  if (next) {
    event.preventDefault();
    next.focus();
  }
};

function ChartTooltip({ label, value, unit = '', source, comparison }: ChartDataProps & { value: string | number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div role="tooltip" initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.14 }} className="pointer-events-none absolute left-1/2 top-0 z-20 min-w-[150px] -translate-x-1/2 -translate-y-2 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-[11px] shadow-[0_8px_24px_rgba(24,24,27,.12)] backdrop-blur-md">
      <div className="font-semibold text-[#18181B]">{label}</div>
      <div className="mt-0.5 font-data text-[#42434B]">{value} {unit}</div>
      {source && <div className="mt-0.5 text-[#62636D]">Source: {source}</div>}
      {comparison && <div className="mt-0.5 text-[#62636D]">{comparison}</div>}
    </motion.div>
  );
}

const describeArc = (cx: number, cy: number, radius: number, start: number, end: number) => {
  const toPoint = (angle: number) => [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  const [sx, sy] = toPoint(start);
  const [ex, ey] = toPoint(end);
  return `M ${sx} ${sy} A ${radius} ${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${ex} ${ey}`;
};

export function DotMatrixChart({
  data,
  rows = 8,
  columns,
  color = 'var(--chart-violet-600)',
  unit = 'records'
}: {
  data: ChartPoint[];
  rows?: number;
  columns?: number;
  color?: string;
  unit?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const activeIndex = hovered ?? selected;
  const cols = columns ?? data.length;
  const viewWidth = cols * 25;
  const viewHeight = rows * 22;

  return <div className="relative pt-8" onMouseLeave={() => setHovered(null)}>
    {activeIndex !== null && data[activeIndex] && <ChartTooltip {...data[activeIndex]} value={data[activeIndex].value.toLocaleString()} unit={data[activeIndex].unit ?? unit} />}
    <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="w-full" role="group" aria-label={`Dot matrix chart. ${data.map((item) => `${item.label}: ${item.value} ${item.unit ?? unit}`).join('; ')}`}>
      {data.map((point, index) => {
        const activeRows = Math.max(0, Math.min(rows, Math.round(point.value / Math.max(...data.map((d) => d.value), 1) * rows)));
        const cx = index * 25 + 12;
        const dim = activeIndex !== null && activeIndex !== index;
        return <g key={`${point.label}-${index}`} data-chart-point tabIndex={0} role="button" aria-pressed={selected === index} aria-label={`${point.label}: ${point.value.toLocaleString()} ${point.unit ?? unit}${point.source ? `, source ${point.source}` : ''}${point.comparison ? `, ${point.comparison}` : ''}`} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onMouseEnter={() => setHovered(index)} onClick={() => setSelected(selected === index ? null : index)} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') focusNeighbor(event, -1);
          if (event.key === 'ArrowRight') focusNeighbor(event, 1);
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(selected === index ? null : index); }
        }} className="cursor-pointer outline-none focus-visible:outline-none">
          {Array.from({ length: rows }, (_, row) => {
            const on = row >= rows - activeRows;
            return <motion.circle key={row} cx={cx} cy={viewHeight - 12 - row * 22} r={5.4} fill={on ? color : 'var(--chart-inactive)'} opacity={dim ? (on ? 0.28 : 0.18) : on ? 1 : 0.8} initial={reduceMotion ? false : { scale: 0.65, opacity: 0 }} animate={{ scale: 1, opacity: dim ? (on ? 0.28 : 0.18) : on ? 1 : 0.8 }} transition={{ duration: reduceMotion ? 0 : 0.28, delay: reduceMotion ? 0 : index * 0.018 + row * 0.006 }} className="focus:stroke-[#18181B] focus:stroke-2" />;
          })}
        </g>;
      })}
    </svg>
    <div className="mt-1.5 grid text-center" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
      {data.map((point, index) => (
        <span key={point.label} className={`text-[10px] font-data ${activeIndex === index ? 'text-[#5625B8] font-semibold' : 'text-[#85808D]'}`}>
          {point.label}
        </span>
      ))}
    </div>
  </div>;
}

export function StripedBarChart({
  labels,
  series,
  unit = 'tCO₂e',
  height = 190,
  showLabels = true
}: {
  labels: string[];
  series: ChartSeries[];
  unit?: string;
  height?: number;
  showLabels?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const activeIndex = hovered ?? selected;
  const width = 1000;
  const cell = width / Math.max(labels.length, 1);
  const barWidth = Math.min(24, cell / Math.max(series.length + 1, 2));
  const gap = Math.min(7, barWidth * 0.32);
  const max = Math.max(...series.flatMap((s) => s.values), 1) * 1.12;
  const patternBaseId = `bars-${useId().replace(/:/g, '')}`;

  return <div className="relative pt-8" onMouseLeave={() => setHovered(null)}>
    {activeIndex !== null && <ChartTooltip label={labels[activeIndex]} value={series.map((s) => `${s.label}: ${s.values[activeIndex].toLocaleString()} ${unit}`).join(' · ')} source={Array.from(new Set(series.map((s) => s.sources?.[activeIndex] ?? s.source).filter(Boolean))).join(', ') || undefined} comparison={series.map((s) => s.comparisons?.[activeIndex]).filter(Boolean).join(' · ') || (series.length > 1 ? `${series.reduce((sum, s) => sum + s.values[activeIndex], 0).toLocaleString()} ${unit} across grouped series` : undefined)} />}
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="group" aria-label={`${series.map((s) => s.label).join(', ')} values by ${labels.join(', ')}`}>
      <defs>{series.map((item, index) => {
        const id = `${patternBaseId}-${item.id}`;
        return <pattern key={id} id={id} width={item.pattern === 'hatch' ? 7 : 6} height={item.pattern === 'hatch' ? 7 : 6} patternUnits="userSpaceOnUse" patternTransform={item.pattern === 'solid' ? undefined : 'rotate(38)'}>
          <rect width="100%" height="100%" fill={item.color} />
          {item.pattern !== 'solid' && <rect width={item.pattern === 'hatch' ? 2 : 1.5} height="100%" fill={index % 2 ? '#FFFFFF' : '#FFFFFF'} opacity={item.pattern === 'hatch' ? 0.65 : 0.45} />}
        </pattern>;
      })}</defs>
      {[0, 0.5, 1].map((ratio) => <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="var(--chart-grid)" strokeDasharray={ratio === 1 ? undefined : '4 6'} />)}
      {labels.map((label, index) => {
        const groupWidth = series.length * barWidth + Math.max(0, series.length - 1) * gap;
        const startX = index * cell + (cell - groupWidth) / 2;
        const dim = activeIndex !== null && activeIndex !== index;
        return <g key={label} data-chart-point tabIndex={0} role="button" aria-pressed={selected === index} aria-label={`${label}: ${series.map((item) => `${item.label} ${item.values[index].toLocaleString()} ${unit}`).join(', ')}`} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onMouseEnter={() => setHovered(index)} onClick={() => setSelected(selected === index ? null : index)} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') focusNeighbor(event, -1);
          if (event.key === 'ArrowRight') focusNeighbor(event, 1);
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(selected === index ? null : index); }
        }} className="cursor-pointer outline-none focus-visible:outline-none">
          {series.map((item, seriesIndex) => {
            const value = item.values[index] ?? 0;
            const barHeight = Math.max(0, (value / max) * (height - 8));
            const x = startX + seriesIndex * (barWidth + gap);
            const id = `${patternBaseId}-${item.id}`;
            return <motion.rect key={item.id} x={x} width={barWidth} rx={Math.min(4, barWidth / 3)} fill={`url(#${id})`} initial={reduceMotion ? false : { y: height, height: 0, opacity: 0 }} animate={{ y: height - barHeight, height: barHeight, opacity: dim ? 0.28 : 1 }} transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : index * 0.025 + seriesIndex * 0.03 }} className="focus:stroke-[#18181B] focus:stroke-2" />;
          })}
          <rect x={index * cell} y="0" width={cell} height={height} fill="transparent" />
        </g>;
      })}
    </svg>
    {showLabels && <div className="grid mt-1 text-center" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>{labels.map((label, index) => <button key={label} type="button" onMouseEnter={() => setHovered(index)} onFocus={() => setHovered(index)} onClick={() => setSelected(selected === index ? null : index)} className={`rounded-md py-1 text-[10px] cursor-pointer ${activeIndex === index ? 'bg-[#F1EDFF] text-[#6248D5] font-semibold' : 'text-[#62636D]'}`}>{label}</button>)}</div>}
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">{series.map((item) => <span key={item.id} className="inline-flex items-center gap-1.5 text-[10px] text-[#62636D]"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
  </div>;
}

export function HatchedColumns(props: Omit<React.ComponentProps<typeof StripedBarChart>, 'series' | 'labels'> & { data: ChartPoint[]; color?: string }) {
  const { data, color = '#4268D4', ...rest } = props;
  return <StripedBarChart {...rest} labels={data.map((point) => point.label)} series={[{ id: 'hatched', label: 'Emissions', color, values: data.map((point) => point.value), pattern: 'hatch', sources: data.map((point) => point.source), comparisons: data.map((point) => point.comparison) }]} />;
}

export function CapsuleDivergingChart({ data, unit = 'tCO₂e' }: { data: ChartPoint[]; unit?: string }) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const activeIndex = hovered ?? selected;
  const width = 1000;
  const height = 170;
  const baseline = height / 2;
  const cell = width / Math.max(data.length, 1);
  const max = Math.max(...data.map((point) => Math.abs(point.value)), 1) * 1.15;

  return <div className="relative pt-8" onMouseLeave={() => setHovered(null)}>
    {activeIndex !== null && <ChartTooltip {...data[activeIndex]} value={`${data[activeIndex].value > 0 ? '+' : ''}${data[activeIndex].value.toLocaleString()}`} unit={data[activeIndex].unit ?? unit} />}
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="group" aria-label="Diverging chart, values above zero increase and values below zero are reductions">
      {[0, baseline, height].map((y) => <line key={y} x1="0" x2={width} y1={y} y2={y} stroke={y === baseline ? '#AAA6B0' : '#E7E8ED'} strokeDasharray={y === baseline ? undefined : '4 6'} />)}
      {data.map((point, index) => {
        const capsuleHeight = Math.max(5, Math.abs(point.value) / max * (baseline - 14));
        const x = index * cell + cell / 2;
        const y = point.value >= 0 ? baseline - capsuleHeight : baseline;
        const dim = activeIndex !== null && activeIndex !== index;
        return <g key={`${point.label}-${index}`} data-chart-point tabIndex={0} role="button" aria-pressed={selected === index} aria-label={`${point.label}: ${point.value > 0 ? 'increase' : 'reduction'} ${Math.abs(point.value).toLocaleString()} ${point.unit ?? unit}`} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onMouseEnter={() => setHovered(index)} onClick={() => setSelected(selected === index ? null : index)} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') focusNeighbor(event, -1);
          if (event.key === 'ArrowRight') focusNeighbor(event, 1);
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(selected === index ? null : index); }
        }} className="cursor-pointer outline-none focus-visible:outline-none">
          <motion.rect x={x - Math.min(15, cell * 0.22)} width={Math.min(30, cell * 0.44)} rx={Math.min(15, cell * 0.22)} fill={point.value > 0 ? 'var(--chart-rose-500)' : point.value < 0 ? 'var(--chart-teal-700)' : '#A7A5AE'} initial={reduceMotion ? false : { opacity: 0.3, scaleY: 0.25 }} animate={{ y, height: capsuleHeight, opacity: dim ? 0.3 : 1, scaleY: 1 }} style={{ transformOrigin: point.value >= 0 ? 'center bottom' : 'center top' }} transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : index * 0.025 }} className="focus:stroke-[#18181B] focus:stroke-2" />
          <rect x={index * cell} y="0" width={cell} height={height} fill="transparent" />
        </g>;
      })}
    </svg>
    <div className="grid text-center" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>{data.map((point, index) => <button key={point.label} type="button" onMouseEnter={() => setHovered(index)} onFocus={() => setHovered(index)} onClick={() => setSelected(selected === index ? null : index)} className={`rounded-md py-1 text-[10px] cursor-pointer ${activeIndex === index ? 'bg-[#F1EDFF] text-[#6248D5] font-semibold' : 'text-[#62636D]'}`}>{point.label}</button>)}</div>
    <div className="mt-2 flex items-center gap-3 text-[10px] text-[#667085]">
      <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--chart-rose-500)]" />Increase</span>
      <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--chart-teal-700)]" />Reduction</span>
    </div>
  </div>;
}

export function SegmentedRadialGauge({ value, max = 100, segments = 36, color = 'var(--chart-teal-700)', label = 'Complete', unit = '%' }: { value: number; max?: number; segments?: number; color?: string; label?: string; unit?: string }) {
  const reduceMotion = useReducedMotion();
  const progress = Math.max(0, Math.min(1, value / Math.max(max, 1)));
  const activeCount = Math.round(progress * segments);
  const cx = 130; const cy = 124; const radius = 88;
  const gap = Math.min(0.033, Math.PI / segments * 0.38);
  return <div className="relative mx-auto w-full max-w-[260px] pt-2" role="img" aria-label={`${label}: ${value} ${unit}`}>
    <svg viewBox="0 0 260 148" className="w-full">
      {Array.from({ length: segments }, (_, index) => {
        const start = Math.PI + index / segments * Math.PI + gap / 2;
        const end = Math.PI + (index + 1) / segments * Math.PI - gap / 2;
        const active = index < activeCount;
        return <motion.path key={index} d={describeArc(cx, cy, radius, start, end)} fill="none" stroke={active ? color : 'var(--chart-inactive)'} strokeWidth="13" strokeLinecap="round" initial={reduceMotion ? false : { pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: active ? 1 : 0.88 }} transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : index * 0.012 }} />;
      })}
      <text x={cx} y="126" textAnchor="middle" fill="#18181B" fontSize="33" fontWeight="650">{value}{unit === '%' ? '%' : ''}</text>
      <text x={cx} y="145" textAnchor="middle" fill="#62636D" fontSize="11">{label}</text>
    </svg>
  </div>;
}

export function SegmentedDonut({ data, totalLabel, unit = '' }: { data: { label: string; value: number; color: string; source?: string }[]; totalLabel?: string; unit?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const smallestArc = Math.min(...data.map((point) => point.value / Math.max(total, 1) * Math.PI * 2));
  const gap = data.length ? Math.min(0.035, smallestArc * 0.4) : 0;
  let position = -Math.PI / 2;
  return <div className="relative mx-auto w-full max-w-[255px]" onMouseLeave={() => setActive(null)}>
    {active !== null && <ChartTooltip label={data[active].label} value={data[active].value.toLocaleString()} unit={unit} source={data[active].source} comparison={`${Math.round(data[active].value / Math.max(total, 1) * 100)}% of total`} />}
    <svg viewBox="0 0 220 220" className="w-full" role="group" aria-label={`Segmented donut. Total ${total.toLocaleString()} ${unit}`}>
      {data.map((point, index) => {
        const angle = point.value / Math.max(total, 1) * Math.PI * 2;
        const path = describeArc(110, 110, 78, position + gap / 2, position + angle - gap / 2);
        position += angle;
        return <path key={point.label} d={path} fill="none" stroke={point.color} strokeWidth="28" strokeLinecap="round" opacity={active !== null && active !== index ? 0.28 : 1} tabIndex={0} role="button" aria-label={`${point.label}: ${point.value.toLocaleString()} ${unit}, ${Math.round(point.value / Math.max(total, 1) * 100)}%`} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(index)} onClick={() => setActive(active === index ? null : index)} className="cursor-pointer transition-opacity duration-150 focus:stroke-[34]" />;
      })}
      <text x="110" y="104" textAnchor="middle" fill="#18181B" fontSize="25" fontWeight="650">{total.toLocaleString()}</text>
      {totalLabel && <text x="110" y="126" textAnchor="middle" fill="#62636D" fontSize="11">{totalLabel}</text>}
    </svg>
    <div className="mt-2 flex flex-wrap justify-center gap-2">{data.map((point, index) => <button key={point.label} type="button" onFocus={() => setActive(index)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(index)} onClick={() => setActive(active === index ? null : index)} className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/55 px-2 py-1 text-[10px] text-[#42434B]"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: point.color }} />{point.label} · {Math.round(point.value / Math.max(total, 1) * 100)}%</button>)}</div>
  </div>;
}

export function ConnectedStackedArea({ labels, series, unit = 'tCO₂e' }: { labels: string[]; series: ChartSeries[]; unit?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 1000; const height = 220; const max = Math.max(...labels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0)), 1) * 1.08;
  const xs = labels.map((_, i) => 30 + i * (width - 60) / Math.max(labels.length - 1, 1));
  const cumulative = labels.map(() => 0);
  const bands = series.map((item) => {
    const lower = cumulative.slice();
    item.values.forEach((value, index) => { cumulative[index] += value; });
    return { item, lower, upper: cumulative.slice() };
  });
  return <div className="relative pt-8" onMouseLeave={() => setActive(null)}>
    {active !== null && <ChartTooltip label={labels[active]} value={series.map((s) => `${s.label}: ${s.values[active].toLocaleString()} ${unit}`).join(' · ')} source={Array.from(new Set(series.map((s) => s.source).filter(Boolean))).join(', ') || undefined} comparison="Stacked scope totals" />}
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="group" aria-label="Connected stacked areas by reporting period">
      {[0, 0.5, 1].map((ratio) => <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="#E7E8ED" strokeDasharray="4 6"/>)}
      {bands.map(({ item, lower, upper }) => {
        const upperPoints = upper.map((value, index) => [xs[index], height - value / max * (height - 12)]);
        const lowerPoints = lower.map((value, index) => [xs[index], height - value / max * (height - 12)]).reverse();
        const path = `M ${upperPoints.map(([x, y]) => `${x} ${y}`).join(' L ')} L ${lowerPoints.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
        return <path key={item.id} d={path} fill={item.color} fillOpacity=".72" stroke={item.color} strokeWidth="1.5" />;
      })}
      {xs.map((x, index) => <line key={index} x1={x} x2={x} y1="0" y2={height} stroke={active === index ? '#6248D5' : 'transparent'} strokeDasharray="3 4" onMouseEnter={() => setActive(index)} />)}
      {xs.map((x, index) => <rect key={`hit-${index}`} x={x - width / labels.length / 2} y="0" width={width / labels.length} height={height} fill="transparent" tabIndex={0} role="button" aria-label={`${labels[index]}: ${series.map((s) => `${s.label} ${s.values[index].toLocaleString()} ${unit}`).join(', ')}`} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(index)} onClick={() => setActive(active === index ? null : index)} />)}
    </svg>
    <div className="grid text-center" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>{labels.map((label, index) => <button key={label} type="button" onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} className="text-[10px] text-[#62636D]">{label}</button>)}</div>
    <div className="mt-2 flex flex-wrap gap-3">{series.map((item) => <span key={item.id} className="inline-flex items-center gap-1.5 text-[10px] text-[#62636D]"><i className="h-2 w-2 rounded-sm" style={{ background: item.color }}/>{item.label}</span>)}</div>
  </div>;
}

export function RoundedBubblePlot({ data, xLabel, yLabel }: { data: { label: string; x: number; y: number; size: number; color: string; unit?: string; source?: string }[]; xLabel: string; yLabel: string }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 1000; const height = 260; const pad = 32;
  const xMin = Math.min(...data.map((d) => d.x)); const xMax = Math.max(...data.map((d) => d.x));
  const yMin = Math.min(...data.map((d) => d.y)); const yMax = Math.max(...data.map((d) => d.y));
  const maxSize = Math.max(...data.map((d) => d.size), 1);
  return <div className="relative pt-8" onMouseLeave={() => setActive(null)}>
    {active !== null && <ChartTooltip label={data[active].label} value={`${xLabel}: ${data[active].x.toLocaleString()} · ${yLabel}: ${data[active].y.toLocaleString()}`} source={data[active].source} comparison={`Bubble size: ${data[active].size.toLocaleString()} tCO₂e`} />}
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="group" aria-label={`Bubble plot comparing ${xLabel} and ${yLabel}`}>
      {[0, 1, 2, 3].map((step) => <line key={step} x1={0} x2={width} y1={step * height / 3} y2={step * height / 3} stroke="#E7E8ED" strokeDasharray="4 6"/>)}
      {data.map((point, index) => {
        const cx = pad + (point.x - xMin) / Math.max(xMax - xMin, 1) * (width - pad * 2);
        const cy = height - pad - (point.y - yMin) / Math.max(yMax - yMin, 1) * (height - pad * 2);
        const radius = 12 + Math.sqrt(point.size / maxSize) * 28;
        return <g key={point.label} data-chart-point tabIndex={0} role="button" aria-label={`${point.label}. ${xLabel} ${point.x}; ${yLabel} ${point.y}; volume ${point.size}`} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(index)} onClick={() => setActive(active === index ? null : index)} onKeyDown={(event) => { if (event.key === 'ArrowLeft') focusNeighbor(event, -1); if (event.key === 'ArrowRight') focusNeighbor(event, 1); }} className="cursor-pointer outline-none focus-visible:outline-none">
          <circle cx={cx} cy={cy} r={radius} fill={point.color} fillOpacity={active === null || active === index ? 0.82 : 0.2} stroke={point.color} strokeOpacity=".9" strokeWidth={active === index ? 3 : 1.5} className="transition-all duration-150" />
        </g>;
      })}
      <text x={width / 2} y={height - 4} textAnchor="middle" fill="#878891" fontSize="12">{xLabel} →</text>
      <text x="14" y="16" fill="#878891" fontSize="12">↑ {yLabel}</text>
    </svg>
  </div>;
}

export function SmoothAreaChart({ data, color = 'var(--chart-violet-700)', unit = 'tCO₂e' }: { data: ChartPoint[]; color?: string; unit?: string }) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const active = hovered ?? selected;
  const width = 1000; const height = 190; const max = Math.max(...data.map((item) => item.value), 1) * 1.1;
  const points = data.map((point, index) => ({ x: (index + 0.5) * width / data.length, y: height - point.value / max * (height - 12), point }));
  const line = points.length ? `M ${points[0].x} ${points[0].y}` + points.slice(1).map((p, index) => { const prev = points[index]; const mid = (prev.x + p.x) / 2; return ` C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`; }).join('') : '';
  const area = points.length ? `${line} L ${width} ${height} L 0 ${height} Z` : '';
  const gradientId = `area-${useId().replace(/:/g, '')}`;
  return <div className="relative pt-8" onMouseLeave={() => setHovered(null)}>
    {active !== null && <ChartTooltip {...data[active]} value={data[active].value.toLocaleString()} unit={data[active].unit ?? unit} />}
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="group" aria-label="Smoothed monthly emissions trend">
      <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".2"/><stop offset="100%" stopColor={color} stopOpacity=".015"/></linearGradient></defs>
      {[0, 0.5, 1].map((ratio) => <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="#E7E8ED" strokeDasharray="4 6"/>)}
      <motion.path d={area} fill={`url(#${gradientId})`} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.55 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduceMotion ? 0 : 0.75 }} />
      {points.map(({ x, y, point }, index) => <g key={point.label} data-chart-point tabIndex={0} role="button" aria-label={`${point.label}: ${point.value.toLocaleString()} ${point.unit ?? unit}`} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onMouseEnter={() => setHovered(index)} onClick={() => setSelected(selected === index ? null : index)} onKeyDown={(event) => { if (event.key === 'ArrowLeft') focusNeighbor(event, -1); if (event.key === 'ArrowRight') focusNeighbor(event, 1); }} className="cursor-pointer outline-none">
        <line x1={x} x2={x} y1="0" y2={height} stroke={active === index ? color : 'transparent'} strokeDasharray="4 5" />
        <circle cx={x} cy={y} r={active === index ? 6 : 4} fill={color} stroke="#FFFFFF" strokeWidth="2" />
        <rect x={x - width / data.length / 2} y="0" width={width / data.length} height={height} fill="transparent" />
      </g>)}
    </svg>
    <div className="grid text-center" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>{data.map((point, index) => <button key={point.label} type="button" onMouseEnter={() => setHovered(index)} onFocus={() => setHovered(index)} onClick={() => setSelected(selected === index ? null : index)} className={`rounded-md py-1 text-[10px] cursor-pointer ${active === index ? 'text-[#6248D5] font-semibold' : 'text-[#62636D]'}`}>{point.label}</button>)}</div>
  </div>;
}

export function TargetBulletChart({ value, target, max, unit = 'tCO₂e', label = 'Actual vs target' }: { value: number; target: number; max: number; unit?: string; label?: string }) {
  const safeMax = Math.max(max, 1);
  const valuePct = Math.max(0, Math.min(100, value / safeMax * 100));
  const targetPct = Math.max(0, Math.min(100, target / safeMax * 100));
  return <div className="space-y-3" role="img" aria-label={`${label}: actual ${value.toLocaleString()} ${unit}, target ${target.toLocaleString()} ${unit}`}>
    <div className="flex items-baseline justify-between text-[11px]"><span className="text-[#62636D]">{label}</span><span className="font-data font-semibold text-[#18181B]">{value.toLocaleString()} <span className="font-sans font-normal text-[#62636D]">{unit}</span></span></div>
    <div className="relative h-4 rounded-full bg-[#EDEDF2] overflow-visible"><div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#D9CFFA] to-[#6248D5]" style={{ width: `${valuePct}%` }}/><div className="absolute -top-1 h-6 w-[3px] rounded-full bg-[#18181B] shadow-sm" style={{ left: `${targetPct}%` }} title={`Target ${target.toLocaleString()} ${unit}`}/></div>
    <div className="flex justify-between text-[10px] text-[#878891]"><span>0</span><span>Target {target.toLocaleString()} {unit}</span><span>{safeMax.toLocaleString()}</span></div>
  </div>;
}

export function SegmentedProgress({ value, segments = 24, color = 'var(--chart-violet-700)', label = 'Progress' }: { value: number; segments?: number; color?: string; label?: string }) {
  const filled = Math.max(0, Math.min(segments, Math.round(value / 100 * segments)));
  return <div role="img" aria-label={`${label}: ${value}%`}>
    <div className="mb-2 flex items-center justify-between text-[11px]"><span className="text-[#62636D]">{label}</span><span className="font-data font-semibold text-[#18181B]">{value}%</span></div>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}>{Array.from({ length: segments }, (_, index) => <span key={index} className="h-2 rounded-full transition-colors duration-200" style={{ backgroundColor: index < filled ? color : '#EDEDF2' }}/>)}</div>
  </div>;
}

export interface WaterfallItem {
  id: string;
  label: string;
  delta: number;
  type: 'start' | 'increase' | 'decrease' | 'end';
  detail?: string;
}

export function WaterfallBridgeChart({ data, unit = 'tCO₂e' }: { data: WaterfallItem[]; unit?: string }) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const active = hovered ?? selected;

  let running = 0;
  const computed = data.map((item) => {
    if (item.type === 'start' || item.type === 'end') {
      running = item.delta;
      return { ...item, start: 0, end: item.delta };
    }
    const start = running;
    running += item.delta;
    return { ...item, start, end: running };
  });

  const maxVal = Math.max(...computed.flatMap((d) => [d.start, d.end]), 1) * 1.1;
  const width = 1000;
  const height = 220;
  const padTop = 18;
  const padBottom = 16;
  const plotH = height - padTop - padBottom;
  const cell = width / Math.max(computed.length, 1);
  const barW = Math.min(72, cell * 0.56);
  const yFor = (val: number) => padTop + plotH - (val / maxVal) * plotH;

  const colorFor = (type: WaterfallItem['type']) => {
    if (type === 'start') return '#8062E8';
    if (type === 'end') return '#5625B8';
    if (type === 'increase') return 'var(--chart-rose-500)';
    return 'var(--chart-teal-700)';
  };

  return (
    <div className="relative pt-8" onMouseLeave={() => setHovered(null)}>
      {active !== null && computed[active] && (
        <ChartTooltip
          label={computed[active].label}
          value={`${computed[active].type === 'increase' ? '+' : ''}${computed[active].delta.toLocaleString()}`}
          unit={unit}
          comparison={computed[active].detail}
        />
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="group" aria-label="Emissions bridge waterfall chart">
        {[0, 0.5, 1].map((r) => (
          <line key={r} x1="0" x2={width} y1={padTop + plotH * r} y2={padTop + plotH * r} stroke="var(--chart-grid)" strokeDasharray="4 6" />
        ))}
        {computed.map((item, idx) => {
          const x = idx * cell + cell / 2 - barW / 2;
          const yTop = yFor(Math.max(item.start, item.end));
          const yBot = yFor(Math.min(item.start, item.end));
          const barH = Math.max(6, yBot - yTop);
          const dim = active !== null && active !== idx;
          const next = computed[idx + 1];
          const connectorY = yFor(item.end);

          return (
            <g
              key={item.id}
              data-chart-point
              tabIndex={0}
              role="button"
              aria-label={`${item.label}: ${item.delta > 0 && item.type === 'increase' ? '+' : ''}${item.delta.toLocaleString()} ${unit}`}
              onFocus={() => setHovered(idx)}
              onBlur={() => setHovered(null)}
              onMouseEnter={() => setHovered(idx)}
              onClick={() => setSelected(selected === idx ? null : idx)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') focusNeighbor(e, -1);
                if (e.key === 'ArrowRight') focusNeighbor(e, 1);
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(selected === idx ? null : idx); }
              }}
              className="cursor-pointer outline-none"
            >
              {next && (
                <line
                  x1={x + barW}
                  x2={(idx + 1) * cell + cell / 2 - barW / 2}
                  y1={connectorY}
                  y2={connectorY}
                  stroke="#C7BED3"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                />
              )}
              <motion.rect
                x={x}
                width={barW}
                rx={6}
                fill={colorFor(item.type)}
                initial={reduceMotion ? false : { y: yBot, height: 0, opacity: 0 }}
                animate={{ y: yTop, height: barH, opacity: dim ? 0.28 : 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : idx * 0.05 }}
              />
              <text
                x={x + barW / 2}
                y={yTop - 7}
                textAnchor="middle"
                fill={active === idx ? '#15131A' : '#667085'}
                fontSize="13"
                fontWeight="600"
                fontFamily="IBM Plex Mono, monospace"
              >
                {item.type === 'increase' ? '+' : ''}{(item.delta / 1000).toFixed(1)}k
              </text>
              <rect x={idx * cell} y="0" width={cell} height={height} fill="transparent" />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 grid text-center" style={{ gridTemplateColumns: `repeat(${computed.length}, minmax(0, 1fr))` }}>
        {computed.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onMouseEnter={() => setHovered(idx)}
            onFocus={() => setHovered(idx)}
            onClick={() => setSelected(selected === idx ? null : idx)}
            className={`truncate rounded-md px-1 py-1 text-[10px] cursor-pointer ${active === idx ? 'bg-[#F1EDFF] text-[#5625B8] font-semibold' : 'text-[#667085]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface PathwayYearPoint {
  year: number;
  actual?: number;
  forecast: number;
  required: number;
  upperBand?: number;
  lowerBand?: number;
}

export function NetZeroForecastChart({
  points,
  thresholdTonnes,
  targetYear,
  compact = false
}: {
  points: PathwayYearPoint[];
  thresholdTonnes: number;
  targetYear: number;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const gradId = `nz-${useId().replace(/:/g, '')}`;
  const width = 1000;
  const height = compact ? 235 : 285;
  const padLeft = 56;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxY = Math.max(...points.flatMap((p) => [p.actual ?? 0, p.forecast, p.required, p.upperBand ?? 0]), 1) * 1.08;
  const xFor = (idx: number) => padLeft + (idx / Math.max(points.length - 1, 1)) * plotW;
  const yFor = (val: number) => padTop + plotH - (val / maxY) * plotH;

  const actualPts = points.map((p, idx) => (p.actual !== undefined ? { x: xFor(idx), y: yFor(p.actual) } : null)).filter(Boolean) as { x: number; y: number }[];
  const actualPath = actualPts.length ? `M ${actualPts.map((pt) => `${pt.x} ${pt.y}`).join(' L ')}` : '';
  const actualArea = actualPts.length
    ? `${actualPath} L ${actualPts[actualPts.length - 1].x} ${padTop + plotH} L ${actualPts[0].x} ${padTop + plotH} Z`
    : '';

  const forecastPts = points.map((p, idx) => ({ x: xFor(idx), y: yFor(p.forecast) }));
  const forecastPath = `M ${forecastPts.map((pt) => `${pt.x} ${pt.y}`).join(' L ')}`;

  const requiredPts = points.map((p, idx) => ({ x: xFor(idx), y: yFor(p.required) }));
  const requiredPath = `M ${requiredPts.map((pt) => `${pt.x} ${pt.y}`).join(' L ')}`;

  const bandPtsUpper = points.map((p, idx) => ({ x: xFor(idx), y: yFor(p.upperBand ?? p.forecast) }));
  const bandPtsLower = points.map((p, idx) => ({ x: xFor(idx), y: yFor(p.lowerBand ?? p.forecast) })).reverse();
  const bandPath = points.some((p) => p.upperBand !== undefined)
    ? `M ${bandPtsUpper.map((pt) => `${pt.x} ${pt.y}`).join(' L ')} L ${bandPtsLower.map((pt) => `${pt.x} ${pt.y}`).join(' L ')} Z`
    : '';

  // Visual gap fill between Forecast and Required pathway from future points
  const futureIndices = points.map((p, idx) => (p.actual === undefined ? idx : -1)).filter((idx) => idx >= 0);
  const gapStartIdx = futureIndices.length ? Math.max(0, futureIndices[0] - 1) : -1;
  const gapSlice = gapStartIdx >= 0 ? points.slice(gapStartIdx) : [];
  const gapAreaPath =
    gapSlice.length > 1
      ? `M ${gapSlice.map((p, i) => `${xFor(gapStartIdx + i)} ${yFor(p.forecast)}`).join(' L ')} L ${gapSlice
          .slice()
          .reverse()
          .map((p, i) => `${xFor(gapStartIdx + gapSlice.length - 1 - i)} ${yFor(p.required)}`)
          .join(' L ')} Z`
      : '';
  const lastPoint = points[points.length - 1];
  const hasPositiveGap = lastPoint ? lastPoint.forecast > lastPoint.required : false;

  const activePoint = hovered !== null ? points[hovered] : null;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(maxY * (1 - r)));
  const thresholdY = yFor(thresholdTonnes);

  return (
    <div className="relative" onMouseLeave={() => setHovered(null)}>
      {hovered !== null && activePoint && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-1 z-20 min-w-[205px] -translate-x-1/2 rounded-xl border border-[#D8D2DF] bg-white/95 px-3 py-2 text-[11px] shadow-[0_8px_24px_rgba(21,19,26,0.12)] backdrop-blur-md"
          style={{ left: `${Math.max(16, Math.min(84, (xFor(hovered) / width) * 100))}%` }}
        >
          <div className="flex items-center justify-between font-semibold text-[#15131A] mb-1">
            <span className="font-data">{activePoint.year}</span>
            <span className="text-[10px] font-medium text-[#667085]">
              {activePoint.actual !== undefined ? 'Measured' : 'Projected'}
            </span>
          </div>
          {activePoint.actual !== undefined && (
            <div className="flex justify-between text-[#5625B8]">
              <span>Measured</span>
              <span className="font-data font-semibold">{activePoint.actual.toLocaleString()} t</span>
            </div>
          )}
          <div className="flex justify-between text-[#D95917]">
            <span>Current Pace</span>
            <span className="font-data font-semibold">{activePoint.forecast.toLocaleString()} t</span>
          </div>
          <div className="flex justify-between text-[#238C78]">
            <span>Goal Path ({targetYear})</span>
            <span className="font-data font-semibold">{activePoint.required.toLocaleString()} t</span>
          </div>
          <div className="mt-1 pt-1 border-t border-[#EEEAF5] flex justify-between text-[#15131A]">
            <span className="text-[#667085]">Emissions Gap</span>
            <span className={`font-data font-semibold ${activePoint.forecast - activePoint.required > 0 ? 'text-[#B91C1C]' : 'text-[#15803D]'}`}>
              {activePoint.forecast - activePoint.required > 0 ? '+' : ''}
              {(activePoint.forecast - activePoint.required).toLocaleString()} t
            </span>
          </div>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="group" aria-label="Net-zero trajectory and forecast pathway">
        <defs>
          <linearGradient id={`${gradId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5625B8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#5625B8" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id={`${gradId}-gap`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hasPositiveGap ? '#F46A1F' : '#238C78'} stopOpacity="0.22" />
            <stop offset="100%" stopColor={hasPositiveGap ? '#F46A1F' : '#238C78'} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {yTicks.map((val, i) => {
          const y = yFor(val);
          return (
            <g key={i}>
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="#E7E5ED" strokeDasharray="4 6" />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="#85808D" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                {val >= 1000 ? `${Math.round(val / 1000)}k` : val}
              </text>
            </g>
          );
        })}

        {/* 90% Reduction Threshold Line */}
        <line x1={padLeft} x2={width - padRight} y1={thresholdY} y2={thresholdY} stroke="#238C78" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.7" />
        <text x={width - padRight} y={thresholdY - 6} textAnchor="end" fill="#238C78" fontSize="10" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
          Net-Zero Goal ({(thresholdTonnes / 1000).toFixed(1)}k t)
        </text>

        {/* Visual Gap Shading between Current Pace & Goal Path */}
        {gapAreaPath && <path d={gapAreaPath} fill={`url(#${gradId}-gap)`} />}

        {/* Confidence uncertainty band */}
        {bandPath && <path d={bandPath} fill="#F46A1F" fillOpacity="0.06" />}

        {/* Required pathway */}
        <motion.path
          d={requiredPath}
          fill="none"
          stroke="#238C78"
          strokeWidth="2.8"
          strokeDasharray="6 5"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.7 }}
        />

        {/* Forecast trajectory */}
        <motion.path
          d={forecastPath}
          fill="none"
          stroke="#F46A1F"
          strokeWidth="2.8"
          strokeDasharray="5 4"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.75 }}
        />

        {/* Historical actuals */}
        {actualArea && <path d={actualArea} fill={`url(#${gradId}-area)`} />}
        {actualPath && (
          <motion.path
            d={actualPath}
            fill="none"
            stroke="#5625B8"
            strokeWidth="3.4"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.6 }}
          />
        )}

        {/* Milestone Pins on Target Year */}
        {points.map((pt, idx) => {
          if (pt.year !== 2030 && pt.year !== targetYear) return null;
          const x = xFor(idx);
          const yReq = yFor(pt.required);
          return (
            <g key={`pin-${pt.year}`} className="pointer-events-none">
              <circle cx={x} cy={yReq} r="5" fill="#238C78" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          );
        })}

        {/* Interactive hover columns & nodes */}
        {points.map((pt, idx) => {
          const x = xFor(idx);
          const isKeyYear = pt.year === 2020 || pt.year === 2025 || pt.year === 2030 || pt.year === 2035 || pt.year === targetYear || idx === points.length - 1;
          const isHover = hovered === idx;
          const colW = plotW / Math.max(points.length, 1);

          return (
            <g
              key={pt.year}
              data-chart-point
              tabIndex={0}
              role="button"
              aria-label={`${pt.year}: trajectory ${pt.forecast.toLocaleString()} tCO₂e, required ${pt.required.toLocaleString()} tCO₂e`}
              onMouseEnter={() => setHovered(idx)}
              onFocus={() => setHovered(idx)}
              onBlur={() => setHovered(null)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') focusNeighbor(e, -1);
                if (e.key === 'ArrowRight') focusNeighbor(e, 1);
              }}
              className="cursor-pointer outline-none"
            >
              {isHover && <line x1={x} x2={x} y1={padTop} y2={padTop + plotH} stroke="#5625B8" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.55" />}
              {pt.actual !== undefined && (
                <circle cx={x} cy={yFor(pt.actual)} r={isHover ? 5.5 : 3.5} fill="#5625B8" stroke="#FFFFFF" strokeWidth="1.8" />
              )}
              {pt.actual === undefined && isHover && (
                <>
                  <circle cx={x} cy={yFor(pt.forecast)} r="5" fill="#F46A1F" stroke="#FFFFFF" strokeWidth="1.8" />
                  <circle cx={x} cy={yFor(pt.required)} r="4.5" fill="#238C78" stroke="#FFFFFF" strokeWidth="1.8" />
                </>
              )}
              {(isKeyYear || isHover) && (
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  fill={isHover ? '#5625B8' : '#667085'}
                  fontSize="11"
                  fontWeight={isHover || pt.year === targetYear ? '600' : '400'}
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {pt.year}
                </text>
              )}
              <rect x={x - colW / 2} y={padTop} width={colW} height={plotH + padBottom} fill="transparent" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function MicroDotMatrix({
  percent,
  color = '#5625B8',
  cols = 10,
  rows = 4
}: {
  percent: number;
  color?: string;
  cols?: number;
  rows?: number;
}) {
  const total = cols * rows;
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * total);
  return (
    <svg viewBox={`0 0 ${cols * 10} ${rows * 10}`} className="w-full h-auto max-w-[160px]" aria-hidden="true">
      {Array.from({ length: total }, (_, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const on = idx < filled;
        return (
          <circle
            key={idx}
            cx={col * 10 + 5}
            cy={row * 10 + 5}
            r={3.2}
            fill={on ? color : '#E8E4F0'}
            opacity={on ? 0.92 : 0.7}
          />
        );
      })}
    </svg>
  );
}

export interface MaccLeverItem {
  id: string;
  name: string;
  scope: string;
  annualAbatement: number;
  costPerTonne: number;
  capexMillion: number;
}

export function MaccChart({ levers }: { levers: MaccLeverItem[] }) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const sorted = [...levers].sort((a, b) => a.costPerTonne - b.costPerTonne);
  const totalAbatement = sorted.reduce((sum, l) => sum + l.annualAbatement, 0) || 1;
  const maxAbsCost = Math.max(...sorted.map((l) => Math.abs(l.costPerTonne)), 40) * 1.15;

  const width = 1000;
  const height = 220;
  const padLeft = 48;
  const padRight = 18;
  const plotW = width - padLeft - padRight;
  const zeroY = height * 0.56;
  const scaleY = (cost: number) => (cost / maxAbsCost) * (cost >= 0 ? zeroY - 18 : height - zeroY - 22);

  let cursorX = padLeft;
  const blocks = sorted.map((l) => {
    const w = Math.max(24, (l.annualAbatement / totalAbatement) * plotW);
    const x = cursorX;
    cursorX += w;
    return { ...l, x, w: Math.max(12, w - 4) };
  });

  const active = hovered !== null ? blocks[hovered] : null;

  return (
    <div className="relative pt-7" onMouseLeave={() => setHovered(null)}>
      {active && (
        <ChartTooltip
          label={active.name}
          value={`${active.costPerTonne < 0 ? '-' : '+'}$${Math.abs(active.costPerTonne)} / tCO₂e`}
          comparison={`${active.annualAbatement.toLocaleString()} tCO₂e/yr · ${active.scope} · $${active.capexMillion}M CapEx`}
        />
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="group" aria-label="Marginal abatement cost curve">
        <line x1={padLeft} x2={width - padRight} y1={zeroY} y2={zeroY} stroke="#AAA6B0" strokeWidth="1.2" />
        <text x={padLeft - 8} y={zeroY + 4} textAnchor="end" fill="#85808D" fontSize="11" fontFamily="IBM Plex Mono, monospace">$0</text>
        <text x={padLeft - 8} y={24} textAnchor="end" fill="#85808D" fontSize="10" fontFamily="IBM Plex Mono, monospace">+${Math.round(maxAbsCost)}</text>
        <text x={padLeft - 8} y={height - 14} textAnchor="end" fill="#238C78" fontSize="10" fontFamily="IBM Plex Mono, monospace">-${Math.round(maxAbsCost)}</text>

        {blocks.map((b, idx) => {
          const barH = Math.max(8, Math.abs(scaleY(b.costPerTonne)));
          const y = b.costPerTonne >= 0 ? zeroY - barH : zeroY;
          const fill = b.costPerTonne < 0 ? '#238C78' : b.scope === 'Scope 1' ? '#5625B8' : b.scope === 'Scope 2' ? '#F46A1F' : '#2563EB';
          const dim = hovered !== null && hovered !== idx;
          return (
            <g
              key={b.id}
              data-chart-point
              tabIndex={0}
              role="button"
              aria-label={`${b.name}: $${b.costPerTonne}/t, ${b.annualAbatement.toLocaleString()} tCO₂e/yr`}
              onMouseEnter={() => setHovered(idx)}
              onFocus={() => setHovered(idx)}
              onBlur={() => setHovered(null)}
              className="cursor-pointer outline-none"
            >
              <motion.rect
                x={b.x}
                width={b.w}
                rx={5}
                fill={fill}
                initial={reduceMotion ? false : { y: zeroY, height: 0, opacity: 0 }}
                animate={{ y, height: barH, opacity: dim ? 0.28 : 0.9 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : idx * 0.04 }}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#667085]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#238C78]" />Net Savings (&lt; $0/t)</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#5625B8]" />Scope 1</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#2563EB]" />Scope 3</span>
        </div>
        <span className="font-data font-medium text-[#15131A]">{(totalAbatement / 1000).toFixed(1)}k tCO₂e/yr</span>
      </div>
    </div>
  );
}

