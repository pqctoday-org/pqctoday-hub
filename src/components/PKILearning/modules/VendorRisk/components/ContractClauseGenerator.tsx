// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useCallback } from 'react'
import { ArtifactBuilder } from '../../../common/executive'
import type { ArtifactSection } from '../../../common/executive'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

const MODULE_ID = 'vendor-risk'

const CONTRACT_SECTIONS: ArtifactSection[] = [
  {
    id: 'pqc-timeline',
    title: 'PQC Timeline Requirements',
    description: 'Define when vendors must achieve post-quantum cryptographic readiness.',
    fields: [
      {
        id: 'deadline-year',
        label: 'PQC Compliance Deadline Year',
        type: 'select',
        placeholder: 'Select deadline year',
        options: [
          {
            value: '2025',
            label: '2025 — CNSA 2.0 software/firmware preferred (NSS)',
          },
          {
            value: '2027',
            label: '2027 — CNSA 2.0 new networking equipment must support PQC',
          },
          {
            value: '2030',
            label: '2030 — CNSA 2.0 all software exclusive; NIST IR 8547 RSA/ECC deprecation',
          },
          {
            value: '2033',
            label: '2033 — CNSA 2.0 legacy networking equipment replacement',
          },
          {
            value: '2035',
            label: '2035 — CNSA 2.0 full enforcement (all NSS); NIST IR 8547 RSA/ECC disallowed',
          },
        ],
      },
      {
        id: 'algorithm-requirements',
        label: 'Required PQC Algorithms',
        type: 'checklist',
        options: [
          { value: 'ml-kem', label: 'ML-KEM (FIPS 203) — Key Encapsulation' },
          { value: 'ml-dsa', label: 'ML-DSA (FIPS 204) — Digital Signatures' },
          { value: 'slh-dsa', label: 'SLH-DSA (FIPS 205) — Stateless Hash Signatures' },
          { value: 'lms-hss', label: 'LMS/HSS (SP 800-208) — Stateful Hash Signatures' },
        ],
      },
      {
        id: 'penalty',
        label: 'Non-Compliance Penalty',
        type: 'textarea',
        placeholder:
          'e.g., "Failure to achieve PQC readiness by the deadline constitutes a material breach, entitling the buyer to terminate with 90 days notice and recover migration costs up to..."',
      },
    ],
  },
  {
    id: 'fips-mandate',
    title: 'FIPS Validation Mandate',
    description: 'Require FIPS 140-3 validated cryptographic modules for all vendor products.',
    fields: [
      {
        id: 'validation-level',
        label: 'Required FIPS 140-3 Security Level',
        type: 'select',
        placeholder: 'Select security level',
        options: [
          { value: 'level-1', label: 'Level 1 — Basic security' },
          { value: 'level-2', label: 'Level 2 — Tamper evidence' },
          { value: 'level-3', label: 'Level 3 — Tamper resistance' },
          { value: 'level-4', label: 'Level 4 — Physical security' },
        ],
      },
      {
        id: 'validation-timeline',
        label: 'Validation Achievement Timeline',
        type: 'text',
        placeholder: 'e.g., "Within 12 months of contract execution"',
      },
      {
        id: 'evidence-requirements',
        label: 'Evidence Requirements',
        type: 'checklist',
        options: [
          { value: 'cmvp-cert', label: 'CMVP Certificate Number' },
          { value: 'module-name', label: 'Validated Module Name and Version' },
          { value: 'test-lab', label: 'Accredited Testing Lab Report' },
          { value: 'algorithm-list', label: 'Approved Algorithm List (CAVP)' },
        ],
      },
    ],
  },
  {
    id: 'cbom-delivery',
    title: 'CBOM Delivery',
    description: 'Mandate delivery of Cryptographic Bill of Materials for supply chain visibility.',
    fields: [
      {
        id: 'delivery-frequency',
        label: 'Delivery Frequency',
        type: 'select',
        placeholder: 'Select frequency',
        options: [
          { value: 'per-release', label: 'Per Major Release' },
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'semi-annual', label: 'Semi-annually' },
          { value: 'annual', label: 'Annually' },
        ],
      },
      {
        id: 'format',
        label: 'Required Format',
        type: 'select',
        placeholder: 'Select format',
        options: [
          { value: 'cyclonedx-1.6', label: 'CycloneDX 1.6+ (with crypto extension)' },
          { value: 'cyclonedx-1.5', label: 'CycloneDX 1.5' },
          { value: 'spdx-3.0', label: 'SPDX 3.0' },
          { value: 'custom', label: 'Vendor-specific (with mapping)' },
        ],
      },
      {
        id: 'scope',
        label: 'Scope of CBOM',
        type: 'checklist',
        options: [
          { value: 'algorithms', label: 'All cryptographic algorithms and key sizes' },
          { value: 'protocols', label: 'TLS/SSH/IPsec protocol versions' },
          { value: 'certificates', label: 'Certificate types and validity' },
          { value: 'dependencies', label: 'Cryptographic library dependencies' },
          { value: 'quantum-status', label: 'Quantum vulnerability assessment per algorithm' },
        ],
      },
    ],
  },
  {
    id: 'change-notification',
    title: 'Crypto Change Notification',
    description: 'Require advance notice for any changes to cryptographic implementations.',
    fields: [
      {
        id: 'notice-period',
        label: 'Minimum Notice Period',
        type: 'select',
        placeholder: 'Select notice period',
        options: [
          { value: '30-days', label: '30 days' },
          { value: '60-days', label: '60 days' },
          { value: '90-days', label: '90 days' },
          { value: '180-days', label: '180 days' },
        ],
      },
      {
        id: 'approval-process',
        label: 'Approval Process',
        type: 'textarea',
        placeholder:
          'e.g., "All cryptographic changes require written approval from the buyer\'s CISO office before deployment to production..."',
      },
      {
        id: 'testing-requirements',
        label: 'Testing Requirements',
        type: 'checklist',
        options: [
          { value: 'regression', label: 'Full regression test results' },
          { value: 'interop', label: 'Interoperability testing with buyer systems' },
          { value: 'performance', label: 'Performance impact assessment' },
          { value: 'fips-revalidation', label: 'FIPS revalidation if module changes' },
        ],
      },
    ],
  },
  {
    id: 'audit-rights',
    title: 'Audit Rights',
    description: 'Reserve the right to audit vendor cryptographic practices.',
    fields: [
      {
        id: 'audit-frequency',
        label: 'Audit Frequency',
        type: 'select',
        placeholder: 'Select frequency',
        options: [
          { value: 'annual', label: 'Annual' },
          { value: 'semi-annual', label: 'Semi-annual' },
          { value: 'on-demand', label: 'On-demand (with reasonable notice)' },
          { value: 'incident', label: 'Post-incident only' },
        ],
      },
      {
        id: 'audit-scope',
        label: 'Audit Scope',
        type: 'checklist',
        options: [
          { value: 'key-management', label: 'Key management practices' },
          { value: 'algorithm-inventory', label: 'Cryptographic algorithm inventory' },
          { value: 'compliance-records', label: 'FIPS/PQC compliance records' },
          { value: 'incident-response', label: 'Crypto incident response procedures' },
          { value: 'pqc-roadmap', label: 'PQC migration roadmap progress' },
        ],
      },
      {
        id: 'access-requirements',
        label: 'Access Requirements',
        type: 'textarea',
        placeholder:
          'e.g., "Vendor shall provide buyer or its designated third-party auditor with reasonable access to documentation, personnel, and systems..."',
      },
    ],
  },
]

function renderContractPreview(data: Record<string, Record<string, string | string[]>>): string {
  let md = '# PQC VENDOR CONTRACT REQUIREMENTS\n\n'
  md += `**Document Generated:** ${new Date().toLocaleDateString()}\n`
  md += '**Classification:** Draft — For Legal Review\n\n---\n\n'

  // PQC Timeline
  const timeline = data['pqc-timeline'] || {}
  md += '## ARTICLE 1. POST-QUANTUM CRYPTOGRAPHIC READINESS\n\n'
  md += `**1.1** Vendor shall achieve full compliance with NIST post-quantum cryptographic standards no later than **${timeline['deadline-year'] || '[YEAR]'}**.\n\n`

  const algos = Array.isArray(timeline['algorithm-requirements'])
    ? timeline['algorithm-requirements']
    : []
  if (algos.length > 0) {
    md += '**1.2** Vendor products shall support the following algorithms:\n'
    const algoLabels: Record<string, string> = {
      'ml-kem': 'ML-KEM (FIPS 203)',
      'ml-dsa': 'ML-DSA (FIPS 204)',
      'slh-dsa': 'SLH-DSA (FIPS 205)',
      'lms-hss': 'LMS/HSS (SP 800-208)',
    }
    for (const a of algos) {
      md += `  - ${algoLabels[a] || a}\n`
    }
    md += '\n'
  }

  if (timeline['penalty']) {
    md += `**1.3 Non-Compliance:** ${timeline['penalty']}\n\n`
  }

  // FIPS Mandate
  const fips = data['fips-mandate'] || {}
  md += '## ARTICLE 2. FIPS 140-3 VALIDATION\n\n'
  const levelLabels: Record<string, string> = {
    'level-1': 'Security Level 1',
    'level-2': 'Security Level 2',
    'level-3': 'Security Level 3',
    'level-4': 'Security Level 4',
  }
  md += `**2.1** All cryptographic modules shall maintain FIPS 140-3 validation at **${levelLabels[fips['validation-level'] as string] || '[LEVEL]'}** or higher.\n\n`

  if (fips['validation-timeline']) {
    md += `**2.2 Timeline:** ${fips['validation-timeline']}\n\n`
  }

  const evidence = Array.isArray(fips['evidence-requirements']) ? fips['evidence-requirements'] : []
  if (evidence.length > 0) {
    md += '**2.3 Evidence Required:**\n'
    const evidenceLabels: Record<string, string> = {
      'cmvp-cert': 'CMVP Certificate Number',
      'module-name': 'Validated Module Name and Version',
      'test-lab': 'Accredited Testing Lab Report',
      'algorithm-list': 'Approved Algorithm List (CAVP)',
    }
    for (const e of evidence) {
      md += `  - ${evidenceLabels[e] || e}\n`
    }
    md += '\n'
  }

  // CBOM
  const cbom = data['cbom-delivery'] || {}
  md += '## ARTICLE 3. CRYPTOGRAPHIC BILL OF MATERIALS\n\n'
  md += `**3.1** Vendor shall deliver a Cryptographic Bill of Materials (CBOM) **${cbom['delivery-frequency'] || '[FREQUENCY]'}** in **${cbom['format'] || '[FORMAT]'}** format.\n\n`

  const scope = Array.isArray(cbom['scope']) ? cbom['scope'] : []
  if (scope.length > 0) {
    md += '**3.2 CBOM Scope:**\n'
    const scopeLabels: Record<string, string> = {
      algorithms: 'All cryptographic algorithms and key sizes',
      protocols: 'TLS/SSH/IPsec protocol versions',
      certificates: 'Certificate types and validity periods',
      dependencies: 'Cryptographic library dependencies',
      'quantum-status': 'Quantum vulnerability assessment per algorithm',
    }
    for (const s of scope) {
      md += `  - ${scopeLabels[s] || s}\n`
    }
    md += '\n'
  }

  // Change Notification
  const change = data['change-notification'] || {}
  md += '## ARTICLE 4. CRYPTOGRAPHIC CHANGE NOTIFICATION\n\n'
  md += `**4.1** Vendor shall provide a minimum of **${change['notice-period'] || '[PERIOD]'}** advance written notice before any change to cryptographic implementations.\n\n`

  if (change['approval-process']) {
    md += `**4.2 Approval Process:** ${change['approval-process']}\n\n`
  }

  const testing = Array.isArray(change['testing-requirements'])
    ? change['testing-requirements']
    : []
  if (testing.length > 0) {
    md += '**4.3 Testing Requirements:**\n'
    const testLabels: Record<string, string> = {
      regression: 'Full regression test results',
      interop: 'Interoperability testing with buyer systems',
      performance: 'Performance impact assessment',
      'fips-revalidation': 'FIPS revalidation if module changes',
    }
    for (const t of testing) {
      md += `  - ${testLabels[t] || t}\n`
    }
    md += '\n'
  }

  // Audit Rights
  const audit = data['audit-rights'] || {}
  md += '## ARTICLE 5. AUDIT RIGHTS\n\n'
  md += `**5.1** Buyer reserves the right to audit Vendor cryptographic practices **${audit['audit-frequency'] || '[FREQUENCY]'}**.\n\n`

  const auditScope = Array.isArray(audit['audit-scope']) ? audit['audit-scope'] : []
  if (auditScope.length > 0) {
    md += '**5.2 Audit Scope:**\n'
    const auditLabels: Record<string, string> = {
      'key-management': 'Key management practices',
      'algorithm-inventory': 'Cryptographic algorithm inventory',
      'compliance-records': 'FIPS/PQC compliance records',
      'incident-response': 'Crypto incident response procedures',
      'pqc-roadmap': 'PQC migration roadmap progress',
    }
    for (const a of auditScope) {
      md += `  - ${auditLabels[a] || a}\n`
    }
    md += '\n'
  }

  if (audit['access-requirements']) {
    md += `**5.3 Access:** ${audit['access-requirements']}\n\n`
  }

  md += '---\n\n'
  md +=
    '*This document is generated for educational purposes. Consult legal counsel before incorporating into vendor agreements.*\n'

  return md
}

export const ContractClauseGenerator: React.FC = () => {
  const { addExecutiveDocument } = useModuleStore()
  const { industry, country, myFrameworks, myProducts, migrationDeadlineYear } =
    useExecutiveModuleData()
  const vendorDependency = useAssessmentStore((s) => s.vendorDependency)

  const handleExport = useCallback(
    (data: Record<string, Record<string, string | string[]>>) => {
      const md = renderContractPreview(data)
      addExecutiveDocument({
        id: `contract-clause-${Date.now()}`,
        moduleId: MODULE_ID,
        type: 'contract-clause',
        title: `PQC Vendor Contract Requirements — ${new Date().toLocaleDateString()}`,
        data: md,
        createdAt: Date.now(),
      })
    },
    [addExecutiveDocument]
  )

  const seedSources: string[] = []
  if (industry) seedSources.push(`industry (${industry})`)
  if (country) seedSources.push(`country (${country})`)
  if (vendorDependency) seedSources.push(`vendor dependency (${vendorDependency})`)
  if (myFrameworks.length > 0)
    seedSources.push(
      `${myFrameworks.length} framework${myFrameworks.length !== 1 ? 's' : ''} from /compliance`
    )
  if (myProducts.length > 0)
    seedSources.push(
      `${myProducts.length} vendor product${myProducts.length !== 1 ? 's' : ''} from /migrate`
    )
  if (migrationDeadlineYear) seedSources.push(`deadline ${migrationDeadlineYear} from /timeline`)

  // Heavy / mixed vendor dependency → escalate severity guidance shown above
  // the section editor so reviewers know to tighten penalty + termination
  // clauses. (The clause sections themselves remain editable.)
  const showHighSeverityHint = vendorDependency === 'heavy-vendor' || vendorDependency === 'mixed'

  return (
    <div className="space-y-6">
      {seedSources.length > 0 && (
        <PreFilledBanner
          summary={`Contract scope informed by ${seedSources.join(' + ')}.`}
          onClear={() => {
            /* CONTRACT_SECTIONS are static — clear is informational */
          }}
        />
      )}
      {showHighSeverityHint && (
        <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 p-3 text-xs text-foreground/80">
          <strong>High vendor exposure:</strong> your assessment reports{' '}
          <span className="font-mono">{vendorDependency}</span> vendor dependency. Consider
          tightening penalty caps, audit-rights frequency, and termination triggers in the clauses
          below.
        </div>
      )}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-foreground/80">
          Build PQC-ready contract clauses for vendor agreements
          {industry ? ` tailored for the ${industry} sector` : ''}
          {country ? ` (${country})` : ''}. Fill in each section with your organization&apos;s
          requirements, then switch to <strong>Preview</strong> mode to see the generated contract
          language. Export as Markdown for legal review.
        </p>
      </div>

      <ArtifactBuilder
        title="PQC Vendor Contract Requirements"
        description="Generated contract clauses for vendor PQC compliance."
        sections={CONTRACT_SECTIONS}
        onExport={handleExport}
        exportFilename="pqc-vendor-contract"
        renderPreview={renderContractPreview}
      />
    </div>
  )
}
