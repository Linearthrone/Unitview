const keyFor = (userId: string) => `unitview_last_opened_unit_${userId}`;

export function getLastOpenedUnitName(userId: string): string | null {
  try {
    return localStorage.getItem(keyFor(userId));
  } catch {
    return null;
  }
}

export function setLastOpenedUnitName(userId: string, unitName: string): void {
  try {
    localStorage.setItem(keyFor(userId), unitName);
  } catch {
    // ignore
  }
}

export function clearLastOpenedUnitName(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    // ignore
  }
}
