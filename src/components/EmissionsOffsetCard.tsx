import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Layers } from 'lucide-react';
import { YearEmissionsData } from '../types';

interface EmissionsOffsetCardProps {
  data: YearEmissionsData;
  onOpenOffsetModal?: () => void;
}

type ProjectStatusId = 'in-progress' | 'completed' | 'in-review' | 'on-hold';
type ViewMode = 'count' | 'tonnage';

interface ProjectStatusDatum {
  id: ProjectStatusId;
  name: string;
  count: number;
  tonnage: number;
  color: string;
}

// Existing dashboard fixture; percentages and capsule counts are derived from these status totals.
const projectStatusData: ProjectStatusDatum[] = [
  { id: 'in-progress', name: 'In Progress', count: 23, tonnage: 21400, color: '#FF7925' },
  { id: 'completed', name: 'Completed', count: 13, tonnage: 11200, color: '#F5C728' },
  { id: 'in-review', name: 'In Review', count: 3, tonnage: 3100, color: '#A45CE9' },
  { id: 'on-hold', name: 'On Hold', count: 3, tonnage: 1800, color: '#A7A8B8' }
];

const MAX_SEGMENTS = 56;
const CENTER_X = 200;
const CENTER_Y = 195;
const INNER_RADIUS = 122;
const OUTER_RADIUS = 148;
const SEGMENT_STROKE = 7.5;

function allocateSegmentCounts(data: ProjectStatusDatum[], totalProjects: number) {
  if (totalProjects <= MAX_SEGMENTS) return data.map((status) => status.count);

  const exact = data.map((status) => (status.count / totalProjects) * MAX_SEGMENTS);
  const allocated = exact.map(Math.floor);
  const remaining = MAX_SEGMENTS - allocated.reduce((sum, count) => sum + count, 0);
  const priority = exact
    .map((count, index) => ({ index, remainder: count - allocated[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; index < remaining; index += 1) allocated[priority[index].index] += 1;
  return allocated;
}

export const EmissionsOffsetCard: React.FC<EmissionsOffsetCardProps> = ({ data }) => {
  const [hoveredCategory, setHoveredCategory] = useState<ProjectStatusId | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProjectStatusId | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('count');
  const [focusIndex, setFocusIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const gaugeRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gaugeRef, { once: true, amount: 0.25 });

  const totalProjects = projectStatusData.reduce((sum, status) => sum + Math.max(0, status.count), 0);
  const segmentCount = Math.min(totalProjects, MAX_SEGMENTS);
  const allocatedCounts = allocateSegmentCounts(projectStatusData, totalProjects);
  const segments = projectStatusData.flatMap((status, statusIndex) =>
    Array.from({ length: allocatedCounts[statusIndex] }, (_, projectIndex) => ({
      ...status,
      projectIndex: projectIndex + 1,
      share: totalProjects ? (status.count / totalProjects) * 100 : 0
    }))
  );
  const totalTonnage = data.totalOffset;
  const activeId = hoveredCategory ?? selectedCategory;
  const activeCategory = activeId ? projectStatusData.find((status) => status.id === activeId) ?? null : null;
  const valueForStatus = (status: ProjectStatusDatum) => viewMode === 'count'
    ? status.count.toLocaleString()
    : `${(status.tonnage / 1000).toFixed(1)}k`;
  const mainValue = activeCategory
    ? valueForStatus(activeCategory)
    : viewMode === 'count' ? totalProjects.toLocaleString() : `${(totalTonnage / 1000).toFixed(1)}k`;
  const mainLabel = activeCategory
    ? activeCategory.name
    : viewMode === 'count' ? 'Active Projects' : 'tCO₂e Retired';

  const handleSegmentKeyDown = (event: React.KeyboardEvent<SVGLineElement>, index: number) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (!segments.length) return;
      const nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + segments.length) % segments.length;
      setFocusIndex(nextIndex);
      event.currentTarget.ownerSVGElement?.querySelectorAll<SVGLineElement>('[data-project-segment]')[nextIndex]?.focus();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const statusId = segments[index].id;
      setSelectedCategory((current) => current === statusId ? null : statusId);
    }
    if (event.key === 'Escape') {
      setHoveredCategory(null);
      setSelectedCategory(null);
    }
  };

  const setHovered = (statusId: ProjectStatusId | null) => setHoveredCategory(statusId);
  const toggleSelected = (statusId: ProjectStatusId) => setSelectedCategory((current) => current === statusId ? null : statusId);

  return (
    <section
      className="glass-card-top relative flex h-full flex-col overflow-hidden rounded-[20px] bg-white/80 p-5 sm:p-6"
      style={{ backdropFilter: 'blur(24px) saturate(1.08)', WebkitBackdropFilter: 'blur(24px) saturate(1.08)' }}
      aria-labelledby="project-status-title"
    >
      <header className="flex items-center gap-3 border-b border-[#E7E5ED] pb-4">
        <div aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F2EAFE] text-[#7541DD]">
          <Layers className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 id="project-status-title" className="text-[19px] font-semibold leading-tight tracking-tight text-[#181624]">Project Status</h2>
            <span className="rounded-full border border-[#B7F0C8] bg-[#E9FBEF] px-2.5 py-1 text-[11px] font-semibold leading-none text-[#15803D]">Approved</span>
          </div>
          <p className="mt-1 text-[12px] font-normal text-[#777384]">Carbon offset &amp; removal portfolio</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-3">
        <div ref={gaugeRef} className="relative w-full max-w-[400px]">
          <svg
            viewBox="0 0 400 220"
            className="block h-auto w-full overflow-visible"
            role="group"
            aria-label={`Project status gauge with ${segments.length} capsules representing ${totalProjects} projects`}
          >
            {segments.map((segment, index) => {
              const angle = Math.PI + (Math.PI * (index + 0.5)) / Math.max(segmentCount, 1);
              const x1 = CENTER_X + INNER_RADIUS * Math.cos(angle);
              const y1 = CENTER_Y + INNER_RADIUS * Math.sin(angle);
              const x2 = CENTER_X + OUTER_RADIUS * Math.cos(angle);
              const y2 = CENTER_Y + OUTER_RADIUS * Math.sin(angle);
              const faded = activeId !== null && activeId !== segment.id;
              const opacity = faded ? 0.18 : 1;
              const preciseShare = totalProjects ? (segment.count / totalProjects) * 100 : 0;
              const statusSegmentCount = allocatedCounts[projectStatusData.findIndex((status) => status.id === segment.id)];
              const segmentDescription = totalProjects > MAX_SEGMENTS
                ? `${segment.name}, proportional capsule ${segment.projectIndex} of ${statusSegmentCount}, representing ${segment.count} projects, ${preciseShare.toFixed(2)} percent`
                : `${segment.name}, project ${segment.projectIndex} of ${segment.count}, ${preciseShare.toFixed(2)} percent`;
              return (
                <g key={`${segment.id}-${segment.projectIndex}`}>
                <title>{segment.name}: {segment.count} of {totalProjects} projects ({preciseShare.toFixed(2)}%)</title>
                <motion.line
                  data-project-segment
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={segment.color}
                  strokeWidth={SEGMENT_STROKE}
                  strokeLinecap="round"
                  role="button"
                  tabIndex={index === focusIndex ? 0 : -1}
                  aria-pressed={selectedCategory === segment.id}
                  aria-label={segmentDescription}
                  initial={reduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: inView ? 1 : 0, opacity: inView ? opacity : 0 }}
                  transition={{
                    pathLength: { duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.015, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: reduceMotion ? 0 : 0.18 }
                  }}
                  onMouseEnter={() => setHovered(segment.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => { setFocusIndex(index); setHovered(segment.id); }}
                  onBlur={() => setHovered(null)}
                  onClick={() => toggleSelected(segment.id)}
                  onKeyDown={(event) => handleSegmentKeyDown(event, index)}
                  className="cursor-pointer outline-none focus-visible:drop-shadow-[0_0_3px_rgba(117,65,221,.9)]"
                />
                </g>
              );
            })}

            {projectStatusData.map((status, index) => {
              const positions = [
                { x: 10, y: 79, w: 72 },
                { x: 301, y: 22, w: 72 },
                { x: 322, y: 78, w: 58 },
                { x: 329, y: 128, w: 58 }
              ][index];
              const share = totalProjects ? (status.count / totalProjects) * 100 : 0;
              return (
                <g key={`callout-${status.id}`} aria-label={`${status.name}: ${share.toFixed(2)} percent`}>
                  <rect x={positions.x} y={positions.y} width={positions.w} height="31" rx="15.5" fill={`${status.color}18`} stroke={`${status.color}55`} strokeWidth="1" />
                  <text x={positions.x + positions.w / 2} y={positions.y + 20.5} textAnchor="middle" fill={status.id === 'completed' ? '#8E5A00' : status.color} fontFamily="IBM Plex Sans, sans-serif" fontSize="16" fontWeight="600">{Math.round(share)}%</text>
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-x-0 top-[44%] flex flex-col items-center text-center">
            <Layers aria-hidden="true" className="mb-1 h-[18px] w-[18px] text-[#7541DD]" strokeWidth={2} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeCategory?.id ?? 'total'}-${mainValue}-${viewMode}`}
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="flex flex-col items-center"
                aria-live="polite"
              >
                <span className="font-data text-[42px] font-semibold leading-none tracking-[-0.04em] text-[#181624] sm:text-[48px]">{mainValue}</span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#777384]">{mainLabel}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setViewMode((mode) => mode === 'count' ? 'tonnage' : 'count')}
          aria-label={viewMode === 'count' ? 'View offset tonnage' : 'View project counts'}
          className="mt-1 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-[#E0D2FF] bg-[#F6F0FF]/90 px-4 py-2 text-[12px] font-semibold text-[#7541DD] transition-colors hover:bg-[#EFE5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7541DD]"
        >
          <span className="truncate">{viewMode === 'count' ? `Showing ${totalProjects} Projects · View Tonnage` : `Showing ${(totalTonnage / 1000).toFixed(1)}k tCO₂e · View Projects`}</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>

      <div className="border-t border-[#E7E5ED] pt-3.5">
        <div className="grid grid-cols-2 gap-2.5 text-[12px]">
          {projectStatusData.map((status) => {
            const isActive = activeId === status.id;
            const isSelected = selectedCategory === status.id;
            const share = totalProjects ? (status.count / totalProjects) * 100 : 0;
            return (
              <button
                key={status.id}
                type="button"
                aria-pressed={isSelected}
                title={`${status.name}: ${status.count} projects (${share.toFixed(2)}%)`}
                onMouseEnter={() => setHovered(status.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(status.id)}
                onBlur={() => setHovered(null)}
                onClick={() => toggleSelected(status.id)}
                className="flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7541DD]"
                style={{
                  backgroundColor: isActive ? `${status.color}12` : 'rgba(255,255,255,.48)',
                  borderColor: isActive ? `${status.color}55` : '#E7E5ED'
                }}
              >
                <i aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="min-w-0 flex-1 truncate font-medium text-[#181624]">{status.name} ({viewMode === 'count' ? status.count : `${(status.tonnage / 1000).toFixed(1)}k`})</span>
                <span className="shrink-0 font-data font-semibold text-[#777384]">{Math.round(share)}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
