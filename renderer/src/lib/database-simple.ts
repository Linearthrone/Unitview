// Enhanced database implementation with authentication and persistence
// This uses a JSON-based storage system that works in the renderer process

import type { Patient, LayoutName, UserPreferences, AssignmentSet, UnitLayoutMetadata } from '../types/patient';
import type { AssignmentPrintLayoutConfig } from '../types/assignment-print-layout';
import type { Nurse, PatientCareTech, Spectra } from '../types/nurse';
import type { User, UnitSettings } from '../types/auth';
import type { FacilityProfile } from '../types/facility';
import { defaultFacilityProfile } from '../types/facility';
import { getConfiguredDataSource } from './data-source';
import { STORE_UNAVAILABLE_MESSAGE, decideVaultInit } from './vault-init';
import { applyAppTheme, normalizeAppTheme, type AppTheme } from './app-theme';

export class StoreUnavailableError extends Error {
  constructor(message = STORE_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = 'StoreUnavailableError';
  }
}

// Stored rows include layoutName so one array can hold all layouts.
type StoredPatient = Patient & { layoutName: LayoutName };
type StoredNurse = Nurse & { layoutName: LayoutName };
type StoredPatientCareTech = PatientCareTech & { layoutName: LayoutName };

// Data storage interfaces
interface DatabaseSchema {
  user_preferences: { [key: string]: string };
  layouts: ({ name: string; created_at: string; updated_at: string } & Partial<UnitLayoutMetadata> & {
    assignmentPrintLayout?: AssignmentPrintLayoutConfig;
  })[];
  patients: StoredPatient[];
  nurses: StoredNurse[];
  /** Draft nurse cards + assignments for the upcoming shift (same row shape as `nurses`; isolated until activation). */
  nurses_oncoming: StoredNurse[];
  patient_care_techs: StoredPatientCareTech[];
  spectra_pool: Spectra[];
  assignment_sets: AssignmentSet[];
  users: User[];
  passwords: { [employeeNumber: string]: string };
  unit_settings: UnitSettings[];
  facility_profile: FacilityProfile;
  global_theme: 'light' | 'dark';
  action_history: any[];
  history_index: number;
}

// In-memory storage with persistence to electron API
export class SimpleDatabase {
  private data: DatabaseSchema = {
    user_preferences: {},
    layouts: [],
    patients: [],
    nurses: [],
    nurses_oncoming: [],
    patient_care_techs: [],
    spectra_pool: [],
    assignment_sets: [],
    users: [],
    passwords: {},
    unit_settings: [],
    facility_profile: { ...defaultFacilityProfile },
    global_theme: 'light',
    action_history: [],
    history_index: -1,
  };

  private isLoaded = false;
  private storeStatus: 'uninitialized' | 'available' | 'unavailable' = 'uninitialized';
  private writeChain: Promise<void> = Promise.resolve();

  isStoreAvailable(): boolean {
    return this.storeStatus === 'available';
  }

  async initialize(): Promise<void> {
    if (this.isLoaded && this.storeStatus === 'available') {
      return;
    }
    if (this.storeStatus === 'unavailable') {
      throw new StoreUnavailableError();
    }

    const dataSource = getConfiguredDataSource();
    console.log('Database source:', dataSource);

    if (window.electronAPI?.loadSecureStore) {
      const vault = await window.electronAPI.loadSecureStore();
      const decision = decideVaultInit(vault);
      if (decision.kind === 'blocked') {
        this.markUnavailable();
        throw new StoreUnavailableError(decision.message);
      }
      if (decision.kind === 'use') {
        try {
          this.data = JSON.parse(decision.payload) as DatabaseSchema;
        } catch {
          this.markUnavailable();
          throw new StoreUnavailableError(STORE_UNAVAILABLE_MESSAGE);
        }
        this.ensureCompatFields();
        this.storeStatus = 'available';
        this.isLoaded = true;
        return;
      }
      this.applyFirstRunDefaults();
      this.storeStatus = 'available';
      this.isLoaded = true;
      this.saveToLocalStorage();
      await this.flushPendingWrites();
      localStorage.removeItem('unitview_data');
      return;
    }

    this.applyFirstRunDefaults();
    this.storeStatus = 'available';
    this.isLoaded = true;
    this.saveToLocalStorage();
    await this.flushPendingWrites();
  }

  private markUnavailable(): void {
    this.storeStatus = 'unavailable';
    this.isLoaded = false;
  }

  async flushPendingWrites(): Promise<void> {
    await this.writeChain;
  }

  private ensureCompatFields(): void {
    if (!this.data.users) this.data.users = [];
    if (!this.data.passwords) this.data.passwords = {};
    if (!this.data.unit_settings) this.data.unit_settings = [];
    if (!this.data.facility_profile) this.data.facility_profile = { ...defaultFacilityProfile };
    if (!this.data.global_theme) this.data.global_theme = 'light';
    this.data.global_theme = normalizeAppTheme(this.data.global_theme);
    if (!this.data.action_history) this.data.action_history = [];
    if (!this.data.history_index) this.data.history_index = -1;
    if (!this.data.nurses_oncoming) this.data.nurses_oncoming = [];
  }

  private applyFirstRunDefaults(): void {
    try {
      const stored = localStorage.getItem('unitview_data');
      if (stored) {
        this.data = JSON.parse(stored) as DatabaseSchema;
        this.ensureCompatFields();
        return;
      }
    } catch {
      console.error('Failed to load local application store');
    }
    this.applyDefaultSchema();
  }

  private applyDefaultSchema(): void {
    this.data.user_preferences = {
      lastSelectedLayout: 'North-South View',
      isLayoutLocked: 'false',
    };

    this.data.layouts = [
      {
        name: 'North-South View',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.data.spectra_pool = [
      { id: 'SPEC-1001', inService: true },
      { id: 'SPEC-1002', inService: true },
      { id: 'SPEC-1003', inService: true },
      { id: 'SPEC-1004', inService: true },
      { id: 'SPEC-1005', inService: true },
      { id: 'SPEC-1006', inService: true },
      { id: 'SPEC-1007', inService: true },
      { id: 'SPEC-1008', inService: true },
      { id: 'SPEC-1009', inService: true },
      { id: 'SPEC-1010', inService: true },
      { id: 'SPEC-1011', inService: true },
      { id: 'SPEC-1012', inService: true },
    ];

    // Initialize empty arrays for auth data
    this.data.users = [];
    this.data.passwords = {};
    this.data.unit_settings = [];
    this.data.global_theme = 'light';
    this.data.action_history = [];
    this.data.history_index = -1;
  }

  private enqueueSave(): Promise<void> {
    if (this.storeStatus !== 'available') {
      return Promise.resolve();
    }
    this.writeChain = this.writeChain.then(() => this.flushVault());
    return this.writeChain;
  }

  private async flushVault(): Promise<void> {
    if (this.storeStatus !== 'available') {
      return;
    }
    const dataString = JSON.stringify(this.data);
    if (window.electronAPI?.saveSecureStore) {
      const result = await window.electronAPI.saveSecureStore(dataString);
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to save encrypted application data.');
      }
      return;
    }
    localStorage.setItem('unitview_data', dataString);
  }

  private saveToLocalStorage(): void {
    void this.enqueueSave().catch((error: unknown) => {
      console.error('Failed to persist application store', error);
    });
  }

  saveBoardSnapshot(
    layoutName: LayoutName,
    snapshot: {
      patients: Patient[];
      nurses: Nurse[];
      oncomingNurses: Nurse[];
      techs: PatientCareTech[];
    },
  ): void {
    this.data.patients = this.data.patients.filter((p) => p.layoutName !== layoutName);
    this.data.patients.push(...snapshot.patients.map((p) => ({ ...p, layoutName })));
    this.data.nurses = this.data.nurses.filter((n) => n.layoutName !== layoutName);
    this.data.nurses.push(...snapshot.nurses.map((n) => ({ ...n, layoutName })));
    this.data.nurses_oncoming = this.data.nurses_oncoming.filter((n) => n.layoutName !== layoutName);
    this.data.nurses_oncoming.push(...snapshot.oncomingNurses.map((n) => ({ ...n, layoutName })));
    this.data.patient_care_techs = this.data.patient_care_techs.filter((t) => t.layoutName !== layoutName);
    this.data.patient_care_techs.push(...snapshot.techs.map((t) => ({ ...t, layoutName })));
    this.saveToLocalStorage();
  }

  // Global Theme Management
  getGlobalTheme(): AppTheme {
    return normalizeAppTheme(this.data.global_theme);
  }

  setGlobalTheme(theme: string): void {
    const next = normalizeAppTheme(theme);
    this.data.global_theme = next;
    this.saveToLocalStorage();
    this.applyTheme(next);
  }

  private applyTheme(theme: string): void {
    applyAppTheme(normalizeAppTheme(theme));
  }

  // Undo/Redo History Management
  addToHistory(action: any): void {
    // Clear any actions after current index
    this.data.action_history = this.data.action_history.slice(0, this.data.history_index + 1);
    
    // Add new action
    this.data.action_history.push({
      ...action,
      timestamp: Date.now()
    });
    
    // Update index
    this.data.history_index++;
    
    // Limit history size
    if (this.data.action_history.length > 50) {
      this.data.action_history.shift();
      this.data.history_index--;
    }
    
    this.saveToLocalStorage();
  }

  undo(): any | null {
    if (this.data.history_index <= 0) return null;
    
    this.data.history_index--;
    const action = this.data.action_history[this.data.history_index];
    this.saveToLocalStorage();
    return action;
  }

  redo(): any | null {
    if (this.data.history_index >= this.data.action_history.length - 1) return null;
    
    this.data.history_index++;
    const action = this.data.action_history[this.data.history_index];
    this.saveToLocalStorage();
    return action;
  }

  canUndo(): boolean {
    return this.data.history_index > 0;
  }

  canRedo(): boolean {
    return this.data.history_index < this.data.action_history.length - 1;
  }

  // Auto-save method
  autoSave(): void {
    this.saveToLocalStorage();
  }

  // User Preferences
  getUserPreference(key: string): string | undefined {
    return this.data.user_preferences[key];
  }

  setUserPreference(key: string, value: string): void {
    this.data.user_preferences[key] = value;
    this.saveToLocalStorage();
  }

  getUserPreferences(): UserPreferences {
    return {
      lastSelectedLayout: this.data.user_preferences.lastSelectedLayout ?? 'North-South View',
      isLayoutLocked: this.data.user_preferences.isLayoutLocked === 'true',
    };
  }

  // Layouts
  getAvailableLayouts(): LayoutName[] {
    return this.data.layouts.map(l => l.name as LayoutName);
  }

  createLayout(layoutName: LayoutName): void {
    if (!this.data.layouts.find(l => l.name === layoutName)) {
      this.data.layouts.push({
        name: layoutName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      this.saveToLocalStorage();
    }
  }

  deleteLayout(layoutName: LayoutName): void {
    this.data.layouts = this.data.layouts.filter(l => l.name !== layoutName);
    this.data.patients = this.data.patients.filter(p => p.layoutName !== layoutName);
    this.data.nurses = this.data.nurses.filter(n => n.layoutName !== layoutName);
    this.data.nurses_oncoming = this.data.nurses_oncoming.filter(n => n.layoutName !== layoutName);
    this.data.patient_care_techs = this.data.patient_care_techs.filter(t => t.layoutName !== layoutName);
    this.data.assignment_sets = this.data.assignment_sets.filter(a => a.layoutName !== layoutName);
    this.saveToLocalStorage();
  }

  getAllLayouts(): LayoutName[] {
    return this.getAvailableLayouts();
  }

  getLayout(layoutName: LayoutName): (({ name: string; created_at: string; updated_at: string } & Partial<UnitLayoutMetadata> & {
    assignmentPrintLayout?: AssignmentPrintLayoutConfig;
  }) | undefined) {
    return this.data.layouts.find(l => l.name === layoutName);
  }

  setLayoutMetadata(layoutName: LayoutName, metadata: UnitLayoutMetadata): void {
    const layout = this.data.layouts.find(l => l.name === layoutName);
    if (!layout) return;
    Object.assign(layout, metadata);
    layout.updated_at = new Date().toISOString();
    this.saveToLocalStorage();
  }

  setLayoutAssignmentPrintLayout(layoutName: LayoutName, config: AssignmentPrintLayoutConfig): void {
    const layout = this.data.layouts.find(l => l.name === layoutName);
    if (!layout) return;
    layout.assignmentPrintLayout = config;
    layout.updated_at = new Date().toISOString();
    this.saveToLocalStorage();
  }

  // Patients
  getPatients(layoutName: LayoutName): Patient[] {
    return this.data.patients
      .filter(p => p.layoutName === layoutName)
      .map(({ layoutName: _layoutName, ...patient }) => patient);
  }

  savePatients(layoutName: LayoutName, patients: Patient[]): void {
    // Remove existing patients for this layout
    this.data.patients = this.data.patients.filter(p => p.layoutName !== layoutName);
    // Add new patients
    this.data.patients.push(...patients.map(p => ({ ...p, layoutName })));
    this.saveToLocalStorage();
  }

  // Nurses
  getNurses(layoutName: LayoutName): Nurse[] {
    return this.data.nurses
      .filter(n => n.layoutName === layoutName)
      .map(({ layoutName: _layoutName, ...nurse }) => nurse);
  }

  saveNurses(layoutName: LayoutName, nurses: Nurse[]): void {
    // Remove existing nurses for this layout
    this.data.nurses = this.data.nurses.filter(n => n.layoutName !== layoutName);
    // Add new nurses
    this.data.nurses.push(...nurses.map(n => ({ ...n, layoutName })));
    this.saveToLocalStorage();
  }

  getOncomingNurses(layoutName: LayoutName): Nurse[] {
    return this.data.nurses_oncoming
      .filter(n => n.layoutName === layoutName)
      .map(({ layoutName: _layoutName, ...nurse }) => nurse);
  }

  saveOncomingNurses(layoutName: LayoutName, nurses: Nurse[]): void {
    this.data.nurses_oncoming = this.data.nurses_oncoming.filter(n => n.layoutName !== layoutName);
    this.data.nurses_oncoming.push(...nurses.map(n => ({ ...n, layoutName })));
    this.saveToLocalStorage();
  }

  /** Promote oncoming draft to active shift nurses and clear the draft for this layout. */
  activateOncomingShift(layoutName: LayoutName): void {
    const incoming = this.data.nurses_oncoming.filter(n => n.layoutName === layoutName);
    const asCurrent: Nurse[] = incoming.map(({ layoutName: _l, ...rest }) => rest);
    this.saveNurses(layoutName, asCurrent);
    this.data.nurses_oncoming = this.data.nurses_oncoming.filter(n => n.layoutName !== layoutName);
    this.saveToLocalStorage();
  }

  // Techs
  getTechs(layoutName: LayoutName): PatientCareTech[] {
    return this.data.patient_care_techs
      .filter(t => t.layoutName === layoutName)
      .map(({ layoutName: _layoutName, ...tech }) => tech);
  }

  saveTechs(layoutName: LayoutName, techs: PatientCareTech[]): void {
    // Remove existing techs for this layout
    this.data.patient_care_techs = this.data.patient_care_techs.filter(t => t.layoutName !== layoutName);
    // Add new techs
    this.data.patient_care_techs.push(...techs.map(t => ({ ...t, layoutName })));
    this.saveToLocalStorage();
  }

  // Spectra Pool
  getSpectraPool(): Spectra[] {
    return this.data.spectra_pool;
  }

  saveSpectraPool(pool: Spectra[]): void {
    this.data.spectra_pool = pool.map((device) => ({
      ...device,
      status: device.status ?? (device.inService ? 'in service' : 'out of service'),
      logs: Array.isArray(device.logs) ? device.logs : [],
    }));
    this.saveToLocalStorage();
  }

  updateSpectra(spectraId: string, inService: boolean): void {
    const spectra = this.data.spectra_pool.find(s => s.id === spectraId);
    if (spectra) {
      spectra.inService = inService;
      this.saveToLocalStorage();
    }
  }

  addSpectra(spectraId: string): void {
    if (!this.data.spectra_pool.find(s => s.id === spectraId)) {
      this.data.spectra_pool.push({ id: spectraId, inService: true });
      this.saveToLocalStorage();
    }
  }

  removeSpectra(spectraId: string): void {
    this.data.spectra_pool = this.data.spectra_pool.filter(s => s.id !== spectraId);
    this.saveToLocalStorage();
  }

  // Assignment Sets
  getAssignmentSets(layoutName: LayoutName): AssignmentSet[] {
    return this.data.assignment_sets.filter(a => a.layoutName === layoutName);
  }

  saveAssignmentSet(assignmentSet: AssignmentSet): void {
    // Remove existing assignment set with same ID
    this.data.assignment_sets = this.data.assignment_sets.filter(a => a.id !== assignmentSet.id);
    // Add new assignment set
    this.data.assignment_sets.push(assignmentSet);
    this.saveToLocalStorage();
  }

  deleteAssignmentSet(id: string): void {
    this.data.assignment_sets = this.data.assignment_sets.filter(a => a.id !== id);
    this.saveToLocalStorage();
  }

  // Authentication - Users
  getUsers(): User[] {
    return this.data.users || [];
  }

  getUser(id: string): User | undefined {
    return (this.data.users || []).find(u => u.id === id);
  }

  getUserByEmployeeNumber(employeeNumber: string): User | undefined {
    return (this.data.users || []).find(u => u.employeeNumber === employeeNumber);
  }

  saveUser(user: User): void {
    if (!this.data.users) this.data.users = [];
    // Remove existing user with same ID
    this.data.users = this.data.users.filter(u => u.id !== user.id);
    // Add new user
    this.data.users.push(user);
    this.saveToLocalStorage();
  }

  deleteUser(id: string): void {
    if (this.data.users) {
      this.data.users = this.data.users.filter(u => u.id !== id);
      this.saveToLocalStorage();
    }
  }

  // Authentication - Passwords
  getPassword(employeeNumber: string): string | undefined {
    return (this.data.passwords || {})[employeeNumber];
  }

  savePassword(employeeNumber: string, password: string): void {
    if (!this.data.passwords) this.data.passwords = {};
    this.data.passwords[employeeNumber] = password;
    this.saveToLocalStorage();
  }

  deletePassword(employeeNumber: string): void {
    if (this.data.passwords) {
      delete this.data.passwords[employeeNumber];
      this.saveToLocalStorage();
    }
  }

  // Unit Settings
  getUnitSettings(): UnitSettings[] {
    return this.data.unit_settings || [];
  }

  getUnitSetting(id: string): UnitSettings | undefined {
    return (this.data.unit_settings || []).find(s => s.id === id);
  }

  saveUnitSettings(settings: UnitSettings): void {
    if (!this.data.unit_settings) this.data.unit_settings = [];
    // Remove existing settings with same ID
    this.data.unit_settings = this.data.unit_settings.filter(s => s.id !== settings.id);
    // Add new settings
    this.data.unit_settings.push(settings);
    this.saveToLocalStorage();
  }

  deleteUnitSettings(id: string): void {
    if (this.data.unit_settings) {
      this.data.unit_settings = this.data.unit_settings.filter(s => s.id !== id);
      this.saveToLocalStorage();
    }
  }

  getFacilityProfile(): FacilityProfile {
    return this.data.facility_profile ?? { ...defaultFacilityProfile };
  }

  saveFacilityProfile(profile: FacilityProfile): void {
    this.data.facility_profile = profile;
    this.saveToLocalStorage();
  }

  // Export/Import
  exportData(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  importData(importedData: DatabaseSchema): void {
    this.data = importedData;
    this.saveToLocalStorage();
  }
}

// Database singleton
let db: SimpleDatabase | null = null;

export const initializeDatabase = async (): Promise<SimpleDatabase> => {
  if (db?.isStoreAvailable()) {
    return db;
  }
  if (db && !db.isStoreAvailable()) {
    throw new StoreUnavailableError();
  }

  db = new SimpleDatabase();
  try {
    await db.initialize();
  } catch (error) {
    if (!(error instanceof StoreUnavailableError)) {
      db = null;
    }
    throw error;
  }
  return db;
};

export const getDb = async (): Promise<SimpleDatabase> => {
  return await initializeDatabase();
};

export function isStoreAvailable(): boolean {
  return db?.isStoreAvailable() === true;
}