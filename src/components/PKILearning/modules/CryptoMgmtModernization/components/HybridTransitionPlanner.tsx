// SPDX-License-Identifier: GPL-3.0-only
/**
 * Hybrid Algorithm Transition Planner (M5 / CSWP.39 §3.2.4)
 *
 * Decision-tree wizard for architects planning the transition from a traditional
 * public-key algorithm to a PQC algorithm. Computes a recommended target end-state
 * (hybrid traditional+PQC, hybrid PQC+PQC, pure PQC, or crypto-gateway fallback)
 * from inventory + constraint inputs, and emits an editable migration plan
 * markdown document grounded in NIST CSWP 39 §3.2.4 and Fig.1.
 */
import React, { useCallback, useMemo } from 'react'
import { GitBranch, ShieldCheck, ArrowRight } from 'lucide-react'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import { useModuleStore } from '@/store/useModuleStore'

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation engine (pure function — testable in isolation)
// ─────────────────────────────────────────────────────────────────────────────

export type TargetState =
  | 'hybrid-traditional+PQC'
  | 'hybrid-PQC+PQC'
  | 'pure-PQC'
  | 'crypto-gateway'

export interface TransitionInputs {
  protocol: string
  currentAlgorithm: string
  /** 'signature' | 'kem' | 'both' */
  function: string
  /** '<1y' | '1-5y' | '5-15y' | '>15y' */
  dataLifetime: string
  /** 'greenfield' | 'in-production-with-agility' | 'in-production-without-agility' | 'legacy-frozen' */
  deploymentMaturity: string
  /** 'high' | 'medium' | 'low' | 'none' */
  cryptoAgility: string
  /** numeric year as a string, or 'none' */
  complianceDeadline: string
  /** 'strict' | 'moderate' | 'generous' */
  bandwidthBudget: string
}

export interface TransitionRecommendation {
  targetState: TargetState
  /** Short rationale (one line) tying the recommendation to CSWP-39 §3.2.4. */
  rationale: string
  kemPair: string
  sigPair: string
  watchOuts: string[]
  hybridTargetDate: string
  sunsetDate: string
}

function deadlineYearOrDefault(input: string): number {
  if (input === 'none' || !input) return new Date().getFullYear() + 5
  const n = parseInt(input, 10)
  return Number.isFinite(n) ? n : new Date().getFullYear() + 5
}

function isLongLifetime(dataLifetime: string): boolean {
  return dataLifetime === '5-15y' || dataLifetime === '>15y'
}

function isVeryLongLifetime(dataLifetime: string): boolean {
  return dataLifetime === '>15y'
}

function hasMinimumAgility(cryptoAgility: string): boolean {
  return cryptoAgility === 'high' || cryptoAgility === 'medium'
}

function isNearDeadline(complianceDeadline: string): boolean {
  if (complianceDeadline === 'none') return false
  const year = parseInt(complianceDeadline, 10)
  return Number.isFinite(year) && year <= 2030
}

function isImmediateDeadline(complianceDeadline: string): boolean {
  if (complianceDeadline === 'none') return false
  const year = parseInt(complianceDeadline, 10)
  return Number.isFinite(year) && year <= 2027
}

function suggestKemPair(targetState: TargetState, currentAlgorithm: string): string {
  if (targetState === 'pure-PQC') return 'ML-KEM-768 (FIPS 203)'
  if (targetState === 'hybrid-PQC+PQC') return 'ML-KEM-768 + HQC-128 (PQC + PQC defence-in-depth)'
  if (targetState === 'crypto-gateway') {
    return 'Gateway-terminated ML-KEM-768 (legacy peer keeps classical KEM)'
  }
  // hybrid-traditional+PQC default
  if (currentAlgorithm.includes('X25519') || currentAlgorithm === 'X25519') {
    return 'X25519MLKEM768 (IETF draft-ietf-tls-hybrid-design)'
  }
  if (currentAlgorithm.includes('ECDH-P256') || currentAlgorithm === 'ECDH-P256') {
    return 'SecP256r1MLKEM768 (IETF hybrid KEM)'
  }
  return 'X25519MLKEM768 (IETF draft-ietf-tls-hybrid-design)'
}

function suggestSigPair(targetState: TargetState, currentAlgorithm: string): string {
  if (targetState === 'pure-PQC') return 'ML-DSA-65 (FIPS 204)'
  if (targetState === 'hybrid-PQC+PQC') {
    return 'ML-DSA-65 + SLH-DSA-SHA2-128s (lattice + hash-based)'
  }
  if (targetState === 'crypto-gateway') {
    return 'Gateway-terminated ML-DSA-65 (legacy peer keeps classical sig)'
  }
  // hybrid-traditional+PQC default
  if (currentAlgorithm.startsWith('RSA')) {
    return `${currentAlgorithm} + ML-DSA-65 (LAMPS hybrid composite signatures)`
  }
  if (currentAlgorithm.startsWith('ECDSA')) {
    return `${currentAlgorithm} + ML-DSA-65 (LAMPS hybrid composite signatures)`
  }
  if (currentAlgorithm === 'Ed25519') {
    return 'Ed25519 + ML-DSA-65 (LAMPS hybrid composite signatures)'
  }
  return 'Classical + ML-DSA-65 (LAMPS hybrid composite signatures)'
}

function watchOutsForTarget(targetState: TargetState, bandwidthBudget: string): string[] {
  const base: Record<TargetState, string[]> = {
    'hybrid-traditional+PQC': [
      'Handshake size grows: ML-KEM-768 public key is 1184 bytes, ciphertext 1088 bytes; ML-DSA-65 signature is 3309 bytes.',
      'Plan a second transition when the traditional half is disallowed (CSWP-39 §3.2.4).',
      'Downgrade-attack risk if cipher-suite negotiation is not integrity-protected.',
    ],
    'hybrid-PQC+PQC': [
      'Two PQC algorithms means two parameter sets, two code paths, double the side-channel surface.',
      'Useful while PQC confidence is still building; revisit annually.',
      'Larger handshake than single-PQC; verify peers can parse composite formats.',
    ],
    'pure-PQC': [
      'No fallback if a vulnerability is found in the chosen PQC algorithm — crypto-agility is essential.',
      'Confirm all peers in the trust boundary support the chosen algorithm before cutover.',
      'Hash-based signatures (SLH-DSA, LMS, XMSS) are an option for the most conservative deployments.',
    ],
    'crypto-gateway': [
      'Gateway is a mitigation, not a migration — set a mandatory sunset date (CSWP-39 §4.6).',
      'Gateway becomes a single point of failure and a high-value target; harden accordingly.',
      'Plaintext or re-encrypted traffic between gateway and legacy peer must stay inside trusted boundary.',
    ],
  }
  const list = [...base[targetState]]
  if (bandwidthBudget === 'strict') {
    list.push(
      'Bandwidth budget is strict — measure handshake size against link budget before committing.'
    )
  }
  return list
}

function rationaleForTarget(targetState: TargetState): string {
  switch (targetState) {
    case 'hybrid-traditional+PQC':
      return 'Hybrid public-key algorithms continue using the well-tested, traditional public-key algorithms while study of the new PQC algorithms continues and implementations mature (CSWP-39 §3.2.4).'
    case 'hybrid-PQC+PQC':
      return 'Two PQC algorithms provide belt-and-suspenders coverage during the early-PQC confidence period — CSWP-39 §3.2.4 notes that SDOs are considering hybrids of more than one PQC algorithm.'
    case 'pure-PQC':
      return 'Pure-PQC is the preferred long-term target — CSWP-39 §3.2.4 names this end-state directly in Fig.1; choose it when the system has the crypto-agility to swap algorithms again later if needed.'
    case 'crypto-gateway':
      return 'Where crypto-agility is absent and the protocol cannot be upgraded in place, CSWP-39 §4.6 recommends a crypto gateway as a time-limited mitigation with a mandatory sunset.'
  }
}

/**
 * Recommend a transition pathway from inventory + constraint inputs.
 * Pure function — no React, no state, no I/O. Unit-tested directly.
 */
export function recommendTransitionPathway(inputs: TransitionInputs): TransitionRecommendation {
  const {
    currentAlgorithm,
    dataLifetime,
    deploymentMaturity,
    cryptoAgility,
    complianceDeadline,
    bandwidthBudget,
  } = inputs

  let targetState: TargetState

  // Rule 1: legacy-frozen + no agility -> gateway (CSWP-39 §4.6)
  if (cryptoAgility === 'none' && deploymentMaturity === 'legacy-frozen') {
    targetState = 'crypto-gateway'
  }
  // Rule 2: greenfield + reasonable deadline -> pure PQC directly
  else if (
    deploymentMaturity === 'greenfield' &&
    (complianceDeadline === 'none' ||
      parseInt(complianceDeadline, 10) >= 2030 ||
      !Number.isFinite(parseInt(complianceDeadline, 10)))
  ) {
    targetState = 'pure-PQC'
  }
  // Rule 3: very-long lifetime OR immediate deadline -> hybrid PQC+PQC (defence-in-depth)
  else if (isVeryLongLifetime(dataLifetime) || isImmediateDeadline(complianceDeadline)) {
    targetState = 'hybrid-PQC+PQC'
  }
  // Rule 4: long lifetime + agility + near deadline -> hybrid traditional+PQC (transition step)
  else if (
    isLongLifetime(dataLifetime) &&
    hasMinimumAgility(cryptoAgility) &&
    isNearDeadline(complianceDeadline)
  ) {
    targetState = 'hybrid-traditional+PQC'
  }
  // Default: hybrid traditional+PQC (the safest mid-transition pathway)
  else {
    targetState = 'hybrid-traditional+PQC'
  }

  const deadlineYear = deadlineYearOrDefault(complianceDeadline)
  const hybridTargetYear = Math.max(new Date().getFullYear() + 1, deadlineYear - 2)
  const hybridTargetDate = `Q4 ${hybridTargetYear}`
  const sunsetDate = `Q4 ${deadlineYear}`

  return {
    targetState,
    rationale: rationaleForTarget(targetState),
    kemPair: suggestKemPair(targetState, currentAlgorithm),
    sigPair: suggestSigPair(targetState, currentAlgorithm),
    watchOuts: watchOutsForTarget(targetState, bandwidthBudget),
    hybridTargetDate,
    sunsetDate,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSWP-39 §3.2.4 verbatim quote (sanitised to ASCII)
// ─────────────────────────────────────────────────────────────────────────────

const CSWP39_324_QUOTE =
  'One use case for hybrid public-key algorithms is to continue using the well-tested, traditional public-key algorithms while study of the new PQC algorithms continues and implementations mature. Choosing a hybrid algorithm may lead to a second transition when the traditional algorithm is disallowed.'

// ─────────────────────────────────────────────────────────────────────────────
// Wizard section definitions
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS: ArtifactSection[] = [
  {
    id: 'inventory',
    title: 'Step 1 — Inventory',
    description: 'Which protocol or asset is this transition plan for?',
    fields: [
      {
        id: 'protocol',
        label: 'Protocol / asset',
        type: 'select',
        options: [
          { value: 'TLS 1.3', label: 'TLS 1.3' },
          { value: 'TLS 1.2', label: 'TLS 1.2' },
          { value: 'IKEv2 / IPsec', label: 'IKEv2 / IPsec' },
          { value: 'SSH', label: 'SSH' },
          { value: 'S/MIME', label: 'S/MIME' },
          { value: 'Code signing', label: 'Code signing' },
          { value: 'Certificate hierarchy', label: 'Certificate hierarchy (PKI)' },
          { value: 'Custom protocol', label: 'Custom protocol' },
        ],
        defaultValue: 'TLS 1.3',
      },
      {
        id: 'currentAlgorithm',
        label: 'Algorithm in use today',
        type: 'select',
        options: [
          { value: 'RSA-2048', label: 'RSA-2048' },
          { value: 'RSA-3072', label: 'RSA-3072' },
          { value: 'RSA-4096', label: 'RSA-4096' },
          { value: 'ECDSA-P256', label: 'ECDSA-P256' },
          { value: 'ECDSA-P384', label: 'ECDSA-P384' },
          { value: 'Ed25519', label: 'Ed25519' },
          { value: 'ECDH-P256', label: 'ECDH-P256' },
          { value: 'X25519', label: 'X25519' },
        ],
        defaultValue: 'X25519',
      },
      {
        id: 'function',
        label: 'Cryptographic function',
        type: 'select',
        options: [
          { value: 'signature', label: 'Digital signature' },
          { value: 'kem', label: 'Key encapsulation / key exchange' },
          { value: 'both', label: 'Both signature and KEM' },
        ],
        defaultValue: 'kem',
      },
      {
        id: 'dataLifetime',
        label: 'Data lifetime (HNDL exposure window)',
        type: 'select',
        options: [
          { value: '<1y', label: 'Less than 1 year' },
          { value: '1-5y', label: '1 - 5 years' },
          { value: '5-15y', label: '5 - 15 years' },
          { value: '>15y', label: 'More than 15 years' },
        ],
        defaultValue: '5-15y',
      },
      {
        id: 'deploymentMaturity',
        label: 'Deployment maturity',
        type: 'select',
        options: [
          { value: 'greenfield', label: 'Greenfield (new build)' },
          {
            value: 'in-production-with-agility',
            label: 'In production - crypto-agile (modular APIs)',
          },
          {
            value: 'in-production-without-agility',
            label: 'In production - not agile (config rebuild required)',
          },
          { value: 'legacy-frozen', label: 'Legacy / firmware-frozen' },
        ],
        defaultValue: 'in-production-with-agility',
      },
    ],
  },
  {
    id: 'constraints',
    title: 'Step 2 — Constraints',
    description: 'What limits your choices?',
    fields: [
      {
        id: 'interoperabilityRequirement',
        label: 'Interoperability requirements',
        type: 'checklist',
        options: [
          { value: 'classical-peers', label: 'Must interop with non-PQC peers' },
          { value: 'hybrid-peers', label: 'Must interop with hybrid-only peers' },
          { value: 'fips-validated', label: 'FIPS-validated crypto module required' },
          { value: 'cnsa-2', label: 'CNSA 2.0 timeline binding' },
          { value: 'downgrade-protection', label: 'Downgrade-protection mandatory' },
        ],
        defaultValue: ['classical-peers', 'downgrade-protection'],
      },
      {
        id: 'bandwidthBudget',
        label: 'Bandwidth budget',
        type: 'select',
        options: [
          { value: 'strict', label: 'Strict (constrained IoT, satellite, smartcard)' },
          { value: 'moderate', label: 'Moderate (typical TLS server)' },
          { value: 'generous', label: 'Generous (server-side, no embedded constraint)' },
        ],
        defaultValue: 'moderate',
      },
      {
        id: 'cryptoAgility',
        label: 'Crypto agility',
        type: 'select',
        options: [
          { value: 'high', label: 'High (modular APIs, hot-swap)' },
          { value: 'medium', label: 'Medium (config-file driven)' },
          { value: 'low', label: 'Low (hardcoded, recompile required)' },
          { value: 'none', label: 'None (firmware-baked, legacy)' },
        ],
        defaultValue: 'medium',
      },
      {
        id: 'complianceDeadline',
        label: 'Compliance deadline',
        type: 'select',
        options: [
          { value: '2025', label: '2025' },
          { value: '2027', label: '2027' },
          { value: '2030', label: '2030' },
          { value: '2033', label: '2033' },
          { value: '2035', label: '2035' },
          { value: 'none', label: 'No fixed deadline' },
        ],
        defaultValue: '2030',
      },
    ],
  },
  {
    id: 'plan',
    title: 'Step 4 — Plan narrative (editable)',
    description:
      'Edit the narrative, risks, and validation steps that will appear in the exported plan.',
    fields: [
      {
        id: 'summary',
        label: 'Transition narrative',
        type: 'textarea',
        placeholder:
          'e.g., Move TLS 1.3 from X25519 to X25519MLKEM768 by Q4-2028, then to pure ML-KEM-768 by Q4-2030 once peer support is universal.',
      },
      {
        id: 'risks',
        label: 'Risks',
        type: 'textarea',
        defaultValue: [
          '- Downgrade attack on negotiated cipher suite if integrity-protection is absent',
          '- Interop break with peers that have not adopted the chosen hybrid format',
          '- Handshake-size performance regression on bandwidth-constrained links',
          '- Second-transition cost when the traditional half is disallowed',
        ].join('\n'),
      },
      {
        id: 'validation',
        label: 'Validation steps',
        type: 'textarea',
        defaultValue: [
          '- Test handshake against a hybrid-aware peer in a controlled environment',
          '- Run an interop matrix across vendor stacks (OpenSSL, BoringSSL, Rustls)',
          '- Monitor IETF + CSPs for hybrid-format draft maturity status',
          '- Capture handshake-size metrics; compare to baseline before rollout',
          '- Plan a rollback path that re-pins the classical-only cipher suite',
        ].join('\n'),
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Markdown preview
// ─────────────────────────────────────────────────────────────────────────────

function targetStateLabel(targetState: TargetState): string {
  switch (targetState) {
    case 'hybrid-traditional+PQC':
      return 'Hybrid (Traditional + PQC)'
    case 'hybrid-PQC+PQC':
      return 'Hybrid (PQC + PQC) - defence in depth'
    case 'pure-PQC':
      return 'Pure PQC'
    case 'crypto-gateway':
      return 'Crypto Gateway (CSWP-39 §4.6 mitigation)'
  }
}

function dataLifetimeLabel(v: string): string {
  switch (v) {
    case '<1y':
      return 'Less than 1 year'
    case '1-5y':
      return '1 - 5 years'
    case '5-15y':
      return '5 - 15 years'
    case '>15y':
      return 'More than 15 years'
    default:
      return v || 'Unspecified'
  }
}

function sanitiseAscii(md: string): string {
  return md
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/→/g, '->')
    .replace(/§/g, 'Section ')
}

export function renderHybridTransitionMarkdown(
  data: Record<string, Record<string, string | string[]>>
): string {
  const inv = data.inventory ?? {}
  const con = data.constraints ?? {}
  const plan = data.plan ?? {}

  const inputs: TransitionInputs = {
    protocol: (inv.protocol as string) || 'TLS 1.3',
    currentAlgorithm: (inv.currentAlgorithm as string) || 'X25519',
    function: (inv.function as string) || 'kem',
    dataLifetime: (inv.dataLifetime as string) || '5-15y',
    deploymentMaturity: (inv.deploymentMaturity as string) || 'in-production-with-agility',
    cryptoAgility: (con.cryptoAgility as string) || 'medium',
    complianceDeadline: (con.complianceDeadline as string) || '2030',
    bandwidthBudget: (con.bandwidthBudget as string) || 'moderate',
  }

  const rec = recommendTransitionPathway(inputs)
  const interop = Array.isArray(con.interoperabilityRequirement)
    ? (con.interoperabilityRequirement as string[])
    : []

  const interopLabels: Record<string, string> = {
    'classical-peers': 'Must interop with non-PQC peers',
    'hybrid-peers': 'Must interop with hybrid-only peers',
    'fips-validated': 'FIPS-validated crypto module required',
    'cnsa-2': 'CNSA 2.0 timeline binding',
    'downgrade-protection': 'Downgrade-protection mandatory',
  }

  let md = `# Hybrid Algorithm Transition Plan - ${inputs.protocol}\n\n`
  md += `*Aligned to NIST CSWP 39 Section 3.2.4 (Hybrid Cryptographic Algorithms) and Fig.1.*\n`
  md += `*https://doi.org/10.6028/NIST.CSWP.39*\n\n`

  md += `## 1. Current State\n\n`
  md += `- Protocol: ${inputs.protocol}\n`
  md += `- Algorithm in use: ${inputs.currentAlgorithm} (${inputs.function})\n`
  md += `- Data lifetime: ${dataLifetimeLabel(inputs.dataLifetime)}\n`
  md += `- Deployment maturity: ${inputs.deploymentMaturity}\n`
  md += `- Crypto agility: ${inputs.cryptoAgility}\n\n`

  md += `## 2. Constraints\n\n`
  md += `- Interop requirements: ${interop.length === 0 ? 'None specified' : interop.map((k) => interopLabels[k] ?? k).join('; ')}\n`
  md += `- Bandwidth budget: ${inputs.bandwidthBudget}\n`
  md += `- Compliance deadline: ${inputs.complianceDeadline}\n\n`

  md += `## 3. Recommended Transition Pathway\n\n`
  md += `**Recommendation: ${targetStateLabel(rec.targetState)}**\n\n`
  md += `${rec.rationale}\n\n`
  md += `> "${CSWP39_324_QUOTE}"\n`
  md += `> -- NIST CSWP 39 Section 3.2.4\n\n`
  md += `### Algorithm pairing\n\n`
  md += `- KEM: ${rec.kemPair}\n`
  md += `- Signature: ${rec.sigPair}\n\n`
  md += `### Watch-outs\n\n`
  for (const w of rec.watchOuts) md += `- ${w}\n`
  md += `\n`

  md += `## 4. Migration Plan\n\n`
  const userSummary = (plan.summary as string) || ''
  if (userSummary) {
    md += `${userSummary}\n\n`
  } else {
    md += `Transition pathway for ${inputs.protocol}: ${inputs.currentAlgorithm} -> ${rec.kemPair} / ${rec.sigPair} (target ${rec.hybridTargetDate}) -> Pure PQC (target ${rec.sunsetDate}).\n\n`
  }
  md += `- Phase 1 (now -> ${rec.hybridTargetDate}): deploy hybrid pairing in pilot, then production\n`
  md += `- Phase 2 (${rec.hybridTargetDate} -> ${rec.sunsetDate}): monitor PQC confidence; prepare pure-PQC config\n`
  md += `- Phase 3 (${rec.sunsetDate} and after): sunset classical half, enable pure PQC\n\n`

  md += `### Risks\n\n`
  md += `${(plan.risks as string) || '- (none specified)'}\n\n`

  md += `### Validation steps\n\n`
  md += `${(plan.validation as string) || '- (none specified)'}\n\n`

  md += `---\n\n`
  md += `*Generated by PQC Today Hub. Standards citation: NIST CSWP 39 Section 3.2.4 (Hybrid Cryptographic Algorithms), Fig.1. https://doi.org/10.6028/NIST.CSWP.39*\n`

  return sanitiseAscii(md)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const HybridTransitionPlanner: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)

  const sections = useMemo(() => SECTIONS, [])

  const handleExport = useCallback(
    (data: Record<string, Record<string, string | string[]>>) => {
      const protocol = (data.inventory?.protocol as string) || 'TLS 1.3'
      const markdown = renderHybridTransitionMarkdown(data)
      addExecutiveDocument({
        id: `hybrid-transition-${Date.now()}`,
        moduleId: 'crypto-mgmt-modernization',
        type: 'hybrid-transition',
        title: `Hybrid Transition Plan - ${protocol}`,
        data: markdown,
        createdAt: Date.now(),
      })
    },
    [addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 border-l-4 border-status-info flex items-start gap-3">
        <GitBranch size={20} className="text-status-info mt-0.5 shrink-0" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Hybrid Algorithm Transition Planner
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Architect-facing decision tree from NIST CSWP 39 Section 3.2.4 - Hybrid Cryptographic
            Algorithms. Recommends a transition pathway and emits an editable migration plan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="glass-panel p-3 flex items-start gap-2">
          <GitBranch size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Traditional</p>
            <p className="text-muted-foreground">
              Today: RSA, ECDSA, ECDH - quantum-vulnerable under Shor.
            </p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-2">
          <ArrowRight size={16} className="text-status-info shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Hybrid (Traditional + PQC)</p>
            <p className="text-muted-foreground">
              Transition step: classical and PQC together while PQC confidence builds.
            </p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-2">
          <ShieldCheck size={16} className="text-status-success shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Pure PQC</p>
            <p className="text-muted-foreground">
              End-state: FIPS 203 / 204 / 205 standalone, with hybrid-PQC+PQC as a sibling option.
            </p>
          </div>
        </div>
      </div>

      <ArtifactBuilder
        title="Hybrid Algorithm Transition Plan"
        description="Fill in the inventory and constraint sections, then preview the recommended pathway."
        sections={sections}
        onExport={handleExport}
        exportFilename="hybrid-transition-plan"
        renderPreview={renderHybridTransitionMarkdown}
        exportFormats={['markdown', 'pdf']}
      />
    </div>
  )
}
