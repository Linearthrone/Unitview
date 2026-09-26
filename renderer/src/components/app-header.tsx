
"use client";

import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  LayoutGrid,
  Printer,
  ClipboardSignature,
  HeartHandshake,
  Ban,
  Droplet,
  ShieldAlert,
  UserRound,
  FileWarning,
  Activity,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  BedDouble,
  DoorOpen,
  CalendarClock,
  Users,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { NameAlertGroup } from '@/lib/name-alerts';

interface AppHeaderProps {
  title: string;
  unitName?: string;
  censusStats: {
    beddedPatients: number;
    availableBeds: number;
    blockedRooms: number;
    anticipatedDischarges: number;
    nurseCount: number;
    pctCount: number;
    maxPatientsAllowed: number;
  };
  dnrCount: number;
  restraintCount: number;
  foleyCount: number;
  isolationCount: number;
  sitterCount: number;
  involuntaryHoldCount: number;
  centralLineCount?: number;
  tubeFeedCount?: number;
  nameAlertGroups: NameAlertGroup[];
  onAcknowledgeNameAlerts?: () => void;
  /** When false, admit/staff/oncoming and admin tools are hidden. */
  canEdit?: boolean;
  onPrint?: (reportType: 'charge' | 'assignments') => void;
  onConfigureAssignmentPrint?: () => void;
}

const CompactStat: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  className?: string;
}> = ({ icon: Icon, label, value, className }) => (
  <div
    className={cn(
      'flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-sm shrink-0',
      className
    )}
  >
    <Icon className="h-4 w-4 shrink-0 opacity-80" />
    <span className="font-bold tabular-nums leading-none">{value}</span>
    <span className="text-muted-foreground text-xs leading-none hidden sm:inline">{label}</span>
  </div>
);

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  unitName,
  censusStats,
  dnrCount,
  restraintCount,
  foleyCount,
  isolationCount,
  sitterCount,
  involuntaryHoldCount,
  centralLineCount = 0,
  tubeFeedCount = 0,
  nameAlertGroups,
  onAcknowledgeNameAlerts,
  canEdit = true,
  onPrint,
  onConfigureAssignmentPrint,
}) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [statsCollapsed, setStatsCollapsed] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="bg-card text-card-foreground shadow-md z-40 print-hide border-b">
        {/* Row 1 — scrolls away with page content */}
        <div className="px-3 sm:px-5 py-3 space-y-3 max-w-[100vw]">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3 justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <Stethoscope className="h-10 w-10 sm:h-12 sm:w-12 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary leading-tight">
                  {title}
                </h1>
                {unitName && (
                  <h2 className="text-lg sm:text-xl font-semibold text-primary mt-0.5 truncate">
                    {unitName}
                  </h2>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setStatsCollapsed((v) => !v)}
              >
                {statsCollapsed ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    Show stats
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    Hide stats
                  </>
                )}
              </Button>
            </div>

            {/* Time, navigation, and census */}
            <div className="flex flex-col items-end gap-2 ml-auto shrink-0">
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {onPrint && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Printer className="h-4 w-4 mr-1.5" />
                      Print
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPrint('charge')}>
                      <Printer className="mr-2 h-4 w-4" />
                      Charge report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPrint('assignments')}>
                      <ClipboardSignature className="mr-2 h-4 w-4" />
                      Assignments
                    </DropdownMenuItem>
                    {onConfigureAssignmentPrint && (
                      <DropdownMenuItem onClick={onConfigureAssignmentPrint}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Configure assignment layout…
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
                <div className="text-right shrink-0 tabular-nums">
                  <div className="font-semibold text-lg leading-none">
                    {currentTime
                      ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-[9rem] sm:max-w-none">
                    {currentTime
                      ? currentTime.toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border/60 bg-secondary/30 px-3 py-2 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 text-right">
                  Census Statistics
                </p>
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <BedDouble className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Bedded:</span>
                    <span className="font-bold tabular-nums">{censusStats.beddedPatients}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <DoorOpen className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-bold tabular-nums">{censusStats.availableBeds}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Ban className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span className="text-muted-foreground">Blocked:</span>
                    <span className="font-bold tabular-nums">{censusStats.blockedRooms}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CalendarClock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="text-muted-foreground">Discharges:</span>
                    <span className="font-bold tabular-nums">{censusStats.anticipatedDischarges}</span>
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-border/60 shrink-0" aria-hidden />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">
                      Nurses: <span className="font-bold text-foreground tabular-nums">{censusStats.nurseCount}</span>
                      {', '}
                      PCTs: <span className="font-bold text-foreground tabular-nums">{censusStats.pctCount}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Gauge className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    <span className="text-muted-foreground">Max:</span>
                    <span
                      className={cn(
                        'font-bold tabular-nums',
                        censusStats.nurseCount === 0 && 'text-destructive',
                        censusStats.nurseCount > 0 &&
                          censusStats.beddedPatients > censusStats.maxPatientsAllowed &&
                          'text-destructive',
                      )}
                    >
                      {censusStats.maxPatientsAllowed}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!statsCollapsed && (
            <div className="flex flex-wrap items-center gap-2 max-w-full">
              <CompactStat
                icon={HeartHandshake}
                label="DNR"
                value={dnrCount}
                className="text-purple-700 dark:text-purple-400"
              />
              <CompactStat
                icon={Ban}
                label="Restraints"
                value={restraintCount}
                className="text-destructive"
              />
              <CompactStat
                icon={ShieldAlert}
                label="Isolation"
                value={isolationCount}
                className="text-amber-700 dark:text-amber-400"
              />
              <CompactStat
                icon={FileWarning}
                label="1013/2013"
                value={involuntaryHoldCount}
                className="text-orange-700 dark:text-orange-400"
              />
              <CompactStat
                icon={UserRound}
                label="Sitter"
                value={sitterCount}
                className="text-sky-700 dark:text-sky-400"
              />
              <CompactStat icon={Droplet} label="Foleys" value={foleyCount} className="text-blue-600" />
              <CompactStat
                icon={Activity}
                label="Central lines"
                value={centralLineCount}
                className="text-teal-700 dark:text-teal-400"
              />
              <CompactStat
                icon={UtensilsCrossed}
                label="Tube feeds"
                value={tubeFeedCount}
                className="text-emerald-700 dark:text-emerald-400"
              />
            </div>
          )}

          {nameAlertGroups.length > 0 && (
            <div
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
              role="status"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">Name alerts</p>
                {onAcknowledgeNameAlerts && canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 border-amber-600/50 bg-amber-50/80 text-amber-950 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50 dark:hover:bg-amber-900/60"
                    onClick={onAcknowledgeNameAlerts}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
              <ul className="space-y-1.5 text-amber-950/90 dark:text-amber-50/90">
                {nameAlertGroups.map((g) => (
                  <li key={g.key}>
                    <span className="font-medium">{g.label}:</span>{' '}
                    {g.entries.map((e) => `${e.name} (${e.room})`).join(' · ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default AppHeader;
