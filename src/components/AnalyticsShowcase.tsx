import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { YearEmissionsData } from '../types';
import {
  CapsuleDivergingChart,
  ChartStatus,
  ChartSeries,
  ConnectedStackedArea,
  DotMatrixChart,
  HatchedColumns,
  RoundedBubblePlot,
  SegmentedDonut,
  SegmentedProgress,
  SegmentedRadialGauge,
  SmoothAreaChart,
  StripedBarChart,
  TargetBulletChart
} from './charts/AnalyticsCharts';
import { AnalyticsCard } from './charts/AnalyticsCard';

interface AnalyticsShowcaseProps {
  data: YearEmissionsData;
}

type PreviewState = 'ready' | 'loading' | 'empty' | 'error';

function ShowcaseCard({ title, subtitle, children, className = '' }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return <motion.div
    className="min-w-0"
    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: reduceMotion ? 0 : 0.36, ease: [0.2, 0.8, 0.2, 1] }}
  >
    <AnalyticsCard title={title} subtitle={subtitle} className={className}>{children}</AnalyticsCard>
  </motion.div>;
}

export function AnalyticsShowcase({ data }: AnalyticsShowcaseProps) {
  const [previewState, setPreviewState] = useState<PreviewState>('ready');
  const reduceMotion = useReducedMotion();
  const monthlyPoints = useMemo(() => data.monthly.map((month, index) => ({
    label: month.month,
    value: month.total,
    unit: 'tCO₂e',
    source: 'Monthly emissions ledger',
    comparison: index === 0 ? 'First month in period' : `${(month.total - data.monthly[index - 1].total) > 0 ? '+' : ''}${(month.total - data.monthly[index - 1].total).toLocaleString()} t vs prior month`
  })), [data]);

  const monthlySeries: ChartSeries[] = [
    { id: 'scope1', label: 'Scope 1', color: data.scopes.scope1.color, values: data.monthly.map((month) => month.scope1), pattern: 'stripe', source: 'Monthly emissions ledger' },
    { id: 'scope2', label: 'Scope 2', color: data.scopes.scope2.color, values: data.monthly.map((month) => month.scope2), pattern: 'stripe', source: 'Monthly emissions ledger' },
    { id: 'scope3', label: 'Scope 3', color: data.scopes.scope3.color, values: data.monthly.map((month) => month.scope3), pattern: 'stripe', source: 'Monthly emissions ledger' }
  ];
  const quarterly = useMemo(() => [0, 1, 2, 3].map((quarter) => {
    const months = data.monthly.slice(quarter * 3, quarter * 3 + 3);
    return {
      label: `Q${quarter + 1}`,
      scope1: months.reduce((sum, month) => sum + month.scope1, 0),
      scope2: months.reduce((sum, month) => sum + month.scope2, 0),
      scope3: months.reduce((sum, month) => sum + month.scope3, 0)
    };
  }), [data]);
  const quarterlySeries: ChartSeries[] = [
    { id: 'scope1', label: 'Scope 1', color: data.scopes.scope1.color, values: quarterly.map((q) => q.scope1), source: 'Aggregated monthly ledger' },
    { id: 'scope2', label: 'Scope 2', color: data.scopes.scope2.color, values: quarterly.map((q) => q.scope2), source: 'Aggregated monthly ledger' },
    { id: 'scope3', label: 'Scope 3', color: data.scopes.scope3.color, values: quarterly.map((q) => q.scope3), source: 'Aggregated monthly ledger' }
  ];
  const monthlyChanges = monthlyPoints.map((point, index) => ({
    ...point,
    value: index === 0 ? 0 : point.value - monthlyPoints[index - 1].value
  }));
  const scopes = [data.scopes.scope1, data.scopes.scope2, data.scopes.scope3];
  const offsetCoverage = Math.round(data.totalOffset / Math.max(data.totalEmissions, 1) * 100);
  const facilities = data.topFacilities.map((facility) => ({
    label: facility.name.replace(/^Facility Name - \d+ \(/, '').replace(/\)$/, ''),
    x: facility.emissions,
    y: facility.trend,
    size: facility.emissions,
    color: facility.primaryScope === 'Scope 1' ? data.scopes.scope1.color : facility.primaryScope === 'Scope 2' ? data.scopes.scope2.color : data.scopes.scope3.color,
    unit: 'tCO₂e',
    source: facility.location ?? facility.primaryScope
  }));
  const stateContent = {
    ready: <div className="flex items-center gap-2 rounded-xl border border-[#BBF7D0] bg-[#ECFDF3]/70 p-3 text-[12px] text-[#166534]"><CheckCircle2 className="h-4 w-4"/><span>Chart ready · {data.monthly.length} monthly records available.</span></div>,
    loading: <ChartStatus state="loading" message="Loading emissions records…"/>,
    empty: <ChartStatus state="empty" message="No records for this period. Choose a reporting year with submitted activity."/>,
    error: <ChartStatus state="error" message="Emissions data could not be loaded." onRetry={() => setPreviewState('ready')}/>
  }[previewState];

  return <motion.div
    className="space-y-6"
    initial="hidden"
    animate="show"
    variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.045 } } }}
  >
    <header className="flex flex-col justify-between gap-4 pt-1 md:flex-row md:items-end">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D9CFFA] bg-[#F1EDFF]/75 px-2.5 py-1 text-[10px] font-medium text-[#6248D5]">Analytics design system <span className="h-1 w-1 rounded-full bg-[#AC96F2]"/> Component showcase</div>
        <h1 className="text-[24px] font-semibold tracking-tight text-[#18181B] sm:text-[28px]">Carbon intelligence</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[#62636D]">Reusable chart geometry for emissions, operations, and reporting readiness.</p>
      </div>
      <div className="text-[11px] text-[#878891]">Dashboard data · FY {data.year}</div>
    </header>

    <div className="rounded-xl border border-[#D9CFFA]/80 bg-white/45 px-4 py-3 text-[11px] leading-relaxed text-[#62636D] backdrop-blur-sm">
      Values below are drawn from the current dashboard record for {data.year}. Charts retain their source, unit, and reporting period in focus and hover states.
    </div>

    <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
      <ShowcaseCard title="01 · Dot matrix" subtitle="Monthly emissions by period. Each column scales to the period maximum; focus or select a month to inspect its exact value.">
        <DotMatrixChart data={monthlyPoints} rows={8} color={data.scopes.scope1.color} unit="tCO₂e" />
      </ShowcaseCard>

      <ShowcaseCard title="02 · Striped bars" subtitle="Grouped monthly emissions preserve the three scope colors and use fine stripes to distinguish series.">
        <StripedBarChart labels={data.monthly.map((month) => month.month)} series={monthlySeries} unit="tCO₂e" height={190} />
      </ShowcaseCard>

      <ShowcaseCard title="03 · Segmented radial gauge" subtitle="Offset coverage against gross emissions. Segment count tracks the measured percentage.">
        <SegmentedRadialGauge value={offsetCoverage} max={100} segments={40} color="#238C78" label="Gross emissions offset" unit="%" />
        <p className="mt-1 text-center font-data text-[10px] text-[#878891]">{data.totalOffset.toLocaleString()} / {data.totalEmissions.toLocaleString()} tCO₂e</p>
      </ShowcaseCard>

      <ShowcaseCard title="04 · Hatched columns" subtitle="Top facilities by reported emissions. Patterned columns keep values distinct in dense views and print output.">
        <HatchedColumns data={data.topFacilities.map((facility, index) => ({ label: `0${index + 1}`, value: facility.emissions, unit: 'tCO₂e', source: facility.location, comparison: `${facility.trend > 0 ? '+' : ''}${facility.trend}% year over year` }))} color="#4268D4" unit="tCO₂e" height={190} />
      </ShowcaseCard>

      <ShowcaseCard title="05 · Connected stacked areas" subtitle="Quarterly totals are aggregated from the current monthly ledger, preserving Scope 1, 2, and 3 as layers.">
        <ConnectedStackedArea labels={quarterly.map((q) => q.label)} series={quarterlySeries} unit="tCO₂e" />
      </ShowcaseCard>

      <ShowcaseCard title="06 · Rounded bubble plot" subtitle="Reported facility emissions versus year-over-year change. Bubble area follows reported emissions; no risk score is inferred.">
        <RoundedBubblePlot data={facilities} xLabel="Emissions (tCO₂e)" yLabel="Change vs prior year (%)" />
        <div className="mt-2 text-[10px] text-[#878891]">Facility volume is measured data; vertical position is the reported trend.</div>
      </ShowcaseCard>

      <ShowcaseCard title="07 · Segmented donut" subtitle="Scope composition uses the dashboard inventory totals, with the same scope colors used throughout the page.">
        <SegmentedDonut data={scopes.map((scope) => ({ label: scope.scope, value: scope.value, color: scope.color, source: scope.name }))} totalLabel="Gross emissions" unit="tCO₂e" />
      </ShowcaseCard>

      <ShowcaseCard title="08 · Diverging capsules" subtitle="Month-over-month changes use the previous month as baseline. Positive values increase emissions; negative values reduce them.">
        <CapsuleDivergingChart data={monthlyChanges} unit="tCO₂e" />
      </ShowcaseCard>

      <ShowcaseCard title="09 · Smooth area" subtitle="A smooth trend line shows the same monthly totals while a low-opacity fill keeps the measurement in focus.">
        <SmoothAreaChart data={monthlyPoints} color={data.scopes.scope1.color} unit="tCO₂e" />
      </ShowcaseCard>

      <ShowcaseCard title="10 · Target and baseline" subtitle="Current gross emissions compared with the recorded baseline year. The marker identifies the baseline value.">
        <div className="space-y-6 py-5">
          <TargetBulletChart value={data.totalEmissions} target={data.baselineYear} max={Math.max(data.totalEmissions, data.baselineYear) * 1.12} unit="tCO₂e" label={`Gross emissions vs ${data.baselineYear} baseline`} />
          <SegmentedProgress value={data.scopes.scope1.percentage} color={data.scopes.scope1.color} label="Scope 1 share of gross inventory" />
        </div>
      </ShowcaseCard>

      <ShowcaseCard title="11 · Loading, empty, and error states" subtitle="State controls demonstrate clear feedback while preserving the same card geometry.">
        <div role="group" aria-label="Preview chart state" className="mb-4 flex flex-wrap gap-1 rounded-xl border border-[#E7E8ED] bg-white/55 p-1">
          {(['ready', 'loading', 'empty', 'error'] as PreviewState[]).map((state) => <button key={state} type="button" aria-pressed={previewState === state} onClick={() => setPreviewState(state)} className={`rounded-lg px-3 py-1.5 text-[11px] capitalize transition-colors ${previewState === state ? 'bg-[#6248D5] text-white shadow-sm' : 'text-[#62636D] hover:bg-white'}`}>{state}</button>)}
        </div>
        {stateContent}
        <button type="button" disabled className="mt-3 cursor-not-allowed rounded-lg border border-[#E7E8ED] bg-[#F1F2F5] px-3 py-1.5 text-[11px] text-[#878891] opacity-70" aria-disabled="true">Export unavailable in preview</button>
      </ShowcaseCard>
    </div>

    <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="glass-panel-static p-5">
        <h2 className="text-[13px] font-semibold text-[#18181B]">Geometry and interaction rules</h2>
        <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-[#62636D]">
          <li>• Hover and keyboard focus share one selection state; selected values stay visible until changed or cleared.</li>
          <li>• Tooltips carry exact values, units, periods, source context, and comparisons when the record provides them.</li>
          <li>• Reduced-motion preferences disable movement and chart staggering. Entrances play once when a card enters view.</li>
          <li>• Scope colors remain consistent: violet for Scope 1, amber for Scope 2, blue for Scope 3.</li>
        </ul>
      </div>
      <div className="glass-panel-static p-5">
        <h2 className="text-[13px] font-semibold text-[#18181B]">Implementation notes</h2>
        <p className="mt-3 text-[11px] leading-relaxed text-[#62636D]">Charts are React + TypeScript SVG primitives. Geometry and input data are separate; cards own their titles, legends, and loading states. Missing values should remain missing rather than being interpolated. This page is the visual reference for future dashboard modules.</p>
      </div>
    </section>
  </motion.div>;
}
