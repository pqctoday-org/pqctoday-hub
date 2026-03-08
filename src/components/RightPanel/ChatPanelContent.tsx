// SPDX-License-Identifier: GPL-3.0-only
import React, { useRef, useEffect, useState } from 'react'
import { Bot, Send, Trash2, Shield, Cloud, Key, HelpCircle, Download } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { ChatMessage } from '../Chat/ChatMessage'
import { ProviderSetup } from '../Chat/ProviderSetup'
import { ModelDownloadBanner } from '../Chat/ModelDownloadBanner'
import { SampleQuestionsModal } from '../About/SampleQuestionsModal'
import { CorpusFreshnessBadge } from '../Chat/CorpusFreshnessBadge'
import { ConversationMenu } from '../Chat/ConversationMenu'
import { useChatStore } from '@/store/useChatStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useChatSend } from '@/hooks/useChatSend'
import { logChatFeedback } from '@/utils/analytics'
import { conversationToMarkdown, downloadMarkdown } from '@/services/chat/exportConversation'
import { clearCache } from '@/services/chat/responseCache'
import { initializeEngine, isEngineReady } from '@/services/chat/WebLLMService'

export const ChatPanelContent: React.FC = () => {
  const {
    provider,
    setProvider,
    setApiKey,
    localModel,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    clearMessages,
    setMessageFeedback,
    pendingQuestion,
    setPendingQuestion,
    conversations,
    activeConversationId,
    webllmStatus,
    webllmProgress,
    webllmError,
    setWebLLMStatus,
    setWebLLMProgress,
    setWebLLMError,
  } = useChatStore()

  const isOpen = useRightPanelStore((s) => s.isOpen)

  const [input, setInput] = useState('')
  const [showSampleQuestions, setShowSampleQuestions] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { sendQuery, abort, pageContext, retryLastQuery, editAndResend } = useChatSend()

  // Initialize retrieval service on first open (when provider is set)
  useEffect(() => {
    if (isOpen && provider) {
      import('@/services/chat/RetrievalService').then(({ retrievalService }) => {
        retrievalService.initialize().catch((err) => {
          console.error('Failed to initialize retrieval service:', err)
        })
      })
    }
  }, [isOpen, provider])

  // Eagerly start loading local model when panel opens
  useEffect(() => {
    if (isOpen && provider === 'local' && webllmStatus === 'idle' && !isEngineReady()) {
      setWebLLMStatus('checking')
      initializeEngine(localModel, (progress) => {
        setWebLLMProgress(progress)
        setWebLLMStatus(progress.status)
      })
        .then(() => setWebLLMStatus('ready'))
        .catch((err) => {
          setWebLLMError(err instanceof Error ? err.message : 'Failed to load model.')
          setWebLLMStatus('error')
        })
    }
  }, [
    isOpen,
    provider,
    localModel,
    webllmStatus,
    setWebLLMStatus,
    setWebLLMProgress,
    setWebLLMError,
  ])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Focus input on open
  useEffect(() => {
    if (isOpen && provider) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, provider])

  // Abort any in-flight stream when the panel closes
  useEffect(() => {
    if (!isOpen) abort()
  }, [isOpen, abort])

  // Auto-send pending question from Ask Assistant buttons
  useEffect(() => {
    if (pendingQuestion && provider && isOpen && !isLoading && !isStreaming) {
      const question = pendingQuestion
      setPendingQuestion(null)
      const timer = setTimeout(() => sendQuery(question), 300)
      return () => clearTimeout(timer)
    }
  }, [pendingQuestion, provider, isOpen, isLoading, isStreaming, setPendingQuestion, sendQuery])

  // Auto-resize textarea (up to ~4 lines)
  useEffect(() => {
    const textarea = inputRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [input])

  const handleSend = () => {
    const text = input
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    sendQuery(text, (restored) => setInput(restored))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDisconnect = () => {
    setProvider(null)
    setApiKey(null)
  }

  const handleRetryModelLoad = () => {
    setWebLLMStatus('idle')
    setWebLLMError(null)
  }

  const ProviderIcon = provider === 'local' ? Shield : Cloud
  const providerLabel = provider === 'local' ? 'Local' : 'Cloud'

  return (
    <>
      {/* Chat header actions */}
      <div className="px-4 md:px-12 py-2 border-b border-border shrink-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <Bot size={18} className="text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">PQC Assistant</span>
            {provider && (
              <span className="text-xs text-muted-foreground hidden sm:inline flex items-center gap-1">
                — {pageContext.page}
                <ProviderIcon size={10} />
                <span>{providerLabel}</span>
              </span>
            )}
          </div>
          {provider && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const conv = conversations.find((c) => c.id === activeConversationId)
                  if (conv) {
                    const md = conversationToMarkdown(conv)
                    downloadMarkdown(md, `${conv.title.replace(/[^a-z0-9]/gi, '-')}.md`)
                  }
                }}
                disabled={messages.length === 0}
                className="min-h-[44px] min-w-[44px] p-2"
                aria-label="Export conversation"
                title="Export conversation"
              >
                <Download size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSampleQuestions(true)}
                className="min-h-[44px] min-w-[44px] p-2"
                aria-label="Sample questions"
              >
                <HelpCircle size={16} />
              </Button>
              {showClearConfirm ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Clear all?
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearMessages()
                      clearCache()
                      setShowClearConfirm(false)
                    }}
                    className="min-h-[44px] px-2 text-status-error hover:text-status-error"
                    aria-label="Confirm clear conversation"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                    className="min-h-[44px] px-2"
                    aria-label="Cancel clear conversation"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={messages.length === 0}
                  className="min-h-[44px] min-w-[44px] p-2"
                  aria-label="Clear conversation"
                >
                  <Trash2 size={16} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="min-h-[44px] min-w-[44px] p-2"
                aria-label="Switch provider"
                title="Switch provider"
              >
                <Key size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {!provider ? (
        <ProviderSetup />
      ) : (
        <>
          <ConversationMenu />

          {/* Model download banner for local mode */}
          {provider === 'local' && webllmStatus !== 'ready' && webllmStatus !== 'idle' && (
            <ModelDownloadBanner
              status={webllmStatus}
              progress={webllmProgress}
              error={webllmError}
              onRetry={handleRetryModelLoad}
            />
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 md:px-12">
            <div className="max-w-4xl mx-auto space-y-4" aria-live="polite" aria-atomic="false">
              {messages.length === 0 && !isStreaming && (
                <div className="text-center py-12 space-y-4">
                  <Bot size={40} className="text-muted-foreground mx-auto opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about post-quantum cryptography, algorithms, compliance, or
                    migration strategies.
                  </p>
                  <CorpusFreshnessBadge />
                  {/* Page-contextual suggested questions */}
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {pageContext.suggestedQuestions.map((q) => (
                      <Button
                        key={q}
                        variant="ghost"
                        size="sm"
                        onClick={() => sendQuery(q)}
                        className="text-xs px-3 py-1.5 h-auto rounded-full border border-border bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isLastAssistant =
                  msg.role === 'assistant' && idx === messages.length - 1 && !isStreaming
                const isLastUser =
                  msg.role === 'user' &&
                  idx ===
                    messages.length -
                      1 -
                      (messages.length > 0 && messages[messages.length - 1].role === 'assistant'
                        ? 1
                        : 0) &&
                  !isStreaming
                return (
                  <ChatMessage
                    key={msg.id}
                    sender={msg.role}
                    content={msg.content}
                    sourceRefs={msg.sourceRefs}
                    activeTab={pageContext.tab}
                    followUps={msg.followUps}
                    persona={pageContext.persona}
                    onFollowUp={isLastAssistant ? sendQuery : undefined}
                    feedback={msg.feedback}
                    onFeedback={
                      msg.role === 'assistant'
                        ? (fb) => {
                            setMessageFeedback(msg.id, fb)
                            if (fb) {
                              const precedingUser = messages
                                .slice(0, idx)
                                .reverse()
                                .find((m) => m.role === 'user')
                              logChatFeedback(
                                fb,
                                precedingUser?.content ?? '',
                                msg.sourceRefs?.length ?? 0
                              )
                            }
                          }
                        : undefined
                    }
                    onRetry={isLastAssistant && !isLoading ? retryLastQuery : undefined}
                    onEdit={
                      isLastUser && !isLoading
                        ? (newContent) => editAndResend(msg.id, newContent)
                        : undefined
                    }
                  />
                )
              })}

              {isStreaming && (
                <ChatMessage sender="assistant" content={streamingContent} isStreaming />
              )}

              {isLoading && !isStreaming && (
                <div className="flex gap-2" role="status" aria-label="Searching for answer">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                    <Bot size={14} className="text-accent" />
                  </div>
                  <div className="glass-panel rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                        aria-hidden="true"
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]"
                        aria-hidden="true"
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="sr-only">Searching for answer</span>
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="text-sm text-status-error bg-status-error/10 rounded-lg p-3"
                >
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 md:px-12 border-t border-border shrink-0">
            <div className="max-w-4xl mx-auto flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about PQC..."
                className="flex-1 bg-muted/30 border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 text-foreground placeholder:text-muted-foreground min-h-[44px] max-h-[120px]"
                disabled={isLoading || isStreaming}
                aria-label="Message input"
                rows={1}
              />
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isStreaming}
                className="min-h-[44px] min-w-[44px] px-3"
                aria-label="Send message"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </>
      )}

      <SampleQuestionsModal
        isOpen={showSampleQuestions}
        onClose={() => setShowSampleQuestions(false)}
        onSendQuestion={(q) => sendQuery(q)}
      />
    </>
  )
}
