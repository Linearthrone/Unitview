import type {
  FhirAllergyIntolerance,
  FhirCondition,
  FhirEncounter,
  FhirFlag,
  FhirNutritionOrder,
  FhirPatient,
  PatientContext,
} from './types';

const MRN_SYSTEM = 'urn:oid:1.2.840.114350.1.13.0.1.7.5.737384';

export const SANDBOX_PATIENTS: FhirPatient[] = [
  {
    resourceType: 'Patient',
    id: 'erXuFYUfucBZaryVksYEcMg3',
    identifier: [{ system: MRN_SYSTEM, value: '203713', type: { coding: [{ code: 'MR' }] } }],
    name: [{ use: 'official', family: 'Lopez', given: ['Camila'] }],
    gender: 'female',
    birthDate: '1987-04-12',
  },
  {
    resourceType: 'Patient',
    id: 'eq081-VQEgP8drUUqCWzHfw3',
    identifier: [{ system: MRN_SYSTEM, value: '202916', type: { coding: [{ code: 'MR' }] } }],
    name: [{ use: 'official', family: 'Lin', given: ['Derrick'] }],
    gender: 'male',
    birthDate: '1964-09-01',
  },
  {
    resourceType: 'Patient',
    id: 'eIXesllypH3M9tAA5WdJftQ3',
    identifier: [{ system: MRN_SYSTEM, value: '202540', type: { coding: [{ code: 'MR' }] } }],
    name: [{ use: 'official', family: 'Roberts', given: ['Elijah'] }],
    gender: 'male',
    birthDate: '1958-11-22',
  },
];

export const SANDBOX_ENCOUNTERS: FhirEncounter[] = [
  {
    resourceType: 'Encounter',
    id: 'eEnc-812',
    status: 'in-progress',
    subject: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' },
    period: { start: '2026-08-20T14:05:00Z' },
    reasonCode: [{ text: 'Community-acquired pneumonia' }],
    location: [{ location: { display: 'Room 812' } }],
  },
  {
    resourceType: 'Encounter',
    id: 'eEnc-813',
    status: 'in-progress',
    subject: { reference: 'Patient/eq081-VQEgP8drUUqCWzHfw3' },
    period: { start: '2026-08-18T07:40:00Z' },
    reasonCode: [{ text: 'CHF exacerbation' }],
    location: [{ location: { display: 'Room 813' } }],
  },
  {
    resourceType: 'Encounter',
    id: 'eEnc-814',
    status: 'in-progress',
    subject: { reference: 'Patient/eIXesllypH3M9tAA5WdJftQ3' },
    period: { start: '2026-08-22T03:15:00Z' },
    reasonCode: [{ text: 'Sepsis, unknown source' }],
    location: [{ location: { display: 'Room 814' } }],
  },
];

export const SANDBOX_FLAGS: FhirFlag[] = [
  {
    resourceType: 'Flag',
    status: 'active',
    code: { text: 'Fall risk' },
    subject: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' },
  },
  {
    resourceType: 'Flag',
    status: 'active',
    code: { text: 'Contact isolation' },
    subject: { reference: 'Patient/eq081-VQEgP8drUUqCWzHfw3' },
  },
  {
    resourceType: 'Flag',
    status: 'active',
    code: { text: 'DNR / Comfort care' },
    subject: { reference: 'Patient/eIXesllypH3M9tAA5WdJftQ3' },
  },
];

export const SANDBOX_CONDITIONS: FhirCondition[] = [
  {
    resourceType: 'Condition',
    code: { text: 'Foley catheter in place' },
    subject: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' },
  },
  {
    resourceType: 'Condition',
    code: { text: 'Assisted mobility, walker' },
    subject: { reference: 'Patient/eq081-VQEgP8drUUqCWzHfw3' },
  },
];

export const SANDBOX_NUTRITION: FhirNutritionOrder[] = [
  {
    resourceType: 'NutritionOrder',
    status: 'active',
    patient: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' },
    oralDiet: { instruction: 'Cardiac, thin liquids' },
  },
  {
    resourceType: 'NutritionOrder',
    status: 'active',
    patient: { reference: 'Patient/eq081-VQEgP8drUUqCWzHfw3' },
    oralDiet: { instruction: '2g sodium' },
  },
];

export const SANDBOX_ALLERGIES: FhirAllergyIntolerance[] = [
  {
    resourceType: 'AllergyIntolerance',
    patient: { reference: 'Patient/eIXesllypH3M9tAA5WdJftQ3' },
    code: { text: 'Penicillin' },
  },
];

export function buildSandboxContexts(): PatientContext[] {
  const extras = buildExpandedSandboxCensus();
  const patients = [...SANDBOX_PATIENTS, ...extras.patients];
  const encounters = [...SANDBOX_ENCOUNTERS, ...extras.encounters];
  const flags = [...SANDBOX_FLAGS, ...extras.flags];
  const conditions = [...SANDBOX_CONDITIONS, ...extras.conditions];
  const nutritionOrders = [...SANDBOX_NUTRITION, ...extras.nutrition];
  const allergies = [...SANDBOX_ALLERGIES, ...extras.allergies];
  return patients.map((patient) => {
    const id = patient.id ?? '';
    return {
      patient,
      encounter: encounters.find((enc) => enc.subject?.reference?.endsWith(id)),
      flags: flags.filter((flag) => flag.subject?.reference?.endsWith(id)),
      conditions: conditions.filter((condition) => condition.subject?.reference?.endsWith(id)),
      nutritionOrders: nutritionOrders.filter((order) => order.patient?.reference?.endsWith(id)),
      allergies: allergies.filter((allergy) => allergy.patient?.reference?.endsWith(id)),
    };
  });
}

const CORE_SANDBOX_ROOMS = new Set([812, 813, 814]);
const EXTRA_GIVEN = [
  'Amina', 'Jonah', 'Priya', 'Mateo', 'Helen', 'Omar', 'Yuki', 'Nora',
  'Theo', 'Ingrid', 'Luis', 'Sable', 'Kenji', 'Freya', 'Ibrahim', 'Marisol',
  'Owen', 'Talia', 'Hassan', 'Greta', 'Nico', 'Pilar', 'Seth', 'Willa',
  'Ravi', 'Elsa', 'Diego', 'Jun', 'Hana', 'Paolo', 'Ruth', 'Kian',
  'Beatrice', 'Malik', 'Clara', 'Yusuf', 'Ivy',
];
const EXTRA_FAMILY = [
  'Okoye', 'Park', 'Mehta', 'Alvarez', 'Brennan', 'Haddad', 'Nakamura', 'Iversen',
  'Brooks', 'Lindqvist', 'Santos', 'Crow', 'Fujita', 'Olsen', 'Diallo', 'Vega',
  'Grant', 'Cohen', 'Rahman', 'Weber', 'Rossi', 'Castillo', 'Quinn', 'Hart',
  'Sharma', 'Berg', 'Mora', 'Cho', 'Yamamoto', 'Ricci', 'Klein', 'Nouri',
  'Moreau', 'Adeyemi', 'Novak', 'Farouk', 'Lane',
];
const EXTRA_REASONS = [
  'Cellulitis', 'GI bleed', 'Hyponatremia', 'Post-op hip', 'COPD flare',
  'Pyelonephritis', 'Atrial fibrillation with RVR', 'DKA', 'Stroke workup', 'Pancreatitis',
];

function buildExpandedSandboxCensus(): {
  patients: FhirPatient[];
  encounters: FhirEncounter[];
  flags: FhirFlag[];
  conditions: FhirCondition[];
  nutrition: FhirNutritionOrder[];
  allergies: FhirAllergyIntolerance[];
} {
  const rooms = Array.from({ length: 40 }, (_, index) => 801 + index).filter((room) => !CORE_SANDBOX_ROOMS.has(room));
  const patients: FhirPatient[] = [];
  const encounters: FhirEncounter[] = [];
  const flags: FhirFlag[] = [];
  const conditions: FhirCondition[] = [];
  const nutrition: FhirNutritionOrder[] = [];
  const allergies: FhirAllergyIntolerance[] = [];

  rooms.forEach((room, index) => {
    const id = `eSandbox-${room}`;
    const given = EXTRA_GIVEN[index % EXTRA_GIVEN.length] ?? 'Pat';
    const family = EXTRA_FAMILY[index % EXTRA_FAMILY.length] ?? 'Patient';
    const gender: FhirPatient['gender'] = index % 2 === 0 ? 'female' : 'male';
    const year = 1948 + (index % 40);
    patients.push({
      resourceType: 'Patient',
      id,
      identifier: [{ system: MRN_SYSTEM, value: String(210000 + room), type: { coding: [{ code: 'MR' }] } }],
      name: [{ use: 'official', family, given: [given] }],
      gender,
      birthDate: `${year}-06-15`,
    });
    encounters.push({
      resourceType: 'Encounter',
      id: `eEnc-${room}`,
      status: 'in-progress',
      subject: { reference: `Patient/${id}` },
      period: { start: `2026-09-${String((index % 27) + 1).padStart(2, '0')}T10:00:00Z` },
      reasonCode: [{ text: EXTRA_REASONS[index % EXTRA_REASONS.length] ?? 'Inpatient stay' }],
      location: [{ location: { display: `Room ${room}` } }],
    });
    if (index % 5 === 0) {
      flags.push({
        resourceType: 'Flag',
        status: 'active',
        code: { text: 'Fall risk' },
        subject: { reference: `Patient/${id}` },
      });
    }
    if (index % 7 === 0) {
      flags.push({
        resourceType: 'Flag',
        status: 'active',
        code: { text: 'Contact isolation' },
        subject: { reference: `Patient/${id}` },
      });
    }
    if (index % 11 === 0) {
      allergies.push({
        resourceType: 'AllergyIntolerance',
        patient: { reference: `Patient/${id}` },
        code: { text: 'Sulfa' },
      });
    }
    conditions.push({
      resourceType: 'Condition',
      code: { text: EXTRA_REASONS[index % EXTRA_REASONS.length] ?? 'Inpatient stay' },
      subject: { reference: `Patient/${id}` },
    });
    nutrition.push({
      resourceType: 'NutritionOrder',
      status: 'active',
      patient: { reference: `Patient/${id}` },
      oralDiet: { instruction: index % 3 === 0 ? 'Cardiac' : 'Regular' },
    });
  });

  return { patients, encounters, flags, conditions, nutrition, allergies };
}
