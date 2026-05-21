// SPDX-License-Identifier: GPL-3.0-only
export type ChatProvider = 'gemini' | 'local'

/**
 * W3C PROV-DM block attached to every chunk by `scripts/generate-rag-corpus.ts`.
 * Carries the evidence chain back to the originating CSV row and the cached
 * source document. See trust-engine-explainability §13 for the full schema.
 *
 * All fields are optional in the type so consumers can safely narrow against
 * partial / historical corpus shapes. The current pipeline emits every field
 * on every chunk, but `source_doc` is `""` for chunks without a cached doc
 * and `source_passages` is `[]` when no passages were extracted yet.
 */
export interface ChunkProv {
  entity_id?: string
  was_generated_by?: string
  was_attributed_to?: string
  was_derived_from?: string
  source_doc?: string
  source_passages?: string[]
}

export interface RAGChunk {
  id: string
  source: string
  title: string
  content: string
  category: string
  metadata: Record<string, string>
  deepLink?: string
  priority?: number
  prov?: ChunkProv
}

export interface ChatSourceRef {
  title: string
  source: string
  deepLink?: string
  /**
   * Trust tier inherited from the underlying record's eight-dimension score
   * (§14.3 step 4 of trust-engine-explainability). Optional — populated by
   * useChatSend.ts when the chunk resolves to a scored resource via
   * chunkToResource(). When undefined, the citation renders without a chip.
   */
  trustTier?: 'Authoritative' | 'High' | 'Moderate' | 'Low'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sources?: string[]
  sourceRefs?: ChatSourceRef[]
  followUps?: string[]
  feedback?: 'helpful' | 'unhelpful'
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}
