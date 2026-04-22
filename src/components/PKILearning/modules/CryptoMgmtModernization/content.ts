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
  version: '1.1.0',
  lastReviewed: '2026-04-22',

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
      'Five pillars — Inventory (unified CBOM across four asset classes), Governance (policy + ownership), Lifecycle (CLM: provisioning through retirement with automated renewal under the 47-day TLS cadence), Observability (drift alerts and SIEM integration), Assurance (audit + attestation, including FIPS 140-3 L3 validation tracking for libraries and hardware, SP 800-90B Entropy Source Validation status, and CVE patch-revalidate bind management). Dual-loop iteration — a strategic annual Plan-Do-Check-Act cadence wrapping an operational continuous Discover → Classify → Score → Remediate → Attest → Reassess loop. Program Office Model — five CPM roles (Crypto PM, FIPS/CMVP Engineer, CLM Architect, Crypto Developer Champion, Supplier Risk Analyst) with RACI across the five pillars and headcount benchmarks by org size. Pre-Deployment Lab Blueprint — hardware (FIPS 140-3 L3 HSM, TLS termination appliance, network tap) and software (FIPS library build, ACVP client, cert scanner, SBOM-to-CBOM pipeline) requirements, lab isolation rules, and a five-step lab-to-prod promotion workflow with required evidence artifacts per change type.',
    workshopSummary:
      'Five interactive steps: (1) CPM Maturity Self-Assessment scoring the organization on a 5×5×4 matrix (pillars × levels × asset classes); (2) Inventory Lifecycle Simulator walking assets through the six-stage operational loop with canonical CLM scenarios (shadow-cert discovery, 47-day renewal, intermediate-CA rotation, OCSP drift); (3) Library & Hardware CBOM Builder combining SBOM→CBOM extraction, library version/EoL tracking, FIPS 140-3 Level 3 validation status, and SP 800-90B ESV status for libraries and HSMs — PQC migration is a trigger to verify entropy sources meet increased security-strength requirements; (4) No-Regret ROI Builder calculating IRR under quantum-happens and quantum-never-happens scenarios using CLM automation, FIPS-drift remediation, outage avoidance, and library-CVE benefit streams; (5) Posture KPI Dashboard Designer for board-ready metrics across all five pillars.',
    entropyCompliance:
      'A common process gap in PQC migration programs: organizations track algorithm FIPS 140-3 validation but overlook the parallel SP 800-90B Entropy Source Validation (ESV) track. ESV is a separate CMVP submission — a library or HSM can hold a FIPS 140-3 certificate without its entropy source ever being independently validated. PQC algorithms demand higher-quality randomness (ML-KEM encapsulation requires 32 bytes from an SP 800-90A/C-approved DRBG seeded by a validated source), so migration is the right moment to audit the full RNG chain: entropy source → conditioning → DRBG. Infrastructure changes — cloud migration, containerization, VM consolidation — are also ESV re-evaluation triggers because they alter the entropy pool available to the OS and can silently degrade seed quality. The CMM Assurance pillar should include an ESV status field in the CBOM for every cryptographic library and HSM, and the remediation workflow should distinguish algorithm re-validation from entropy source re-validation, as timelines and vendors differ. The SP 800-90 suite is a living document (SP 800-90A/B/C revised independently); the same CMVP change-notice subscription used for FIPS 140-3 IG updates must also track SP 800-90A/B/C revision publications — each revision can retire approved mechanisms, tighten minimum-entropy thresholds, or impose new health-test requirements, and ESV certificates bound to superseded revisions are not automatically compliant.',
    protocolDeprecation:
      'The CMM Assurance pillar must maintain a standards-watch subscription across: IETF RFC Obsoletes/Updates (e.g., RFC 8996 deprecating TLS 1.0/1.1, RFC 7465 prohibiting RC4), NIST SP 800-131A revision cycle (3DES sunset, RSA-1024 below minimum security), NSA CNSA suite announcements, CA/B Forum ballot outcomes (SHA-1 code-signing ban), ETSI TS 119 312, BSI TR-02102, and ANSSI RGS. When a deprecation notice is published, CBOM classification rules must be updated to flag the newly prohibited primitive, and the operational loop must trigger discovery scans for affected endpoints, library configs, TLS termination points, SSH server policies, IKEv2 proposals, and code-signing pipelines — each with separate ownership and change-management tracks. The Observability pillar closes the loop: continuous protocol-version and cipher-suite scanning ensures deprecated primitives do not re-appear after infrastructure refreshes.',
    relatedStandards:
      'CA/B Forum SC-081v3 (April 2025, 47-day TLS cert cadence by March 2029). NIST FIPS 140-3 Implementation Guidance (September 2025 PQC update). NIST CMVP Validated Modules and Modules-in-Process lists. NIST SP 800-140B (CMVP security policy requirements). NIST SP 800-90B (Entropy Source Validation — ESV track). NIST SP 800-90A/C (DRBG and RBG construction standards). NIST SP 800-131A Rev 2 (algorithm transition, 3DES/RSA-1024 sunset). RFC 8996 (TLS 1.0/1.1 deprecation). RFC 7465 (RC4 prohibition). ETSI TS 119 312. BSI TR-02102. ANSSI RGS. OMB M-23-02 (US federal cryptographic inventory mandate through 2035). NSA CNSA 2.0 (National Security Systems PQC deadlines 2030/2033). ENISA Post-Quantum Cryptography Integration Study. OWASP CycloneDX CBOM Authoritative Guide. RFC 8555 (ACME), RFC 7030 (EST), RFC 4210 (CMP).',
  },
}
