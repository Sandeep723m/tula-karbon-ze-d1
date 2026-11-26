import React, { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Grid2X2, PieChart } from 'lucide-react';
import { YearEmissionsData, ScopeType } from '../types';

interface TotalEmissionsCardProps {
  data: YearEmissionsData;
  activeScope?: ScopeType;
  setActiveScope?: (scope: ScopeType) => void;
  onScopeInspect?: (scopeKey: string) => void;
  userName?: string;
}

function donutSectorPath(startAngle: number, endAngle: number, outerRadius = 100, innerRadius = 66) {
  const point = (radius: number, angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return { x: 110 + radius * Math.cos(radians), y: 110 + radius * Math.sin(radians) };
  };
  const startOuter = point(outerRadius, startAngle);
  const endOuter = point(outerRadius, endAngle);
  const endInner = point(innerRadius, endAngle);
  const startInner = point(innerRadius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${startOuter.x} ${startOuter.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y} L ${endInner.x} ${endInner.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner.x} ${startInner.y} Z`;
}

export const TotalEmissionsCard: React.FC<TotalEmissionsCardProps> = ({
  data,
  activeScope = 'all',
  setActiveScope
}) => {
  const [hoveredScope, setHoveredScope] = useState<string | null>(null);
  const [visualMode, setVisualMode] = useState<'dots' | 'pie'>('dots');
  const reduceMotion = useReducedMotion();
  const donutGradientPrefix = `emissions-donut-${useId().replace(/:/g, '')}`;

  const selectedScope = activeScope;

  const handleScopeSelect = (scope: ScopeType) => {
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
  const formatK = (val: number) => {
    return (val / 1000).toFixed(1) + 'k';
  };

  const scopeDotBands = [
    { key: 'scope1', metric: scope1, color: '#5625B8', remainder: '#E9E0F8' },
    { key: 'scope2', metric: scope2, color: '#F46A1F', remainder: '#FCE6D9' },
    { key: 'scope3', metric: scope3, color: '#2563EB', remainder: '#DFEAFE' }
  ];
  const dotsPerBar = 5;
  const dotRows = 10;
  const dotPitchX = 18;
  const dotPitchY = 14;
  const barGap = 24;
  const barWidth = dotsPerBar * dotPitchX;
  const matrixWidth = scopeDotBands.length * barWidth + (scopeDotBands.length - 1) * barGap;
  const matrixHeight = dotRows * dotPitchY;
  const totalScopeValue = scopeDotBands.reduce((sum, scope) => sum + scope.metric.value, 0) || 1;
  let currentAngle = -90;
  const donutSegments = scopeDotBands.map((scope) => {
    const share = (scope.metric.value / totalScopeValue) * 100;
    const sweep = share * 3.6;
    const gap = 1.5;
    const startAngle = currentAngle + gap / 2;
    const endAngle = currentAngle + sweep - gap / 2;
    const segment = {
      ...scope,
      share,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2,
      path: donutSectorPath(startAngle, endAngle)
    };
    currentAngle += sweep;
    return segment;
  });

  return (
    <div className="glass-card-top p-3 sm:p-4 xl:p-3 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header and scope filter */}
      <div className="flex flex-col items-start justify-between gap-2 pb-2.5 border-b border-[#E5E0EA]">
        <div className="flex w-full items-center justify-between gap-2">
          <h2 className="text-[17px] xl:text-[16px] font-semibold text-[#15131A] tracking-tight leading-snug">Total CO₂e Emissions</h2>
          <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-[#E5E0EA] bg-white/70 p-0.5" role="group" aria-label="Emissions visualization">
            <button type="button" aria-label="Show scope dot matrix" aria-pressed={visualMode === 'dots'} title="Dot matrix" onClick={() => setVisualMode('dots')}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${visualMode === 'dots' ? 'bg-[#F1EDFF] text-[#5625B8]' : 'text-[#777384] hover:bg-[#F7F4FC]'}`}>
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" aria-label="Show scope pie chart" aria-pressed={visualMode === 'pie'} title="Pie chart" onClick={() => setVisualMode('pie')}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${visualMode === 'pie' ? 'bg-[#F1EDFF] text-[#5625B8]' : 'text-[#777384] hover:bg-[#F7F4FC]'}`}>
              <PieChart className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-0.5 p-0.5 bg-white/60 rounded-full border border-[#E5E0EA] text-[11px] overflow-x-auto scrollbar-none shadow-[0_2px_10px_rgba(43,26,68,.05)]">
          {[
            { id: 'all', label: 'Total' },
            { id: 'scope1', label: 'Scope 1' },
            { id: 'scope2', label: 'Scope 2' },
            { id: 'scope3', label: 'Scope 3' }
          ].map((tab) => {
            const isTabActive = selectedScope === tab.id;
            return <button
              key={tab.id}
              type="button"
              onClick={() => handleScopeSelect(tab.id as ScopeType)}
              aria-pressed={isTabActive}
              className={`flex-1 px-2 py-1.5 rounded-full text-[11px] transition-colors cursor-pointer whitespace-nowrap ${isTabActive ? 'bg-gradient-to-r from-[#7A32E9] to-[#5318D3] text-white font-semibold shadow-[0_3px_9px_rgba(97,40,208,.28)]' : 'text-[#494454] hover:text-[#5625B8] hover:bg-[#F5F0FF] font-medium'}`}
            >{tab.label}</button>;
          })}
        </div>
      </div>

      <div className="my-auto py-3" onMouseLeave={() => setHoveredScope(null)}>
        <AnimatePresence mode="wait" initial={false}>
          {visualMode === 'dots' ? (
            <motion.div key="scope-dots" initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-data text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#16132B]">{formatK(currentTotal)}</span>
                <span className="text-[13px] font-medium text-[#667085]">tCO₂e</span>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-1 font-data text-[11px] font-medium ${activeTrend.isReduction ? 'border-[#B7F0C8] bg-[#E9FBEF] text-[#15803D]' : 'border-[#FFD0D0] bg-[#FEF0F0] text-[#B91C1C]'}`}>
                  {activeTrend.isReduction ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                  {activeTrend.isReduction ? '-' : '+'}{activeTrend.diffPct}% MoM
                </span>
              </div>
              <svg viewBox={`0 0 ${matrixWidth} ${matrixHeight}`} className="block h-auto w-full" role="group" aria-label={`Scope emissions as vertical dot bars. Scope 1 ${scope1.percentage}%, Scope 2 ${scope2.percentage}%, Scope 3 ${scope3.percentage}%`}>
                {scopeDotBands.flatMap((scope, scopeIndex) => Array.from({ length: dotsPerBar * dotRows }, (_, dotIndex) => {
                  const col = dotIndex % dotsPerBar;
                  const row = Math.floor(dotIndex / dotsPerBar);
                  const rowFromBottom = dotRows - 1 - row;
                  const dimmed = (selectedScope !== 'all' && selectedScope !== scope.key) || (hoveredScope !== null && hoveredScope !== scope.key);
                  const exactFilledRows = (scope.metric.percentage / 100) * dotRows;
                  const dotFill = Math.max(0, Math.min(1, exactFilledRows - rowFromBottom));
                  const index = scopeIndex * dotsPerBar * dotRows + dotIndex;
                  return <motion.circle
                    key={`${scope.key}-${row}-${col}`}
                    cx={scopeIndex * (barWidth + barGap) + dotPitchX / 2 + col * dotPitchX}
                    cy={dotPitchY / 2 + row * dotPitchY}
                    r="4.5"
                    fill={dotFill > 0 ? scope.color : scope.remainder}
                    tabIndex={0}
                    role="button"
                    aria-label={`${scope.metric.name}, ${scope.metric.percentage}% share`}
                    aria-pressed={selectedScope === scope.key}
                    className="cursor-pointer focus-visible:outline-none"
                    onMouseEnter={() => setHoveredScope(scope.key)}
                    onFocus={() => setHoveredScope(scope.key)}
                    onBlur={() => setHoveredScope(null)}
                    onClick={() => handleScopeSelect(selectedScope === scope.key ? 'all' : scope.key as ScopeType)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleScopeSelect(selectedScope === scope.key ? 'all' : scope.key as ScopeType); } }}
                    initial={reduceMotion ? false : { scale: 0.72, opacity: 0 }}
                    animate={{ scale: 1, opacity: dimmed ? 0.14 : dotFill > 0 ? dotFill : 0.95 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : index * 0.0008 }}
                  />;
                }))}
              </svg>
              <div className="mt-2 grid grid-cols-3 gap-1 border-t border-[#E5E0EA] pt-2 text-[9px]">
                {scopeDotBands.map(({ key, metric, color }) => <button
                  key={key}
                  type="button"
                  onClick={() => handleScopeSelect(selectedScope === key ? 'all' : key as ScopeType)}
                  onMouseEnter={() => setHoveredScope(key)}
                  onMouseLeave={() => setHoveredScope(null)}
                  aria-pressed={selectedScope === key}
                  className="inline-flex min-w-0 items-center justify-center gap-1 rounded-md py-1 font-medium text-[#4B4655] hover:bg-[#F6F2FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7541DD]"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="truncate">Scope {key.slice(-1)}</span>
                  <span className="font-data text-[#777384]">{metric.percentage}%</span>
                </button>)}
              </div>
            </motion.div>
          ) : (
            <motion.div key="scope-pie" initial={reduceMotion ? false : { opacity: 0, y: 7, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }} whileHover={reduceMotion ? undefined : { y: -2 }} className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] items-center gap-2.5">
              <div className="relative mx-auto w-full max-w-[250px]" onMouseLeave={() => setHoveredScope(null)}>
                <svg viewBox="0 0 220 220" className="block h-auto w-full overflow-visible" role="group" aria-label="Scope emissions share donut chart">
                  <defs>
                    <linearGradient id={`${donutGradientPrefix}-scope1`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#C044FF" /><stop offset="100%" stopColor="#8A22E8" />
                    </linearGradient>
                    <linearGradient id={`${donutGradientPrefix}-scope2`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFA044" /><stop offset="100%" stopColor="#F36B1C" />
                    </linearGradient>
                    <linearGradient id={`${donutGradientPrefix}-scope3`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#54A2FF" /><stop offset="100%" stopColor="#1478F5" />
                    </linearGradient>
                  </defs>
                  <circle cx="110" cy="110" r="82" fill="none" stroke="#F1EEF8" strokeWidth="36" />
                  {donutSegments.map((segment, index) => {
                    const dimmed = (selectedScope !== 'all' && selectedScope !== segment.key) || (hoveredScope !== null && hoveredScope !== segment.key);
                    const labelRadius = 82;
                    const labelAngle = (segment.midAngle * Math.PI) / 180;
                    const labelX = 110 + labelRadius * Math.cos(labelAngle);
                    const labelY = 110 + labelRadius * Math.sin(labelAngle) + 4;
                    return <g key={segment.key}>
                      <motion.path d={segment.path} fill={`url(#${donutGradientPrefix}-${segment.key})`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" tabIndex={0} role="button" aria-label={`${segment.metric.name}: ${segment.metric.value.toLocaleString()} tonnes, ${segment.metric.percentage}%`} aria-pressed={selectedScope === segment.key} onMouseEnter={() => setHoveredScope(segment.key)} onFocus={() => setHoveredScope(segment.key)} onBlur={() => setHoveredScope(null)} onClick={() => handleScopeSelect(selectedScope === segment.key ? 'all' : segment.key as ScopeType)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleScopeSelect(selectedScope === segment.key ? 'all' : segment.key as ScopeType); } }} className="cursor-pointer outline-none focus-visible:stroke-[#181624]" initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: dimmed ? 0.2 : 1 }} transition={{ duration: reduceMotion ? 0 : 0.24, delay: reduceMotion ? 0 : index * 0.08 }}><title>{segment.metric.name}: {segment.metric.value.toLocaleString()} tCO₂e ({segment.metric.percentage}%)</title></motion.path>
                      <motion.text x={labelX} y={labelY} textAnchor="middle" fill="#FFFFFF" fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fontWeight="700" pointerEvents="none" initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: dimmed ? 0.2 : 1 }} transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : 0.2 + index * 0.08 }}>{segment.metric.percentage}%</motion.text>
                    </g>;
                  })}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-data text-[29px] font-semibold leading-none tracking-[-0.04em] text-[#16132B]">{formatK(currentTotal)}</span>
                  <span className="mt-1 text-[11px] font-medium text-[#667085]">tCO₂e</span>
                  <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-data text-[10px] font-medium ${activeTrend.isReduction ? 'border-[#B7F0C8] bg-[#E9FBEF] text-[#15803D]' : 'border-[#FFD0D0] bg-[#FEF0F0] text-[#B91C1C]'}`}>
                    {activeTrend.isReduction ? <ArrowDownRight className="h-2.5 w-2.5" /> : <ArrowUpRight className="h-2.5 w-2.5" />}
                    {activeTrend.isReduction ? '-' : '+'}{activeTrend.diffPct}% MoM
                  </span>
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                {donutSegments.map((segment) => {
                  const active = selectedScope === segment.key || hoveredScope === segment.key;
                  return <motion.button key={segment.key} type="button" aria-pressed={selectedScope === segment.key} onMouseEnter={() => setHoveredScope(segment.key)} onMouseLeave={() => setHoveredScope(null)} onFocus={() => setHoveredScope(segment.key)} onBlur={() => setHoveredScope(null)} onClick={() => handleScopeSelect(selectedScope === segment.key ? 'all' : segment.key as ScopeType)} whileHover={reduceMotion ? undefined : { y: -1 }} transition={{ duration: reduceMotion ? 0 : 0.15 }} className={`flex min-w-0 items-center justify-between gap-1.5 rounded-xl border px-2 py-2 text-left transition-colors ${active ? 'shadow-sm' : ''}`} style={{ backgroundColor: `${segment.color}0D`, borderColor: `${segment.color}28` }}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] font-semibold text-[#181624]">Scope {segment.key.slice(-1)}</span>
                      <span className="block truncate text-[9px] text-[#667085]">{segment.metric.name.match(/\(([^)]+)\)/)?.[1] ?? segment.metric.name}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block whitespace-nowrap font-data text-[10px] font-semibold text-[#181624]">{segment.metric.value.toLocaleString()} t</span>
                      <span className="block font-data text-[9px] text-[#667085]">{segment.metric.percentage}%</span>
                    </span>
                  </motion.button>;
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
