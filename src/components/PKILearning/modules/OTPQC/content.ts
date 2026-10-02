// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the OT & Industrial Control Systems PQC module
 * (ot-pqc, LM-075). Rebuilt 2026-10-01 in the IoT/OT split from the old
 * Energy & Utilities module plus the OT half of the old IoT/OT module.
 *
 * Every getStandard() id below exists verbatim (reference_id) in the latest
 * library CSV of this worktree (library_10012026_r63.csv).
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'ot-pqc',
  version: '2.0.0',
  // No lastReviewed yet — this split module has not had a recorded review;
  // record_module_review.py sets it once a person reviews the content.
  lastEdited: '2026-10-02',

  standards: [
    // PQC algorithms and stateful hash-based signatures
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('NIST SP 800-208'),
    getStandard('RFC 8554'),
    getStandard('RFC 8391'),
    getStandard('NSA CNSA 2.0'),
    // Symmetric primitives exercised by the KAT panels
    getStandard('FIPS-198-1'),
    getStandard('RFC 3394'),
    // OT security frameworks and guidance
    getStandard('IEC 62443'),
    getStandard('IEC-62443-4-2-2019-Security-for-industrial-automation-and-co'),
    getStandard('NIST SP 800-82 Rev. 3'),
    getStandard('US-CISA-PQC-OT-2024'),
    getStandard('NIS2-DIRECTIVE-2022-2555'),
    getStandard('EU-NIS-CG-Roadmap-v1.1'),
    // NERC CIP and TSA
    getStandard('NERC-CIP-005-7'),
    getStandard('NERC-CIP-010-4'),
    getStandard('NERC-CIP-012-2'),
    getStandard('TSA-SD-PIPELINE-2021-02G'),
    // Energy protocols
    getStandard('IEC-62351-6-2020-Power-systems-management-and-associated-inf'),
    getStandard('RFC-8052'),
    getStandard('PNNL-29313-RADIANCE'),
    getStandard('SAND2022-1118'),
    getStandard('IEC-62056-5-3-2023-Electricity-metering-data-exchange-The-DL'),
    getStandard('IEEE-Standard-for-Smart-Energy-Profile-Application-Protocol'),
    // Industrial and building protocols
    getStandard('OPC-10000-2'),
    getStandard('OPC-10000-7'),
    getStandard('ODVA-PUB00319-CIP-Security'),
    getStandard('PI-PROFINET-Security-Whitepaper-V105-2019'),
    getStandard('ASHRAE-135-2016-Addendum-bj'),
    getStandard('ASHRAE-BACnet-SC-Whitepaper-2019'),
    // Timing and safety (GOOSE TT6 / SV rates / PTP Annex P / IEC 61511)
    getStandard('Torres-ICREPQ-2024-341'),
    getStandard('Chen-Sensors-2020-20-7345'),
    getStandard('Alghamdi-Schukat-Cybersecurity-2021-4-12'),
    getStandard('Derbyshire-IChemE-Hazards26-2016'),
    getStandard('HSE-ECI-Functional-Safety'),
    // Sectors: rail, water, hydro
    getStandard('UNISIG-SUBSET-137-ERTMS-ETCS-On-line-Key-Management-FFFIS'),
    getStandard('ETSI-TS-103-764-Rail-Telecommunications-RT-FRMCS-System-Arch'),
    getStandard('49-CFR-Part-236-Subpart-I-Positive-Train-Control-Systems'),
    getStandard('EPA-America-s-Water-Infrastructure-Act-AWIA-Section-2013'),
    getStandard('EPA-Cybersecurity-for-the-Water-Sector'),
    getStandard('FERC-Security-Program-for-Hydropower-Projects-Division-of-Da'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('LMS-SHA256 (H20/W8)'),
    getAlgorithm('XMSS-SHA2_20'),
    getAlgorithm('X25519'),
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDH P-384'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('RSA-2048'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0: prefer PQC for software/firmware signing',
      year: CNSA_2_0.softwarePreferred,
      source: 'NSA CNSA 2.0',
    },
    {
      label: 'CNSA 2.0: software/firmware signing and networking equipment exclusive',
      year: CNSA_2_0.softwareExclusive,
      source: 'NSA CNSA 2.0',
    },
    {
      label: 'CNSA 2.0: operating systems exclusive',
      year: CNSA_2_0.networkingExclusive,
      source: 'NSA CNSA 2.0',
    },
    {
      label: 'CNSA 2.0: all NSS exclusive',
      year: CNSA_2_0.fullEnforcement,
      source: 'NSA CNSA 2.0',
    },
    { label: 'NERC CIP-012-2 effective (1 July)', year: 2026, source: 'NERC-CIP-012-2' },
    {
      label: 'EU coordinated PQC roadmap: high-risk use cases',
      year: 2030,
      source: 'EU-NIS-CG-Roadmap-v1.1',
    },
  ],

  narratives: {
    overview:
      'Advanced module (90 min, 9 learn sections, 6 workshop steps) on PQC for operational technology across energy, water, rail, manufacturing and building automation. In OT, safety and availability come first, and the main quantum threat is authenticity — forged commands, firmware and project files — rather than harvest-now-decrypt-later, which matters mostly at remote-access and inter-site boundaries. Assets last 20–50 years and crypto changes can trigger safety recertification.',
    keyConcepts:
      'Purdue levels mapped to IEC 62443 zones and conduits (SL-T / SL-C / SL-A; SR/CR 4.3 have no PQC wording). OT protocols mostly protect real-time messages with symmetric crypto: IEC 62351-6 HMAC/GMAC for GOOSE and SV with GDOI group keys (IEC 62351-9, RFC 8052); DNP3 SAv5 HMAC challenge-response with pre-shared update keys and a symmetric default method for remote update-key change. Public-key exposure sits in TLS (IEC 62351-3, OPC UA RSA/ECC policies, CIP Security, Modbus/TCP Security, BACnet/SC ECC-only), certificates and firmware signing. GOOSE type 1A trip in TT6 (3 ms or less); SV at 4,000 / 4,800 / 14,400 samples/s; PQC stays out of the trip path. IEC 61511 Ed.2 clause 8.2.4 makes a SIS security risk assessment mandatory. PTP security is IEEE 1588-2019 Annex P.',
    workshopSummary:
      'Protocol Analyzer (14 OT protocols tagged forgery / HNDL / symmetric, with HMAC-SHA-256 and AES key wrap KATs); Zone & Conduit Planner (forgery and HNDL scored separately per IEC 62443 zone); Substation Planner (energy worked example); Safety & Consequence Scorer (eight scenarios across five sectors, IEC 61511 safety-layer framing); Sector Roadmap (sector, jurisdiction, site count and CRQC planning year drive the plan); Firmware & Project Signing Lab (LMS/HSS vs ML-DSA bytes, key lifetime and state management, with an ML-DSA ACVP KAT).',
    relatedStandards:
      'IEC 62443 (incl. 62443-4-2), NIST SP 800-82 Rev. 3, CISA PQC considerations for OT, NIS2 Art. 21(2)(h) and the EU coordinated PQC roadmap, NERC CIP-005-7 / CIP-010-4 / CIP-012-2, TSA SD Pipeline-2021-02G, NSA CNSA 2.0, NIST SP 800-208 / RFC 8554, IEC 62351-6, RFC 8052, OPC 10000-2/-7, ODVA CIP Security, PROFINET security classes, ASHRAE 135 Addendum bj (BACnet/SC), UNISIG SUBSET-137.',
  },
}
