// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo, useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import { OptionTile } from '@/components/common/OptionTile'
import { Button } from '@/components/ui/button'
import { FileText, KeyRound, Building2, CalendarClock } from 'lucide-react'

type PolicyType =
  | 'crypto-algorithm'
  | 'key-management'
  | 'vendor-requirements'
  | 'migration-timeline'

interface PolicyTypeOption {
  id: PolicyType
  label: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  sectionSummary: string
}

const POLICY_TYPES: PolicyTypeOption[] = [
  {
    id: 'crypto-algorithm',
    label: 'Cryptographic Algorithm Policy',
    description: 'Define approved and prohibited algorithms for the organization.',
    icon: FileText,
    sectionSummary: 'Approved algorithms · Prohibited algorithms · Exception process',
  },
  {
    id: 'key-management',
    label: 'Key Management Policy',
    description: 'Establish key lifecycle rules, HSM requirements, and PQC parameters.',
    icon: KeyRound,
    sectionSummary: 'Key lifecycle · HSM requirements · Exception process',
  },
  {
    id: 'vendor-requirements',
    label: 'Vendor Crypto Requirements',
    description: 'Set cryptographic readiness criteria for vendor procurement.',
    icon: Building2,
    sectionSummary: 'Vendor readiness · Contract clauses · Exception process',
  },
  {
    id: 'migration-timeline',
    label: 'Migration Timeline Policy',
    description: 'Define deadlines and phases for the PQC transition.',
    icon: CalendarClock,
    sectionSummary: 'Migration deadlines · System prioritization · Exception process',
  },
]

interface BuildArgs {
  policyType: PolicyType
  frameworkNames: string[]
  deadlineYear: number | null
  country: string
  industry: string
  dataSensitivity: string[]
  simplified: boolean
}

function suggestRotationPeriod(dataSensitivity: string[]): string {
  if (dataSensitivity.includes('critical')) return '90-days'
  if (dataSensitivity.includes('high')) return '180-days'
  if (dataSensitivity.includes('medium')) return '1-year'
  return ''
}

function generalSection(args: BuildArgs): ArtifactSection {
  const { frameworkNames, country, industry } = args
  const defaultFrameworks: { value: string; label: string }[] = [
    { value: 'NIST SP 800-208', label: 'NIST SP 800-208 (stateful hash-based signatures)' },
    { value: 'FIPS 203 (ML-KEM)', label: 'FIPS 203 (ML-KEM)' },
    { value: 'FIPS 204 (ML-DSA)', label: 'FIPS 204 (ML-DSA)' },
    { value: 'FIPS 205 (SLH-DSA)', label: 'FIPS 205 (SLH-DSA)' },
    { value: 'CNSA 2.0', label: 'NSA CNSA 2.0' },
    { value: 'ANSSI', label: 'ANSSI Recommendations' },
    { value: 'BSI TR-02102', label: 'BSI TR-02102' },
  ]

  const frameworkOptions =
    frameworkNames.length > 0
      ? frameworkNames.map((f) => ({ value: f, label: f }))
      : defaultFrameworks

  return {
    id: 'general',
    title: 'General Information',
    description: 'Organization, jurisdiction, and policy metadata.',
    fields: [
      {
        id: 'org-name',
        label: 'Organization Name',
        type: 'text',
        placeholder: 'Enter your organization name',
      },
      {
        id: 'jurisdiction',
        label: 'Jurisdiction / Country',
        type: 'text',
        placeholder: country ? `Pre-populated from assessment: ${country}` : 'e.g., United States',
        defaultValue: country || '',
      },
      {
        id: 'industry',
        label: 'Industry',
        type: 'text',
        placeholder: industry ? `Pre-populated from assessment: ${industry}` : 'e.g., Healthcare',
        defaultValue: industry || '',
      },
      {
        id: 'policy-owner',
        label: 'Policy Owner (role or name)',
        type: 'text',
        placeholder: 'e.g., Chief Information Security Officer',
      },
      {
        id: 'policy-version',
        label: 'Policy Version',
        type: 'text',
        placeholder: 'e.g., 1.0',
        defaultValue: '1.0',
      },
      {
        id: 'effective-date',
        label: 'Effective Date',
        type: 'date',
        placeholder: 'YYYY-MM-DD',
      },
      {
        id: 'review-cadence',
        label: 'Review Cadence',
        type: 'select',
        options: [
          { value: 'Quarterly', label: 'Quarterly' },
          { value: 'Semi-annually', label: 'Semi-annually' },
          { value: 'Annually', label: 'Annually (recommended minimum)' },
          { value: 'Biennially', label: 'Biennially' },
        ],
        defaultValue: 'Annually',
      },
      {
        id: 'approver',
        label: 'Approver / Sign-off',
        type: 'text',
        placeholder: 'e.g., Chief Information Officer',
      },
      {
        id: 'frameworks',
        label: 'Applicable Standards / Frameworks',
        type: 'checklist',
        options: frameworkOptions,
      },
    ],
  }
}

function cryptoAlgorithmSections(args: BuildArgs): ArtifactSection[] {
  const { simplified } = args
  const common = generalSection(args)

  const kemOptionsFull = [
    { value: 'ML-KEM-512', label: 'ML-KEM-512 (FIPS 203 — Category 1)' },
    { value: 'ML-KEM-768', label: 'ML-KEM-768 (FIPS 203 — Category 3)' },
    { value: 'ML-KEM-1024', label: 'ML-KEM-1024 (FIPS 203 — Category 5)' },
    { value: 'X25519MLKEM768', label: 'X25519MLKEM768 (hybrid, IETF draft)' },
    {
      value: 'FrodoKEM-1344',
      label: 'FrodoKEM-1344-SHAKE (NIST PQC alternate — draft, not standardized)',
    },
    {
      value: 'HQC-128',
      label: 'HQC-128 (NIST PQC Round 4 selection — draft, not standardized)',
    },
  ]
  const kemOptionsExec = [
    { value: 'ML-KEM-768', label: 'NIST-approved KEM — standard strength (FIPS 203, ML-KEM-768)' },
    {
      value: 'ML-KEM-1024',
      label: 'NIST-approved KEM — high strength (FIPS 203, ML-KEM-1024)',
    },
    {
      value: 'X25519MLKEM768',
      label: 'Hybrid KEM (classical + PQC, IETF draft) — recommended for transition',
    },
  ]

  const sigOptionsFull = [
    { value: 'ML-DSA-44', label: 'ML-DSA-44 (FIPS 204 — Category 2)' },
    { value: 'ML-DSA-65', label: 'ML-DSA-65 (FIPS 204 — Category 3)' },
    { value: 'ML-DSA-87', label: 'ML-DSA-87 (FIPS 204 — Category 5)' },
    {
      value: 'FN-DSA-512',
      label: 'FN-DSA-512 (draft, not standardized — compact lattice signatures)',
    },
    {
      value: 'FN-DSA-1024',
      label: 'FN-DSA-1024 (draft, not standardized — Category 5)',
    },
    { value: 'SLH-DSA-SHA2-128s', label: 'SLH-DSA-SHA2-128s (FIPS 205)' },
    { value: 'SLH-DSA-SHA2-256s', label: 'SLH-DSA-SHA2-256s (FIPS 205)' },
    { value: 'LMS', label: 'LMS/HSS (NIST SP 800-208 — stateful)' },
    { value: 'XMSS', label: 'XMSS/XMSS^MT (NIST SP 800-208 — stateful)' },
  ]
  const sigOptionsExec = [
    {
      value: 'ML-DSA-65',
      label: 'NIST-approved signature — standard strength (FIPS 204, ML-DSA-65)',
    },
    {
      value: 'ML-DSA-87',
      label: 'NIST-approved signature — high strength (FIPS 204, ML-DSA-87)',
    },
    {
      value: 'SLH-DSA-SHA2-256s',
      label: 'Hash-based signature — conservative option (FIPS 205, SLH-DSA-256s)',
    },
  ]

  const prohibitedOptionsFull = [
    { value: 'rsa-lt-3072', label: 'RSA < 3072 bits' },
    { value: 'ecdsa', label: 'ECDSA (all curves) — vulnerable to Shor\u2019s algorithm' },
    { value: 'ecdh', label: 'ECDH (all curves) — vulnerable to Shor\u2019s algorithm' },
    { value: 'dh', label: 'Diffie-Hellman (finite field) — vulnerable to Shor\u2019s algorithm' },
    { value: 'dsa', label: 'DSA' },
  ]
  const prohibitedOptionsExec = [
    {
      value: 'classical-asym',
      label: 'All classical asymmetric crypto (RSA, ECDSA, ECDH, DH, DSA)',
    },
    { value: 'rsa-lt-3072', label: 'RSA < 3072 bits (weak even against classical attacks)' },
  ]

  const migrationRequiredFull = [
    {
      value: 'ed25519',
      label:
        'Ed25519 (FIPS 186-5 approved but vulnerable to Shor\u2019s algorithm — must migrate before CRQC)',
    },
    {
      value: 'ed448',
      label:
        'Ed448 (FIPS 186-5 approved but vulnerable to Shor\u2019s algorithm — must migrate before CRQC)',
    },
    {
      value: 'rsa-ge-3072',
      label:
        'RSA \u2265 3072 bits (FIPS-approved but vulnerable to Shor\u2019s algorithm — must migrate before CRQC)',
    },
  ]

  return [
    common,
    {
      id: 'approved-algorithms',
      title: 'Approved Algorithms',
      description: 'Algorithms approved for use in production systems.',
      fields: [
        {
          id: 'approved-kem',
          label: 'Approved Key Encapsulation Mechanisms',
          type: 'checklist',
          options: simplified ? kemOptionsExec : kemOptionsFull,
          defaultValue: simplified
            ? ['ML-KEM-768', 'X25519MLKEM768']
            : ['ML-KEM-768', 'ML-KEM-1024'],
        },
        {
          id: 'approved-sig',
          label: 'Approved Signature Algorithms',
          type: 'checklist',
          options: simplified ? sigOptionsExec : sigOptionsFull,
          defaultValue: simplified ? ['ML-DSA-65', 'ML-DSA-87'] : ['ML-DSA-65', 'ML-DSA-87'],
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
          options: simplified ? prohibitedOptionsExec : prohibitedOptionsFull,
          defaultValue: simplified ? ['classical-asym'] : ['rsa-lt-3072', 'dsa'],
        },
        ...(simplified
          ? []
          : [
              {
                id: 'migration-required',
                label:
                  'Quantum-Vulnerable \u2014 Migration Required (FIPS-approved but not quantum-safe)',
                type: 'checklist' as const,
                options: migrationRequiredFull,
              },
            ]),
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
          placeholder: simplified
            ? 'Describe the process for requesting temporary exceptions (who approves, max duration, required compensating controls).'
            : 'Describe the process for requesting an exception to the algorithm policy (e.g., approval authority, maximum duration, compensating controls required).',
        },
      ],
    },
  ]
}

function keyManagementSections(args: BuildArgs): ArtifactSection[] {
  const { simplified, dataSensitivity } = args
  const common = generalSection(args)
  const suggestedRotation = suggestRotationPeriod(dataSensitivity)

  return [
    common,
    {
      id: 'key-lifecycle',
      title: 'Key Lifecycle Requirements',
      description: 'Rules for key generation, storage, rotation, and destruction.',
      fields: [
        {
          id: 'generation',
          label: 'Key Generation Requirements',
          type: 'textarea',
          placeholder: simplified
            ? 'e.g., PQC keys generated inside validated hardware security modules using NIST-approved random number generation.'
            : 'e.g., All PQC keys must be generated in FIPS 140-3 Level 2+ validated HSMs. ML-KEM keys must use NIST-approved DRBG for seed generation.',
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
          defaultValue: suggestedRotation,
        },
        {
          id: 'storage',
          label: 'Key Storage Requirements',
          type: 'textarea',
          placeholder: simplified
            ? 'e.g., Private keys must be protected in hardware (HSM) or equivalent; never stored in plaintext.'
            : 'e.g., Private keys must never be stored in plaintext. HSM or secure enclave required for signing keys. Key wrapping must use AES-256-GCM or ML-KEM.',
        },
        {
          id: 'stateful-sig',
          label: 'Stateful Signature State Management (LMS/XMSS)',
          type: 'textarea',
          placeholder:
            'e.g., LMS/XMSS private-key state must be synchronized with an HSM-enforced counter. State backups prohibited. State loss requires revocation and re-issuance.',
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
            { value: 'pkcs11-v32', label: 'PKCS#11 v3.2 API support' },
          ],
          defaultValue: ['fips-140-3', 'ml-kem', 'ml-dsa', 'firmware-update'],
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
}

function vendorSections(args: BuildArgs): ArtifactSection[] {
  const { simplified } = args
  const common = generalSection(args)

  return [
    common,
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
            { value: 'cbom', label: 'Cryptographic Bill of Materials (CBOM) provided' },
          ],
          defaultValue: simplified
            ? ['pqc-roadmap', 'fips-validated']
            : ['pqc-roadmap', 'crypto-agile'],
        },
        {
          id: 'contract-clauses',
          label: 'Required Contract Clauses',
          type: 'textarea',
          placeholder: simplified
            ? 'e.g., Vendor commits to PQC-readiness by a stated date. Vendor discloses cryptographic vulnerabilities within 30 days.'
            : 'e.g., Vendor must achieve PQC readiness by [date]. Vendor must notify within 30 days of any cryptographic vulnerability. Vendor must support hybrid TLS within 12 months of NIST finalization. Vendor must provide CBOM/SBOM with SHA-256 attestation on each release.',
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
          defaultValue: 'annual',
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
}

function migrationTimelineSections(args: BuildArgs): ArtifactSection[] {
  const { deadlineYear, dataSensitivity } = args
  const common = generalSection(args)

  const criticalSensitivity =
    dataSensitivity.includes('critical') || dataSensitivity.includes('high')

  return [
    common,
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
          id: 'phase-0-deadline',
          label: 'Phase 0: Crypto Discovery & Inventory Complete By',
          type: 'text',
          placeholder: 'e.g., Q1 2026',
        },
        {
          id: 'phase-1-deadline',
          label: 'Phase 1: Risk Assessment & Prioritization Complete By',
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
          defaultValue: criticalSensitivity
            ? ['data-sensitivity', 'compliance', 'data-retention']
            : ['data-sensitivity', 'compliance'],
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

function buildSections(args: BuildArgs): ArtifactSection[] {
  switch (args.policyType) {
    case 'crypto-algorithm':
      return cryptoAlgorithmSections(args)
    case 'key-management':
      return keyManagementSections(args)
    case 'vendor-requirements':
      return vendorSections(args)
    case 'migration-timeline':
      return migrationTimelineSections(args)
  }
}

function renderPolicyPreview(
  policyType: PolicyType,
  data: Record<string, Record<string, string | string[]>>
): string {
  const orgName = (data.general?.['org-name'] as string) || '[Organization Name]'
  const effectiveDate = (data.general?.['effective-date'] as string) || '[Effective Date]'
  const frameworks = (data.general?.frameworks as string[]) || []
  const policyOwner = (data.general?.['policy-owner'] as string) || '[Policy Owner]'
  const policyVersion = (data.general?.['policy-version'] as string) || '[Version]'
  const approver = (data.general?.approver as string) || '[Approver]'
  const reviewCadence = (data.general?.['review-cadence'] as string) || 'Annually'
  const jurisdiction = (data.general?.jurisdiction as string) || ''
  const industry = (data.general?.industry as string) || ''

  const policyTitle = POLICY_TYPES.find((p) => p.id === policyType)?.label || 'Policy'

  let md = `# ${orgName} - ${policyTitle}\n\n`
  md += `**Version:** ${policyVersion}\n\n`
  md += `**Effective Date:** ${effectiveDate}\n\n`
  md += `**Policy Owner:** ${policyOwner}\n\n`
  md += `**Approver:** ${approver}\n\n`
  md += `**Review Cadence:** ${reviewCadence}\n\n`
  if (jurisdiction) md += `**Jurisdiction:** ${jurisdiction}\n\n`
  if (industry) md += `**Industry:** ${industry}\n\n`
  md += `**Applicable Frameworks:** ${frameworks.length > 0 ? frameworks.join(', ') : 'None selected'}\n\n`
  md += `Generated: ${new Date().toLocaleDateString()}\n\n---\n\n`

  const sectionKeys = Object.keys(data).filter((k) => k !== 'general')
  for (const sectionId of sectionKeys) {
    const sectionData = data[sectionId]
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

interface KpiDriftRule {
  kpi: string
  threshold: string
  policyAction: string
}

function renderKpiDriftRulesMd(rules: KpiDriftRule[]): string {
  let md = '\n---\n\n## KPI Drift Rules (CSWP.39 §5.4 → §5.1 feedback loop)\n\n'
  if (rules.length === 0) {
    md +=
      '_No drift rules defined. Per §5.4 — KPI exceptions should feed back into policy-as-code updates._\n\n'
    return md
  }
  md += '| KPI | Threshold | Policy action when threshold breached |\n|---|---|---|\n'
  for (const r of rules) {
    md += `| ${r.kpi || '—'} | ${r.threshold || '—'} | ${r.policyAction || '—'} |\n`
  }
  md += '\n'
  return md
}

export const PolicyTemplateGenerator: React.FC = () => {
  const [activePolicyType, setActivePolicyType] = useState<PolicyType>('crypto-algorithm')
  const { addExecutiveDocument } = useModuleStore()
  const execData = useExecutiveModuleData()
  const country = useAssessmentStore((s) => s.country)
  const industry = useAssessmentStore((s) => s.industry)
  const dataSensitivity = useAssessmentStore((s) => s.dataSensitivity)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [kpiDriftRules, setKpiDriftRules] = useState<KpiDriftRule[]>([])

  const addKpiDriftRule = () =>
    setKpiDriftRules((prev) => [...prev, { kpi: '', threshold: '', policyAction: '' }])
  const updateKpiDriftRule = (idx: number, patch: Partial<KpiDriftRule>) =>
    setKpiDriftRules((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  const removeKpiDriftRule = (idx: number) =>
    setKpiDriftRules((prev) => prev.filter((_, i) => i !== idx))

  const simplified = selectedPersona === 'executive' || selectedPersona === 'curious'

  const frameworkNames = useMemo(
    () => execData.frameworksByIndustry.map((f) => f.label).slice(0, 12),
    [execData.frameworksByIndustry]
  )

  const sections = useMemo(
    () =>
      buildSections({
        policyType: activePolicyType,
        frameworkNames,
        deadlineYear: execData.migrationDeadlineYear,
        country,
        industry,
        dataSensitivity,
        simplified,
      }),
    [
      activePolicyType,
      frameworkNames,
      execData.migrationDeadlineYear,
      country,
      industry,
      dataSensitivity,
      simplified,
    ]
  )

  const handleExport = useCallback(
    (data: Record<string, Record<string, string | string[]>>) => {
      const markdown =
        renderPolicyPreview(activePolicyType, data) + renderKpiDriftRulesMd(kpiDriftRules)
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
    [activePolicyType, addExecutiveDocument, kpiDriftRules]
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select a policy type, fill in the template fields, and export a customized PQC policy
        document. Framework options, jurisdiction, industry, and suggested key rotation are
        auto-populated from your assessment data when available.
        {simplified && (
          <>
            {' '}
            <span className="text-primary">Simplified view</span> active — advanced algorithm
            variants and parameter-level options are hidden. Switch persona to Architect or
            Developer for the full governance detail.
          </>
        )}
      </p>

      {/* Policy Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {POLICY_TYPES.map((pt) => {
          const Icon = pt.icon
          return (
            <OptionTile
              key={pt.id}
              id={pt.id}
              label={pt.label}
              description={pt.description}
              selected={activePolicyType === pt.id}
              onSelect={(id) => setActivePolicyType(id as PolicyType)}
              icon={<Icon size={16} className="text-primary" />}
            />
          )
        })}
      </div>

      {/* Active policy banner */}
      {(() => {
        const active = POLICY_TYPES.find((p) => p.id === activePolicyType)
        if (!active) return null
        const Icon = active.icon
        return (
          <div
            className="glass-panel p-4 border-l-4 border-primary flex items-start gap-3"
            data-testid="active-policy-banner"
          >
            <Icon size={20} className="text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Editing: {active.label}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{active.sectionSummary}</p>
            </div>
          </div>
        )
      })()}

      {/* ArtifactBuilder */}
      <ArtifactBuilder
        key={activePolicyType}
        title={POLICY_TYPES.find((p) => p.id === activePolicyType)?.label || 'Policy'}
        description={POLICY_TYPES.find((p) => p.id === activePolicyType)?.description}
        sections={sections}
        onExport={handleExport}
        exportFilename={`pqc-${activePolicyType}-policy`}
        renderPreview={(data) =>
          renderPolicyPreview(activePolicyType, data) + renderKpiDriftRulesMd(kpiDriftRules)
        }
        exportFormats={['markdown', 'docx', 'pdf']}
      />

      {/* CSWP.39 §5.4 → §5.1 KPI drift feedback loop */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              KPI Drift Rules (CSWP.39 §5.4 → §5.1 feedback loop)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Define which KPI exceptions should trigger updates to this policy template — turning
              observed drift into policy-as-code feedback. Educational only — these rows export with
              the policy.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addKpiDriftRule}>
            + Add drift rule
          </Button>
        </div>
        {kpiDriftRules.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No drift rules defined.</p>
        ) : (
          <div className="space-y-2">
            {kpiDriftRules.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="KPI (e.g., FIPS coverage %)"
                  value={row.kpi}
                  onChange={(e) => updateKpiDriftRule(idx, { kpi: e.target.value })}
                  aria-label="KPI"
                />
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Threshold (e.g., < 80%)"
                  value={row.threshold}
                  onChange={(e) => updateKpiDriftRule(idx, { threshold: e.target.value })}
                  aria-label="Threshold"
                />
                <div className="flex gap-1">
                  <input
                    type="text"
                    className="text-sm rounded-md border border-input bg-background p-2 flex-1"
                    placeholder="Policy action"
                    value={row.policyAction}
                    onChange={(e) => updateKpiDriftRule(idx, { policyAction: e.target.value })}
                    aria-label="Policy action"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKpiDriftRule(idx)}
                    aria-label="Remove drift rule"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
