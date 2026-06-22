// SPDX-License-Identifier: GPL-3.0-only
//
// Resolve a protocol-matrix spec id (e.g. "RFC-4253",
// "draft-ietf-sshm-mlkem-hybrid-kex-10") to the matching Library referenceId so
// the matrix can deep-link to the in-app Library entry (/library?ref=…) instead
// of opening the raw external RFC/datatracker page. Matrix ids and Library
// referenceIds differ in shape ("RFC-4253" vs "RFC 4253"), and draft versions
// can differ between the two, so we match on a normalized key.

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
  'PKCS11-v3.2-CS01': 'PKCS11-V32-OASIS',
  'KMIP-v3.0-CSD01': 'KMIP-V2-1-OASIS',
  'Signal-PQXDH-Rev3': 'Signal-PQXDH-Spec',
  'UEFI-2.10': 'UEFI-SPEC-2.10-SecureBoot',
  '3GPP-TR-33.841': '3GPP-PQC-Study-2025',
  // The matrix's "…Part3-Published" was superseded in the Library by the v1.85 Errata.
  'TCG-TPM-2.0-Library-v1.85-Part3-Published': 'TCG-TPM-2.0-Library-v1.85-Errata',
}

// Build (once) a normalized-key → exact-referenceId index over the whole
// Library tree (roots + children).
const REF_BY_KEY = new Map<string, string>()
function indexItem(item: LibraryItem): void {
  const key = normalizeRefKey(item.referenceId)
  if (key && !REF_BY_KEY.has(key)) REF_BY_KEY.set(key, item.referenceId)
  item.children?.forEach(indexItem)
}
libraryData.forEach(indexItem)

/** The exact Library referenceId for a matrix doc id, or null if not present. */
export function resolveLibraryRef(docId: string): string | null {
  // eslint-disable-next-line security/detect-object-injection
  return SPEC_ALIASES[docId] ?? REF_BY_KEY.get(normalizeRefKey(docId)) ?? null
}

/** In-app Library deep-link for a doc id. Always stays in the app: links to the
 *  exact entry when we have one, otherwise to a Library search for the id. The
 *  external (RFC/datatracker) link lives inside the Library entry itself. */
export function libraryHref(docId: string): string {
  const ref = resolveLibraryRef(docId)
  return ref ? `/library?ref=${encodeURIComponent(ref)}` : `/library?q=${encodeURIComponent(docId)}`
}
