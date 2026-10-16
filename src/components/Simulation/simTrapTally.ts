// SPDX-License-Identifier: AGPL-3.0-only
/**
 * simTrapTally (PR-5) — a local, per-browser tally of which Common-Failure (trap)
 * moves a player has fallen for. It turns play into a content-priority instrument:
 * the most-picked misconceptions show where the hub's education is weakest. Local
 * by design (no analytics account needed); the GA4 "Trap Pick" event still fires
 * in parallel (analytics.logSimTrapPick) for aggregate reporting.
 *
 * Same-tab localStorage writes don't fire the `storage` event, so `recordTrapPick`
 * dispatches a `TRAP_EVENT` the dashboard listens for to refresh live.
 */
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'
import { resourcesForPhase } from '@/data/phaseResourceMap'
import { TRAP_REMEDIATION } from '@/data/trapRemediation'
import { MODULE_CATALOG } from './resourceContract'

const KEY = 'pqc-sim-trap-tally'
export const TRAP_EVENT = 'pqc-sim-trap'

export interface TrapTallyEntry {
  phaseId: string
  label: string
  count: number
}

type Raw = Record<string, TrapTallyEntry>

const keyOf = (phaseId: string, label: string) => `${phaseId} ${label}`

function read(): Raw {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Raw) : {}
  } catch {
    return {}
  }
}

function write(data: Raw): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(TRAP_EVENT))
  } catch {
    /* storage unavailable — the tally is best-effort, never a hard dependency */
  }
}

/** Record one trap pick (called alongside the GA4 logSimTrapPick emit). */
export function recordTrapPick(phaseId: string, label: string): void {
  if (!phaseId || !label) return
  const data = read()
  const k = keyOf(phaseId, label)
  data[k] = { phaseId, label, count: (data[k]?.count ?? 0) + 1 }
  write(data)
}

/** The ranked tally, most-fallen-for first (ties broken by label for stability). */
export function readTrapTally(): TrapTallyEntry[] {
  return Object.values(read()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** Total picks recorded — for the empty-state check. */
export function trapTallyTotal(): number {
  return Object.values(read()).reduce((n, e) => n + e.count, 0)
}

/** Clear the tally (explicit user reset / tests). */
export function clearTrapTally(): void {
  write({})
}

/** The remediating resource for a misconception. WP2.7: prefers the
 *  trap-specific module (TRAP_REMEDIATION, keyed by the exact trap/pitfall
 *  title) when one is mapped, so the fix points at the lesson that actually
 *  addresses THIS misconception. Falls back to the first Learn module of the
 *  trap's phase for any trap not yet mapped (today's behavior, unchanged) —
 *  never a broken or missing remediation link. */
export function remediation(
  phaseId: string,
  trapLabel?: string
): { to: string; label: string } | null {
  const specific = trapLabel ? TRAP_REMEDIATION[trapLabel] : undefined
  const learn = specific ?? resourcesForPhase('learn', phaseId as PhaseId)[0]
  if (!learn) return null
  return { to: `/learn/${learn}`, label: MODULE_CATALOG[learn]?.title ?? learn }
}

/** Display name for a phase id, e.g. "P3 · Risk Scoring" or "Foundations". */
export function phaseName(phaseId: string): string {
  const fp = FRAMEWORK_PHASES[phaseId as PhaseId]
  if (!fp) return phaseId
  return fp.number === null ? fp.name : `P${fp.number} · ${fp.name}`
}
