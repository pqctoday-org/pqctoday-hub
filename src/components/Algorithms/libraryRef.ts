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
  return REF_BY_KEY.get(normalizeRefKey(docId)) ?? null
}

/** In-app Library deep-link for a doc id, or null when it isn't in the Library. */
export function libraryHref(docId: string): string | null {
  const ref = resolveLibraryRef(docId)
  return ref ? `/library?ref=${encodeURIComponent(ref)}` : null
}
