// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 content integration (WP-A.3) — every Learn module has a place in the
 * Simulation, or an explicit reason not to.
 *
 * The trees are generated from a hand-written framework (scripts/
 * gen-sim-trees.mjs), and the only guards checked that referenced modules
 * EXIST — never that new modules were placed. Nine modules shipped after the
 * July generation and seven never reached the sim. This test makes a new
 * module fail until someone decides: a tree step, a sector-track step, a tip
 * card's "Learn more", or an entry below with its reason.
 */
import { describe, expect, it } from 'vitest'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { SIM_TREES, flattenTree } from '@/simulation'
import { SECTOR_STEPS } from './sectorTrack'
import { CONCEPT_LEARN_MODULE } from '@/components/Simulation/autorun/conceptPeekLinks'

/** Modules deliberately NOT placed in the sim, each with its reason. */
const NOT_IN_SIM: Record<string, string> = {
  // Seat-scoped orientation modules: the Resources tab lists each one only for
  // its own seat (simRelevance PERSONA_MODULE). Not a framework activity.
  'arch-quantum-impact': 'seat-scoped orientation, Resources only (simRelevance)',
  'dev-quantum-impact': 'seat-scoped orientation, Resources only (simRelevance)',
  'ops-quantum-impact': 'seat-scoped orientation, Resources only (simRelevance)',
  'research-quantum-impact': 'seat-scoped orientation, Resources only (simRelevance)',
  'automotive-pqc': 'the sim has no automotive sector (simRelevance: never relevant)',
  qkd: 'quantum key distribution is not a PQC migration activity (separate QKD/QRNG category)',
  quiz: 'the question bank itself — the sim uses it through the per-step comprehension check',
  'trust-services-pqc': 'Resources list only — user decision 2026-09-28 (content plan Q2)',
  // Scheduled by simulation-content-integration-plan-09282026.md. Each entry is
  // deleted by the work package that places it — the stale-entry check below
  // fails until it is, so none of these can outlive the branch.
  'crypto-product-certification': 'scheduled: WP-B (P7 certification activity)',
  'fips-140-3-certification': 'scheduled: WP-B (optional deep dive)',
  'cc-eucc-certification': 'scheduled: WP-B (optional deep dive)',
  'pci-certification': 'scheduled: WP-B (financial/retail track)',
  'government-defense-pqc': 'scheduled: WP-C (government sector track)',
  sbom: 'scheduled: WP-D (P2 SBOM link)',
  'crypto-registry': 'scheduled: WP-D (P2 CBOM naming)',
  'acvp-lab-workflow': 'scheduled: WP-E (P6 testing methodology)',
}

function placedModuleIds(): Set<string> {
  const ids = new Set<string>()
  for (const tree of Object.values(SIM_TREES)) {
    if (!tree) continue
    for (const s of flattenTree(tree)) if (s.moduleId) ids.add(s.moduleId)
  }
  for (const byPhase of Object.values(SECTOR_STEPS)) {
    for (const steps of Object.values(byPhase ?? {}))
      for (const s of steps ?? []) ids.add(s.moduleId)
  }
  for (const id of Object.values(CONCEPT_LEARN_MODULE)) ids.add(id)
  return ids
}

describe('every Learn module is placed in the Simulation (or excluded with a reason)', () => {
  const placed = placedModuleIds()

  it('no module is silently missing', () => {
    const missing = MANIFESTS.map((m) => m.id).filter(
      (id) => !placed.has(id) && !(id in NOT_IN_SIM)
    )
    expect(missing).toEqual([])
  })

  it('the exclusion list has no stale entries (removed or since-placed modules)', () => {
    const known = new Set(MANIFESTS.map((m) => m.id))
    const stale = Object.keys(NOT_IN_SIM).filter((id) => !known.has(id) || placed.has(id))
    expect(stale).toEqual([])
  })
})
