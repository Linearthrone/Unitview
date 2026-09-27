import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Patient } from '../types/patient';
import { countIsolationBreakdown, getPatientSafetyMarks } from './safety-marks';
import {
  collectNameAlertEntryKeys,
  computeNameAlertGroups,
  patientHasNameAlert,
} from './name-alerts';

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'p1',
    bedNumber: 1,
    roomDesignation: '401',
    name: 'Ada Patient',
    age: 60,
    admitDate: new Date('2026-09-01'),
    dischargeDate: new Date('2026-09-22'),
    chiefComplaint: '',
    ldas: [],
    diet: '',
    mobility: 'Independent',
    codeStatus: 'Full Code',
    orientationStatus: 'x3',
    isFallRisk: false,
    isSeizureRisk: false,
    isAspirationRisk: false,
    isIsolation: false,
    isInRestraints: false,
    isComfortCareDNR: false,
    gridRow: 1,
    gridColumn: 1,
    ...overrides,
  };
}

test('isolation subtypes are distinct labeled marks', () => {
  const contact = getPatientSafetyMarks(patient({ isIsolation: true, notes: 'Contact precautions' }));
  const airborne = getPatientSafetyMarks(patient({ isIsolation: true, notes: 'Airborne isolation' }));
  const droplet = getPatientSafetyMarks(patient({ isIsolation: true, notes: 'Droplet precautions' }));

  assert.equal(contact.find((m) => m.id === 'isolation-contact')?.label, 'Contact');
  assert.equal(contact.find((m) => m.id === 'isolation-contact')?.shape, 'square');
  assert.equal(airborne.find((m) => m.id === 'isolation-airborne')?.label, 'Airborne');
  assert.equal(airborne.find((m) => m.id === 'isolation-airborne')?.shape, 'diamond');
  assert.equal(droplet.find((m) => m.id === 'isolation-droplet')?.label, 'Droplet');
  assert.equal(droplet.find((m) => m.id === 'isolation-droplet')?.shape, 'circle');
});

test('required safety marks use shape plus short text', () => {
  const marks = getPatientSafetyMarks(
    patient({
      isFallRisk: true,
      isComfortCareDNR: true,
      isInRestraints: true,
    }),
    { hasNameAlert: true },
  );
  const byId = Object.fromEntries(marks.map((m) => [m.id, m]));
  assert.equal(byId.fall?.label, 'Fall');
  assert.equal(byId.fall?.shape, 'triangle');
  assert.equal(byId.dnr?.label, 'DNR');
  assert.equal(byId.restraints?.label, 'Restraints');
  assert.equal(byId.restraints?.shape, 'bar');
  assert.equal(byId['name-alert']?.label, 'Name');
  assert.equal(byId['name-alert']?.shape, 'diamond');
});

test('isolation breakdown counts occupied rooms by subtype', () => {
  const breakdown = countIsolationBreakdown([
    patient({ id: 'a', name: 'One Smith', notes: 'contact', isIsolation: true }),
    patient({ id: 'b', name: 'Two Jones', notes: 'airborne', isIsolation: true }),
    patient({ id: 'c', name: 'Vacant', isIsolation: true, notes: 'droplet' }),
    patient({ id: 'd', name: 'Three Lee', notes: 'droplet', isIsolation: true }),
  ]);
  assert.deepEqual(breakdown, { contact: 1, airborne: 1, droplet: 1, other: 0 });
});

test('name-alert keys match shared last names only', () => {
  const patients = [
    patient({ id: 'a', roomDesignation: '401', name: 'Pat Rivera' }),
    patient({ id: 'b', roomDesignation: '402', name: 'Sam Rivera' }),
    patient({ id: 'c', roomDesignation: '403', name: 'Lee Chen' }),
  ];
  const keys = collectNameAlertEntryKeys(computeNameAlertGroups(patients));
  assert.equal(patientHasNameAlert(patients[0]!, keys), true);
  assert.equal(patientHasNameAlert(patients[1]!, keys), true);
  assert.equal(patientHasNameAlert(patients[2]!, keys), false);
});
