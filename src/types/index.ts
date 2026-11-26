export type ScopeType = 'all' | 'scope1' | 'scope2' | 'scope3';
export type IntelligenceArea = 'overview' | 'emissions' | 'organisation' | 'performance' | 'netzero' | 'quality';
export type GranularityType = 'monthly' | 'quarterly';
export type ComparisonType = 'prev_year' | 'baseline';
export type Scope2Method = 'location' | 'market';
export type DataStatusFilter = 'all' | 'approved' | 'provisional' | 'estimated';
export type CalcMethodFilter = 'all' | 'activity' | 'spend' | 'supplier';
export type TargetScenario = 'current' | 'planned' | 'accelerated';

export interface GlobalFilterState {
  orgId: string;
  year: number;
  scope: ScopeType;
  granularity: GranularityType;
  comparison: ComparisonType;
  scope2Method: Scope2Method;
  ghgType: 'all' | 'CO2' | 'CH4' | 'N2O' | 'HFCs';
  dataStatus: DataStatusFilter;
  calcMethod: CalcMethodFilter;
  targetScenario: TargetScenario;
}

export interface OrgNode {
  id: string;
  name: string;
  level: 'parent' | 'region' | 'facility';
  parentId?: string;
  region?: string;
  facilityCount: number;
  shareFactor: number; // deterministic rollup proportion of global emissions
  scopeWeights: { scope1: number; scope2: number; scope3: number };
  intensity?: number; // tCO2e / unit
  yoyTrend: number;
  primaryScope: 'Scope 1' | 'Scope 2' | 'Scope 3';
}

export interface BusinessUnitItem {
  id: string;
  name: string;
  emissions: number;
  share: number;
  trend: number;
  primaryScope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  sites: {
    id: string;
    name: string;
    location: string;
    emissions: number;
    share: number;
    trend: number;
    primaryScope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  }[];
}

export interface Scope1BreakdownItem {
  id: string;
  category: 'Stationary Combustion' | 'Mobile Combustion' | 'Fugitive Emissions' | 'Process Emissions';
  fuel: string;
  emissions: number;
  share: number;
  trend: number;
}

export interface Scope3CategoryItem {
  number: number;
  name: string;
  emissions: number;
  share: number;
  method: 'Activity-based' | 'Spend-based' | 'Supplier-specific';
  trend: number;
  applicable: boolean;
}

export interface SupplierHotspot {
  id: string;
  name: string;
  category: string;
  emissions: number;
  share: number;
  cumulativeShare: number;
  primaryData: boolean;
}

export interface WaterfallDriver {
  id: string;
  label: string;
  delta: number; // positive = increase, negative = decrease, 0 = total anchor
  type: 'start' | 'increase' | 'decrease' | 'end';
  detail: string;
}

export interface DecarbLever {
  id: string;
  name: string;
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  startYear: number;
  annualAbatement: number; // tCO2e / yr
  costPerTonne: number; // USD/tCO2e (negative = net savings)
  capexMillion: number;
  enabledByDefault: boolean;
}

export interface NetZeroMilestone {
  year: number;
  title: string;
  targetTonnes: number;
  status: 'achieved' | 'latest' | 'near-term' | 'long-term' | 'net-zero';
  note: string;
}

export interface DataQualityMetric {
  id: string;
  label: string;
  percent: number;
  numerator: number;
  denominator: number;
  unitLabel: string;
  status: 'approved' | 'warning' | 'submitted';
  detail: string;
}

export interface ScopeMetric {
  name: string;
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  percentage: number;
  value: number; // in tonnes
  color: string;
  description: string;
}

export interface MonthlyEmissions {
  month: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

export interface EmitterItem {
  id: string;
  name: string;
  category: 'facility' | 'source';
  emissions: number; // in tCO2e
  percentage: number;
  location?: string;
  primaryScope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  trend: number; // % change YoY
}

export interface YearEmissionsData {
  year: number;
  totalEmissions: number; // 141.6k etc
  previousYear: number;
  baselineYear: number;
  deviationFromTarget: number;
  previousYearPct: number;
  baselineYearPct: number;
  deviationPct: number;
  netEmissions: number;
  totalOffset: number;
  scopes: {
    scope1: ScopeMetric;
    scope2: ScopeMetric;
    scope3: ScopeMetric;
  };
  monthly: MonthlyEmissions[];
  topFacilities: EmitterItem[];
  topSources: EmitterItem[];
  energy: {
    windProduced: number; // kWh
    solarProduced: number; // kWh
    totalProduced: number; // kWh
    totalConsumed: number; // kWh
    surplus: number;
    avoidedCarbon: number; // tonnes
    windSpeed: number; // m/s
    windRpm: string;
    efficiency: number;
  };
}

export interface CarbonCreditProject {
  id: string;
  name: string;
  standard: string; // e.g. Verra VCS, Gold Standard, Puro.earth
  category: string;
  location: string;
  pricePerTonne: number; // USD
  availableTonnes: number;
  rating: string;
  description: string;
}
