/** Fallback when not running inside Electron (e.g. Vite dev server). Keep aligned with renderer/package.json. */
export const APP_VERSION_FALLBACK = '5.3.0';

/** Read the packaged app version from Electron, or fall back for browser dev. */
export async function getAppVersion(): Promise<string> {
  try {
    const version = await window.electronAPI?.getAppVersion?.();
    if (typeof version === 'string' && version.trim()) {
      return version.trim();
    }
  } catch {
    // Electron IPC unavailable outside desktop shell
  }
  return APP_VERSION_FALLBACK;
}
