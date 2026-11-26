import {
  BusinessUnitItem,
  DataQualityMetric,
  DecarbLever,
  GlobalFilterState,
  NetZeroMilestone,
  OrgNode,
  Scope1BreakdownItem,
  Scope3CategoryItem,
  SupplierHotspot,
  WaterfallDriver,
  YearEmissionsData
} from '../types';

export const ORG_HIERARCHY: OrgNode[] = [
  {
    id: 'org-global',
    name: 'Entire Organisation (Global)',
    level: 'parent',
    facilityCount: 54,
    shareFactor: 1,
    scopeWeights: { scope1: 1, scope2: 1, scope3: 1 },
    intensity: 0.84,
    yoyTrend: -3.0,
    primaryScope: 'Scope 3'
  },
  {
    id: 'org-apac',
    name: 'India & APAC Operations',
    level: 'region',
    parentId: 'org-global',
    region: 'APAC',
    facilityCount: 18,
    shareFactor: 0.39,
    scopeWeights: { scope1: 0.42, scope2: 0.44, scope3: 0.37 },
    intensity: 0.91,
    yoyTrend: -4.2,
    primaryScope: 'Scope 3'
  },
  {
    id: 'fac-hyd',
    name: 'Hyderabad Manufacturing',
    level: 'facility',
    parentId: 'org-apac',
    region: 'India',
    facilityCount: 1,
    shareFactor: 0.19,
    scopeWeights: { scope1: 0.24, scope2: 0.22, scope3: 0.17 },
    intensity: 1.12,
    yoyTrend: -5.4,
    primaryScope: 'Scope 1'
  },
  {
    id: 'fac-blr',
    name: 'Bengaluru Logistics Hub',
    level: 'facility',
    parentId: 'org-apac',
    region: 'India',
    facilityCount: 1,
    shareFactor: 0.12,
    scopeWeights: { scope1: 0.11, scope2: 0.12, scope3: 0.13 },
    intensity: 0.78,
    yoyTrend: -2.8,
    primaryScope: 'Scope 3'
  },
  {
    id: 'fac-bom',
    name: 'Mumbai Corporate Office',
    level: 'facility',
    parentId: 'org-apac',
    region: 'India',
    facilityCount: 1,
    shareFactor: 0.08,
    scopeWeights: { scope1: 0.07, scope2: 0.10, scope3: 0.07 },
    intensity: 0.44,
    yoyTrend: -6.1,
    primaryScope: 'Scope 2'
  },
  {
    id: 'org-eu',
    name: 'Europe Operations',
    level: 'region',
    parentId: 'org-global',
    region: 'Europe',
    facilityCount: 19,
    shareFactor: 0.34,
    scopeWeights: { scope1: 0.36, scope2: 0.28, scope3: 0.34 },
    intensity: 0.76,
    yoyTrend: -6.8,
    primaryScope: 'Scope 1'
  },
  {
    id: 'fac-rtm',
    name: 'Rotterdam Terminal',
    level: 'facility',
    parentId: 'org-eu',
    region: 'Netherlands',
    facilityCount: 1,
    shareFactor: 0.19,
    scopeWeights: { scope1: 0.22, scope2: 0.13, scope3: 0.19 },
    intensity: 0.94,
    yoyTrend: -4.6,
    primaryScope: 'Scope 1'
  },
  {
    id: 'fac-muc',
    name: 'Munich Manufacturing',
    level: 'facility',
    parentId: 'org-eu',
    region: 'Germany',
    facilityCount: 1,
    shareFactor: 0.15,
    scopeWeights: { scope1: 0.14, scope2: 0.15, scope3: 0.15 },
    intensity: 0.68,
    yoyTrend: -8.9,
    primaryScope: 'Scope 2'
  },
  {
    id: 'org-na',
    name: 'North America Operations',
    level: 'region',
    parentId: 'org-global',
    region: 'North America',
    facilityCount: 17,
    shareFactor: 0.27,
    scopeWeights: { scope1: 0.22, scope2: 0.28, scope3: 0.29 },
    intensity: 0.79,
    yoyTrend: -1.4,
    primaryScope: 'Scope 2'
  },
  {
    id: 'fac-aus',
    name: 'Austin Data Centre',
    level: 'facility',
    parentId: 'org-na',
    region: 'USA',
    facilityCount: 1,
    shareFactor: 0.16,
    scopeWeights: { scope1: 0.10, scope2: 0.20, scope3: 0.17 },
    intensity: 0.89,
    yoyTrend: 1.8,
    primaryScope: 'Scope 2'
  },
  {
    id: 'fac-tor',
    name: 'Toronto Office',
    level: 'facility',
    parentId: 'org-na',
    region: 'Canada',
    facilityCount: 1,
    shareFactor: 0.11,
    scopeWeights: { scope1: 0.12, scope2: 0.08, scope3: 0.12 },
    intensity: 0.51,
    yoyTrend: -5.2,
    primaryScope: 'Scope 3'
  }
];

export const BUSINESS_UNITS: BusinessUnitItem[] = [
  {
    id: 'bu-mfg',
    name: 'Manufacturing',
    emissions: 54000,
    share: 38.1,
    trend: -5.4,
    primaryScope: 'Scope 1',
    sites: [
      { id: 's-hyd', name: 'Hyderabad Manufacturing Plant', location: 'Telangana, IN', emissions: 29400, share: 20.8, trend: -6.1, primaryScope: 'Scope 1' },
      { id: 's-muc', name: 'Munich Assembly Plant', location: 'Bavaria, DE', emissions: 16200, share: 11.4, trend: -4.8, primaryScope: 'Scope 2' },
      { id: 's-sao', name: 'São Paulo Precision Plant', location: 'SP, BR', emissions: 8400, share: 5.9, trend: -3.2, primaryScope: 'Scope 1' }
    ]
  },
  {
    id: 'bu-log',
    name: 'Logistics & Ports',
    emissions: 32600,
    share: 23.0,
    trend: -2.1,
    primaryScope: 'Scope 3',
    sites: [
      { id: 's-rtm', name: 'Rotterdam Port Terminal', location: 'Rotterdam, NL', emissions: 17100, share: 12.1, trend: -1.4, primaryScope: 'Scope 1' },
      { id: 's-blr', name: 'Bengaluru Logistics Hub', location: 'Karnataka, IN', emissions: 9800, share: 6.9, trend: -2.9, primaryScope: 'Scope 3' },
      { id: 's-sgp', name: 'Tuas Marine Hub', location: 'Singapore', emissions: 5700, share: 4.0, trend: -2.4, primaryScope: 'Scope 3' }
    ]
  },
  {
    id: 'bu-dc',
    name: 'Data Centres',
    emissions: 25000,
    share: 17.7,
    trend: 1.6,
    primaryScope: 'Scope 2',
    sites: [
      { id: 's-aus', name: 'Austin Cloud Campus', location: 'Texas, US', emissions: 15800, share: 11.2, trend: 2.1, primaryScope: 'Scope 2' },
      { id: 's-fra', name: 'Frankfurt Edge Cluster', location: 'Hesse, DE', emissions: 9200, share: 6.5, trend: 0.8, primaryScope: 'Scope 2' }
    ]
  },
  {
    id: 'bu-ret',
    name: 'Retail & Distribution',
    emissions: 18000,
    share: 12.7,
    trend: -4.5,
    primaryScope: 'Scope 3',
    sites: [
      { id: 's-west', name: 'West India Regional Outlets', location: 'Maharashtra, IN', emissions: 10200, share: 7.2, trend: -5.0, primaryScope: 'Scope 2' },
      { id: 's-eu-r', name: 'Benelux Showrooms', location: 'NL / BE', emissions: 7800, share: 5.5, trend: -3.8, primaryScope: 'Scope 3' }
    ]
  },
  {
    id: 'bu-corp',
    name: 'Corporate Offices',
    emissions: 12000,
    share: 8.5,
    trend: -7.9,
    primaryScope: 'Scope 2',
    sites: [
      { id: 's-bom', name: 'Mumbai HQ', location: 'Mumbai, IN', emissions: 6800, share: 4.8, trend: -8.2, primaryScope: 'Scope 2' },
      { id: 's-tor', name: 'Toronto Corporate', location: 'Ontario, CA', emissions: 5200, share: 3.7, trend: -7.4, primaryScope: 'Scope 3' }
    ]
  }
];

export const SCOPE1_BREAKDOWN: Scope1BreakdownItem[] = [
  { id: 's1-stat', category: 'Stationary Combustion', fuel: 'Natural Gas & Boilers', emissions: 11240, share: 46.7, trend: -5.8 },
  { id: 's1-mob', category: 'Mobile Combustion', fuel: 'Diesel & Petrol Fleet', emissions: 7180, share: 29.8, trend: -9.2 },
  { id: 's1-proc', category: 'Process Emissions', fuel: 'Thermal & Kiln Operations', emissions: 3890, share: 16.2, trend: -2.1 },
  { id: 's1-fug', category: 'Fugitive Emissions', fuel: 'HFC Refrigerant Leakage', emissions: 1762, share: 7.3, trend: -12.4 }
];

export const SCOPE3_CATEGORIES: Scope3CategoryItem[] = [
  { number: 1, name: 'Purchased goods and services', emissions: 48200, share: 46.0, method: 'Supplier-specific', trend: -2.4, applicable: true },
  { number: 4, name: 'Upstream transportation & distribution', emissions: 19909, share: 19.0, method: 'Activity-based', trend: 3.1, applicable: true },
  { number: 11, name: 'Use of sold products', emissions: 14670, share: 14.0, method: 'Activity-based', trend: -4.8, applicable: true },
  { number: 2, name: 'Capital goods', emissions: 9431, share: 9.0, method: 'Spend-based', trend: -1.9, applicable: true },
  { number: 6, name: 'Business travel', emissions: 5239, share: 5.0, method: 'Activity-based', trend: -11.2, applicable: true },
  { number: 3, name: 'Fuel- and energy-related activities', emissions: 2410, share: 2.3, method: 'Activity-based', trend: -3.5, applicable: true },
  { number: 9, name: 'Downstream transportation', emissions: 1886, share: 1.8, method: 'Spend-based', trend: -1.2, applicable: true },
  { number: 7, name: 'Employee commuting', emissions: 1257, share: 1.2, method: 'Spend-based', trend: -6.0, applicable: true },
  { number: 5, name: 'Waste generated in operations', emissions: 943, share: 0.9, method: 'Activity-based', trend: -8.4, applicable: true },
  { number: 12, name: 'End-of-life treatment of sold products', emissions: 839, share: 0.8, method: 'Spend-based', trend: -2.0, applicable: true },
  { number: 8, name: 'Upstream leased assets', emissions: 0, share: 0, method: 'Spend-based', trend: 0, applicable: false },
  { number: 10, name: 'Processing of sold products', emissions: 0, share: 0, method: 'Spend-based', trend: 0, applicable: false },
  { number: 13, name: 'Downstream leased assets', emissions: 0, share: 0, method: 'Spend-based', trend: 0, applicable: false },
  { number: 14, name: 'Franchises', emissions: 0, share: 0, method: 'Spend-based', trend: 0, applicable: false },
  { number: 15, name: 'Investments', emissions: 0, share: 0, method: 'Spend-based', trend: 0, applicable: false }
];

export const SUPPLIER_HOTSPOTS: SupplierHotspot[] = [
  { id: 'sup-1', name: 'ArcelorMittal Low-Carbon Alloys', category: 'Raw Steel & Metals', emissions: 16420, share: 15.7, cumulativeShare: 15.7, primaryData: true },
  { id: 'sup-2', name: 'Maersk Ocean Freight', category: 'Upstream Marine Logistics', emissions: 12850, share: 12.3, cumulativeShare: 28.0, primaryData: true },
  { id: 'sup-3', name: 'Nippon Industrial Polymers', category: 'Resins & Packaging', emissions: 9140, share: 8.7, cumulativeShare: 36.7, primaryData: false },
  { id: 'sup-4', name: 'DHL Global Forwarding', category: 'Air & Road Distribution', emissions: 7060, share: 6.7, cumulativeShare: 43.4, primaryData: true },
  { id: 'sup-5', name: 'TSMC Foundry Services', category: 'Electronic Components', emissions: 6120, share: 5.8, cumulativeShare: 49.2, primaryData: false },
  { id: 'sup-6', name: 'Remaining 142 Tier-1 Suppliers', category: 'Mixed Categories', emissions: 53194, share: 50.8, cumulativeShare: 100, primaryData: false }
];

export const HISTORICAL_INVENTORY = [
  { year: 2020, label: '2020 (Base)', gross: 180000, target: 180000, scope1: 31200, scope2: 24800, scope3: 124000, intensityProd: 1.08, intensityRev: 3.12 },
  { year: 2021, label: '2021', gross: 168400, target: 164000, scope1: 29100, scope2: 21300, scope3: 118000, intensityProd: 1.02, intensityRev: 2.95 },
  { year: 2022, label: '2022', gross: 158200, target: 149000, scope1: 27400, scope2: 18200, scope3: 112600, intensityProd: 0.96, intensityRev: 2.81 },
  { year: 2023, label: '2023', gross: 151800, target: 135000, scope1: 26100, scope2: 16100, scope3: 109600, intensityProd: 0.92, intensityRev: 2.69 },
  { year: 2024, label: '2024', gross: 146000, target: 122000, scope1: 25100, scope2: 14400, scope3: 106500, intensityProd: 0.89, intensityRev: 2.56 },
  { year: 2025, label: '2025', gross: 141600, target: 110000, scope1: 24072, scope2: 12744, scope3: 104784, intensityProd: 0.84, intensityRev: 2.48 }
];

export const WATERFALL_DRIVERS: WaterfallDriver[] = [
  { id: 'wf-start', label: 'Prior Year', delta: 146000, type: 'start', detail: 'Audited gross footprint' },
  { id: 'wf-growth', label: 'Output Growth', delta: 7400, type: 'increase', detail: '+6.8% production volume expansion' },
  { id: 'wf-ppa', label: 'Solar PPA', delta: -5100, type: 'decrease', detail: 'Munich & Hyderabad 65% green tariff shift' },
  { id: 'wf-fleet', label: 'BEV Fleet', delta: -3400, type: 'decrease', detail: '110 commercial diesel vans electrified' },
  { id: 'wf-sup', label: 'Supplier Shift', delta: -3300, type: 'decrease', detail: 'Low-carbon alloy & ocean route optimization' },
  { id: 'wf-end', label: 'Current FY', delta: 141600, type: 'end', detail: '-4,400 tCO₂e net annual change (-3.0%)' }
];

export const GHG_COMPOSITION = [
  { gas: 'CO₂', name: 'Carbon Dioxide', share: 88.4, tonnes: 125174, color: '#5625B8' },
  { gas: 'CH₄', name: 'Methane', share: 6.2, tonnes: 8779, color: '#F46A1F' },
  { gas: 'N₂O', name: 'Nitrous Oxide', share: 3.1, tonnes: 4390, color: '#2563EB' },
  { gas: 'HFCs', name: 'Fluorinated Gases', share: 2.3, tonnes: 3257, color: '#238C78' }
];

export const DECARB_LEVERS: DecarbLever[] = [
  { id: 'lev-ppa', name: '100% Renewable PPA Across Manufacturing', scope: 'Scope 2', startYear: 2027, annualAbatement: 9400, costPerTonne: -18, capexMillion: 4.2, enabledByDefault: true },
  { id: 'lev-heat', name: 'Industrial Heat Pump & Boiler Electrification', scope: 'Scope 1', startYear: 2028, annualAbatement: 11200, costPerTonne: 42, capexMillion: 8.6, enabledByDefault: true },
  { id: 'lev-bev', name: 'Heavy Freight & Port Fleet Electrification', scope: 'Scope 1', startYear: 2028, annualAbatement: 6800, costPerTonne: 28, capexMillion: 5.1, enabledByDefault: true },
  { id: 'lev-steel', name: 'Green Steel & Recycled Alloy Procurement', scope: 'Scope 3', startYear: 2029, annualAbatement: 28500, costPerTonne: 64, capexMillion: 12.4, enabledByDefault: false },
  { id: 'lev-log', name: 'Bio-LNG & Zero-Emission Ocean Freight', scope: 'Scope 3', startYear: 2030, annualAbatement: 15600, costPerTonne: 85, capexMillion: 7.5, enabledByDefault: false },
  { id: 'lev-hvac', name: 'Data Centre Immersion Cooling & Waste Heat', scope: 'Scope 2', startYear: 2027, annualAbatement: 4900, costPerTonne: -32, capexMillion: 2.9, enabledByDefault: true }
];

export const NET_ZERO_MILESTONES: NetZeroMilestone[] = [
  { year: 2020, title: 'Baseline Established', targetTonnes: 180000, status: 'achieved', note: 'SBTi base-year inventory verified' },
  { year: 2025, title: 'Latest Audited Inventory', targetTonnes: 141600, status: 'latest', note: '21.3% gross reduction vs 2020 baseline' },
  { year: 2030, title: 'Near-Term Milestone', targetTonnes: 90000, status: 'near-term', note: '-50% gross target · Scopes 1, 2 & priority Scope 3' },
  { year: 2035, title: 'Long-Term Milestone', targetTonnes: 45000, status: 'long-term', note: '-75% gross reduction · Deep supplier decarbonisation' },
  { year: 2040, title: 'Net-Zero Threshold', targetTonnes: 18000, status: 'net-zero', note: '-90% gross abatement + eligible permanent removals' }
];

export const DATA_QUALITY_METRICS: DataQualityMetric[] = [
  {
    id: 'dq-comp',
    label: 'Data Completeness',
    percent: 92,
    numerator: 596,
    denominator: 648,
    unitLabel: 'expected activity records',
    status: 'approved',
    detail: '52 utility & freight sub-ledger records pending Q4 meter sync'
  },
  {
    id: 'dq-evid',
    label: 'Supporting Evidence',
    percent: 86,
    numerator: 513,
    denominator: 596,
    unitLabel: 'records with invoice/meter docs',
    status: 'warning',
    detail: '83 Scope 3 logistics manifests awaiting carrier PDF attachment'
  },
  {
    id: 'dq-appr',
    label: 'Approved Records',
    percent: 94,
    numerator: 560,
    denominator: 596,
    unitLabel: 'controller sign-offs',
    status: 'approved',
    detail: '36 provisional entries in controller review queue'
  },
  {
    id: 'dq-prim',
    label: 'Primary Data Coverage',
    percent: 72,
    numerator: 101952,
    denominator: 141600,
    unitLabel: 'tCO₂e measured directly',
    status: 'submitted',
    detail: '28% spend-based or EEIO secondary emission factors'
  }
];

/**
 * Deterministic Net-Zero compound reduction model:
 * E_y = E_c * (1 - r)^(y - c)
 */
export function projectEmissions(currentEmissions: number, annualRatePct: number, currentYear: number, targetYear: number): number {
  const r = annualRatePct / 100;
  const years = targetYear - currentYear;
  if (years <= 0) return currentEmissions;
  return Math.round(currentEmissions * Math.pow(1 - r, years));
}

export function computeProjectedThresholdYear(
  currentEmissions: number,
  annualRatePct: number,
  currentYear: number,
  thresholdEmissions: number
): number | null {
  const r = annualRatePct / 100;
  if (r <= 0 || currentEmissions <= thresholdEmissions) {
    return currentEmissions <= thresholdEmissions ? currentYear : null;
  }
  const yearsNeeded = Math.log(thresholdEmissions / currentEmissions) / Math.log(1 - r);
  if (!Number.isFinite(yearsNeeded) || yearsNeeded > 150) return null;
  return Math.ceil(currentYear + yearsNeeded);
}

/**
 * Deterministically scales a YearEmissionsData snapshot based on active GlobalFilterState
 * (organisation node, Scope 2 location/market method, etc.) without mutating source fixtures.
 */
export function applyGlobalFiltersToYearData(base: YearEmissionsData, filters: GlobalFilterState): YearEmissionsData {
  const org = ORG_HIERARCHY.find((o) => o.id === filters.orgId) ?? ORG_HIERARCHY[0];
  const s2Multiplier = filters.scope2Method === 'market' ? 0.78 : 1;
  const statusMultiplier =
    filters.dataStatus === 'approved' ? 0.94 : filters.dataStatus === 'provisional' ? 0.04 : filters.dataStatus === 'estimated' ? 0.02 : 1;
  const ghgMultiplier =
    filters.ghgType === 'CO2' ? 0.884 : filters.ghgType === 'CH4' ? 0.062 : filters.ghgType === 'N2O' ? 0.031 : filters.ghgType === 'HFCs' ? 0.023 : 1;
  const calcMultiplier =
    filters.calcMethod === 'activity' ? 0.62 : filters.calcMethod === 'spend' ? 0.24 : filters.calcMethod === 'supplier' ? 0.14 : 1;

  const extraFactor = statusMultiplier * ghgMultiplier * calcMultiplier;

  const s1Val = Math.round(base.scopes.scope1.value * org.scopeWeights.scope1 * extraFactor);
  const s2Val = Math.round(base.scopes.scope2.value * org.scopeWeights.scope2 * s2Multiplier * extraFactor);
  const s3Val = Math.round(base.scopes.scope3.value * org.scopeWeights.scope3 * extraFactor);
  const total = Math.max(1, s1Val + s2Val + s3Val);

  const s1Pct = Math.round((s1Val / total) * 100);
  const s2Pct = Math.round((s2Val / total) * 100);
  const s3Pct = Math.max(0, 100 - s1Pct - s2Pct);

  const scaleRatio = total / Math.max(base.totalEmissions, 1);

  return {
    ...base,
    totalEmissions: total,
    previousYear: Math.round(base.previousYear * scaleRatio),
    baselineYear: Math.round(base.baselineYear * scaleRatio),
    deviationFromTarget: Math.round(base.deviationFromTarget * scaleRatio),
    netEmissions: Math.max(0, total - Math.round(base.totalOffset * scaleRatio)),
    totalOffset: Math.round(base.totalOffset * scaleRatio),
    scopes: {
      scope1: { ...base.scopes.scope1, value: s1Val, percentage: s1Pct },
      scope2: { ...base.scopes.scope2, value: s2Val, percentage: s2Pct },
      scope3: { ...base.scopes.scope3, value: s3Val, percentage: s3Pct }
    },
    monthly: base.monthly.map((m) => {
      const mS1 = Math.round(m.scope1 * org.scopeWeights.scope1 * extraFactor);
      const mS2 = Math.round(m.scope2 * org.scopeWeights.scope2 * s2Multiplier * extraFactor);
      const mS3 = Math.round(m.scope3 * org.scopeWeights.scope3 * extraFactor);
      return {
        month: m.month,
        scope1: mS1,
        scope2: mS2,
        scope3: mS3,
        total: mS1 + mS2 + mS3
      };
    }),
    topFacilities: base.topFacilities.map((f) => ({
      ...f,
      emissions: Math.round(f.emissions * org.shareFactor * extraFactor)
    })),
    topSources: base.topSources.map((s) => ({
      ...s,
      emissions: Math.round(s.emissions * org.shareFactor * (s.primaryScope === 'Scope 2' ? s2Multiplier : 1) * extraFactor)
    }))
  };
}

export interface LiveTelemetryPoint {
  hour: string;
  ratePerHour: number; // tCO2e/hr
  scope1: number;
  scope2: number;
  scope3: number;
}

const HOURLY_PROFILE = [
  0.72, 0.68, 0.65, 0.67, 0.74, 0.88, 1.04, 1.18, 1.26, 1.31, 1.29, 1.24,
  1.22, 1.28, 1.33, 1.30, 1.21, 1.12, 1.01, 0.94, 0.88, 0.82, 0.78, 0.75
];

/**
 * Deterministic 24h live telemetry profile scaled by organisation node and active scopes.
 */
export function getLiveEmissionsSeries(
  baseAnnualTonnes: number,
  orgId: string,
  enabledScopes: { scope1: boolean; scope2: boolean; scope3: boolean }
): {
  points: LiveTelemetryPoint[];
  currentRate: number;
  todayTotal: number;
  activeNodes: number;
  peakHour: string;
} {
  const org = ORG_HIERARCHY.find((o) => o.id === orgId) ?? ORG_HIERARCHY[0];
  const avgHourlyGlobal = baseAnnualTonnes / 8760;

  const s1Weight = enabledScopes.scope1 ? 0.17 * org.scopeWeights.scope1 : 0;
  const s2Weight = enabledScopes.scope2 ? 0.09 * org.scopeWeights.scope2 : 0;
  const s3Weight = enabledScopes.scope3 ? 0.74 * org.scopeWeights.scope3 : 0;
  const combinedWeight = s1Weight + s2Weight + s3Weight;

  const points: LiveTelemetryPoint[] = HOURLY_PROFILE.map((mult, idx) => {
    const total = Number((avgHourlyGlobal * combinedWeight * mult).toFixed(2));
    const s1 = Number((avgHourlyGlobal * s1Weight * mult).toFixed(2));
    const s2 = Number((avgHourlyGlobal * s2Weight * mult).toFixed(2));
    const s3 = Number((avgHourlyGlobal * s3Weight * mult).toFixed(2));
    return {
      hour: `${String(idx).padStart(2, '0')}:00`,
      ratePerHour: total,
      scope1: s1,
      scope2: s2,
      scope3: s3
    };
  });

  const currentIdx = 17; // 17:00 current interval
  const todayPoints = points.slice(0, currentIdx + 1);
  const todayTotal = Number(todayPoints.reduce((sum, p) => sum + p.ratePerHour, 0).toFixed(1));
  const currentRate = points[currentIdx]?.ratePerHour ?? 0;
  const peak = points.reduce((best, p) => (p.ratePerHour > best.ratePerHour ? p : best), points[0]);
  const activeNodes = Math.max(3, Math.round(142 * org.shareFactor));

  return {
    points,
    currentRate,
    todayTotal,
    activeNodes,
    peakHour: peak.hour
  };
}

