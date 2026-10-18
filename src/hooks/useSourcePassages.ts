// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react'
import { UnifiedSearchService } from '@/services/search/UnifiedSearchService'

export interface SourcePassages {
  passages: string[]
  sourceTitle: string | undefined
  officialUrl: string | undefined
  wasAttributedTo: string | undefined
  isLoading: boolean
}

const EMPTY_DONE: SourcePassages = {
  passages: [],
  sourceTitle: undefined,
  officialUrl: undefined,
  wasAttributedTo: undefined,
  isLoading: false,
}

function extractChunk(chunkId: string) {
  const svc = UnifiedSearchService.getInstance()
  if (!svc.isReady) return undefined
  return svc.corpusById.get(chunkId)
}

/**
 * Resolves PROV-DM source passages for a record by looking up the matching
 * RAG corpus chunk. Reuses the UnifiedSearchService singleton so we don't
 * re-fetch the corpus — falls in line with the search/assistant load.
 *
 * @param chunkId — full corpus chunk id (e.g., `library-FIPS 203`,
 *                  `threat-AERO-001`, `compliance-NIST`). Caller is responsible
 *                  for building the id with the correct domain prefix.
 */
export function useSourcePassages(chunkId: string | undefined): SourcePassages {
  // Lazy init: settle synchronously whenever the answer is already knowable
  // (no chunkId, or the corpus is already loaded — even if the chunk is
  // simply missing). Only an un-initialized service forces isLoading: true.
  const [state, setState] = useState<SourcePassages>(() => {
    if (!chunkId) return EMPTY_DONE
    const svc = UnifiedSearchService.getInstance()
    if (svc.isReady) {
      const chunk = extractChunk(chunkId)
      const prov = chunk?.prov
      return {
        passages: prov?.source_passages ?? [],
        sourceTitle: chunk?.title || undefined,
        officialUrl: chunk?.metadata.url || undefined,
        wasAttributedTo: prov?.was_attributed_to || undefined,
        isLoading: false,
      }
    }
    return { ...EMPTY_DONE, isLoading: true }
  })

  useEffect(() => {
    if (!chunkId) return
    const svc = UnifiedSearchService.getInstance()
    if (svc.isReady) return // already resolved in lazy init

    let cancelled = false
    svc
      .initialize()
      .then(() => {
        if (cancelled) return
        const chunk = extractChunk(chunkId)
        const prov = chunk?.prov
        setState({
          passages: prov?.source_passages ?? [],
          sourceTitle: chunk?.title || undefined,
          officialUrl: chunk?.metadata.url || undefined,
          wasAttributedTo: prov?.was_attributed_to || undefined,
          isLoading: false,
        })
      })
      .catch(() => {
        if (!cancelled) setState(EMPTY_DONE)
      })

    return () => {
      cancelled = true
    }
  }, [chunkId])

  return state
}
