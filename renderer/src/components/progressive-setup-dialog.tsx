
"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Patient } from '@/types/patient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CORRIDOR_TEMPLATES,
  HALLWAY_COLS,
  HALLWAY_ROWS,
  applyTemplate,
  cellKey,
  ensureProgressiveGeometry,
  placeRoomPin,
  togglePaintCell,
  type CorridorTemplateId,
  type ProgressiveViewState,
} from '@/lib/progressive-view';

interface ProgressiveSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  initial: ProgressiveViewState;
  onSave: (state: ProgressiveViewState) => void;
}

export default function ProgressiveSetupDialog({
  open,
  onOpenChange,
  patients,
  initial,
  onSave,
}: ProgressiveSetupDialogProps) {
  const [draft, setDraft] = useState<ProgressiveViewState>(initial);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [paintMode, setPaintMode] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(ensureProgressiveGeometry(initial, patients));
      setSelectedRoomId(null);
      setPaintMode(false);
    }
  }, [open, initial, patients]);

  const paint = useMemo(
    () => new Set(draft.paintCells.map((cell) => cellKey(cell.row, cell.col))),
    [draft.paintCells],
  );
  const pinByCell = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const pin of draft.roomPins) {
      const key = cellKey(pin.row, pin.col);
      const list = map.get(key) ?? [];
      list.push(pin.patientId);
      map.set(key, list);
    }
    return map;
  }, [draft.roomPins]);

  const applySelectedTemplate = (templateId: CorridorTemplateId) => {
    setDraft(applyTemplate(templateId, patients, draft.preferredMode));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Progressive view setup</DialogTitle>
          <DialogDescription>
            Pick a hallway template, paint extra cells if needed, then pin rooms. This is hallway-enough — not a blueprint.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-[14rem_1fr_12rem] min-h-0 flex-1 overflow-hidden">
          <div className="space-y-2 overflow-auto">
            <p className="text-base font-semibold">Corridor templates</p>
            {CORRIDOR_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                type="button"
                variant={draft.templateId === template.id ? 'default' : 'outline'}
                className="w-full justify-start text-base"
                onClick={() => applySelectedTemplate(template.id)}
              >
                {template.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={paintMode ? 'default' : 'outline'}
              className="w-full text-base"
              onClick={() => setPaintMode((value) => !value)}
            >
              {paintMode ? 'Painting hallway' : 'Paint hallway cells'}
            </Button>
          </div>
          <div className="overflow-auto border-2 border-border p-2 bg-background">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${HALLWAY_COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${HALLWAY_ROWS}, minmax(2.5rem, 1fr))`,
              }}
            >
              {Array.from({ length: HALLWAY_ROWS }, (_, rowIdx) =>
                Array.from({ length: HALLWAY_COLS }, (_, colIdx) => {
                  const row = rowIdx + 1;
                  const col = colIdx + 1;
                  const hallway = paint.has(cellKey(row, col));
                  const pinnedIds = pinByCell.get(cellKey(row, col)) ?? [];
                  return (
                    <button
                      key={cellKey(row, col)}
                      type="button"
                      className={cn(
                        'min-h-[2.5rem] border text-base px-0.5',
                        hallway ? 'bg-muted border-foreground/50' : 'bg-card border-transparent',
                      )}
                      onClick={() => {
                        if (paintMode) {
                          setDraft((prev) => ({ ...prev, paintCells: togglePaintCell(prev.paintCells, row, col) }));
                          return;
                        }
                        if (selectedRoomId) {
                          setDraft((prev) => placeRoomPin(prev, selectedRoomId, row, col));
                          setSelectedRoomId(null);
                        }
                      }}
                    >
                      {pinnedIds.map((id) => {
                        const room = patients.find((patient) => patient.id === id);
                        return (
                          <span key={id} className="block truncate font-semibold">
                            {room?.roomDesignation ?? id}
                          </span>
                        );
                      })}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
          <div className="overflow-auto space-y-1">
            <p className="text-base font-semibold">Rooms</p>
            <p className="text-base text-muted-foreground">Select a room, then click a hallway cell.</p>
            {patients.map((patient) => (
              <Button
                key={patient.id}
                type="button"
                variant={selectedRoomId === patient.id ? 'default' : 'outline'}
                className="w-full justify-start text-base"
                onClick={() => setSelectedRoomId(patient.id)}
              >
                {patient.roomDesignation}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave({ ...draft, preferredMode: 'progressive' });
              onOpenChange(false);
            }}
          >
            Save and use Progressive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
