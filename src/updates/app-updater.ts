import { app, BrowserWindow, dialog, ipcMain, type MessageBoxOptions } from 'electron';
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';
import {
  UPDATE_FEED,
  emptyUpdateStatus,
  type AppUpdatePhase,
  type AppUpdateStatus,
} from './update-status';

export class AppUpdater {
  private status: AppUpdateStatus;

  constructor(private readonly getWindow: () => BrowserWindow | null) {
    this.status = emptyUpdateStatus(app.getVersion(), app.isPackaged);
    if (app.isPackaged) {
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.setFeedURL(UPDATE_FEED);
      autoUpdater.on('checking-for-update', () => {
        this.patch({
          phase: 'checking',
          message: 'Checking GitHub for a newer pack…',
        });
      });
      autoUpdater.on('update-available', (info: UpdateInfo) => {
        this.patch({
          phase: 'available',
          availableVersion: info.version,
          percent: null,
          message: `Pack ${info.version} is ready to download.`,
        });
      });
      autoUpdater.on('update-not-available', () => {
        this.patch({
          phase: 'current',
          availableVersion: null,
          percent: null,
          message: `This workstation is already on ${app.getVersion()}.`,
        });
      });
      autoUpdater.on('download-progress', (progress: ProgressInfo) => {
        const percent = Number.isFinite(progress.percent) ? Math.round(progress.percent) : 0;
        this.patch({
          phase: 'downloading',
          percent,
          message: `Downloading update… ${percent}%`,
        });
      });
      autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
        this.patch({
          phase: 'ready',
          availableVersion: info.version,
          percent: 100,
          message: `Pack ${info.version} is downloaded. Install and restart to finish.`,
        });
      });
      autoUpdater.on('error', (error: Error) => {
        this.patch({
          phase: 'error',
          percent: null,
          message: error.message || 'Update check failed.',
        });
      });
    }
  }

  registerIpc(): void {
    ipcMain.handle('updates-get-status', () => this.status);
    ipcMain.handle('updates-check', async () => {
      await this.check();
      return this.status;
    });
    ipcMain.handle('updates-download', async () => {
      await this.download();
      return this.status;
    });
    ipcMain.handle('updates-install', () => {
      this.install();
      return this.status;
    });
  }

  async checkFromMenu(): Promise<void> {
    const prompt = (options: MessageBoxOptions) => {
      const parent = this.getWindow();
      return parent ? dialog.showMessageBox(parent, options) : dialog.showMessageBox(options);
    };
    if (!app.isPackaged) {
      await prompt({
        type: 'info',
        title: 'Unitview updates',
        message: 'Updates only apply to the installed Windows app.',
        detail: `This session is ${app.getVersion()} (unpackaged). Install a packaged Windows build once, then use Check for updates.`,
        buttons: ['OK'],
      });
      return;
    }
    await this.check();
    if (this.status.phase === 'available' && this.status.availableVersion) {
      const choice = await prompt({
        type: 'info',
        title: 'Unitview updates',
        message: `Pack ${this.status.availableVersion} is available.`,
        detail: `This workstation is ${this.status.currentVersion}. Download and install without uninstalling first. Unit data in the vault stays put.`,
        buttons: ['Download and install', 'Later'],
        defaultId: 0,
        cancelId: 1,
      });
      if (choice.response !== 0) return;
      await this.download();
      const afterDownload = String(this.status.phase) as AppUpdatePhase;
      if (afterDownload === 'ready') {
        this.install();
      } else if (afterDownload === 'error') {
        await prompt({
          type: 'error',
          title: 'Unitview updates',
          message: 'Download failed.',
          detail: this.status.message,
          buttons: ['OK'],
        });
      }
      return;
    }
    if (this.status.phase === 'current') {
      await prompt({
        type: 'info',
        title: 'Unitview updates',
        message: 'This workstation is on the latest pack.',
        detail: this.status.message,
        buttons: ['OK'],
      });
      return;
    }
    if (this.status.phase === 'error') {
      await prompt({
        type: 'error',
        title: 'Unitview updates',
        message: 'Could not check for updates.',
        detail: this.status.message,
        buttons: ['OK'],
      });
    }
  }

  private emit(): void {
    this.getWindow()?.webContents.send('updates-status', this.status);
  }

  private patch(next: Partial<AppUpdateStatus>): void {
    this.status = {
      ...this.status,
      currentVersion: app.getVersion(),
      packaged: app.isPackaged,
      ...next,
    };
    this.emit();
  }

  private async check(): Promise<void> {
    if (!app.isPackaged) {
      this.patch({
        phase: 'unavailable',
        message: 'Updates only apply to the installed Windows app.',
      });
      return;
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.patch({
        phase: 'error',
        message: error instanceof Error ? error.message : 'Update check failed.',
      });
    }
  }

  private async download(): Promise<void> {
    if (!app.isPackaged) {
      this.patch({
        phase: 'unavailable',
        message: 'Updates only apply to the installed Windows app.',
      });
      return;
    }
    if (this.status.phase !== 'available' && this.status.phase !== 'error') {
      return;
    }
    try {
      this.patch({
        phase: 'downloading',
        percent: 0,
        message: 'Downloading update… 0%',
      });
      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.patch({
        phase: 'error',
        percent: null,
        message: error instanceof Error ? error.message : 'Download failed.',
      });
    }
  }

  private install(): void {
    if (!app.isPackaged || this.status.phase !== 'ready') {
      return;
    }
    autoUpdater.quitAndInstall(false, true);
  }
}
