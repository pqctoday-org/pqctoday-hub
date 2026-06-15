// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared presentational chrome for the Simulation (WS-05 extraction): the small
 * style/label maps and the resume helper used by BOTH the SimulationView shell
 * and its extracted sub-sections. Pure data + one sessionStorage helper — no
 * React, no store.
 */
import type { EventSeverity } from '@/data/simEvents'
import type { MoveKind } from '@/data/simMoves'
import type { StepKind } from '@/simulation'
import { BUSINESS_TOOLS, WORKSHOP_TOOLS } from './resourceContract'

/** Flag an outbound navigation so MainLayout shows the "Resume Simulation" bar. */
export const markSimResume = () => {
  try {
    sessionStorage.setItem('sim:resume', '1')
  } catch {
    /* ignore */
  }
}

export const SEVERITY_DOT: Record<EventSeverity, string> = {
  danger: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
  info: 'bg-primary',
}

/**
 * Severity cue with a NON-COLOUR signal (WS-13 / AA): each event carries an icon
 * glyph + a screen-reader label, so severity never depends on colour alone.
 */
export const SEVERITY_META: Record<EventSeverity, { dot: string; icon: string; label: string }> = {
  danger: { dot: 'bg-destructive', icon: '✕', label: 'Danger' },
  warning: { dot: 'bg-warning', icon: '⚠', label: 'Warning' },
  success: { dot: 'bg-success', icon: '✓', label: 'Success' },
  info: { dot: 'bg-primary', icon: 'ℹ', label: 'Info' },
}

export const MOVE_TONE: Record<MoveKind, { border: string; text: string; label: string }> = {
  sound: { border: 'border-success', text: 'text-success', label: '✓ Sound move' },
  trap: {
    border: 'border-destructive',
    text: 'text-destructive',
    label: '✕ This leads to failure',
  },
  warn: { border: 'border-warning', text: 'text-warning', label: '⚠ Risky — proceed with care' },
}

export const KIND_CHIP: Record<StepKind, string> = {
  learn: 'bg-primary/15 text-primary',
  reference: 'bg-secondary/15 text-secondary',
  activity: 'bg-warning/15 text-warning',
}

export const BIZ_NAME = new Map(BUSINESS_TOOLS.map((t) => [t.id, t.name]))
export const PG_NAME = new Map(WORKSHOP_TOOLS.map((t) => [t.id, t.name]))

export const REF_LABELS: Record<string, string> = {
  'algorithms-catalog': 'Algorithm Catalog',
  'algorithms-protocol-matrix': 'PQC Protocol Matrix',
  'algorithms-transition': 'Classical → PQC Transition',
  timeline: 'Migration Timeline',
  compliance: 'Compliance Center',
  'compliance-cert-check': 'FIPS / CC Cert Check',
  threats: 'Quantum Threats',
  migrate: 'Migrate (products + CBOM)',
  library: 'Library',
  'assess-engine': 'Assessment Engine',
  report: 'Executive Report',
}
