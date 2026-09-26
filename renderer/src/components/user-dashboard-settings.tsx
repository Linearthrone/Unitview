import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Moon, Settings, Sun } from 'lucide-react';
import type { User } from '../types/auth';
import { formatAppRoleLabel } from '@/lib/roles';
import { getAppVersion } from '@/lib/app-version';
interface UserDashboardSettingsProps {
  user: User;
  onBack: () => void;
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export default function UserDashboardSettings({
  user,
  onBack,
  currentTheme,
  onThemeChange,
}: UserDashboardSettingsProps) {
  const [appVersion, setAppVersion] = useState<string>('…');

  useEffect(() => {
    let cancelled = false;
    void getAppVersion().then((version) => {
      if (!cancelled) setAppVersion(version);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-4">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground">Application preferences and account</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Appearance & account
            </CardTitle>
            <CardDescription>Configure theme and view your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Color theme</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Per-unit color themes are deprecated — use light or clinical-dark app-wide.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {(
                  [
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Clinical dark', icon: Moon },
                  ] as const
                ).map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => onThemeChange(theme.value)}
                    className={`p-3 rounded-lg border transition-all ${
                      currentTheme === theme.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <theme.icon className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-medium">{theme.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Account information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Employee number</span>
                  <span className="font-medium text-right">{user.employeeNumber}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Full name</span>
                  <span className="font-medium text-right">{user.username}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">{formatAppRoleLabel(user.role, user.appRole)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Last login</span>
                  <span className="font-medium text-right">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Application info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">{appVersion}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Data storage</span>
                  <span className="font-medium">Local</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

