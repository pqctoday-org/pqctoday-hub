// SPDX-License-Identifier: GPL-3.0-only
/**
 * Demo content for the simulation auto-run. Each entry is a REAL document body
 * recorded via `addExecutiveDocument` — producing a genuine `ExecutiveDocument`
 * of that type, which is exactly what completes an `activity` step.
 *
 * Content is sector-aware: DEMO_DOCS_BY_SECTOR[sector][type] is returned when
 * present, with DEMO_DOCS_BY_SECTOR['general'][type] as fallback, then a typed
 * stub as last resort.
 *
 * Every entry mirrors the matching tool's buildMarkdown() heading structure so
 * edit-mode restore sees populated sections.
 */
import type { ExecutiveDocumentType } from '@/services/storage/types'

export interface DemoDoc {
  title: string
  /** Markdown body stored as `ExecutiveDocument.data`. */
  data: string
}

export type DemoSector =
  | 'financial'
  | 'healthcare'
  | 'government'
  | 'energy'
  | 'telecom'
  | 'retail'
  | 'general'

/** Reference org per sector — used in authored content. */
export const ORG: Record<DemoSector, string> = {
  financial: 'mid-size retail bank (US)',
  healthcare: 'regional hospital network (Germany)',
  government: 'federal agency (US)',
  energy: 'utility operator (UK)',
  telecom: 'national carrier (US)',
  retail: 'e-commerce platform (AU)',
  general: 'mid-size technology company (US)',
}

/** Primary currency symbol per sector. */
export const CUR: Record<DemoSector, string> = {
  financial: '$',
  healthcare: '€',
  government: '$',
  energy: '£',
  telecom: '$',
  retail: 'A$',
  general: '$',
}

/** Primary regulation/framework label per sector. */
export const REG: Record<DemoSector, string> = {
  financial: 'CISA / SEC / DORA',
  healthcare: 'NIS2 / GDPR / HIPAA',
  government: 'FISMA / OMB M-23-02 / NSM-10',
  energy: 'NCSC / NIS2-UK / NERC CIP',
  telecom: 'FCC / CISA / 3GPP',
  retail: 'ASD ISM / PCI DSS / Privacy Act 2020',
  general: 'CISA / NIST CSF 2.0',
}

const md = (...lines: string[]): string => lines.join('\n')

/**
 * Planning-assumption disclaimer for the Z (CRQC) figures used in these demo
 * docs. Framework 2.1 Appendix C states credible CRQC estimates cluster at
 * 10–20 years out; the sim deliberately uses a more aggressive planning
 * horizon to stress-test urgency, matching the `provenance:'planning'`
 * convention already applied to Q-Day / shelf-life in `moscaClock.ts`. This
 * is a planning choice, not a published estimate — never quote it as one.
 */
const MOSCA_PLANNING_NOTE =
  '*Planning assumption: this CRQC (Z) estimate is deliberately more aggressive than the Applied Quantum Framework 2.1 range (10–20 years) to stress-test urgency. Treat as an illustrative planning anchor, not a published forecast.*'

// ---------------------------------------------------------------------------
// crqc-scenario
// ---------------------------------------------------------------------------
const crqcScenario: Record<DemoSector, DemoDoc> = {
  financial: {
    title: 'CRQC Exposure Scenario — HNDL / TNFL',
    data: md(
      `# CRQC Exposure Scenario — ${ORG.financial}`,
      '',
      '## Harvest-now, decrypt-later (HNDL)',
      '- Customer financial records and transaction histories protected by RSA-2048 / ECDHE have a regulatory retention horizon of 7 years (SOX audit-record retention; sector rules vary).',
      '- Assume bulk capture today; CRQC availability modelled 2029–2033 (aggressive planning estimate — see note below) — the exposure window opens inside the retention horizon.',
      '',
      '## Threaten-now, forge-later (TNFL)',
      '- Code-signing keys for core banking software (10-yr support lifecycle) use ECDSA P-256.',
      '- Transaction signing and payment authentication (EMV, SWIFT) depend on RSA-2048.',
      '',
      '## Mosca inequality',
      '- X (secrecy) ≈ 7y, Y (migration) ≈ 4y, Z (CRQC) ≈ 5–9y → X + Y > Z. Migration cannot wait for refresh cycle alignment.',
      MOSCA_PLANNING_NOTE
    ),
  },
  healthcare: {
    title: 'CRQC Exposure Scenario — HNDL / TNFL',
    data: md(
      `# CRQC Exposure Scenario — ${ORG.healthcare}`,
      '',
      '## Harvest-now, decrypt-later (HNDL)',
      '- Patient records carry a ~40-year confidentiality horizon under GDPR Art. 9 / national health data law, today protected by RSA-2048 / ECDHE.',
      '- Assume capture today; CRQC availability modelled 2030–2034 (aggressive planning estimate — see note below) — the exposure window opens well inside the retention horizon.',
      '',
      '## Threaten-now, forge-later (TNFL)',
      '- Long-lived firmware and medical-device code-signing keys (10–15 yr) currently use ECDSA P-256.',
      '',
      '## Mosca inequality',
      '- X (secrecy) ≈ 40y, Y (migration) ≈ 6y, Z (CRQC) ≈ 6–10y → X + Y > Z. Begin migration now.',
      MOSCA_PLANNING_NOTE
    ),
  },
  government: {
    title: 'CRQC Exposure Scenario — HNDL / TNFL',
    data: md(
      `# CRQC Exposure Scenario — ${ORG.government}`,
      '',
      '## Harvest-now, decrypt-later (HNDL)',
      '- FOUO / CUI data with 25+ year classification horizons is protected by RSA-2048 / ECDHE on inter-agency links.',
      '- NSM-10 and OMB M-23-02 presuppose state-actor harvest operations already underway.',
      '',
      '## Threaten-now, forge-later (TNFL)',
      '- PKI trust anchors (DoD Root CA) have 20-year lifetimes; firmware signing for embedded systems runs 15+ years.',
      '',
      '## Mosca inequality',
      "- X (secrecy) ≈ 25y, Y (migration) ≈ 5y, Z (CRQC) ≈ 5–9y → X + Y > Z. The June 2026 EO's 2030 key-establishment deadline is binding (NSM-10 set the 2035 whole-of-NSS goal).",
      MOSCA_PLANNING_NOTE
    ),
  },
  energy: {
    title: 'CRQC Exposure Scenario — HNDL / TNFL',
    data: md(
      `# CRQC Exposure Scenario — ${ORG.energy}`,
      '',
      '## Harvest-now, decrypt-later (HNDL)',
      '- SCADA telemetry and grid-state data with operational retention of 10 years is protected by TLS 1.2 / RSA-2048 on OT/IT boundary links.',
      '',
      '## Threaten-now, forge-later (TNFL)',
      '- Substation firmware signing keys (20-yr lifecycle) and IEC 62351 certificate authorities use ECDSA P-256.',
      '- A forged firmware update to a transmission substation is a national-security event.',
      '',
      '## Mosca inequality',
      '- X (secrecy) ≈ 10y, Y (migration) ≈ 7y, Z (CRQC) ≈ 6–10y → X + Y > Z. NERC CIP-014 hardening already mandated.',
      MOSCA_PLANNING_NOTE
    ),
  },
  telecom: {
    title: 'CRQC Exposure Scenario — HNDL / TNFL',
    data: md(
      `# CRQC Exposure Scenario — ${ORG.telecom}`,
      '',
      '## Harvest-now, decrypt-later (HNDL)',
      '- Subscriber identity data (IMSI, SUPI) and call-detail records retained 7 years under CALEA / CJIS are protected by classical KEM.',
      '',
      '## Threaten-now, forge-later (TNFL)',
      '- 5G SUCI protection uses ECIES over ECDH P-256; a quantum-capable adversary could de-anonymise SUCI within the 5G RAN lifespan (15 years).',
      '',
      '## Mosca inequality',
      '- X (secrecy) ≈ 7y, Y (migration) ≈ 5y, Z (CRQC) ≈ 5–9y → X + Y > Z. 3GPP Release 20 PQC profile is in scope.',
      MOSCA_PLANNING_NOTE
    ),
  },
  retail: {
    title: 'CRQC Exposure Scenario — HNDL / TNFL',
    data: md(
      `# CRQC Exposure Scenario — ${ORG.retail}`,
      '',
      '## Harvest-now, decrypt-later (HNDL)',
      '- Payment card tokens and loyalty PII retained under sector record-retention practice are protected by RSA-2048 / ECDHE on checkout flows.',
      '',
      '## Threaten-now, forge-later (TNFL)',
      '- Code-signing keys for payment firmware (EMV kernel) have a 10-year lifecycle.',
      '',
      '## Mosca inequality',
      '- X (secrecy) ≈ 7y, Y (migration) ≈ 4y, Z (CRQC) ≈ 5–9y → X + Y > Z. PCI SSC has signaled PQC attention but published no PQC requirements or v5.0 timeline yet.',
      MOSCA_PLANNING_NOTE
    ),
  },
  general: {
    title: 'CRQC Exposure Scenario — HNDL / TNFL',
    data: md(
      `# CRQC Exposure Scenario — ${ORG.general}`,
      '',
      '## Harvest-now, decrypt-later (HNDL)',
      '- Internal product data and customer PII with a 10-year retention horizon are protected by RSA-2048 / ECDHE on API and inter-service links.',
      '',
      '## Threaten-now, forge-later (TNFL)',
      '- Software release signing keys (ECDSA P-256) have an effective lifecycle matching the product support window (8–12 years).',
      '',
      '## Mosca inequality',
      '- X (secrecy) ≈ 10y, Y (migration) ≈ 4y, Z (CRQC) ≈ 5–9y → X + Y > Z. CISA roadmap recommends migration start by 2025.',
      MOSCA_PLANNING_NOTE
    ),
  },
}

/**
 * Fallback disclaimer for the hand-authored `roiModel` figures below. These
 * static tables are used only when `REAL_DOC_GENERATORS['roi-model']` (the
 * shared ROI/breach/inaction math in `realToolDocs.ts`) is unavailable to the
 * caller; unlike the derived figures, these are illustrative and not computed
 * from a shared, disclosed model.
 */
const ROI_ILLUSTRATIVE_NOTE =
  '*Illustrative figures — pair with your organization’s own finance model before presenting to the board.*'

// ---------------------------------------------------------------------------
// roi-model
// ---------------------------------------------------------------------------
const roiModel: Record<DemoSector, DemoDoc> = {
  financial: {
    title: 'Multi-Year Migration Budget & ROI',
    data: md(
      `# Migration Budget & ROI — ${ORG.financial}`,
      '',
      '| Driver | 3-yr cost avoided |',
      '| --- | --- |',
      '| Breach of harvested customer financial data (expected value) | $22.4M |',
      '| SEC / DORA non-compliance penalty exposure | $11.2M |',
      '| Emergency (unplanned) migration premium | $7.1M |',
      '',
      'Planned program cost (phased, refresh-aligned): $9.2M over 4 years → net positive in year 2.',
      ROI_ILLUSTRATIVE_NOTE
    ),
  },
  healthcare: {
    title: 'Multi-Year Migration Budget & ROI',
    data: md(
      `# Migration Budget & ROI — ${ORG.healthcare}`,
      '',
      '| Driver | 3-yr cost avoided |',
      '| --- | --- |',
      '| Breach of harvested PII / patient data (expected value) | €18.4M |',
      '| GDPR / NIS2 non-compliance penalty exposure | €9.1M |',
      '| Emergency (unplanned) migration premium | €6.2M |',
      '',
      'Planned program cost (phased, refresh-aligned): €7.8M over 4 years → net positive in year 2.',
      ROI_ILLUSTRATIVE_NOTE
    ),
  },
  government: {
    title: 'Multi-Year Migration Budget & ROI',
    data: md(
      `# Migration Budget & ROI — ${ORG.government}`,
      '',
      '| Driver | 3-yr cost avoided |',
      '| --- | --- |',
      '| Breach of FOUO / CUI data (expected value at classification level) | $31.0M |',
      '| FISMA / OMB M-23-02 non-compliance remediation cost | $8.4M |',
      '| Emergency migration premium (no refresh alignment) | $9.6M |',
      '',
      'Planned program cost (phased, NSM-10 aligned): $14.2M over 5 years → mandatory compliance, not optional ROI.',
      ROI_ILLUSTRATIVE_NOTE
    ),
  },
  energy: {
    title: 'Multi-Year Migration Budget & ROI',
    data: md(
      `# Migration Budget & ROI — ${ORG.energy}`,
      '',
      '| Driver | 3-yr cost avoided |',
      '| --- | --- |',
      '| Grid disruption incident (OT compromise scenario) | £42.0M |',
      '| NIS2-UK / NCSC non-compliance penalty | £6.8M |',
      '| Emergency OT migration premium (unplanned outage windows) | £11.3M |',
      '',
      'Planned program cost (phased, substation refresh cycle): £12.6M over 6 years → ROI positive in year 3; safety case mandatory.',
      ROI_ILLUSTRATIVE_NOTE
    ),
  },
  telecom: {
    title: 'Multi-Year Migration Budget & ROI',
    data: md(
      `# Migration Budget & ROI — ${ORG.telecom}`,
      '',
      '| Driver | 3-yr cost avoided |',
      '| --- | --- |',
      '| Subscriber identity breach (SUPI harvest) | $18.7M |',
      '| FCC / CALEA compliance penalties | $5.2M |',
      '| Emergency 5G RAN migration premium | $13.1M |',
      '',
      'Planned program cost (phased, 5G refresh cycle): $11.4M over 5 years → net positive in year 3.',
      ROI_ILLUSTRATIVE_NOTE
    ),
  },
  retail: {
    title: 'Multi-Year Migration Budget & ROI',
    data: md(
      `# Migration Budget & ROI — ${ORG.retail}`,
      '',
      '| Driver | 3-yr cost avoided |',
      '| --- | --- |',
      '| Payment card breach (PCI DSS 4.0 liability) | A$14.2M |',
      '| Privacy Act 2020 non-compliance penalty | A$4.1M |',
      '| Emergency migration premium (peak-season blackout) | A$5.8M |',
      '',
      'Planned program cost (phased, checkout refresh cycle): A$6.4M over 3 years → net positive in year 2.',
      ROI_ILLUSTRATIVE_NOTE
    ),
  },
  general: {
    title: 'Multi-Year Migration Budget & ROI',
    data: md(
      `# Migration Budget & ROI — ${ORG.general}`,
      '',
      '| Driver | 3-yr cost avoided |',
      '| --- | --- |',
      '| Customer data breach (expected value) | $9.8M |',
      '| Regulatory / contractual non-compliance exposure | $3.2M |',
      '| Emergency (unplanned) migration premium | $4.1M |',
      '',
      'Planned program cost (phased, refresh-aligned): $5.4M over 4 years → net positive in year 2.',
      ROI_ILLUSTRATIVE_NOTE
    ),
  },
}

// ---------------------------------------------------------------------------
// raci-matrix — mirrors RACIBuilder output: table of 10 activities × 6 roles
// ---------------------------------------------------------------------------
const raciMatrix: Record<DemoSector, DemoDoc> = {
  financial: {
    title: 'PQC Program RACI',
    data: md(
      `# PQC Migration RACI Matrix — ${ORG.financial}`,
      '',
      '| Activity | CISO | CTO | Enterprise Architect | Dev Lead | Compliance Officer | Procurement |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| Cryptographic inventory | R | C | R | C | I | I |',
      '| Risk assessment | R | C | C | I | A | I |',
      '| Vendor assessment | C | I | C | I | C | R |',
      '| Algorithm selection | C | A | R | R | C | I |',
      '| Testing & validation | I | C | C | R | C | I |',
      '| Deployment | I | A | C | R | I | I |',
      '| Monitoring & compliance | R | I | I | C | A | I |',
      '| Training & awareness | C | I | I | C | R | I |',
      '| Compliance auditing | C | I | I | I | R | I |',
      '| Stakeholder communications | R | C | I | I | C | I |',
      '',
      '**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed'
    ),
  },
  healthcare: {
    title: 'PQC Program RACI',
    data: md(
      `# PQC Migration RACI Matrix — ${ORG.healthcare}`,
      '',
      '| Activity | CISO | CTO | Enterprise Architect | Dev Lead | Compliance Officer | Procurement |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| Cryptographic inventory | R | C | R | C | I | I |',
      '| Risk assessment | R | C | C | I | A | I |',
      '| Vendor assessment | C | I | C | I | C | R |',
      '| Algorithm selection | C | A | R | R | C | I |',
      '| Testing & validation | I | C | C | R | C | I |',
      '| Deployment | I | A | C | R | I | I |',
      '| Monitoring & compliance | R | I | I | C | A | I |',
      '| Training & awareness | C | I | I | C | R | I |',
      '| Compliance auditing | C | I | I | I | R | I |',
      '| Stakeholder communications | R | C | I | I | C | I |',
      '',
      '**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed'
    ),
  },
  government: {
    title: 'PQC Program RACI',
    data: md(
      `# PQC Migration RACI Matrix — ${ORG.government}`,
      '',
      '| Activity | CISO | CTO | Enterprise Architect | Dev Lead | Compliance Officer | Procurement |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| Cryptographic inventory | R | C | R | C | I | I |',
      '| Risk assessment | A | C | C | I | R | I |',
      '| Vendor assessment | C | I | C | I | C | R |',
      '| Algorithm selection | C | A | R | R | C | I |',
      '| Testing & validation | I | C | C | R | A | I |',
      '| Deployment | I | A | C | R | C | I |',
      '| Monitoring & compliance | A | I | I | C | R | I |',
      '| Training & awareness | C | I | I | C | R | I |',
      '| Compliance auditing | C | I | I | I | A | I |',
      '| Stakeholder communications | A | C | I | I | C | I |',
      '',
      '**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed'
    ),
  },
  energy: {
    title: 'PQC Program RACI',
    data: md(
      `# PQC Migration RACI Matrix — ${ORG.energy}`,
      '',
      '| Activity | CISO | CTO | Enterprise Architect | Dev Lead | Compliance Officer | Procurement |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| Cryptographic inventory (IT + OT) | R | C | R | C | I | I |',
      '| Risk assessment | R | C | C | I | A | I |',
      '| Vendor assessment (ICS vendors) | C | I | C | I | C | R |',
      '| Algorithm selection | C | A | R | R | C | I |',
      '| Testing & validation (OT testbed) | I | C | C | R | C | I |',
      '| Deployment (maintenance windows) | I | A | C | R | I | I |',
      '| Monitoring & compliance | R | I | I | C | A | I |',
      '| Training & awareness | C | I | I | C | R | I |',
      '| Compliance auditing | C | I | I | I | R | I |',
      '| Stakeholder communications | R | C | I | I | C | I |',
      '',
      '**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed'
    ),
  },
  telecom: {
    title: 'PQC Program RACI',
    data: md(
      `# PQC Migration RACI Matrix — ${ORG.telecom}`,
      '',
      '| Activity | CISO | CTO | Enterprise Architect | Dev Lead | Compliance Officer | Procurement |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| Cryptographic inventory | R | C | R | C | I | I |',
      '| Risk assessment | R | C | C | I | A | I |',
      '| Vendor assessment | C | I | C | I | C | R |',
      '| Algorithm selection | C | A | R | R | C | I |',
      '| Testing & validation | I | C | C | R | C | I |',
      '| Deployment | I | A | C | R | I | I |',
      '| Monitoring & compliance | R | I | I | C | A | I |',
      '| Training & awareness | C | I | I | C | R | I |',
      '| Compliance auditing | C | I | I | I | R | I |',
      '| Stakeholder communications | R | C | I | I | C | I |',
      '',
      '**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed'
    ),
  },
  retail: {
    title: 'PQC Program RACI',
    data: md(
      `# PQC Migration RACI Matrix — ${ORG.retail}`,
      '',
      '| Activity | CISO | CTO | Enterprise Architect | Dev Lead | Compliance Officer | Procurement |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| Cryptographic inventory | R | C | R | C | I | I |',
      '| Risk assessment | R | C | C | I | A | I |',
      '| Vendor assessment | C | I | C | I | C | R |',
      '| Algorithm selection | C | A | R | R | C | I |',
      '| Testing & validation | I | C | C | R | C | I |',
      '| Deployment | I | A | C | R | I | I |',
      '| Monitoring & compliance | R | I | I | C | A | I |',
      '| Training & awareness | C | I | I | C | R | I |',
      '| Compliance auditing | C | I | I | I | R | I |',
      '| Stakeholder communications | R | C | I | I | C | I |',
      '',
      '**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed'
    ),
  },
  general: {
    title: 'PQC Program RACI',
    data: md(
      `# PQC Migration RACI Matrix — ${ORG.general}`,
      '',
      '| Activity | CISO | CTO | Enterprise Architect | Dev Lead | Compliance Officer | Procurement |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| Cryptographic inventory | R | C | R | C | I | I |',
      '| Risk assessment | R | C | C | I | A | I |',
      '| Vendor assessment | C | I | C | I | C | R |',
      '| Algorithm selection | C | A | R | R | C | I |',
      '| Testing & validation | I | C | C | R | C | I |',
      '| Deployment | I | A | C | R | I | I |',
      '| Monitoring & compliance | R | I | I | C | A | I |',
      '| Training & awareness | C | I | I | C | R | I |',
      '| Compliance auditing | C | I | I | I | R | I |',
      '| Stakeholder communications | R | C | I | I | C | I |',
      '',
      '**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed'
    ),
  },
}

// ---------------------------------------------------------------------------
// policy-draft — mirrors PolicyTemplateGenerator output
// ---------------------------------------------------------------------------
function policyDraft(sector: DemoSector): DemoDoc {
  const algorithms =
    sector === 'government'
      ? 'ML-KEM-1024 (CNSA 2.0), ML-DSA-87 (CNSA 2.0).'
      : 'ML-KEM-768 and ML-DSA-65 for new systems; hybrid (X25519+ML-KEM) during transition.'
  return {
    title: 'Cryptography Policy (Draft)',
    data: md(
      `# Cryptography Policy — ${ORG[sector]}`,
      `**Version:** 0.1-draft | **Policy Owner:** CISO | **Jurisdiction:** ${sector === 'healthcare' ? 'EU' : sector === 'energy' ? 'UK' : sector === 'retail' ? 'AU' : 'US'} | **Frameworks:** ${REG[sector]}`,
      '',
      '1. **Approved algorithms** — ' + algorithms,
      `2. **Prohibited** — new deployments of RSA < 3072 and non-hybrid ECDHE for data with a >5-yr horizon (${sector === 'government' ? 'NSM-10 §3.2' : sector === 'healthcare' ? 'GDPR Art. 32 compliance' : 'CISA guidance'}).`,
      '3. **Crypto-agility** — all new services must externalise algorithm choice behind a provider interface.',
      '4. **Exceptions** — time-boxed, risk-accepted by the CISO, logged in the exception register.',
      '',
      '## KPI Drift Rules (aligned to NIST CSWP 39 crypto-agility guidance)',
      '',
      '| KPI | Threshold | Policy action |',
      '| --- | --- | --- |',
      '| PQC coverage of Tier-1 systems | < 25% at Y1 gate | Escalate to board; suspend new classical deployments |',
      '| Cryptographic inventory completeness | < 60% at G1 | Freeze new system onboarding |',
      '| Vendor PQC roadmap confirmed | < 50% of critical vendors | Trigger contract renegotiation clause |'
    ),
  }
}

// ---------------------------------------------------------------------------
// board-deck — mirrors BoardPitchBuilder output
// ---------------------------------------------------------------------------
function boardDeck(sector: DemoSector): DemoDoc {
  const reg = REG[sector]
  const cur = CUR[sector]
  const budgetAsk =
    sector === 'government'
      ? '$14.2M over 5 years'
      : sector === 'healthcare'
        ? '€7.8M over 4 years'
        : sector === 'energy'
          ? '£12.6M over 6 years'
          : sector === 'retail'
            ? 'A$6.4M over 3 years'
            : `${cur}5.4M over 4 years`
  return {
    title: 'Board Mandate Pitch',
    data: md(
      `# Board Pitch — Securing ${ORG[sector]} Against the Quantum Threat`,
      '',
      `1. **The threat is dated:** adversaries harvest encrypted data today; a cryptographically relevant quantum computer (CRQC) would decrypt it retroactively. This deck models an aggressive planning estimate of 2029–2033 to stress-test urgency — the Applied Quantum Framework 2.1 range is 10–20 years; treat either as a planning anchor, not a forecast.`,
      `2. **The deadlines are real:** the June 2026 US Executive Order sets binding PQC deadlines (key establishment 2030, signatures 2031; CNSA 2.0 for national-security systems), and regulators behind ${reg} increasingly expect demonstrable migration progress.`,
      `3. **The ask:** a phased mandate of ${budgetAsk} aligned to existing refresh cycles — deferral doubles cost.`,
      `4. **The cost of waiting:** an unplanned migration runs ~2× and risks regulatory penalty plus a notifiable data breach.`
    ),
  }
}

// ---------------------------------------------------------------------------
// kpi-dashboard — mirrors KPIDashboardBuilder output
// ---------------------------------------------------------------------------
function kpiDashboard(sector: DemoSector): DemoDoc {
  return {
    title: 'Board KPI Pack',
    data: md(
      `# PQC Board KPI Pack — ${ORG[sector]}`,
      '',
      '| KPI | Baseline | Target (Y1) |',
      '| --- | --- | --- |',
      '| PQC coverage of Tier-1 systems | 0% | 25% |',
      '| Cryptographic inventory completeness | 15% | 70% |',
      '| Trust (cert / HSM PQC-ready) | 5% | 30% |',
      '| Vendors with a confirmed PQC roadmap | 20% | 50% |',
      '| Crypto-agility (abstracted services) | 10% | 40% |'
    ),
  }
}

// ---------------------------------------------------------------------------
// risk-register — mirrors RiskRegisterBuilder output
// ---------------------------------------------------------------------------
function riskRegister(sector: DemoSector): DemoDoc {
  const assets: [string, string, string][] =
    sector === 'financial'
      ? [
          ['Customer financial records', 'RSA-2048 / ECDHE', 'HNDL'],
          ['Transaction signing keys', 'ECDSA P-256', 'TNFL'],
          ['Code-signing (core banking)', 'ECDSA P-256', 'TNFL'],
        ]
      : sector === 'healthcare'
        ? [
            ['Patient records (EHR)', 'RSA-2048 / ECDHE', 'HNDL'],
            ['Medical device firmware keys', 'ECDSA P-256', 'TNFL'],
            ['Imaging archive', 'RSA-2048 TLS', 'HNDL'],
          ]
        : sector === 'government'
          ? [
              ['FOUO / CUI data', 'RSA-2048 / IKEv2', 'HNDL'],
              ['Agency PKI root CA', 'RSA-4096 ECDSA', 'TNFL'],
              ['Document signing', 'ECDSA P-256', 'TNFL'],
            ]
          : sector === 'energy'
            ? [
                ['SCADA telemetry', 'TLS 1.2 / IEC 62351', 'HNDL'],
                ['Relay firmware signing', 'ECDSA P-256', 'TNFL'],
                ['Smart meter keys', 'ECDSA P-256', 'TNFL'],
              ]
            : [
                ['Customer data (API)', 'RSA-2048 / ECDHE', 'HNDL'],
                ['Software signing keys', 'ECDSA P-256', 'TNFL'],
                ['Internal PKI', 'RSA-2048', 'TNFL'],
              ]
  return {
    title: 'Cryptographic Risk Register',
    data: md(
      `# Cryptographic Risk Register — ${ORG[sector]}`,
      '',
      '| Asset | Current algorithm | Threat | Likelihood (1–5) | Impact (1–5) | Mitigation |',
      '| --- | --- | --- | --- | --- | --- |',
      ...assets.map(
        ([a, alg, threat]) =>
          `| ${a} | ${alg} | ${threat} | 4 | 5 | Migrate to ML-KEM-768 / ML-DSA-65 by 2027 |`
      ),
      '',
      `*Aligned to ${REG[sector]} — quantum risk horizon modeled at 2029–2033 (aggressive planning assumption; Framework 2.1 states 10–20 years).*`
    ),
  }
}

// ---------------------------------------------------------------------------
// risk-treatment-plan — mirrors RiskHeatmapGenerator output
// ---------------------------------------------------------------------------
function riskTreatmentPlan(sector: DemoSector): DemoDoc {
  return {
    title: 'Risk Treatment Plan',
    data: md(
      `# Risk Treatment Plan — ${ORG[sector]}`,
      '',
      '| Asset | Risk level | Treatment | Owner | Target date |',
      '| --- | --- | --- | --- | --- |',
      `| Tier-1 confidential data (HNDL) | Critical | Migrate to ML-KEM-768 (hybrid first) | Platform Eng | Q2 2026 |`,
      `| Signing keys (TNFL) | High | Migrate to ML-DSA-65; revoke classical keys | Security Eng | Q4 2026 |`,
      `| Internal PKI | High | Issue PQC-hybrid subordinate CA; dual-stack TLS | PKI team | Q1 2027 |`,
      `| Low-sensitivity systems | Medium | Accept during transition; flag for next refresh | CISO | 2028 |`,
      '',
      `*Controls aligned to NIST CSWP 39 (crypto agility) and ${REG[sector]}.*`
    ),
  }
}

// ---------------------------------------------------------------------------
// migration-roadmap — mirrors RoadmapBuilder output
// ---------------------------------------------------------------------------
function migrationRoadmap(sector: DemoSector): DemoDoc {
  return {
    title: 'PQC Migration Roadmap (Two-Track)',
    data: md(
      `# PQC Migration Roadmap (Two-Track) — ${ORG[sector]}`,
      '',
      '## External Regulatory Deadlines',
      `- ${REG[sector]}: regulators increasingly expect demonstrable PQC progress; binding US deadlines come from the June 2026 Executive Order (key establishment 2030, signatures 2031)`,
      '',
      '## Track A — Confidentiality (KEM)',
      '',
      '| Milestone | Year | Notes |',
      '| --- | --- | --- |',
      '| Inventory complete (Tier-1) | 2025 | G1 gate |',
      '| Hybrid KEM pilot (3 systems) | 2025 | X25519+ML-KEM-768 |',
      '| Tier-1 migration complete | 2026 | Pure ML-KEM or hybrid |',
      '| Tier-2 migration complete | 2027 | Refresh-cycle aligned |',
      '',
      '## Track B — Integrity (Signatures)',
      '',
      '| Milestone | Year | Notes |',
      '| --- | --- | --- |',
      '| Code-signing pilot (ML-DSA-65) | 2026 | CI/CD integration |',
      '| PKI subordinate CA (hybrid) | 2026 | Dual-stack issue |',
      '| Root CA transition | 2028 | New root, 20-yr lifetime |',
      '',
      '## Milestone Gates',
      '- G0: Charter, budget & QRPM approved; G1: Scoping done, Priority-A ≥90%, classical findings reported, continuous discovery live; G2: CBOM live, freshness governance enforced; G3: CBOM scored; QRA delivered; G4: Roadmap approved; Year 1 plan resourced; G5: Pilots validated; Tier-1 rollout approved; G6: Infrastructure upgrades scheduled; vendor commitments tracked; G8: Verification complete; classical material decommissioned; closed to BAU',
      '',
      '## Mitigation Gateway (aligned to NIST CSWP 39 crypto-agility guidance)',
      "- Classical key material decommissioned per the organization's key-destruction standard (purge or crypto-shred) after dual-stack validation."
    ),
  }
}

// ---------------------------------------------------------------------------
// stakeholder-comms — mirrors StakeholderCommsPlanner output
// ---------------------------------------------------------------------------
function stakeholderComms(sector: DemoSector): DemoDoc {
  return {
    title: 'Stakeholder Communications Plan',
    data: md(
      `# PQC Migration — Stakeholder Communications Plan — ${ORG[sector]}`,
      '',
      '## 1. Stakeholder Map',
      '- Board / C-Suite; Technical Leadership; Development Teams; External Partners / Vendors',
      '',
      '## 2. Message Framework',
      '',
      '### Board / C-Suite',
      `Quantum computing threatens current encryption; regulators behind ${REG[sector]} increasingly expect demonstrable PQC progress, and the June 2026 US Executive Order sets binding 2030/2031 deadlines. Planned program: phased, refresh-aligned, net-positive ROI by year 2.`,
      '',
      '### Technical Leadership',
      'NIST FIPS 203/204/205 (ML-KEM, ML-DSA, SLH-DSA) are final. Two-track plan: Track A (KEM) starts 2025; Track B (signatures) starts 2026. Hybrid mode is used during transition where required by jurisdiction; NIST permits (does not mandate) hybrid.',
      '',
      '### Development Teams',
      'Externalise algorithm choice behind a crypto-provider interface. Use ML-KEM-768 for new KEM, ML-DSA-65 for new signing. No classical RSA/ECDHE in new greenfield after Q3 2025.',
      '',
      '### External Partners',
      'Request PQC roadmap and timeline from all Tier-1 vendors. Hybrid-capable products required for renewal after 2026. Contract clause template available from Procurement.',
      '',
      '## 3. Communication Cadence',
      '- Board: Quarterly | SteerCo: Monthly | Dev teams: Sprint-level | Partners: Annually',
      '',
      '## 4. Escalation Criteria',
      '- KPI drift: coverage < target → CISO escalates to board within 30 days',
      '- Vendor PQC gap: renewal blocked → Procurement + Legal escalation'
    ),
  }
}

// ---------------------------------------------------------------------------
// hybrid-transition — mirrors HybridTransitionPlanner output
// ---------------------------------------------------------------------------
function hybridTransition(sector: DemoSector): DemoDoc {
  return {
    title: 'Hybrid Transition Plan',
    data: md(
      `# Hybrid Transition Plan — ${ORG[sector]}`,
      '',
      '| Protocol | Classical | PQC | Hybrid standard | Status |',
      '| --- | --- | --- | --- | --- |',
      '| TLS 1.3 KEM | X25519 | ML-KEM-768 | IETF draft-ietf-tls-ecdhe-mlkem | Pilot |',
      '| IKEv2 / IPsec | ECDH P-256 | ML-KEM-768 | RFC 9370 / NIST SP 1800-38 | Planned 2025 |',
      '| SSH KEX | ECDH P-256 | ML-KEM-768 | draft-ietf-sshm-mlkem-hybrid-kex | Planned 2025 |',
      '| Code signing | ECDSA P-256 | ML-DSA-65 | FIPS 204 | Track B 2026 |',
      '| Certificate issuance | RSA-2048 | ML-DSA-65 | FIPS 204 / dual-stack | Planned 2026 |',
      '',
      '*Hybrid mode maintained until classical algorithms are formally deprecated in jurisdiction.*'
    ),
  }
}

// ---------------------------------------------------------------------------
// deployment-playbook — mirrors DeploymentPlaybook output
// ---------------------------------------------------------------------------
function deploymentPlaybook(sector: DemoSector): DemoDoc {
  return {
    title: 'PQC Deployment Playbook',
    data: md(
      `# PQC Deployment Playbook — ${ORG[sector]}`,
      '',
      '## Pre-Deployment Preparation',
      '- [ ] Library inventory complete (openssl/libssl/bcrypt versions confirmed)',
      '- [ ] Hybrid configuration tested in staging (TLS + IKEv2)',
      '- [ ] Rollback procedure documented and tested',
      '',
      '## Hybrid Mode Deployment',
      '- [ ] Enable ML-KEM-768 alongside X25519 (dual-algorithm config)',
      '- [ ] Deploy to 5% of traffic (canary)',
      '- [ ] Monitor: latency +X ms, CPU +Y%, no negotiation failures',
      '',
      '## Canary Deployment',
      '- [ ] Expand to 20% of Tier-1 systems after 48h canary green',
      '',
      '## Progressive Rollout',
      '- [ ] Wave 1: internet-facing APIs (25 systems)',
      '- [ ] Wave 2: internal service mesh (40 services)',
      '- [ ] Wave 3: batch / legacy integrations (refresh-aligned)',
      '',
      '## Post-Deployment Validation',
      '- [ ] ACVP test vectors passing for ML-KEM-768',
      '- [ ] Certificate chain PQC-hybrid verified',
      '- [ ] Downgrade path documented (classical fallback disabled in 90 days)',
      '',
      '## Decommission Plan (aligned to NIST CSWP 39 crypto-agility guidance)',
      "- [ ] Classical keys retired per the organization's key-destruction standard (purge or crypto-shred)",
      '- [ ] Classical certificates revoked after dual-stack validation period',
      '',
      '## Rollback Procedures',
      '- Revert config to classical-only within 15 min via blue/green flag'
    ),
  }
}

// ---------------------------------------------------------------------------
// mti-negotiator — MTI algorithm negotiation
// ---------------------------------------------------------------------------
function mtiNegotiator(sector: DemoSector): DemoDoc {
  return {
    title: 'MTI Algorithm Negotiation',
    data: md(
      `# MTI (Mandatory-To-Implement) Algorithm Negotiation — ${ORG[sector]}`,
      '',
      '| Vendor | Product | Classical MTI | PQC MTI committed | Roadmap date | Status |',
      '| --- | --- | --- | --- | --- | --- |',
      `| Primary ${sector === 'energy' ? 'SCADA' : sector === 'telecom' ? 'Core Network' : 'Platform'} Vendor | Core System | RSA-2048, ECDHE | ML-KEM-768 (hybrid) | Q3 2025 | In negotiation |`,
      '| HSM Vendor | Hardware | RSA-4096 | ML-KEM-768, ML-DSA-65 | Q1 2025 | Committed |',
      '| TLS Library | OpenSSL 3.x | TLS 1.3 | TLS PQC hybrid | 3.5.0 (2025) | Available |',
      '| Identity Provider | IdP | ECDSA P-256 | ML-DSA-65 hybrid | 2026 | Roadmap |',
      '',
      '**Negotiation principle:** hybrid MTI required for all Tier-1 renewals after 2025; pure PQC MTI required after 2028.'
    ),
  }
}

// ---------------------------------------------------------------------------
// vendor-scorecard — mirrors VendorScorecardBuilder output
// ---------------------------------------------------------------------------
function vendorScorecard(sector: DemoSector): DemoDoc {
  return {
    title: 'Vendor PQC Readiness Scorecard',
    data: md(
      `# Vendor PQC Readiness Scorecard — ${ORG[sector]}`,
      '',
      '**Portfolio average (all products): 54/100** | Products assessed: 12',
      '',
      '| Dimension | Score | Weight | Method |',
      '| --- | --- | --- | --- |',
      '| Product Roadmap | 60 | 25% | Vendor interview |',
      '| Cryptographic Standards | 70 | 25% | FIPS 203/204/205 compliance check |',
      '| Deployment Readiness | 45 | 20% | Integration test |',
      '| Operational Support | 50 | 15% | SLA review |',
      '| FIPS 140-3 Validation | 40 | 10% | CMVP lookup |',
      '| Vulnerability Management | 65 | 5% | CVE history |',
      '',
      '## Per-Vendor Readiness',
      '',
      '| Vendor | Products | Overall | Roadmap | Standards | Deployment |',
      '| --- | --- | --- | --- | --- | --- |',
      `| Primary ${sector === 'energy' ? 'OT' : 'Platform'} Vendor | 3 | 48 | 55 | 60 | 30 |`,
      '| HSM Vendor | 2 | 78 | 80 | 90 | 65 |',
      '| Identity Provider | 2 | 62 | 70 | 75 | 42 |',
      '| TLS Library | 5 | 82 | 85 | 95 | 75 |',
      '',
      '## Observability Tooling Notes (aligned to NIST CSWP 39 crypto-agility guidance)',
      '- **Crypto scanner:** openssl-scan + syft CBOM extraction (weekly)',
      '- **CVE feed:** NVD subscription, CISA KEV alerting (daily)',
      '- **SIEM rules:** classical-algorithm negotiation alerts active',
      '- **Zero-Trust enforcement:** mTLS mutual auth on Tier-1 service mesh'
    ),
  }
}

// ---------------------------------------------------------------------------
// supply-chain-matrix — mirrors SupplyChainRiskMatrix output
// ---------------------------------------------------------------------------
function supplyChainMatrix(sector: DemoSector): DemoDoc {
  const layer =
    sector === 'energy'
      ? 'OT / ICS'
      : sector === 'telecom'
        ? '5G / Network'
        : sector === 'government'
          ? 'Federal / DoD'
          : 'Enterprise'
  return {
    title: 'Supply Chain PQC Risk Matrix',
    data: md(
      `# Supply Chain PQC Risk Matrix — ${ORG[sector]}`,
      '',
      '## Summary',
      `12 products assessed across 4 supply chain layers. ${layer} layer is highest risk.`,
      '',
      '## Layer Breakdown',
      '',
      `### ${layer} Layer (4 products)`,
      '- 4 products assessed; 1 PQC-committed; 3 uncommitted',
      '',
      '### Software / OS Layer (3 products)',
      '- TLS library: ML-KEM available; OS keystore: roadmap 2025',
      '',
      '### Hardware / HSM Layer (3 products)',
      '- HSM: ML-KEM-768 + ML-DSA-65 firmware available',
      '- Smartcards: PQC in prototype (2026)',
      '',
      '### Cloud / SaaS Layer (2 products)',
      '- Cloud KMS: PQC KEK available; SaaS IdP: hybrid 2025',
      '',
      '## CBOM (6 crypto-asset classes, per NIST CSWP 39 crypto-agility guidance)',
      '- Code: 4 classical libs identified; 1 hybrid-capable',
      '- Library: openssl 3.3, libpqcrypto, bouncycastle',
      '- Application: 8 apps using classical KEM directly',
      '- Protocol: TLS 1.3 (classical), IKEv2 (classical)',
      '- System: PKI CA (classical root, 20-yr cert)',
      '',
      '## Refresh Cadence',
      '- Software: quarterly | Hardware: refresh cycle (3–7 yr) | SaaS: contract renewal'
    ),
  }
}

// ---------------------------------------------------------------------------
// contract-clause — mirrors ContractClauseGenerator output
// ---------------------------------------------------------------------------
function contractClause(sector: DemoSector): DemoDoc {
  return {
    title: 'PQC Vendor Contract Requirements',
    data: md(
      `# PQC VENDOR CONTRACT REQUIREMENTS — ${ORG[sector]}`,
      '',
      '## ARTICLE 1. POST-QUANTUM CRYPTOGRAPHIC READINESS',
      'Vendor shall provide a written PQC migration roadmap within 30 days of contract signing, targeting ML-KEM-768 and ML-DSA-65 (FIPS 203/204) support by December 2026 for Tier-1 products.',
      '',
      '## ARTICLE 2. FIPS 140-3 VALIDATION',
      'All cryptographic modules supplied under this agreement shall maintain FIPS 140-3 Level 2 (minimum) validation. PQC algorithm implementations shall be validated under ACVP by the relevant NIST FIPS 203/204/205 test vectors.',
      '',
      '## ARTICLE 3. CRYPTOGRAPHIC BILL OF MATERIALS',
      `Vendor shall supply a machine-readable CBOM (CycloneDX or SPDX format) covering all cryptographic dependencies within 60 days. CBOM shall be updated at each major release and within 14 days of any ${REG[sector]}-reportable cryptographic vulnerability.`,
      '',
      '## ARTICLE 4. CRYPTOGRAPHIC CHANGE NOTIFICATION',
      'Vendor shall provide 90 days advance notice of any change to cryptographic algorithm, key size, or protocol version in in-scope products.',
      '',
      '## ARTICLE 5. AUDIT RIGHTS',
      'Purchaser reserves the right to conduct an annual cryptographic compliance audit, including ACVP evidence review and CBOM spot-check, at Vendor premises or via secure remote access.'
    ),
  }
}

// ---------------------------------------------------------------------------
// cloud-responsibility-matrix
// ---------------------------------------------------------------------------
function cloudResponsibilityMatrix(sector: DemoSector): DemoDoc {
  return {
    title: 'Cloud PQC Responsibility Matrix',
    data: md(
      `# Cloud PQC Responsibility Matrix — ${ORG[sector]}`,
      '',
      '| Capability | Cloud Provider | Customer | Shared |',
      '| --- | --- | --- | --- |',
      '| PQC KMS (key generation) | ✓ | — | — |',
      '| TLS termination (PQC hybrid) | ✓ | — | Config |',
      '| Application-layer crypto (SDK) | — | ✓ | — |',
      '| Certificate lifecycle | Provider CA option | Customer CA option | ✓ |',
      '| CBOM ingestion & scanning | — | ✓ | Tool-dependent |',
      '| PQC compliance attestation | Provider audit scope | Customer audit scope | ✓ |',
      '',
      '*Responsibility boundaries aligned to NIST SP 800-210 cloud security guidance and NIST CSWP 39 crypto-agility guidance.*'
    ),
  }
}

// ---------------------------------------------------------------------------
// management-tools-audit
// ---------------------------------------------------------------------------
function managementToolsAudit(sector: DemoSector): DemoDoc {
  return {
    title: 'Cryptographic Management Tools Audit',
    data: md(
      `# Cryptographic Management Tools Audit — ${ORG[sector]}`,
      '',
      '| Tool category (management tools, per NIST CSWP 39) | Current tool | PQC-ready | Gap | Priority |',
      '| --- | --- | --- | --- | --- |',
      '| Crypto discovery / CBOM | syft + grype | Partial | No ML-KEM/ML-DSA detection | High |',
      '| Certificate lifecycle | Vault PKI | No | Classical CA only | High |',
      '| Key management | AWS KMS / HashiCorp | Partial | PQC KEK available; app layer classical | Medium |',
      '| Code signing pipeline | GitHub Actions + cosign | No | ECDSA P-256 hardcoded | High |',
      '| Vulnerability watch | Dependabot + NVD | Partial | No PQC CVE tagging | Medium |',
      '| HSM management | Thales CipherTrust | Yes | ML-KEM-768 firmware available | Low |',
      '',
      `*Gaps prioritised against ${REG[sector]} timeline requirements.*`
    ),
  }
}

// ---------------------------------------------------------------------------
// crypto-architecture — SVG-based tool; demo doc uses ASCII-art boundary table
// ---------------------------------------------------------------------------
function cryptoArchitecture(sector: DemoSector): DemoDoc {
  return {
    title: 'Cryptographic Architecture Diagram',
    data: md(
      `# Cryptographic Architecture — ${ORG[sector]}`,
      '',
      '## Crypto boundary summary',
      '',
      '| Zone | Protocol / algorithm | Key size | PQC status |',
      '| --- | --- | --- | --- |',
      '| Internet perimeter | TLS 1.3 (ECDHE-RSA) | P-256 / RSA-2048 | Classical — migrate first |',
      '| Internal service mesh | mTLS (ECDSA) | P-256 | Classical — wave 2 |',
      '| Data at rest | AES-256-GCM (KEK: RSA-2048) | 256 / 2048 | KEK migrate to ML-KEM |',
      '| Code signing | ECDSA P-256 | P-256 | Classical — Track B 2026 |',
      '| PKI (CA) | RSA-4096 / ECDSA | 4096 / P-256 | Hybrid root 2026 |',
      '',
      '## Migration priority',
      '1. Internet perimeter TLS KEM → ML-KEM-768 hybrid (Track A, Wave 1)',
      '2. Data-at-rest KEK → ML-KEM-768 (Track A, Wave 2)',
      '3. Code signing → ML-DSA-65 (Track B, 2026)',
      '4. Internal mesh + PKI → hybrid certs (Track B, 2026–2027)'
    ),
  }
}

// ---------------------------------------------------------------------------
// crypto-vulnerability-watch — mirrors CryptoVulnerabilityWatch output
// ---------------------------------------------------------------------------
function cryptoVulnerabilityWatch(sector: DemoSector): DemoDoc {
  return {
    title: 'Crypto Vulnerability Watch',
    data: md(
      `# Crypto Vulnerability Watch — ${ORG[sector]}`,
      '',
      '## openssl',
      '**CPE:** cpe:2.3:a:openssl:openssl:3.1.0:*',
      '**CVEs:** 3 in scope (top 3 of 8 in NVD)',
      '',
      '**CVE-2023-5363** · HIGH · CVSS 7.4 · 2023-10-24',
      'Incorrect cipher key and IV length processing. Upgrade to 3.1.4.',
      '',
      '**CVE-2024-0727** · MEDIUM · CVSS 5.9 · 2024-01-26',
      'PKCS12 parsing null-pointer dereference. Upgrade to 3.2.1.',
      '',
      '## libpqcrypto 0.0.20211031',
      '**CPE:** cpe:2.3:a:libpqcrypto:libpqcrypto:0.0.20211031:*',
      '**CVEs:** 0 critical — no CVEs in NVD at this version',
      '',
      `*NVD snapshot: current | Filtered to cryptographic libraries in ${ORG[sector]} estate.*`
    ),
  }
}

// ---------------------------------------------------------------------------
// crypto-cbom
// ---------------------------------------------------------------------------
function cryptoCbom(sector: DemoSector): DemoDoc {
  return {
    title: 'Cryptographic Bill of Materials (CBOM)',
    data: md(
      `# Cryptographic Bill of Materials — ${ORG[sector]}`,
      '',
      '| Component | Version | Algorithm | Key size | HNDL risk | PQC status |',
      '| --- | --- | --- | --- | --- | --- |',
      '| openssl | 3.1.0 | RSA, ECDHE, AES-GCM | 2048/P-256/256 | Yes | Migrate |',
      '| libp11 | 0.4.12 | RSA | 2048 | Yes | Migrate |',
      '| bouncy-castle | 1.77 | RSA, ECDSA | 2048/P-256 | Yes | Migrate |',
      '| AWS KMS SDK | 3.x | AES-256, RSA-2048 (wrap) | 256/2048 | Partial | KEK upgrade |',
      '| cosign | 2.0 | ECDSA P-256 | P-256 | No (TNFL) | Track B 2026 |',
      '| internal-tls-sidecar | 1.2.0 | TLS 1.3, ECDHE | P-256 | Yes | Wave 1 |',
      '',
      '**Total classical assets:** 14 | **PQC-ready:** 0 | **Hybrid-capable:** 2',
      '',
      `*CycloneDX CBOM v1.7 format (crypto-asset support). Generated against ${ORG[sector]} production estate.*`
    ),
  }
}

// ---------------------------------------------------------------------------
// DEMO_DOCS_BY_SECTOR — master lookup
// ---------------------------------------------------------------------------
export const DEMO_DOCS_BY_SECTOR: Record<
  DemoSector,
  Partial<Record<ExecutiveDocumentType, DemoDoc>>
> = {
  financial: {
    'crqc-scenario': crqcScenario.financial,
    'roi-model': roiModel.financial,
    'raci-matrix': raciMatrix.financial,
    'policy-draft': policyDraft('financial'),
    'board-deck': boardDeck('financial'),
    'kpi-dashboard': kpiDashboard('financial'),
    'risk-register': riskRegister('financial'),
    'risk-treatment-plan': riskTreatmentPlan('financial'),
    'migration-roadmap': migrationRoadmap('financial'),
    'stakeholder-comms': stakeholderComms('financial'),
    'hybrid-transition': hybridTransition('financial'),
    'deployment-playbook': deploymentPlaybook('financial'),
    'mti-negotiator': mtiNegotiator('financial'),
    'vendor-scorecard': vendorScorecard('financial'),
    'supply-chain-matrix': supplyChainMatrix('financial'),
    'contract-clause': contractClause('financial'),
    'cloud-responsibility-matrix': cloudResponsibilityMatrix('financial'),
    'management-tools-audit': managementToolsAudit('financial'),
    'crypto-architecture': cryptoArchitecture('financial'),
    'crypto-vulnerability-watch': cryptoVulnerabilityWatch('financial'),
    'crypto-cbom': cryptoCbom('financial'),
  },
  healthcare: {
    'crqc-scenario': crqcScenario.healthcare,
    'roi-model': roiModel.healthcare,
    'raci-matrix': raciMatrix.healthcare,
    'policy-draft': policyDraft('healthcare'),
    'board-deck': boardDeck('healthcare'),
    'kpi-dashboard': kpiDashboard('healthcare'),
    'risk-register': riskRegister('healthcare'),
    'risk-treatment-plan': riskTreatmentPlan('healthcare'),
    'migration-roadmap': migrationRoadmap('healthcare'),
    'stakeholder-comms': stakeholderComms('healthcare'),
    'hybrid-transition': hybridTransition('healthcare'),
    'deployment-playbook': deploymentPlaybook('healthcare'),
    'mti-negotiator': mtiNegotiator('healthcare'),
    'vendor-scorecard': vendorScorecard('healthcare'),
    'supply-chain-matrix': supplyChainMatrix('healthcare'),
    'contract-clause': contractClause('healthcare'),
    'cloud-responsibility-matrix': cloudResponsibilityMatrix('healthcare'),
    'management-tools-audit': managementToolsAudit('healthcare'),
    'crypto-architecture': cryptoArchitecture('healthcare'),
    'crypto-vulnerability-watch': cryptoVulnerabilityWatch('healthcare'),
    'crypto-cbom': cryptoCbom('healthcare'),
  },
  government: {
    'crqc-scenario': crqcScenario.government,
    'roi-model': roiModel.government,
    'raci-matrix': raciMatrix.government,
    'policy-draft': policyDraft('government'),
    'board-deck': boardDeck('government'),
    'kpi-dashboard': kpiDashboard('government'),
    'risk-register': riskRegister('government'),
    'risk-treatment-plan': riskTreatmentPlan('government'),
    'migration-roadmap': migrationRoadmap('government'),
    'stakeholder-comms': stakeholderComms('government'),
    'hybrid-transition': hybridTransition('government'),
    'deployment-playbook': deploymentPlaybook('government'),
    'mti-negotiator': mtiNegotiator('government'),
    'vendor-scorecard': vendorScorecard('government'),
    'supply-chain-matrix': supplyChainMatrix('government'),
    'contract-clause': contractClause('government'),
    'cloud-responsibility-matrix': cloudResponsibilityMatrix('government'),
    'management-tools-audit': managementToolsAudit('government'),
    'crypto-architecture': cryptoArchitecture('government'),
    'crypto-vulnerability-watch': cryptoVulnerabilityWatch('government'),
    'crypto-cbom': cryptoCbom('government'),
  },
  energy: {
    'crqc-scenario': crqcScenario.energy,
    'roi-model': roiModel.energy,
    'raci-matrix': raciMatrix.energy,
    'policy-draft': policyDraft('energy'),
    'board-deck': boardDeck('energy'),
    'kpi-dashboard': kpiDashboard('energy'),
    'risk-register': riskRegister('energy'),
    'risk-treatment-plan': riskTreatmentPlan('energy'),
    'migration-roadmap': migrationRoadmap('energy'),
    'stakeholder-comms': stakeholderComms('energy'),
    'hybrid-transition': hybridTransition('energy'),
    'deployment-playbook': deploymentPlaybook('energy'),
    'mti-negotiator': mtiNegotiator('energy'),
    'vendor-scorecard': vendorScorecard('energy'),
    'supply-chain-matrix': supplyChainMatrix('energy'),
    'contract-clause': contractClause('energy'),
    'cloud-responsibility-matrix': cloudResponsibilityMatrix('energy'),
    'management-tools-audit': managementToolsAudit('energy'),
    'crypto-architecture': cryptoArchitecture('energy'),
    'crypto-vulnerability-watch': cryptoVulnerabilityWatch('energy'),
    'crypto-cbom': cryptoCbom('energy'),
  },
  telecom: {
    'crqc-scenario': crqcScenario.telecom,
    'roi-model': roiModel.telecom,
    'raci-matrix': raciMatrix.telecom,
    'policy-draft': policyDraft('telecom'),
    'board-deck': boardDeck('telecom'),
    'kpi-dashboard': kpiDashboard('telecom'),
    'risk-register': riskRegister('telecom'),
    'risk-treatment-plan': riskTreatmentPlan('telecom'),
    'migration-roadmap': migrationRoadmap('telecom'),
    'stakeholder-comms': stakeholderComms('telecom'),
    'hybrid-transition': hybridTransition('telecom'),
    'deployment-playbook': deploymentPlaybook('telecom'),
    'mti-negotiator': mtiNegotiator('telecom'),
    'vendor-scorecard': vendorScorecard('telecom'),
    'supply-chain-matrix': supplyChainMatrix('telecom'),
    'contract-clause': contractClause('telecom'),
    'cloud-responsibility-matrix': cloudResponsibilityMatrix('telecom'),
    'management-tools-audit': managementToolsAudit('telecom'),
    'crypto-architecture': cryptoArchitecture('telecom'),
    'crypto-vulnerability-watch': cryptoVulnerabilityWatch('telecom'),
    'crypto-cbom': cryptoCbom('telecom'),
  },
  retail: {
    'crqc-scenario': crqcScenario.retail,
    'roi-model': roiModel.retail,
    'raci-matrix': raciMatrix.retail,
    'policy-draft': policyDraft('retail'),
    'board-deck': boardDeck('retail'),
    'kpi-dashboard': kpiDashboard('retail'),
    'risk-register': riskRegister('retail'),
    'risk-treatment-plan': riskTreatmentPlan('retail'),
    'migration-roadmap': migrationRoadmap('retail'),
    'stakeholder-comms': stakeholderComms('retail'),
    'hybrid-transition': hybridTransition('retail'),
    'deployment-playbook': deploymentPlaybook('retail'),
    'mti-negotiator': mtiNegotiator('retail'),
    'vendor-scorecard': vendorScorecard('retail'),
    'supply-chain-matrix': supplyChainMatrix('retail'),
    'contract-clause': contractClause('retail'),
    'cloud-responsibility-matrix': cloudResponsibilityMatrix('retail'),
    'management-tools-audit': managementToolsAudit('retail'),
    'crypto-architecture': cryptoArchitecture('retail'),
    'crypto-vulnerability-watch': cryptoVulnerabilityWatch('retail'),
    'crypto-cbom': cryptoCbom('retail'),
  },
  general: {
    'crqc-scenario': crqcScenario.general,
    'roi-model': roiModel.general,
    'raci-matrix': raciMatrix.general,
    'policy-draft': policyDraft('general'),
    'board-deck': boardDeck('general'),
    'kpi-dashboard': kpiDashboard('general'),
    'risk-register': riskRegister('general'),
    'risk-treatment-plan': riskTreatmentPlan('general'),
    'migration-roadmap': migrationRoadmap('general'),
    'stakeholder-comms': stakeholderComms('general'),
    'hybrid-transition': hybridTransition('general'),
    'deployment-playbook': deploymentPlaybook('general'),
    'mti-negotiator': mtiNegotiator('general'),
    'vendor-scorecard': vendorScorecard('general'),
    'supply-chain-matrix': supplyChainMatrix('general'),
    'contract-clause': contractClause('general'),
    'cloud-responsibility-matrix': cloudResponsibilityMatrix('general'),
    'management-tools-audit': managementToolsAudit('general'),
    'crypto-architecture': cryptoArchitecture('general'),
    'crypto-vulnerability-watch': cryptoVulnerabilityWatch('general'),
    'crypto-cbom': cryptoCbom('general'),
  },
}

/** Humanise an artifact type id into a Title Case label for unknown-type stubs. */
function humanizeType(type: ExecutiveDocumentType): string {
  return type
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/**
 * The demo document for an artifact type given the player's sector.
 *
 * Fallback chain:
 *   1. sector-specific authored content
 *   2. 'general' authored content
 *   3. typed stub (should never be reached once all types are authored)
 *
 * Always returns a usable DemoDoc. `simAutoRun.test.ts` asserts every demo
 * doc the trees use is non-empty.
 */
export function demoDocFor(type: ExecutiveDocumentType, sector?: string): DemoDoc {
  const s = (sector ?? 'general') as DemoSector
  const sectorDocs = DEMO_DOCS_BY_SECTOR[s] ?? DEMO_DOCS_BY_SECTOR.general
  // eslint-disable-next-line security/detect-object-injection
  const authored = sectorDocs?.[type] ?? DEMO_DOCS_BY_SECTOR.general[type]
  if (authored) return authored
  const title = humanizeType(type)
  return {
    title,
    data: `# ${title}\n\n_Placeholder — authored demo content for this type is in progress._`,
  }
}

// Legacy export for callers that don't pass sector yet (tests, cold-start).
export const DEMO_ORG = ORG.healthcare
