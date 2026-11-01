// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Hybrid KEM and composite-signature support of a catalogue product.
 *
 * Two optional catalogue columns:
 *   hybrid_kem_support  'none', or tokens joined with '+':
 *                       tls-default, tls-optin, api, api-experimental
 *   hybrid_sig_support  'none', 'api' or 'api-experimental'
 *
 * A blank cell (or a missing column) means the product has not been assessed:
 * the parsers return undefined and nothing is shown. Unknown tokens are
 * ignored, so a typo never renders as a claim.
 */
import type { HybridKemToken, HybridSigToken, SoftwareItem } from '@/types/MigrateTypes'
import type { Tone } from './migrateToneClass'

const KEM_TOKENS: readonly HybridKemToken[] = [
  'tls-default',
  'tls-optin',
  'api',
  'api-experimental',
  'none',
]
const SIG_TOKENS: readonly HybridSigToken[] = ['api', 'api-experimental', 'none']

function tokens(raw: string | undefined): string[] {
  return (raw ?? '')
    .split('+')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

/** `hybrid_kem_support` cell → known tokens in display order, or undefined
 *  when not assessed. 'none' is dropped when a real capability is also listed. */
export function parseHybridKemSupport(raw: string | undefined): HybridKemToken[] | undefined {
  const seen = new Set(tokens(raw))
  const known = KEM_TOKENS.filter((t) => seen.has(t))
  if (known.length === 0) return undefined
  const real = known.filter((t) => t !== 'none')
  return real.length > 0 ? real : ['none']
}

/** `hybrid_sig_support` cell → its token, or undefined when not assessed. */
export function parseHybridSigSupport(raw: string | undefined): HybridSigToken | undefined {
  const seen = new Set(tokens(raw))
  return SIG_TOKENS.find((t) => seen.has(t))
}

export const HYBRID_KEM_LABEL: Record<HybridKemToken, string> = {
  'tls-default': 'Hybrid TLS (default)',
  'tls-optin': 'Hybrid TLS (opt-in)',
  api: 'Hybrid KEM API',
  'api-experimental': 'Hybrid KEM API (experimental)',
  none: 'No hybrid KEM',
}

export const HYBRID_SIG_LABEL: Record<HybridSigToken, string> = {
  api: 'Composite signature API',
  'api-experimental': 'Composite signature (experimental)',
  none: 'No composite signature',
}

const TOKEN_TONE: Record<HybridKemToken, Tone> = {
  'tls-default': 'success',
  'tls-optin': 'info',
  api: 'info',
  'api-experimental': 'warning',
  none: 'muted',
}

export interface HybridBadge {
  key: string
  label: string
  tone: Tone
}

/** Badges for a product's assessed hybrid support; empty when neither column is assessed. */
export function hybridSupportBadges(product: SoftwareItem): HybridBadge[] {
  const badges: HybridBadge[] = (product.hybridKemSupport ?? []).map((t) => ({
    key: `kem-${t}`,
    label: HYBRID_KEM_LABEL[t],
    tone: TOKEN_TONE[t],
  }))
  if (product.hybridSigSupport) {
    const t = product.hybridSigSupport
    badges.push({ key: `sig-${t}`, label: HYBRID_SIG_LABEL[t], tone: TOKEN_TONE[t] })
  }
  return badges
}

/** Replace-tab hybrid filter options. */
export type HybridFacet = 'tls-default' | 'kem-api' | 'sig-api'

/** Filter option labels, shared by the desktop dropdown and the phone's facet chips. */
export const HYBRID_FACET_LABEL: Record<HybridFacet, string> = {
  'tls-default': 'Hybrid TLS by default',
  'kem-api': 'Hybrid KEM API',
  'sig-api': 'Composite signature API',
}

/** Does a product match a hybrid filter option? Unassessed products never match. */
export function matchesHybridFacet(product: SoftwareItem, facet: HybridFacet): boolean {
  const kem = product.hybridKemSupport ?? []
  if (facet === 'tls-default') return kem.includes('tls-default')
  if (facet === 'kem-api') return kem.includes('api') || kem.includes('api-experimental')
  return product.hybridSigSupport === 'api' || product.hybridSigSupport === 'api-experimental'
}
