import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Scope2Method, YearEmissionsData } from '../../types';
import { HISTORICAL_INVENTORY } from '../../data/intelligenceData';
import { AnalyticsCard } from '../charts/AnalyticsCard';
import { SmoothAreaChart, StripedBarChart, TargetBulletChart } from '../charts/AnalyticsCharts';
import { scaleByGross } from '../../utils/analytics';

interface PerformanceViewProps {
  data: YearEmissionsData;
  scope2Method: Scope2Method;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ data }) => {
  const reduceMotion = useReducedMotion();
  const [hoveredAnomaly, setHoveredAnomaly] = useState<string | null>(null);

  const historicalPoints = HISTORICAL_INVENTORY.map((h, idx) => ({
    label: String(h.year),
    value: scaleByGross(h.gross, data.totalEmissions),
    unit: 'tCO₂e',
    source: 'Illustrative inventory',
    comparison:
      idx === 0
        ? '2020 Baseline'
        : `${(((h.gross - HISTORICAL_INVENTORY[idx - 1].gross) / HISTORICAL_INVENTORY[idx - 1].gross) * 100).toFixed(1)}% YoY`
  }));

  const prevScale = data.previousYear / Math.max(data.totalEmissions, 1);
  const yoyComparisonSeries = [
    {
      id: 'prev',
      label: `FY ${data.year - 1}`,
      color: '#AC96F2',
      values: data.monthly.map((m) => Math.round(m.total * prevScale)),
      pattern: 'stripe' as const
    },
    {
      id: 'curr',
      label: `FY ${data.year}`,
      color: '#5625B8',
      values: data.monthly.map((m) => m.total),
      pattern: 'solid' as const
    }
  ];

  const anomalies = [
    {
      id: 'anom-jul',
      period: 'Jul Peak',
      facility: 'Austin Data Centre',
      delta: '+11.8%',
      cause: 'Chiller load +420 tCO₂e'
    },
    {
      id: 'anom-sep',
      period: 'Sep Gap',
      facility: 'Rotterdam Terminal',
      delta: '48h Offline',
      cause: 'Flow meter calibration (not zero-filled)'
    }
  ];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7">
          <AnalyticsCard title="Historical Trajectory (2020–2025)">
            <SmoothAreaChart data={historicalPoints} color="#5625B8" unit="tCO₂e" />
            <div className="mt-4 pt-3 border-t border-[#E5E0EA]">
              <TargetBulletChart
                value={data.totalEmissions}
                target={Math.round(scaleByGross(180000, data.totalEmissions) * 0.75)}
                max={Math.round(scaleByGross(180000, data.totalEmissions) * 1.05)}
                unit="tCO₂e"
                label={`FY ${data.year} vs -25% interim target`}
              />
            </div>
          </AnalyticsCard>
        </div>

        <div className="xl:col-span-5">
          <AnalyticsCard title="Anomaly Detection">
            <div className="space-y-3">
              {anomalies.map((a) => (
                <div
                  key={a.id}
                  onMouseEnter={() => setHoveredAnomaly(a.id)}
                  onMouseLeave={() => setHoveredAnomaly(null)}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    hoveredAnomaly === a.id ? 'bg-white border-[#F46A1F]/60 shadow-xs' : 'bg-white/70 border-[#E5E0EA]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#15131A]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                      {a.facility}
                    </span>
                    <span className="font-data text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                      {a.period} · {a.delta}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-[#667085]">{a.cause}</div>
                </div>
              ))}

              <div className="rounded-xl border border-[#BBF7D0] bg-[#ECFDF3]/75 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#15803D]" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#15803D]">Intensity Decoupling</div>
                    <div className="text-[10px] text-[#166534]">Output +6.8% · Emissions -3.0%</div>
                  </div>
                </div>
                <span className="font-data text-[12px] font-semibold text-[#15803D]">-22.2%</span>
              </div>
            </div>
          </AnalyticsCard>
        </div>
      </div>

      <AnalyticsCard title={`FY ${data.year} vs FY ${data.year - 1} Comparison`}>
        <StripedBarChart labels={data.monthly.map((m) => m.month)} series={yoyComparisonSeries} unit="tCO₂e" height={200} />
      </AnalyticsCard>
    </motion.div>
  );
};
