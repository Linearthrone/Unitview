import type { AppRole } from '../lib/roles';

export interface User {
  id: string;
  employeeNumber: string;
  username: string;
  /** Legacy coarse role — use appRole when set. */
  role: 'user' | 'admin';
  /** Fine-grained application role (TASK-20260422-013). */
  appRole?: AppRole;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  mustChangePassword?: boolean;
}

export interface LoginCredentials {
  employeeNumber: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export type UnitViewMode = 'command' | 'progressive';

export interface UnitSettings {
  id: string;
  name: string;
  theme: 'light' | 'dark' | 'blue' | 'green' | 'purple';
  createdAt: Date;
  lastModified: Date;
  /** Short designation printed on shift sheets, e.g. U1. */
  designation?: string;
  /** Persistent charge phone or Spectra number. */
  chargeContact?: string;
  /** Persistent unit clerk / front desk number. */
  clerkContact?: string;
  /** How the unit board presents rooms. Command surface is the live map. */
  viewMode?: UnitViewMode;
}

export const defaultUsers: User[] = [
  {
    id: 'admin-1',
    employeeNumber: 'admin',
    username: 'Administrator',
    role: 'admin',
    appRole: 'Entity Admin',
    isActive: true,
    createdAt: new Date(),
    mustChangePassword: true,
  },
  {
    id: 'user-1',
    employeeNumber: '1001',
    username: 'John Nurse',
    role: 'user',
    appRole: 'Nurse Manager',
    isActive: true,
    createdAt: new Date(),
    mustChangePassword: true,
  },
  {
    id: 'user-2',
    employeeNumber: '1002',
    username: 'Jane Tech',
    role: 'user',
    appRole: 'Nurse',
    isActive: true,
    createdAt: new Date(),
    mustChangePassword: true,
  },
  {
    id: 'user-3',
    employeeNumber: 'wall',
    username: 'Wall Display',
    role: 'user',
    appRole: 'WALLDISPLAY',
    isActive: true,
    createdAt: new Date(),
    mustChangePassword: true,
  },
];

export const defaultPasswords: Record<string, string> = {
  'admin': 'password',
  '1001': 'nurse123',
  '1002': 'tech123',
  'wall': 'wall123',
};