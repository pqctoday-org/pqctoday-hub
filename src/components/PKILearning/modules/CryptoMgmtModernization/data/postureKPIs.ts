// SPDX-License-Identifier: GPL-3.0-only
/**
 * Posture KPI taxonomy used by PostureKPIDesigner.
 * Each KPI belongs to exactly one pillar; audience is a suggested stakeholder.
 */

import type { PillarId } from './maturityModel'

export type KpiAudience = 'board' | 'cio' | 'ciso' | 'architect' | 'ops'

export interface PostureKPI {
  id: string
  pillar: PillarId
  name: string
  description: string
  unit: string
  audience: KpiAudience[]
  example: string
}

export const POSTURE_KPIS: PostureKPI[] = [
  // Inventory
  {
    id: 'cbom-coverage-certs',
    pillar: 'inventory',
    name: 'CBOM coverage: certificates',
    description: '% of discovered certificates present in the central CBOM.',
    unit: '%',
    audience: ['ciso', 'architect'],
    example: '92% (target 99%)',
  },
  {
    id: 'cbom-coverage-libraries',
    pillar: 'inventory',
    name: 'CBOM coverage: libraries',
    description: '% of deployed crypto libraries mapped via SBOM → CBOM ingestion.',
    unit: '%',
    audience: ['ciso', 'architect'],
    example: '78% (target 95%)',
  },
  {
    id: 'shadow-cert-count',
    pillar: 'inventory',
    name: 'Shadow cert count',
    description: 'Certs discovered via CT logs that are not in the CLM system.',
    unit: 'count',
    audience: ['ciso', 'ops'],
    example: '47 (trend: down 12 QoQ)',
  },
  {
    id: 'cbom-freshness',
    pillar: 'inventory',
    name: 'CBOM freshness',
    description: 'Median age (hours) of the most recent CBOM refresh across asset classes.',
    unit: 'hours',
    audience: ['architect', 'ops'],
    example: '6 h (target ≤24 h)',
  },

  // Governance
  {
    id: 'policy-drift-rate',
    pillar: 'governance',
    name: 'Policy-drift rate',
    description: 'Assets whose algorithm/size deviates from policy, as % of inventory.',
    unit: '%',
    audience: ['board', 'ciso'],
    example: '3.2% (target ≤1%)',
  },
  {
    id: 'exception-aging',
    pillar: 'governance',
    name: 'Exception aging',
    description: 'Count of policy exceptions open > 90 days.',
    unit: 'count',
    audience: ['ciso'],
    example: '4 (target ≤2)',
  },

  // Lifecycle / CLM
  {
    id: 'cert-expiry-risk-30d',
    pillar: 'lifecycle',
    name: 'Cert-expiry risk (≤30 d)',
    description: 'Certs expiring in ≤30 days that are not yet queued for renewal.',
    unit: 'count',
    audience: ['board', 'ciso', 'ops'],
    example: '12 (target 0)',
  },
  {
    id: 'cert-mttr',
    pillar: 'lifecycle',
    name: 'Cert MTTR',
    description: 'Mean time to renew a cert, from discovery trigger to deployment.',
    unit: 'hours',
    audience: ['ciso', 'ops'],
    example: '2.4 h (target ≤1 h)',
  },
  {
    id: 'auto-renew-pct',
    pillar: 'lifecycle',
    name: '% certs auto-renewed',
    description: 'Share of renewals completed via ACME/EST/CMP with zero human touch.',
    unit: '%',
    audience: ['board', 'ciso'],
    example: '68% (2029 target 100%)',
  },
  {
    id: 'root-rotation-readiness',
    pillar: 'lifecycle',
    name: 'Root-rotation readiness',
    description: '% of systems with validated runbook for intermediate/root CA rotation.',
    unit: '%',
    audience: ['ciso', 'architect'],
    example: '55% (target 90%)',
  },

  // Observability
  {
    id: 'siem-mttd',
    pillar: 'observability',
    name: 'Crypto-drift MTTD',
    description: 'Mean time to detect a crypto policy violation via SIEM.',
    unit: 'minutes',
    audience: ['ciso', 'ops'],
    example: '38 min (target ≤15 min)',
  },
  {
    id: 'crypto-debt-trend',
    pillar: 'observability',
    name: 'Crypto-debt trend',
    description: 'Quarter-over-quarter change in policy-non-compliant asset count.',
    unit: '%',
    audience: ['board', 'ciso'],
    example: '−7% QoQ',
  },

  // Governance (additional)
  {
    id: 'policy-enforcement-rate',
    pillar: 'governance',
    name: 'Policy enforcement rate',
    description:
      '% of endpoints whose cipher-suite and TLS-version configuration has been automatically verified against policy.',
    unit: '%',
    audience: ['ciso', 'ops'],
    example: '64% (target 95%)',
  },
  {
    id: 'governance-attestation-coverage',
    pillar: 'governance',
    name: 'Crypto policy attestation coverage',
    description:
      '% of crypto-decision owners (architects, lead engineers) who completed annual crypto policy attestation.',
    unit: '%',
    audience: ['board', 'cio'],
    example: '72% (target 100%)',
  },

  // Observability (additional)
  {
    id: 'cipher-scan-coverage',
    pillar: 'observability',
    name: 'Cipher-suite scan coverage',
    description:
      '% of externally and internally reachable endpoints covered by ongoing cipher-suite and protocol-version scan.',
    unit: '%',
    audience: ['ciso', 'architect'],
    example: '58% (target 90%)',
  },
  {
    id: 'standards-watch-lag',
    pillar: 'observability',
    name: 'Standards-watch lag',
    description:
      'Median days from a standards-body deprecation notice (IETF/NIST/NSA) to the CBOM classification rule update that flags the deprecated primitive.',
    unit: 'days',
    audience: ['ciso', 'ops'],
    example: '18 d (target ≤7 d)',
  },

  // Assurance / FIPS
  {
    id: 'fips-coverage',
    pillar: 'assurance',
    name: '% inventory backed by current FIPS 140-3',
    description:
      'Libraries + HSMs in production whose CMVP certificate is currently active (not historical or revoked).',
    unit: '%',
    audience: ['board', 'cio', 'ciso'],
    example: '81% (target 100%)',
  },
  {
    id: 'cmvp-freshness',
    pillar: 'assurance',
    name: 'CMVP validation freshness',
    description: 'Median days since last verified CMVP cert status.',
    unit: 'days',
    audience: ['ciso', 'architect'],
    example: '11 d (target ≤30 d)',
  },
  {
    id: 'acvp-backlog',
    pillar: 'assurance',
    name: 'ACVP re-cert backlog',
    description:
      'Modules awaiting ACVP algorithm re-certification after firmware or IG-update change.',
    unit: 'count',
    audience: ['architect', 'ops'],
    example: '3 (target 0)',
  },
  {
    id: 'attestation-freshness',
    pillar: 'assurance',
    name: 'Attestation freshness',
    description: 'Days since last exported compliance attestation package.',
    unit: 'days',
    audience: ['board', 'ciso'],
    example: '45 d (target ≤90 d)',
  },
  {
    id: 'esv-coverage-libs',
    pillar: 'assurance',
    name: '% libraries with active SP 800-90B ESV',
    description:
      '% of crypto libraries in the CBOM whose entropy source holds a currently active SP 800-90B Entropy Source Validation certificate.',
    unit: '%',
    audience: ['ciso', 'architect'],
    example: "12% (gap: most software libraries rely on OS entropy not separately ESV'd)",
  },
  {
    id: 'esv-coverage-hsm',
    pillar: 'assurance',
    name: '% HSMs with active SP 800-90B ESV',
    description:
      '% of HSMs in the hardware CBOM whose hardware RNG entropy source holds a currently active SP 800-90B ESV certificate.',
    unit: '%',
    audience: ['board', 'ciso'],
    example: '40% (target 100% for FIPS-scoped HSMs)',
  },
]
