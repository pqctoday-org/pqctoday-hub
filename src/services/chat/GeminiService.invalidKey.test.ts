// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { ChatMessage } from '@/types/ChatTypes'
import { isInvalidKeyResponse, streamResponse } from './GeminiService'

const MESSAGES: ChatMessage[] = [
  { id: 'u1', role: 'user', content: 'What is ML-KEM?', timestamp: 1 },
]

// Body Google returns for an invalid or revoked key (HTTP 400, not 401/403).
const INVALID_KEY_BODY = {
  error: {
    code: 400,
    message: 'API key not valid. Please pass a valid API key.',
    status: 'INVALID_ARGUMENT',
    details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID' }],
  },
}

const json400 = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })

async function drain(gen: AsyncGenerator<string>) {
  for await (const _ of gen) void _
}

describe('Gemini invalid key detection', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('recognises the API_KEY_INVALID reason', async () => {
    expect(await isInvalidKeyResponse(json400(INVALID_KEY_BODY))).toBe(true)
  })

  it('recognises the message when details are missing', async () => {
    expect(
      await isInvalidKeyResponse(
        json400({ error: { message: 'API key expired. Please renew the API key.' } })
      )
    ).toBe(true)
  })

  it('does not treat other 400s as an invalid key', async () => {
    expect(
      await isInvalidKeyResponse(json400({ error: { message: 'Unknown name "thinkingConfig"' } }))
    ).toBe(false)
    expect(await isInvalidKeyResponse(new Response('not json', { status: 400 }))).toBe(false)
  })

  it('reports an invalid key and skips the model fallback chain', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json400(INVALID_KEY_BODY))
    vi.stubGlobal('fetch', fetchMock)
    await expect(drain(streamResponse('bad-key', MESSAGES, []))).rejects.toThrow(/Invalid API key/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('still falls back to another model on a non-key 400', async () => {
    const sse = 'data: {"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}\n\n'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json400({ error: { message: 'Unknown name "thinkingConfig"' } }))
      .mockResolvedValue(new Response(sse, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await drain(streamResponse('good-key', MESSAGES, []))
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
  })
})
