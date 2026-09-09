// SPDX-License-Identifier: GPL-3.0-only
import type { ReactNode } from 'react'
import { useNavigate, Link } from 'react-router'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  PERSONA_JOURNEY_BOARD_VARIANTS,
  resolveRoleBoardVariant,
  type PersonaJourneyBoard,
} from '@/data/personaConfig'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { usePersonaStore } from '@/store/usePersonaStore'
import { REGION_LABELS } from '@/data/regionIndustryOptions'
import { logRoleBoardVariantSelected, logRoleBoardCtaClick } from '@/utils/analytics'

/**
 * PersonaBoardView — shared, persona-agnostic board skeleton for the
 * persona-journeys A-grade redesign (IMPLEMENTATION-PLAN-2026-08-01.md §3.3).
 *
 * Renders ANY persona's board purely from `PERSONA_JOURNEY_BOARD_VARIANTS[personaId]`
 * — the option chips, hero, side card, 3-card grid and track strip. The only persona-specific
 * branching in this file is (a) the `customSideCard` override slot, which
 * only ever applies to `researcher`, and (b) the capstone chip being
 * genuinely optional (absent for researcher, present for the other five) —
 * both are explicitly called out in the design plan, not ad hoc branching.
 * Every other pixel of copy comes from the config object.
 *
 * ctaPrimary/ctaSecondary navigate to `board.ctaPrimaryHref`/`ctaSecondaryHref`
 * (2026-08-01 fix: these rendered as inert `<Button>`s with no click behavior
 * at all — "none of the buttons on the page does anything").
 */
export interface PersonaBoardViewProps {
  personaId: PersonaId
  /**
   * Researcher-only override slot for the side card. When `personaId` is
   * `'researcher'` and this is supplied, it fully replaces the data-driven
   * side card. This is how the researcher field-watch feature
   * (`ResearcherFieldWatchCard`) plugs in, without this component needing to
   * know anything about its internals.
   */
  customSideCard?: ReactNode
  /**
   * Which of the role's three board options to render. Defaults to the
   * order-1 variant — the board the role opens on — when omitted or unknown.
   * An unrecognised id falling back rather than throwing is deliberate: the
   * value can come from a persisted store or a `?variant=` URL, neither of
   * which is trustworthy after a variant is renamed or retired.
   */
  variantId?: string
  /** Called when the visitor picks a different option from the chip row. */
  onSelectVariant?: (variantId: string) => void
}

type SideCardTone = PersonaJourneyBoard['sideCard']['tone']
type SideCardProvenance = PersonaJourneyBoard['sideCard']['provenance']

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

/**
 * What a side card's numbers ARE, said in the card's own chip.
 *
 * Two values used to cover three meanings. `illustrative` rendered as
 * "ILLUSTRATIVE — THIS USER'S INPUTS", which is true of a card standing in for
 * an answer you have not given yet (your exposure window, your score) and
 * false of a card stating a general rule — "Hybrid vs pure: a policy call, not
 * a maths one" is not this user's input and never becomes it. Sixteen of
 * thirty-six boards carried that label over content it did not describe.
 *
 * `guidance` is the third meaning: a rule of thumb this site is asserting, not
 * data it read and not a placeholder for yours. Labelling it honestly is the
 * whole point — a page that grades its own claims cannot mis-grade them.
 */
export const PROVENANCE_LABEL: Record<SideCardProvenance, string> = {
  sourced: 'SOURCED — REPO DATA',
  illustrative: "ILLUSTRATIVE — THIS USER'S INPUTS",
  guidance: 'GUIDANCE — OUR RULE OF THUMB',
}

/**
 * workshopId -> display name, for the "Related on this site" row below.
 *
 * Added 2026-09-03 (home-scenarios remediation, WS7.1). Every
 * `RoleBoardVariant.workshopIds` entry was compiled into the generated file
 * and read by nothing — several boards' own proof chips named a workshop
 * that lived only in this unrendered metadata (e.g. "Real SSH handshake"
 * with no link to the SSH workshop anywhere on the board). This map is what
 * makes those ids renderable as real links instead of dead metadata.
 */
export const WORKSHOP_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  WORKSHOP_TOOLS.map((w) => [w.id, w.name])
)

const PROVENANCE_CLASS: Record<SideCardProvenance, string> = {
  sourced: 'border-accent/30 bg-accent/10 text-accent-legible',
  illustrative: 'border-border bg-muted/40 text-muted-foreground',
  // Distinct from illustrative: this is us talking, not your data pending.
  guidance: 'border-primary/25 bg-primary/5 text-primary/90',
}

function ProvenanceChip({ provenance, label }: { provenance: SideCardProvenance; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        PROVENANCE_CLASS[provenance]
      )}
    >
      {label}
    </span>
  )
}

export function PersonaBoardView({
  personaId,
  customSideCard,
  variantId,
  onSelectVariant,
}: PersonaBoardViewProps) {
  const navigate = useNavigate()
  // eslint-disable-next-line security/detect-object-injection -- personaId is the typed PersonaId union, not user input
  const variants = PERSONA_JOURNEY_BOARD_VARIANTS[personaId]
  const active = resolveRoleBoardVariant(personaId, variantId)
  const board = active.board
  const useCustomSideCard = personaId === 'researcher' && customSideCard !== undefined

  // Live region/industry badge (2026-09-03, home-scenarios remediation
  // WS7.2). `board.heroBadge.text` used to be static per-board copy —
  // e.g. every executive board read "Americas · Finance & Banking"
  // regardless of what the visitor actually selected, while
  // MobileHomeBoard.tsx already computed and rendered the real
  // selectedRegion/selectedIndustries (see that file's own note on why
  // desktop and mobile disagreed). This mirrors that computation so both
  // shells show the same thing. Tone is always 'illustrative' now — the
  // badge is the visitor's own stored input, not a repo-sourced fact, which
  // is exactly what that provenance label means ("THIS USER'S INPUTS").
  const { selectedRegion, selectedIndustries } = usePersonaStore()
  const regionLabel = selectedRegion ? REGION_LABELS[selectedRegion] : null
  const industryLabel = selectedIndustries.length > 0 ? selectedIndustries.join(', ') : null
  const liveBadgeText = [regionLabel, industryLabel].filter(Boolean).join(' · ')

  return (
    <div className="w-full">
      {/* Board option switcher — the role's top three use cases in a PQC
          migration. Rendered as a real radio group rather than styled buttons
          so the relationship (one of three, one selected) is announced, not
          just implied by colour. */}
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Choose what you want to do"
        data-testid="board-variant-chips"
      >
        {variants.map((v) => {
          const selected = v.id === active.id
          return (
            <Button
              key={v.id}
              type="button"
              variant="ghost"
              size="sm"
              role="radio"
              aria-checked={selected}
              title={v.chipDescription}
              data-testid={`board-variant-chip-${v.id}`}
              onClick={() => {
                logRoleBoardVariantSelected(personaId, v.id)
                onSelectVariant?.(v.id)
              }}
              className={cn(
                'h-auto rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                selected
                  ? 'border-primary/50 bg-primary/10 text-primary-legible'
                  : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {v.chipLabel}
            </Button>
          )
        })}
      </div>

      {/* Hero + side card row */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Hero */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {board.heroEyebrow}
          </p>

          {liveBadgeText && (
            <div className="mt-2">
              <ProvenanceChip provenance="illustrative" label={liveBadgeText} />
            </div>
          )}

          <h1 className="text-gradient mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            {board.headline}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {board.sub}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="gradient"
              onClick={() => {
                logRoleBoardCtaClick(personaId, active.id, 'cta_primary_href', board.ctaPrimaryHref)
                navigate(board.ctaPrimaryHref)
              }}
            >
              {board.ctaPrimary}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                logRoleBoardCtaClick(
                  personaId,
                  active.id,
                  'cta_secondary_href',
                  board.ctaSecondaryHref
                )
                navigate(board.ctaSecondaryHref)
              }}
            >
              {board.ctaSecondary}
            </Button>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Proof points">
            {board.proofChips.map((chip, i) => (
              <li
                key={chip}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
                  i === 0
                    ? 'border-accent/30 bg-accent/10 text-accent-legible'
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
                label={PROVENANCE_LABEL[board.sideCard.provenance]}
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
            const body = (
              <>
                <h3 className="text-sm font-bold text-foreground">{card.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.body}</p>
              </>
            )
            const className = cn(
              'glass-panel flex flex-col gap-2 p-4',
              highlighted && 'border-accent/50 bg-accent/5',
              // Only linked cards get affordances — an unlinked card must stay
              // visually identical to how every card rendered before hrefs existed.
              card.href && 'transition-colors hover:border-primary/40 hover:bg-primary/5'
            )
            // A card with no href stays a plain <div>: same markup as before,
            // so no card ever looks clickable without being clickable.
            return card.href ? (
              <Link
                key={card.title}
                to={card.href}
                data-testid={`grid-card-${i}`}
                data-highlighted={highlighted}
                className={className}
                onClick={() =>
                  logRoleBoardCtaClick(personaId, active.id, `grid_card_href:${i}`, card.href!)
                }
              >
                {body}
              </Link>
            ) : (
              <div
                key={card.title}
                data-testid={`grid-card-${i}`}
                data-highlighted={highlighted}
                className={className}
              >
                {body}
              </div>
            )
          })}
        </div>
      </div>

      {/* Related workshops — see WORKSHOP_NAME_BY_ID's own comment for why
          this exists: a board's proof chips can name a workshop that lives
          only in `active.workshopIds`' unrendered metadata unless this row
          gives it an actual link. Hidden entirely when a board names none. */}
      {active.workshopIds.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Related on this site
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Related workshops">
            {active.workshopIds.map((id) => {
              // eslint-disable-next-line security/detect-object-injection -- id comes from active.workshopIds, CSV-derived repo data, not user input
              const name = WORKSHOP_NAME_BY_ID[id]
              if (!name) return null
              return (
                <li key={id}>
                  <Link
                    to={`/playground/${id}`}
                    className="inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Track strip */}
      <div className="mt-8 border-t border-border pt-6">
        <h2 className="text-base font-bold text-foreground">{board.trackTitle}</h2>
        {board.trackNote && <p className="mt-1 text-xs text-muted-foreground">{board.trackNote}</p>}

        <ul className="mt-3 flex flex-wrap gap-2">
          {board.trackChips.map((chip, i) => {
            // trackChips are persona-appropriate labels, not module titles (see
            // personaConfig.test.ts's drift guard) - but they're positionally
            // 1:1 with the persona's real essentials module ids, so each chip
            // can still link to its real /learn/:moduleId (2026-08-01 fix:
            // these were plain <li>s with no link at all).
            // eslint-disable-next-line security/detect-object-injection -- personaId is the typed PersonaId union, i is a small array index, neither is user input
            const moduleId = PERSONAS[personaId].essentials[i]
            return (
              <li key={chip}>
                <Link
                  to={`/learn/${moduleId}`}
                  className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  {chip}
                </Link>
              </li>
            )
          })}

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
