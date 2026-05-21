// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import { UnifiedSearchService } from '@/services/search/UnifiedSearchService'
import type { ChunkProv } from '@/types/ChatTypes'

export interface SourcePassages {
  passages: string[]
  sourceDoc: string | undefined
  wasAttributedTo: string | undefined
  isLoading: boolean
}

const EMPTY_DONE: SourcePassages = {
  passages: [],
  sourceDoc: undefined,
  wasAttributedTo: undefined,
  isLoading: false,
}

function extractProv(chunkId: string): ChunkProv | undefined {
  const svc = UnifiedSearchService.getInstance()
  if (!svc.isReady) return undefined
  const chunk = svc.corpusById.get(chunkId)
  return chunk?.prov
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
      const prov = extractProv(chunkId)
      return {
        passages: prov?.source_passages ?? [],
        sourceDoc: prov?.source_doc || undefined,
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
        const prov = extractProv(chunkId)
        setState({
          passages: prov?.source_passages ?? [],
          sourceDoc: prov?.source_doc || undefined,
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
