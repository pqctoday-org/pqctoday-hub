// SPDX-License-Identifier: GPL-3.0-only
//
// Export the user's migration plan as a CycloneDX-flavoured JSON document.
// 07092026: this builds its OWN inline object shape (below) — it does NOT
// call the shared, schema-validated emitter at services/cbom/cycloneDx.ts
// (that emitter now targets CycloneDX 1.7; this file was never independently
// validated against either version). Informally mirrors the shape used
// elsewhere in the app (modules/CryptoAgility) rather than inventing a new
// one, but "CycloneDX-flavoured" is the honest description, not a schema
// conformance claim. This is a plan export, not a full scan — each planned
// asset becomes a component carrying its classical→PQC target, decision,
// wave, and chosen product (if any).

import {
  REPLACE_ASSETS,
  DECISIONS,
  DOMAINS,
  type ReplaceAsset,
  type DomainId,
} from '@/data/migrationAssets'

/** The catalogue fields a CBOM needs to pin a chosen product to a release. */
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
  // when the catalogue knows them, so the CBOM says WHICH release was planned.
  const productProps = (name: string) => {
    const ref = byName.get(name)
    return [
      { name: 'pqc:chosenProduct', value: name },
      ...(ref ? [{ name: 'pqc:chosenProductId', value: ref.productId }] : []),
      ...(ref?.latestVersion
        ? [{ name: 'pqc:chosenProductVersion', value: ref.latestVersion }]
        : []),
      ...(ref?.releaseDate
        ? [{ name: 'pqc:chosenProductReleaseDate', value: ref.releaseDate }]
        : []),
    ]
  }
  const assets = input.planIds
    .map((id) => ASSET_BY_ID.get(id))
    .filter((a): a is ReplaceAsset => !!a)

  const components = assets.map((asset) => {
    const decision = DECISIONS[asset.decision]
    const chosen = input.choice[asset.id] ?? []
    return {
      type: 'cryptographic-asset',
      name: asset.label,
      description: asset.note,
      properties: [
        { name: 'pqc:classical', value: asset.classical },
        { name: 'pqc:target', value: asset.target },
        { name: 'pqc:decision', value: decision.label },
        { name: 'pqc:gaPathExists', value: String(decision.ready) },
        { name: 'pqc:wave', value: String(asset.wave) },
        { name: 'pqc:cnsaYear', value: String(asset.cnsaYear) },
        { name: 'pqc:hndl', value: String(asset.hndl) },
        // one property per chosen product (multi-select)
        ...chosen.flatMap(productProps),
      ],
    }
  })

  // FIXED 2026-07-16 (migrate-process remediation Phase 5, U7): planIds mixes
  // real ReplaceAsset ids with foundation/infrastructure DOMAIN ids (crypto
  // libraries etc. have no ReplaceAsset — computePosture in
  // useMigrationPlan.ts already handles this split; this export never did,
  // so any product chosen for a foundation domain silently never appeared
  // in the downloaded CBOM at all).
  const knownAssetIds = new Set<string>(assets.map((a) => a.id))
  const foundationComponents = input.planIds
    .filter((id) => !knownAssetIds.has(id))
    .map((id) => DOMAINS[id as DomainId])
    .filter((d): d is NonNullable<typeof d> => !!d && d.kind === 'foundation')
    .map((domain) => {
      const chosen = input.choice[domain.id] ?? []
      return {
        type: 'cryptographic-asset',
        name: domain.label,
        description: `Foundation/infrastructure domain (no wave/CNSA-deadline model — see pqc:chosenProduct)`,
        properties: [
          { name: 'pqc:domainKind', value: 'foundation' },
          ...chosen.flatMap(productProps),
        ],
      }
    })

  const allComponents = [...components, ...foundationComponents]

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    metadata: {
      timestamp: input.timestamp,
      component: { type: 'application', name: 'PQC Migration Plan' },
      properties: [
        { name: 'pqc:standard', value: 'NIST IR 8547 (Initial Public Draft) / CNSA 2.0' },
        ...(input.catalogSnapshot
          ? [{ name: 'pqc:catalogSnapshot', value: input.catalogSnapshot }]
          : []),
        { name: 'pqc:assetCount', value: String(allComponents.length) },
      ],
    },
    components: allComponents,
  }
}

/** Trigger a browser download of the plan CBOM. No-op outside the browser. */
export function downloadPlanCbom(input: PlanExportInput): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return
  const json = JSON.stringify(buildPlanCbom(input), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pqc-migration-plan.cbom.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
