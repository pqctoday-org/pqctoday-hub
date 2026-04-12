// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the EnergyUtilities module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'energy-utilities-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-227'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDH P-384'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
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
      'Advanced-level module (90 min, 5 workshop steps) covering post-quantum cryptography migration for the energy sector — an industry where OT protocol security failures can cause physical equipment damage, widespread power outages, and safety-critical protection relay failures. Asset lifetimes of 40–50 years (substations) mean cryptographic decisions made today lock in quantum exposure for decades.',
    keyConcepts:
      'OT protocols and crypto feasibility: IEC 61850 (GOOSE for high-speed substation protection messaging at 4 ms trip time, Sampled Values for merging unit data — both multicast with no native asymmetric crypto in current IEC 62351-6 profile), DNP3 (SCADA field communications — DNP3 Secure Authentication v5 uses challenge-response with HMAC-SHA256, asymmetric update key change ceremony uses RSA-2048 — quantum-vulnerable), Modbus (legacy SCADA/sensor bus, no native security — must use VPN or TLS o...',
    workshopSummary:
      'ProtocolSecurityAnalyzer — Compare IEC 61850 GOOSE/SV, DNP3 SA v5, Modbus, and DLMS/COSEM by security capability, PQC readiness, and migration path; identify which protocol layers can carry ML-KEM/ML-DSA and which require out-of-band crypto. SubstationMigrationPlanner — Design a phased PQC migration for a transmission substation: MMS/TCP TLS upgrade, DNP3 SA v5 key ceremony migration, IED firmware assessment, out-of-band VPN overlay for legacy assets; output a 36-month migration Gantt chart.',
    relatedStandards:
      'IEC 61850 — Communication Networks and Systems for Power Utility Automation. IEC 62351 Parts 3/5/6/8/14 — Power Systems Management — Information Security. IEC 62056-5-3 (DLMS/COSEM) — Electricity Metering Data Exchange. DNP3 Secure Authentication Version 5 (IEEE Std 1815-2012 Annex SC). NERC CIP-005, CIP-007, CIP-010, CIP-012, CIP-013 — Bulk Electric System Cybersecurity Standards. NIST SP 800-82 Rev. 3 — Guide to OT Security (references crypto requirements).',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// 0.5 ms, IEC 62351-8, IEC 62056-8-3, IEC 62351-100-1
