import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { DATA_QUALITY_METRICS } from '../data/intelligenceData';
import { MicroDotMatrix } from './charts/AnalyticsCharts';

interface DataQualityCardProps {
  onOpenQualityView: () => void;
}

const colorMap = {
  approved: '#15803D',
  warning: '#D97706',
  submitted: '#5625B8'
};

export const DataQualityCard: React.FC<DataQualityCardProps> = ({ onOpenQualityView }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="glass-card-top p-4 sm:p-5 flex flex-col justify-between h-full" aria-labelledby="data-quality-title">
      {/* Unified Single-Line Header (No Icon Box) */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E0EA] min-h-[44px]">
        <h2 id="data-quality-title" className="text-[17px] font-semibold tracking-tight text-[#15131A] whitespace-nowrap">
          Reporting Confidence
        </h2>

        <button
          type="button"
          onClick={onOpenQualityView}
          className="inline-flex items-center gap-1 rounded-full border border-[#D8D2DF] bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#5625B8] hover:bg-[#F1EDFF] transition-colors cursor-pointer shrink-0"
        >
          <span>Audit</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 2x2 Dot Matrix Grid filling vertical height cleanly */}
      <div className="flex-1 grid grid-cols-2 gap-3 pt-3.5 content-stretch">
        {DATA_QUALITY_METRICS.map((metric) => {
          const isHovered = hoveredId === metric.id;
          return (
            <div
              key={metric.id}
              onMouseEnter={() => setHoveredId(metric.id)}
              onMouseLeave={() => setHoveredId(null)}
              tabIndex={0}
              onFocus={() => setHoveredId(metric.id)}
              onBlur={() => setHoveredId(null)}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-colors cursor-pointer outline-none relative ${
                isHovered ? 'bg-white border-[#5625B8]/40 shadow-sm' : 'bg-white/70 border-[#E5E0EA]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="font-data text-[24px] font-semibold text-[#15131A] leading-none">
                  {metric.percent}%
                </span>
                <span className="font-data text-[10px] text-[#85808D]">
                  {metric.numerator >= 1000 ? `${Math.round(metric.numerator / 1000)}k` : metric.numerator}/
                  {metric.denominator >= 1000 ? `${Math.round(metric.denominator / 1000)}k` : metric.denominator}
                </span>
              </div>

              <div className="my-2">
                <MicroDotMatrix percent={metric.percent} color={colorMap[metric.status]} />
              </div>

              <div className="text-[11px] font-medium text-[#15131A] leading-snug">{metric.label}</div>

              {isHovered && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 -top-9 -translate-x-1/2 z-20 rounded-lg border border-[#D8D2DF] bg-white/95 px-2.5 py-1 text-[10px] text-[#15131A] shadow-md whitespace-nowrap"
                >
                  {metric.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
