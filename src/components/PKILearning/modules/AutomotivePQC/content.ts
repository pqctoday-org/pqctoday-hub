// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the AutomotivePQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'automotive-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-88'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('X25519'),
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
      'Advanced-level module (120 min, 6 workshop steps) covering post-quantum cryptography migration for the automotive industry — an ecosystem with stringent functional safety requirements (ISO 26262), 15-year vehicle lifetimes that exceed the projected quantum threat window, complex in-vehicle network topologies, and a global OTA update infrastructure that is itself a primary attack surface.',
    keyConcepts:
      'Vehicle electrical architecture evolution: Domain-based architecture (separate ECUs per domain: powertrain, chassis, ADAS, body, infotainment, connectivity, each with domain controller) vs. zonal architecture (physical zones with high-performance central compute nodes — HPCs — aggregating control from multiple domains). ADAS zone is the most security-critical domain in both architectures; zonal HPCs introduce new PQC upgrade points at zone boundaries.',
    workshopSummary:
      'VehicleArchitectureMapper — Compare domain-based vs. zonal architectures; identify crypto upgrade points at domain controllers, zone HPCs, and gateway ECUs; map PQC feasibility to each internal bus type. SensorDataIntegritySimulator — Configure signing strategies per sensor type (LiDAR, camera, radar, fusion); calculate bandwidth overhead at operating frequency; evaluate HMAC vs. ML-DSA tradeoffs for real-time data streams.',
    relatedStandards:
      'ISO 26262 — Functional Safety for Road Vehicles (ASIL A–D classification). ISO/SAE 21434:2021 — Road Vehicles Cybersecurity Engineering. ISO 21448 (SOTIF) — Safety of the Intended Functionality. UNECE WP.29 Regulation 155 — Cybersecurity Management System (CSMS). UNECE WP.29 Regulation 156 — Software Update Management System (SUMS). AUTOSAR SecOC — Secure Onboard Communication specification. CCC Digital Key 3.0 — Car Connectivity Consortium specification.',
  },
}
