// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo } from 'react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { Button } from '@/components/ui/button'
import { ArtifactBuilder } from '../../../common/executive'
import type { ArtifactSection } from '../../../common/executive'

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
    reference: 'NIST SP 800-131A Rev 3',
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
      'Hybrid classical+PQC configurations (e.g., X25519MLKEM768) deployed to maintain backward compatibility during transition.',
    reference: 'NIST SP 800-227; CNSA 2.0',
  },
  {
    value: 'pqc-tested',
    label: 'PQC algorithms tested',
    description:
      'ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) tested in representative environments.',
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
  if (pct >= 81) return { label: 'Optimized', color: 'text-status-success' }
  if (pct >= 61) return { label: 'Established', color: 'text-primary' }
  if (pct >= 41) return { label: 'Developing', color: 'text-status-warning' }
  if (pct >= 21) return { label: 'Foundation', color: 'text-status-warning' }
  return { label: 'Not Started', color: 'text-status-error' }
}

function buildSections(
  isAssessmentComplete: boolean,
  industry: string,
  country: string
): ArtifactSection[] {
  const toOptions = (items: ChecklistItem[]) =>
    items.map((i) => ({
      value: i.value,
      label: `${i.label} — ${i.description} [${i.reference}]`,
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
          label: 'Cryptographic Inventory Readiness',
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
          label: 'Policy & Governance Readiness',
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
          label: 'Risk Assessment Readiness',
          type: 'checklist',
          options: toOptions(RISK_ITEMS),
          defaultValue: [],
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
          label: 'Technical Controls Readiness',
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
          label: 'Vendor Management Readiness',
          type: 'checklist',
          options: toOptions(VENDOR_ITEMS),
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
          options: toOptions(EVIDENCE_ITEMS),
          defaultValue: isAssessmentComplete ? ['migration-plan'] : [],
        },
      ],
    },
  ]
}

const ALL_ITEMS: Record<string, ChecklistItem[]> = {
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

function renderAuditPreview(
  data: Record<string, Record<string, string | string[]>>,
  industry?: string,
  country?: string
): string {
  let md = '# PQC Audit Readiness Checklist\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n`
  if (industry) md += `Industry: ${industry}\n`
  if (country) md += `Country: ${country}\n`
  md += '\n---\n\n'

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
      md += `- [${checked ? 'x' : ' '}] **${item.label}** — ${item.description} _[${item.reference}]_\n`
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
  md += '## Section Scores\n\n'
  md += '| Section | Score | % |\n'
  md += '|---------|-------|---|\n'
  for (const s of sectionScores) {
    const pct = s.total > 0 ? Math.round((s.checked / s.total) * 100) : 0
    md += `| ${s.title} | ${s.checked}/${s.total} | ${pct}% |\n`
  }
  md += '\n'

  // Overall with maturity tier
  const overallPct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0
  const tier = getMaturityTier(overallPct)
  md += `**Overall Readiness: ${totalChecked}/${totalItems} items (${overallPct}%)**\n\n`
  md += `**Maturity Level: ${tier.label}**\n\n`
  md +=
    '_Maturity scale: Not Started (0-20%) → Foundation (21-40%) → Developing (41-60%) → Established (61-80%) → Optimized (81-100%)_\n'

  return md
}

interface ExceptionRow {
  scope: string
  compensatingControl: string
  owner: string
  sunset: string
}

interface EvidenceRow {
  productOrAsset: string
  cmvpCertNumber: string
  acvpRunId: string
  esvStatus: string
  cveScanDate: string
}

function renderExceptionsAndEvidenceMd(
  exceptions: ExceptionRow[],
  evidence: EvidenceRow[]
): string {
  let md = '\n---\n\n## Exceptions (CSWP.39 §5.1)\n\n'
  if (exceptions.length === 0) {
    md += '_No exceptions documented._\n\n'
  } else {
    md += '| Scope | Compensating control | Owner | Sunset |\n|---|---|---|---|\n'
    for (const e of exceptions) {
      md += `| ${e.scope || '—'} | ${e.compensatingControl || '—'} | ${e.owner || '—'} | ${e.sunset || '—'} |\n`
    }
    md += '\n'
  }

  md += '## Evidence (CSWP.39 §5.5 — CMVP / ACVP / ESV / CVE-scan)\n\n'
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

export const AuditReadinessChecklist: React.FC = () => {
  const { isAssessmentComplete, industry, country } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const [exceptions, setExceptions] = React.useState<ExceptionRow[]>([])
  const [evidence, setEvidence] = React.useState<EvidenceRow[]>([])

  const sections = useMemo(
    () => buildSections(isAssessmentComplete, industry, country),
    [isAssessmentComplete, industry, country]
  )

  const handleExport = (data: Record<string, Record<string, string | string[]>>) => {
    const markdown =
      renderAuditPreview(data, industry, country) +
      renderExceptionsAndEvidenceMd(exceptions, evidence)
    addExecutiveDocument({
      id: `audit-checklist-${Date.now()}`,
      type: 'audit-checklist',
      title: 'PQC Audit Readiness Checklist',
      data: markdown,
      createdAt: Date.now(),
      moduleId: 'compliance-strategy',
    })
  }

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
      {isAssessmentComplete && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-3">
          <p className="text-sm text-foreground/80">
            Some items have been pre-populated based on your completed assessment
            {industry ? ` (${industry})` : ''}
            {country ? ` in ${country}` : ''}. Review and update as needed.
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
            Assessment Wizard for pre-populated items and risk-prioritized guidance.
          </p>
        </div>
      )}

      <ArtifactBuilder
        title="PQC Audit Readiness Checklist"
        description="Check off each item as your organization completes it. Each item includes a brief description and standards reference. Export the checklist for audit documentation."
        sections={sections}
        onExport={handleExport}
        exportFilename="pqc-audit-readiness-checklist"
        renderPreview={previewRenderer}
      />

      {/* CSWP.39 §5.1 — Exceptions */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground">Exceptions (CSWP.39 §5.1)</h3>
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

      {/* CSWP.39 §5.5 — Evidence */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Evidence — CMVP / ACVP / ESV / CVE-scan
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Per change, capture validation evidence. Educational template — populate from your
              real CMVP module IDs and ACVP run records.
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
