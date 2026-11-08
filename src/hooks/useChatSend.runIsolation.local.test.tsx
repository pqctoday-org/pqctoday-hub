// SPDX-License-Identifier: AGPL-3.0-only
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatStore } from '@/store/useChatStore'
import { useChatSend } from './useChatSend'
import type { WebLLMProgress } from '@/services/chat/WebLLMService'

const m = vi.hoisted(() => ({
  cloud: vi.fn(),
  local: vi.fn(),
  init: vi.fn(),
  ready: vi.fn(),
  search: vi.fn(),
  retrievalInit: vi.fn(),
  getCache: vi.fn(),
  setCache: vi.fn(),
  refusal: vi.fn(),
  finalize: vi.fn(),
  EngineDisconnectedError: class extends Error {},
}))
vi.mock('@/hooks/usePageContext', () => ({
  usePageContext: () => ({
    page: 'Algorithms',
    relevantSources: ['glossary'],
    suggestedQuestions: [],
  }),
}))
vi.mock('@/services/chat/GeminiService', () => ({ streamResponse: m.cloud }))
vi.mock('@/services/chat/WebLLMService', () => ({
  streamResponse: m.local,
  initializeEngine: m.init,
  isEngineReady: m.ready,
  EngineDisconnectedError: m.EngineDisconnectedError,
}))
vi.mock('@/services/chat/RetrievalService', () => ({
  retrievalService: { initialize: m.retrievalInit, searchWithEmbeddingFallback: m.search },
  classifyIntent: () => 'general',
  buildTrustRefusal: m.refusal,
}))
vi.mock('@/services/chat/responseCache', () => ({ getCached: m.getCache, setCache: m.setCache }))
vi.mock('@/services/chat/responseFinalization', () => ({ finalizeGroundedResponse: m.finalize }))
vi.mock('@/data/trustScore/trustScoreData', () => ({ getTrustScore: () => undefined }))
vi.mock('@/services/search/chunkToResource', () => ({ chunkToResource: () => null }))
vi.mock('@/utils/analytics', () => ({
  logChatQuery: vi.fn(),
  logChatRetry: vi.fn(),
  logChatChunksUsed: vi.fn(),
  logChatCacheHit: vi.fn(),
}))
vi.mock('@/utils/dataFingerprint', () => ({ buildWhatsNewRAGChunk: vi.fn() }))

const source = {
  id: 'sample-source',
  source: 'glossary',
  title: 'Fictional sample',
  content: 'Controlled sample evidence.',
  metadata: {},
  deepLink: '/glossary',
}
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
const state = () => useChatStore.getState()
const assistants = () => state().messages.filter((x) => x.role === 'assistant')
const userMessages = () => state().messages.filter((x) => x.role === 'user')
const idle = () => {
  expect(state().isLoading).toBe(false)
  expect(state().isStreaming).toBe(false)
  expect(state().streamingContent).toBe('')
}
async function* answer() {
  yield 'Controlled draft'
}
function pendingStream() {
  const gate = deferred<void>()
  return {
    gate,
    generator: (async function* () {
      yield 'Controlled unverified draft'
      await gate.promise
    })(),
  }
}
const begin = async (
  hook: ReturnType<typeof renderHook<ReturnType<typeof useChatSend>, unknown>>,
  restore = vi.fn()
) => {
  let task!: Promise<void>
  act(() => {
    task = hook.result.current.sendQuery('Fictional sample question', restore)
  })
  await waitFor(() =>
    expect(m.cloud.mock.calls.length + m.local.mock.calls.length).toBeGreaterThan(0)
  )
  return { task, restore }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useChatStore.setState({
    provider: 'gemini',
    apiKey: 'fictional-placeholder',
    model: 'sample-cloud',
    localModel: 'sample-local',
    localContextWindow: 4096,
    conversations: [],
    activeConversationId: null,
    messages: [],
    isLoading: false,
    isStreaming: false,
    streamingContent: '',
    error: null,
    webllmStatus: 'ready',
    webllmError: null,
    webllmProgress: null,
  })
  m.cloud.mockImplementation(answer)
  m.local.mockImplementation(answer)
  m.ready.mockReturnValue(true)
  m.init.mockResolvedValue(undefined)
  m.retrievalInit.mockResolvedValue(undefined)
  m.search.mockResolvedValue([source])
  m.getCache.mockReturnValue(null)
  m.refusal.mockReturnValue(null)
  // Controlled finalizer isolates callback ownership; these tests do not claim factual grounding.
  m.finalize.mockReturnValue({
    mode: 'verified',
    content: 'Controlled final response',
    decision: { approved: true, reasons: [] },
  })
})
afterEach(() => vi.useRealTimers())

describe('Assistant request ownership and stop boundaries', () => {
  it('preserves a current request, source references, query history and provider arguments', async () => {
    state().addMessage({
      id: 'history',
      role: 'user',
      content: 'Earlier fictional question',
      timestamp: 1,
    })
    const view = renderHook(() => useChatSend())
    await act(async () => {
      await view.result.current.sendQuery('Fictional sample question')
    })
    expect(m.cloud).toHaveBeenCalledTimes(1)
    expect(m.cloud.mock.calls[0][1].map((x: { content: string }) => x.content)).toEqual([
      'Earlier fictional question',
      'Fictional sample question',
    ])
    expect(m.search.mock.calls[0][2].conversationContext).toEqual(['Earlier fictional question'])
    expect(assistants()[0]).toMatchObject({
      content: 'Controlled final response',
      sources: ['sample-source'],
      sourceRefs: [{ title: 'Fictional sample', source: 'glossary', deepLink: '/glossary' }],
    })
    expect(m.setCache).toHaveBeenCalledTimes(1)
    idle()
  })

  it.each(['clear', 'provider', 'key', 'model', 'window'])(
    'suppresses same-turn %s + late settlement, and releases busy with no new request',
    async (change) => {
      const pending = pendingStream()
      m.cloud.mockReturnValue(pending.generator)
      const view = renderHook(() => useChatSend())
      const { task, restore } = await begin(view)
      expect(state().isStreaming).toBe(true)
      await act(async () => {
        if (change === 'clear') state().clearMessages()
        if (change === 'provider') state().setProvider(null)
        if (change === 'key') state().setApiKey('new-fictional-placeholder')
        if (change === 'model') state().setModel('different-sample-cloud')
        // A context-window change matters only for the local request, not a cloud request.
        if (change === 'window') {
          state().setProvider('local')
          state().setLocalContextWindow(8192)
        }
        pending.gate.resolve()
        await task
      })
      expect(assistants()).toHaveLength(0)
      expect(m.setCache).not.toHaveBeenCalled()
      expect(restore).not.toHaveBeenCalled()
      expect(state().error).toBeNull()
      idle()
    }
  )

  it('does not clear a replacement key or restore old text after a stale authentication error', async () => {
    const gate = deferred<void>()
    m.cloud.mockReturnValue(
      (async function* () {
        yield 'draft'
        await gate.promise
        throw new Error('Invalid API key')
      })()
    )
    const view = renderHook(() => useChatSend())
    const { task, restore } = await begin(view)
    await act(async () => {
      state().setApiKey('replacement-fictional-placeholder')
      gate.resolve()
      await task
    })
    expect(state().apiKey).toBe('replacement-fictional-placeholder')
    expect(state().error).toBeNull()
    expect(restore).not.toHaveBeenCalled()
    idle()
  })

  it.each([
    { provider: 'gemini' as const, label: 'cloud' },
    { provider: 'local' as const, label: 'local' },
  ])('Stop prevents quiet iterator EOF from finalizing a $label request', async ({ provider }) => {
    useChatStore.setState({ provider })
    const pending = pendingStream()
    m.cloud.mockReturnValue(pending.generator)
    m.local.mockReturnValue(pending.generator)
    const view = renderHook(() => useChatSend())
    const { task } = await begin(view)
    act(() => view.result.current.abort())
    expect(state().isStreaming).toBe(true)
    await act(async () => {
      pending.gate.resolve()
      await task
    })
    expect(m.finalize).not.toHaveBeenCalled()
    expect(assistants()).toHaveLength(0)
    expect(m.setCache).not.toHaveBeenCalled()
    idle()
  })

  it('ignores a late yielded chunk after Stop instead of displaying or caching it', async () => {
    const gate = deferred<void>()
    m.cloud.mockReturnValue(
      (async function* () {
        yield 'first'
        await gate.promise
        yield 'obsolete late text'
      })()
    )
    const view = renderHook(() => useChatSend())
    const { task } = await begin(view)
    act(() => view.result.current.abort())
    await act(async () => {
      gate.resolve()
      await task
    })
    expect(m.finalize).not.toHaveBeenCalled()
    expect(assistants()).toHaveLength(0)
    idle()
  })

  it.each(['initialize', 'search'])(
    'does not start a provider after Stop during retrieval %s',
    async (stage) => {
      const gate = deferred<unknown>()
      if (stage === 'initialize') m.retrievalInit.mockReturnValue(gate.promise)
      else m.search.mockReturnValue(gate.promise)
      const view = renderHook(() => useChatSend())
      let task!: Promise<void>
      act(() => {
        task = view.result.current.sendQuery('Fictional retrieval question')
      })
      await waitFor(() =>
        expect(stage === 'initialize' ? m.retrievalInit : m.search).toHaveBeenCalled()
      )
      act(() => view.result.current.abort())
      await act(async () => {
        gate.resolve(stage === 'search' ? [source] : undefined)
        await task
      })
      expect(m.cloud).not.toHaveBeenCalled()
      expect(assistants()).toHaveLength(0)
      idle()
    }
  )

  it('blocks double invocation, retry and edit before a render without deleting current work', async () => {
    const pending = pendingStream()
    m.cloud.mockReturnValue(pending.generator)
    const view = renderHook(() => useChatSend())
    let first!: Promise<void>, second!: Promise<void>
    act(() => {
      first = view.result.current.sendQuery('First fictional query')
      second = view.result.current.sendQuery('Second fictional query')
      view.result.current.retryLastQuery()
      view.result.current.editAndResend('missing', 'Changed')
    })
    await waitFor(() => expect(m.cloud).toHaveBeenCalledTimes(1))
    await second
    expect(userMessages()).toHaveLength(1)
    expect(userMessages()[0].content).toBe('First fictional query')
    await act(async () => {
      pending.gate.resolve()
      await first
    })
    idle()
  })

  it('unmount + remount cannot start a new request until settlement, then retry is usable', async () => {
    const pending = pendingStream()
    m.cloud.mockReturnValueOnce(pending.generator)
    const view = renderHook(() => useChatSend())
    const { task } = await begin(view)
    view.unmount()
    const utils = renderHook(() => useChatSend())
    await act(async () => {
      await utils.result.current.sendQuery('Too early')
    })
    expect(m.cloud).toHaveBeenCalledTimes(1)
    expect(state().isStreaming).toBe(true)
    await act(async () => {
      expect(state().streamingContent).toBe('')
      pending.gate.resolve()
      await task
    })
    idle()
    expect(assistants()).toHaveLength(0)
    await act(async () => {
      await utils.result.current.sendQuery('Current fictional retry')
    })
    expect(m.cloud).toHaveBeenCalledTimes(2)
    expect(assistants()).toHaveLength(1)
    idle()
  })

  it('unmount with no replacement request eventually releases its busy state', async () => {
    const pending = pendingStream()
    m.cloud.mockReturnValue(pending.generator)
    const view = renderHook(() => useChatSend())
    const { task } = await begin(view)
    view.unmount()
    await act(async () => {
      pending.gate.resolve()
      await task
    })
    expect(assistants()).toHaveLength(0)
    idle()
  })

  it('finishes old cleanup atomically before a synchronous reset subscriber starts another hook', async () => {
    const first = pendingStream(),
      second = pendingStream()
    m.cloud.mockReturnValueOnce(first.generator).mockReturnValueOnce(second.generator)
    const view = renderHook(() => useChatSend()),
      utils = renderHook(() => useChatSend())
    const { task } = await begin(view)
    act(() => view.result.current.abort())
    let nextTask: Promise<void> | undefined,
      started = false
    const unsubscribe = useChatStore.subscribe((now, previous) => {
      if (!started && previous.isStreaming && !now.isStreaming && !now.isLoading) {
        started = true
        nextTask = utils.result.current.sendQuery('Subscriber fictional query')
      }
    })
    await act(async () => {
      first.gate.resolve()
      await task
    })
    await waitFor(() => expect(m.cloud).toHaveBeenCalledTimes(2))
    expect(state().isStreaming).toBe(true)
    expect(state().streamingContent).toBe('Controlled unverified draft')
    unsubscribe()
    await act(async () => {
      second.gate.resolve()
      await nextTask
    })
    expect(assistants()).toHaveLength(1)
    idle()
  })

  it('does not confuse intentional Stop with a real timeout', async () => {
    vi.useFakeTimers()
    const pending = pendingStream()
    m.cloud.mockReturnValue(pending.generator)
    const view = renderHook(() => useChatSend())
    let task!: Promise<void>
    await act(async () => {
      task = view.result.current.sendQuery('Fictional timeout question')
      await Promise.resolve()
      await Promise.resolve()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60001)
      pending.gate.resolve()
      await task
    })
    expect(state().error).toBe('Request timed out. Please try again.')
    expect(assistants()).toHaveLength(0)
    idle()
  })

  it('runs a single disconnect retry after cleanup and retains its active abort controller', async () => {
    useChatStore.setState({ provider: 'local' })
    const pending = pendingStream()
    m.local
      .mockReturnValueOnce(
        (async function* () {
          yield ''
          throw new m.EngineDisconnectedError('Fictional disconnection')
        })()
      )
      .mockReturnValueOnce(pending.generator)
    const view = renderHook(() => useChatSend())
    let task!: Promise<void>
    act(() => {
      task = view.result.current.sendQuery('Fictional retry question')
    })
    await waitFor(() => expect(m.local).toHaveBeenCalledTimes(2))
    expect(userMessages()).toHaveLength(1)
    expect(state().isStreaming).toBe(true)
    act(() => view.result.current.abort())
    expect(m.local.mock.calls[1][2].aborted).toBe(true)
    await act(async () => {
      pending.gate.resolve()
      await task
    })
    expect(assistants()).toHaveLength(0)
    idle()
  })

  it('surfaces a second disconnect failure without another automatic retry', async () => {
    useChatStore.setState({ provider: 'local' })
    m.local.mockImplementation(() =>
      (async function* () {
        yield ''
        throw new m.EngineDisconnectedError('Fictional disconnection')
      })()
    )
    const view = renderHook(() => useChatSend())
    await act(async () => {
      await view.result.current.sendQuery('Fictional retry question')
    })
    expect(m.local).toHaveBeenCalledTimes(2)
    expect(userMessages()).toHaveLength(1)
    expect(state().error).toBe('Fictional disconnection')
    idle()
  })

  it('keeps truthful same-configuration download progress after query Stop without claiming cancellation', async () => {
    useChatStore.setState({ provider: 'local', webllmStatus: 'idle' })
    m.ready.mockReturnValue(false)
    const gate = deferred<void>()
    let progress!: (p: WebLLMProgress) => void
    m.init.mockImplementation((_model, onProgress) => {
      progress = onProgress
      return gate.promise
    })
    const view = renderHook(() => useChatSend())
    let task!: Promise<void>
    act(() => {
      task = view.result.current.sendQuery('Fictional local question')
    })
    act(() => view.result.current.abort())
    act(() =>
      progress({
        status: 'downloading',
        progress: 0.5,
        text: 'Controlled progress',
      } as WebLLMProgress)
    )
    expect(state().webllmStatus).toBe('downloading')
    await act(async () => {
      gate.resolve()
      await task
    })
    expect(state().webllmStatus).toBe('ready')
    expect(state().webllmError).toBeNull()
    expect(m.search).not.toHaveBeenCalled()
    idle()
  })

  it('ignores old download status after configuration changes, even when changed back', async () => {
    useChatStore.setState({ provider: 'local', webllmStatus: 'idle' })
    m.ready.mockReturnValue(false)
    const gate = deferred<void>()
    let progress!: (p: WebLLMProgress) => void
    m.init.mockImplementation((_model, onProgress) => {
      progress = onProgress
      return gate.promise
    })
    const view = renderHook(() => useChatSend())
    let task!: Promise<void>
    act(() => {
      task = view.result.current.sendQuery('Fictional local question')
    })
    act(() => {
      state().setLocalModel('different-local')
      state().setLocalModel('sample-local')
      state().setWebLLMStatus('idle')
      progress({ status: 'downloading' } as WebLLMProgress)
    })
    await act(async () => {
      gate.resolve()
      await task
    })
    expect(state().webllmStatus).toBe('idle')
    expect(state().error).toBeNull()
    expect(m.search).not.toHaveBeenCalled()
    idle()
  })

  it.each(['clear', 'provider'])(
    'keeps busy through %s plus remount, then permits a new-context request',
    async (change) => {
      const pending = pendingStream()
      m.cloud.mockReturnValueOnce(pending.generator)
      const view = renderHook(() => useChatSend())
      const { task } = await begin(view)
      act(() => {
        if (change === 'clear') state().clearMessages()
        else state().setProvider('local')
      })
      expect(state().isStreaming).toBe(true)
      view.unmount()
      const utils = renderHook(() => useChatSend())
      await act(async () => {
        await utils.result.current.sendQuery('Too early in new context')
      })
      expect(m.cloud.mock.calls.length + m.local.mock.calls.length).toBe(1)
      await act(async () => {
        pending.gate.resolve()
        await task
      })
      idle()
      expect(assistants()).toHaveLength(0)
      await act(async () => {
        await utils.result.current.sendQuery('Current context question')
      })
      expect(assistants()).toHaveLength(1)
      expect(userMessages().at(-1)?.content).toBe('Current context question')
      idle()
    }
  )

  it('does not let a disconnected-run retry delete a new hook request started by cleanup', async () => {
    useChatStore.setState({ provider: 'local' })
    const pending = pendingStream()
    m.local
      .mockReturnValueOnce(
        (async function* () {
          yield ''
          throw new m.EngineDisconnectedError('Controlled disconnect')
        })()
      )
      .mockReturnValueOnce(pending.generator)
    const view = renderHook(() => useChatSend()),
      utils = renderHook(() => useChatSend())
    let started = false,
      newTask: Promise<void> | undefined
    const unsubscribe = useChatStore.subscribe((now, previous) => {
      if (!started && previous.isStreaming && !now.isStreaming && !now.isLoading) {
        started = true
        newTask = utils.result.current.sendQuery('New subscriber question')
      }
    })
    await act(async () => {
      await view.result.current.sendQuery('Original question')
    })
    await waitFor(() => expect(m.local).toHaveBeenCalledTimes(2))
    expect(userMessages().map((x) => x.content)).toEqual([
      'Original question',
      'New subscriber question',
    ])
    expect(state().isStreaming).toBe(true)
    unsubscribe()
    act(() => utils.result.current.abort())
    expect(m.local.mock.calls[1][2].aborted).toBe(true)
    await act(async () => {
      pending.gate.resolve()
      await newTask
    })
    idle()
  })

  it('does not automatically retry a disconnect delivered after Stop', async () => {
    useChatStore.setState({ provider: 'local' })
    const gate = deferred<void>()
    m.local.mockReturnValue(
      (async function* () {
        yield 'Controlled draft'
        await gate.promise
        yield ''
        throw new m.EngineDisconnectedError('Controlled disconnect')
      })()
    )
    const view = renderHook(() => useChatSend())
    const { task } = await begin(view)
    act(() => view.result.current.abort())
    await act(async () => {
      gate.resolve()
      await task
    })
    expect(m.local).toHaveBeenCalledTimes(1)
    expect(state().error).toBeNull()
    expect(assistants()).toHaveLength(0)
    idle()
  })

  it.each(['stop', 'clear'])(
    'checks ownership after finalization before source-reference completion: %s',
    async (change) => {
      const view = renderHook(() => useChatSend())
      m.finalize.mockImplementationOnce(() => {
        if (change === 'stop') view.result.current.abort()
        else state().clearMessages()
        return {
          mode: 'verified',
          content: 'Controlled final response',
          decision: { approved: true, reasons: [] },
        }
      })
      await act(async () => {
        await view.result.current.sendQuery('Fictional source completion question')
      })
      expect(assistants()).toHaveLength(0)
      expect(m.setCache).not.toHaveBeenCalled()
      idle()
    }
  )

  it('acquires retry busy ownership before deleting its old record or resetting model status', async () => {
    useChatStore.setState({ provider: 'local' })
    const gate = deferred<void>(),
      pending = pendingStream()
    m.local
      .mockReturnValueOnce(
        (async function* () {
          yield 'Controlled draft'
          await gate.promise
          throw new m.EngineDisconnectedError('Controlled disconnect')
        })()
      )
      .mockReturnValueOnce(pending.generator)
    const view = renderHook(() => useChatSend()),
      utils = renderHook(() => useChatSend())
    const { task } = await begin(view)
    let attempts = 0
    const unsubscribe = useChatStore.subscribe((now, previous) => {
      if (
        (previous.messages.length > 0 && now.messages.length === 0) ||
        (previous.webllmStatus !== 'idle' && now.webllmStatus === 'idle')
      ) {
        attempts += 1
        void utils.result.current.sendQuery('Concurrent subscriber question')
      }
    })
    await act(async () => {
      gate.resolve()
    })
    await waitFor(() => expect(m.local).toHaveBeenCalledTimes(2))
    expect(attempts).toBeGreaterThan(0)
    expect(userMessages().map((x) => x.content)).toEqual(['Fictional sample question'])
    unsubscribe()
    await act(async () => {
      pending.gate.resolve()
      await task
    })
    expect(assistants()).toHaveLength(1)
    idle()
  })

  it('shows a current authentication error, restores its query and clears only its own placeholder key', async () => {
    m.cloud.mockReturnValue(
      (async function* () {
        yield ''
        throw new Error('Invalid API key')
      })()
    )
    const view = renderHook(() => useChatSend()),
      restore = vi.fn()
    await act(async () => {
      await view.result.current.sendQuery('Fictional authentication question', restore)
    })
    expect(state().apiKey).toBeNull()
    expect(state().error).toContain('API key is invalid')
    expect(restore).toHaveBeenCalledWith('Fictional authentication question')
    idle()
  })

  it('reads the live unsupported guard before invoking a callback captured earlier', async () => {
    useChatStore.setState({ provider: 'local' })
    const view = renderHook(() => useChatSend()),
      previousSend = view.result.current.sendQuery
    await act(async () => {
      state().setWebLLMStatus('unsupported')
      await previousSend('Fictional unsupported request')
    })
    expect(m.init).not.toHaveBeenCalled()
    expect(m.local).not.toHaveBeenCalled()
    expect(userMessages()).toHaveLength(0)
    idle()
  })

  it('does not overwrite a replacement configuration selected by its atomic key-clear subscriber', async () => {
    m.cloud.mockReturnValue(
      (async function* () {
        yield ''
        throw new Error('Invalid API key')
      })()
    )
    const view = renderHook(() => useChatSend())
    const unsubscribe = useChatStore.subscribe((now, previous) => {
      if (previous.apiKey !== null && now.apiKey === null)
        state().setApiKey('replacement-fictional-placeholder')
    })
    await act(async () => {
      await view.result.current.sendQuery('Fictional replacement question')
    })
    unsubscribe()
    expect(state().apiKey).toBe('replacement-fictional-placeholder')
    expect(state().error).toBeNull()
    idle()
  })

  it.each(['empty', 'refusal'])(
    'keeps %s branch busy until atomic cleanup before a replacement hook starts',
    async (branch) => {
      const gate = deferred<unknown>()
      m.search
        .mockResolvedValueOnce(branch === 'empty' ? [] : [source])
        .mockReturnValueOnce(gate.promise)
      if (branch === 'refusal') m.refusal.mockReturnValueOnce('Controlled refusal')
      const view = renderHook(() => useChatSend()),
        utils = renderHook(() => useChatSend())
      let started = false,
        replacement: Promise<void> | undefined
      const unsubscribe = useChatStore.subscribe((now, previous) => {
        if (!started && previous.isLoading && !now.isLoading && !now.isStreaming) {
          started = true
          replacement = utils.result.current.sendQuery('Replacement fictional question')
        }
      })
      await act(async () => {
        await view.result.current.sendQuery('First fictional question')
      })
      await waitFor(() => expect(m.search).toHaveBeenCalledTimes(2))
      try {
        expect(state().isLoading).toBe(true)
      } finally {
        unsubscribe()
        await act(async () => {
          gate.resolve([source])
          await replacement
        })
      }
      idle()
    }
  )

  it.each([true, false])(
    'does not adopt a conversation created by its busy subscriber (existing origin: %s)',
    async (hasOrigin) => {
      let originalId: string | null = null
      if (hasOrigin) {
        originalId = state().createConversation()
        state().addMessage({
          id: 'earlier-source',
          role: 'user',
          content: 'Earlier fictional record',
          timestamp: 1,
        })
      }
      const view = renderHook(() => useChatSend())
      let replacementId: string | null = null,
        changed = false
      const unsubscribe = useChatStore.subscribe((now, previous) => {
        if (!changed && !previous.isLoading && now.isLoading) {
          changed = true
          replacementId = state().createConversation()
        }
      })
      try {
        await act(async () => {
          await view.result.current.sendQuery('Old-context fictional question')
        })
        expect(replacementId).not.toBeNull()
        expect(state().activeConversationId).toBe(replacementId)
        expect(state().messages).toHaveLength(0)
        expect(m.cloud).not.toHaveBeenCalled()
        if (originalId)
          expect(
            state()
              .conversations.find((c) => c.id === originalId)
              ?.messages.map((x) => x.id)
          ).toEqual(['earlier-source'])
      } finally {
        unsubscribe()
      }
      idle()
    }
  )

  it.each(['generation', 'initialization'])(
    'does not restore stale input after %s error publication changes configuration',
    async (stage) => {
      useChatStore.setState({ provider: 'local' })
      if (stage === 'initialization') {
        m.ready.mockReturnValue(false)
        m.init.mockRejectedValue(new Error('Controlled load error'))
      } else
        m.local.mockReturnValue(
          (async function* () {
            yield ''
            throw new Error('Controlled generation error')
          })()
        )
      const view = renderHook(() => useChatSend()),
        restore = vi.fn()
      const unsubscribe = useChatStore.subscribe((now, previous) => {
        if (!previous.error && now.error) state().setLocalModel('replacement-local')
      })
      try {
        await act(async () => {
          await view.result.current.sendQuery('Old error question', restore)
        })
        expect(state().localModel).toBe('replacement-local')
        expect(restore).not.toHaveBeenCalled()
        expect(m.setCache).not.toHaveBeenCalled()
        idle()
      } finally {
        unsubscribe()
      }
    }
  )

  it('does not initialize the old local configuration after a download-status subscriber replaces it', async () => {
    useChatStore.setState({ provider: 'local', webllmStatus: 'idle' })
    m.ready.mockReturnValue(false)
    const view = renderHook(() => useChatSend())
    const unsubscribe = useChatStore.subscribe((now, previous) => {
      if (previous.webllmStatus !== 'downloading' && now.webllmStatus === 'downloading') {
        state().setLocalModel('replacement-local')
        state().setWebLLMError('Replacement context notice')
      }
    })
    try {
      await act(async () => {
        await view.result.current.sendQuery('Old initialization question')
      })
      expect(m.init).not.toHaveBeenCalled()
      expect(state().webllmError).toBe('Replacement context notice')
      idle()
    } finally {
      unsubscribe()
    }
  })

  it('does not start generation after a stream-status subscriber disconnects the provider', async () => {
    const view = renderHook(() => useChatSend())
    const unsubscribe = useChatStore.subscribe((now, previous) => {
      if (!previous.isStreaming && now.isStreaming) state().setProvider(null)
    })
    try {
      await act(async () => {
        await view.result.current.sendQuery('Old stream question')
      })
      expect(m.cloud).not.toHaveBeenCalled()
      expect(assistants()).toHaveLength(0)
      idle()
    } finally {
      unsubscribe()
    }
  })

  it('does not call a provider when a streaming loading-transition subscriber presses Stop', async () => {
    const view = renderHook(() => useChatSend())
    const unsubscribe = useChatStore.subscribe((now, previous) => {
      if (previous.isLoading && !now.isLoading && now.isStreaming) view.result.current.abort()
    })
    try {
      await act(async () => {
        await view.result.current.sendQuery('Stopped stream transition question')
      })
      expect(m.cloud).not.toHaveBeenCalled()
      expect(m.finalize).not.toHaveBeenCalled()
      expect(assistants()).toHaveLength(0)
      idle()
    } finally {
      unsubscribe()
    }
  })

  it('preserves cache, no-evidence and trust-refusal branches without calling a provider', async () => {
    const view = renderHook(() => useChatSend())
    m.getCache.mockReturnValueOnce({
      content: 'Controlled cached answer',
      sourceIds: ['cached'],
      sourceRefs: [],
      followUps: [],
    })
    await act(async () => {
      await view.result.current.sendQuery('Cached fictional question')
    })
    expect(assistants()[0].content).toBe('Controlled cached answer')
    m.search.mockResolvedValueOnce([])
    await act(async () => {
      await view.result.current.sendQuery('Empty fictional question')
    })
    expect(assistants()[1].content).toContain("don't have enough information")
    m.refusal.mockReturnValueOnce('Controlled trust refusal')
    await act(async () => {
      await view.result.current.sendQuery('Refused fictional question')
    })
    expect(assistants()[2].content).toBe('Controlled trust refusal')
    expect(m.cloud).not.toHaveBeenCalled()
    idle()
  })
})
