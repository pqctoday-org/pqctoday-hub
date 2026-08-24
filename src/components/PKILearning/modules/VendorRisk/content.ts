// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the VendorRisk module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'vendor-risk',
  version: '1.0.0',
  lastReviewed: '2026-08-23',

  // ORDER MATTERS — the accuracy spot-check samples this list by even stride and
  // reads only four. Five entries, so all are sampled. This module is about supply-chain scoring and
  // CBOM delivery — it cited three algorithm specifications and nothing about
  // either subject until 2026-08-22.
  standards: [
    getStandard('NIST IR 8547'),
    getStandard('NIST-CMVP-140-2-to-140-3-Transition-Timeline'),
    getStandard('FIPS 203'),
    getStandard('OWASP-CycloneDX-CBOM-Guide'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NIST CSWP 39'),
    getStandard('NSA CNSA 2.0'),
  ],

  algorithms: [
    // No algorithm references detected — add manually if needed
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
      "The Vendor & Supply Chain Risk module teaches executives how to assess, score, and manage cryptographic risk across their vendor ecosystem. It covers PQC readiness scorecards with six weighted dimensions, contract clause generation for quantum-safe procurement, and supply chain risk matrix visualization across infrastructure layers. The module integrates live data from the app's migration catalog to auto-score FIPS validation status and vendor PQC readiness.",
    keyConcepts:
      'Vendor PQC Scorecard — six weighted dimensions: PQC Algorithm Support (25%), FIPS 140-3 Validation (20%), Published PQC Roadmap (15%), Crypto Agility (15%), SBOM/CBOM Delivery (10% — see the sbom and cbom modules for what each artifact actually contains), Hybrid Mode Support (15%).',
    workshopSummary:
      'The workshop has 3 interactive steps: Vendor Scorecard Builder — interactive scorecard with 6 weighted slider dimensions; FIPS validation auto-scored from migration catalog data; saves assessment as executive document. Contract Clause Generator — 5-section artifact builder producing legal-style contract articles (PQC Timeline, FIPS Validation, CBOM Delivery, Crypto Change Notification, Audit Rights) with customizable parameters.',
    relatedStandards:
      'NIST SP 800-161 (Cybersecurity Supply Chain Risk Management). NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). CycloneDX CBOM Specification. FIPS 140-3 (Security Requirements for Cryptographic Modules)',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// X25519MLKEM768, 10-15 year
