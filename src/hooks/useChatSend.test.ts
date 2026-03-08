// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ChatMessage } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAddMessage = vi.fn()
const mockSetLoading = vi.fn()
const mockSetStreaming = vi.fn()
const mockSetStreamingContent = vi.fn()
const mockAppendStreamingContent = vi.fn()
const mockSetError = vi.fn()
const mockSetApiKey = vi.fn()

const defaultStoreState = {
  apiKey: 'test-api-key',
  provider: 'gemini' as string | null,
  localModel: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
  messages: [] as ChatMessage[],
  isLoading: false,
  isStreaming: false,
  model: 'gemini-2.5-flash',
  addMessage: mockAddMessage,
  setLoading: mockSetLoading,
  setStreaming: mockSetStreaming,
  setStreamingContent: mockSetStreamingContent,
  appendStreamingContent: mockAppendStreamingContent,
  setError: mockSetError,
  setApiKey: mockSetApiKey,
  deleteMessagesFrom: vi.fn(),
  webllmStatus: 'idle' as string,
  setWebLLMStatus: vi.fn(),
  setWebLLMProgress: vi.fn(),
  setWebLLMError: vi.fn(),
}

let chatStoreOverrides: Partial<typeof defaultStoreState> = {}

vi.mock('@/store/useChatStore', () => ({
  useChatStore: () => ({ ...defaultStoreState, ...chatStoreOverrides }),
}))

const defaultPageContext: PageContext = {
  page: 'Algorithms',
  relevantSources: ['algorithms', 'glossary'],
  suggestedQuestions: [],
}

vi.mock('@/hooks/usePageContext', () => ({
  usePageContext: () => defaultPageContext,
}))

const mockInitialize = vi.fn().mockResolvedValue(undefined)
const mockSearch = vi.fn().mockReturnValue([
  {
    id: 'chunk-1',
    source: 'algorithms',
    title: 'ML-KEM',
    content: 'ML-KEM is a key encapsulation mechanism.',
    category: 'algorithms',
    metadata: {},
    deepLink: '/algorithms?highlight=ml-kem',
  },
  {
    id: 'chunk-2',
    source: 'glossary',
    title: 'ML-KEM',
    content: 'Glossary entry for ML-KEM.',
    category: 'glossary',
    metadata: {},
  },
  {
    id: 'chunk-3',
    source: 'algorithms',
    title: 'ML-DSA',
    content: 'ML-DSA is a digital signature algorithm.',
    category: 'algorithms',
    metadata: {},
    deepLink: '/algorithms?highlight=ml-dsa',
  },
])

vi.mock('@/services/chat/RetrievalService', () => ({
  retrievalService: {
    initialize: (...args: unknown[]) => mockInitialize(...args),
    search: (...args: unknown[]) => mockSearch(...(args as [string])),
  },
}))

const mockStreamResponse = vi.fn()

vi.mock('@/services/chat/GeminiService', () => ({
  streamResponse: (...args: unknown[]) => mockStreamResponse(...args),
}))

vi.mock('@/services/chat/WebLLMService', () => ({
  streamResponse: vi.fn(),
  initializeEngine: vi.fn().mockResolvedValue(undefined),
  isEngineReady: vi.fn().mockReturnValue(false),
}))

vi.mock('@/services/chat/responseCache', () => ({
  getCached: vi.fn().mockReturnValue(null),
  setCache: vi.fn(),
  clearCache: vi.fn(),
}))

vi.mock('@/services/chat/parseFollowUps', () => ({
  parseFollowUps: (content: string) => {
    const match = content.match(/```followups\n([\s\S]*?)```\s*$/)
    if (!match) return { cleanContent: content, followUps: [] }
    const followUps = match[1]
      .trim()
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
    const cleanContent = content.slice(0, match.index).trimEnd()
    return { cleanContent, followUps }
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an async generator that yields the given chunks in sequence. */
async function* fakeStream(chunks: string[]): AsyncGenerator<string> {
  for (const c of chunks) yield c
}

function setupStream(chunks: string[]) {
  mockStreamResponse.mockReturnValue(fakeStream(chunks))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useChatSend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chatStoreOverrides = {}
    setupStream(['Hello ', 'world!'])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==================== Happy path ====================

  describe('happy path', () => {
    it('adds a user message via addMessage', async () => {
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockAddMessage).toHaveBeenCalled()
      const firstCall = mockAddMessage.mock.calls[0][0] as ChatMessage
      expect(firstCall.role).toBe('user')
      expect(firstCall.content).toBe('What is ML-KEM?')
      expect(firstCall.id).toMatch(/^user-/)
    })

    it('calls retrievalService.initialize()', async () => {
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockInitialize).toHaveBeenCalledTimes(1)
    })

    it('calls retrievalService.search() with the query and page context', async () => {
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockSearch).toHaveBeenCalledTimes(1)
      const [query, , context] = mockSearch.mock.calls[0] as [
        string,
        unknown,
        Record<string, unknown>,
      ]
      expect(query).toBe('What is ML-KEM?')
      expect(context).toEqual(
        expect.objectContaining({
          page: 'Algorithms',
          relevantSources: ['algorithms', 'glossary'],
        })
      )
    })

    it('streams response and calls appendStreamingContent for each chunk', async () => {
      setupStream(['chunk1', 'chunk2', 'chunk3'])
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockAppendStreamingContent).toHaveBeenCalledWith('chunk1')
      expect(mockAppendStreamingContent).toHaveBeenCalledWith('chunk2')
      expect(mockAppendStreamingContent).toHaveBeenCalledWith('chunk3')
      expect(mockAppendStreamingContent).toHaveBeenCalledTimes(3)
    })

    it('parses follow-ups from final content and adds them to assistant message', async () => {
      setupStream([
        'Some answer.\n\n```followups\n',
        'Follow-up question 1?\n',
        'Follow-up question 2?\n',
        '```',
      ])
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      // The second addMessage call is the assistant message
      const assistantMsg = mockAddMessage.mock.calls[1][0] as ChatMessage
      expect(assistantMsg.role).toBe('assistant')
      expect(assistantMsg.content).toBe('Some answer.')
      expect(assistantMsg.followUps).toEqual(['Follow-up question 1?', 'Follow-up question 2?'])
    })

    it('adds assistant message with cleanContent, sourceRefs, and followUps', async () => {
      setupStream(['The answer is 42.'])
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockAddMessage).toHaveBeenCalledTimes(2)
      const assistantMsg = mockAddMessage.mock.calls[1][0] as ChatMessage
      expect(assistantMsg.role).toBe('assistant')
      expect(assistantMsg.content).toBe('The answer is 42.')
      expect(assistantMsg.id).toMatch(/^assistant-/)
      expect(assistantMsg.sources).toEqual(['chunk-1', 'chunk-2', 'chunk-3'])
      expect(assistantMsg.sourceRefs).toBeDefined()
      expect(assistantMsg.followUps).toEqual([])
    })

    it('deduplicates sourceRefs by title', async () => {
      // mockSearch returns two chunks with title "ML-KEM" and one with "ML-DSA"
      setupStream(['Answer.'])
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('Compare algorithms')
      })

      const assistantMsg = mockAddMessage.mock.calls[1][0] as ChatMessage
      const titles = assistantMsg.sourceRefs!.map((r) => r.title)
      // "ML-KEM" appears in chunk-1 and chunk-2 but should be deduplicated
      expect(titles).toEqual(['ML-KEM', 'ML-DSA'])
      expect(assistantMsg.sourceRefs).toHaveLength(2)
    })

    it('finally block resets streaming and loading state', async () => {
      setupStream(['Done.'])
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      // setStreaming(false) from finally block
      const streamingCalls = mockSetStreaming.mock.calls.map((c) => c[0])
      expect(streamingCalls[streamingCalls.length - 1]).toBe(false)

      // setLoading(false) from finally block
      const loadingCalls = mockSetLoading.mock.calls.map((c) => c[0])
      expect(loadingCalls[loadingCalls.length - 1]).toBe(false)

      // setStreamingContent('') from finally block
      const contentCalls = mockSetStreamingContent.mock.calls.map((c) => c[0])
      expect(contentCalls[contentCalls.length - 1]).toBe('')
    })
  })

  // ==================== Guards ====================

  describe('guards', () => {
    it('does not send when query is empty/whitespace', async () => {
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('   ')
      })

      expect(mockAddMessage).not.toHaveBeenCalled()
      expect(mockInitialize).not.toHaveBeenCalled()
    })

    it('does not send when apiKey is null (Gemini provider)', async () => {
      chatStoreOverrides = {
        apiKey: null as unknown as string,
        provider: 'gemini' as string | null,
      }
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockAddMessage).not.toHaveBeenCalled()
      expect(mockInitialize).not.toHaveBeenCalled()
    })

    it('does not send when isLoading is true', async () => {
      chatStoreOverrides = { isLoading: true }
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockAddMessage).not.toHaveBeenCalled()
      expect(mockInitialize).not.toHaveBeenCalled()
    })

    it('does not send when isStreaming is true', async () => {
      chatStoreOverrides = { isStreaming: true }
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockAddMessage).not.toHaveBeenCalled()
      expect(mockInitialize).not.toHaveBeenCalled()
    })
  })

  // ==================== Error handling ====================

  describe('error handling', () => {
    it('on generic error: calls setError with message and calls onInputRestore', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('Network failure'))
      const onInputRestore = vi.fn()
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?', onInputRestore)
      })

      expect(mockSetError).toHaveBeenCalledWith('Network failure')
      expect(onInputRestore).toHaveBeenCalledWith('What is ML-KEM?')
      // finally block should still run
      const streamingCalls = mockSetStreaming.mock.calls.map((c) => c[0])
      expect(streamingCalls[streamingCalls.length - 1]).toBe(false)
    })

    it('on "Invalid API key" error: clears apiKey via setApiKey(null)', async () => {
      mockInitialize.mockResolvedValueOnce(undefined)
      mockStreamResponse.mockReturnValueOnce(
        // eslint-disable-next-line require-yield
        (async function* () {
          throw new Error('Invalid API key. Please check your key and try again.')
        })()
      )
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      expect(mockSetApiKey).toHaveBeenCalledWith(null)
      expect(mockSetError).toHaveBeenCalledWith(
        'Invalid API key. Please check your key and try again.'
      )
    })

    it('on AbortError: silently returns without setting error', async () => {
      const abortError = new Error('The operation was aborted.')
      abortError.name = 'AbortError'
      mockInitialize.mockRejectedValueOnce(abortError)
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      // setError should NOT be called with an abort message
      // setError(null) is called at the start of sendQuery, but not again for AbortError
      const errorCalls = mockSetError.mock.calls.filter((c) => c[0] !== null)
      expect(errorCalls).toHaveLength(0)
    })

    it('60s timeout triggers abort', async () => {
      vi.useFakeTimers()

      // Create a stream that hangs (never resolves)
      let rejectStream: (err: Error) => void = () => {}
      const hangingStream = async function* (): AsyncGenerator<string> {
        await new Promise<void>((_resolve, reject) => {
          rejectStream = reject
        })
        yield '' // unreachable
      }
      mockStreamResponse.mockReturnValueOnce(hangingStream())

      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      let queryPromise: Promise<void> | undefined

      await act(async () => {
        queryPromise = result.current.sendQuery('What is ML-KEM?')
      })

      // Advance timer to trigger the 60s timeout
      await act(async () => {
        vi.advanceTimersByTime(60_000)
        // Simulate the abort rejecting the hanging stream
        const abortError = new Error('The operation was aborted.')
        abortError.name = 'AbortError'
        rejectStream(abortError)
      })

      await act(async () => {
        await queryPromise
      })

      // Timeout AbortError should set a user-visible error message
      expect(mockSetError).toHaveBeenCalledWith('Request timed out. Please try again.')

      // State should be cleaned up via finally block
      const streamingCalls = mockSetStreaming.mock.calls.map((c) => c[0])
      expect(streamingCalls[streamingCalls.length - 1]).toBe(false)
    })
  })

  // ==================== Input length cap ====================

  describe('input length cap', () => {
    it('truncates input to 1,000 characters before sending', async () => {
      setupStream(['Answer.'])
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      const longInput = 'A'.repeat(1500)

      await act(async () => {
        await result.current.sendQuery(longInput)
      })

      // User message content should be truncated to 1000 chars
      const userMsg = mockAddMessage.mock.calls[0][0] as ChatMessage
      expect(userMsg.content).toHaveLength(1000)
      expect(userMsg.content).toBe('A'.repeat(1000))
    })

    it('passes truncated query to retrievalService.search', async () => {
      setupStream(['Answer.'])
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      const longInput = 'B'.repeat(2000)

      await act(async () => {
        await result.current.sendQuery(longInput)
      })

      const [searchQuery] = mockSearch.mock.calls[0] as [string]
      expect(searchQuery).toHaveLength(1000)
    })

    it('does not truncate input under 1,000 characters', async () => {
      setupStream(['Answer.'])
      const { useChatSend } = await import('./useChatSend')
      const { result } = renderHook(() => useChatSend())

      await act(async () => {
        await result.current.sendQuery('What is ML-KEM?')
      })

      const userMsg = mockAddMessage.mock.calls[0][0] as ChatMessage
      expect(userMsg.content).toBe('What is ML-KEM?')
    })
  })
})
