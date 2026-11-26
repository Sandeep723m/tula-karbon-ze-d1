import React from 'react';
import { ArrowDownRight, ArrowUpRight, Target } from 'lucide-react';
import { YearEmissionsData } from '../types';
import { computeProjectedThresholdYear } from '../data/intelligenceData';

interface KpiSummaryStripProps {
  data: YearEmissionsData;
  annualReductionRate: number;
  targetYear: number;
  onNavigateNetZero: () => void;
}

export const KpiSummaryStrip: React.FC<KpiSummaryStripProps> = ({
  data,
  annualReductionRate,
  targetYear,
  onNavigateNetZero
}) => {

  const baseline2020 = Math.round(data.totalEmissions / 0.7867); // 180k when total is 141.6k
  const yoyPct = Number((((data.totalEmissions - data.previousYear) / Math.max(data.previousYear, 1)) * 100).toFixed(1));
  const baselineDeltaPct = Number((((data.totalEmissions - baseline2020) / Math.max(baseline2020, 1)) * 100).toFixed(1));
  const thresholdTonnes = Math.round(baseline2020 * 0.1);
  const projectedYear = computeProjectedThresholdYear(data.totalEmissions, annualReductionRate, data.year, thresholdTonnes);
  const isOnTrack = projectedYear !== null && projectedYear <= targetYear;

  const monthlyTotals = data.monthly.map((m) => m.total);
  const minM = Math.min(...monthlyTotals);
  const maxM = Math.max(...monthlyTotals, minM + 1);
  const sparkPts = monthlyTotals
    .map((val, idx) => `${(idx / Math.max(monthlyTotals.length - 1, 1)) * 78},${26 - ((val - minM) / (maxM - minM)) * 22}`)
    .join(' ');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Tile 1: Total Emissions + Sparkline */}
      <div
        className="glass-card-top px-4 py-3.5 relative flex items-center justify-between gap-3 cursor-default"
      >
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[#667085] uppercase tracking-wider">Total Footprint</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-data text-[24px] font-semibold tracking-[-0.03em] text-[#15131A] leading-none">
              {(data.totalEmissions / 1000).toFixed(1)}k
            </span>
            <span className="text-[11px] font-medium text-[#85808D]">tCO₂e</span>
          </div>
          <div className="mt-1.5 text-[11px] font-data text-[#667085]">
            Net <span className="font-semibold text-[#15131A]">{(data.netEmissions / 1000).toFixed(1)}k</span> after offsets
          </div>
        </div>
        <svg viewBox="0 0 80 30" className="w-[80px] h-[30px] shrink-0 overflow-visible" aria-hidden="true">
          <polyline fill="none" stroke="#5625B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={sparkPts} />
        </svg>

      </div>

      {/* Tile 2: Annual Change */}
      <div
        className="glass-card-top px-4 py-3.5 relative flex items-center justify-between gap-3 cursor-default"
      >
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[#667085] uppercase tracking-wider">Annual Change</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`font-data text-[24px] font-semibold tracking-[-0.03em] leading-none ${yoyPct <= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
              {yoyPct > 0 ? `+${yoyPct}%` : `${yoyPct}%`}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] font-data text-[#667085]">
            vs FY {data.year - 1} ({(data.previousYear / 1000).toFixed(1)}k)
          </div>
        </div>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${yoyPct <= 0 ? 'bg-[#ECFDF3] border-[#BBF7D0] text-[#15803D]' : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'}`}>
          {yoyPct <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
        </span>

      </div>

      {/* Tile 3: Baseline Reduction */}
      <div
        className="glass-card-top px-4 py-3.5 relative flex items-center justify-between gap-3 cursor-default"
      >
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium text-[#667085] uppercase tracking-wider">Baseline Delta</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-data text-[24px] font-semibold tracking-[-0.03em] text-[#5625B8] leading-none">
              {baselineDeltaPct}%
            </span>
          </div>
          <div className="mt-1.5 text-[11px] font-data text-[#667085]">
            since 2020 ({(baseline2020 / 1000).toFixed(0)}k t)
          </div>
        </div>
        {/* Mini 6-bar reduction gauge */}
        <div className="flex items-end gap-1 h-8 shrink-0" aria-hidden="true">
          {[28, 25, 22, 20, 18, 16].map((h, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full"
              style={{ height: `${h}px`, backgroundColor: i === 5 ? '#5625B8' : '#D9CFFA' }}
            />
          ))}
        </div>

      </div>

      {/* Tile 4: Net-Zero Target Status */}
      <button
        type="button"
        onClick={onNavigateNetZero}
        className="glass-card-top px-4 py-3.5 relative flex items-center justify-between gap-3 text-left cursor-pointer group"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#667085] uppercase tracking-wider">Net-Zero {targetYear}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
              isOnTrack
                ? 'bg-[#ECFDF3] text-[#15803D] border-[#BBF7D0]'
                : 'bg-[#FFF3EC] text-[#C2410C] border-[#FDE68A]'
            }`}>
              {isOnTrack ? 'On Track' : 'Off Track'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-data text-[24px] font-semibold tracking-[-0.03em] text-[#15131A] leading-none">
              {projectedYear ?? 'N/A'}
            </span>
            <span className="text-[11px] text-[#667085]">projected</span>
          </div>
          <div className="mt-1.5 text-[11px] font-data text-[#667085]">
            {annualReductionRate.toFixed(1)}% / yr · {targetYear} target
          </div>
        </div>
        <span className="w-9 h-9 rounded-xl bg-[#F1EDFF] border border-[#D9CFFA] flex items-center justify-center text-[#5625B8] shrink-0">
          <Target className="w-4 h-4" />
        </span>

      </button>
    </div>
  );
};
