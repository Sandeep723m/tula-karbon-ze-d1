import React, { useId, useMemo, useState } from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { YearEmissionsData } from '../types';
import { getLiveEmissionsSeries, ORG_HIERARCHY } from '../data/intelligenceData';
import { OrgHierarchyTree } from './OrgHierarchyTree';

interface LiveEmissionsCardProps {
  data: YearEmissionsData;
  globalOrgId?: string;
}

export const LiveEmissionsCard: React.FC<LiveEmissionsCardProps> = ({ data, globalOrgId = 'org-global' }) => {
  const [localOrgId, setLocalOrgId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number | null>(null);
  const gradId = `live-${useId().replace(/:/g, '')}`;

  const effectiveOrgId = localOrgId ?? globalOrgId;
  const activeOrg = ORG_HIERARCHY.find((o) => o.id === effectiveOrgId) ?? ORG_HIERARCHY[0];

  const live = useMemo(
    () =>
      getLiveEmissionsSeries(data.totalEmissions, effectiveOrgId, {
        scope1: true,
        scope2: true,
        scope3: true
      }),
    [data.totalEmissions, effectiveOrgId]
  );

  const maxRate = Math.max(...live.points.map((p) => p.ratePerHour), 1);
  const currentHourIdx = 17;
  const activePoint = hoveredHourIdx !== null ? live.points[hoveredHourIdx] : null;

  return (
    <section
      className="glass-card-top p-4 sm:p-5 relative flex flex-col justify-between h-full"
      aria-labelledby="live-emissions-title"
    >
      {/* Unified Single-Line Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E0EA] min-h-[44px]">
        <div className="flex items-center gap-2 min-w-0">
          <h2 id="live-emissions-title" className="text-[17px] font-semibold tracking-tight text-[#15131A] whitespace-nowrap">
            Hourly Emissions Profile
          </h2>
        </div>

        {/* Organization & Sub-level Filter Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            aria-label="Filter live emissions by organisation and sub-levels"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              filterOpen || localOrgId !== null
                ? 'bg-[#F1EDFF] border-[#5625B8]/40 text-[#5625B8]'
                : 'bg-white/85 border-[#D8D2DF] text-[#15131A] hover:border-[#5625B8]/40'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Org</span>
          </button>

          {filterOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 max-h-[340px] overflow-y-auto rounded-2xl border border-[#D8D2DF] bg-white p-3 shadow-[0_14px_36px_rgba(21,19,26,0.16)] z-40">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EEEAF5]">
                  <span className="text-[12px] font-semibold text-[#15131A]">Organisation &amp; Sub-levels</span>
                  <div className="flex items-center gap-1.5">
                    {localOrgId !== null && (
                      <button
                        type="button"
                        onClick={() => setLocalOrgId(null)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#667085] hover:text-[#5625B8] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Sync
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      className="p-1 rounded-md text-[#85808D] hover:bg-[#EEEAF5] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <OrgHierarchyTree
                  selectedOrgId={effectiveOrgId}
                  onSelect={(id) => {
                    setLocalOrgId(id);
                    setFilterOpen(false);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between pt-3.5 gap-3">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="font-medium text-[#667085] truncate">{activeOrg.name}</span>
            <span className="font-data text-[10px] text-[#667085] font-semibold shrink-0">Peak {live.peakHour}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-[#E5E0EA] bg-white/75 px-3 py-2.5">
              <div className="text-[10px] text-[#667085] font-medium">Rate at 17:00</div>
              <div className="font-data text-[22px] font-semibold text-[#15131A] leading-tight mt-0.5">
                {live.currentRate.toFixed(1)}
                <span className="ml-1 text-[10px] font-sans font-normal text-[#85808D]">t/hr</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#E5E0EA] bg-white/75 px-3 py-2.5">
              <div className="text-[10px] text-[#667085] font-medium">Profile total · 00–17h</div>
              <div className="font-data text-[22px] font-semibold text-[#5625B8] leading-tight mt-0.5">
                {live.todayTotal.toLocaleString()}
                <span className="ml-1 text-[10px] font-sans font-normal text-[#85808D]">t</span>
              </div>
            </div>
          </div>
        </div>

        {/* 24h Hourly Telemetry Bar Chart */}
        <div className="relative pt-5" onMouseLeave={() => setHoveredHourIdx(null)}>
          {activePoint && (
            <div
              role="tooltip"
              className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-xl border border-[#D8D2DF] bg-white/95 px-2.5 py-1.5 text-[10px] shadow-md backdrop-blur-md whitespace-nowrap"
              style={{ left: `${Math.max(18, Math.min(82, ((hoveredHourIdx! + 0.5) / 24) * 100))}%` }}
            >
              <div className="font-data font-semibold text-[#15131A]">
                {activePoint.hour} · {activePoint.ratePerHour.toFixed(2)} tCO₂e/hr
              </div>
              <div className="text-[#667085] font-data mt-0.5">
                S1 {activePoint.scope1} · S2 {activePoint.scope2} · S3 {activePoint.scope3}
              </div>
            </div>
          )}

          <svg viewBox="0 0 240 96" className="w-full h-[132px] overflow-visible" role="group" aria-label="Illustrative 24-hour emissions profile">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5625B8" />
                <stop offset="100%" stopColor="#AC96F2" />
              </linearGradient>
            </defs>
            {live.points.map((pt, idx) => {
              const h = Math.max(4, (pt.ratePerHour / maxRate) * 70);
              const x = idx * 10 + 0.75;
              const y = 76 - h;
              const isFuture = idx > currentHourIdx;
              const isNow = idx === currentHourIdx;
              const isHover = hoveredHourIdx === idx;
              return (
                <g
                  key={pt.hour}
                  onMouseEnter={() => setHoveredHourIdx(idx)}
                  onFocus={() => setHoveredHourIdx(idx)}
                  onBlur={() => setHoveredHourIdx(null)}
                  tabIndex={0}
                  className="cursor-pointer outline-none"
                >
                  <rect
                    x={x}
                    y={y}
                    width="8.5"
                    height={h}
                    rx="4.25"
                    fill={isNow ? '#15803D' : isFuture ? '#E5E0EA' : `url(#${gradId})`}
                    opacity={hoveredHourIdx !== null && !isHover ? 0.45 : isFuture ? 0.65 : 1}
                  />
                  <rect x={idx * 10} y="0" width="10" height="96" fill="transparent" />
                </g>
              );
            })}
            <text x="2" y="94" fill="#85808D" fontSize="8" fontFamily="IBM Plex Mono, monospace">00:00</text>
            <text x="115" y="94" fill="#85808D" fontSize="8" fontFamily="IBM Plex Mono, monospace">12:00</text>
            <text x="172" y="94" fill="#15803D" fontSize="8" fontWeight="600" fontFamily="IBM Plex Mono, monospace">17:00</text>
            <text x="214" y="94" fill="#85808D" fontSize="8" fontFamily="IBM Plex Mono, monospace">23:00</text>
          </svg>
        </div>
      </div>
    </section>
  );
};
