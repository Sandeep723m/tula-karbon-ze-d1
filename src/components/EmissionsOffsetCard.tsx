import React, { useState } from 'react';
import { YearEmissionsData } from '../types';
import { ArrowRight, Layers } from 'lucide-react';

interface EmissionsOffsetCardProps {
  data: YearEmissionsData;
  onOpenOffsetModal?: () => void;
}

const arcPath = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
};

export const EmissionsOffsetCard: React.FC<EmissionsOffsetCardProps> = ({
  data
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'count' | 'tonnage'>('count');

  // 4 differentiated warm/brand orange-amber & neutral tones harmonized with Tula Carbon
  const projectStatusData = [
    {
      id: 'in-progress',
      name: 'In Progress',
      count: 23,
      tonnage: 21400,
      color: '#F46A1F', // Brand Deep Orange
      description: 'Active forestry, direct air capture & renewable displacement projects currently retiring credits.'
    },
    {
      id: 'completed',
      name: 'Completed',
      count: 13,
      tonnage: 11200,
      color: '#F5C400'
    },
    {
      id: 'in-review',
      name: 'In Review',
      count: 3,
      tonnage: 3100,
      color: '#A855F7'
    },
    {
      id: 'on-hold',
      name: 'On Hold',
      count: 3,
      tonnage: 1800,
      color: '#A9A7B2'
    }
  ];

  const totalProjects = projectStatusData.reduce((acc, curr) => acc + curr.count, 0);
  const totalTonnage = data.totalOffset;

  // Segmented half-ring gauge, with each segment sized by project status share.
  const cx = 130;
  const cy = 126;
  const r = 87;
  const strokeWidth = 42;
  const totalArcLength = Math.PI * r;

  const gapSize = 8;
  const totalGaps = gapSize * (projectStatusData.length - 1);
  const usableArcLength = totalArcLength - totalGaps;

  const segmentLengths = projectStatusData.map((item) => {
    return (item.count / totalProjects) * usableArcLength;
  });
  const activeCategory = hoveredCategory
    ? projectStatusData.find((p) => p.id === hoveredCategory)
    : null;

  return (
    <div className="glass-card-top p-5 sm:p-6 relative overflow-hidden flex flex-col h-full">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D8D2DF]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-semibold text-[#15131A] tracking-tight leading-snug">
              Project Status
            </h2>
            <span className="text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-2 py-0.5 rounded-md">
              Approved
            </span>
          </div>
          <p className="text-[13px] text-[#667085] font-normal mt-0.5">
            Carbon offset &amp; removal portfolio
          </p>
        </div>
      </div>

      {/* 2. Center: Segmented Radial Gauge */}
      <div className="relative w-full flex flex-col items-center justify-center flex-1 py-3">
        <div className="relative w-full max-w-[330px] h-[190px] sm:h-[205px] flex items-center justify-center">
          <svg
            viewBox="0 0 260 160"
            className="w-full h-full overflow-visible select-none"
            role="img"
            aria-label="Segmented radial gauge showing the distribution of offset project statuses"
          >
            {/* Background guide track */}
            <path d={arcPath(cx, cy, r, Math.PI, Math.PI * 2)} fill="none" stroke="#F0EDF5" strokeWidth={strokeWidth} strokeLinecap="round" />

            {/* Fine radial ticks echo the gauge scale without adding chart clutter. */}
            {Array.from({ length: 49 }, (_, index) => {
              const angle = Math.PI + (index / 48) * Math.PI;
              const innerRadius = r - 31;
              const outerRadius = innerRadius + (index % 4 === 0 ? 7 : 4);
              return <line key={`tick-${index}`} x1={cx + innerRadius * Math.cos(angle)} y1={cy + innerRadius * Math.sin(angle)} x2={cx + outerRadius * Math.cos(angle)} y2={cy + outerRadius * Math.sin(angle)} stroke="#D7CFF0" strokeWidth={index % 4 === 0 ? 1.5 : 1} opacity=".62" />;
            })}

            {/* Four isolated colored status segments */}
            {projectStatusData.map((item, idx) => {
              const isHovered = hoveredCategory === item.id;
              const isOtherHovered = hoveredCategory !== null && !isHovered;
              const distanceBefore = segmentLengths.slice(0, idx).reduce((sum, length) => sum + length + gapSize, 0);
              const startAngle = Math.PI + distanceBefore / r;
              const endAngle = startAngle + segmentLengths[idx] / r;
              const labelAngle = (startAngle + endAngle) / 2;
              const labelX = cx + r * Math.cos(labelAngle);
              const labelY = cy + r * Math.sin(labelAngle);

              return (
                <g key={item.id} className="cursor-pointer" onMouseEnter={() => setHoveredCategory(item.id)} onMouseLeave={() => setHoveredCategory(null)} style={{ opacity: isOtherHovered ? 0.34 : 1 }}>
                  <path d={arcPath(cx, cy, r, startAngle, endAngle)} fill="none" stroke={item.color} strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth} strokeLinecap="round" className="transition-all duration-200" />
                  <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="central" fill={idx === 0 ? '#FFFFFF' : '#211A35'} fontSize={idx > 1 ? 10 : 11} fontWeight="700" className="pointer-events-none select-none">{Math.round((item.count / totalProjects) * 100)}%</text>
                </g>
              );
            })}
          </svg>

          {/* Centered Readout */}
          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center justify-center text-center pointer-events-none">
            <Layers className="w-4 h-4 text-[#6248D5] mb-1" strokeWidth={1.8} />
            <span className="text-[32px] sm:text-[36px] font-semibold text-[#15131A] tracking-tight font-data leading-none">
              {activeCategory
                ? viewMode === 'count'
                  ? activeCategory.count
                  : `${(activeCategory.tonnage / 1000).toFixed(1)}k`
                : viewMode === 'count'
                ? totalProjects
                : `${(totalTonnage / 1000).toFixed(1)}k`}
            </span>
            <span className="text-[11px] uppercase font-medium tracking-wider text-[#85808D] mt-1">
              {activeCategory
                ? activeCategory.name
                : viewMode === 'count'
                ? 'Active Projects'
                : 'tCO2e Retired'}
            </span>
          </div>
        </div>

        {/* Toggle between Project Count and Carbon Tonnage */}
        <button
          onClick={() => setViewMode(viewMode === 'count' ? 'tonnage' : 'count')}
          className="mt-2 text-[12px] text-[#5625B8] hover:text-[#461D98] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer bg-[#F5F0FF]/85 hover:bg-[#EEE7FF] px-4 py-2 rounded-full border border-[#E2D6FF] shadow-[0_2px_8px_rgba(86,37,184,.08)]"
        >
          <span>
            {viewMode === 'count'
              ? `Showing ${totalProjects} Projects · View Tonnage`
              : `Showing ${(totalTonnage / 1000).toFixed(1)}k tCO₂e · View Projects`}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Bottom 2x2 Legend */}
      <div className="pt-4 border-t border-[#D8D2DF]/80">
        <div className="grid grid-cols-2 gap-2.5 text-[12px]">
          {projectStatusData.map((item) => {
            const isHovered = hoveredCategory === item.id;
            const share = Math.round((item.count / totalProjects) * 100);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isHovered}
                onMouseEnter={() => setHoveredCategory(item.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onFocus={() => setHoveredCategory(item.id)}
                onBlur={() => setHoveredCategory(null)}
                onClick={() => setHoveredCategory(isHovered ? null : item.id)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5625B8] ${
                  isHovered
                    ? 'bg-[#F4F0FF]/90 border-[#D9CCFF]'
                    : 'bg-white/55 hover:bg-white/85 border-[#E8E3EE]'
                }`}
              >
                <i aria-hidden="true" className="w-3 h-3 rounded-full shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,.65)]" style={{ backgroundColor: item.color }} />
                <div className="flex items-center justify-between gap-2 min-w-0 flex-1 text-[#15131A]">
                  <div className="flex items-baseline gap-1 truncate">
                    <span className="text-[12px] font-medium truncate">{item.name}</span>
                    <span className="font-semibold text-[11px] text-[#62636D] font-data">({viewMode === 'count' ? item.count : `${(item.tonnage / 1000).toFixed(1)}k`})</span>
                  </div>
                  <span className="font-semibold text-[12px] font-data text-[#62636D] shrink-0">{share}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
