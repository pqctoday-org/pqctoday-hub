/* eslint-disable security/detect-object-injection */
import React, { useMemo } from 'react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { ArtifactBuilder } from '../../../common/executive'
import type { ArtifactSection } from '../../../common/executive'

function buildSections(isAssessmentComplete: boolean): ArtifactSection[] {
  return [
    {
      id: 'crypto-inventory',
      title: 'Cryptographic Inventory',
      description: 'Ensure all cryptographic assets are cataloged and documented for audit review.',
      fields: [
        {
          id: 'inventory-checklist',
          label: 'Cryptographic Inventory Readiness',
          type: 'checklist',
          options: [
            { value: 'systems-cataloged', label: 'All systems cataloged' },
            { value: 'algo-documented', label: 'Algorithm usage documented' },
            { value: 'key-lengths', label: 'Key lengths recorded' },
            { value: 'cert-lifecycle', label: 'Certificate lifecycle tracked' },
            { value: 'cbom-generated', label: 'CBOM generated' },
          ],
          defaultValue: isAssessmentComplete ? ['systems-cataloged'] : [],
        },
      ],
    },
    {
      id: 'policy-governance',
      title: 'Policy & Governance',
      description:
        'Verify organizational policies and governance structures are in place for PQC migration.',
      fields: [
        {
          id: 'policy-checklist',
          label: 'Policy & Governance Readiness',
          type: 'checklist',
          options: [
            { value: 'pqc-policy', label: 'PQC policy published' },
            { value: 'raci-defined', label: 'RACI defined' },
            { value: 'exception-process', label: 'Exception process documented' },
            { value: 'training-completed', label: 'Training completed' },
            { value: 'budget-allocated', label: 'Budget allocated' },
          ],
          defaultValue: [],
        },
      ],
    },
    {
      id: 'technical-controls',
      title: 'Technical Controls',
      description: 'Confirm technical controls are deployed and tested for the PQC transition.',
      fields: [
        {
          id: 'technical-checklist',
          label: 'Technical Controls Readiness',
          type: 'checklist',
          options: [
            { value: 'hybrid-deployed', label: 'Hybrid mode deployed' },
            { value: 'pqc-tested', label: 'PQC algorithms tested' },
            { value: 'perf-benchmarked', label: 'Performance benchmarked' },
            { value: 'rollback-plan', label: 'Rollback plan documented' },
            { value: 'monitoring', label: 'Monitoring in place' },
          ],
          defaultValue: [],
        },
      ],
    },
    {
      id: 'vendor-management',
      title: 'Vendor Management',
      description: 'Assess vendor PQC readiness and update contractual requirements.',
      fields: [
        {
          id: 'vendor-checklist',
          label: 'Vendor Management Readiness',
          type: 'checklist',
          options: [
            { value: 'vendors-assessed', label: 'Vendors assessed' },
            { value: 'contracts-updated', label: 'Contracts updated' },
            { value: 'fips-verified', label: 'FIPS validation verified' },
            { value: 'supply-chain-risk', label: 'Supply chain risk evaluated' },
            { value: 'vendor-cbom', label: 'CBOM collected from vendors' },
          ],
          defaultValue: [],
        },
      ],
    },
    {
      id: 'evidence-documentation',
      title: 'Evidence & Documentation',
      description:
        'Ensure all required evidence and documentation is prepared for audit submission.',
      fields: [
        {
          id: 'evidence-checklist',
          label: 'Evidence & Documentation Readiness',
          type: 'checklist',
          options: [
            { value: 'migration-plan', label: 'Migration plan documented' },
            { value: 'test-results', label: 'Test results archived' },
            { value: 'compliance-mapping', label: 'Compliance mapping complete' },
            { value: 'incident-response', label: 'Incident response updated' },
            { value: 'board-reports', label: 'Board reports prepared' },
          ],
          defaultValue: isAssessmentComplete ? ['migration-plan'] : [],
        },
      ],
    },
  ]
}

function renderAuditPreview(data: Record<string, Record<string, string | string[]>>): string {
  let md = '# PQC Audit Readiness Checklist\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n\n`
  md += '---\n\n'

  const sectionTitles: Record<string, string> = {
    'crypto-inventory': 'Cryptographic Inventory',
    'policy-governance': 'Policy & Governance',
    'technical-controls': 'Technical Controls',
    'vendor-management': 'Vendor Management',
    'evidence-documentation': 'Evidence & Documentation',
  }

  const sectionFieldLabels: Record<string, Record<string, string>> = {
    'crypto-inventory': {
      'systems-cataloged': 'All systems cataloged',
      'algo-documented': 'Algorithm usage documented',
      'key-lengths': 'Key lengths recorded',
      'cert-lifecycle': 'Certificate lifecycle tracked',
      'cbom-generated': 'CBOM generated',
    },
    'policy-governance': {
      'pqc-policy': 'PQC policy published',
      'raci-defined': 'RACI defined',
      'exception-process': 'Exception process documented',
      'training-completed': 'Training completed',
      'budget-allocated': 'Budget allocated',
    },
    'technical-controls': {
      'hybrid-deployed': 'Hybrid mode deployed',
      'pqc-tested': 'PQC algorithms tested',
      'perf-benchmarked': 'Performance benchmarked',
      'rollback-plan': 'Rollback plan documented',
      monitoring: 'Monitoring in place',
    },
    'vendor-management': {
      'vendors-assessed': 'Vendors assessed',
      'contracts-updated': 'Contracts updated',
      'fips-verified': 'FIPS validation verified',
      'supply-chain-risk': 'Supply chain risk evaluated',
      'vendor-cbom': 'CBOM collected from vendors',
    },
    'evidence-documentation': {
      'migration-plan': 'Migration plan documented',
      'test-results': 'Test results archived',
      'compliance-mapping': 'Compliance mapping complete',
      'incident-response': 'Incident response updated',
      'board-reports': 'Board reports prepared',
    },
  }

  let totalChecked = 0
  let totalItems = 0

  for (const [sectionId, title] of Object.entries(sectionTitles)) {
    md += `## ${title}\n\n`
    const sectionData = data[sectionId] ?? {}
    const fieldLabels = sectionFieldLabels[sectionId] ?? {}
    // Get the checklist field (first field in each section)
    const checklistKey = Object.keys(sectionData)[0]
    const checkedItems = Array.isArray(sectionData[checklistKey])
      ? (sectionData[checklistKey] as string[])
      : []

    for (const [itemId, itemLabel] of Object.entries(fieldLabels)) {
      const checked = checkedItems.includes(itemId)
      md += `- [${checked ? 'x' : ' '}] ${itemLabel}\n`
      if (checked) totalChecked++
      totalItems++
    }
    md += '\n'
  }

  md += '---\n\n'
  md += `**Overall Readiness: ${totalChecked}/${totalItems} items complete (${totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0}%)**\n`

  return md
}

export const AuditReadinessChecklist: React.FC = () => {
  const { isAssessmentComplete } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()

  const sections = useMemo(() => buildSections(isAssessmentComplete), [isAssessmentComplete])

  const handleExport = (data: Record<string, Record<string, string | string[]>>) => {
    const markdown = renderAuditPreview(data)
    addExecutiveDocument({
      id: `audit-checklist-${Date.now()}`,
      type: 'audit-checklist',
      title: 'PQC Audit Readiness Checklist',
      data: markdown,
      createdAt: Date.now(),
      moduleId: 'compliance-strategy',
    })
  }

  return (
    <div className="space-y-6">
      {isAssessmentComplete && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-3">
          <p className="text-sm text-foreground/80">
            Some items have been pre-populated based on your completed assessment. Review and update
            as needed.
          </p>
        </div>
      )}

      <ArtifactBuilder
        title="PQC Audit Readiness Checklist"
        description="Check off each item as your organization completes it. Export the checklist for audit documentation."
        sections={sections}
        onExport={handleExport}
        exportFilename="pqc-audit-readiness-checklist"
        renderPreview={renderAuditPreview}
      />
    </div>
  )
}
