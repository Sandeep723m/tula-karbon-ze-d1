import React, { useState } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import { YearEmissionsData } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: YearEmissionsData;
  onSelectAction: (action: string, param?: unknown) => void;
}

interface SearchableItem {
  type: string;
  title: string;
  subtitle: string;
  action: string;
  payload?: unknown;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  data,
  onSelectAction
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const searchableItems: SearchableItem[] = [
    ...data.topFacilities.map((f) => ({
      type: 'facility',
      title: f.name,
      subtitle: `${f.emissions.toLocaleString()} tCO2e · ${f.location || f.primaryScope}`,
      action: 'facility',
      payload: f
    })),
    ...data.topSources.map((s) => ({
      type: 'source',
      title: s.name,
      subtitle: `${s.emissions.toLocaleString()} tCO2e · ${s.primaryScope}`,
      action: 'source',
      payload: s
    })),
    {
      type: 'action',
      title: 'Decarbonization Pathway Simulator',
      subtitle: 'Simulate Renewable PPAs, fleet BEVs, and efficiency gains',
      action: 'simulator'
    },
    {
      type: 'action',
      title: 'BRSR & GRI 305 Compliance Export',
      subtitle: 'Download statutory investor-grade sustainability report',
      action: 'reports'
    }
  ];

  const filtered = searchableItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#15131A]/45 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#FFFFFF] max-w-xl w-full p-4 rounded-2xl shadow-[0_16px_48px_rgba(21,19,26,0.18)] relative border border-[#D8D2DF]">
        {/* Search Input Field (#FFFFFF surface, 14px search text) */}
        <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[#D8D2DF]">
          <Search className="w-4 h-4 text-[#5625B8]" strokeWidth={1.75} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search facilities, emissions sources, reports, simulators..."
            className="w-full text-[14px] text-[#15131A] bg-[#FFFFFF] outline-none placeholder:text-[#85808D]"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1.5 rounded-lg hover:bg-[#EEEAF5] text-[#85808D] hover:text-[#15131A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-2 max-h-72 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-[#85808D]">
              No matching facilities, sources, or tools found.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectAction(item.action, item.payload);
                  onClose();
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#EEEAF5]/70 cursor-pointer transition-colors group"
              >
                <div>
                  <div className="text-[13px] font-medium text-[#15131A] group-hover:text-[#5625B8] transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[12px] text-[#667085] mt-0.5 font-data">
                    {item.subtitle}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#85808D] group-hover:text-[#5625B8] transition-colors shrink-0" strokeWidth={1.75} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
