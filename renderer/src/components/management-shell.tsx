import type { ReactNode } from 'react';
import {
  Building2,
  ClipboardList,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Settings,
  Shield,
  UserRound,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ManagementSection =
  | 'setup'
  | 'units'
  | 'views'
  | 'staff'
  | 'reports'
  | 'settings';

const NAV: { id: ManagementSection; label: string; icon: typeof Settings }[] = [
  { id: 'setup', label: 'Unit setup', icon: Settings },
  { id: 'units', label: 'Units', icon: Building2 },
  { id: 'views', label: 'View mode', icon: LayoutGrid },
  { id: 'staff', label: 'Staff & roles', icon: Users },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Shield },
];

interface ManagementShellProps {
  section: ManagementSection;
  onSection: (section: ManagementSection) => void;
  title: string;
  unitLabel?: string;
  userName: string;
  roleLabel: string;
  onLogout: () => void;
  children: ReactNode;
}

export function ManagementShell({
  section,
  onSection,
  title,
  unitLabel,
  userName,
  roleLabel,
  onLogout,
  children,
}: ManagementShellProps) {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex">
      <aside className="w-60 shrink-0 border-r border-white/10 bg-[#0b1628] flex flex-col">
        <div className="px-4 py-5 flex items-center gap-3 border-b border-white/10">
          <Shield className="h-8 w-8 text-sky-400" />
          <div>
            <div className="font-semibold leading-tight">UnitView</div>
            <div className="text-xs text-slate-400">Unit Management</div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSection(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-left',
                  active ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-white/5',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 text-sm">
            <UserRound className="h-8 w-8 text-sky-300" />
            <div className="min-w-0">
              <div className="truncate font-medium">{userName}</div>
              <div className="text-xs text-slate-400 truncate">{roleLabel}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Exit
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            {unitLabel ? <span>Unit: {unitLabel}</span> : null}
            <span className="inline-flex items-center gap-1">
              <HelpCircle className="h-4 w-4" /> Help
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export function shellCard(children: ReactNode) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0e1b30] p-5 space-y-3">
      {children}
    </section>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-slate-400">{children}</p>;
}
