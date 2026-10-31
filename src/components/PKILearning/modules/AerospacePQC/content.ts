// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the AerospacePQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'

export const content: ModuleContent = {
  moduleId: 'aerospace-pqc',
  version: '1.0.2',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-10-31',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('664P7-1-Aircraft-Data-Network-Part-7-Avionics-Full-Duplex-Sw'), // ARINC 664
    getStandard('740-17-Encryption-commodities-software-and-technology-ENC'), // 15 CFR 740.17
    getStandard('ARINC-429-Cyber-vulnerabilities-and-Voltage-Data-in-a-Hardwa'), // ARINC 429 bus rates
    getStandard('GR740-Radiation-Summary'), // 300 krad, 250 MHz
    getStandard('EASA-Easy-Access-Rules-AMC-20'), // EASA AMC 20-42 (ED-202A, ED-203A, ED-204)
    getStandard('SAE-ARINC-835-2-Loadable-Software-Parts-Digital-Signatures'), // ARINC 835-2
    getStandard('DLR-CEAS-Agile-Post-Quantum-Secure-Cryptography-in-Avionics'), // CEAS Aeronaut. J.
    getStandard('IACR-2024-046-Aviation-Quantum-Secure'), // CPDLC research proposal
    getStandard('GSMA-PQ-07-Post-Quantum-Cryptography-for-Non-Terrestrial-Net'), // GSMA PQ.07
    getStandard('NSA CNSA 2.0 FAQ'), // CNSA 2.0 FAQ v2.2: NSS dates, NIAP/CMVP
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // NSA CNSA 2.0 FAQ v2.2, for satellite links that are part of a National Security System
    {
      label: 'CNSA 2.0 algorithms required in all new NSS acquisitions',
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0',
    },
    {
      label:
        'NSS equipment and services that cannot support CNSA 2.0 phased out, unless an exception is granted',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'CNSA 2.0 algorithms mandated for use in NSS, unless otherwise noted',
      year: CNSA_2_0.networkingExclusive,
      source: 'CNSA 2.0',
    },
  ],

  narratives: {
    overview:
      'Advanced-level module (120 min, 6 workshop steps) covering post-quantum cryptography migration for the aerospace and space industries — environments with extreme bandwidth constraints, multi-decade asset lifetimes, re-certification requirements, and export-control implications for cryptographic algorithm changes.',
    keyConcepts:
      'Avionics protocols and crypto constraints: ARINC 429 (12–14.5 kbit/s low speed or 100 kbit/s high speed, late-1970s legacy, 32-bit/4-byte data word — PQC signatures not practical on a 32-bit word without fragmentation), ARINC 664/AFDX (100 Mbps Ethernet, ML-DSA overhead manageable with proper framing), MIL-STD-1553 (1 Mbps, strict deterministic latency, real-time command/response), EFB (Electronic Flight Bag) TLS connections, ACARS (very limited bandwidth, 2400 bps VHF — PQC handshake infeasible).',
    workshopSummary:
      'AvionicsProtocolAnalyzer — Compare ARINC 429, ARINC 664/AFDX, MIL-STD-1553, ACARS, and EFB by bandwidth, latency budget, message size limit, and PQC feasibility; visualize where each algorithm fits or fails. SatelliteLinkBudgetCalculator — Compute PQC handshake overhead as percentage of link budget across LEO/MEO/GEO/HEO orbits; model key refresh intervals vs pass duration for LEO.',
    relatedStandards:
      'RTCA DO-178C — Software Considerations in Airborne Systems and Equipment Certification. RTCA DO-254 — Design Assurance Guidance for Airborne Electronic Hardware. RTCA DO-326A — Airworthiness Security Process Specification. EUROCAE ED-202A — Airworthiness Security Process Specification. EUROCAE ED-203A / RTCA DO-356 — Airworthiness Security Methods and Considerations. EUROCAE ED-204 / RTCA DO-355 — Information Security Guidance for Continuing Airworthiness. ARINC 835-2 — Guidance for Security of Loadable Software Parts Using Digital Signatures (information report, December 2025). ARINC 429 — Mark 33 Digital Information Transfer System. ARINC 664 / AFDX — Aircraft Data Network (Avionics Full-Duplex Switched Ethernet).',
  },
}
