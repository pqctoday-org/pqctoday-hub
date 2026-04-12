// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { Button } from '../ui/button'
import { X, ShieldX, ExternalLink, MessageSquare, Linkedin } from 'lucide-react'

interface LeaderRemovalModalProps {
  isOpen: boolean
  onClose: () => void
}

const REMOVAL_TEMPLATE = `**Name:** [Your full name or the name listed on the page]
**Organization:** [If applicable]
**Reason:** [Optional — no questions asked]`

const DISCUSSION_NEW_URL = (() => {
  const base = 'https://github.com/pqctoday/pqc-timeline-app/discussions/new'
  const params = new URLSearchParams({
    category: 'i-consent-to-be-added-as-a-pqc-leader',
    title: 'Request removal as a PQC Leader',
    body: REMOVAL_TEMPLATE,
  })
  return `${base}?${params.toString()}`
})()

export function LeaderRemovalModal({ isOpen, onClose }: LeaderRemovalModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50 print:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4 print:hidden pointer-events-none">
        <div
          className="glass-panel bg-card max-w-lg w-full max-h-[85dvh] flex flex-col overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leader-removal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-error/20">
                <ShieldX size={20} className="text-status-error" />
              </div>
              <h2 id="leader-removal-title" className="text-lg font-bold text-foreground">
                Request Removal
              </h2>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-2 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you or your organization is listed on this page and you{' '}
              <span className="font-medium text-foreground">do not wish to be referenced</span>, we
              will remove your entry{' '}
              <span className="font-medium text-foreground">immediately</span> upon request.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We respect your right to control how your name and work are represented. No questions
              asked &mdash; simply reach out through either channel below and your listing will be
              taken down promptly.
            </p>

            <div className="space-y-2">
              <a
                href={DISCUSSION_NEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
              >
                <MessageSquare size={18} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    GitHub Discussions &mdash; Leaders
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Post a removal request in the Leaders category
                  </p>
                </div>
                <ExternalLink
                  size={14}
                  className="text-muted-foreground shrink-0 group-hover:text-primary"
                />
              </a>
              <a
                href="https://www.linkedin.com/in/eric-amador-971850a"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
              >
                <Linkedin size={18} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    LinkedIn &mdash; Eric Amador
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Send a private message for confidential requests
                  </p>
                </div>
                <ExternalLink
                  size={14}
                  className="text-muted-foreground shrink-0 group-hover:text-primary"
                />
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 shrink-0 border-t border-border/50">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
