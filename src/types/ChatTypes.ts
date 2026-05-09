// SPDX-License-Identifier: GPL-3.0-only
export type ChatProvider = 'gemini' | 'local'

export interface RAGChunk {
  id: string
  source: string
  title: string
  content: string
  category: string
  metadata: Record<string, string>
  deepLink?: string
  priority?: number
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
