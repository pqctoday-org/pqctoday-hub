// SPDX-License-Identifier: GPL-3.0-only
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PERSONA_JOURNEY_BOARD, type PersonaJourneyBoard } from '@/data/personaConfig'
import type { PersonaId } from '@/data/learningPersonas'

/**
 * PersonaBoardView — shared, persona-agnostic board skeleton for the
 * persona-journeys A-grade redesign (IMPLEMENTATION-PLAN-2026-08-01.md §3.3).
 *
 * Renders ANY persona's board purely from `PERSONA_JOURNEY_BOARD[personaId]`
 * — hero, side card, 3-card grid and track strip. The only persona-specific
 * branching in this file is (a) the `customSideCard` override slot, which
 * only ever applies to `researcher`, and (b) the capstone chip being
 * genuinely optional (absent for researcher, present for the other five) —
 * both are explicitly called out in the design plan, not ad hoc branching.
 * Every other pixel of copy comes from the config object.
 *
 * Not wired into routing yet — that is a later integration phase.
 */
export interface PersonaBoardViewProps {
  personaId: PersonaId
  /**
   * Researcher-only override slot for the side card. When `personaId` is
   * `'researcher'` and this is supplied, it fully replaces the data-driven
   * side card (title/rows/punchline/footnote sourced from
   * `PERSONA_JOURNEY_BOARD.researcher.sideCard`, which is a deliberate stub
   * — see the NOTE above that config entry). This is how the separate
   * researcher field-watch feature (`ResearcherFieldWatchCard`, per
   * IMPLEMENTATION-PLAN-2026-08-01.md §6) plugs in later, without this
   * component needing to know anything about its internals.
   */
  customSideCard?: ReactNode
}

type SideCardTone = PersonaJourneyBoard['sideCard']['tone']

/** bad -> critical, warn -> warning, info -> primary (NOT text-status-info —
 *  see IMPLEMENTATION-PLAN-2026-08-01.md §5 on the info/cyan vs --info hue
 *  distinction), accent -> accent. */
const TONE_BORDER_BG: Record<SideCardTone, string> = {
  bad: 'border-critical/40 bg-critical/5',
  warn: 'border-warning/40 bg-warning/5',
  info: 'border-primary/40 bg-primary/5',
  accent: 'border-accent/40 bg-accent/5',
}

const TONE_TEXT: Record<SideCardTone, string> = {
  bad: 'text-critical',
  warn: 'text-warning',
  info: 'text-primary',
  accent: 'text-accent',
}

function ProvenanceChip({
  provenance,
  label,
}: {
  provenance: 'sourced' | 'illustrative'
  label: string
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        provenance === 'sourced'
          ? 'border-accent/30 bg-accent/10 text-accent'
          : 'border-border bg-muted/40 text-muted-foreground'
      )}
    >
      {label}
    </span>
  )
}

export function PersonaBoardView({ personaId, customSideCard }: PersonaBoardViewProps) {
  // eslint-disable-next-line security/detect-object-injection -- personaId is the typed PersonaId union, not user input
  const board = PERSONA_JOURNEY_BOARD[personaId]
  const useCustomSideCard = personaId === 'researcher' && customSideCard !== undefined

  return (
    <div className="w-full">
      {/* Hero + side card row */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Hero */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {board.heroEyebrow}
          </p>

          {board.heroBadge && (
            <div className="mt-2">
              <ProvenanceChip provenance={board.heroBadge.tone} label={board.heroBadge.text} />
            </div>
          )}

          <h1 className="text-gradient mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            {board.headline}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {board.sub}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="gradient">{board.ctaPrimary}</Button>
            <Button variant="outline">{board.ctaSecondary}</Button>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Proof points">
            {board.proofChips.map((chip, i) => (
              <li
                key={chip}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
                  i === 0
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-border bg-muted/30 text-muted-foreground'
                )}
              >
                {i === 0 && <Check size={12} aria-hidden="true" />}
                {chip}
              </li>
            ))}
          </ul>
        </div>

        {/* Side card — 340px-ish, tone-tinted */}
        <div className="w-full shrink-0 lg:w-[340px]" data-testid="side-card">
          {useCustomSideCard ? (
            customSideCard
          ) : (
            <div
              className={cn(
                'glass-panel flex h-full flex-col gap-3 p-5',
                TONE_BORDER_BG[board.sideCard.tone]
              )}
              data-testid="default-side-card"
            >
              <ProvenanceChip
                provenance={board.sideCard.provenance}
                label={
                  board.sideCard.provenance === 'sourced'
                    ? 'SOURCED — REPO DATA'
                    : "ILLUSTRATIVE — THIS USER'S INPUTS"
                }
              />

              <h2 className={cn('text-lg font-bold', TONE_TEXT[board.sideCard.tone])}>
                {board.sideCard.title}
              </h2>

              <dl className="flex flex-col gap-2">
                {board.sideCard.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-semibold text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-1 text-base font-bold text-foreground">{board.sideCard.punchline}</p>

              {board.sideCard.footnote && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {board.sideCard.footnote}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <hr className="my-8 border-border" />

      {/* 3-card grid */}
      <div>
        <h2 className="text-lg font-bold text-foreground">{board.gridTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{board.gridSub}</p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {board.gridCards.map((card, i) => {
            const highlighted = i === 2
            return (
              <div
                key={card.title}
                data-testid={`grid-card-${i}`}
                data-highlighted={highlighted}
                className={cn(
                  'glass-panel flex flex-col gap-2 p-4',
                  highlighted && 'border-accent/50 bg-accent/5'
                )}
              >
                <h3 className="text-sm font-bold text-foreground">{card.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.body}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Track strip */}
      <div className="mt-8 border-t border-border pt-6">
        <h2 className="text-base font-bold text-foreground">{board.trackTitle}</h2>
        {board.trackNote && <p className="mt-1 text-xs text-muted-foreground">{board.trackNote}</p>}

        <ul className="mt-3 flex flex-wrap gap-2">
          {board.trackChips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground"
            >
              {chip}
            </li>
          ))}

          {/* Absent for researcher only — no capstone at all, not an empty chip. */}
          {board.capstoneChip && (
            <li
              data-testid="capstone-chip"
              className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
            >
              {board.capstoneChip.label}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
