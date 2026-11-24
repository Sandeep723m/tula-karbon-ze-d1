import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  Bell,
  Check,
  Sparkles,
  ShieldCheck,
  Search,
  LogOut
} from 'lucide-react';
import { ORGANIZATIONS } from '../data/emissionsData';
import tulaCarbonLogo from '../assets/Tula Carbon Dot Grid Logo-Wl8QBOyo.png';

interface FloatingNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedOrg: string;
  setSelectedOrg: (org: string) => void;
  onOpenSearch: () => void;
  onOpenOffsetModal?: () => void;
  onOpenReportModal: () => void;
  onOpenSimulator: () => void;
  notificationsCount: number;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  activeTab,
  setActiveTab,
  selectedYear,
  setSelectedYear,
  selectedOrg,
  setSelectedOrg,
  onOpenSearch,
  onOpenReportModal,
  onOpenSimulator,
  notificationsCount
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  const handleCopyOrAction = (text: string, callback?: () => void) => {
    if (callback) callback();
    setCopiedNotice(text);
    setTimeout(() => setCopiedNotice(null), 2500);
    setOpenDropdown(null);
  };

  return (
    <header className="w-full bg-transparent relative z-50">
      <div
        ref={navRef}
        className="w-full px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-3 sm:gap-4"
      >
        {/* LEFT: Tula Carbon Brand Logo */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            setOpenDropdown(null);
          }}
          aria-label="Tula Carbon Dashboard Home"
          className="flex items-center shrink-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-[#5625B8]"
        >
          <img
            src={tulaCarbonLogo}
            alt="Tula Carbon"
            className="h-8 sm:h-9 w-auto object-contain select-none mix-blend-multiply"
          />
        </button>

        {/* CENTER: Lavender Translucent Nav Rail (#EEEAF5 @ 80% + backdrop blur, 13px links) */}
        <nav
          aria-label="Main Navigation"
          className="flex items-center gap-1 p-1 bg-[#EEEAF5]/80 backdrop-blur-md border border-[#D8D2DF] rounded-xl overflow-x-auto scrollbar-none flex-1 sm:flex-initial"
        >
          {/* 1. Dashboard */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setOpenDropdown(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs'
                : 'text-[#15131A] hover:bg-[#FFFFFF]/80'
            }`}
          >
            Dashboard
          </button>

          {/* 2. Organization */}
          <button
            onClick={() => {
              setActiveTab('organization');
              setOpenDropdown(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors shrink-0 cursor-pointer ${
              activeTab === 'organization'
                ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs'
                : 'text-[#15131A] hover:bg-[#FFFFFF]/80'
            }`}
          >
            Organization
          </button>

          {/* 3. Users */}
          <div className="relative shrink-0">
            <button
              onClick={() => toggleDropdown('users')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                openDropdown === 'users' || activeTab === 'users'
                  ? 'bg-[#FFFFFF] text-[#5625B8] shadow-2xs'
                  : 'text-[#15131A] hover:bg-[#FFFFFF]/80'
              }`}
            >
              <span>Users</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#85808D] transition-transform ${
                  openDropdown === 'users' ? 'rotate-180 text-[#5625B8]' : ''
                }`}
              />
            </button>

            {openDropdown === 'users' && (
              <div className="absolute left-0 mt-2 w-64 bg-[#FFFFFF] rounded-xl p-2 shadow-[0_12px_32px_rgba(21,19,26,0.12)] border border-[#D8D2DF] z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[11px] font-medium text-[#85808D] uppercase tracking-wider">
                  Users &amp; Stakeholders
                </div>
                <button
                  onClick={() => {
                    handleCopyOrAction('Stakeholders & Roles Directory');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg hover:bg-[#EEEAF5]/60 text-[#15131A] cursor-pointer"
                >
                  <div className="font-medium">Team Members &amp; Roles</div>
                  <div className="text-[11px] text-[#667085]">14 active sustainability managers</div>
                </button>
                <button
                  onClick={() => {
                    handleCopyOrAction('Facility Leads Access Managed');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg hover:bg-[#EEEAF5]/60 text-[#15131A] cursor-pointer"
                >
                  <div className="font-medium">Facility Leads &amp; Approvers</div>
                  <div className="text-[11px] text-[#667085]">54 operational site managers</div>
                </button>
                <button
                  onClick={() => {
                    handleCopyOrAction('Auditor Invitation Link Generated');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg hover:bg-[#EEEAF5]/60 text-[#15131A] cursor-pointer"
                >
                  <div className="font-medium">Invite External Auditor</div>
                  <div className="text-[11px] text-[#667085]">Read-only ISO 14064 verified portal</div>
                </button>
              </div>
            )}
          </div>

          {/* 4. Measure */}
          <button
            onClick={() => {
              setActiveTab('measure');
              setOpenDropdown(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors shrink-0 cursor-pointer ${
              activeTab === 'measure'
                ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs'
                : 'text-[#15131A] hover:bg-[#FFFFFF]/80'
            }`}
          >
            Measure
          </button>

          {/* 5. Analysis */}
          <button
            onClick={() => {
              setActiveTab('analysis');
              setOpenDropdown(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors shrink-0 cursor-pointer ${
              activeTab === 'analysis'
                ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs'
                : 'text-[#15131A] hover:bg-[#FFFFFF]/80'
            }`}
          >
            Analysis
          </button>

          {/* 6. Act */}
          <div className="relative shrink-0">
            <button
              onClick={() => toggleDropdown('act')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                openDropdown === 'act' || activeTab === 'act'
                  ? 'bg-[#FFFFFF] text-[#5625B8] shadow-2xs'
                  : 'text-[#15131A] hover:bg-[#FFFFFF]/80'
              }`}
            >
              <span>Act</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#85808D] transition-transform ${
                  openDropdown === 'act' ? 'rotate-180 text-[#5625B8]' : ''
                }`}
              />
            </button>

            {openDropdown === 'act' && (
              <div className="absolute left-0 mt-2 w-64 bg-[#FFFFFF] rounded-xl p-2 shadow-[0_12px_32px_rgba(21,19,26,0.12)] border border-[#D8D2DF] z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[11px] font-medium text-[#85808D] uppercase tracking-wider">
                  Decarbonization Action Levers
                </div>
                <button
                  onClick={() => {
                    onOpenSimulator();
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg bg-[#EEEAF5] hover:bg-[#E4DEF0] text-[#5625B8] flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4 text-[#5625B8]" strokeWidth={1.75} />
                    <span>Run Pathway Simulator</span>
                  </div>
                  <span className="text-[11px] bg-[#5625B8] text-[#FFFFFF] px-1.5 py-0.5 rounded-md font-medium">
                    Live
                  </span>
                </button>
                <button
                  onClick={() => {
                    handleCopyOrAction('Renewable PPA Initiated');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg hover:bg-[#F7F5F2] text-[#15131A] mt-1 cursor-pointer"
                >
                  <div className="font-medium">Renewable PPA Contracts</div>
                  <div className="text-[11px] text-[#667085]">Shift 65% facility power to solar</div>
                </button>
                <button
                  onClick={() => {
                    handleCopyOrAction('Fleet Electrification Scheduled');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg hover:bg-[#F7F5F2] text-[#15131A] cursor-pointer"
                >
                  <div className="font-medium">Fleet BEV Replacement</div>
                  <div className="text-[11px] text-[#667085]">Commercial delivery van rollout</div>
                </button>
              </div>
            )}
          </div>

          {/* 7. Reduce */}
          <div className="relative shrink-0">
            <button
              onClick={() => toggleDropdown('reduce')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                openDropdown === 'reduce' || activeTab === 'reduce'
                  ? 'bg-[#FFFFFF] text-[#5625B8] shadow-2xs'
                  : 'text-[#15131A] hover:bg-[#FFFFFF]/80'
              }`}
            >
              <span>Reduce</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#85808D] transition-transform ${
                  openDropdown === 'reduce' ? 'rotate-180 text-[#5625B8]' : ''
                }`}
              />
            </button>

            {openDropdown === 'reduce' && (
              <div className="absolute left-0 mt-2 w-64 bg-[#FFFFFF] rounded-xl p-2 shadow-[0_12px_32px_rgba(21,19,26,0.12)] border border-[#D8D2DF] z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[11px] font-medium text-[#85808D] uppercase tracking-wider">
                  Emissions Reduction Targets
                </div>
                <button
                  onClick={() => {
                    handleCopyOrAction('Scope 1 & 2 Abatement Levers Active');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg hover:bg-[#F7F5F2] text-[#15131A] cursor-pointer"
                >
                  <div className="font-medium">Scope 1 &amp; 2 Abatement Levers</div>
                  <div className="text-[11px] text-[#667085]">-18% emissions by Q4 2024</div>
                </button>
                <button
                  onClick={() => {
                    handleCopyOrAction('Energy Efficiency Levers Applied');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg hover:bg-[#F7F5F2] text-[#15131A] cursor-pointer"
                >
                  <div className="font-medium">Energy Efficiency Optimization</div>
                  <div className="text-[11px] text-[#667085]">Waste heat recovery &amp; LED retrofits</div>
                </button>
                <button
                  onClick={() => {
                    handleCopyOrAction('Scope 3 Supply Reductions Mandated');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-2 text-[13px] rounded-lg hover:bg-[#F7F5F2] text-[#15131A] cursor-pointer"
                >
                  <div className="font-medium">Scope 3 Supply Chain Reductions</div>
                  <div className="text-[11px] text-[#667085]">Low-carbon procurement mandates</div>
                </button>
              </div>
            )}
          </div>

          {/* 8. Reports */}
          <button
            onClick={() => {
              onOpenReportModal();
              setOpenDropdown(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors shrink-0 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#5625B8] text-[#FFFFFF] shadow-2xs'
                : 'text-[#15131A] hover:bg-[#FFFFFF]/80'
            }`}
          >
            Reports
          </button>
        </nav>

        {/* RIGHT: Search Field Trigger (14px text, #FFFFFF surface), Notification Bell, Profile Menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Search Field */}
          <button
            onClick={onOpenSearch}
            aria-label="Search emissions ledger"
            className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-[#FFFFFF] border border-[#D8D2DF] hover:border-[#5625B8]/60 text-[14px] text-[#85808D] transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#85808D]" strokeWidth={1.75} />
            <span className="pr-2">Search...</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
                setOpenDropdown(null);
              }}
              aria-label="Notifications"
              className="w-9 h-9 rounded-lg bg-[#FFFFFF] border border-[#D8D2DF] flex items-center justify-center text-[#15131A] hover:bg-[#EEEAF5]/60 hover:border-[#5625B8]/40 transition-colors cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px] text-[#5625B8]" strokeWidth={1.75} />
              {notificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F46A1F] ring-2 ring-[#FFFFFF]" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] rounded-xl p-3 shadow-[0_12px_32px_rgba(21,19,26,0.12)] border border-[#D8D2DF] z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-[#D8D2DF] text-[13px] font-semibold text-[#15131A]">
                  <span>System Audits &amp; Telemetry</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#ECFDF3] text-[#15803D] border border-[#BBF7D0]">
                    Approved
                  </span>
                </div>
                <div className="mt-2.5 space-y-2 text-[12px]">
                  <div className="p-2.5 rounded-lg bg-[#ECFDF3] border border-[#BBF7D0]">
                    <div className="text-[#15803D] font-semibold text-[12px] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.75} />
                      KBank Carbon Offsets Retired
                    </div>
                    <div className="text-[#667085] text-[11px] mt-0.5">
                      <span className="font-data font-medium text-[#15131A]">37,500</span> tCO2e verified and retired on Verra registry.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                    <div className="text-[#1D4ED8] font-semibold text-[12px]">
                      Rotterdam Terminal Meter
                    </div>
                    <div className="text-[#667085] text-[11px] mt-0.5">
                      Continuous emission telemetry stream submitted at <span className="font-data">04:30</span>.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Profile Menu (#FFFFFF surface) */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
                setOpenDropdown(null);
              }}
              aria-label="User profile menu"
              className="w-9 h-9 rounded-lg overflow-hidden border border-[#D8D2DF] cursor-pointer hover:border-[#5625B8] transition-colors flex items-center justify-center bg-[#EEEAF5]"
            >
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Johnathan Vance"
                className="w-full h-full object-cover"
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] rounded-xl p-3 shadow-[0_12px_32px_rgba(21,19,26,0.12)] border border-[#D8D2DF] z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#D8D2DF]">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80"
                    alt="Johnathan Vance"
                    className="w-9 h-9 rounded-lg object-cover border border-[#D8D2DF]"
                  />
                  <div>
                    <div className="text-[13px] font-semibold text-[#15131A]">Johnathan Vance</div>
                    <div className="text-[11px] text-[#667085]">Chief Sustainability Officer</div>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1.5 text-[12px]">
                  {/* Scope Boundary Switcher */}
                  <div className="p-2 rounded-lg bg-[#F7F5F2] border border-[#D8D2DF]/70">
                    <div className="text-[11px] text-[#85808D] font-medium uppercase tracking-wider mb-1">
                      Reporting Boundary
                    </div>
                    <select
                      value={selectedOrg}
                      onChange={(e) => setSelectedOrg(e.target.value)}
                      className="w-full text-[12px] font-medium text-[#15131A] bg-transparent outline-none cursor-pointer"
                    >
                      {ORGANIZATIONS.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Switcher */}
                  <div className="p-2 rounded-lg bg-[#F7F5F2] border border-[#D8D2DF]/70 flex items-center justify-between">
                    <span className="text-[12px] text-[#667085]">Audit Cycle Year</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="text-[12px] font-data font-semibold text-[#5625B8] bg-transparent outline-none cursor-pointer"
                    >
                      {[2023, 2024, 2025, 2022].map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      onOpenReportModal();
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-[13px] rounded-lg hover:bg-[#EEEAF5]/70 text-[#15131A] flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#667085]" strokeWidth={1.75} />
                    <span>Compliance Credentials</span>
                  </button>

                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-2.5 py-1.5 text-[13px] rounded-lg hover:bg-[#FEF2F2] text-[#B91C1C] flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.75} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast for Actions */}
      {copiedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#15131A] text-[#FFFFFF] px-4 py-2.5 rounded-lg text-[13px] shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-[#4ADE80]" strokeWidth={2} />
          <span>{copiedNotice}</span>
        </div>
      )}
    </header>
  );
};
