import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { MonthlyEmissions, YearEmissionsData } from '../types';

interface MonthlyTimelineCardProps {
  data: YearEmissionsData;
}

type Geometry = 'solid' | 'dots' | 'stripes';

const geometries: { id: Geometry; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dots', label: 'Dots' },
  { id: 'stripes', label: 'Stripes' }
];

const formatEmission = (value: number) => Math.round(value).toLocaleString();
const monthName = (month: string) => month;

function axisLabel(value: number) {
  if (!value) return '0';
  if (value >= 1000) return `${Number((value / 1000).toFixed(1))}k`;
  return Math.round(value).toLocaleString();
}

function axisMaximum(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((candidate) => candidate >= normalized) ?? 10;
  return step * magnitude;
}

export const MonthlyTimelineCard: React.FC<MonthlyTimelineCardProps> = ({ data }) => {
  const [geometry, setGeometry] = useState<Geometry>('solid');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, amount: 0.18 });
  const hasEntered = useRef(false);
  const chartId = `monthly-emissions-${useId().replace(/:/g, '')}`;
  const months: MonthlyEmissions[] = data.monthly;
  const values = months.map((month) => month.total);
  const total = data.totalEmissions;
  const maxValue = Math.max(0, ...values);
  const maxAxis = axisMaximum(maxValue);
  const activeIndex = hoveredIndex ?? selectedIndex;
  const activeMonth = activeIndex === null ? null : months[activeIndex];
  const totalChange = (index: number) => index > 0 ? values[index] - values[index - 1] : null;

  const chartWidth = 1000;
  const chartHeight = 350;
  const plotLeft = 80;
  const plotRight = 990;
  const plotTop = 24;
  const plotBottom = 276;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const cellWidth = plotWidth / Math.max(months.length, 1);
  const barWidth = Math.min(56, cellWidth * 0.66);
  const xFor = (index: number) => plotLeft + (index + 0.5) * cellWidth;
  const yFor = (value: number) => plotBottom - (value / maxAxis) * plotHeight;
  const ticks = Array.from({ length: 5 }, (_, index) => maxAxis * (1 - index / 4));
  const activeTooltip = activeIndex !== null && activeMonth ? {
    left: `${Math.max(12, Math.min(88, (xFor(activeIndex) / chartWidth) * 100))}%`,
    current: values[activeIndex],
    previous: activeIndex > 0 ? values[activeIndex - 1] : null,
    change: totalChange(activeIndex)
  } : null;

  useEffect(() => {
    if (chartInView) hasEntered.current = true;
  }, [chartInView]);

  const playEntrance = chartInView && !hasEntered.current;
  const opacityFor = (index: number) => {
    if (selectedIndex !== null) return selectedIndex === index ? 1 : 0.5;
    if (hoveredIndex !== null) return hoveredIndex === index ? 1 : 0.56;
    return 1;
  };

  const handlePointKeyDown = (event: React.KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + months.length) % months.length;
      setFocusIndex(next);
      event.currentTarget.parentElement?.querySelectorAll<SVGGElement>('[data-month-point]')[next]?.focus();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedIndex((current) => current === index ? null : index);
    }
    if (event.key === 'Escape') {
      setHoveredIndex(null);
      setSelectedIndex(null);
    }
  };

  const toggleSelected = (index: number) => setSelectedIndex((current) => current === index ? null : index);
  const firstMonth = months[0]?.month ?? '';
  const lastMonth = months[months.length - 1]?.month ?? '';
  const rangeLabel = months.length ? `${monthName(firstMonth)} – ${monthName(lastMonth)}` : 'No reporting period';

  return (
    <section className="glass-card-top relative flex h-full min-h-[460px] flex-col overflow-hidden p-4 sm:min-h-[500px] sm:p-5" aria-labelledby="monthly-emissions-title">
        <header className="flex items-center justify-between gap-4">
          <h2 id="monthly-emissions-title" className="text-[19px] font-semibold leading-snug tracking-tight text-[#15131A] sm:text-[20px]">Monthly emissions</h2>
          <span className="shrink-0 text-[12px] text-[#667085]">Illustrative data</span>
        </header>

        <div className="mt-6 sm:mt-7">
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            <span className="font-data text-[32px] font-semibold leading-none tracking-[-0.04em] text-[#16132B] sm:text-[36px]">{formatEmission(total)}</span>
            <span className="text-[13px] font-medium text-[#667085]">tCO₂e</span>
          </div>
          <p className="mt-2 text-[12px] font-normal text-[#667085]">{rangeLabel}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 sm:mt-6">
          <span className="text-[12px] font-medium text-[#667085]">Chart geometry</span>
          <div role="group" aria-label="Chart geometry" className="inline-flex items-center gap-0.5 rounded-lg border border-[#D8D2DF] bg-[#EEEAF5] p-1">
            {geometries.map((option) => <button
              key={option.id}
              type="button"
              aria-pressed={geometry === option.id}
              onClick={() => setGeometry(option.id)}
              className={`rounded-md px-3.5 py-1.5 text-[12px] font-medium transition-[color,background-color,box-shadow] duration-200 sm:px-4 ${geometry === option.id ? 'bg-[#5625B8] text-white shadow-sm' : 'text-[#625B6B] hover:text-[#15131A]'}`}
            >{option.label}</button>)}
          </div>
        </div>

        <div ref={chartRef} className="relative mt-3 min-h-[205px] flex-1 sm:mt-4 sm:min-h-[230px]" onMouseLeave={() => setHoveredIndex(null)}>
          {activeTooltip && activeMonth && <div role="tooltip" className="pointer-events-none absolute top-1 z-10 min-w-[180px] -translate-x-1/2 rounded-xl border border-[#E4DFEF] bg-white/95 px-3 py-2 shadow-[0_5px_16px_rgba(29,20,54,.12)] backdrop-blur-md" style={{ left: activeTooltip.left }}>
            <p className="mb-1 text-[11px] font-semibold text-[#282431]">{activeMonth.month} {data.year}</p>
            <p className="text-[10px] text-[#686473]">Emissions <span className="float-right font-data font-semibold text-[#26232F]">{formatEmission(activeTooltip.current)} tCO₂e</span></p>
            {activeTooltip.previous !== null && <>
              <p className="text-[10px] text-[#686473]">Previous month <span className="float-right font-data text-[#26232F]">{formatEmission(activeTooltip.previous)} tCO₂e</span></p>
              <p className="text-[10px] text-[#686473]">Change <span className={`float-right font-data font-semibold ${(activeTooltip.change ?? 0) > 0 ? 'text-[#B95A24]' : 'text-[#6242C7]'}`}>{(activeTooltip.change ?? 0) > 0 ? '+' : ''}{formatEmission(activeTooltip.change ?? 0)} tCO₂e</span></p>
            </>}
            <p className="mt-1 text-[9px] text-[#85808D]">Source: monthly emissions ledger</p>
          </div>}

          <AnimatePresence mode="wait" initial={false}>
            <motion.svg
              key={geometry}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-full w-full overflow-visible"
              role="group"
              aria-label={`Monthly emissions in ${geometry} geometry for ${data.year}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <defs>
                <linearGradient id={`${chartId}-bar`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8A6BE8" />
                  <stop offset="100%" stopColor="#D7C9FA" />
                </linearGradient>
              </defs>

              {ticks.map((tick) => {
                const y = yFor(tick);
                return <g key={`tick-${tick}`}>
                  <line x1={plotLeft} x2={plotRight} y1={y} y2={y} stroke="#DDD9E6" strokeWidth="1" strokeDasharray="4 6" />
                  <text x={plotLeft - 12} y={y + 5} textAnchor="end" fill="#667085" fontFamily="IBM Plex Sans, sans-serif" fontSize="15">{axisLabel(tick)}</text>
                </g>;
              })}

              {months.map((month, index) => {
                const value = values[index];
                const x = xFor(index);
                const y = yFor(value);
                const height = Math.max(0, plotBottom - y);
                const opacity = opacityFor(index);
                const active = activeIndex === index;
                const delay = reduceMotion || !playEntrance ? 0 : index * 0.025;
                const pointLabel = `${month.month} ${data.year}: ${formatEmission(value)} tCO₂e${index > 0 ? `, previous month ${formatEmission(values[index - 1])} tCO₂e, change ${totalChange(index)! > 0 ? '+' : ''}${formatEmission(totalChange(index)!)} tCO₂e` : ', first month in reporting period'}`;

                return <g key={`${month.month}-${index}`} data-month-point tabIndex={index === focusIndex ? 0 : -1} role="button" aria-pressed={selectedIndex === index} aria-label={pointLabel} onFocus={() => { setFocusIndex(index); setHoveredIndex(index); }} onBlur={() => setHoveredIndex(null)} onMouseEnter={() => setHoveredIndex(index)} onClick={() => toggleSelected(index)} onKeyDown={(event) => handlePointKeyDown(event, index)} className="cursor-pointer outline-none">
                  {geometry === 'solid' && <motion.rect
                    x={x - barWidth / 2}
                    width={barWidth}
                    rx="10"
                    fill={`url(#${chartId}-bar)`}
                    initial={reduceMotion ? false : { y: plotBottom, height: 0, opacity: 0 }}
                    animate={{ y: chartInView ? y : plotBottom, height: chartInView ? height : 0, opacity: chartInView ? opacity : 0 }}
                    transition={{ y: { duration: reduceMotion ? 0 : 0.6, delay, ease: [0.22, 1, 0.36, 1] }, height: { duration: reduceMotion ? 0 : 0.6, delay, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: reduceMotion ? 0 : 0.15 } }}
                  />}

                  {geometry === 'dots' && (() => {
                    const dotColumns = 7;
                    const dotRows = 30;
                    const dotPitchX = 7.2;
                    const dotPitchY = plotHeight / dotRows;
                    const filledRows = Math.round((value / maxAxis) * dotRows);
                    const startX = x - ((dotColumns - 1) * dotPitchX) / 2;
                    return <g style={{ opacity, transition: 'opacity 150ms ease' }}>
                      {Array.from({ length: filledRows * dotColumns }, (_, dotIndex) => {
                        const col = dotIndex % dotColumns;
                        const row = Math.floor(dotIndex / dotColumns);
                        return <circle key={dotIndex} cx={startX + col * dotPitchX} cy={plotBottom - dotPitchY * (row + 0.5)} r="2.35" fill="#7657DF" opacity="0.94" />;
                      })}
                    </g>;
                  })()}

                  {geometry === 'stripes' && <g style={{ opacity, transition: 'opacity 150ms ease' }}>
                    <rect x={x - barWidth / 2} y={y} width={barWidth} height={height} rx="9" fill="#F0EBFA" />
                    {Array.from({ length: 14 }, (_, stripeIndex) => {
                      const stripeWidth = 2.7;
                      const slot = barWidth / 14;
                      const stripeX = x - barWidth / 2 + stripeIndex * slot + (slot - stripeWidth) / 2;
                      return <rect key={stripeIndex} x={stripeX} y={y} width={stripeWidth} height={height} rx={stripeWidth / 2} fill={`url(#${chartId}-bar)`} />;
                    })}
                  </g>}

                  <rect x={x - cellWidth / 2} y={plotTop} width={cellWidth} height={plotBottom - plotTop + 42} fill="transparent" />
                  {active && <rect x={x - barWidth / 2 - 4} y={Math.max(plotTop, y - 4)} width={barWidth + 8} height={Math.max(height + 8, 16)} rx="12" fill="none" stroke="#6C4ADD" strokeWidth="2" className="pointer-events-none" />}
                  <text x={x} y={plotBottom + 30} textAnchor="middle" fill={active ? '#5625B8' : '#667085'} fontFamily="IBM Plex Sans, sans-serif" fontSize="15" fontWeight={active ? 500 : 400}>{month.month}</text>
                </g>;
              })}
            </motion.svg>
          </AnimatePresence>
        </div>

        <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#D8D2DF] pt-3 text-[12px] text-[#667085]">
          <span className="inline-flex items-center gap-2"><i aria-hidden="true" className="h-3 w-3 rounded-[4px] bg-[#5625B8]" />Total emissions</span>
          <span>{selectedIndex === null ? 'Hover or select a month' : `${months[selectedIndex]?.month} selected · click again to clear`}</span>
        </footer>
    </section>
  );
};
