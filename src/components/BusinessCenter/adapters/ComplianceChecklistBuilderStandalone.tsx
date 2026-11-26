// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Per-framework PQC compliance checklist. Net-new artifact builder for the
 * `compliance-checklist` artifact type — distinct from `audit-checklist`
 * (which is a generic readiness checklist) by being driven by the user's
 * starred frameworks on /compliance plus their assessment context.
 *
 * Pre-fill sources (all editable post-seed):
 * - Compliance: `myFrameworks` from `useComplianceSelectionStore` → one section
 *   per framework, with description + deadline pre-filled
 * - Assess: `complianceImpacts` from the assessment result → flags
 *   PQC-required frameworks, pre-checks "Identified PQC dependency" for those
 * - Persona/Assess: `industry` + `country` → Cross-cutting context section
 */
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Check, ExternalLink, Plus } from 'lucide-react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { complianceFrameworks, type PQCRequirement } from '@/data/complianceData'
import { matchesIndustry } from '@/data/industryMatch'
import { EU_MEMBER_NAMES } from '@/data/jurisdictionsData'
import { Button } from '@/components/ui/button'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection, ArtifactField } from '@/components/PKILearning/common/executive'
import type { ArtifactFormData } from '@/components/PKILearning/common/executive/ArtifactBuilder'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { rowsToSpreadsheetCsv } from '@/services/export/csvExport'
import { STANDARD_CHECKLIST_ITEMS, type ChecklistItem } from './complianceChecklistItems'

/** Flatten each item's description + reference into the option label — the
 *  generic ArtifactBuilder checklist renderer only displays `option.label`.
 *  Mirrors AuditReadinessChecklist's `toOptions`. */
function toChecklistOptions(items: ChecklistItem[]): { value: string; label: string }[] {
  return items.map((i) => ({
    value: i.value,
    label: `${i.label} — ${i.description} [${i.reference}]`,
  }))
}

function frameworkSectionId(id: string): string {
  return `fw-${id}`
}

function buildSections(opts: {
  frameworks: typeof complianceFrameworks
  pqcRequiredIds: Set<string>
  industry: string
  country: string
}): ArtifactSection[] {
  const { frameworks, pqcRequiredIds, industry, country } = opts

  const contextField: ArtifactField = {
    id: 'context-notes',
    label: 'Scope & context',
    type: 'textarea',
    placeholder: 'Programs in scope, business units, exclusions…',
    defaultValue: [
      industry ? `Industry: ${industry}` : '',
      country ? `Primary jurisdiction: ${country}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }

  const contextSection: ArtifactSection = {
    id: 'context',
    title: 'Scope & context',
    description: 'Identify what is in scope for this compliance checklist.',
    fields: [
      {
        id: 'industry',
        label: 'Industry',
        type: 'text',
        defaultValue: industry || '',
        placeholder: 'e.g., Financial Services',
      },
      {
        id: 'country',
        label: 'Primary jurisdiction',
        type: 'text',
        defaultValue: country || '',
        placeholder: 'e.g., United States',
      },
      contextField,
    ],
  }

  if (frameworks.length === 0) {
    return [contextSection]
  }

  const fwSections: ArtifactSection[] = frameworks.map((fw) => {
    const isPqcRequired = pqcRequiredIds.has(fw.id)
    const checklistField: ArtifactField = {
      id: 'controls',
      label: 'Controls',
      type: 'checklist',
      options: toChecklistOptions(STANDARD_CHECKLIST_ITEMS),
      defaultValue: isPqcRequired ? ['pqc-dependency'] : [],
    }
    const ownerField: ArtifactField = {
      id: 'owner',
      label: 'Compliance owner',
      type: 'text',
      placeholder: 'Name / role',
      defaultValue: '',
    }
    const deadlineField: ArtifactField = {
      id: 'deadline',
      label: 'Framework deadline',
      type: 'text',
      defaultValue: fw.deadline || '',
    }
    const notesField: ArtifactField = {
      id: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Status, evidence pointers, exceptions…',
      defaultValue: fw.notes || '',
    }
    const description = [
      fw.description,
      isPqcRequired ? '⚠️ PQC required — flagged from your assessment.' : null,
      fw.enforcementBody ? `Enforced by: ${fw.enforcementBody}` : null,
    ]
      .filter(Boolean)
      .join(' ')

    return {
      id: frameworkSectionId(fw.id),
      title: fw.label,
      description,
      fields: [deadlineField, ownerField, checklistField, notesField],
    }
  })

  return [contextSection, ...fwSections]
}

function renderPreview(
  data: Record<string, Record<string, string | string[]>>,
  frameworks: typeof complianceFrameworks
): string {
  const lines: string[] = []
  lines.push('# PQC Compliance Checklist\n')
  lines.push(
    '_Educational planning checklist — checked items record planning scope for sample or learner-supplied context; they do not verify a deployed system, establish compliance, or replace production GRC/attestation records._\n'
  )

  const ctx = data.context || {}
  const industry = (ctx.industry as string) || ''
  const country = (ctx.country as string) || ''
  const ctxNotes = (ctx['context-notes'] as string) || ''
  if (industry || country) {
    lines.push(
      `**Scope:** ${[industry, country].filter(Boolean).join(' · ')}${ctxNotes ? `\n\n${ctxNotes}` : ''}\n`
    )
  } else if (ctxNotes) {
    lines.push(`${ctxNotes}\n`)
  }

  for (const fw of frameworks) {
    const sec = data[frameworkSectionId(fw.id)]
    if (!sec) continue
    const controls = Array.isArray(sec.controls) ? sec.controls : []
    const owner = (sec.owner as string) || '—'
    const deadline = (sec.deadline as string) || fw.deadline || '—'
    const notes = (sec.notes as string) || ''

    lines.push(`## ${fw.label}\n`)
    lines.push(`- **Deadline:** ${deadline}`)
    lines.push(`- **Owner:** ${owner}`)
    lines.push('- **Controls:**')
    for (const item of STANDARD_CHECKLIST_ITEMS) {
      const checked = controls.includes(item.value) ? '[x]' : '[ ]'
      lines.push(`  - ${checked} **${item.label}** — ${item.description} _[${item.reference}]_`)
    }
    if (notes) lines.push(`\n${notes}`)
    lines.push('')
  }

  lines.push('---\n')
  lines.push(
    '*Aligned to NIST CSWP 39 §5.1 - Cryptographic Standards, Regulations, and Mandates. https://doi.org/10.6028/NIST.CSWP.39-upd1*\n'
  )

  return lines.join('\n')
}

/** Structured CSV mirror of `renderPreview` — one row per framework × control,
 *  built with `rowsToSpreadsheetCsv` so `.csv` opens as real spreadsheet rows. Mirrors
 *  AuditReadinessChecklist's `renderAuditCsv` / ComplianceTimelineBuilder's
 *  section-labelled CSV export. */
function renderCsv(
  data: Record<string, Record<string, string | string[]>>,
  frameworks: typeof complianceFrameworks
): string {
  const rows: (string | number)[][] = []
  rows.push(['PQC Compliance Checklist'])
  rows.push([
    'Educational planning checklist — checked items do not verify a deployed system or replace production GRC records.',
  ])
  rows.push(['Framework', 'Deadline', 'Owner', 'Control', 'Checked', 'Reference'])
  for (const fw of frameworks) {
    const sec = data[frameworkSectionId(fw.id)]
    if (!sec) continue
    const controls = Array.isArray(sec.controls) ? sec.controls : []
    const owner = (sec.owner as string) || ''
    const deadline = (sec.deadline as string) || fw.deadline || ''
    for (const item of STANDARD_CHECKLIST_ITEMS) {
      rows.push([
        fw.label,
        deadline,
        owner,
        item.label,
        controls.includes(item.value) ? 'Yes' : 'No',
        item.reference,
      ])
    }
  }
  return rowsToSpreadsheetCsv(rows)
}

// ---------------------------------------------------------------------------
// On-page framework picker (works without starring anything on /compliance)
// ---------------------------------------------------------------------------

type Framework = (typeof complianceFrameworks)[number]

/** Fictional sample scope for a cold start: a US federal programme. Every id is a
 *  compliance-catalogue row; ids that leave the catalogue are dropped at runtime. */
const SAMPLE_CHECKLIST_CONTEXT = {
  industry: 'Government & Defense',
  country: 'United States',
  frameworkIds: ['CNSA-2', 'OMB-M-26-15', 'NIST-IR-8547'],
} as const

const PQC_REQUIREMENT_ORDER: Record<PQCRequirement, number> = {
  yes: 0,
  expected: 1,
  partial: 2,
  guidance: 3,
  no: 4,
  unknown: 5,
}

const PQC_REQUIREMENT_LABEL: Record<PQCRequirement, string> = {
  yes: 'PQC required',
  expected: 'PQC expected',
  partial: 'PQC partial',
  guidance: 'PQC guidance',
  no: 'no PQC clause',
  unknown: 'PQC unknown',
}

const INDUSTRY_OPTIONS: string[] = (() => {
  const counts = new Map<string, number>()
  for (const fw of complianceFrameworks)
    for (const i of fw.industries) counts.set(i, (counts.get(i) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([i]) => i)
})()

const COUNTRY_OPTIONS: string[] = [
  ...new Set(complianceFrameworks.flatMap((fw) => fw.countries)),
].sort((a, b) => a.localeCompare(b))

/** Frameworks the catalogue lists for this industry and jurisdiction. Either filter
 *  may be blank. A country also picks up its EU-level frameworks; "Global" rows only
 *  appear when Global itself is chosen, so a country list is not swamped by them. */
function frameworksForScope(industry: string, country: string): Framework[] {
  if (!industry && !country) return []
  const isEu = EU_MEMBER_NAMES.has(country)
  return complianceFrameworks
    .filter((fw) => !industry || fw.industries.some((i) => matchesIndustry(i, industry)))
    .filter(
      (fw) =>
        !country ||
        fw.countries.includes(country) ||
        (isEu && fw.countries.includes('European Union'))
    )
    .sort(
      (a, b) =>
        PQC_REQUIREMENT_ORDER[a.pqcRequirement] - PQC_REQUIREMENT_ORDER[b.pqcRequirement] ||
        a.label.localeCompare(b.label)
    )
}

/** The saved values of one framework's checklist section, seeded from its defaults. */
function sectionDefaults(section: ArtifactSection): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  for (const field of section.fields)
    out[field.id] = field.defaultValue ?? (field.type === 'checklist' ? [] : '')
  return out
}

function frameworkIdsInSaved(saved: ArtifactFormData | undefined): string[] {
  if (!saved) return []
  const known = new Set(complianceFrameworks.map((fw) => fw.id))
  return Object.keys(saved)
    .filter((k) => k.startsWith('fw-'))
    .map((k) => k.slice(3))
    .filter((id) => known.has(id))
}

function initialDraft(sections: ArtifactSection[], saved: ArtifactFormData | undefined) {
  const draft: ArtifactFormData = {}
  for (const section of sections) {
    const defaults = sectionDefaults(section)
    draft[section.id] = {}
    for (const field of section.fields) {
      draft[section.id][field.id] = saved?.[section.id]?.[field.id] ?? defaults[field.id]
    }
  }
  return draft
}

export const ComplianceChecklistBuilderStandalone: React.FC = () => {
  const { myFrameworks, industry, country, assessmentResult } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const navigate = useNavigate()
  const [seedCleared, setSeedCleared] = React.useState(false)
  // Read half of the autosave pair — without it the checklist would save on
  // every keystroke and still open blank on the next visit. (WS6.)
  const savedFormData = useSavedArtifactInputs<ArtifactFormData>('compliance-checklist')

  const trackedFrameworks = useMemo(() => {
    if (myFrameworks.length === 0) return []
    const set = new Set(myFrameworks)
    return complianceFrameworks.filter((fw) => set.has(fw.id))
  }, [myFrameworks])

  // Frameworks added on this page. They live in this checklist only (the saved
  // draft keeps their sections), never in the /compliance "My Frameworks" list.
  const [pageFrameworkIds, setPageFrameworkIds] = React.useState<string[]>(() => {
    const starred = new Set(myFrameworks)
    return frameworkIdsInSaved(savedFormData).filter((id) => !starred.has(id))
  })

  const activeFrameworks = useMemo(() => {
    const ids = new Set<string>(seedCleared ? [] : trackedFrameworks.map((f) => f.id))
    for (const id of pageFrameworkIds) ids.add(id)
    return complianceFrameworks.filter((fw) => ids.has(fw.id))
  }, [seedCleared, trackedFrameworks, pageFrameworkIds])

  const pqcRequiredIds = useMemo(() => {
    const ids = new Set<string>()
    const impacts = assessmentResult?.complianceImpacts ?? []
    for (const imp of impacts) {
      if (!imp.requiresPQC) continue
      const fw = complianceFrameworks.find(
        (f) => f.label === imp.framework || f.id === imp.framework
      )
      if (fw) ids.add(fw.id)
    }
    return ids
  }, [assessmentResult])

  const sections = useMemo(
    () =>
      buildSections({
        frameworks: activeFrameworks,
        pqcRequiredIds: seedCleared ? new Set<string>() : pqcRequiredIds,
        industry: seedCleared ? '' : industry,
        country: seedCleared ? '' : country,
      }),
    [activeFrameworks, pqcRequiredIds, industry, country, seedCleared]
  )

  // Caller-owned draft, so adding or removing a framework never remounts the
  // builder and never drops what the learner already typed.
  const [draft, setDraft] = React.useState<ArtifactFormData>(() =>
    initialDraft(sections, savedFormData)
  )
  // Seed the section of any framework that appears (starred elsewhere, or added
  // here) without touching existing answers.
  React.useEffect(() => {
    setDraft((prev) => {
      let next: ArtifactFormData | null = null
      for (const section of sections) {
        if (prev[section.id]) continue
        next = next ?? { ...prev }
        next[section.id] = sectionDefaults(section)
      }
      return next ?? prev
    })
  }, [sections])

  // Picker state: defaults to the learner's own context.
  const [pickIndustry, setPickIndustry] = React.useState(industry || '')
  const [pickCountry, setPickCountry] = React.useState(country || '')
  const [showAllMatches, setShowAllMatches] = React.useState(false)
  const matches = useMemo(
    () => frameworksForScope(pickIndustry, pickCountry),
    [pickIndustry, pickCountry]
  )
  const visibleMatches = showAllMatches ? matches : matches.slice(0, 12)
  const activeIds = useMemo(() => new Set(activeFrameworks.map((f) => f.id)), [activeFrameworks])

  /** Fill the Scope & context answers from the picker when they are still blank. */
  const fillContextIfBlank = (nextIndustry: string, nextCountry: string) => {
    setDraft((prev) => {
      const ctx = prev.context ?? {}
      const fill: Record<string, string> = {}
      if (nextIndustry && !(ctx.industry as string)) fill.industry = nextIndustry
      if (nextCountry && !(ctx.country as string)) fill.country = nextCountry
      return Object.keys(fill).length ? { ...prev, context: { ...ctx, ...fill } } : prev
    })
  }

  const addPageFrameworks = (ids: string[]) => {
    setPageFrameworkIds((prev) => [
      ...new Set([...prev, ...ids.filter((id) => !activeIds.has(id))]),
    ])
  }
  const removePageFramework = (id: string) => {
    setPageFrameworkIds((prev) => prev.filter((x) => x !== id))
    setDraft((prev) => {
      const next = { ...prev }
      delete next[frameworkSectionId(id)]
      return next
    })
  }

  const loadSample = () => {
    const known = new Set(complianceFrameworks.map((fw) => fw.id))
    setPickIndustry(SAMPLE_CHECKLIST_CONTEXT.industry)
    setPickCountry(SAMPLE_CHECKLIST_CONTEXT.country)
    fillContextIfBlank(SAMPLE_CHECKLIST_CONTEXT.industry, SAMPLE_CHECKLIST_CONTEXT.country)
    addPageFrameworks(SAMPLE_CHECKLIST_CONTEXT.frameworkIds.filter((id) => known.has(id)))
  }

  // Clearing the seed removes what came from elsewhere: the starred frameworks'
  // sections, and industry/country while they still equal the seeded values.
  // The learner's own notes and any value they overwrote are kept.
  const clearSeed = () => {
    setSeedCleared(true)
    const pageIds = new Set(pageFrameworkIds)
    setDraft((prev) => {
      const kept = Object.entries(prev).filter(
        ([key]) => key.startsWith('fw-') && pageIds.has(key.slice(3))
      )
      const ctx = prev.context ?? {}
      const context = { ...ctx }
      if (industry && ctx.industry === industry) context.industry = ''
      if (country && ctx.country === country) context.country = ''
      return { ...Object.fromEntries(kept), context }
    })
  }

  const sources: string[] = []
  if (!seedCleared) {
    if (industry) sources.push(`industry (${industry})`)
    if (country) sources.push(`country (${country})`)
    if (trackedFrameworks.length > 0) {
      sources.push(
        `${trackedFrameworks.length} framework${trackedFrameworks.length !== 1 ? 's' : ''} from /compliance`
      )
    }
    if (pqcRequiredIds.size > 0) {
      sources.push(`${pqcRequiredIds.size} PQC-required from assessment`)
    }
  }

  const handleExport = (data: ArtifactFormData) => {
    const markdown = renderPreview(data, activeFrameworks)
    addExecutiveDocument({
      id: `compliance-checklist-${Date.now()}`,
      type: 'compliance-checklist',
      title: 'PQC Compliance Checklist',
      data: markdown,
      inputs: data,
      createdAt: Date.now(),
      moduleId: 'compliance-strategy',
    })
  }

  const previewRenderer = React.useCallback(
    (data: ArtifactFormData) => renderPreview(data, activeFrameworks),
    [activeFrameworks]
  )

  const csvRenderer = React.useCallback(
    (data: ArtifactFormData) => renderCsv(data, activeFrameworks),
    [activeFrameworks]
  )

  const controlledForm = useMemo(
    () => ({
      value: draft,
      onChange: (update: (previous: ArtifactFormData) => ArtifactFormData) => setDraft(update),
    }),
    [draft]
  )

  const hasFrameworks = activeFrameworks.length > 0
  const starredIds = new Set(seedCleared ? [] : trackedFrameworks.map((f) => f.id))

  return (
    <div className="space-y-4">
      {sources.length > 0 && (
        <PreFilledBanner
          summary={`Seeded from ${sources.join(' + ')}.${
            trackedFrameworks.length > 0
              ? " Clear also removes the answers in the starred frameworks' sections."
              : ''
          }`}
          onClear={clearSeed}
        />
      )}

      <section
        className="glass-panel bg-card backdrop-blur-none border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] p-4 space-y-3"
        aria-labelledby="cc-add-frameworks"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="cc-add-frameworks" className="text-sm font-semibold font-display text-heading">
            Add frameworks to this checklist
          </h2>
          <span className="text-xs text-muted-foreground">
            ({activeFrameworks.length} in checklist)
          </span>
          {!hasFrameworks && (
            <Button variant="outline" size="sm" className="ml-auto" onClick={loadSample}>
              Load sample frameworks
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Pick an industry and a primary jurisdiction to list the frameworks the compliance
          catalogue records for them, then add the ones in scope. Frameworks added here stay in this
          checklist; frameworks starred on /compliance appear automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1">Industry</span>
            <FilterDropdown
              noContainer
              searchable
              ariaLabel="Industry"
              defaultLabel="Any industry"
              selectedId={pickIndustry || 'All'}
              items={INDUSTRY_OPTIONS.map((i) => ({ id: i, label: i }))}
              onSelect={(id) => {
                const value = id === 'All' ? '' : id
                setPickIndustry(value)
                fillContextIfBlank(value, '')
              }}
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1">
              Primary jurisdiction
            </span>
            <FilterDropdown
              noContainer
              searchable
              ariaLabel="Primary jurisdiction"
              defaultLabel="Any jurisdiction"
              selectedId={pickCountry || 'All'}
              items={COUNTRY_OPTIONS.map((c) => ({ id: c, label: c }))}
              onSelect={(id) => {
                const value = id === 'All' ? '' : id
                setPickCountry(value)
                fillContextIfBlank('', value)
              }}
            />
          </div>
        </div>
        {pickIndustry || pickCountry ? (
          matches.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {matches.length} framework{matches.length !== 1 ? 's' : ''} for{' '}
                {[pickIndustry, pickCountry].filter(Boolean).join(' · ')}, PQC-required first
              </div>
              <ul className="flex flex-wrap gap-1.5" aria-label="Matching frameworks">
                {visibleMatches.map((fw) => {
                  const inList = activeIds.has(fw.id)
                  const starred = starredIds.has(fw.id)
                  return (
                    <li key={fw.id}>
                      <Button
                        variant={inList ? 'secondary' : 'outline'}
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        aria-pressed={inList}
                        disabled={starred}
                        title={
                          starred
                            ? 'Starred on /compliance — manage it there'
                            : inList
                              ? `Remove ${fw.label} from this checklist`
                              : `Add ${fw.label} to this checklist`
                        }
                        onClick={() =>
                          inList ? removePageFramework(fw.id) : addPageFrameworks([fw.id])
                        }
                      >
                        {inList ? (
                          <Check size={12} className="mr-1" />
                        ) : (
                          <Plus size={12} className="mr-1" />
                        )}
                        {fw.label}
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          {PQC_REQUIREMENT_LABEL[fw.pqcRequirement]}
                        </span>
                      </Button>
                    </li>
                  )
                })}
              </ul>
              {matches.length > visibleMatches.length && (
                <Button variant="ghost" size="sm" onClick={() => setShowAllMatches(true)}>
                  Show all {matches.length}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              The catalogue lists no framework for this combination. Try another industry, or Any
              industry.
            </p>
          )
        ) : null}
      </section>

      {!hasFrameworks && (
        <div className="glass-panel bg-card backdrop-blur-none border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            No framework checklist yet — add one above, load the sample, or star frameworks on the
            Compliance page. The Scope &amp; Context section below still works on its own.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/compliance')}>
            Go to /compliance
            <ExternalLink size={12} className="ml-1.5" />
          </Button>
        </div>
      )}
      <ArtifactBuilder
        title="PQC Compliance Checklist"
        description="Educational per-framework planning checklist of the PQC controls that compliance audits probe. Checking items here records planning scope — it does not verify a deployed system or replace production GRC, CBOM, or attestation tools. Add frameworks above or star them on /compliance; complete the assessment to flag PQC-required frameworks."
        sections={sections}
        controlledForm={controlledForm}
        onExport={handleExport}
        exportFilename="pqc-compliance-checklist"
        exportFormats={['markdown', 'csv', 'pdf']}
        renderPreview={previewRenderer}
        renderCsv={csvRenderer}
      />
    </div>
  )
}

export default ComplianceChecklistBuilderStandalone
