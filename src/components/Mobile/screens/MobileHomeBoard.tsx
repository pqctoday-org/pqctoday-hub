// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Check } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import { PERSONAS } from '@/data/learningPersonas'
import {
  PERSONA_JOURNEY_BOARD_VARIANTS,
  resolveRoleBoardVariant,
  type PersonaJourneyBoard,
} from '@/data/personaConfig'
import { Button } from '@/components/ui/button'
import { PROVENANCE_LABEL, WORKSHOP_NAME_BY_ID } from '@/components/PersonaJourney/PersonaBoardView'
import { logRoleBoardVariantSelected, logRoleBoardCtaClick } from '@/utils/analytics'
import { usePersonaStore } from '@/store/usePersonaStore'
import { REGION_LABELS } from '@/data/regionIndustryOptions'
import { cn } from '@/lib/utils'
import { MobileWorkshopEntry } from '../shell/MobileWorkshopEntry'

type SideCardTone = PersonaJourneyBoard['sideCard']['tone']

/** Same four tones the desktop board and CuriousMobileBoard both use, mapped
 *  onto the same semantic tokens mobileTokens.ts already uses elsewhere —
 *  presentation only, not a copy of anyone's hand-authored content. */
const TONE_CLASS: Record<SideCardTone, { panel: string; label: string; punchline: string }> = {
  bad: {
    panel: 'border-destructive/40 bg-destructive/5',
    label: 'text-destructive',
    punchline: 'text-destructive',
  },
  warn: {
    panel: 'border-warning/40 bg-warning/5',
    label: 'text-warning',
    punchline: 'text-warning',
  },
  info: {
    panel: 'border-primary/40 bg-primary/5',
    label: 'text-primary',
    punchline: 'text-primary',
  },
  accent: { panel: 'border-accent/40 bg-accent/5', label: 'text-accent', punchline: 'text-accent' },
}

export interface MobileHomeBoardProps {
  persona: PersonaId | null
  variantId?: string
  onSelectVariant?: (variantId: string) => void
  onOpenRoleSwitch: () => void
}

/**
 * The mobile Home screen (handoff "Screen 1 — Home — role scenario board").
 * Reads the SAME PERSONA_JOURNEY_BOARD_VARIANTS + resolveRoleBoardVariant
 * data the desktop PersonaBoardView and useRoleBoardVariantStore-backed
 * variant selection already use, so switching a scenario option on mobile
 * and opening desktop later shows the identical board.
 *
 * Deliberately NOT a responsive variant of PersonaBoardView — same reasoning
 * CuriousMobileBoard's own doc comment already gives: mobile needs a
 * structurally different layout (horizontal-scroll chips instead of wrap,
 * collapsible supporting cards instead of an always-visible grid) that a
 * shared component can't express as CSS breakpoints alone. This supersedes
 * CuriousMobileBoard for ALL six personas, including curious — see
 * LandingView.tsx's isMobileShell branch.
 *
 * Every persona has real, distinct 6-variant board data today (verified via
 * PERSONA_JOURNEY_BOARD_VARIANTS directly), so unlike the design handoff's
 * own prototype note ("for non-Executive roles... in production, load the
 * real set per role"), there is no placeholder path here — this IS that
 * production load, for every role.
 *
 * Deferred, not silently dropped: the researcher "Trace every claim" variant
 * has a live ResearcherFieldWatchCard override on desktop (reports real
 * corpus changes); this screen shows that variant's authored static side
 * card instead. A narrow, documented gap — one of forty-two boards (thirty-six
 * before the 2026-09-07 Executive/GRC split added GRC's own six).
 *
 * Role line region/industry (handoff: "Executive / GRC · EU · Finance &
 * Banking"): reads selectedRegion/selectedIndustries live from
 * usePersonaStore — the same real, persisted fields PersonaSwitchModal
 * writes and Timeline/Compliance/Threats/Algorithms already read elsewhere.
 * Notably NOT what desktop's own PersonaBoardView shows here — its
 * `heroBadge.text` is static per-board copy in roleBoardContent.generated.ts,
 * identical across every persona and never interpolated with the real
 * selection. This is a deliberate improvement on mobile, not a port: real
 * data the user already set, rendered where the handoff's design asked for
 * it, with no desktop file touched.
 */
export function MobileHomeBoard({
  persona,
  variantId,
  onSelectVariant,
  onOpenRoleSwitch,
}: MobileHomeBoardProps) {
  const navigate = useNavigate()
  const [cardsExpanded, setCardsExpanded] = useState(false)
  const { selectedRegion, selectedIndustries } = usePersonaStore()

  if (!persona) {
    return <MobileHomeSkipped onOpenRoleSwitch={onOpenRoleSwitch} />
  }

  const variants = PERSONA_JOURNEY_BOARD_VARIANTS[persona]
  const active = resolveRoleBoardVariant(persona, variantId)
  const board = active.board
  const tone = TONE_CLASS[board.sideCard.tone]
  const regionLabel = selectedRegion ? REGION_LABELS[selectedRegion] : null
  const industryLabel = selectedIndustries.length > 0 ? selectedIndustries.join(', ') : null
  const roleContext = [regionLabel, industryLabel].filter(Boolean).join(' · ')

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-foreground">
          {PERSONAS[persona].label}
          {roleContext && <span className="text-muted-foreground"> · {roleContext}</span>}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={onOpenRoleSwitch}
          className="h-auto p-0 text-[11.5px] font-bold text-primary"
        >
          Change
        </Button>
      </div>

      {/* Scenario chip row — horizontal scroll, snap, matching the handoff and
          CuriousMobileBoard's own precedent ("six chips wrapping at 390px
          would push the headline below the fold"). */}
      <div
        className="-mx-4 mb-5 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1"
        role="radiogroup"
        aria-label="Choose what you want to do"
        data-testid="mobile-board-variant-chips"
      >
        {variants.map((v) => {
          const selected = v.id === active.id
          return (
            <Button
              key={v.id}
              type="button"
              variant="ghost"
              role="radio"
              aria-checked={selected}
              title={v.chipDescription}
              onClick={() => {
                logRoleBoardVariantSelected(persona, v.id)
                onSelectVariant?.(v.id)
              }}
              className={cn(
                'h-11 shrink-0 snap-start rounded-full border px-4 text-[11.5px] font-semibold',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground'
              )}
            >
              {v.chipLabel}
            </Button>
          )
        })}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {board.heroEyebrow}
      </p>
      <h1 className="mt-1.5 text-[22px] font-extrabold leading-tight text-foreground">
        {board.headline}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground/90">{board.sub}</p>

      <div className="mt-4 flex flex-col gap-2.5">
        <Button
          type="button"
          onClick={() => {
            logRoleBoardCtaClick(persona, active.id, 'cta_primary_href', board.ctaPrimaryHref)
            navigate(board.ctaPrimaryHref)
          }}
          className="h-11 w-full rounded-[10px] bg-primary text-[13.5px] font-bold text-primary-foreground"
        >
          {board.ctaPrimary}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            logRoleBoardCtaClick(persona, active.id, 'cta_secondary_href', board.ctaSecondaryHref)
            navigate(board.ctaSecondaryHref)
          }}
          className="h-11 w-full rounded-[10px] border-border text-[13.5px] font-bold text-foreground"
        >
          {board.ctaSecondary}
        </Button>
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Proof points">
        {board.proofChips.map((chip, i) => (
          <li
            key={chip}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px]',
              i === 0
                ? 'border-accent/30 bg-accent/10 text-accent-legible'
                : 'border-border bg-muted/30 text-muted-foreground'
            )}
          >
            {i === 0 && <Check size={11} aria-hidden="true" />}
            {chip}
          </li>
        ))}
      </ul>

      {/* Side card */}
      <section className={cn('glass-panel mt-5 flex flex-col gap-2.5 p-3.5', tone.panel)}>
        <span className="w-fit rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {PROVENANCE_LABEL[board.sideCard.provenance]}
        </span>
        <h2 className={cn('text-[14px] font-bold', tone.label)}>{board.sideCard.title}</h2>
        <dl className="flex flex-col gap-1.5">
          {board.sideCard.rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3 border-t border-border/50 pt-1.5 text-[11.5px] first:border-t-0 first:pt-0"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-semibold text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p
          className={cn(
            'mt-1 border-t border-border/50 pt-2.5 text-[12.5px] font-bold',
            tone.punchline
          )}
        >
          {board.sideCard.punchline}
        </p>
        {board.sideCard.footnote && (
          <p className="text-[10.5px] leading-relaxed text-muted-foreground">
            {board.sideCard.footnote}
          </p>
        )}
      </section>

      {/* Workshop entry — Phase 6's own follow-up (dock had no way in from
          Home). Renders nothing when idle-with-no-flow, running (the dock
          already owns that state) or video mode. */}
      <MobileWorkshopEntry />

      {/* Supporting cards — collapsed by default (handoff: "the board was
          five scrolls long before this"). */}
      <div className="mt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCardsExpanded((e) => !e)}
          aria-expanded={cardsExpanded}
          className="h-11 w-full justify-between rounded-[11px] border border-border bg-muted/20 px-3 text-[12px] font-semibold text-foreground"
        >
          <span>{board.gridTitle}</span>
          <span className="text-[11px] font-bold text-primary">
            {cardsExpanded ? 'Hide' : `Show ${board.gridCards.length}`}
          </span>
        </Button>
        {cardsExpanded && (
          <div className="mt-2.5 flex flex-col gap-2.5">
            <p className="text-[11px] text-muted-foreground">{board.gridSub}</p>
            {board.gridCards.map((card, i) => {
              const body = (
                <>
                  <h3 className="text-[13px] font-bold text-foreground">{card.title}</h3>
                  <p className="mt-1 text-[12px] leading-[1.55] text-muted-foreground">
                    {card.body}
                  </p>
                </>
              )
              return card.href ? (
                <Button
                  key={card.title}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    logRoleBoardCtaClick(persona, active.id, `grid_card_href:${i}`, card.href!)
                    navigate(card.href as string)
                  }}
                  className={cn(
                    'h-auto w-full flex-col items-start whitespace-normal rounded-[11px] border p-3 text-left',
                    i === 2 ? 'border-accent/50 bg-accent/5' : 'border-border bg-card'
                  )}
                >
                  {body}
                </Button>
              ) : (
                <div
                  key={card.title}
                  className={cn(
                    'rounded-[11px] border p-3',
                    i === 2 ? 'border-accent/50 bg-accent/5' : 'border-border bg-card'
                  )}
                >
                  {body}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Related workshops — desktop parity, see PersonaBoardView.tsx's
          WORKSHOP_NAME_BY_ID comment. Hidden when a board names none. */}
      {active.workshopIds.length > 0 && (
        <div className="mt-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Related on this site
          </h2>
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Related workshops">
            {active.workshopIds.map((id) => {
              // eslint-disable-next-line security/detect-object-injection -- id comes from active.workshopIds, CSV-derived repo data, not user input
              const name = WORKSHOP_NAME_BY_ID[id]
              if (!name) return null
              return (
                <Button
                  key={id}
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`/playground/${id}`)}
                  className="h-auto rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground"
                >
                  {name}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Track strip */}
      <div className="mt-5 border-t border-border pt-4">
        <h2 className="text-[12.5px] font-bold text-foreground">{board.trackTitle}</h2>
        {board.trackNote && (
          <p className="mt-1 text-[10.5px] text-muted-foreground">{board.trackNote}</p>
        )}
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {board.trackChips.map((chip, i) => {
            const moduleId = PERSONAS[persona].essentials[i]
            return (
              <li key={chip}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`/learn/${moduleId}`)}
                  className="h-auto rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground"
                >
                  {chip}
                </Button>
              </li>
            )
          })}
          {board.capstoneChip && (
            <li className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10.5px] font-semibold text-accent">
              {board.capstoneChip.label}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

/**
 * "Show me everything" (hasSkippedPersonalization, no persona) — deliberately
 * NOT a mobile port of LandingView's full desktop fallback (generic hero,
 * stats bar, AskAssistantButton with five persona-branched questions). The
 * handoff's own screen 1 spec assumes a persona is selected; for the rarer
 * skip case this stays minimal rather than inventing new mobile-only copy —
 * same eyebrow line RoleHomeView already uses, plus a way back into role
 * selection. No longer links to Explore (confirmed decision, 2026-08-23:
 * dropped from mobile entirely) — the bottom bar's Workflow/Practice/
 * Reference groups already cover "everything, unfiltered" for a no-persona
 * visitor via getUngatedGroupablePaths, so this stays a single CTA.
 */
function MobileHomeSkipped({ onOpenRoleSwitch }: { onOpenRoleSwitch: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 pb-4 pt-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Post-quantum cryptography, explained and provable
      </p>
      <p className="max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
        You're seeing everything, unfiltered. Pick a role any time to get a board tuned to what you
        need.
      </p>
      <Button
        type="button"
        onClick={onOpenRoleSwitch}
        className="h-11 rounded-[10px] bg-primary px-6 text-[13px] font-bold text-primary-foreground"
      >
        Pick a role
      </Button>
    </div>
  )
}
