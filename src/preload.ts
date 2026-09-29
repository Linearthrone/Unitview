import { contextBridge, ipcRenderer } from 'electron';
import type { AuditEventInput } from './security/audit';
import type { EpicConnectionPublic, FhirAuthMode } from './fhir/epic-config';
import type { WallpaperMapSnapshot, WallpaperStartOptions, WallpaperStatus } from './wallpaper/types';
import type { AppUpdateStatus } from './updates/update-status';

export interface EpicConfigSaveInput extends Partial<EpicConnectionPublic> {
  privateKeyPem?: string;
  actorEmployeeNumber?: string;
  authMode?: FhirAuthMode;
}

export const electronAPI = {
  exportData: (data: unknown) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  printToPDF: (htmlContent: string) => ipcRenderer.invoke('print-to-pdf', htmlContent),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUpdateStatus: () => ipcRenderer.invoke('updates-get-status') as Promise<AppUpdateStatus>,
  checkForUpdates: () => ipcRenderer.invoke('updates-check') as Promise<AppUpdateStatus>,
  downloadUpdate: () => ipcRenderer.invoke('updates-download') as Promise<AppUpdateStatus>,
  installUpdate: () => ipcRenderer.invoke('updates-install') as Promise<AppUpdateStatus>,
  onUpdateStatus: (callback: (status: AppUpdateStatus) => void) => {
    const listener = (_event: unknown, status: AppUpdateStatus) => {
      callback(status);
    };
    ipcRenderer.on('updates-status', listener);
    return () => {
      ipcRenderer.removeListener('updates-status', listener);
    };
  },
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  saveSecureStore: (plaintext: string) => ipcRenderer.invoke('secure-store-save', plaintext),
  loadSecureStore: () => ipcRenderer.invoke('secure-store-load'),
  getHipaaStatus: () => ipcRenderer.invoke('hipaa-status'),
  recordAudit: (input: AuditEventInput) => ipcRenderer.invoke('audit-record', input),
  listAudit: (maxLines?: number) => ipcRenderer.invoke('audit-list', maxLines),
  getEpicConfig: () => ipcRenderer.invoke('epic-get-config'),
  saveEpicConfig: (config: EpicConfigSaveInput) => ipcRenderer.invoke('epic-save-config', config),
  testEpicConnection: (actorEmployeeNumber?: string) =>
    ipcRenderer.invoke('epic-test-connection', actorEmployeeNumber),
  fetchEpicCensus: (actorEmployeeNumber?: string) =>
    ipcRenderer.invoke('epic-fetch-census', actorEmployeeNumber),
  wallpaperStart: (options?: WallpaperStartOptions) =>
    ipcRenderer.invoke('wallpaper-start', options) as Promise<{
      success: boolean;
      status?: WallpaperStatus;
      error?: string;
    }>,
  wallpaperStop: (payload?: { actorEmployeeNumber?: string; restorePrevious?: boolean }) =>
    ipcRenderer.invoke('wallpaper-stop', payload) as Promise<{
      success: boolean;
      status?: WallpaperStatus;
      error?: string;
    }>,
  wallpaperStatus: () =>
    ipcRenderer.invoke('wallpaper-status') as Promise<WallpaperStatus>,
  wallpaperPushSnapshot: (snapshot: WallpaperMapSnapshot) =>
    ipcRenderer.invoke('wallpaper-push-snapshot', snapshot) as Promise<{
      success: boolean;
      error?: string;
    }>,
  onWallpaperSnapshot: (callback: (snapshot: WallpaperMapSnapshot) => void) => {
    const listener = (_event: unknown, snapshot: WallpaperMapSnapshot) => {
      callback(snapshot);
    };
    ipcRenderer.on('wallpaper-snapshot', listener);
    return () => {
      ipcRenderer.removeListener('wallpaper-snapshot', listener);
    };
  },
  onMenuAction: (callback: (action: string, data?: string) => void) => {
    const onNewLayout = () => callback('new-layout');
    const onOpenLayout = () => callback('open-layout');
    const onSaveLayout = () => callback('save-layout');
    const onImportData = (_event: unknown, filePath?: string) => callback('import-data', filePath);
    const onExportData = (_event: unknown, filePath?: string) => callback('export-data', filePath);
    const onPrintReport = () => callback('print-report');
    const onWallpaperToggle = () => callback('wallpaper-toggle');

    ipcRenderer.on('menu-new-layout', onNewLayout);
    ipcRenderer.on('menu-open-layout', onOpenLayout);
    ipcRenderer.on('menu-save-layout', onSaveLayout);
    ipcRenderer.on('menu-import-data', onImportData);
    ipcRenderer.on('menu-export-data', onExportData);
    ipcRenderer.on('menu-print-report', onPrintReport);
    ipcRenderer.on('menu-wallpaper-toggle', onWallpaperToggle);

    return () => {
      ipcRenderer.removeListener('menu-new-layout', onNewLayout);
      ipcRenderer.removeListener('menu-open-layout', onOpenLayout);
      ipcRenderer.removeListener('menu-save-layout', onSaveLayout);
      ipcRenderer.removeListener('menu-import-data', onImportData);
      ipcRenderer.removeListener('menu-export-data', onExportData);
      ipcRenderer.removeListener('menu-print-report', onPrintReport);
      ipcRenderer.removeListener('menu-wallpaper-toggle', onWallpaperToggle);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
