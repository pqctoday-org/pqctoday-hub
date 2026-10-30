// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the SoftwareSupplyChainPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'software-supply-chain-pqc',
  version: '1.0.0',
  // lastReviewed is left unset: it is written together with the module's review record.
  lastEdited: '2026-10-30',

  standards: [
    getStandard('NIST SP 800-218'),
    getStandard('NIST-SP-800-204D'),
    getStandard('Sigstore-Algorithm-Registry'),
    getStandard('CABF-Code-Signing-BR-v3-11'),
    getStandard('draft-ietf-suit-manifest'),
    getStandard('UEFI-SPEC-2.10-SecureBoot'),
    getStandard('RFC 8778'),
    getStandard('RFC-9964'),
    getStandard('SLH-DSA-for-JOSE-and-COSE'),
    getStandard('RFC 9708'),
    getStandard('RFC 9814'),
    getStandard('RFC 9882'),
    getStandard('RFC 9881'),
    getStandard('RFC-9909'),
    getStandard('RFC 9802'),
    getStandard('RFC 9980'),
    getStandard('RFC 9580'),
    getStandard('ETSI-TS-119-312-V2-1-1-Electronic-Signatures-and-Trust-Infra'),
    getStandard('Uptane-Standard-2-1-0'),
    getStandard('TUF-Specification-v1-0-37'),
    getStandard('NIST-SP-800-193'),
    getStandard('RFC-9124'),
    getStandard('SLSA-v1-2-Build-Track-Basics'),
    getStandard('SLSA-v1-2-Build-Provenance'),
    getStandard('SLSA-v1-2-Build-Verifying-Artifacts'),
    getStandard('in-toto-Attestation-Statement-v1'),
    getStandard('2026-Minimum-Elements-for-a-Software-Bill-of-Materials-SBOM'),
    getStandard('RFC 9019'),
    getStandard('draft-ietf-lamps-pq-composite-sigs-19'),
    getStandard('RFC-9955-Hybrid-Signature-Spectrums'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-208'),
    getStandard('RFC 8554'),
    getStandard('RFC 8391'),
    getStandard('FIPS-140-3-STANDARD'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('LMS-SHA256 (H20/W8)'),
  ],

  deadlines: [
    // None. The documents read in this module state no deadline of their own for the links
    // it covers; the CNSA 2.0 timeline is taught in the Code Signing module.
  ],

  narratives: {
    overview:
      'Intermediate module on the signature links of a software supply chain. It reads the documents that govern them: the Sigstore algorithm registry, the CA/Browser Forum code signing requirements v3.11, the UEFI Specification Release 2.11, the SUIT manifest draft, the RFCs that carry ML-DSA, SLH-DSA and HSS/LMS in COSE, CMS and X.509, RFC 9980 for OpenPGP, ETSI TS 119 312, the TUF and Uptane update frameworks, the SLSA v1.2 Build pages and the in-toto Statement, and RFC 9019 for bootloaders that cannot change.',
    keyConcepts:
      'Each link is read from its own document and labelled by what that document says: specified in an RFC, a draft, experimental, a requirement, recommended, or silent. In the held editions the Sigstore algorithm registry marks ML-DSA as experimental, and the CA/Browser Forum code signing requirements v3.11 and the UEFI Specification Release 2.11 contain no post-quantum term. TUF and Uptane spread trust across roles that need a threshold of signatures. SLSA v1.2 and the in-toto Statement describe provenance and attestations but name no signature algorithm.',
    workshopSummary:
      'Roles and Thresholds: set the keys and thresholds of TUF roles or the Uptane repositories and see which roles an attacker can sign for. Provenance Chain Check: pick an algorithm and an encoding and see which documents specify it, and which verification checks the SLSA page lists. Transition Planner: choose a verifier, a transition option and an algorithm, and see raw public key and signature sizes from the algorithm registry.',
    relatedStandards:
      'RFC 9881, RFC 9882 and RFC 9964 specify ML-DSA in X.509, CMS and JOSE/COSE; RFC 9909 and RFC 9814 specify SLH-DSA in X.509 and CMS; RFC 9708 and RFC 8778 specify HSS/LMS in CMS and COSE, and RFC 9802 specifies HSS, XMSS and XMSS^MT in X.509; the COSE document for SLH-DSA is an Internet-Draft. FIPS 204 defines ML-DSA and FIPS 205 defines SLH-DSA.',
  },
}
