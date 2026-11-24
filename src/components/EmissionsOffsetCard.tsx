import React, { useState } from 'react';
import { YearEmissionsData } from '../types';

interface EmissionsOffsetCardProps {
  data: YearEmissionsData;
  onOpenOffsetModal?: () => void;
}

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
      color: '#D97706', // Warm Amber
      description: 'Fully audited & certified vintage credits retired on Verra / Gold Standard registries.'
    },
    {
      id: 'in-review',
      name: 'In Review',
      count: 3,
      tonnage: 3100,
      color: '#FBBF24', // Luminous Gold
      description: 'Third-party auditor review (ISO 14064-3 limited assurance in progress).'
    },
    {
      id: 'on-hold',
      name: 'On Hold',
      count: 3,
      tonnage: 1800,
      color: '#85808D', // Tertiary Neutral
      description: 'Buffer pool reserve held against potential reversal or leakage risk.'
    }
  ];

  const totalProjects = projectStatusData.reduce((acc, curr) => acc + curr.count, 0);
  const totalTonnage = data.totalOffset;

  // Enlarged SVG Arch Gauge Geometry
  const cx = 130;
  const cy = 125;
  const r = 95;
  const strokeWidth = 17;
  const totalArcLength = Math.PI * r;

  const gapSize = 3;
  const totalGaps = gapSize * 3;
  const usableArcLength = totalArcLength - totalGaps;

  const segmentLengths = projectStatusData.map((item) => {
    return (item.count / totalProjects) * usableArcLength;
  });

  const offset0 = 0;
  const offset1 = -(segmentLengths[0] + gapSize);
  const offset2 = -(segmentLengths[0] + gapSize + segmentLengths[1] + gapSize);
  const offset3 = -(segmentLengths[0] + gapSize + segmentLengths[1] + gapSize + segmentLengths[2] + gapSize);
  const offsets = [offset0, offset1, offset2, offset3];

  const activeCategory = hoveredCategory
    ? projectStatusData.find((p) => p.id === hoveredCategory)
    : null;

  return (
    <div className="glass-card-top p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between h-full">
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

      {/* 2. Center: Enlarged Semi-Circle Gauge */}
      <div className="relative w-full flex flex-col items-center justify-center my-auto py-3">
        <div className="relative w-[250px] sm:w-[280px] h-[135px] sm:h-[150px] flex items-end justify-center overflow-hidden">
          <svg
            viewBox="0 0 260 140"
            className="w-full h-full overflow-visible select-none"
            aria-label="Offset Project Status Gauge"
          >
            {/* Background guide track */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#EEEAF5"
              strokeWidth={strokeWidth}
              strokeDasharray={`${totalArcLength} ${totalArcLength * 2}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform={`rotate(-180 ${cx} ${cy})`}
            />

            {/* 4 Colored Segments */}
            {projectStatusData.map((item, idx) => {
              const isHovered = hoveredCategory === item.id;
              const isOtherHovered = hoveredCategory !== null && !isHovered;

              return (
                <circle
                  key={item.id}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${segmentLengths[idx]} ${totalArcLength * 2}`}
                  strokeDashoffset={offsets[idx]}
                  strokeLinecap="round"
                  transform={`rotate(-180 ${cx} ${cy})`}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: isOtherHovered ? 0.3 : 1
                  }}
                  onMouseEnter={() => setHoveredCategory(item.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>

          {/* Centered Readout */}
          <div className="absolute inset-x-0 bottom-1.5 flex flex-col items-center justify-center text-center pointer-events-none">
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
          className="mt-3 text-[12px] text-[#5625B8] hover:text-[#461D98] font-medium transition-colors flex items-center gap-1.5 cursor-pointer bg-[#EEEAF5] hover:bg-[#E4DEF0] px-3 py-1.5 rounded-lg border border-[#D8D2DF]"
        >
          <span>
            {viewMode === 'count'
              ? `Showing ${totalProjects} Projects · View Tonnage`
              : `Showing ${(totalTonnage / 1000).toFixed(1)}k tCO2e · View Projects`}
          </span>
        </button>
      </div>

      {/* 3. Bottom 2x2 Legend */}
      <div className="pt-4 border-t border-[#D8D2DF]">
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          {projectStatusData.map((item) => {
            const isHovered = hoveredCategory === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredCategory(item.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  isHovered
                    ? 'bg-[#EEEAF5] border-[#5625B8]/40'
                    : 'bg-[#F7F5F2] hover:bg-[#EEEAF5]/60 border-[#D8D2DF]'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex items-baseline gap-1 truncate text-[#15131A]">
                  <span className="text-[12px] font-medium truncate">{item.name}</span>
                  <span className="font-semibold text-[12px] text-[#15131A] font-data">
                    ({viewMode === 'count' ? item.count : `${(item.tonnage / 1000).toFixed(1)}k`})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
