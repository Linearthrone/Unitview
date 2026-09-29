
"use client";

import type { Patient } from '@/types/patient';
import { cn } from '@/lib/utils';
import { hallStaggerRowStyle } from '@/lib/hall-stagger';
import {
  cellKey,
  hallwaySizeOf,
  resolvePaintCells,
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
  onSelectPatient,
  title = 'Hallway map (glance only)',
}: ProgressiveGlanceMapProps) {
  const size = hallwaySizeOf(geometry);
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const paint = new Set(resolvePaintCells(geometry).map((cell) => cellKey(cell.row, cell.col)));
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
      <header className="px-3 py-2 border-b-2 border-border shrink-0">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-base text-muted-foreground">Not to scale. Rooms are pinned to the hallway — drag stays on the columns.</p>
      </header>
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="flex flex-col gap-1 min-h-full">
          {Array.from({ length: size.rows }, (_, rowIdx) => {
            const row = rowIdx + 1;
            return (
              <div key={`row-${row}`} className="flex-1 min-h-0" style={hallStaggerRowStyle(row, size.cols)}>
                {Array.from({ length: size.cols }, (_, colIdx) => {
                  const col = colIdx + 1;
                  const hallway = paint.has(cellKey(row, col));
                  const pinned = pinsByCell.get(cellKey(row, col)) ?? [];
                  return (
                    <div
                      key={cellKey(row, col)}
                      data-testid={hallway ? 'glance-hall-painted' : 'glance-hall-empty'}
                      className={cn(
                        'min-h-0 min-w-0 overflow-hidden border p-0.5',
                        hallway ? 'bg-secondary border-foreground' : 'bg-background border-border/40',
                      )}
                    >
                      {pinned.map((patient) => {
                        const vacant = patient.name === 'Vacant';
                        return (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => onSelectPatient?.(patient)}
                            className={cn(
                              'w-full max-h-full text-left border-2 border-border bg-card px-1 py-0.5 overflow-hidden',
                              patient.isBlocked && 'bg-black text-white',
                              !vacant && !patient.isBlocked && 'border-foreground',
                            )}
                          >
                            <div className="font-bold text-base leading-tight truncate">{patient.roomDesignation}</div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
