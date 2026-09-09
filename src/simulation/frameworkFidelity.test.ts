// SPDX-License-Identifier: GPL-3.0-only
/**
 * Framework-fidelity drift guard.
 *
 * Pins the generated Simulation trees to the structured extraction of the
 * Applied Quantum PQC Migration Framework v2.1 at `pqc-references/framework-2.1.yaml`
 * (machine-readable twin `framework-2.1.json`, the single source of truth — see
 * the `reference-framework-yaml-extraction` note). Trees are emitted by
 * `scripts/gen-sim-trees.mjs`, which HARDCODES the framework content; without this
 * guard a hand-edit can silently drift the sim away from the published framework
 * (this is exactly how Phase 0's activity labels and two L4 maturity clauses
 * rotted before the 2026-06-21 audit).
 *
 * What it asserts, for the eight framework phases p0–p7:
 *  1. MATURITY INDICATORS are verbatim — every shipped band's `indicator` equals
 *     the framework's per-phase indicator for that level.
 *  2. ACTIVITY IDS are real — every tree activity id is a framework activity id
 *     (exact, sub-id like `0.2b`, or a merged `A–B` range whose endpoints both
 *     exist). Catches invented/renumbered activities.
 *  3. ACTIVITY TITLES are verbatim for exact-id activities (merged ranges carry a
 *     synthesized title and are exempt). Catches mislabeled activities.
 *
 * And, separately (INTERNAL consistency, not the PDF):
 *  4. GATES match `frameworkPhases.ts`, the hub's CANONICAL gate model. The hub
 *     deliberately labels gates by source phase (G0…G8) rather than the PDF's
 *     transition table (G0→G1…) — that divergence is an app-wide design choice,
 *     so this guards tree↔frameworkPhases agreement, NOT tree↔PDF.
 *
 * `foundations` and `verify-close` are sim cross-cutting constructs (F.x / VC.x
 * ids, sim-authored indicators) with no 1:1 framework phase, so 1–3 skip them.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SIM_TREES } from '@/simulation'
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'

// vitest runs with cwd = repo root; the extraction lives at pqc-references/.
const fw = JSON.parse(
  readFileSync(resolve(process.cwd(), 'pqc-references/framework-2.1.json'), 'utf8')
) as {
  phases: Array<{
    id: string
    activities: Array<{ id: string; title: string }>
    maturity_indicators: Record<string, string>
  }>
}

const FW_BY_ID = new Map(fw.phases.map((p) => [p.id, p]))
const FRAMEWORK_PHASE_IDS: PhaseId[] = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']

/** A real framework activity id for `phase`: exact match, or a merged "A–B" range
 *  (en-dash or hyphen) whose endpoints both exist as framework activities. */
function activityIdIsReal(phase: string, id: string): boolean {
  const ids = new Set(FW_BY_ID.get(phase)?.activities.map((a) => a.id) ?? [])
  if (ids.has(id)) return true
  const parts = id.split(/[–—-]/)
  return parts.length > 1 && parts.every((p) => ids.has(p.trim()))
}

const isMergedRange = (id: string) => id.split(/[–—-]/).length > 1
const norm = (s: string) => s.toLowerCase().replace(/[–—-]/g, '-').replace(/\s+/g, ' ').trim()

describe('framework fidelity (drift guard vs framework-2.1.yaml)', () => {
  it('every framework phase resolves in the extraction', () => {
    for (const p of FRAMEWORK_PHASE_IDS)
      expect(FW_BY_ID.has(p), `framework missing ${p}`).toBe(true)
  })

  it('maturity indicators are verbatim against the framework', () => {
    const drift: string[] = []
    for (const phase of FRAMEWORK_PHASE_IDS) {
      const tree = SIM_TREES[phase]
      const fwMi = FW_BY_ID.get(phase)!.maturity_indicators
      if (!tree) continue
      for (const band of tree.levels) {
        const expected = fwMi[String(band.level)]
        if (expected === undefined) {
          drift.push(`${phase} L${band.level}: framework has no indicator for this level`)
        } else if (band.indicator !== expected) {
          drift.push(
            `${phase} L${band.level} NOT verbatim:\n    tree: ${JSON.stringify(band.indicator)}\n    fw:   ${JSON.stringify(expected)}`
          )
        }
      }
    }
    expect(drift, `maturity-indicator drift:\n${drift.join('\n')}`).toEqual([])
  })

  it('every tree activity id is a real framework activity id, or a declared adaptation', () => {
    // W2.4: an ADAPTATION is a simulator-authored exercise representing an
    // existing activity operated again over time (the framework's higher
    // indicators are mostly recurrence, not new activities). It is allowed
    // ONLY when it names the real source activity it adapts, and it must not
    // masquerade as a framework activity number of its own — that is what
    // stops a "3.5"/"6.6" being minted, which is what this guard exists for.
    const bad: string[] = []
    for (const phase of FRAMEWORK_PHASE_IDS) {
      const tree = SIM_TREES[phase]
      if (!tree) continue
      for (const band of tree.levels)
        for (const act of band.activities) {
          if (act.adaptationOf) {
            if (!activityIdIsReal(phase, act.adaptationOf))
              bad.push(
                `${phase}: adaptation "${act.id}" claims source "${act.adaptationOf}", which is not a framework activity`
              )
            if (/^\d+\.\d+$/.test(act.id))
              bad.push(
                `${phase}: adaptation "${act.id}" is shaped like a framework activity number — use <sourceId>-<slug>`
              )
            continue
          }
          if (!activityIdIsReal(phase, act.id))
            bad.push(`${phase}: activity id "${act.id}" ("${act.title}") not in framework`)
        }
    }
    expect(bad, `invented/renumbered activities:\n${bad.join('\n')}`).toEqual([])
  })

  it('every adaptation declares the source activity it represents', () => {
    // An adaptation with no `adaptationOf` would be an invented activity with
    // a funny name — the exact thing the guard above must never allow through.
    const bad: string[] = []
    for (const phase of FRAMEWORK_PHASE_IDS) {
      for (const band of SIM_TREES[phase]?.levels ?? [])
        for (const act of band.activities)
          if (!activityIdIsReal(phase, act.id) && !act.adaptationOf)
            bad.push(
              `${phase}: "${act.id}" is neither a framework activity nor a declared adaptation`
            )
    }
    expect(bad).toEqual([])
  })

  it('every framework activity is COVERED by some tree (folded 0.2b/0.2c exempt)', () => {
    // The guard above is one-directional (no INVENTED activities). This is the other
    // direction — no framework activity silently UNMAPPED — so coverage gaps like the
    // ones the 2026-06-22 sim audit found can't reappear untested. 0.2b/0.2c are folded
    // into 0.2 by design (see gen-sim-trees.mjs), so they are exempt.
    const FOLDED = new Set(['0.2b', '0.2c'])
    const missing: string[] = []
    for (const phase of FRAMEWORK_PHASE_IDS) {
      const tree = SIM_TREES[phase]
      const covered = new Set<string>()
      for (const band of tree?.levels ?? [])
        for (const act of band.activities) {
          covered.add(act.id)
          for (const part of act.id.split(/[–—-]/)) covered.add(part.trim()) // merged A–B covers each endpoint
        }
      for (const act of FW_BY_ID.get(phase)?.activities ?? [])
        if (!FOLDED.has(act.id) && !covered.has(act.id))
          missing.push(`${phase}: framework activity ${act.id} ("${act.title}") not in any tree`)
    }
    expect(missing, `unmapped framework activities:\n${missing.join('\n')}`).toEqual([])
  })

  it('exact-id activity titles are verbatim (merged ranges + adaptations exempt)', () => {
    const drift: string[] = []
    for (const phase of FRAMEWORK_PHASE_IDS) {
      const tree = SIM_TREES[phase]
      if (!tree) continue
      const fwTitles = new Map(FW_BY_ID.get(phase)!.activities.map((a) => [a.id, a.title]))
      for (const band of tree.levels)
        for (const act of band.activities) {
          if (isMergedRange(act.id)) continue // synthesized title
          const fwTitle = fwTitles.get(act.id)
          if (fwTitle && norm(fwTitle) !== norm(act.title))
            drift.push(`${phase} ${act.id}:\n    tree: "${act.title}"\n    fw:   "${fwTitle}"`)
        }
    }
    expect(drift, `activity-title drift:\n${drift.join('\n')}`).toEqual([])
  })

  it('tree gates match the canonical frameworkPhases.ts model (not the PDF)', () => {
    // Internal consistency: the hub labels gates by source phase (G0…G8); this
    // pins the trees to frameworkPhases.ts so the two copies cannot drift apart.
    const drift: string[] = []
    for (const phase of Object.keys(SIM_TREES) as PhaseId[]) {
      const tg = SIM_TREES[phase]?.gate
      const fg = FRAMEWORK_PHASES[phase]?.gate
      if (!tg && !fg) continue
      if (!!tg !== !!fg) {
        drift.push(`${phase}: gate presence differs (tree ${!!tg} vs frameworkPhases ${!!fg})`)
        continue
      }
      if (tg && fg && (tg.id !== fg.id || tg.criterion !== fg.criterion))
        drift.push(
          `${phase}: tree gate ${JSON.stringify(tg)} != frameworkPhases ${JSON.stringify(fg)}`
        )
    }
    expect(drift, `gate drift vs frameworkPhases:\n${drift.join('\n')}`).toEqual([])
  })
})
