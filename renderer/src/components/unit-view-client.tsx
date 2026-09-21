"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// UI Components
import AppHeader from './app-header';
import UnitActionBar from './unit-action-bar';
import ShiftMakerDialog from './shift-maker-dialog';
import PatientGrid from './patient-grid';
import ReportSheet from './report-sheet';
import PrintableReport from './printable-report';
import PrintableAssignments from './printable-assignments';
import SaveLayoutDialog from './save-layout-dialog';
import AdmitPatientDialog from './admit-patient-dialog';
import DischargeConfirmationDialog from './discharge-confirmation-dialog';
import AddStaffMemberDialog from './add-staff-member-dialog';
import AssignStaffDialog, { type AssignStaffTarget } from './assign-staff-dialog';
import type { NurseAssignContext } from './nurse-assignment-card';
import type { TechAssignContext } from './patient-care-tech-card';
import { getRoleCapabilities } from '@/lib/roles';
import ManageSpectraDialog from './manage-spectra-dialog';
import SpectralinkDeviceTable from './spectralink-device-table';
import AddRoomDialog from './add-room-dialog';
import CreateUnitDialog from './create-unit-dialog';
import EditRoomDesignationDialog from './edit-room-designation-dialog';
import AssignmentPrintLayoutDialog from './assignment-print-layout-dialog';
import QuickNoteDialog from './quick-note-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { ChevronLeft, Plus, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
// Hooks and utils
import { useToast } from "../hooks/use-toast";
import { NUM_ROWS_GRID } from '../lib/grid-utils';
import { computeNameAlertGroups, getNameAlertSignature } from '@/lib/name-alerts';
import {
  isOccupiedBed,
  patientHasInvoluntaryHold,
  countPatientsRequiringSitter,
  computeUnitCensusStats,
} from '@/lib/patient-status-helpers';
import type { GridZoomControls } from '@/lib/grid-zoom';
// Types
import type { LayoutName, Patient, StaffRole, CreateUnitPayload } from '../types/patient';
import type { Nurse, PatientCareTech, Spectra, SpectraStatus } from '../types/nurse';
import type { AdmitPatientFormValues } from '../types/forms';
import type { AddStaffMemberFormValues } from '../types/forms';
import type { User } from '../types/auth';
// Services
import * as layoutService from '../services/layoutService';
import * as patientService from '../services/patientService';
import * as epicService from '../services/epicService';
import { saveBoardSnapshot } from '../services/boardPersist';
import * as nurseService from '../services/nurseService';
import * as spectraService from '../services/spectraService';
import * as assignmentService from '../services/assignmentService';
import { syncEpicCensus } from '../services/fhirCensusService';
import { getConfiguredDataSource } from '../lib/data-source';
import * as printLayoutService from '../services/printLayoutService';
import { getDb } from '../lib/database-simple';
import { setLastOpenedUnitName } from '../lib/last-unit-storage';
import { openPrintWindowWithElectronFallback } from '../lib/print-utils';
import { createDefaultAssignmentPrintLayout, type AssignmentPrintLayoutConfig } from '../types/assignment-print-layout';
import { syncPatientsAssignedNurseFromNurses, applyDropOnNurseSlot } from '../lib/nurse-assignment-sync';
import {
  clampNurseCardRowSpan,
  getEffectiveNurseCardRowSpan,
  getNurseRowSpan,
  isAssignableNurseRole,
} from '../lib/nurse-card-layout';
import { snapshotPriorShiftStaff } from '../lib/patient-staff-assignments';
import { defaultFacilityProfile, getFacilityProfile } from '../services/facilityService';
import type { FacilityProfile } from '../types/facility';
import { findCompactEmptySlot, getAvailableSpectra } from '../services/nurseHelpers';
import { buildWallpaperSnapshot } from '../lib/wallpaper-snapshot';


interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}
interface DraggingNurseInfo {
  id: string;
}
interface DraggingTechInfo {
  id: string;
}

interface UnitViewClientProps {
    initialLayoutName: LayoutName;
    initialAvailableLayouts: LayoutName[];
    initialIsLayoutLocked: boolean;
    initialPatients: Patient[];
    initialNurses: Nurse[];
    initialTechs: PatientCareTech[];
    initialSpectraPool: Spectra[];
    onBackToDashboard?: () => void;
    currentUser?: User;
}

const getFriendlyLayoutName = (layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'North-South View': return 'North/South View';
      default: return layoutName;
    }
  };

export default function UnitViewClient({
    initialLayoutName,
    initialAvailableLayouts,
    initialIsLayoutLocked,
    initialPatients,
    initialNurses,
    initialTechs,
    initialSpectraPool,
    onBackToDashboard,
    currentUser
}: UnitViewClientProps) {
  const [isLayoutLocked, setIsLayoutLocked] = useState(initialIsLayoutLocked);
  const roleCaps = useMemo(
    () =>
      currentUser
        ? getRoleCapabilities(currentUser.role, currentUser.appRole)
        : getRoleCapabilities('user', 'Nurse'),
    [currentUser]
  );

  const isEffectivelyLocked = isLayoutLocked || roleCaps.isReadOnly;
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<LayoutName>(initialLayoutName);
  const [availableLayouts, setAvailableLayouts] = useState<LayoutName[]>(initialAvailableLayouts);

  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [nurses, setNurses] = useState<Nurse[]>(initialNurses);
  const [techs, setTechs] = useState<PatientCareTech[]>(initialTechs);
  const [spectraPool, setSpectraPool] = useState<Spectra[]>(initialSpectraPool);
  /** Draft shift (isolated from active board until activation). */
  const [oncomingNurses, setOncomingNurses] = useState<Nurse[]>([]);
  
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [draggingNurseInfo, setDraggingNurseInfo] = useState<DraggingNurseInfo | null>(null);
  const [draggingTechInfo, setDraggingTechInfo] = useState<DraggingTechInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const skipFirstAutoSaveRef = useRef(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [admitOrUpdatePatient, setAdmitOrUpdatePatient] = useState<Patient | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isAddStaffMemberDialogOpen, setIsAddStaffMemberDialogOpen] = useState(false);
  const [quickAddRole, setQuickAddRole] = useState<StaffRole>('Staff Nurse');
  const [isAssignStaffDialogOpen, setIsAssignStaffDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AssignStaffTarget | null>(null);
  const [isManageSpectraDialogOpen, setIsManageSpectraDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isCreateUnitDialogOpen, setIsCreateUnitDialogOpen] = useState(false);
  const [isShiftMakerOpen, setIsShiftMakerOpen] = useState(false);
  const [isOncomingShiftSetup, setIsOncomingShiftSetup] = useState(false);
  const [isSyncingEpic, setIsSyncingEpic] = useState(false);
  const [quickNotePatient, setQuickNotePatient] = useState<Patient | null>(null);
  const [isSpectraMobileOpen, setIsSpectraMobileOpen] = useState(false);
  const [isSpectraPanelExpanded, setIsSpectraPanelExpanded] = useState(false);
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);
  const [patientToEditDesignation, setPatientToEditDesignation] = useState<Patient | null>(null);
  const [acknowledgedNameAlertSignatures, setAcknowledgedNameAlertSignatures] = useState<Set<string>>(
    () => new Set()
  );
  const [assignmentPrintLayout, setAssignmentPrintLayout] = useState<AssignmentPrintLayoutConfig>(
    () => createDefaultAssignmentPrintLayout(),
  );
  const [isPrintLayoutDialogOpen, setIsPrintLayoutDialogOpen] = useState(false);
  const [facilityProfile, setFacilityProfile] = useState<FacilityProfile>(defaultFacilityProfile);
  const [gridZoomControls, setGridZoomControls] = useState<GridZoomControls | null>(null);
  const [patientsPerNurse, setPatientsPerNurse] = useState(4);
  const [isEpicSyncing, setIsEpicSyncing] = useState(false);
  const [wallpaperActive, setWallpaperActive] = useState(false);
  const [wallpaperRedactPhi, setWallpaperRedactPhi] = useState(true);

  useEffect(() => {
    void getFacilityProfile()
      .then(setFacilityProfile)
      .catch(() => {
        // Keep default profile
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const metadata = await layoutService.getLayoutMetadata(currentLayoutName);
      if (!cancelled) {
        setPatientsPerNurse(Math.max(1, metadata.nurseToPatientRatio));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentLayoutName]);

  useEffect(() => {
    setAcknowledgedNameAlertSignatures(new Set());
  }, [currentLayoutName]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const config = await printLayoutService.getAssignmentPrintLayout(currentLayoutName);
      if (!cancelled) setAssignmentPrintLayout(config);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentLayoutName]);

  const handlePrint = useCallback(async (reportType: 'charge' | 'assignments') => {
    const printTarget =
      reportType === 'charge' ? 'printable-charge-report' : 'printable-assignments-report';
    const title = reportType === 'charge' ? 'Charge Report' : 'Shift Assignments';
    const result = await openPrintWindowWithElectronFallback(printTarget, title);
    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: 'Print failed',
        description: result.error ?? 'Unable to open the print dialog.',
      });
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await nurseService.getOncomingNurses(currentLayoutName);
      if (!cancelled) setOncomingNurses(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentLayoutName]);

  const handleExportData = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const database = await getDb();
      const result = await window.electronAPI.exportData(database.exportData());
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: result.error ?? 'Unable to export data.',
        });
        return;
      }

      toast({
        title: 'Export Complete',
        description: result.path ? `Backup saved to ${result.path}` : 'Backup saved successfully.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while exporting data.';
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: message,
      });
    }
  }, [toast]);

  const handlePrintReport = useCallback(() => {
    void handlePrint('charge');
  }, [handlePrint]);

  const pushWallpaperSnapshot = useCallback(async () => {
    if (!window.electronAPI?.wallpaperPushSnapshot || !wallpaperActive) {
      return;
    }
    const snapshot = buildWallpaperSnapshot({
      unitName: getFriendlyLayoutName(currentLayoutName),
      patients,
      nurses,
      techs,
      redactPhi: wallpaperRedactPhi || !roleCaps.canSeePatientIdentifiers,
    });
    await window.electronAPI.wallpaperPushSnapshot(snapshot);
  }, [
    wallpaperActive,
    currentLayoutName,
    patients,
    nurses,
    techs,
    wallpaperRedactPhi,
    roleCaps.canSeePatientIdentifiers,
  ]);

  const handleToggleWallpaper = useCallback(async () => {
    if (!window.electronAPI?.wallpaperStart || !window.electronAPI?.wallpaperStop) {
      toast({
        variant: 'destructive',
        title: 'Desktop map unavailable',
        description: 'Live desktop wallpaper requires the UnitView desktop app.',
      });
      return;
    }

    const actor = currentUser?.employeeNumber;

    if (wallpaperActive) {
      const result = await window.electronAPI.wallpaperStop({
        actorEmployeeNumber: actor,
        restorePrevious: true,
      });
      setWallpaperActive(false);
      toast({
        title: 'Desktop map stopped',
        description: result.success
          ? 'Previous Windows wallpaper restored when available.'
          : result.error ?? 'Stop reported an error.',
      });
      return;
    }

    const confirmed = window.confirm(
      [
        'Pin this unit map to the Windows desktop background?',
        '',
        'A live feed refreshes about every 10 seconds.',
        'Patient names are hidden by default (WALLDISPLAY-style).',
        'Anyone who can see this workstation desktop may view room status.',
        '',
        'OK to start, Cancel to abort.',
      ].join('\n')
    );
    if (!confirmed) {
      return;
    }

    const result = await window.electronAPI.wallpaperStart({
      intervalMs: 10_000,
      redactPhi: true,
      actorEmployeeNumber: actor,
      unitName: getFriendlyLayoutName(currentLayoutName),
    });

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Could not start desktop map',
        description: result.error ?? 'Unknown error',
      });
      return;
    }

    setWallpaperRedactPhi(true);
    setWallpaperActive(true);

    const platformNote = result.status?.platformSupported
      ? 'Windows desktop background will update on a live interval.'
      : 'Capture runs here; wallpaper apply requires Windows.';
    toast({
      title: 'Desktop map live',
      description: platformNote,
    });
  }, [wallpaperActive, currentUser?.employeeNumber, currentLayoutName, toast]);

  useEffect(() => {
    if (!wallpaperActive) {
      return;
    }
    void pushWallpaperSnapshot();
  }, [wallpaperActive, pushWallpaperSnapshot]);

  useEffect(() => {
    if (!window.electronAPI?.wallpaperStatus) {
      return;
    }
    let cancelled = false;
    void window.electronAPI.wallpaperStatus().then((status) => {
      if (!cancelled) {
        setWallpaperActive(Boolean(status.active));
        setWallpaperRedactPhi(status.redactPhi !== false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getChargeNurseName = () => {
    return nurses.find(n => n.role === 'Charge Nurse')?.name || 'Unassigned';
  }

  const loadBoardForLayout = useCallback(async (layoutName: LayoutName) => {
      setIsInitialized(false);
      try {
        const [patientData, nurseData, techData, oncomingData, spectra, layouts] = await Promise.all([
            patientService.getPatients(layoutName),
            nurseService.getNurses(layoutName),
            nurseService.getTechs(layoutName),
            nurseService.getOncomingNurses(layoutName),
            spectraService.getSpectraPool(),
            layoutService.getAvailableLayouts(),
        ]);

        skipFirstAutoSaveRef.current = true;
        setPatients(patientData);
        setNurses(nurseData);
        setTechs(techData);
        setOncomingNurses(oncomingData);
        setSpectraPool(spectra);
        setAvailableLayouts(layouts);
        setCurrentLayoutName(layoutName);
        if (currentUser) {
          setLastOpenedUnitName(currentUser.id, layoutName);
        }
        await layoutService.setUserPreference('lastSelectedLayout', layoutName);
        setIsInitialized(true);
      } catch (error) {
        console.error(`Failed to load data for layout "${layoutName}":`, error);
        toast({
          variant: "destructive",
          title: "Error Loading Layout",
          description: `Could not load data for "${layoutName}".`,
        });
        setIsInitialized(false);
      }
  }, [toast, currentUser]);

  const handleImportData = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.importData();
      if (!result.success || !result.data) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: result.error ?? 'Unable to import data.',
        });
        return;
      }

      const database = await getDb();
      database.importData(result.data as ReturnType<typeof database.exportData>);
      await database.flushPendingWrites();
      const layouts = await layoutService.getAvailableLayouts();
      const nextLayout = layouts.includes(currentLayoutName)
        ? currentLayoutName
        : layouts[0];
      if (!nextLayout) {
        toast({
          title: 'Import Complete',
          description: 'Data imported. No units remain in the store.',
        });
        onBackToDashboard?.();
        return;
      }
      await loadBoardForLayout(nextLayout);
      toast({
        title: 'Import Complete',
        description: 'Data imported successfully.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while importing data.';
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: message,
      });
    }
  }, [toast, currentLayoutName, loadBoardForLayout, onBackToDashboard]);

  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }
    const handleMenuAction = (action: string) => {
      switch (action) {
        case 'new-layout':
          setIsCreateUnitDialogOpen(true);
          break;
        case 'open-layout':
          break;
        case 'save-layout':
          setIsSaveDialogOpen(true);
          break;
        case 'import-data':
          void handleImportData();
          break;
        case 'export-data':
          void handleExportData();
          break;
        case 'print-report':
          handlePrintReport();
          break;
        case 'wallpaper-toggle':
          void handleToggleWallpaper();
          break;
        default:
          break;
      }
    };

    const unsubscribe = window.electronAPI.onMenuAction(handleMenuAction);
    return () => {
      unsubscribe();
    };
  }, [handleExportData, handleImportData, handlePrintReport, handleToggleWallpaper]);

  // Set current year on mount
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSelectLayout = async (newLayoutName: LayoutName) => {
    await loadBoardForLayout(newLayoutName);
  };

  const toggleLayoutLock = () => {
    const newLockState = !isLayoutLocked;
    setIsLayoutLocked(newLockState);
    layoutService.setUserPreference('isLayoutLocked', newLockState);
  };
  
  const handleOpenSaveDialog = () => {
    if (isLayoutLocked) {
      toast({
        variant: "destructive",
        title: "Layout Locked",
        description: "Unlock the layout to save changes.",
      });
      return;
    }
    setIsSaveDialogOpen(true);
  };
  
  const handleSaveNewLayout = async (newLayoutName: string) => {
    await layoutService.saveNewLayout(newLayoutName, patients, nurses, techs);
    await loadBoardForLayout(newLayoutName);
    toast({
      title: "Layout Saved",
      description: `Layout "${newLayoutName}" has been successfully saved.`,
    });
  };

  const handleSaveCurrentLayout = async () => {
    if (isLayoutLocked) {
      toast({
        variant: "destructive",
        title: "Layout Locked",
        description: "Unlock the layout to save changes.",
      });
      return;
    }
    await layoutService.saveNewLayout(currentLayoutName, patients, nurses, techs);
    toast({
      title: "Layout Saved",
      description: `Current layout "${currentLayoutName}" has been saved.`,
    });
  };

  const handleSaveAssignments = async () => {
    try {
      const chargeNurseName = getChargeNurseName();
      const archivingOncoming = isOncomingShiftSetup;
      const nursesForArchive = archivingOncoming ? oncomingNurses : nurses;
      const snapshotPatients = snapshotPriorShiftStaff(patients, nursesForArchive, techs);
      setPatients(snapshotPatients);
      await assignmentService.saveShiftAssignments(
        currentLayoutName,
        nursesForArchive,
        snapshotPatients,
        chargeNurseName,
      );
      setIsOncomingShiftSetup(false);
      toast({
        title: "Assignments Saved",
        description: archivingOncoming
          ? "Oncoming shift assignment snapshot saved for reference."
          : "The current shift assignments have been saved for reference.",
      });
    } catch (error) {
       console.error("Failed to save assignments:", error);
       toast({
          variant: "destructive",
          title: "Error Saving Assignments",
          description: "Could not save the current assignments. See console for details.",
       });
    }
  };

  const handleSetupOncomingShift = async () => {
    let draft = await nurseService.getOncomingNurses(currentLayoutName);
    if (draft.length === 0) {
      draft = JSON.parse(JSON.stringify(nurses)) as Nurse[];
      await nurseService.saveOncomingNurses(currentLayoutName, draft);
    }
    setOncomingNurses(draft);
    setIsOncomingShiftSetup(true);
    setIsShiftMakerOpen(true);
    toast({
      title: 'Oncoming shift',
      description:
        'Edit the oncoming board here. The active unit map is unchanged until you activate this shift.',
    });
  };

  const handleActivateOncomingShift = async () => {
    try {
      const patientsWithPrior = snapshotPriorShiftStaff(patients, nurses, techs);
      await nurseService.saveOncomingNurses(currentLayoutName, oncomingNurses);
      await nurseService.activateOncomingShift(currentLayoutName);
      const promoted = await nurseService.getNurses(currentLayoutName);
      setNurses(promoted);
      setPatients(syncPatientsAssignedNurseFromNurses(patientsWithPrior, promoted));
      const cleared = await nurseService.getOncomingNurses(currentLayoutName);
      setOncomingNurses(cleared);
      setIsOncomingShiftSetup(false);
      setIsShiftMakerOpen(false);
      toast({
        title: 'Shift activated',
        description: 'Oncoming shift is now active. Previous active nurse cards were replaced.',
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Activation failed',
        description: e instanceof Error ? e.message : 'Could not activate shift.',
      });
    }
  };

  const handleOncomingDropOnNurseSlot = useCallback(
    (targetNurseId: string, _slotIndex: number) => {
      if (!draggingPatientInfo) return;
      const draggedPatientId = draggingPatientInfo.id;

      setOncomingNurses((currentOncoming) => {
        const draggedPatient = patients.find((p) => p.id === draggedPatientId);
        const targetNurse = currentOncoming.find((n) => n.id === targetNurseId);
        if (!draggedPatient || !targetNurse) return currentOncoming;

        const nurseCapacity = Math.max(1, targetNurse.assignedPatientIds.length);

        let next = currentOncoming.map((nurse) => ({
          ...nurse,
          assignedPatientIds: nurse.assignedPatientIds.map((id) => (id === draggedPatientId ? null : id)),
        }));

        const tn = next.find((n) => n.id === targetNurseId);
        if (!tn) return currentOncoming;

        const currentAssignedIds = tn.assignedPatientIds.filter((id) => id !== null && id !== draggedPatientId);
        const merged = [...currentAssignedIds, draggedPatientId];
        const patientMap = new Map(patients.map((p) => [p.id, p]));
        const sortedPatientIds = merged.sort((idA, idB) => {
          const pa = patientMap.get(idA!);
          const pb = patientMap.get(idB!);
          if (!pa || !pb) return 0;
          return pa.bedNumber - pb.bedNumber;
        });

        const finalPaddedIds = Array.from({ length: nurseCapacity }, () => null as string | null);
        sortedPatientIds.forEach((id, index) => {
          if (index < nurseCapacity && id) finalPaddedIds[index] = id;
        });

        next = next.map((nurse) =>
          nurse.id === targetNurseId ? { ...nurse, assignedPatientIds: finalPaddedIds } : nurse,
        );
        return next;
      });

      setDraggingPatientInfo(null);
    },
    [draggingPatientInfo, patients],
  );

  const handleOncomingClearNurseAssignments = useCallback((nurseId: string) => {
    setOncomingNurses((prev) =>
      prev.map((n) =>
        n.id === nurseId
          ? {
              ...n,
              assignedPatientIds: Array(Math.max(1, n.assignedPatientIds.length)).fill(null) as (string | null)[],
            }
          : n,
      ),
    );
  }, []);

  const handleOncomingRemoveNurse = useCallback((nurseId: string) => {
    let removedName = '';
    setOncomingNurses((prev) => {
      const removed = prev.find((n) => n.id === nurseId);
      removedName = removed?.name ?? '';
      return prev.filter((n) => n.id !== nurseId);
    });
    toast({
      title: 'Removed from oncoming shift',
      description: removedName ? `${removedName} removed from the oncoming draft.` : 'Card removed.',
    });
  }, [toast]);

  const handleOncomingAddNurseCard = useCallback(async () => {
    try {
      const metadata = await layoutService.getLayoutMetadata(currentLayoutName);
      const nurseCapacity = Math.max(1, metadata.nurseToPatientRatio);
      const slot = findCompactEmptySlot(patients, [...nurses, ...oncomingNurses], techs, 3, 1);
      if (!slot) {
        toast({
          variant: 'destructive',
          title: 'No empty space',
          description: 'Cannot place another nurse card on the grid.',
        });
        return;
      }
      const availableSpectra = getAvailableSpectra(spectraPool, [...nurses, ...oncomingNurses], techs);
      const newNurse: Nurse = {
        id: `staff-nurse-oncoming-${Date.now()}`,
        name: 'New Staff Nurse',
        role: 'Staff Nurse',
        spectra: availableSpectra[0]?.id ?? '',
        relief: '',
        assignedPatientIds: Array(nurseCapacity).fill(null) as (string | null)[],
        gridRow: slot.row,
        gridColumn: slot.col,
      };
      setOncomingNurses((prev) => [...prev, newNurse]);
      toast({ title: 'Card added', description: 'Staff nurse card added to oncoming shift draft.' });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e instanceof Error ? e.message : 'Could not add card.',
      });
    }
  }, [currentLayoutName, nurses, oncomingNurses, patients, spectraPool, techs, toast]);

  const handleOncomingAssignSpectra = async (deviceId: string, staffName: string) => {
    const result = await spectraService.assignDeviceToStaff(deviceId, staffName, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      setOncomingNurses((prev) =>
        prev.map((n) => (n.name.trim() === staffName.trim() ? { ...n, spectra: deviceId } : n)),
      );
      toast({ title: 'Device Assigned', description: `${deviceId} assigned to ${staffName} (oncoming).` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Assign Device', description: result.error });
    }
  };

  const handleOncomingUnassignSpectra = async (deviceId: string) => {
    const result = await spectraService.unassignDevice(deviceId, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      setOncomingNurses((prev) =>
        prev.map((n) => (n.spectra === deviceId ? { ...n, spectra: '' } : n)),
      );
      toast({ title: 'Device Unassigned', description: `${deviceId} is now unassigned.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Unassign Device', description: result.error });
    }
  };


  const handleOpenAdmitDialog = (patient: Patient | null) => {
    setIsUpdateMode(false);
    setAdmitOrUpdatePatient(patient);
  };

  const handleOpenUpdateDialog = (patient: Patient) => {
    setIsUpdateMode(true);
    setAdmitOrUpdatePatient(patient);
  };

  const handleSavePatient = async (formData: AdmitPatientFormValues) => {
    const editingPatient = admitOrUpdatePatient;
    const updating = isUpdateMode && editingPatient;

    let updatedPatients = updating
      ? await patientService.updatePatient(editingPatient.id, formData, patients)
      : await patientService.admitPatient(formData, patients);

    updatedPatients = updatedPatients.map((p) => {
      const isTarget = updating
        ? p.id === editingPatient.id
        : p.bedNumber === formData.bedNumber;
      return isTarget ? patientService.finalizePatientAfterSave(p, nurses) : p;
    });

    setPatients(updatedPatients);
    setAdmitOrUpdatePatient(null);
    setIsUpdateMode(false);

    if (updating && selectedPatient?.id === editingPatient.id) {
      const refreshed = updatedPatients.find((p) => p.id === editingPatient.id);
      if (refreshed) setSelectedPatient(refreshed);
    }

    const verb = updating ? 'updated' : 'admitted';
    const patientRecord = updatedPatients.find((p) =>
      updating ? p.id === editingPatient.id : p.bedNumber === formData.bedNumber,
    );
    toast({
      title: `Patient ${verb.charAt(0).toUpperCase() + verb.slice(1)}`,
      description: `${formData.name} has been ${verb} in ${patientRecord?.roomDesignation ?? 'the unit'}.`,
    });
  };

  const handleDischargeRequest = (patient: Patient) => {
    if (patient.name === 'Vacant' || patient.awaitingTransport) return;
    setSelectedPatient(null);
    setPatientToDischarge(patient);
  };
  
  const handleConfirmDischarge = async () => {
    const target = patientToDischarge;
    if (!target) return;
    const updatedPatients = await patientService.dischargePatient(target, patients);
    setPatients(updatedPatients);
    await patientService.savePatients(currentLayoutName, updatedPatients);
    toast({
      title: "Patient Discharged",
      description: `${target.name} is discharged and awaiting transport in ${target.roomDesignation}.`,
    });
    setPatientToDischarge(null);
  };

  const handleCompleteTransport = async (patient: Patient) => {
    const updatedPatients = await patientService.completeTransport(patient.id, patients);
    setPatients(updatedPatients);
    await patientService.savePatients(currentLayoutName, updatedPatients);
    if (selectedPatient?.id === patient.id) {
      setSelectedPatient(null);
    }
    toast({
      title: 'Transport complete',
      description: `${patient.roomDesignation} is now vacant.`,
    });
  };

  const handleRefreshFromEpic = useCallback(
    async (patient: Patient) => {
      if (patient.isBlocked) return;
      setIsEpicSyncing(true);
      try {
        const result = await epicService.syncBedFromEpic(patient.roomDesignation, patient.bedNumber);
        if (result.ok === false) {
          toast({
            variant: 'destructive',
            title: 'Epic sync failed',
            description: result.error,
          });
          return;
        }
        const { patch, source, message } = result;
        const merged = epicService.applyEpicPatchToPatient(patient, patch);
        const finalized = patientService.finalizePatientAfterSave(merged, nurses);
        const updatedPatients = patients.map((p) => (p.id === patient.id ? finalized : p));
        setPatients(updatedPatients);
        setSelectedPatient(finalized);
        await patientService.savePatients(currentLayoutName, updatedPatients);
        toast({
          title: source === 'stub' ? 'Epic stub sync complete' : 'Epic sync complete',
          description:
            message ??
            `Updated ${finalized.roomDesignation} from Epic (${finalized.name}). Staff assignments unchanged.`,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Epic sync error',
          description: error instanceof Error ? error.message : 'Unexpected error during Epic sync.',
        });
      } finally {
        setIsEpicSyncing(false);
      }
    },
    [currentLayoutName, nurses, patients, toast],
  );

  const handleToggleBlockRoom = (patientId: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, isBlocked: !p.isBlocked } : p
    ));
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        toast({
            title: `Room ${!patient.isBlocked ? "Blocked" : "Unblocked"}`,
            description: `${patient.roomDesignation} is now ${!patient.isBlocked ? "out of service" : "in service"}.`,
        });
    }
  };

  const handleDeleteRoom = (patientId: string) => {
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      // Remove the patient from local state
      setPatients(prev => prev.filter(p => p.id !== patientId));
      
      // Remove from database
      patientService.deletePatient(currentLayoutName, patientId);
      
      // Show success message
      toast({
        title: 'Room Deleted',
        description: 'The room has been successfully removed from the unit.',
      });
    }
  };
  
  const handleSaveRoomDesignation = (patientId: string, newDesignation: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, roomDesignation: newDesignation } : p
    ));
    setPatientToEditDesignation(null);
    toast({
      title: "Room Designation Updated",
      description: `Room has been renamed to "${newDesignation}".`,
    });
  };

  
  const handleSaveStaffMember = async (formData: AddStaffMemberFormValues) => {
    try {
      const result = await nurseService.addStaffMember(
        currentLayoutName,
        formData,
        nurses,
        techs,
        patients,
        spectraPool
      );

      setIsAddStaffMemberDialogOpen(false);

      if (result.nurses) {
        setNurses(result.nurses);
        toast({ title: "Staff Added", description: `${formData.name} (${formData.role}) has been added to the unit.` });
      }
      if (result.techs) {
        setTechs(result.techs);
        toast({ title: "Tech Added", description: `${formData.name} (${formData.role}) has been added to the unit.` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add staff member.";
      toast({
        variant: "destructive",
        title: "Error Adding Staff",
        description: message,
      });
    }
  };

  const handleRemoveNurse = (nurseId: string) => {
    const nurseToRemove = nurses.find(n => n.id === nurseId);
    if (!nurseToRemove) return;

    // Unassign patients from the nurse being removed
    const patientIdsToUnassign = nurseToRemove.assignedPatientIds.filter(id => id !== null);
    setPatients(prevPatients =>
      prevPatients.map(p =>
        patientIdsToUnassign.includes(p.id) ? { ...p, assignedNurse: undefined } : p
      )
    );

    setNurses(prevNurses => prevNurses.filter(n => n.id !== nurseId));
    toast({
      title: "Staff Removed",
      description: `${nurseToRemove.name} has been removed from the unit.`,
    });
  };

  const handleRemoveTech = (techId: string) => {
    const techToRemove = techs.find(t => t.id === techId);
    if (!techToRemove) return;

    setTechs(prevTechs => prevTechs.filter(t => t.id !== techId));
    toast({
      title: "Tech Removed",
      description: `${techToRemove.name} has been removed from the unit.`,
    });
  };

  const handleAssignStaff = (role: StaffRole) => {
    setAssignTarget({ role });
    setIsAssignStaffDialogOpen(true);
  };

  const handleAssignNurse = (context: NurseAssignContext) => {
    setAssignTarget({ role: context.role, nurseId: context.nurseId });
    setIsAssignStaffDialogOpen(true);
  };

  const handleAssignTech = (context: TechAssignContext) => {
    setAssignTarget({ role: context.role, techId: context.techId });
    setIsAssignStaffDialogOpen(true);
  };

  const handleResizeNurseCardRowSpan = useCallback((nurseId: string, nextRowSpan: number) => {
    if (isEffectivelyLocked) return;
    const rowSpan = clampNurseCardRowSpan(nextRowSpan);

    setNurses((prevNurses) => {
      const target = prevNurses.find((n) => n.id === nurseId);
      if (!target || !isAssignableNurseRole(target.role)) return prevNurses;
      if (getEffectiveNurseCardRowSpan(target) === rowSpan) return prevNurses;

      return prevNurses.map((n) =>
        n.id === nurseId ? { ...n, cardRowSpan: rowSpan } : n,
      );
    });
  }, [isEffectivelyLocked]);

  const handleQuickAddStaff = (role: StaffRole) => {
    setQuickAddRole(role);
    setIsAddStaffMemberDialogOpen(true);
  };

  const handleSaveAssignedStaff = (name: string, target: AssignStaffTarget) => {
      if (target.techId) {
        setTechs((prev) => prev.map((t) => (t.id === target.techId ? { ...t, name } : t)));
      } else if (target.nurseId) {
        const updater = (prev: Nurse[]) =>
          prev.map((n) => (n.id === target.nurseId ? { ...n, name } : n));
        if (isOncomingShiftSetup) {
          setOncomingNurses(updater);
        } else {
          setNurses(updater);
        }
      } else {
        setNurses((prev) => prev.map((n) => (n.role === target.role ? { ...n, name } : n)));
      }
      toast({ title: "Staff Assigned", description: `${name} has been assigned as the ${target.role}.` });
      setIsAssignStaffDialogOpen(false);
      setAssignTarget(null);
  };

  const handleOncomingAssignNurse = (nurseId: string) => {
    const nurse = oncomingNurses.find((n) => n.id === nurseId);
    if (!nurse) return;
    setAssignTarget({ role: nurse.role, nurseId });
    setIsAssignStaffDialogOpen(true);
  };

  const handleShiftMakerOpenChange = async (open: boolean) => {
    if (!open && isOncomingShiftSetup) {
      try {
        await nurseService.saveOncomingNurses(currentLayoutName, oncomingNurses);
        toast({
          title: 'Oncoming draft saved',
          description: 'Assignments are preserved until you activate the shift.',
        });
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Save failed',
          description: 'Could not save oncoming shift draft.',
        });
      }
    }
    setIsShiftMakerOpen(open);
  };

  const handleQuickNote = (patient: Patient) => {
    setQuickNotePatient(patient);
  };

  const handleAcceptQuickNote = async (patientId: string, noteText: string) => {
    const employeeId = currentUser?.employeeNumber ?? 'unknown';
    const stamp = new Date().toLocaleString();
    const entry = `[${stamp} - ${employeeId}] ${noteText}`;
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      const existing = p.notes?.trim();
      return { ...p, notes: existing ? `${existing}\n${entry}` : entry };
    });
    setPatients(updated);
    await patientService.savePatients(currentLayoutName, updated);
    setQuickNotePatient(null);
    toast({ title: 'Note added', description: 'Quick note appended to patient chart.' });
  };

  const handleRemoveStaff = (role: StaffRole) => {
    setNurses(prev => prev.map(n => {
      if (n.role === role) {
        return { ...n, name: 'Unassigned' };
      }
      return n;
    }));
    toast({ title: "Staff Removed", description: `The ${role} has been unassigned.` });
  };
  
  const handleAddSpectra = async (newId: string) => {
    const result = await spectraService.addSpectra(newId, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: "Spectra Added", description: `Device ${newId.trim().toUpperCase()} added to the pool.` });
    } else if (result.error) {
      toast({ variant: "destructive", title: "Error Adding Spectra", description: result.error });
    }
  };
  
  const handleToggleSpectraStatus = async (id: string, inService: boolean) => {
    const result = await spectraService.toggleSpectraStatus(id, inService, spectraPool, [...nurses, ...oncomingNurses], techs);
    if (result.newPool) {
        setSpectraPool(result.newPool);
    } else if (result.error) {
        toast({ variant: "destructive", title: "Cannot Disable", description: result.error });
    }
  };

  const handleSetSpectraStatus = async (id: string, status: SpectraStatus) => {
    const result = await spectraService.updateDeviceStatus(id, status, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: 'Device Updated', description: `${id} set to ${status}.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Update Device', description: result.error });
    }
  };

  const handleAssignSpectraToStaff = async (id: string, staffName: string) => {
    const result = await spectraService.assignDeviceToStaff(id, staffName, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: 'Device Assigned', description: `${id} assigned to ${staffName}.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Assign Device', description: result.error });
    }
  };

  const handleUnassignSpectra = async (id: string) => {
    const result = await spectraService.unassignDevice(id, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: 'Device Unassigned', description: `${id} is now unassigned.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Unassign Device', description: result.error });
    }
  };

  const handleAddSpectraLog = async (id: string, message: string) => {
    const result = await spectraService.addDeviceLog(id, message, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: 'Log Added', description: `Log saved for ${id}.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Save Log', description: result.error });
    }
  };

  const handleCreateRoom = async (designation: string) => {
    const result = await patientService.createRoom(designation, patients, nurses, techs);
    if (result.newPatients) {
      setPatients(result.newPatients);
      setIsAddRoomDialogOpen(false);
      toast({
        title: "Room Created",
        description: `Room "${designation}" has been added to the grid.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Could Not Create Room",
        description: result.error,
      });
    }
  };

  const handleCreateUnit = async (data: CreateUnitPayload) => {
    try {
        await layoutService.createFullUnitFromPayload(data);
        await loadBoardForLayout(data.designation);
        toast({
            title: "Unit Created",
            description: `Unit "${data.designation}" has been created.`,
        });
    } catch (error) {
        console.error("Failed to create new unit:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: "destructive",
            title: "Error Creating Unit",
            description: errorMessage,
        });
        throw error;
    }
  };

  const handleSyncEpicCensus = async () => {
    setIsSyncingEpic(true);
    try {
      const result = await syncEpicCensus(patients, currentUser?.employeeNumber);
      setPatients(result.rooms);
      await patientService.savePatients(currentLayoutName, result.rooms);
      toast({
        title: result.source === 'epic' ? 'Epic census updated' : 'Sandbox census loaded',
        description: `${result.matched} rooms matched, ${result.filledVacant} vacant rooms filled.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Epic sync failed',
        description: error instanceof Error ? error.message : 'Could not load Epic FHIR data.',
      });
    } finally {
      setIsSyncingEpic(false);
    }
  };

  const handleInsertMockData = async () => {
    const { updatedPatients, insertedCount } = await patientService.insertMockPatients(patients);
    if (insertedCount > 0) {
      setPatients(updatedPatients);
      toast({
        title: "Mock Data Inserted",
        description: `${insertedCount} mock patients have been added to vacant rooms.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "No Vacant Rooms",
        description: "Could not insert mock data because there are no available vacant rooms.",
      });
    }
  };

  const handleSaveAssignmentPrintLayout = useCallback(
    async (config: AssignmentPrintLayoutConfig) => {
      await printLayoutService.saveAssignmentPrintLayout(currentLayoutName, config);
      setAssignmentPrintLayout(config);
      toast({ title: 'Print layout saved', description: 'Assignment print layout updated for this unit.' });
    },
    [currentLayoutName, toast],
  );

  const handlePatientDragStart = useCallback((
    e: React.DragEvent<HTMLDivElement>,
    patientId: string,
    originalGridRow: number,
    originalGridColumn: number
  ) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingNurseInfo(null);
    setDraggingTechInfo(null);
    setDraggingPatientInfo({ id: patientId, originalGridRow, originalGridColumn });
    e.dataTransfer.setData('text/plain', patientId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);
  
  const handleNurseDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, nurseId: string) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingPatientInfo(null);
    setDraggingTechInfo(null);
    setDraggingNurseInfo({ id: nurseId });
    e.dataTransfer.setData('text/plain', nurseId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);

  const handleTechDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, techId: string) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingTechInfo({ id: techId });
    e.dataTransfer.setData('text/plain', techId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);


  const handleDropOnCell = useCallback((targetRow: number, targetCol: number) => {
    if (isLayoutLocked) return;

    if (draggingPatientInfo) {
        const { id: draggedPatientId, originalGridRow, originalGridColumn } = draggingPatientInfo;
        setPatients(prevPatients => {
            const newPatients = prevPatients.map(p => ({...p}));
            const draggedPatient = newPatients.find(p => p.id === draggedPatientId);
            if (!draggedPatient) return prevPatients;

            const patientInTargetCell = newPatients.find(p => p.gridRow === targetRow && p.gridColumn === targetCol && p.id !== draggedPatientId);
            
            // Update positions
            draggedPatient.gridRow = targetRow;
            draggedPatient.gridColumn = targetCol;

            if (patientInTargetCell) {
                patientInTargetCell.gridRow = originalGridRow;
                patientInTargetCell.gridColumn = originalGridColumn;
            }

            // Save to database
            patientService.savePatients(currentLayoutName, newPatients);
            
            return newPatients;
        });
    }

    if (draggingNurseInfo) {
      const { id: draggedNurseId } = draggingNurseInfo;
      setNurses(prevNurses => {
        const newNurses = prevNurses.map(n => ({ ...n }));
        const draggedNurse = newNurses.find(n => n.id === draggedNurseId);
        if (!draggedNurse) return prevNurses;
        
        const cardHeight = getNurseRowSpan(draggedNurse);
        const newRow = Math.min(targetRow, NUM_ROWS_GRID - (cardHeight - 1)); 

        const targetCells = [];
        for (let i=0; i < cardHeight; i++) {
            targetCells.push(`${newRow + i}-${targetCol}`);
        }

        const isOccupiedByPatient = patients.some(p => targetCells.includes(`${p.gridRow}-${p.gridColumn}`));
        const isOccupiedByOtherNurse = newNurses.some(nurse => {
          if (nurse.id === draggedNurseId) return false;
          if (nurse.gridColumn !== targetCol) return false;
          
          const otherCardHeight = getNurseRowSpan(nurse);
          const otherTop = nurse.gridRow;
          const otherBottom = nurse.gridRow + otherCardHeight -1;

          return newRow <= otherBottom && (newRow + cardHeight -1) >= otherTop;
        });

        if (isOccupiedByPatient || isOccupiedByOtherNurse) {
          toast({ variant: "destructive", title: "Cannot Move Staff", description: "The target location is occupied." });
          return prevNurses;
        }

        draggedNurse.gridRow = newRow;
        draggedNurse.gridColumn = targetCol;
        
        // Save to database
        nurseService.saveNurses(currentLayoutName, newNurses);
        
        return newNurses;
      });
    }

    if (draggingTechInfo) {
        const { id: draggedTechId } = draggingTechInfo;
        setTechs(prevTechs => {
            const newTechs = prevTechs.map(t => ({...t}));
            const draggedTech = newTechs.find(t => t.id === draggedTechId);
            if (!draggedTech) return prevTechs;

            // Check for conflicts
            const isOccupiedByPatient = patients.some(p => p.gridRow === targetRow && p.gridColumn === targetCol);
            if (isOccupiedByPatient) {
                toast({ variant: "destructive", title: "Cannot Move Tech", description: "The target location is occupied by a patient." });
                return prevTechs;
            }
    
            draggedTech.gridRow = targetRow;
            draggedTech.gridColumn = targetCol;
            
            // Save to database
            nurseService.saveTechs(currentLayoutName, newTechs);
            
            return newTechs;
        });
    }
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingTechInfo(null);
  }, [draggingPatientInfo, draggingNurseInfo, draggingTechInfo, isLayoutLocked, patients, toast, currentLayoutName]);
  
  const handleDragEnd = useCallback(() => {
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingTechInfo(null);
  }, []);

  const handleAutoSave = useCallback(async () => {
    if (isLayoutLocked || !isInitialized) return;
    await saveBoardSnapshot(currentLayoutName, {
      patients,
      nurses,
      oncomingNurses,
      techs,
    });
  }, [patients, nurses, oncomingNurses, techs, isLayoutLocked, currentLayoutName, isInitialized]);

  const handleDropOnNurseSlot = useCallback((targetNurseId: string, _slotIndex: number) => {
    if (!draggingPatientInfo) return;
    const draggedPatientId = draggingPatientInfo.id;
    const dropResultRef = { current: null as { nurses: Nurse[]; patients: Patient[] } | null };

    setPatients((currentPatients) => {
      setNurses((currentNurses) => {
        const result = applyDropOnNurseSlot(
          currentPatients,
          currentNurses,
          draggedPatientId,
          targetNurseId,
        );
        if (result) {
          dropResultRef.current = result;
          return result.nurses;
        }
        return currentNurses;
      });
      return dropResultRef.current?.patients ?? currentPatients;
    });

    setDraggingPatientInfo(null);
  }, [draggingPatientInfo]);

  useEffect(() => {
    if (!isInitialized) return;
    setPatients((prev) => {
      const synced = syncPatientsAssignedNurseFromNurses(prev, nurses);
      if (synced.every((p, i) => p === prev[i])) return prev;
      return synced;
    });
  }, [nurses, isInitialized]);

  const handleClearNurseAssignments = useCallback((nurseId: string) => {
    let newPatients = [...patients];
    let newNurses = [...nurses];

    const nurseToClear = newNurses.find(n => n.id === nurseId);
    if (!nurseToClear) return;
    
    const patientIdsToClear = nurseToClear.assignedPatientIds.filter(id => id !== null);
    
    newPatients = newPatients.map(p => {
        if (patientIdsToClear.includes(p.id)) {
            return { ...p, assignedNurse: undefined };
        }
        return p;
    });

    newNurses = newNurses.map(n => {
        if (n.id === nurseId) {
            return { ...n, assignedPatientIds: Array(Math.max(1, n.assignedPatientIds.length)).fill(null) };
        }
        return n;
    });
    
    setNurses(newNurses);
    setPatients(newPatients);
  }, [patients, nurses]);


  useEffect(() => {
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized || isLayoutLocked) {
      return;
    }
    if (skipFirstAutoSaveRef.current) {
      skipFirstAutoSaveRef.current = false;
      return;
    }
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      void handleAutoSave();
    }, 150);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [patients, nurses, oncomingNurses, techs, isInitialized, isLayoutLocked, handleAutoSave]);

  useEffect(() => {
    const admittedPatients = patients
      .filter((p) => isOccupiedBed(p.name) && !p.isBlocked)
      .sort((a, b) => a.bedNumber - b.bedNumber);

    const assignedTechs = techs.filter((tech) => {
      const normalizedName = tech.name.trim().toLowerCase();
      return normalizedName.length > 0 && normalizedName !== 'unassigned';
    });

    if (assignedTechs.length === 0) {
      const anyNonEmptyGroups = techs.some((tech) => (tech.assignmentGroup ?? '').trim().length > 0);
      if (anyNonEmptyGroups) {
        setTechs((prev) => prev.map((tech) => ({ ...tech, assignmentGroup: '' })));
      }
      return;
    }

    const totalPatients = admittedPatients.length;
    const baseLoad = Math.floor(totalPatients / assignedTechs.length);
    const remainder = totalPatients % assignedTechs.length;

    let cursor = 0;
    const nextGroupByTechId = new Map<string, string>();
    assignedTechs.forEach((tech, index) => {
      const groupSize = baseLoad + (index < remainder ? 1 : 0);
      const groupPatients = admittedPatients.slice(cursor, cursor + groupSize);
      cursor += groupSize;

      if (groupPatients.length === 0) {
        nextGroupByTechId.set(tech.id, '');
      } else {
        const firstRoom = groupPatients[0].roomDesignation;
        const lastRoom = groupPatients[groupPatients.length - 1].roomDesignation;
        nextGroupByTechId.set(tech.id, firstRoom === lastRoom ? firstRoom : `${firstRoom} - ${lastRoom}`);
      }
    });

    const needsUpdate = techs.some((tech) => {
      const nextGroup = nextGroupByTechId.get(tech.id) ?? '';
      return (tech.assignmentGroup ?? '') !== nextGroup;
    });

    if (!needsUpdate) return;

    setTechs((prev) =>
      prev.map((tech) => ({
        ...tech,
        assignmentGroup: nextGroupByTechId.get(tech.id) ?? '',
      }))
    );
  }, [patients, techs]);
    
  const censusStats = useMemo(
    () => computeUnitCensusStats(patients, nurses, techs, patientsPerNurse),
    [patients, nurses, techs, patientsPerNurse],
  );
  const dnrCount = patients.filter(p => p.isComfortCareDNR).length;
  const restraintCount = patients.filter(p => p.isInRestraints).length;
  const foleyCount = patients.filter(p => Array.isArray(p.ldas) && p.ldas.some(lda => lda.toLowerCase().includes('foley'))).length;
  const centralLineCount = useMemo(
    () =>
      patients.filter(
        (p) =>
          isOccupiedBed(p.name) &&
          (p.ldas ?? []).some((lda) => {
            const l = lda.toLowerCase();
            return l.includes('central') || l.includes('picc') || l.includes('midline');
          })
      ).length,
    [patients]
  );
  const tubeFeedCount = useMemo(
    () =>
      patients.filter(
        (p) =>
          isOccupiedBed(p.name) &&
          (p.ldas ?? []).some((lda) => {
            const l = lda.toLowerCase();
            return l.includes('tube feed') || l.includes('ng') || l.includes('peg');
          })
      ).length,
    [patients]
  );
  const isolationCount = useMemo(
    () => patients.filter((p) => isOccupiedBed(p.name) && p.isIsolation).length,
    [patients]
  );
  const involuntaryHoldCount = useMemo(
    () => patients.filter((p) => isOccupiedBed(p.name) && patientHasInvoluntaryHold(p)).length,
    [patients]
  );
  const sitterCount = useMemo(
    () => countPatientsRequiringSitter(patients, nurses),
    [patients, nurses]
  );
  const nameAlertGroups = useMemo(() => {
    const groups = computeNameAlertGroups(patients);
    return groups.filter((g) => !acknowledgedNameAlertSignatures.has(getNameAlertSignature(g)));
  }, [patients, acknowledgedNameAlertSignatures]);

  const handleAcknowledgeNameAlerts = useCallback(() => {
    setAcknowledgedNameAlertSignatures((prev) => {
      const next = new Set(prev);
      for (const group of computeNameAlertGroups(patients)) {
        next.add(getNameAlertSignature(group));
      }
      return next;
    });
  }, [patients]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        unitName={`${getFriendlyLayoutName(currentLayoutName)}${isOncomingShiftSetup ? ' (Oncoming shift setup)' : ''}`}
        censusStats={censusStats}
        dnrCount={dnrCount}
        restraintCount={restraintCount}
        foleyCount={foleyCount}
        isolationCount={isolationCount}
        sitterCount={sitterCount}
        involuntaryHoldCount={involuntaryHoldCount}
        centralLineCount={centralLineCount}
        tubeFeedCount={tubeFeedCount}
        nameAlertGroups={roleCaps.canSeePatientIdentifiers ? nameAlertGroups : []}
        onAcknowledgeNameAlerts={handleAcknowledgeNameAlerts}
        canEdit={!roleCaps.isReadOnly}
        onPrint={(type) => void handlePrint(type)}
        onConfigureAssignmentPrint={() => setIsPrintLayoutDialogOpen(true)}
      />
      <main className="flex-grow flex overflow-hidden print-hide relative pb-16">
        <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
            <PatientGrid
              patients={patients}
              nurses={nurses}
              techs={techs}
              isInitialized={isInitialized}
              isEffectivelyLocked={isEffectivelyLocked}
              draggingPatientInfo={draggingPatientInfo}
              draggingNurseInfo={draggingNurseInfo}
              draggingTechInfo={draggingTechInfo}
              onSelectPatient={setSelectedPatient}
              onPatientDragStart={handlePatientDragStart}
              onNurseDragStart={handleNurseDragStart}
              onTechDragStart={handleTechDragStart}
              onDropOnCell={handleDropOnCell}
              handleDropOnNurseSlot={handleDropOnNurseSlot}
              onClearNurseAssignments={handleClearNurseAssignments}
              onDragEnd={handleDragEnd}
              onAdmitPatient={handleOpenAdmitDialog}
              onUpdatePatient={handleOpenUpdateDialog}
              onDischargePatient={handleDischargeRequest}
              onToggleBlockRoom={handleToggleBlockRoom}
              onEditDesignation={(patient) => setPatientToEditDesignation(patient)}
              onRemoveNurse={handleRemoveNurse}
              onDeleteRoom={handleDeleteRoom}
              onRemoveTech={handleRemoveTech}
              onAssignStaff={handleAssignStaff}
              onAssignNurse={handleAssignNurse}
              onAssignTech={handleAssignTech}
              onResizeNurseCardRowSpan={handleResizeNurseCardRowSpan}
              onQuickAddStaff={handleQuickAddStaff}
              onRemoveStaff={handleRemoveStaff}
              onQuickNote={roleCaps.isReadOnly ? undefined : handleQuickNote}
              onCompleteTransport={roleCaps.isReadOnly ? undefined : handleCompleteTransport}
              onZoomControlsChange={setGridZoomControls}
              canSeePatientIdentifiers={roleCaps.canSeePatientIdentifiers}
              isReadOnly={roleCaps.isReadOnly}
            />
        {!roleCaps.isReadOnly && (
        <div className="border-t px-4 py-2 flex justify-end shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAddStaff('Staff Nurse')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Nurse Card
          </Button>
        </div>
        )}
        </div>
        <aside
          className={cn(
            "hidden lg:flex shrink-0 flex-col min-h-0 border-l bg-card transition-[width] duration-200 ease-in-out overflow-hidden",
            isSpectraPanelExpanded ? "w-1/3 max-w-md min-w-[16rem]" : "w-9"
          )}
        >
          {isSpectraPanelExpanded ? (
            <SpectralinkDeviceTable
              title="Spectra"
              spectraPool={spectraPool}
              nurses={nurses}
              techs={techs}
              onAssignDevice={handleAssignSpectraToStaff}
              onUnassignDevice={handleUnassignSpectra}
              onSetStatus={handleSetSpectraStatus}
              onAddLog={handleAddSpectraLog}
              onManageSpectra={roleCaps.canManageSpectra ? () => setIsManageSpectraDialogOpen(true) : undefined}
              canManageSpectra={roleCaps.canManageSpectra}
              canManageDeviceLogs={roleCaps.isAdmin}
              onRequestCollapse={() => setIsSpectraPanelExpanded(false)}
            />
          ) : (
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-2 h-full w-full py-4 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              onClick={() => setIsSpectraPanelExpanded(true)}
              aria-label={`Expand Spectra panel (${spectraPool.length} devices)`}
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl] rotate-180">
                Spectra
              </span>
              {spectraPool.length > 0 && (
                <span className="text-[10px] font-medium tabular-nums">{spectraPool.length}</span>
              )}
            </button>
          )}
        </aside>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="lg:hidden fixed bottom-16 right-4 z-40 shadow-lg print-hide"
          onClick={() => setIsSpectraMobileOpen(true)}
        >
          <Radio className="w-4 h-4 mr-2" />
          Spectra ({spectraPool.length})
        </Button>
        <Sheet open={isSpectraMobileOpen} onOpenChange={setIsSpectraMobileOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Spectralink devices</SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              <SpectralinkDeviceTable
                title="Spectra"
                spectraPool={spectraPool}
                nurses={nurses}
                techs={techs}
                onAssignDevice={handleAssignSpectraToStaff}
                onUnassignDevice={handleUnassignSpectra}
                onSetStatus={handleSetSpectraStatus}
                onAddLog={handleAddSpectraLog}
                onManageSpectra={roleCaps.canManageSpectra ? () => setIsManageSpectraDialogOpen(true) : undefined}
                canManageSpectra={roleCaps.canManageSpectra}
                canManageDeviceLogs={roleCaps.isAdmin}
              />
            </div>
          </SheetContent>
        </Sheet>
      </main>
      <UnitActionBar
        canEdit={!roleCaps.isReadOnly}
        showAdminTools={roleCaps.isAdmin}
        onAdmitPatient={() => handleOpenAdmitDialog(null)}
        onAddStaffMember={() => setIsAddStaffMemberDialogOpen(true)}
        onSetupOncomingShift={roleCaps.isReadOnly ? undefined : handleSetupOncomingShift}
        onSaveAssignments={handleSaveAssignments}
        onAddRoom={roleCaps.isAdmin ? () => setIsAddRoomDialogOpen(true) : undefined}
        onCreateUnit={roleCaps.isAdmin ? () => setIsCreateUnitDialogOpen(true) : undefined}
        onInsertMockData={roleCaps.isAdmin ? handleInsertMockData : undefined}
        onSaveLayout={roleCaps.isAdmin ? handleOpenSaveDialog : undefined}
        onSyncEpicCensus={
          !roleCaps.isReadOnly && (roleCaps.isAdmin || getConfiguredDataSource() === 'epic_fhir')
            ? () => void handleSyncEpicCensus()
            : undefined
        }
        isSyncingEpic={isSyncingEpic}
        zoomControls={gridZoomControls}
        onLeaveUnit={onBackToDashboard}
        wallpaperActive={wallpaperActive}
        onToggleWallpaper={
          window.electronAPI?.wallpaperStart ? () => void handleToggleWallpaper() : undefined
        }
      />
      <PrintableReport
        patients={patients}
        facilityProfile={facilityProfile}
        layoutConfig={assignmentPrintLayout}
      />
      <PrintableAssignments 
        unitName={getFriendlyLayoutName(currentLayoutName)}
        chargeNurseName={getChargeNurseName()}
        nurses={nurses}
        techs={techs}
        patients={patients}
        layoutConfig={assignmentPrintLayout}
        facilityProfile={facilityProfile}
      />
      <ReportSheet
        patient={selectedPatient}
        nurses={nurses}
        techs={techs}
        open={!!selectedPatient}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedPatient(null);
          }
        }}
        onDischarge={handleDischargeRequest}
        onEditPatient={(patient) => {
          setSelectedPatient(null);
          handleOpenUpdateDialog(patient);
        }}
        onRefreshFromEpic={roleCaps.isReadOnly ? undefined : handleRefreshFromEpic}
        isEpicSyncing={isEpicSyncing}
        canSeePatientIdentifiers={roleCaps.canSeePatientIdentifiers}
        isReadOnly={roleCaps.isReadOnly}
      />
      <SaveLayoutDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSaveNewLayout}
        existingLayoutNames={availableLayouts}
      />
      <AdmitPatientDialog
        open={!!admitOrUpdatePatient}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setAdmitOrUpdatePatient(null);
            setIsUpdateMode(false);
          }
        }}
        onSave={handleSavePatient}
        patients={patients}
        nurses={nurses}
        patientToEdit={admitOrUpdatePatient}
        isUpdateMode={isUpdateMode}
      />
      <AddStaffMemberDialog
        open={isAddStaffMemberDialogOpen}
        onOpenChange={setIsAddStaffMemberDialogOpen}
        onSave={handleSaveStaffMember}
        spectraPool={spectraPool}
        nurses={nurses}
        techs={techs}
        initialRole={quickAddRole}
      />
       <AssignStaffDialog
        open={isAssignStaffDialogOpen}
        onOpenChange={() => {
          setIsAssignStaffDialogOpen(false);
          setAssignTarget(null);
        }}
        target={assignTarget}
        onSave={handleSaveAssignedStaff}
      />
      <AddRoomDialog
        open={isAddRoomDialogOpen}
        onOpenChange={setIsAddRoomDialogOpen}
        onSave={handleCreateRoom}
        existingDesignations={patients.map(p => p.roomDesignation)}
      />
      <CreateUnitDialog
        open={isCreateUnitDialogOpen}
        onOpenChange={setIsCreateUnitDialogOpen}
        onSave={handleCreateUnit}
        existingLayoutNames={availableLayouts}
      />
       <EditRoomDesignationDialog
        open={!!patientToEditDesignation}
        onOpenChange={(isOpen) => !isOpen && setPatientToEditDesignation(null)}
        patient={patientToEditDesignation}
        onSave={handleSaveRoomDesignation}
        existingDesignations={patients.map(p => p.roomDesignation)}
      />
      <ManageSpectraDialog
        open={isManageSpectraDialogOpen}
        onOpenChange={setIsManageSpectraDialogOpen}
        spectraPool={spectraPool}
        onAddSpectra={handleAddSpectra}
        onToggleStatus={handleToggleSpectraStatus}
      />
      <DischargeConfirmationDialog
        open={!!patientToDischarge}
        onOpenChange={(isOpen) => !isOpen && setPatientToDischarge(null)}
        patient={patientToDischarge}
        onConfirm={handleConfirmDischarge}
      />
      <ShiftMakerDialog
        open={isShiftMakerOpen}
        onOpenChange={(open) => void handleShiftMakerOpenChange(open)}
        nurses={oncomingNurses}
        patients={patients}
        onPatientDragStart={handlePatientDragStart}
        onDragEnd={handleDragEnd}
        onDropOnNurseSlot={handleOncomingDropOnNurseSlot}
        onClearNurseAssignments={handleOncomingClearNurseAssignments}
        spectraPool={spectraPool}
        techs={techs}
        onAssignSpectra={handleOncomingAssignSpectra}
        onUnassignSpectra={handleOncomingUnassignSpectra}
        onSetSpectraStatus={handleSetSpectraStatus}
        onAddSpectraLog={handleAddSpectraLog}
        onActivateOncomingShift={handleActivateOncomingShift}
        onAddNurseCard={handleOncomingAddNurseCard}
        onRemoveNurseCard={handleOncomingRemoveNurse}
        onAssignNurse={handleOncomingAssignNurse}
      />
      <QuickNoteDialog
        patient={quickNotePatient}
        open={!!quickNotePatient}
        onOpenChange={(open) => !open && setQuickNotePatient(null)}
        onAccept={handleAcceptQuickNote}
      />
      <AssignmentPrintLayoutDialog
        open={isPrintLayoutDialogOpen}
        onOpenChange={setIsPrintLayoutDialogOpen}
        layoutName={currentLayoutName}
        unitDisplayName={getFriendlyLayoutName(currentLayoutName)}
        chargeNurseName={getChargeNurseName()}
        nurses={nurses}
        techs={techs}
        patients={patients}
        initialConfig={assignmentPrintLayout}
        facilityProfile={facilityProfile}
        onSave={handleSaveAssignmentPrintLayout}
        onPrint={(config, reportType) => {
          setAssignmentPrintLayout(config);
          window.setTimeout(() => void handlePrint(reportType), 50);
        }}
      />
      <footer className="text-center py-2 px-4 pb-14 text-xs text-muted-foreground border-t print-hide">
        UnitView &copy; {currentYear !== null ? currentYear : ''}
      </footer>
    </div>
  );
}

    
