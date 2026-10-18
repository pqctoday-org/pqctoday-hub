// SPDX-License-Identifier: AGPL-3.0-only
//
// Export an educational planning draft. It deliberately does not claim to be
// a CBOM or a CycloneDX document: the workbench has not discovered an estate,
// and this local shape is not validated against the CycloneDX schema.

import {
  REPLACE_ASSETS,
  DECISIONS,
  DOMAINS,
  type ReplaceAsset,
  type DomainId,
} from '@/data/migrationAssets'

/** Catalog fields used to identify a selected example. */
export interface CbomProductRef {
  productId: string
  softwareName: string
  formerNames?: string[]
  latestVersion?: string
  releaseDate?: string
}

interface PlanExportInput {
  planIds: string[]
  choice: Record<string, string[]>
  /**
   * Catalogue rows (and the snapshot file they came from) used to pin each
   * chosen product to its product_id and recorded release (migrate
   * remediation r2 J3). Optional: without them the export names products only.
   */
  products?: CbomProductRef[]
  catalogSnapshot?: string
  /** ISO timestamp — passed in so the function stays deterministic/testable. */
  timestamp: string
}

const ASSET_BY_ID = new Map<string, ReplaceAsset>(REPLACE_ASSETS.map((a) => [a.id, a]))

export function buildPlanCbom(input: PlanExportInput): Record<string, unknown> {
  const byName = new Map<string, CbomProductRef>()
  for (const p of input.products ?? []) {
    byName.set(p.softwareName, p)
    for (const n of p.formerNames ?? []) if (!byName.has(n)) byName.set(n, p)
  }
  // One chosen product → its name, plus id / recorded version / release date
  // when the catalog knows them, so the draft identifies the recorded example.
  const productRef = (name: string) => {
    const ref = byName.get(name)
    return {
      name,
      ...(ref?.productId ? { productId: ref.productId } : {}),
      ...(ref?.latestVersion ? { catalogVersion: ref.latestVersion } : {}),
      ...(ref?.releaseDate ? { catalogReleaseDate: ref.releaseDate } : {}),
    }
  }
  const assets = input.planIds
    .map((id) => ASSET_BY_ID.get(id))
    .filter((a): a is ReplaceAsset => !!a)

  const items = assets.map((asset) => {
    const decision = DECISIONS[asset.decision]
    const chosen = input.choice[asset.id] ?? []
    return {
      id: asset.id,
      name: asset.label,
      currentExample: asset.classical,
      targetDiscussion: asset.target,
      illustrativeAction: decision.label,
      teachingWave: asset.wave,
      hndlReviewCue: asset.hndl,
      note: asset.note,
      selectedCatalogExamples: chosen.map(productRef),
    }
  })

  // FIXED 2026-07-16 (migrate-process remediation Phase 5, U7): planIds mixes
  // real ReplaceAsset ids with foundation/infrastructure DOMAIN ids (crypto
  // libraries etc. have no ReplaceAsset — computePosture in
  // useMigrationPlan.ts already handles this split; this export never did,
  // so any product chosen for a foundation domain silently never appeared
  // in the downloaded planning draft at all).
  const knownAssetIds = new Set<string>(assets.map((a) => a.id))
  const foundationItems = input.planIds
    .filter((id) => !knownAssetIds.has(id))
    .map((id) => DOMAINS[id as DomainId])
    .filter((d): d is NonNullable<typeof d> => !!d && d.kind === 'foundation')
    .map((domain) => {
      const chosen = input.choice[domain.id] ?? []
      return {
        id: domain.id,
        name: domain.label,
        kind: 'foundation',
        selectedCatalogExamples: chosen.map(productRef),
      }
    })

  const allItems = [...items, ...foundationItems]

  return {
    format: 'pqctoday-migration-planning-draft',
    formatVersion: '1.0',
    generatedAt: input.timestamp,
    disclaimer:
      'Educational planning draft only. It is not a discovered inventory, CBOM, readiness assessment, product recommendation or compliance determination.',
    sources: {
      nistIr8547Status: 'Initial Public Draft',
      cnsaScope: 'CNSA 2.0 applies primarily to U.S. National Security Systems',
      ...(input.catalogSnapshot ? { catalogSnapshot: input.catalogSnapshot } : {}),
    },
    itemCount: allItems.length,
    items: allItems,
  }
}

/** Trigger a browser download of the planning draft. No-op outside the browser. */
export function downloadPlanCbom(input: PlanExportInput): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return
  const json = JSON.stringify(buildPlanCbom(input), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pqc-migration-planning-draft.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
