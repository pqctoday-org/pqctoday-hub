// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Minus, Plus, Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { threatsData, type ThreatItem } from '@/data/threatsData'
import { PERSONA_THREATS_DEFAULT_INDUSTRIES, INDUSTRY_TO_THREATS_MAP } from '@/data/personaConfig'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { getCrqcConsensus } from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import {
  getShorTier,
  getThreatClass,
  SHOR_TIER_DEFS,
  THREAT_CLASS_DEFS,
  type ThreatClass,
} from '@/components/Threats/threatClassification'
import { cn } from '@/lib/utils'

const CURRENT_YEAR = new Date().getFullYear()
const CRQC_YEAR_MIN = 2030
const CRQC_YEAR_MAX = 2036
// Same fixed defaults ThreatEconomicsHeader.tsx's own mini-calculator starts
// from (dataLifetime/credentialValidity/migrationTime) — only the CRQC year
// is a working control here (design handoff §18), the plan's own distillation
// call: three of the desktop calculator's four sliders stay fixed at their
// real defaults rather than becoming three more controls to explain.
const DATA_LIFETIME = 10
const CREDENTIAL_VALIDITY = 10
const MIGRATION_TIME = 5

type Urgency = 'overdue' | 'critical' | 'urgent' | 'planning'

// Same thresholds ThreatEconomicsHeader.tsx's urgencyFor() uses (that file's
// own comment notes SectorExposureHero.tsx independently duplicates the same
// thresholds a second time on desktop — this picks the one canonical copy to
// mirror, not a third).
function urgencyFor(deadline: number): Urgency {
  const rem = deadline - CURRENT_YEAR
  if (rem < 0) return 'overdue'
  if (rem <= 2) return 'critical'
  if (rem <= 5) return 'urgent'
  return 'planning'
}

function urgencyMessage(deadline: number): string {
  const rem = deadline - CURRENT_YEAR
  if (rem < 0) {
    const abs = Math.abs(rem)
    return `Migration should have started ${abs} year${abs === 1 ? '' : 's'} ago. Anything sent under RSA or ECC since then is already harvestable, and stays readable once the machine arrives.`
  }
  if (rem <= 2)
    return `Only ${rem} year${rem === 1 ? '' : 's'} remaining. Migration must begin immediately.`
  if (rem <= 5) return `${rem} years remaining. Migration planning should be underway.`
  return `${rem} years remaining. Begin cryptographic inventory and planning.`
}

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; bg: string }> = {
  overdue: {
    label: 'OVERDUE',
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
  },
  critical: {
    label: 'CRITICAL',
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
  },
  urgent: { label: 'URGENT', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  planning: { label: 'PLANNING', color: 'text-success', bg: 'bg-success/10 border-success/20' },
}

const CRITICALITY_LEVELS = ['Critical', 'High', 'Medium-High', 'Medium', 'Low']
const CLASS_FILTERS: { id: ThreatClass; label: string }[] = [
  { id: 'hndl', label: THREAT_CLASS_DEFS.hndl.label },
  { id: 'hnfl', label: THREAT_CLASS_DEFS.hnfl.label },
  { id: 'both', label: THREAT_CLASS_DEFS.both.label },
]

/**
 * Mobile Threats (handoff Phase 7 — Reference set, design handoff §18).
 * Source: ThreatEconomicsHeader.tsx, threatClassification.ts — same real
 * functions/data every desktop Threats-page component reads, not
 * re-derived. Distilled, not a port of ThreatsDashboard.tsx's ~4,300-line
 * component tree: no protocol-lens filter, no trust-tier filter, no
 * CRQC capability strip / trajectory chart, no CSV/related-modules detail,
 * and only ONE working calculator control (the CRQC year) rather than
 * desktop's four sliders — stated below, not silently dropped.
 *
 * §18 spec, confirmed against real code before building:
 * - Mosca urgency band, one combined deadline (the more urgent of HNDL/HNFL)
 *   rather than desktop's two separate rows — a real simplification, stated.
 * - CRQC year as a *working* control, 2030–2036, "median of 6 tracked
 *   sources" (`getCrqcConsensus()` — the exact function every desktop
 *   Threats component reads for its Q-Day figure), re-scoring the urgency
 *   band and both deadlines live.
 * - HNDL vs HNFL in one line — new distillation chrome matching the design's
 *   own compressed phrasing, since desktop's real paragraph-length framing
 *   (ThreatEconomicsHeader's atRiskPhrase sentences) assumes the full
 *   calculator UI around it that this screen doesn't carry.
 * - Two filter rows: criticality, and threat class. No third row — industry
 *   narrows silently via the same PERSONA_THREATS_DEFAULT_INDUSTRIES default
 *   desktop applies when a persona is set and no industry is explicitly
 *   chosen (there's no industry-picker UI here to explicitly choose from).
 * - Tier blurbs verbatim from SHOR_TIER_DEFS — the exact same real text
 *   ThreatDetailDialog.tsx shows on desktop. No tier filter exists anywhere
 *   in this screen (or on desktop), so a PQC-safe row can never be filtered
 *   out — true for free, not something extra to build.
 */
export function MobileThreatsView() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const myThreats = useBookmarkStore((s) => s.myThreats)
  const toggleMyThreat = useBookmarkStore((s) => s.toggleMyThreat)

  const consensus = useMemo(() => getCrqcConsensus(), [])
  const [crqcYear, setCrqcYear] = useState(consensus.zEstimate)
  const [criticality, setCriticality] = useState<string | null>(null)
  const [classFilter, setClassFilter] = useState<ThreatClass | null>(null)

  const hndlDeadline = crqcYear - DATA_LIFETIME - MIGRATION_TIME
  const hnflDeadline = crqcYear - CREDENTIAL_VALIDITY - MIGRATION_TIME
  const worstDeadline = Math.min(hndlDeadline, hnflDeadline)
  const urgency = urgencyFor(worstDeadline)

  const personaIndustries = useMemo(() => {
    if (!selectedPersona) return null
    const keys = PERSONA_THREATS_DEFAULT_INDUSTRIES[selectedPersona] ?? []
    const industries = keys
      .flatMap((k) => INDUSTRY_TO_THREATS_MAP[k] ?? [])
      .filter((ind) => threatsData.some((d) => d.industry === ind))
    return industries.length > 0 ? industries : null
  }, [selectedPersona])

  const scopedData = useMemo(
    () =>
      personaIndustries
        ? threatsData.filter((t) => personaIndustries.includes(t.industry))
        : threatsData,
    [personaIndustries]
  )

  const filteredData = useMemo(() => {
    let data = scopedData
    if (criticality) data = data.filter((t) => t.criticality === criticality)
    if (classFilter) data = data.filter((t) => getThreatClass(t) === classFilter)
    return data
  }, [scopedData, criticality, classFilter])

  const urgencyStyle = URGENCY_CONFIG[urgency]

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-4">
        <h1 className="text-[17px] font-extrabold leading-tight text-foreground">PQC threats</h1>
        <p className="text-[11.5px] text-muted-foreground">
          {threatsData.length} tracked
          {personaIndustries && ` · ${scopedData.length} in your focus areas`}
        </p>
      </div>

      <section className={cn('mb-4 rounded-xl border p-4', urgencyStyle.bg)}>
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className={cn('text-[10px] font-extrabold uppercase tracking-wide', urgencyStyle.color)}
          >
            {urgencyStyle.label}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Mosca urgency band
          </span>
        </div>
        <p className={cn('text-[13px] font-semibold leading-snug', urgencyStyle.color)}>
          {urgencyMessage(worstDeadline)}
        </p>
      </section>

      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          CRQC year (Z)
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={crqcYear <= CRQC_YEAR_MIN}
            onClick={() => setCrqcYear((y) => Math.max(CRQC_YEAR_MIN, y - 1))}
            aria-label="Earlier CRQC year"
            className="h-9 w-9 rounded-full"
          >
            <Minus size={14} aria-hidden="true" />
          </Button>
          <span className="text-[26px] font-extrabold text-foreground tabular-nums">
            {crqcYear}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={crqcYear >= CRQC_YEAR_MAX}
            onClick={() => setCrqcYear((y) => Math.min(CRQC_YEAR_MAX, y + 1))}
            aria-label="Later CRQC year"
            className="h-9 w-9 rounded-full"
          >
            <Plus size={14} aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-2 text-center text-[10.5px] text-muted-foreground">
          consensus {consensus.qdayLow}–{consensus.qdayHigh} · median of 6 tracked sources
        </p>
      </section>

      <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">
        Same subtraction, two different X&apos;s:{' '}
        <span className="font-semibold text-foreground">HNDL</span> uses how long the data must stay
        secret, <span className="font-semibold text-foreground">HNFL</span> how long the credential
        stays valid. Whichever is longer sets your date.
      </p>

      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by criticality">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCriticality(null)}
          aria-pressed={criticality === null}
          className={cn(
            'h-8 rounded-full border px-3 text-[11px] font-semibold',
            criticality === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground'
          )}
        >
          All levels
        </Button>
        {CRITICALITY_LEVELS.map((level) => (
          <Button
            type="button"
            variant="ghost"
            key={level}
            onClick={() => setCriticality((c) => (c === level ? null : level))}
            aria-pressed={criticality === level}
            className={cn(
              'h-8 rounded-full border px-3 text-[11px] font-semibold',
              criticality === level
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {level}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by threat class">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setClassFilter(null)}
          aria-pressed={classFilter === null}
          className={cn(
            'h-8 rounded-full border px-3 text-[11px] font-semibold',
            classFilter === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground'
          )}
        >
          All classes
        </Button>
        {CLASS_FILTERS.map((c) => (
          <Button
            type="button"
            variant="ghost"
            key={c.id}
            onClick={() => setClassFilter((cur) => (cur === c.id ? null : c.id))}
            aria-pressed={classFilter === c.id}
            className={cn(
              'h-8 rounded-full border px-3 text-[11px] font-semibold',
              classFilter === c.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {c.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {filteredData.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">No threats match these filters.</p>
        )}
        {filteredData.map((threat) => (
          <ThreatCardMobile
            key={threat.threatId}
            threat={threat}
            bookmarked={myThreats.includes(threat.threatId)}
            onToggleBookmark={() => toggleMyThreat(threat.threatId)}
          />
        ))}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Protocol lens, trust-tier filter, the CRQC capability strip and trajectory chart, and each
        threat&apos;s full dossier (sources, related modules) are on a laptop.
      </p>
    </div>
  )
}

function ThreatCardMobile({
  threat,
  bookmarked,
  onToggleBookmark,
}: {
  threat: ThreatItem
  bookmarked: boolean
  onToggleBookmark: () => void
}) {
  const tier = getShorTier(threat)
  const tierDef = SHOR_TIER_DEFS[tier]
  const cls = getThreatClass(threat)
  const clsDef = THREAT_CLASS_DEFS[cls]

  return (
    <article className="glass-panel flex flex-col gap-2 p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10.5px] text-muted-foreground">{threat.threatId}</span>
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide',
            tierDef.bg,
            tierDef.color
          )}
        >
          {tierDef.label}
        </span>
        <span className="rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {clsDef.label}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={onToggleBookmark}
          aria-label={bookmarked ? 'Remove from My Threats' : 'Add to My Threats'}
          className={cn(
            'ml-auto h-auto shrink-0 rounded p-1',
            bookmarked ? 'text-warning' : 'text-muted-foreground/50'
          )}
        >
          {bookmarked ? (
            <BookmarkCheck size={14} aria-hidden="true" />
          ) : (
            <Bookmark size={14} aria-hidden="true" />
          )}
        </Button>
      </div>

      <p className="text-[12.5px] leading-snug text-foreground/90">{threat.description}</p>

      <p className="text-[10.5px] leading-relaxed text-muted-foreground">{tierDef.blurb}</p>

      <p className="text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground/80">At risk:</span> {threat.cryptoAtRisk}
        {' → '}
        <span className="font-semibold text-foreground/80">{threat.pqcReplacement}</span>
      </p>
    </article>
  )
}
