// SPDX-License-Identifier: AGPL-3.0-only
import type { LibraryItem } from '@/data/libraryData'

export type LibrarySourceActionKind =
  'official-document' | 'free-summary' | 'publisher-access' | 'unavailable'

export interface LibrarySourceAction {
  kind: LibrarySourceActionKind
  href?: string
  label: string
  compactLabel: string
  description: string
}

/** One public source policy for every Library view. Private `localFile`
 * evidence is deliberately outside this contract and can never become a link. */
export function resolveLibrarySourceAction(
  item: Pick<LibraryItem, 'downloadUrl' | 'accessType' | 'freeSummaryUrl'>
): LibrarySourceAction {
  if (item.accessType === 'paid' && item.freeSummaryUrl) {
    return {
      kind: 'free-summary',
      href: item.freeSummaryUrl,
      label: 'Read free official summary',
      compactLabel: 'Free summary',
      description: 'This opens a free publisher summary or abstract, not the complete publication.',
    }
  }
  if (item.accessType === 'paid' && item.downloadUrl) {
    return {
      kind: 'publisher-access',
      href: item.downloadUrl,
      label: 'Open publisher access/purchase page',
      compactLabel: 'Publisher access',
      description: 'The complete publication requires publisher access or purchase.',
    }
  }
  if (item.downloadUrl) {
    return {
      kind: 'official-document',
      href: item.downloadUrl,
      label: 'Open official document',
      compactLabel: 'Open source',
      description: 'This opens the official publisher source in a new tab.',
    }
  }
  return {
    kind: 'unavailable',
    label: 'Source link unavailable',
    compactLabel: 'Source unavailable',
    description: 'No public official source link is available for this record yet.',
  }
}
