// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo, useState } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ArtifactBuilder } from '../../../common/executive'
import type { ArtifactSection } from '../../../common/executive'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

const MODULE_ID = 'migration-program'

function buildCommsSections(opts: {
  industry: string
  country: string
  myFrameworksLabels: string[]
  myProductsCount: number
  deadlineYear: number | null
}): ArtifactSection[] {
  const { industry, country, myFrameworksLabels, myProductsCount, deadlineYear } = opts
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
  const triggersDefault = [
    deadlineYear && `Slip risk against ${deadlineYear} deadline`,
    myProductsCount > 0 && `Critical product without a PQC roadmap by Q-1 of deadline year`,
    'Budget overrun >10%',
    'Compliance gap identified in audit',
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
          label: 'Key Stakeholders',
          type: 'textarea',
          placeholder:
            'List key stakeholders (e.g., CISO, CTO, VP Engineering, Head of Compliance, Vendor Management Lead, Board Risk Committee Chair)',
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
          label: 'Influence Level',
          type: 'select',
          placeholder: 'Select influence level',
          options: [
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ],
          defaultValue: 'high',
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

function renderCommsPreview(data: Record<string, Record<string, string | string[]>>): string {
  let md = '# PQC Migration — Stakeholder Communications Plan\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n\n---\n\n`

  // Stakeholder Map
  md += '## 1. Stakeholder Map\n\n'
  const stakeholders = data['stakeholder-map']?.['key-stakeholders'] || '_Not specified_'
  const concerns = data['stakeholder-map']?.['stakeholder-concerns'] || '_Not specified_'
  const influence = data['stakeholder-map']?.['influence-level'] || '_Not specified_'
  md += `**Key Stakeholders:**\n${stakeholders}\n\n`
  md += `**Their Concerns:**\n${concerns}\n\n`
  md += `**Influence Level:** ${String(influence).charAt(0).toUpperCase() + String(influence).slice(1)}\n\n---\n\n`

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

  return md
}

export const StakeholderCommsPlanner: React.FC = () => {
  const { addExecutiveDocument } = useModuleStore()
  const { industry, country, migrationDeadlineYear, myFrameworks, myProducts, frameworks } =
    useExecutiveModuleData()
  const [seedCleared, setSeedCleared] = useState(false)

  const myFrameworksLabels = useMemo(
    () =>
      myFrameworks
        .map((id) => frameworks.find((f) => f.id === id)?.label)
        .filter((x): x is string => Boolean(x)),
    [myFrameworks, frameworks]
  )

  const handleExport = useCallback(
    (data: Record<string, Record<string, string | string[]>>) => {
      const markdown = renderCommsPreview(data)
      addExecutiveDocument({
        id: `stakeholder-comms-${Date.now()}`,
        moduleId: MODULE_ID,
        type: 'stakeholder-comms',
        title: 'Stakeholder Communications Plan',
        data: markdown,
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
      }),
    [industry, country, myFrameworksLabels, myProducts.length, migrationDeadlineYear, seedCleared]
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
  const builderKey = seedCleared
    ? 'cleared'
    : `${myFrameworksLabels.length}-${myProducts.length}-${migrationDeadlineYear ?? 'no'}`

  return (
    <div className="space-y-6">
      {seedSources.length > 0 && (
        <PreFilledBanner
          summary={`Stakeholders, concerns, board message, and escalation triggers seeded from ${seedSources.join(' + ')}.`}
          onClear={() => setSeedCleared(true)}
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
        renderPreview={renderCommsPreview}
      />
    </div>
  )
}
