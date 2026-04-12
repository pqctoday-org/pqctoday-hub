// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the AerospacePQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'aerospace-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 203'), getStandard('FIPS 204'), getStandard('FIPS 205')],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'Advanced-level module (120 min, 6 workshop steps) covering post-quantum cryptography migration for the aerospace and space industries — environments with extreme bandwidth constraints, multi-decade asset lifetimes, mandatory re-certification requirements, and export-control implications for cryptographic algorithm changes.',
    keyConcepts:
      'Avionics protocols and crypto constraints: ARINC 429 (12.5 Kbps, 1960s legacy, 32-bit/4-byte data word — PQC signatures physically impossible on-wire), ARINC 664/AFDX (100 Mbps Ethernet, ML-DSA overhead manageable with proper framing), MIL-STD-1553 (1 Mbps, strict deterministic latency, real-time command/response), EFB (Electronic Flight Bag) TLS connections, ACARS (very limited bandwidth, 2400 bps VHF — PQC handshake infeasible).',
    workshopSummary:
      'AvionicsProtocolAnalyzer — Compare ARINC 429, ARINC 664/AFDX, MIL-STD-1553, ACARS, and EFB by bandwidth, latency budget, message size limit, and PQC feasibility; visualize where each algorithm fits or fails. SatelliteLinkBudgetCalculator — Compute PQC handshake overhead as percentage of link budget across LEO/MEO/GEO/HEO orbits; model key refresh intervals vs pass duration for LEO.',
    relatedStandards:
      'RTCA DO-178C — Software Considerations in Airborne Systems and Equipment Certification. RTCA DO-254 — Design Assurance Guidance for Airborne Electronic Hardware. RTCA DO-326A — Airworthiness Security Process Specification. EUROCAE ED-202A — Airworthiness Security Methods and Considerations. ARINC 429 — Mark 33 Digital Information Transfer System. ARINC 664 / AFDX — Aircraft Data Network (Avionics Full-Duplex Switched Ethernet).',
  },
}
