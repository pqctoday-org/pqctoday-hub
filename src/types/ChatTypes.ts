export interface RAGChunk {
  id: string
  source: string
  title: string
  content: string
  category: string
  metadata: Record<string, string>
  deepLink?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sources?: string[]
}
