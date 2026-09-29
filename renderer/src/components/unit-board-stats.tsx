import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Ban, BedDouble, BedSingle, DoorOpen, Stethoscope, UserRound, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IsolationBreakdown, SafetyMark } from '@/lib/safety-marks';
import type { UnitCensusStats } from '@/lib/patient-status-helpers';
import { SAFETY_FRAME_CLASS, SafetyShape } from '@/components/safety-mark-badge';

export interface UnitBoardSafetyCounts {
  fallCount: number;
  dnrCount: number;
  restraintCount: number;
  isolationBreakdown?: IsolationBreakdown;
  isolationCount: number;
  involuntaryHoldCount: number;
  sitterCount: number;
  foleyCount: number;
  centralLineCount: number;
  tubeFeedCount: number;
}

const CHIP =
  'inline-flex items-center gap-1.5 px-2 py-1 text-base leading-none font-bold tabular-nums bg-background shrink-0';

function FoleyGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden>
      <path
        d="M6 2.5h3.2v6.2a2.6 2.6 0 1 1-3.2 0V2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CountChip({
  title,
  value,
  emphasize,
  children,
  className,
  mark,
}: {
  title: string;
  value: number;
  emphasize?: boolean;
  children: ReactNode;
  className?: string;
  mark?: SafetyMark;
}) {
  return (
    <span
      title={`${title}: ${value}`}
      aria-label={`${title} ${value}`}
      data-unit-stat={title}
      className={cn(
        CHIP,
        mark ? SAFETY_FRAME_CLASS[mark.frame] : 'border-2 border-border',
        mark?.toneClass,
        emphasize && 'text-destructive border-destructive',
        value === 0 && !emphasize && 'opacity-55',
        className,
      )}
    >
      {children}
      <span>{value}</span>
    </span>
  );
}

const FALL_MARK: SafetyMark = {
  id: 'fall',
  label: 'Fall',
  shape: 'triangle',
  frame: 'solid',
  toneClass: 'text-foreground border-foreground bg-accent',
};
const DNR_MARK: SafetyMark = {
  id: 'dnr',
  label: 'DNR',
  shape: 'pill',
  frame: 'round',
  toneClass: 'text-purple-900 dark:text-purple-100 border-purple-800 dark:border-purple-200',
};
const RESTRAINT_MARK: SafetyMark = {
  id: 'restraints',
  label: 'Restraints',
  shape: 'bar',
  frame: 'bar',
  toneClass: 'text-destructive border-destructive',
};
const CONTACT_MARK: SafetyMark = {
  id: 'isolation-contact',
  label: 'Contact',
  shape: 'square',
  frame: 'dashed',
  toneClass: 'text-amber-800 dark:text-amber-200 border-amber-800 dark:border-amber-200',
};
const AIRBORNE_MARK: SafetyMark = {
  id: 'isolation-airborne',
  label: 'Airborne',
  shape: 'diamond',
  frame: 'double',
  toneClass: 'text-orange-800 dark:text-orange-200 border-orange-800 dark:border-orange-200',
};
const DROPLET_MARK: SafetyMark = {
  id: 'isolation-droplet',
  label: 'Droplet',
  shape: 'circle',
  frame: 'dotted',
  toneClass: 'text-sky-800 dark:text-sky-200 border-sky-800 dark:border-sky-200',
};
const ISO_OTHER_MARK: SafetyMark = {
  id: 'isolation',
  label: 'Isolation',
  shape: 'square',
  frame: 'dashed',
  toneClass: 'text-amber-800 dark:text-amber-200 border-amber-800 dark:border-amber-200',
};
const HOLD_MARK: SafetyMark = {
  id: 'hold',
  label: '1013',
  shape: 'bar',
  frame: 'bar',
  toneClass: 'text-orange-900 dark:text-orange-100 border-orange-800 dark:border-orange-200',
};
const SITTER_MARK: SafetyMark = {
  id: 'sitter',
  label: 'Sitter',
  shape: 'pill',
  frame: 'round',
  toneClass: 'text-sky-900 dark:text-sky-100 border-sky-800 dark:border-sky-200',
};
const CENTRAL_MARK: SafetyMark = {
  id: 'central-line',
  label: 'Central',
  shape: 'square',
  frame: 'dotted',
  toneClass: 'text-teal-900 dark:text-teal-100 border-teal-800 dark:border-teal-200',
};
const TUBE_MARK: SafetyMark = {
  id: 'tube-feed',
  label: 'Tube',
  shape: 'circle',
  frame: 'dashed',
  toneClass: 'text-emerald-900 dark:text-emerald-100 border-emerald-800 dark:border-emerald-200',
};

function SafetyMarkCount({ mark, value }: { mark: SafetyMark; value: number }) {
  return (
    <CountChip title={mark.label} value={value} mark={mark}>
      <SafetyShape shape={mark.shape} size="map" />
      <span>{mark.label}</span>
    </CountChip>
  );
}

export function SafetyStatsRow({ counts }: { counts: UnitBoardSafetyCounts }) {
  const breakdown = counts.isolationBreakdown;
  const otherIso = breakdown ? breakdown.other : counts.isolationCount;
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Safety">
      <SafetyMarkCount mark={FALL_MARK} value={counts.fallCount} />
      <SafetyMarkCount mark={DNR_MARK} value={counts.dnrCount} />
      <SafetyMarkCount mark={RESTRAINT_MARK} value={counts.restraintCount} />
      <SafetyMarkCount mark={CONTACT_MARK} value={breakdown?.contact ?? 0} />
      <SafetyMarkCount mark={AIRBORNE_MARK} value={breakdown?.airborne ?? 0} />
      <SafetyMarkCount mark={DROPLET_MARK} value={breakdown?.droplet ?? 0} />
      {otherIso > 0 ? <SafetyMarkCount mark={ISO_OTHER_MARK} value={otherIso} /> : null}
      <SafetyMarkCount mark={HOLD_MARK} value={counts.involuntaryHoldCount} />
      <SafetyMarkCount mark={SITTER_MARK} value={counts.sitterCount} />
      <CountChip title="Foley" value={counts.foleyCount} className="text-foreground">
        <FoleyGlyph />
        <span>Foley</span>
      </CountChip>
      <SafetyMarkCount mark={CENTRAL_MARK} value={counts.centralLineCount} />
      <SafetyMarkCount mark={TUBE_MARK} value={counts.tubeFeedCount} />
    </div>
  );
}

export function CensusStaffStatsRow({
  census,
}: {
  census: UnitCensusStats;
}) {
  const overCapacity =
    census.nurseCount === 0 ||
    (census.nurseCount > 0 && census.beddedPatients > census.maxPatientsAllowed);

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Census and staff">
      <CountChip title="Bedded" value={census.beddedPatients}>
        <BedDouble className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        <span>Bedded</span>
      </CountChip>
      <CountChip title="Available" value={census.availableBeds}>
        <BedSingle className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        <span>Open</span>
      </CountChip>
      <CountChip title="Blocked" value={census.blockedRooms} emphasize={census.blockedRooms > 0}>
        <span className="relative inline-flex h-5 w-5 items-center justify-center" aria-hidden>
          <BedSingle className="h-5 w-5" strokeWidth={2.5} />
          <Ban className="absolute h-5 w-5" strokeWidth={2.75} />
        </span>
        <span>Blocked</span>
      </CountChip>
      <CountChip title="Discharges today" value={census.anticipatedDischarges}>
        <DoorOpen className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        <span>DC</span>
      </CountChip>
      <CountChip title="Nurses" value={census.nurseCount} emphasize={census.nurseCount === 0}>
        <Stethoscope className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        <span>RN</span>
      </CountChip>
      <CountChip title="PCTs" value={census.pctCount}>
        <UserRound className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        <span>PCT</span>
      </CountChip>
      <CountChip title="Max patients by staffing" value={census.maxPatientsAllowed} emphasize={overCapacity}>
        <Users className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        <span>Max</span>
      </CountChip>
    </div>
  );
}

export function useOpsStatsFit() {
  const hostRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [opsOnTop, setOpsOnTop] = useState(true);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const measure = measureRef.current;
    if (!host || !measure) return;

    const update = () => {
      setOpsOnTop(measure.scrollWidth <= host.clientWidth + 1);
    };
    const observer = new ResizeObserver(update);
    observer.observe(host);
    observer.observe(measure);
    update();
    return () => observer.disconnect();
  }, []);

  return { hostRef, measureRef, opsOnTop };
}
