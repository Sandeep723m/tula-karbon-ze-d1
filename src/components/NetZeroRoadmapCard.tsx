import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { YearEmissionsData } from '../types';
import { NetZeroForecastChart, PathwayYearPoint } from './charts/AnalyticsCharts';
import {
  computeProjectedThresholdYear,
  HISTORICAL_INVENTORY,
  projectEmissions
} from '../data/intelligenceData';
import { formatCompactTonnes, scaleByGross } from '../utils/analytics';

interface NetZeroRoadmapCardProps {
  data: YearEmissionsData;
  annualRate: number;
  setAnnualRate: (rate: number) => void;
  targetYear: number;
  setTargetYear: (year: number) => void;
}

export const NetZeroRoadmapCard: React.FC<NetZeroRoadmapCardProps> = ({
  data,
  annualRate,
  setAnnualRate,
  targetYear,
  setTargetYear
}) => {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const baseline = scaleByGross(180000, data.totalEmissions);
  const threshold = Math.round(baseline * 0.1);
  const currentYear = data.year;
  const currentEmissions = data.totalEmissions;

  const requiredRate = (() => {
    const years = Math.max(1, targetYear - currentYear);
    const ratio = threshold / Math.max(currentEmissions, 1);
    return Number(((1 - Math.pow(ratio, 1 / years)) * 100).toFixed(1));
  })();

  const projectedAtTarget = projectEmissions(currentEmissions, annualRate, currentYear, targetYear);
  const remainingGap = Math.max(0, projectedAtTarget - threshold);
  const projectedAchievementYear = computeProjectedThresholdYear(currentEmissions, annualRate, currentYear, threshold);

  const reductionRequired = Math.max(1, baseline - threshold);
  const reductionDone = Math.max(0, baseline - currentEmissions);
  const progressPct = Math.min(100, Math.round((reductionDone / reductionRequired) * 100));

  const endYear = Math.max(2040, targetYear);
  const points: PathwayYearPoint[] = [];

  for (let yr = 2020; yr <= endYear; yr += 1) {
    const hist = HISTORICAL_INVENTORY.find((h) => h.year === yr);
    const actualVal = yr <= currentYear ? (yr === currentYear ? currentEmissions : hist ? scaleByGross(hist.gross, data.totalEmissions) : undefined) : undefined;
    const forecastVal =
      yr <= currentYear
        ? (actualVal ?? currentEmissions)
        : projectEmissions(currentEmissions, annualRate, currentYear, yr);
    const requiredVal =
      yr <= currentYear
        ? (actualVal ?? currentEmissions)
        : projectEmissions(currentEmissions, requiredRate, currentYear, yr);

    const yearsAhead = Math.max(0, yr - currentYear);
    const bandSpread = yearsAhead * 0.015;

    points.push({
      year: yr,
      actual: actualVal,
      forecast: forecastVal,
      required: requiredVal,
      upperBand: yr > currentYear ? Math.round(forecastVal * (1 + bandSpread)) : undefined,
      lowerBand: yr > currentYear ? Math.max(0, Math.round(forecastVal * (1 - bandSpread))) : undefined
    });
  }

  return (
    <section
      className="glass-card-top p-3 sm:p-4 xl:p-3 relative overflow-visible flex flex-col justify-between h-full"
      aria-labelledby="netzero-roadmap-title"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E5E0EA]">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 id="netzero-roadmap-title" className="text-[17px] xl:text-[16px] font-semibold tracking-tight text-[#15131A]">
            Net-Zero Path
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-[#D8D2DF] bg-[#F3F0F6] p-0.5" role="group" aria-label="Choose net-zero target year">
            {[2030, 2035, 2040, 2050].map((yr) => <button
              key={yr}
              type="button"
              onClick={() => setTargetYear(yr)}
              aria-pressed={targetYear === yr}
              className={`rounded-md px-2.5 py-1.5 font-data text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7541DD] ${targetYear === yr ? 'bg-white text-[#5625B8] shadow-sm' : 'text-[#667085] hover:text-[#15131A]'}`}
            >{yr}</button>)}
          </div>
          <div className="relative">
            <button type="button" aria-label="Show net-zero summary" aria-expanded={summaryOpen} onClick={() => setSummaryOpen((open) => !open)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${summaryOpen ? 'border-[#5625B8]/40 bg-[#F1EDFF] text-[#5625B8]' : 'border-[#D8D2DF] bg-white/80 text-[#667085] hover:bg-[#F1EDFF] hover:text-[#5625B8]'}`}>
              <Info className="h-4 w-4" />
            </button>
            {summaryOpen && <div className="absolute right-0 top-full z-40 mt-2 grid w-72 grid-cols-2 gap-2 rounded-xl border border-[#D8D2DF] bg-white/95 p-2.5 shadow-[0_12px_30px_rgba(21,19,26,.16)] backdrop-blur-md sm:w-80" aria-label="Net-zero summary metrics">
              <div className="rounded-lg border border-[#E5DDF5] bg-[#F6F3FC]/85 px-2.5 py-2">
                <div className="text-[10px] text-[#667085] font-medium">Today ({currentYear})</div>
                <div className="mt-0.5 font-data text-[15px] font-semibold text-[#5625B8]">{formatCompactTonnes(currentEmissions)} <span className="text-[10px] font-normal text-[#85808D]">t</span></div>
              </div>
              <div className="rounded-lg border border-[#C4ECE1] bg-[#EAF8F5]/75 px-2.5 py-2">
                <div className="text-[10px] text-[#238C78] font-medium">{targetYear} Goal (-90%)</div>
                <div className="mt-0.5 font-data text-[15px] font-semibold text-[#238C78]">{formatCompactTonnes(threshold)} <span className="text-[10px] font-normal">t</span></div>
              </div>
              <div className={`rounded-lg border px-2.5 py-2 ${remainingGap > 0 ? 'bg-[#FFF5EE]/85 border-[#F9E2BF]' : 'bg-[#ECFDF3]/85 border-[#BBF7D0]'}`}>
                <div className="text-[10px] text-[#667085] font-medium">{targetYear} Gap</div>
                <div className={`mt-0.5 font-data text-[15px] font-semibold ${remainingGap > 0 ? 'text-[#C2410C]' : 'text-[#15803D]'}`}>{remainingGap > 0 ? `+${formatCompactTonnes(remainingGap)}` : '0'} <span className="text-[10px] font-normal">t</span></div>
              </div>
              <div className="rounded-lg border border-[#E5E0EA] bg-white/75 px-2.5 py-2">
                <div className="text-[10px] text-[#667085] font-medium">Reaches Goal</div>
                <div className="mt-0.5 font-data text-[15px] font-semibold text-[#15131A]">{projectedAchievementYear ?? 'Not Met'}</div>
              </div>
            </div>}
          </div>
        </div>
      </div>

      {/* Visual Journey Progress Bar (2020 -> Today -> 2040 Goal) */}
      <div className="mt-3 px-0.5">
        <div className="flex items-center justify-between text-[10px] font-data text-[#667085] mb-1">
          <span>2020 ({formatCompactTonnes(baseline)})</span>
          <span className="font-semibold text-[#5625B8]">{progressPct}% to Goal</span>
          <span>{targetYear} ({formatCompactTonnes(threshold)})</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#EEEAF5] overflow-hidden flex">
          <div className="h-full rounded-full bg-gradient-to-r from-[#5625B8] to-[#238C78] transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Visual Gap-Shaded Pathway Chart */}
      <div className="my-3">
        <NetZeroForecastChart
          points={points}
          thresholdTonnes={threshold}
          targetYear={targetYear}
        />
      </div>

      {/* Intuitive Pace Controls + 1-Click Presets */}
      <div className="pt-2.5 border-t border-[#E5E0EA] space-y-2 text-[10px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[#667085] font-medium whitespace-nowrap">Cut Pace</span>
            <input
              type="range"
              min={0}
              max={18}
              step={0.5}
              value={annualRate}
              aria-label="Annual emissions reduction rate percentage"
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="flex-1 accent-[#5625B8] cursor-pointer"
            />
            <span className="font-data font-semibold text-[#5625B8] bg-[#F1EDFF] px-2 py-0.5 rounded-md min-w-[52px] text-center">
              {annualRate.toFixed(1)}%/yr
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { label: 'Current', rate: 3.9 },
              { label: 'Planned', rate: 9.0 },
              { label: 'Goal Pace', rate: requiredRate }
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAnnualRate(p.rate)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                  Math.abs(annualRate - p.rate) < 0.2
                    ? 'bg-[#5625B8] text-white border-[#5625B8]'
                    : 'bg-white text-[#494454] border-[#D8D2DF] hover:bg-[#F1EDFF]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2">
          <div className="flex items-center gap-3 text-[10px] text-[#667085]">
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1 rounded-full bg-[#5625B8] inline-block" />Measured</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1 rounded-full bg-[#F46A1F] inline-block" />Current Pace</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1 rounded-full bg-[#238C78] inline-block" />Goal Path</span>
          </div>

        </div>
      </div>
    </section>
  );
};
