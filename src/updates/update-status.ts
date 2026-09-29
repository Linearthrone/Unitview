export const UPDATE_FEED = {
  provider: 'github' as const,
  owner: 'Linearthrone',
  repo: 'Unitview_5.1.5c',
};

export type AppUpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'current'
  | 'unavailable'
  | 'error';

export interface AppUpdateStatus {
  phase: AppUpdatePhase;
  packaged: boolean;
  currentVersion: string;
  availableVersion: string | null;
  percent: number | null;
  message: string;
}

export function emptyUpdateStatus(currentVersion: string, packaged: boolean): AppUpdateStatus {
  return {
    phase: packaged ? 'idle' : 'unavailable',
    packaged,
    currentVersion,
    availableVersion: null,
    percent: null,
    message: packaged
      ? 'Check after a new pack is published from master.'
      : 'Updates only apply to the installed Windows app.',
  };
}

export function stampedPackVersion(baseVersion: string, patch: number): string {
  const release = (baseVersion.split('-')[0] ?? '5.4.0').trim();
  const bits = release.split('.');
  const major = Number.parseInt(bits[0] ?? '5', 10);
  const minor = Number.parseInt(bits[1] ?? '4', 10);
  if (!Number.isFinite(major) || !Number.isFinite(minor) || !Number.isFinite(patch) || patch < 0) {
    throw new Error('Invalid pack version inputs');
  }
  return `${major}.${minor}.${Math.floor(patch)}`;
}

export function updateActionLabel(phase: AppUpdatePhase): string {
  switch (phase) {
    case 'idle':
    case 'current':
    case 'error':
      return 'Check for updates';
    case 'checking':
      return 'Checking…';
    case 'available':
      return 'Download update';
    case 'downloading':
      return 'Downloading…';
    case 'ready':
      return 'Install and restart';
    case 'unavailable':
      return 'Updates unavailable';
    default: {
      const _never: never = phase;
      return _never;
    }
  }
}

export function isUpdateBusy(phase: AppUpdatePhase): boolean {
  switch (phase) {
    case 'checking':
    case 'downloading':
      return true;
    case 'idle':
    case 'available':
    case 'ready':
    case 'current':
    case 'unavailable':
    case 'error':
      return false;
    default: {
      const _never: never = phase;
      return _never;
    }
  }
}
