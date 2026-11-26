import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ORG_HIERARCHY } from '../data/intelligenceData';

interface OrgHierarchyTreeProps {
  selectedOrgId: string;
  onSelect: (orgId: string) => void;
}

export const OrgHierarchyTree: React.FC<OrgHierarchyTreeProps> = ({ selectedOrgId, onSelect }) => {
  const regions = ORG_HIERARCHY.filter((n) => n.level === 'region');
  const facilitiesFor = (regionId: string) => ORG_HIERARCHY.filter((n) => n.parentId === regionId);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onSelect('org-global')}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer ${
          selectedOrgId === 'org-global'
            ? 'bg-[#F1EDFF] text-[#5625B8] font-semibold'
            : 'text-[#15131A] hover:bg-[#F7F5F2]'
        }`}
      >
        <span>Entire Organisation (Global)</span>
        <span className="font-data text-[10px] text-[#667085]">54</span>
      </button>

      {regions.map((region) => {
        const children = facilitiesFor(region.id);
        return (
          <div key={region.id} className="border-t border-[#F1EEF6] pt-1">
            <button
              type="button"
              onClick={() => onSelect(region.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer ${
                selectedOrgId === region.id
                  ? 'bg-[#F1EDFF] text-[#5625B8] font-semibold'
                  : 'text-[#15131A] hover:bg-[#F7F5F2] font-medium'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-[#85808D]" />
                {region.name}
              </span>
              <span className="font-data text-[10px] text-[#85808D]">{region.facilityCount}</span>
            </button>

            <div className="pl-5 space-y-0.5 mt-0.5">
              {children.map((fac) => (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => onSelect(fac.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] cursor-pointer ${
                    selectedOrgId === fac.id
                      ? 'bg-[#5625B8] text-white font-medium'
                      : 'text-[#667085] hover:bg-[#F7F5F2] hover:text-[#15131A]'
                  }`}
                >
                  <span className="truncate">{fac.name}</span>
                  <span className={`font-data text-[10px] ${selectedOrgId === fac.id ? 'text-white/80' : 'text-[#85808D]'}`}>
                    {Math.round(fac.shareFactor * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
