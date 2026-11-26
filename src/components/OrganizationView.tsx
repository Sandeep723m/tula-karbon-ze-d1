import React from 'react';
import { MapPin } from 'lucide-react';
import { YearEmissionsData, EmitterItem } from '../types';

interface OrganizationViewProps {
  data: YearEmissionsData;
  onSelectFacility?: (facility: EmitterItem) => void;
}

const getScopeTagStyle = (scope: string) => {
  if (scope === 'Scope 1') return 'text-[#5625B8] bg-[#EEEAF5] border-[#5625B8]/25';
  if (scope === 'Scope 2') return 'text-[#C2410C] bg-[#FFF3EC] border-[#F46A1F]/25';
  return 'text-[#1D4ED8] bg-[#EFF6FF] border-[#2563EB]/25';
};

export const OrganizationView: React.FC<OrganizationViewProps> = ({
  data,
  onSelectFacility
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#15131A] tracking-tight leading-tight">
          Facilities &amp; Operational Boundary
        </h2>

        <div className="flex items-center gap-2 text-[12px] shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#D8D2DF] text-[#15131A] font-medium">
            <span className="font-data font-semibold">54</span> Facilities
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#ECFDF3] border border-[#BBF7D0] text-[#15803D] font-medium">
            <span className="font-data font-semibold">98.4%</span> Uptime
          </span>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.topFacilities.map((fac) => (
          <div
            key={fac.id}
            onClick={onSelectFacility ? () => onSelectFacility(fac) : undefined}
            className={`glass-card-top p-5 group flex flex-col justify-between ${
              onSelectFacility ? 'cursor-pointer' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${getScopeTagStyle(fac.primaryScope)}`}>
                  {fac.primaryScope} Primary
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                  Approved
                </span>
              </div>

              <h3 className="text-[16px] font-semibold text-[#15131A] mt-3 group-hover:text-[#5625B8] transition-colors line-clamp-1">
                {fac.name}
              </h3>

              <div className="flex items-center gap-1.5 text-[13px] text-[#667085] mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#85808D] shrink-0" strokeWidth={1.75} />
                <span className="truncate">{fac.location}</span>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#D8D2DF] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#85808D] uppercase font-medium tracking-wider">Emissions</div>
                <div className="text-[16px] font-semibold font-data text-[#15131A] mt-0.5">
                  {fac.emissions.toLocaleString()} <span className="text-[12px] text-[#667085] font-sans font-normal">tCO2e</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-[#85808D] uppercase font-medium tracking-wider">Target Variance</div>
                <div className={`text-[12px] font-semibold font-data mt-1 px-2 py-0.5 rounded-md border inline-block ${
                  fac.trend > 0
                    ? 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
                    : 'text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]'
                }`}>
                  {fac.trend > 0 ? `+${fac.trend}%` : `${fac.trend}%`} YoY
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
