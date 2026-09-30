import { app, BrowserWindow, Menu, shell, ipcMain, dialog, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { registerIpcHandlers } from './ipc/register-handlers';
import { AppUpdater } from './updates/app-updater';
import { LiveMapWallpaperService } from './wallpaper/live-map-wallpaper';
import type { WallpaperMapSnapshot, WallpaperStartOptions } from './wallpaper/types';
import { createAuditRecord } from './security/audit';
import { appendAuditLine } from './ipc/secure-vault';

class UnitViewApp {
  private mainWindow: BrowserWindow | null = null;
  /** Unpackaged `electron dist/main.js` is dev even when NODE_ENV is unset. */
  private isDev = !app.isPackaged;
  private wallpaperService: LiveMapWallpaperService | null = null;
  private updater: AppUpdater | null = null;

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // Set application user model id for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.unitview.windows');
    }

    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      if (!this.isDev) {
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
          callback({
            responseHeaders: {
              ...details.responseHeaders,
              'Content-Security-Policy': [
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://fhir.epic.com https://*.epic.com; font-src 'self' data:",
              ],
            },
          });
        });
      }
      this.createMainWindow();
      this.updater = new AppUpdater(() => this.mainWindow);
      this.setupMenu();
      this.setupIpcHandlers();
      this.updater.registerIpc();
    });

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      void this.wallpaperService?.stop(true);
      this.wallpaperService?.dispose();
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private getWallpaperService(): LiveMapWallpaperService {
    if (!this.wallpaperService) {
      this.wallpaperService = new LiveMapWallpaperService({
        isDev: this.isDev,
        getMainWindow: () => this.mainWindow,
      });
    }
    return this.wallpaperService;
  }

  private writeWallpaperAudit(
    action: 'DESKTOP_WALLPAPER_START' | 'DESKTOP_WALLPAPER_STOP',
    success: boolean,
    detail?: string,
    actorEmployeeNumber?: string
  ): void {
    try {
      const record = createAuditRecord({
        action,
        success,
        actorEmployeeNumber,
        resourceType: 'DesktopWallpaper',
        detail,
      });
      appendAuditLine(JSON.stringify(record));
    } catch {
      // Audit must not block wallpaper control
    }
  }

  private createMainWindow(): void {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });

    // Load the app
    const startUrl = this.isDev 
      ? 'http://localhost:5173' 
      : `file://${path.join(__dirname, '../renderer/dist/index.html')}`;
    
    this.mainWindow.loadURL(startUrl);

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      if (this.isDev) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Unit Layout',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-layout');
            },
          },
          {
            label: 'Open Layout',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-layout');
            },
          },
          {
            label: 'Save Layout',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow?.webContents.send('menu-save-layout');
            },
          },
          { type: 'separator' },
          {
            label: 'Import Data',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow!, {
                properties: ['openFile'],
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
              });
              if (!result.canceled && result.filePaths.length > 0) {
                this.mainWindow?.webContents.send('menu-import-data', result.filePaths[0]);
              }
            },
          },
          {
            label: 'Export Data',
            click: async () => {
              const result = await dialog.showSaveDialog(this.mainWindow!, {
                defaultPath: `unitview-backup-${new Date().toISOString().split('T')[0]}.json`,
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
              });
              if (!result.canceled && result.filePath) {
                this.mainWindow?.webContents.send('menu-export-data', result.filePath);
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Print Charge Report',
            accelerator: 'CmdOrCtrl+P',
            click: () => {
              this.mainWindow?.webContents.send('menu-print-report');
            },
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
          { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
          ...(this.isDev
            ? [{ label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' as const }]
            : []),
          { type: 'separator' },
          { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
          { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
          { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
          { type: 'separator' },
          { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' },
          { type: 'separator' },
          {
            label: 'Pin Unit Map to Desktop Background',
            click: () => {
              this.mainWindow?.webContents.send('menu-wallpaper-toggle');
            },
          },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
          { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Check for Updates…',
            click: () => {
              void this.updater?.checkFromMenu();
            },
          },
          {
            label: 'About Unitview',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'About Unitview',
                message: 'Unitview Patient Management Dashboard',
                detail: `Version ${app.getVersion()}\n\nA patient-management dashboard for hospital charge nurses.\n\nBuilt with Electron and React. Unit data is stored in an AES-256-GCM encrypted vault (phi.vault.json) in the workstation user-data folder. Epic FHIR remains sandbox fixtures unless configured.`,
                buttons: ['OK'],
              });
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Handle data export
    ipcMain.handle('export-data', async (event, data) => {
      try {
        const filePath = await dialog.showSaveDialog(this.mainWindow!, {
          defaultPath: `unitview-backup-${new Date().toISOString().split('T')[0]}.json`,
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });

        if (!filePath.canceled && filePath.filePath) {
          fs.writeFileSync(filePath.filePath, JSON.stringify(data, null, 2));
          return { success: true, path: filePath.filePath };
        }
        return { success: false, error: 'Export cancelled' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Handle data import
    ipcMain.handle('import-data', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          properties: ['openFile'],
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const data = fs.readFileSync(result.filePaths[0], 'utf8');
          return { success: true, data: JSON.parse(data) };
        }
        return { success: false, error: 'Import cancelled' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Handle print to PDF
    ipcMain.handle('print-to-pdf', async (event, htmlContent) => {
      try {
        const result = await dialog.showSaveDialog(this.mainWindow!, {
          defaultPath: `unitview-report-${new Date().toISOString().split('T')[0]}.pdf`,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        });

        if (!result.canceled && result.filePath) {
          // Create a temporary window for printing
          const printWindow = new BrowserWindow({ show: false });
          await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
          
          const pdfData = await printWindow.webContents.printToPDF({
            printBackground: true,
            margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
            pageSize: 'Letter',
          });

          fs.writeFileSync(result.filePath, pdfData);
          printWindow.close();
          
          return { success: true, path: result.filePath };
        }
        return { success: false, error: 'Print cancelled' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Get app version
    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    // Get user data path
    ipcMain.handle('get-user-data-path', () => {
      return app.getPath('userData');
    });

    ipcMain.handle('wallpaper-start', async (_event, options?: WallpaperStartOptions) => {
      try {
        const status = await this.getWallpaperService().start(options ?? {});
        this.writeWallpaperAudit(
          'DESKTOP_WALLPAPER_START',
          true,
          `intervalMs=${status.intervalMs};redactPhi=${status.redactPhi};unit=${options?.unitName ?? 'unknown'}`,
          options?.actorEmployeeNumber
        );
        return { success: true, status };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Wallpaper start failed';
        this.writeWallpaperAudit(
          'DESKTOP_WALLPAPER_START',
          false,
          message,
          options?.actorEmployeeNumber
        );
        return { success: false, error: message, status: this.getWallpaperService().getStatus() };
      }
    });

    ipcMain.handle(
      'wallpaper-stop',
      async (_event, payload?: { actorEmployeeNumber?: string; restorePrevious?: boolean }) => {
        try {
          const status = await this.getWallpaperService().stop(payload?.restorePrevious !== false);
          this.writeWallpaperAudit(
            'DESKTOP_WALLPAPER_STOP',
            true,
            'stopped',
            payload?.actorEmployeeNumber
          );
          return { success: true, status };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Wallpaper stop failed';
          this.writeWallpaperAudit(
            'DESKTOP_WALLPAPER_STOP',
            false,
            message,
            payload?.actorEmployeeNumber
          );
          return { success: false, error: message, status: this.getWallpaperService().getStatus() };
        }
      }
    );

    ipcMain.handle('wallpaper-status', async () => {
      return this.getWallpaperService().getStatus();
    });

    ipcMain.handle('wallpaper-push-snapshot', async (_event, snapshot: WallpaperMapSnapshot) => {
      if (!snapshot || typeof snapshot !== 'object') {
        return { success: false, error: 'Invalid snapshot' };
      }
      this.getWallpaperService().pushSnapshot(snapshot);
      return { success: true };
    });

    registerIpcHandlers();
  }
}

// Initialize the application
new UnitViewApp();