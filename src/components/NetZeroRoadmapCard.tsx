import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  onExploreScenarios: () => void;
}

export const NetZeroRoadmapCard: React.FC<NetZeroRoadmapCardProps> = ({
  data,
  annualRate,
  setAnnualRate,
  targetYear,
  setTargetYear,
  onExploreScenarios
}) => {
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
  const isOnTrack = projectedAchievementYear !== null && projectedAchievementYear <= targetYear;
  const yearsLate = projectedAchievementYear && projectedAchievementYear > targetYear ? projectedAchievementYear - targetYear : 0;

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
      className="glass-card-top p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between h-full"
      aria-labelledby="netzero-roadmap-title"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E0EA]">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 id="netzero-roadmap-title" className="text-[19px] font-semibold tracking-tight text-[#15131A]">
            Net-Zero Path
          </h2>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isOnTrack
                ? 'bg-[#ECFDF3] text-[#15803D] border-[#BBF7D0]'
                : 'bg-[#FFF3EC] text-[#C2410C] border-[#FDE68A]'
            }`}
          >
            {isOnTrack ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {isOnTrack ? 'On Track' : yearsLate > 0 ? `${yearsLate} yrs behind` : 'Off Track'}
          </span>
        </div>

        <button
          type="button"
          onClick={onExploreScenarios}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E0D2FF] bg-[#F6F0FF]/90 px-3 py-1.5 text-[11px] font-semibold text-[#5625B8] hover:bg-[#EFE5FF] transition-colors cursor-pointer"
        >
          <span>Planner</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Customer-Friendly Visual Status Strip */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl bg-[#F6F3FC]/85 border border-[#E5DDF5] px-3 py-2">
          <div className="text-[10px] text-[#667085] font-medium">Today ({currentYear})</div>
          <div className="font-data text-[16px] font-semibold text-[#5625B8] mt-0.5">
            {formatCompactTonnes(currentEmissions)} <span className="text-[10px] font-normal text-[#85808D]">t</span>
          </div>
        </div>
        <div className="rounded-xl bg-[#EAF8F5]/75 border border-[#C4ECE1] px-3 py-2">
          <div className="text-[10px] text-[#238C78] font-medium">{targetYear} Goal (-90%)</div>
          <div className="font-data text-[16px] font-semibold text-[#238C78] mt-0.5">
            {formatCompactTonnes(threshold)} <span className="text-[10px] font-normal">t</span>
          </div>
        </div>
        <div className={`rounded-xl border px-3 py-2 ${remainingGap > 0 ? 'bg-[#FFF5EE]/85 border-[#F9E2BF]' : 'bg-[#ECFDF3]/85 border-[#BBF7D0]'}`}>
          <div className="text-[10px] text-[#667085] font-medium">{targetYear} Gap</div>
          <div className={`font-data text-[16px] font-semibold mt-0.5 ${remainingGap > 0 ? 'text-[#C2410C]' : 'text-[#15803D]'}`}>
            {remainingGap > 0 ? `+${formatCompactTonnes(remainingGap)}` : '0'} <span className="text-[10px] font-normal">t</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/75 border border-[#E5E0EA] px-3 py-2">
          <div className="text-[10px] text-[#667085] font-medium">Reaches Goal</div>
          <div className="font-data text-[16px] font-semibold text-[#15131A] mt-0.5">
            {projectedAchievementYear ?? 'Not Met'}
          </div>
        </div>
      </div>

      {/* Visual Journey Progress Bar (2020 -> Today -> 2040 Goal) */}
      <div className="mt-2.5 px-1">
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
      <div className="my-1.5">
        <NetZeroForecastChart
          points={points}
          thresholdTonnes={threshold}
          targetYear={targetYear}
          compact
        />
      </div>

      {/* Intuitive Pace Controls + 1-Click Presets */}
      <div className="pt-2.5 border-t border-[#E5E0EA] space-y-2 text-[11px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[10px] text-[#667085]">
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1 rounded-full bg-[#5625B8] inline-block" />Measured</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1 rounded-full bg-[#F46A1F] inline-block" />Current Pace</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1 rounded-full bg-[#238C78] inline-block" />Goal Path</span>
          </div>

          <div className="inline-flex items-center rounded-lg border border-[#D8D2DF] bg-[#EEEAF5] p-0.5" role="group" aria-label="Target year">
            {[2035, 2040, 2050].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setTargetYear(yr)}
                className={`px-2 py-0.5 rounded-md font-data text-[10px] font-medium transition-colors cursor-pointer ${
                  targetYear === yr ? 'bg-[#5625B8] text-white' : 'text-[#667085] hover:text-[#15131A]'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
