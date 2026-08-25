// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Globe,
  ListChecks,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useApplicability } from '@/hooks/useApplicability'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
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
  totalFor,
} from '@/components/Compliance/requirements/requirementsModel'
import { CSWP39_STEPS, CSWP39_SOURCE_METADATA } from '@/components/Compliance/cswp39Data'
import { buildDrawerDetail, pillarForBodyType } from '@/components/Compliance/redesign/pillarModel'
import { pillClasses, TONES } from '@/components/Compliance/redesign/tones'
import { MobileSheet } from '../primitives/Sheet'

/** Never let a malformed URL crash the sheet — falls back to the raw string. */
function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

type Section = 'obligations' | 'requirements' | 'landscape' | 'records' | 'cswp39'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'obligations', label: 'Rules & Standards' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'records', label: 'Records' },
  { id: 'cswp39', label: 'CSWP.39' },
]

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
export function MobileComplianceView() {
  const [section, setSection] = useState<Section>('obligations')
  const [requirementsFrameworkId, setRequirementsFrameworkId] = useState<string | null>(null)
  const [expandedTier, setExpandedTier] = useState<Record<string, boolean>>({})
  const [openStep, setOpenStep] = useState<string | null>(null)
  const [detailFramework, setDetailFramework] = useState<ComplianceFramework | null>(null)

  const persona = usePersonaStore((s) => s.selectedPersona)
  const { profile, isEmpty } = useApplicability()

  const rows = useMemo(() => buildObligations(profile), [profile])
  const groups = useMemo(
    () => groupObligations(rows).map((g) => ({ ...g, rows: applyRoleOrder(g.rows, persona) })),
    [rows, persona]
  )
  const framing = roleFramingFor(persona)

  const index = useMemo(() => citationIndex(rows.map((r) => r.framework)), [rows])
  const selectedRow =
    rows.find((r) => r.framework.id === requirementsFrameworkId) ?? rows[0] ?? null
  const docs = useMemo(
    () => (selectedRow ? documentsFor(selectedRow.framework, index) : []),
    [selectedRow, index]
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
    setRequirementsFrameworkId(frameworkId)
    setSection('requirements')
    setDetailFramework(null)
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

      {isEmpty && (section === 'obligations' || section === 'requirements') && (
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
                          onClick={() => setDetailFramework(row.framework)}
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

      {section === 'requirements' && !isEmpty && (
        <div className="flex flex-col gap-3">
          {rows.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground">Nothing in scope yet.</p>
          ) : (
            <>
              <div className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
                {rows.map((r) => (
                  <Button
                    key={r.framework.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setRequirementsFrameworkId(r.framework.id)}
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
                  onClick={() => setDetailFramework(fw)}
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
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Six terms that gate the rest of this tab.
          </p>
          {RECORDS_GLOSSARY.map((t) => (
            <div key={t.term} className="glass-panel p-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12.5px] font-bold text-foreground">{t.term}</span>
                <span className="text-[10.5px] text-muted-foreground">{t.short}</span>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{t.def}</p>
            </div>
          ))}
        </div>
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
                  onClick={() => setOpenStep((cur) => (cur === step.id ? null : step.id))}
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
        onClose={() => setDetailFramework(null)}
        onViewRequirements={jumpToRequirements}
      />
    </div>
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
