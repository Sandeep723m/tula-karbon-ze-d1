import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Download, Shield } from 'lucide-react';
import { YearEmissionsData } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: YearEmissionsData;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen) return null;

  const [selectedFramework, setSelectedFramework] = useState<'brsr' | 'gri' | 'cdp' | 'sasb'>('brsr');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const frameworks = [
    {
      id: 'brsr',
      name: 'BRSR Core (SEBI)',
      description: 'Business Responsibility and Sustainability Reporting compliant with SEBI ESG assurance guidelines.',
      tag: 'Mandatory Format'
    },
    {
      id: 'gri',
      name: 'GRI 305: Emissions 2024',
      description: 'Global Reporting Initiative indicators 305-1, 305-2, 305-3 and 305-5 emissions reduction disclosure.',
      tag: 'Universal Standard'
    },
    {
      id: 'cdp',
      name: 'CDP Climate Change C6-C7',
      description: 'Disclosures for operational boundary, Scope 1 gross direct, Scope 2 location/market-based, Scope 3 categories.',
      tag: 'A-List Format'
    },
    {
      id: 'sasb',
      name: 'SASB / ISSB S2 Standard',
      description: 'Sustainability Accounting Standards Board energy management & decarbonization metrics.',
      tag: 'Investor Grade'
    }
  ];

  const handleDownload = () => {
    const content = `TULACARBON COMPLIANCE AUDIT DISCLOSURE REPORT
Framework: ${selectedFramework.toUpperCase()}
Reporting Year: ${data.year}
Generated: ${new Date().toISOString()}
Organization: Planet Sustech Enterprise (54 Operational Facilities)

1. GREENHOUSE GAS INVENTORY (GHG PROTOCOL CORPORATE STANDARD)
Gross Total Emissions: ${data.totalEmissions.toLocaleString()} tCO2e
Scope 1 Direct Emissions: ${data.scopes.scope1.value.toLocaleString()} tCO2e (${data.scopes.scope1.percentage}%)
Scope 2 Indirect Electricity: ${data.scopes.scope2.value.toLocaleString()} tCO2e (${data.scopes.scope2.percentage}%)
Scope 3 Value Chain: ${data.scopes.scope3.value.toLocaleString()} tCO2e (${data.scopes.scope3.percentage}%)

2. OFFSET & REMOVAL CREDITING
Total Retired Carbon Offsets: ${data.totalOffset.toLocaleString()} tCO2e
Net Emissions Balance: ${data.netEmissions.toLocaleString()} tCO2e
Registry: KBank Planet Sustech Verra/Gold Standard Certified

3. TOP FACILITY EMISSIONS
${data.topFacilities.map((f, i) => `${i + 1}. ${f.name}: ${f.emissions.toLocaleString()} tCO2e [${f.primaryScope}]`).join('\n')}

4. METHODOLOGICAL ASSURANCE
Assurance Standard: ISO 14064-3 Third-Party Limited Assurance Ready
Status: Compliant with ${selectedFramework.toUpperCase()} Disclosure Rules
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TulaCarbon_${selectedFramework.toUpperCase()}_Audit_${data.year}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15131A]/45 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#FFFFFF] max-w-2xl w-full p-6 sm:p-7 rounded-2xl shadow-[0_16px_48px_rgba(21,19,26,0.18)] relative border border-[#D8D2DF]">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-lg hover:bg-[#EEEAF5] text-[#85808D] hover:text-[#15131A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 text-[#5625B8]">
          <FileText className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-[12px] font-semibold uppercase tracking-wider">
            Automated ESG Compliance Reporting
          </span>
        </div>
        <h3 className="text-[20px] sm:text-[24px] font-semibold text-[#15131A] tracking-tight mt-1">
          Export Audited GHG Emissions Report
        </h3>
        <p className="text-[13px] text-[#667085] mt-1">
          Select standard framework for automated statutory &amp; investor disclosures.
        </p>

        {/* Framework Selector */}
        <div className="mt-5 space-y-2.5">
          {frameworks.map((fw) => {
            const isSelected = selectedFramework === fw.id;
            return (
              <div
                key={fw.id}
                onClick={() => setSelectedFramework(fw.id as 'brsr' | 'gri' | 'cdp' | 'sasb')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#EEEAF5] border-[#5625B8]'
                    : 'bg-[#F7F5F2] border-[#D8D2DF] hover:bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[#15131A]">{fw.name}</span>
                  <span className="text-[11px] text-[#5625B8] bg-[#FFFFFF] border border-[#D8D2DF] px-2 py-0.5 rounded-md font-medium">
                    {fw.tag}
                  </span>
                </div>
                <p className="text-[12px] text-[#667085] mt-1">
                  {fw.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Report Preview Summary (uses IBM Plex Serif selectively for editorial report digest) */}
        <div className="mt-5 p-4 rounded-xl bg-[#F7F5F2] border border-[#D8D2DF] text-[13px]">
          <div className="flex items-center justify-between text-[#15131A] font-semibold pb-2.5 border-b border-[#D8D2DF]">
            <span className="font-editorial text-[15px]">
              Assurance Disclosure Digest — FY {data.year}
            </span>
            <span className="text-[11px] font-medium text-[#15803D] bg-[#ECFDF3] border border-[#BBF7D0] px-2 py-0.5 rounded-md flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.75} />
              Approved
            </span>
          </div>
          <p className="font-editorial text-[13px] text-[#667085] leading-relaxed mt-2.5">
            Prepared in accordance with GHG Protocol Corporate Standard and ISO 14064-3 limited assurance criteria for statutory {selectedFramework.toUpperCase()} filing.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#D8D2DF] text-center">
            <div>
              <div className="text-[11px] text-[#85808D] font-medium">Gross Scope 1–3</div>
              <div className="font-data font-semibold text-[14px] text-[#15131A] mt-0.5">
                {(data.totalEmissions / 1000).toFixed(1)}k tCO2e
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#85808D] font-medium">Retired Offsets</div>
              <div className="font-data font-semibold text-[14px] text-[#15803D] mt-0.5">
                {(data.totalOffset / 1000).toFixed(1)}k tCO2e
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#85808D] font-medium">Net Balance</div>
              <div className="font-data font-semibold text-[14px] text-[#5625B8] mt-0.5">
                {(data.netEmissions / 1000).toFixed(1)}k tCO2e
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#667085] hover:text-[#15131A] hover:bg-[#F7F5F2] transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5625B8] hover:bg-[#461D98] text-[#FFFFFF] text-[13px] font-medium shadow-xs transition-colors cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#FFFFFF]" strokeWidth={1.75} />
                <span>Downloaded Successfully</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" strokeWidth={1.75} />
                <span>Export Standard Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
