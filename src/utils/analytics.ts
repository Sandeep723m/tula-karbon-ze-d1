import { ScopeType } from '../types';

export const REFERENCE_GROSS_TONNES = 141600;
export const BASELINE_2020_SHARE = 0.7867; // 141,600 / 180,000

export function formatCompactTonnes(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return Math.round(value).toLocaleString();
}

export function formatTonnes(value: number): string {
  return Math.round(value).toLocaleString();
}

export function scaleByGross(value: number, currentGross: number): number {
  return Math.round(value * (currentGross / REFERENCE_GROSS_TONNES));
}

export function getScopeColor(scope: string | ScopeType): string {
  if (scope === 'Scope 1' || scope === 'scope1') return '#5625B8';
  if (scope === 'Scope 2' || scope === 'scope2') return '#F46A1F';
  if (scope === 'Scope 3' || scope === 'scope3') return '#2563EB';
  return '#5625B8';
}

export function getScopeBadgeClass(scope: string): string {
  if (scope === 'Scope 1') return 'text-[#5625B8] bg-[#F1EDFF] border-[#D9CFFA]';
  if (scope === 'Scope 2') return 'text-[#C2410C] bg-[#FFF3EC] border-[#F9E2BF]';
  return 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]';
}

export function getDeltaBadgeClass(delta: number): string {
  return delta > 0
    ? 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
    : 'text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]';
}

export function formatSignedPct(value: number): string {
  return value > 0 ? `+${value}%` : `${value}%`;
}
