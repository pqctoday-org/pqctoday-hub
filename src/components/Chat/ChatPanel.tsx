import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Trash2, KeyRound, HelpCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { ChatMessage } from './ChatMessage'
import { ApiKeySetup } from './ApiKeySetup'
import { SampleQuestionsModal } from '../About/SampleQuestionsModal'
import { useChatStore } from '@/store/useChatStore'
import { retrievalService } from '@/services/chat/RetrievalService'
import { streamResponse } from '@/services/chat/GeminiService'
import type { ChatMessage as ChatMessageType } from '@/types/ChatTypes'

export const ChatPanel: React.FC = () => {
  const {
    isOpen,
    setOpen,
    apiKey,
    setApiKey,
    messages,
    addMessage,
    isLoading,
    setLoading,
    isStreaming,
    setStreaming,
    streamingContent,
    setStreamingContent,
    appendStreamingContent,
    error,
    setError,
    clearMessages,
    model,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [showSampleQuestions, setShowSampleQuestions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Initialize retrieval service on first open
  useEffect(() => {
    if (isOpen && apiKey) {
      retrievalService.initialize().catch((err) => {
        console.error('Failed to initialize retrieval service:', err)
      })
    }
  }, [isOpen, apiKey])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Focus input on open
  useEffect(() => {
    if (isOpen && apiKey) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, apiKey])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || !apiKey || isLoading || isStreaming) return

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }

    addMessage(userMessage)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Retrieve relevant context
      await retrievalService.initialize()
      const chunks = retrievalService.search(trimmed, 15)

      // Build conversation for API
      const allMessages = [...messages, userMessage]

      // Stream response
      const controller = new AbortController()
      abortRef.current = controller
      setStreaming(true)
      setStreamingContent('')
      setLoading(false)

      let fullContent = ''
      const sourceIds = chunks.map((c) => c.id)

      for await (const chunk of streamResponse(
        apiKey,
        allMessages,
        chunks,
        model,
        controller.signal
      )) {
        fullContent += chunk
        appendStreamingContent(chunk)
      }

      // Finalize message
      const assistantMessage: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        sources: sourceIds,
      }
      addMessage(assistantMessage)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return

      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(errorMsg)

      // If API key is invalid, clear it
      if (errorMsg.includes('Invalid API key')) {
        setApiKey(null)
      }
    } finally {
      setStreaming(false)
      setStreamingContent('')
      setLoading(false)
      abortRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClose = () => {
    if (abortRef.current) abortRef.current.abort()
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm print:hidden"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[60] w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden print:hidden"
            role="dialog"
            aria-label="PQC Assistant"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">PQC Assistant</h2>
                </div>
                <div className="flex items-center gap-1">
                  {apiKey && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSampleQuestions(true)}
                        className="min-h-[44px] min-w-[44px] p-2"
                        aria-label="Sample questions"
                      >
                        <HelpCircle size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearMessages}
                        className="min-h-[44px] min-w-[44px] p-2"
                        aria-label="Clear conversation"
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setApiKey(null)}
                        className="min-h-[44px] min-w-[44px] p-2"
                        aria-label="Disconnect API key"
                      >
                        <KeyRound size={16} />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="min-h-[44px] min-w-[44px] p-2"
                    aria-label="Close assistant"
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            {!apiKey ? (
              <ApiKeySetup />
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && !isStreaming && (
                    <div className="text-center py-12 space-y-3">
                      <Bot size={40} className="text-muted-foreground mx-auto opacity-40" />
                      <p className="text-sm text-muted-foreground">
                        Ask me anything about post-quantum cryptography, algorithms, compliance, or
                        migration strategies.
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} sender={msg.role} content={msg.content} />
                  ))}

                  {isStreaming && streamingContent && (
                    <ChatMessage sender="assistant" content={streamingContent} isStreaming />
                  )}

                  {isLoading && !isStreaming && (
                    <div className="flex gap-2">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <Bot size={14} className="text-accent" />
                      </div>
                      <div className="glass-panel rounded-lg px-3 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-sm text-status-error bg-status-error/10 rounded-lg p-3">
                      {error}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border shrink-0">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about PQC..."
                      className="flex-1 bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground"
                      disabled={isLoading || isStreaming}
                      aria-label="Message input"
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
          </motion.div>

          <SampleQuestionsModal
            isOpen={showSampleQuestions}
            onClose={() => setShowSampleQuestions(false)}
          />
        </>
      )}
    </AnimatePresence>
  )
}
