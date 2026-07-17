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

interface PlanExportInput {
  planIds: string[]
  choice: Record<string, string[]>
  /** ISO timestamp — passed in so the function stays deterministic/testable. */
  timestamp: string
}

const ASSET_BY_ID = new Map<string, ReplaceAsset>(REPLACE_ASSETS.map((a) => [a.id, a]))

export function buildPlanCbom(input: PlanExportInput): Record<string, unknown> {
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
        ...chosen.map((product) => ({ name: 'pqc:chosenProduct', value: product })),
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
          ...chosen.map((product) => ({ name: 'pqc:chosenProduct', value: product })),
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
