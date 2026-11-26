// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logEvent, personaLabel } from '@/utils/analytics'

export interface TopThreeAction {
  id: string
  label: string
  description?: string
  /** Optional lucide-react icon node (caller controls sizing). */
  icon?: React.ReactNode
  /** External or internal route. When set, renders an internal <Link>. */
  href?: string
  /** Imperative handler (used when href is not provided). */
  onClick?: () => void
}

interface Props {
  /** 1–3 actions; anything past index 2 is silently dropped. */
  actions: readonly TopThreeAction[]
  /** Used in analytics + ARIA labelling — e.g. "business-center", "report". */
  source: string
  /** Optional heading for the group; defaults to "Do this now". */
  heading?: string
  headingLevel?: 2 | 3
  /** Extra wrapper classes for layout. */
  className?: string
}

/**
 * Caps action surfacing to 3 glass-panel cards so dense pages (Business Center,
 * Report) can offer a "do this now" hero without inheriting the rest of the
 * page's visual density. Emits Top Three Actions · Action Clicked with the
 * card position + source + persona dimension on click.
 */
export const TopThreeActions: React.FC<Props> = ({
  actions,
  source,
  heading = 'Do this now',
  headingLevel = 3,
  className,
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const capped = actions.slice(0, 3)
  if (capped.length === 0) return null

  return (
    <section
      aria-label={heading}
      className={`mb-6 ${className ?? ''}`.trim()}
      data-testid="top-three-actions"
    >
      <Heading className="uppercase mb-3 text-[11px] font-extrabold tracking-[0.14em] text-heading">
        {heading}
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {capped.map((action, idx) => {
          const handleClick = () => {
            logEvent(
              'Top Three Actions',
              'Action Clicked',
              personaLabel(`${source}:${idx + 1}:${action.id}`)
            )
            action.onClick?.()
          }

          const cardClass =
            'glass-panel p-4 hover:border-primary/40 transition-colors flex items-start gap-3 group h-full text-left w-full'

          const body = (
            <>
              {action.icon && (
                <span className="shrink-0 text-primary mt-0.5" aria-hidden="true">
                  {action.icon}
                </span>
              )}
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                    aria-hidden="true"
                  />
                </span>
                {action.description && (
                  <span className="block text-xs text-muted-foreground mt-1 leading-snug">
                    {action.description}
                  </span>
                )}
              </span>
            </>
          )

          if (action.href) {
            return (
              <Link
                key={action.id}
                to={action.href}
                onClick={handleClick}
                className={cardClass}
                aria-label={`${idx + 1}. ${action.label}`}
              >
                {body}
              </Link>
            )
          }

          return (
            <Button
              key={action.id}
              variant="ghost"
              onClick={handleClick}
              className={cardClass}
              aria-label={`${idx + 1}. ${action.label}`}
            >
              {body}
            </Button>
          )
        })}
      </div>
    </section>
  )
}
