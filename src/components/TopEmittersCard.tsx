import React, { useState } from 'react';
import { YearEmissionsData, EmitterItem } from '../types';

interface TopEmittersCardProps {
  data: YearEmissionsData;
  onSelectEmitter?: (emitter: EmitterItem) => void;
}

const getScopeBarColor = (scope: string) => {
  if (scope === 'Scope 1') return '#5625B8'; // Violet
  if (scope === 'Scope 2') return '#F46A1F'; // Deep Orange
  return '#2563EB'; // Blue (Scope 3)
};

export const TopEmittersCard: React.FC<TopEmittersCardProps> = ({
  data
}) => {
  const [emitterMode, setEmitterMode] = useState<'facilities' | 'sources'>('facilities');

  const items = emitterMode === 'facilities' ? data.topFacilities : data.topSources;
  const maxEmissions = Math.max(...items.map((i) => i.emissions));
  const prioritizedShare = Math.round(items.reduce((sum, item) => sum + item.emissions, 0) / data.totalEmissions * 100);

  return (
    <div className="glass-card-top p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8D2DF]">
        <div>
          <h2 className="text-[20px] font-semibold text-[#15131A] tracking-tight leading-snug">
            Top 5 Emitters (tCO2e)
          </h2>
          <p className="text-[13px] text-[#667085] font-normal mt-0.5">
            Critical hotspots for prioritized mitigation intervention
          </p>
        </div>

        {/* Sources vs Facilities Segmented Toggle */}
        <div className="flex items-center p-1 bg-[#EEEAF5] rounded-lg border border-[#D8D2DF] text-[12px] self-start sm:self-auto">
          <button
            onClick={() => setEmitterMode('sources')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              emitterMode === 'sources'
                ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs font-medium'
                : 'text-[#667085] hover:text-[#15131A] font-medium'
            }`}
          >
            Sources
          </button>
          <button
            onClick={() => setEmitterMode('facilities')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              emitterMode === 'facilities'
                ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs font-medium'
                : 'text-[#667085] hover:text-[#15131A] font-medium'
            }`}
          >
            Facilities
          </button>
        </div>
      </div>

      {/* List Items */}
      <div className="space-y-2.5 my-auto py-3">
        {items.map((item, idx) => {
          const widthPct = Math.round((item.emissions / maxEmissions) * 100);
          const barColor = getScopeBarColor(item.primaryScope);

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white/50 hover:bg-white/75 backdrop-blur-sm border border-white/80 transition-colors"
            >
              {/* Top row: Rank + Name on left, numeric emissions on right */}
              <div className="flex items-center justify-between text-[13px] text-[#15131A] mb-1.5">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-[11px] font-data font-semibold text-[#5625B8] bg-white/80 px-1.5 py-0.5 rounded-md border border-white shrink-0">
                    0{idx + 1}
                  </span>
                  <span className="font-medium text-[#15131A] text-[13px] truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-data font-semibold text-[13px] text-[#15131A]">
                    {item.emissions.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#85808D] font-data">t</span>
                </div>
              </div>

              {/* Progress Bar color-coded to primary Scope */}
              <div className="w-full bg-[#EEEAF5] h-1.5 rounded-full overflow-hidden my-1.5">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${widthPct}%`, backgroundColor: barColor }}
                />
              </div>

              {/* Sub-label with primary scope / location & YoY status badge */}
              <div className="flex items-center justify-between text-[11px] text-[#667085] font-medium mt-1">
                <span className="truncate">{item.location || item.primaryScope}</span>
                <span className="flex items-center gap-1 shrink-0">
                  {item.trend > 0 ? (
                    <span className="inline-flex items-center text-[11px] font-data font-medium px-1.5 py-0.5 rounded-md border bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]">
                      +{item.trend}% YoY
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-data font-medium px-1.5 py-0.5 rounded-md border bg-[#ECFDF3] text-[#15803D] border-[#BBF7D0]">
                      {item.trend}% YoY
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer indicator */}
      <div className="pt-4 mt-1 border-t border-[#D8D2DF] flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1.5 text-[#667085]">
          <span className="w-2 h-2 rounded-full bg-[#5625B8]" />
          Prioritized mitigation levers
        </span>
        <span className="font-data text-[#15131A] font-medium text-[11px]">
          {prioritizedShare}% of gross volume
        </span>
      </div>
    </div>
  );
};
