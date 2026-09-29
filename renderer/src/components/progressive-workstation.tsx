
"use client";

import type { Patient } from '@/types/patient';
import type { Nurse } from '@/types/nurse';
import { cn } from '@/lib/utils';
import { isOccupiedBed } from '@/lib/patient-status-helpers';
import { isAssignableNurseRole } from '@/lib/nurse-card-layout';
import { getPatientSafetyMarks } from '@/lib/safety-marks';
import { SafetyMarkBadge } from '@/components/safety-mark-badge';
import ProgressiveGlanceMap from '@/components/progressive-glance-map';
import type { ProgressiveViewState } from '@/lib/progressive-view';

interface ProgressiveWorkstationProps {
  patients: Patient[];
  nurses: Nurse[];
  geometry: ProgressiveViewState;
  isEffectivelyLocked?: boolean;
  isReadOnly?: boolean;
  canSeePatientIdentifiers?: boolean;
  onSelectPatient: (patient: Patient) => void;
  onPatientDragStart: (e: React.DragEvent<HTMLDivElement>, patientId: string, row: number, col: number) => void;
  onDropOnNurseSlot: (nurseId: string, slotIndex: number) => void;
  onDragEnd: () => void;
}

function RoomChip({
  patient,
  canSeePatientIdentifiers,
  locked,
  onSelectPatient,
  onPatientDragStart,
  onDragEnd,
}: {
  patient: Patient;
  canSeePatientIdentifiers: boolean;
  locked: boolean;
  onSelectPatient: (patient: Patient) => void;
  onPatientDragStart: ProgressiveWorkstationProps['onPatientDragStart'];
  onDragEnd: () => void;
}) {
  const marks = getPatientSafetyMarks(patient).slice(0, 4);
  const vacant = !isOccupiedBed(patient.name);
  return (
    <div
      data-patient-id={patient.id}
      draggable={!locked && !patient.isBlocked && !vacant}
      onDragStart={(event) => onPatientDragStart(event, patient.id, patient.gridRow, patient.gridColumn)}
      onDragEnd={onDragEnd}
      onClick={() => onSelectPatient(patient)}
      className={cn(
        'border-2 border-border bg-card px-2 py-1 cursor-pointer',
        !vacant && !patient.isBlocked && 'border-foreground',
        !locked && !patient.isBlocked && !vacant && 'cursor-grab',
      )}
    >
      <div className="font-bold text-base leading-tight">{patient.roomDesignation}</div>
      <div className="text-base leading-tight truncate">
        {vacant ? 'Vacant' : canSeePatientIdentifiers ? patient.name : 'Occupied'}
      </div>
      {marks.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {marks.map((mark) => (
            <SafetyMarkBadge key={mark.id} mark={mark} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProgressiveWorkstation({
  patients,
  nurses,
  geometry,
  isEffectivelyLocked = false,
  isReadOnly = false,
  canSeePatientIdentifiers = true,
  onSelectPatient,
  onPatientDragStart,
  onDropOnNurseSlot,
  onDragEnd,
}: ProgressiveWorkstationProps) {
  const locked = isEffectivelyLocked || isReadOnly;
  const assignable = nurses.filter((nurse) => isAssignableNurseRole(nurse.role));
  const assignedIds = new Set(
    assignable.flatMap((nurse) => nurse.assignedPatientIds.filter((id): id is string => Boolean(id))),
  );
  const unassigned = patients.filter(
    (patient) => isOccupiedBed(patient.name) && !patient.isBlocked && !assignedIds.has(patient.id),
  );

  return (
    <div className="flex-1 min-h-[70vh] flex min-w-0 overflow-hidden">
      <div className="w-full lg:w-[42%] min-w-[18rem] border-r-2 border-border overflow-auto p-3 space-y-3">
        <h3 className="text-base font-semibold">Nurse assignments</h3>
        {assignable.length === 0 && (
          <p className="text-base text-muted-foreground">No staff or float nurses on this unit yet.</p>
        )}
        {assignable.map((nurse) => (
          <section key={nurse.id} className="border-2 border-border bg-card p-2">
            <div className="font-semibold text-base mb-2">{nurse.name}</div>
            <div className="grid gap-2">
              {nurse.assignedPatientIds.map((patientId, slotIndex) => {
                const patient = patientId ? patients.find((item) => item.id === patientId) : undefined;
                return (
                  <div
                    key={`${nurse.id}-${slotIndex}`}
                    className="min-h-[4rem] border-2 border-dashed border-border p-1"
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = locked ? 'none' : 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (!locked) onDropOnNurseSlot(nurse.id, slotIndex);
                    }}
                  >
                    {patient ? (
                      <RoomChip
                        patient={patient}
                        canSeePatientIdentifiers={canSeePatientIdentifiers}
                        locked={locked}
                        onSelectPatient={onSelectPatient}
                        onPatientDragStart={onPatientDragStart}
                        onDragEnd={onDragEnd}
                      />
                    ) : (
                      <p className="text-base text-muted-foreground px-1">Empty slot</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        <section className="border-2 border-destructive bg-card p-2">
          <div className="font-semibold text-base mb-2">Unassigned</div>
          <div className="grid gap-2">
            {unassigned.length === 0 && (
              <p className="text-base text-muted-foreground">Every occupied room has a nurse.</p>
            )}
            {unassigned.map((patient) => (
              <RoomChip
                key={patient.id}
                patient={patient}
                canSeePatientIdentifiers={canSeePatientIdentifiers}
                locked={locked}
                onSelectPatient={onSelectPatient}
                onPatientDragStart={onPatientDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        </section>
      </div>
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <ProgressiveGlanceMap
          patients={patients}
          geometry={geometry}
          canSeePatientIdentifiers={canSeePatientIdentifiers}
          onSelectPatient={onSelectPatient}
        />
      </div>
    </div>
  );
}
