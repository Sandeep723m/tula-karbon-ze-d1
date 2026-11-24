import React, { useState } from 'react';
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
  const [selectedScope, setSelectedScope] = useState<ScopeType>(activeScope || 'all');
  const [hoveredScope, setHoveredScope] = useState<string | null>(null);
  const [isCircleHovered, setIsCircleHovered] = useState(false);

  const handleScopeSelect = (scope: ScopeType) => {
    setSelectedScope(scope);
    if (setActiveScope) setActiveScope(scope);
  };

  const scope1 = data.scopes.scope1;
  const scope2 = data.scopes.scope2;
  const scope3 = data.scopes.scope3;

  let currentTotal = data.totalEmissions;
  let currentLabel = 'Total Gross Emissions';
  let currentPct = 100;
  let currentDesc = 'Consolidated GHG inventory across direct operations and global value chain.';
  let currentScopeColor = '#5625B8';

  if (selectedScope === 'scope1') {
    currentTotal = scope1.value;
    currentLabel = 'Scope 1 (Direct Operations)';
    currentPct = scope1.percentage;
    currentDesc = scope1.description;
    currentScopeColor = scope1.color;
  } else if (selectedScope === 'scope2') {
    currentTotal = scope2.value;
    currentLabel = 'Scope 2 (Purchased Electricity & Heat)';
    currentPct = scope2.percentage;
    currentDesc = scope2.description;
    currentScopeColor = scope2.color;
  } else if (selectedScope === 'scope3') {
    currentTotal = scope3.value;
    currentLabel = 'Scope 3 (Upstream & Downstream Value Chain)';
    currentPct = scope3.percentage;
    currentDesc = scope3.description;
    currentScopeColor = scope3.color;
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

  const totalTrend = calculateMoMTrend('all');
  const activeTrend = calculateMoMTrend(selectedScope);
  const scope1Trend = calculateMoMTrend('scope1');
  const scope2Trend = calculateMoMTrend('scope2');
  const scope3Trend = calculateMoMTrend('scope3');

  const formatK = (val: number) => {
    return (val / 1000).toFixed(1) + 'k';
  };

  // SVG Donut Chart Geometry
  const radius = 68;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  const gapPixels = 4;
  const totalGaps = gapPixels * 3;
  const usableCircumference = circumference - totalGaps;

  const p1 = scope1.percentage / 100;
  const p2 = scope2.percentage / 100;
  const p3 = scope3.percentage / 100;

  const len1 = p1 * usableCircumference;
  const len2 = p2 * usableCircumference;
  const len3 = p3 * usableCircumference;

  const offset1 = 0;
  const offset2 = -(len1 + gapPixels);
  const offset3 = -(len1 + gapPixels + len2 + gapPixels);

  return (
    <div className="glass-card-top p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between h-full">
      {/* 1. Header: Title, Status Badges, and Segmented Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8D2DF]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[20px] font-semibold text-[#15131A] tracking-tight leading-snug">
              Total CO2e Emissions
            </h2>
            <span className="text-[11px] font-data font-medium text-[#5625B8] bg-[#EEEAF5] border border-[#D8D2DF] px-2 py-0.5 rounded-md">
              ISO 14064
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-data font-medium px-2 py-0.5 rounded-md border ${
                totalTrend.isReduction
                  ? 'text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]'
                  : 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
              }`}
            >
              {totalTrend.isReduction ? (
                <ArrowDownRight className="w-3 h-3 text-[#15803D] stroke-[2.25]" />
              ) : (
                <ArrowUpRight className="w-3 h-3 text-[#B91C1C] stroke-[2.25]" />
              )}
              <span>{totalTrend.isReduction ? '-' : '+'}{totalTrend.diffPct}% MoM</span>
            </span>
          </div>
          <p className="text-[13px] text-[#667085] font-normal mt-0.5">
            Operational boundary inventory across Scopes 1, 2, and 3
          </p>
        </div>

        {/* Segmented Filter Control (8px radius, lavender track, deep violet active) */}
        <div className="flex items-center gap-1 p-1 bg-[#EEEAF5] rounded-lg border border-[#D8D2DF] text-[12px] self-start sm:self-auto overflow-x-auto max-w-full">
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
                className={`px-3 py-1 rounded-md text-[12px] transition-colors cursor-pointer whitespace-nowrap ${
                  isTabActive
                    ? 'bg-[#5625B8] text-[#FFFFFF] font-medium shadow-2xs'
                    : 'text-[#667085] hover:text-[#15131A] hover:bg-[#FFFFFF]/70 font-medium'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Visual Body: Donut Chart + Scope Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto py-4">
        {/* Left Column: Donut Chart */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div
            onMouseEnter={() => setIsCircleHovered(true)}
            onMouseLeave={() => setIsCircleHovered(false)}
            className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center cursor-pointer"
          >
            <svg
              className="w-full h-full -rotate-90 transform select-none"
              viewBox="0 0 170 170"
              aria-label="Emissions Donut Chart"
            >
              {/* Background guide track */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke="#EEEAF5"
                strokeWidth={strokeWidth}
              />

              {/* Scope 1 Arc (Deep Violet #5625B8) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke={scope1.color}
                strokeWidth={hoveredScope === 'scope1' || selectedScope === 'scope1' ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${len1} ${circumference}`}
                strokeDashoffset={offset1}
                strokeLinecap="round"
                className={`transition-all duration-300 ease-out cursor-pointer ${
                  isCircleHovered && (selectedScope === 'all' || selectedScope === 'scope1')
                    ? 'animate-ring-pulse opacity-100'
                    : ''
                }`}
                style={{
                  opacity:
                    selectedScope !== 'all' && selectedScope !== 'scope1' && hoveredScope !== 'scope1'
                      ? 0.28
                      : 1
                }}
                onMouseEnter={() => setHoveredScope('scope1')}
                onMouseLeave={() => setHoveredScope(null)}
                onClick={() => handleScopeSelect('scope1')}
              />

              {/* Scope 2 Arc (Deep Orange #F46A1F) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke={scope2.color}
                strokeWidth={hoveredScope === 'scope2' || selectedScope === 'scope2' ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${len2} ${circumference}`}
                strokeDashoffset={offset2}
                strokeLinecap="round"
                className={`transition-all duration-300 ease-out cursor-pointer ${
                  isCircleHovered && (selectedScope === 'all' || selectedScope === 'scope2')
                    ? 'animate-ring-pulse opacity-100'
                    : ''
                }`}
                style={{
                  opacity:
                    selectedScope !== 'all' && selectedScope !== 'scope2' && hoveredScope !== 'scope2'
                      ? 0.28
                      : 1
                }}
                onMouseEnter={() => setHoveredScope('scope2')}
                onMouseLeave={() => setHoveredScope(null)}
                onClick={() => handleScopeSelect('scope2')}
              />

              {/* Scope 3 Arc (Blue #2563EB) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke={scope3.color}
                strokeWidth={hoveredScope === 'scope3' || selectedScope === 'scope3' ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${len3} ${circumference}`}
                strokeDashoffset={offset3}
                strokeLinecap="round"
                className={`transition-all duration-300 ease-out cursor-pointer ${
                  isCircleHovered && (selectedScope === 'all' || selectedScope === 'scope3')
                    ? 'animate-ring-pulse opacity-100'
                    : ''
                }`}
                style={{
                  opacity:
                    selectedScope !== 'all' && selectedScope !== 'scope3' && hoveredScope !== 'scope3'
                      ? 0.28
                      : 1
                }}
                onMouseEnter={() => setHoveredScope('scope3')}
                onMouseLeave={() => setHoveredScope(null)}
                onClick={() => handleScopeSelect('scope3')}
              />
            </svg>

            {/* Inner Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
              <span className="text-[24px] sm:text-[26px] font-semibold text-[#15131A] tracking-tight font-data leading-none">
                {formatK(currentTotal)}
              </span>
              <span className="text-[11px] uppercase font-medium tracking-wider text-[#85808D] mt-1">
                CO2e (tonnes)
              </span>

              <div className="flex items-center gap-1 mt-1.5 pointer-events-auto">
                <span
                  className={`inline-flex items-center gap-0.5 font-data text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${
                    activeTrend.isReduction
                      ? 'text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]'
                      : 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
                  }`}
                >
                  {activeTrend.isReduction ? (
                    <ArrowDownRight className="w-2.5 h-2.5 text-[#15803D] stroke-[2.25]" />
                  ) : (
                    <ArrowUpRight className="w-2.5 h-2.5 text-[#B91C1C] stroke-[2.25]" />
                  )}
                  <span>{activeTrend.isReduction ? '-' : '+'}{activeTrend.diffPct}%</span>
                </span>
                {selectedScope !== 'all' && (
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded-md font-data font-semibold bg-[#F7F5F2] border border-[#D8D2DF]"
                    style={{ color: currentScopeColor }}
                  >
                    {currentPct}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Legend below Donut */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px]">
            <button
              onClick={() => handleScopeSelect(selectedScope === 'scope1' ? 'all' : 'scope1')}
              className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md border transition-colors ${
                selectedScope === 'scope1'
                  ? 'bg-[#EEEAF5] border-[#5625B8]/40 text-[#5625B8]'
                  : 'bg-[#F7F5F2] hover:bg-[#EEEAF5]/70 border-[#D8D2DF] text-[#15131A]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scope1.color }} />
              <span className="font-medium">Scope 1 ({scope1.percentage}%)</span>
            </button>
            <button
              onClick={() => handleScopeSelect(selectedScope === 'scope2' ? 'all' : 'scope2')}
              className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md border transition-colors ${
                selectedScope === 'scope2'
                  ? 'bg-[#FFF3EC] border-[#F46A1F]/40 text-[#C2410C]'
                  : 'bg-[#F7F5F2] hover:bg-[#EEEAF5]/70 border-[#D8D2DF] text-[#15131A]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scope2.color }} />
              <span className="font-medium">Scope 2 ({scope2.percentage}%)</span>
            </button>
            <button
              onClick={() => handleScopeSelect(selectedScope === 'scope3' ? 'all' : 'scope3')}
              className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md border transition-colors ${
                selectedScope === 'scope3'
                  ? 'bg-[#EFF6FF] border-[#2563EB]/40 text-[#1D4ED8]'
                  : 'bg-[#F7F5F2] hover:bg-[#EEEAF5]/70 border-[#D8D2DF] text-[#15131A]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scope3.color }} />
              <span className="font-medium">Scope 3 ({scope3.percentage}%)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Scope Breakdown */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-3 pl-0 md:pl-2">
          {/* Active Scope Highlight Banner */}
          <div className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF] transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#15131A]">{currentLabel}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-data font-semibold text-[13px] text-[#15131A]">
                  {currentTotal.toLocaleString()} tCO2e
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 font-data text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${
                    activeTrend.isReduction
                      ? 'text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]'
                      : 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
                  }`}
                >
                  {activeTrend.isReduction ? (
                    <ArrowDownRight className="w-2.5 h-2.5 text-[#15803D] stroke-[2.25]" />
                  ) : (
                    <ArrowUpRight className="w-2.5 h-2.5 text-[#B91C1C] stroke-[2.25]" />
                  )}
                  <span>{activeTrend.isReduction ? '-' : '+'}{activeTrend.diffPct}%</span>
                </span>
              </div>
            </div>
            <p className="text-[12px] text-[#667085] font-normal mt-1 line-clamp-2">
              {currentDesc}
            </p>
          </div>

          {/* 3 Scope Bars */}
          <div className="space-y-2">
            {/* Scope 1 Bar (Violet) */}
            <div
              onClick={() => handleScopeSelect('scope1')}
              className={`p-3 rounded-xl transition-colors cursor-pointer border ${
                selectedScope === 'scope1'
                  ? 'bg-[#EEEAF5] border-[#5625B8]/45'
                  : 'bg-[#FFFFFF] hover:bg-[#F7F5F2] border-[#D8D2DF]'
              }`}
            >
              <div className="flex items-center justify-between text-[13px] mb-1.5">
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
              <div className="w-full bg-[#EEEAF5] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${scope1.percentage}%`, backgroundColor: scope1.color }}
                />
              </div>
            </div>

            {/* Scope 2 Bar (Deep Orange) */}
            <div
              onClick={() => handleScopeSelect('scope2')}
              className={`p-3 rounded-xl transition-colors cursor-pointer border ${
                selectedScope === 'scope2'
                  ? 'bg-[#FFF3EC] border-[#F46A1F]/45'
                  : 'bg-[#FFFFFF] hover:bg-[#F7F5F2] border-[#D8D2DF]'
              }`}
            >
              <div className="flex items-center justify-between text-[13px] mb-1.5">
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
              <div className="w-full bg-[#EEEAF5] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${scope2.percentage}%`, backgroundColor: scope2.color }}
                />
              </div>
            </div>

            {/* Scope 3 Bar (Blue) */}
            <div
              onClick={() => handleScopeSelect('scope3')}
              className={`p-3 rounded-xl transition-colors cursor-pointer border ${
                selectedScope === 'scope3'
                  ? 'bg-[#EFF6FF] border-[#2563EB]/45'
                  : 'bg-[#FFFFFF] hover:bg-[#F7F5F2] border-[#D8D2DF]'
              }`}
            >
              <div className="flex items-center justify-between text-[13px] mb-1.5">
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
              <div className="w-full bg-[#EEEAF5] h-1.5 rounded-full overflow-hidden">
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
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#D8D2DF] text-[12px]">
        <div className="p-3 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF] flex flex-col justify-between">
          <div className="text-[11px] text-[#667085] font-medium truncate">
            Prev year ({data.year - 1})
          </div>
          <div className="font-semibold text-[#15131A] font-data text-[14px] mt-1">
            {formatK(data.previousYear)}
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-medium font-data text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] rounded-md px-1.5 py-0.5 mt-1.5 self-start">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            <span className="truncate">+{data.previousYearPct}% YoY</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF] flex flex-col justify-between">
          <div className="text-[11px] text-[#667085] font-medium truncate">
            Baseline (2012)
          </div>
          <div className="font-semibold text-[#15131A] font-data text-[14px] mt-1">
            {formatK(data.baselineYear)}
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-medium font-data text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-1.5 py-0.5 mt-1.5 self-start">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            <span className="truncate">+{data.baselineYearPct}%</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF] flex flex-col justify-between">
          <div className="text-[11px] text-[#667085] font-medium truncate">
            Targeted deviation
          </div>
          <div className="font-semibold text-[#15131A] font-data text-[14px] mt-1">
            {formatK(data.deviationFromTarget)}
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-medium font-data text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] rounded-md px-1.5 py-0.5 mt-1.5 self-start">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            <span className="truncate">+{data.deviationPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
