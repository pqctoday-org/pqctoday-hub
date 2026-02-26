import React, { useMemo, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'

const MODULE_ID = 'pqc-business-case'

export const BoardPitchBuilder: React.FC = () => {
  const data = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()

  // Pre-populate defaults from assessment data
  const executiveSummaryDefault = useMemo(() => {
    if (data.assessmentResult?.executiveSummary) {
      return data.assessmentResult.executiveSummary
    }
    if (data.isAssessmentComplete && data.riskScore !== null) {
      return `Our organization faces a ${data.assessmentResult?.riskLevel ?? 'significant'}-level quantum risk (score: ${data.riskScore}/100). Post-quantum cryptography migration is required to protect sensitive data, maintain regulatory compliance, and ensure long-term business resilience. This proposal outlines the investment needed and the expected return.`
    }
    return 'Post-quantum cryptography (PQC) migration is a critical infrastructure investment. As quantum computing advances, current encryption algorithms (RSA, ECDSA, ECDH) will become vulnerable to attack. This proposal outlines the business case for proactive migration, including cost-benefit analysis and recommended timeline.'
  }, [data.assessmentResult, data.isAssessmentComplete, data.riskScore])

  const riskOverviewDefault = useMemo(() => {
    const parts: string[] = []

    if (data.riskScore !== null) {
      parts.push(
        `Organizational risk score: ${data.riskScore}/100 (${data.assessmentResult?.riskLevel ?? 'N/A'}).`
      )
    }

    parts.push(
      `${data.criticalThreatCount} critical/high-severity quantum threats identified across the threat landscape.`
    )
    parts.push(
      `${data.totalProducts} products in our infrastructure require evaluation for PQC migration.`
    )

    if (data.frameworksByIndustry.length > 0) {
      parts.push(
        `${data.frameworksByIndustry.length} compliance frameworks apply to our industry, several with emerging PQC requirements.`
      )
    }

    return parts.join('\n')
  }, [
    data.riskScore,
    data.assessmentResult?.riskLevel,
    data.criticalThreatCount,
    data.totalProducts,
    data.frameworksByIndustry.length,
  ])

  const timelineDefault = useMemo(() => {
    if (data.migrationDeadlineYear) {
      const yearsRemaining = data.migrationDeadlineYear - new Date().getFullYear()
      return `${data.country || 'Our country'} has regulatory deadlines targeting ${data.migrationDeadlineYear} (${yearsRemaining} years from now). We recommend a phased migration starting immediately with assessment and hybrid deployments, targeting full PQC deployment 12 months before the deadline.`
    }
    return 'We recommend a 3-phase migration: Phase 1 (Assessment & Planning, 3-6 months), Phase 2 (Hybrid Deployment, 6-12 months), Phase 3 (Full PQC Migration, 12-24 months). Earlier adoption reduces HNDL risk and positions the organization ahead of regulatory requirements.'
  }, [data.migrationDeadlineYear, data.country])

  const recommendedActionsDefault = useMemo(() => {
    if (data.assessmentResult?.recommendedActions?.length) {
      return data.assessmentResult.recommendedActions
        .slice(0, 5)
        .map((a) => `${a.priority}. [${a.category.toUpperCase()}] ${a.action}`)
        .join('\n')
    }
    return '1. [IMMEDIATE] Complete cryptographic inventory (CBOM) across all systems\n2. [IMMEDIATE] Identify and prioritize HNDL-vulnerable data stores\n3. [SHORT-TERM] Deploy hybrid PQC/classical TLS for external-facing services\n4. [SHORT-TERM] Evaluate and select PQC-ready vendors for critical infrastructure\n5. [LONG-TERM] Full migration to NIST-standardized PQC algorithms across all systems'
  }, [data.assessmentResult])

  const sections: ArtifactSection[] = useMemo(
    () => [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        description: 'A concise overview of the PQC migration need and this investment proposal.',
        fields: [
          {
            id: 'summary',
            label: 'Executive Summary',
            type: 'textarea',
            placeholder: 'Describe why PQC migration is needed and what this proposal requests...',
            defaultValue: executiveSummaryDefault,
          },
        ],
      },
      {
        id: 'risk-overview',
        title: 'Risk Overview',
        description: 'Quantified assessment of the quantum risk facing the organization.',
        fields: [
          {
            id: 'risks',
            label: 'Risk Assessment Summary',
            type: 'textarea',
            placeholder: 'Summarize the key quantum risks and their business impact...',
            defaultValue: riskOverviewDefault,
          },
        ],
      },
      {
        id: 'cost-benefit',
        title: 'Cost-Benefit Analysis',
        description: 'Financial justification showing migration cost vs. cost of inaction.',
        fields: [
          {
            id: 'analysis',
            label: 'Cost-Benefit Analysis',
            type: 'textarea',
            placeholder:
              'Reference the ROI Calculator (Step 1) for specific numbers. Include migration cost, breach avoidance savings, compliance savings, and 3-year ROI...',
            defaultValue:
              'Migration investment is justified by breach avoidance savings and compliance penalty avoidance. The ROI Calculator (Step 1 of this workshop) provides detailed financial modeling. Key metrics include estimated migration cost, annual benefit from breach avoidance, and payback period.',
          },
        ],
      },
      {
        id: 'timeline',
        title: 'Proposed Timeline',
        description: 'Recommended migration phases and milestones.',
        fields: [
          {
            id: 'timeline',
            label: 'Migration Timeline',
            type: 'textarea',
            placeholder: 'Outline the proposed migration phases and target dates...',
            defaultValue: timelineDefault,
          },
        ],
      },
      {
        id: 'budget',
        title: 'Requested Budget',
        description: 'Total investment requested for PQC migration.',
        fields: [
          {
            id: 'amount',
            label: 'Budget Request',
            type: 'text',
            placeholder: 'e.g., $2.5M over 24 months',
            defaultValue: '',
          },
          {
            id: 'breakdown',
            label: 'Budget Breakdown',
            type: 'textarea',
            placeholder:
              'Break down the budget by category: software, hardware, consulting, training, testing...',
            defaultValue: '',
          },
        ],
      },
      {
        id: 'actions',
        title: 'Recommended Actions',
        description: 'Prioritized next steps for the organization.',
        fields: [
          {
            id: 'recommendations',
            label: 'Recommended Actions',
            type: 'textarea',
            placeholder: 'List prioritized actions by timeframe...',
            defaultValue: recommendedActionsDefault,
          },
        ],
      },
    ],
    [executiveSummaryDefault, riskOverviewDefault, timelineDefault, recommendedActionsDefault]
  )

  const renderPreview = useCallback(
    (formData: Record<string, Record<string, string | string[]>>): string => {
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      let md = ''
      md += '# PQC Migration Investment Proposal\n\n'
      md += `**Prepared:** ${dateStr}\n`
      if (data.industry) md += `**Industry:** ${data.industry}\n`
      if (data.country) md += `**Country:** ${data.country}\n`
      md += '**Classification:** Confidential - Board Use Only\n\n'
      md += '---\n\n'

      md += '## 1. Executive Summary\n\n'
      md += `${(formData['executive-summary']?.summary as string) || '_Not specified_'}\n\n`

      md += '## 2. Risk Overview\n\n'
      md += `${(formData['risk-overview']?.risks as string) || '_Not specified_'}\n\n`

      md += '## 3. Cost-Benefit Analysis\n\n'
      md += `${(formData['cost-benefit']?.analysis as string) || '_Not specified_'}\n\n`

      md += '## 4. Proposed Timeline\n\n'
      md += `${(formData['timeline']?.timeline as string) || '_Not specified_'}\n\n`

      md += '## 5. Budget Request\n\n'
      const budgetAmount = (formData['budget']?.amount as string) || '_Not specified_'
      const budgetBreakdown = (formData['budget']?.breakdown as string) || ''
      md += `**Total:** ${budgetAmount}\n\n`
      if (budgetBreakdown) md += `${budgetBreakdown}\n\n`

      md += '## 6. Recommended Actions\n\n'
      md += `${(formData['actions']?.recommendations as string) || '_Not specified_'}\n\n`

      md += '---\n\n'
      md +=
        '*This document was generated using PQC Today Business Case Builder for educational and planning purposes.*\n'

      return md
    },
    [data.industry, data.country]
  )

  const handleExport = useCallback(
    (formData: Record<string, Record<string, string | string[]>>) => {
      const markdown = renderPreview(formData)
      addExecutiveDocument({
        id: `board-pitch-${Date.now()}`,
        moduleId: MODULE_ID,
        type: 'board-deck',
        title: 'PQC Migration Investment Proposal',
        data: markdown,
        createdAt: Date.now(),
      })
    },
    [renderPreview, addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      {/* Context banner */}
      <div className="glass-panel p-4 flex items-start gap-3">
        <FileText size={20} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Board Memo Builder</p>
          <p className="text-xs text-muted-foreground">
            Fill in each section to create a professional board-ready memo. Fields are pre-populated
            with data from your assessment and the workshop steps above. Switch to Preview mode to
            see the formatted document, then export as Markdown or JSON.
          </p>
        </div>
      </div>

      {/* Artifact Builder */}
      <ArtifactBuilder
        title="PQC Migration Investment Proposal"
        description="A board-ready executive brief for PQC investment approval."
        sections={sections}
        onExport={handleExport}
        exportFilename="pqc-board-pitch"
        renderPreview={renderPreview}
      />
    </div>
  )
}
