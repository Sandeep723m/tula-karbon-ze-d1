import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronRight, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { YearEmissionsData, EmitterItem } from '../types';
import { BUSINESS_UNITS, ORG_HIERARCHY } from '../data/intelligenceData';
import { OrgHierarchyTree } from './OrgHierarchyTree';
import { getDeltaBadgeClass, getScopeColor, formatSignedPct, scaleByGross } from '../utils/analytics';

interface TopEmittersCardProps {
  data: YearEmissionsData;
  onSelectEmitter?: (emitter: EmitterItem) => void;
}

type ScopeFilterCombo = {
  scope1: boolean;
  scope2: boolean;
  scope3: boolean;
};

export const TopEmittersCard: React.FC<TopEmittersCardProps> = ({ data, onSelectEmitter }) => {
  const reduceMotion = useReducedMotion();
  const [emitterMode, setEmitterMode] = useState<'units' | 'facilities' | 'sources'>('units');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>('bu-mfg');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Card-level filter: Organization + Sub-level + Scope 1, 2, 3 combinations
  const [filterOpen, setFilterOpen] = useState(false);
  const [localOrgId, setLocalOrgId] = useState<string>('org-global');
  const [scopeCombo, setScopeCombo] = useState<ScopeFilterCombo>({
    scope1: true,
    scope2: true,
    scope3: true
  });

  const activeOrg = ORG_HIERARCHY.find((o) => o.id === localOrgId) ?? ORG_HIERARCHY[0];
  const allScopesSelected = scopeCombo.scope1 && scopeCombo.scope2 && scopeCombo.scope3;
  const filterBadgeCount =
    (localOrgId !== 'org-global' ? 1 : 0) + (!allScopesSelected ? 1 : 0);

  const toggleScope = (key: keyof ScopeFilterCombo) => {
    setScopeCombo((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Prevent all 3 from being unchecked at once
      if (!next.scope1 && !next.scope2 && !next.scope3) return prev;
      return next;
    });
  };

  const resetFilters = () => {
    setLocalOrgId('org-global');
    setScopeCombo({ scope1: true, scope2: true, scope3: true });
  };

  const matchesScope = (primaryScope: string) => {
    if (primaryScope === 'Scope 1') return scopeCombo.scope1;
    if (primaryScope === 'Scope 2') return scopeCombo.scope2;
    return scopeCombo.scope3;
  };

  const orgFactor = activeOrg.shareFactor;

  const filteredUnits = useMemo(() => {
    return BUSINESS_UNITS.map((bu) => {
      const sites = bu.sites
        .filter((s) => matchesScope(s.primaryScope))
        .map((s) => ({
          ...s,
          emissions: Math.round(scaleByGross(s.emissions, data.totalEmissions) * orgFactor)
        }));
      const totalSiteEmissions = sites.reduce((sum, s) => sum + s.emissions, 0);
      return {
        ...bu,
        emissions: sites.length > 0 ? totalSiteEmissions : 0,
        sites
      };
    }).filter((bu) => bu.sites.length > 0 || matchesScope(bu.primaryScope));
  }, [data.totalEmissions, orgFactor, scopeCombo]);

  const maxUnit = Math.max(...filteredUnits.map((u) => u.emissions), 1);

  const filteredItems = useMemo(() => {
    const raw = emitterMode === 'facilities' ? data.topFacilities : data.topSources;
    return raw
      .filter((item) => matchesScope(item.primaryScope))
      .map((item) => ({
        ...item,
        emissions: Math.round(item.emissions * orgFactor)
      }));
  }, [emitterMode, data.topFacilities, data.topSources, orgFactor, scopeCombo]);

  const maxEmissions = Math.max(...filteredItems.map((i) => i.emissions), 1);

  const activeScopeLabel = allScopesSelected
    ? 'All Scopes'
    : [scopeCombo.scope1 && 'S1', scopeCombo.scope2 && 'S2', scopeCombo.scope3 && 'S3'].filter(Boolean).join(' + ');

  return (
    <div className="glass-card-top p-4 sm:p-5 relative overflow-visible flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E0EA]">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-[19px] font-semibold text-[#15131A] tracking-tight leading-snug">
            Top 5 Emissions
          </h2>
          {filterBadgeCount > 0 && (
            <span className="font-data text-[10px] font-medium text-[#5625B8] bg-[#F1EDFF] px-2 py-0.5 rounded-full truncate max-w-[130px]">
              {activeScopeLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 bg-[#EEEAF5] rounded-lg border border-[#D8D2DF] text-[11px]">
            {(
              [
                { id: 'units', label: 'Units' },
                { id: 'facilities', label: 'Sites' },
                { id: 'sources', label: 'Sources' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEmitterMode(tab.id)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  emitterMode === tab.id
                    ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs font-medium'
                    : 'text-[#667085] hover:text-[#15131A] font-medium'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Icon Button (Org + Sub-levels + Scope 1, 2, 3 combinations) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              aria-label="Filter top emissions by organisation and scopes"
              className={`inline-flex items-center gap-1 rounded-lg border p-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                filterOpen || filterBadgeCount > 0
                  ? 'bg-[#F1EDFF] border-[#5625B8]/40 text-[#5625B8]'
                  : 'bg-white/85 border-[#D8D2DF] text-[#15131A] hover:border-[#5625B8]/40'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {filterBadgeCount > 0 && (
                <span className="font-data text-[9px] bg-[#5625B8] text-white px-1 rounded-full">{filterBadgeCount}</span>
              )}
            </button>

            {filterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 max-h-[410px] overflow-y-auto rounded-2xl border border-[#D8D2DF] bg-white p-3.5 shadow-[0_14px_36px_rgba(21,19,26,0.16)] z-40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EEEAF5]">
                    <span className="text-[12px] font-semibold text-[#15131A]">Filter Hotspots</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#667085] hover:text-[#5625B8] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterOpen(false)}
                        className="p-1 rounded-md text-[#85808D] hover:bg-[#EEEAF5] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scope Combinations (multi-select) */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#85808D] mb-1.5">
                      Scope Combinations
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { key: 'scope1', label: 'Scope 1', color: '#5625B8' },
                          { key: 'scope2', label: 'Scope 2', color: '#F46A1F' },
                          { key: 'scope3', label: 'Scope 3', color: '#2563EB' }
                        ] as const
                      ).map((sc) => {
                        const on = scopeCombo[sc.key];
                        return (
                          <button
                            key={sc.key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleScope(sc.key)}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                              on ? 'bg-[#F1EDFF] border-[#5625B8]/40 text-[#15131A]' : 'bg-[#F7F5F2] border-[#E5E0EA] text-[#85808D]'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: on ? sc.color : '#C7BED3' }} />
                            <span>{sc.label.replace('Scope ', 'S')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Organisation & Sub-levels */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#85808D] mb-1.5">
                      Organisation &amp; Sub-levels
                    </label>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-[#EEEAF5] p-1.5">
                      <OrgHierarchyTree selectedOrgId={localOrgId} onSelect={setLocalOrgId} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {emitterMode === 'units' ? (
        <div className="space-y-2 my-auto py-3">
          {filteredUnits.map((unit) => {
            const isOpen = expandedUnitId === unit.id;
            const widthPct = Math.round((unit.emissions / maxUnit) * 100);
            const barColor = getScopeColor(unit.primaryScope);
            return (
              <div
                key={unit.id}
                onMouseEnter={() => setHoveredId(unit.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`rounded-xl border transition-colors ${
                  isOpen ? 'bg-white/85 border-[#D9CFFA]' : 'bg-white/55 hover:bg-white/80 border-white/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedUnitId(isOpen ? null : unit.id)}
                  className="w-full p-2.5 text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="flex items-center gap-1.5 font-medium text-[#15131A] truncate pr-2">
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#5625B8] shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#85808D] shrink-0" />
                      )}
                      <span className="truncate">{unit.name}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-data font-semibold text-[#15131A]">{unit.emissions.toLocaleString()} t</span>
                      <span className="font-data text-[10px] text-[#667085] w-9 text-right">{unit.share}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#EEEAF5] h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${widthPct}%`, backgroundColor: barColor }} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                      className="overflow-hidden border-t border-[#EEEAF5] px-3 py-2 space-y-1.5 bg-[#FAF8FD]/70 rounded-b-xl"
                    >
                      {unit.sites.map((site) => (
                        <div
                          key={site.id}
                          onClick={() =>
                            onSelectEmitter?.({
                              id: site.id,
                              name: site.name,
                              category: 'facility',
                              emissions: site.emissions,
                              percentage: site.share,
                              location: site.location,
                              primaryScope: site.primaryScope,
                              trend: site.trend
                            })
                          }
                          className={`flex items-center justify-between text-[11px] py-0.5 rounded px-1.5 ${
                            onSelectEmitter ? 'hover:bg-white cursor-pointer' : ''
                          }`}
                        >
                          <span className="text-[#494454] truncate pr-2">
                            {site.name} <span className="text-[#85808D]">· {site.location}</span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-data font-medium text-[#15131A]">{site.emissions.toLocaleString()} t</span>
                            <span className={`font-data text-[10px] ${site.trend > 0 ? 'text-[#B91C1C]' : 'text-[#15803D]'}`}>
                              {formatSignedPct(site.trend)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2 my-auto py-3">
          {filteredItems.map((item, idx) => {
            const widthPct = Math.round((item.emissions / maxEmissions) * 100);
            const barColor = getScopeColor(item.primaryScope);

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectEmitter?.(item)}
                className={`p-2.5 rounded-xl bg-white/55 hover:bg-white/85 border border-white/80 transition-colors ${
                  onSelectEmitter ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center justify-between text-[12px] text-[#15131A] mb-1">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-[10px] font-data font-semibold text-[#5625B8] bg-white px-1.5 py-0.5 rounded border border-[#E5E0EA] shrink-0">
                      0{idx + 1}
                    </span>
                    <span className="font-medium text-[#15131A] truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-data font-semibold text-[#15131A]">{item.emissions.toLocaleString()}</span>
                    <span className="text-[10px] text-[#85808D] font-data">t</span>
                  </div>
                </div>

                <div className="w-full bg-[#EEEAF5] h-1.5 rounded-full overflow-hidden my-1">
                  <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${widthPct}%`, backgroundColor: barColor }} />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#667085] font-medium">
                  <span className="truncate">
                    {item.location || item.primaryScope}
                    {hoveredId === item.id ? ` · ${item.percentage}%` : ''}
                  </span>
                  <span className={`font-data font-medium px-1.5 py-0.5 rounded border ${getDeltaBadgeClass(item.trend)}`}>
                    {formatSignedPct(item.trend)} YoY
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
