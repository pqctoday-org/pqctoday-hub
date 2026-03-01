// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RAGChunk, ChatMessage } from '@/types/ChatTypes'
import { validateApiKey, streamResponse } from './GeminiService'

const MOCK_CHUNKS: RAGChunk[] = [
  {
    id: 'algo-ml-kem-768',
    source: 'algorithms',
    title: 'ML-KEM-768',
    content: 'Algorithm: ML-KEM-768\nFamily: Lattice-based',
    category: 'Lattice-based',
    metadata: { family: 'Lattice-based' },
    deepLink: '/algorithms?highlight=ml-kem-768',
  },
  {
    id: 'glossary-0',
    source: 'glossary',
    title: 'PQC',
    content: 'Term: PQC\nDefinition: Post-quantum cryptography',
    category: 'concept',
    metadata: { acronym: 'PQC' },
  },
]

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'u1', role: 'user', content: 'What is ML-KEM?', timestamp: 1 },
]

describe('validateApiKey', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('should return true for valid API key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const result = await validateApiKey('valid-key')
    expect(result).toBe(true)
  })

  it('should return false for 401 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const result = await validateApiKey('invalid-key')
    expect(result).toBe(false)
  })

  it('should return false on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await validateApiKey('any-key')
    expect(result).toBe(false)
  })

  it('should call the correct Gemini endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)
    await validateApiKey('test-key')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com')
    )
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('key=test-key'))
  })
})

describe('streamResponse', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  function mockSSE(chunks: string[]) {
    const lines = chunks.map((text) => {
      const json = JSON.stringify({
        candidates: [{ content: { parts: [{ text }] } }],
      })
      return `data: ${json}`
    })
    lines.push('data: [DONE]')
    const body = lines.join('\n') + '\n'

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(body))
        controller.close()
      },
    })

    return {
      ok: true,
      status: 200,
      body: stream,
    }
  }

  it('should yield text chunks from SSE stream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockSSE(['Hello ', 'World'])))

    const chunks: string[] = []
    for await (const chunk of streamResponse('key', MOCK_MESSAGES, MOCK_CHUNKS)) {
      chunks.push(chunk)
    }
    expect(chunks).toEqual(['Hello ', 'World'])
  })

  it('should handle single chunk response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockSSE(['Complete response.'])))

    const chunks: string[] = []
    for await (const chunk of streamResponse('key', MOCK_MESSAGES, MOCK_CHUNKS)) {
      chunks.push(chunk)
    }
    expect(chunks).toEqual(['Complete response.'])
  })

  it('should throw on 401/403 status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })
    )

    const gen = streamResponse('bad-key', MOCK_MESSAGES, MOCK_CHUNKS)
    await expect(gen.next()).rejects.toThrow('Invalid API key')
  })

  it('should throw on 429 rate limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      })
    )

    const gen = streamResponse('key', MOCK_MESSAGES, MOCK_CHUNKS)
    await expect(gen.next()).rejects.toThrow('Rate limit')
  })

  it('should throw generic error for other status codes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    )

    const gen = streamResponse('key', MOCK_MESSAGES, MOCK_CHUNKS)
    await expect(gen.next()).rejects.toThrow('Gemini API error: 500')
  })

  it('should send correct model in URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockSSE(['ok']))
    vi.stubGlobal('fetch', mockFetch)

    const gen = streamResponse('key', MOCK_MESSAGES, MOCK_CHUNKS, 'gemini-2.5-flash')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of gen) {
      /* consume */
    }

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('gemini-2.5-flash:streamGenerateContent'),
      expect.any(Object)
    )
  })

  it('should include system prompt with context chunks', async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockSSE(['ok']))
    vi.stubGlobal('fetch', mockFetch)

    const gen = streamResponse('key', MOCK_MESSAGES, MOCK_CHUNKS)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of gen) {
      /* consume */
    }

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.systemInstruction.parts[0].text).toContain('PQC Today Assistant')
    expect(body.systemInstruction.parts[0].text).toContain('ML-KEM-768')
    expect(body.systemInstruction.parts[0].text).toContain(
      'Deep Link: /algorithms?highlight=ml-kem-768'
    )
  })

  it('should include page context in system prompt when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockSSE(['ok']))
    vi.stubGlobal('fetch', mockFetch)

    const gen = streamResponse('key', MOCK_MESSAGES, MOCK_CHUNKS, 'gemini-2.5-flash', undefined, {
      page: 'Algorithms',
      relevantSources: [],
      suggestedQuestions: [],
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of gen) {
      /* consume */
    }

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.systemInstruction.parts[0].text).toContain('viewing the Algorithms page')
  })

  it('should use temperature 0.3', async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockSSE(['ok']))
    vi.stubGlobal('fetch', mockFetch)

    const gen = streamResponse('key', MOCK_MESSAGES, MOCK_CHUNKS)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of gen) {
      /* consume */
    }

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.generationConfig.temperature).toBe(0.3)
  })

  it('should support AbortSignal', async () => {
    const controller = new AbortController()
    controller.abort()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))

    const gen = streamResponse(
      'key',
      MOCK_MESSAGES,
      MOCK_CHUNKS,
      'gemini-2.5-flash',
      controller.signal
    )
    await expect(gen.next()).rejects.toThrow()
  })
})
