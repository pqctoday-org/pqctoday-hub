// SPDX-License-Identifier: GPL-3.0-only
/**
 * The executive's way into the control plane — B+ remediation 4.5 (2026-08-10).
 *
 * What was here before: an `ExecutiveRedirectBanner` telling an executive that
 * this page is "a hands-on engineering workbench" and offering three links to
 * somewhere else. The clearest demonstration of crypto agility on the site
 * responded to its most important audience by pointing at the door.
 *
 * What is here now: the same three-step story, told in the words of
 * `agilityNarration.ts` — which the sandbox's agility console reads too, so
 * both consoles tell one story rather than two — with the cost of each step
 * stated in figures derived from the same registries the engineering pages use.
 *
 * The panel narrates; it does not fake. Each step names the real control the
 * reader operates, and the console below is the real engine. Nothing here
 * simulates a result: an executive who follows the three steps has watched an
 * actual KMIP policy refuse an actual request.
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, Route as RouteIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AGILITY_STEPS,
  AGILITY_STORY_TITLE,
  AGILITY_STORY_PROMISE,
  AGILITY_STORY_CLOSE,
} from '@/data/agilityNarration'

export function AgilityStoryPanel({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(true)

  return (
    <section
      className={`rounded-xl border border-primary/25 bg-primary/5 p-4 ${className}`}
      aria-labelledby="agility-story-title"
    >
      <div className="flex flex-wrap items-start gap-3">
        <RouteIcon size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="agility-story-title" className="text-base font-bold text-foreground">
            {AGILITY_STORY_TITLE}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {AGILITY_STORY_PROMISE}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
        >
          {open ? 'Hide' : 'Show'}
          <ChevronDown
            size={12}
            aria-hidden="true"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {open && (
        <>
          <ol className="mt-4 space-y-3">
            {AGILITY_STEPS.map((step) => (
              <li key={step.n} className="rounded-lg border border-border bg-card/60 p-3">
                <p className="text-sm font-semibold text-foreground">
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                    {step.n}
                  </span>
                  {step.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{step.cost}</p>
                <p className="mt-1.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                  In the console below: {step.action}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{AGILITY_STORY_CLOSE}</p>

          {/* The links the old redirect banner offered are kept — as an exit
              AFTER the story, not as an alternative to reading it. */}
          <p className="mt-3 text-xs text-muted-foreground">
            Then take it further:{' '}
            <Link to="/business" className="text-primary hover:underline">
              Command Center
            </Link>{' '}
            ·{' '}
            <Link to="/compliance" className="text-primary hover:underline">
              Compliance landscape
            </Link>{' '}
            ·{' '}
            <Link to="/migrate" className="text-primary hover:underline">
              Migration catalog
            </Link>
          </p>
        </>
      )}
    </section>
  )
}
