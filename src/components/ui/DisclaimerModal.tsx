// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'
import { Construction, ExternalLink, MessageSquare, Linkedin, X } from 'lucide-react'
import { Button } from './button'
import { useDisclaimerStore } from '../../store/useDisclaimerStore'

/**
 * Non-blocking disclaimer banner pinned to bottom of viewport.
 * Does NOT use createPortal or full-screen overlays — the page remains
 * fully interactive so users are never locked out.
 */
export function DisclaimerModal() {
  const { hasAcknowledgedCurrentMajor, acknowledgeDisclaimer } = useDisclaimerStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [forceClosed, setForceClosed] = useState(false)
  const isOpen = !hasAcknowledgedCurrentMajor() && !forceClosed

  const handleDismiss = useCallback(() => {
    acknowledgeDisclaimer()
    setForceClosed(true)
  }, [acknowledgeDisclaimer])

  // Auto-focus the button when banner appears
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => buttonRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Escape key to dismiss
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, handleDismiss])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-disclaimer p-4 print:hidden safe-bottom"
      role="alert"
      aria-labelledby="disclaimer-title"
    >
      <div className="glass-panel bg-card max-w-2xl mx-auto max-h-[70dvh] flex flex-col overflow-hidden shadow-2xl border-primary/30">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 shrink-0 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Construction size={18} className="text-primary" />
            </div>
            <h2 id="disclaimer-title" className="text-base font-bold text-foreground">
              Welcome to PQC Today
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Close disclaimer"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            PQC Today is a{' '}
            <span className="font-medium text-foreground">
              community-driven educational platform
            </span>
            . Content is sourced from publicly available resources and{' '}
            <span className="font-medium text-foreground">may contain inaccuracies</span>. This site
            has not received endorsement from organizations referenced in its content. Leaders are
            included only with <span className="font-medium text-foreground">written consent</span>.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/pqctoday/pqc-timeline-app/discussions/108"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <MessageSquare size={12} />
              GitHub Discussions
              <ExternalLink size={10} />
            </a>
            <a
              href="https://www.linkedin.com/in/eric-amador-971850a"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Linkedin size={12} />
              Eric Amador
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-3 shrink-0 border-t border-border/50">
          <Button ref={buttonRef} variant="gradient" className="w-full" onClick={handleDismiss}>
            I Understand
          </Button>
        </div>
      </div>
    </div>
  )
}
