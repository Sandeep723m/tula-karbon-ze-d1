import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
  const valueForStatus = (status: ProjectStatusDatum) =>
    viewMode === 'count' ? status.count.toLocaleString() : `${(status.tonnage / 1000).toFixed(1)}k`;
  const mainValue = activeCategory
    ? valueForStatus(activeCategory)
    : viewMode === 'count'
      ? totalProjects.toLocaleString()
      : `${(totalTonnage / 1000).toFixed(1)}k`;
  const mainLabel = activeCategory
    ? activeCategory.name
    : viewMode === 'count'
      ? 'Active Projects'
      : 'tCO₂e Retired';

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
      setSelectedCategory((current) => (current === statusId ? null : statusId));
    }
    if (event.key === 'Escape') {
      setHoveredCategory(null);
      setSelectedCategory(null);
    }
  };

  const setHovered = (statusId: ProjectStatusId | null) => setHoveredCategory(statusId);
  const toggleSelected = (statusId: ProjectStatusId) =>
    setSelectedCategory((current) => (current === statusId ? null : statusId));

  return (
    <section
      className="glass-card-top relative flex h-full flex-col justify-between overflow-hidden p-4 sm:p-5"
      aria-labelledby="project-status-title"
    >
      {/* Unified Single-Line Header (No Icon Box) */}
      <header className="flex items-center justify-between gap-2 border-b border-[#E5E0EA] pb-3 min-h-[44px]">
        <h2 id="project-status-title" className="text-[17px] font-semibold leading-tight tracking-tight text-[#15131A] whitespace-nowrap">
          Reduction Portfolio
        </h2>
        <span className="rounded-full border border-[#B7F0C8] bg-[#E9FBEF] px-2.5 py-0.5 text-[10px] font-semibold leading-none text-[#15803D] shrink-0">
          Approved
        </span>
      </header>

      {/* Gauge Body */}
      <div className="flex flex-col items-center justify-center pt-2 pb-1">
        <div ref={gaugeRef} className="relative w-full max-w-[320px]">
          <svg
            viewBox="0 0 400 212"
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
              return (
                <g key={`${segment.id}-${segment.projectIndex}`}>
                  <title>
                    {segment.name}: {segment.count} of {totalProjects} ({preciseShare.toFixed(1)}%)
                  </title>
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
                    aria-label={`${segment.name}: ${segment.count} projects`}
                    initial={reduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: inView ? 1 : 0, opacity: inView ? opacity : 0 }}
                    transition={{
                      pathLength: { duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.015, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: reduceMotion ? 0 : 0.18 }
                    }}
                    onMouseEnter={() => setHovered(segment.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => {
                      setFocusIndex(index);
                      setHovered(segment.id);
                    }}
                    onBlur={() => setHovered(null)}
                    onClick={() => toggleSelected(segment.id)}
                    onKeyDown={(event) => handleSegmentKeyDown(event, index)}
                    className="cursor-pointer outline-none"
                  />
                </g>
              );
            })}

            {projectStatusData.map((status, index) => {
              const bubbleWidth = index < 2 ? 64 : 44;
              const bubbleHeight = 28;
              const precedingSegments = allocatedCounts.slice(0, index).reduce((sum, count) => sum + count, 0);
              const statusSegments = allocatedCounts[index] ?? 0;
              const middleAngle = Math.PI + (Math.PI * (precedingSegments + statusSegments / 2)) / Math.max(segmentCount, 1);
              const labelRadius = OUTER_RADIUS + 28;
              const centerX = CENTER_X + labelRadius * Math.cos(middleAngle);
              const centerY = CENTER_Y + labelRadius * Math.sin(middleAngle);
              const x = Math.max(bubbleWidth / 2 + 4, Math.min(400 - bubbleWidth / 2 - 4, centerX));
              const y = Math.max(bubbleHeight / 2 + 6, Math.min(212 - bubbleHeight / 2 - 6, centerY));
              const share = totalProjects ? (status.count / totalProjects) * 100 : 0;
              return (
                <g key={`callout-${status.id}`}>
                  <rect x={x - bubbleWidth / 2} y={y - bubbleHeight / 2} width={bubbleWidth} height={bubbleHeight} rx={bubbleHeight / 2} fill={`${status.color}18`} stroke={`${status.color}55`} strokeWidth="1" />
                  <text x={x} y={y + 5} textAnchor="middle" fill={status.id === 'completed' ? '#8E5A00' : status.color} fontFamily="IBM Plex Mono, monospace" fontSize="14" fontWeight="600">
                    {Math.round(share)}%
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-x-0 top-[47%] flex flex-col items-center text-center">
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
                <span className="font-data text-[38px] font-semibold leading-none tracking-[-0.04em] text-[#181624]">
                  {mainValue}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#777384]">{mainLabel}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setViewMode((mode) => (mode === 'count' ? 'tonnage' : 'count'))}
          className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E0D2FF] bg-[#F6F0FF]/90 px-3.5 py-1.5 text-[11px] font-semibold text-[#5625B8] transition-colors hover:bg-[#EFE5FF] cursor-pointer"
        >
          <span className="font-data">{viewMode === 'count' ? `${totalProjects} Projects · Tonnage` : `${(totalTonnage / 1000).toFixed(1)}k tCO₂e · Projects`}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>

      {/* Clean Non-Truncating Status Grid */}
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl bg-[#F7F5F2] border border-[#E7E5ED] px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[#667085]">Est. annual</span>
            <span className="font-data font-semibold text-[#15131A]">8,400 t</span>
          </div>
          <div className="rounded-xl bg-[#ECFDF3]/70 border border-[#BBF7D0] px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[#15803D]">Verified</span>
            <span className="font-data font-semibold text-[#15803D]">3,200 t</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {projectStatusData.map((status) => {
            const isActive = activeId === status.id;
            const isSelected = selectedCategory === status.id;
            const share = totalProjects ? (status.count / totalProjects) * 100 : 0;
            return (
              <button
                key={status.id}
                type="button"
                aria-pressed={isSelected}
                onMouseEnter={() => setHovered(status.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(status.id)}
                onBlur={() => setHovered(null)}
                onClick={() => toggleSelected(status.id)}
                className="flex flex-col rounded-xl border px-2.5 py-2 text-left transition-colors duration-150 cursor-pointer"
                style={{
                  backgroundColor: isActive ? `${status.color}14` : 'rgba(255,255,255,.6)',
                  borderColor: isActive ? `${status.color}66` : '#E7E5ED'
                }}
              >
                <div className="flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
                  <span className="font-medium text-[#181624] truncate">{status.name}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between pl-4 font-data">
                  <span className="font-semibold text-[#15131A]">
                    {viewMode === 'count' ? status.count : `${(status.tonnage / 1000).toFixed(1)}k`}
                  </span>
                  <span className="text-[10px] text-[#667085]">{Math.round(share)}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
