import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Building2,
  Calendar,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  X,
  Zap,
  Check
} from 'lucide-react';
import {
  CalcMethodFilter,
  ComparisonType,
  DataStatusFilter,
  GlobalFilterState,
  GranularityType,
  Scope2Method,
  ScopeType,
  TargetScenario
} from '../types';
import { ORG_HIERARCHY } from '../data/intelligenceData';
import { OrgHierarchyTree } from './OrgHierarchyTree';

interface GlobalFilterBarProps {
  filters: GlobalFilterState;
  onChange: (next: GlobalFilterState) => void;
  onReset: () => void;
}

const DEFAULT_FILTER_COUNT = (f: GlobalFilterState) => {
  let count = 0;
  if (f.orgId !== 'org-global') count += 1;
  if (f.scope !== 'all') count += 1;
  if (f.granularity !== 'monthly') count += 1;
  if (f.comparison !== 'prev_year') count += 1;
  if (f.scope2Method !== 'location') count += 1;
  if (f.ghgType !== 'all') count += 1;
  if (f.dataStatus !== 'all') count += 1;
  if (f.calcMethod !== 'all') count += 1;
  if (f.targetScenario !== 'current') count += 1;
  return count;
};

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ filters, onChange, onReset }) => {
  const reduceMotion = useReducedMotion();
  const [orgOpen, setOrgOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedOrg = ORG_HIERARCHY.find((o) => o.id === filters.orgId) ?? ORG_HIERARCHY[0];
  const activeCount = DEFAULT_FILTER_COUNT(filters);

  const update = <K extends keyof GlobalFilterState>(key: K, value: GlobalFilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <>
      <div className="glass-panel px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 relative z-30">
        <div className="flex flex-wrap items-center gap-2">
          {/* Reporting Year Selector */}
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D2DF] bg-white/85 px-2.5 py-1 text-[12px]">
            <Calendar className="w-3.5 h-3.5 text-[#5625B8]" />
            <select
              aria-label="Reporting year"
              value={filters.year}
              onChange={(e) => update('year', Number(e.target.value))}
              className="font-data font-semibold text-[#15131A] bg-transparent outline-none cursor-pointer"
            >
              {[2025, 2024, 2023, 2022].map((yr) => (
                <option key={yr} value={yr}>
                  FY {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Organisation Hierarchy Tree Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOrgOpen((v) => !v)}
              aria-expanded={orgOpen}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D8D2DF] bg-white/85 px-3 py-1.5 text-[12px] font-medium text-[#15131A] hover:border-[#5625B8]/50 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#5625B8]" strokeWidth={1.85} />
              <span className="max-w-[190px] truncate">{selectedOrg.name}</span>
              <span className="font-data text-[10px] text-[#667085] bg-[#EEEAF5] px-1.5 py-0.5 rounded">
                {selectedOrg.facilityCount}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#85808D] transition-transform ${orgOpen ? 'rotate-180' : ''}`} />
            </button>

            {orgOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOrgOpen(false)} />
                <div className="absolute left-0 mt-2 w-80 max-h-[380px] overflow-y-auto rounded-xl border border-[#D8D2DF] bg-white p-2 shadow-[0_12px_32px_rgba(21,19,26,0.14)] z-40">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#85808D]">
                    Enterprise Hierarchy
                  </div>
                  <OrgHierarchyTree
                    selectedOrgId={filters.orgId}
                    onSelect={(id) => {
                      update('orgId', id);
                      setOrgOpen(false);
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Scope Quick Pills */}
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-[#D8D2DF] bg-[#EEEAF5]/75 p-0.5 text-[11px]" role="group" aria-label="Emission scope filter">
            {(
              [
                { id: 'all', label: 'All Scopes', dot: null },
                { id: 'scope1', label: 'Scope 1', dot: '#5625B8' },
                { id: 'scope2', label: 'Scope 2', dot: '#F46A1F' },
                { id: 'scope3', label: 'Scope 3', dot: '#2563EB' }
              ] as { id: ScopeType; label: string; dot: string | null }[]
            ).map((item) => {
              const active = filters.scope === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update('scope', item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                    active ? 'bg-[#5625B8] text-white shadow-2xs' : 'text-[#494454] hover:text-[#15131A] hover:bg-white/70'
                  }`}
                >
                  {item.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? '#FFFFFF' : item.dot }} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Granularity Toggle */}
          <div className="inline-flex items-center rounded-lg border border-[#D8D2DF] bg-white/80 p-0.5 text-[11px]" role="group" aria-label="Time granularity">
            {(['monthly', 'quarterly'] as GranularityType[]).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={filters.granularity === g}
                onClick={() => update('granularity', g)}
                className={`rounded-md px-2.5 py-1 capitalize font-medium transition-colors cursor-pointer ${
                  filters.granularity === g ? 'bg-[#F1EDFF] text-[#5625B8]' : 'text-[#667085] hover:text-[#15131A]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Scope 2 Method Toggle */}
          <div className="hidden xl:inline-flex items-center gap-1 rounded-lg border border-[#D8D2DF] bg-white/80 p-0.5 text-[11px]" role="group" aria-label="Scope 2 accounting method">
            <span className="pl-2 pr-1 text-[10px] font-medium text-[#85808D] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#F46A1F]" />
              S2:
            </span>
            {(['location', 'market'] as Scope2Method[]).map((method) => (
              <button
                key={method}
                type="button"
                aria-pressed={filters.scope2Method === method}
                onClick={() => update('scope2Method', method)}
                className={`rounded-md px-2 py-1 capitalize font-medium transition-colors cursor-pointer ${
                  filters.scope2Method === method ? 'bg-[#FFF3EC] text-[#C2410C]' : 'text-[#667085] hover:text-[#15131A]'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Right Controls: Comparison + Advanced Filter Drawer + Reset */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center rounded-lg border border-[#D8D2DF] bg-white/80 p-0.5 text-[11px]" role="group" aria-label="Comparison baseline">
            {(
              [
                { id: 'prev_year', label: 'vs Prev Year' },
                { id: 'baseline', label: 'vs Baseline' }
              ] as { id: ComparisonType; label: string }[]
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filters.comparison === c.id}
                onClick={() => update('comparison', c.id)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  filters.comparison === c.id ? 'bg-[#F1EDFF] text-[#5625B8]' : 'text-[#667085] hover:text-[#15131A]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D2DF] bg-white/90 px-3 py-1.5 text-[12px] font-medium text-[#15131A] hover:border-[#5625B8]/50 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5625B8]" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="font-data text-[10px] font-semibold bg-[#5625B8] text-white px-1.5 py-0.2 rounded-full">
                {activeCount}
              </span>
            )}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#667085] hover:text-[#5625B8] hover:bg-[#F1EDFF]/60 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Slide-out Advanced Filter Panel */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-[#15131A]/30 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={reduceMotion ? false : { x: 360 }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: 360 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Advanced analytics filters"
              className="relative z-10 w-full max-w-sm bg-white h-full border-l border-[#D8D2DF] shadow-2xl flex flex-col justify-between p-5 overflow-y-auto"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E0EA]">
                  <h3 className="text-[16px] font-semibold text-[#15131A]">Filters</h3>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close filter drawer"
                    className="p-1.5 rounded-lg text-[#667085] hover:bg-[#EEEAF5] hover:text-[#15131A] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scope 2 Method */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#85808D] mb-2">
                    Scope 2 Accounting Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['location', 'market'] as Scope2Method[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => update('scope2Method', m)}
                        className={`px-3 py-2 rounded-xl border text-[12px] font-medium capitalize text-left flex items-center justify-between cursor-pointer ${
                          filters.scope2Method === m
                            ? 'bg-[#FFF3EC] border-[#F46A1F]/50 text-[#C2410C]'
                            : 'bg-[#F7F5F2] border-[#E5E0EA] text-[#15131A]'
                        }`}
                      >
                        <span>{m}-based</span>
                        {filters.scope2Method === m && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GHG Gas Type */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#85808D] mb-2">
                    GHG Gas Filter
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'CO2', 'CH4', 'N2O', 'HFCs'] as const).map((gas) => (
                      <button
                        key={gas}
                        type="button"
                        onClick={() => update('ghgType', gas)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-data font-medium border cursor-pointer ${
                          filters.ghgType === gas
                            ? 'bg-[#5625B8] text-white border-[#5625B8]'
                            : 'bg-white text-[#494454] border-[#D8D2DF] hover:bg-[#F7F5F2]'
                        }`}
                      >
                        {gas === 'all' ? 'All GHGs' : gas}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Status */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#85808D] mb-2">
                    Audit &amp; Data Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['all', 'approved', 'provisional', 'estimated'] as DataStatusFilter[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => update('dataStatus', st)}
                        className={`px-3 py-2 rounded-xl border text-[12px] font-medium capitalize cursor-pointer ${
                          filters.dataStatus === st
                            ? 'bg-[#F1EDFF] border-[#5625B8]/40 text-[#5625B8]'
                            : 'bg-[#F7F5F2] border-[#E5E0EA] text-[#15131A]'
                        }`}
                      >
                        {st === 'all' ? 'All Records' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation Method */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#85808D] mb-2">
                    Calculation Methodology
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'all', label: 'All Methods' },
                        { id: 'activity', label: 'Activity-based' },
                        { id: 'spend', label: 'Spend-based' },
                        { id: 'supplier', label: 'Supplier-specific' }
                      ] as { id: CalcMethodFilter; label: string }[]
                    ).map((cm) => (
                      <button
                        key={cm.id}
                        type="button"
                        onClick={() => update('calcMethod', cm.id)}
                        className={`px-3 py-2 rounded-xl border text-[12px] font-medium cursor-pointer ${
                          filters.calcMethod === cm.id
                            ? 'bg-[#F1EDFF] border-[#5625B8]/40 text-[#5625B8]'
                            : 'bg-[#F7F5F2] border-[#E5E0EA] text-[#15131A]'
                        }`}
                      >
                        {cm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Scenario */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#85808D] mb-2">
                    Target Trajectory Scenario
                  </label>
                  <div className="space-y-1.5">
                    {(
                      [
                        { id: 'current', label: 'Current Trajectory (3.9% CAGR)' },
                        { id: 'planned', label: 'Planned Interventions (9.0% CAGR)' },
                        { id: 'accelerated', label: 'Accelerated Net-Zero (13.7% CAGR)' }
                      ] as { id: TargetScenario; label: string }[]
                    ).map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => update('targetScenario', sc.id)}
                        className={`w-full px-3 py-2 rounded-xl border text-[12px] font-medium text-left flex items-center justify-between cursor-pointer ${
                          filters.targetScenario === sc.id
                            ? 'bg-[#ECFDF3] border-[#BBF7D0] text-[#15803D]'
                            : 'bg-[#F7F5F2] border-[#E5E0EA] text-[#15131A]'
                        }`}
                      >
                        <span>{sc.label}</span>
                        {filters.targetScenario === sc.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E0EA] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="px-4 py-2 rounded-lg border border-[#D8D2DF] text-[12px] font-medium text-[#667085] hover:text-[#15131A] cursor-pointer"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#5625B8] hover:bg-[#461D98] text-white text-[12px] font-semibold cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
