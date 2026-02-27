/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo, useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection } from '@/components/PKILearning/common/executive'

type PolicyType =
  | 'crypto-algorithm'
  | 'key-management'
  | 'vendor-requirements'
  | 'migration-timeline'

interface PolicyTypeOption {
  id: PolicyType
  label: string
  description: string
}

const POLICY_TYPES: PolicyTypeOption[] = [
  {
    id: 'crypto-algorithm',
    label: 'Cryptographic Algorithm Policy',
    description: 'Define approved and prohibited algorithms for the organization.',
  },
  {
    id: 'key-management',
    label: 'Key Management Policy',
    description: 'Establish key lifecycle rules, HSM requirements, and PQC parameters.',
  },
  {
    id: 'vendor-requirements',
    label: 'Vendor Crypto Requirements',
    description: 'Set cryptographic readiness criteria for vendor procurement.',
  },
  {
    id: 'migration-timeline',
    label: 'Migration Timeline Policy',
    description: 'Define deadlines and phases for the PQC transition.',
  },
]

function buildSections(
  policyType: PolicyType,
  frameworkNames: string[],
  deadlineYear: number | null
): ArtifactSection[] {
  const commonFields: ArtifactSection = {
    id: 'general',
    title: 'General Information',
    description: 'Organization and policy metadata.',
    fields: [
      {
        id: 'org-name',
        label: 'Organization Name',
        type: 'text',
        placeholder: 'Enter your organization name',
      },
      {
        id: 'effective-date',
        label: 'Effective Date',
        type: 'text',
        placeholder: 'e.g., 2026-07-01',
      },
      {
        id: 'frameworks',
        label: 'Applicable Standards / Frameworks',
        type: 'checklist',
        options:
          frameworkNames.length > 0
            ? frameworkNames.map((f) => ({ value: f, label: f }))
            : [
                { value: 'NIST SP 800-208', label: 'NIST SP 800-208' },
                { value: 'FIPS 203 (ML-KEM)', label: 'FIPS 203 (ML-KEM)' },
                { value: 'FIPS 204 (ML-DSA)', label: 'FIPS 204 (ML-DSA)' },
                { value: 'FIPS 205 (SLH-DSA)', label: 'FIPS 205 (SLH-DSA)' },
                { value: 'CNSA 2.0', label: 'NSA CNSA 2.0' },
                { value: 'ANSSI', label: 'ANSSI Recommendations' },
                { value: 'BSI TR-02102', label: 'BSI TR-02102' },
              ],
      },
    ],
  }

  switch (policyType) {
    case 'crypto-algorithm':
      return [
        commonFields,
        {
          id: 'approved-algorithms',
          title: 'Approved Algorithms',
          description: 'Algorithms approved for use in production systems.',
          fields: [
            {
              id: 'approved-kem',
              label: 'Approved Key Encapsulation Mechanisms',
              type: 'checklist',
              options: [
                { value: 'ML-KEM-768', label: 'ML-KEM-768 (FIPS 203)' },
                { value: 'ML-KEM-1024', label: 'ML-KEM-1024 (FIPS 203)' },
                { value: 'X25519MLKEM768', label: 'X25519MLKEM768 (Hybrid)' },
                {
                  value: 'FrodoKEM-1344',
                  label: 'FrodoKEM-1344-SHAKE (NIST IR 8413 candidate — pre-standard)',
                },
              ],
              defaultValue: ['ML-KEM-768', 'ML-KEM-1024'],
            },
            {
              id: 'approved-sig',
              label: 'Approved Signature Algorithms',
              type: 'checklist',
              options: [
                { value: 'ML-DSA-65', label: 'ML-DSA-65 (FIPS 204)' },
                { value: 'ML-DSA-87', label: 'ML-DSA-87 (FIPS 204)' },
                { value: 'SLH-DSA-SHA2-128s', label: 'SLH-DSA-SHA2-128s (FIPS 205)' },
                { value: 'SLH-DSA-SHA2-256s', label: 'SLH-DSA-SHA2-256s (FIPS 205)' },
                { value: 'LMS', label: 'LMS/HSS (NIST SP 800-208)' },
                { value: 'XMSS', label: 'XMSS/XMSS^MT (NIST SP 800-208)' },
              ],
              defaultValue: ['ML-DSA-65', 'ML-DSA-87'],
            },
          ],
        },
        {
          id: 'prohibited-algorithms',
          title: 'Prohibited Algorithms',
          description:
            'Algorithms disallowed for new deployments. Existing uses must be migrated according to the timeline policy.',
          fields: [
            {
              id: 'prohibited-list',
              label: 'Prohibited for New Deployments (quantum-vulnerable)',
              type: 'checklist',
              options: [
                { value: 'RSA-2048', label: 'RSA < 3072 bits' },
                {
                  value: 'ECDSA',
                  label: 'ECDSA (all curves) — vulnerable to Shor\u2019s algorithm',
                },
                { value: 'ECDH', label: 'ECDH (all curves) — vulnerable to Shor\u2019s algorithm' },
                { value: 'DH', label: 'Diffie-Hellman (finite field)' },
                { value: 'DSA', label: 'DSA' },
              ],
              defaultValue: ['RSA-2048', 'DSA'],
            },
            {
              id: 'migration-required',
              label:
                'Quantum-Vulnerable \u2014 Migration Required (FIPS-approved but not quantum-safe)',
              type: 'checklist',
              options: [
                {
                  value: 'Ed25519',
                  label:
                    'Ed25519 (FIPS 186-5 approved, but vulnerable to Shor\u2019s algorithm \u2014 must migrate before CRQC)',
                },
                {
                  value: 'Ed448',
                  label:
                    'Ed448 (FIPS 186-5 approved, but vulnerable to Shor\u2019s algorithm \u2014 must migrate before CRQC)',
                },
              ],
            },
          ],
        },
        {
          id: 'exceptions',
          title: 'Exception Process',
          fields: [
            {
              id: 'exception-process',
              label: 'Exception Request Process',
              type: 'textarea',
              placeholder:
                'Describe the process for requesting an exception to the algorithm policy (e.g., approval authority, maximum duration, compensating controls required).',
            },
          ],
        },
      ]

    case 'key-management':
      return [
        commonFields,
        {
          id: 'key-lifecycle',
          title: 'Key Lifecycle Requirements',
          description: 'Rules for key generation, storage, rotation, and destruction.',
          fields: [
            {
              id: 'generation',
              label: 'Key Generation Requirements',
              type: 'textarea',
              placeholder:
                'e.g., All PQC keys must be generated in FIPS 140-3 Level 2+ validated HSMs. ML-KEM keys must use NIST-approved DRBG for seed generation.',
            },
            {
              id: 'rotation-period',
              label: 'Maximum Key Rotation Period',
              type: 'select',
              options: [
                { value: '90-days', label: '90 days' },
                { value: '180-days', label: '180 days' },
                { value: '1-year', label: '1 year' },
                { value: '2-years', label: '2 years' },
              ],
            },
            {
              id: 'storage',
              label: 'Key Storage Requirements',
              type: 'textarea',
              placeholder:
                'e.g., Private keys must never be stored in plaintext. HSM or secure enclave required for signing keys. Key wrapping must use AES-256-GCM or ML-KEM.',
            },
            {
              id: 'destruction',
              label: 'Key Destruction Policy',
              type: 'textarea',
              placeholder:
                'e.g., Key material must be zeroized upon rotation. HSM key destruction must follow NIST SP 800-88 guidelines.',
            },
          ],
        },
        {
          id: 'hsm-requirements',
          title: 'HSM Requirements',
          fields: [
            {
              id: 'hsm-pqc',
              label: 'PQC HSM Requirements',
              type: 'checklist',
              options: [
                { value: 'fips-140-3', label: 'FIPS 140-3 Level 2+ validation' },
                { value: 'ml-kem', label: 'ML-KEM support' },
                { value: 'ml-dsa', label: 'ML-DSA support' },
                { value: 'slh-dsa', label: 'SLH-DSA support' },
                { value: 'hybrid', label: 'Hybrid key operations' },
                { value: 'firmware-update', label: 'Firmware-upgradable for new algorithms' },
              ],
            },
          ],
        },
        {
          id: 'exceptions',
          title: 'Exception Process',
          fields: [
            {
              id: 'exception-process',
              label: 'Exception Request Process',
              type: 'textarea',
              placeholder: 'Describe the process for requesting key management exceptions.',
            },
          ],
        },
      ]

    case 'vendor-requirements':
      return [
        commonFields,
        {
          id: 'vendor-crypto',
          title: 'Vendor Cryptographic Requirements',
          description: 'Minimum cryptographic capabilities vendors must demonstrate.',
          fields: [
            {
              id: 'pqc-readiness',
              label: 'PQC Readiness Requirements',
              type: 'checklist',
              options: [
                { value: 'pqc-roadmap', label: 'Published PQC migration roadmap' },
                { value: 'ml-kem-support', label: 'ML-KEM support (GA or beta)' },
                { value: 'ml-dsa-support', label: 'ML-DSA support (GA or beta)' },
                { value: 'hybrid-support', label: 'Hybrid mode support' },
                { value: 'fips-validated', label: 'FIPS 140-3 validated crypto module' },
                { value: 'crypto-agile', label: 'Crypto-agile architecture (algorithm swappable)' },
              ],
            },
            {
              id: 'contract-clauses',
              label: 'Required Contract Clauses',
              type: 'textarea',
              placeholder:
                'e.g., Vendor must achieve PQC readiness by [date]. Vendor must notify within 30 days of any cryptographic vulnerability. Vendor must support hybrid TLS within 12 months of NIST finalization.',
            },
            {
              id: 'assessment-frequency',
              label: 'Vendor Assessment Frequency',
              type: 'select',
              options: [
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'semi-annual', label: 'Semi-annually' },
                { value: 'annual', label: 'Annually' },
                { value: 'contract-renewal', label: 'At contract renewal' },
              ],
            },
          ],
        },
        {
          id: 'exceptions',
          title: 'Exception Process',
          fields: [
            {
              id: 'exception-process',
              label: 'Vendor Exception Process',
              type: 'textarea',
              placeholder:
                'Describe how to handle vendors that cannot meet PQC requirements by the deadline.',
            },
          ],
        },
      ]

    case 'migration-timeline':
      return [
        commonFields,
        {
          id: 'deadlines',
          title: 'Migration Deadlines',
          description: 'Phase deadlines for the PQC transition.',
          fields: [
            {
              id: 'transition-deadline',
              label: 'Overall Transition Deadline',
              type: 'text',
              placeholder: deadlineYear
                ? `Pre-populated: ${deadlineYear} (from your country assessment)`
                : 'e.g., 2030-12-31',
              defaultValue: deadlineYear ? String(deadlineYear) : '',
            },
            {
              id: 'phase-1-deadline',
              label: 'Phase 1: Inventory & Assessment Complete By',
              type: 'text',
              placeholder: 'e.g., Q2 2026',
            },
            {
              id: 'phase-2-deadline',
              label: 'Phase 2: Hybrid Deployment Complete By',
              type: 'text',
              placeholder: 'e.g., Q4 2027',
            },
            {
              id: 'phase-3-deadline',
              label: 'Phase 3: Full PQC Migration Complete By',
              type: 'text',
              placeholder: 'e.g., Q4 2029',
            },
          ],
        },
        {
          id: 'prioritization',
          title: 'System Prioritization',
          description: 'Criteria for determining migration order.',
          fields: [
            {
              id: 'priority-criteria',
              label: 'Prioritization Criteria',
              type: 'checklist',
              options: [
                { value: 'data-sensitivity', label: 'Data sensitivity (HNDL risk)' },
                { value: 'compliance', label: 'Compliance obligations (FIPS, CMMC, etc.)' },
                { value: 'internet-facing', label: 'Internet-facing exposure' },
                { value: 'vendor-dependency', label: 'Vendor PQC readiness' },
                { value: 'business-criticality', label: 'Business criticality' },
                { value: 'data-retention', label: 'Long-term data retention requirements' },
              ],
              defaultValue: ['data-sensitivity', 'compliance'],
            },
            {
              id: 'hybrid-requirement',
              label: 'Hybrid Deployment Requirement',
              type: 'textarea',
              placeholder:
                'e.g., All new TLS endpoints must use hybrid key exchange (X25519MLKEM768) by [date]. Existing endpoints must transition to hybrid within 12 months.',
            },
          ],
        },
        {
          id: 'exceptions',
          title: 'Exception Process',
          fields: [
            {
              id: 'exception-process',
              label: 'Timeline Exception Process',
              type: 'textarea',
              placeholder:
                'Describe how teams can request deadline extensions and what compensating controls are required.',
            },
          ],
        },
      ]
  }
}

function renderPolicyPreview(
  policyType: PolicyType,
  data: Record<string, Record<string, string | string[]>>
): string {
  const orgName = (data.general?.['org-name'] as string) || '[Organization Name]'
  const effectiveDate = (data.general?.['effective-date'] as string) || '[Effective Date]'
  const frameworks = (data.general?.frameworks as string[]) || []

  const policyTitle = POLICY_TYPES.find((p) => p.id === policyType)?.label || 'Policy'

  let md = `# ${orgName} - ${policyTitle}\n\n`
  md += `**Effective Date:** ${effectiveDate}\n\n`
  md += `**Applicable Frameworks:** ${frameworks.length > 0 ? frameworks.join(', ') : 'None selected'}\n\n`
  md += `Generated: ${new Date().toLocaleDateString()}\n\n---\n\n`

  // Render remaining sections
  const sectionKeys = Object.keys(data).filter((k) => k !== 'general')
  for (const sectionId of sectionKeys) {
    const sectionData = data[sectionId]
    // Convert section ID to title
    const title = sectionId
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    md += `## ${title}\n\n`

    for (const [fieldId, value] of Object.entries(sectionData)) {
      const fieldLabel = fieldId
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

      if (Array.isArray(value)) {
        md += `### ${fieldLabel}\n\n`
        for (const item of value) {
          md += `- [x] ${item}\n`
        }
        md += '\n'
      } else if (value) {
        md += `**${fieldLabel}:** ${value}\n\n`
      }
    }
  }

  return md
}

export const PolicyTemplateGenerator: React.FC = () => {
  const [activePolicyType, setActivePolicyType] = useState<PolicyType>('crypto-algorithm')
  const { addExecutiveDocument } = useModuleStore()
  const execData = useExecutiveModuleData()

  const frameworkNames = useMemo(
    () => execData.frameworksByIndustry.map((f) => f.label).slice(0, 12),
    [execData.frameworksByIndustry]
  )

  const sections = useMemo(
    () => buildSections(activePolicyType, frameworkNames, execData.migrationDeadlineYear),
    [activePolicyType, frameworkNames, execData.migrationDeadlineYear]
  )

  const handleExport = useCallback(
    (data: Record<string, Record<string, string | string[]>>) => {
      const markdown = renderPolicyPreview(activePolicyType, data)
      const policyLabel = POLICY_TYPES.find((p) => p.id === activePolicyType)?.label || 'Policy'

      addExecutiveDocument({
        id: `policy-${activePolicyType}-${Date.now()}`,
        moduleId: 'pqc-governance',
        type: 'policy-draft',
        title: policyLabel,
        data: markdown,
        createdAt: Date.now(),
      })
    },
    [activePolicyType, addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select a policy type, fill in the template fields, and export a customized PQC policy
        document. Framework options are auto-populated from your assessment data when available.
      </p>

      {/* Policy Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {POLICY_TYPES.map((pt) => (
          <button
            key={pt.id}
            onClick={() => setActivePolicyType(pt.id)}
            className={`text-left p-3 rounded-lg border transition-colors ${
              activePolicyType === pt.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <div className="text-sm font-semibold">{pt.label}</div>
            <p className="text-[10px] mt-1 opacity-70">{pt.description}</p>
          </button>
        ))}
      </div>

      {/* ArtifactBuilder */}
      <ArtifactBuilder
        key={activePolicyType}
        title={POLICY_TYPES.find((p) => p.id === activePolicyType)?.label || 'Policy'}
        description={POLICY_TYPES.find((p) => p.id === activePolicyType)?.description}
        sections={sections}
        onExport={handleExport}
        exportFilename={`pqc-${activePolicyType}-policy`}
        renderPreview={(data) => renderPolicyPreview(activePolicyType, data)}
      />
    </div>
  )
}
