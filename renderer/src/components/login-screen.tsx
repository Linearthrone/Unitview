import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Stethoscope, Building2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (credentials: { employeeNumber: string; password: string }) => void;
  isLoading?: boolean;
  error?: string | null;
  /** Facility branding — placeholder until configured per site. */
  facilityName?: string;
  logoDataUrl?: string;
  storeNotice?: string | null;
}

export default function LoginScreen({
  onLogin,
  isLoading = false,
  error = null,
  facilityName = 'Your Facility Name',
  logoDataUrl,
  storeNotice = null,
}: LoginScreenProps) {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeNumber && password) {
      onLogin({ employeeNumber, password });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as React.FormEvent);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/40 bg-card mb-4 overflow-hidden">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="" className="max-h-full max-w-full object-contain p-2" />
            ) : (
              <Building2 className="w-10 h-10 text-muted-foreground/60" aria-hidden />
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {facilityName}
          </p>
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Stethoscope className="w-8 h-8 text-primary" aria-hidden />
            <h1 className="text-3xl font-bold text-foreground">Unitview</h1>
          </div>
          <p className="text-muted-foreground">Hospital Patient Management System</p>
        </div>

        {storeNotice && (
          <Alert className="mb-4 border-amber-500/50 text-amber-100 [&>svg]:text-amber-200">
            <AlertDescription>{storeNotice}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Staff Login</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeNumber">Employee Number</Label>
                <Input
                  id="employeeNumber"
                  type="text"
                  placeholder="Enter your employee number"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  required
                  className="h-11 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  required
                  className="h-11 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-muted-foreground leading-relaxed">
                This system contains protected health information. Access is limited to authorized
                workforce members, is logged, and idle sessions end after 15 minutes.
              </p>
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading || !employeeNumber || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
