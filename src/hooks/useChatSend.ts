// SPDX-License-Identifier: AGPL-3.0-only
import { useRef, useCallback, useLayoutEffect } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { usePageContext } from '@/hooks/usePageContext'
import {
  retrievalService,
  classifyIntent,
  buildTrustRefusal,
} from '@/services/chat/RetrievalService'
import { streamResponse as geminiStreamResponse } from '@/services/chat/GeminiService'
import {
  streamResponse as localStreamResponse,
  initializeEngine,
  isEngineReady,
  EngineDisconnectedError,
} from '@/services/chat/WebLLMService'
import { parseFollowUps } from '@/services/chat/parseFollowUps'
import { parseCitations } from '@/services/chat/parseCitations'
import { buildRetrievedEvidenceResponse } from '@/services/chat/groundingPolicy'
import { finalizeGroundedResponse } from '@/services/chat/responseFinalization'
import type { ChatMessage, ChatSourceRef } from '@/types/ChatTypes'
import { logChatQuery, logChatRetry, logChatChunksUsed, logChatCacheHit } from '@/utils/analytics'
import { getCached, setCache } from '@/services/chat/responseCache'
import { buildWhatsNewRAGChunk } from '@/utils/dataFingerprint'
import { useVersionStore } from '@/store/useVersionStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import { chunkToResource } from '@/services/search/chunkToResource'
import type { RAGChunk } from '@/types/ChatTypes'

/**
 * Load the trust-score module on demand and return a chunk→tier resolver.
 *
 * Deliberately a DYNAMIC import. `trustScoreData` statically pulls in fifteen
 * data modules — library, timeline, compliance, threats, leaders, migrate,
 * algorithms, the enrichment sets — i.e. very nearly the whole dataset. A
 * static import here put all of it on the landing page's critical path, because
 * this hook is reached from the chat panel in MainLayout: the eager preload
 * measured 15.28 MB against a 15.00 MB budget, and `trusted_sources_*.csv`
 * alone contributed ~950 KB (the glob inlines every live generation, though
 * only the newest is ever served).
 *
 * Nothing here is needed until a query is actually sent, so the cost belongs on
 * the first send rather than on first paint. Resolved once per send and reused
 * across chunks — the module cache makes repeat imports free.
 *
 * DO NOT convert this back to a static import to tidy it up. See
 * scripts/ci/precache-budget.ts for what that regresses.
 */
async function loadTierResolver(): Promise<(c: RAGChunk) => ChatSourceRef['trustTier']> {
  const { getTrustScore } = await import('@/data/trustScore/trustScoreData')
  /**
   * Resolve a RAG chunk's trust tier for inline citation chips (§14.3 step 4).
   * Returns undefined when the chunk doesn't resolve to a scored resource —
   * the citation then renders without a chip rather than showing a misleading tier.
   */
  return (c: RAGChunk) => {
    const ref = chunkToResource(c)
    if (!ref) return undefined
    return getTrustScore(ref.resourceType, ref.resourceId)?.tier
  }
}

const STREAM_TIMEOUT_MS = 60_000
const LOCAL_STREAM_TIMEOUT_MS = 120_000 // Local models may be slower
const MAX_INPUT_LENGTH = 1_000

/** Monotonic counter to prevent ID collisions when multiple messages are created in the same ms. */
let msgCounter = 0
function nextMsgId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++msgCounter}`
}

type ChatRequestConfig = Pick<
  ReturnType<typeof useChatStore.getState>,
  'provider' | 'apiKey' | 'model' | 'localModel' | 'localContextWindow'
>

function sameRequestConfig(request: ChatRequestConfig, current: ChatRequestConfig): boolean {
  return (
    request.provider === current.provider &&
    (request.provider === 'gemini'
      ? request.apiKey === current.apiKey && request.model === current.model
      : request.localModel === current.localModel &&
        request.localContextWindow === current.localContextWindow)
  )
}

interface ChatRun {
  controller: AbortController
  config: ChatRequestConfig
  conversationId: string | null
  userMessageId: string
  invalidated: boolean
  configInvalidated: boolean
}

/**
 * Shared hook encapsulating RAG retrieval → LLM streaming → follow-up parsing.
 * Dispatches to Gemini (cloud) or WebLLM (local) based on the provider field
 * in the chat store.
 */
export function useChatSend() {
  const {
    apiKey,
    provider,
    localModel,
    localContextWindow,
    messages,
    addMessage,
    setLoading,
    setStreaming,
    setStreamingContent,
    setError,
    model,
    deleteMessagesFrom,
    setWebLLMStatus,
    setWebLLMProgress,
    setWebLLMError,
  } = useChatStore()

  const pageContext = usePageContext()
  const activeRun = useRef<ChatRun | null>(null)
  const retryPreparation = useRef<ChatRun | null>(null)
  const mounted = useRef(true)
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      const run = activeRun.current
      if (run) {
        run.invalidated = true
        run.controller.abort()
        setStreamingContent('')
      }
    }
  }, [setStreamingContent])

  const sendQuery = useCallback(
    async (
      queryText: string,
      onInputRestore?: (text: string) => void,
      isDisconnectRetry = false
    ) => {
      const trimmed = queryText.trim().slice(0, MAX_INPUT_LENGTH)
      const currentState = useChatStore.getState()
      const requestConfig = { provider, apiKey, model, localModel, localContextWindow }
      if (
        !trimmed ||
        !mounted.current ||
        activeRun.current ||
        currentState.isLoading ||
        currentState.isStreaming ||
        !sameRequestConfig(requestConfig, currentState)
      )
        return
      // Provider-specific guards
      if (provider === 'gemini' && !apiKey) {
        onInputRestore?.(trimmed)
        setError('API key is missing. Use the key icon to reconnect.')
        return
      }
      if (provider === 'local' && currentState.webllmStatus === 'unsupported') return
      if (!provider) return

      const userMessage: ChatMessage = {
        id: nextMsgId('user'),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      }
      const controller = new AbortController()
      // Fix the requested origin before any busy/message notification can run
      // subscribers. An automatic new conversation is resolved from our unique
      // message below, never adopted from whichever conversation is then active.
      const initialConversation = currentState.conversations.find(
        (conversation) => conversation.id === currentState.activeConversationId
      )
      const startupConversationId = currentState.activeConversationId
      let startupMessages = currentState.messages
      const run: ChatRun = {
        controller,
        config: requestConfig,
        conversationId: initialConversation?.id ?? null,
        userMessageId: userMessage.id,
        invalidated: false,
        configInvalidated: false,
      }
      activeRun.current = run
      let historyBeforeQuery = [...currentState.messages]
      let requestMessages: ChatMessage[] = []
      const ensureStartupScope = () => {
        const state = useChatStore.getState()
        if (
          activeRun.current !== run ||
          !mounted.current ||
          run.invalidated ||
          controller.signal.aborted ||
          !sameRequestConfig(run.config, state) ||
          state.activeConversationId !== startupConversationId ||
          state.messages !== startupMessages
        ) {
          run.invalidated = true
          controller.abort()
          const error = new Error('Request stopped or its starting context changed.')
          error.name = 'AbortError'
          throw error
        }
      }
      const contextMatches = () => {
        const state = useChatStore.getState()
        return (
          sameRequestConfig(run.config, state) &&
          state.activeConversationId === run.conversationId &&
          state.messages.some((message) => message.id === run.userMessageId)
        )
      }
      const ownsRun = () =>
        activeRun.current === run && mounted.current && !run.invalidated && contextMatches()
      const isCurrent = () => ownsRun() && !controller.signal.aborted
      const ensureCurrent = () => {
        if (!isCurrent()) {
          const error = new Error('Request stopped or its context changed.')
          error.name = 'AbortError'
          throw error
        }
      }
      let unsubscribe: (() => void) | undefined
      let retryAfterCleanup = false
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      let timedOut = false
      let fullContent = ''
      let sourceIds: string[] = []
      let retrievedChunks: RAGChunk[] = []
      const sourceRefs: ChatSourceRef[] = []
      const timeoutMs = provider === 'local' ? LOCAL_STREAM_TIMEOUT_MS : STREAM_TIMEOUT_MS
      const personaDims = {
        persona: pageContext.persona,
        experienceLevel: pageContext.experienceLevel,
        industry: pageContext.industry,
        region: pageContext.region,
      }
      const cacheProvider =
        provider === 'gemini' ? `gemini:${model}` : `local:${localModel}:${localContextWindow}`

      try {
        // Acquire the shared existing busy flag before retry preparation or
        // other actions can notify a subscriber that starts a different hook.
        setLoading(true)
        ensureStartupScope()
        if (isDisconnectRetry && retryPreparation.current) {
          const previous = retryPreparation.current
          retryPreparation.current = null
          const current = useChatStore.getState()
          if (
            previous.invalidated ||
            previous.controller.signal.aborted ||
            !sameRequestConfig(previous.config, current) ||
            current.activeConversationId !== previous.conversationId ||
            !current.messages.some((message) => message.id === previous.userMessageId)
          )
            return
          const previousIndex = current.messages.findIndex(
            (message) => message.id === previous.userMessageId
          )
          const expectedHistory = current.messages.slice(0, previousIndex)
          deleteMessagesFrom(previous.userMessageId)
          const afterDelete = useChatStore.getState()
          if (
            !sameRequestConfig(run.config, afterDelete) ||
            afterDelete.activeConversationId !== startupConversationId ||
            afterDelete.messages.length !== expectedHistory.length ||
            !afterDelete.messages.every((message, index) => message === expectedHistory.at(index))
          ) {
            run.invalidated = true
            controller.abort()
            return
          }
          startupMessages = afterDelete.messages
          ensureStartupScope()
          setWebLLMStatus('idle')
          ensureStartupScope()
          setWebLLMError(null)
          ensureStartupScope()
          historyBeforeQuery = [...startupMessages]
        }
        logChatQuery(pageContext.page)
        ensureStartupScope()
        addMessage(userMessage)
        const originConversations = useChatStore
          .getState()
          .conversations.filter((conversation) =>
            conversation.messages.some((message) => message.id === userMessage.id)
          )
        if (
          originConversations.length !== 1 ||
          (initialConversation && originConversations[0].id !== initialConversation.id)
        ) {
          run.invalidated = true
          controller.abort()
          return
        }
        run.conversationId = originConversations[0].id
        ensureCurrent()
        requestMessages = [...originConversations[0].messages]
        setError(null)
        unsubscribe = useChatStore.subscribe(() => {
          if (!sameRequestConfig(run.config, useChatStore.getState())) run.configInvalidated = true
          if (!contextMatches()) {
            const newlyInvalidated = !run.invalidated
            run.invalidated = true
            controller.abort()
            if (
              newlyInvalidated &&
              activeRun.current === run &&
              useChatStore.getState().streamingContent
            )
              setStreamingContent('')
          }
        })
        ensureCurrent()
        const cached = getCached(trimmed, pageContext.page, personaDims, cacheProvider)
        if (cached) {
          logChatCacheHit(pageContext.page)
          addMessage({
            id: nextMsgId('assistant'),
            role: 'assistant',
            content: cached.content,
            timestamp: Date.now(),
            sources: cached.sourceIds,
            sourceRefs: cached.sourceRefs,
            followUps: cached.followUps,
          })
          return
        }

        // For local provider: ensure engine is loaded (lazy initialization)
        if (provider === 'local' && !isEngineReady()) {
          setWebLLMStatus('downloading')
          ensureCurrent()
          setWebLLMError(null)
          ensureCurrent()
          try {
            await initializeEngine(
              localModel,
              (progress) => {
                // Download state belongs to this configuration, even if only
                // the query was stopped. No SDK cancellation is implied.
                if (
                  !run.configInvalidated &&
                  sameRequestConfig(run.config, useChatStore.getState())
                ) {
                  setWebLLMProgress(progress)
                  if (
                    !run.configInvalidated &&
                    sameRequestConfig(run.config, useChatStore.getState())
                  )
                    setWebLLMStatus(progress.status)
                }
              },
              localContextWindow
            )
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load local model.'
            if (!run.configInvalidated && sameRequestConfig(run.config, useChatStore.getState())) {
              setWebLLMError(msg)
              if (!run.configInvalidated && sameRequestConfig(run.config, useChatStore.getState()))
                setWebLLMStatus('error')
            }
            ensureCurrent()
            setError(msg)
            if (isCurrent()) onInputRestore?.(trimmed)
            return
          }
          if (!run.configInvalidated && sameRequestConfig(run.config, useChatStore.getState()))
            setWebLLMStatus('ready')
          ensureCurrent()
        }

        // Retrieve relevant context with page awareness + conversation history
        await retrievalService.initialize()
        ensureCurrent()
        const recentQueries = historyBeforeQuery
          .filter((m) => m.role === 'user')
          .slice(-5)
          .map((m) => m.content)
        const chunks = await retrievalService.searchWithEmbeddingFallback(trimmed, undefined, {
          page: pageContext.page,
          moduleId: pageContext.moduleId,
          relevantSources: pageContext.relevantSources,
          conversationContext: recentQueries,
          persona: pageContext.persona,
          industry: pageContext.industry,
          region: pageContext.region,
        })
        ensureCurrent()
        retrievedChunks = chunks

        // Dynamically inject persona-curated "What's New" chunk for changelog queries
        if (classifyIntent(trimmed) === 'whats_new') {
          const { selectedPersona, selectedIndustries, experienceLevel } =
            usePersonaStore.getState()
          const changedSources = useVersionStore.getState().getChangedSources()
          const whatsNewChunk = buildWhatsNewRAGChunk(
            changedSources,
            selectedPersona as PersonaId | null,
            selectedIndustries ?? [],
            experienceLevel
          )
          if (whatsNewChunk) {
            chunks.unshift(whatsNewChunk)
          }
        }

        // No evidence means no model call. This prevents either provider
        // from answering from training memory when retrieval found nothing.
        if (chunks.length === 0) {
          addMessage({
            id: nextMsgId('assistant'),
            role: 'assistant',
            content:
              "Based on the PQC Today database, I don't have enough information about this topic.",
            timestamp: Date.now(),
            sources: [],
            sourceRefs: [],
            followUps: [],
          })
          return
        }

        // T10 — Trust-aware refusal gate. For audit/regulatory queries with
        // only Low-tier or unscored evidence, emit a deterministic refusal
        // instead of calling the LLM. See §14.3 of trust-engine-explainability.
        const refusal = buildTrustRefusal(trimmed, chunks)
        if (refusal) {
          const refusalMessage: ChatMessage = {
            id: nextMsgId('assistant'),
            role: 'assistant',
            content: refusal,
            timestamp: Date.now(),
            sources: chunks.map((c) => c.id),
            sourceRefs: [],
            followUps: [],
          }
          addMessage(refusalMessage)
          return
        }

        // The request snapshot was captured after its own message was added and
        // after any deliberate retry deletion; later conversation changes cannot
        // replace the history supplied to this provider invocation.
        const allMessages = requestMessages

        // Stream response with safety timeout
        timeoutId = setTimeout(() => {
          timedOut = true
          controller.abort()
        }, timeoutMs)

        setStreaming(true)
        setStreamingContent('')
        setLoading(false)
        ensureCurrent()

        sourceIds = chunks.map((c) => c.id)
        logChatChunksUsed(
          pageContext.page,
          chunks.map((c) => c.source),
          chunks.length
        )

        // Resolve source trust tiers concurrently with generation. Importing
        // the trust data used to block the model on every cold first query.
        const tierResolverPromise = loadTierResolver()

        const runGeneration = async (attemptMessages: ChatMessage[]): Promise<string> => {
          ensureCurrent()
          const streamGen =
            provider === 'local'
              ? localStreamResponse(
                  attemptMessages,
                  chunks,
                  controller.signal,
                  pageContext,
                  localContextWindow
                )
              : geminiStreamResponse(
                  apiKey!,
                  attemptMessages,
                  chunks,
                  model,
                  controller.signal,
                  pageContext
                )
          let raw = ''
          for await (const chunk of streamGen) {
            ensureCurrent()
            raw += chunk
            // Restore the original immediate-feedback UX while keeping hidden
            // citation/follow-up metadata out of the visible draft.
            const metadataStart = raw.search(/```[ \t]*(?:citations|followups)\b/i)
            setStreamingContent(metadataStart === -1 ? raw : raw.slice(0, metadataStart).trimEnd())
          }
          ensureCurrent()
          fullContent = raw
          return raw
        }

        const parseAndVerify = (raw: string) => {
          const { cleanContent: contentAfterCitations, citations } = parseCitations(raw)
          const { cleanContent } = parseFollowUps(contentAfterCitations)
          return finalizeGroundedResponse(cleanContent, citations, chunks)
        }

        // One generation only. The former automatic retry doubled latency and
        // commonly returned the same rejection for both Gemini and Qwen.
        const verified = parseAndVerify(await runGeneration(allMessages))

        if (verified.mode !== 'verified') {
          console.warn('[Chat grounding] Model draft did not fully verify', {
            reasons: verified.decision.reasons,
            resolution: verified.mode,
            provider,
            model: provider === 'gemini' ? model : localModel,
          })
        }
        const finalContent = verified.content
        // Do not display model-authored follow-ups: they are outside the
        // claim/evidence map. ChatMessage derives safe question-only prompts
        // from the verified answer instead.
        const followUps: string[] = []

        // Build deduplicated source references after generation, reusing the
        // trust-data import that ran in parallel with the model.
        const tierForChunk = await tierResolverPromise
        ensureCurrent()
        const seenTitles = new Map<string, number>()
        for (const c of chunks) {
          const existingIdx = seenTitles.get(c.title)
          if (existingIdx !== undefined) {
            const existing = sourceRefs[existingIdx]
            const existingPriority =
              chunks.find((ch) => ch.deepLink === existing.deepLink && ch.title === c.title)
                ?.priority ?? 1
            const newPriority = c.priority ?? 1
            if (
              newPriority > existingPriority ||
              (c.deepLink?.includes('step=') && !existing.deepLink?.includes('step='))
            ) {
              sourceRefs[existingIdx] = {
                title: c.title,
                source:
                  c.source === 'document-enrichment'
                    ? (c.metadata?.collection ?? 'document')
                    : c.source,
                deepLink: c.deepLink,
                trustTier: tierForChunk(c),
              }
            }
            continue
          }
          seenTitles.set(c.title, sourceRefs.length)
          sourceRefs.push({
            title: c.title,
            source:
              c.source === 'document-enrichment'
                ? (c.metadata?.collection ?? 'document')
                : c.source,
            deepLink: c.deepLink,
            trustTier: tierForChunk(c),
          })
        }

        // Finalize message
        const assistantMessage: ChatMessage = {
          id: nextMsgId('assistant'),
          role: 'assistant',
          content: finalContent,
          timestamp: Date.now(),
          sources: sourceIds,
          sourceRefs,
          followUps,
        }
        addMessage(assistantMessage)

        ensureCurrent()
        // Cache successful response for deduplication
        setCache(
          trimmed,
          pageContext.page,
          { content: finalContent, sourceIds, sourceRefs, followUps },
          personaDims,
          cacheProvider
        )
      } catch (err) {
        // Clear/provider changes, Stop and unmount cannot publish an old result,
        // restore input or mutate a newly selected configuration.
        if (!ownsRun() || (controller.signal.aborted && !timedOut)) return
        if (timedOut) {
          if (fullContent.trim()) {
            addMessage({
              id: nextMsgId('assistant'),
              role: 'assistant',
              content: buildRetrievedEvidenceResponse(retrievedChunks),
              timestamp: Date.now(),
              sources: sourceIds,
              sourceRefs,
              followUps: [],
            })
          } else setError('Request timed out. Please try again.')
          return
        }
        if (err instanceof EngineDisconnectedError && !isDisconnectRetry) {
          // Keep the existing one-retry policy, but start it only after this
          // controller/subscription and transient state have been released.
          retryAfterCleanup = true
        } else if (err instanceof Error && err.name === 'AbortError') {
          return
        } else if (fullContent.trim()) {
          addMessage({
            id: nextMsgId('assistant'),
            role: 'assistant',
            content: buildRetrievedEvidenceResponse(retrievedChunks),
            timestamp: Date.now(),
            sources: sourceIds,
            sourceRefs,
            followUps: [],
          })
        } else {
          const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
          setError(errorMsg)
          if (isCurrent()) onInputRestore?.(trimmed)
          if (provider === 'gemini' && errorMsg.includes('Invalid API key')) {
            if (!isCurrent()) return
            // The existing key setter also clears error. Commit the same own-key
            // removal and its message atomically, before a subscriber can replace
            // the configuration; never perform a second write into that replacement.
            useChatStore.setState({
              apiKey: null,
              error: 'API key is invalid. Please update your key in the provider settings.',
            })
          }
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        unsubscribe?.()
        if (activeRun.current === run) {
          // Finish all old cleanup before a synchronous subscriber can start a
          // new hook/run. Existing transient fields change atomically; no new
          // persisted state, store action or cancellation contract is needed.
          activeRun.current = null
          useChatStore.setState({ isLoading: false, isStreaming: false, streamingContent: '' })
        }
      }
      if (
        retryAfterCleanup &&
        mounted.current &&
        !run.invalidated &&
        !controller.signal.aborted &&
        !activeRun.current &&
        !useChatStore.getState().isLoading &&
        !useChatStore.getState().isStreaming &&
        contextMatches()
      ) {
        retryPreparation.current = run
        await sendQuery(trimmed, onInputRestore, true)
        if (retryPreparation.current === run) retryPreparation.current = null
      }
    },
    [
      apiKey,
      provider,
      localModel,
      localContextWindow,
      model,
      pageContext,
      addMessage,
      deleteMessagesFrom,
      setLoading,
      setError,
      setStreaming,
      setStreamingContent,
      setWebLLMStatus,
      setWebLLMProgress,
      setWebLLMError,
    ]
  )

  const abort = useCallback(() => {
    const run = activeRun.current
    if (run) {
      run.controller.abort()
      setStreamingContent('')
    }
  }, [setStreamingContent])

  const retryLastQuery = useCallback(() => {
    if (
      activeRun.current ||
      useChatStore.getState().isLoading ||
      useChatStore.getState().isStreaming
    )
      return
    logChatRetry('retry')
    // Find the last user message, delete the assistant response after it, and re-send
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user')
    if (lastUserIdx === -1) return
    const lastUser = messages[messages.length - 1 - lastUserIdx]
    const query = lastUser.content

    // Delete from the assistant response onward (message after last user)
    const nextIdx = messages.length - lastUserIdx
    if (nextIdx < messages.length) {
      deleteMessagesFrom(messages[nextIdx].id)
    }

    sendQuery(query)
  }, [messages, deleteMessagesFrom, sendQuery])

  const editAndResend = useCallback(
    (messageId: string, newContent: string) => {
      if (
        activeRun.current ||
        useChatStore.getState().isLoading ||
        useChatStore.getState().isStreaming
      )
        return
      logChatRetry('edit')
      deleteMessagesFrom(messageId)
      sendQuery(newContent)
    },
    [deleteMessagesFrom, sendQuery]
  )

  return { sendQuery, abort, pageContext, retryLastQuery, editAndResend }
}
