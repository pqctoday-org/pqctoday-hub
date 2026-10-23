// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'
import { Construction, ExternalLink, Mail, MessageSquare, X } from 'lucide-react'
import { Button } from './button'
import { useDisclaimerStore } from '../../store/useDisclaimerStore'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'

/**
 * Non-blocking disclaimer banner pinned to bottom of viewport.
 * Does NOT use createPortal or full-screen overlays — the page remains
 * fully interactive so users are never locked out.
 *
 * `placement="inline"` renders the same banner in normal document flow
 * instead — used on the phone's first-run role picker, where a fixed banner
 * covered the role choices (UX-17); there it sits below them.
 *
 * `placement="banner"` is the same notice as one compact strip in flow, used
 * above the role cards on the desktop first-run picker: the fixed card covered
 * the lower rows of cards there, and the full inline card would push the
 * picker below the fold. Same text, same button, shown before the reader
 * chooses anything.
 */
export function DisclaimerModal({
  placement = 'fixed',
}: {
  placement?: 'fixed' | 'inline' | 'banner'
}) {
  const { hasAcknowledgedCurrentMajor, acknowledgeDisclaimer } = useDisclaimerStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [forceClosed, setForceClosed] = useState(false)
  const isOpen = !hasAcknowledgedCurrentMajor() && !forceClosed
  const isEmbedded = useIsEmbedded()

  const handleDismiss = useCallback(() => {
    acknowledgeDisclaimer()
    setForceClosed(true)
  }, [acknowledgeDisclaimer])

  // Auto-focus the button when banner appears — not inline, where it sits
  // below the content the reader should meet first.
  useEffect(() => {
    if (isOpen && placement === 'fixed') {
      const timer = setTimeout(() => buttonRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, placement])

  // Escape key to dismiss
  // Esc via the shared overlay stack: closes only the topmost overlay.
  useOverlayEscape(isOpen, handleDismiss)

  if (!isOpen) return null

  if (placement === 'banner') {
    return (
      <div
        className="mx-auto w-full max-w-5xl px-4 pt-2 print:hidden"
        role="alert"
        aria-labelledby="disclaimer-title"
      >
        <div className="glass-panel bg-card flex flex-col gap-3 border-primary/30 px-4 py-3 md:flex-row md:items-center md:gap-5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h2 id="disclaimer-title" className="flex items-center gap-2 text-sm font-bold">
              <Construction size={16} className="shrink-0 text-primary" aria-hidden="true" />
              Welcome to PQC Today
            </h2>
            <DisclaimerText className="text-xs" />
            <DisclaimerLinks />
          </div>
          <Button
            ref={buttonRef}
            variant="gradient"
            className="shrink-0 md:w-40"
            onClick={handleDismiss}
          >
            I Understand
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        placement === 'inline'
          ? 'px-4 pb-4 print:hidden'
          : `${isEmbedded ? 'absolute' : 'fixed'} inset-x-0 bottom-0 z-disclaimer p-4 print:hidden safe-bottom`
      }
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
          <DisclaimerText className="text-sm" />
          <DisclaimerLinks />
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

/** The notice text, one copy for every placement. */
function DisclaimerText({ className }: { className: string }) {
  return (
    <p className={`${className} text-muted-foreground leading-relaxed`}>
      PQC Today is a{' '}
      <span className="font-medium text-foreground">community-driven educational platform</span>.
      Content is sourced from publicly available resources and{' '}
      <span className="font-medium text-foreground">may contain inaccuracies</span>. This site has
      not received endorsement from organizations referenced in its content. Leaders are included
      only with <span className="font-medium text-foreground">written consent</span>.
    </p>
  )
}

function DisclaimerLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href="https://github.com/pqctoday-org/pqctoday-hub/discussions/108"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-primary-legible hover:underline"
      >
        <MessageSquare size={12} />
        GitHub Discussions
        <ExternalLink size={10} />
      </a>
      <a
        href="mailto:pqctoday@proton.me"
        className="inline-flex items-center gap-1.5 text-xs text-primary-legible hover:underline"
      >
        <Mail size={12} />
        pqctoday@proton.me
      </a>
    </div>
  )
}
