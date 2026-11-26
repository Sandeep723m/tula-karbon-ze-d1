import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { EmitterItem, YearEmissionsData } from '../../types';
import { BUSINESS_UNITS, ORG_HIERARCHY } from '../../data/intelligenceData';
import { AnalyticsCard } from '../charts/AnalyticsCard';
import { RoundedBubblePlot } from '../charts/AnalyticsCharts';
import { formatSignedPct, getScopeColor, scaleByGross } from '../../utils/analytics';

interface OrganisationIntelligenceViewProps {
  data: YearEmissionsData;
  selectedOrgId: string;
  onSelectOrg: (orgId: string) => void;
  onSelectFacility: (facility: EmitterItem) => void;
}

export const OrganisationIntelligenceView: React.FC<OrganisationIntelligenceViewProps> = ({
  data,
  selectedOrgId,
  onSelectOrg,
  onSelectFacility
}) => {
  const reduceMotion = useReducedMotion();
  const [expandedUnit, setExpandedUnit] = useState<string>('bu-mfg');

  const regions = ORG_HIERARCHY.filter((o) => o.level === 'region');

  const facilityMatrix = data.topFacilities.map((f) => ({
    label: f.name.replace(/^Facility Name - \d+ \(/, '').replace(/\)$/, ''),
    x: f.emissions,
    y: f.trend,
    size: f.emissions,
    color: getScopeColor(f.primaryScope),
    unit: 'tCO₂e',
    source: f.location ?? f.primaryScope
  }));

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {regions.map((reg) => {
          const isSelected = selectedOrgId === reg.id;
          const regEmissions = Math.round(141600 * reg.shareFactor);
          const children = ORG_HIERARCHY.filter((n) => n.parentId === reg.id);
          return (
            <div
              key={reg.id}
              onClick={() => onSelectOrg(isSelected ? 'org-global' : reg.id)}
              className={`glass-card-top p-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-[#5625B8] bg-white/90' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5625B8] bg-[#F1EDFF] px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {reg.region}
                </span>
                <span className="font-data text-[11px] text-[#667085]">{reg.facilityCount} sites</span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold text-[#15131A]">{reg.name}</h3>
                <span className={`font-data text-[11px] font-semibold ${reg.yoyTrend <= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                  {formatSignedPct(reg.yoyTrend)} YoY
                </span>
              </div>
              <div className="mt-1 font-data text-[22px] font-semibold text-[#15131A]">
                {regEmissions.toLocaleString()} <span className="text-[11px] font-sans font-normal text-[#667085]">tCO₂e</span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E5E0EA] flex flex-wrap gap-1.5">
                {children.map((c) => (
                  <span key={c.id} className="text-[10px] bg-white/80 border border-[#D8D2DF] px-2 py-0.5 rounded-md text-[#494454]">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-6">
          <AnalyticsCard title="Business Unit & Facility Hierarchy">
            <div className="space-y-2.5">
              {BUSINESS_UNITS.map((bu) => {
                const open = expandedUnit === bu.id;
                const buEmissions = scaleByGross(bu.emissions, data.totalEmissions);
                return (
                  <div key={bu.id} className="rounded-xl border border-[#E5E0EA] bg-white/70 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedUnit(open ? '' : bu.id)}
                      className="w-full p-3 flex items-center justify-between gap-2 text-left hover:bg-white cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {open ? <ChevronDown className="w-4 h-4 text-[#5625B8]" /> : <ChevronRight className="w-4 h-4 text-[#85808D]" />}
                        <Building2 className="w-4 h-4 text-[#667085]" />
                        <span className="text-[13px] font-semibold text-[#15131A] truncate">{bu.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-data text-[13px] font-semibold text-[#15131A]">{buEmissions.toLocaleString()} t</span>
                        <span className="font-data text-[11px] text-[#5625B8] bg-[#F1EDFF] px-2 py-0.5 rounded">{bu.share}%</span>
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-[#EEEAF5] bg-[#FAF8FD] p-2.5 space-y-1.5">
                        {bu.sites.map((site) => {
                          const siteEmissions = scaleByGross(site.emissions, data.totalEmissions);
                          return (
                            <button
                              key={site.id}
                              type="button"
                              onClick={() =>
                                onSelectFacility({
                                  id: site.id,
                                  name: site.name,
                                  category: 'facility',
                                  emissions: siteEmissions,
                                  percentage: site.share,
                                  location: site.location,
                                  primaryScope: site.primaryScope,
                                  trend: site.trend
                                })
                              }
                              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-[12px] bg-white/80 hover:bg-white border border-[#E5E0EA]/80 cursor-pointer transition-colors"
                            >
                              <div className="text-left min-w-0 pr-2">
                                <div className="font-medium text-[#15131A] truncate">{site.name}</div>
                                <div className="text-[10px] text-[#667085]">{site.location} · {site.primaryScope}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-data font-semibold text-[#15131A]">{siteEmissions.toLocaleString()} t</div>
                                <div className={`font-data text-[10px] ${site.trend > 0 ? 'text-[#B91C1C]' : 'text-[#15803D]'}`}>
                                  {formatSignedPct(site.trend)} YoY
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AnalyticsCard>
        </div>

        <div className="xl:col-span-6">
          <AnalyticsCard title="Facility Performance Matrix">
            <RoundedBubblePlot data={facilityMatrix} xLabel="Gross Emissions (tCO₂e)" yLabel="YoY Change (%)" />
          </AnalyticsCard>
        </div>
      </div>
    </motion.div>
  );
};
