// SPDX-License-Identifier: GPL-3.0-only
/**
 * The SOC's quantum detection use cases and incident-response playbooks —
 * one copy, read by both the SOC Implementation Learn module
 * (`modules/SocImplementationPqc`) and the Threats page's Detection & Response
 * tabs (`components/Threats/threatClassification.ts`).
 *
 * Before 2026-09-23 the Threats page carried its own UC1–UC5 list whose labels
 * did not match the source (it had e.g. "UC5 — CTI", which the source treats
 * as a separate section, not a use case) and four invented playbooks
 * ("Decrypt-Later Exposure Response", …) linking to a Command Center tool that
 * does not exist. Both surfaces now read this module.
 *
 * Source: The Applied Quantum PQC Migration Framework – Universal, Version 3.0
 * (September 2026), "SOC Implementation" section, pp. 217–228 (library row
 * `The-Applied-Quantum-PQC-Migration-Framework-Universal-Versio`). Page
 * numbers are the document's own printed page numbers, checked against the
 * cached PDF.
 *
 * `title` is the hub's title as the Learn module has always rendered it. It
 * differs from the source heading only for Use Case 5, which v3.0 retitled
 * (the source records that correction in its Version History); `sourceHeading`
 * carries the v3.0 wording verbatim so a reader can find it in the document.
 */

export interface SocSourceCite {
  document: 'Applied Quantum PQC Migration Framework v3.0'
  page: number
}

const cite = (page: number): SocSourceCite => ({
  document: 'Applied Quantum PQC Migration Framework v3.0',
  page,
})

export type SocUseCaseId =
  | 'hybrid-downgrade'
  | 'crypto-drift'
  | 'cert-lifecycle-anomalies'
  | 'tnfl-signature-integrity'
  | 'hndl-indicator'

export interface SocUseCase {
  id: SocUseCaseId
  /** The source's use-case number (1–5). */
  number: number
  /** Short code shown on badges, e.g. "UC-1". */
  code: string
  title: string
  /** The v3.0 heading, verbatim, without the "Use Case N:" prefix. */
  sourceHeading: string
  summary: string
  severity: string
  source: SocSourceCite
}

export const SOC_USE_CASES: readonly SocUseCase[] = [
  {
    id: 'hybrid-downgrade',
    number: 1,
    code: 'UC-1',
    title: 'Hybrid Downgrade Detection',
    sourceHeading: 'Hybrid Downgrade Detection',
    summary:
      'SIEM correlation flags connections negotiating classical-only key shares when the registry expects hybrid. Requires adding ML-KEM and hybrid NamedGroup codepoints to traffic rules and suppressing benign middlebox-induced fallbacks.',
    severity: 'High (per alert)',
    source: cite(218),
  },
  {
    id: 'crypto-drift',
    number: 2,
    code: 'UC-2',
    title: 'Cryptographic Drift Monitoring',
    sourceHeading: 'Cryptographic Drift Monitoring',
    summary:
      'Continuous network monitoring flags migration-complete systems reverting to classical-only crypto. Tracked as Cryptographic Migration Coverage; needs east-west (internal) traffic visibility.',
    severity: 'Medium → High on repeat',
    source: cite(219),
  },
  {
    id: 'cert-lifecycle-anomalies',
    number: 3,
    code: 'UC-3',
    title: 'Certificate Lifecycle Anomalies',
    sourceHeading: 'Certificate Lifecycle Anomalies',
    summary:
      'Failed PQC chain validations, unauthorized PQC issuance from the internal CA, and CA signing-key access outside scheduled windows during the transition. CT monitoring for PQC certs is immature — build around internal CA logs.',
    severity: 'Medium / High / Critical',
    source: cite(220),
  },
  {
    id: 'tnfl-signature-integrity',
    number: 4,
    code: 'UC-4',
    title: 'TNFL & Signature Integrity Monitoring',
    sourceHeading: 'TNFL and Signature Integrity Monitoring',
    summary:
      'Heightened monitoring of code-signing, software-update authentication, and signature-verification policy changes against Trust-Now-Forge-Later forgery. Target MTD-Signing under 15 minutes; unify fragmented signing telemetry.',
    severity: 'Critical / High',
    source: cite(221),
  },
  {
    id: 'hndl-indicator',
    number: 5,
    code: 'UC-5',
    title: 'Enhanced HNDL-Indicator Detection',
    sourceHeading: 'Exfiltration Detection Weighted by Confidentiality Horizon',
    summary:
      'Exfiltration monitoring reweighted by data longevity: sustained transfers from 10+ year secrecy segments and bulk archival access by unusual accounts. Depends on information-governance data classification.',
    severity: 'High',
    source: cite(221),
  },
]

export function getSocUseCase(id: SocUseCaseId): SocUseCase {
  const uc = SOC_USE_CASES.find((u) => u.id === id)
  if (!uc) throw new Error(`Unknown SOC use case: ${id}`)
  return uc
}

/**
 * Cyber Threat Intelligence is its own section of the source (p. 222), not a
 * sixth use case — it is where CRQC-progress tracking lives.
 */
export const SOC_CTI_SECTION = {
  title: 'Cyber Threat Intelligence',
  source: cite(222),
} as const

export type SocIrPlaybookId =
  | 'pqc-vulnerability-disclosure'
  | 'confirmed-hybrid-downgrade'
  | 'credible-crqc-announcement'
  | 'emergency-algorithm-rotation'

export interface SocIrPlaybook {
  id: SocIrPlaybookId
  /** The source's playbook number (1–4). */
  number: number
  title: string
  trigger: string
  summary: string
  source: SocSourceCite
}

/** The four quantum-specific IR playbooks (source p. 225: "developed during
 *  Phase 0 governance setup", each with a trigger, immediate actions,
 *  coordination requirements and a drill metric). */
export const SOC_IR_PLAYBOOKS: readonly SocIrPlaybook[] = [
  {
    id: 'pqc-vulnerability-disclosure',
    number: 1,
    title: 'PQC Algorithm Vulnerability Disclosure',
    trigger:
      "NIST, a CERT, or a credible research group publishes a vulnerability or weakness in a PQC algorithm or implementation deployed in the organization's environment.",
    summary:
      'CTI grades the claim and assesses severity and scope (full algorithm break or a bug in one library version); the SOC queries the posture registry for every affected system; impact assessment to the CISO within 4 hours. Then emergency patching, or crypto-agility rotation if the algorithm itself is affected. Never rotate on an unverified cryptanalytic claim.',
    source: cite(225),
  },
  {
    id: 'confirmed-hybrid-downgrade',
    number: 2,
    title: 'Confirmed Hybrid Downgrade Attack',
    trigger:
      'A flow the posture registry expects to negotiate hybrid completed a classical-only session, and it is not a false positive, a terminating device on the path, or a fragmentation-induced retry.',
    summary:
      'Isolate the affected path, preserve packet captures, determine which Use Case 1 cause applies, and check other flows on the same path or endpoint. Escalate a downgrade attributed to an adversary to the CISO immediately; route a permissive policy or implementation defect to the migration program.',
    source: cite(226),
  },
  {
    id: 'credible-crqc-announcement',
    number: 3,
    title: 'Credible CRQC Announcement',
    trigger:
      "A credible entity announces a CRQC capable of running Shor's algorithm against production cryptographic key sizes.",
    summary:
      'Invoke crisis communications, assess exposure (share of systems migrated, the most sensitive data still under classical-only algorithms, signature-dependent systems most exposed to TNFL), and activate emergency migration for the highest-priority remaining systems.',
    source: cite(227),
  },
  {
    id: 'emergency-algorithm-rotation',
    number: 4,
    title: 'Emergency Algorithm Rotation',
    trigger: 'The organization initiates an emergency rotation of cryptographic algorithms.',
    summary:
      'The SOC must not mistake the rotation for an attack: brief it on the schedule and suppress expected mass revocations, cipher-suite changes and key-management spikes while keeping detection for real adversary activity. Drill metric: false-positive rate under 10%.',
    source: cite(227),
  },
]

export function getSocIrPlaybook(id: SocIrPlaybookId): SocIrPlaybook {
  const pb = SOC_IR_PLAYBOOKS.find((p) => p.id === id)
  if (!pb) throw new Error(`Unknown SOC IR playbook: ${id}`)
  return pb
}

/** Where the hub teaches these: the SOC Implementation Learn module. */
export const SOC_LEARN_MODULE_ID = 'soc-implementation-pqc'

/** The module covers the playbooks in its Workshop steps and Exercises-tab
 *  tabletops but has no playbook-specific section or anchor (it reads only
 *  ?tab= / ?step=), so links open the module itself. */
export const SOC_LEARN_MODULE_HREF = `/learn/${SOC_LEARN_MODULE_ID}`

export function formatSocCite(source: SocSourceCite): string {
  return `${source.document}, p. ${source.page}`
}
