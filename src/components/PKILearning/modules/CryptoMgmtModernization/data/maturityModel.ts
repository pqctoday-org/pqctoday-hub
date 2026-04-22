// SPDX-License-Identifier: GPL-3.0-only
/**
 * CPM capability maturity model.
 * 5 pillars x 5 levels, with per-asset-class indicators.
 * Scores feed the MaturityAssessment workshop radar chart.
 */

export type MaturityLevel = 1 | 2 | 3 | 4 | 5

export const MATURITY_LEVEL_LABELS: Record<MaturityLevel, string> = {
  1: 'Ad-hoc',
  2: 'Reactive',
  3: 'Defined',
  4: 'Measured',
  5: 'Optimized',
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
      2: 'Spreadsheet-level tracking for certs; no library or key inventory.',
      3: 'Unified CBOM maintained manually, refreshed quarterly.',
      4: 'Automated CBOM ingestion from SBOM pipeline, refreshed daily.',
      5: 'Continuous discovery across all 4 asset classes, with drift alerting.',
    },
  },
  {
    id: 'governance',
    label: 'Governance',
    question: 'Do you have documented policy and clear ownership for every crypto decision?',
    indicators: {
      1: 'No policy. Algorithm choices made case-by-case.',
      2: 'Informal guidance. No exception process.',
      3: 'Policy documented; RACI for major initiatives.',
      4: 'Enforced policy with exception workflow and KPI reporting.',
      5: 'Policy-as-code with automated enforcement and board attestation.',
    },
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle / CLM',
    question:
      'Can you renew, rotate, and retire every cert and key without manual toil at 47-day cadence?',
    indicators: {
      1: 'Manual cert renewal via email reminders. Frequent expiry outages.',
      2: 'Scripted renewals for some systems; manual for most.',
      3: 'ACME/EST automation for public TLS; manual for internal CAs.',
      4: 'End-to-end automation across public and internal CAs; root-rotation runbooks tested.',
      5: 'Fully automated lifecycle, 47-day-ready, shadow-cert discovery, proactive revocation.',
    },
  },
  {
    id: 'observability',
    label: 'Observability',
    question: 'Can you detect a policy drift or FIPS-cert revocation within the same day?',
    indicators: {
      1: 'No crypto metrics. Outages revealed by users.',
      2: 'Basic expiry alerts via email.',
      3: 'Dashboard with coverage and MTTR. Reviewed monthly.',
      4: 'SIEM-integrated drift alerts; CMVP change-notice subscriptions.',
      5: 'Real-time posture dashboard with anomaly detection and automated incident creation.',
    },
  },
  {
    id: 'assurance',
    label: 'Assurance / FIPS',
    question:
      'Can you prove, today, that every library and HSM in production is backed by a current FIPS 140-3 certificate?',
    indicators: {
      1: 'Unknown whether modules are validated. No tracking.',
      2: 'Cert numbers recorded once at procurement; never re-verified.',
      3: 'Annual audit checks CMVP status for production modules.',
      4: 'Automated monthly CMVP/ACVP status sync with inventory.',
      5: 'Continuous validation monitoring with IG-delta impact analysis and attestation export.',
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
