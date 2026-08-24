// SPDX-License-Identifier: GPL-3.0-only
/**
 * Obligations — the register. "Which rules bind me, and why?"
 *
 * The page's other tabs browse a 197-row catalogue. This one answers the
 * question the catalogue makes you work out for yourself, using the tiering the
 * applicability engine already computes. Three rules hold it honest:
 *
 *  - Reasons are the engine's own strings, rendered verbatim. "Your regulator:
 *    ANSSI" is a claim the engine can defend; a paraphrase is not.
 *  - Requirement counts are context, never a denominator. Nothing here shows a
 *    percentage over requirements, because the requirement corpus is
 *    model-extracted and a percentage would claim more than it can carry.
 *  - The advisory band collapses on arrival. For an EU finance profile it is 23
 *    sector-matched global standards against 12 mandatory; expanded by default
 *    it would recreate the catalogue-browser problem this tab replaces.
 */
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Info, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ALL_JURISDICTIONS } from '@/data/jurisdictionsData'
import {
  PQC_REQUIREMENT_LABEL as PQC_LABEL,
  type ComplianceFramework,
  type PQCRequirement,
} from '@/data/complianceData'
import {
  TIER_META,
  TIER_ORDER,
  type ApplicabilityTier,
  type UserProfile,
} from '@/utils/applicabilityEngine'
import type { PersonaId } from '@/data/learningPersonas'
import { applyRoleOrder, roleFramingFor, roleNoteFor } from './roleLens'
import { useRevisions } from '@/hooks/useRevisions'
import { formatChangeDate, summarizeRecentChanges } from './recentChanges'
import {
  buildObligations,
  groupObligations,
  summarize,
  COLLAPSED_BY_DEFAULT,
  type ObligationRow,
} from './obligationsModel'

const TIER_TONE: Record<ApplicabilityTier, string> = {
  mandatory: 'text-status-error',
  recognized: 'text-status-warning',
  'cross-border': 'text-status-info',
  advisory: 'text-status-info',
  derived: 'text-muted-foreground',
  informational: 'text-muted-foreground',
}

const PQC_TONE: Record<PQCRequirement, string> = {
  yes: 'text-status-error',
  partial: 'text-status-warning',
  expected: 'text-status-warning',
  guidance: 'text-status-info',
  no: 'text-muted-foreground',
}

const COUNTRY_ANY = 'All'

/** Region codes are storage values; these are what a reader should see. */
const REGION_LABEL: Record<string, string> = {
  eu: 'European Union',
  americas: 'Americas',
  apac: 'Asia-Pacific',
  mena: 'Middle East & Africa',
  global: 'Global',
}

interface ObligationsTabProps {
  /** Scope the register is computed for. `country` may be null — see the note. */
  profile: UserProfile
  /** Page-local country override; `All` means "fall back to the profile". */
  countryValue: string
  onCountryChange: (country: string) => void
  /**
   * Sector, shown read-only. It is the top bar's Industry — this tab no longer
   * offers its own picker for it (2026-08-11), so there is no `onSectorChange`.
   */
  sectorValue: string
  onOpenDetail: (framework: ComplianceFramework) => void
  /** Reading order and per-row annotation only — never what applies. */
  persona: PersonaId | null
}

export function ObligationsTab({
  profile,
  countryValue,
  onCountryChange,
  sectorValue,
  onOpenDetail,
  persona,
}: ObligationsTabProps) {
  const rows = useMemo(() => buildObligations(profile), [profile])
  const groups = useMemo(
    () =>
      groupObligations(rows).map((group) => ({
        ...group,
        rows: applyRoleOrder(group.rows, persona),
      })),
    [rows, persona]
  )
  const totals = useMemo(() => summarize(rows), [rows])

  // Re-homes the About-strip's revisions feed, scoped to this reader's rows.
  const { revisions } = useRevisions()
  const changes = useMemo(() => summarizeRecentChanges(revisions, rows), [revisions, rows])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const isOpen = (tier: ApplicabilityTier) => expanded[tier] ?? !COLLAPSED_BY_DEFAULT.has(tier)

  const countryItems = useMemo(
    () => [COUNTRY_ANY, ...ALL_JURISDICTIONS.map((j) => j.name).sort((a, b) => a.localeCompare(b))],
    []
  )
  const pickers = {
    countryValue,
    onCountryChange,
    sectorValue,
    countryItems,
    profile,
  }

  return (
    <div className="space-y-4">
      <ScopeBar {...pickers} totals={totals} framing={roleFramingFor(persona)} />

      {changes.hasHistory && rows.length > 0 && (
        <p className="px-1 text-[11.5px] text-muted-foreground">
          Last recorded data change {formatChangeDate(changes.changedAt)} —{' '}
          {changes.matched.length > 0 ? (
            <>
              it touched{' '}
              <span className="font-semibold text-foreground">
                {changes.matched.map((m) => m.label).join(', ')}
              </span>
              .
            </>
          ) : (
            'none of your obligations were affected.'
          )}
        </p>
      )}

      {rows.length === 0 ? (
        // The zero state IS the first screen for anyone who has not taken the
        // assessment, so it carries the controls that fix it rather than
        // sending the visitor to another page to come back from.
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <ShieldCheck size={26} className="mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">
            Tell us where you operate and we&apos;ll list what binds you
          </p>
          <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">
            The applicability tiers are computed from a country and a sector — without both, no
            instrument can be shown as mandatory rather than merely relevant.
          </p>
          {/* CHANGED 2026-08-11: this card used to repeat the Country and Sector
              pickers that the scope bar above already shows, so a reader with no
              scope set saw the same two controls twice on one screen. It now says
              where the controls are instead of being a second copy of them. */}
          <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground">
            Set your <span className="font-medium text-foreground">sector</span> in the scope
            selector at the top right, and your{' '}
            <span className="font-medium text-foreground">country</span> just above.
          </p>
        </div>
      ) : (
        groups.map((group) => {
          const open = isOpen(group.tier)
          const meta = TIER_META[group.tier]
          return (
            <section
              key={group.tier}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <Button
                type="button"
                variant="ghost"
                aria-expanded={open}
                onClick={() => setExpanded((prev) => ({ ...prev, [group.tier]: !open }))}
                className="h-auto w-full justify-start gap-2 rounded-none border-b border-border bg-muted/40 px-4 py-3 text-left"
              >
                {open ? (
                  <ChevronDown size={15} className="shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight size={15} className="shrink-0 text-muted-foreground" />
                )}
                <span className={`text-sm font-bold ${TIER_TONE[group.tier]}`}>{meta.label}</span>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {group.rows.length}
                </span>
                <span className="min-w-0 truncate text-xs font-normal text-muted-foreground">
                  {meta.description}
                </span>
              </Button>

              {open && (
                <ul className="divide-y divide-border">
                  {group.rows.map((row) => (
                    <ObligationListRow
                      key={row.framework.id}
                      row={row}
                      onOpen={onOpenDetail}
                      roleNote={roleNoteFor(row, persona)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )
        })
      )}
    </div>
  )
}

// ── Scope bar ───────────────────────────────────────────────────────────

function ScopePicker({
  label,
  value,
  items,
  onChange,
}: {
  label: string
  value: string
  items: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <FilterDropdown
        items={items}
        selectedId={value}
        onSelect={onChange}
        size="sm"
        searchable
        defaultLabel="Any"
        label={label}
      />
    </div>
  )
}

function ScopeBar({
  profile,
  countryValue,
  countryItems,
  onCountryChange,
  sectorValue,
  totals,
  framing,
}: {
  profile: UserProfile
  countryValue: string
  countryItems: string[]
  onCountryChange: (c: string) => void
  /** Read-only here — the sector comes from the top bar. */
  sectorValue: string
  totals: ReturnType<typeof summarize>
  framing: string
}) {
  // TIER_ORDER, not map-insertion order — the summary must read strongest-first
  // for the same reason the bands are stacked that way.
  const tierSummary = TIER_ORDER.filter((tier) => (totals.byTier[tier] ?? 0) > 0)
    .map((tier) => `${totals.byTier[tier]} ${TIER_META[tier].label.toLowerCase()}`)
    .join(' · ')

  // The control shows the country the register actually used. When the page has
  // no override of its own the engine falls back to the assessment answer, and
  // a control reading "Any" beside a list of French regulators would be a lie.
  const inheritedCountry = countryValue === COUNTRY_ANY && !!profile.country
  const shownCountry = inheritedCountry ? (profile.country as string) : countryValue
  const inheritedSector = sectorValue === COUNTRY_ANY && !!profile.industry
  const shownSector = inheritedSector ? (profile.industry as string) : sectorValue
  const inherited = inheritedCountry || inheritedSector

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ScopeChip
          label="Region"
          value={profile.region ? (REGION_LABEL[profile.region] ?? profile.region) : 'any'}
        />
        {/* CHANGED 2026-08-11: Sector is a read-only chip now. It is the top
            bar's Industry — the page had its own picker offering a different,
            uncurated vocabulary read straight off the CSV (29 values including
            raw NAICS codes '22', '48', '52' and duplicate synonyms such as
            'Finance & Banking' beside 'Finance & Insurance'). Two controls for
            one concept, and the in-page one was the worse list.

            Country stays a picker here on purpose: the top bar carries a region
            BLOC (americas/eu/…) and has no country, and the tier engine needs
            one. This is the only scope control left on the page. */}
        <ScopeChip label="Sector" value={shownSector === COUNTRY_ANY ? 'any' : shownSector} />
        <ScopePicker
          label="Country"
          value={shownCountry}
          items={countryItems}
          onChange={onCountryChange}
        />
        {inherited && <span className="text-[10.5px] text-muted-foreground">from your scope</span>}
      </div>

      {totals.total > 0 && <p className="mt-3 text-xs italic text-muted-foreground">{framing}</p>}

      <p className="mt-1.5 text-xs text-muted-foreground">
        {totals.total > 0 ? (
          <>
            <span className="font-semibold text-foreground">{totals.total}</span> instruments in
            scope — {tierSummary}.{' '}
            <span className="font-semibold text-foreground">{totals.pqcMandated}</span> of them
            actually mandate post-quantum cryptography.
          </>
        ) : (
          'Applicability tiers are unavailable without a country and a sector.'
        )}
      </p>

      {totals.total > 0 && totals.pqcMandated === 0 && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info size={13} className="mt-0.5 shrink-0 text-primary" />
          None of these instruments mandates PQC today. Several expect it or publish guidance — the
          PQC column says which.
        </p>
      )}
    </div>
  )
}

function ScopeChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11.5px] font-semibold text-foreground">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {value}
    </span>
  )
}

// ── Row ─────────────────────────────────────────────────────────────────

function ObligationListRow({
  row,
  onOpen,
  roleNote,
}: {
  row: ObligationRow
  onOpen: (framework: ComplianceFramework) => void
  roleNote: string | null
}) {
  const fw = row.framework
  const shown = row.milestones.slice(0, 2)
  const extra = row.milestones.length - shown.length

  return (
    <li className="grid gap-3 p-4 md:grid-cols-[minmax(0,2fr)_190px_120px] md:items-start">
      {/* Obligation & why it applies. The NAME is the focusable action — the row
          is deliberately not a button, so the chips inside it stay reachable
          without the nested-interactive violation FrameworkCard was refactored
          away from. */}
      <div className="min-w-0">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen(fw)}
          className="h-auto justify-start whitespace-normal p-0 text-left text-[13.5px] font-bold text-foreground hover:text-primary"
        >
          {fw.label}
        </Button>

        <p className={`mt-0.5 text-[11.5px] ${TIER_TONE[row.tier]}`}>
          {row.reason}
          {fw.countries.length > 0 && (
            <span className="text-muted-foreground"> · {fw.countries.join(', ')}</span>
          )}
        </p>

        {roleNote && <p className="mt-0.5 text-[11px] font-medium text-primary">{roleNote}</p>}

        {fw.notes && (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{fw.notes}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground">
          {typeof fw.confidenceScore === 'number' && <span>Trust {fw.confidenceScore}</span>}
          {fw.industries.slice(0, 2).map((ind) => (
            <span key={ind} className="rounded bg-muted px-1.5 py-0.5">
              {ind}
            </span>
          ))}
          {(fw.cswp39Tags ?? []).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 font-mono">
              {tag.replace('cswp39:', '')}
            </span>
          ))}
          <span>
            {row.requirementCount > 0
              ? `${row.requirementCount} requirements`
              : 'no extracted requirements'}
          </span>
          {fw.website && (
            <a
              href={fw.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              Site <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* Timeline & key milestones — verbatim text, then structured dates. */}
      <div className="min-w-0 text-[11.5px]">
        <p className="text-foreground">{fw.deadline}</p>
        {shown.map((m) => (
          <p key={`${m.year}-${m.label}`} className="mt-0.5 text-muted-foreground">
            <span className="font-mono text-[10.5px] text-foreground">{m.year}</span> {m.label}
          </p>
        ))}
        {extra > 0 && <p className="mt-0.5 text-[10.5px] text-muted-foreground">+{extra} more</p>}
        {fw.deadlineKind && (
          <p className="mt-1 font-mono text-[9.5px] uppercase text-muted-foreground">
            {fw.deadlineKind}
          </p>
        )}
      </div>

      {/* PQC stance — the column the "0 of these mandate PQC" headline reads. */}
      <div className={`text-[11.5px] font-semibold ${PQC_TONE[fw.pqcRequirement]}`}>
        <span className="md:hidden text-muted-foreground">PQC: </span>
        {PQC_LABEL[fw.pqcRequirement]}
      </div>
    </li>
  )
}
