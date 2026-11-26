// SPDX-License-Identifier: AGPL-3.0-only
import type { TrackedOutput } from '@/store/useMyWorkStore'

/** What an output stores, in the words the learner reads (A13, A14). */
export function storageWords(output: Pick<TrackedOutput, 'storage'>): string {
  switch (output.storage) {
    case 'document':
      return 'Linked to the saved document'
    case 'payload':
      return 'Result kept on this device'
    default:
      return 'Title and link only today'
  }
}
