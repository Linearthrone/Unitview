export type AppTheme = 'light' | 'dark';

const LEGACY_THEME_CLASSES = [
  'theme-light',
  'theme-dark',
  'theme-blue',
  'theme-green',
  'theme-purple',
] as const;

/** Stored blue/green/purple collapse to light. Only `dark` is clinical-dark. */
export function normalizeAppTheme(value: string | null | undefined): AppTheme {
  return value === 'dark' ? 'dark' : 'light';
}

export function applyAppTheme(theme: AppTheme): void {
  const root = document.documentElement;
  root.classList.remove(...LEGACY_THEME_CLASSES);
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('unitview_theme', theme);
}
