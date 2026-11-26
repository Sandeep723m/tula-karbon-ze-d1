import React, { useId } from 'react';

export interface AnalyticsCardProps {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Shared, self-contained surface for Tula Carbon analytics cards. */
export function AnalyticsCard({ title, badge, actions, children, className = '' }: AnalyticsCardProps) {
  const titleId = `analytics-card-${useId().replace(/:/g, '')}`;
  return (
    <section className={`glass-card-top min-w-0 p-4 sm:p-5 flex flex-col ${className}`} aria-labelledby={titleId}>
      <header className="mb-3.5 flex items-center justify-between gap-3 border-b border-[#E5E0EA] pb-3">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <h2 id={titleId} className="text-[16px] font-semibold tracking-tight text-[#15131A]">
            {title}
          </h2>
          {badge}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}
