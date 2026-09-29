const STORAGE_KEY_PREFIX = 'unitview_favorite_units_';

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function getFavoriteUnitNames(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteUnit(userId: string, unitName: string): string[] {
  const current = getFavoriteUnitNames(userId);
  const next = current.includes(unitName)
    ? current.filter((n) => n !== unitName)
    : [...current, unitName];
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
  return next;
}

export function removeFavoriteUnit(userId: string, unitName: string): string[] {
  const next = getFavoriteUnitNames(userId).filter((name) => name !== unitName);
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
  return next;
}

export function sortUnitsWithFavoritesAndLast(
  units: { name: string }[],
  favoriteNames: string[],
  lastOpenedName: string | null
): { name: string }[] {
  const copy = [...units];
  copy.sort((a, b) => {
    const aFav = favoriteNames.includes(a.name);
    const bFav = favoriteNames.includes(b.name);
    if (aFav && !bFav) return -1;
    if (bFav && !aFav) return 1;
    if (lastOpenedName) {
      if (a.name === lastOpenedName && b.name !== lastOpenedName) return -1;
      if (b.name === lastOpenedName && a.name !== lastOpenedName) return 1;
    }
    return a.name.localeCompare(b.name);
  });
  return copy;
}
