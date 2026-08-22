// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the QKD module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'qkd',
  version: '1.0.0',
  lastReviewed: '2026-08-22',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // Repointed 2026-08-22: this declared the DEPRECATED row `NIST SP 800-108`,
    // whose superseded_by names this one. A module pointing the accuracy check at a
    // retired row is worse than pointing it nowhere — the check runs, reads a
    // superseded document, and reports success.
    getStandard('NIST-SP-800-108-R1'),
    getStandard('RFC 4253'),
    // RFC 9846 REPLACES RFC 8446 here, 2026-08-22. RFC 9846 (July 2026) obsoletes it —
    // "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446" in its header — and the library
    // row for 8446 already carried 9846 as its supersession pointer. TLS 1.3 the
    // protocol is unchanged; the live specification moved.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
  ],

  algorithms: [getAlgorithm('ML-KEM-768')],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    keyConcepts:
      'QKD vs PQC: QKD provides information-theoretic security from physics; PQC provides computational security from quantum-hard mathematical problems; QKD requires dedicated quantum channels while PQC runs on standard networks.',
    workshopSummary:
      'BB84 Protocol Simulator: Visual simulation with configurable Eve interception slider and adjustable qubit count; observe basis matching, sifted key generation, and QBER calculation. Post-Processing: Error correction, privacy amplification, and hybrid key derivation from raw QKD output. Global Deployments Explorer: Interactive database of worldwide QKD deployments including satellite and terrestrial networks with adoption trends.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, Initial Public Draft). FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA). NIST SP 800-108 (KDF in Counter Mode). ETSI QKD standards (GS QKD series). EuroQCI initiative (pan-European quantum communication infrastructure). BB84 protocol (Bennett & Brassard, 1984)',
  },
}
