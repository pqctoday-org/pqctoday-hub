import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNavigate } from 'react-router-dom'
import { Bot, User, Copy, Check, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { generateFollowUps } from './generateFollowUps'
import type { ChatSourceRef } from '@/types/ChatTypes'

interface ChatMessageProps {
  sender: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  sourceRefs?: ChatSourceRef[]
  onFollowUp?: (question: string) => void
  activeTab?: string
  followUps?: string[]
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  sender,
  content,
  isStreaming,
  sourceRefs,
  onFollowUp,
  activeTab,
  followUps,
}) => {
  const isUser = sender === 'user'
  const navigate = useNavigate()
  const closePanel = useRightPanelStore((s) => s.close)
  const [copied, setCopied] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={clsx('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={clsx(
          'shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary/20' : 'bg-accent/20'
        )}
      >
        {isUser ? (
          <User size={14} className="text-primary" />
        ) : (
          <Bot size={14} className="text-accent" />
        )}
      </div>

      <div
        className={clsx(
          'group relative max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser ? 'bg-primary/15 text-foreground' : 'glass-panel'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-primary prose-code:bg-muted/30 prose-code:px-1 prose-code:rounded">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const isInternal = href?.startsWith('/')
                  if (isInternal) {
                    return (
                      <a
                        href={href}
                        className="text-primary underline"
                        onClick={(e) => {
                          e.preventDefault()
                          closePanel()
                          if (href) navigate(href)
                        }}
                      >
                        {children}
                      </a>
                    )
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      {children}
                    </a>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        )}

        {/* Copy button — assistant messages only */}
        {!isUser && !isStreaming && (
          <button
            onClick={handleCopy}
            className="absolute bottom-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            aria-label="Copy response"
            title={copied ? 'Copied!' : 'Copy'}
          >
            {copied ? <Check size={12} className="text-status-success" /> : <Copy size={12} />}
          </button>
        )}

        {/* Source attribution — assistant messages only */}
        {!isUser && !isStreaming && sourceRefs && sourceRefs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText size={11} />
              {showSources ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {sourceRefs.length} source{sourceRefs.length !== 1 ? 's' : ''}
            </button>
            {showSources && (
              <ul className="mt-1.5 space-y-0.5">
                {sourceRefs.map((ref, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-muted-foreground/50 shrink-0">·</span>
                    {ref.deepLink ? (
                      <a
                        href={ref.deepLink}
                        className="text-primary/80 hover:text-primary hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault()
                          closePanel()
                          navigate(ref.deepLink!)
                        }}
                      >
                        {ref.title}
                      </a>
                    ) : (
                      <span>{ref.title}</span>
                    )}
                    <span className="text-muted-foreground/40 text-[10px]">({ref.source})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Follow-up question suggestions — assistant messages only */}
        {!isUser &&
          !isStreaming &&
          onFollowUp &&
          (() => {
            // Use LLM-generated follow-ups if provided; fall back to regex extraction
            const displayFollowUps =
              followUps && followUps.length > 0 ? followUps : generateFollowUps(content, activeTab)
            if (displayFollowUps.length === 0) return null
            return (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {displayFollowUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => onFollowUp(q)}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )
          })()}
      </div>
    </div>
  )
}
