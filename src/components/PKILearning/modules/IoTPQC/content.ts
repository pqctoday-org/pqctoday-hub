// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the IoT & Embedded Device PQC module (LM-074).
 * Rewritten 2026-10-01 for the IoT/OT split: OT, rail, V2X and secure-boot
 * references moved with their sections; every id below exists in the latest
 * library CSV (library_10012026_r63.csv) as a reference_id.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'iot-pqc',
  version: '2.0.0',
  lastReviewed: '2026-10-01',
  lastEdited: '2026-10-01',

  standards: [
    // The yardstick first: RFC 7228 defines Classes 0-2 and the 7228bis draft
    // adds Classes 3-4 and the link-layer size classes every fit claim uses.
    getStandard('RFC 7228'),
    getStandard('draft-ietf-iotops-7228bis'),
    // Algorithms
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('Falcon-Spec-v12'),
    getStandard('NIST SP 800-208'),
    getStandard('RFC 8554'),
    getStandard('RFC 8391'),
    getStandard('NIST-SP-800-232'),
    getStandard('NSA CNSA 2.0'),
    // Firmware and update signing
    getStandard('RFC 9019'),
    getStandard('RFC-9124'),
    getStandard('draft-ietf-suit-manifest'),
    getStandard('RFC 8778'),
    getStandard('RFC-9964'),
    // Constrained protocols
    getStandard('RFC-7252'),
    getStandard('RFC 9147'),
    getStandard('RFC-7925'),
    getStandard('draft-ietf-uta-tls13-iot-profile'),
    getStandard('RFC 9528'),
    getStandard('RFC-8613'),
    getStandard('draft-ietf-lake-pqsuites'),
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    getStandard('Matter-1-6-Core-Specification'),
    getStandard('Bluetooth-Core-6.0'),
    getStandard('LoRaWAN-Specification-v1-1'),
    // Certificates and identity
    getStandard('RFC 5280'),
    getStandard('RFC 8879'),
    getStandard('RFC 7250'),
    getStandard('draft-ietf-cose-cbor-encoded-cert'),
    getStandard('draft-ietf-plants-merkle-tree-certs'),
    getStandard('NIST-SP-1800-36B'),
    getStandard('FIDO-FDO-v1.1-PS'),
    getStandard('RFC-9148'),
    // Hardware
    getStandard('TCG-TPM-PQC-Spec-2025'),
    getStandard('PSA-Certified-Security-Model-v1-1'),
    getStandard('PSA-Certified-Level-2-PP-SESIP-v2-0'),
    getStandard('EN-17927-2023'),
    // Regulations
    getStandard('EU-CRA-REG-2024-2847'),
    getStandard('ETSI-EN-303645'),
    getStandard('CDR-EU-2022-30-RED-Cybersecurity'),
    getStandard('CID-EU-2025-138-EN-18031'),
    getStandard('EN-18031-1-2024'),
    getStandard('EN-18031-3-2024'),
    getStandard('US-FCC-24-26-Cyber-Trust-Mark'),
    getStandard('UK-PSTI-Regs-2023-1007'),
    getStandard('NIST-IR-8259'),
    getStandard('NIST-IR-8259A'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('X25519'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('FrodoKEM-640'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('LMS-SHA256 (H20/W8)'),
    getAlgorithm('XMSS-SHA2_20'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software/firmware signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    {
      label: 'CNSA 2.0 software/firmware signing exclusive',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
    { label: 'EU CRA vulnerability and incident reporting applies', year: 2026, source: 'EU CRA' },
    { label: 'EU CRA essential requirements apply', year: 2027, source: 'EU CRA' },
  ],

  narratives: {
    hybridKem: 'X25519MLKEM768',
    relatedStandards:
      'FIPS 206 (FN-DSA) is not yet published; this module cites the Falcon v1.2 specification for FN-DSA-512 sizes and labels it pre-standard. NIST IR 8259 was withdrawn on 2026-04-20 in favour of NIST IR 8259r1; NIST IR 8259A remains the device-capability baseline.',
  },
}
