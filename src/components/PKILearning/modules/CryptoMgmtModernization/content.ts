// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the CryptoMgmtModernization module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'crypto-mgmt-modernization',
  version: '1.0.0',
  lastReviewed: '2026-04-21',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NSA CNSA 2.0'),
  ],

  algorithms: [
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('Ed25519'),
  ],

  deadlines: [
    {
      label: 'CA/B Forum: TLS cert validity → 200 days',
      year: 2026,
      source: 'CA/B Forum SC-081v3 (April 2025)',
    },
    {
      label: 'CA/B Forum: TLS cert validity → 100 days',
      year: 2027,
      source: 'CA/B Forum SC-081v3',
    },
    {
      label: 'CA/B Forum: TLS cert validity → 47 days',
      year: 2029,
      source: 'CA/B Forum SC-081v3',
    },
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    {
      label: 'CNSA 2.0 software exclusive',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'OMB M-23-02 annual cryptographic inventory submissions',
      year: 2035,
      source: 'OMB M-23-02',
    },
  ],

  narratives: {
    overview:
      'Cryptographic Management Modernization (CMM) teaches executives and architects how to stand up a Cryptographic Posture Management program — a continuous, iterative program spanning certificates, cryptographic libraries, application software, and key material. Distinct from crypto-agility (a technical capability) and from a CryptoCOE (an operating model), CMM is the management discipline that answers: do we know what we have, is it healthy, can we prove it, and does the investment pay off whether quantum arrives on schedule or never?',
    keyConcepts:
      'Five pillars — Inventory (unified CBOM across four asset classes), Governance (policy + ownership), Lifecycle (CLM: provisioning through retirement with automated renewal under the 47-day TLS cadence), Observability (drift alerts and SIEM integration), Assurance (audit + attestation, including FIPS 140-3 L3 validation tracking for libraries and hardware). Dual-loop iteration — a strategic annual Plan-Do-Check-Act cadence wrapping an operational continuous Discover → Classify → Score → Remediate → Attest → Reassess loop.',
    workshopSummary:
      'Five interactive steps: (1) CPM Maturity Self-Assessment scoring the organization on a 5×5×4 matrix (pillars × levels × asset classes); (2) Inventory Lifecycle Simulator walking assets through the six-stage operational loop with canonical CLM scenarios (shadow-cert discovery, 47-day renewal, intermediate-CA rotation, OCSP drift); (3) Library & Hardware CBOM Builder combining SBOM→CBOM extraction, library version/EoL tracking, and FIPS 140-3 Level 3 validation status for libraries and HSMs; (4) No-Regret ROI Builder calculating IRR under quantum-happens and quantum-never-happens scenarios using CLM automation, FIPS-drift remediation, outage avoidance, and library-CVE benefit streams; (5) Posture KPI Dashboard Designer for board-ready metrics across all five pillars.',
    relatedStandards:
      'CA/B Forum SC-081v3 (April 2025, 47-day TLS cert cadence by March 2029). NIST FIPS 140-3 Implementation Guidance (September 2025 PQC update). NIST CMVP Validated Modules and Modules-in-Process lists. NIST SP 800-140B (CMVP security policy requirements). OMB M-23-02 (US federal cryptographic inventory mandate through 2035). NSA CNSA 2.0 (National Security Systems PQC deadlines 2030/2033). ENISA Post-Quantum Cryptography Integration Study. BSI/ANSSI/NLNCSA/SNV joint statement on transitioning to PQC. OWASP CycloneDX CBOM Authoritative Guide. RFC 8555 (ACME), RFC 7030 (EST), RFC 4210 (CMP).',
  },
}
