// SPDX-License-Identifier: GPL-3.0-only
/**
 * CycloneDX CBOM (Cryptographic Bill of Materials) export for the Migrate page.
 *
 * Thin `SoftwareItem` adapter over the shared CycloneDX 1.6 emitter in
 * `services/cbom/cycloneDx.ts`. Maps each product to a `library` component
 * carrying its CPE / PURL / FIPS-cert identity plus a child `cryptographic-asset`
 * per exposed PQC algorithm. The same emitter now backs the Library CBOM Builder
 * and the Supply-Chain Risk Matrix, so all three produce identical schema-valid
 * documents.
 *
 * Additive: nothing here runs unless the user clicks "Export CBOM". When unused,
 * the Migrate page behaves exactly as before.
 */
import type { SoftwareItem, CertificationXref } from '../../types/MigrateTypes'
import { cpeByProduct } from '../../data/cpeXrefData'
import { purlByProduct } from '../../data/purlXrefData'
import { certsByProduct } from '../../data/certificationXrefData'
import {
  buildCbomDocument,
  cbomBomRef,
  downloadCbomJson,
  extractPqcAlgorithmsFromText,
  type CbomAlgorithm,
  type CbomBuildResult,
  type CbomComponentInput,
  type CbomProperty,
} from '../../services/cbom/cycloneDx'

export type { CbomBuildResult }

/** Extract the distinct canonical PQC algorithms a product (and its certs) expose. */
export function extractPqcAlgorithms(
  item: SoftwareItem,
  certs: CertificationXref[]
): CbomAlgorithm[] {
  const haystack = [
    item.pqcSupport,
    item.pqcCapabilityDescription,
    ...certs.map((c) => c.pqcAlgorithms),
  ]
    .filter(Boolean)
    .join(' ')
  return extractPqcAlgorithmsFromText(haystack)
}

/**
 * Map one `SoftwareItem` to a neutral CBOM component input. Exported so other
 * SoftwareItem-backed tools (e.g. the Supply-Chain Risk Matrix) reuse the exact
 * same mapping — optionally tagging extra properties (e.g. asset class).
 */
export function softwareItemToCbomInput(
  item: SoftwareItem,
  extraProperties: CbomProperty[] = []
): CbomComponentInput {
  const cpe = cpeByProduct.get(item.softwareName)
  const purl = purlByProduct.get(item.softwareName)
  const certs = certsByProduct.get(item.softwareName) ?? []

  const properties: CbomProperty[] = [
    { name: 'pqctoday:infrastructureLayer', value: item.infrastructureLayer || '' },
    { name: 'pqctoday:cisaCategory', value: item.cisaCategory || '' },
    { name: 'pqctoday:pqcSupport', value: item.pqcSupport || '' },
    { name: 'pqctoday:migrationPriority', value: item.pqcMigrationPriority || '' },
  ].filter((p) => p.value)
  if (item.fipsValidated) {
    properties.push({ name: 'pqctoday:fipsValidated', value: item.fipsValidated })
  }
  properties.push(...extraProperties)

  return {
    type: 'library',
    name: item.softwareName,
    bomRef: cbomBomRef(item.softwareName, item.productId),
    version: item.latestVersion || undefined,
    description: item.productBrief || undefined,
    cpe: cpe?.cpeUri,
    purl: purl?.purl,
    properties,
    certifications: certs.map((c) => ({
      certType: c.certType,
      certId: c.certId,
      certLink: c.certLink,
    })),
    algorithms: extractPqcAlgorithms(item, certs),
  }
}

/** Build a CycloneDX 1.6 CBOM document from the given product set. */
export function buildCycloneDxCbom(items: SoftwareItem[]): CbomBuildResult {
  return buildCbomDocument(
    items.map((item) => softwareItemToCbomInput(item)),
    {
      toolName: 'Migrate CBOM Export',
      properties: [
        { name: 'pqctoday:source', value: 'pqctoday-hub /migrate' },
        { name: 'pqctoday:productCount', value: String(items.length) },
      ],
    }
  )
}

/** Trigger a browser download of the CBOM JSON for the given products. */
export function downloadCbom(items: SoftwareItem[]): CbomBuildResult {
  const result = buildCycloneDxCbom(items)
  downloadCbomJson(result.json, 'pqc-cbom-cyclonedx')
  return result
}
