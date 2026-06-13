// SPDX-License-Identifier: GPL-3.0-only
/**
 * The five SOC detection use cases from the Applied Quantum
 * "SOC Implementation" section (pp. 165–169). Each is buildable on existing
 * SIEM, network-monitoring, and certificate-management infrastructure.
 */
export interface DetectionUseCase {
  id: string
  code: string
  title: string
  summary: string
  severity: string
}

export const DETECTION_USE_CASES: DetectionUseCase[] = [
  {
    id: 'hybrid-downgrade',
    code: 'UC-1',
    title: 'Hybrid Downgrade Detection',
    summary:
      'SIEM correlation flags connections negotiating classical-only key shares when the registry expects hybrid. Requires adding ML-KEM and hybrid NamedGroup codepoints to traffic rules and suppressing benign middlebox-induced fallbacks.',
    severity: 'High (per alert)',
  },
  {
    id: 'crypto-drift',
    code: 'UC-2',
    title: 'Cryptographic Drift Monitoring',
    summary:
      'Continuous network monitoring flags migration-complete systems reverting to classical-only crypto. Tracked as Cryptographic Migration Coverage; needs east-west (internal) traffic visibility.',
    severity: 'Medium → High on repeat',
  },
  {
    id: 'cert-lifecycle-anomalies',
    code: 'UC-3',
    title: 'Certificate Lifecycle Anomalies',
    summary:
      'Failed PQC chain validations, unauthorized PQC issuance from the internal CA, and CA signing-key access outside scheduled windows during the transition. CT monitoring for PQC certs is immature — build around internal CA logs.',
    severity: 'Medium / High / Critical',
  },
  {
    id: 'tnfl-signature-integrity',
    code: 'UC-4',
    title: 'TNFL & Signature Integrity Monitoring',
    summary:
      'Heightened monitoring of code-signing, software-update authentication, and signature-verification policy changes against Trust-Now-Forge-Later forgery. Target MTD-Signing under 15 minutes; unify fragmented signing telemetry.',
    severity: 'Critical / High',
  },
  {
    id: 'hndl-indicator',
    code: 'UC-5',
    title: 'Enhanced HNDL-Indicator Detection',
    summary:
      'Exfiltration monitoring reweighted by data longevity: sustained transfers from 10+ year secrecy segments and bulk archival access by unusual accounts. Depends on information-governance data classification.',
    severity: 'High',
  },
]
