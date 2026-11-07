// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState } from 'react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { Button } from '@/components/ui/button'
import { ArtifactBuilder } from '../../../common/executive'
import type { ArtifactSection } from '../../../common/executive'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { rowsToCsv } from '@/services/export/csvExport'
import type { ArtifactFieldEdit, ArtifactFormData } from '../../../common/executive/ArtifactBuilder'
import { clearAuditPrefill, editAuditDraft, initializeAuditPrefill } from './auditPrefillOwnership'

interface ChecklistItem {
  value: string
  label: string
  description: string
  reference: string
}

const INVENTORY_ITEMS: ChecklistItem[] = [
  {
    value: 'systems-cataloged',
    label: 'All systems cataloged',
    description:
      'Comprehensive inventory of all systems using cryptographic operations, including embedded and third-party components.',
    reference: 'EO 14028 §4; OMB M-23-02',
  },
  {
    value: 'algo-documented',
    label: 'Algorithm usage documented',
    description:
      'Every cryptographic algorithm in use is identified with key sizes, protocol context, and quantum vulnerability status.',
    reference: 'NIST SP 800-131A Rev 3 (draft)',
  },
  {
    value: 'key-lengths',
    label: 'Key lengths recorded',
    description:
      'All key lengths cataloged and assessed against minimum requirements (e.g., AES-256 for CNSA 2.0, RSA-3072+ for transition).',
    reference: 'CNSA 2.0; NIST SP 800-57 Part 1',
  },
  {
    value: 'cert-lifecycle',
    label: 'Certificate lifecycle tracked',
    description:
      'X.509 certificates inventoried with expiration dates, issuing CAs, and algorithm types for migration planning.',
    reference: 'NIST SP 800-57 Part 3',
  },
  {
    value: 'cbom-generated',
    label: 'CBOM generated',
    description:
      'Cryptographic Bill of Materials (CBOM) generated in CycloneDX or SPDX format to track all crypto dependencies.',
    reference: 'CISA CBOM Guidance; OMB M-23-02',
  },
]

const POLICY_ITEMS: ChecklistItem[] = [
  {
    value: 'pqc-policy',
    label: 'PQC policy published',
    description:
      'Organizational policy mandating transition to post-quantum cryptographic algorithms with defined timelines.',
    reference: 'NIST IR 8547',
  },
  {
    value: 'raci-defined',
    label: 'RACI defined',
    description:
      'Responsibility matrix (RACI) established for all PQC migration activities across organizational roles.',
    reference: 'ISO 27001 Annex A.5',
  },
  {
    value: 'exception-process',
    label: 'Exception process documented',
    description:
      'Formal process for requesting and tracking exceptions to the PQC migration policy with risk acceptance criteria.',
    reference: 'NIST CSF 2.0 GV.PO',
  },
  {
    value: 'training-completed',
    label: 'Training completed',
    description:
      'Relevant staff trained on PQC concepts, migration procedures, and new algorithm operational requirements.',
    reference: 'NIST CSF 2.0 PR.AT',
  },
  {
    value: 'budget-allocated',
    label: 'Budget allocated',
    description:
      'Dedicated budget approved for PQC migration covering tools, training, testing, and vendor engagement.',
    reference: 'NIST CSF 2.0 GV.RR',
  },
]

const RISK_ITEMS: ChecklistItem[] = [
  {
    value: 'hndl-assessed',
    label: 'HNDL risk assessment completed',
    description:
      'Harvest Now, Decrypt Later (HNDL) exposure assessed — data at risk of retroactive decryption when CRQCs arrive.',
    reference: 'NSA CNSA 2.0 FAQ; NIST IR 8547',
  },
  {
    value: 'data-classified',
    label: 'Data classified by sensitivity/retention',
    description:
      'Data classified by sensitivity level and retention period to prioritize migration of long-lived secrets.',
    reference: 'NIST SP 800-60; FIPS 199',
  },
  {
    value: 'crypto-risk-register',
    label: 'Crypto risk register maintained',
    description:
      'Dedicated risk register for quantum-related cryptographic risks, distinct from general IT risk register.',
    reference: 'ISO 27005; NIST CSF 2.0 ID.RA',
  },
  {
    value: 'threat-model-updated',
    label: 'Threat model updated for quantum adversary',
    description:
      'Threat models updated to include quantum-capable adversary scenarios including HNDL and real-time decryption.',
    reference: 'NIST SP 800-30 Rev 1; STRIDE/PASTA',
  },
  {
    value: 'risk-acceptance-documented',
    label: 'Risk acceptance documented for exceptions',
    description:
      'Formal sign-off for any systems or algorithms that cannot be migrated by deadline with documented risk acceptance.',
    reference: 'ISO 27001 §6.1; NIST CSF 2.0 GV.RM',
  },
]

const TECHNICAL_ITEMS: ChecklistItem[] = [
  {
    value: 'hybrid-deployed',
    label: 'Hybrid mode deployed',
    description:
      'Review a selected hybrid classical+PQC profile (e.g., X25519MLKEM768), peer support and fallback policy. Compatibility depends on the negotiated profile and participating implementations.',
    reference: 'NIST SP 800-227; CNSA 2.0',
  },
  {
    value: 'pqc-tested',
    label: 'PQC algorithms tested',
    description:
      'Plan representative testing for the algorithms selected for the sample scope. FIPS 203/204/205 define ML-KEM, ML-DSA and SLH-DSA; citing them does not require every listed algorithm in every system.',
    reference: 'FIPS 203/204/205',
  },
  {
    value: 'perf-benchmarked',
    label: 'Performance benchmarked',
    description:
      'Latency, throughput, and resource impact of PQC algorithms measured against operational thresholds.',
    reference: 'NIST PQC Performance Benchmarks',
  },
  {
    value: 'rollback-plan',
    label: 'Rollback plan documented',
    description:
      'Tested rollback procedures to revert to classical cryptography if PQC deployment causes issues.',
    reference: 'NIST SP 800-128',
  },
  {
    value: 'monitoring',
    label: 'Monitoring in place',
    description:
      'Active monitoring of PQC-specific metrics (handshake success rates, cipher suite negotiation, certificate validation).',
    reference: 'NIST CSF 2.0 DE.CM',
  },
]

const VENDOR_ITEMS: ChecklistItem[] = [
  {
    value: 'vendors-assessed',
    label: 'Vendors assessed',
    description:
      'All cryptography-dependent vendors evaluated for PQC roadmap, timeline, and algorithm support.',
    reference: 'NIST CSF 2.0 GV.SC',
  },
  {
    value: 'contracts-updated',
    label: 'Contracts updated',
    description:
      'Vendor contracts updated with PQC compliance requirements, CBOM delivery, and migration deadlines.',
    reference: 'NIST SP 800-161r1',
  },
  {
    value: 'fips-verified',
    label: 'FIPS 140-3 validation verified',
    description:
      'Vendor cryptographic modules verified for FIPS 140-3 validation. Distinct from FIPS 203/204/205 algorithm compliance.',
    reference: 'FIPS 140-3; CMVP',
  },
  {
    value: 'supply-chain-risk',
    label: 'Supply chain risk evaluated',
    description:
      'Cryptographic dependencies in the supply chain mapped and assessed for quantum vulnerability.',
    reference: 'NIST SP 800-161r1; EO 14028',
  },
  {
    value: 'vendor-cbom',
    label: 'CBOM collected from vendors',
    description:
      'Cryptographic Bill of Materials collected from all critical vendors to verify algorithm usage and dependencies.',
    reference: 'CISA CBOM Guidance',
  },
]

const EVIDENCE_ITEMS: ChecklistItem[] = [
  {
    value: 'migration-plan',
    label: 'Migration plan documented',
    description:
      'Comprehensive migration plan with timelines, milestones, resource allocation, and success criteria.',
    reference: 'NIST IR 8547',
  },
  {
    value: 'test-results',
    label: 'Test results archived',
    description:
      'All PQC testing results (interoperability, performance, security) archived for audit evidence.',
    reference: 'ISO 27001 §7.5',
  },
  {
    value: 'compliance-mapping',
    label: 'Compliance mapping complete',
    description:
      'Requirements from applicable frameworks (CNSA 2.0, FIPS, industry-specific) mapped to implementation status.',
    reference: 'NIST CSF 2.0 GV.PO',
  },
  {
    value: 'incident-response',
    label: 'Incident response updated',
    description:
      'Incident response plan updated to address quantum-specific scenarios including HNDL breach discovery.',
    reference: 'NIST SP 800-61r3',
  },
  {
    value: 'board-reports',
    label: 'Board reports prepared',
    description:
      'Executive-level reports on PQC migration status, risk posture, and compliance readiness for board review.',
    reference: 'SEC Cyber Disclosure Rules; NIST CSF 2.0 GV.OC',
  },
]

function getMaturityTier(pct: number): { label: string; color: string } {
  if (pct >= 81) return { label: '81–100% selected', color: 'text-status-success' }
  if (pct >= 61) return { label: '61–80% selected', color: 'text-primary' }
  if (pct >= 41) return { label: '41–60% selected', color: 'text-status-warning' }
  if (pct >= 21) return { label: '21–40% selected', color: 'text-status-warning' }
  return { label: '0–20% selected', color: 'text-status-error' }
}

function buildSections(
  isAssessmentComplete: boolean,
  industry: string,
  country: string,
  myFrameworksCount: number,
  myProductsCount: number,
  myThreatsCount: number
): ArtifactSection[] {
  const toOptions = (items: ChecklistItem[]) =>
    items.map((i) => ({
      value: i.value,
      label: `Review topic: ${i.label} — ${i.description} [Related reading: ${i.reference}]`,
    }))

  const industryNote = industry ? ` Tailor to ${industry} sector requirements.` : ''
  const countryNote = country ? ` Align with ${country} regulatory framework.` : ''

  return [
    {
      id: 'crypto-inventory',
      title: 'Cryptographic Inventory',
      description: `Ensure all cryptographic assets are cataloged for audit review.${industryNote}${countryNote}`,
      fields: [
        {
          id: 'inventory-checklist',
          label: 'Inventory Planning Topics',
          type: 'checklist',
          options: toOptions(INVENTORY_ITEMS),
          defaultValue: isAssessmentComplete ? ['systems-cataloged'] : [],
        },
      ],
    },
    {
      id: 'policy-governance',
      title: 'Policy & Governance',
      description: `Verify organizational policies and governance structures are in place for PQC migration.${industryNote}`,
      fields: [
        {
          id: 'policy-checklist',
          label: 'Policy & Governance Planning Topics',
          type: 'checklist',
          options: toOptions(POLICY_ITEMS),
          defaultValue: [],
        },
      ],
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      description: `Assess quantum-specific risks including HNDL exposure and data sensitivity classification.${industryNote}`,
      fields: [
        {
          id: 'risk-checklist',
          label: 'Risk Planning Topics',
          type: 'checklist',
          options: toOptions(RISK_ITEMS),
          defaultValue: myThreatsCount > 0 ? ['threat-model-updated'] : [],
        },
      ],
    },
    {
      id: 'technical-controls',
      title: 'Technical Controls',
      description: `Confirm technical controls are deployed and tested for the PQC transition.${countryNote}`,
      fields: [
        {
          id: 'technical-checklist',
          label: 'Technical Control Planning Topics',
          type: 'checklist',
          options: toOptions(TECHNICAL_ITEMS),
          defaultValue: [],
        },
      ],
    },
    {
      id: 'vendor-management',
      title: 'Vendor Management',
      description: `Assess vendor PQC readiness and update contractual requirements.${industryNote}`,
      fields: [
        {
          id: 'vendor-checklist',
          label: 'Vendor Planning Topics',
          type: 'checklist',
          options: toOptions(VENDOR_ITEMS),
          defaultValue: myProductsCount > 0 ? ['vendors-assessed'] : [],
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
          label: 'Evidence Planning Topics',
          type: 'checklist',
          options: toOptions(EVIDENCE_ITEMS),
          defaultValue: [
            ...(isAssessmentComplete ? ['migration-plan'] : []),
            ...(myFrameworksCount > 0 ? ['compliance-mapping'] : []),
          ],
        },
      ],
    },
  ]
}

// Exported for the simulation's real-tool doc generator (realToolDocs.ts):
// its sample derives checked items from these real lists, so an item
// rename/addition here propagates into the sim's demo automatically.
export const ALL_ITEMS: Record<string, ChecklistItem[]> = {
  'crypto-inventory': INVENTORY_ITEMS,
  'policy-governance': POLICY_ITEMS,
  'risk-assessment': RISK_ITEMS,
  'technical-controls': TECHNICAL_ITEMS,
  'vendor-management': VENDOR_ITEMS,
  'evidence-documentation': EVIDENCE_ITEMS,
}

const SECTION_TITLES: Record<string, string> = {
  'crypto-inventory': 'Cryptographic Inventory',
  'policy-governance': 'Policy & Governance',
  'risk-assessment': 'Risk Assessment',
  'technical-controls': 'Technical Controls',
  'vendor-management': 'Vendor Management',
  'evidence-documentation': 'Evidence & Documentation',
}

export function renderAuditPreview(
  data: Record<string, Record<string, string | string[]>>,
  industry?: string,
  country?: string
): string {
  let md = '# PQC Audit Planning Topics\n\n'
  md +=
    'Hub-authored educational template. References are related reading, not proof that every field is a source-mandated control.\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n`
  if (industry) md += `Industry: ${industry}\n`
  if (country) md += `Country: ${country}\n`
  md +=
    '\nChecked boxes mean selected planning topics, including suggestions from saved context; they do not establish completed controls, audited readiness or validation.\n\n---\n\n'

  let totalChecked = 0
  let totalItems = 0
  const sectionScores: { title: string; checked: number; total: number }[] = []

  for (const [sectionId, title] of Object.entries(SECTION_TITLES)) {
    md += `## ${title}\n\n`
    const sectionData = data[sectionId] ?? {}
    const items = ALL_ITEMS[sectionId] ?? []
    const checklistKey = Object.keys(sectionData)[0]
    const checkedItems = Array.isArray(sectionData[checklistKey])
      ? (sectionData[checklistKey] as string[])
      : []

    let sectionChecked = 0
    for (const item of items) {
      const checked = checkedItems.includes(item.value)
      md += `- [${checked ? 'x' : ' '}] **Review topic: ${item.label}** — ${item.description} _[Related reading: ${item.reference}]_\n`
      if (checked) {
        sectionChecked++
        totalChecked++
      }
      totalItems++
    }
    sectionScores.push({ title, checked: sectionChecked, total: items.length })
    md += '\n'
  }

  md += '---\n\n'

  // Per-section scores
  md += '## Topic Selection Counts\n\n'
  md += '| Section | Selected / Total | % |\n'
  md += '|---------|-------|---|\n'
  for (const s of sectionScores) {
    const pct = s.total > 0 ? Math.round((s.checked / s.total) * 100) : 0
    md += `| ${s.title} | ${s.checked}/${s.total} | ${pct}% |\n`
  }
  md += '\n'

  // Overall with maturity tier
  const overallPct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0
  const tier = getMaturityTier(overallPct)
  md += `**Planning topics selected: ${totalChecked}/${totalItems} (${overallPct}%)**\n\n`
  md += `**Topic-selection band: ${tier.label}**\n\n`
  md +=
    '_Selection bands describe topic inclusion only. They do not measure control implementation, audit readiness or organizational maturity._\n'

  return md
}

export interface ExceptionRow {
  scope: string
  compensatingControl: string
  owner: string
  sunset: string
}

export interface EvidenceRow {
  productOrAsset: string
  cmvpCertNumber: string
  acvpRunId: string
  esvStatus: string
  cveScanDate: string
}

export function renderExceptionsAndEvidenceMd(
  exceptions: ExceptionRow[],
  evidence: EvidenceRow[]
): string {
  // 07192026 accuracy fix (caught by demoDocs.provenance.test.ts when this
  // renderer entered REAL_DOC_GENERATORS): the heading previously cited
  // "CSWP.39 §5.1" — verified against the upd1 PDF, §5.1 is "Cryptographic
  // Standards, Regulations, and Mandates" and the document contains no
  // exception/waiver-process content anywhere. Documented exceptions with
  // compensating controls are standard GRC practice; they need no citation.
  let md = '\n---\n\n## Exceptions\n\n'
  if (exceptions.length === 0) {
    md += '_No exceptions documented._\n\n'
  } else {
    md += '| Scope | Compensating control | Owner | Sunset |\n|---|---|---|---|\n'
    for (const e of exceptions) {
      md += `| ${e.scope || '—'} | ${e.compensatingControl || '—'} | ${e.owner || '—'} | ${e.sunset || '—'} |\n`
    }
    md += '\n'
  }

  md +=
    '## Fictional reference examples\n\nThese prompts illustrate different evidence sources and their scope; recording a reference does not validate a deployment. Keep Hub sample-test results separate from this checklist.\n\n'
  if (evidence.length === 0) {
    md += '_No evidence rows documented._\n\n'
  } else {
    md +=
      '| Product / Asset | CMVP cert # | ACVP run ID | ESV (SP 800-90B) | CVE-scan date |\n|---|---|---|---|---|\n'
    for (const e of evidence) {
      md += `| ${e.productOrAsset || '—'} | ${e.cmvpCertNumber || '—'} | ${e.acvpRunId || '—'} | ${e.esvStatus || '—'} | ${e.cveScanDate || '—'} |\n`
    }
    md += '\n'
  }
  return md
}

// Structured CSV (all 30 checklist items + Exceptions + Evidence, section-labelled)
// so `.csv` opens as real spreadsheet rows, not pipe text. Mirrors the pattern in
// ComplianceTimelineBuilder (Audit C5).
function renderAuditCsv(
  data: Record<string, Record<string, string | string[]>>,
  exceptions: ExceptionRow[],
  evidence: EvidenceRow[]
): string {
  const sections: (string | number)[][] = []
  sections.push(['PQC Audit Planning Topics'])
  sections.push([
    'Selected means included as a planning topic, not a completed or audited control.',
  ])
  sections.push(['Section', 'Review Topic', 'Selected', 'Reference'])
  for (const [sectionId, title] of Object.entries(SECTION_TITLES)) {
    const sectionData = data[sectionId] ?? {}
    const items = ALL_ITEMS[sectionId] ?? []
    const checklistKey = Object.keys(sectionData)[0]
    const checkedItems = Array.isArray(sectionData[checklistKey])
      ? (sectionData[checklistKey] as string[])
      : []
    for (const item of items) {
      sections.push([
        title,
        `Review topic: ${item.label}`,
        checkedItems.includes(item.value) ? 'Yes' : 'No',
        item.reference,
      ])
    }
  }

  if (exceptions.length > 0) {
    sections.push([])
    sections.push(['Exceptions'])
    sections.push(['Scope', 'Compensating control', 'Owner', 'Sunset'])
    for (const e of exceptions) sections.push([e.scope, e.compensatingControl, e.owner, e.sunset])
  }

  if (evidence.length > 0) {
    sections.push([])
    sections.push(['Evidence'])
    sections.push(['Product / Asset', 'CMVP cert #', 'ACVP run ID', 'ESV status', 'CVE-scan date'])
    for (const e of evidence)
      sections.push([e.productOrAsset, e.cmvpCertNumber, e.acvpRunId, e.esvStatus, e.cveScanDate])
  }

  return rowsToCsv(sections)
}

/** Persisted shape for the read-back half of the "save with `inputs`, restore
 *  on mount" pattern — checklist selections plus the Exceptions/Evidence rows. */
interface SavedAuditInputs {
  checklistData?: Record<string, Record<string, string | string[]>>
  exceptions?: ExceptionRow[]
  evidence?: EvidenceRow[]
  prefillOwnership?: unknown
  originalSavedInputs?: unknown
}

interface AuditReadinessChecklistProps {
  selectedJurisdictions?: string[]
}

export const AuditReadinessChecklist: React.FC<AuditReadinessChecklistProps> = ({
  selectedJurisdictions,
}) => {
  const { isAssessmentComplete, industry, country, myFrameworks, myProducts, myThreats } =
    useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const savedInputs = useSavedArtifactInputs<SavedAuditInputs>('audit-checklist')
  const [exceptions, setExceptions] = React.useState<ExceptionRow[]>(savedInputs?.exceptions ?? [])
  const [evidence, setEvidence] = React.useState<EvidenceRow[]>(savedInputs?.evidence ?? [])
  const sections = useMemo(
    () =>
      buildSections(
        isAssessmentComplete,
        industry,
        country,
        myFrameworks.length,
        myProducts.length,
        myThreats.length
      ),
    [
      isAssessmentComplete,
      industry,
      country,
      myFrameworks.length,
      myProducts.length,
      myThreats.length,
    ]
  )

  const [draft, setDraft] = useState(() => initializeAuditPrefill(sections, savedInputs))
  const handleDataChange = React.useCallback(
    (update: (data: ArtifactFormData) => ArtifactFormData, edit: ArtifactFieldEdit) => {
      setDraft((previous) => editAuditDraft(previous, update, edit))
    },
    []
  )
  const handleClearPrefill = React.useCallback(
    () => setDraft((previous) => clearAuditPrefill(previous)),
    []
  )
  const hasAssessmentPrefill = draft.prefillOwnership.untouchedInserted.some(
    (token) =>
      (token.sectionId === 'crypto-inventory' && token.optionValue === 'systems-cataloged') ||
      (token.sectionId === 'evidence-documentation' && token.optionValue === 'migration-plan')
  )
  const prefillHelpId = React.useId()
  const saveRevision = JSON.stringify({
    prefillOwnership: draft.prefillOwnership,
    exceptions,
    evidence,
  })

  const seedSources: string[] = []
  if (!draft.prefillOwnership.cleared) {
    if (industry) seedSources.push(`industry (${industry})`)
    if (country) seedSources.push(`country (${country})`)
    if (isAssessmentComplete) seedSources.push('completed assessment')
    if (myFrameworks.length > 0)
      seedSources.push(
        `${myFrameworks.length} framework${myFrameworks.length !== 1 ? 's' : ''} from /compliance`
      )
    if (myProducts.length > 0)
      seedSources.push(
        `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`
      )
    if (myThreats.length > 0)
      seedSources.push(
        `${myThreats.length} threat${myThreats.length !== 1 ? 's' : ''} from /threats`
      )
  }

  const handleExport = (data: Record<string, Record<string, string | string[]>>) => {
    const markdown =
      renderAuditPreview(data, industry, country) +
      renderExceptionsAndEvidenceMd(exceptions, evidence)
    addExecutiveDocument({
      id: `audit-checklist-${Date.now()}`,
      type: 'audit-checklist',
      title: 'PQC Audit Planning Topics',
      data: markdown,
      createdAt: Date.now(),
      moduleId: 'compliance-strategy',
      inputs: {
        checklistData: data,
        exceptions,
        evidence,
        prefillOwnership: draft.prefillOwnership,
        originalSavedInputs: draft.originalSavedInputs,
      },
    })
  }

  const csvRenderer = React.useCallback(
    (data: Record<string, Record<string, string | string[]>>) =>
      renderAuditCsv(data, exceptions, evidence),
    [exceptions, evidence]
  )

  const previewRenderer = React.useCallback(
    (data: Record<string, Record<string, string | string[]>>) =>
      renderAuditPreview(data, industry, country) +
      renderExceptionsAndEvidenceMd(exceptions, evidence),
    [industry, country, exceptions, evidence]
  )

  const addException = () =>
    setExceptions((prev) => [
      ...prev,
      { scope: '', compensatingControl: '', owner: '', sunset: '' },
    ])
  const updateException = (idx: number, patch: Partial<ExceptionRow>) =>
    setExceptions((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  const removeException = (idx: number) => setExceptions((prev) => prev.filter((_, i) => i !== idx))

  const addEvidence = () =>
    setEvidence((prev) => [
      ...prev,
      {
        productOrAsset: '',
        cmvpCertNumber: '',
        acvpRunId: '',
        esvStatus: '',
        cveScanDate: '',
      },
    ])
  const updateEvidence = (idx: number, patch: Partial<EvidenceRow>) =>
    setEvidence((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  const removeEvidence = (idx: number) => setEvidence((prev) => prev.filter((_, i) => i !== idx))

  return (
    <div className="space-y-6">
      {(seedSources.length > 0 ||
        draft.prefillOwnership.untouchedInserted.length > 0 ||
        draft.prefillOwnership.inheritedOriginUnknown ||
        draft.prefillOwnership.cleared) && (
        <div className="space-y-2">
          {seedSources.length > 0 && draft.prefillOwnership.untouchedInserted.length > 0 && (
            <PreFilledBanner summary={`Planning context: ${seedSources.join(' + ')}.`} />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearPrefill}
            aria-describedby={prefillHelpId}
          >
            Clear untouched topic suggestions
          </Button>
          <p id={prefillHelpId} className="text-xs text-muted-foreground">
            Removes only untouched topic selections recorded as inserted by prefill. Learner edits,
            notes and source context are kept.
          </p>
          {draft.prefillOwnership.inheritedOriginUnknown && (
            <p className="text-xs text-muted-foreground">
              Loaded draft did not record supported prefill ownership. Origin-uncertain entries are
              kept; edit selections individually.
            </p>
          )}
          {draft.prefillOwnership.cleared && (
            <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
              {draft.lastClearCount === null
                ? 'Untouched topic suggestions were previously cleared.'
                : `${draft.lastClearCount} untouched topic suggestion${draft.lastClearCount === 1 ? '' : 's'} cleared.`}{' '}
              Learner work and origin-uncertain entries were kept.
            </p>
          )}
        </div>
      )}
      {isAssessmentComplete && hasAssessmentPrefill && !draft.prefillOwnership.cleared && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-3">
          <p className="text-sm text-foreground/80">
            Suggested planning topics have been selected from your completed sample assessment
            {industry ? ` (${industry})` : ''}
            {country ? ` in ${country}` : ''}. These selections do not establish that the listed
            controls were performed. Review the topics to include.
          </p>
        </div>
      )}

      {(industry || country) && !isAssessmentComplete && (
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            Checklist tailored for{' '}
            {industry && <span className="text-primary font-medium">{industry}</span>}
            {industry && country && ' in '}
            {country && <span className="text-primary font-medium">{country}</span>}. Complete the
            Assessment Wizard for sample context and suggested planning topics.
          </p>
        </div>
      )}

      {selectedJurisdictions && selectedJurisdictions.length > 0 && (
        <PreFilledBanner
          summary={`Filtering for: ${selectedJurisdictions.join(', ')}. Items shown cover all jurisdictions — jurisdiction-specific filtering coming in a future update.`}
        />
      )}

      <p className="text-sm text-muted-foreground">
        Bookmarks and assessment answers can suggest planning topics; they are not evidence that a
        control is implemented, a test passed or an audit completed. Checked boxes record topic
        inclusion only, including any preselected suggestions. This is a Hub-authored educational
        template. References are related reading, not proof that every field is a source-mandated
        control.
      </p>
      <ArtifactBuilder
        title="PQC Audit Planning Topics"
        description="Use this Hub-authored educational template to select sample planning topics. A selection records inclusion, not completed controls or audit readiness. References are related reading, not proof that every field is a source-mandated control. Identify what to evaluate with your own tools."
        sections={sections}
        onExport={handleExport}
        exportFilename="pqc-audit-readiness-checklist"
        exportFormats={['markdown', 'csv', 'pdf']}
        renderPreview={previewRenderer}
        renderCsv={csvRenderer}
        controlledForm={{ value: draft.checklistData, onChange: handleDataChange }}
        saveRevision={saveRevision}
      />

      {/* Exceptions — no CSWP citation: §5.1 is standards/mandates, and the
          document has no exception-process content (07192026 accuracy fix). */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground">Exceptions</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Document approved deviations from policy with their compensating controls and sunset
              date. These rows export with the checklist.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addException}>
            + Add exception
          </Button>
        </div>
        {exceptions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No exceptions yet.</p>
        ) : (
          <div className="space-y-2">
            {exceptions.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-start">
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Scope (asset / system)"
                  value={row.scope}
                  onChange={(e) => updateException(idx, { scope: e.target.value })}
                />
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Compensating control"
                  value={row.compensatingControl}
                  onChange={(e) => updateException(idx, { compensatingControl: e.target.value })}
                />
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Owner"
                  value={row.owner}
                  onChange={(e) => updateException(idx, { owner: e.target.value })}
                />
                <div className="flex gap-1">
                  <input
                    type="text"
                    className="text-sm rounded-md border border-input bg-background p-2 flex-1"
                    placeholder="Sunset (YYYY-MM-DD)"
                    value={row.sunset}
                    onChange={(e) => updateException(idx, { sunset: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeException(idx)}
                    aria-label="Remove exception"
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

      {/* CSWP.39 §5.1 — Evidence (CAVP/CMVP validation prerequisite) */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Fictional reference examples — CMVP / ACVP / ESV / CVE-scan
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Use fictional identifiers to explore the scope and provenance of different evidence
              sources. Recording a reference does not validate a deployment. Keep Hub sample-test
              results separate from this checklist.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addEvidence}>
            + Add evidence row
          </Button>
        </div>
        {evidence.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No evidence rows yet.</p>
        ) : (
          <div className="space-y-2">
            {evidence.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-start">
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Product / asset"
                  value={row.productOrAsset}
                  onChange={(e) => updateEvidence(idx, { productOrAsset: e.target.value })}
                />
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="CMVP cert #"
                  value={row.cmvpCertNumber}
                  onChange={(e) => updateEvidence(idx, { cmvpCertNumber: e.target.value })}
                />
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="ACVP run ID"
                  value={row.acvpRunId}
                  onChange={(e) => updateEvidence(idx, { acvpRunId: e.target.value })}
                />
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="ESV status (SP 800-90B)"
                  value={row.esvStatus}
                  onChange={(e) => updateEvidence(idx, { esvStatus: e.target.value })}
                />
                <div className="flex gap-1">
                  <input
                    type="text"
                    className="text-sm rounded-md border border-input bg-background p-2 flex-1"
                    placeholder="CVE-scan date"
                    value={row.cveScanDate}
                    onChange={(e) => updateEvidence(idx, { cveScanDate: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEvidence(idx)}
                    aria-label="Remove evidence row"
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
