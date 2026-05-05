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
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { complianceFrameworks } from '@/data/complianceData'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection, ArtifactField } from '@/components/PKILearning/common/executive'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

const STANDARD_CHECKLIST_ITEMS: { value: string; label: string }[] = [
  { value: 'inventory', label: 'Crypto inventory mapped to this framework' },
  { value: 'gap-analysis', label: 'Gap analysis vs framework requirements completed' },
  { value: 'pqc-dependency', label: 'Identified PQC dependency (KEM / signature)' },
  { value: 'roadmap', label: 'Migration roadmap aligned with framework deadlines' },
  { value: 'evidence', label: 'Evidence pack (CMVP / ACVP / CC certs) collected' },
  { value: 'attestation', label: 'Attestation / sign-off from framework owner' },
]

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
    return [
      contextSection,
      {
        id: 'no-frameworks',
        title: 'Frameworks',
        description:
          'Star at least one framework on the /compliance page to populate this checklist.',
        fields: [],
      },
    ]
  }

  const fwSections: ArtifactSection[] = frameworks.map((fw) => {
    const isPqcRequired = pqcRequiredIds.has(fw.id)
    const checklistField: ArtifactField = {
      id: 'controls',
      label: 'Controls',
      type: 'checklist',
      options: STANDARD_CHECKLIST_ITEMS,
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
      lines.push(`  - ${checked} ${item.label}`)
    }
    if (notes) lines.push(`\n${notes}`)
    lines.push('')
  }

  return lines.join('\n')
}

export const ComplianceChecklistBuilderStandalone: React.FC = () => {
  const { myFrameworks, industry, country, assessmentResult } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const [seedCleared, setSeedCleared] = React.useState(false)

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
      createdAt: Date.now(),
      moduleId: 'compliance-strategy',
    })
  }

  const previewRenderer = React.useCallback(
    (data: Record<string, Record<string, string | string[]>>) =>
      renderPreview(data, trackedFrameworks),
    [trackedFrameworks]
  )

  // Re-mount the inner builder when sections change, so defaultValues take effect.
  // ArtifactBuilder seeds state from sections only on first render.
  const builderKey = `${trackedFrameworks.map((f) => f.id).join(',')}|${seedCleared ? 'cleared' : 'seeded'}`

  return (
    <div className="space-y-4">
      {sources.length > 0 && (
        <PreFilledBanner
          summary={`Seeded from ${sources.join(' + ')}.`}
          onClear={() => setSeedCleared(true)}
        />
      )}
      <ArtifactBuilder
        key={builderKey}
        title="PQC Compliance Checklist"
        description="Per-framework checklist of the PQC controls that compliance audits will probe. Star frameworks on /compliance to add them; complete the assessment to flag PQC-required frameworks."
        sections={sections}
        onExport={handleExport}
        exportFilename="pqc-compliance-checklist"
        renderPreview={previewRenderer}
      />
    </div>
  )
}

export default ComplianceChecklistBuilderStandalone
