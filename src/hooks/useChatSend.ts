// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useCallback } from 'react'
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
import { appendGroundedDeepLinks } from '@/services/chat/deepLinkInjection'
import {
  buildGroundingFailureResponse,
  enforceGrounding,
  GROUNDING_RETRY_INSTRUCTION,
} from '@/services/chat/groundingPolicy'
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

/**
 * Shared hook encapsulating RAG retrieval → LLM streaming → follow-up parsing.
 * Dispatches to Gemini (cloud) or WebLLM (local) based on the provider field
 * in the chat store.
 */
export function useChatSend() {
  const {
    apiKey,
    setApiKey,
    provider,
    localModel,
    localContextWindow,
    messages,
    addMessage,
    isLoading,
    setLoading,
    isStreaming,
    setStreaming,
    setStreamingContent,
    setError,
    model,
    deleteMessagesFrom,
    webllmStatus,
    setWebLLMStatus,
    setWebLLMProgress,
    setWebLLMError,
  } = useChatStore()

  const pageContext = usePageContext()
  const abortRef = useRef<AbortController | null>(null)

  const sendQuery = useCallback(
    async (
      queryText: string,
      onInputRestore?: (text: string) => void,
      isDisconnectRetry = false
    ) => {
      const trimmed = queryText.trim().slice(0, MAX_INPUT_LENGTH)
      if (!trimmed || isLoading || isStreaming) return
      // Provider-specific guards
      if (provider === 'gemini' && !apiKey) {
        onInputRestore?.(trimmed)
        setError('API key is missing. Use the key icon to reconnect.')
        return
      }
      if (provider === 'local' && webllmStatus === 'unsupported') return
      if (!provider) return

      logChatQuery(pageContext.page)

      const userMessage: ChatMessage = {
        id: nextMsgId('user'),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      }

      addMessage(userMessage)
      setLoading(true)
      setError(null)

      // Check response cache before RAG retrieval
      const personaDims = {
        persona: pageContext.persona,
        experienceLevel: pageContext.experienceLevel,
        industry: pageContext.industry,
        region: pageContext.region,
      }
      const cacheProvider =
        provider === 'gemini' ? `gemini:${model}` : `local:${localModel}:${localContextWindow}`
      const cached = getCached(trimmed, pageContext.page, personaDims, cacheProvider)
      if (cached) {
        logChatCacheHit(pageContext.page)
        const cachedMessage: ChatMessage = {
          id: nextMsgId('assistant'),
          role: 'assistant',
          content: cached.content,
          timestamp: Date.now(),
          sources: cached.sourceIds,
          sourceRefs: cached.sourceRefs,
          followUps: cached.followUps,
        }
        addMessage(cachedMessage)
        setLoading(false)
        return
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined
      let timedOut = false
      let fullContent = ''
      let sourceIds: string[] = []
      const sourceRefs: ChatSourceRef[] = []
      const timeoutMs = provider === 'local' ? LOCAL_STREAM_TIMEOUT_MS : STREAM_TIMEOUT_MS

      // Create abort controller early so Stop button works during model download
      const controller = new AbortController()
      abortRef.current = controller

      try {
        // For local provider: ensure engine is loaded (lazy initialization)
        if (provider === 'local' && !isEngineReady()) {
          setWebLLMStatus('downloading')
          setWebLLMError(null)
          try {
            await initializeEngine(
              localModel,
              (progress) => {
                setWebLLMProgress(progress)
                setWebLLMStatus(progress.status)
              },
              localContextWindow
            )
            setWebLLMStatus('ready')
            // Bail if user clicked Stop during download
            if (controller.signal.aborted) {
              setLoading(false)
              return
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load local model.'
            setWebLLMError(msg)
            setWebLLMStatus('error')
            setError(msg)
            setLoading(false)
            onInputRestore?.(trimmed)
            return
          }
        }

        // Retrieve relevant context with page awareness + conversation history
        await retrievalService.initialize()
        const recentQueries = messages
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
          setLoading(false)
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
          setLoading(false)
          return
        }

        // Read latest messages from store (not closure) so that prior
        // deleteMessagesFrom calls in retryLastQuery/editAndResend are reflected.
        // addMessage above already added userMessage synchronously.
        const allMessages = useChatStore.getState().messages

        // Stream response with safety timeout
        timeoutId = setTimeout(() => {
          timedOut = true
          controller.abort()
        }, timeoutMs)

        setStreaming(true)
        setStreamingContent('')
        setLoading(false)

        sourceIds = chunks.map((c) => c.id)
        logChatChunksUsed(
          pageContext.page,
          chunks.map((c) => c.source),
          chunks.length
        )

        // Build deduplicated source references for attribution
        const tierForChunk = await loadTierResolver()
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

        const runGeneration = async (attemptMessages: ChatMessage[]): Promise<string> => {
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
          for await (const chunk of streamGen) raw += chunk
          fullContent = raw
          return raw
        }

        const parseAndVerify = (raw: string) => {
          const { cleanContent: contentAfterCitations, citations } = parseCitations(raw)
          const { cleanContent } = parseFollowUps(contentAfterCitations)
          return {
            cleanContent,
            citations,
            decision: enforceGrounding(cleanContent, citations, chunks),
          }
        }

        // Buffer drafts until verification completes. Unsupported text is
        // never streamed into the visible chat and then retracted afterward.
        let verified = parseAndVerify(await runGeneration(allMessages))
        if (!verified.decision.approved) {
          const correction: ChatMessage = {
            id: nextMsgId('grounding-retry'),
            role: 'user',
            content: GROUNDING_RETRY_INSTRUCTION,
            timestamp: Date.now(),
          }
          verified = parseAndVerify(await runGeneration([...allMessages, correction]))
        }

        const finalContent = verified.decision.approved
          ? appendGroundedDeepLinks(verified.cleanContent, verified.citations, chunks)
          : buildGroundingFailureResponse()
        // Do not display model-authored follow-ups: they are outside the
        // claim/evidence map. ChatMessage derives safe question-only prompts
        // from the verified answer instead.
        const followUps: string[] = []

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

        // Cache successful response for deduplication
        setCache(
          trimmed,
          pageContext.page,
          { content: finalContent, sourceIds, sourceRefs, followUps },
          personaDims,
          cacheProvider
        )
      } catch (err) {
        // Local model's GPU session died mid-request (commonly: the tab was
        // backgrounded and the browser reclaimed WebGPU memory). The engine
        // has already been reset — silently reload and retry once instead of
        // leaving the user with a dead end. Remove the just-added user
        // message first so the retry doesn't duplicate it.
        if (err instanceof EngineDisconnectedError && !isDisconnectRetry) {
          deleteMessagesFrom(userMessage.id)
          setWebLLMStatus('idle')
          setWebLLMError(null)
          void sendQuery(trimmed, onInputRestore, true)
          return
        }

        if (err instanceof Error && err.name === 'AbortError') {
          if (timedOut) {
            if (fullContent.trim()) {
              // A partial draft has not passed grounding verification. Never
              // display it; return the deterministic corpus-only fallback.
              const assistantMessage: ChatMessage = {
                id: nextMsgId('assistant'),
                role: 'assistant',
                content: buildGroundingFailureResponse(),
                timestamp: Date.now(),
                sources: sourceIds,
                sourceRefs,
                followUps: [],
              }
              addMessage(assistantMessage)
            } else {
              setError('Request timed out. Please try again.')
            }
          }
          return
        }

        // Never display an interrupted draft: it did not reach the grounding gate.
        if (fullContent.trim()) {
          const assistantMessage: ChatMessage = {
            id: nextMsgId('assistant'),
            role: 'assistant',
            content: buildGroundingFailureResponse(),
            timestamp: Date.now(),
            sources: sourceIds,
            sourceRefs,
            followUps: [],
          }
          addMessage(assistantMessage)
          return
        }

        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
        setError(errorMsg)

        // Restore the query so the user can retry by clicking Send
        onInputRestore?.(trimmed)

        // If API key is invalid, clear it and surface a clear message
        if (provider === 'gemini' && errorMsg.includes('Invalid API key')) {
          setApiKey(null)
          setError('API key is invalid. Please update your key in the provider settings.')
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        setStreaming(false)
        setStreamingContent('')
        setLoading(false)
        abortRef.current = null
      }
    },
    [
      apiKey,
      provider,
      localModel,
      localContextWindow,
      messages,
      isLoading,
      isStreaming,
      model,
      pageContext,
      webllmStatus,
      addMessage,
      deleteMessagesFrom,
      setLoading,
      setError,
      setStreaming,
      setStreamingContent,
      setApiKey,
      setWebLLMStatus,
      setWebLLMProgress,
      setWebLLMError,
    ]
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const retryLastQuery = useCallback(() => {
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
      logChatRetry('edit')
      deleteMessagesFrom(messageId)
      sendQuery(newContent)
    },
    [deleteMessagesFrom, sendQuery]
  )

  return { sendQuery, abort, pageContext, retryLastQuery, editAndResend }
}
