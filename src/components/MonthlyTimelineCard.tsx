import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { MonthlyEmissions, YearEmissionsData } from '../types';

interface MonthlyTimelineCardProps {
  data: YearEmissionsData;
}

type ScopeFilter = 'all' | 'scope1' | 'scope2' | 'scope3';
type ChartView = 'diverging' | 'connected';

interface ChartSeries {
  id: Exclude<ScopeFilter, 'all'>;
  label: string;
  color: string;
  values: number[];
}

const filters: { id: ScopeFilter; label: string }[] = [
  { id: 'all', label: 'All scopes' },
  { id: 'scope1', label: 'Scope 1' },
  { id: 'scope2', label: 'Scope 2' },
  { id: 'scope3', label: 'Scope 3' }
];

const scopeColors = [
  { id: 'scope1', label: 'Scope 1', color: '#7049D8' },
  { id: 'scope2', label: 'Scope 2', color: '#F46A1F' },
  { id: 'scope3', label: 'Scope 3', color: '#3478E5' }
] as const;

const valueForScope = (month: MonthlyEmissions, scope: ScopeFilter) => {
  if (scope === 'scope1') return month.scope1;
  if (scope === 'scope2') return month.scope2;
  if (scope === 'scope3') return month.scope3;
  return month.total;
};

const formatEmission = (value: number) => Math.round(value).toLocaleString();
const formatAxis = (value: number) => {
  if (value === 0) return '0';
  const sign = value > 0 ? '+' : '−';
  const magnitude = Math.abs(value);
  return `${sign}${magnitude >= 1000 ? `${(magnitude / 1000).toLocaleString()}k` : magnitude.toLocaleString()}`;
};

/** Reusable SVG capsule: height is mapped directly to the supplied value. */
export function DivergingCapsule({
  x,
  baseline,
  width,
  height,
  positive,
  positiveGradient,
  negativeGradient,
  visible,
  playEntrance,
  delay,
  opacity,
  reducedMotion
}: {
  x: number;
  baseline: number;
  width: number;
  height: number;
  positive: boolean;
  positiveGradient: string;
  negativeGradient: string;
  visible: boolean;
  playEntrance: boolean;
  delay: number;
  opacity: number;
  reducedMotion: boolean;
}) {
  const y = positive ? baseline - height : baseline;
  const radius = Math.min(width / 2, height / 2);
  return <motion.rect
    x={x - width / 2}
    width={width}
    rx={radius}
    fill={`url(#${positive ? positiveGradient : negativeGradient})`}
    initial={false}
    animate={{ y: visible ? y : baseline, height: visible ? height : 0, opacity: visible ? opacity : 0 }}
    transition={{
      y: { duration: reducedMotion ? 0 : playEntrance ? 0.6 : 0.3, delay: reducedMotion || !playEntrance ? 0 : delay, ease: [0.22, 1, 0.36, 1] },
      height: { duration: reducedMotion ? 0 : playEntrance ? 0.6 : 0.3, delay: reducedMotion || !playEntrance ? 0 : delay, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: reducedMotion ? 0 : 0.15 }
    }}
  />;
}

export const MonthlyTimelineCard: React.FC<MonthlyTimelineCardProps> = ({ data }) => {
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [chartView, setChartView] = useState<ChartView>('diverging');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, amount: 0.2 });
  const hasEntered = useRef(false);
  const patternId = `monthly-diverge-${useId().replace(/:/g, '')}`;
  const months = data.monthly;
  const values = months.map((month) => valueForScope(month, scopeFilter));
  const changes = values.map((value, index) => index === 0 ? null : value - values[index - 1]);
  const maxChange = Math.max(1, ...changes.map((value) => Math.abs(value ?? 0)));
  const axisMax = Math.max(100, Math.ceil(maxChange / 500) * 500);
  const activeIndex = hoveredIndex ?? selectedIndex;
  const activeMonth = activeIndex === null ? null : months[activeIndex];
  const activeChange = activeIndex === null ? null : changes[activeIndex];
  const total = values.reduce((sum, value) => sum + value, 0);
  const chartWidth = 1000;
  const chartHeight = 320;
  const plotLeft = 88;
  const plotRight = 988;
  const plotTop = 22;
  const baseline = 164;
  const plotHalfHeight = 126;
  const plotWidth = plotRight - plotLeft;
  const cellWidth = plotWidth / Math.max(months.length, 1);
  const capsuleWidth = Math.min(42, cellWidth * 0.56);
  const ticks = [axisMax, axisMax / 2, 0, -axisMax / 2, -axisMax];
  const displayedSeries: ChartSeries[] = scopeColors
    .filter((series) => scopeFilter === 'all' || scopeFilter === series.id)
    .map((series) => ({ ...series, values: months.map((month) => month[series.id]) }));
  const stackedMax = Math.max(1, ...months.map((_, index) => displayedSeries.reduce((sum, series) => sum + series.values[index], 0))) * 1.08;
  const stackedBands = (() => {
    const cumulative = months.map(() => 0);
    return displayedSeries.map((series) => {
      const lower = [...cumulative];
      series.values.forEach((value, index) => { cumulative[index] += value; });
      return { ...series, lower, upper: [...cumulative] };
    });
  })();
  const xFor = (index: number) => plotLeft + (index + 0.5) * cellWidth;

  useEffect(() => {
    if (chartInView) hasEntered.current = true;
  }, [chartInView]);

  const playEntrance = chartInView && !hasEntered.current;
  const axisY = (value: number) => baseline - (value / axisMax) * plotHalfHeight;
  const onKeyDown = (event: React.KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + months.length) % months.length;
      event.currentTarget.parentElement?.querySelectorAll<SVGGElement>('[data-month-point]')[next]?.focus();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedIndex(selectedIndex === index ? null : index);
    }
  };

  const selectedTooltip = activeIndex !== null && activeMonth ? {
    left: `${Math.max(12, Math.min(88, ((plotLeft + (activeIndex + 0.5) * cellWidth) / chartWidth) * 100))}%`,
    current: values[activeIndex],
    previous: activeIndex > 0 ? values[activeIndex - 1] : null,
    change: activeChange
  } : null;

  return (
    <section className="glass-card-top p-5 sm:p-6 relative flex flex-col h-full" aria-labelledby="monthly-emissions-title">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0EA]">
        <div>
          <h2 id="monthly-emissions-title" className="text-[20px] font-semibold tracking-tight text-[#19171D]">Total Emissions over Months</h2>
          <p className="mt-0.5 text-[12px] font-normal text-[#667085]">Monthly emissions · {data.year}</p>
        </div>
        <div className="flex items-center gap-0.5 p-1 bg-white/65 rounded-full border border-[#E5E0EA] text-[12px] self-start sm:self-auto" role="group" aria-label="Filter emissions by scope">
          {filters.map((filter) => <button key={filter.id} type="button" onClick={() => { setScopeFilter(filter.id); setSelectedIndex(null); }} aria-pressed={scopeFilter === filter.id} className={`px-2.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${scopeFilter === filter.id ? 'bg-[#6428D8] text-white shadow-sm font-semibold' : 'text-[#625B6B] hover:text-[#5625B8]'}`}>{filter.label}</button>)}
        </div>
      </header>

      <div className="mt-4 flex items-end justify-between gap-4 min-h-[58px]">
        <div>
          <div className="text-[32px] sm:text-[38px] leading-none font-semibold tracking-[-0.045em] text-[#171329] font-data">{formatEmission(total)} <span className="text-[15px] sm:text-[17px] font-medium tracking-normal text-[#667085]">tCO₂e</span></div>
          <p className="mt-1.5 text-[11px] text-[#77717F]">Jan – Dec · {scopeFilter === 'all' ? 'All scopes' : filters.find((filter) => filter.id === scopeFilter)?.label}</p>
        </div>
      </div>

      <div ref={chartRef} className="mt-3 flex min-h-[360px] flex-1 flex-col" onMouseLeave={() => setHoveredIndex(null)}>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[12px] font-medium text-[#494454]">{chartView === 'diverging' ? 'Monthly change (tCO₂e)' : 'Scope breakdown (tCO₂e)'}</h3>
          <div className="inline-flex items-center gap-0.5 rounded-full border border-[#E5E0EA] bg-white/65 p-0.5" role="group" aria-label="Choose monthly chart">
            <button type="button" aria-pressed={chartView === 'diverging'} onClick={() => setChartView('diverging')} className={`rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors ${chartView === 'diverging' ? 'bg-[#6428D8] text-white shadow-sm' : 'text-[#625B6B] hover:text-[#5625B8]'}`}>Monthly change</button>
            <button type="button" aria-pressed={chartView === 'connected'} onClick={() => setChartView('connected')} className={`rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors ${chartView === 'connected' ? 'bg-[#6428D8] text-white shadow-sm' : 'text-[#625B6B] hover:text-[#5625B8]'}`}>Scope breakdown</button>
          </div>
        </div>

        <div className="relative flex-1" aria-live="off">
          <AnimatePresence mode="wait" initial={false}>
            {chartView === 'diverging' ? <motion.div key="monthly-diverging" className="absolute inset-0" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>
              {selectedTooltip && activeMonth && <div role="tooltip" className="pointer-events-none absolute top-0 z-10 min-w-[190px] -translate-x-1/2 rounded-xl border border-[#E7E1EC] bg-white/95 px-3 py-2 shadow-[0_6px_18px_rgba(24,20,31,.12)] backdrop-blur-sm" style={{ left: selectedTooltip.left }}>
                <p className="mb-1 text-[11px] font-semibold text-[#292433]">{activeMonth.month} {data.year}</p>
                <p className="text-[10px] text-[#625B6B]">Current <span className="float-right font-data font-medium text-[#19171D]">{formatEmission(selectedTooltip.current)} tCO₂e</span></p>
                {selectedTooltip.previous !== null && <>
                  <p className="text-[10px] text-[#625B6B]">Previous <span className="float-right font-data text-[#19171D]">{formatEmission(selectedTooltip.previous)} tCO₂e</span></p>
                  <p className="text-[10px] text-[#625B6B]">Change <span className={`float-right font-data font-semibold ${(selectedTooltip.change ?? 0) > 0 ? 'text-[#B95A24]' : 'text-[#6242C7]'}`}>{(selectedTooltip.change ?? 0) > 0 ? '+' : ''}{formatEmission(selectedTooltip.change ?? 0)} tCO₂e</span></p>
                </>}
                <p className="mt-1 text-[9px] text-[#77717F]">Source: monthly emissions ledger</p>
              </div>}
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full overflow-visible" role="group" aria-label={`Monthly diverging capsule chart for ${data.year}; changes compare each month with the previous month`}>
                <defs>
                  <linearGradient id={`${patternId}-positive`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F58A42"/><stop offset="100%" stopColor="#FFD0A4"/></linearGradient>
                  <linearGradient id={`${patternId}-negative`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6945D9"/><stop offset="100%" stopColor="#B9A3F7"/></linearGradient>
                </defs>
                {ticks.filter((tick) => tick !== 0).map((tick) => <g key={tick}>
                  <line x1={plotLeft} x2={plotRight} y1={axisY(tick)} y2={axisY(tick)} stroke="#D7D2DC" strokeWidth="1" strokeDasharray="4 7" opacity=".75" />
                  <text x={plotLeft - 12} y={axisY(tick) + 4} textAnchor="end" fill="#85808D" fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight="400">{formatAxis(tick)}</text>
                </g>)}
                <line x1={plotLeft} x2={plotRight} y1={baseline} y2={baseline} stroke="#77717F" strokeWidth="1.5" />
                <text x={plotLeft - 12} y={baseline + 4} textAnchor="end" fill="#625B6B" fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight="500">0</text>
                {months.map((month, index) => {
                  const change = changes[index];
                  const capsuleHeight = change === null ? 0 : Math.abs(change) / axisMax * plotHalfHeight;
                  const x = xFor(index);
                  const focused = activeIndex === index;
                  const dimmed = selectedIndex !== null && selectedIndex !== index;
                  const hoverDim = hoveredIndex !== null && hoveredIndex !== index && selectedIndex === null;
                  return <g key={`${month.month}-${index}`} data-month-point tabIndex={0} role="button" aria-pressed={selectedIndex === index} aria-label={`${month.month} ${data.year}: current ${formatEmission(values[index])} tCO₂e${index > 0 ? `, previous ${formatEmission(values[index - 1])} tCO₂e, change ${change! > 0 ? '+' : ''}${formatEmission(change!)} tCO₂e` : ', no previous-month value available'}`} onFocus={() => setHoveredIndex(index)} onBlur={() => setHoveredIndex(null)} onMouseEnter={() => setHoveredIndex(index)} onClick={() => setSelectedIndex(selectedIndex === index ? null : index)} onKeyDown={(event) => onKeyDown(event, index)} className="group cursor-pointer outline-none">
                    {change !== null && <DivergingCapsule x={x} baseline={baseline} width={capsuleWidth} height={capsuleHeight} positive={change >= 0} positiveGradient={`${patternId}-positive`} negativeGradient={`${patternId}-negative`} visible={chartInView} playEntrance={playEntrance} delay={index * 0.025} opacity={dimmed ? 0.5 : hoverDim ? 0.72 : 1} reducedMotion={Boolean(reduceMotion)} />}
                    <rect x={x - cellWidth / 2} y={plotTop} width={cellWidth} height={chartHeight - plotTop - 32} fill="transparent" />
                    {change !== null && <rect x={x - capsuleWidth / 2 - 3} y={change >= 0 ? baseline - capsuleHeight - 3 : baseline - 3} width={capsuleWidth + 6} height={Math.max(capsuleHeight + 6, 12)} rx={Math.min((capsuleWidth + 6) / 2, (capsuleHeight + 6) / 2)} fill="none" stroke="transparent" strokeWidth="2" className="group-focus-visible:stroke-[#332B40]" />}
                    <text x={x} y={chartHeight - 8} textAnchor="middle" fill={focused ? '#5625B8' : '#77717F'} fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight={focused ? 500 : 400}>{month.month}</text>
                  </g>;
                })}
              </svg>
            </motion.div> : <motion.div key="monthly-connected" className="absolute inset-0" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>
              {selectedTooltip && activeMonth && <div role="tooltip" className="pointer-events-none absolute top-0 z-10 min-w-[190px] -translate-x-1/2 rounded-xl border border-[#E7E1EC] bg-white/95 px-3 py-2 shadow-[0_6px_18px_rgba(24,20,31,.12)] backdrop-blur-sm" style={{ left: selectedTooltip.left }}>
                <p className="mb-1 text-[11px] font-semibold text-[#292433]">{activeMonth.month} {data.year}</p>
                {displayedSeries.map((series) => <p key={series.id} className="text-[10px] text-[#625B6B]">{series.label}<span className="float-right font-data font-medium text-[#19171D]">{formatEmission(series.values[activeIndex!])} tCO₂e</span></p>)}
                <p className="mt-0.5 border-t border-[#EEE9F1] pt-0.5 text-[10px] font-medium text-[#302744]">Total<span className="float-right font-data">{formatEmission(values[activeIndex!])} tCO₂e</span></p>
                <p className="mt-1 text-[9px] text-[#77717F]">Source: monthly emissions ledger</p>
              </div>}
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full overflow-visible" role="group" aria-label={`Monthly connected stacked scope emissions for ${data.year}`}>
                {[0, 0.5, 1].map((ratio) => {
                  const y = plotTop + ratio * (baseline + plotHalfHeight - plotTop);
                  const value = stackedMax * (1 - ratio);
                  return <g key={ratio}>
                    <line x1={plotLeft} x2={plotRight} y1={y} y2={y} stroke="#D7D2DC" strokeWidth="1" strokeDasharray={ratio === 1 ? undefined : '4 7'} opacity=".72" />
                    <text x={plotLeft - 12} y={y + 4} textAnchor="end" fill="#85808D" fontFamily="IBM Plex Sans, sans-serif" fontSize="12">{value >= 1000 ? `${Math.round(value / 100) / 10}k` : Math.round(value).toLocaleString()}</text>
                  </g>;
                })}
                {stackedBands.map((band) => {
                  const connectedBottom = baseline + plotHalfHeight;
                  const connectedHeight = connectedBottom - plotTop;
                  const upperPoints = band.upper.map((value, index) => [xFor(index), connectedBottom - (value / stackedMax) * connectedHeight]);
                  const lowerPoints = band.lower.map((value, index) => [xFor(index), connectedBottom - (value / stackedMax) * connectedHeight]).reverse();
                  const path = `M ${upperPoints.map(([x, y]) => `${x} ${y}`).join(' L ')} L ${lowerPoints.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
                  return <path key={`area-${band.id}`} d={path} fill={band.color} fillOpacity=".1" stroke={band.color} strokeOpacity=".18" strokeWidth="1" />;
                })}
                {months.map((month, index) => {
                  let cumulative = 0;
                  const dimmed = selectedIndex !== null && selectedIndex !== index;
                  return <g key={`${month.month}-${index}`} data-month-point tabIndex={0} role="button" aria-pressed={selectedIndex === index} aria-label={`${month.month} ${data.year}: ${displayedSeries.map((series) => `${series.label} ${formatEmission(series.values[index])}`).join(', ')} tCO₂e`} onFocus={() => setHoveredIndex(index)} onBlur={() => setHoveredIndex(null)} onMouseEnter={() => setHoveredIndex(index)} onClick={() => setSelectedIndex(selectedIndex === index ? null : index)} onKeyDown={(event) => onKeyDown(event, index)} className="group cursor-pointer outline-none">
                    {displayedSeries.map((series, seriesIndex) => {
                      const value = series.values[index];
                      const connectedBottom = baseline + plotHalfHeight;
                      const connectedHeight = connectedBottom - plotTop;
                      const height = value / stackedMax * connectedHeight;
                      const y = connectedBottom - ((cumulative + value) / stackedMax) * connectedHeight;
                      cumulative += value;
                      return <motion.rect key={series.id} x={xFor(index) - Math.min(22, cellWidth * 0.27)} width={Math.min(44, cellWidth * 0.54)} rx="4" fill={series.color} initial={false} animate={{ y: chartInView ? y : baseline, height: chartInView ? height : 0, opacity: selectedIndex !== null && dimmed ? 0.5 : 1 }} transition={{ y: { duration: reduceMotion ? 0 : playEntrance ? 0.6 : 0.3, delay: reduceMotion || !playEntrance ? 0 : index * 0.025 + seriesIndex * 0.006, ease: [0.22, 1, 0.36, 1] }, height: { duration: reduceMotion ? 0 : playEntrance ? 0.6 : 0.3, delay: reduceMotion || !playEntrance ? 0 : index * 0.025 + seriesIndex * 0.006, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: reduceMotion ? 0 : 0.15 } }} />;
                    })}
                    <rect x={xFor(index) - cellWidth / 2} y={plotTop} width={cellWidth} height={chartHeight - plotTop - 32} fill="transparent" />
                    <text x={xFor(index)} y={chartHeight - 8} textAnchor="middle" fill={activeIndex === index ? '#5625B8' : '#77717F'} fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight={activeIndex === index ? 500 : 400}>{month.month}</text>
                  </g>;
                })}
              </svg>
            </motion.div>}
          </AnimatePresence>
        </div>

        <footer className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E0EA] pt-2 text-[10px]">
          <div className="flex items-center gap-4">
            {chartView === 'diverging' ? <>
              <span className="inline-flex items-center gap-1.5 text-[#615A68]"><i className="h-2.5 w-2.5 rounded-full bg-[#F58A42]" />Increase</span>
              <span className="inline-flex items-center gap-1.5 text-[#615A68]"><i className="h-2.5 w-2.5 rounded-full bg-[#6945D9]" />Decrease</span>
            </> : displayedSeries.map((series) => <span key={series.id} className="inline-flex items-center gap-1.5 text-[#615A68]"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />{series.label}</span>)}
          </div>
          <span className="text-[#77717F]">Source: monthly emissions ledger</span>
        </footer>
      </div>
    </section>
  );
};
