// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical CSWP.39 Fig 3 — Crypto Agility Strategic Plan zone model.
 *
 * Shared data for:
 *   - The Command Center primary nav (`<CommandCenterStrategicPlan>` + `<CSWP39ZonePanel>`)
 *   - The CryptoMgmtModernization learn-module visual (`<CryptoAgilityProcessDiagram>`)
 *
 * Both consumers MUST use these constants — never inline a different zone list.
 * Adding a zone here requires updating `BusinessTool.cswp39Zone`, `ZONE_ARTIFACT_TYPES`,
 * `BC_ZONE_EMPHASIS_BY_PERSONA`, and the drift-guard test in lockstep.
 */

export type ZoneId =
  | 'governance'
  | 'assets'
  | 'management-tools'
  | 'risk-management'
  | 'mitigation'
  | 'migration'

export interface CSWP39ZoneDetail {
  /** Human-readable zone title used in headers and detail panels. */
  title: string
  /** One-paragraph "what is this zone for". */
  what: string
  /** Sub-elements (Fig 3 chips inside the zone). Used as sub-grouping keys for tools. */
  contains: string[]
  /** Which Crypto Posture Management pillar this zone primarily exercises. */
  cpmPillar: string
  /** Which CSWP.39 §-reference covers this zone. */
  cswpRef: string
  /** Short banner label rendered on the diagram tile. */
  label: string
}

export const CSWP39_ZONE_DETAILS: Record<ZoneId, CSWP39ZoneDetail> = {
  governance: {
    title: 'Governance',
    what: 'The policy and compliance layer that shapes all crypto decisions across the organisation.',
    contains: [
      'Standards',
      'Regulations/Mandates',
      'Supply Chains',
      'Threats',
      'Business Requirements',
      'Crypto Policies',
      'Crypto Architecture',
    ],
    cpmPillar: 'Governance pillar — policy ownership, RACI, standards-watch subscription',
    cswpRef: 'NIST CSWP.39 §5.1–5.4',
    label: 'GOVERNANCE',
  },
  assets: {
    title: 'Assets',
    what: 'The cryptographic attack surface — everything that uses, stores, or transmits cryptographic material.',
    contains: ['Code', 'Libraries', 'Applications', 'Files', 'Protocols', 'Systems'],
    cpmPillar:
      'Inventory pillar — CBOM covers all six asset classes; feeds the Information Repository',
    cswpRef: 'NIST CSWP.39 §5.2 (Crypto Security Policy Enforcement)',
    label: 'ASSETS',
  },
  'management-tools': {
    title: 'Management Tools',
    what: 'Automated discovery, assessment, configuration, and enforcement tooling that bridges Assets and Risk Management.',
    contains: ['Data', 'Crypto', 'Vulnerability', 'Assets', 'Log/SIEM', 'Zero-Trust'],
    cpmPillar: 'Observability + Inventory pillars — automate the Information Repository feed',
    cswpRef: 'NIST CSWP.39 §4.3 (service mesh / zero-trust), §5.2 (enforcement)',
    label: 'MANAGEMENT TOOLS',
  },
  'risk-management': {
    title: 'Data-Centric Risk Management',
    what: 'The intelligence layer — aggregates tool output and produces a prioritised action list with KPIs for executives.',
    contains: [
      'Information Repository',
      'Risk Analysis Engine',
      'KPI Dashboards',
      'Monitoring / Reports',
    ],
    cpmPillar:
      'Observability pillar (KPIs, dashboards) + Assurance pillar (FIPS metrics, attestation)',
    cswpRef: 'NIST CSWP.39 §6.5 (Maturity Assessment)',
    label: 'DATA-CENTRIC RISK MGMT',
  },
  mitigation: {
    title: 'Mitigation',
    what: 'Deploy a crypto gateway ("bump-in-the-wire") for systems that cannot be migrated now — buys time, not permanence. Pairs with a sunset plan.',
    contains: [
      'Crypto gateway / bump-in-the-wire',
      'Cipher-suite proxy',
      'Network-layer re-encryption',
      'Mandatory sunset date',
    ],
    cpmPillar: 'Lifecycle pillar — remediation track; gateway itself must be tracked in CBOM',
    cswpRef: 'NIST CSWP.39 §4.6 (Crypto Gateway for Legacy Systems)',
    label: 'MITIGATION',
  },
  migration: {
    title: 'Migration',
    what: 'Full algorithm replacement — the preferred long-term path when the system has crypto agility (modular APIs, updatable firmware).',
    contains: [
      'Library upgrades',
      'Firmware updates',
      'Certificate re-issuance',
      'Protocol negotiation updates',
      'ACME / EST / CMP automation',
    ],
    cpmPillar: 'Lifecycle pillar — CLM automation, ACME/EST/CMP, certificate renewal pipeline',
    cswpRef: 'NIST CSWP.39 §3.2 (Algorithm Transitions)',
    label: 'MIGRATION',
  },
}

export interface CSWP39ZoneStyle {
  /** Tailwind border colour utility used for the zone tile. */
  border: string
  /** Tailwind background colour utility (default state). */
  bg: string
  /** Tailwind background colour utility (active/selected state). */
  activeBg: string
  /** Tailwind text colour utility for the zone label and tier badge. */
  text: string
}

export const CSWP39_ZONE_STYLES: Record<ZoneId, CSWP39ZoneStyle> = {
  governance: {
    border: 'border-primary/40',
    bg: 'bg-primary/5',
    activeBg: 'bg-primary/15',
    text: 'text-primary',
  },
  assets: {
    border: 'border-pillar-inventory/40',
    bg: 'bg-pillar-inventory/5',
    activeBg: 'bg-pillar-inventory/15',
    text: 'text-pillar-inventory',
  },
  'management-tools': {
    border: 'border-border',
    bg: 'bg-muted/20',
    activeBg: 'bg-muted/50',
    text: 'text-foreground',
  },
  'risk-management': {
    border: 'border-status-success/30',
    bg: 'bg-status-success/5',
    activeBg: 'bg-status-success/15',
    text: 'text-status-success',
  },
  mitigation: {
    border: 'border-status-warning/40',
    bg: 'bg-status-warning/5',
    activeBg: 'bg-status-warning/15',
    text: 'text-status-warning',
  },
  migration: {
    border: 'border-status-info/40',
    bg: 'bg-status-info/5',
    activeBg: 'bg-status-info/15',
    text: 'text-status-info',
  },
}

/** Stable iteration order for the zones (Governance, then 3-column middle row,
 *  then Mitigation/Migration footer). Used by BusinessCenterView to render the
 *  six panels under the diagram in a deterministic sequence. */
export const CSWP39_ZONE_ORDER: ZoneId[] = [
  'governance',
  'assets',
  'management-tools',
  'risk-management',
  'mitigation',
  'migration',
]

/** Map a legacy step or section id (from earlier iterations of this UI) to its
 *  canonical Fig 3 zone. Used by the Command Center hashchange redirect to keep
 *  old `#step-govern` / `#section-strategic` URLs working. */
export function legacyToZoneId(legacyId: string): ZoneId {
  // 5-step model
  if (legacyId === 'govern') return 'governance'
  if (legacyId === 'inventory') return 'assets'
  if (legacyId === 'identify-gaps') return 'management-tools'
  if (legacyId === 'prioritise') return 'risk-management'
  if (legacyId === 'implement') return 'migration'
  // §3-§6 section model (the wrong intermediate)
  if (legacyId === 'protocols') return 'migration'
  if (legacyId === 'implementations') return 'mitigation'
  if (legacyId === 'strategic') return 'governance'
  if (legacyId === 'future-works') return 'risk-management'
  // Already-canonical zone id passes through.
  if (
    legacyId === 'governance' ||
    legacyId === 'assets' ||
    legacyId === 'management-tools' ||
    legacyId === 'risk-management' ||
    legacyId === 'mitigation' ||
    legacyId === 'migration'
  ) {
    return legacyId
  }
  return 'governance'
}
