// SPDX-License-Identifier: GPL-3.0-only
//
// Derived "posture" for the Migration Workbench. All numbers are computed over
// the user's PLANNED assets only (not the whole catalog) — that is the key
// difference from the old market-wide readiness bar.

import { useMemo } from 'react'
import {
  REPLACE_ASSETS,
  DOMAINS,
  DECISIONS,
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
  /** assets in the plan, in canonical (wave, deadline) order */
  plannedAssets: ReplaceAsset[]
  readyN: number
  blockedN: number
  readyPct: number
  blockedPct: number
  hndlCount: number
  /** nearest CNSA deadline year across the plan, or null when empty */
  nearestYear: number | null
  nearestAsset: ReplaceAsset | null
  /** first ready planned asset by (wave, year); null if none ready */
  nextMove: NextMove | null
  /** waves that contain at least one planned asset, ordered 1→4 */
  waves: WaveGroup[]
  /** planned assets with no GA path (decision === 'mitigate') */
  gaps: ReplaceAsset[]
  /** planned foundation/infrastructure domains (no wave) — shown separately */
  foundations: FoundationPlanEntry[]
}

const ASSET_BY_ID = new Map<string, ReplaceAsset>(REPLACE_ASSETS.map((a) => [a.id, a]))

/** Canonical ordering: wave ascending, then CNSA year ascending. */
function byWaveThenYear(a: ReplaceAsset, b: ReplaceAsset): number {
  return a.wave - b.wave || a.cnsaYear - b.cnsaYear
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
  plannedAssets.sort(byWaveThenYear)

  const total = plannedAssets.length
  const readyAssets = plannedAssets.filter((a) => DECISIONS[a.decision].ready)
  const readyN = readyAssets.length
  const blockedN = total - readyN
  const readyPct = total === 0 ? 0 : Math.round((readyN / total) * 100)
  const blockedPct = total === 0 ? 0 : 100 - readyPct

  const hndlCount = plannedAssets.filter((a) => a.hndl).length

  const nearestAsset =
    plannedAssets.length === 0
      ? null
      : plannedAssets.reduce((min, a) => (a.cnsaYear < min.cnsaYear ? a : min))
  const nearestYear = nearestAsset?.cnsaYear ?? null

  // nextMove: first ready planned asset by (wave, year) — list is already sorted.
  const firstReady = plannedAssets.find((a) => DECISIONS[a.decision].ready) ?? null
  const nextMove: NextMove | null = firstReady
    ? { asset: firstReady, product: (choice[firstReady.id] ?? []).join(', ') || undefined }
    : null

  const waves: WaveGroup[] = ([1, 2, 3, 4] as const)
    .map((w) => ({ wave: w, assets: plannedAssets.filter((a) => a.wave === w) }))
    .filter((g) => g.assets.length > 0)

  const gaps = plannedAssets.filter((a) => a.decision === 'mitigate')

  return {
    plannedAssets,
    readyN,
    blockedN,
    readyPct,
    blockedPct,
    hndlCount,
    nearestYear,
    nearestAsset,
    nextMove,
    waves,
    gaps,
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
