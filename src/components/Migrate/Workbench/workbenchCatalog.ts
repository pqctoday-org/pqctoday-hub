// SPDX-License-Identifier: GPL-3.0-only
//
// Builds a domain → products index from the live catalog once, using the
// audited classifyProductDomain mapping. Every active product lands in exactly
// one domain (guaranteed by migrationAssets.coverage.test.ts), so the
// asset-first IA never hides a product.

import { softwareData, vendorMap, retiredProductSuccessors } from '@/data/migrateData'
import { classifyProductDomain, DOMAINS, type DomainId } from '@/data/migrationAssets'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { PQC_STATUS_RANK, productPqcStatus } from './productStatus'

const INDEX = new Map<DomainId, SoftwareItem[]>()

for (const item of softwareData) {
  const domain = classifyProductDomain(item.categoryName, item.infrastructureLayer)
  if (!domain) continue // coverage test forbids this for active rows
  const list = INDEX.get(domain)
  if (list) list.push(item)
  else INDEX.set(domain, [item])
}

// Pre-sort each domain: GA → Partial → Roadmap → None, then FIPS-validated up,
// then by name for stability.
for (const list of INDEX.values()) {
  list.sort((a, b) => {
    const ra = PQC_STATUS_RANK[productPqcStatus(a).status]
    const rb = PQC_STATUS_RANK[productPqcStatus(b).status]
    if (ra !== rb) return ra - rb
    const fa = (a.fipsValidated || '').toLowerCase().startsWith('yes') ? 0 : 1
    const fb = (b.fipsValidated || '').toLowerCase().startsWith('yes') ? 0 : 1
    if (fa !== fb) return fa - fb
    return a.softwareName.localeCompare(b.softwareName)
  })
}

/** Products whose domain === the given domain id (already status-sorted). */
export function productsForDomain(domain: DomainId): SoftwareItem[] {
  return INDEX.get(domain) ?? []
}

// vendorId → products index (status-sorted), for the vendor-roadmap tab.
const VENDOR_INDEX = new Map<string, SoftwareItem[]>()
for (const item of softwareData) {
  if (!item.vendorId) continue
  const list = VENDOR_INDEX.get(item.vendorId)
  if (list) list.push(item)
  else VENDOR_INDEX.set(item.vendorId, [item])
}
for (const list of VENDOR_INDEX.values()) {
  list.sort((a, b) => {
    const ra = PQC_STATUS_RANK[productPqcStatus(a).status]
    const rb = PQC_STATUS_RANK[productPqcStatus(b).status]
    return ra - rb || a.softwareName.localeCompare(b.softwareName)
  })
}

/** Products belonging to a vendor (already status-sorted). */
export function productsForVendor(vendorId: string): SoftwareItem[] {
  return VENDOR_INDEX.get(vendorId) ?? []
}

/** Count of products per domain (for sidebar/section counts). */
export function domainProductCount(domain: DomainId): number {
  return INDEX.get(domain)?.length ?? 0
}

/** Free-text filter within a product list (name / vendor-ish / category). */
/** `productIds`, when given, is an EXACT membership filter (by SoftwareItem.productId)
 * that takes over from the free-text `query` entirely — added 2026-07-30 for the
 * leader-detail "view N open-source projects" deep link, which already knows the
 * exact product ids (leader.migrateCatalogRefs) and shouldn't re-derive them via a
 * fuzzy text match the way the plain `query` path does. */
export function filterProducts(
  items: SoftwareItem[],
  query: string,
  productIds?: string[]
): SoftwareItem[] {
  if (productIds && productIds.length > 0) {
    const wanted = new Set(productIds)
    return items.filter((p) => wanted.has(p.productId))
  }
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (p) =>
      p.softwareName.toLowerCase().includes(q) ||
      (p.categoryName || '').toLowerCase().includes(q) ||
      (p.vendorId || '').toLowerCase().includes(q) ||
      p.productId.toLowerCase() === q
  )
}

/** Facet filters on the product list (migrate remediation r2 J2). 'all' = no filter. */
export interface ProductFacets {
  population: 'all' | 'pqc_relevant' | 'migration_baseline'
  pqc: 'all' | 'available' | 'partial' | 'planned' | 'none' | 'unknown'
  certified: 'all' | 'linked' | 'none'
}

export const NO_FACETS: ProductFacets = { population: 'all', pqc: 'all', certified: 'all' }

/**
 * Narrow a product list by population, canonical PQC status and whether the
 * product has any certification link. `hasCert` is injected so this stays a
 * pure function (the certification xref loader is a separate module).
 */
export function applyProductFacets(
  items: SoftwareItem[],
  facets: ProductFacets,
  hasCert: (item: SoftwareItem) => boolean
): SoftwareItem[] {
  return items.filter((p) => {
    if (facets.population !== 'all' && p.cataloguePopulation !== facets.population) return false
    if (facets.pqc !== 'all') {
      const s = (p.pqcStatusCanonical || '').toLowerCase()
      const bucket =
        s === 'available' || s === 'partial' || s === 'none'
          ? s
          : s === 'roadmap' || s === 'planned'
            ? 'planned'
            : 'unknown'
      if (bucket !== facets.pqc) return false
    }
    if (facets.certified !== 'all' && hasCert(p) !== (facets.certified === 'linked')) return false
    return true
  })
}

export interface ProductSearchHit {
  domain: DomainId
  product: SoftwareItem
  vendorName?: string
}

/**
 * Cross-domain product/vendor-name search for the top-level "Search what you
 * run" box in AssetList — that box previously only matched the ~18 asset and
 * foundation-category LABELS (e.g. "TLS key exchange"), so a real product
 * name like "Qinsight" always returned "No matches" even though the product
 * is in the catalog, just filed under a category the user hadn't picked yet.
 * This searches every product's name and vendor name (not just its raw
 * vendorId code) across ALL domains at once. Capped via `limit` so the
 * sidebar stays a quick jump-to, not a second full product browser — the
 * in-domain filter box (`filterProducts`) is still the right place to browse
 * a whole category.
 */
export function searchProducts(query: string, limit = 6): ProductSearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: ProductSearchHit[] = []
  for (const [domain, items] of INDEX) {
    for (const product of items) {
      const vendorName = product.vendorId ? vendorMap.get(product.vendorId)?.vendorName : undefined
      if (
        product.softwareName.toLowerCase().includes(q) ||
        (vendorName || '').toLowerCase().includes(q) ||
        product.productId.toLowerCase() === q
      ) {
        hits.push({ domain, product, vendorName })
      }
    }
  }
  hits.sort((a, b) => a.product.softwareName.localeCompare(b.product.softwareName))
  return hits.slice(0, limit)
}

// ── Product deep links (?product= / ?productIds=) ─────────────────────────
// Deep-link remediation PR 1 (2026-09-28): a link may name a product by its
// product_id, by its exact display name (case-insensitive), or by a former
// name — migrateData already folds deprecated-duplicate rows' names into the
// kept row's formerNames, so an old name resolves to its successor here.

const lc = (s: string) => s.trim().toLowerCase()
const BY_ID = new Map<string, SoftwareItem>()
const BY_NAME = new Map<string, SoftwareItem>()
const BY_FORMER_NAME = new Map<string, SoftwareItem>()
for (const item of softwareData) {
  if (item.productId && !BY_ID.has(lc(item.productId))) BY_ID.set(lc(item.productId), item)
  if (item.softwareName && !BY_NAME.has(lc(item.softwareName))) {
    BY_NAME.set(lc(item.softwareName), item)
  }
  for (const n of item.formerNames ?? []) {
    if (n && !BY_FORMER_NAME.has(lc(n))) BY_FORMER_NAME.set(lc(n), item)
  }
}

/** Resolve one link token: product_id first, then exact name, then former
 *  name, then a retired product_id's successor (PR 2 — migrateData's
 *  retiredProductSuccessors, read from the catalog's deprecated rows). */
export function resolveProductRef(
  token: string
): { product: SoftwareItem; viaFormerName: boolean; viaRetiredId?: boolean } | null {
  const key = lc(token)
  if (!key) return null
  const direct = BY_ID.get(key) ?? BY_NAME.get(key)
  if (direct) return { product: direct, viaFormerName: false }
  const former = BY_FORMER_NAME.get(key)
  if (former) return { product: former, viaFormerName: true }
  const successorId = retiredProductSuccessors.get(key)
  const successor = successorId ? BY_ID.get(lc(successorId)) : undefined
  return successor ? { product: successor, viaFormerName: false, viaRetiredId: true } : null
}

export interface ProductLinkResolution {
  /** Resolved products, de-duplicated, in link order. */
  products: SoftwareItem[]
  /** Tokens that matched nothing in the active catalog (retired, draft, mistyped). */
  missing: string[]
  /** Tokens that only matched a former name — shown with their successor. */
  renamed: Array<{ from: string; to: SoftwareItem }>
  /** Retired product ids that were replaced by another row — shown with it. */
  retired?: Array<{ from: string; to: SoftwareItem }>
}

/** Resolve the raw `?product=` (one id or name — names may contain commas, so
 *  never split) and `?productIds=` (comma-separated) values together. */
export function resolveProductLink(
  product: string | null,
  productIds: string | null
): ProductLinkResolution {
  const tokens = [
    ...(product?.trim() ? [product.trim()] : []),
    ...(productIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ]
  const seen = new Set<string>()
  const out: ProductLinkResolution = { products: [], missing: [], renamed: [], retired: [] }
  for (const token of tokens) {
    const hit = resolveProductRef(token)
    if (!hit) {
      out.missing.push(token)
      continue
    }
    if (hit.viaFormerName) out.renamed.push({ from: token, to: hit.product })
    if (hit.viaRetiredId) out.retired!.push({ from: token, to: hit.product })
    if (seen.has(hit.product.productId)) continue
    seen.add(hit.product.productId)
    out.products.push(hit.product)
  }
  return out
}

/** Reader-facing "not found" text for a resolution, or null when every token
 *  resolved under its current name. */
export function productLinkNoticeMessage(res: ProductLinkResolution): string | null {
  const parts: string[] = []
  if (res.missing.length === 1) {
    parts.push(
      `No product matching “${res.missing[0]}” is in the catalog — it may have been retired, renamed or mistyped.`
    )
  } else if (res.missing.length > 1) {
    parts.push(
      `${res.missing.length} linked products aren’t in the catalog (${res.missing
        .map((m) => `“${m}”`)
        .join(', ')}) — they may have been retired, renamed or mistyped.`
    )
  }
  for (const { from, to } of res.renamed) {
    parts.push(
      `“${from}” is no longer listed under that name — showing its successor, ${to.softwareName}.`
    )
  }
  for (const { from, to } of res.retired ?? []) {
    parts.push(`“${from}” was retired from the catalog — replaced by ${to.softwareName}.`)
  }
  return parts.length ? parts.join(' ') : null
}

// ── Other inbound /migrate link params (deep-link remediation PR 2) ───────
// Pages, global search and the RAG corpus already emit ?q=, ?search=,
// ?highlight=, ?layer=, ?cat=, ?category=, ?subcat=, ?industry= and ?vendor=,
// none of which the workbench used to read (every one landed on TLS). PR 3
// rewrites the emitters; until then these map onto real workbench state.
// Pure, so the desktop workbench and MobileMigrateView resolve identically.

/** Every param this resolver reads — the "link identity" (see migrateLinkKey)
 *  and the set dropped once the reader moves on from a linked view. */
export const MIGRATE_LINK_PARAMS = [
  'product',
  'productIds',
  'q',
  'search',
  'highlight',
  'layer',
  'cat',
  'category',
  'subcat',
  'industry',
  'vendor',
  'domain',
] as const

/** The params that describe a one-off link (everything except ?domain=, which
 *  is ordinary Replace-tab view state and survives the reader moving on). */
export const MIGRATE_TRANSIENT_LINK_PARAMS = MIGRATE_LINK_PARAMS.filter((k) => k !== 'domain')

/** Stable identity of the link params in a query string (order-independent). */
export function migrateLinkKey(get: (key: string) => string | null): string {
  return MIGRATE_LINK_PARAMS.map((k) => `${k}=${get(k) ?? ''}`).join('&')
}

const productDomain = (p: SoftwareItem) =>
  classifyProductDomain(p.categoryName, p.infrastructureLayer)

/** The domain at least half of `items` classify into, else null. */
function majorityDomain(items: SoftwareItem[]): DomainId | null {
  const counts = new Map<DomainId, number>()
  for (const p of items) {
    const d = productDomain(p)
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1)
  }
  for (const [d, n] of counts) if (n * 2 >= items.length) return d
  return null
}

const DOMAIN_BY_REF = new Map<string, DomainId>()
for (const meta of Object.values(DOMAINS)) {
  DOMAIN_BY_REF.set(lc(meta.id), meta.id)
  DOMAIN_BY_REF.set(lc(meta.label), meta.id)
}

/** ?domain= — a DomainId ('hsm') or its label ('HSM-protected keys'), any case. */
export function resolveDomainRef(value: string): DomainId | null {
  return DOMAIN_BY_REF.get(lc(value)) ?? null
}

// Exact catalog category_name / infrastructure_layer token → the domain at
// least half of its products classify into (layer "Hardware" → 'hardware',
// "Libraries" → 'foundations'), built from the live catalog so it can't drift
// from classifyProductDomain. A mixed layer with no majority ("AppServers",
// "Security Stack", "Cloud") uses migrationAssets' own curated layer
// fallback instead (classifyProductDomain with only the layer set).
const DOMAIN_BY_CATEGORY = new Map<string, DomainId>()
const DOMAIN_BY_LAYER = new Map<string, DomainId>()
{
  const byCategory = new Map<string, SoftwareItem[]>()
  const byLayer = new Map<string, SoftwareItem[]>()
  const push = (m: Map<string, SoftwareItem[]>, k: string, p: SoftwareItem) => {
    if (!k) return
    const list = m.get(k)
    if (list) list.push(p)
    else m.set(k, [p])
  }
  for (const p of softwareData) {
    push(byCategory, lc(p.categoryName || ''), p)
    for (const layer of (p.infrastructureLayer || '').split(',')) push(byLayer, lc(layer), p)
  }
  for (const [k, items] of byCategory) {
    const d = majorityDomain(items) ?? classifyProductDomain(k, '')
    if (d) DOMAIN_BY_CATEGORY.set(k, d)
  }
  for (const [k, items] of byLayer) {
    const d = majorityDomain(items) ?? classifyProductDomain('', k)
    if (d) DOMAIN_BY_LAYER.set(k, d)
  }
}

/**
 * ?layer= / ?cat= / ?category= / ?subcat= → a domain. Tries, in order: a
 * domain id or label, an exact catalog category name, an exact
 * infrastructure-layer token (both → the domain most of their products live
 * in, see above), then classifyProductDomain's keyword rules on the raw text (for
 * category names the catalog no longer uses verbatim, e.g. "PQC TLS
 * Gateway"). null when nothing matches — the caller shows "not found".
 */
export function resolveTaxonomyRef(value: string): DomainId | null {
  const key = lc(value)
  if (!key) return null
  return (
    resolveDomainRef(value) ??
    DOMAIN_BY_CATEGORY.get(key) ??
    DOMAIN_BY_LAYER.get(key) ??
    classifyProductDomain(value, value)
  )
}

/** Vendors the Roadmaps tab has a card for (published roadmap and/or enrichment). */
export function vendorHasRoadmapCard(vendorId: string): boolean {
  return roadmapByVendorId.has(vendorId) || enrichmentByVendorId.has(vendorId)
}

/** Display name the Roadmaps tab uses for a vendor. */
export function roadmapVendorName(vendorId: string): string {
  return (
    roadmapByVendorId.get(vendorId)?.[0]?.vendorName ||
    vendorMap.get(vendorId)?.vendorDisplayName ||
    vendorId
  )
}

const VENDOR_BY_REF = new Map<string, string>()
{
  const add = (k: string | undefined, id: string) => {
    if (k && !VENDOR_BY_REF.has(lc(k))) VENDOR_BY_REF.set(lc(k), id)
  }
  for (const [id, v] of vendorMap) {
    add(id, id)
    add(v.vendorDisplayName, id)
    add(v.vendorName, id)
  }
  for (const [id, rows] of roadmapByVendorId) {
    add(id, id)
    for (const r of rows) add(r.vendorName, id)
  }
  for (const id of enrichmentByVendorId.keys()) add(id, id)
}

/** ?vendor= — a VND-id or a vendor name (display name, legal name or the name
 *  on its roadmap row), any case. Returns the vendorId or null. */
export function resolveVendorRef(value: string): string | null {
  return VENDOR_BY_REF.get(lc(value)) ?? null
}

/** Domain with the most products matching a free-text query (the Replace
 *  tab's own filterProducts matcher), or null when nothing matches anywhere. */
export function bestDomainForQuery(query: string): DomainId | null {
  if (!query.trim()) return null
  let best: DomainId | null = null
  let bestCount = 0
  for (const d of Object.keys(DOMAINS) as DomainId[]) {
    const n = filterProducts(productsForDomain(d), query).length
    if (n > bestCount) {
      best = d
      bestCount = n
    }
  }
  return best
}

export interface MigrateLinkIntent {
  /** Tab the link asks for; undefined = leave the current tab alone (a bare
   *  ?domain= is Replace-tab view state, not a request to switch tabs). */
  tab?: 'replace' | 'roadmaps'
  domain?: DomainId
  /** Text to pre-fill the Replace tab's product filter with. */
  filter?: string
  /** Exact product ids to show in `domain` (only those that live in it). */
  productIds?: string[]
  /** The single linked product to auto-expand. */
  expandId?: string
  /** Vendor whose roadmap card to open on the Roadmaps tab. */
  vendorId?: string
  /** Linked products that live in other domains than `domain` (multi-domain
   *  ?productIds=), grouped per domain so each group can be its own link. */
  elsewhere: Array<{ domain: DomainId; products: SoftwareItem[] }>
  /** Reader-facing not-found / retired text, or null. */
  notice: string | null
}

/**
 * Turn a /migrate query string into workbench state. Precedence: explicit
 * products (?product/?productIds) → ?vendor → search text (?q/?search/
 * ?highlight, which may name one product, a vendor, or just text) →
 * taxonomy (?domain, then ?layer/?cat/?category/?subcat). ?industry= has no
 * workbench equivalent and is ignored, but still lands on Replace. An
 * unknown value never silently falls back to TLS: it yields a notice.
 */
export function resolveMigrateLink(get: (key: string) => string | null): MigrateLinkIntent {
  const notices: string[] = []
  const out: MigrateLinkIntent = { elsewhere: [], notice: null }
  const finish = () => {
    out.notice = notices.length ? notices.join(' ') : null
    return out
  }
  const val = (k: string) => get(k)?.trim() || null

  const applyProducts = (products: SoftwareItem[]) => {
    const first = products[0]
    const domain = first ? productDomain(first) : null
    if (!first || !domain) return false
    out.tab = 'replace'
    out.domain = domain
    out.productIds = products.filter((p) => productDomain(p) === domain).map((p) => p.productId)
    if (products.length === 1) out.expandId = first.productId
    const groups = new Map<DomainId, SoftwareItem[]>()
    for (const p of products) {
      const d = productDomain(p)
      if (!d || d === domain) continue
      const list = groups.get(d)
      if (list) list.push(p)
      else groups.set(d, [p])
    }
    out.elsewhere = [...groups].map(([d, ps]) => ({ domain: d, products: ps }))
    return true
  }

  // 1. Explicit products.
  const product = val('product')
  const productIds = val('productIds')
  if (product || productIds) {
    const res = resolveProductLink(product, productIds)
    const msg = productLinkNoticeMessage(res)
    if (msg) notices.push(msg)
    if (applyProducts(res.products)) return finish()
  }

  // 2. Vendor roadmap.
  const vendor = val('vendor')
  if (vendor) {
    out.tab = 'roadmaps'
    const vendorId = resolveVendorRef(vendor)
    if (!vendorId) {
      notices.push(`No vendor matching “${vendor}” is in the catalog.`)
    } else if (!vendorHasRoadmapCard(vendorId)) {
      notices.push(`${roadmapVendorName(vendorId)} has no published PQC roadmap yet.`)
    } else {
      out.vendorId = vendorId
    }
    return finish()
  }

  const text = val('q') ?? val('search') ?? val('highlight')
  const domainValue = val('domain')
  const taxValue = val('layer') ?? val('subcat') ?? val('cat') ?? val('category')
  const industry = val('industry')

  // 3. Taxonomy (+ text as the in-domain filter when both are present).
  let taxDomain: DomainId | null = null
  if (domainValue) {
    taxDomain = resolveDomainRef(domainValue)
    if (!taxDomain) notices.push(`No product category “${domainValue}” — showing the default.`)
  }
  if (!taxDomain && taxValue) {
    taxDomain = resolveTaxonomyRef(taxValue)
    if (!taxDomain) notices.push(`No product category matching “${taxValue}”.`)
  }
  if (taxDomain) {
    out.domain = taxDomain
    if (taxValue || text || industry) out.tab = 'replace'
    if (text) out.filter = text
    return finish()
  }

  // 4. Free text on its own: one product, else the best domain + filter,
  //    else a vendor name, else not found.
  if (text) {
    out.tab = 'replace'
    const hit = resolveProductRef(text)
    if (hit) {
      if (hit.viaFormerName || hit.viaRetiredId) {
        const msg = productLinkNoticeMessage({
          products: [hit.product],
          missing: [],
          renamed: hit.viaFormerName ? [{ from: text, to: hit.product }] : [],
          retired: hit.viaRetiredId ? [{ from: text, to: hit.product }] : [],
        })
        if (msg) notices.push(msg)
      }
      applyProducts([hit.product])
      return finish()
    }
    const best = bestDomainForQuery(text)
    if (best) {
      out.domain = best
      out.filter = text
      return finish()
    }
    const vendorId = resolveVendorRef(text)
    if (vendorId && vendorHasRoadmapCard(vendorId)) {
      out.tab = 'roadmaps'
      out.vendorId = vendorId
      return finish()
    }
    notices.push(`No product or vendor matching “${text}” is in the catalog.`)
    return finish()
  }

  // 5. ?industry= alone: nothing to map it to — land on Replace, no notice.
  if (industry || taxValue) out.tab = 'replace'
  return finish()
}
