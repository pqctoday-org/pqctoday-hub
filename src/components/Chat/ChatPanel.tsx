import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Trash2, KeyRound, HelpCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { ChatMessage } from './ChatMessage'
import { ApiKeySetup } from './ApiKeySetup'
import { SampleQuestionsModal } from '../About/SampleQuestionsModal'
import { useChatStore } from '@/store/useChatStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useChatSend } from '@/hooks/useChatSend'

export const ChatPanel: React.FC = () => {
  const isOpen = useRightPanelStore((s) => s.isOpen)
  const setOpen = useRightPanelStore((s) => s.close)
  const {
    apiKey,
    setApiKey,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    clearMessages,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [showSampleQuestions, setShowSampleQuestions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { sendQuery, abort, pageContext } = useChatSend()

  // Initialize retrieval service on first open
  useEffect(() => {
    if (isOpen && apiKey) {
      import('@/services/chat/RetrievalService').then(({ retrievalService }) => {
        retrievalService.initialize().catch((err) => {
          console.error('Failed to initialize retrieval service:', err)
        })
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
      if (e.key === 'Escape') setOpen()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  const handleSend = () => {
    const text = input
    setInput('')
    sendQuery(text, (restored) => setInput(restored))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClose = () => {
    abort()
    setOpen()
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

          {/* Panel — 60% width on desktop, full on mobile */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[60] w-full md:w-[60vw] bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden print:hidden"
            role="dialog"
            aria-label="PQC Assistant"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 md:px-12 border-b border-border shrink-0">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">PQC Assistant</h2>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — {pageContext.page}
                  </span>
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
                        onClick={() => {
                          if (messages.length === 0) return
                          if (confirm('Clear all messages? This cannot be undone.')) clearMessages()
                        }}
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
                <div className="flex-1 overflow-y-auto p-4 md:p-6 md:px-12">
                  <div
                    className="max-w-4xl mx-auto space-y-4"
                    aria-live="polite"
                    aria-atomic="false"
                  >
                    {messages.length === 0 && !isStreaming && (
                      <div className="text-center py-12 space-y-4">
                        <Bot size={40} className="text-muted-foreground mx-auto opacity-40" />
                        <p className="text-sm text-muted-foreground">
                          Ask me anything about post-quantum cryptography, algorithms, compliance,
                          or migration strategies.
                        </p>
                        {/* Page-contextual suggested questions */}
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {pageContext.suggestedQuestions.map((q) => (
                            <button
                              key={q}
                              onClick={() => sendQuery(q)}
                              className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <ChatMessage
                        key={msg.id}
                        sender={msg.role}
                        content={msg.content}
                        sourceRefs={msg.sourceRefs}
                        onFollowUp={
                          msg.role === 'assistant' && idx === messages.length - 1 && !isStreaming
                            ? sendQuery
                            : undefined
                        }
                      />
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
                </div>

                {/* Input */}
                <div className="p-4 md:px-12 border-t border-border shrink-0">
                  <div className="max-w-4xl mx-auto flex gap-2">
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
