import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  User,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../ui/button'
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
  persona?: string | null
  feedback?: 'helpful' | 'unhelpful'
  onFeedback?: (feedback: 'helpful' | 'unhelpful' | undefined) => void
  onRetry?: () => void
  onEdit?: (newContent: string) => void
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  sender,
  content,
  isStreaming,
  sourceRefs,
  onFollowUp,
  activeTab,
  followUps,
  persona,
  feedback,
  onFeedback,
  onRetry,
  onEdit,
}) => {
  const isUser = sender === 'user'
  const navigate = useNavigate()
  const closePanel = useRightPanelStore((s) => s.close)
  const [copied, setCopied] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(content)

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
          isEditing && onEdit ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-md px-2 py-1.5 text-sm text-foreground resize-none focus:outline-none focus:border-primary/50"
                rows={Math.min(editText.split('\n').length + 1, 6)}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              <div className="flex gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditText(content)
                  }}
                  className="text-xs px-2 py-1 h-auto min-h-0"
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => {
                    if (editText.trim() && editText.trim() !== content) {
                      onEdit(editText.trim())
                    }
                    setIsEditing(false)
                  }}
                  disabled={!editText.trim() || editText.trim() === content}
                  className="text-xs px-2 py-1 h-auto min-h-0"
                >
                  Save & Resend
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )
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
              <>
                <span
                  className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-text-bottom"
                  aria-hidden="true"
                />
                <span className="sr-only" role="status">
                  Response in progress
                </span>
              </>
            )}
          </div>
        )}

        {/* Action buttons — assistant messages */}
        {!isUser && !isStreaming && (
          <div
            className={clsx(
              'flex items-center gap-0.5 mt-1',
              !feedback &&
                '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity'
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="p-1 h-auto min-h-0 text-muted-foreground hover:text-foreground"
              aria-label="Copy response"
              title={copied ? 'Copied!' : 'Copy'}
            >
              {copied ? <Check size={12} className="text-status-success" /> : <Copy size={12} />}
            </Button>
            {onFeedback && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFeedback(feedback === 'helpful' ? undefined : 'helpful')}
                  className={clsx(
                    'p-1 h-auto min-h-0',
                    feedback === 'helpful'
                      ? 'text-status-success'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Helpful"
                  title="Helpful"
                >
                  <ThumbsUp size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFeedback(feedback === 'unhelpful' ? undefined : 'unhelpful')}
                  className={clsx(
                    'p-1 h-auto min-h-0',
                    feedback === 'unhelpful'
                      ? 'text-status-error'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Not helpful"
                  title="Not helpful"
                >
                  <ThumbsDown size={12} />
                </Button>
              </>
            )}
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="p-1 h-auto min-h-0 text-muted-foreground hover:text-foreground"
                aria-label="Retry"
                title="Retry"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </Button>
            )}
          </div>
        )}

        {/* Edit button — user messages only */}
        {isUser && !isStreaming && onEdit && !isEditing && (
          <div className="flex items-center gap-0.5 mt-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditText(content)
                setIsEditing(true)
              }}
              className="p-1 h-auto min-h-0 text-muted-foreground hover:text-foreground"
              aria-label="Edit message"
              title="Edit"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Button>
          </div>
        )}

        {/* Source attribution — assistant messages only */}
        {!isUser && !isStreaming && sourceRefs && sourceRefs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSources(!showSources)}
              aria-expanded={showSources}
              className="flex items-center gap-1 p-0 h-auto min-h-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText size={11} />
              {showSources ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {sourceRefs.length} source{sourceRefs.length !== 1 ? 's' : ''}
            </Button>
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
                          if (ref.deepLink!.startsWith('http')) {
                            window.open(ref.deepLink!, '_blank', 'noopener,noreferrer')
                          } else {
                            closePanel()
                            navigate(ref.deepLink!)
                          }
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
              followUps && followUps.length > 0
                ? followUps
                : generateFollowUps(content, activeTab, persona)
            if (displayFollowUps.length === 0) return null
            return (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {displayFollowUps.map((q) => (
                  <Button
                    key={q}
                    variant="ghost"
                    size="sm"
                    onClick={() => onFollowUp(q)}
                    className="text-xs px-2.5 py-1 h-auto min-h-0 rounded-full border border-border bg-muted/20 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )
          })()}
      </div>
    </div>
  )
}
