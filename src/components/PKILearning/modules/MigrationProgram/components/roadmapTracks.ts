// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two-Track roadmap model — the typed vocabulary the Roadmap Builder uses to
 * place milestones on the framework's two parallel migration tracks plus the
 * Foundations/governance spine. Canonical track identities mirror
 * `hooks/assessment/twoTrack.ts` (A = Confidentiality/KEM/HNDL, B =
 * Integrity/Signatures/PKI/TNFL) so the roadmap can never disagree with the
 * assessment engine. Pure + unit-testable (no React).
 */
import type { PhaseId } from '@/data/frameworkPhases'

/** Which swimlane a milestone sits in. `program` = Foundations + governance spine. */
export type RoadmapTrack = 'program' | 'A' | 'B'

export interface RoadmapMilestone {
  id: string
  label: string
  year: number
  /** Framework phase (P0–P7 / foundations). */
  phaseId: PhaseId
  /** Swimlane. */
  track: RoadmapTrack
  /** Ids of milestones that must complete before this one (dependency edges). */
  dependsOn?: string[]
}

export interface TrackMeta {
  id: RoadmapTrack
  label: string
  focus: string
  rationale: string
}

/** Lane metadata — wording kept in sync with `twoTrack.ts`. */
export const TRACK_META: Record<RoadmapTrack, TrackMeta> = {
  program: {
    id: 'program',
    label: 'Program — Foundations & Gates',
    focus: 'Mandate · inventory · governance · gates G0–G7',
    rationale:
      'The cross-cutting spine: executive mandate, discovery/CBOM, risk scoring, governance and KPIs that both technical tracks depend on.',
  },
  A: {
    id: 'A',
    label: 'Track A — Confidentiality (KEM / HNDL)',
    focus: 'Key exchange & data-at-rest',
    rationale:
      'Harvest-Now-Decrypt-Later: intercepted ciphertext and key-exchange material can be decrypted retroactively once a quantum computer exists, so confidentiality must be protected first — urgent now even before a quantum computer exists.',
  },
  B: {
    id: 'B',
    label: 'Track B — Integrity (Signatures / PKI)',
    focus: 'Code/firmware signing & PKI',
    rationale:
      'Trust-Now-Forge-Later: signing keys and long-lived trust anchors have the longest replacement lead time, so PKI and code/firmware-signing migration must start early even though forgery risk lags decryption risk.',
  },
}

/** Lane display order: governance spine first, then the two parallel tracks. */
export const TRACK_ORDER: RoadmapTrack[] = ['program', 'A', 'B']

/**
 * Classify an algorithm-transition `function` into a migration track.
 * Signatures / composite signatures → integrity (Track B); KEM / encryption /
 * symmetric / hash → confidentiality (Track A).
 */
export function trackForFunction(fn: string): Extract<RoadmapTrack, 'A' | 'B'> {
  return /signature/i.test(fn) ? 'B' : 'A'
}

/**
 * Longest dependency chain (count of milestones) across the graph — the
 * critical path. A cycle is treated as no further depth so a malformed graph
 * can never loop forever.
 */
export function criticalPathLength(milestones: RoadmapMilestone[]): number {
  const byId = new Map(milestones.map((m) => [m.id, m]))
  const memo = new Map<string, number>()
  const visiting = new Set<string>()

  function depth(id: string): number {
    const cached = memo.get(id)
    if (cached !== undefined) return cached
    if (visiting.has(id)) return 0 // cycle guard
    const m = byId.get(id)
    if (!m) return 0
    visiting.add(id)
    let best = 0
    for (const dep of m.dependsOn ?? []) best = Math.max(best, depth(dep))
    visiting.delete(id)
    const d = best + 1
    memo.set(id, d)
    return d
  }

  let max = 0
  for (const m of milestones) max = Math.max(max, depth(m.id))
  return max
}

/** Stable-ish id for a new user-added milestone (app runtime; not used in tests). */
export function newMilestoneId(): string {
  return `m-${Math.random().toString(36).slice(2, 9)}`
}
