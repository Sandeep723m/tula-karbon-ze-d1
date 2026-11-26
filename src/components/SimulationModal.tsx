import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { YearEmissionsData } from '../types';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: YearEmissionsData;
  onApplySimulation: (newTotal: number, newOffset: number) => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  data,
  onApplySimulation
}) => {
  if (!isOpen) return null;

  const [ppaRenewable, setPpaRenewable] = useState(60);
  const [fleetElectrification, setFleetElectrification] = useState(40);
  const [efficiencyGain, setEfficiencyGain] = useState(15);
  const [supplierEngagement, setSupplierEngagement] = useState(30);

  const scope2Reduction = data.scopes.scope2.value * (ppaRenewable / 100);
  const scope1Reduction = data.scopes.scope1.value * ((fleetElectrification * 0.4 + efficiencyGain * 0.6) / 100);
  const scope3Reduction = data.scopes.scope3.value * ((supplierEngagement * 0.25) / 100);

  const totalReduction = Math.round(scope1Reduction + scope2Reduction + scope3Reduction);
  const simulatedTotal = Math.max(0, data.totalEmissions - totalReduction);
  const simulatedNet = Math.max(0, simulatedTotal - data.totalOffset);
  const percentReduced = ((totalReduction / data.totalEmissions) * 100).toFixed(1);

  const projectedYear = simulatedTotal < 80000 ? 2029 : simulatedTotal < 110000 ? 2032 : 2036;

  const handleApply = () => {
    onApplySimulation(simulatedTotal, data.totalOffset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15131A]/45 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#FFFFFF] max-w-2xl w-full p-6 sm:p-7 rounded-2xl shadow-[0_16px_48px_rgba(21,19,26,0.18)] relative border border-[#D8D2DF]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-lg hover:bg-[#EEEAF5] text-[#85808D] hover:text-[#15131A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={1.75} />
        </button>

        <h3 className="text-[20px] sm:text-[24px] font-semibold text-[#15131A] tracking-tight mt-1">
          Pathway Simulator
        </h3>

        {/* Sliders Grid */}
        <div className="mt-5 space-y-3">
          {/* Slider 1: Renewable PPA */}
          <div className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF]">
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <span className="font-medium text-[#15131A]">
                Renewable Energy PPA Procurement (Scope 2)
              </span>
              <span className="font-data font-semibold text-[#F46A1F]">{ppaRenewable}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ppaRenewable}
              onChange={(e) => setPpaRenewable(Number(e.target.value))}
              className="w-full accent-[#F46A1F] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#85808D] mt-1">
              <span>Current: 25%</span>
              <span>Target: 100% Green Tariff</span>
            </div>
          </div>

          {/* Slider 2: Fleet Electrification */}
          <div className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF]">
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <span className="font-medium text-[#15131A]">
                Commercial Transport Fleet Electrification (Scope 1)
              </span>
              <span className="font-data font-semibold text-[#5625B8]">{fleetElectrification}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fleetElectrification}
              onChange={(e) => setFleetElectrification(Number(e.target.value))}
              className="w-full accent-[#5625B8] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#85808D] mt-1">
              <span>0% ICE Vehicles</span>
              <span>100% Full BEV Commercial Fleet</span>
            </div>
          </div>

          {/* Slider 3: Industrial Energy Efficiency */}
          <div className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF]">
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <span className="font-medium text-[#15131A]">
                Facility Waste Heat Recovery &amp; Smart HVAC (Scope 1 &amp; 2)
              </span>
              <span className="font-data font-semibold text-[#5625B8]">{efficiencyGain}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              value={efficiencyGain}
              onChange={(e) => setEfficiencyGain(Number(e.target.value))}
              className="w-full accent-[#5625B8] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#85808D] mt-1">
              <span>Baseline Efficiency</span>
              <span>Max 35% Heat Pump Integration</span>
            </div>
          </div>

          {/* Slider 4: Supplier Code of Conduct */}
          <div className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF]">
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <span className="font-medium text-[#15131A]">
                Tier-1 Supplier Low-Carbon Procurement (Scope 3)
              </span>
              <span className="font-data font-semibold text-[#2563EB]">{supplierEngagement}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={supplierEngagement}
              onChange={(e) => setSupplierEngagement(Number(e.target.value))}
              className="w-full accent-[#2563EB] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#85808D] mt-1">
              <span>Standard Logistics</span>
              <span>Decarbonized Freight &amp; Raw Metals</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Outcome Readout */}
        <div className="mt-5 p-4 rounded-xl bg-[#EEEAF5] border border-[#D8D2DF] grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[11px] text-[#667085] uppercase tracking-wider font-medium">
              Avoided CO2e
            </div>
            <div className="text-[20px] sm:text-[24px] font-semibold font-data text-[#15803D] mt-0.5">
              -{totalReduction.toLocaleString()} <span className="text-[12px]">t</span>
            </div>
            <div className="text-[11px] text-[#15803D] font-medium font-data">
              ↓ {percentReduced}% reduction
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#667085] uppercase tracking-wider font-medium">
              Simulated Net CO2e
            </div>
            <div className="text-[20px] sm:text-[24px] font-semibold font-data text-[#15131A] mt-0.5">
              {(simulatedNet / 1000).toFixed(1)}k <span className="text-[12px]">t</span>
            </div>
            <div className="text-[11px] text-[#667085] font-data">
              from {(data.netEmissions / 1000).toFixed(1)}k
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#667085] uppercase tracking-wider font-medium">
              Projected Net-Zero
            </div>
            <div className="text-[20px] sm:text-[24px] font-semibold font-data text-[#5625B8] mt-0.5">
              {projectedYear}
            </div>
            <div className="text-[11px] text-[#5625B8] font-medium">
              Accelerated by 5 yrs
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#667085] hover:text-[#15131A] hover:bg-[#F7F5F2] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#5625B8] hover:bg-[#461D98] text-[#FFFFFF] text-[13px] font-medium shadow-xs transition-colors cursor-pointer"
          >
            <span>Apply Scenario to Dashboard</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
};
