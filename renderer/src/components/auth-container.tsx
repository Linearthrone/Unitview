import React, { useState, useEffect } from 'react';
import LoginScreen from './login-screen';
import AdminDashboard from './admin-dashboard';
import UserDashboard from './user-dashboard';
import UnitViewClient from './unit-view-client';
import type { AuthState } from '../types/auth';
import { authService } from '../services/authService';
import * as patientService from '../services/patientService';
import * as nurseService from '../services/nurseService';
import * as spectraService from '../services/spectraService';
import * as layoutService from '../services/layoutService';
import type { LayoutName } from '../types/patient';
import { setLastOpenedUnitName } from '../lib/last-unit-storage';
import { getRoleCapabilities } from '@/lib/roles';
import { syncEpicCensus } from '@/services/fhirCensusService';
import { getConfiguredDataSource } from '@/lib/data-source';
import { defaultFacilityProfile, getFacilityProfile } from '@/services/facilityService';
import type { FacilityProfile } from '@/types/facility';
import ChangePasswordDialog from './change-password-dialog';
import { useSessionTimeout } from '@/lib/session-timeout';
import { recordAudit } from '@/lib/audit-client';
import { useToast } from '@/hooks/use-toast';

type AuthView = 'login' | 'admin' | 'user-dashboard' | 'unit-view';

const STORE_BANNER =
  'Encrypted store could not be opened. Existing data was not changed. Restart UnitView to try again.';

export default function AuthContainer({ storeUnavailable = false }: { storeUnavailable?: boolean }) {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  });
  const [initialProps, setInitialProps] = useState<any>(null);
  const [facilityProfile, setFacilityProfile] = useState<FacilityProfile>(defaultFacilityProfile);
  const [sessionWarning, setSessionWarning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize authentication system
    const initialize = async () => {
      if (storeUnavailable) {
        setCurrentView('login');
        return;
      }
      try {
        await authService.initializeAuth();
        try {
          const profile = await getFacilityProfile();
          setFacilityProfile(profile);
        } catch {
          // Keep default facility profile
        }
        
        const savedUser = authService.getCurrentUser();
        if (savedUser) {
          setAuthState({
            isAuthenticated: true,
            user: savedUser,
            isLoading: false,
            error: null,
          });
          setCurrentView('user-dashboard');
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };

    initialize();
  }, [storeUnavailable]);

  const handleLogin = async (credentials: { employeeNumber: string; password: string }) => {
    if (storeUnavailable) {
      setCurrentView('login');
      return;
    }
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await authService.login(credentials);
      
      if (result.isAuthenticated && result.user) {
        setAuthState(result);
        authService.setCurrentUser(result.user);
        setCurrentView('user-dashboard');
      } else {
        setAuthState(result);
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Login failed. Please try again.',
      });
    }
  };

  const handleLogout = async (reason: 'user' | 'timeout' = 'user') => {
    await authService.logout(authState.user?.employeeNumber);
    if (reason === 'timeout') {
      await recordAudit({
        action: 'SESSION_TIMEOUT',
        actorEmployeeNumber: authState.user?.employeeNumber,
        success: true,
      });
    }
    authService.clearCurrentUser();
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: reason === 'timeout' ? 'Signed out after 15 minutes of inactivity.' : null,
    });
    setCurrentView('login');
    setSessionWarning(false);
  };

  const wallSession =
    authState.user != null &&
    getRoleCapabilities(authState.user.role, authState.user.appRole).isWallDisplay;

  useSessionTimeout(
    authState.isAuthenticated && !wallSession,
    () => {
      setSessionWarning(true);
      toast({
        title: 'Session ending soon',
        description: 'Move the mouse or press a key to stay signed in.',
      });
    },
    () => {
      void handleLogout('timeout');
    }
  );

  const handleBackToLogin = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
    setCurrentView('login');
  };

  const handleEnterUnit = async (unitName: string) => {
    if (storeUnavailable) {
      setCurrentView('login');
      return;
    }
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Load all data for the selected unit
      const [initialSpectra, allLayouts] = await Promise.all([
        spectraService.getSpectraPool(),
        layoutService.getAvailableLayouts(),
      ]);

      const layoutToLoad: LayoutName = allLayouts.includes(unitName as LayoutName) 
        ? (unitName as LayoutName) 
        : 'North-South View';
          
      let [initialPatients, initialNurses, initialTechs] = await Promise.all([
        patientService.getPatients(layoutToLoad),
        nurseService.getNurses(layoutToLoad),
        nurseService.getTechs(layoutToLoad),
      ]);

      const sessionUser = authService.getCurrentUser();
      if (getConfiguredDataSource() === 'epic_fhir' && window.electronAPI?.fetchEpicCensus) {
        try {
          const synced = await syncEpicCensus(initialPatients, sessionUser?.employeeNumber);
          initialPatients = synced.rooms;
          await patientService.savePatients(layoutToLoad, initialPatients);
        } catch {
          // Keep the local unit board if Epic is unreachable; user can retry from the header.
        }
      }
      if (sessionUser) {
        setLastOpenedUnitName(sessionUser.id, layoutToLoad);
        await recordAudit({
          action: 'PHI_VIEW',
          actorEmployeeNumber: sessionUser.employeeNumber,
          resourceType: 'Unit',
          resourceId: layoutToLoad,
          success: true,
        });
      }

      setInitialProps({
        initialLayoutName: layoutToLoad,
        initialAvailableLayouts: allLayouts,
        initialIsLayoutLocked: false,
        initialPatients,
        initialNurses,
        initialTechs,
        initialSpectraPool: initialSpectra,
      });

      setAuthState(prev => ({ ...prev, isLoading: false, error: null }));
      setCurrentView('unit-view');
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load unit data' 
      }));
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('user-dashboard');
    setInitialProps(null);
  };

  const passwordGate = authState.user?.mustChangePassword ? (
    <ChangePasswordDialog
      open
      required
      employeeNumber={authState.user.employeeNumber}
      onSubmit={async (password) => {
        const result = await authService.changePassword(authState.user!.employeeNumber, password);
        if (result.ok) {
          const updated = { ...authState.user!, mustChangePassword: false };
          authService.setCurrentUser(updated);
          setAuthState((prev) => ({ ...prev, user: updated }));
        }
        return result;
      }}
    />
  ) : null;

  // Render current view
  switch (currentView) {
    case 'login':
      return (
        <LoginScreen
          onLogin={handleLogin}
          isLoading={authState.isLoading}
          error={authState.error}
          facilityName={facilityProfile.name}
          logoDataUrl={facilityProfile.logoDataUrl}
          storeNotice={storeUnavailable ? STORE_BANNER : null}
        />
      );

    case 'admin':
      return (
        <>
          {passwordGate}
          {sessionWarning && (
            <p className="sr-only">Session will end soon due to inactivity.</p>
          )}
          <AdminDashboard
            onLogout={() => void handleLogout('user')}
            onBackToLogin={handleBackToLogin}
            onBackToFacility={() => setCurrentView('user-dashboard')}
          />
        </>
      );

    case 'user-dashboard':
      return authState.user ? (
        <>
          {passwordGate}
          <UserDashboard
            user={authState.user}
            onLogout={() => void handleLogout('user')}
            onEnterUnit={handleEnterUnit}
            onOpenUserManagement={
              getRoleCapabilities(authState.user.role, authState.user.appRole).isAdmin
                ? () => setCurrentView('admin')
                : undefined
            }
          />
        </>
      ) : null;

    case 'unit-view':
      return initialProps ? (
        <>
          {passwordGate}
          <UnitViewClient 
            {...initialProps} 
            onBackToDashboard={handleBackToDashboard}
            currentUser={authState.user}
          />
        </>
      ) : null;

    default:
      return (
        <LoginScreen
          onLogin={handleLogin}
          storeNotice={storeUnavailable ? STORE_BANNER : null}
        />
      );
  }
}