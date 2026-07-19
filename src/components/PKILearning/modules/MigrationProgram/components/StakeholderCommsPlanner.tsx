// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo, useState } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ArtifactBuilder } from '../../../common/executive'
import type { ArtifactSection } from '../../../common/executive'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useSavedArtifactInputs, useSavedArtifactOutput } from '@/hooks/useSavedArtifactInputs'
import type { RoadmapOutput } from '../types'

type CommsFormData = Record<string, Record<string, string | string[]>>

const MODULE_ID = 'migration-program'

function buildCommsSections(opts: {
  industry: string
  country: string
  myFrameworksLabels: string[]
  myProductsCount: number
  deadlineYear: number | null
  roadmapMilestones?: Array<{ label: string; year: number; phaseId: string }> | null
}): ArtifactSection[] {
  const {
    industry,
    country,
    myFrameworksLabels,
    myProductsCount,
    deadlineYear,
    roadmapMilestones,
  } = opts
  const stakeholderDefault = [
    industry && `${industry} compliance lead`,
    'CISO',
    'CTO / VP Engineering',
    'Head of Vendor Management',
    'Board Risk Committee Chair',
  ]
    .filter(Boolean)
    .join('\n')
  const concernsDefault = [
    deadlineYear && `Meeting ${deadlineYear} regulatory deadline`,
    myFrameworksLabels.length > 0 &&
      `Compliance with ${myFrameworksLabels.slice(0, 3).join(', ')}${myFrameworksLabels.length > 3 ? `, +${myFrameworksLabels.length - 3} more` : ''}`,
    myProductsCount > 0 && `Migrating ${myProductsCount} in-scope products`,
    'Budget impact and timeline feasibility',
  ]
    .filter(Boolean)
    .join('\n')
  const boardMsgDefault = [
    industry && `Quantum risk to our ${industry}${country ? ` operations in ${country}` : ''}.`,
    deadlineYear && `Regulatory exposure if we miss the ${deadlineYear} deadline.`,
    myFrameworksLabels.length > 0 &&
      `Frameworks at stake: ${myFrameworksLabels.slice(0, 4).join(', ')}.`,
  ]
    .filter(Boolean)
    .join(' ')
  const milestoneTriggers =
    roadmapMilestones && roadmapMilestones.length > 0
      ? roadmapMilestones
          .slice()
          .sort((a, b) => a.year - b.year)
          .map((m) => `- ${m.year}: ${m.label} (Phase ${m.phaseId})`)
          .join('\n')
      : null
  const triggersDefault = [
    deadlineYear && `Slip risk against ${deadlineYear} deadline`,
    myProductsCount > 0 && `Critical product without a PQC roadmap by Q-1 of deadline year`,
    'Budget overrun >10%',
    'Compliance gap identified in audit',
    milestoneTriggers && `\nKey communication events from roadmap:\n${milestoneTriggers}`,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    {
      id: 'stakeholder-map',
      title: 'Stakeholder Map',
      description:
        'Identify the key stakeholders in your PQC migration program and their concerns.',
      fields: [
        {
          id: 'key-stakeholders',
          label: 'Key Stakeholders (with power / interest)',
          type: 'textarea',
          placeholder:
            "One per line with each stakeholder's power and interest, e.g. 'CISO - high power, high interest (manage closely)'; 'Board Risk Committee - high power, low interest (keep satisfied)'; 'Dev teams - low power, high interest (keep informed)'",
          defaultValue: stakeholderDefault || '',
        },
        {
          id: 'stakeholder-concerns',
          label: 'Their Concerns',
          type: 'textarea',
          placeholder:
            'List stakeholder concerns (e.g., budget impact, timeline feasibility, technical risk, regulatory exposure, vendor readiness)',
          defaultValue: concernsDefault || '',
        },
        {
          id: 'influence-level',
          label: 'Default engagement strategy',
          type: 'select',
          placeholder: 'Select the default power/interest strategy',
          options: [
            { value: 'manage-closely', label: 'Manage closely (high power, high interest)' },
            { value: 'keep-satisfied', label: 'Keep satisfied (high power, low interest)' },
            { value: 'keep-informed', label: 'Keep informed (low power, high interest)' },
            { value: 'monitor', label: 'Monitor (low power, low interest)' },
          ],
          defaultValue: 'manage-closely',
        },
      ],
    },
    {
      id: 'message-framework',
      title: 'Message Framework',
      description:
        'Craft targeted messages for each audience tier. Tailor language, detail level, and focus areas.',
      fields: [
        {
          id: 'board-message',
          label: 'Board / C-Suite Message',
          type: 'textarea',
          placeholder:
            'Focus on risk exposure, regulatory compliance, competitive positioning, and investment requirements.',
          defaultValue: boardMsgDefault || '',
        },
        {
          id: 'technical-leadership-message',
          label: 'Technical Leadership Message',
          type: 'textarea',
          placeholder:
            'Focus on architecture impacts, timeline, resource requirements, and hybrid deployment strategy.',
          defaultValue: '',
        },
        {
          id: 'dev-teams-message',
          label: 'Development Teams Message',
          type: 'textarea',
          placeholder: 'Focus on library changes, API impacts, testing requirements, and training.',
          defaultValue: '',
        },
        {
          id: 'external-partners-message',
          label: 'External Partners Message',
          type: 'textarea',
          placeholder:
            'Focus on interoperability requirements, timeline expectations, and certification needs.',
          defaultValue: '',
        },
      ],
    },
    {
      id: 'communication-cadence',
      title: 'Communication Cadence',
      description: 'Define the rhythm and format of program status reporting.',
      fields: [
        {
          id: 'reporting-frequency',
          label: 'Reporting Frequency',
          type: 'select',
          placeholder: 'Select reporting frequency',
          options: [
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Biweekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
          ],
          // Tighter cadence when deadline is close (≤ 2 years out).
          defaultValue:
            deadlineYear && deadlineYear - new Date().getFullYear() <= 2 ? 'biweekly' : 'monthly',
        },
        {
          id: 'status-report-format',
          label: 'Status Report Format',
          type: 'select',
          placeholder: 'Select status report format',
          options: [
            { value: 'dashboard', label: 'Dashboard' },
            { value: 'email', label: 'Email' },
            { value: 'presentation', label: 'Presentation' },
          ],
          defaultValue: 'dashboard',
        },
      ],
    },
    {
      id: 'escalation-criteria',
      title: 'Escalation Criteria',
      description: 'Define what triggers escalation and who gets notified.',
      fields: [
        {
          id: 'escalation-triggers',
          label: 'Escalation Triggers',
          type: 'textarea',
          placeholder:
            'Define conditions that trigger escalation (e.g., milestone missed by >2 weeks, budget overrun >10%, critical vendor not PQC-ready by deadline, compliance gap identified in audit)',
          defaultValue: triggersDefault || '',
        },
        {
          id: 'escalation-path',
          label: 'Escalation Path',
          type: 'textarea',
          placeholder:
            'Define the escalation chain (e.g., Project Lead -> Program Manager -> CISO -> Board Risk Committee). Include response time expectations for each level.',
          defaultValue: '',
        },
      ],
    },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// CSWP-39 §5 verbatim quote (sanitised to ASCII)
// ─────────────────────────────────────────────────────────────────────────────

const CSWP39_5_QUOTE =
  "Integrate crypto agility into the organization's existing governance function to establish, communicate, and monitor the cybersecurity risk management strategy, expectations, and policies related to cryptography. This includes understanding cryptographic standards, regulations, and mandates and communicating these requirements to data owners, IT and development teams, business partners, and technology supply chain vendors prioritized by the criticality of the data for the primary use cases."

// Exported (07192026, Batch 3) for the simulation's real-tool doc generator.
export function renderCommsPreview(
  data: Record<string, Record<string, string | string[]>>
): string {
  let md = '# PQC Migration — Stakeholder Communications Plan\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n\n---\n\n`

  // Stakeholder Map
  md += '## 1. Stakeholder Map\n\n'
  md += `> "${CSWP39_5_QUOTE}"\n`
  md += `> -- NIST CSWP 39 Section 5\n\n`
  const stakeholders = data['stakeholder-map']?.['key-stakeholders'] || '_Not specified_'
  const concerns = data['stakeholder-map']?.['stakeholder-concerns'] || '_Not specified_'
  const influence = data['stakeholder-map']?.['influence-level'] || '_Not specified_'
  md += `**Stakeholders (power / interest map):**\n${stakeholders}\n\n`
  md += `**Their Concerns:**\n${concerns}\n\n`
  const strategyLabel = String(influence)
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
  md += `**Default engagement strategy:** ${strategyLabel}\n\n---\n\n`

  // Message Framework
  md += '## 2. Message Framework\n\n'
  const boardMsg = data['message-framework']?.['board-message'] || '_Not specified_'
  const techMsg = data['message-framework']?.['technical-leadership-message'] || '_Not specified_'
  const devMsg = data['message-framework']?.['dev-teams-message'] || '_Not specified_'
  const partnerMsg = data['message-framework']?.['external-partners-message'] || '_Not specified_'
  md += `### Board / C-Suite\n${boardMsg}\n\n`
  md += `### Technical Leadership\n${techMsg}\n\n`
  md += `### Development Teams\n${devMsg}\n\n`
  md += `### External Partners\n${partnerMsg}\n\n---\n\n`

  // Communication Cadence
  md += '## 3. Communication Cadence\n\n'
  const freq = data['communication-cadence']?.['reporting-frequency'] || '_Not specified_'
  const format = data['communication-cadence']?.['status-report-format'] || '_Not specified_'
  md += `**Reporting Frequency:** ${String(freq).charAt(0).toUpperCase() + String(freq).slice(1)}\n\n`
  md += `**Status Report Format:** ${String(format).charAt(0).toUpperCase() + String(format).slice(1)}\n\n---\n\n`

  // Escalation Criteria
  md += '## 4. Escalation Criteria\n\n'
  const triggers = data['escalation-criteria']?.['escalation-triggers'] || '_Not specified_'
  const path = data['escalation-criteria']?.['escalation-path'] || '_Not specified_'
  md += `**Escalation Triggers:**\n${triggers}\n\n`
  md += `**Escalation Path:**\n${path}\n`

  md += '\n---\n\n'
  md +=
    '*Aligned to NIST CSWP 39 §1 (Introduction) and §5 (Strategic Plan). https://doi.org/10.6028/NIST.CSWP.39-upd1*\n'

  return md
}

interface StakeholderCommsPlannerProps {
  roadmapOutput?: RoadmapOutput | null
}

export const StakeholderCommsPlanner: React.FC<StakeholderCommsPlannerProps> = ({
  roadmapOutput,
}) => {
  const { addExecutiveDocument } = useModuleStore()
  const { industry, country, migrationDeadlineYear, myFrameworks, myProducts, frameworks } =
    useExecutiveModuleData()
  const [seedCleared, setSeedCleared] = useState(false)

  // Restore the last-saved plan so edits survive navigation, same pattern as
  // Board Pitch Builder / Roadmap Builder.
  const savedFormData = useSavedArtifactInputs<CommsFormData>('stakeholder-comms')

  // roadmapOutput only arrives as a live prop inside the linear
  // `/learn/migration-program` wizard. Reached any other way — the
  // Simulation embed or the standalone Business Center route — fall back to
  // the Roadmap Builder's last saved output so milestones still seed the
  // Escalation Criteria section.
  const savedRoadmapOutput = useSavedArtifactOutput<RoadmapOutput>('migration-roadmap')
  const effectiveRoadmapOutput = roadmapOutput ?? savedRoadmapOutput ?? null

  const myFrameworksLabels = useMemo(
    () =>
      myFrameworks
        .map((id) => frameworks.find((f) => f.id === id)?.label)
        .filter((x): x is string => Boolean(x)),
    [myFrameworks, frameworks]
  )

  const handleExport = useCallback(
    (data: CommsFormData) => {
      const markdown = renderCommsPreview(data)
      addExecutiveDocument({
        id: `stakeholder-comms-${Date.now()}`,
        moduleId: MODULE_ID,
        type: 'stakeholder-comms',
        title: 'Stakeholder Communications Plan',
        data: markdown,
        // Persist the edited fields so the plan is restorable (see savedFormData above).
        inputs: data,
        createdAt: Date.now(),
      })
    },
    [addExecutiveDocument]
  )

  const sections = useMemo(
    () =>
      buildCommsSections({
        industry: seedCleared ? '' : industry,
        country: seedCleared ? '' : country,
        myFrameworksLabels: seedCleared ? [] : myFrameworksLabels,
        myProductsCount: seedCleared ? 0 : myProducts.length,
        deadlineYear: seedCleared ? null : migrationDeadlineYear,
        roadmapMilestones: seedCleared ? null : (effectiveRoadmapOutput?.milestones ?? null),
      }),
    [
      industry,
      country,
      myFrameworksLabels,
      myProducts.length,
      migrationDeadlineYear,
      seedCleared,
      effectiveRoadmapOutput,
    ]
  )

  const seedSources: string[] = []
  if (!seedCleared) {
    if (industry) seedSources.push(`industry (${industry})`)
    if (country) seedSources.push(`country (${country})`)
    if (myFrameworksLabels.length > 0)
      seedSources.push(
        `${myFrameworksLabels.length} framework${myFrameworksLabels.length !== 1 ? 's' : ''} from /compliance`
      )
    if (myProducts.length > 0)
      seedSources.push(
        `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`
      )
    if (migrationDeadlineYear) seedSources.push(`deadline ${migrationDeadlineYear} from /timeline`)
  }
  const roadmapMilestoneCount = effectiveRoadmapOutput?.milestones?.length ?? 0
  const builderKey = seedCleared
    ? 'cleared'
    : `${myFrameworksLabels.length}-${myProducts.length}-${migrationDeadlineYear ?? 'no'}-${roadmapMilestoneCount}`

  return (
    <div className="space-y-6">
      {savedFormData ? (
        <PreFilledBanner summary="Restored your last saved plan — edit any field and re-export to update it." />
      ) : (
        seedSources.length > 0 && (
          <PreFilledBanner
            summary={`Stakeholders, concerns, board message, and escalation triggers seeded from ${seedSources.join(' + ')}.`}
            onClear={() => setSeedCleared(true)}
          />
        )
      )}
      {!seedCleared && effectiveRoadmapOutput && effectiveRoadmapOutput.milestones.length > 0 && (
        <PreFilledBanner
          summary={`${effectiveRoadmapOutput.milestones.length} roadmap milestone${effectiveRoadmapOutput.milestones.length !== 1 ? 's' : ''} ${roadmapOutput ? 'from Step 1' : 'from your last Roadmap Builder export'} added as communication trigger points in the Escalation Criteria section.`}
        />
      )}
      <div className="glass-panel p-4">
        <p className="text-sm text-muted-foreground">
          Build a comprehensive stakeholder communication plan for your PQC migration program
          {industry ? ` in the ${industry} sector` : ''}
          {country ? ` (${country})` : ''}.
          {migrationDeadlineYear
            ? ` Your earliest regulatory deadline is ${migrationDeadlineYear}.`
            : ''}{' '}
          Complete each section below, then switch to Preview mode to see the formatted document.
          Export to save to your learning portfolio.
        </p>
      </div>

      <ArtifactBuilder
        key={builderKey}
        title="Stakeholder Communications Plan"
        description="PQC Migration Program — Communications Strategy"
        sections={sections}
        onExport={handleExport}
        exportFilename="pqc-stakeholder-comms"
        exportFormats={['markdown', 'pdf']}
        initialData={savedFormData}
        renderPreview={renderCommsPreview}
      />
    </div>
  )
}
