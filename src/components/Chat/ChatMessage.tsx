import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNavigate } from 'react-router-dom'
import { Bot, User, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import { useChatStore } from '@/store/useChatStore'

interface ChatMessageProps {
  sender: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ sender, content, isStreaming }) => {
  const isUser = sender === 'user'
  const navigate = useNavigate()
  const setOpen = useChatStore((s) => s.setOpen)
  const [copied, setCopied] = useState(false)

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
                          setOpen(false)
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
      </div>
    </div>
  )
}
