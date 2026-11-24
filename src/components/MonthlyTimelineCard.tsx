import React, { useState } from 'react';
import { ChevronDown, BarChart2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { YearEmissionsData } from '../types';

interface MonthlyTimelineCardProps {
  data: YearEmissionsData;
}

export const MonthlyTimelineCard: React.FC<MonthlyTimelineCardProps> = ({ data }) => {
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'scope1' | 'scope2' | 'scope3'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);

  const months = data.monthly;

  // Scope chart colors per Tula Carbon design system
  const SCOPE_COLORS = {
    all: '#5625B8',    // Primary Deep Violet
    scope1: '#5625B8', // Scope 1 Violet
    scope2: '#F46A1F', // Scope 2 Deep Orange
    scope3: '#2563EB'  // Scope 3 Blue
  };

  const activeStrokeColor = SCOPE_COLORS[scopeFilter];

  const getValue = (m: (typeof months)[0]) => {
    if (scopeFilter === 'scope1') return m.scope1;
    if (scopeFilter === 'scope2') return m.scope2;
    if (scopeFilter === 'scope3') return m.scope3;
    return m.total;
  };

  // Dynamic ceiling so filtered scopes also use vertical space cleanly
  const rawMaxVal = Math.max(...months.map((m) => (chartMode === 'bar' ? m.total : getValue(m))), 1000);
  const maxScale = Math.ceil((rawMaxVal * 1.18) / 1000) * 1000;

  // Normalized SVG coordinate system (paths scale fluidly while HTML labels & dots stay razor-sharp)
  const svgWidth = 1000;
  const svgHeight = 180;

  const points = months.map((m, index) => {
    const xPct = ((index + 0.5) / months.length) * 100;
    const x = (xPct / 100) * svgWidth;
    const val = getValue(m);
    const yRatio = Math.min(1, Math.max(0, val / maxScale));
    const yPct = (1 - yRatio) * 100;
    const y = (yPct / 100) * svgHeight;
    return { x, y, xPct, yPct, month: m.month, data: m };
  });

  // Smooth cubic-bezier SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;
  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  const yTicks = [1.0, 0.75, 0.5, 0.25].map((ratio) => {
    const val = (ratio * maxScale) / 1000;
    const label = val >= 10 ? `${Math.round(val)}k` : `${Number(val.toFixed(1))}k`;
    return {
      ratio,
      topPct: (1 - ratio) * 100,
      svgY: (1 - ratio) * svgHeight,
      label
    };
  });

  return (
    <div className="glass-card-top p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header with Title and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8D2DF]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[20px] font-semibold text-[#15131A] tracking-tight leading-snug">
              Total Emissions over Months
            </h2>
            <span className="text-[11px] font-medium text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-md">
              Submitted
            </span>
          </div>
          <p className="text-[13px] text-[#667085] font-normal mt-0.5">
            Dynamic monthly variance across Scope 1, 2, and 3
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Chart mode toggle: Area vs Stacked Bar */}
          <div className="flex items-center p-1 bg-[#EEEAF5] rounded-lg border border-[#D8D2DF] text-[12px]">
            <button
              onClick={() => setChartMode('area')}
              aria-label="Area spline chart"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                chartMode === 'area'
                  ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs'
                  : 'text-[#667085] hover:text-[#15131A]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setChartMode('bar')}
              aria-label="Stacked bar chart"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs'
                  : 'text-[#667085] hover:text-[#15131A]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Scope Dropdown */}
          <div className="relative">
            <button
              onClick={() => setScopeDropdownOpen(!scopeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#EEEAF5]/60 rounded-lg text-[12px] font-medium text-[#15131A] border border-[#D8D2DF] transition-colors cursor-pointer"
            >
              <span className="capitalize">
                {scopeFilter === 'all' ? 'All Scopes' : scopeFilter.replace('scope', 'Scope ')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#85808D]" />
            </button>

            {scopeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-[#FFFFFF] rounded-xl p-1.5 shadow-[0_12px_32px_rgba(21,19,26,0.12)] border border-[#D8D2DF] z-50 animate-in fade-in zoom-in-95">
                {[
                  { id: 'all', label: 'All Scopes' },
                  { id: 'scope1', label: 'Scope 1 Only' },
                  { id: 'scope2', label: 'Scope 2 Only' },
                  { id: 'scope3', label: 'Scope 3 Only' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setScopeFilter(item.id as 'all' | 'scope1' | 'scope2' | 'scope3');
                      setScopeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer ${
                      scopeFilter === item.id
                        ? 'bg-[#EEEAF5] text-[#5625B8] font-semibold'
                        : 'text-[#15131A] hover:bg-[#F7F5F2]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        className="relative w-full pt-4 pb-1 my-auto"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Top-Aligned Animated Hover Pop Card on Month Hover */}
        <AnimatePresence>
          {hoveredIndex !== null && months[hoveredIndex] && (
            <motion.div
              key="top-aligned-hover-card"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-1.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-auto max-w-[96%]"
            >
              <div className="bg-[#FFFFFF] border border-[#D8D2DF] shadow-[0_12px_32px_rgba(21,19,26,0.12)] rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-center sm:justify-between gap-3 text-[12px]">
                {/* 1. Month Identifier & Approved Tag */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#15131A] text-[13px]">
                      {months[hoveredIndex].month} {data.year}
                    </span>
                    <span className="text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-1.5 py-0.5 rounded-md">
                      Audit
                    </span>
                  </div>

                  <div className="h-4 w-px bg-[#D8D2DF]" />

                  {/* 2. Total Monthly Metric */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] uppercase font-medium text-[#85808D] tracking-wider">
                      Total:
                    </span>
                    <span className="text-[15px] font-semibold font-data text-[#15131A] leading-none">
                      {months[hoveredIndex].total.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#667085]">tCO2e</span>
                  </div>
                </div>

                {/* 3. Scope Breakdown Chips (Scope 1 Violet, Scope 2 Deep Orange, Scope 3 Blue) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#EEEAF5] border border-[#5625B8]/25 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5625B8]" />
                    <span className="text-[#667085] font-medium">S1:</span>
                    <span className="font-semibold font-data text-[#15131A]">
                      {months[hoveredIndex].scope1.toLocaleString()}t
                    </span>
                    <span className="text-[#5625B8] font-medium font-data">
                      ({Math.round((months[hoveredIndex].scope1 / months[hoveredIndex].total) * 100)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#FFF3EC] border border-[#F46A1F]/25 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F46A1F]" />
                    <span className="text-[#667085] font-medium">S2:</span>
                    <span className="font-semibold font-data text-[#15131A]">
                      {months[hoveredIndex].scope2.toLocaleString()}t
                    </span>
                    <span className="text-[#C2410C] font-medium font-data">
                      ({Math.round((months[hoveredIndex].scope2 / months[hoveredIndex].total) * 100)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#EFF6FF] border border-[#2563EB]/25 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                    <span className="text-[#667085] font-medium">S3:</span>
                    <span className="font-semibold font-data text-[#15131A]">
                      {months[hoveredIndex].scope3.toLocaleString()}t
                    </span>
                    <span className="text-[#1D4ED8] font-medium font-data">
                      ({Math.round((months[hoveredIndex].scope3 / months[hoveredIndex].total) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart Body with Crisp Non-Distorted HTML Y-Axis & X-Axis Labels */}
        <div className="flex items-stretch w-full">
          {/* Y-Axis Labels Column (Crisp native HTML IBM Plex Mono 11px) */}
          <div className="w-9 sm:w-10 shrink-0 relative h-[184px] pr-2 select-none">
            {yTicks.map((tick) => (
              <span
                key={tick.ratio}
                style={{ top: `${tick.topPct}%` }}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-data text-[#85808D] leading-none"
              >
                {tick.label}
              </span>
            ))}
            <span className="absolute right-2 bottom-0 translate-y-1/2 text-[11px] font-data text-[#85808D] leading-none">
              0
            </span>
          </div>

          {/* Plot Area + Aligned X-Axis Month Labels */}
          <div className="flex-1 min-w-0 flex flex-col">
            {chartMode === 'area' ? (
              <div className="relative w-full h-[184px]">
                {/* Fluid Vector Plot (paths only — no text inside stretched SVG!) */}
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-full overflow-visible block"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activeStrokeColor} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={activeStrokeColor} stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Dashed Gridlines */}
                  {yTicks.map((tick) => (
                    <line
                      key={tick.ratio}
                      x1="0"
                      y1={tick.svgY}
                      x2={svgWidth}
                      y2={tick.svgY}
                      stroke="#D8D2DF"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      vectorEffect="non-scaling-stroke"
                      opacity="0.75"
                    />
                  ))}

                  {/* Bottom Baseline */}
                  <line
                    x1="0"
                    y1={svgHeight}
                    x2={svgWidth}
                    y2={svgHeight}
                    stroke="#D8D2DF"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Area Fill */}
                  <path d={areaD} fill="url(#areaGradient)" />

                  {/* Cubic-Bezier Stroke Line (non-scaling-stroke keeps crisp 2.25px width at any expansion) */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={activeStrokeColor}
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className="transition-all duration-300"
                  />

                  {/* Vertical Scrubber Guide Line */}
                  {activePoint && (
                    <line
                      x1={activePoint.x}
                      y1="0"
                      x2={activePoint.x}
                      y2={svgHeight}
                      stroke={activeStrokeColor}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      vectorEffect="non-scaling-stroke"
                      opacity="0.75"
                    />
                  )}
                </svg>

                {/* Crisp Perfectly-Round Active Point Marker (HTML overlay prevents horizontal oval stretch) */}
                {activePoint && (
                  <div
                    style={{
                      left: `${activePoint.xPct}%`,
                      top: `${activePoint.yPct}%`,
                      backgroundColor: activeStrokeColor
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-[2.5px] ring-[#FFFFFF] shadow-xs pointer-events-none transition-all duration-150"
                  />
                )}

                {/* 12 Aligned Interactive Hover Columns */}
                <div className="absolute inset-0 grid grid-cols-12">
                  {months.map((m, idx) => (
                    <div
                      key={m.month}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      className="h-full cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Stacked Scope Bar Chart aligned to the exact same 12-column grid & Y-axis */
              <div className="relative w-full h-[184px]">
                {/* Background horizontal gridlines for visual parity */}
                {yTicks.map((tick) => (
                  <div
                    key={tick.ratio}
                    style={{ top: `${tick.topPct}%` }}
                    className="absolute inset-x-0 border-t border-dashed border-[#D8D2DF]/75 pointer-events-none"
                  />
                ))}
                <div className="absolute inset-x-0 bottom-0 border-t border-[#D8D2DF] pointer-events-none" />

                <div className="relative z-10 w-full h-full grid grid-cols-12 items-end">
                  {months.map((m, idx) => {
                    const totalHeightPct = Math.min(100, (m.total / maxScale) * 100);
                    const s1Pct = (m.scope1 / m.total) * 100;
                    const s2Pct = (m.scope2 / m.total) * 100;
                    const s3Pct = (m.scope3 / m.total) * 100;
                    const isHovered = hoveredIndex === idx;

                    return (
                      <div
                        key={m.month}
                        className="flex flex-col items-center justify-end h-full px-1 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                      >
                        <div
                          className="w-full max-w-[26px] flex flex-col justify-end rounded-t-md overflow-hidden transition-transform duration-200 origin-bottom"
                          style={{
                            height: `${totalHeightPct}%`,
                            transform: isHovered ? 'scaleY(1.03)' : 'none'
                          }}
                        >
                          <div className="w-full bg-[#5625B8]" style={{ height: `${s1Pct}%` }} />
                          <div className="w-full bg-[#F46A1F]" style={{ height: `${s2Pct}%` }} />
                          <div className="w-full bg-[#2563EB]" style={{ height: `${s3Pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Crisp Non-Stretched HTML X-Axis Month Labels (tight vertical spacing, sharp 12px IBM Plex Sans) */}
            <div className="grid grid-cols-12 pt-2.5 select-none">
              {months.map((m, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <button
                    key={m.month}
                    type="button"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    className={`text-center text-[12px] leading-none py-1 rounded-md transition-colors cursor-pointer ${
                      isHovered
                        ? 'text-[#5625B8] font-semibold bg-[#EEEAF5]/80'
                        : 'text-[#667085] font-medium hover:text-[#15131A]'
                    }`}
                  >
                    {m.month}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3.5 mt-2 border-t border-[#D8D2DF] text-[12px]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F5F2] border border-[#D8D2DF]">
            <span className="w-2 h-2 rounded-full bg-[#5625B8]" />
            <span className="text-[11px] text-[#15131A] font-medium">Scope 1 (Direct)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F5F2] border border-[#D8D2DF]">
            <span className="w-2 h-2 rounded-full bg-[#F46A1F]" />
            <span className="text-[11px] text-[#15131A] font-medium">Scope 2 (Power)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F5F2] border border-[#D8D2DF]">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span className="text-[11px] text-[#15131A] font-medium">Scope 3 (Supply)</span>
          </div>
        </div>

        <span className="text-[11px] text-[#85808D] font-data hidden sm:inline">
          ISO 14064-1 · Monthly Ledger
        </span>
      </div>
    </div>
  );
};
