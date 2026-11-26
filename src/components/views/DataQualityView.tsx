import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Clock, FileWarning, ShieldCheck } from 'lucide-react';
import { YearEmissionsData } from '../../types';
import { DATA_QUALITY_METRICS } from '../../data/intelligenceData';
import { AnalyticsCard } from '../charts/AnalyticsCard';
import { MicroDotMatrix, SegmentedProgress } from '../charts/AnalyticsCharts';

interface DataQualityViewProps {
  data: YearEmissionsData;
}

const statusStyles = {
  approved: { color: '#15803D', badge: 'bg-[#ECFDF3] text-[#15803D] border-[#BBF7D0]', label: 'Ready' },
  warning: { color: '#D97706', badge: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]', label: 'Review' },
  submitted: { color: '#5625B8', badge: 'bg-[#F1EDFF] text-[#5625B8] border-[#D9CFFA]', label: 'In Progress' }
};

export const DataQualityView: React.FC<DataQualityViewProps> = ({ data }) => {
  const reduceMotion = useReducedMotion();

  const methodSplit = [
    { label: 'Activity-based', pct: 62, color: '#5625B8' },
    { label: 'Spend-based', pct: 24, color: '#F46A1F' },
    { label: 'Supplier-specific', pct: 14, color: '#238C78' }
  ];

  const ledgerChecks = [
    { metric: 'Missing activity records', value: '52', scope: 'Utility & Freight Q4', action: 'Sync ERP', state: 'warning' },
    { metric: 'Missing evidence docs', value: '83', scope: 'Scope 3 Logistics', action: 'Request PDFs', state: 'warning' },
    { metric: 'Validation flags', value: '7', scope: 'Unit mismatch', action: 'Resolve', state: 'warning' },
    { metric: 'Inventory snapshot', value: `FY ${data.year}`, scope: 'Illustrative sample', action: 'View', state: 'ok' }
  ];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {DATA_QUALITY_METRICS.map((m) => {
          const st = statusStyles[m.status];
          return (
            <div key={m.id} className="glass-card-top p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-[#15131A]">{m.label}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.badge}`}>{st.label}</span>
              </div>

              <div className="my-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-data text-[30px] font-semibold text-[#15131A] leading-none">{m.percent}%</div>
                  <div className="mt-1 font-data text-[10px] text-[#667085]">
                    {m.numerator.toLocaleString()} / {m.denominator.toLocaleString()}
                  </div>
                </div>
                <MicroDotMatrix percent={m.percent} color={st.color} />
              </div>

              <div className="pt-2.5 border-t border-[#E5E0EA] text-[10px] text-[#667085]">{m.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5">
          <AnalyticsCard title="Calculation Methodology Mix">
            <div className="space-y-4 mt-1">
              {methodSplit.map((item) => (
                <SegmentedProgress key={item.label} value={item.pct} segments={24} color={item.color} label={item.label} />
              ))}
            </div>
          </AnalyticsCard>
        </div>

        <div className="xl:col-span-7">
          <AnalyticsCard title="Reporting Readiness & Exceptions">
            <div className="space-y-2.5">
              {ledgerChecks.map((row) => (
                <div key={row.metric} className="rounded-xl border border-[#E5E0EA] bg-white/70 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-2.5">
                    {row.state === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                    ) : (
                      <FileWarning className="w-4 h-4 text-[#D97706] shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-[#15131A]">{row.metric}</div>
                      <div className="text-[10px] text-[#667085]">{row.scope}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-data font-semibold text-[#15131A]">{row.value}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F7F5F2] border border-[#D8D2DF] text-[#494454] inline-flex items-center gap-1">
                      {row.state === 'ok' ? <ShieldCheck className="w-3 h-3 text-[#15803D]" /> : <Clock className="w-3 h-3 text-[#D97706]" />}
                      {row.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AnalyticsCard>
        </div>
      </div>
    </motion.div>
  );
};
