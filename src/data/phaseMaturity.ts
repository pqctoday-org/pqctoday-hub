// SPDX-License-Identifier: GPL-3.0-only
/**
 * phaseMaturity — the framework's per-phase Maturity Indicators (Level 0–4),
 * transcribed verbatim from the Applied Quantum PQC Migration Framework v2.1
 * ("Maturity Indicators" table at the end of each phase chapter).
 *
 * In the simulation these are the game's levels: climbing a phase = reaching its
 * indicator. Level 2 is the framework's "done well enough to proceed" bar
 * (each phase's "Success (L2)" gate), so it is the per-phase win target.
 */
import type { PhaseId } from './frameworkPhases'
import type { ExecutiveDocumentType } from '@/services/storage/types'

export type MaturityLevelId = 0 | 1 | 2 | 3 | 4

export interface MaturityLevel {
  level: MaturityLevelId
  indicator: string
}

/** The framework's Phase-0 ladder names, reused as generic stage labels. */
export const MATURITY_LEVEL_NAMES = [
  'Unaware',
  'Aware',
  'Initiated',
  'Established',
  'Optimized',
] as const

/** The per-phase win bar — the framework's "Success (L2)" gate. */
export const PHASE_WIN_LEVEL: MaturityLevelId = 2

/**
 * Real hub artifacts that PROVE a phase level — when a Command-Center document
 * of one of these types exists, that level auto-ticks (earned for real, not
 * self-attested). Start small; extend one line per phase as tools are mapped.
 */
export const LEVEL_EVIDENCE: Partial<
  Record<PhaseId, Partial<Record<MaturityLevelId, ExecutiveDocumentType[]>>>
> = {
  p0: { 2: ['program-charter'] }, // Charter approved → Level 2
  p2: { 2: ['crypto-cbom'] }, // CycloneDX CBOM operational → Level 2
}

export const PHASE_MATURITY: Partial<Record<PhaseId, MaturityLevel[]>> = {
  p0: [
    { level: 0, indicator: 'No executive awareness of quantum risk; no budget discussion' },
    { level: 1, indicator: 'Quantum risk acknowledged; no formal program' },
    { level: 2, indicator: 'Charter approved; QRPM appointed; Year 1 budget secured' },
    {
      level: 3,
      indicator: 'Multi-year budget committed; SteerCo operational; scoping assessment complete',
    },
    {
      level: 4,
      indicator:
        'Program integrated into enterprise risk register; quantum risk reported to board quarterly alongside other strategic risks',
    },
  ],
  p1: [
    { level: 0, indicator: 'No cryptographic inventory exists; no awareness of the need' },
    {
      level: 1,
      indicator:
        'Partial manual inventory of obvious systems (web servers, VPN); CMDB-only asset register; no continuous discovery',
    },
    {
      level: 2,
      indicator:
        'Risk-driven scoping complete; automated discovery deployed on Priority A systems; ≥70% Tier-1 coverage; inventory is queryable; classical vulnerabilities being remediated; multiple asset data sources cross-referenced',
    },
    {
      level: 3,
      indicator:
        '≥90% coverage; continuous discovery in CI/CD and passive monitoring; integrated with CMDB, SBOM, BIA, and certificate management; change management integration live; crypto champions designated; alerting framework operational',
    },
    {
      level: 4,
      indicator:
        'Real-time cryptographic posture monitoring with tiered alerting; automated drift detection; coverage spans IT, OT, cloud, and third-party; discovery effectiveness metrics tracked and reported; discovery gap register trending toward zero',
    },
  ],
  p2: [
    { level: 0, indicator: 'No CBOM exists; cryptographic documentation is ad hoc or absent' },
    {
      level: 1,
      indicator: 'Partial CBOM in spreadsheet form covering known systems; no standard format',
    },
    {
      level: 2,
      indicator:
        'CycloneDX CBOM operational for Layers 1–2; queryable; SBOM linkage established for key applications',
    },
    {
      level: 3,
      indicator:
        'CBOM covers Layers 1–3; integrated into CI/CD; freshness governance enforced; change management integration live',
    },
    {
      level: 4,
      indicator:
        'CBOM is a real-time operational asset; auto-updated on deployment; Layer 4 gaps systematically managed through vendor governance; CBOM drives automated compliance reporting',
    },
  ],
  p3: [
    { level: 0, indicator: 'No quantum risk assessment exists' },
    {
      level: 1,
      indicator:
        'Informal awareness of which systems are "probably vulnerable"; no structured scoring',
    },
    {
      level: 2,
      indicator:
        'Formal risk scoring model applied to Tier-1 CBOM entries; prioritized migration backlog exists; QRA document produced',
    },
    {
      level: 3,
      indicator:
        'QRA updated quarterly; all CBOM entries scored and tiered; migration sequencing drives Phase 5 execution; legal risk dimension assessed',
    },
    {
      level: 4,
      indicator:
        'Continuous risk posture management; automated re-scoring when CBOM changes or regulatory deadlines shift; QRA integrated into enterprise risk register and audit cycle',
    },
  ],
  p4: [
    { level: 0, indicator: 'No migration plan exists' },
    {
      level: 1,
      indicator: 'Informal plan exists (spreadsheet, no governance); single-year horizon',
    },
    {
      level: 2,
      indicator:
        'Multi-year roadmap approved; Year 1 plan resourced; SteerCo operational; KPI baseline set',
    },
    {
      level: 3,
      indicator:
        'Quarterly roadmap reviews operational; dependency mapping maintained; refresh cycle alignment documented; vendor engagement tracked on dashboard',
    },
    {
      level: 4,
      indicator:
        'Roadmap is a living instrument with quarterly updates; contingency triggers defined and tested; leading indicators monitored; program transitioning from migration execution to ongoing posture management',
    },
  ],
  p5: [
    { level: 0, indicator: 'No PQC pilots planned or underway' },
    { level: 1, indicator: 'Lab testing only; no production exposure' },
    {
      level: 2,
      indicator:
        '2+ production pilots running with measured results; rollback procedures tested; validated patterns documented',
    },
    {
      level: 3,
      indicator:
        'Tier-1 internet-facing systems on hybrid/PQC; wave rollout underway for Tier-2; defense-in-depth measures (tokenization, AES-256, segmentation) deployed',
    },
    {
      level: 4,
      indicator:
        'Estate-wide hybrid/PQC deployment substantially complete; transitioning selected systems from hybrid to PQC-only; crypto-agility demonstrated via algorithm-swap drill',
    },
  ],
  p6: [
    { level: 0, indicator: 'No awareness of PQC infrastructure impact; no testing' },
    { level: 1, indicator: 'Awareness of PKI/HSM/network challenges; no concrete plans' },
    {
      level: 2,
      indicator:
        'HSMs inventoried with PQC status; PKI modernization plan drafted; initial middlebox testing underway',
    },
    {
      level: 3,
      indicator:
        'HSM upgrades in progress; PKI dual-stack operational; all production middleboxes tested; performance baselines established for Tier-1 systems',
    },
    {
      level: 4,
      indicator:
        'Infrastructure fully PQC-capable across IT estate; capacity planning validated at production scale; PKI automated with shortened lifetimes; middlebox monitoring integrated into continuous discovery',
    },
  ],
  p7: [
    {
      level: 0,
      indicator: 'No vendor engagement on PQC; assumption that "vendors will sort it out"',
    },
    { level: 1, indicator: 'Ad-hoc inquiries to a few vendors; no structured tracking' },
    {
      level: 2,
      indicator:
        'Top 10 vendors formally engaged; questionnaires sent; responses tracked; vendor criticality classification complete',
    },
    {
      level: 3,
      indicator:
        'PQC in standard procurement language; contracts include dated commitments and remedies; bridging patterns deployed for blocked systems; vendor scorecard reported to SteerCo',
    },
    {
      level: 4,
      indicator:
        'All strategic vendors PQC-committed with verified delivery; bridging patterns eliminated as vendor support matures; open-source dependency tracking operational; vendor governance is permanent BAU function',
    },
  ],
}
