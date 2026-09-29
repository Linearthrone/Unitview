export {};

type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'SESSION_TIMEOUT'
  | 'PASSWORD_CHANGE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DEACTIVATE'
  | 'USER_ACTIVATE'
  | 'PHI_VIEW'
  | 'PHI_EXPORT'
  | 'PATIENT_ADMIT'
  | 'PATIENT_DISCHARGE'
  | 'FHIR_CONNECT'
  | 'FHIR_CONNECT_FAILURE'
  | 'FHIR_SYNC'
  | 'FHIR_SYNC_FAILURE'
  | 'CONFIG_CHANGE'
  | 'DESKTOP_WALLPAPER_START'
  | 'DESKTOP_WALLPAPER_STOP';

interface AuditEventInput {
  action: AuditAction;
  actorEmployeeNumber?: string;
  resourceType?: string;
  resourceId?: string;
  success: boolean;
  detail?: string;
}

interface EpicConnectionPublic {
  fhirBaseUrl: string;
  tokenUrl: string;
  clientId: string;
  keyId?: string;
  scopes: string;
  locationId?: string;
  locationName?: string;
  mrnSystem: string;
  authMode: 'backend_services' | 'sandbox_fixtures';
  configured: boolean;
}

interface CensusRecord {
  fhirPatientId: string;
  fhirEncounterId?: string;
  mrn?: string;
  name: string;
  age: number;
  gender?: 'Male' | 'Female';
  admitDate: string;
  dischargeDate?: string;
  chiefComplaint: string;
  roomHint: string;
  diet: string;
  mobility: 'Bed Rest' | 'Assisted' | 'Independent';
  codeStatus: 'Full Code' | 'DNR' | 'DNI' | 'DNR/DNI';
  orientationStatus: 'x1' | 'x2' | 'x3' | 'x4' | 'N/A';
  ldas: string[];
  isFallRisk: boolean;
  isSeizureRisk: boolean;
  isAspirationRisk: boolean;
  isIsolation: boolean;
  isInRestraints: boolean;
  isComfortCareDNR: boolean;
  notes?: string;
}

interface WallpaperPatientCell {
  id: string;
  roomDesignation: string;
  displayName: string;
  isVacant: boolean;
  isBlocked: boolean;
  gridRow: number;
  gridColumn: number;
  isFallRisk: boolean;
  isIsolation: boolean;
  isComfortCareDNR: boolean;
  awaitingTransport: boolean;
  mobility?: string;
}

interface WallpaperNurseCell {
  id: string;
  name: string;
  spectra?: string;
  gridRow: number;
  gridColumn: number;
  cardRowSpan: number;
  filledSlots: number;
  totalSlots: number;
}

interface WallpaperTechCell {
  id: string;
  name: string;
  spectra?: string;
  gridRow: number;
  gridColumn: number;
}

interface WallpaperMapSnapshot {
  unitName: string;
  updatedAt: number;
  redactPhi: boolean;
  cols: number;
  rows: number;
  patients: WallpaperPatientCell[];
  nurses: WallpaperNurseCell[];
  techs: WallpaperTechCell[];
}

interface WallpaperStartOptions {
  intervalMs?: number;
  redactPhi?: boolean;
  actorEmployeeNumber?: string;
  unitName?: string;
}

type AppUpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'current'
  | 'unavailable'
  | 'error';

interface AppUpdateStatus {
  phase: AppUpdatePhase;
  packaged: boolean;
  currentVersion: string;
  availableVersion: string | null;
  percent: number | null;
  message: string;
}

interface WallpaperStatus {
  active: boolean;
  platformSupported: boolean;
  intervalMs: number;
  redactPhi: boolean;
  lastCaptureAt: number | null;
  lastError: string | null;
  imagePath: string | null;
}

declare global {
  interface Window {
    electronAPI?: {
      exportData: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>;
      importData: () => Promise<{ success: boolean; data?: unknown; error?: string }>;
      printToPDF: (htmlContent: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      getAppVersion: () => Promise<string>;
      getUpdateStatus: () => Promise<AppUpdateStatus>;
      checkForUpdates: () => Promise<AppUpdateStatus>;
      downloadUpdate: () => Promise<AppUpdateStatus>;
      installUpdate: () => Promise<AppUpdateStatus>;
      onUpdateStatus: (callback: (status: AppUpdateStatus) => void) => () => void;
      getUserDataPath: () => Promise<string>;
      saveSecureStore: (plaintext: string) => Promise<{ success: boolean; error?: string }>;
      loadSecureStore: () => Promise<{
        success: boolean;
        data?: string | null;
        exists?: boolean;
        error?: string;
      }>;
      getHipaaStatus: () => Promise<{
        encryptionAtRest: boolean;
        osKeychain: boolean;
        tlsRequired: boolean;
        sessionTimeoutMinutes: number;
      }>;
      recordAudit: (input: AuditEventInput) => Promise<{ success: boolean; error?: string }>;
      listAudit: (maxLines?: number) => Promise<{ success: boolean; records?: AuditEventInput[]; error?: string }>;
      getEpicConfig: () => Promise<EpicConnectionPublic>;
      saveEpicConfig: (
        config: Partial<EpicConnectionPublic> & { privateKeyPem?: string; actorEmployeeNumber?: string }
      ) => Promise<{ success: boolean; config?: EpicConnectionPublic; error?: string }>;
      testEpicConnection: (actorEmployeeNumber?: string) => Promise<{
        ok: boolean;
        fhirVersion?: string;
        tokenEndpoint?: string;
        error?: string;
      }>;
      fetchEpicCensus: (actorEmployeeNumber?: string) => Promise<{
        success: boolean;
        records?: CensusRecord[];
        source?: 'epic' | 'sandbox_fixtures';
        fetchedAt?: string;
        error?: string;
      }>;
      wallpaperStart: (options?: WallpaperStartOptions) => Promise<{
        success: boolean;
        status?: WallpaperStatus;
        error?: string;
      }>;
      wallpaperStop: (payload?: {
        actorEmployeeNumber?: string;
        restorePrevious?: boolean;
      }) => Promise<{ success: boolean; status?: WallpaperStatus; error?: string }>;
      wallpaperStatus: () => Promise<WallpaperStatus>;
      wallpaperPushSnapshot: (
        snapshot: WallpaperMapSnapshot
      ) => Promise<{ success: boolean; error?: string }>;
      onWallpaperSnapshot: (callback: (snapshot: WallpaperMapSnapshot) => void) => () => void;
      onMenuAction: (callback: (action: string, data?: string) => void) => () => void;
    };
  }
}
