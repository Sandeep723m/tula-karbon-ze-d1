import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Compass, Milestone, ShieldCheck } from 'lucide-react';
import { YearEmissionsData } from '../../types';
import {
  computeProjectedThresholdYear,
  DECARB_LEVERS,
  HISTORICAL_INVENTORY,
  NET_ZERO_MILESTONES,
  projectEmissions
} from '../../data/intelligenceData';
import { AnalyticsCard } from '../charts/AnalyticsCard';
import {
  MaccChart,
  NetZeroForecastChart,
  PathwayYearPoint,
  SegmentedProgress
} from '../charts/AnalyticsCharts';
import { formatCompactTonnes, scaleByGross } from '../../utils/analytics';

interface NetZeroPathwayViewProps {
  data: YearEmissionsData;
  annualRate: number;
  setAnnualRate: (r: number) => void;
  targetYear: number;
  setTargetYear: (y: number) => void;
}

export const NetZeroPathwayView: React.FC<NetZeroPathwayViewProps> = ({
  data,
  annualRate,
  setAnnualRate,
  targetYear,
  setTargetYear
}) => {
  const reduceMotion = useReducedMotion();
  const [enabledLevers, setEnabledLevers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DECARB_LEVERS.map((l) => [l.id, l.enabledByDefault]))
  );

  const baseline = scaleByGross(180000, data.totalEmissions);
  const threshold = Math.round(baseline * 0.1);
  const currentYear = data.year;
  const currentEmissions = data.totalEmissions;

  const leverAbatement = DECARB_LEVERS.reduce(
    (sum, l) => (enabledLevers[l.id] ? sum + scaleByGross(l.annualAbatement, data.totalEmissions) : sum),
    0
  );
  const leverBonusRate = Number(((leverAbatement / Math.max(currentEmissions, 1)) * 18).toFixed(1));
  const effectiveRate = Number(Math.min(20, annualRate + leverBonusRate * 0.2).toFixed(1));

  const requiredRate = (() => {
    const years = Math.max(1, targetYear - currentYear);
    return Number(((1 - Math.pow(threshold / Math.max(currentEmissions, 1), 1 / years)) * 100).toFixed(1));
  })();

  const projectedAtTarget = projectEmissions(currentEmissions, effectiveRate, currentYear, targetYear);
  const gapAtTarget = Math.max(0, projectedAtTarget - threshold);
  const projectedYear = computeProjectedThresholdYear(currentEmissions, effectiveRate, currentYear, threshold);

  const reductionRequired = baseline - threshold;
  const reductionAchieved = Math.max(0, baseline - currentEmissions);
  const targetCompletionPct = Math.min(100, Math.round((reductionAchieved / Math.max(reductionRequired, 1)) * 100));

  const endYear = Math.max(2040, targetYear);
  const points: PathwayYearPoint[] = [];
  for (let yr = 2020; yr <= endYear; yr += 1) {
    const hist = HISTORICAL_INVENTORY.find((h) => h.year === yr);
    const actualVal = yr <= currentYear ? (yr === currentYear ? currentEmissions : hist ? scaleByGross(hist.gross, data.totalEmissions) : undefined) : undefined;
    const forecastVal = yr <= currentYear ? (actualVal ?? currentEmissions) : projectEmissions(currentEmissions, effectiveRate, currentYear, yr);
    const requiredVal = yr <= currentYear ? (actualVal ?? currentEmissions) : projectEmissions(currentEmissions, requiredRate, currentYear, yr);
    const spread = Math.max(0, yr - currentYear) * 0.015;
    points.push({
      year: yr,
      actual: actualVal,
      forecast: forecastVal,
      required: requiredVal,
      upperBand: yr > currentYear ? Math.round(forecastVal * (1 + spread)) : undefined,
      lowerBand: yr > currentYear ? Math.max(0, Math.round(forecastVal * (1 - spread))) : undefined
    });
  }

  const toggleLever = (id: string) => setEnabledLevers((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: '2020 Baseline', val: formatCompactTonnes(baseline), sub: 'tCO₂e' },
          { label: `FY ${currentYear}`, val: formatCompactTonnes(currentEmissions), sub: 'tCO₂e' },
          { label: `${targetYear} Threshold`, val: formatCompactTonnes(threshold), sub: '-90% gross' },
          { label: 'Required CAGR', val: `${requiredRate}%`, sub: '/ year', accent: '#238C78' },
          { label: 'Effective Rate', val: `${effectiveRate}%`, sub: '/ year', accent: '#5625B8' },
          { label: 'Projected Year', val: projectedYear ? String(projectedYear) : 'Not Met', sub: gapAtTarget > 0 ? `${formatCompactTonnes(gapAtTarget)} gap` : 'On target', accent: gapAtTarget > 0 ? '#C2410C' : '#15803D' }
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card-top px-3.5 py-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-[#667085]">{kpi.label}</div>
            <div className="mt-1 font-data text-[20px] font-semibold" style={{ color: kpi.accent ?? '#15131A' }}>
              {kpi.val}
            </div>
            <div className="text-[10px] text-[#85808D]">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
          <AnalyticsCard
            title={`Net-Zero Trajectory (2020–${endYear})`}
            badge={<span className="font-data text-[10px] text-[#5625B8] bg-[#F1EDFF] px-2 py-0.5 rounded-full">SBTi Model</span>}
            actions={
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'BAU', rate: 0 },
                  { label: '3.9%', rate: 3.9 },
                  { label: '9.0%', rate: 9.0 },
                  { label: '13.7%', rate: 13.7 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAnnualRate(preset.rate)}
                    className={`hidden sm:inline-flex px-2.5 py-1 rounded-md font-data text-[10px] font-medium border cursor-pointer ${
                      Math.abs(annualRate - preset.rate) < 0.2
                        ? 'bg-[#5625B8] text-white border-[#5625B8]'
                        : 'bg-white text-[#667085] border-[#D8D2DF] hover:text-[#15131A]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            }
          >
            <NetZeroForecastChart points={points} thresholdTonnes={threshold} targetYear={targetYear} />

            <div className="mt-4 pt-3 border-t border-[#E5E0EA] flex flex-wrap items-center justify-between gap-4 text-[12px]">
              <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                <Compass className="w-4 h-4 text-[#5625B8] shrink-0" />
                <span className="text-[#667085] font-medium">Rate</span>
                <input
                  type="range"
                  min={0}
                  max={18}
                  step={0.5}
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Number(e.target.value))}
                  className="flex-1 accent-[#5625B8] cursor-pointer"
                />
                <span className="font-data font-semibold text-[#5625B8]">{annualRate.toFixed(1)}%</span>
              </div>

              <div className="inline-flex items-center rounded-lg border border-[#D8D2DF] bg-[#EEEAF5] p-0.5">
                {[2035, 2040, 2050].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setTargetYear(yr)}
                    className={`px-2.5 py-1 rounded-md font-data text-[11px] font-medium cursor-pointer ${
                      targetYear === yr ? 'bg-[#5625B8] text-white' : 'text-[#667085]'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {effectiveRate <= 0 && (
              <div className="mt-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11px] text-[#B91C1C]">
                Not projected to meet target under current assumptions (0% reduction rate).
              </div>
            )}
          </AnalyticsCard>
        </div>

        <div className="xl:col-span-4">
          <AnalyticsCard
            title="Decarbonisation Levers"
            badge={<span className="font-data text-[10px] font-semibold text-[#15803D] bg-[#ECFDF3] px-2 py-0.5 rounded-full">-{formatCompactTonnes(leverAbatement)} t/yr</span>}
          >
            <div className="space-y-2 max-h-[345px] overflow-y-auto pr-1">
              {DECARB_LEVERS.map((lev) => {
                const on = enabledLevers[lev.id];
                const ab = scaleByGross(lev.annualAbatement, data.totalEmissions);
                return (
                  <button
                    key={lev.id}
                    type="button"
                    onClick={() => toggleLever(lev.id)}
                    className={`w-full text-left rounded-xl border p-2.5 transition-colors cursor-pointer ${
                      on ? 'bg-[#F1EDFF]/75 border-[#5625B8]/40' : 'bg-white/60 border-[#E5E0EA] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            on ? 'bg-[#5625B8] border-[#5625B8] text-white' : 'bg-white border-[#C7BED3]'
                          }`}
                        >
                          {on && <Check className="w-3 h-3" />}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold text-[#15131A] leading-snug">{lev.name}</div>
                          <div className="text-[10px] text-[#667085] mt-0.5">
                            {lev.scope} · {lev.startYear} · {lev.costPerTonne < 0 ? `-$${Math.abs(lev.costPerTonne)}/t` : `$${lev.costPerTonne}/t`}
                          </div>
                        </div>
                      </div>
                      <span className="font-data text-[11px] font-semibold text-[#5625B8] shrink-0">
                        -{formatCompactTonnes(ab)} t
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </AnalyticsCard>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-6">
          <AnalyticsCard title="Marginal Abatement Cost Curve">
            <MaccChart levers={DECARB_LEVERS} />
          </AnalyticsCard>
        </div>

        <div className="xl:col-span-6">
          <AnalyticsCard title="Milestones & Target Progress">
            <div className="mb-4">
              <SegmentedProgress
                value={targetCompletionPct}
                segments={28}
                color="#5625B8"
                label={`${formatCompactTonnes(reductionAchieved)} / ${formatCompactTonnes(reductionRequired)} tCO₂e abated`}
              />
            </div>

            <div className="space-y-2">
              {NET_ZERO_MILESTONES.map((ms) => (
                <div key={ms.year} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E0EA] bg-white/65 px-3 py-2 text-[11px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Milestone className="w-3.5 h-3.5 text-[#5625B8] shrink-0" />
                    <span className="font-data font-semibold text-[#15131A]">{ms.year}</span>
                    <span className="font-medium text-[#15131A] truncate">{ms.title}</span>
                  </div>
                  <span className="font-data font-semibold text-[#5625B8] shrink-0">
                    {scaleByGross(ms.targetTonnes, data.totalEmissions).toLocaleString()} t
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E5E0EA] flex items-center justify-between text-[11px] text-[#667085]">
              <span className="inline-flex items-center gap-1.5 text-[#15803D] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Retired Carbon Removals
              </span>
              <span className="font-data font-semibold text-[#15131A]">{data.totalOffset.toLocaleString()} tCO₂e</span>
            </div>
          </AnalyticsCard>
        </div>
      </div>
    </motion.div>
  );
};
