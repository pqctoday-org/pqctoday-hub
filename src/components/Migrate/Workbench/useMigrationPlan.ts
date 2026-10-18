// SPDX-License-Identifier: AGPL-3.0-only
//
// Derived "posture" for the Migration Workbench. All numbers are computed over
// the user's PLANNED assets only (not the whole catalog) — that is the key
// difference from the old market-wide readiness bar.

import { useMemo } from 'react'
import {
  REPLACE_ASSETS,
  DOMAINS,
  type ReplaceAsset,
  type ReplaceAssetId,
  type DomainId,
} from '@/data/migrationAssets'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'

export interface WaveGroup {
  wave: 1 | 2 | 3 | 4
  assets: ReplaceAsset[]
}

/** A planned foundation/infrastructure domain (no wave/decision — shown in its
 *  own plan section per the domain-model design). */
export interface FoundationPlanEntry {
  id: string
  label: string
}

export interface NextMove {
  asset: ReplaceAsset
  /** chosen product name, if the user picked one */
  product?: string
}

export interface MigrationPosture {
  /** assets in the plan, in canonical teaching-wave order */
  plannedAssets: ReplaceAsset[]
  /** Selected domains with at least one catalogue product example chosen. */
  productSelectedN: number
  /** Selected domains that still have no catalogue product example chosen. */
  needsProductN: number
  /** Planning coverage, not technical or compliance readiness. */
  planningPct: number
  hndlCount: number
  /** first planned asset needing a product example, or the first asset */
  nextMove: NextMove | null
  /** waves that contain at least one planned asset, ordered 1→4 */
  waves: WaveGroup[]
  /** planned assets whose example action is an interim control. */
  cautions: ReplaceAsset[]
  /** planned foundation/infrastructure domains (no wave) — shown separately */
  foundations: FoundationPlanEntry[]
}

const ASSET_BY_ID = new Map<string, ReplaceAsset>(REPLACE_ASSETS.map((a) => [a.id, a]))

/** Canonical teaching order: wave ascending, then source-data order. */
function byWave(a: ReplaceAsset, b: ReplaceAsset): number {
  return a.wave - b.wave
}

/**
 * Pure posture computation — no React, no store. `planIds` may contain unknown
 * or duplicate ids; they are de-duped and filtered to known assets.
 */
export function computePosture(
  planIds: string[],
  choice: Record<string, string[]>
): MigrationPosture {
  const seen = new Set<string>()
  const plannedAssets: ReplaceAsset[] = []
  const foundations: FoundationPlanEntry[] = []
  for (const id of planIds) {
    if (seen.has(id)) continue
    seen.add(id)
    const asset = ASSET_BY_ID.get(id)
    if (asset) {
      plannedAssets.push(asset)
      continue
    }
    // Not a replace-asset — surface foundation/infrastructure domains so their
    // chosen products still appear in the plan (in their own section).
    const domain = DOMAINS[id as DomainId]
    if (domain && domain.kind === 'foundation') {
      foundations.push({ id: domain.id, label: domain.label })
    }
  }
  plannedAssets.sort(byWave)

  const total = plannedAssets.length + foundations.length
  const productSelectedN = [
    ...plannedAssets.map((a) => a.id),
    ...foundations.map((f) => f.id),
  ].filter((id) => (choice[id] ?? []).length > 0).length
  const needsProductN = total - productSelectedN
  const planningPct = total === 0 ? 0 : Math.round((productSelectedN / total) * 100)

  const hndlCount = plannedAssets.filter((a) => a.hndl).length

  // nextMove: first selected asset without a product example, then the first
  // teaching-wave asset. This is navigation help, not a readiness verdict.
  const firstMove =
    plannedAssets.find((a) => (choice[a.id] ?? []).length === 0) ?? plannedAssets[0] ?? null
  const nextMove: NextMove | null = firstMove
    ? { asset: firstMove, product: (choice[firstMove.id] ?? []).join(', ') || undefined }
    : null

  const waves: WaveGroup[] = ([1, 2, 3, 4] as const)
    .map((w) => ({ wave: w, assets: plannedAssets.filter((a) => a.wave === w) }))
    .filter((g) => g.assets.length > 0)

  const cautions = plannedAssets.filter((a) => a.decision === 'mitigate')

  return {
    plannedAssets,
    productSelectedN,
    needsProductN,
    planningPct,
    hndlCount,
    nextMove,
    waves,
    cautions,
    foundations,
  }
}

/** Store-bound hook: recompute posture whenever plan/choice change. */
export function useMigrationPlan(): MigrationPosture {
  const plan = useMigrateSelectionStore((s) => s.plan)
  const choice = useMigrateSelectionStore((s) => s.choice)
  return useMemo(() => computePosture(plan, choice), [plan, choice])
}

/** Helper: is this asset id currently in the plan? (cheap selector use) */
export function useIsPlanned(assetId: ReplaceAssetId | string): boolean {
  return useMigrateSelectionStore((s) => s.plan.includes(assetId))
}
