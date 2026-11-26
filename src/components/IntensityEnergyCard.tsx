import React, { useState } from 'react';
import { ArrowDownRight } from 'lucide-react';
import { Scope2Method, YearEmissionsData } from '../types';

interface IntensityEnergyCardProps {
  data: YearEmissionsData;
  scope2Method: Scope2Method;
}

export const IntensityEnergyCard: React.FC<IntensityEnergyCardProps> = ({ data, scope2Method }) => {
  const [tab, setTab] = useState<'intensity' | 'energy'>('intensity');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const scale = data.totalEmissions / 141600;
  const prodIntensity = Number((0.84 * (0.94 + 0.06 * scale)).toFixed(2));
  const revIntensity = Number((2.48 * (0.92 + 0.08 * scale)).toFixed(2));

  const totalMwh = Math.round(86400 * Math.max(0.1, data.scopes.scope2.value / 12744));
  const renewableMwh = Math.round(totalMwh * (scope2Method === 'market' ? 0.56 : 0.42));
  const otherMwh = Math.max(0, totalMwh - renewableMwh);
  const renewablePct = Math.round((renewableMwh / Math.max(totalMwh, 1)) * 100);

  return (
    <section className="glass-card-top p-4 sm:p-5 flex flex-col justify-between h-full" aria-labelledby="intensity-energy-title">
      {/* Unified Single-Line Header (No Icon Box) */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E0EA] min-h-[44px]">
        <h2 id="intensity-energy-title" className="text-[17px] font-semibold tracking-tight text-[#15131A] whitespace-nowrap">
          {tab === 'intensity' ? 'Carbon Intensity' : 'Energy Balance'}
        </h2>

        <div className="inline-flex items-center rounded-lg border border-[#D8D2DF] bg-[#EEEAF5] p-0.5 text-[11px] shrink-0">
          <button
            type="button"
            onClick={() => setTab('intensity')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              tab === 'intensity' ? 'bg-[#5625B8] text-white' : 'text-[#667085] hover:text-[#15131A]'
            }`}
          >
            Intensity
          </button>
          <button
            type="button"
            onClick={() => setTab('energy')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              tab === 'energy' ? 'bg-[#5625B8] text-white' : 'text-[#667085] hover:text-[#15131A]'
            }`}
          >
            Energy
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'intensity' ? (
        <div className="flex-1 flex flex-col justify-center gap-3.5 pt-3">
          {/* Production Intensity */}
          <div
            onMouseEnter={() => setHoveredItem('prod')}
            onMouseLeave={() => setHoveredItem(null)}
            className="rounded-xl border border-[#E8DFF4] bg-white/75 p-4 transition-colors hover:bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#667085]">Production Intensity</span>
              <span className="inline-flex items-center gap-0.5 font-data text-[11px] font-semibold text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-1.5 py-0.5 rounded-md">
                <ArrowDownRight className="w-3 h-3" />
                -6.4% YoY
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <div>
                <span className="font-data text-[28px] font-semibold text-[#15131A] tracking-tight leading-none">{prodIntensity}</span>
                <span className="ml-1.5 text-[11px] text-[#667085]">tCO₂e / tonne</span>
              </div>
              <div className="flex items-end gap-1 h-8" aria-hidden="true">
                {[1.08, 1.02, 0.96, 0.92, 0.89, prodIntensity].map((v, i) => (
                  <span
                    key={i}
                    className="w-2 rounded-sm transition-all"
                    style={{
                      height: `${Math.round((v / 1.15) * 30)}px`,
                      backgroundColor: i === 5 ? '#5625B8' : '#D9CFFA'
                    }}
                  />
                ))}
              </div>
            </div>
            {hoveredItem === 'prod' && (
              <div className="mt-2.5 pt-2 border-t border-[#EEEAF5] flex justify-between text-[10px] font-data text-[#667085]">
                <span>2020: 1.08 t/t</span>
                <span className="font-semibold text-[#15803D]">-22.2% vs base</span>
              </div>
            )}
          </div>

          {/* Revenue Intensity */}
          <div
            onMouseEnter={() => setHoveredItem('rev')}
            onMouseLeave={() => setHoveredItem(null)}
            className="rounded-xl border border-[#F2E6CF] bg-white/75 p-4 transition-colors hover:bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#667085]">Revenue Intensity</span>
              <span className="inline-flex items-center gap-0.5 font-data text-[11px] font-semibold text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-1.5 py-0.5 rounded-md">
                <ArrowDownRight className="w-3 h-3" />
                -3.1% YoY
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <div>
                <span className="font-data text-[28px] font-semibold text-[#15131A] tracking-tight leading-none">{revIntensity}</span>
                <span className="ml-1.5 text-[11px] text-[#667085]">tCO₂e / ₹L</span>
              </div>
              <div className="flex items-end gap-1 h-8" aria-hidden="true">
                {[3.12, 2.95, 2.81, 2.69, 2.56, revIntensity].map((v, i) => (
                  <span
                    key={i}
                    className="w-2 rounded-sm transition-all"
                    style={{
                      height: `${Math.round((v / 3.3) * 30)}px`,
                      backgroundColor: i === 5 ? '#F46A1F' : '#F9E2BF'
                    }}
                  />
                ))}
              </div>
            </div>
            {hoveredItem === 'rev' && (
              <div className="mt-2.5 pt-2 border-t border-[#EEEAF5] flex justify-between text-[10px] font-data text-[#667085]">
                <span>2020: 3.12 t/₹L</span>
                <span className="font-semibold text-[#15803D]">-20.5% vs base</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-5 pt-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] text-[#667085]">Total Energy</div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-data text-[30px] font-semibold text-[#15131A] tracking-tight leading-none">
                  {totalMwh.toLocaleString()}
                </span>
                <span className="text-[12px] text-[#667085]">MWh</span>
              </div>
            </div>
            <span className="font-data text-[11px] font-semibold text-[#238C78] bg-[#EAF8F5] border border-[#C4ECE1] px-2 py-0.5 rounded-full capitalize">
              {scope2Method} · {renewablePct}% RE
            </span>
          </div>

          <div>
            <div className="flex h-4 w-full gap-1 rounded-full overflow-hidden">
              <div
                onMouseEnter={() => setHoveredItem('ren')}
                onMouseLeave={() => setHoveredItem(null)}
                className="h-full rounded-l-full bg-[#238C78] transition-all duration-300 cursor-pointer"
                style={{ width: `${renewablePct}%` }}
                title={`Renewable: ${renewableMwh.toLocaleString()} MWh (${renewablePct}%)`}
              />
              <div
                onMouseEnter={() => setHoveredItem('grid')}
                onMouseLeave={() => setHoveredItem(null)}
                className="h-full rounded-r-full bg-[#D8D2DF] transition-all duration-300 cursor-pointer"
                style={{ width: `${100 - renewablePct}%` }}
                title={`Grid / Fuel: ${otherMwh.toLocaleString()} MWh (${100 - renewablePct}%)`}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 text-[11px]">
              <div className={`rounded-xl border p-3 transition-colors ${hoveredItem === 'ren' ? 'bg-[#EAF8F5] border-[#C4ECE1]' : 'bg-white/70 border-[#E5E0EA]'}`}>
                <div className="flex items-center gap-1.5 text-[#238C78] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#238C78]" />
                  Renewable ({renewablePct}%)
                </div>
                <div className="font-data font-semibold text-[15px] text-[#15131A] mt-1">
                  {renewableMwh.toLocaleString()} <span className="text-[10px] font-normal text-[#85808D]">MWh</span>
                </div>
              </div>
              <div className={`rounded-xl border p-3 transition-colors ${hoveredItem === 'grid' ? 'bg-[#F1EDFF] border-[#D9CFFA]' : 'bg-white/70 border-[#E5E0EA]'}`}>
                <div className="flex items-center gap-1.5 text-[#667085] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#85808D]" />
                  Grid ({100 - renewablePct}%)
                </div>
                <div className="font-data font-semibold text-[15px] text-[#15131A] mt-1">
                  {otherMwh.toLocaleString()} <span className="text-[10px] font-normal text-[#85808D]">MWh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
