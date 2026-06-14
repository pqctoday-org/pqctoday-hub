// SPDX-License-Identifier: GPL-3.0-only
/**
 * SIM_TREES — the Simulation's per-phase activity trees, loaded from the dated,
 * self-contained snapshots under ./trees (one file per phase). The latest dated
 * file per phase wins, mirroring the hub's other dated-snapshot loaders.
 *
 * Snapshots are emitted by scripts/gen-sim-trees.mjs; older dates live in
 * ./trees/archive. trees.test.ts guards every leaf against the live hub
 * registries so the trees can never reference a resource that no longer exists.
 */
import type { PhaseId } from '@/data/frameworkPhases'
import type { PhaseTree } from './types'

export type { PhaseTree, LevelBand, TreeActivity, TreeStep, StepKind, Pitfall } from './types'
export { flattenTree, achievedTreeLevel } from './types'

const modules = import.meta.glob<{ default: PhaseTree }>('./trees/simTree.*.ts', {
  eager: true,
})

// filename → ./trees/simTree.<phase>.<MMDDYYYY>.ts ; latest date per phase wins.
const FILE_RE = /simTree\.(p[0-7])\.(\d{2})(\d{2})(\d{4})\.ts$/
const sortKey = (mm: string, dd: string, yyyy: string) => `${yyyy}${mm}${dd}`

const latest: Partial<Record<PhaseId, { key: string; tree: PhaseTree }>> = {}
for (const [path, mod] of Object.entries(modules)) {
  const m = path.match(FILE_RE)
  if (!m) continue
  const [, phase, mm, dd, yyyy] = m
  const key = sortKey(mm, dd, yyyy)
  const cur = latest[phase as PhaseId]
  if (!cur || key > cur.key) latest[phase as PhaseId] = { key, tree: mod.default }
}

export const SIM_TREES: Partial<Record<PhaseId, PhaseTree>> = Object.fromEntries(
  Object.entries(latest).map(([phase, v]) => [phase, v!.tree])
) as Partial<Record<PhaseId, PhaseTree>>
