// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useState } from 'react'
import { Construction, ExternalLink, Mail, MessageSquare } from 'lucide-react'
import { Button } from './button'
import { useDisclaimerStore } from '../../store/useDisclaimerStore'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'

/**
 * The first-visit notice: one slim strip in normal document flow, the same on every
 * page and every screen size. It is never fixed over the page and never portalled, so
 * nothing is covered and the page stays fully usable until the reader acknowledges it.
 *
 * The caller decides where the strip sits in flow (above the page content on every page;
 * below the role choices on the phone's first-run picker, UX-17). Same text, same
 * "I Understand" acknowledgement and same storage (`useDisclaimerStore`) everywhere.
 *
 * Layout: on a phone the button sits on the title row so the strip stays short; from
 * `md` up the button sits to the right of the text.
 */
export function DisclaimerModal() {
  const { hasAcknowledgedCurrentMajor, acknowledgeDisclaimer } = useDisclaimerStore()
  const [forceClosed, setForceClosed] = useState(false)
  const isOpen = !hasAcknowledgedCurrentMajor() && !forceClosed

  const handleDismiss = useCallback(() => {
    acknowledgeDisclaimer()
    setForceClosed(true)
  }, [acknowledgeDisclaimer])

  // Esc via the shared overlay stack: closes only the topmost overlay.
  useOverlayEscape(isOpen, handleDismiss)

  if (!isOpen) return null

  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 pb-3 pt-2 print:hidden"
      role="alert"
      aria-labelledby="disclaimer-title"
    >
      <div className="glass-panel bg-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-primary/30 px-4 py-3 md:gap-x-5">
        <h2 id="disclaimer-title" className="flex min-w-0 items-center gap-2 text-sm font-bold">
          <Construction size={16} className="shrink-0 text-primary" aria-hidden="true" />
          Welcome to PQC Today
        </h2>
        <Button
          variant="gradient"
          className="col-start-2 row-start-1 shrink-0 md:row-span-3 md:w-40"
          onClick={handleDismiss}
        >
          I Understand
        </Button>
        <DisclaimerText className="col-span-2 text-xs md:col-span-1" />
        <DisclaimerLinks className="col-span-2 md:col-span-1" />
      </div>
    </div>
  )
}

/** The notice text. */
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

function DisclaimerLinks({ className }: { className: string }) {
  return (
    <div className={`${className} flex flex-wrap items-center gap-x-3 gap-y-1`}>
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
