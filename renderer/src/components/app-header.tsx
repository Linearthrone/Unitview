
"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Printer,
  ClipboardSignature,
  ChevronDown,
  ChevronUp,
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
import type { IsolationBreakdown } from '@/lib/safety-marks';

interface AppHeaderProps {
  title: string;
  unitName?: string;
  facilityName?: string;
  facilityLogoUrl?: string;
  toolName?: string;
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
  isolationBreakdown?: IsolationBreakdown;
  fallCount?: number;
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

const CensusRow: React.FC<{
  label: string;
  value: number;
  emphasize?: boolean;
}> = ({ label, value, emphasize }) => (
  <div className="flex items-baseline justify-between gap-3 text-base leading-tight">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn('font-bold tabular-nums', emphasize && 'text-destructive')}>{value}</span>
  </div>
);

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  unitName,
  facilityName,
  facilityLogoUrl,
  toolName = 'UnitView',
  censusStats,
  dnrCount,
  restraintCount,
  foleyCount,
  isolationCount,
  isolationBreakdown,
  fallCount = 0,
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
  const heading = facilityName?.trim() || title;
  const isolationTotal =
    isolationBreakdown
      ? isolationBreakdown.contact +
        isolationBreakdown.airborne +
        isolationBreakdown.droplet +
        isolationBreakdown.other
      : isolationCount;
  const overCapacity =
    censusStats.nurseCount === 0 ||
    (censusStats.nurseCount > 0 && censusStats.beddedPatients > censusStats.maxPatientsAllowed);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="bg-card text-card-foreground border-b-2 border-border z-40 print-hide">
        <div className="px-3 sm:px-5 py-3 space-y-3 max-w-[100vw]">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3 justify-between">
            <div className="flex items-start gap-3 min-w-0">
              {facilityLogoUrl ? (
                <img
                  src={facilityLogoUrl}
                  alt=""
                  className="h-12 w-auto max-w-[8rem] object-contain shrink-0 mt-0.5"
                />
              ) : null}
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground leading-tight">
                  {heading}
                </h1>
                <p className="text-base text-muted-foreground mt-0.5 truncate">
                  {toolName}
                  {unitName ? ` · ${unitName}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-base text-muted-foreground"
                onClick={() => setStatsCollapsed((v) => !v)}
              >
                {statsCollapsed ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show stats
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide stats
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col items-end gap-2 ml-auto shrink-0">
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {onPrint && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0 text-base">
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
                  <div className="text-base text-muted-foreground mt-1 max-w-[9rem] sm:max-w-none">
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
            </div>
          </div>

          {!statsCollapsed && (
            <div className="grid gap-3 sm:grid-cols-3">
              <section className="border-2 border-border bg-background px-3 py-2 min-w-0">
                <h3 className="text-base font-semibold mb-1.5">Census</h3>
                <div className="space-y-1">
                  <CensusRow label="Bedded" value={censusStats.beddedPatients} />
                  <CensusRow label="Available" value={censusStats.availableBeds} />
                  <CensusRow label="Blocked" value={censusStats.blockedRooms} />
                  <CensusRow label="Discharges" value={censusStats.anticipatedDischarges} />
                </div>
              </section>
              <section className="border-2 border-border bg-background px-3 py-2 min-w-0">
                <h3 className="text-base font-semibold mb-1.5">Staff</h3>
                <div className="space-y-1">
                  <CensusRow label="Nurses" value={censusStats.nurseCount} emphasize={censusStats.nurseCount === 0} />
                  <CensusRow label="PCTs" value={censusStats.pctCount} />
                  <CensusRow label="Max" value={censusStats.maxPatientsAllowed} emphasize={overCapacity} />
                </div>
              </section>
              <section className="border-2 border-border bg-background px-3 py-2 min-w-0">
                <h3 className="text-base font-semibold mb-1.5">Safety</h3>
                <div className="space-y-1">
                  <CensusRow label="Fall" value={fallCount} />
                  <CensusRow label="DNR" value={dnrCount} />
                  <CensusRow label="Restraints" value={restraintCount} />
                  <CensusRow label="Isolation" value={isolationTotal} />
                  {isolationBreakdown && (
                    <p className="text-base text-muted-foreground leading-tight">
                      Contact {isolationBreakdown.contact}
                      {' · '}
                      Airborne {isolationBreakdown.airborne}
                      {' · '}
                      Droplet {isolationBreakdown.droplet}
                      {isolationBreakdown.other > 0 ? ` · Other ${isolationBreakdown.other}` : ''}
                    </p>
                  )}
                  <CensusRow label="1013/2013" value={involuntaryHoldCount} />
                  <CensusRow label="Sitter" value={sitterCount} />
                  <CensusRow label="Foleys" value={foleyCount} />
                  <CensusRow label="Central lines" value={centralLineCount} />
                  <CensusRow label="Tube feeds" value={tubeFeedCount} />
                </div>
              </section>
            </div>
          )}

          {nameAlertGroups.length > 0 && (
            <div
              className="rounded-md border-2 border-amber-800 bg-amber-50 px-3 py-2 text-base text-amber-950 dark:border-amber-200 dark:bg-amber-950 dark:text-amber-50"
              role="status"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <p className="font-semibold">Name alerts</p>
                {onAcknowledgeNameAlerts && canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 text-base border-amber-800 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-200 dark:bg-amber-950 dark:text-amber-50 dark:hover:bg-amber-900"
                    onClick={onAcknowledgeNameAlerts}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
              <ul className="space-y-1.5">
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
