import React from 'react';
import { Zap, Activity, Waves, Thermometer } from 'lucide-react';
import { YearEmissionsData } from '../types';

interface TelemetryViewProps {
  data: YearEmissionsData;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ data }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#15131A] tracking-tight leading-tight">
            Emissions Sensor Telemetry
          </h2>
          <span className="font-data text-[11px] font-medium text-[#5625B8] bg-[#F1EDFF] border border-[#D9CFFA] px-2 py-0.5 rounded-full">
            FY {data.year}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[12px] shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-[#ECFDF3] border border-[#BBF7D0] text-[#15803D] font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#15803D]" />
            <span className="font-data font-semibold">142</span> Nodes Online
          </span>
        </div>
      </div>

      {/* Real-time telemetry cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-top p-5">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[13px] font-medium">Stack Flue Gas Velocity</span>
            <Waves className="w-4 h-4 text-[#5625B8]" strokeWidth={1.75} />
          </div>
          <div className="text-[24px] font-semibold font-data text-[#15131A] mt-2">
            18.4 <span className="text-[12px] text-[#667085] font-sans font-normal">m/s</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-2 py-0.5 rounded-md mt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            Nominal laminar flow
          </div>
        </div>

        <div className="glass-card-top p-5">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[13px] font-medium">Flue Gas Temperature</span>
            <Thermometer className="w-4 h-4 text-[#F46A1F]" strokeWidth={1.75} />
          </div>
          <div className="text-[24px] font-semibold font-data text-[#15131A] mt-2">
            164.2 <span className="text-[12px] text-[#667085] font-sans font-normal">°C</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-md mt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
            Heat recovery active
          </div>
        </div>

        <div className="glass-card-top p-5">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[13px] font-medium">Grid Frequency &amp; Power</span>
            <Zap className="w-4 h-4 text-[#2563EB]" strokeWidth={1.75} />
          </div>
          <div className="text-[24px] font-semibold font-data text-[#15131A] mt-2">
            50.02 <span className="text-[12px] text-[#667085] font-sans font-normal">Hz</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-md mt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
            Phase balanced · 0.98 PF
          </div>
        </div>

        <div className="glass-card-top p-5">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[13px] font-medium">Carbon Intensity</span>
            <Activity className="w-4 h-4 text-[#15803D]" strokeWidth={1.75} />
          </div>
          <div className="text-[24px] font-semibold font-data text-[#15131A] mt-2">
            0.38 <span className="text-[12px] text-[#667085] font-sans font-normal">kg/kWh</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-2 py-0.5 rounded-md mt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            12% below national grid
          </div>
        </div>
      </div>
    </div>
  );
};
