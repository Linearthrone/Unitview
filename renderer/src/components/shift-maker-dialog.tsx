"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isOccupiedBed, patientHasInvoluntaryHold } from "@/lib/patient-status-helpers";
import { NUM_COLS_GRID, NUM_ROWS_GRID } from "@/lib/grid-utils";
import type { Nurse, PatientCareTech, Spectra, SpectraStatus } from "@/types/nurse";
import type { Patient } from "@/types/patient";
import SpectralinkDeviceTable from "./spectralink-device-table";
import AssignStaffMemberButton from "./assign-staff-member-button";
import { isStaffUnassigned } from "@/lib/roles";

interface ShiftMakerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nurses: Nurse[];
  techs?: PatientCareTech[];
  patients: Patient[];
  spectraPool?: Spectra[];
  onPatientDragStart: (e: React.DragEvent<HTMLDivElement>, patientId: string, row: number, col: number) => void;
  onDragEnd: () => void;
  onDropOnNurseSlot: (nurseId: string, slotIndex: number) => void;
  onClearNurseAssignments: (nurseId: string) => void;
  onAssignSpectra?: (spectraId: string, staffName: string) => void;
  onUnassignSpectra?: (spectraId: string) => void;
  onSetSpectraStatus?: (spectraId: string, status: SpectraStatus) => void;
  onAddSpectraLog?: (spectraId: string, message: string) => void;
  /** Promote this draft to the active shift (parent clears draft after persist). */
  onActivateOncomingShift?: () => void | Promise<void>;
  onAddNurseCard?: () => void;
  onRemoveNurseCard?: (nurseId: string) => void;
  onAssignNurse?: (nurseId: string) => void;
}

function selectShiftBoardNurses(nurses: Nurse[]): Nurse[] {
  return nurses.filter((n) => n.role === "Staff Nurse" || n.role === "Float Pool Nurse");
}

function getTopPriorityBadges(patient: Patient): string[] {
  const flags = [
    patient.isComfortCareDNR ? "DNR" : null,
    patient.isInRestraints ? "Restraints" : null,
    patient.isIsolation ? "Isolation" : null,
    patientHasInvoluntaryHold(patient) ? "1013/2013" : null,
    patient.isFallRisk ? "Fall Risk" : null,
    patient.isSeizureRisk ? "Seizure Risk" : null,
    patient.isAspirationRisk ? "Aspiration Risk" : null,
  ].filter((v): v is string => Boolean(v));
  return flags.slice(0, 3);
}

const ShiftMakerDialog: React.FC<ShiftMakerDialogProps> = ({
  open,
  onOpenChange,
  nurses,
  techs = [],
  patients,
  spectraPool = [],
  onPatientDragStart,
  onDragEnd,
  onDropOnNurseSlot,
  onClearNurseAssignments,
  onAssignSpectra = () => undefined,
  onUnassignSpectra = () => undefined,
  onSetSpectraStatus = () => undefined,
  onAddSpectraLog = () => undefined,
  onActivateOncomingShift,
  onAddNurseCard,
  onRemoveNurseCard,
  onAssignNurse,
}) => {
  const boardNurses = useMemo(() => selectShiftBoardNurses(nurses), [nurses]);
  const boardPatients = useMemo(() => patients.filter((p) => isOccupiedBed(p.name) && !p.isBlocked), [patients]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [spectraDropTargetNurseId, setSpectraDropTargetNurseId] = useState<string | null>(null);
  const roomRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const nurseCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const spectraIdSet = useMemo(() => new Set(spectraPool.map((d) => d.id)), [spectraPool]);

  const isSpectraDragEvent = (e: React.DragEvent) =>
    e.dataTransfer.types.includes("application/x-unitview-spectra");

  const readSpectraDragId = (e: React.DragEvent): string | null => {
    const typed =
      e.dataTransfer.getData("application/x-unitview-spectra") ||
      e.dataTransfer.getData("text/plain");
    return typed && spectraIdSet.has(typed) ? typed : null;
  };

  const handleNurseSpectraDragOver = (e: React.DragEvent, nurseId: string) => {
    if (!isSpectraDragEvent(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setSpectraDropTargetNurseId(nurseId);
  };

  const handleNurseSpectraDrop = (e: React.DragEvent, staffName: string) => {
    const spectraId = readSpectraDragId(e);
    if (!spectraId || !staffName.trim()) return;
    e.preventDefault();
    e.stopPropagation();
    onAssignSpectra(spectraId, staffName);
    setSpectraDropTargetNurseId(null);
  };

  const assignedPatientIds = useMemo(() => {
    const ids = new Set<string>();
    boardNurses.forEach((nurse) => {
      nurse.assignedPatientIds.forEach((id) => {
        if (id) ids.add(id);
      });
    });
    return ids;
  }, [boardNurses]);

  const miniMapRooms = useMemo(() => {
    return patients
      .filter((p) => p.gridRow >= 1 && p.gridRow <= NUM_ROWS_GRID && p.gridColumn >= 1 && p.gridColumn <= NUM_COLS_GRID)
      .sort((a, b) => {
        if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
        return a.gridColumn - b.gridColumn;
      });
  }, [patients]);
  const sortedRoomsForList = useMemo(() => [...miniMapRooms].sort((a, b) => a.bedNumber - b.bedNumber), [miniMapRooms]);

  const selectedAssignedNurseId = useMemo(() => {
    if (!selectedPatientId) return null;
    return boardNurses.find((nurse) => nurse.assignedPatientIds.includes(selectedPatientId))?.id ?? null;
  }, [boardNurses, selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId) return;
    roomRowRefs.current[selectedPatientId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedPatientId]);

  useEffect(() => {
    if (!selectedAssignedNurseId) return;
    nurseCardRefs.current[selectedAssignedNurseId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedAssignedNurseId]);

  if (!open) return null;

  return (
    <div className="dark fixed inset-0 z-50 bg-background text-foreground">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="rounded-full border border-border px-3 py-1 text-sm">
            Oncoming setup — Progressive
          </div>
          <div className="rounded-full bg-card px-4 py-1.5 text-sm font-semibold">
            Oncoming draft
          </div>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="order-2 w-[28rem] shrink-0 overflow-y-auto border-l border-border bg-card/40 p-4">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider">Unit glance · oncoming draft</h3>
            <p className="mb-3 text-xs text-muted-foreground">Green = claimed for oncoming. Amber = still unassigned.</p>
            <div
              className="mb-4 grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${NUM_COLS_GRID}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${NUM_ROWS_GRID}, minmax(0, 0.7rem))`,
              }}
            >
              {miniMapRooms.map((room) => {
                const claimed = assignedPatientIds.has(room.id);
                const occupied = isOccupiedBed(room.name);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedPatientId(room.id)}
                    className={cn(
                      "h-3 rounded-sm border",
                      room.isBlocked
                        ? "border-rose-700 bg-rose-800"
                        : claimed
                          ? "border-emerald-700 bg-emerald-600"
                          : occupied
                            ? "border-amber-600 bg-amber-700"
                            : "border-slate-700 bg-slate-800",
                      selectedPatientId === room.id && "ring-2 ring-sky-300",
                    )}
                    style={{ gridRowStart: room.gridRow, gridColumnStart: room.gridColumn }}
                    title={room.roomDesignation}
                  />
                );
              })}
            </div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Rooms</h3>
            <div className="space-y-2">
              {sortedRoomsForList.map((patient) => {
                const roomAssigned = assignedPatientIds.has(patient.id);
                const badgeLabels = getTopPriorityBadges(patient);
                const lastName = patient.name.split(",")[0]?.trim() || patient.name;
                const canDragAssign = isOccupiedBed(patient.name) && !patient.isBlocked;
                return (
                  <div
                    key={patient.id}
                    ref={(el) => {
                      roomRowRefs.current[patient.id] = el;
                    }}
                    draggable={canDragAssign}
                    onDragStart={(e) => {
                      if (!canDragAssign) return;
                      onPatientDragStart(e, patient.id, patient.gridRow, patient.gridColumn);
                    }}
                    onDragEnd={onDragEnd}
                    className={cn(
                      "rounded-md border border-slate-700 bg-slate-800 px-3 py-2 transition",
                      canDragAssign ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                      selectedPatientId === patient.id && "border-cyan-400 ring-2 ring-cyan-300/70",
                      roomAssigned && canDragAssign && "opacity-35"
                    )}
                    title={
                      patient.isBlocked
                        ? "Room is out of service"
                        : !isOccupiedBed(patient.name)
                        ? "Room is vacant"
                        : roomAssigned
                        ? "Already assigned to a nurse"
                        : "Drag onto a nurse card"
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {patient.roomDesignation} -{" "}
                        {patient.isBlocked ? "Out of service" : isOccupiedBed(patient.name) ? lastName : "Vacant"}
                      </p>
                      {roomAssigned && canDragAssign && (
                        <Badge variant="outline" className="border-slate-500 text-slate-300">
                          Assigned
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {patient.isBlocked ? (
                        <Badge variant="secondary" className="bg-rose-900 text-rose-100">
                          Out of service
                        </Badge>
                      ) : !isOccupiedBed(patient.name) ? (
                        <Badge variant="secondary" className="bg-slate-700 text-slate-100">
                          Vacant
                        </Badge>
                      ) : badgeLabels.length > 0 ? (
                        badgeLabels.map((label) => (
                          <Badge key={label} variant="secondary" className="bg-slate-700 text-slate-100">
                            {label}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No critical badges</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="order-1 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">Draft nurse assignments</h3>
              <p className="mb-3 text-xs text-muted-foreground">Next shift. Drag a room from the glance onto a nurse.</p>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {boardNurses.map((nurse) => {
                  return (
                    <div
                      key={nurse.id}
                      ref={(el) => {
                        nurseCardRefs.current[nurse.id] = el;
                      }}
                      className={cn(
                        "rounded-lg border border-slate-700 bg-slate-900 p-4",
                        selectedAssignedNurseId === nurse.id && "border-cyan-400 ring-2 ring-cyan-300/70",
                        spectraDropTargetNurseId === nurse.id && "border-primary ring-2 ring-primary/40",
                      )}
                      onDragOver={(e) => handleNurseSpectraDragOver(e, nurse.id)}
                      onDragLeave={() => setSpectraDropTargetNurseId(null)}
                      onDrop={(e) => handleNurseSpectraDrop(e, nurse.name)}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold">{nurse.name || "Unnamed Nurse"}</h4>
                          <p className="text-xs uppercase tracking-wider text-slate-400">{nurse.role}</p>
                          {nurse.spectra ? (
                            <p className="mt-1 text-xs text-slate-300">Spectra: {nurse.spectra}</p>
                          ) : null}
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          Capacity: {nurse.assignedPatientIds.length}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {nurse.assignedPatientIds.map((patientId, index) => {
                          const patient = patientId ? boardPatients.find((p) => p.id === patientId) : undefined;
                          return (
                            <div
                              key={`${nurse.id}-${index}`}
                              onDragOver={(e) => {
                                if (isSpectraDragEvent(e)) {
                                  handleNurseSpectraDragOver(e, nurse.id);
                                  return;
                                }
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                              }}
                              onDrop={(e) => {
                                const spectraId = readSpectraDragId(e);
                                if (spectraId && nurse.name.trim()) {
                                  handleNurseSpectraDrop(e, nurse.name);
                                  return;
                                }
                                e.preventDefault();
                                onDropOnNurseSlot(nurse.id, index);
                              }}
                              className={cn(
                                "rounded-md border-2 border-dashed px-3 py-2 text-sm",
                                patient ? "border-slate-600 bg-slate-800" : "border-cyan-500/60 bg-slate-950/40"
                              )}
                            >
                              {patient ? `${patient.roomDesignation} - ${patient.name}` : "Drop room assignment here"}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        {onAssignNurse && isStaffUnassigned(nurse.name) && (
                          <AssignStaffMemberButton
                            onClick={() => onAssignNurse(nurse.id)}
                            className="w-full"
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => onClearNurseAssignments(nurse.id)}
                        >
                          Clear assignments
                        </Button>
                        {onRemoveNurseCard ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-slate-600 text-slate-200"
                            onClick={() => onRemoveNurseCard(nurse.id)}
                          >
                            Remove card
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              {spectraPool.length > 0 ? (
                <div className="mt-4">
                  <SpectralinkDeviceTable
                    title="Oncoming Shift Spectralink Devices"
                    spectraPool={spectraPool}
                    nurses={boardNurses}
                    techs={techs}
                    onAssignDevice={onAssignSpectra}
                    onUnassignDevice={onUnassignSpectra}
                    onSetStatus={onSetSpectraStatus}
                    onAddLog={onAddSpectraLog}
                    staffDropColumns={3}
                  />
                </div>
              ) : null}
              {onAddNurseCard ? (
                <Button type="button" variant="outline" className="mt-4 w-full border-dashed" onClick={() => onAddNurseCard()}>
                  + Add nurse
                </Button>
              ) : null}
            </div>
            {onActivateOncomingShift ? (
              <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">Review assignments and the unit glance before activating.</p>
                <Button
                  type="button"
                  className="bg-orange-600 text-white hover:bg-orange-500"
                  onClick={() => void onActivateOncomingShift()}
                >
                  Activate oncoming shift
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShiftMakerDialog;
