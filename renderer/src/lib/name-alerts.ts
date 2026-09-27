import type { Patient } from '@/types/patient';

export interface NameAlertGroup {
  /** Normalized key (e.g. shared last name) */
  key: string;
  /** Human-readable label for the banner */
  label: string;
  /** Room + patient strings for display */
  entries: { room: string; name: string }[];
}

function isOccupied(p: Patient): boolean {
  return p.name.trim() !== '' && p.name !== 'Vacant';
}

function parseNameParts(fullName: string): { first: string; last: string } | null {
  const t = fullName.trim();
  if (!t) return null;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0]!.toLowerCase(), last: '' };
  return {
    first: parts[0]!.toLowerCase(),
    last: parts[parts.length - 1]!.toLowerCase(),
  };
}

/** Flag groups that share the same last name (2+ occupied patients). */
export function computeNameAlertGroups(patients: Patient[]): NameAlertGroup[] {
  const byLast = new Map<string, { room: string; name: string }[]>();

  for (const p of patients) {
    if (!isOccupied(p)) continue;
    const parts = parseNameParts(p.name);
    if (!parts || !parts.last) continue;
    const list = byLast.get(parts.last) ?? [];
    list.push({ room: p.roomDesignation, name: p.name.trim() });
    byLast.set(parts.last, list);
  }

  const groups: NameAlertGroup[] = [];
  for (const [last, entries] of byLast) {
    if (entries.length < 2) continue;
    const sorted = [...entries].sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true }));
    const displayLast = entries[0]!.name.split(/\s+/).pop() ?? last;
    groups.push({
      key: last,
      label: `Same last name (${displayLast})`,
      entries: sorted,
    });
  }

  return groups.sort((a, b) => a.entries[0]!.room.localeCompare(b.entries[0]!.room, undefined, { numeric: true }));
}

export function nameAlertEntryKey(room: string, name: string): string {
  return `${room}\0${name.trim()}`;
}

export function collectNameAlertEntryKeys(groups: NameAlertGroup[]): Set<string> {
  const keys = new Set<string>();
  for (const group of groups) {
    for (const entry of group.entries) {
      keys.add(nameAlertEntryKey(entry.room, entry.name));
    }
  }
  return keys;
}

export function patientHasNameAlert(patient: Patient, keys: Set<string>): boolean {
  return keys.has(nameAlertEntryKey(patient.roomDesignation, patient.name));
}

/** Stable id for an alert group; changes when patients in the group change. */
export function getNameAlertSignature(group: NameAlertGroup): string {
  const entrySig = group.entries
    .map((e) => `${e.room}:${e.name.trim().toLowerCase()}`)
    .sort()
    .join('|');
  return `${group.key}|${entrySig}`;
}
