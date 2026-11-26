import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flame, Zap, Globe2, ArrowDownRight, ArrowUpRight, Layers } from 'lucide-react';
import { Scope2Method, ScopeType, YearEmissionsData } from '../../types';
import {
  GHG_COMPOSITION,
  SCOPE1_BREAKDOWN,
  SCOPE3_CATEGORIES,
  SUPPLIER_HOTSPOTS,
  WATERFALL_DRIVERS
} from '../../data/intelligenceData';
import { AnalyticsCard } from '../charts/AnalyticsCard';
import {
  CapsuleDivergingChart,
  ConnectedStackedArea,
  StripedBarChart,
  WaterfallBridgeChart
} from '../charts/AnalyticsCharts';
import { formatCompactTonnes, formatSignedPct, getDeltaBadgeClass, scaleByGross } from '../../utils/analytics';

interface EmissionsAnalysisViewProps {
  data: YearEmissionsData;
  activeScope: ScopeType;
  setActiveScope: (scope: ScopeType) => void;
  scope2Method: Scope2Method;
  setScope2Method: (m: Scope2Method) => void;
}

export const EmissionsAnalysisView: React.FC<EmissionsAnalysisViewProps> = ({
  data,
  activeScope,
  setActiveScope,
  scope2Method,
  setScope2Method
}) => {
  const reduceMotion = useReducedMotion();
  const [hoveredCat, setHoveredCat] = useState<number | null>(null);
  const [hoveredSup, setHoveredSup] = useState<string | null>(null);
  const [showAllScope3, setShowAllScope3] = useState(false);

  const scaledDrivers = WATERFALL_DRIVERS.map((d) => ({
    ...d,
    delta: scaleByGross(d.delta, data.totalEmissions)
  }));

  const monthlyChanges = data.monthly.map((m, idx) => ({
    label: m.month,
    value: idx === 0 ? 0 : m.total - data.monthly[idx - 1].total,
    unit: 'tCO₂e',
    comparison: idx === 0 ? 'Period baseline' : `vs ${data.monthly[idx - 1].month}`
  }));

  const scopeSeries = [
    { id: 's1', label: 'Scope 1', color: '#5625B8', values: data.monthly.map((m) => m.scope1), pattern: 'stripe' as const },
    { id: 's2', label: 'Scope 2', color: '#F46A1F', values: data.monthly.map((m) => m.scope2), pattern: 'stripe' as const },
    { id: 's3', label: 'Scope 3', color: '#2563EB', values: data.monthly.map((m) => m.scope3), pattern: 'stripe' as const }
  ];

  const locationS2 = Math.round(data.scopes.scope2.value / (scope2Method === 'market' ? 0.78 : 1));
  const marketS2 = Math.round(locationS2 * 0.78);
  const totalMwh = Math.max(12000, scaleByGross(86400, data.totalEmissions));
  const renewableMwh = Math.round(totalMwh * 0.42);

  const visibleScope3 = showAllScope3 ? SCOPE3_CATEGORIES : SCOPE3_CATEGORIES.filter((c) => c.applicable);
  const maxS3 = Math.max(...SCOPE3_CATEGORIES.map((c) => c.emissions), 1);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-5"
    >
      <div className="glass-panel p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#5625B8]" />
          <span className="text-[13px] font-semibold text-[#15131A]">Scope Lens</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Select scope dashboard">
          {(
            [
              { id: 'all', label: 'All Scopes', icon: null, val: data.totalEmissions },
              { id: 'scope1', label: 'Scope 1 · Direct', icon: Flame, val: data.scopes.scope1.value },
              { id: 'scope2', label: 'Scope 2 · Energy', icon: Zap, val: data.scopes.scope2.value },
              { id: 'scope3', label: 'Scope 3 · Value Chain', icon: Globe2, val: data.scopes.scope3.value }
            ] as const
          ).map((tab) => {
            const active = activeScope === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveScope(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#5625B8] text-white border-[#5625B8] shadow-xs'
                    : 'bg-white/80 text-[#15131A] border-[#D8D2DF] hover:bg-[#F1EDFF]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                <span className={`font-data text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-[#EEEAF5] text-[#5625B8]'}`}>
                  {formatCompactTonnes(tab.val)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeScope === 'all' && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-7">
              <AnalyticsCard title="Emission Reduction Drivers" badge={<span className="font-data text-[10px] font-medium text-[#5625B8] bg-[#F1EDFF] px-2 py-0.5 rounded-full">tCO₂e Bridge</span>}>
                <WaterfallBridgeChart data={scaledDrivers} unit="tCO₂e" />
              </AnalyticsCard>
            </div>

            <div className="xl:col-span-5">
              <AnalyticsCard title="GHG Gas Composition" badge={<span className="font-data text-[10px] text-[#667085] bg-[#F7F5F2] px-2 py-0.5 rounded-full">CO₂e</span>}>
                <div className="space-y-4 pt-2">
                  <div className="flex h-5 w-full gap-1 rounded-full overflow-hidden">
                    {GHG_COMPOSITION.map((g) => (
                      <div
                        key={g.gas}
                        style={{ width: `${g.share}%`, backgroundColor: g.color }}
                        title={`${g.name} (${g.gas}): ${scaleByGross(g.tonnes, data.totalEmissions).toLocaleString()} tCO₂e (${g.share}%)`}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-opacity hover:opacity-85 cursor-pointer"
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {GHG_COMPOSITION.map((g) => (
                      <div key={g.gas} className="rounded-xl border border-[#E5E0EA] bg-white/65 p-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#15131A]">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                            {g.gas}
                          </span>
                          <span className="font-data text-[12px] font-semibold text-[#5625B8]">{g.share}%</span>
                        </div>
                        <div className="mt-1 font-data text-[14px] font-medium text-[#15131A]">
                          {scaleByGross(g.tonnes, data.totalEmissions).toLocaleString()} <span className="text-[10px] text-[#85808D]">tCO₂e</span>
                        </div>
                        <div className="text-[10px] text-[#667085]">{g.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnalyticsCard>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <AnalyticsCard title="Scope Composition Trajectory">
              <ConnectedStackedArea labels={data.monthly.map((m) => m.month)} series={scopeSeries} unit="tCO₂e" />
            </AnalyticsCard>

            <AnalyticsCard title="Monthly Emissions Variance">
              <CapsuleDivergingChart data={monthlyChanges} unit="tCO₂e" />
            </AnalyticsCard>
          </div>
        </>
      )}

      {activeScope === 'scope1' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-6">
            <AnalyticsCard title="Scope 1 · Direct Combustion & Process">
              <div className="space-y-3 mt-1">
                {SCOPE1_BREAKDOWN.map((item) => {
                  const val = Math.round(item.emissions * (data.scopes.scope1.value / 24072));
                  return (
                    <div key={item.id} className="rounded-xl border border-[#E8DFF4] bg-white/70 p-3.5 hover:bg-white transition-colors">
                      <div className="flex items-center justify-between text-[13px]">
                        <div>
                          <span className="font-semibold text-[#15131A]">{item.category}</span>
                          <span className="ml-2 text-[11px] text-[#667085]">· {item.fuel}</span>
                        </div>
                        <span className="font-data font-semibold text-[#5625B8]">{val.toLocaleString()} t</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-[#EEEAF5] overflow-hidden">
                          <div className="h-full rounded-full bg-[#5625B8]" style={{ width: `${item.share}%` }} />
                        </div>
                        <span className="font-data text-[11px] text-[#667085] w-11 text-right">{item.share}%</span>
                        <span className="font-data text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-1.5 py-0.5 rounded">
                          {item.trend}% YoY
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AnalyticsCard>
          </div>

          <div className="xl:col-span-6">
            <AnalyticsCard title="Scope 1 Monthly Profile">
              <StripedBarChart
                labels={data.monthly.map((m) => m.month)}
                series={[{ id: 's1-bar', label: 'Scope 1 Direct', color: '#5625B8', values: data.monthly.map((m) => m.scope1), pattern: 'stripe' }]}
                unit="tCO₂e"
                height={220}
              />
            </AnalyticsCard>
          </div>
        </div>
      )}

      {activeScope === 'scope2' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-5">
            <AnalyticsCard
              title="Scope 2 · Dual Accounting"
              badge={<span className="font-data text-[10px] text-[#C2410C] bg-[#FFF3EC] px-2 py-0.5 rounded-full">Location vs Market</span>}
              actions={
                <div className="inline-flex rounded-lg border border-[#D8D2DF] bg-[#EEEAF5] p-0.5 text-[11px]">
                  {(['location', 'market'] as Scope2Method[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setScope2Method(m)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium cursor-pointer ${
                        scope2Method === m ? 'bg-[#F46A1F] text-white' : 'text-[#667085]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="space-y-3 mt-1">
                <div className={`rounded-xl border p-4 transition-colors ${scope2Method === 'location' ? 'bg-[#FFF3EC] border-[#F46A1F]/50' : 'bg-white/65 border-[#E5E0EA]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#15131A]">Location-Based (Grid)</span>
                    <span className="font-data text-[18px] font-semibold text-[#C2410C]">{locationS2.toLocaleString()} t</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#F4E5D8] overflow-hidden">
                    <div className="h-full rounded-full bg-[#F46A1F]" style={{ width: '100%' }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-[#667085]">
                    <span>{(locationS2 / Math.max(totalMwh, 1)).toFixed(3)} tCO₂e/MWh</span>
                    <span className="font-data">{totalMwh.toLocaleString()} MWh</span>
                  </div>
                </div>

                <div className={`rounded-xl border p-4 transition-colors ${scope2Method === 'market' ? 'bg-[#FFF3EC] border-[#F46A1F]/50' : 'bg-white/65 border-[#E5E0EA]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#15131A]">Market-Based (PPA / I-RECs)</span>
                    <span className="font-data text-[18px] font-semibold text-[#238C78]">{marketS2.toLocaleString()} t</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#EAF8F5] overflow-hidden">
                    <div className="h-full rounded-full bg-[#238C78]" style={{ width: '78%' }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-[#667085]">
                    <span>42% renewable ({renewableMwh.toLocaleString()} MWh)</span>
                    <span className="font-data font-semibold text-[#15803D]">-22% contractual</span>
                  </div>
                </div>
              </div>
            </AnalyticsCard>
          </div>

          <div className="xl:col-span-7">
            <AnalyticsCard
              title="Scope 2 Monthly Energy Emissions"
              badge={<span className="font-data text-[10px] capitalize text-[#C2410C] bg-[#FFF3EC] px-2 py-0.5 rounded-full">{scope2Method}-based</span>}
            >
              <StripedBarChart
                labels={data.monthly.map((m) => m.month)}
                series={[{ id: 's2-bar', label: `Scope 2 (${scope2Method})`, color: '#F46A1F', values: data.monthly.map((m) => m.scope2), pattern: 'stripe' }]}
                unit="tCO₂e"
                height={220}
              />
            </AnalyticsCard>
          </div>
        </div>
      )}

      {activeScope === 'scope3' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7">
            <AnalyticsCard
              title="Scope 3 · GHG Protocol Categories"
              actions={
                <button
                  type="button"
                  onClick={() => setShowAllScope3((v) => !v)}
                  className="rounded-lg border border-[#D8D2DF] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5625B8] hover:bg-[#F1EDFF] cursor-pointer"
                >
                  {showAllScope3 ? 'Applicable (10)' : 'All 15'}
                </button>
              }
            >
              <div className="space-y-2 max-h-[390px] overflow-y-auto pr-1">
                {visibleScope3.map((cat) => {
                  const val = Math.round(cat.emissions * (data.scopes.scope3.value / 104784));
                  const barW = cat.applicable ? Math.max(3, Math.round((cat.emissions / maxS3) * 100)) : 0;
                  const isHover = hoveredCat === cat.number;
                  return (
                    <div
                      key={cat.number}
                      onMouseEnter={() => setHoveredCat(cat.number)}
                      onMouseLeave={() => setHoveredCat(null)}
                      className={`rounded-xl border p-2.5 transition-colors ${
                        !cat.applicable
                          ? 'bg-[#F7F5F2]/60 border-dashed border-[#D8D2DF] opacity-65'
                          : isHover
                            ? 'bg-white border-[#2563EB]/50 shadow-xs'
                            : 'bg-white/65 border-[#E5E0EA]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[12px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-data text-[10px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] px-1.5 py-0.5 rounded shrink-0">
                            C{cat.number}
                          </span>
                          <span className="font-medium text-[#15131A] truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-data font-semibold text-[#15131A]">
                            {cat.applicable ? `${val.toLocaleString()} t` : 'N/A'}
                          </span>
                          {cat.applicable && <span className="font-data text-[10px] text-[#667085] w-10 text-right">{cat.share}%</span>}
                        </div>
                      </div>
                      {cat.applicable && (
                        <>
                          <div className="mt-1.5 h-1.5 rounded-full bg-[#EFF6FF] overflow-hidden">
                            <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${barW}%` }} />
                          </div>
                          {isHover && (
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#667085]">
                              <span>{cat.method}</span>
                              <span className={`font-data font-semibold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border ${getDeltaBadgeClass(cat.trend)}`}>
                                {cat.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {formatSignedPct(cat.trend)} YoY
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </AnalyticsCard>
          </div>

          <div className="xl:col-span-5">
            <AnalyticsCard title="Supplier Emission Pareto">
              <div className="space-y-2.5 mt-1">
                {SUPPLIER_HOTSPOTS.map((sup) => {
                  const val = Math.round(sup.emissions * (data.scopes.scope3.value / 104784));
                  const active = hoveredSup === sup.id;
                  return (
                    <div
                      key={sup.id}
                      onMouseEnter={() => setHoveredSup(sup.id)}
                      onMouseLeave={() => setHoveredSup(null)}
                      className={`rounded-xl border p-3 transition-colors ${active ? 'bg-white border-[#2563EB]/45' : 'bg-white/65 border-[#E5E0EA]'}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="font-semibold text-[#15131A] truncate">{sup.name}</span>
                        <span className="font-data font-semibold text-[#15131A] shrink-0">{val.toLocaleString()} t</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-[#667085]">
                        <span>{sup.category}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded font-medium ${sup.primaryData ? 'bg-[#ECFDF3] text-[#15803D]' : 'bg-[#FEF3C7] text-[#B45309]'}`}>
                            {sup.primaryData ? 'Primary' : 'EEIO'}
                          </span>
                          <span className="font-data font-semibold text-[#2563EB]">{sup.cumulativeShare}% cum</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AnalyticsCard>
          </div>
        </div>
      )}
    </motion.div>
  );
};
