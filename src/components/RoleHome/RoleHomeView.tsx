// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import type { KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Lightbulb,
  LayoutGrid,
} from 'lucide-react'
import { PERSONAS, type PersonaId, type LearningPersona } from '@/data/learningPersonas'

export interface RoleHomeViewProps {
  /** Fires immediately on card click — there is no further wizard step. */
  onSelectPersona: (id: PersonaId) => void
  /** Footer escape hatch — "Show me everything". Caller owns what this actually does
   *  (e.g. `setPersona(null)` + `skipPersonalization()`); this component just reports
   *  the click. */
  onSkip: () => void
}

const PERSONA_ICONS: Record<LearningPersona['icon'], LucideIcon> = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Lightbulb,
}

/** Which track-line template a persona's card uses. Every persona shows an
 *  "essentials" summary except researcher, who gets the full-corpus framing
 *  (no funnel) instead — see `trackLine` below. */
type TrackKind = 'essentials' | 'fullCorpus'

interface RoleCopy {
  /** Why-now hook — editorial copy from the approved design, not derived data. */
  urgency: string
  /** First concrete action + time cost. Also editorial copy. */
  firstWin: string
  track: TrackKind
}

/**
 * Per-role front-door copy. The urgency hook and first-win line are literal
 * editorial copy from the approved design — they are not derivable from
 * `PERSONAS`. Module counts / minutes are deliberately NOT hardcoded here:
 * `trackLine()` below reads `essentials.length` / `essentialsMinutes` /
 * `estimatedMinutes` live from `PERSONAS[id]` (src/data/learningPersonas.ts) so
 * this screen can never silently drift from the real learning-path config.
 */
const ROLE_COPY: Record<PersonaId, RoleCopy> = {
  executive: {
    urgency: 'Boards are asking. You need a defensible position before the next audit cycle.',
    firstWin: 'First win — answer the board · 11 min',
    track: 'essentials',
  },
  developer: {
    urgency: 'OpenSSL, BoringSSL and JOSE already ship PQC. Find what fits your stack.',
    firstWin: 'First win — run a real ML-KEM handshake · 5 min',
    track: 'essentials',
  },
  architect: {
    urgency: 'Hybrid certs and key growth reshape every PKI. Map the redesign first.',
    firstWin: 'First win — flip a policy, watch it rekey · 15 min',
    track: 'essentials',
  },
  ops: {
    urgency: 'Certs rotate slower, keys get bigger, HSMs get pickier. Plan the cutover.',
    firstWin: 'First win — size your HSM fleet · 10 min',
    track: 'essentials',
  },
  researcher: {
    urgency: 'FIPS 203/204/205 are out and ACVP vectors are live. Trace it end to end.',
    firstWin: 'No funnel — open the evidence workspace',
    track: 'fullCorpus',
  },
  curious: {
    urgency: 'Nothing breaks today. But the padlock icon will look very different in five years.',
    firstWin: 'First win — see what breaks · 6 min',
    track: 'essentials',
  },
}

/** Card render order — matches the approved design layout. */
const ROLE_ORDER: PersonaId[] = [
  'executive',
  'developer',
  'architect',
  'ops',
  'researcher',
  'curious',
]

/** Live "then X modules / Y min" (or, for researcher, "full corpus" framing) —
 *  always computed from the persona object passed in, never a literal number. */
function trackLine(persona: LearningPersona, track: TrackKind): string {
  return track === 'fullCorpus'
    ? `full corpus · ${persona.estimatedMinutes} min available`
    : `then ${persona.essentials.length} modules · ${persona.essentialsMinutes} min`
}

interface RoleCardProps {
  personaId: PersonaId
  onSelect: (id: PersonaId) => void
}

/**
 * One selectable role tile. Modeled on the old Track→Role→Region→Industry
 * wizard's `SelectionCard` (clickable div + `role="button"`, not a raw
 * `<button>` — raw `<button>` is ESLint-blocked repo-wide) for visual/
 * interaction consistency with the rest of the persona-selection UI. That
 * wizard (`PersonalizationSection.tsx`) was retired 2026-08-01 once Role Home
 * (this component) + the top bar's RegionIndustryPill fully replaced it —
 * referenced here only as the historical origin of this pattern.
 */
const RoleCard = ({ personaId, onSelect }: RoleCardProps) => {
  const persona = PERSONAS[personaId]
  const copy = ROLE_COPY[personaId]
  const Icon = PERSONA_ICONS[persona.icon]
  const accessibleName = `${persona.label} — ${persona.subtitle}`

  const handleClick = () => onSelect(personaId)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(personaId)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={accessibleName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="glass-panel flex h-full cursor-pointer select-none flex-col gap-3 p-5 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-primary/10 p-2">
          <Icon size={20} className="text-primary" aria-hidden="true" />
        </span>
        <div>
          <p className="font-bold leading-tight text-foreground">{persona.label}</p>
          <p className="text-xs text-muted-foreground">{persona.subtitle}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/80">{copy.urgency}</p>

      <div className="mt-auto space-y-1 border-t border-border/50 pt-3">
        <p className="text-xs font-semibold text-accent">{copy.firstWin}</p>
        <p className="text-xs text-muted-foreground">{trackLine(persona, copy.track)}</p>
      </div>
    </div>
  )
}

interface SkipCardProps {
  onSkip: () => void
}

/**
 * B4 (bplus-remediation-plan-08292026.md): "Show me everything" used to sit
 * below the 6 role cards as a plain outline `<Button>` in its own
 * border-separated footer — a legitimate, real escape hatch (every batch of
 * the B+ audit could reach it), but visually a fraction of a persona card's
 * weight, so "just skip" read as the unfavored path even though picking a
 * persona and skipping are equally supported choices here. Same
 * `RoleCard`-shaped tile, same grid, as the 7th item — visually distinct
 * (dashed border, muted icon chip, no urgency/first-win framing since there
 * is none) rather than a smaller, separately-styled control.
 */
const SkipCard = ({ onSkip }: SkipCardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSkip()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Show me everything"
      onClick={onSkip}
      onKeyDown={handleKeyDown}
      className="glass-panel flex h-full cursor-pointer select-none flex-col gap-3 border-dashed p-5 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-muted p-2">
          <LayoutGrid size={20} className="text-muted-foreground" aria-hidden="true" />
        </span>
        <div>
          <p className="font-bold leading-tight text-foreground">Show me everything</p>
          <p className="text-xs text-muted-foreground">No filtering</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/80">
        Not sure which fits, or don't want to commit? See the full catalog, unfiltered.
      </p>

      <div className="mt-auto space-y-1 border-t border-border/50 pt-3">
        <p className="text-xs text-muted-foreground">You can pick a role later from any page</p>
      </div>
    </div>
  )
}

/**
 * Role Home — the pre-personalization front door. Replaces the old
 * multi-step Track → Role → Region → Industry wizard's entry screen with a
 * single "Who's asking?" screen: pick a role card and commit immediately (no
 * further wizard steps — region/industry default from that persona's
 * `PERSONA_TIMELINE_REGION` / `PERSONA_THREATS_DEFAULT_INDUSTRIES` and stay
 * editable later via the top bar's region/industry pill), or skip entirely.
 *
 * Self-contained: not wired into routing/LandingView here. The caller decides
 * where this renders and what `onSelectPersona` / `onSkip` actually do.
 */
export const RoleHomeView = ({ onSelectPersona, onSkip }: RoleHomeViewProps) => {
  return (
    <section
      aria-labelledby="role-home-heading"
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14"
    >
      <p className="mb-3 text-sm font-mono uppercase tracking-widest text-muted-foreground">
        Post-quantum cryptography, explained and provable
      </p>
      <h2
        id="role-home-heading"
        className="text-gradient text-4xl font-extrabold leading-tight sm:text-[40px]"
      >
        Who's asking?
      </h2>
      <p className="mt-4 max-w-[520px] text-muted-foreground">
        Pick the closest fit and we'll lead with what you need. You'll still see everything —
        nothing gets hidden, and you can change this on any page.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLE_ORDER.map((id) => (
          <RoleCard key={id} personaId={id} onSelect={onSelectPersona} />
        ))}
        <SkipCard onSkip={onSkip} />
      </div>
    </section>
  )
}
