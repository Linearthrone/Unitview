
"use client";

import type { Patient, MobilityStatus } from '@/types/patient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  BedDouble,
  Accessibility,
  Footprints,
  Ban,
  UserPlus,
  UserMinus,
  Edit,
  Lock,
  Unlock,
  Trash2,
  Mars,
  Venus,
  StickyNote,
  Car,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPatientNurseAssigned } from '@/lib/nurse-assignment-sync';
import { isAwaitingTransport } from '@/lib/patient-status-helpers';
import { getPatientSafetyMarks } from '@/lib/safety-marks';
import { SafetyMarkBadge } from '@/components/safety-mark-badge';

interface PatientBlockProps {
  patient: Patient;
  isDragging?: boolean;
  isEffectivelyLocked?: boolean;
  onSelectPatient: (patient: Patient) => void;
  onAdmit: (patient: Patient) => void;
  onUpdate: (patient: Patient) => void;
  onDischarge: (patient: Patient) => void;
  onToggleBlock: (patientId: string) => void;
  onEditDesignation: (patient: Patient) => void;
  onDeleteRoom?: (patientId: string) => void;
  onQuickNote?: (patient: Patient) => void;
  onCompleteTransport?: (patient: Patient) => void;
  /** WALLDISPLAY and privacy — hide patient names/PHI. */
  canSeePatientIdentifiers?: boolean;
  isReadOnly?: boolean;
  hasNameAlert?: boolean;
}


const mobilityIcons: Record<MobilityStatus, LucideIcon> = {
  'Bed Rest': BedDouble,
  'Assisted': Accessibility,
  'Independent': Footprints,
};

const PatientBlock: React.FC<PatientBlockProps> = ({ 
  patient, 
  isDragging, 
  isEffectivelyLocked,
  onSelectPatient,
  onAdmit,
  onUpdate,
  onDischarge,
  onToggleBlock,
  onEditDesignation,
  onDeleteRoom,
  onQuickNote,
  onCompleteTransport,
  canSeePatientIdentifiers = true,
  isReadOnly = false,
  hasNameAlert = false,
}) => {
  const isVacant = patient.name === 'Vacant';
  const { isBlocked } = patient;
  const nurseAssigned = isPatientNurseAssigned(patient.assignedNurse);

  const handleCardClick = () => {
    if (isBlocked) return;
    onSelectPatient(patient);
  }

  if (isVacant && !isBlocked) {
    return (
       <ContextMenu>
        <ContextMenuTrigger disabled={isEffectivelyLocked || isReadOnly}>
          <Card 
            onClick={handleCardClick}
            className="flex flex-col h-full bg-muted/40 border-2 border-dashed border-border cursor-pointer"
            title={`View report for ${patient.roomDesignation}`}
          >
            <CardHeader className="p-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{patient.roomDesignation}</span>
                <Badge variant="secondary" className="text-base">Vacant</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-grow flex items-center justify-center">
              <span className="text-muted-foreground text-base">Room Available</span>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {!isReadOnly && (
            <>
          <ContextMenuItem onClick={() => onAdmit(patient)}>
            <UserPlus className="mr-2 h-4 w-4" /> Admit Patient
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onEditDesignation(patient)}>
            <Edit className="mr-2 h-4 w-4" /> Change Designation
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
            <Lock className="mr-2 h-4 w-4" /> Block Room
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => onDeleteRoom?.(patient.id)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Room
          </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  }
  
  const MobilityIcon = mobilityIcons[patient.mobility];

  const formatDate = (date: Date): string => {
    try {
      if (isNaN(date.getTime())) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
    } catch {
      return 'N/A'
    }
  };

  const getNameBadgeColor = () => {
    if (patient.isComfortCareDNR) {
      return "bg-purple-300 dark:bg-purple-900 border-purple-500 dark:border-purple-700 text-purple-900 dark:text-purple-100";
    }
    return "bg-card border-border text-foreground";
  };

  const GenderIcon = patient.gender === 'Male' ? Mars : patient.gender === 'Female' ? Venus : null;
  const genderIconColor =
    patient.gender === 'Male'
      ? 'text-sky-600 dark:text-sky-400'
      : patient.gender === 'Female'
        ? 'text-pink-600 dark:text-pink-400'
        : 'text-muted-foreground';

  const alerts = getPatientSafetyMarks(patient, { hasNameAlert });

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={isEffectivelyLocked || isReadOnly}>
        <Card 
          onClick={handleCardClick}
          className={cn(
            "relative flex flex-col h-full transition-shadow duration-200",
            isBlocked ? "cursor-not-allowed bg-black dark:bg-gray-900 border-gray-700" : "cursor-pointer bg-card border-border",
            !isBlocked && nurseAssigned && "border-2 border-border",
            !isBlocked && !nurseAssigned && !isVacant && "border-2 border-destructive",
            isDragging ? "opacity-50 ring-2 ring-primary" : ""
          )}
          data-patient-id={patient.id}
          title={isBlocked ? `${patient.roomDesignation} is blocked` : `View report for ${patient.roomDesignation}`}
        >
          {GenderIcon && canSeePatientIdentifiers && (
            <div className={cn("absolute top-1.5 left-1.5 z-[1]", genderIconColor)} aria-hidden>
              <GenderIcon className="h-4 w-4" strokeWidth={2.5} />
            </div>
          )}
          {isBlocked && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded-lg">
              <Ban className="h-12 w-12 text-white/80" />
            </div>
          )}
          <CardHeader className="p-3">
            <CardTitle className="text-lg font-normal">
                <div className="flex justify-between items-start">
                    <div className="font-bold">
                        {patient.roomDesignation}
                    </div>
                     {!isVacant && (
                      <div className="text-right text-base leading-tight">
                          <div>
                              <span className="font-normal">Admit </span>
                              {formatDate(patient.admitDate)}
                          </div>
                          <div>
                              <span className="font-normal">EDD </span>
                              {formatDate(patient.dischargeDate)}
                          </div>
                      </div>
                    )}
                </div>
                 <div className="pt-1">
                    {canSeePatientIdentifiers ? (
                      <Badge
                        variant={"outline"}
                        className={cn(
                          "font-semibold text-base truncate block w-full text-center py-1 px-2 border",
                          getNameBadgeColor(),
                          isAwaitingTransport(patient) && "border-sky-500 bg-sky-50 dark:bg-sky-950"
                        )}
                        title={patient.name}
                      >
                          {patient.name}
                          {isAwaitingTransport(patient) && (
                            <span className="block text-base font-medium text-sky-700 dark:text-sky-300">
                              Awaiting transport
                            </span>
                          )}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-semibold text-base block w-full text-center py-1">
                        Occupied
                      </Badge>
                    )}
                </div>
                {!isVacant && !isBlocked && (
                  <div className="pt-2 flex justify-center">
                    {nurseAssigned ? (
                      <span
                        data-assignment-mark="assigned"
                        className="inline-flex items-center gap-1.5 border-2 border-solid border-foreground px-1.5 py-0.5 text-base font-semibold leading-none bg-card"
                      >
                        <span className="inline-flex h-3.5 w-3.5 items-center justify-center border-2 border-current text-[0.7rem] leading-none" aria-hidden>
                          ✓
                        </span>
                        <span>{canSeePatientIdentifiers && patient.assignedNurse ? patient.assignedNurse : 'Assigned'}</span>
                      </span>
                    ) : (
                      <span
                        data-assignment-mark="unassigned"
                        className="inline-flex items-center gap-1.5 border-2 border-destructive px-1.5 py-0.5 text-base font-semibold leading-none text-destructive bg-card"
                      >
                        <span className="inline-block h-3.5 w-3.5 border-2 border-current text-center leading-none" aria-hidden>
                          !
                        </span>
                        <span>No nurse</span>
                      </span>
                    )}
                  </div>
                )}
            </CardTitle>
          </CardHeader>
           {!isVacant && (
            <>
              <CardContent className="p-3 flex-grow space-y-2 text-base">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <MobilityIcon className="h-5 w-5 text-primary shrink-0" strokeWidth={2.5} aria-hidden />
                  <span>{patient.mobility}</span>
                </div>
                {patient.pendingProcedures && canSeePatientIdentifiers && (
                  <p className="text-base pt-1 border-t mt-2">
                    <span className="font-semibold">Pending: </span>
                    {patient.pendingProcedures.length > 50
                      ? `${patient.pendingProcedures.substring(0, 47)}...`
                      : patient.pendingProcedures}
                  </p>
                )}
                {patient.notes && canSeePatientIdentifiers && (
                  <p className="text-base pt-1 border-t mt-2">
                    <span className="font-semibold">Notes: </span>
                    {patient.notes.length > 50 ? `${patient.notes.substring(0, 47)}...` : patient.notes}
                  </p>
                )}
              </CardContent>
              {alerts.length > 0 && (
                <CardFooter className="p-3 border-t">
                  <div className="flex gap-1.5 flex-wrap" role="list" aria-label="Safety marks">
                    {alerts.map((mark) => (
                      <SafetyMarkBadge key={mark.id} mark={mark} size="card" showLabel={false} />
                    ))}
                  </div>
                </CardFooter>
              )}
            </>
          )}
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isBlocked ? (
          !isReadOnly && (
          <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
            <Unlock className="mr-2 h-4 w-4" /> Unblock Room
          </ContextMenuItem>
          )
        ) : (
          !isReadOnly && (
          <>
            <ContextMenuItem onClick={() => onUpdate(patient)} disabled={isVacant}>
              <Edit className="mr-2 h-4 w-4" /> Update Info
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onAdmit(patient)} disabled={!isVacant}>
              <UserPlus className="mr-2 h-4 w-4" /> Admit Patient
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onDischarge(patient)} disabled={isVacant || isAwaitingTransport(patient)}>
              <UserMinus className="mr-2 h-4 w-4" /> Discharge Patient
            </ContextMenuItem>
            {isAwaitingTransport(patient) && onCompleteTransport && (
              <ContextMenuItem onClick={() => onCompleteTransport(patient)}>
                <Car className="mr-2 h-4 w-4" /> Complete transport / vacate
              </ContextMenuItem>
            )}
            {onQuickNote && !isVacant && (
              <ContextMenuItem onClick={() => onQuickNote(patient)}>
                <StickyNote className="mr-2 h-4 w-4" /> Quick note
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onEditDesignation(patient)}>
              <Edit className="mr-2 h-4 w-4" /> Change Designation
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
              <Lock className="mr-2 h-4 w-4" /> Block Room
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDeleteRoom?.(patient.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Room
            </ContextMenuItem>
          </>
          )
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default PatientBlock;
