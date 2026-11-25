import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ChartNoAxesColumn, ChartPie, BarChart3, Target, Crosshair } from 'lucide-react';
import { YearEmissionsData, ScopeType } from '../types';

interface TotalEmissionsCardProps {
  data: YearEmissionsData;
  activeScope?: ScopeType;
  setActiveScope?: (scope: ScopeType) => void;
  onScopeInspect?: (scopeKey: string) => void;
  userName?: string;
}

function BenchmarkBar({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
  const ratio = Math.max(0, Math.min(1, value / Math.max(total, 1)));
  const valueHeight = 40 * ratio;
  return <svg viewBox="0 0 32 48" className="h-12 w-8 shrink-0" role="img" aria-label={`${label}: ${value.toLocaleString()} tCO₂e compared with current emissions of ${total.toLocaleString()} tCO₂e`}>
    <rect x="4" y="4" width="9" height="40" rx="4.5" fill={`${color}24`} />
    <rect x="19" y="4" width="9" height="40" rx="4.5" fill="#E6E2EA" />
    <rect x="4" y={44 - valueHeight} width="9" height={valueHeight} rx="4.5" fill={color} opacity=".9" />
    <rect x="19" y="4" width="9" height="40" rx="4.5" fill="#8A8491" opacity=".7" />
  </svg>;
}

export const TotalEmissionsCard: React.FC<TotalEmissionsCardProps> = ({
  data,
  activeScope = 'all',
  setActiveScope
}) => {
  const [selectedScope, setSelectedScope] = useState<ScopeType>(activeScope || 'all');
  const [hoveredScope, setHoveredScope] = useState<string | null>(null);
  const [compositionView, setCompositionView] = useState<'dots' | 'pie'>('dots');
  const reduceMotion = useReducedMotion();

  const handleScopeSelect = (scope: ScopeType) => {
    setSelectedScope(scope);
    if (setActiveScope) setActiveScope(scope);
  };

  const scope1 = data.scopes.scope1;
  const scope2 = data.scopes.scope2;
  const scope3 = data.scopes.scope3;

  let currentTotal = data.totalEmissions;

  if (selectedScope === 'scope1') {
    currentTotal = scope1.value;
  } else if (selectedScope === 'scope2') {
    currentTotal = scope2.value;
  } else if (selectedScope === 'scope3') {
    currentTotal = scope3.value;
  }

  const calculateMoMTrend = (scopeKey: 'all' | 'scope1' | 'scope2' | 'scope3') => {
    if (!data.monthly || data.monthly.length < 2) {
      return { diffPct: 3.2, isReduction: true };
    }
    const lastMonth = data.monthly[data.monthly.length - 1];
    const prevMonth = data.monthly[data.monthly.length - 2];

    const currentVal = scopeKey === 'all' ? lastMonth.total : lastMonth[scopeKey];
    const previousVal = scopeKey === 'all' ? prevMonth.total : prevMonth[scopeKey];

    if (!previousVal || previousVal === 0) {
      return { diffPct: 0, isReduction: true };
    }

    const diff = ((currentVal - previousVal) / previousVal) * 100;
    const isReduction = diff <= 0;
    return {
      diffPct: Math.abs(Number(diff.toFixed(1))),
      isReduction,
      rawDiff: diff
    };
  };

  const activeTrend = calculateMoMTrend(selectedScope);
  const scope1Trend = calculateMoMTrend('scope1');
  const scope2Trend = calculateMoMTrend('scope2');
  const scope3Trend = calculateMoMTrend('scope3');

  const formatK = (val: number) => {
    return (val / 1000).toFixed(1) + 'k';
  };

  const dotColumns = 22;
  const dotRows = 7;
  const dotsPerScope = dotColumns * dotRows;
  const scopeDotBands = [
    { key: 'scope1', metric: scope1, color: '#5625B8' },
    { key: 'scope2', metric: scope2, color: '#F46A1F' },
    { key: 'scope3', metric: scope3, color: '#2563EB' }
  ];

  const pieSegments = (() => {
    const total = scopeDotBands.reduce((sum, item) => sum + item.metric.value, 0) || 1;
    let angle = -Math.PI / 2;
    return scopeDotBands.map(({ key, metric, color }) => {
      const sweep = metric.value / total * Math.PI * 2;
      const gap = 0.035;
      const start = angle + gap / 2;
      const end = angle + sweep - gap / 2;
      const point = (a: number, radius: number) => [110 + radius * Math.cos(a), 90 + radius * Math.sin(a)];
      const [x1, y1] = point(start, 72);
      const [x2, y2] = point(end, 72);
      const [ix2, iy2] = point(end, 36);
      const [ix1, iy1] = point(start, 36);
      const large = sweep > Math.PI ? 1 : 0;
      const path = `M ${x1} ${y1} A 72 72 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A 36 36 0 ${large} 0 ${ix1} ${iy1} Z`;
      angle += sweep;
      return { key, metric, color, path };
    });
  })();

  return (
    <div className="glass-card-top p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between h-full">
      {/* 1. Header: Title, Status Badges, and Segmented Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0EA]">
          <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[20px] font-semibold text-[#15131A] tracking-tight leading-snug">
              Total CO₂e Emissions
            </h2>
            <span className="text-[11px] font-data font-semibold text-[#6E35DB] bg-[#F5EEFF] border border-[#E6D7FF] px-2 py-0.5 rounded-full">
              ISO 14064
            </span>
          </div>
          <p className="text-[12px] text-[#667085] font-normal mt-0.5">Gross emissions across Scopes 1, 2, and 3</p>
          </div>

        {/* Segmented Filter Control (8px radius, lavender track, deep violet active) */}
        <div className="flex items-center gap-0.5 p-1 bg-white/60 rounded-full border border-[#E5E0EA] text-[12px] self-start sm:self-auto overflow-x-auto max-w-full shadow-[0_2px_10px_rgba(43,26,68,.05)]">
          {[
            { id: 'all', label: 'Total' },
            { id: 'scope1', label: 'Scope 1' },
            { id: 'scope2', label: 'Scope 2' },
            { id: 'scope3', label: 'Scope 3' }
          ].map((tab) => {
            const isTabActive = selectedScope === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleScopeSelect(tab.id as ScopeType)}
                aria-pressed={isTabActive}
                className={`px-3 py-1.5 rounded-full text-[12px] transition-colors cursor-pointer whitespace-nowrap ${
                  isTabActive
                    ? 'bg-gradient-to-r from-[#7A32E9] to-[#5318D3] text-white font-semibold shadow-[0_3px_9px_rgba(97,40,208,.28)]'
                    : 'text-[#494454] hover:text-[#5625B8] hover:bg-[#F5F0FF] font-medium'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Visual Body: Scope dot matrix + metric breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 items-center my-auto py-3">
        {/* Left Column: Dot matrix showing the share contributed by each scope */}
        <div className="md:col-span-5 flex flex-col items-stretch justify-center relative">
          <div className="w-full px-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[32px] sm:text-[36px] font-semibold font-data tracking-[-0.04em] text-[#16132B] leading-none">{formatK(currentTotal)}</span>
              <span className="text-[13px] font-medium text-[#667085]">tCO₂e</span>
            </div>
            <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-data font-medium px-2 py-1 rounded-full border ${activeTrend.isReduction ? 'text-[#15803D] bg-[#E9FBEF] border-[#B7F0C8]' : 'text-[#B91C1C] bg-[#FEF0F0] border-[#FFD0D0]'}`}>
              {activeTrend.isReduction ? <ArrowDownRight className="w-3 h-3 text-[#15803D]" /> : <ArrowUpRight className="w-3 h-3 text-[#B91C1C]" />}
              {activeTrend.isReduction ? '-' : '+'}{activeTrend.diffPct}% from last month
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {compositionView === 'dots' ? <motion.div key="scope-dots" className="mt-2 space-y-1" role="group" aria-label={`Scope emissions composition: Scope 1 ${scope1.percentage} percent, Scope 2 ${scope2.percentage} percent, Scope 3 ${scope3.percentage} percent`} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
              <svg viewBox={`0 0 ${dotColumns * 13} ${dotRows * 15}`} className="w-full h-[118px]" role="img" aria-label={`Scope share dot matrix: Scope 1 ${scope1.percentage}%, Scope 2 ${scope2.percentage}%, Scope 3 ${scope3.percentage}%`}>
                {Array.from({ length: dotsPerScope }, (_, index) => {
                  const col = index % dotColumns;
                  const row = Math.floor(index / dotColumns);
                  const s1Dots = Math.round(scope1.percentage / 100 * dotsPerScope);
                  const s2Dots = Math.round(scope2.percentage / 100 * dotsPerScope);
                  const key = index < s1Dots ? 'scope1' : index < s1Dots + s2Dots ? 'scope2' : 'scope3';
                  const color = scopeDotBands.find((scope) => scope.key === key)?.color ?? '#2563EB';
                  const dimmed = selectedScope !== 'all' && selectedScope !== key;
                  const scopeStart = key === 'scope1' ? 0 : key === 'scope2' ? Math.round(scope1.percentage / 100 * dotsPerScope) : Math.round((scope1.percentage + scope2.percentage) / 100 * dotsPerScope);
                  const scopeCount = key === 'scope1' ? Math.round(scope1.percentage / 100 * dotsPerScope) : key === 'scope2' ? Math.round(scope2.percentage / 100 * dotsPerScope) : dotsPerScope - scopeStart;
                  const dotWithinScope = index - scopeStart;
                  const fade = Math.max(0.3, 1 - dotWithinScope / Math.max(scopeCount, 1) * 0.68);
                  return <motion.circle key={index} cx={6 + col * 13} cy={7 + row * 15} r="4.1" fill={color} opacity={dimmed ? 0.13 : fade} initial={reduceMotion ? false : { scale: .65, opacity: 0 }} animate={{ scale: 1, opacity: dimmed ? 0.13 : fade }} transition={{ duration: reduceMotion ? 0 : .2, delay: reduceMotion ? 0 : index * .0008 }} />;
                })}
              </svg>
              </motion.div> : <motion.div key="scope-pie" className="mt-1 flex justify-center" role="group" aria-label="Scope emissions pie chart" initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
                <svg viewBox="0 0 220 180" className="h-[145px] w-full max-w-[240px]" role="img" aria-label={`Scope composition: ${pieSegments.map(({ metric }) => `${metric.name} ${metric.percentage}%`).join(', ')}`}>
                  {pieSegments.map(({ key, metric, color, path }) => <path key={key} d={path} fill={color} opacity={hoveredScope ? hoveredScope === key ? 1 : 0.25 : selectedScope === 'all' || selectedScope === key ? 1 : 0.25} className="cursor-pointer transition-opacity duration-150" tabIndex={0} role="button" aria-label={`${metric.name}: ${metric.value.toLocaleString()} tCO₂e, ${metric.percentage}%`} onMouseEnter={() => setHoveredScope(key)} onMouseLeave={() => setHoveredScope(null)} onFocus={() => setHoveredScope(key)} onBlur={() => setHoveredScope(null)} onClick={() => handleScopeSelect(key as ScopeType)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleScopeSelect(key as ScopeType); } }} />)}
                  <text x="110" y="86" textAnchor="middle" fill="#15131A" fontSize="18" fontWeight="650">{formatK(data.totalEmissions)}</text>
                  <text x="110" y="103" textAnchor="middle" fill="#667085" fontSize="9">tCO₂e by scope</text>
                </svg>
              </motion.div>}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex justify-center" role="group" aria-label="Choose scope chart type">
            <div className="flex items-center gap-0.5 rounded-full border border-[#DED8E5] bg-[#F8F6FA] p-1">
              <button type="button" aria-pressed={compositionView === 'dots'} aria-label="Show dot matrix chart" onClick={() => setCompositionView('dots')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${compositionView === 'dots' ? 'bg-white text-[#5625B8] shadow-sm' : 'text-[#625B6B] hover:text-[#5625B8]'}`}><ChartNoAxesColumn className="w-3.5 h-3.5" />Dot-matrix</button>
              <button type="button" aria-pressed={compositionView === 'pie'} aria-label="Show pie chart" onClick={() => setCompositionView('pie')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${compositionView === 'pie' ? 'bg-white text-[#5625B8] shadow-sm' : 'text-[#625B6B] hover:text-[#5625B8]'}`}><ChartPie className="w-3.5 h-3.5" />Pie chart</button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Scope Breakdown */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-2 pl-0 md:pl-2">
          <div className="space-y-2">
            {/* Scope 1 Bar (Violet) */}
            <div
              onClick={() => handleScopeSelect('scope1')}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                selectedScope === 'scope1'
                  ? 'bg-[#F2EBFF] border-[#D9C7FF]'
                  : 'bg-[#FAF7FF]/85 hover:bg-[#F5EEFF] border-[#ECE4F7]'
              }`}
            >
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="text-[#15131A] font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5625B8]" />
                  Scope 1 Direct
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[#15131A] font-semibold text-[12px]">
                    {scope1.value.toLocaleString()} t ({scope1.percentage}%)
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 font-data text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${
                      scope1Trend.isReduction
                        ? 'text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]'
                        : 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
                    }`}
                  >
                    {scope1Trend.isReduction ? (
                      <ArrowDownRight className="w-2.5 h-2.5 text-[#15803D] stroke-[2.25]" />
                    ) : (
                      <ArrowUpRight className="w-2.5 h-2.5 text-[#B91C1C] stroke-[2.25]" />
                    )}
                    <span>{scope1Trend.isReduction ? '-' : '+'}{scope1Trend.diffPct}%</span>
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#EAE2F5] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${scope1.percentage}%`, backgroundColor: scope1.color }}
                />
              </div>
            </div>

            {/* Scope 2 Bar (Deep Orange) */}
            <div
              onClick={() => handleScopeSelect('scope2')}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                selectedScope === 'scope2'
                  ? 'bg-[#FFF0E5] border-[#FFD4B5]'
                  : 'bg-[#FFF8F2]/90 hover:bg-[#FFF3E9] border-[#F4E5D8]'
              }`}
            >
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="text-[#15131A] font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F46A1F]" />
                  Scope 2 Electricity &amp; Heat
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[#15131A] font-semibold text-[12px]">
                    {scope2.value.toLocaleString()} t ({scope2.percentage}%)
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 font-data text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${
                      scope2Trend.isReduction
                        ? 'text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]'
                        : 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
                    }`}
                  >
                    {scope2Trend.isReduction ? (
                      <ArrowDownRight className="w-2.5 h-2.5 text-[#15803D] stroke-[2.25]" />
                    ) : (
                      <ArrowUpRight className="w-2.5 h-2.5 text-[#B91C1C] stroke-[2.25]" />
                    )}
                    <span>{scope2Trend.isReduction ? '-' : '+'}{scope2Trend.diffPct}%</span>
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#F4E5D8] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${scope2.percentage}%`, backgroundColor: scope2.color }}
                />
              </div>
            </div>

            {/* Scope 3 Bar (Blue) */}
            <div
              onClick={() => handleScopeSelect('scope3')}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                selectedScope === 'scope3'
                  ? 'bg-[#EAF2FF] border-[#C6DCFF]'
                  : 'bg-[#F3F7FF]/90 hover:bg-[#EEF4FF] border-[#DFE9F7]'
              }`}
            >
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="text-[#15131A] font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  Scope 3 Value Chain
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[#15131A] font-semibold text-[12px]">
                    {scope3.value.toLocaleString()} t ({scope3.percentage}%)
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 font-data text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${
                      scope3Trend.isReduction
                        ? 'text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]'
                        : 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
                    }`}
                  >
                    {scope3Trend.isReduction ? (
                      <ArrowDownRight className="w-2.5 h-2.5 text-[#15803D] stroke-[2.25]" />
                    ) : (
                      <ArrowUpRight className="w-2.5 h-2.5 text-[#B91C1C] stroke-[2.25]" />
                    )}
                    <span>{scope3Trend.isReduction ? '-' : '+'}{scope3Trend.diffPct}%</span>
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#DFE9F7] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${scope3.percentage}%`, backgroundColor: scope3.color }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Comparative Trajectory Benchmarks */}
      <div className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-[#E5E0EA] text-[12px]">
        <div className="min-w-0 p-3 rounded-2xl bg-gradient-to-br from-white/80 to-[#F7F1FF]/80 border border-[#E8DFF4] flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 shrink-0 text-[#7E35E8]" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-[#667085] font-medium truncate">Prev year ({data.year - 1})</div>
            <div className="font-semibold text-[#15131A] font-data text-[15px] mt-0.5">{formatK(data.previousYear)}</div>
            <div className="inline-flex items-center gap-1 text-[10px] font-medium font-data text-[#15803D] bg-[#E9FBEF] border border-[#B7F0C8] rounded-full px-1.5 py-0.5 mt-1"><ArrowUpRight className="w-3 h-3 shrink-0" /><span className="truncate">+{data.previousYearPct}% YoY</span></div>
          </div>
          <BenchmarkBar value={data.previousYear} total={data.totalEmissions} color="#9A63E9" label="Previous year" />
        </div>

        <div className="min-w-0 p-3 rounded-2xl bg-gradient-to-br from-white/80 to-[#FFF2F7]/80 border border-[#F0DEE9] flex items-center gap-2.5">
          <Target className="w-4 h-4 shrink-0 text-[#B45BF0]" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-[#667085] font-medium truncate">Baseline (2012)</div>
            <div className="font-semibold text-[#15131A] font-data text-[15px] mt-0.5">{formatK(data.baselineYear)}</div>
            <div className="inline-flex items-center gap-1 text-[10px] font-medium font-data text-[#B91C1C] bg-[#FEF0F0] border border-[#FFD0D0] rounded-full px-1.5 py-0.5 mt-1"><ArrowUpRight className="w-3 h-3 shrink-0" /><span className="truncate">+{data.baselineYearPct}%</span></div>
          </div>
          <BenchmarkBar value={data.baselineYear} total={data.totalEmissions} color="#E97EA7" label="Baseline" />
        </div>

        <div className="min-w-0 p-3 rounded-2xl bg-gradient-to-br from-white/80 to-[#FFF8E9]/85 border border-[#F2E6CF] flex items-center gap-2.5">
          <Crosshair className="w-4 h-4 shrink-0 text-[#F0A900]" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-[#667085] font-medium truncate">Targeted deviation</div>
            <div className="font-semibold text-[#15131A] font-data text-[15px] mt-0.5">{formatK(data.deviationFromTarget)}</div>
            <div className="inline-flex items-center gap-1 text-[10px] font-medium font-data text-[#A65B00] bg-[#FFF6E4] border border-[#F9DDA4] rounded-full px-1.5 py-0.5 mt-1"><ArrowUpRight className="w-3 h-3 shrink-0" /><span className="truncate">+{data.deviationPct}%</span></div>
          </div>
          <BenchmarkBar value={data.deviationFromTarget} total={data.totalEmissions} color="#E8AE20" label="Target deviation" />
        </div>
      </div>
    </div>
  );
};
