
"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';
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
  HALLWAY_COLS,
  HALLWAY_ROWS,
  HALL_SEGMENT_KINDS,
  cellKey,
  cellsForSegment,
  clearHallway,
  ensureProgressiveGeometry,
  moveHallSegment,
  nextHallOrientation,
  paintFromSegments,
  placeHallSegment,
  placeRoomPin,
  removeHallSegment,
  rotateHallSegment,
  segmentCoveringCell,
  segmentFits,
  segmentOffsets,
  type HallOrientation,
  type HallSegmentKind,
  type ProgressiveViewState,
} from '@/lib/progressive-view';

const DRAG_TYPE = 'application/x-unitview-hall';

interface ProgressiveSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  initial: ProgressiveViewState;
  onSave: (state: ProgressiveViewState) => void;
}

type DragPayload =
  | { kind: HallSegmentKind; orientation: HallOrientation }
  | { segmentId: string };

function readDragPayload(event: React.DragEvent): DragPayload | null {
  const raw = event.dataTransfer.getData(DRAG_TYPE) || event.dataTransfer.getData('text/plain');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DragPayload;
    if ('segmentId' in parsed && typeof parsed.segmentId === 'string') return parsed;
    if ('kind' in parsed && parsed.kind) return parsed;
  } catch {
    return null;
  }
  return null;
}

function SegmentPreview({
  kind,
  orientation,
}: {
  kind: HallSegmentKind;
  orientation: HallOrientation;
}) {
  const origin = 3;
  const keys = new Set(
    segmentOffsets(kind, orientation).map((offset) => cellKey(origin + offset.dr, origin + offset.dc)),
  );
  return (
    <div
      className="grid gap-px w-[4.5rem] shrink-0"
      style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
      aria-hidden
    >
      {Array.from({ length: 5 }, (_, rowIdx) =>
        Array.from({ length: 5 }, (_, colIdx) => {
          const on = keys.has(cellKey(rowIdx + 1, colIdx + 1));
          return (
            <span
              key={`${rowIdx}-${colIdx}`}
              className={cn('h-2 w-full border', on ? 'bg-foreground border-foreground' : 'bg-card border-border/40')}
            />
          );
        }),
      )}
    </div>
  );
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
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [armedKind, setArmedKind] = useState<HallSegmentKind>('straight3');
  const [paletteOrientation, setPaletteOrientation] = useState<HallOrientation>(0);
  const [hover, setHover] = useState<{ row: number; col: number; payload: DragPayload } | null>(null);
  const dragRef = useRef<DragPayload | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(ensureProgressiveGeometry(initial, patients));
      setSelectedRoomId(null);
      setSelectedSegmentId(null);
      setHover(null);
    }
  }, [open, initial, patients]);

  const paintCells = useMemo(
    () => (draft.segments.length > 0 ? paintFromSegments(draft.segments) : draft.paintCells),
    [draft.segments, draft.paintCells],
  );
  const paint = useMemo(
    () => new Set(paintCells.map((cell) => cellKey(cell.row, cell.col))),
    [paintCells],
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

  const ghostKeys = useMemo(() => {
    if (!hover) return new Set<string>();
    if ('segmentId' in hover.payload) {
      const movingId = hover.payload.segmentId;
      const current = draft.segments.find((segment) => segment.id === movingId);
      if (!current) return new Set<string>();
      return new Set(
        cellsForSegment({ ...current, row: hover.row, col: hover.col }).map((cell) =>
          cellKey(cell.row, cell.col),
        ),
      );
    }
    return new Set(
      cellsForSegment({
        id: 'ghost',
        kind: hover.payload.kind,
        row: hover.row,
        col: hover.col,
        orientation: hover.payload.orientation,
      }).map((cell) => cellKey(cell.row, cell.col)),
    );
  }, [hover, draft.segments]);

  const selectedSegment = draft.segments.find((segment) => segment.id === selectedSegmentId);

  const dropAt = (row: number, col: number, payload: DragPayload) => {
    if ('segmentId' in payload) {
      setDraft((prev) => moveHallSegment(prev, payload.segmentId, row, col));
      setSelectedSegmentId(payload.segmentId);
      return;
    }
    if (!segmentFits(payload.kind, row, col, payload.orientation)) return;
    setDraft((prev) => placeHallSegment(prev, payload.kind, row, col, payload.orientation));
  };

  const placeArmed = (row: number, col: number) => {
    if (!segmentFits(armedKind, row, col, paletteOrientation)) return;
    setDraft((prev) => placeHallSegment(prev, armedKind, row, col, paletteOrientation));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Progressive hallway setup</DialogTitle>
          <DialogDescription>
            Drag a hall piece onto the grid. Rotate it before or after placing. Pin rooms after the hallway is down.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-[15rem_1fr_11rem] min-h-0 flex-1 overflow-hidden">
          <div className="space-y-2 overflow-auto">
            <p className="text-base font-semibold">Hall pieces</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="text-base"
                onClick={() => setPaletteOrientation((value) => nextHallOrientation(value))}
              >
                <RotateCw className="h-4 w-4 mr-1.5" />
                Turn {paletteOrientation}°
              </Button>
            </div>
            {HALL_SEGMENT_KINDS.map((piece) => (
              <button
                key={piece.id}
                type="button"
                draggable
                onDragStart={(event) => {
                  const payload: DragPayload = { kind: piece.id, orientation: paletteOrientation };
                  event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
                  event.dataTransfer.setData('text/plain', JSON.stringify(payload));
                  event.dataTransfer.effectAllowed = 'copy';
                  dragRef.current = payload;
                  setArmedKind(piece.id);
                  setSelectedRoomId(null);
                }}
                onClick={() => {
                  setArmedKind(piece.id);
                  setSelectedRoomId(null);
                  setSelectedSegmentId(null);
                }}
                className={cn(
                  'w-full flex items-center gap-2 border-2 px-2 py-1.5 text-left text-base',
                  armedKind === piece.id ? 'border-foreground bg-accent' : 'border-border bg-card',
                )}
              >
                <SegmentPreview kind={piece.id} orientation={paletteOrientation} />
                <span className="font-semibold">{piece.label}</span>
              </button>
            ))}
            <p className="text-base text-muted-foreground">
              Selected piece places on click if you are not pinning a room.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full text-base"
              onClick={() => {
                setDraft((prev) => clearHallway(prev));
                setSelectedSegmentId(null);
              }}
            >
              Clear hallway
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
                  const ghost = ghostKeys.has(cellKey(row, col));
                  const covering = segmentCoveringCell(draft.segments, row, col);
                  const selected = covering?.id === selectedSegmentId;
                  const pinnedIds = pinByCell.get(cellKey(row, col)) ?? [];
                  return (
                    <button
                      key={cellKey(row, col)}
                      type="button"
                      draggable={Boolean(covering)}
                      onDragStart={(event) => {
                        if (!covering) return;
                        const payload: DragPayload = { segmentId: covering.id };
                        event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
                        event.dataTransfer.setData('text/plain', JSON.stringify(payload));
                        event.dataTransfer.effectAllowed = 'move';
                        dragRef.current = payload;
                        setSelectedSegmentId(covering.id);
                        setSelectedRoomId(null);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        const payload =
                          dragRef.current ?? { kind: armedKind, orientation: paletteOrientation };
                        setHover({ row, col, payload });
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const payload = readDragPayload(event) ?? dragRef.current;
                        dragRef.current = null;
                        setHover(null);
                        if (payload) dropAt(row, col, payload);
                      }}
                      onDragEnd={() => {
                        dragRef.current = null;
                        setHover(null);
                      }}
                      className={cn(
                        'min-h-[2.5rem] border text-base px-0.5',
                        ghost
                          ? 'bg-accent border-foreground'
                          : hallway
                            ? 'bg-secondary border-foreground'
                            : 'bg-card border-transparent',
                        selected && 'ring-2 ring-foreground',
                      )}
                      onClick={() => {
                        if (selectedRoomId) {
                          setDraft((prev) => placeRoomPin(prev, selectedRoomId, row, col));
                          setSelectedRoomId(null);
                          return;
                        }
                        if (covering) {
                          setSelectedSegmentId(covering.id);
                          return;
                        }
                        placeArmed(row, col);
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
          <div className="overflow-auto space-y-2">
            {selectedSegment ? (
              <div className="space-y-2 border-2 border-border p-2">
                <p className="text-base font-semibold">Selected piece</p>
                <SegmentPreview kind={selectedSegment.kind} orientation={selectedSegment.orientation} />
                <p className="text-base">
                  {HALL_SEGMENT_KINDS.find((item) => item.id === selectedSegment.kind)?.label} · {selectedSegment.orientation}°
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-base"
                  onClick={() => setDraft((prev) => rotateHallSegment(prev, selectedSegment.id))}
                >
                  <RotateCw className="h-4 w-4 mr-1.5" />
                  Rotate 90°
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-base"
                  onClick={() => {
                    setDraft((prev) => removeHallSegment(prev, selectedSegment.id));
                    setSelectedSegmentId(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Remove piece
                </Button>
              </div>
            ) : null}
            <p className="text-base font-semibold">Rooms</p>
            <p className="text-base text-muted-foreground">Select a room, then click a hallway cell.</p>
            {patients.map((patient) => (
              <Button
                key={patient.id}
                type="button"
                variant={selectedRoomId === patient.id ? 'default' : 'outline'}
                className="w-full justify-start text-base"
                onClick={() => {
                  setSelectedRoomId(patient.id);
                  setSelectedSegmentId(null);
                }}
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
              onSave({
                ...draft,
                paintCells: draft.segments.length > 0 ? paintFromSegments(draft.segments) : draft.paintCells,
                preferredMode: 'progressive',
              });
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
