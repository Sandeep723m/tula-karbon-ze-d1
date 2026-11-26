import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { GranularityType, MonthlyEmissions, Scope2Method, ScopeType, YearEmissionsData } from '../types';
import { EMISSIONS_DATA } from '../data/emissionsData';
import { applyGlobalFiltersToYearData, ORG_HIERARCHY } from '../data/intelligenceData';
import { OrgHierarchyTree } from './OrgHierarchyTree';
import { StripedBarChart } from './charts/AnalyticsCharts';
import { formatSignedPct, getDeltaBadgeClass } from '../utils/analytics';

interface MonthlyTimelineCardProps {
  data: YearEmissionsData;
  granularity?: GranularityType;
  activeScope?: ScopeType;
  selectedOrgId?: string;
  scope2Method?: Scope2Method;
}

type Geometry = 'solid' | 'stripes' | 'compare';

const geometries: { id: Geometry; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'compare', label: 'Compare' }
];

const AVAILABLE_YEARS = [2025, 2024, 2023, 2022];

const formatEmission = (value: number) => Math.round(value).toLocaleString();

function axisLabel(value: number) {
  if (!value) return '0';
  if (value >= 1000) return `${Number((value / 1000).toFixed(1))}k`;
  return Math.round(value).toLocaleString();
}

function axisMaximum(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((candidate) => candidate >= normalized) ?? 10;
  return step * magnitude;
}

export const MonthlyTimelineCard: React.FC<MonthlyTimelineCardProps> = ({
  data,
  granularity = 'monthly',
  activeScope = 'all',
  selectedOrgId = 'org-global',
  scope2Method = 'location'
}) => {
  const [geometry, setGeometry] = useState<Geometry>('solid');
  const [filterOpen, setFilterOpen] = useState(false);

  // Card-level universal query overrides (synced initially with global, overrideable independently)
  const [localYear, setLocalYear] = useState<number | null>(null);
  const [compareYear, setCompareYear] = useState<number>(data.year === 2022 ? 2023 : data.year - 1);
  const [localScope, setLocalScope] = useState<ScopeType | null>(null);
  const [localGranularity, setLocalGranularity] = useState<GranularityType | null>(null);
  const [localOrgId, setLocalOrgId] = useState<string | null>(null);
  const [localS2Method, setLocalS2Method] = useState<Scope2Method | null>(null);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, amount: 0.18 });
  const hasEntered = useRef(false);
  const chartId = `monthly-emissions-${useId().replace(/:/g, '')}`;

  const effectiveYear = localYear ?? data.year;
  const effectiveScope = localScope ?? activeScope;
  const effectiveGranularity = localGranularity ?? granularity;
  const effectiveOrgId = localOrgId ?? selectedOrgId;
  const effectiveS2Method = localS2Method ?? scope2Method;

  const overrideCount =
    (localYear !== null ? 1 : 0) +
    (localScope !== null ? 1 : 0) +
    (localGranularity !== null ? 1 : 0) +
    (localOrgId !== null ? 1 : 0) +
    (localS2Method !== null ? 1 : 0);

  const resetLocalFilters = () => {
    setLocalYear(null);
    setLocalScope(null);
    setLocalGranularity(null);
    setLocalOrgId(null);
    setLocalS2Method(null);
    setCompareYear(data.year === 2022 ? 2023 : data.year - 1);
  };

  const resolveYearRecord = (yr: number): YearEmissionsData => {
    const raw = EMISSIONS_DATA[yr] || data;
    return applyGlobalFiltersToYearData(raw, {
      orgId: effectiveOrgId,
      year: yr,
      scope: effectiveScope,
      granularity: effectiveGranularity,
      comparison: 'prev_year',
      scope2Method: effectiveS2Method,
      ghgType: 'all',
      dataStatus: 'all',
      calcMethod: 'all',
      targetScenario: 'current'
    });
  };

  const primaryRecord = useMemo(
    () => (overrideCount === 0 && effectiveYear === data.year ? data : resolveYearRecord(effectiveYear)),
    [overrideCount, effectiveYear, data, effectiveOrgId, effectiveScope, effectiveGranularity, effectiveS2Method]
  );

  const compareRecord = useMemo(
    () => resolveYearRecord(compareYear),
    [compareYear, effectiveOrgId, effectiveScope, effectiveGranularity, effectiveS2Method]
  );

  const aggregatePeriods = (monthly: MonthlyEmissions[]): MonthlyEmissions[] => {
    if (effectiveGranularity === 'monthly') return monthly;
    return [0, 1, 2, 3].map((q) => {
      const slice = monthly.slice(q * 3, q * 3 + 3);
      return {
        month: `Q${q + 1}`,
        scope1: slice.reduce((s, m) => s + m.scope1, 0),
        scope2: slice.reduce((s, m) => s + m.scope2, 0),
        scope3: slice.reduce((s, m) => s + m.scope3, 0),
        total: slice.reduce((s, m) => s + m.total, 0)
      };
    });
  };

  const periods = useMemo(() => aggregatePeriods(primaryRecord.monthly), [primaryRecord.monthly, effectiveGranularity]);
  const comparePeriods = useMemo(() => aggregatePeriods(compareRecord.monthly), [compareRecord.monthly, effectiveGranularity]);

  const pickValue = (m: MonthlyEmissions) =>
    effectiveScope === 'scope1' ? m.scope1 : effectiveScope === 'scope2' ? m.scope2 : effectiveScope === 'scope3' ? m.scope3 : m.total;

  const values = periods.map(pickValue);
  const compareValues = comparePeriods.map(pickValue);
  const total = values.reduce((s, v) => s + v, 0);
  const compareTotal = compareValues.reduce((s, v) => s + v, 0);
  const customDeltaPct = Number((((total - compareTotal) / Math.max(compareTotal, 1)) * 100).toFixed(1));

  const maxValue = Math.max(0, ...values);
  const maxAxis = axisMaximum(maxValue);
  const activeIndex = hoveredIndex ?? selectedIndex;
  const activeMonth = activeIndex === null ? null : periods[activeIndex];
  const totalChange = (index: number) => (index > 0 ? values[index] - values[index - 1] : null);

  const chartWidth = 1000;
  const chartHeight = 320;
  const plotLeft = 74;
  const plotRight = 990;
  const plotTop = 20;
  const plotBottom = 256;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const cellWidth = plotWidth / Math.max(periods.length, 1);
  const barWidth = Math.min(64, cellWidth * 0.62);
  const xFor = (index: number) => plotLeft + (index + 0.5) * cellWidth;
  const yFor = (value: number) => plotBottom - (value / maxAxis) * plotHeight;
  const ticks = Array.from({ length: 5 }, (_, index) => maxAxis * (1 - index / 4));

  const activeTooltip =
    activeIndex !== null && activeMonth
      ? {
          left: `${Math.max(14, Math.min(86, (xFor(activeIndex) / chartWidth) * 100))}%`,
          current: values[activeIndex],
          compareVal: compareValues[activeIndex] ?? 0,
          previous: activeIndex > 0 ? values[activeIndex - 1] : null,
          change: totalChange(activeIndex)
        }
      : null;

  useEffect(() => {
    if (chartInView) hasEntered.current = true;
  }, [chartInView]);

  const playEntrance = chartInView && !hasEntered.current;
  const opacityFor = (index: number) => {
    if (selectedIndex !== null) return selectedIndex === index ? 1 : 0.5;
    if (hoveredIndex !== null) return hoveredIndex === index ? 1 : 0.56;
    return 1;
  };

  const handlePointKeyDown = (event: React.KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + periods.length) % periods.length;
      setFocusIndex(next);
      event.currentTarget.parentElement?.querySelectorAll<SVGGElement>('[data-month-point]')[next]?.focus();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedIndex((current) => (current === index ? null : index));
    }
    if (event.key === 'Escape') {
      setHoveredIndex(null);
      setSelectedIndex(null);
    }
  };

  const toggleSelected = (index: number) => setSelectedIndex((current) => (current === index ? null : index));

  const compareSeries = [
    {
      id: `yr-${compareYear}`,
      label: `FY ${compareYear}`,
      color: '#AC96F2',
      values: compareValues,
      pattern: 'stripe' as const
    },
    {
      id: `yr-${effectiveYear}`,
      label: `FY ${effectiveYear}`,
      color: '#5625B8',
      values,
      pattern: 'solid' as const
    }
  ];

  const orgName = ORG_HIERARCHY.find((o) => o.id === effectiveOrgId)?.name ?? 'Global';

  return (
    <section className="glass-card-top relative flex h-full flex-col overflow-visible p-4 sm:p-5" aria-labelledby="monthly-emissions-title">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E0EA]">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 id="monthly-emissions-title" className="text-[19px] font-semibold leading-snug tracking-tight text-[#15131A]">
            {effectiveGranularity === 'quarterly' ? 'Quarterly' : 'Monthly'} Emissions
          </h2>
          <span className="font-data text-[11px] font-medium text-[#5625B8] bg-[#F1EDFF] px-2 py-0.5 rounded-full">
            FY {effectiveYear} vs {compareYear}
          </span>
          <span className={`font-data text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDeltaBadgeClass(customDeltaPct)}`}>
            {formatSignedPct(customDeltaPct)}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-data text-[24px] font-semibold leading-none tracking-[-0.03em] text-[#16132B]">
              {formatEmission(total)}
            </span>
            <span className="text-[11px] font-medium text-[#667085]">tCO₂e</span>
          </div>

          {/* Universal Query Filter Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              aria-label="Filter monthly and custom year comparison"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                filterOpen || overrideCount > 0
                  ? 'bg-[#F1EDFF] border-[#5625B8]/40 text-[#5625B8]'
                  : 'bg-white/85 border-[#D8D2DF] text-[#15131A] hover:border-[#5625B8]/40'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {overrideCount > 0 && (
                <span className="font-data text-[10px] bg-[#5625B8] text-white px-1.5 rounded-full">{overrideCount}</span>
              )}
            </button>

            {filterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 max-h-[430px] overflow-y-auto rounded-2xl border border-[#D8D2DF] bg-white p-3.5 shadow-[0_14px_36px_rgba(21,19,26,0.16)] z-40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EEEAF5]">
                    <span className="text-[12px] font-semibold text-[#15131A]">Custom Comparison Query</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={resetLocalFilters}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#667085] hover:text-[#5625B8] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterOpen(false)}
                        className="p-1 rounded-md text-[#85808D] hover:bg-[#EEEAF5] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Custom Years Comparison */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#85808D] mb-1">
                        Primary Year
                      </label>
                      <select
                        value={effectiveYear}
                        onChange={(e) => setLocalYear(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#D8D2DF] bg-[#F7F5F2] px-2.5 py-1.5 font-data text-[12px] font-medium text-[#15131A]"
                      >
                        {AVAILABLE_YEARS.map((y) => (
                          <option key={y} value={y}>
                            FY {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#85808D] mb-1">
                        Compare Year
                      </label>
                      <select
                        value={compareYear}
                        onChange={(e) => {
                          setCompareYear(Number(e.target.value));
                          setGeometry('compare');
                        }}
                        className="w-full rounded-lg border border-[#D8D2DF] bg-[#F1EDFF] px-2.5 py-1.5 font-data text-[12px] font-medium text-[#5625B8]"
                      >
                        {AVAILABLE_YEARS.map((y) => (
                          <option key={y} value={y}>
                            FY {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scope */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#85808D] mb-1">
                      Scope
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'scope1', label: 'S1' },
                          { id: 'scope2', label: 'S2' },
                          { id: 'scope3', label: 'S3' }
                        ] as const
                      ).map((sc) => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setLocalScope(sc.id)}
                          className={`py-1 rounded-md text-[11px] font-medium cursor-pointer ${
                            effectiveScope === sc.id ? 'bg-[#5625B8] text-white' : 'bg-[#F7F5F2] text-[#494454] hover:bg-[#EEEAF5]'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Granularity & Scope 2 Method */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#85808D] mb-1">
                        Granularity
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {(['monthly', 'quarterly'] as GranularityType[]).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setLocalGranularity(g)}
                            className={`py-1 rounded-md text-[10px] capitalize font-medium cursor-pointer ${
                              effectiveGranularity === g ? 'bg-[#5625B8] text-white' : 'bg-[#F7F5F2] text-[#494454]'
                            }`}
                          >
                            {g === 'monthly' ? 'Mo' : 'Qtr'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#85808D] mb-1">
                        S2 Method
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {(['location', 'market'] as Scope2Method[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setLocalS2Method(m)}
                            className={`py-1 rounded-md text-[10px] capitalize font-medium cursor-pointer ${
                              effectiveS2Method === m ? 'bg-[#F46A1F] text-white' : 'bg-[#F7F5F2] text-[#494454]'
                            }`}
                          >
                            {m === 'location' ? 'Loc' : 'Mkt'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Organisation & Sub-levels */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#85808D] mb-1">
                      Organisation &amp; Sub-levels
                    </label>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-[#EEEAF5] p-1.5">
                      <OrgHierarchyTree selectedOrgId={effectiveOrgId} onSelect={(id) => setLocalOrgId(id)} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Chart geometry" className="inline-flex items-center gap-0.5 rounded-lg border border-[#D8D2DF] bg-[#EEEAF5] p-0.5">
          {geometries.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={geometry === option.id}
              onClick={() => setGeometry(option.id)}
              className={`rounded-md px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                geometry === option.id ? 'bg-[#5625B8] text-white shadow-sm' : 'text-[#625B6B] hover:text-[#15131A]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 font-data text-[11px] text-[#667085]">
          <span className="truncate max-w-[140px]">{orgName}</span>
          <span>·</span>
          <span>
            {selectedIndex !== null
              ? `${periods[selectedIndex]?.month} · ${formatEmission(values[selectedIndex])} t`
              : `Avg ${formatEmission(total / Math.max(periods.length, 1))} t`}
          </span>
        </div>
      </div>

      <div ref={chartRef} className="relative mt-3 flex-1 min-h-[225px]" onMouseLeave={() => setHoveredIndex(null)}>
        {geometry === 'compare' ? (
          <StripedBarChart labels={periods.map((p) => p.month)} series={compareSeries} unit="tCO₂e" height={200} />
        ) : (
          <>
            {activeTooltip && activeMonth && (
              <div
                role="tooltip"
                className="pointer-events-none absolute top-1 z-10 min-w-[195px] -translate-x-1/2 rounded-xl border border-[#E4DFEF] bg-white/95 px-3 py-2 shadow-[0_5px_16px_rgba(29,20,54,.12)] backdrop-blur-md"
                style={{ left: activeTooltip.left }}
              >
                <p className="mb-1 text-[11px] font-semibold text-[#282431]">
                  {activeMonth.month} · FY {effectiveYear}
                </p>
                <p className="text-[10px] text-[#686473]">
                  FY {effectiveYear} <span className="float-right font-data font-semibold text-[#26232F]">{formatEmission(activeTooltip.current)} t</span>
                </p>
                <p className="text-[10px] text-[#686473]">
                  FY {compareYear} <span className="float-right font-data text-[#5625B8]">{formatEmission(activeTooltip.compareVal)} t</span>
                </p>
                {activeTooltip.previous !== null && (
                  <p className="text-[10px] text-[#686473] mt-0.5 pt-0.5 border-t border-[#F1EEF6]">
                    MoM{' '}
                    <span className={`float-right font-data font-semibold ${(activeTooltip.change ?? 0) > 0 ? 'text-[#B95A24]' : 'text-[#15803D]'}`}>
                      {(activeTooltip.change ?? 0) > 0 ? '+' : ''}
                      {formatEmission(activeTooltip.change ?? 0)} t
                    </span>
                  </p>
                )}
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.svg
                key={`${geometry}-${effectiveGranularity}-${effectiveYear}`}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-full w-full overflow-visible"
                role="group"
                aria-label={`${effectiveGranularity} emissions in ${geometry} geometry for ${effectiveYear}`}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <defs>
                  <linearGradient id={`${chartId}-bar`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8A6BE8" />
                    <stop offset="100%" stopColor="#D7C9FA" />
                  </linearGradient>
                </defs>

                {ticks.map((tick) => {
                  const y = yFor(tick);
                  return (
                    <g key={`tick-${tick}`}>
                      <line x1={plotLeft} x2={plotRight} y1={y} y2={y} stroke="#DDD9E6" strokeWidth="1" strokeDasharray="4 6" />
                      <text x={plotLeft - 12} y={y + 5} textAnchor="end" fill="#667085" fontFamily="IBM Plex Mono, monospace" fontSize="14">
                        {axisLabel(tick)}
                      </text>
                    </g>
                  );
                })}

                {periods.map((month, index) => {
                  const value = values[index];
                  const x = xFor(index);
                  const y = yFor(value);
                  const height = Math.max(0, plotBottom - y);
                  const opacity = opacityFor(index);
                  const active = activeIndex === index;
                  const delay = reduceMotion || !playEntrance ? 0 : index * 0.025;

                  return (
                    <g
                      key={`${month.month}-${index}`}
                      data-month-point
                      tabIndex={index === focusIndex ? 0 : -1}
                      role="button"
                      aria-pressed={selectedIndex === index}
                      aria-label={`${month.month} ${effectiveYear}: ${formatEmission(value)} tCO₂e`}
                      onFocus={() => {
                        setFocusIndex(index);
                        setHoveredIndex(index);
                      }}
                      onBlur={() => setHoveredIndex(null)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onClick={() => toggleSelected(index)}
                      onKeyDown={(event) => handlePointKeyDown(event, index)}
                      className="cursor-pointer outline-none"
                    >
                      {geometry === 'solid' && (
                        <motion.rect
                          x={x - barWidth / 2}
                          width={barWidth}
                          rx="10"
                          fill={`url(#${chartId}-bar)`}
                          initial={reduceMotion ? false : { y: plotBottom, height: 0, opacity: 0 }}
                          animate={{ y: chartInView ? y : plotBottom, height: chartInView ? height : 0, opacity: chartInView ? opacity : 0 }}
                          transition={{
                            y: { duration: reduceMotion ? 0 : 0.55, delay, ease: [0.22, 1, 0.36, 1] },
                            height: { duration: reduceMotion ? 0 : 0.55, delay, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: reduceMotion ? 0 : 0.15 }
                          }}
                        />
                      )}

                      {geometry === 'stripes' && (
                        <g style={{ opacity, transition: 'opacity 150ms ease' }}>
                          <rect x={x - barWidth / 2} y={y} width={barWidth} height={height} rx="9" fill="#F0EBFA" />
                          {Array.from({ length: 14 }, (_, stripeIndex) => {
                            const stripeWidth = 2.7;
                            const slot = barWidth / 14;
                            const stripeX = x - barWidth / 2 + stripeIndex * slot + (slot - stripeWidth) / 2;
                            return (
                              <rect
                                key={stripeIndex}
                                x={stripeX}
                                y={y}
                                width={stripeWidth}
                                height={height}
                                rx={stripeWidth / 2}
                                fill={`url(#${chartId}-bar)`}
                              />
                            );
                          })}
                        </g>
                      )}

                      <rect x={x - cellWidth / 2} y={plotTop} width={cellWidth} height={plotBottom - plotTop + 40} fill="transparent" />
                      {active && (
                        <rect
                          x={x - barWidth / 2 - 4}
                          y={Math.max(plotTop, y - 4)}
                          width={barWidth + 8}
                          height={Math.max(height + 8, 16)}
                          rx="12"
                          fill="none"
                          stroke="#6C4ADD"
                          strokeWidth="2"
                          className="pointer-events-none"
                        />
                      )}
                      <text
                        x={x}
                        y={plotBottom + 28}
                        textAnchor="middle"
                        fill={active ? '#5625B8' : '#667085'}
                        fontFamily="IBM Plex Sans, sans-serif"
                        fontSize="14"
                        fontWeight={active ? 600 : 400}
                      >
                        {month.month}
                      </text>
                    </g>
                  );
                })}
              </motion.svg>
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
};
