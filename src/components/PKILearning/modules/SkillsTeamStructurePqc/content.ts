// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the Skills & Team Structure module.
 *
 * Source: Applied Quantum PQC Migration Framework (Universal Edition 2.1),
 * "Skills & Team Structure" section (pp. 160–164) — Marin Ivezic / Applied
 * Quantum, CC BY 4.0. The FTE role table and the 1-FTE-per-500-cryptographic-
 * instances sizing heuristic are sourced as data from `@/data/roleCrosswalk.ts`
 * (ROLE_CROSSWALK, FTE_PER_CRYPTO_INSTANCES).
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'skills-team-structure',
  version: '1.0.0',
  lastReviewed: '2026-06-13',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS 206'),
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('FN-DSA-512'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      'The Skills & Team Structure module teaches leaders how to staff a PQC migration program. PQC migration requires a combination of skills that rarely coexists in one team: deep cryptographic knowledge, enterprise program management at scale, and domain-specific technical expertise (network, application, OT, cloud). The realistic approach is not to hire a complete team of PQC specialists but to build a small core of cryptographic expertise, supplement it with upskilled existing security and IT staff, and augment with external specialists for capabilities that cannot be developed internally in time.',
    coreRoles:
      'Seven core roles carry the program: Quantum-Readiness Program Manager (1.0 FTE), Cryptographic Architect (0.5–1.0), Security Engineers (PQC) (2–4), Application Security Lead (1.0), OT Security Specialist (0.5–1.0 if OT in scope), Vendor/Procurement Lead (0.5), and PMO Analyst (0.5–1.0). Each role lists required skills and a recommended source (internal upskilling vs. specialized hire). The QRPM, Cryptographic Architect, and PMO Analyst are dedicated overhead regardless of estate size.',
    teamSizing:
      'Team size depends on the cryptographic estate complexity more than on revenue or headcount. Sizing heuristic: one dedicated FTE per 500 cryptographic instances in the CBOM for the first two years (discovery, CBOM, risk scoring, pilot), dropping to one per 1,000 during production rollout as tooling matures. Below 1,000 instances, a part-time QRPM with consulting augmentation for the Cryptographic Architect is viable. Above 10,000 instances, plan a dedicated program office of 8–12 FTEs at peak.',
    buildBorrowBuy:
      'Build, borrow, or buy guidance per capability: Program management — Build (internal QRPM; borrow up to 6 months while identifying one). Cryptographic architecture — Build if possible, borrow for design. Discovery & inventory — Buy the tool, run it internally. PKI modernization — Build, augmented as needed. Vendor governance — Build (internal procurement). Strategic quantum CTI — Borrow for most organizations (specialized, scarce skill; contract quarterly assessments).',
    trainingApproach:
      'Training operates at four levels: (1) Executive education (half-day to one day) for SteerCo, board risk committee, and senior leadership; (2) PQC foundations (3–5 days) for all workstream participants, covering ML-KEM, ML-DSA, SLH-DSA, FN-DSA, hybrid deployment, CBOM, and crypto-agility; (3) Deep technical (ongoing, lab-based) for engineers and architects who configure, test, and deploy PQC; (4) Crypto Champion Program — one champion per platform/application team who liaises with the program, signs off on crypto readiness in design reviews, and shepherds PQC library upgrades.',
    cryptoChampions:
      'The Crypto Champion Program designates one champion per platform or application team (web, mobile, data, infrastructure, OT, identity). Champions attend PQC foundations training, join quarterly crypto-agility briefings, serve as liaison between the PQC program and their platform team, sign off on crypto readiness in design reviews for new systems, and shepherd PQC library upgrades within their domain. The model scales the program reach without requiring every developer to become a cryptography specialist; champions become a standing network after migration, analogous to security champion programs.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 206 (FN-DSA, draft). NSA CNSA 2.0 (algorithm suite and timelines for national security systems). CycloneDX (CBOM format the team operates and maintains).',
  },
}
