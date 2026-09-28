
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

function payloadFits(payload: DragPayload, row: number, col: number, draft: ProgressiveViewState): boolean {
  if ('segmentId' in payload) {
    const current = draft.segments.find((segment) => segment.id === payload.segmentId);
    if (!current) return false;
    return segmentFits(current.kind, row, col, current.orientation);
  }
  return segmentFits(payload.kind, row, col, payload.orientation);
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
      const prepared = ensureProgressiveGeometry(initial, patients);
      const editorPaint =
        prepared.segments.length > 0
          ? paintFromSegments(prepared.segments)
          : (initial.paintCells ?? []);
      setDraft({ ...prepared, paintCells: editorPaint });
      setSelectedRoomId(null);
      setSelectedSegmentId(null);
      setHover(null);
      setPaletteOrientation(0);
    }
  }, [open, initial, patients]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (!selectedSegmentId) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        setDraft((prev) => rotateHallSegment(prev, selectedSegmentId));
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        setDraft((prev) => removeHallSegment(prev, selectedSegmentId));
        setSelectedSegmentId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selectedSegmentId]);

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

  const ghostFits = hover ? payloadFits(hover.payload, hover.row, hover.col, draft) : true;
  const selectedSegment = draft.segments.find((segment) => segment.id === selectedSegmentId);
  const armedLabel = HALL_SEGMENT_KINDS.find((item) => item.id === armedKind)?.label ?? armedKind;

  const selectAdded = (prev: ProgressiveViewState, next: ProgressiveViewState) => {
    const known = new Set(prev.segments.map((segment) => segment.id));
    const added = next.segments.find((segment) => !known.has(segment.id));
    if (added) setSelectedSegmentId(added.id);
  };

  const dropAt = (row: number, col: number, payload: DragPayload) => {
    if ('segmentId' in payload) {
      setDraft((prev) => moveHallSegment(prev, payload.segmentId, row, col));
      setSelectedSegmentId(payload.segmentId);
      setSelectedRoomId(null);
      return;
    }
    setDraft((prev) => {
      const next = placeHallSegment(prev, payload.kind, row, col, payload.orientation);
      selectAdded(prev, next);
      return next;
    });
    setSelectedRoomId(null);
  };

  const placeArmed = (row: number, col: number) => {
    setDraft((prev) => {
      const next = placeHallSegment(prev, armedKind, row, col, paletteOrientation);
      selectAdded(prev, next);
      return next;
    });
    setSelectedRoomId(null);
  };

  const hoverPayload = (): DragPayload =>
    dragRef.current ?? { kind: armedKind, orientation: paletteOrientation };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Progressive hallway setup</DialogTitle>
          <DialogDescription>
            Drag a premade hall piece onto the grid, or select it and click a cell. Turn rotates the
            piece before it is placed. After it is down, select it and Rotate 90° (or press R).
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
                data-testid="turn-palette"
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
                data-testid={`hall-piece-${piece.id}`}
                aria-pressed={armedKind === piece.id}
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
              {armedLabel} at {paletteOrientation}° places on click if you are not pinning a room.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full text-base"
              data-testid="clear-hallway"
              onClick={() => {
                setDraft((prev) => clearHallway(prev));
                setSelectedSegmentId(null);
              }}
            >
              Clear hallway
            </Button>
          </div>
          <div className="overflow-auto border-2 border-border p-2 bg-background min-h-0">
            {selectedSegment ? (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-base font-semibold">
                  {HALL_SEGMENT_KINDS.find((item) => item.id === selectedSegment.kind)?.label} · {selectedSegment.orientation}°
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="text-base"
                  data-testid="rotate-placed-segment"
                  onClick={() => setDraft((prev) => rotateHallSegment(prev, selectedSegment.id))}
                >
                  <RotateCw className="h-4 w-4 mr-1.5" />
                  Rotate 90°
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-base"
                  data-testid="remove-placed-segment"
                  onClick={() => {
                    setDraft((prev) => removeHallSegment(prev, selectedSegment.id));
                    setSelectedSegmentId(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Remove piece
                </Button>
              </div>
            ) : (
              <p className="text-base text-muted-foreground mb-2">
                Empty until you drop pieces. Hover a cell to preview. Invalid placements stay off the canvas.
              </p>
            )}
            <div
              className="grid gap-1"
              data-testid="hall-segment-grid"
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
                  const pinnedIds = hallway ? (pinByCell.get(cellKey(row, col)) ?? []) : [];
                  return (
                    <button
                      key={cellKey(row, col)}
                      type="button"
                      draggable={Boolean(covering)}
                      data-testid={`hall-cell-${row}-${col}`}
                      aria-label={`Hall cell ${row},${col}`}
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
                        setHover({ row, col, payload: hoverPayload() });
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
                      onMouseEnter={() => {
                        if (selectedRoomId) return;
                        if (!dragRef.current && covering) {
                          setHover(null);
                          return;
                        }
                        setHover({ row, col, payload: hoverPayload() });
                      }}
                      onMouseLeave={() => {
                        if (!dragRef.current) setHover(null);
                      }}
                      className={cn(
                        'min-h-[2.5rem] border text-base px-0.5',
                        ghost
                          ? ghostFits
                            ? 'bg-accent border-foreground'
                            : 'bg-destructive/20 border-destructive'
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
            data-testid="save-progressive-hallway"
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
