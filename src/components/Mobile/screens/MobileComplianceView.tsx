// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useApplicability } from '@/hooks/useApplicability'
import { usePersonaStore } from '@/store/usePersonaStore'
import { complianceFrameworks, type PQCRequirement } from '@/data/complianceData'
import { isComplianceFrameworkEmphasized } from '@/data/personaConfig'
import { TIER_META, type ApplicabilityTier } from '@/utils/applicabilityEngine'
import {
  buildObligations,
  groupObligations,
  COLLAPSED_BY_DEFAULT,
  type ObligationRow,
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
const PQC_LABEL: Record<PQCRequirement, string> = {
  yes: 'Mandated',
  partial: 'Partial',
  expected: 'Expected',
  guidance: 'Guidance',
  no: 'None',
}

// Same 6 terms RecordsGlossaryStrip.tsx's own TERMS array carries — real
// definitions replicated inline (a static 6-entry literal, matching the
// precedent set for other small desktop literals this session) rather than
// importing a rendering component into the Mobile boundary.
const RECORDS_GLOSSARY = [
  {
    term: 'FIPS 140-3',
    short: 'module validation',
    def: 'NIST cryptographic module validation standard (supersedes 140-2). CMVP certifies the whole module. Required for US federal procurement.',
  },
  {
    term: 'ACVP',
    short: 'algorithm testing',
    def: 'Automated Cryptographic Validation Protocol — CAVP algorithm-level testing. Prerequisite for a FIPS 140-3 module cert.',
  },
  {
    term: 'CC',
    short: 'product evaluation',
    def: 'Common Criteria (ISO/IEC 15408). Issued under national schemes, mutually recognised under CCRA up to EAL2/EAL4.',
  },
  {
    term: 'EUCC',
    short: 'EU CC scheme',
    def: 'European Union Common Criteria scheme, operative 2024 under the Cybersecurity Act. Supersedes SOG-IS inside the EU.',
  },
  {
    term: 'CNSA 2.0',
    short: 'NSS mandate',
    def: 'NSA Commercial National Security Algorithm suite v2.0 — binding PQC requirements for US National Security Systems, full transition by 2035.',
  },
  {
    term: 'HNDL',
    short: 'harvest-now-decrypt-later',
    def: 'Adversaries collect ciphertext today and decrypt once a quantum computer exists — the threat driving near-term migration of long-lived data.',
  },
]

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

  const openObligation = (row: ObligationRow) => {
    setRequirementsFrameworkId(row.framework.id)
    setSection('requirements')
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
                          onClick={() => openObligation(row)}
                          className="h-auto flex-col items-start gap-1 rounded-lg border border-border bg-card p-2.5 text-left"
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
                      <span className="font-mono text-[9.5px] text-muted-foreground">
                        {doc.refId}
                      </span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {doc.total}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[9.5px] text-muted-foreground">
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
                <div key={fw.id} className="glass-panel p-3">
                  <h3 className="text-[12.5px] font-bold text-foreground">{fw.label}</h3>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                    {fw.bodyType.replace(/_/g, ' ')} · {fw.deadline}
                  </p>
                </div>
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
                    <p className="font-mono text-[9.5px] text-muted-foreground">
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
    </div>
  )
}
