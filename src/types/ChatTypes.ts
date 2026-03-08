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
