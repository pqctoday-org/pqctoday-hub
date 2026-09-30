// SPDX-License-Identifier: GPL-3.0-only
import type { ChatMessage } from '@/types/ChatTypes'
import type { RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'
import { buildGeminiSystemPrompt, extractEntityInventory } from './promptBuilder'
import { DEFAULT_GEMINI_MODEL } from './modelConfig'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
export { DEFAULT_GEMINI_MODEL } from './modelConfig'

/**
 * Re-export buildSystemPrompt for backwards compatibility.
 * All prompt construction now lives in promptBuilder.ts.
 */
export const buildSystemPrompt = buildGeminiSystemPrompt
export { extractEntityInventory }

function formatMessages(
  messages: ChatMessage[]
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  // Send last 10 messages for context
  return messages.slice(-10).map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.content }],
  }))
}

export async function validateApiKey(
  apiKey: string,
  model: string = DEFAULT_GEMINI_MODEL
): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_BASE}/${model}?key=${apiKey}`)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Safety settings — lower thresholds for cybersecurity content so legitimate
 * PQC discussions (cryptanalysis, attack vectors, algorithm weaknesses) aren't blocked.
 */
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
]

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1_000

function buildGenerationConfig(model: string) {
  return {
    maxOutputTokens: 8192,
    // Gemini 2.5 uses token budgets; Gemini 3 uses relative thinking levels.
    // Both settings select the lowest-latency mode suitable for bounded RAG
    // extraction, which keeps the optional model comparison meaningful.
    thinkingConfig: model.startsWith('gemini-2.5')
      ? { thinkingBudget: 0 }
      : { thinkingLevel: 'low' },
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  const response = await fetch(url, init)

  // Only retry on transient server errors (5xx), not client errors
  if (response.status >= 500 && retries > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, MAX_RETRIES - retries))
    )
    return fetchWithRetry(url, init, retries - 1)
  }

  return response
}

export async function* streamResponse(
  apiKey: string,
  messages: ChatMessage[],
  contextChunks: RAGChunk[],
  model = DEFAULT_GEMINI_MODEL,
  signal?: AbortSignal,
  pageContext?: PageContext
): AsyncGenerator<string> {
  const systemPrompt = buildGeminiSystemPrompt(contextChunks, pageContext)
  const formattedMessages = formatMessages(messages)

  const response = await fetchWithRetry(
    `${GEMINI_BASE}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: formattedMessages,
        generationConfig: buildGenerationConfig(model),
        safetySettings: SAFETY_SETTINGS,
      }),
      signal,
    }
  )

  if (!response.ok) {
    const status = response.status
    if (status === 401 || status === 403) {
      throw new Error('Invalid API key. Please check your key and try again.')
    }
    if (status === 429) {
      throw new Error('Rate limit reached. Please wait a moment before trying again.')
    }
    throw new Error(`Gemini API error: ${status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const json = line.slice(6).trim()
        if (!json || json === '[DONE]') continue

        try {
          const parsed = JSON.parse(json)
          // Gemini 3 responses may contain multiple parts. Never surface a
          // thought-summary part; concatenate answer text parts only.
          const parts = parsed.candidates?.[0]?.content?.parts
          if (Array.isArray(parts)) {
            const text = parts
              .filter((part: { text?: string; thought?: boolean }) => part.text && !part.thought)
              .map((part: { text: string }) => part.text)
              .join('')
            if (text) yield text
          }
          const finishReason = parsed.candidates?.[0]?.finishReason
          if (finishReason === 'MAX_TOKENS') {
            yield '\n\n*(Response truncated — try asking a more specific question.)*'
          } else if (finishReason === 'SAFETY') {
            yield '\n\n*(Response blocked by content safety filters. Try rephrasing your question.)*'
          } else if (finishReason === 'RECITATION') {
            yield '\n\n*(Response stopped due to potential copyright concerns. Try a more specific question.)*'
          }
        } catch {
          // Log non-trivial malformed chunks for debugging incomplete responses
          if (json.length > 2) {
            console.warn('[Gemini] Malformed SSE chunk:', json.slice(0, 200))
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
