import React, { useState, useRef, useEffect } from 'react'
import { Plus, ChevronDown, Trash2, MessageSquare, Download } from 'lucide-react'
import { Button } from '../ui/button'
import { useChatStore } from '@/store/useChatStore'
import { conversationToMarkdown, downloadMarkdown } from '@/services/chat/exportConversation'
import clsx from 'clsx'

export const ConversationMenu: React.FC = () => {
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const isLoading = useChatStore((s) => s.isLoading)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const createConversation = useChatStore((s) => s.createConversation)
  const switchConversation = useChatStore((s) => s.switchConversation)
  const deleteConversation = useChatStore((s) => s.deleteConversation)

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find((c) => c.id === activeConversationId)
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)
  const busy = isLoading || isStreaming

  // Filter conversations by search term (title or message content)
  const filtered = sorted.filter((conv) => {
    if (!searchTerm.trim()) return true
    const lower = searchTerm.toLowerCase()
    if (conv.title.toLowerCase().includes(lower)) return true
    return conv.messages.some((m) => m.content.toLowerCase().includes(lower))
  })

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  if (conversations.length === 0) return null

  return (
    <div ref={menuRef} className="relative px-4 md:px-12 py-1.5 border-b border-border/50 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(!isOpen)
            if (isOpen) setSearchTerm('')
          }}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground h-auto min-h-0 py-1 px-2 max-w-[240px]"
          aria-expanded={isOpen}
          aria-label="Switch conversation"
        >
          <MessageSquare size={12} className="shrink-0" />
          <span className="truncate">{activeConv?.title ?? 'No conversation'}</span>
          <ChevronDown
            size={11}
            className={clsx('shrink-0 transition-transform', isOpen && 'rotate-180')}
          />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            createConversation()
            setIsOpen(false)
            setSearchTerm('')
          }}
          disabled={busy}
          className="p-1 h-auto min-h-0 text-muted-foreground hover:text-primary"
          aria-label="New conversation"
          title="New chat"
        >
          <Plus size={14} />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute left-4 right-4 md:left-12 md:right-12 top-full z-50 mt-1">
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-[280px] overflow-y-auto"
              role="listbox"
              aria-label="Conversations"
            >
              {/* Search input — shown when 3+ conversations */}
              {conversations.length > 2 && (
                <div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full text-xs px-2 py-1.5 bg-muted/30 border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const first = menuRef.current?.querySelector(
                          '[role="option"]'
                        ) as HTMLElement
                        first?.focus()
                      } else if (e.key === 'Escape') {
                        setIsOpen(false)
                        setSearchTerm('')
                      }
                    }}
                  />
                </div>
              )}

              {filtered.map((conv) => (
                <div
                  key={conv.id}
                  role="option"
                  tabIndex={0}
                  aria-selected={conv.id === activeConversationId}
                  className={clsx(
                    'group flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors',
                    conv.id === activeConversationId
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                  onClick={() => {
                    switchConversation(conv.id)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      switchConversation(conv.id)
                      setIsOpen(false)
                      setSearchTerm('')
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      const next = e.currentTarget.nextElementSibling as HTMLElement
                      next?.focus()
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      const prev = e.currentTarget.previousElementSibling as HTMLElement
                      if (prev?.getAttribute('role') === 'option') {
                        prev.focus()
                      } else {
                        // Focus search input if at top
                        const input = menuRef.current?.querySelector('input')
                        input?.focus()
                      }
                    } else if (e.key === 'Escape') {
                      setIsOpen(false)
                      setSearchTerm('')
                    }
                  }}
                >
                  <MessageSquare size={12} className="shrink-0" />
                  <span className="truncate flex-1 text-xs">{conv.title}</span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 hidden sm:inline">
                    {conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}
                  </span>
                  {/* Export button */}
                  {conv.messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        const md = conversationToMarkdown(conv)
                        downloadMarkdown(md, `${conv.title.replace(/[^a-z0-9]/gi, '-')}.md`)
                      }}
                      className="p-0.5 [@media(pointer:coarse)]:p-1.5 h-auto min-h-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                      aria-label={`Export conversation: ${conv.title}`}
                    >
                      <Download size={11} />
                    </Button>
                  )}
                  {/* Delete button */}
                  {conversations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                        if (sorted.length <= 1) {
                          setIsOpen(false)
                          setSearchTerm('')
                        }
                      }}
                      className="p-0.5 [@media(pointer:coarse)]:p-1.5 h-auto min-h-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 text-muted-foreground hover:text-status-error transition-opacity"
                      aria-label={`Delete conversation: ${conv.title}`}
                    >
                      <Trash2 size={11} />
                    </Button>
                  )}
                </div>
              ))}

              {filtered.length === 0 && searchTerm.trim() && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No conversations match &quot;{searchTerm}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
