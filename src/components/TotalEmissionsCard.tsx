import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { YearEmissionsData, ScopeType } from '../types';

interface TotalEmissionsCardProps {
  data: YearEmissionsData;
  activeScope?: ScopeType;
  setActiveScope?: (scope: ScopeType) => void;
  onScopeInspect?: (scopeKey: string) => void;
  userName?: string;
}

export const TotalEmissionsCard: React.FC<TotalEmissionsCardProps> = ({
  data,
  activeScope = 'all',
  setActiveScope
}) => {
  const [hoveredScope, setHoveredScope] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

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
    { key: 'scope1', metric: scope1, color: '#5625B8', rows: 2 },
    { key: 'scope2', metric: scope2, color: '#F46A1F', rows: 2 },
    { key: 'scope3', metric: scope3, color: '#2563EB', rows: 3 }
  ];
  const scopeRows = scopeDotBands.flatMap((scope) => Array.from({ length: scope.rows }, () => scope));
  const dotColumns = 21;
  const dotRows = scopeRows.length;
  const dotPitchX = 19;
  const dotPitchY = 20;

  return (
    <div className="glass-card-top p-3 sm:p-4 xl:p-3 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header and scope filter */}
      <div className="flex flex-col items-start justify-between gap-2 pb-2.5 border-b border-[#E5E0EA]">
        <h2 className="text-[17px] xl:text-[16px] font-semibold text-[#15131A] tracking-tight leading-snug">Total CO₂e Emissions</h2>
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

      {/* Dot matrix scope composition */}
      <div className="my-auto py-3" onMouseLeave={() => setHoveredScope(null)}>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-data text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#16132B]">{formatK(currentTotal)}</span>
          <span className="text-[13px] font-medium text-[#667085]">tCO₂e</span>
          <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-1 font-data text-[11px] font-medium ${activeTrend.isReduction ? 'border-[#B7F0C8] bg-[#E9FBEF] text-[#15803D]' : 'border-[#FFD0D0] bg-[#FEF0F0] text-[#B91C1C]'}`}>
            {activeTrend.isReduction ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            {activeTrend.isReduction ? '-' : '+'}{activeTrend.diffPct}% MoM
          </span>
        </div>
        <svg viewBox={`0 0 ${dotColumns * dotPitchX} ${dotRows * dotPitchY}`} className="block h-auto w-full" role="group" aria-label={`Scope emissions composition. Scope 1 ${scope1.percentage}%, Scope 2 ${scope2.percentage}%, Scope 3 ${scope3.percentage}%`}>
          {Array.from({ length: dotRows * dotColumns }, (_, index) => {
            const col = index % dotColumns;
            const row = Math.floor(index / dotColumns);
            const scope = scopeRows[row];
            const dimmed = (selectedScope !== 'all' && selectedScope !== scope.key) || (hoveredScope !== null && hoveredScope !== scope.key);
            const fadeStart = 0.35 + (scope.metric.percentage / 100) * 0.5;
            const progress = col / (dotColumns - 1);
            const fade = progress <= fadeStart ? 1 : Math.max(0.22, 1 - ((progress - fadeStart) / (1 - fadeStart)) * 0.78);
            return <motion.circle
              key={`${scope.key}-${row}-${col}`}
              cx={dotPitchX / 2 + col * dotPitchX}
              cy={dotPitchY / 2 + row * dotPitchY}
              r="6.1"
              fill={scope.color}
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
              animate={{ scale: 1, opacity: dimmed ? 0.14 : fade }}
              transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : index * 0.0008 }}
            />;
          })}
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
      </div>
    </div>
  );
};
