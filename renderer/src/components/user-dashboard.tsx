import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  Plus,
  Settings,
  Hospital,
  ChevronRight,
  Layout,
  Moon,
  Sun,
  BedDouble,
  Users,
  ShieldAlert,
  Pencil,
  Star,
  Search,
  ChevronDown,
  ChevronUp,
  LogOut,
  Shield,
  Activity,
} from 'lucide-react';
import { User, UnitSettings } from '../types/auth';
import { formatAppRoleLabel, getRoleCapabilities } from '@/lib/roles';
import type { CreateUnitPayload } from '../types/patient';
import { authService } from '../services/authService';
import * as layoutService from '../services/layoutService';
import { computeFacilityStatistics, type FacilityStatistics } from '../services/facilityStatsService';
import { getLastOpenedUnitName } from '../lib/last-unit-storage';
import {
  getFavoriteUnitNames,
  sortUnitsWithFavoritesAndLast,
  toggleFavoriteUnit,
} from '../lib/favorite-units-storage';
import CreateUnitDialog from './create-unit-dialog';
import UserDashboardSettings from './user-dashboard-settings';
import EditUnitDialog, { type EditUnitValues } from './edit-unit-dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { Input } from './ui/input';
import { applyAppTheme, normalizeAppTheme } from '@/lib/app-theme';

/** Placeholder unit created in older versions; not shown on the dashboard. */
const isPlaceholderDefaultUnit = (u: UnitSettings) => u.id === 'default';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onEnterUnit: (unitName: string) => void | Promise<void>;
  onOpenUserManagement?: () => void;
}

export default function UserDashboard({ user, onLogout, onEnterUnit, onOpenUserManagement }: UserDashboardProps) {
  const roleCaps = getRoleCapabilities(user.role, user.appRole);
  const [units, setUnits] = useState<UnitSettings[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [favoriteUnits, setFavoriteUnits] = useState<string[]>(() => getFavoriteUnitNames(user.id));
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [facilityStats, setFacilityStats] = useState<FacilityStatistics | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreateUnitOpen, setIsCreateUnitOpen] = useState(false);
  const [availableLayoutNames, setAvailableLayoutNames] = useState<string[]>([]);
  const [screen, setScreen] = useState<'main' | 'settings'>('main');
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<UnitSettings | null>(null);

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  /** Read each render so returning from a unit refreshes “last opened” from storage. */
  const lastOpenedName = getLastOpenedUnitName(user.id);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    applyAppTheme(theme);
  }, []);

  const loadCurrentSettings = useCallback(() => {
    try {
      const theme = normalizeAppTheme(localStorage.getItem('unitview_theme'));
      setCurrentTheme(theme);
      applyTheme(theme);
    } catch {
      setCurrentTheme('dark');
      applyTheme('dark');
    }
  }, [applyTheme]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setStatsLoading(true);
    try {
      let [allUnits, layouts] = await Promise.all([
        Promise.resolve(authService.getUnitSettings()),
        layoutService.getAvailableLayouts(),
      ]);

      setUnits(allUnits);
      setAvailableLayoutNames(layouts);

      const visible = allUnits.filter((u) => !isPlaceholderDefaultUnit(u));
      const layoutKeys = visible.map((u) => u.name).filter((n) => layouts.includes(n));
      const stats = await computeFacilityStatistics(layoutKeys);
      setFacilityStats(stats);
    } catch {
      showMessage('error', 'Failed to load dashboard data');
      setFacilityStats(null);
    } finally {
      setIsLoading(false);
      setStatsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadInitialData();
    loadCurrentSettings();
  }, [loadInitialData, loadCurrentSettings]);

  const visibleUnits = useMemo(
    () => units.filter((u) => !isPlaceholderDefaultUnit(u)),
    [units]
  );

  const sortedUnits = useMemo(
    () => sortUnitsWithFavoritesAndLast(visibleUnits, favoriteUnits, lastOpenedName) as UnitSettings[],
    [visibleUnits, favoriteUnits, lastOpenedName]
  );

  const filteredUnits = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    if (!q) return sortedUnits;
    return sortedUnits.filter((u) => u.name.toLowerCase().includes(q));
  }, [sortedUnits, unitSearch]);

  useEffect(() => {
    if (sortedUnits.length === 0) {
      setSelectedUnit('');
      return;
    }
    const last = getLastOpenedUnitName(user.id);
    const preferred = last && sortedUnits.some((u) => u.name === last) ? last : sortedUnits[0].name;
    setSelectedUnit((prev) => (prev && sortedUnits.some((u) => u.name === prev) ? prev : preferred));
  }, [sortedUnits, user.id]);

  const handleCreateUnitWizard = async (data: CreateUnitPayload) => {
    await layoutService.createFullUnitFromPayload(data);
    const newUnit: UnitSettings = {
      id: `unit-${Date.now()}`,
      name: data.designation,
      theme: currentTheme,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    const success = authService.saveUnitSettings(newUnit);
    if (!success) {
      showMessage('error', 'Unit layout was created but saving the unit to your list failed.');
      return;
    }
    setIsCreateUnitOpen(false);
    await loadInitialData();
    const layouts = await layoutService.getAvailableLayouts();
    setAvailableLayoutNames(layouts);
    setSelectedUnit(data.designation);
    showMessage('success', `Unit "${data.designation}" created. Opening…`);
    await Promise.resolve(onEnterUnit(data.designation));
  };

  const handleEnterUnit = () => {
    if (!selectedUnit) {
      showMessage('error', 'Please select a unit');
      return;
    }
    onEnterUnit(selectedUnit);
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const handleToggleFavorite = (unitName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavoriteUnits(toggleFavoriteUnit(user.id, unitName));
  };

  const handleOpenEditUnit = (unit: UnitSettings) => {
    setUnitToEdit(unit);
    setIsEditUnitOpen(true);
  };

  const handleSaveEditedUnit = async (values: EditUnitValues) => {
    if (!unitToEdit) return;
    const oldName = unitToEdit.name;
    const nextName = values.name.trim();
    const renameRequested = oldName !== nextName;

    if (renameRequested) {
      await layoutService.renameLayout(oldName, nextName);
    }

    const success = authService.saveUnitSettings({
      ...unitToEdit,
      name: nextName,
      theme: values.theme,
      lastModified: new Date(),
    });

    if (!success) {
      throw new Error('Unable to save updated unit settings.');
    }

    if (selectedUnit === oldName) {
      setSelectedUnit(nextName);
    }

    setIsEditUnitOpen(false);
    setUnitToEdit(null);
    await loadInitialData();
    showMessage('success', `Unit "${nextName}" updated.`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <UserDashboardSettings
        user={user}
        onBack={() => setScreen('main')}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Hospital className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">UnitView</h1>
                <p className="text-sm text-muted-foreground">Welcome, {user.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Role:{' '}
                <span className="font-medium text-foreground">{formatAppRoleLabel(user.role, user.appRole)}</span>
              </span>
              {roleCaps.isAdmin && onOpenUserManagement && (
                <Button variant="outline" size="sm" onClick={onOpenUserManagement}>
                  <Shield className="w-4 h-4 mr-2" />
                  Manage users
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setScreen('settings')} aria-label="Settings">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {message && (
          <Alert
            className={`${
              message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Facility statistics — collapsible to prioritize unit entry */}
        <section aria-labelledby="facility-stats-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="facility-stats-heading" className="text-lg font-semibold">
              Facility overview
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatsExpanded((v) => !v)}
              className="text-muted-foreground"
            >
              {statsExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" /> Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Expand stats
                </>
              )}
            </Button>
          </div>
          {statsExpanded && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Totals are calculated from every unit configured in this facility.
              </p>
              {statsLoading || !facilityStats ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  Loading facility statistics…
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Layout className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Units</span>
                      </div>
                      <CardTitle className="text-2xl tabular-nums">{facilityStats.unitCount}</CardTitle>
                      <CardDescription className="text-xs">With saved layouts</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <BedDouble className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Beds</span>
                      </div>
                      <CardTitle className="text-2xl tabular-nums">
                        {facilityStats.occupiedBeds}
                        <span className="text-base font-normal text-muted-foreground">
                          {' '}
                          / {facilityStats.totalBeds}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs">Occupied / total</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2 text-violet-600">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Staff</span>
                      </div>
                      <CardTitle className="text-2xl tabular-nums">
                        {facilityStats.totalNurses + facilityStats.totalTechs}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {facilityStats.totalNurses} nurses · {facilityStats.totalTechs} techs
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2 text-orange-600">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Fall risk</span>
                      </div>
                      <CardTitle className="text-2xl tabular-nums">{facilityStats.patientsFallRisk}</CardTitle>
                      <CardDescription className="text-xs">Occupied patients</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              )}
              {!statsLoading && facilityStats && facilityStats.unitCount > 0 && (
                <Card className="mt-4">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-600" />
                      <CardTitle className="text-base">Isolation breakdown (occupied)</CardTitle>
                    </div>
                    <CardDescription>
                      Total: {facilityStats.patientsIsolation} — Contact {facilityStats.isolationContact} · Airborne{' '}
                      {facilityStats.isolationAirborne} · Droplet {facilityStats.isolationDroplet}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </>
          )}
        </section>

        {roleCaps.isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Facility administration
              </CardTitle>
              <CardDescription>
                Create and configure units for this facility. Room layout and mock data tools are also available
                inside a unit under Admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="default" onClick={() => setIsCreateUnitOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create new unit
              </Button>
              {onOpenUserManagement && (
                <Button variant="outline" onClick={onOpenUserManagement}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage users
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Unit selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layout className="w-5 h-5 mr-2" />
              Select unit
            </CardTitle>
            <CardDescription>
              Search or pick a unit. Favorites and your last opened unit appear at the top.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="unit-select">Available units</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger id="unit-select" className="mt-1">
                  <SelectValue placeholder="Select a unit">
                    {selectedUnit || 'Select a unit'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortedUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.name} textValue={unit.name}>
                      {unit.name}
                      {lastOpenedName === unit.name ? ' (Last opened)' : ''}
                      {favoriteUnits.includes(unit.name) ? ' ★' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleEnterUnit} disabled={!selectedUnit} className="flex-1 min-w-[140px]">
                Enter unit
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {roleCaps.isAdmin && (
              <CreateUnitDialog
                open={isCreateUnitOpen}
                onOpenChange={setIsCreateUnitOpen}
                onSave={handleCreateUnitWizard}
                existingLayoutNames={availableLayoutNames}
              />
            )}

            {sortedUnits.length > 0 && (
              <div className="mt-4">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search units…"
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="space-y-2 max-h-[min(360px,50vh)] overflow-y-auto pr-1">
                  {filteredUnits.map((unit) => {
                    const isLastOpened = lastOpenedName === unit.name;
                    const isFavorite = favoriteUnits.includes(unit.name);
                    const row = (
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedUnit(unit.name);
                          }
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedUnit === unit.name
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border'
                        }`}
                        onClick={() => setSelectedUnit(unit.name)}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(unit.name, e)}
                              className="shrink-0 p-0.5 rounded hover:bg-muted"
                              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star
                                className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                              />
                            </button>
                            <span className="font-medium truncate">{unit.name}</span>
                            {isLastOpened && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal shrink-0">
                                Last opened
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    if (!roleCaps.isAdmin) return <div key={unit.id}>{row}</div>;
                    return (
                      <ContextMenu key={unit.id}>
                        <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handleOpenEditUnit(unit)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit unit
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <EditUnitDialog
        open={isEditUnitOpen}
        onOpenChange={(open) => {
          setIsEditUnitOpen(open);
          if (!open) setUnitToEdit(null);
        }}
        initialValues={unitToEdit ? { name: unitToEdit.name, theme: unitToEdit.theme } : null}
        existingLayoutNames={availableLayoutNames}
        onSave={handleSaveEditedUnit}
      />
    </div>
  );
}
