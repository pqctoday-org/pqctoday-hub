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

const RESUME_FLAG = 'sim:resume'
const EXITED_FLAG = 'sim:exited'
const OPENED_FLAG = 'sim:opened'

/** Flag an outbound navigation as a RESOURCE PEEK so the hub shows the
 *  "Resume Simulation" header. A peek is the opposite of quitting, so it also
 *  clears any prior exit marker. */
export const markSimResume = () => {
  try {
    sessionStorage.setItem(RESUME_FLAG, '1')
    sessionStorage.removeItem(EXITED_FLAG)
  } catch {
    /* ignore */
  }
}

/** Flag a DELIBERATE quit via the sim's "← HUB" button so the hub does NOT show
 *  the "Resume Simulation" header — the player chose to leave the simulation,
 *  not to peek at a resource. Cleared when they re-open the console from the top
 *  nav (see clearSimExcursion). */
export const markSimExited = () => {
  try {
    sessionStorage.setItem(EXITED_FLAG, '1')
    sessionStorage.removeItem(RESUME_FLAG)
  } catch {
    /* ignore */
  }
}

/** True when the player quit the sim via the HUB button and has not re-opened it. */
export const hasSimExited = () => {
  try {
    return sessionStorage.getItem(EXITED_FLAG) === '1'
  } catch {
    return false
  }
}

/** True when the player is peeking at a hub resource FROM inside a sim run (the
 *  resume flag is armed and they haven't quit). Lets a resource — e.g. the
 *  assessment gate flow — send the player back to /simulation on completion
 *  instead of stranding them on /report. */
export const isSimResumePending = () => {
  try {
    return (
      sessionStorage.getItem(RESUME_FLAG) === '1' && sessionStorage.getItem(EXITED_FLAG) !== '1'
    )
  } catch {
    return false
  }
}

/** Reset both excursion markers — called on the sim console's mount, so re-opening
 *  the simulation from the top nav starts clean (a later peek re-arms the header;
 *  a later HUB quit suppresses it again). Also stamps a SESSION marker recording
 *  that the player opened the console THIS session: the hub header reads it to
 *  gate the persisted-run fallback, so saved progress from a past visit can't
 *  resurrect the "Simulation in progress" strip on a fresh session (it persists
 *  in localStorage forever, unlike this sessionStorage marker). */
export const clearSimExcursion = () => {
  try {
    sessionStorage.removeItem(RESUME_FLAG)
    sessionStorage.removeItem(EXITED_FLAG)
    sessionStorage.setItem(OPENED_FLAG, '1')
  } catch {
    /* ignore */
  }
}

/** True when the player opened the sim console at least once THIS browser session.
 *  Gates the persisted-run fallback in the hub's resume header so a stale run left
 *  in localStorage doesn't show the strip before the sim is re-entered. */
export const hasOpenedSimThisSession = () => {
  try {
    return sessionStorage.getItem(OPENED_FLAG) === '1'
  } catch {
    return false
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
  workshop: 'bg-accent/15 text-accent',
  catalog: 'bg-success/15 text-success',
  scenario: 'bg-accent/15 text-accent',
  architecture: 'bg-success/15 text-success',
  recurrence: 'bg-warning/15 text-warning',
  measure: 'bg-primary/15 text-primary',
}

export const BIZ_NAME = new Map(BUSINESS_TOOLS.map((t) => [t.id, t.name]))
export const PG_NAME = new Map(WORKSHOP_TOOLS.map((t) => [t.id, t.name]))

export const REF_LABELS: Record<string, string> = {
  'algorithms-catalog': 'Algorithm Catalog',
  'algorithms-protocol-matrix': 'PQC Protocol Matrix',
  'algorithms-transition': 'Classical → PQC Transition',
  'algorithms-detailed': 'Detailed Algorithm Comparison',
  timeline: 'Migration Timeline',
  compliance: 'Compliance Center',
  'compliance-cert-check': 'FIPS / CC Cert Check',
  threats: 'Quantum Threats',
  migrate: 'Migrate (products + CBOM)',
  library: 'Library',
  'assess-engine': 'Assessment Engine',
  report: 'Executive Report',
}
