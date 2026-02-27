import { useRef, useCallback } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { usePageContext } from '@/hooks/usePageContext'
import { retrievalService } from '@/services/chat/RetrievalService'
import { streamResponse } from '@/services/chat/GeminiService'
import { parseFollowUps } from '@/services/chat/parseFollowUps'
import type { ChatMessage, ChatSourceRef } from '@/types/ChatTypes'

const STREAM_TIMEOUT_MS = 60_000

/**
 * Shared hook encapsulating RAG retrieval → Gemini streaming → follow-up parsing.
 * Used by both ChatPanel (modal) and ChatPanelContent (right panel).
 */
export function useChatSend() {
  const {
    apiKey,
    setApiKey,
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
  } = useChatStore()

  const pageContext = usePageContext()
  const abortRef = useRef<AbortController | null>(null)

  const sendQuery = useCallback(
    async (queryText: string, onInputRestore?: (text: string) => void) => {
      const trimmed = queryText.trim()
      if (!trimmed || !apiKey || isLoading || isStreaming) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      }

      addMessage(userMessage)
      setLoading(true)
      setError(null)

      let timeoutId: ReturnType<typeof setTimeout> | undefined

      try {
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
        })

        // Build conversation for API
        const allMessages = [...messages, userMessage]

        // Stream response with safety timeout
        const controller = new AbortController()
        abortRef.current = controller
        timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS)

        setStreaming(true)
        setStreamingContent('')
        setLoading(false)

        let fullContent = ''
        const sourceIds = chunks.map((c) => c.id)

        // Build deduplicated source references for attribution
        const seenTitles = new Set<string>()
        const sourceRefs: ChatSourceRef[] = []
        for (const c of chunks) {
          if (seenTitles.has(c.title)) continue
          seenTitles.add(c.title)
          sourceRefs.push({ title: c.title, source: c.source, deepLink: c.deepLink })
        }

        for await (const chunk of streamResponse(
          apiKey,
          allMessages,
          chunks,
          model,
          controller.signal,
          pageContext
        )) {
          fullContent += chunk
          appendStreamingContent(chunk)
        }

        // Parse follow-ups from response and strip the block from displayed content
        const { cleanContent, followUps } = parseFollowUps(fullContent)

        // Finalize message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: cleanContent,
          timestamp: Date.now(),
          sources: sourceIds,
          sourceRefs,
          followUps,
        }
        addMessage(assistantMessage)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
        setError(errorMsg)

        // Restore the query so the user can retry by clicking Send
        onInputRestore?.(trimmed)

        // If API key is invalid, clear it
        if (errorMsg.includes('Invalid API key')) {
          setApiKey(null)
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
      messages,
      isLoading,
      isStreaming,
      model,
      pageContext,
      addMessage,
      setLoading,
      setError,
      setStreaming,
      setStreamingContent,
      appendStreamingContent,
      setApiKey,
    ]
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { sendQuery, abort, pageContext }
}
