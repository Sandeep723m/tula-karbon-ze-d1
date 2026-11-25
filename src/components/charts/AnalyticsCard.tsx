import React, { useId } from 'react';

export interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Shared, composable surface for chart cards and showcase examples. */
export function AnalyticsCard({ title, subtitle, eyebrow, actions, children, className = '' }: AnalyticsCardProps) {
  const titleId = `analytics-card-${useId().replace(/:/g, '')}`;
  return <section className={`glass-card-top min-w-0 p-5 sm:p-6 ${className}`} aria-labelledby={titleId}>
    <header className="mb-3 flex items-start justify-between gap-3 border-b border-[#E7E8ED] pb-3">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#878891]">{eyebrow}</p>}
        <h2 id={titleId} className="text-[15px] font-semibold tracking-tight text-[#18181B]">{title}</h2>
        {subtitle && <p className="mt-1 text-[11px] leading-relaxed text-[#62636D]">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
    {children}
  </section>;
}
