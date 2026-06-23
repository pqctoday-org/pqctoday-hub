// SPDX-License-Identifier: GPL-3.0-only
/**
 * Demo content for the simulation auto-run (live guided playthrough + headless
 * validation walk). Each entry is the REAL document body the director records via
 * `addExecutiveDocument` — producing a genuine `ExecutiveDocument` of that type,
 * which is exactly what completes an `activity` step (completion is keyed by
 * artifact TYPE, not by which tool produced it).
 *
 * This is NOT the AI-delegation shortcut (which marks a step done with NO
 * document): the auto-run writes a real, typed artifact through the same store
 * action a tool's Save calls. The only thing not exercised is the tool's own
 * form→markdown builder (covered by that tool's own tests).
 *
 * p0's activity types are authored richly here; every other type falls back to a
 * real, type-named stub so the full walk still completes a genuine run. Enrich the
 * remaining types incrementally — `simAutoRun.test.ts` asserts every demo doc the
 * trees use is non-empty.
 */
import type { ExecutiveDocumentType } from '@/services/storage/types'

export interface DemoDoc {
  title: string
  /** Markdown body stored as the `ExecutiveDocument.data`. */
  data: string
}

/** The fictional organisation every demo artifact describes (kept consistent so
 *  the generated documents read like one coherent program). */
export const DEMO_ORG = 'Meridian Health — mid-size healthcare provider (Germany)'

const md = (...lines: string[]): string => lines.join('\n')

/** Richly-authored demo content. p0 first; extend per phase. */
export const DEMO_DOCS: Partial<Record<ExecutiveDocumentType, DemoDoc>> = {
  'crqc-scenario': {
    title: 'CRQC Exposure Scenario — HNDL / TNFL',
    data: md(
      `# CRQC Exposure Scenario — ${DEMO_ORG}`,
      '',
      '## Harvest-now, decrypt-later (HNDL)',
      '- Patient records carry a ~40-year confidentiality horizon, today protected by RSA-2048 / ECDHE.',
      '- Assume capture today; CRQC availability modelled 2030–2034 — the exposure window opens well inside the retention horizon.',
      '',
      '## Threaten-now, forge-later (TNFL)',
      '- Long-lived firmware and code-signing keys (10–15 yr) currently use ECDSA P-256.',
      '',
      '## Mosca inequality',
      '- X (secrecy) ≈ 40y, Y (migration) ≈ 6y, Z (CRQC) ≈ 6–10y → X + Y > Z. Begin migration now.'
    ),
  },
  'roi-model': {
    title: 'Multi-Year Migration Budget & ROI',
    data: md(
      `# Migration Budget & ROI — ${DEMO_ORG}`,
      '',
      '| Driver | 3-yr cost avoided |',
      '| --- | --- |',
      '| Breach of harvested PII (expected value) | €18.4M |',
      '| GDPR / NIS2 non-compliance penalty exposure | €9.1M |',
      '| Emergency (unplanned) migration premium | €6.2M |',
      '',
      'Planned program cost (phased, refresh-aligned): €7.8M over 4 years → net positive in year 2.'
    ),
  },
  'raci-matrix': {
    title: 'PQC Program RACI',
    data: md(
      `# PQC Program RACI — ${DEMO_ORG}`,
      '',
      '| Activity | Responsible | Accountable | Consulted | Informed |',
      '| --- | --- | --- | --- | --- |',
      '| Cryptographic inventory | Platform Eng | QRPM | CISO | SteerCo |',
      '| Risk prioritisation | Security Risk | CISO | CRO | Board |',
      '| Vendor engagement | Procurement | QRPM | Legal | Business units |'
    ),
  },
  'policy-draft': {
    title: 'Cryptography Policy (Draft)',
    data: md(
      `# Cryptography Policy — ${DEMO_ORG}`,
      '',
      '1. **Approved algorithms** — ML-KEM-768 and ML-DSA-65 for new systems; hybrid (X25519+ML-KEM) during transition.',
      '2. **Prohibited** — new deployments of RSA < 3072 and non-hybrid ECDHE for data with a >10-yr horizon.',
      '3. **Crypto-agility** — all new services must externalise algorithm choice behind a provider interface.',
      '4. **Exceptions** — time-boxed, risk-accepted by the CISO, logged in the exception register.'
    ),
  },
  'program-charter': {
    title: 'PQC Program Charter',
    data: md(
      `# Post-Quantum Migration Program Charter — ${DEMO_ORG}`,
      '',
      '- **Sponsor:** Chief Information Security Officer',
      '- **QRPM (program lead):** Head of Cryptographic Engineering',
      '- **Purpose:** Migrate all cryptography to NIST PQC standards ahead of the CRQC horizon.',
      '- **Scope:** All systems handling patient data, signing keys, and external interfaces.',
      '- **Cadence:** Monthly SteerCo; quarterly board readout.',
      '- **Success criteria:** 100% Tier-1 inventory, machine-verifiable CBOM, gated wave migration.'
    ),
  },
  'board-deck': {
    title: 'Board Mandate Pitch',
    data: md(
      `# Board Pitch — Securing ${DEMO_ORG} Against the Quantum Threat`,
      '',
      '1. The threat is dated: harvested patient data is exposed the day a CRQC arrives.',
      '2. The deadline is binding: BSI / EU timelines require demonstrable progress by 2027.',
      '3. The ask: a 4-year, €7.8M phased mandate aligned to existing refresh cycles.',
      '4. The cost of waiting: an unplanned migration runs ~2× and risks a notifiable breach.'
    ),
  },
  'kpi-dashboard': {
    title: 'Board KPI Pack',
    data: md(
      `# PQC Board KPI Pack — ${DEMO_ORG}`,
      '',
      '| KPI | Baseline | Target (Y1) |',
      '| --- | --- | --- |',
      '| PQC coverage of Tier-1 systems | 0% | 25% |',
      '| Cryptographic inventory completeness | 15% | 70% |',
      '| Trust (cert/HSM PQC-ready) | 5% | 30% |',
      '| Vendors with a PQC roadmap | 20% | 50% |',
      '| Crypto-agility (abstracted services) | 10% | 40% |'
    ),
  },
  'initial-scoping': {
    title: 'Initial Scoping & Asset Assessment',
    data: md(
      `# Initial Scoping Assessment — ${DEMO_ORG}`,
      '',
      'Rapid 3-week scope of the top 20 critical systems:',
      '- 12 systems use TLS with classical KEX; 6 rely on long-lived signing keys.',
      '- Data sensitivity: 9 systems hold records with a >20-yr confidentiality horizon.',
      '- 7 timeline-constraining vendors identified (EHR, HSM, identity, imaging).'
    ),
  },
}

/** Humanise an artifact type id into a Title Case label for fallbacks. */
function humanizeType(type: ExecutiveDocumentType): string {
  return type
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/**
 * The demo document for an artifact type. Returns authored content where present,
 * otherwise a real (non-empty) type-named stub so the full walk still produces a
 * genuine document and the run completes. Always returns a usable DemoDoc.
 */
export function demoDocFor(type: ExecutiveDocumentType): DemoDoc {
  // eslint-disable-next-line security/detect-object-injection
  const authored = DEMO_DOCS[type]
  if (authored) return authored
  const title = humanizeType(type)
  return {
    title,
    data: md(
      `# ${title}`,
      '',
      `Auto-run demo artifact for ${DEMO_ORG}.`,
      '',
      '_Placeholder body — awaiting authored demo content for this tool._'
    ),
  }
}
