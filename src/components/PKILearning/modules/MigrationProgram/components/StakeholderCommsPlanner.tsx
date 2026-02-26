import React, { useCallback, useMemo } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { ArtifactBuilder } from '../../../common/executive'
import type { ArtifactSection } from '../../../common/executive'

const MODULE_ID = 'migration-program'

const COMMS_SECTIONS: ArtifactSection[] = [
  {
    id: 'stakeholder-map',
    title: 'Stakeholder Map',
    description: 'Identify the key stakeholders in your PQC migration program and their concerns.',
    fields: [
      {
        id: 'key-stakeholders',
        label: 'Key Stakeholders',
        type: 'textarea',
        placeholder:
          'List key stakeholders (e.g., CISO, CTO, VP Engineering, Head of Compliance, Vendor Management Lead, Board Risk Committee Chair)',
        defaultValue: '',
      },
      {
        id: 'stakeholder-concerns',
        label: 'Their Concerns',
        type: 'textarea',
        placeholder:
          'List stakeholder concerns (e.g., budget impact, timeline feasibility, technical risk, regulatory exposure, vendor readiness)',
        defaultValue: '',
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
          'Focus on risk exposure, regulatory compliance, competitive positioning, and investment requirements. Example: "Quantum computing will render our current encryption obsolete within 5-10 years. Our $X migration program protects $Y in regulated data and positions us ahead of compliance deadlines."',
        defaultValue: '',
      },
      {
        id: 'technical-leadership-message',
        label: 'Technical Leadership Message',
        type: 'textarea',
        placeholder:
          'Focus on architecture impacts, timeline, resource requirements, and hybrid deployment strategy. Example: "We will adopt a phased approach starting with TLS endpoints, using hybrid classical+PQC configurations to maintain backward compatibility."',
        defaultValue: '',
      },
      {
        id: 'dev-teams-message',
        label: 'Development Teams Message',
        type: 'textarea',
        placeholder:
          'Focus on library changes, API impacts, testing requirements, and training. Example: "Updated crypto libraries will be available in our internal package registry by Q2. Workshops on ML-KEM and ML-DSA integration will be scheduled monthly."',
        defaultValue: '',
      },
      {
        id: 'external-partners-message',
        label: 'External Partners Message',
        type: 'textarea',
        placeholder:
          'Focus on interoperability requirements, timeline expectations, and certification needs. Example: "We will require PQC-ready TLS endpoints from all API partners by 2028. We can provide testing environments and hybrid configuration guidance."',
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
        defaultValue: 'monthly',
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
        defaultValue: '',
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

  const sections = useMemo(() => COMMS_SECTIONS, [])

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4">
        <p className="text-sm text-muted-foreground">
          Build a comprehensive stakeholder communication plan for your PQC migration program.
          Complete each section below, then switch to Preview mode to see the formatted document.
          Export to save to your learning portfolio.
        </p>
      </div>

      <ArtifactBuilder
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
