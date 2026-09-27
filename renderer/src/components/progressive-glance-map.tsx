
"use client";

import type { Patient } from '@/types/patient';
import { cn } from '@/lib/utils';
import { getPatientSafetyMarks } from '@/lib/safety-marks';
import { SafetyMarkBadge } from '@/components/safety-mark-badge';
import {
  HALLWAY_COLS,
  HALLWAY_ROWS,
  cellKey,
  type ProgressiveViewState,
} from '@/lib/progressive-view';

interface ProgressiveGlanceMapProps {
  patients: Patient[];
  geometry: ProgressiveViewState;
  canSeePatientIdentifiers?: boolean;
  onSelectPatient?: (patient: Patient) => void;
  title?: string;
}

export default function ProgressiveGlanceMap({
  patients,
  geometry,
  canSeePatientIdentifiers = true,
  onSelectPatient,
  title = 'Hallway map (glance only)',
}: ProgressiveGlanceMapProps) {
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const paint = new Set(geometry.paintCells.map((cell) => cellKey(cell.row, cell.col)));
  const pinsByCell = new Map<string, Patient[]>();
  for (const pin of geometry.roomPins) {
    const patient = patientById.get(pin.patientId);
    if (!patient) continue;
    const key = cellKey(pin.row, pin.col);
    const list = pinsByCell.get(key) ?? [];
    list.push(patient);
    pinsByCell.set(key, list);
  }

  return (
    <section className="flex flex-col min-h-0 h-full border-2 border-border bg-background" aria-label={title}>
      <header className="px-3 py-2 border-b-2 border-border">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-base text-muted-foreground">Not to scale. Rooms are pinned to the hallway — drag stays on the columns.</p>
      </header>
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div
          className="grid gap-1 w-full max-w-4xl mx-auto min-h-[24rem]"
          style={{
            gridTemplateColumns: `repeat(${HALLWAY_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${HALLWAY_ROWS}, minmax(3.25rem, 1fr))`,
          }}
        >
          {Array.from({ length: HALLWAY_ROWS }, (_, rowIdx) =>
            Array.from({ length: HALLWAY_COLS }, (_, colIdx) => {
              const row = rowIdx + 1;
              const col = colIdx + 1;
              const hallway = paint.has(cellKey(row, col));
              const pinned = pinsByCell.get(cellKey(row, col)) ?? [];
              return (
                <div
                  key={cellKey(row, col)}
                  className={cn(
                    'min-h-[3.25rem] border p-1 overflow-hidden',
                    hallway ? 'bg-muted border-foreground/40' : 'bg-card border-transparent',
                  )}
                >
                  {pinned.map((patient) => {
                    const marks = getPatientSafetyMarks(patient).slice(0, 3);
                    const vacant = patient.name === 'Vacant';
                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => onSelectPatient?.(patient)}
                        className={cn(
                          'w-full text-left border-2 border-border bg-card px-1 py-0.5 mb-1',
                          patient.isBlocked && 'bg-black text-white',
                          !vacant && !patient.isBlocked && 'border-foreground',
                        )}
                      >
                        <div className="font-bold text-base leading-tight">{patient.roomDesignation}</div>
                        <div className="text-base leading-tight truncate">
                          {vacant
                            ? 'Vacant'
                            : canSeePatientIdentifiers
                              ? patient.name
                              : 'Occupied'}
                        </div>
                        {marks.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {marks.map((mark) => (
                              <SafetyMarkBadge key={mark.id} mark={mark} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </section>
  );
}
