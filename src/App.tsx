/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { FloatingNav } from './components/FloatingNav';
import { TotalEmissionsCard } from './components/TotalEmissionsCard';
import { EmissionsOffsetCard } from './components/EmissionsOffsetCard';
import { MonthlyTimelineCard } from './components/MonthlyTimelineCard';
import { TopEmittersCard } from './components/TopEmittersCard';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { KpiSummaryStrip } from './components/KpiSummaryStrip';
import { NetZeroRoadmapCard } from './components/NetZeroRoadmapCard';
import { IntensityEnergyCard } from './components/IntensityEnergyCard';
import { DataQualityCard } from './components/DataQualityCard';
import { LiveEmissionsCard } from './components/LiveEmissionsCard';
import { EmissionsAnalysisView } from './components/views/EmissionsAnalysisView';
import { OrganisationIntelligenceView } from './components/views/OrganisationIntelligenceView';
import { PerformanceView } from './components/views/PerformanceView';
import { NetZeroPathwayView } from './components/views/NetZeroPathwayView';
import { DataQualityView } from './components/views/DataQualityView';
import { SimulationModal } from './components/SimulationModal';
import { ReportModal } from './components/ReportModal';
import { SearchModal } from './components/SearchModal';
import { FacilityDetailModal } from './components/FacilityDetailModal';
import { OrganizationView } from './components/OrganizationView';
import { TelemetryView } from './components/TelemetryView';
import { AnalyticsShowcase } from './components/AnalyticsShowcase';
import { EMISSIONS_DATA } from './data/emissionsData';
import { applyGlobalFiltersToYearData } from './data/intelligenceData';
import {
  EmitterItem,
  GlobalFilterState,
  IntelligenceArea,
  YearEmissionsData
} from './types';
import {
  Download,
  LayoutDashboard,
  LayoutGrid,
  Flame,
  Building2,
  TrendingUp,
  Compass,
  ShieldCheck
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.03
    }
  }
};

const cardEntranceVariants: Variants[] = [
  {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } }
  },
  {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } }
  },
  {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  },
  {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }
  }
];

const reducedContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1 }
};

const reducedCardVariants: Variants = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 1 },
  show: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0 } }
};

const INITIAL_FILTERS: GlobalFilterState = {
  orgId: 'org-global',
  year: 2023,
  scope: 'all',
  granularity: 'monthly',
  comparison: 'prev_year',
  scope2Method: 'location',
  ghgType: 'all',
  dataStatus: 'all',
  calcMethod: 'all',
  targetScenario: 'current'
};

const INTELLIGENCE_AREAS: { id: IntelligenceArea; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'emissions', label: 'Emissions', icon: Flame },
  { id: 'organisation', label: 'Organisation', icon: Building2 },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'netzero', label: 'Net-Zero Pathway', icon: Compass },
  { id: 'quality', label: 'Data Quality', icon: ShieldCheck }
];

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [filters, setFilters] = useState<GlobalFilterState>(INITIAL_FILTERS);
  const [activeArea, setActiveArea] = useState<IntelligenceArea>('overview');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Interactive Net-Zero scenario parameters shared between Overview & Net-Zero view
  const [annualReductionRate, setAnnualReductionRate] = useState<number>(3.9);
  const [targetYear, setTargetYear] = useState<number>(2040);

  // Custom overridden year data if simulations or credit retirements were run
  const [customDataOverrides, setCustomDataOverrides] = useState<Record<number, Partial<YearEmissionsData>>>({});

  // Modals state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedEmitter, setSelectedEmitter] = useState<EmitterItem | null>(null);

  const [notificationsCount] = useState(2);

  const baseData = EMISSIONS_DATA[filters.year] || EMISSIONS_DATA[2023];
  const override = customDataOverrides[filters.year] || {};
  const mergedYearData: YearEmissionsData = {
    ...baseData,
    ...override,
    scopes: {
      ...baseData.scopes,
      ...(override.scopes || {})
    }
  };

  const currentData = useMemo(
    () => applyGlobalFiltersToYearData(mergedYearData, filters),
    [mergedYearData, filters]
  );

  const handleFilterChange = (next: GlobalFilterState) => {
    setFilters(next);
    if (next.targetScenario !== filters.targetScenario) {
      if (next.targetScenario === 'current') setAnnualReductionRate(3.9);
      if (next.targetScenario === 'planned') setAnnualReductionRate(9.0);
      if (next.targetScenario === 'accelerated') setAnnualReductionRate(13.7);
    }
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({ ...INITIAL_FILTERS, year: prev.year }));
    setAnnualReductionRate(3.9);
  };

  const handleApplySimulation = (newTotal: number, newOffset: number) => {
    const net = Math.max(0, newTotal - newOffset);
    setCustomDataOverrides((prev) => ({
      ...prev,
      [filters.year]: {
        ...prev[filters.year],
        totalEmissions: newTotal,
        netEmissions: net
      }
    }));
  };

  const handleExportCSV = () => {
    const headers = ['Month', 'Scope 1 (tCO2e)', 'Scope 2 (tCO2e)', 'Scope 3 (tCO2e)', 'Total Monthly (tCO2e)'];
    const rows = currentData.monthly.map((m) => [m.month, m.scope1, m.scope2, m.scope3, m.total]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        '# TULA CARBON AUDITED GHG EMISSIONS REPORT',
        `# Year: ${currentData.year} | Org: ${filters.orgId} | Scope 2 Method: ${filters.scope2Method}`,
        headers.join(','),
        ...rows.map((e) => e.join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TulaCarbon_Emissions_${currentData.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearchAction = (action: string) => {
    if (action === 'simulator') {
      setIsSimulatorOpen(true);
    } else if (action === 'reports') {
      setIsReportModalOpen(true);
    }
  };

  return (
    <div className="analytics-canvas min-h-screen text-[#15131A] relative pb-10 selection:bg-[#5625B8]/15 selection:text-[#5625B8]">
      <FloatingNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedYear={filters.year}
        setSelectedYear={(yr) => setFilters((f) => ({ ...f, year: yr }))}
        selectedOrg={filters.orgId}
        setSelectedOrg={(org) => setFilters((f) => ({ ...f, orgId: org }))}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        notificationsCount={notificationsCount}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 mt-4 sm:mt-5 space-y-5">
        {(activeTab === 'dashboard' || activeTab === 'act' || activeTab === 'reduce' || activeTab === 'users') && (
          <div className="space-y-4">
            {/* Compact Intelligence Header + 6-Area Switcher + Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[20px] sm:text-[24px] font-semibold text-[#15131A] tracking-tight leading-tight">
                      Carbon Intelligence
                    </h1>
                    <span className="text-[11px] font-data font-medium text-[#5625B8] bg-[#F1EDFF] border border-[#D9CFFA] px-2 py-0.5 rounded-full">
                      FY {filters.year}
                    </span>
                  </div>
                </div>

                {/* 6-Area Sub-Navigation */}
                <div
                  role="tablist"
                  aria-label="Carbon Intelligence areas"
                  className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EEEAF5]/85 border border-[#D8D2DF] overflow-x-auto max-w-full"
                >
                  {INTELLIGENCE_AREAS.map((area) => {
                    const Icon = area.icon;
                    const active = activeArea === area.id;
                    return (
                      <button
                        key={area.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveArea(area.id)}
                        className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          active ? 'text-white' : 'text-[#494454] hover:text-[#15131A] hover:bg-white/75'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="intelligence-area-pill"
                            transition={{ layout: { duration: prefersReducedMotion ? 0 : 0.2 } }}
                            className="absolute inset-0 rounded-lg bg-[#5625B8] shadow-xs"
                          />
                        )}
                        <Icon className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">{area.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right CTAs */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#5625B8] hover:bg-[#461D98] text-[#FFFFFF] border border-[#5625B8] shadow-xs transition-colors text-[12px] font-medium cursor-pointer whitespace-nowrap"
                  title="Export audited emissions data to CSV"
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={1.85} />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setActiveArea('overview');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F1EDFF] text-[#15131A] hover:text-[#5625B8] border border-[#D8D2DF] hover:border-[#5625B8]/40 shadow-2xs transition-colors text-[12px] font-medium cursor-pointer whitespace-nowrap"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#5625B8]" strokeWidth={1.85} />
                  <span>Main Data Dashboard</span>
                </button>
              </div>
            </div>

            {/* Global Filter System */}
            <GlobalFilterBar filters={filters} onChange={handleFilterChange} onReset={handleResetFilters} />

            {/* AREA 1: EXECUTIVE OVERVIEW BENTO */}
            {activeArea === 'overview' && (
              <motion.div
                variants={prefersReducedMotion ? reducedContainerVariants : containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-5"
              >
                {/* Row 1: 4-Column Executive KPI Strip */}
                <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[0]}>
                  <KpiSummaryStrip
                    data={currentData}
                    annualReductionRate={annualReductionRate}
                    targetYear={targetYear}
                    onNavigateNetZero={() => setActiveArea('netzero')}
                  />
                </motion.div>

                {/* Row 2: 5 cols Scope Footprint + 7 cols Hero Net-Zero Roadmap */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[1]} className="lg:col-span-5 flex flex-col">
                    <TotalEmissionsCard
                      data={currentData}
                      activeScope={filters.scope}
                      setActiveScope={(scope) => setFilters((f) => ({ ...f, scope }))}
                      userName="Alex"
                    />
                  </motion.div>

                  <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[2]} className="lg:col-span-7 flex flex-col">
                    <NetZeroRoadmapCard
                      data={currentData}
                      annualRate={annualReductionRate}
                      setAnnualRate={setAnnualReductionRate}
                      targetYear={targetYear}
                      setTargetYear={setTargetYear}
                      onExploreScenarios={() => setActiveArea('netzero')}
                    />
                  </motion.div>
                </div>

                {/* Row 3: 7 cols Monthly/Quarterly Timeline + 5 cols Top 5 Emissions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[2]} className="lg:col-span-7 flex flex-col">
                    <MonthlyTimelineCard
                      data={currentData}
                      granularity={filters.granularity}
                      activeScope={filters.scope}
                      selectedOrgId={filters.orgId}
                      scope2Method={filters.scope2Method}
                    />
                  </motion.div>

                  <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[3]} className="lg:col-span-5 flex flex-col">
                    <TopEmittersCard data={currentData} onSelectEmitter={setSelectedEmitter} />
                  </motion.div>
                </div>

                {/* Row 4: Live Emissions + Reduction Portfolio + Intensity & Energy + Data Quality */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
                  <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[0]} className="flex flex-col">
                    <LiveEmissionsCard data={currentData} globalOrgId={filters.orgId} />
                  </motion.div>

                  <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[1]} className="flex flex-col">
                    <EmissionsOffsetCard data={currentData} />
                  </motion.div>

                  <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[2]} className="flex flex-col">
                    <IntensityEnergyCard data={currentData} scope2Method={filters.scope2Method} />
                  </motion.div>

                  <motion.div variants={prefersReducedMotion ? reducedCardVariants : cardEntranceVariants[3]} className="flex flex-col">
                    <DataQualityCard onOpenQualityView={() => setActiveArea('quality')} />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* AREA 2: EMISSIONS & SCOPE DRILL-DOWN */}
            {activeArea === 'emissions' && (
              <EmissionsAnalysisView
                data={currentData}
                activeScope={filters.scope}
                setActiveScope={(scope) => setFilters((f) => ({ ...f, scope }))}
                scope2Method={filters.scope2Method}
                setScope2Method={(scope2Method) => setFilters((f) => ({ ...f, scope2Method }))}
              />
            )}

            {/* AREA 3: ORGANISATION & FACILITY MATRIX */}
            {activeArea === 'organisation' && (
              <OrganisationIntelligenceView
                data={currentData}
                selectedOrgId={filters.orgId}
                onSelectOrg={(orgId) => setFilters((f) => ({ ...f, orgId }))}
                onSelectFacility={setSelectedEmitter}
              />
            )}

            {/* AREA 4: PERFORMANCE & HISTORICAL COMPARISONS */}
            {activeArea === 'performance' && (
              <PerformanceView data={currentData} scope2Method={filters.scope2Method} />
            )}

            {/* AREA 5: NET-ZERO PATHWAY & MACC */}
            {activeArea === 'netzero' && (
              <NetZeroPathwayView
                data={currentData}
                annualRate={annualReductionRate}
                setAnnualRate={setAnnualReductionRate}
                targetYear={targetYear}
                setTargetYear={setTargetYear}
              />
            )}

            {/* AREA 6: DATA QUALITY & REPORTING CONFIDENCE */}
            {activeArea === 'quality' && <DataQualityView data={currentData} />}
          </div>
        )}

        {activeTab === 'organization' && (
          <OrganizationView data={currentData} onSelectFacility={setSelectedEmitter} />
        )}

        {activeTab === 'measure' && <TelemetryView data={currentData} />}

        {activeTab === 'analysis' && <AnalyticsShowcase data={currentData} />}
      </main>

      {/* Global Interactive Modals */}
      <SimulationModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        data={currentData}
        onApplySimulation={handleApplySimulation}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        data={currentData}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        data={currentData}
        onSelectAction={handleSearchAction}
      />

      <FacilityDetailModal emitter={selectedEmitter} onClose={() => setSelectedEmitter(null)} />
    </div>
  );
}
