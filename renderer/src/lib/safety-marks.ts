import type { Patient } from '../types/patient';
import { getIsolationType, hasHemodialysis, hasPeritonealDialysis } from './patient-clinical-helpers';
import {
  isAwaitingTransport,
  isOccupiedBed,
  patientNeedsTransportIndicator,
} from './patient-status-helpers';

/** Geometric frame so color is never the only channel (PROP-3.2). */
export type SafetyMarkShape = 'triangle' | 'diamond' | 'square' | 'circle' | 'bar' | 'pill';

export type SafetyMarkId =
  | 'isolation-contact'
  | 'isolation-airborne'
  | 'isolation-droplet'
  | 'isolation'
  | 'fall'
  | 'dnr'
  | 'restraints'
  | 'name-alert'
  | 'seizure'
  | 'aspiration'
  | 'hold'
  | 'sitter'
  | 'central-line'
  | 'tube-feed'
  | 'hd'
  | 'pd'
  | 'transport';

export interface SafetyMark {
  id: SafetyMarkId;
  label: string;
  shape: SafetyMarkShape;
  /** Border/frame treatment that still reads in black-and-white. */
  frame: 'solid' | 'dashed' | 'double' | 'dotted' | 'bar' | 'round';
  /** Secondary color channel — never rely on this alone. */
  toneClass: string;
}

export interface IsolationBreakdown {
  contact: number;
  airborne: number;
  droplet: number;
  other: number;
}

export function countIsolationBreakdown(patients: Patient[]): IsolationBreakdown {
  const breakdown: IsolationBreakdown = { contact: 0, airborne: 0, droplet: 0, other: 0 };
  for (const patient of patients) {
    if (!isOccupiedBed(patient.name) || !patient.isIsolation) continue;
    const type = getIsolationType(patient);
    if (type === 'Contact') breakdown.contact += 1;
    else if (type === 'Airborne') breakdown.airborne += 1;
    else if (type === 'Droplet') breakdown.droplet += 1;
    else breakdown.other += 1;
  }
  return breakdown;
}

export function getPatientSafetyMarks(
  patient: Patient,
  options?: { hasNameAlert?: boolean },
): SafetyMark[] {
  const marks: SafetyMark[] = [];
  const isolationType = getIsolationType(patient);

  if (isolationType === 'Contact') {
    marks.push({
      id: 'isolation-contact',
      label: 'Contact',
      shape: 'square',
      frame: 'dashed',
      toneClass: 'text-amber-800 dark:text-amber-200 border-amber-800 dark:border-amber-200',
    });
  } else if (isolationType === 'Airborne') {
    marks.push({
      id: 'isolation-airborne',
      label: 'Airborne',
      shape: 'diamond',
      frame: 'double',
      toneClass: 'text-orange-800 dark:text-orange-200 border-orange-800 dark:border-orange-200',
    });
  } else if (isolationType === 'Droplet') {
    marks.push({
      id: 'isolation-droplet',
      label: 'Droplet',
      shape: 'circle',
      frame: 'dotted',
      toneClass: 'text-sky-800 dark:text-sky-200 border-sky-800 dark:border-sky-200',
    });
  } else if (patient.isIsolation) {
    marks.push({
      id: 'isolation',
      label: 'Isolation',
      shape: 'square',
      frame: 'dashed',
      toneClass: 'text-amber-800 dark:text-amber-200 border-amber-800 dark:border-amber-200',
    });
  }

  if (patient.isFallRisk) {
    marks.push({
      id: 'fall',
      label: 'Fall',
      shape: 'triangle',
      frame: 'solid',
      toneClass: 'text-foreground border-foreground bg-accent',
    });
  }

  if (patient.isComfortCareDNR) {
    marks.push({
      id: 'dnr',
      label: 'DNR',
      shape: 'pill',
      frame: 'round',
      toneClass: 'text-purple-900 dark:text-purple-100 border-purple-800 dark:border-purple-200',
    });
  }

  if (patient.isInRestraints) {
    marks.push({
      id: 'restraints',
      label: 'Restraints',
      shape: 'bar',
      frame: 'bar',
      toneClass: 'text-destructive border-destructive',
    });
  }

  if (options?.hasNameAlert) {
    marks.push({
      id: 'name-alert',
      label: 'Name',
      shape: 'diamond',
      frame: 'solid',
      toneClass: 'text-amber-950 dark:text-amber-50 border-amber-900 dark:border-amber-100',
    });
  }

  if (patient.isSeizureRisk) {
    marks.push({
      id: 'seizure',
      label: 'Seizure',
      shape: 'square',
      frame: 'solid',
      toneClass: 'text-foreground border-foreground',
    });
  }

  if (patient.isAspirationRisk) {
    marks.push({
      id: 'aspiration',
      label: 'Aspiration',
      shape: 'circle',
      frame: 'solid',
      toneClass: 'text-foreground border-foreground',
    });
  }

  if (patient.isInvoluntaryHold1013) {
    marks.push({
      id: 'hold',
      label: '1013',
      shape: 'bar',
      frame: 'bar',
      toneClass: 'text-orange-900 dark:text-orange-100 border-orange-800 dark:border-orange-200',
    });
  }

  if (patient.requiresSitter) {
    marks.push({
      id: 'sitter',
      label: 'Sitter',
      shape: 'pill',
      frame: 'round',
      toneClass: 'text-sky-900 dark:text-sky-100 border-sky-800 dark:border-sky-200',
    });
  }

  const ldaText = (patient.ldas ?? []).join(' ').toLowerCase();
  if (ldaText.includes('central') || ldaText.includes('picc') || ldaText.includes('midline')) {
    marks.push({
      id: 'central-line',
      label: 'Central',
      shape: 'square',
      frame: 'dotted',
      toneClass: 'text-teal-900 dark:text-teal-100 border-teal-800 dark:border-teal-200',
    });
  }
  if (ldaText.includes('tube feed') || ldaText.includes('ng') || ldaText.includes('peg')) {
    marks.push({
      id: 'tube-feed',
      label: 'Tube',
      shape: 'circle',
      frame: 'dashed',
      toneClass: 'text-emerald-900 dark:text-emerald-100 border-emerald-800 dark:border-emerald-200',
    });
  }
  if (hasHemodialysis(patient)) {
    marks.push({
      id: 'hd',
      label: 'HD',
      shape: 'circle',
      frame: 'double',
      toneClass: 'text-blue-900 dark:text-blue-100 border-blue-800 dark:border-blue-200',
    });
  }
  if (hasPeritonealDialysis(patient)) {
    marks.push({
      id: 'pd',
      label: 'PD',
      shape: 'square',
      frame: 'double',
      toneClass: 'text-indigo-900 dark:text-indigo-100 border-indigo-800 dark:border-indigo-200',
    });
  }
  if (patientNeedsTransportIndicator(patient)) {
    marks.push({
      id: 'transport',
      label: isAwaitingTransport(patient) ? 'Transport' : 'DC today',
      shape: 'bar',
      frame: 'bar',
      toneClass: 'text-sky-900 dark:text-sky-100 border-sky-800 dark:border-sky-200',
    });
  }

  return marks;
}
