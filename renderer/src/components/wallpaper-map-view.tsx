import React, { useEffect, useState } from 'react';
import type { WallpaperMapSnapshot } from '@/lib/wallpaper-snapshot';

const EMPTY: WallpaperMapSnapshot = {
  unitName: 'Unit map',
  updatedAt: 0,
  redactPhi: true,
  cols: 17,
  rows: 10,
  patients: [],
  nurses: [],
  techs: [],
};

/**
 * Offscreen / capture-only view of the active unit map for Windows desktop wallpaper.
 * Always renders without interactive chrome; PHI redaction follows the snapshot flag.
 */
export default function WallpaperMapView() {
  const [snapshot, setSnapshot] = useState<WallpaperMapSnapshot>(EMPTY);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onWallpaperSnapshot) {
      return;
    }
    return api.onWallpaperSnapshot((next) => {
      setSnapshot(next);
    });
  }, []);

  const clock =
    snapshot.updatedAt > 0
      ? new Date(snapshot.updatedAt).toLocaleString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : 'Waiting for live feed…';

  return (
    <div
      className="min-h-screen w-screen overflow-hidden text-slate-100"
      style={{
        background:
          'radial-gradient(ellipse at 20% 0%, #1e3a4c 0%, #0b1620 45%, #070d12 100%)',
      }}
    >
      <header className="flex items-end justify-between px-8 pt-6 pb-4 border-b border-white/10">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/70">Unitview</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mt-1">{snapshot.unitName}</h1>
        </div>
        <div className="text-right text-sm text-slate-300/90">
          <div>Live desktop map</div>
          <div className="font-mono text-cyan-100/80">{clock}</div>
          {snapshot.redactPhi && (
            <div className="text-xs text-amber-200/80 mt-1">Patient identifiers hidden</div>
          )}
        </div>
      </header>

      <div
        className="p-4 gap-1.5"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${snapshot.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${snapshot.rows}, minmax(0, 1fr))`,
          height: 'calc(100vh - 5.5rem)',
        }}
      >
        {snapshot.patients.map((patient) => (
          <div
            key={patient.id}
            className="rounded-md border border-white/10 px-1.5 py-1 flex flex-col justify-between overflow-hidden"
            style={{
              gridRow: patient.gridRow,
              gridColumn: patient.gridColumn,
              background: patient.isBlocked
                ? 'rgba(0,0,0,0.65)'
                : patient.isVacant
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(14, 116, 144, 0.35)',
            }}
          >
            <div className="text-[11px] font-bold leading-tight truncate">{patient.roomDesignation}</div>
            <div className="text-[10px] leading-tight truncate opacity-90">
              {patient.isBlocked
                ? 'Blocked'
                : patient.isVacant
                  ? 'Vacant'
                  : patient.displayName || 'Occupied'}
            </div>
            {!patient.isVacant && !patient.isBlocked && (
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {patient.isFallRisk && <Chip label="Fall" />}
                {patient.isIsolation && <Chip label="Iso" />}
                {patient.isComfortCareDNR && <Chip label="DNR" />}
                {patient.awaitingTransport && <Chip label="Tx" />}
              </div>
            )}
          </div>
        ))}

        {snapshot.nurses.map((nurse) => (
          <div
            key={nurse.id}
            className="rounded-md border border-emerald-400/30 bg-emerald-950/50 px-1.5 py-1 overflow-hidden"
            style={{
              gridRow: `${nurse.gridRow} / span ${nurse.cardRowSpan}`,
              gridColumn: nurse.gridColumn,
            }}
          >
            <div className="text-[11px] font-semibold truncate">{nurse.name}</div>
            <div className="text-[10px] opacity-80 truncate">
              {nurse.spectra ? `Spec ${nurse.spectra}` : 'No Spectra'}
            </div>
            <div className="text-[10px] mt-1 opacity-70">
              {nurse.filledSlots}/{nurse.totalSlots} pts
            </div>
          </div>
        ))}

        {snapshot.techs.map((tech) => (
          <div
            key={tech.id}
            className="rounded-md border border-violet-400/30 bg-violet-950/40 px-1.5 py-1 overflow-hidden"
            style={{
              gridRow: tech.gridRow,
              gridColumn: tech.gridColumn,
            }}
          >
            <div className="text-[11px] font-semibold truncate">{tech.name}</div>
            <div className="text-[10px] opacity-80 truncate">
              {tech.spectra ? `Spec ${tech.spectra}` : 'PCT'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-[9px] px-1 rounded bg-black/35 border border-white/15 leading-4">{label}</span>
  );
}
