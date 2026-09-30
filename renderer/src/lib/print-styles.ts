import type { PrintOrientation, PrintStylePreset } from '@/types/assignment-print-layout';

export interface PrintStylePresetMeta {
  id: PrintStylePreset;
  label: string;
  description: string;
  bestFor: string;
  suggestedOrientation: PrintOrientation;
}

export const PRINT_STYLE_PRESET_CATALOG: PrintStylePresetMeta[] = [
  {
    id: 'classic',
    label: 'Classic clinical',
    description: 'Black borders, centered headers — matches the original Unitview handoff sheet.',
    bestFor: 'Familiar charge-nurse printouts',
    suggestedOrientation: 'portrait',
  },
  {
    id: 'modern',
    label: 'Modern clean',
    description: 'Soft slate headers, rounded panels, and balanced whitespace.',
    bestFor: 'Professional handoffs and admin review',
    suggestedOrientation: 'portrait',
  },
  {
    id: 'compact',
    label: 'Compact landscape',
    description: 'Dense type and tight grids to fit more rooms on one page.',
    bestFor: 'Large units, end-of-shift snapshot',
    suggestedOrientation: 'landscape',
  },
  {
    id: 'roster',
    label: 'Roster board',
    description: 'Large staff names with assignment lists — readable from a distance.',
    bestFor: 'Break-room posting, shift huddle',
    suggestedOrientation: 'landscape',
  },
  {
    id: 'high-contrast',
    label: 'High contrast',
    description: 'Bold borders and larger type for low-light or photocopied copies.',
    bestFor: 'Wall copies, night shift',
    suggestedOrientation: 'portrait',
  },
];

export function getPrintPageSizeCss(orientation: PrintOrientation): string {
  return `@page { size: ${orientation === 'landscape' ? 'landscape' : 'portrait'}; margin: 0.4in; }`;
}

export function getPrintRootWidth(orientation: PrintOrientation): string {
  return orientation === 'landscape' ? '11in' : '8.5in';
}

export function getPrintPreviewAspectRatio(orientation: PrintOrientation): string {
  return orientation === 'landscape' ? '11 / 8.5' : '8.5 / 11';
}

/** Style-specific overrides layered on top of base PRINT_REPORT_CSS. */
export function getPrintStylePresetCss(preset: PrintStylePreset): string {
  switch (preset) {
    case 'modern':
      return `
        .uv-print-root.uv-print-style-modern {
          font-family: "Segoe UI", system-ui, sans-serif;
          font-size: 10.5px;
        }
        .uv-print-style-modern .uv-print-nurse-card,
        .uv-print-style-modern .uv-print-tech-panel,
        .uv-print-style-modern .uv-print-sidebar-panel,
        .uv-print-style-modern .uv-print-charge-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: #fff;
        }
        .uv-print-style-modern .uv-print-nurse-card h3,
        .uv-print-style-modern .uv-print-tech-panel h3,
        .uv-print-style-modern .uv-print-sidebar-panel h3 {
          border-bottom: 2px solid #475569;
          color: #1e293b;
          font-size: 12px;
        }
        .uv-print-style-modern .uv-print-header-meta {
          background: #f1f5f9;
          border-radius: 4px;
          padding: 8px 12px;
        }
        .uv-print-style-modern .uv-print-charge-card {
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
        }
      `;
    case 'compact':
      return `
        .uv-print-root.uv-print-style-compact {
          font-size: 9px;
          padding: 10px;
        }
        .uv-print-style-compact .uv-print-nurse-row {
          gap: 4px;
        }
        .uv-print-style-compact .uv-print-nurse-card,
        .uv-print-style-compact .uv-print-tech-panel,
        .uv-print-style-compact .uv-print-sidebar-panel,
        .uv-print-style-compact .uv-print-charge-card {
          border: 1px solid #000;
          padding: 4px 6px;
        }
        .uv-print-style-compact .uv-print-nurse-card h3,
        .uv-print-style-compact .uv-print-tech-panel h3,
        .uv-print-style-compact .uv-print-sidebar-panel h3 {
          font-size: 10px;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .uv-print-style-compact .uv-print-patient-row { margin-bottom: 2px; }
        .uv-print-style-compact .uv-print-layout-two {
          grid-template-columns: 1fr 14rem;
          gap: 8px;
        }
        .uv-print-style-compact .uv-print-charge-card { font-size: 9px; padding: 4px; }
        .uv-print-style-compact .uv-print-charge-title { font-size: 10px; }
      `;
    case 'roster':
      return `
        .uv-print-root.uv-print-style-roster {
          font-family: "Segoe UI", system-ui, sans-serif;
        }
        .uv-print-style-roster .uv-print-nurse-card {
          border: none;
          border-bottom: 3px solid #0f172a;
          background: #f8fafc;
          padding: 10px 12px;
        }
        .uv-print-style-roster .uv-print-nurse-card h3 {
          border: none;
          font-size: 15px;
          text-align: left;
          letter-spacing: 0.02em;
        }
        .uv-print-style-roster .uv-print-spectra {
          text-align: left;
          font-weight: 600;
        }
        .uv-print-style-roster .uv-print-patient-room { font-size: 11px; }
        .uv-print-style-roster .uv-print-tech-panel,
        .uv-print-style-roster .uv-print-sidebar-panel {
          border: 1px solid #94a3b8;
          background: #fff;
        }
        .uv-print-style-roster .uv-print-header-meta {
          border-top: 2px solid #0f172a;
          border-bottom: 2px solid #0f172a;
          padding: 10px 0;
        }
        .uv-print-style-roster .uv-print-charge-card {
          border: none;
          border-left: 4px solid #0f172a;
          background: #f8fafc;
          border-radius: 0;
        }
        .uv-print-style-roster .uv-print-charge-title { font-size: 13px; }
      `;
    case 'high-contrast':
      return `
        .uv-print-root.uv-print-style-high-contrast {
          font-size: 11px;
        }
        .uv-print-style-high-contrast .uv-print-nurse-card,
        .uv-print-style-high-contrast .uv-print-tech-panel,
        .uv-print-style-high-contrast .uv-print-sidebar-panel,
        .uv-print-style-high-contrast .uv-print-charge-card {
          border: 2px solid #000;
          padding: 10px;
        }
        .uv-print-style-high-contrast .uv-print-nurse-card h3,
        .uv-print-style-high-contrast .uv-print-tech-panel h3,
        .uv-print-style-high-contrast .uv-print-sidebar-panel h3,
        .uv-print-style-high-contrast .uv-print-charge-title {
          font-size: 13px;
          font-weight: 800;
        }
        .uv-print-style-high-contrast .uv-print-stats-block {
          background: #fef9c3;
          padding: 6px;
          border: 1px solid #000;
        }
        .uv-print-style-high-contrast .uv-print-patient-room { font-weight: 800; }
      `;
    case 'classic':
    default:
      return '';
  }
}

export function buildPrintStylesheet(
  orientation: PrintOrientation,
  stylePreset: PrintStylePreset,
  baseCss: string,
): string {
  return `${getPrintPageSizeCss(orientation)}\n${baseCss}\n${getPrintStylePresetCss(stylePreset)}`;
}
