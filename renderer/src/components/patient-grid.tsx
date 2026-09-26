
"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Patient, StaffRole } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import PatientBlock from './patient-block';
import { collectNameAlertEntryKeys, computeNameAlertGroups, patientHasNameAlert } from '@/lib/name-alerts';
import NurseAssignmentCard, { type NurseAssignContext } from './nurse-assignment-card';
import PatientCareTechCard, { type TechAssignContext } from './patient-care-tech-card';
import ChargeNurseCard from './charge-nurse-card';
import UnitClerkCard from './unit-clerk-card';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';
import { getEffectiveNurseCardRowSpan } from '@/lib/nurse-card-layout';
import {
  ZOOM_STEP,
  MIN_ZOOM_FLOOR,
  MAX_ZOOM_CEILING,
  clampGridZoom,
  type GridZoomControls,
} from '@/lib/grid-zoom';

interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}
interface DraggingNurseInfo {
  id: string;
}
interface DraggingTechInfo {
  id: string;
}

interface PatientGridProps {
  patients: Patient[];
  nurses: Nurse[];
  techs: PatientCareTech[];
  isInitialized: boolean;
  isEffectivelyLocked: boolean;
  draggingPatientInfo: DraggingPatientInfo | null;
  draggingNurseInfo: DraggingNurseInfo | null;
  draggingTechInfo: DraggingTechInfo | null;
  onSelectPatient: (patient: Patient) => void;
  onPatientDragStart: (e: React.DragEvent<HTMLDivElement>, patientId: string, row: number, col: number) => void;
  onNurseDragStart: (e: React.DragEvent<HTMLDivElement>, nurseId: string) => void;
  onTechDragStart: (e: React.DragEvent<HTMLDivElement>, techId: string) => void;
  onDropOnCell: (targetRow: number, targetCol: number) => void;
  handleDropOnNurseSlot: (nurseId: string, slotIndex: number) => void;
  onClearNurseAssignments: (nurseId: string) => void;
  onDragEnd: () => void;
  onAdmitPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDischargePatient: (patient: Patient) => void;
  onToggleBlockRoom: (patientId: string) => void;
  onEditDesignation: (patient: Patient) => void;
  onRemoveNurse: (nurseId: string) => void;
  onDeleteRoom: (patientId: string) => void;
  onRemoveTech: (techId: string) => void;
  onAssignStaff: (role: StaffRole) => void;
  onAssignNurse?: (context: NurseAssignContext) => void;
  onAssignTech?: (context: TechAssignContext) => void;
  onResizeNurseCardRowSpan?: (nurseId: string, rowSpan: number) => void;
  onQuickAddStaff?: (role: StaffRole) => void;
  onRemoveStaff: (role: StaffRole) => void;
  onQuickNote?: (patient: Patient) => void;
  onCompleteTransport?: (patient: Patient) => void;
  canSeePatientIdentifiers?: boolean;
  isReadOnly?: boolean;
  onZoomControlsChange?: (controls: import('@/lib/grid-zoom').GridZoomControls) => void;
}

const PatientGrid: React.FC<PatientGridProps> = ({
  patients,
  nurses,
  techs,
  isInitialized,
  isEffectivelyLocked,
  draggingPatientInfo,
  draggingNurseInfo,
  draggingTechInfo,
  onSelectPatient,
  onPatientDragStart,
  onNurseDragStart,
  onTechDragStart,
  onDropOnCell,
  handleDropOnNurseSlot,
  onClearNurseAssignments,
  onDragEnd,
  onAdmitPatient,
  onUpdatePatient,
  onDischargePatient,
  onToggleBlockRoom,
  onEditDesignation,
  onRemoveNurse,
  onRemoveTech,
  onAssignStaff,
  onAssignNurse,
  onAssignTech,
  onResizeNurseCardRowSpan,
  onQuickAddStaff,
  onRemoveStaff,
  onDeleteRoom,
  onQuickNote,
  onCompleteTransport,
  canSeePatientIdentifiers = true,
  isReadOnly = false,
  onZoomControlsChange,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const userAdjustedZoomRef = useRef(false);
  const [fitZoom, setFitZoom] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  const nameAlertKeys = useMemo(
    () => collectNameAlertEntryKeys(computeNameAlertGroups(patients)),
    [patients],
  );

  const clampZoom = useCallback((value: number) => clampGridZoom(value), []);

  const updateContentSize = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    setContentSize({
      width: grid.offsetWidth,
      height: grid.offsetHeight,
    });
  }, []);

  const measureFitZoom = useCallback(() => {
    const viewport = viewportRef.current;
    const grid = gridRef.current;
    if (!viewport || !grid) return null;

    const availW = Math.max(viewport.clientWidth - 16, 1);
    const availH = Math.max(viewport.clientHeight - 16, 1);
    const contentW = Math.max(grid.offsetWidth, 1);
    const contentH = Math.max(grid.offsetHeight, 1);

    const nextFit = Math.min(availW / contentW, availH / contentH);
    return clampZoom(nextFit);
  }, [clampZoom]);

  useEffect(() => {
    userAdjustedZoomRef.current = false;
  }, [patients, nurses, techs]);

  useLayoutEffect(() => {
    if (!isInitialized) return;

    updateContentSize();

    const applyFit = (resetToFit: boolean) => {
      const nextFit = measureFitZoom();
      if (nextFit === null) return;
      setFitZoom(nextFit);
      if (resetToFit || !userAdjustedZoomRef.current) {
        setZoom(nextFit);
      }
    };

    applyFit(true);

    const viewport = viewportRef.current;
    const grid = gridRef.current;
    if (!viewport || !grid) return;

    const observer = new ResizeObserver(() => {
      updateContentSize();
      const nextFit = measureFitZoom();
      if (nextFit === null) return;
      setFitZoom(nextFit);
      if (!userAdjustedZoomRef.current) {
        setZoom(nextFit);
      }
    });

    observer.observe(viewport);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [isInitialized, measureFitZoom, updateContentSize, patients, nurses, techs]);

  const zoomIn = useCallback(() => {
    userAdjustedZoomRef.current = true;
    setZoom((current) => clampZoom(Number((current + ZOOM_STEP).toFixed(2))));
  }, [clampZoom]);

  const zoomOut = useCallback(() => {
    userAdjustedZoomRef.current = true;
    setZoom((current) => clampZoom(Number((current - ZOOM_STEP).toFixed(2))));
  }, [clampZoom]);

  const resetZoom = useCallback(() => {
    userAdjustedZoomRef.current = false;
    setZoom(fitZoom);
  }, [fitZoom]);

  const atFitZoom = Math.abs(zoom - fitZoom) < 0.02;
  const canZoomIn = zoom < MAX_ZOOM_CEILING - 0.01;
  const canZoomOut = zoom > MIN_ZOOM_FLOOR + 0.01;

  useEffect(() => {
    if (!onZoomControlsChange) return;
    onZoomControlsChange({
      zoom,
      zoomIn,
      zoomOut,
      resetZoom,
      atFitZoom,
      canZoomIn,
      canZoomOut,
    });
  }, [zoom, zoomIn, zoomOut, resetZoom, atFitZoom, canZoomIn, canZoomOut, onZoomControlsChange]);

  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if ((draggingPatientInfo || draggingNurseInfo || draggingTechInfo) && !isEffectivelyLocked) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const occupiedCells = new Set<string>();
  
  nurses.forEach(nurse => {
    const cardHeight = getEffectiveNurseCardRowSpan(nurse);
    for (let i = 0; i < cardHeight; i++) {
        occupiedCells.add(`${nurse.gridRow + i}-${nurse.gridColumn}`);
    }
  });

  techs.forEach(tech => {
    occupiedCells.add(`${tech.gridRow}-${tech.gridColumn}`);
  });

  const renderGridCells = () => {
    const cells = [];
    for (let r = 1; r <= NUM_ROWS_GRID; r++) {
      for (let c = 1; c <= NUM_COLS_GRID; c++) {
        if (occupiedCells.has(`${r}-${c}`)) {
          continue;
        }

        const patientInCell = patients.find(p => p.gridRow === r && p.gridColumn === c);
        cells.push(
          <div
            key={`${r}-${c}`}
            className={cn(
              "border border-border/30 min-h-[12rem] rounded-md",
              "flex items-stretch justify-stretch",
              (draggingPatientInfo || draggingNurseInfo || draggingTechInfo) && !isEffectivelyLocked && "hover:bg-secondary/50 transition-colors",
              !patientInCell && "bg-card"
            )}
            onDragOver={!isEffectivelyLocked ? handleDragOverCell : undefined}
            onDrop={!isEffectivelyLocked ? () => onDropOnCell(r, c) : undefined}
            style={{ gridRowStart: r, gridColumnStart: c }}
          >
            {patientInCell && (
              <div
                draggable={!isEffectivelyLocked && !patientInCell.isBlocked}
                onDragStart={(e) => onPatientDragStart(e, patientInCell.id, patientInCell.gridRow, patientInCell.gridColumn)}
                onDragEnd={onDragEnd}
                className={cn(
                  "w-full h-full",
                  !isEffectivelyLocked && !patientInCell.isBlocked && "cursor-grab",
                  draggingPatientInfo?.id === patientInCell.id && "opacity-50"
                )}
                data-patient-id={patientInCell.id}
              >
                <PatientBlock 
                  patient={patientInCell} 
                  isDragging={draggingPatientInfo?.id === patientInCell.id && !isEffectivelyLocked && !isReadOnly}
                  isEffectivelyLocked={isEffectivelyLocked || isReadOnly}
                  canSeePatientIdentifiers={canSeePatientIdentifiers}
                  isReadOnly={isReadOnly}
                  onSelectPatient={onSelectPatient}
                  onAdmit={onAdmitPatient}
                  onUpdate={onUpdatePatient}
                  onDischarge={onDischargePatient}
                  onToggleBlock={onToggleBlockRoom}
                  onEditDesignation={onEditDesignation}
                  onDeleteRoom={onDeleteRoom}
                  onQuickNote={onQuickNote}
                  onCompleteTransport={onCompleteTransport}
                  hasNameAlert={patientHasNameAlert(patientInCell, nameAlertKeys)}
                />
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  if (!isInitialized) {
    return (
      <div className="flex-grow flex overflow-auto p-2">
        <div
          className="grid w-max"
          style={{
            gridTemplateColumns: `repeat(${NUM_COLS_GRID}, 12rem)`,
            gridTemplateRows: `repeat(${NUM_ROWS_GRID}, minmax(12rem, auto))`,
            alignContent: 'start',
            gap: '0.25rem',
          }}
        >
          {Array.from({ length: 48 }).map((_, index) => (
            <div key={index} className="border border-border/30 rounded-md bg-card p-3 space-y-3">
               <div className="flex justify-between items-center">
                 <Skeleton className="h-5 w-1/3" />
                 <Skeleton className="h-5 w-1/4" />
               </div>
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderNurseCard = (nurse: Nurse) => {
    switch (nurse.role) {
      case 'Charge Nurse':
        return (
          <ChargeNurseCard
            name={nurse.name}
            onAssign={onAssignStaff}
            onRemove={onRemoveStaff}
            isReadOnly={isReadOnly}
          />
        );
      case 'Unit Clerk':
        return (
          <UnitClerkCard
            name={nurse.name}
            onAssign={onAssignStaff}
            onRemove={onRemoveStaff}
            isReadOnly={isReadOnly}
          />
        );
      case 'Staff Nurse':
      case 'Float Pool Nurse':
        return (
          <NurseAssignmentCard
            nurse={nurse}
            patients={patients}
            onDropOnSlot={handleDropOnNurseSlot}
            onClearAssignments={onClearNurseAssignments}
            onRemoveNurse={onRemoveNurse}
            onAssignStaff={onAssignNurse}
            onResizeCardRowSpan={onResizeNurseCardRowSpan}
            isEffectivelyLocked={isEffectivelyLocked}
            isReadOnly={isReadOnly}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex-grow flex min-h-[min(24rem,50vh)]">
      <div
        ref={viewportRef}
        className="flex-grow overflow-auto p-2"
      >
        <div
          style={{
            width: contentSize.width > 0 ? contentSize.width * zoom : 'max-content',
            height: contentSize.height > 0 ? contentSize.height * zoom : 'max-content',
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: contentSize.width > 0 ? contentSize.width : 'max-content',
            }}
          >
            <div
              ref={gridRef}
              className="grid w-max"
              style={{
                gridTemplateColumns: `repeat(${NUM_COLS_GRID}, 12rem)`,
                gridTemplateRows: `repeat(${NUM_ROWS_GRID}, minmax(12rem, auto))`,
                alignContent: 'start',
                gap: '0.25rem',
              }}
            >
        {renderGridCells()}
        
        {nurses.map(nurse => (
          <div 
            key={nurse.id}
            draggable={!isEffectivelyLocked && !isReadOnly}
            onDragStart={(e) => onNurseDragStart(e, nurse.id)}
            onDragEnd={onDragEnd}
            className={cn(
              "min-h-[6rem]",
              draggingNurseInfo?.id === nurse.id && "opacity-50"
            )}
            style={{ 
              gridRowStart: nurse.gridRow, 
              gridColumnStart: nurse.gridColumn, 
              gridRowEnd: `span ${getEffectiveNurseCardRowSpan(nurse)}`,
            }}
          >
            {renderNurseCard(nurse)}
          </div>
        ))}
        
        {techs.map(tech => (
          <div 
            key={tech.id}
            draggable={!isEffectivelyLocked && !isReadOnly}
            onDragStart={(e) => onTechDragStart(e, tech.id)}
            onDragEnd={onDragEnd}
            className={cn(
              "min-h-[6rem]", // Give it a min height to be visible when empty
              draggingTechInfo?.id === tech.id && "opacity-50"
            )}
            style={{ 
              gridRowStart: tech.gridRow, 
              gridColumnStart: tech.gridColumn,
            }}
          >
            <PatientCareTechCard
              tech={tech}
              onRemoveTech={onRemoveTech}
              onAssignStaff={onAssignTech}
              isEffectivelyLocked={isEffectivelyLocked}
              isReadOnly={isReadOnly}
            />
          </div>
        ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientGrid;

    