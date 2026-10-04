// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Globe,
  FileText,
  ListChecks,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { cn } from '@/lib/utils'
import { useApplicability } from '@/hooks/useApplicability'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  allComplianceFrameworks,
  complianceFrameworks,
  PQC_REQUIREMENT_LABEL as PQC_LABEL,
  type ComplianceFramework,
} from '@/data/complianceData'
import { isComplianceFrameworkEmphasized } from '@/data/personaConfig'
import { RECORDS_GLOSSARY } from '@/data/recordsGlossary'
import { TIER_META, type ApplicabilityTier } from '@/utils/applicabilityEngine'
import {
  buildObligations,
  groupObligations,
  COLLAPSED_BY_DEFAULT,
} from '@/components/Compliance/obligations/obligationsModel'
import {
  applyRoleOrder,
  roleFramingFor,
  roleNoteFor,
} from '@/components/Compliance/obligations/roleLens'
import {
  citationIndex,
  documentsFor,
  resolveRequirementsPick,
  totalFor,
} from '@/components/Compliance/requirements/requirementsModel'
import { CSWP39_STEPS, CSWP39_SOURCE_METADATA } from '@/components/Compliance/cswp39Data'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import { buildDrawerDetail, pillarForBodyType } from '@/components/Compliance/redesign/pillarModel'
import { pillClasses, TONES } from '@/components/Compliance/redesign/tones'
import {
  applyRecordScope,
  cavpValidationUrl,
  formatIsoDate,
  isSecurityTargetType,
  pqcCoverageState,
  pqcEvidenceLabel,
  pqcNames,
  recordTypeDescription,
  recordTypeLabel,
  statusBadgeClass,
} from '@/components/Compliance/recordSemantics'
import { MobileSheet } from '../primitives/Sheet'

/** Never let a malformed URL crash the sheet — falls back to the raw string. */
function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Linked-evidence rows listed on the phone before deferring to a laptop. */
const EVREF_PHONE_LIMIT = 8

type Section = 'obligations' | 'requirements' | 'landscape' | 'records' | 'cswp39'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'obligations', label: 'Rules & Standards' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'records', label: 'Records' },
  { id: 'cswp39', label: 'CSWP.39' },
]

const SECTION_IDS = new Set<string>(SECTIONS.map((s) => s.id))

/**
 * Desktop's Landscape pillar values (plus the legacy 'technical', and the
 * older page models' 'landscape' / 'frameworks', which desktop normalises to
 * the Standardize pillar).
 */
const LANDSCAPE_TAB_VALUES = new Set([
  'standards',
  'technical',
  'certification',
  'compliance',
  'landscape',
  'frameworks',
])

/**
 * Desktop's `?tab=` values include several this screen has no matching
 * section for ('foryou', 'progress', 'products'). Map the ones with a real
 * narrow-mobile equivalent — the Landscape pillar values land on Landscape
 * (they used to fall through to Rules & Standards) — and an unmapped or
 * unknown value falls through to the 'obligations' default rather than a
 * blank section. Without a `tab`, a `cert` or `evref` link picks its own
 * section, the same way desktop's defaultTabFor() does.
 */
function sectionFromTabParam(
  tab: string | null,
  cert?: string | null,
  evref?: string | null,
  reqfw?: string | null,
  cswp?: string | null
): Section | null {
  if (tab) {
    if (SECTION_IDS.has(tab)) return tab as Section
    if (LANDSCAPE_TAB_VALUES.has(tab)) return 'landscape'
    return null
  }
  if (cert) return 'records'
  if (evref) return 'cswp39'
  // Same implied tabs as desktop's impliedTabFor() (deep-link PR 2).
  if (reqfw) return 'requirements'
  if (cswp) return 'cswp39'
  return null
}

/**
 * The record fields this screen shows for a `?cert=` link — structurally a
 * subset of Compliance's ComplianceRecord (the desktop record popover and the
 * record type live behind the mobile import boundary), covering every field
 * the desktop ComplianceDetailPopover renders.
 */
export interface MobileCertRecord {
  id: string
  source: string
  date: string
  link: string
  type: string
  status: string
  productName: string
  productCategory: string
  vendor: string
  certificationLevel?: string
  pqcCoverage?: boolean | string
  classicalAlgorithms?: string
  lab?: string
  certificationReportUrls?: readonly string[]
  securityTargetUrls?: readonly string[]
  additionalDocuments?: ReadonlyArray<{ name: string; url: string }>
  sourceConflicts?: ReadonlyArray<{
    field: string
    note?: string
    values: ReadonlyArray<{ value: string; source: string; url?: string }>
  }>
  ccArchivedDate?: string | null
  // FIPS 140-3 (NIST CMVP certificate page)
  cmvpStandard?: string
  cmvpStatus?: string
  cmvpHistoricalReason?: string | null
  cmvpDetailsFetchedAt?: string
  cmvpApprovedAlgorithms?: ReadonlyArray<{ name: string; cavpRefs: readonly string[] }>
  sunsetDate?: string | null
  overallLevel?: number | null
  caveat?: string
  embodiment?: string
  moduleType?: string
  operationalEnvironments?: readonly string[] | null
  // NIST CAVP validation details page
  cavpFirstValidated?: string
  cavpImplementationVersion?: string
  cavpImplementationType?: string
  cavpProductUrl?: string
  cavpCapabilities?: ReadonlyArray<{
    algorithm: string
    operatingEnvironment: string
    parameterSets: readonly string[]
    functions: readonly string[]
  }>
}

/** Records listed on the phone before asking the reader to refine the search. */
const RECORD_PHONE_LIMIT = 20

/**
 * Same match as desktop's matchesRecordText (Compliance/recordFilters.ts —
 * behind the mobile import boundary because it also pulls in a desktop
 * filter component): product, vendor, source, type label, certificate id.
 */
function matchesRecordSearch(record: MobileCertRecord, text: string): boolean {
  const s = text.trim().toLowerCase()
  if (!s) return true
  return (
    record.productName.toLowerCase().includes(s) ||
    record.vendor.toLowerCase().includes(s) ||
    record.source.toLowerCase().includes(s) ||
    recordTypeLabel(record.type).toLowerCase().includes(s) ||
    record.id.toLowerCase().includes(s)
  )
}

const TIER_TONE: Record<ApplicabilityTier, string> = {
  mandatory: 'text-status-error',
  recognized: 'text-status-warning',
  'cross-border': 'text-status-info',
  advisory: 'text-status-info',
  derived: 'text-muted-foreground',
  informational: 'text-muted-foreground',
}

// Same 5-value labels ObligationsTab.tsx's own PQC_LABEL map uses —
// replicated rather than imported (a 5-entry literal, not worth an ESLint
// exception) so the wording can never drift.
/**
 * Mobile Compliance (handoff Phase 8 — Workflow set, design handoff §8).
 *
 * The README's own mechanism ("nine desktop views" collapsed to "exactly two
 * primary chips" behind a "+7 more views" chip, with a teal "lens line") does
 * not exist in the real code — verified by research before writing any UI.
 * Desktop has 8 fixed tabs (obligationsModel/ComplianceView.tsx), same order
 * for every persona; persona is a reading LENS (order + one-line annotation),
 * never a tab-count reducer. No "lens line" copy, no chip-collapse mechanism,
 * anywhere in the tree. Scope confirmed with the user (2026-08-23): distill
 * 5 of the 8 real tabs — Rules & Standards, Requirements, Landscape's real
 * persona-emphasis reduction, Product Records' certification glossary, and
 * CSWP.39 — dropping Progress, Products, and For You (whose Gantt is already
 * a stated cut per the handoff).
 *
 * Every section reuses the real desktop model verbatim: useApplicability()
 * (same industry/country/region/persona stores every desktop tab reads),
 * buildObligations/groupObligations/applyRoleOrder/roleFramingFor/roleNoteFor
 * (the real register + role-lens), citationIndex/documentsFor/totalFor (the
 * real Requirements reading-room model), isComplianceFrameworkEmphasized
 * (the real Landscape role-reduction, corrected from the README's "2 of 9"
 * claim to the real ~5-6-of-N framework-card reduction), and CSWP39_STEPS
 * (the real 5 steps, with the REAL section refs — the README's own
 * "§5.1–§5.4 / §4.6" is wrong; the data file's own comment warns against
 * exactly that conflation. Every real step cites "§5, key activities bullet
 * N", only step 5 additionally cites §4.6).
 *
 * The CSWP.39 source line is new UI (desktop never renders
 * CSWP39_SOURCE_METADATA as a sentence — verified), but every field in it is
 * real, not invented.
 */
export function MobileComplianceView({
  records,
  recordsLoaded = false,
}: {
  /** The certification records ComplianceView already loaded (for `?cert=`). */
  records?: readonly MobileCertRecord[]
  recordsLoaded?: boolean
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const certParam = searchParams.get('cert')
  const evrefParam = searchParams.get('evref')
  const frameworkParam = searchParams.get('framework')
  // `?reqfw=` (Requirements pick) and `?step=` (CSWP.39 step) — the same
  // params desktop reads (deep-link PR 2). `cswpview` / `mtier` / `dossier`
  // only pick the CSWP.39 section here: this screen has the steps alone.
  const reqfwParam = searchParams.get('reqfw')
  const stepParam = searchParams.get('step')
  const cswpParam =
    searchParams.get('cswpview') ??
    stepParam ??
    searchParams.get('mtier') ??
    searchParams.get('dossier')
  // Lazy-initialize from `?tab=` (e.g. a GRC board's `/compliance?tab=records`
  // link) so a deep link lands on the right section on first paint, not just
  // the 'obligations' default.
  const [section, setSection] = useState<Section>(
    () =>
      sectionFromTabParam(tabParam, certParam, evrefParam, reqfwParam, cswpParam) ?? 'obligations'
  )
  // Adjust `section` when `?tab=` itself changes on the SAME mounted route
  // (e.g. tapping a second board link without navigating away first) — a
  // mount-only initializer would miss this, same class of gap the desktop
  // ReportView hydration guard had. Deliberately setState-during-render (the
  // React-recommended way to sync state from a changed prop/external value —
  // see "You Might Not Need an Effect") rather than a `useEffect`, which
  // would cascade an extra render on every mount.
  const tabKey = `${tabParam ?? ''}|${certParam ?? ''}|${evrefParam ?? ''}|${reqfwParam ?? ''}|${cswpParam ?? ''}`
  const [lastTabKey, setLastTabKey] = useState(tabKey)
  if (tabKey !== lastTabKey) {
    setLastTabKey(tabKey)
    const next = sectionFromTabParam(tabParam, certParam, evrefParam, reqfwParam, cswpParam)
    if (next) setSection(next)
  }
  const [expandedTier, setExpandedTier] = useState<Record<string, boolean>>({})
  // The open step IS `?step=` — derived, never a stale copy.
  const openStep = CSWP39_STEPS.some((s) => s.id === stepParam) ? stepParam : null
  // The detail sheet IS `?framework=` — same param desktop's drawer uses, so a
  // shared link opens it here too. Opening pushes, closing replaces.
  const detailFramework = useMemo(
    () =>
      frameworkParam ? (complianceFrameworks.find((f) => f.id === frameworkParam) ?? null) : null,
    [frameworkParam]
  )
  const setParam = (key: string, value: string | null, replace: boolean) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace }
    )
  /** Set params together with the tab they belong to (always a replace). */
  const setSectionParams = (tab: Section, patch: Record<string, string | null>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tab)
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true }
    )
  const openFramework = (fw: ComplianceFramework) => setParam('framework', fw.id, false)
  const closeFramework = () => setParam('framework', null, true)
  const closeRecord = () => setParam('cert', null, true)

  const certRecord = certParam ? (records?.find((r) => r.id === certParam) ?? null) : null
  const certNotFound = !!certParam && recordsLoaded && !certRecord

  // Records search — the same `?q=` / `?rstatus=all` params desktop's records
  // table reads (default scope: current records only, newest first), so a
  // link shared from either opens the same list on the other.
  const recordQuery = searchParams.get('q') ?? ''
  const recordScope = searchParams.get('rstatus') === 'all' ? 'all' : 'current'
  const recordMatches = useMemo(
    () =>
      records
        ? applyRecordScope(records, recordScope)
            .filter((r) => matchesRecordSearch(r, recordQuery))
            .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
        : [],
    [records, recordScope, recordQuery]
  )
  const hasRecordList = !!records && records.length > 0
  // The glossary is the whole section when there is no record list; with one,
  // it folds away under a toggle below the list.
  const [glossaryToggled, setGlossaryToggled] = useState<boolean | null>(null)
  const glossaryOpen = glossaryToggled ?? !hasRecordList
  const openRecord = (id: string) => setParam('cert', id, false)

  const persona = usePersonaStore((s) => s.selectedPersona)
  const { profile, isEmpty } = useApplicability()

  const rows = useMemo(() => buildObligations(profile), [profile])
  const groups = useMemo(
    () => groupObligations(rows).map((g) => ({ ...g, rows: applyRoleOrder(g.rows, persona) })),
    [rows, persona]
  )
  const framing = roleFramingFor(persona)

  const index = useMemo(() => citationIndex(rows.map((r) => r.framework)), [rows])
  const { selected: selectedRow, status: reqfwStatus } = useMemo(
    () => resolveRequirementsPick(rows, reqfwParam, complianceFrameworks),
    [rows, reqfwParam]
  )
  const docs = useMemo(
    () => (selectedRow ? documentsFor(selectedRow.framework, index) : []),
    [selectedRow, index]
  )
  // The out-of-scope note is informational; dismissing it keeps the pick.
  const [dismissedReqNoteFor, setDismissedReqNoteFor] = useState<string | null>(null)

  // `?evref=<library ref id>` — desktop filters the CSWP.39 evidence map to
  // that document's extracted requirements. The phone has no pillar × tier
  // grid, so it lists the same rows (capped) and says the map is on a laptop.
  const evrefRequirements = useMemo(
    () => (evrefParam ? (maturityByRefId.get(evrefParam) ?? []) : []),
    [evrefParam]
  )

  const emphasisSet = useMemo(
    () =>
      persona
        ? complianceFrameworks.filter((f) => isComplianceFrameworkEmphasized(persona, f.id))
        : [],
    [persona]
  )
  const roleReductionActive =
    emphasisSet.length > 0 && emphasisSet.length < complianceFrameworks.length

  const jumpToRequirements = (frameworkId: string) => {
    setSection('requirements')
    // One write: two setSearchParams calls in one tick — the second wins.
    setSectionParams('requirements', { reqfw: frameworkId, framework: null })
  }

  const isTierOpen = (tier: ApplicabilityTier) =>
    expandedTier[tier] ?? !COLLAPSED_BY_DEFAULT.has(tier)

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-1">
        <h1 className="sr-only">Compliance</h1>
      </div>

      <div className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            type="button"
            variant="ghost"
            onClick={() => setSection(s.id)}
            aria-pressed={section === s.id}
            className={cn(
              'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
              section === s.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {frameworkParam && !detailFramework && (
        <DeepLinkNotice
          kind="not-found"
          message={
            allComplianceFrameworks.some((f) => f.id === frameworkParam)
              ? `The framework “${frameworkParam}” has been retired from the tracked frameworks.`
              : `No framework with the ID “${frameworkParam}” is tracked here — it may have been renamed or removed.`
          }
          onDismiss={closeFramework}
        />
      )}
      {certNotFound && (
        <DeepLinkNotice
          kind="not-found"
          message={`No certification record with the ID “${certParam}” is in this snapshot — it may have been withdrawn, renumbered or not yet published.`}
          onDismiss={closeRecord}
        />
      )}

      {isEmpty && (section === 'obligations' || (section === 'requirements' && !selectedRow)) && (
        <div className="glass-panel p-4 text-center">
          <p className="text-[12.5px] font-semibold text-foreground">Nothing in scope yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Set a country and sector in your assessment profile to see which rules bind you.
          </p>
        </div>
      )}

      {section === 'obligations' && !isEmpty && (
        <div className="flex flex-col gap-3">
          <p className="text-[11.5px] italic leading-relaxed text-muted-foreground">{framing}</p>
          {groups.map((group) => {
            const meta = TIER_META[group.tier]
            const open = isTierOpen(group.tier)
            return (
              <div key={group.tier} className="glass-panel overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setExpandedTier((e) => ({ ...e, [group.tier]: !open }))}
                  aria-expanded={open}
                  className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-3.5 py-2.5 text-left"
                >
                  <span className={cn('text-[12px] font-bold flex-1', TIER_TONE[group.tier])}>
                    {meta.label}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground">{group.rows.length}</span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-muted-foreground transition-transform',
                      open && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </Button>
                {open && (
                  <div className="flex flex-col gap-2 border-t border-border px-3.5 pb-3 pt-2.5">
                    {group.rows.map((row) => {
                      const note = roleNoteFor(row, persona)
                      return (
                        <Button
                          key={row.framework.id}
                          type="button"
                          variant="ghost"
                          onClick={() => openFramework(row.framework)}
                          // Button's own base classes hard-code whitespace-nowrap;
                          // this button wraps row.reason (a real sentence), which
                          // inherited nowrap and would run off the right edge
                          // instead of wrapping (2026-08-24, same defect class
                          // found and fixed on Threats/Patents).
                          className="h-auto flex-col items-start gap-1 whitespace-normal rounded-lg border border-border bg-card p-2.5 text-left"
                        >
                          <div className="flex w-full flex-wrap items-center gap-1.5">
                            <span className="text-[12.5px] font-bold text-foreground">
                              {row.framework.label}
                            </span>
                            {row.framework.pqcRequirement !== 'no' && (
                              <span className="rounded bg-muted/50 px-1.5 py-0.5 text-sim-chip font-bold uppercase text-muted-foreground">
                                PQC {PQC_LABEL[row.framework.pqcRequirement]}
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-muted-foreground">{row.reason}</p>
                          {note && <p className="text-[10.5px] text-foreground/80">{note}</p>}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {section === 'requirements' && reqfwStatus === 'unknown' && (
        <DeepLinkNotice
          kind="not-found"
          message={`No tracked framework has the ID “${reqfwParam}” — it may have been renamed or retired.`}
          onDismiss={() => setSectionParams('requirements', { reqfw: null })}
        />
      )}

      {section === 'requirements' &&
        reqfwStatus === 'out-of-scope' &&
        selectedRow &&
        dismissedReqNoteFor !== reqfwParam && (
          <DeepLinkNotice
            kind="widened"
            message={`${selectedRow.framework.label} is not among the instruments for your current country and sector — it is shown because the link named it.`}
            onDismiss={() => setDismissedReqNoteFor(reqfwParam)}
          />
        )}

      {/* A linked framework (`?reqfw=`) is shown even with an empty profile or
          outside the reader's scope — same as desktop RequirementsTab. */}
      {section === 'requirements' && (!isEmpty || selectedRow) && (
        <div className="flex flex-col gap-3">
          {!selectedRow ? (
            <p className="text-[12.5px] text-muted-foreground">Nothing in scope yet.</p>
          ) : (
            <>
              {rows.length > 0 && (
                <div className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
                  {rows.map((r) => (
                    <Button
                      key={r.framework.id}
                      type="button"
                      variant="ghost"
                      onClick={() => setSectionParams('requirements', { reqfw: r.framework.id })}
                      aria-pressed={selectedRow?.framework.id === r.framework.id}
                      className={cn(
                        'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
                        selectedRow?.framework.id === r.framework.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground'
                      )}
                    >
                      {r.framework.label}
                    </Button>
                  ))}
                </div>
              )}

              {selectedRow && (
                <div className="glass-panel p-3.5">
                  <h2 className="text-[13px] font-bold text-foreground">
                    {selectedRow.framework.label}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{selectedRow.reason}</p>
                  <p className="mt-2 text-[10.5px] text-muted-foreground">
                    These requirements are extracted from the documents this instrument{' '}
                    <span className="font-semibold text-foreground">cites</span> — not from its own
                    text.
                    {docs.length > 0 &&
                      ` ${totalFor(docs)} requirement${totalFor(docs) === 1 ? '' : 's'} across ${docs.length} cited document${docs.length === 1 ? '' : 's'}.`}
                  </p>
                </div>
              )}

              {docs.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">
                  No extracted requirements for this one — a gap in the corpus, not a statement
                  about the instrument.
                </p>
              ) : (
                docs.map((doc) => (
                  <div key={doc.refId} className="glass-panel p-3">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <h3 className="text-[12px] font-bold text-foreground">{doc.sourceName}</h3>
                      <span className="font-mono text-sim-chip text-muted-foreground">
                        {doc.refId}
                      </span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {doc.total}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-sim-chip text-muted-foreground">
                      extracted by {doc.extractionModel || 'unknown model'}
                      {doc.extractionDate ? ` · ${doc.extractionDate}` : ''} · confidence{' '}
                      {doc.confidence}
                    </p>
                    {doc.alsoCitedBy.length > 0 && (
                      <p className="mt-1 flex items-start gap-1 text-[10.5px] text-muted-foreground">
                        <Users
                          size={11}
                          className="mt-0.5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        Also cited by {doc.alsoCitedBy.join(', ')}
                      </p>
                    )}
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-semibold text-primary"
                      >
                        Source <ExternalLink size={10} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {section === 'landscape' && (
        <div className="flex flex-col gap-2.5">
          {roleReductionActive ? (
            <>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Showing the {emphasisSet.length} frameworks that matter most for your role.{' '}
                <span className="font-semibold text-foreground">
                  {complianceFrameworks.length - emphasisSet.length}
                </span>{' '}
                more are tracked and still searchable on a laptop.
              </p>
              {emphasisSet.map((fw) => (
                <Button
                  key={fw.id}
                  type="button"
                  variant="ghost"
                  onClick={() => openFramework(fw)}
                  className="glass-panel h-auto w-full flex-col items-start gap-0 whitespace-normal rounded-xl p-3 text-left"
                >
                  <h3 className="text-[12.5px] font-bold text-foreground">{fw.label}</h3>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                    {fw.bodyType.replace(/_/g, ' ')} · {fw.deadline}
                  </p>
                </Button>
              ))}
            </>
          ) : (
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              No role set — showing all {complianceFrameworks.length} tracked frameworks is a lot
              for a phone. Set your role on Home for a curated view of the ones that matter most to
              you.
            </p>
          )}
        </div>
      )}

      {section === 'records' && (
        <div className="flex flex-col gap-3">
          {records && !hasRecordList && !recordsLoaded && (
            <p className="text-[11.5px] text-muted-foreground">Loading certification records…</p>
          )}
          {hasRecordList && (
            <section aria-label="Certification records" className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-3">
                <Search size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={recordQuery}
                  onChange={(e) => setSectionParams('records', { q: e.target.value || null })}
                  placeholder="Search product, vendor or certificate #"
                  aria-label="Search certification records"
                  className="h-11 flex-1 bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5">
                {(['current', 'all'] as const).map((scope) => (
                  <Button
                    key={scope}
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setSectionParams('records', { rstatus: scope === 'all' ? 'all' : null })
                    }
                    aria-pressed={recordScope === scope}
                    className={cn(
                      'h-7 shrink-0 rounded-full border px-3 text-[11px] font-semibold',
                      recordScope === scope
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground'
                    )}
                  >
                    {scope === 'current' ? 'Current' : 'Include historical'}
                  </Button>
                ))}
              </div>
              <p className="text-[10.5px] text-muted-foreground" aria-live="polite">
                {recordMatches.length === 0
                  ? 'No records match.'
                  : recordMatches.length > RECORD_PHONE_LIMIT
                    ? `Showing the newest ${RECORD_PHONE_LIMIT} of ${recordMatches.length} — search to narrow.`
                    : `${recordMatches.length} record${recordMatches.length === 1 ? '' : 's'}.`}
              </p>
              <ul className="flex flex-col gap-1.5">
                {recordMatches.slice(0, RECORD_PHONE_LIMIT).map((r) => (
                  <li key={r.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => openRecord(r.id)}
                      className="h-auto w-full flex-col items-start gap-0.5 whitespace-normal rounded-lg border border-border bg-card p-2.5 text-left"
                    >
                      <span className="text-[12px] font-bold text-foreground">{r.productName}</span>
                      <span className="text-[10.5px] text-muted-foreground">
                        {r.vendor} · {recordTypeLabel(r.type)} #{r.id} · {r.date}
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {hasRecordList && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setGlossaryToggled(!glossaryOpen)}
              aria-expanded={glossaryOpen}
              className="h-8 justify-between rounded-lg border border-border bg-card px-3 text-[11.5px] font-semibold"
            >
              Terms used in these records ({RECORDS_GLOSSARY.length})
              <ChevronDown
                size={14}
                className={cn(
                  'text-muted-foreground transition-transform',
                  glossaryOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </Button>
          )}
          {glossaryOpen && (
            <>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                {RECORDS_GLOSSARY.length} terms that gate the rest of this tab.
              </p>
              {RECORDS_GLOSSARY.map((t) => (
                <div key={t.term} className="glass-panel p-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[12.5px] font-bold text-foreground">{t.term}</span>
                    <span className="text-[10.5px] text-muted-foreground">{t.short}</span>
                  </div>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                    {t.def}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {section === 'cswp39' && evrefParam && evrefRequirements.length === 0 && (
        <DeepLinkNotice
          kind="not-found"
          message={`No CSWP.39 evidence is extracted for the document “${evrefParam}” — it may not be in the corpus yet.`}
          onDismiss={() => setSectionParams('cswp39', { evref: null })}
        />
      )}

      {section === 'cswp39' && evrefRequirements.length > 0 && (
        <section
          aria-label="Linked evidence"
          className="glass-panel mb-3 flex flex-col gap-2 p-3.5"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                Linked evidence
              </p>
              <h2 className="text-[13px] font-bold text-foreground">
                {evrefRequirements[0].sourceName}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-mono">{evrefParam}</span> · {evrefRequirements.length}{' '}
                extracted requirement{evrefRequirements.length === 1 ? '' : 's'}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSectionParams('cswp39', { evref: null })}
              className="h-7 shrink-0 px-2 text-xs"
            >
              Close
            </Button>
          </div>
          <ul className="flex flex-col gap-1.5">
            {evrefRequirements.slice(0, EVREF_PHONE_LIMIT).map((r) => (
              <li
                key={`${r.pillar}:${r.maturityLevel}:${r.requirement}`}
                className="rounded-lg border border-border bg-card p-2.5"
              >
                <p className="text-sim-chip font-bold uppercase text-muted-foreground">
                  {r.pillar} · tier {r.maturityLevel}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-foreground">
                  {r.requirement}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-[10.5px] text-muted-foreground">
            {evrefRequirements.length > EVREF_PHONE_LIMIT
              ? `${evrefRequirements.length - EVREF_PHONE_LIMIT} more, and `
              : ''}
            the pillar × tier evidence map{' '}
            {evrefRequirements.length > EVREF_PHONE_LIMIT ? 'are' : 'is'} on a larger screen.
          </p>
        </section>
      )}

      {section === 'cswp39' && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[10.5px] text-muted-foreground">
            {CSWP39_SOURCE_METADATA.documentLabel} · published{' '}
            {CSWP39_SOURCE_METADATA.publicationDate} · data reviewed{' '}
            {CSWP39_SOURCE_METADATA.dataExtractedAt}
          </p>
          {CSWP39_STEPS.map((step) => {
            const open = openStep === step.id
            return (
              <div key={step.id} className="glass-panel overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSectionParams('cswp39', { step: open ? null : step.id })}
                  aria-expanded={open}
                  className="flex h-auto w-full items-center justify-start gap-2.5 rounded-none px-3.5 py-2.5 text-left"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {step.number}
                  </span>
                  <span className="flex-1 text-[12.5px] font-bold text-foreground">
                    {step.title}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-muted-foreground transition-transform',
                      open && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </Button>
                {open && (
                  <div className="flex flex-col gap-1.5 border-t border-border px-3.5 pb-3 pt-2.5">
                    <p className="font-mono text-sim-chip text-muted-foreground">
                      {step.sectionRef}
                    </p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {step.explainer}
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-[10.5px] leading-relaxed text-muted-foreground">
                      {step.requirements.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Progress tracking, the full Products catalogue, the For You validation Gantt, and the IR
        8477 concept graph are on a laptop.
      </p>

      <MobileFrameworkDetailSheet
        framework={detailFramework}
        onClose={closeFramework}
        onViewRequirements={jumpToRequirements}
      />
      <MobileRecordDetailSheet record={certRecord} onClose={closeRecord} />
    </div>
  )
}

/** One stacked label-over-value fact (phone layout of the desktop Field). */
function RecordFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-[11.5px] text-foreground">{children}</dd>
    </div>
  )
}

function RecordLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-primary"
    >
      {children}
      <ExternalLink size={10} className="shrink-0" aria-hidden="true" />
    </a>
  )
}

/** Same PQC wording as desktop's ComplianceDetailPopover PqcSection. */
function RecordPqcFact({ record }: { record: MobileCertRecord }) {
  const state = pqcCoverageState(record.pqcCoverage)
  if (state === 'none') return null
  if (state === 'not-read') {
    // pqcUnknownReason() (recordSemantics) inlined: it is typed to the
    // ComplianceRecord type, which sits behind the mobile import boundary.
    const sourceListsNone = record.type === 'FIPS 140-3' && !!record.cmvpDetailsFetchedAt
    return (
      <RecordFact label="PQC mechanisms">
        <span className="italic text-muted-foreground">
          {sourceListsNone
            ? 'Unknown — NIST publishes this certificate page without an Approved Algorithms list, so it does not say which algorithms the module approves.'
            : record.type === 'FIPS 140-3'
              ? "Unknown — the certificate page's Approved Algorithms list could not be read."
              : 'Unknown — the source page could not be read.'}
        </span>
      </RecordFact>
    )
  }
  const fromSt = isSecurityTargetType(record.type)
  const names = pqcNames(record.pqcCoverage)
  return (
    <RecordFact
      label={
        state === 'named'
          ? `PQC — ${pqcEvidenceLabel(record.type).toLowerCase()}`
          : 'PQC mechanisms'
      }
    >
      {typeof record.pqcCoverage === 'boolean'
        ? 'PQC indicated (no algorithm names recorded).'
        : names.length > 0
          ? names.join(', ')
          : String(record.pqcCoverage)}
      {fromSt && state === 'named' && (
        <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
          A claim in the evaluated Security Target, not a validation of PQC support.
          {record.securityTargetUrls?.[0] && (
            <>
              {' '}
              <RecordLink href={record.securityTargetUrls[0]}>Open the Security Target</RecordLink>
            </>
          )}
        </span>
      )}
    </RecordFact>
  )
}

/**
 * A `?cert=` record on a phone — the same record facts as desktop's
 * ComplianceDetailPopover (type, category, lab, level, source conflicts,
 * dates, PQC + classical algorithms, the FIPS 140-3 certificate and NIST CAVP
 * validation details, documents, official source), stacked for a narrow
 * screen and formatted with the same recordSemantics helpers. Dropped vs.
 * desktop: Ask/Endorse/Flag (desktop power-user actions, as on the framework
 * sheet); Share is the sheet's own.
 */
function MobileRecordDetailSheet({
  record,
  onClose,
}: {
  record: MobileCertRecord | null
  onClose: () => void
}) {
  const observed = formatIsoDate(record?.cmvpDetailsFetchedAt)
  const sunset = formatIsoDate(record?.sunsetDate ?? undefined)
  const archived = formatIsoDate(record?.ccArchivedDate ?? undefined)
  const firstValidated = formatIsoDate(record?.cavpFirstValidated)
  const algos = record?.cmvpApprovedAlgorithms ?? []
  const envs = record?.operationalEnvironments ?? []
  const caps = record?.cavpCapabilities ?? []
  const cavpProductUrl = record?.cavpProductUrl || record?.link
  const docs = record
    ? [
        ...(record.certificationReportUrls ?? []).map((url, i) => ({
          url,
          name: `Certification Report ${i + 1}`,
        })),
        ...(record.securityTargetUrls ?? []).map((url, i) => ({
          url,
          name: `Security Target ${i + 1}`,
        })),
        ...(record.additionalDocuments ?? []),
      ]
    : []
  return (
    <MobileSheet
      open={!!record}
      onClose={onClose}
      title={record?.productName}
      large
      shareUrl={record ? `/compliance?cert=${encodeURIComponent(record.id)}` : undefined}
      testId="compliance-record-detail-sheet"
    >
      {record && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                statusBadgeClass(record.status)
              )}
            >
              {record.status || 'No status'}
            </span>
            <span className="font-mono text-[10.5px] text-muted-foreground">{record.id}</span>
          </div>
          {record.vendor && <p className="text-[11.5px] text-muted-foreground">{record.vendor}</p>}

          <dl className="flex flex-col gap-2.5">
            <RecordFact label="Type">{recordTypeDescription(record.type)}</RecordFact>
            {record.productCategory && (
              <RecordFact label="Category">{record.productCategory}</RecordFact>
            )}
            {record.lab && <RecordFact label="Evaluation lab">{record.lab}</RecordFact>}
            {record.certificationLevel && (
              <RecordFact label="Certification level">{record.certificationLevel}</RecordFact>
            )}
            <RecordFact label="Certification date">{record.date}</RecordFact>
            {archived && <RecordFact label="Archived">{archived}</RecordFact>}
            <RecordFact label="Source">{record.source}</RecordFact>
            <RecordPqcFact record={record} />
            {record.classicalAlgorithms && (
              <RecordFact label="Classical algorithms">{record.classicalAlgorithms}</RecordFact>
            )}
          </dl>

          {record.sourceConflicts?.map((conflict) => (
            <div
              key={conflict.field}
              className="rounded-lg border border-border bg-status-warning/10 p-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-status-warning">
                Official sources disagree
              </p>
              <ul className="mt-1 flex flex-col gap-1 text-[11px]">
                {conflict.values.map((v) => (
                  <li key={v.source} className="break-words text-foreground">
                    <span className="font-semibold">{v.value}</span>
                    <span className="text-muted-foreground"> — </span>
                    {v.url ? (
                      <RecordLink href={v.url}>{v.source}</RecordLink>
                    ) : (
                      <span className="text-muted-foreground">{v.source}</span>
                    )}
                  </li>
                ))}
              </ul>
              {conflict.note && (
                <p className="mt-1 text-[10.5px] text-muted-foreground">{conflict.note}</p>
              )}
            </div>
          ))}

          {record.type === 'FIPS 140-3' && (
            <section
              aria-label="NIST CMVP certificate"
              className="flex flex-col gap-2.5 border-t border-border pt-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                NIST CMVP certificate
              </p>
              <dl className="flex flex-col gap-2.5">
                {record.cmvpStandard && (
                  <RecordFact label="Standard">{record.cmvpStandard}</RecordFact>
                )}
                <RecordFact label="Status">
                  {record.cmvpStatus || record.status || 'Not stated'}
                  {observed && (
                    <span className="block text-[10.5px] text-muted-foreground">
                      status observed {observed}
                    </span>
                  )}
                </RecordFact>
                {record.cmvpHistoricalReason && (
                  <RecordFact label="Historical reason">{record.cmvpHistoricalReason}</RecordFact>
                )}
                {sunset && <RecordFact label="Sunset date">{sunset}</RecordFact>}
                {record.overallLevel != null && (
                  <RecordFact label="Overall level">{String(record.overallLevel)}</RecordFact>
                )}
                {record.moduleType && (
                  <RecordFact label="Module type">{record.moduleType}</RecordFact>
                )}
                {record.embodiment && (
                  <RecordFact label="Embodiment">{record.embodiment}</RecordFact>
                )}
                {record.caveat && <RecordFact label="Caveat">{record.caveat}</RecordFact>}
                {envs.length > 0 && (
                  <RecordFact label="Operational environments">
                    <ul className="list-disc pl-4">
                      {envs.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </RecordFact>
                )}
                {algos.length > 0 && (
                  <RecordFact label="Approved Algorithms (certificate page)">
                    <ul className="flex flex-col gap-0.5">
                      {algos.map((a, i) => (
                        <li key={`${a.name}-${i}`} className="flex flex-wrap items-baseline gap-1">
                          <span>{a.name}</span>
                          {(a.cavpRefs ?? []).map((ref) => (
                            <RecordLink key={ref} href={cavpValidationUrl(ref)}>
                              <span className="font-mono">{ref}</span>
                            </RecordLink>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </RecordFact>
                )}
              </dl>
            </section>
          )}

          {record.type === 'ACVP' && (
            <section
              aria-label="NIST CAVP algorithm validation"
              className="flex flex-col gap-2.5 border-t border-border pt-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                NIST CAVP algorithm validation
              </p>
              <dl className="flex flex-col gap-2.5">
                {firstValidated && (
                  <RecordFact label="First validated">{firstValidated}</RecordFact>
                )}
                {record.cavpImplementationVersion && (
                  <RecordFact label="Implementation version">
                    {record.cavpImplementationVersion}
                  </RecordFact>
                )}
                {record.cavpImplementationType && (
                  <RecordFact label="Implementation type">
                    {record.cavpImplementationType}
                  </RecordFact>
                )}
              </dl>
              {caps.length > 0 && (
                <ul aria-label="Capabilities" className="flex flex-col gap-1.5">
                  {caps.map((c, i) => (
                    <li
                      key={`${c.algorithm}-${i}`}
                      className="rounded-lg border border-border bg-card p-2.5 text-[11px]"
                    >
                      <p className="font-bold text-foreground">{c.algorithm}</p>
                      <p className="text-muted-foreground">
                        Parameter sets: {(c.parameterSets ?? []).join(', ') || '—'}
                      </p>
                      <p className="text-muted-foreground">
                        Functions: {(c.functions ?? []).join(', ') || '—'}
                      </p>
                      <p className="text-muted-foreground">
                        Operating environment: {c.operatingEnvironment || '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {cavpProductUrl && (
                <p className="text-[11px]">
                  <RecordLink href={cavpProductUrl}>NIST CAVP product page</RecordLink>
                </p>
              )}
            </section>
          )}

          {docs.length > 0 && (
            <section
              aria-label="Documentation"
              className="flex flex-col gap-1.5 border-t border-border pt-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Documentation
              </p>
              {docs.map((d, i) => (
                <a
                  key={`${d.url}-${i}`}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-[11px] text-primary"
                >
                  <FileText size={13} className="shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{d.name}</span>
                  <ExternalLink size={10} className="shrink-0" aria-hidden="true" />
                </a>
              ))}
            </section>
          )}

          {record.link && (
            <p className="border-t border-border pt-2.5 text-[11.5px]">
              <RecordLink href={record.link}>
                {record.link.includes('?expand#')
                  ? 'View Product Details'
                  : record.type === 'FIPS 140-3'
                    ? 'View the NIST CMVP certificate page'
                    : record.type === 'ACVP'
                      ? 'View the NIST CAVP validation page'
                      : `View on ${safeHostname(record.link)}`}
              </RecordLink>
            </p>
          )}
        </div>
      )}
    </MobileSheet>
  )
}

/**
 * "About this standard" — what the user could not get to before (2026-08-24
 * report: "compliance page does not allow the user to access to details
 * about the compliance standards" / "i cannot access to the acvp records ;
 * fips records nor cc records" led to this + the Migrate cert sheet).
 * Tapping a Rules & Standards row used to jump straight to a filtered
 * Requirements list; tapping a Landscape tile did nothing at all. Both now
 * open this sheet first.
 *
 * Every derived field (chain/phases/dossier) comes from buildDrawerDetail —
 * the exact same pure model the desktop redesign's ComplianceDetailDrawer
 * renders from, so this can never drift into a different, invented story
 * about a framework. Deliberately dropped vs. the desktop drawer: the Learn
 * backlink (mobile has its own Learn tab), Track/Endorse/Flag actions, the
 * CSWP.39 crosswalk button (mobile already has a CSWP.39 section), and the
 * revision drilldown — desktop power-user affordances, not "what is this
 * standard" essentials.
 */
function MobileFrameworkDetailSheet({
  framework,
  onClose,
  onViewRequirements,
}: {
  framework: ComplianceFramework | null
  onClose: () => void
  onViewRequirements: (frameworkId: string) => void
}) {
  const detail = useMemo(
    () => (framework ? buildDrawerDetail(framework, pillarForBodyType(framework.bodyType)) : null),
    [framework]
  )

  return (
    <MobileSheet
      open={!!framework}
      onClose={onClose}
      title={framework?.label}
      large
      shareUrl={framework ? `/compliance?framework=${encodeURIComponent(framework.id)}` : undefined}
      testId="compliance-framework-detail-sheet"
    >
      {framework && detail && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={pillClasses('muted')}>{detail.pillarLabel}</span>
            <span className={pillClasses(detail.pqcTone)}>{detail.pqcLabel}</span>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Globe size={12} className="shrink-0" aria-hidden="true" />
            {detail.juris}
          </p>

          {framework.description && (
            <p className="text-[12px] leading-relaxed text-foreground/90">
              {framework.description}
            </p>
          )}

          {(framework.website || framework.enforcementBody || framework.lastVerified) && (
            <div className="rounded-lg border border-border bg-muted/20 p-2.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                <ShieldCheck size={12} aria-hidden="true" />
                Source &amp; trust
              </p>
              <dl className="flex flex-col gap-1 text-[11px]">
                {framework.website && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-muted-foreground">Official source</dt>
                    <dd className="min-w-0 text-right">
                      <a
                        href={framework.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary"
                      >
                        <span className="truncate">{safeHostname(framework.website)}</span>
                        <ExternalLink size={10} className="shrink-0" aria-hidden="true" />
                      </a>
                    </dd>
                  </div>
                )}
                {framework.enforcementBody && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-muted-foreground">Enforcement body</dt>
                    <dd className="min-w-0 text-right font-semibold text-foreground">
                      {framework.enforcementBody}
                    </dd>
                  </div>
                )}
                {framework.lastVerified && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-muted-foreground">Last verified</dt>
                    <dd className="min-w-0 text-right font-semibold text-foreground">
                      {framework.lastVerified}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {detail.chain.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Traceability
              </p>
              <div className="flex flex-col gap-1">
                {detail.chain.map((node, i) => (
                  <div
                    key={`${node.kind}-${i}`}
                    className={cn(
                      'rounded-lg border p-2',
                      TONES[node.tone].border,
                      TONES[node.tone].softBg
                    )}
                  >
                    <p
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wide',
                        TONES[node.tone].text
                      )}
                    >
                      {node.kind}
                    </p>
                    <p className="text-[12px] font-bold text-foreground">{node.value}</p>
                    {node.sub && <p className="text-[10px] text-muted-foreground">{node.sub}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.phases.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Deadline phases
              </p>
              <div className="flex items-start justify-between gap-1">
                {detail.phases.map((ph, i) => {
                  const tone =
                    ph.state === 'done'
                      ? TONES.success
                      : ph.state === 'active'
                        ? TONES.warning
                        : TONES.muted
                  return (
                    <div
                      key={`${ph.year}-${i}`}
                      className="flex flex-1 flex-col items-center gap-1 text-center"
                    >
                      <span
                        className={cn('h-2 w-2 rounded-full', tone.solidBg)}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-[10px] text-foreground">{ph.year}</span>
                      <span className="text-[10px] leading-tight text-muted-foreground">
                        {ph.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {detail.dossierItems.length > 0 && (
            <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-status-success">
                <ListChecks size={12} aria-hidden="true" />
                What an auditor checks
              </p>
              <ul className="flex flex-col gap-1">
                {detail.dossierItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/90">
                    <span
                      className="mt-1 h-1 w-1 shrink-0 rounded-sm bg-status-success"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewRequirements(framework.id)}
            className="h-9 justify-between whitespace-normal text-[11.5px]"
          >
            View extracted requirements
            <ArrowRight size={13} aria-hidden="true" />
          </Button>
        </div>
      )}
    </MobileSheet>
  )
}
