// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  START_BRANCHES,
  crosswalkRows,
  phaseHeading,
  routingSourceNote,
  type StartBranch,
} from '@/components/PKILearning/guidedRouting'

/**
 * "Where do I start?" on a phone: the same six statements, first stops and framework crosswalk
 * the desktop disclosure offers, read from the one shared file (guidedRouting.ts) so the two
 * cannot drift. Choose the statement that fits, read why and which phase it enters, then start
 * at the module or page it names.
 *
 * Focus follows the reader: choosing a statement moves focus to the answer's heading, and
 * "Back to all paths" returns it to the statement just chosen.
 */
export function MobileGuidedRoutingView() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<StartBranch | null>(null)
  const answerHeading = useRef<HTMLHeadingElement>(null)
  const choiceButtons = useRef(new Map<string, HTMLButtonElement>())
  const lastChosen = useRef<string | null>(null)

  useEffect(() => {
    if (selected) {
      answerHeading.current?.focus()
    } else if (lastChosen.current) {
      choiceButtons.current.get(lastChosen.current)?.focus()
    }
  }, [selected])

  if (selected) {
    const rows = crosswalkRows(selected.phase)
    return (
      <div className="flex flex-col gap-3" data-testid="mobile-guided-answer">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSelected(null)}
          className="h-11 w-fit gap-1.5 px-2 text-[12.5px] font-semibold text-muted-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to all paths
        </Button>

        <div className="flex flex-col gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3.5">
          <h2
            ref={answerHeading}
            tabIndex={-1}
            className="text-[14px] font-bold leading-snug text-foreground focus:outline-none"
          >
            {selected.question}
          </h2>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {selected.rationale}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {phaseHeading(selected.phase)}
          </p>
          <Button
            type="button"
            onClick={() => navigate(selected.to)}
            className="min-h-12 w-full justify-center gap-1.5 whitespace-normal rounded-[10px] bg-primary px-4 text-[13px] font-bold text-primary-foreground"
          >
            {selected.cta}
            <ArrowRight size={15} aria-hidden="true" />
          </Button>
        </div>

        {rows.length > 0 && (
          <details className="group rounded-xl border border-border bg-muted/40">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
              <MapIcon size={14} className="shrink-0 text-primary" aria-hidden="true" />
              This phase in other frameworks
              <ArrowRight
                size={14}
                className="ml-auto shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                aria-hidden="true"
              />
            </summary>
            <dl className="flex flex-col gap-2.5 px-3.5 pb-3.5">
              {rows.map((row) => (
                <div key={row.key}>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 break-words text-[12.5px] leading-relaxed text-foreground/85">
                    {row.text}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">{routingSourceNote()}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3" data-testid="mobile-guided-choices">
      <div>
        <h2 className="text-[14px] font-bold text-foreground">Where do I start?</h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          Pick the statement that best describes your program today.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {START_BRANCHES.map((b) => (
          <li key={b.id}>
            <Button
              type="button"
              variant="ghost"
              ref={(el) => {
                if (el) choiceButtons.current.set(b.id, el)
                else choiceButtons.current.delete(b.id)
              }}
              onClick={() => {
                lastChosen.current = b.id
                setSelected(b)
              }}
              className="min-h-14 w-full justify-between gap-2 whitespace-normal rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-[13px] font-medium leading-snug text-foreground hover:border-primary/40"
            >
              <span className="min-w-0 flex-1">{b.question}</span>
              <ArrowRight size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{routingSourceNote()}</p>
    </div>
  )
}
