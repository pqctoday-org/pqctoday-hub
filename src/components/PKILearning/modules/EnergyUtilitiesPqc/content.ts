// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the EnergyUtilitiesPqc module (LM-082).
 * New module: do not set lastReviewed until an editorial review entry exists in revisions.jsonl.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { EO_14412, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'energy-utilities-pqc',
  version: '1.0.0',
  lastEdited: '2026-11-18',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-208'),
    getStandard('NIST IR 8547'),
    getStandard('NIST SP 800-82 Rev. 3'),
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('RFC 9370'),
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    getStandard('RFC-10024'),
    getStandard('RFC-8052'),
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    getStandard('OMB-M-26-15'),
    getStandard('EU-NIS-CG-Roadmap-v1.1'),
    getStandard('NIS2-DIRECTIVE-2022-2555'),
    getStandard('IEC 62443'),
    getStandard('IEC-62443-4-2-2019-Security-for-industrial-automation-and-co'),
    getStandard('IEC-62351-6-2020-Power-systems-management-and-associated-inf'),
    getStandard('IEC-62056-5-3-2023-Electricity-metering-data-exchange-The-DL'),
    getStandard('NERC-CIP-005-7'),
    getStandard('NERC-CIP-007-6'),
    getStandard('NERC-CIP-010-4'),
    getStandard('NERC-CIP-011-3'),
    getStandard('NERC-CIP-012-2'),
    getStandard('NERC-CIP-013-2'),
    getStandard('Fries-ITU-T-X509-Day-PQC-Transition-IEC-62351'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('LMS-SHA256 (H20/W8)'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('RSA-2048'),
  ],

  deadlines: [
    {
      label: 'FIPS 140-2 moved to Historical status; new acquisitions require FIPS 140-3',
      year: 2026,
      source: 'NIST CMVP (Sept 2026)',
    },
    {
      label: 'EU PQC Roadmap v1.1 target: high-risk critical-infrastructure PQC transition',
      year: 2030,
      source: 'EU NIS Cooperation Group PQC Roadmap v1.1',
    },
    {
      label: 'EO 14412 / OMB M-26-15: PQC key establishment on covered federal civilian systems',
      year: EO_14412.keyEstablishment ?? 2030,
      source: 'EO 14412 & OMB M-26-15 (June 2026)',
    },
    {
      label: 'NIST: deprecate quantum-vulnerable public-key cryptography (RSA, ECC)',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547 (final, Oct 2026)',
    },
    {
      label: 'EO 14412 / OMB M-26-15: PQC digital signatures on covered federal civilian systems',
      year: EO_14412.digitalSignatures,
      source: 'EO 14412 & OMB M-26-15 (June 2026)',
    },
    {
      label: 'NIST: disallow classical public-key cryptography; EU Roadmap full transition target',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547 (final, Oct 2026) & EU PQC Roadmap v1.1',
    },
  ],

  narratives: {
    overview:
      'Energy, Utilities & Grid PQC equips OT/IT engineers, security architects, GRC leads, and researchers to plan post-quantum migration across power generation, transmission substations, SCADA control centers, AMI smart-meter meshes, and distributed energy resource (DER) edge gateways. Learners evaluate real-time protection-relay latency budgets, constrained link MTUs, 15–25 year hardware lifecycles, and verifiable vendor evidence.',
    gridThreatModel:
      'Power grids combine harvest-now-decrypt-later (HNDL) confidentiality exposure on long-lived control-center and topology data with high-consequence integrity and availability risks on firmware signing and telecontrol authentication. Always distinguish operational grid services (such as the SCADA telemetry/control service, AMI head-end collection service, and substation firmware-update service) from protected assets (long-lived grid topology records, customer metering histories, and field IED root-of-trust keys).',
    substationAndScada:
      'IEC 62351 secures IEC 61850 substation communications, but GOOSE and Sampled Values (SV) protection-relay frames operate under strict <4 ms real-time latency budgets and ~1,500-byte Ethernet MTUs where 2,420-byte ML-DSA-44 signatures cannot sit in the tripping loop. Instead, substations keep symmetric HMAC-SHA-256 / AES-256-GCM on the real-time data plane while migrating out-of-band key distribution (GDOI RFC 8052 / TLS 1.3 RFC 9846 + RFC 10024) and SCADA WAN gateways (IKEv2 RFC 9370) to hybrid PQC. Similarly, DNP3-SA (IEEE 1815) uses symmetric HMAC-SHA-256 per-message authentication with PQC-protected update-key distribution.',
    amiAndFieldLifecycles:
      'Field Intelligent Electronic Devices (IEDs), Remote Terminal Units (RTUs), smart meters (DLMS/COSEM over RF-mesh or NB-IoT), and DER inverters remain in service for 15–25 years — often exceeding Mosca transition horizons before their next scheduled hardware refresh. Utilities must separate multi-decade hardware replacement cycles from interim compensating controls: PQC-capable substation and head-end VPN gateways, symmetric session-key rotation, and stateful hash-based firmware verification (LMS-SHA256 / NIST SP 800-208) or ML-DSA-44/65 where flash and RAM permit.',
    regulatoryAndMigration:
      'Regulatory obligations in energy are layered rather than uniform. NERC CIP (CIP-005, CIP-007, CIP-010, CIP-011, CIP-012, CIP-013) governs North American Bulk Electric System (BES) cyber security controls and supply-chain risk management without setting a standalone PQC algorithm deadline. In the EU, the NIS2 Directive establishes cybersecurity risk-management duties for critical energy entities and does not set a fixed PQC deadline; 2030/2035 transition targets come from the non-binding EU NIS Cooperation Group PQC Roadmap v1.1. US federal power marketing administrations and covered federal civilian systems follow EO 14412 and OMB M-26-15 alongside NIST IR 8547 (final October 2026).',
    workshopSummary:
      'Four interactive steps: (1) Grid Protocol Mapper across Substation, SCADA Control Center, AMI Smart-Meter Mesh, and DER/Inverter Edge; (2) Substation MTU & Latency Budget Lab comparing ECDSA P-256, RSA-2048, ML-KEM-768, ML-DSA-44, and HMAC-SHA-256 across IEC 62351, DNP3-SA, and RF-mesh links; (3) Field Asset Lifecycle & Mosca-Window Planner for 15–25 year IEDs, RTUs, and smart meters; (4) Grid Evidence Scope Checklist enforcing Yes/No/Unknown triage where unanswered vendor items never mean low exposure.',
    relatedStandards:
      'FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), NIST SP 800-208 (LMS/XMSS), NIST IR 8547 (final Oct 2026), NIST SP 800-82 Rev. 3 (OT Security), IEC 62351-6 (IEC 61850 security), IEC 62443-4-2 (IACS components), IEC 62056-5-3 (DLMS/COSEM), RFC 8052 (GDOI for IEC 62351), RFC 9370 (IKEv2 multiple key exchanges), RFC 9846 & RFC 10024 (TLS 1.3 hybrid), NERC CIP-005/007/010/011/012/013, NIS2 Directive & EU PQC Roadmap v1.1, EO 14412 & OMB M-26-15.',
  },
}
