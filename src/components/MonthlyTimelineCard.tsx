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

type Geometry = 'solid' | 'stripes' | 'compare' | 'trend';
type PeriodWindow = 'six-months' | 'full-year';

const geometries: { id: Geometry; label: string }[] = [
  { id: 'trend', label: 'Trend' },
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
  const [periodWindow, setPeriodWindow] = useState<PeriodWindow>('six-months');

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
    (localS2Method !== null ? 1 : 0) +
    (periodWindow !== 'six-months' ? 1 : 0);

  const resetLocalFilters = () => {
    setLocalYear(null);
    setLocalScope(null);
    setLocalGranularity(null);
    setLocalOrgId(null);
    setLocalS2Method(null);
    setPeriodWindow('six-months');
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

  const allPeriods = useMemo(() => aggregatePeriods(primaryRecord.monthly), [primaryRecord.monthly, effectiveGranularity]);
  const allComparePeriods = useMemo(() => aggregatePeriods(compareRecord.monthly), [compareRecord.monthly, effectiveGranularity]);
  const periods = useMemo(() => effectiveGranularity === 'monthly' && periodWindow === 'six-months' ? allPeriods.slice(-6) : allPeriods, [allPeriods, effectiveGranularity, periodWindow]);
  const comparePeriods = useMemo(() => effectiveGranularity === 'monthly' && periodWindow === 'six-months' ? allComparePeriods.slice(-6) : allComparePeriods, [allComparePeriods, effectiveGranularity, periodWindow]);

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
  const trendPoints = periods.map((period, index) => ({ x: xFor(index), y: yFor(values[index]), period }));
  const trendLine = trendPoints.length
    ? `M ${trendPoints[0].x} ${trendPoints[0].y}` + trendPoints.slice(1).map((point, index) => {
        const previous = trendPoints[index];
        const middleX = (previous.x + point.x) / 2;
        return ` C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
      }).join('')
    : '';
  const trendArea = trendPoints.length
    ? `${trendLine} L ${trendPoints[trendPoints.length - 1].x} ${plotBottom} L ${trendPoints[0].x} ${plotBottom} Z`
    : '';

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

  useEffect(() => {
    setCompareYear(data.year === 2022 ? 2023 : data.year - 1);
  }, [data.year]);

  useEffect(() => {
    setHoveredIndex(null);
    setSelectedIndex(null);
    setFocusIndex(0);
  }, [periodWindow, effectiveYear, effectiveScope, effectiveGranularity, effectiveOrgId, effectiveS2Method]);

  return (
    <section className="glass-card-top relative flex h-full flex-col overflow-visible p-3 sm:p-4 xl:p-3" aria-labelledby="monthly-emissions-title">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="monthly-emissions-title" className="text-[17px] xl:text-[16px] font-semibold leading-snug tracking-tight text-[#15131A]">
            {geometry === 'trend' ? 'Emissions trend' : `${effectiveGranularity === 'quarterly' ? 'Quarterly' : 'Monthly'} emissions`}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Card-level query filters */}
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

                  {effectiveGranularity === 'monthly' && <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#85808D]">Timeline</label>
                    <div className="inline-flex items-center rounded-lg border border-[#D8D2DF] bg-[#F3F0F6] p-0.5" role="group" aria-label="Timeline period">
                      {([
                        { value: 'six-months', label: 'Last 6 months' },
                        { value: 'full-year', label: 'Full year' }
                      ] as { value: PeriodWindow; label: string }[]).map((option) => <button
                        key={option.value}
                        type="button"
                        aria-pressed={periodWindow === option.value}
                        onClick={() => setPeriodWindow(option.value)}
                        className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${periodWindow === option.value ? 'bg-white text-[#5625B8] shadow-sm' : 'text-[#667085] hover:text-[#15131A]'}`}
                      >{option.label}</button>)}
                    </div>
                  </div>}

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

      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-2 border-b border-[#E5E0EA] pb-2.5">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-data text-[28px] xl:text-[26px] font-semibold leading-none tracking-[-0.04em] text-[#15131A]">{formatEmission(total)}</span>
            <span className="text-[13px] font-medium text-[#667085]">tCO₂e</span>
            <span className={`ml-1 rounded-full border px-2 py-0.5 font-data text-[10px] font-semibold ${getDeltaBadgeClass(customDeltaPct)}`}>{formatSignedPct(customDeltaPct)} vs FY {compareYear}</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#667085]">{periods.length ? `${periods[0].month} – ${periods[periods.length - 1].month}` : 'No reporting period'}</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <span className="text-[10px] font-medium text-[#667085]">Chart view</span>
          <div role="group" aria-label="Chart geometry" className="inline-flex items-center gap-0.5 rounded-lg border border-[#D8D2DF] bg-[#EEEAF5] p-0.5">
          {geometries.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={geometry === option.id}
              onClick={() => setGeometry(option.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                geometry === option.id ? 'bg-[#5625B8] text-white shadow-sm' : 'text-[#625B6B] hover:text-[#15131A]'
              }`}
            >
              {option.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div ref={chartRef} className="relative mt-2 flex-1 min-h-[210px] xl:min-h-[190px]" onMouseLeave={() => setHoveredIndex(null)}>
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
                  <linearGradient id={`${chartId}-area`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7657DF" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#7657DF" stopOpacity="0.015" />
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

                {geometry === 'trend' && trendPoints.length > 0 && <>
                  <motion.path d={trendArea} fill={`url(#${chartId}-area)`} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: chartInView ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.5 }} />
                  <motion.path d={trendLine} fill="none" stroke="#7657DF" strokeWidth="3.5" strokeLinecap="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: chartInView ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }} />
                </>}

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

                      {geometry === 'trend' && <>
                        {active && <line x1={x} x2={x} y1={plotTop} y2={plotBottom} stroke="#7657DF" strokeOpacity="0.32" strokeDasharray="4 5" pointerEvents="none" />}
                        <circle cx={x} cy={y} r={active ? 7 : 3.5} fill="#7657DF" stroke="#FFFFFF" strokeWidth={active ? 2.5 : 0} pointerEvents="none" />
                      </>}

                      <rect x={x - cellWidth / 2} y={plotTop} width={cellWidth} height={plotBottom - plotTop + 40} fill="transparent" />
                      {active && geometry !== 'trend' && (
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
      {geometry !== 'compare' && <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E0EA] pt-2.5 text-[11px] text-[#667085]">
        <span className="inline-flex items-center gap-2"><i aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${geometry === 'trend' ? 'bg-[#7657DF]' : 'bg-[#5625B8]'}`} />{effectiveScope === 'all' ? 'Total emissions' : `Scope ${effectiveScope.slice(-1)} emissions`}</span>
        <span className="truncate max-w-[48%]">{selectedIndex !== null ? `${periods[selectedIndex]?.month} · ${formatEmission(values[selectedIndex])} tCO₂e` : `${orgName} · Avg ${formatEmission(total / Math.max(periods.length, 1))} tCO₂e`}</span>
      </footer>}
    </section>
  );
};
