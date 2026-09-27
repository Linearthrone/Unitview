import { app, BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import {
  clampWallpaperIntervalMs,
  getWindowsWallpaperPath,
  setWindowsWallpaper,
} from './set-windows-wallpaper';
import type { WallpaperMapSnapshot, WallpaperStartOptions, WallpaperStatus } from './types';

const CAPTURE_SETTLE_MS = 400;

export class LiveMapWallpaperService {
  private wallpaperWindow: BrowserWindow | null = null;
  private captureTimer: NodeJS.Timeout | null = null;
  private active = false;
  private intervalMs = 10_000;
  private redactPhi = true;
  private lastCaptureAt: number | null = null;
  private lastError: string | null = null;
  private imagePath: string | null = null;
  private previousWallpaper: string | null = null;
  private latestSnapshot: WallpaperMapSnapshot | null = null;
  private capturing = false;
  private isDev: boolean;
  private getMainWindow: () => BrowserWindow | null;

  constructor(options: {
    isDev: boolean;
    getMainWindow: () => BrowserWindow | null;
  }) {
    this.isDev = options.isDev;
    this.getMainWindow = options.getMainWindow;
  }

  getStatus(): WallpaperStatus {
    return {
      active: this.active,
      platformSupported: process.platform === 'win32',
      intervalMs: this.intervalMs,
      redactPhi: this.redactPhi,
      lastCaptureAt: this.lastCaptureAt,
      lastError: this.lastError,
      imagePath: this.imagePath,
    };
  }

  async start(options: WallpaperStartOptions = {}): Promise<WallpaperStatus> {
    this.intervalMs = clampWallpaperIntervalMs(options.intervalMs);
    this.redactPhi = options.redactPhi !== false;
    this.lastError = null;

    if (!this.previousWallpaper) {
      this.previousWallpaper = await getWindowsWallpaperPath();
    }

    await this.ensureWallpaperWindow();
    this.active = true;
    this.scheduleCaptureLoop();
    // First capture shortly after window load
    setTimeout(() => {
      void this.captureAndApply();
    }, 1200);

    return this.getStatus();
  }

  async stop(restorePrevious = true): Promise<WallpaperStatus> {
    this.active = false;
    this.clearCaptureLoop();
    this.destroyWallpaperWindow();

    if (restorePrevious && this.previousWallpaper && process.platform === 'win32') {
      try {
        await setWindowsWallpaper(this.previousWallpaper);
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'Failed to restore wallpaper';
      }
    }

    this.previousWallpaper = null;
    this.latestSnapshot = null;
    return this.getStatus();
  }

  /** Push a live board snapshot from the main unit view into the wallpaper window. */
  pushSnapshot(snapshot: WallpaperMapSnapshot): void {
    const next: WallpaperMapSnapshot = {
      ...snapshot,
      redactPhi: this.redactPhi || snapshot.redactPhi,
      updatedAt: typeof snapshot.updatedAt === 'number' ? snapshot.updatedAt : Date.now(),
    };
    this.latestSnapshot = next;
    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      this.wallpaperWindow.webContents.send('wallpaper-snapshot', next);
    }
  }

  dispose(): void {
    this.clearCaptureLoop();
    this.destroyWallpaperWindow();
    this.active = false;
  }

  private scheduleCaptureLoop(): void {
    this.clearCaptureLoop();
    this.captureTimer = setInterval(() => {
      void this.captureAndApply();
    }, this.intervalMs);
  }

  private clearCaptureLoop(): void {
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
  }

  private wallpaperUrl(): string {
    if (this.isDev) {
      return 'http://localhost:5173/?mode=wallpaper';
    }
    const indexHtml = path.join(app.getAppPath(), 'renderer', 'dist', 'index.html');
    const fileUrl = pathToFileURL(indexHtml);
    fileUrl.searchParams.set('mode', 'wallpaper');
    return fileUrl.href;
  }

  private async ensureWallpaperWindow(): Promise<void> {
    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      return;
    }

    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;

    this.wallpaperWindow = new BrowserWindow({
      width,
      height,
      show: false,
      frame: false,
      transparent: false,
      skipTaskbar: true,
      focusable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js'),
        backgroundThrottling: false,
      },
    });

    this.wallpaperWindow.setMenuBarVisibility(false);

    await this.wallpaperWindow.loadURL(this.wallpaperUrl());

    if (this.latestSnapshot) {
      this.wallpaperWindow.webContents.once('did-finish-load', () => {
        if (this.latestSnapshot && this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
          this.wallpaperWindow.webContents.send('wallpaper-snapshot', this.latestSnapshot);
        }
      });
      this.wallpaperWindow.webContents.send('wallpaper-snapshot', this.latestSnapshot);
    }
  }

  private destroyWallpaperWindow(): void {
    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      this.wallpaperWindow.destroy();
    }
    this.wallpaperWindow = null;
  }

  private wallpaperImagePath(): string {
    const dir = path.join(app.getPath('userData'), 'wallpaper');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, 'unit-map-live.png');
  }

  private async captureAndApply(): Promise<void> {
    if (!this.active || this.capturing) {
      return;
    }
    if (!this.wallpaperWindow || this.wallpaperWindow.isDestroyed()) {
      try {
        await this.ensureWallpaperWindow();
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'Wallpaper window failed';
        return;
      }
    }

    this.capturing = true;
    try {
      if (this.latestSnapshot && this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
        this.wallpaperWindow.webContents.send('wallpaper-snapshot', this.latestSnapshot);
      }

      await delay(CAPTURE_SETTLE_MS);

      const win = this.wallpaperWindow;
      if (!win || win.isDestroyed()) {
        return;
      }

      const image = await win.webContents.capturePage();
      const png = image.toPNG();
      const outPath = this.wallpaperImagePath();
      fs.writeFileSync(outPath, png);
      this.imagePath = outPath;

      const result = await setWindowsWallpaper(outPath);
      this.lastCaptureAt = Date.now();
      this.lastError = result.applied
        ? null
        : process.platform === 'win32'
          ? 'Wallpaper apply returned false'
          : 'Capture OK (desktop wallpaper apply requires Windows)';
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Capture failed';
      // Keep loop alive; main window may still recover
      void this.getMainWindow();
    } finally {
      this.capturing = false;
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
