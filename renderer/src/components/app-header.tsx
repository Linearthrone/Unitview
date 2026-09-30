
"use client";

import React, { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Printer,
  ClipboardSignature,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NameAlertGroup } from '@/lib/name-alerts';
import type { IsolationBreakdown } from '@/lib/safety-marks';
import type { UnitCensusStats } from '@/lib/patient-status-helpers';
import {
  CensusStaffStatsRow,
  SafetyStatsRow,
  useOpsStatsFit,
} from '@/components/unit-board-stats';

interface AppHeaderProps {
  title: string;
  unitName?: string;
  facilityName?: string;
  facilityLogoUrl?: string;
  toolName?: string;
  censusStats: UnitCensusStats;
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
  onOpsStatsPlacement?: (opsOnTop: boolean) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  unitName,
  facilityName,
  facilityLogoUrl,
  toolName = 'Unitview',
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
  onOpsStatsPlacement,
}) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { hostRef, measureRef, opsOnTop } = useOpsStatsFit();
  const heading = facilityName?.trim() || title;
  const safetyCounts = {
    fallCount,
    dnrCount,
    restraintCount,
    isolationBreakdown,
    isolationCount,
    involuntaryHoldCount,
    sitterCount,
    foleyCount,
    centralLineCount,
    tubeFeedCount,
  };

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    onOpsStatsPlacement?.(opsOnTop);
  }, [opsOnTop, onOpsStatsPlacement]);

  return (
    <>
      <header className="bg-card text-card-foreground border-b-2 border-border z-40 print-hide">
        <div className="px-3 sm:px-5 py-2 space-y-2 max-w-[100vw]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {facilityLogoUrl ? (
                <img
                  src={facilityLogoUrl}
                  alt=""
                  className="h-10 w-auto max-w-[8rem] object-contain shrink-0"
                />
              ) : null}
              <div className="min-w-0">
                <h1 className="text-2xl font-headline font-bold text-foreground leading-tight truncate">
                  {heading}
                </h1>
                <p className="text-base text-muted-foreground truncate">
                  {toolName}
                  {unitName ? ` · ${unitName}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
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
                <div className="text-base text-muted-foreground max-w-[9rem] sm:max-w-none">
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

          <div ref={hostRef} className="relative min-w-0">
            <div
              ref={measureRef}
              className="absolute left-0 top-0 flex items-center gap-3 whitespace-nowrap opacity-0 pointer-events-none"
              aria-hidden
            >
              <SafetyStatsRow counts={safetyCounts} />
              <CensusStaffStatsRow census={censusStats} />
            </div>
            <div className="flex items-center gap-3 min-w-0 overflow-x-auto">
              <SafetyStatsRow counts={safetyCounts} />
              {opsOnTop ? (
                <>
                  <span className="h-6 w-px bg-border shrink-0" aria-hidden />
                  <CensusStaffStatsRow census={censusStats} />
                </>
              ) : null}
            </div>
          </div>

          {nameAlertGroups.length > 0 && (
            <div
              className="rounded-md border-2 border-amber-800 bg-amber-50 px-3 py-1.5 text-base text-amber-950 dark:border-amber-200 dark:bg-amber-950 dark:text-amber-50"
              role="status"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
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
              <ul className="space-y-1 mt-1">
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
