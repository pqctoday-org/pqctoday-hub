// SPDX-License-Identifier: GPL-3.0-only
/**
 * CPM capability maturity model.
 * 5 pillars x 4 tiers (CSWP.39), with per-asset-class indicators.
 * Scores feed the MaturityAssessment workshop radar chart.
 */

export type MaturityLevel = 1 | 2 | 3 | 4

export const MATURITY_LEVEL_LABELS: Record<MaturityLevel, string> = {
  1: 'Partial',
  2: 'Risk-Informed',
  3: 'Repeatable',
  4: 'Adaptive',
}

export type PillarId = 'inventory' | 'governance' | 'lifecycle' | 'observability' | 'assurance'

export interface PillarDef {
  id: PillarId
  label: string
  question: string
  indicators: Record<MaturityLevel, string>
}

export const PILLARS: PillarDef[] = [
  {
    id: 'inventory',
    label: 'Inventory',
    question:
      'How completely do you know which certificates, libraries, software, and keys are in your estate?',
    indicators: {
      1: 'No central inventory. Teams track their own crypto locally.',
      2: 'Unified CBOM maintained manually, refreshed quarterly.',
      3: 'Automated CBOM ingestion from SBOM pipeline, refreshed daily.',
      4: 'Continuous discovery across all 4 asset classes, with drift alerting.',
    },
  },
  {
    id: 'governance',
    label: 'Governance',
    question: 'Do you have documented policy and clear ownership for every crypto decision?',
    indicators: {
      1: 'No policy. Algorithm choices made case-by-case.',
      2: 'Policy documented; RACI for major initiatives.',
      3: 'Enforced policy with exception workflow and KPI reporting.',
      4: 'Policy-as-code with automated enforcement and board attestation.',
    },
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle / CLM',
    question:
      'Can you renew, rotate, and retire every cert and key without manual toil at 47-day cadence?',
    indicators: {
      1: 'Manual cert renewal via email reminders. Frequent expiry outages.',
      2: 'ACME/EST automation for public TLS; manual for internal CAs.',
      3: 'End-to-end automation across public and internal CAs; root-rotation runbooks tested.',
      4: 'Fully automated lifecycle, 47-day-ready, shadow-cert discovery, proactive revocation.',
    },
  },
  {
    id: 'observability',
    label: 'Observability',
    question: 'Can you detect a policy drift or FIPS-cert revocation within the same day?',
    indicators: {
      1: 'No crypto metrics. Outages revealed by users.',
      2: 'Dashboard with coverage and MTTR. Reviewed monthly.',
      3: 'SIEM-integrated drift alerts; CMVP change-notice subscriptions.',
      4: 'Real-time posture dashboard with anomaly detection and automated incident creation.',
    },
  },
  {
    id: 'assurance',
    label: 'Assurance / FIPS',
    question:
      'Can you prove, today, that every library and HSM in production is backed by a current FIPS 140-3 certificate?',
    indicators: {
      1: 'Unknown whether modules are validated. No tracking.',
      2: 'Annual audit checks CMVP status for production modules.',
      3: 'Automated monthly CMVP/ACVP status sync with inventory.',
      4: 'Continuous validation monitoring with IG-delta impact analysis and attestation export.',
    },
  },
]

export type AssetClass = 'certificates' | 'libraries' | 'software' | 'keys'

export const ASSET_CLASSES: AssetClass[] = ['certificates', 'libraries', 'software', 'keys']

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  certificates: 'Certificates & PKI',
  libraries: 'Crypto Libraries',
  software: 'Application Software',
  keys: 'Key Material',
}

export const ASSET_CLASS_META: Record<AssetClass, { label: string; stroke: string; fill: string }> =
  {
    certificates: {
      label: 'Certificates & PKI',
      stroke: 'hsl(var(--primary))',
      fill: 'hsl(var(--primary))',
    },
    libraries: {
      label: 'Crypto Libraries',
      stroke: 'hsl(var(--secondary))',
      fill: 'hsl(var(--secondary))',
    },
    software: {
      label: 'Application Software',
      stroke: 'hsl(var(--accent))',
      fill: 'hsl(var(--accent))',
    },
    keys: {
      label: 'Key Material',
      stroke: 'hsl(var(--warning))',
      fill: 'hsl(var(--warning))',
    },
  }
