// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/lib/corpusDeepLinks.ts
 *
 * The `chunk.deepLink` builders `generate-rag-corpus.ts` uses for resource
 * chunks, split out as pure functions so they can be unit-tested without
 * running the generator. Every URL here uses the canonical param the target
 * page reads (see src/services/search/deepLinkGrammar.ts) — never a legacy
 * form the page merely tolerates (e.g. Migrate's `?q=`).
 */

const enc = (s: string): string => encodeURIComponent(s.trim())

/**
 * Header-aware optional column read: the value of `column` in `row`, or ''
 * when the file has no such column. Lets the generator prefer a new id column
 * (e.g. `leader_id`, `algorithm_id`) as soon as a CSV carries it, without
 * breaking on the older files that don't.
 */
export function optionalColumn(
  header: readonly string[],
  row: readonly string[],
  column: string
): string {
  const idx = header.indexOf(column)
  return idx === -1 ? '' : (row[idx] ?? '').trim()
}

/** `/patents?patent=US<number>` — the drawer keys on the `US`-prefixed number. */
export function patentDeepLink(patentNumber: string): string {
  const bare = patentNumber.trim().replace(/^US\s*/i, '')
  return `/patents?patent=US${enc(bare)}`
}

/** `/migrate?product=<product_id>`; falls back to the exact product name. */
export function migrateProductDeepLink(productId: string, name: string): string {
  const key = productId.trim() || name.trim()
  return key ? `/migrate?product=${enc(key)}` : '/migrate'
}

/** `/migrate?tab=roadmaps&vendor=<VND id>` — the Vendor-roadmaps entry. */
export function migrateVendorDeepLink(vendorId: string): string {
  return vendorId.trim() ? `/migrate?tab=roadmaps&vendor=${enc(vendorId)}` : '/migrate?tab=roadmaps'
}

/** `/compliance?framework=<id>` — opens the framework drawer. */
export function complianceFrameworkDeepLink(frameworkId: string): string {
  return frameworkId.trim() ? `/compliance?framework=${enc(frameworkId)}` : '/compliance'
}

/** `/timeline?event=<event_id>`; `country` fallback when the row has no id. */
export function timelineEventDeepLink(eventId: string, country: string): string {
  if (eventId.trim()) return `/timeline?event=${enc(eventId)}`
  return country.trim() ? `/timeline?country=${enc(country)}` : '/timeline'
}

/** `/leaders?leader=<leader_id>`; the page still accepts the name. */
export function leaderDeepLink(leaderId: string, name: string): string {
  const key = leaderId.trim() || name.trim()
  return key ? `/leaders?leader=${enc(key)}` : '/leaders'
}

/**
 * `/algorithms?algo=<algorithm_id>`; falls back to the exact algorithm name,
 * which the page's detail drawer also accepts (a lowercased slug is not
 * guaranteed to resolve, so it is never used as the fallback).
 */
export function algorithmDeepLink(algorithmId: string, name: string): string {
  const key = algorithmId.trim() || name.trim()
  return key ? `/algorithms?algo=${enc(key)}` : '/algorithms'
}
