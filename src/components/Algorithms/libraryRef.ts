// SPDX-License-Identifier: AGPL-3.0-only
//
// Resolve a protocol-matrix spec id (e.g. "RFC-4253",
// "draft-ietf-sshm-mlkem-hybrid-kex-10") to the matching Library referenceId so
// the matrix can deep-link to the in-app Library entry (/library?ref=…) instead
// of opening the raw external RFC/datatracker page. Matrix ids and Library
// referenceIds differ in shape ("RFC-4253" vs "RFC 4253"), and draft versions
// can differ between the two, so we match on a normalized key. When the id
// alone does not match, the cited link is tried against each Library entry's
// own download address: the same document at the same address is the same
// document, whatever the two sides call it.

import { libraryData, type LibraryItem } from '@/data/libraryData'

/** Normalized comparison key: RFCs → `rfc<number>`; drafts → slug without the
 *  trailing `-NN` version; everything else → a slug. */
function normalizeRefKey(id: string): string {
  const s = (id || '').toLowerCase().trim()
  const rfc = /rfc[\s-]?(\d{3,5})/.exec(s)
  if (rfc) return `rfc${rfc[1]}`
  if (s.startsWith('draft-')) return s.replace(/-\d+$/, '') // ignore draft version
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Explicit aliases for specs whose matrix id and Library referenceId diverge
// too much for the normalizer (different vendor/version naming). Each target is
// verified to exist in the loaded Library.
const SPEC_ALIASES: Record<string, string> = {
  'PKCS11-v3.2-OS': 'PKCS11-V32-OS-OASIS',
  // No KMIP 3.0 entry exists in the Library — only KMIP 2.1 (2021, pre-PQC).
  // Deliberately NOT aliased to KMIP-V2-1-OASIS: that would present a
  // pre-quantum spec as if it were the cited v3.0 CSD01. Falls through to the
  // `?q=` search fallback below, which is honestly labeled as a search.
  'Signal-PQXDH-Rev3': 'Signal-PQXDH-Spec',
  // Library only has the UEFI 2.10 write-up cached; 2.11 (current) adds no PQC
  // content of its own, so the underlying PQC-readiness story is identical.
  'UEFI-2.11': 'UEFI-SPEC-2.10-SecureBoot',
  '3GPP-TR-33.938': '3GPP-PQC-Study-2025',
  // The matrix's "…Part3-Published" was superseded in the Library by the v1.85 Errata.
  'TCG-TPM-2.0-Library-v1.85-Part3-Published': 'TCG-TPM-2.0-Library-v1.85-Errata',
  // Per-cell references (DimensionRef.id) use the space-separated vendor form that
  // the matrix audit requires, so they need their own entries next to the
  // hyphenated ProtocolDoc ids above.
  'PKCS#11 v3.2 OS': 'PKCS11-V32-OS-OASIS',
  'Signal PQXDH': 'Signal-PQXDH-Spec',
  'UEFI 2.11': 'UEFI-SPEC-2.10-SecureBoot',
  '3GPP TR 33.938': '3GPP-PQC-Study-2025',
  // The Library's TS 33.501 row tracks the Rel-19 text; same specification.
  '3GPP-TS-33.501': '3GPP TS 33.501 Rel-19',
  // The ML-KEM / ML-DSA commands the matrix cites sit in Part 3 (Commands) of v1.85.
  'TCG TPM 2.0 v1.85': 'TCG-TPM-2.0-Library-v1.85-Part3-Published',
  'TCG PC Client PTP v1.07': 'TCG-PC-Client-Platform-TPM-Profile-v1.07',
}

/** Comparison key for a link: an IETF draft at any address (datatracker page,
 *  archive file, any revision) → the draft's name without revision; any other
 *  link → host and path without scheme, `www.`, query, fragment, trailing slash or
 *  `.html`. Null when there is nothing to compare. */
export function normalizeUrlKey(url: string | undefined): string | null {
  const raw = (url ?? '').trim().toLowerCase()
  if (!raw) return null
  const draft =
    /(?:datatracker\.ietf\.org\/doc\/(?:html\/)?|ietf\.org\/archive\/id\/)(draft-[a-z0-9-]+)/.exec(
      raw
    )
  if (draft) return `draft:${draft[1].replace(/-\d{2}$/, '')}`
  const m = /^https?:\/\/(?:www\.)?([^/?#]+)([^?#]*)/.exec(raw)
  if (!m) return null
  const path = m[2].replace(/\.html?$/, '').replace(/\/+$/, '')
  return path ? `${m[1]}${path}` : null
}

// Build (once) a normalized-key → exact-referenceId index over the whole
// Library tree (roots + children), and a second index by download address.
const REF_BY_KEY = new Map<string, string>()
const REF_BY_URL = new Map<string, string>()
function indexItem(item: LibraryItem): void {
  const key = normalizeRefKey(item.referenceId)
  if (key && !REF_BY_KEY.has(key)) REF_BY_KEY.set(key, item.referenceId)
  const urlKey = normalizeUrlKey(item.downloadUrl)
  if (urlKey && !REF_BY_URL.has(urlKey)) REF_BY_URL.set(urlKey, item.referenceId)
  item.children?.forEach(indexItem)
}
libraryData.forEach(indexItem)

/** The exact Library referenceId for a matrix doc id, or null if not present.
 *  Pass the cited `url` to let a Library entry with the same download address
 *  match when the ids differ (a draft the Library still files under its
 *  pre-adoption name, for example). */
export function resolveLibraryRef(docId: string, url?: string): string | null {
  // eslint-disable-next-line security/detect-object-injection -- own-property check guards the lookup
  const aliased = Object.hasOwn(SPEC_ALIASES, docId) ? SPEC_ALIASES[docId] : undefined
  const byId = aliased ?? REF_BY_KEY.get(normalizeRefKey(docId))
  if (byId) return byId
  const urlKey = normalizeUrlKey(url)
  return (urlKey && REF_BY_URL.get(urlKey)) || null
}

/** In-app Library deep-link for a doc id. Always stays in the app: links to the
 *  exact entry when we have one, otherwise to a Library search for the id. The
 *  external (RFC/datatracker) link lives inside the Library entry itself. */
export function libraryHref(docId: string, url?: string): string {
  const ref = resolveLibraryRef(docId, url)
  return ref ? `/library?ref=${encodeURIComponent(ref)}` : `/library?q=${encodeURIComponent(docId)}`
}

export type SpecLink =
  | { kind: 'library'; to: string; title: string }
  | { kind: 'external'; href: string; title: string }
  | { kind: 'search'; to: string; title: string }

/** Where a matrix citation should lead. The Library entry when one exists; the
 *  cited external page when it does not (a Library search for an id the Library
 *  does not hold returns nothing); a Library search only when there is no
 *  address to open. */
export function specLink(docId: string, url?: string): SpecLink {
  const ref = resolveLibraryRef(docId, url)
  if (ref) {
    return {
      kind: 'library',
      to: `/library?ref=${encodeURIComponent(ref)}`,
      title: `Open ${docId} in the Library`,
    }
  }
  if (url && /^https?:\/\//i.test(url)) {
    return { kind: 'external', href: url, title: `Open external specification (${docId})` }
  }
  return {
    kind: 'search',
    to: `/library?q=${encodeURIComponent(docId)}`,
    title: `Search the Library for ${docId}`,
  }
}
