// SPDX-License-Identifier: GPL-3.0-only
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
import { ExternalLink } from 'lucide-react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { complianceFrameworks } from '@/data/complianceData'
import { Button } from '@/components/ui/button'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection, ArtifactField } from '@/components/PKILearning/common/executive'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { rowsToCsv } from '@/services/export/csvExport'

interface ChecklistItem {
  value: string
  label: string
  description: string
  reference: string
}

const STANDARD_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    value: 'inventory',
    label: 'Crypto inventory mapped to this framework',
    description:
      'Cryptographic assets in scope for this framework (algorithms, protocols, certificates, libraries) are identified and mapped to the requirement.',
    reference: 'NIST CSWP.39 §5 (asset-centric crypto inventory)',
  },
  {
    value: 'gap-analysis',
    label: 'Gap analysis vs framework requirements completed',
    description:
      "Current cryptographic posture is compared against the framework's requirements to identify enforcement gaps in tooling, configuration, and policy.",
    reference: 'NIST CSWP.39 §5.2 (Crypto Security Policy Enforcement)',
  },
  {
    value: 'pqc-dependency',
    label: 'Identified PQC dependency (KEM / signature)',
    description:
      'Algorithms in scope are flagged where the framework requires, or will require, a post-quantum key-establishment or signature replacement.',
    reference: 'NIST CSWP.39 §5.1 (standards, regulations, and mandates)',
  },
  {
    value: 'roadmap',
    label: 'Migration roadmap aligned with framework deadlines',
    description:
      "A migration plan exists with milestones that reach the framework's binding deadline, not just a directional intent.",
    reference: 'NIST CSWP.39 §5.1 (standards, regulations, and mandates)',
  },
  {
    value: 'evidence',
    label: 'Evidence pack (CMVP / ACVP / CC certs) collected',
    description:
      'Validation evidence — CMVP module certificates, ACVP algorithm test results, or Common Criteria certification — is collected to show the claimed algorithm or module is actually validated.',
    reference: 'NIST CSWP.39 §5.1 (CAVP/CMVP as a validation prerequisite)',
  },
  {
    value: 'attestation',
    label: 'Attestation / sign-off from framework owner',
    description:
      'A named, accountable owner for this framework has reviewed and signed off on the checklist state.',
    reference: 'NIST CSWP.39 §5.1 (standards, regulations, and mandates)',
  },
]

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
 *  built with `rowsToCsv` so `.csv` opens as real spreadsheet rows. Mirrors
 *  AuditReadinessChecklist's `renderAuditCsv` / ComplianceTimelineBuilder's
 *  section-labelled CSV export. */
function renderCsv(
  data: Record<string, Record<string, string | string[]>>,
  frameworks: typeof complianceFrameworks
): string {
  const rows: (string | number)[][] = []
  rows.push(['PQC Compliance Checklist'])
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
  return rowsToCsv(rows)
}

export const ComplianceChecklistBuilderStandalone: React.FC = () => {
  const { myFrameworks, industry, country, assessmentResult } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const navigate = useNavigate()
  const [seedCleared, setSeedCleared] = React.useState(false)
  // Read half of the autosave pair — without it the checklist would save on
  // every keystroke and still open blank on the next visit. (WS6.)
  const savedFormData =
    useSavedArtifactInputs<Record<string, Record<string, string | string[]>>>(
      'compliance-checklist'
    )

  const trackedFrameworks = useMemo(() => {
    if (myFrameworks.length === 0) return []
    const set = new Set(myFrameworks)
    return complianceFrameworks.filter((fw) => set.has(fw.id))
  }, [myFrameworks])

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
        frameworks: seedCleared ? [] : trackedFrameworks,
        pqcRequiredIds: seedCleared ? new Set<string>() : pqcRequiredIds,
        industry: seedCleared ? '' : industry,
        country: seedCleared ? '' : country,
      }),
    [trackedFrameworks, pqcRequiredIds, industry, country, seedCleared]
  )

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

  const handleExport = (data: Record<string, Record<string, string | string[]>>) => {
    const markdown = renderPreview(data, trackedFrameworks)
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
    (data: Record<string, Record<string, string | string[]>>) =>
      renderPreview(data, trackedFrameworks),
    [trackedFrameworks]
  )

  const csvRenderer = React.useCallback(
    (data: Record<string, Record<string, string | string[]>>) => renderCsv(data, trackedFrameworks),
    [trackedFrameworks]
  )

  // Re-mount the inner builder when sections change, so defaultValues take effect.
  // ArtifactBuilder seeds state from sections only on first render.
  const builderKey = `${trackedFrameworks.map((f) => f.id).join(',')}|${seedCleared ? 'cleared' : 'seeded'}`

  const hasFrameworks = !seedCleared && trackedFrameworks.length > 0

  return (
    <div className="space-y-4">
      {sources.length > 0 && (
        <PreFilledBanner
          summary={`Seeded from ${sources.join(' + ')}.`}
          onClear={() => setSeedCleared(true)}
        />
      )}
      {!hasFrameworks && (
        <div className="glass-panel p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Star at least one framework on the Compliance page to add a per-framework control
            checklist here — the Scope &amp; Context section below still works on its own.
          </p>
          <Button variant="gradient" size="sm" onClick={() => navigate('/compliance')}>
            Go to /compliance
            <ExternalLink size={12} className="ml-1.5" />
          </Button>
        </div>
      )}
      <ArtifactBuilder
        key={builderKey}
        title="PQC Compliance Checklist"
        description="Per-framework checklist of the PQC controls that compliance audits will probe. Star frameworks on /compliance to add them; complete the assessment to flag PQC-required frameworks."
        sections={sections}
        initialData={savedFormData}
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
