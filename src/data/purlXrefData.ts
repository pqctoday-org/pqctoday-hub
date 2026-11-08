// SPDX-License-Identifier: AGPL-3.0-only
import type { PurlXref } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'
import { buildRelatedResource, type RelatedResource } from './relatedResources'

const modules = import.meta.glob('./migrate_purl_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawPurlRow {
  product_id?: string
  software_name: string
  purl: string
  purl_type: string
  purl_namespace: string
  purl_name: string
  match_confidence: string
  status: string
  registry_url: string
  last_verified_date: string
  deprecated_at?: string
  /** A project page beside the product (blank on files written before the column existed). */
  related_resource_url?: string
  /** test_suite | sdk | source_repository | documentation | issue_tracker */
  related_resource_kind?: string
}

/** One file row as a PurlXref; null for a row the generator has retired. */
export function purlXrefFromRow(row: RawPurlRow): PurlXref | null {
  // A row carrying deprecated_at (the generator's own retirement mark) is
  // history, not a live identifier.
  if ((row.deprecated_at || '').trim()) return null
  const related = buildRelatedResource(row.related_resource_url, row.related_resource_kind)
  return {
    productId: row.product_id || '',
    softwareName: row.software_name,
    purl: row.purl,
    purlType: row.purl_type as PurlXref['purlType'],
    purlNamespace: row.purl_namespace,
    purlName: row.purl_name,
    matchConfidence: row.match_confidence as PurlXref['matchConfidence'],
    status: row.status as PurlXref['status'],
    registryUrl: row.registry_url,
    lastVerifiedDate: row.last_verified_date,
    ...(related ? { relatedResourceUrl: related.url } : {}),
    ...(related?.kind ? { relatedResourceKind: related.kind } : {}),
  }
}

const { data: allPurlXrefs, metadata } = loadLatestCSV<RawPurlRow, PurlXref>(
  modules,
  /purl_xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  purlXrefFromRow
)

/** All PURL cross-references (includes not_found rows). */
export const purlXrefs: PurlXref[] = allPurlXrefs

/**
 * Index package identifiers by productId AND by softwareName (legacy callers).
 * One package URL per product; a matched entry is preferred over
 * partial/not_found. A related resource is never part of this index's meaning:
 * it is read separately by {@link indexRelatedResources} and never stands in
 * for a package identifier or a registry address.
 */
export function indexPurlXrefs(xrefs: PurlXref[]): Map<string, PurlXref> {
  return xrefs.reduce((map, xref) => {
    for (const key of [xref.productId, xref.softwareName]) {
      if (!key) continue
      const existing = map.get(key)
      if (!existing || (existing.status !== 'matched' && xref.status === 'matched')) {
        map.set(key, xref)
      }
    }
    return map
  }, new Map<string, PurlXref>())
}

/**
 * Index each product's related resource by productId AND by softwareName. Only
 * rows that carry a usable related-resource address contribute; the first row
 * for a key wins. Reads `relatedResourceUrl` only, so it never falls back to
 * `registryUrl` or `purl`.
 */
export function indexRelatedResources(xrefs: PurlXref[]): Map<string, RelatedResource> {
  const index = new Map<string, RelatedResource>()
  for (const xref of xrefs) {
    const resource = buildRelatedResource(xref.relatedResourceUrl, xref.relatedResourceKind)
    if (!resource) continue
    for (const key of [xref.productId, xref.softwareName]) {
      if (key && !index.has(key)) index.set(key, resource)
    }
  }
  return index
}

/**
 * Lookup map: productId or softwareName → PurlXref
 * One package URL per product. Only matched entries are useful for display.
 */
export const purlByProduct: Map<string, PurlXref> = indexPurlXrefs(allPurlXrefs)

/** Lookup map: productId or softwareName → the product's related resource. */
export const relatedResourceByProduct: Map<string, RelatedResource> =
  indexRelatedResources(allPurlXrefs)

/** A product's related resource, by productId first and then by softwareName. */
export function getRelatedResource(
  productId: string,
  softwareName: string
): RelatedResource | undefined {
  return relatedResourceByProduct.get(productId) ?? relatedResourceByProduct.get(softwareName)
}

/** CSV file metadata. */
export const purlXrefMetadata = metadata
