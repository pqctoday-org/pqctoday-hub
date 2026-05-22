// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { LearningFrameBanner } from './LearningFrameBanner'
import { GlossaryStrip } from './GlossaryStrip'
import { ContentUpdatesFeed } from '@/components/ui/ContentUpdatesFeed'

const EXPANDED_KEY = 'compliance-about-expanded-v1'
const INTRO_DISMISSED_KEY = 'compliance-intro-dismissed-v1'

function readInitialOpen(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = window.localStorage.getItem(EXPANDED_KEY)
    if (stored === '1') return true
    if (stored === '0') return false
    // Heuristic for "first visit": neither flag has been touched.
    return window.localStorage.getItem(INTRO_DISMISSED_KEY) === null
  } catch {
    return false
  }
}

interface AboutThisPageStripProps {
  /**
   * Optional content rendered inside the summary row, right-aligned. Used on
   * mobile to host secondary filters (e.g. TrustTierFilter) that live inline
   * in the tab bar on desktop. The slot stops click propagation so toggling
   * the filter does not toggle the details.
   */
  headerSlot?: React.ReactNode
}

/**
 * Collapsible "About this page" strip wrapping LearningFrameBanner,
 * GlossaryStrip, and ContentUpdatesFeed in a single <details>. Counts as one
 * row regardless of open/closed state. Persists open/closed in localStorage.
 *
 * On a true first visit (neither `compliance-intro-dismissed-v1` nor
 * `compliance-about-expanded-v1` set) the strip starts expanded. After the
 * user has interacted with anything that writes the intro flag, the default
 * flips to collapsed.
 */
export function AboutThisPageStrip({ headerSlot }: AboutThisPageStripProps = {}) {
  const [open, setOpen] = useState<boolean>(readInitialOpen)
  const detailsRef = useRef<HTMLDetailsElement | null>(null)

  // Mirror the controlled state onto the underlying <details> so native
  // toggling stays in sync with React.
  useEffect(() => {
    const el = detailsRef.current
    if (el && el.open !== open) {
      el.open = open
    }
  }, [open])

  const handleToggle = useCallback((next: boolean) => {
    setOpen(next)
    try {
      window.localStorage.setItem(EXPANDED_KEY, next ? '1' : '0')
    } catch {
      /* private browsing / quota — state just won't persist this session */
    }
  }, [])

  return (
    <details
      ref={detailsRef}
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open
        if (next !== open) handleToggle(next)
      }}
      className="rounded-lg border border-border bg-card"
      data-testid="compliance-about-strip"
    >
      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer list-none select-none text-sm font-medium text-foreground hover:bg-muted/40 rounded-lg [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`}
          aria-hidden="true"
        />
        <span className="flex-1">About this page</span>
        <span className="text-xs text-muted-foreground font-normal hidden sm:inline">
          Learning frame, glossary, recent revisions
        </span>
        {headerSlot && (
          <span
            className="ml-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {headerSlot}
          </span>
        )}
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-4">
        <LearningFrameBanner />
        <GlossaryStrip />
        <ContentUpdatesFeed domain="compliance" limit={5} title="Recent Compliance Revisions" />
      </div>
    </details>
  )
}
