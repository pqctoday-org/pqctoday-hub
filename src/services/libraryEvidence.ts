// SPDX-License-Identifier: GPL-3.0-only
/**
 * Resolve Library reference ids to their current state, for documents that
 * cite evidence (architecture decision records). The Library corpus is large,
 * so it is loaded on demand when a pack is generated, not with the page.
 */
import type { LibraryItem } from '@/data/libraryData'
import type { EvidenceResolver, EvidenceState } from './architectureArtifacts'

/** Ids are matched ignoring case, spaces and hyphens, so `RFC 9763` finds
 * the Library's `RFC-9763`. */
const norm = (id: string) => id.toLowerCase().replace(/[\s-]+/g, '')

export function buildEvidenceResolver(items: LibraryItem[]): EvidenceResolver {
  const byId = new Map<string, EvidenceState>()
  const visit = (list: LibraryItem[]) => {
    for (const it of list) {
      // First record wins, so a parent is never shadowed by a child revision.
      const key = norm(it.referenceId)
      if (!byId.has(key)) {
        byId.set(key, {
          referenceId: it.referenceId,
          title: it.documentTitle,
          status: it.documentStatus,
          lastUpdated: it.lastUpdateDate || undefined,
          supersededBy: it.supersededByRefs,
        })
      }
      if (it.children?.length) visit(it.children)
    }
  }
  visit(items)
  return (id) => byId.get(norm(id)) ?? null
}

/** Load the Library and return a resolver over its current (active) records. */
export async function loadEvidenceResolver(): Promise<EvidenceResolver> {
  const { libraryData } = await import('@/data/libraryData')
  return buildEvidenceResolver(libraryData)
}
