// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useCallback } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { usePageContext } from '@/hooks/usePageContext'
import { retrievalService } from '@/services/chat/RetrievalService'
import { streamResponse as geminiStreamResponse } from '@/services/chat/GeminiService'
import {
  streamResponse as localStreamResponse,
  initializeEngine,
  isEngineReady,
} from '@/services/chat/WebLLMService'
import { parseFollowUps } from '@/services/chat/parseFollowUps'
import { checkGrounding } from '@/services/chat/groundingCheck'
import type { ChatMessage, ChatSourceRef } from '@/types/ChatTypes'
import { logChatQuery, logChatRetry, logChatChunksUsed, logChatCacheHit } from '@/utils/analytics'
import { getCached, setCache } from '@/services/chat/responseCache'

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
    appendStreamingContent,
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
    async (queryText: string, onInputRestore?: (text: string) => void) => {
      const trimmed = queryText.trim().slice(0, MAX_INPUT_LENGTH)
      if (!trimmed || isLoading || isStreaming) return
      // Provider-specific guards
      if (provider === 'gemini' && !apiKey) return
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
      const cached = getCached(trimmed, pageContext.page, personaDims)
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
        const chunks = retrievalService.search(trimmed, undefined, {
          page: pageContext.page,
          moduleId: pageContext.moduleId,
          relevantSources: pageContext.relevantSources,
          conversationContext: recentQueries,
          persona: pageContext.persona,
          industry: pageContext.industry,
          region: pageContext.region,
        })

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
          })
        }

        // Dispatch to the correct provider
        const streamGen =
          provider === 'local'
            ? localStreamResponse(
                allMessages,
                chunks,
                controller.signal,
                pageContext,
                localContextWindow
              )
            : geminiStreamResponse(
                apiKey!,
                allMessages,
                chunks,
                model,
                controller.signal,
                pageContext
              )

        for await (const chunk of streamGen) {
          fullContent += chunk
          appendStreamingContent(chunk)
        }

        // Parse follow-ups from response and strip the block from displayed content
        const { cleanContent, followUps } = parseFollowUps(fullContent)

        // Check if response references entities not found in RAG context
        const grounding = checkGrounding(cleanContent, chunks)
        const finalContent = grounding.hasWarning
          ? cleanContent.trimEnd() +
            '\n\n> **Accuracy notice:** This response may reference items not verified in the PQC Today database. Please cross-check specific names, dates, or claims against the source pages linked above.'
          : cleanContent

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
          personaDims
        )
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          if (timedOut) {
            if (fullContent.trim()) {
              // Save partial content instead of discarding on timeout
              const { cleanContent, followUps } = parseFollowUps(fullContent)
              const assistantMessage: ChatMessage = {
                id: nextMsgId('assistant'),
                role: 'assistant',
                content:
                  cleanContent.trimEnd() +
                  '\n\n*(Response timed out — the above may be incomplete.)*',
                timestamp: Date.now(),
                sources: sourceIds,
                sourceRefs,
                followUps,
              }
              addMessage(assistantMessage)
            } else {
              setError('Request timed out. Please try again.')
            }
          }
          return
        }

        // If content was streamed before the error, save it rather than discarding it
        if (fullContent.trim()) {
          const { cleanContent, followUps } = parseFollowUps(fullContent)
          const assistantMessage: ChatMessage = {
            id: nextMsgId('assistant'),
            role: 'assistant',
            content:
              cleanContent.trimEnd() +
              '\n\n*(Connection interrupted — response may be incomplete.)*',
            timestamp: Date.now(),
            sources: sourceIds,
            sourceRefs,
            followUps,
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
      setLoading,
      setError,
      setStreaming,
      setStreamingContent,
      appendStreamingContent,
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
