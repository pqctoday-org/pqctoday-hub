// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useState } from 'react'
import { loadKnowledgeReader, type KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import { parseTag, placeOf } from '@/services/myWork/tags'

/**
 * Learner-facing names for section and step tags ("TLS Basics › TLS 1.3 Handshake"), read from the Hub's knowledge
 * file. Until it loads, or if it does not, the part id stands in: the screen still works.
 */
export function useTagLabels(): { labelOf: (tag: string) => string } {
  const [reader, setReader] = useState<KnowledgeReader | null>(null)
  useEffect(() => {
    let live = true
    loadKnowledgeReader()
      .then((r) => live && setReader(r))
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])
  const labelOf = useCallback(
    (tag: string) => {
      const parsed = parseTag(tag)
      if (!parsed || parsed.anchorKind === 'module') return placeOf(tag)
      return placeOf(tag, reader?.get(tag)?.label)
    },
    [reader]
  )
  return { labelOf }
}
