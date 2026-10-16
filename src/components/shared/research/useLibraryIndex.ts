// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react'
import {
  buildLibraryIndex,
  type IndexableRecord,
  type LibraryIndex,
} from '@/services/research/collectionChanges'

/** Loads the Library index once per mount. */
export function useLibraryIndex(): LibraryIndex | null {
  const [index, setIndex] = useState<LibraryIndex | null>(null)
  useEffect(() => {
    let live = true
    import('@/data/libraryData')
      .then((m) => {
        if (live) {
          setIndex(
            buildLibraryIndex(
              m.libraryData as unknown as IndexableRecord[],
              m.REFERENCE_ID_ALIASES ?? {}
            )
          )
        }
      })
      .catch((e: unknown) => console.error('Library data did not load for change check', e))
    return () => {
      live = false
    }
  }, [])
  return index
}
