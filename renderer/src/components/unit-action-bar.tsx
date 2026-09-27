"use client";

import React, { useState } from 'react';
import {
  UserPlus,
  HelpCircle,
  ClipboardSignature,
  Users,
  Archive,
  LogOut,
  Shield,
  Building2,
  PlusSquare,
  Save,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import type { GridZoomControls } from '@/lib/grid-zoom';
import IconExplanationDialog from './icon-explanation-dialog';
import type { UnitBoardViewMode } from '@/lib/progressive-view';

interface UnitActionBarProps {
  canEdit?: boolean;
  showAdminTools?: boolean;
  onAdmitPatient: () => void;
  onAddStaffMember: () => void;
  onSetupOncomingShift?: () => void;
  onSaveAssignments: () => void;
  onAddRoom?: () => void;
  onCreateUnit?: () => void;
  onInsertMockData?: () => void;
  onSaveLayout?: () => void;
  onSyncEpicCensus?: () => void;
  isSyncingEpic?: boolean;
  zoomControls: GridZoomControls | null;
  onLeaveUnit?: () => void;
  wallpaperActive?: boolean;
  onToggleWallpaper?: () => void;
  viewMode?: UnitBoardViewMode;
  onViewModeChange?: (mode: UnitBoardViewMode) => void;
  onProgressiveSetup?: () => void;
}

const UnitActionBar: React.FC<UnitActionBarProps> = ({
  canEdit = true,
  showAdminTools = false,
  onAdmitPatient,
  onAddStaffMember,
  onSetupOncomingShift,
  onSaveAssignments,
  onAddRoom,
  onCreateUnit,
  onInsertMockData,
  onSaveLayout,
  onSyncEpicCensus,
  isSyncingEpic = false,
  zoomControls,
  onLeaveUnit,
  wallpaperActive = false,
  onToggleWallpaper,
  viewMode = 'command',
  onViewModeChange,
  onProgressiveSetup,
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.08)] print-hide">
        <div className="px-3 sm:px-5 py-2 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {onSyncEpicCensus && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSyncEpicCensus}
                disabled={isSyncingEpic}
                title="Sync in-progress encounters from Epic FHIR"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncingEpic ? 'animate-spin' : ''}`} />
                {isSyncingEpic ? 'Syncing Epic…' : 'Sync Epic census'}
              </Button>
            )}
            {canEdit && (
              <>
                <Button variant="default" size="sm" onClick={onAdmitPatient} title="Admit / transfer in">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Admit
                </Button>
                <Button variant="outline" size="sm" onClick={onAddStaffMember} title="Add staff">
                  <Users className="h-4 w-4 mr-1.5" />
                  Staff
                </Button>
                {onSetupOncomingShift && (
                  <Button variant="outline" size="sm" onClick={onSetupOncomingShift} title="Oncoming shift board">
                    <ClipboardSignature className="h-4 w-4 mr-1.5" />
                    Oncoming shift
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={onSaveAssignments} title="Save shift assignments">
              <Archive className="h-4 w-4 mr-1.5" />
              Save assignments
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExplanationOpen(true)}
              title="Icon explanation"
            >
              <HelpCircle className="h-4 w-4 mr-1.5" />
              Icons
            </Button>
            {onToggleWallpaper && (
              <Button
                variant={wallpaperActive ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleWallpaper}
                title={
                  wallpaperActive
                    ? 'Stop live unit map on Windows desktop background'
                    : 'Pin live unit map to Windows desktop background'
                }
              >
                <Monitor className="h-4 w-4 mr-1.5" />
                {wallpaperActive ? 'Unpin desktop map' : 'Pin to desktop'}
              </Button>
            )}

            {showAdminTools && (
              <>
                <Separator orientation="vertical" className="h-7 hidden sm:block" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0" title="Facility and unit administration">
                      <Shield className="h-4 w-4 mr-1.5" />
                      Admin
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top">
                    <DropdownMenuLabel>Facility & unit setup</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onCreateUnit && (
                      <DropdownMenuItem onClick={onCreateUnit}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Create new unit
                      </DropdownMenuItem>
                    )}
                    {onAddRoom && (
                      <DropdownMenuItem onClick={onAddRoom}>
                        <PlusSquare className="mr-2 h-4 w-4" />
                        Create new room
                      </DropdownMenuItem>
                    )}
                    {onSaveLayout && (
                      <DropdownMenuItem onClick={onSaveLayout}>
                        <Save className="mr-2 h-4 w-4" />
                        Save layout as…
                      </DropdownMenuItem>
                    )}
                    {onViewModeChange && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Unit board view</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewModeChange('command')}>
                          Command surface{viewMode === 'command' ? ' ✓' : ''}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewModeChange('progressive')}>
                          Progressive view{viewMode === 'progressive' ? ' ✓' : ''}
                        </DropdownMenuItem>
                      </>
                    )}
                    {onProgressiveSetup && (
                      <DropdownMenuItem onClick={onProgressiveSetup}>
                        Progressive hallway setup…
                      </DropdownMenuItem>
                    )}
                    {onInsertMockData && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Development</DropdownMenuLabel>
                        <DropdownMenuItem onClick={onInsertMockData}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Insert mock patients
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {zoomControls && (
            <div
              className="flex items-center gap-1 rounded-md border border-border bg-background/95 px-1.5 py-1 text-xs shrink-0"
              role="group"
              aria-label="Unit map zoom controls"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={zoomControls.zoomOut}
                disabled={!zoomControls.canZoomOut}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <button
                type="button"
                className="min-w-[3.25rem] px-1 text-center text-foreground font-medium hover:underline disabled:no-underline"
                onClick={zoomControls.resetZoom}
                disabled={zoomControls.atFitZoom}
                aria-label={`Zoom level ${Math.round(zoomControls.zoom * 100)} percent. Reset to fit entire unit.`}
                title={zoomControls.atFitZoom ? 'Showing entire unit' : 'Reset to fit entire unit'}
              >
                {Math.round(zoomControls.zoom * 100)}%
              </button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={zoomControls.zoomIn}
                disabled={!zoomControls.canZoomIn}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}

          {onLeaveUnit && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onLeaveUnit}
              className="shrink-0 font-semibold ml-auto"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Leave unit
            </Button>
          )}
        </div>
      </div>
      <IconExplanationDialog open={isExplanationOpen} onOpenChange={setIsExplanationOpen} />
    </>
  );
};

export default UnitActionBar;
