// SPDX-License-Identifier: GPL-3.0-only
/**
 * Regulatory data for the OT module: NERC CIP (corrected), IEC 62351 part
 * scopes (corrected), and the cross-sector regimes.
 *
 * Corrections from the plan audit:
 *  - E13: IED / PLC firmware integrity is CIP-010-4 R1.6 (software source and
 *    integrity verification), plus CIP-013 for the supply chain — not CIP-007.
 *  - E14: CIP-012-2 (effective 2026-07-01) protects confidentiality, integrity
 *    AND availability of real-time data between Control Centers and is
 *    technology-neutral — it does not "mandate encryption".
 *  - E15: "CSMS" is an IEC 62443 term; NERC CIP has no grid-operator approval
 *    step for algorithm changes.
 *  - E7: IEC 62351 Part 5 covers IEC 60870-5 and DNP3 (and derivatives);
 *    Part 6 covers IEC 61850 (GOOSE/SV, with HMAC/GMAC profiles); Part 8 is
 *    role-based access control; Part 9 is key management (GDOI).
 *  - E16: Part 14 logging travels over syslog/TLS, so it IS quantum-exposed.
 *  - E2/E3: CNSA 2.0 has per-category dates, no universal hybrid or PQC-only
 *    rule, and no sunset for AES-256.
 */
import { CNSA_2_0 } from '@/data/regulatoryTimelines'

export interface NERCCIPStandard {
  id: string
  title: string
  scope: string
  pqcRelevance: string
}

export const NERC_CIP_STANDARDS: NERCCIPStandard[] = [
  {
    id: 'CIP-002',
    title: 'BES Cyber System Categorization',
    scope: 'Rates BES Cyber Systems high, medium or low impact.',
    pqcRelevance:
      'The impact rating decides which other CIP requirements — and so which crypto — apply.',
  },
  {
    id: 'CIP-005-7',
    title: 'Electronic Security Perimeter(s)',
    scope:
      'R1 perimeters and access points; R2 Interactive Remote Access through an intermediate system with encryption and multi-factor authentication; R3 vendor remote access management for EACMS and PACS.',
    pqcRelevance:
      'Encrypted remote-access sessions (R2) are named, but no algorithm is. VPN / jump-host key exchange is an HNDL target.',
  },
  {
    id: 'CIP-010-4',
    title: 'Configuration Change Management and Vulnerability Assessments',
    scope:
      'R1.6: before a baseline change on high and medium impact systems, verify the identity of the software source and the integrity of the software.',
    pqcRelevance:
      'In practice R1.6 rests on vendor code-signing signatures — the firmware forgery exposure a CRQC creates.',
  },
  {
    id: 'CIP-012-2',
    title: 'Communications between Control Centers',
    scope:
      'Documented plan to protect confidentiality, integrity and availability of Real-time Assessment and Real-time monitoring data between Control Centers (CIP-012-2 adds availability). Effective 2026-07-01.',
    pqcRelevance:
      'Technology-neutral: encryption is one listed way to meet it, not a mandate. Where encryption is used, its key exchange is an HNDL target.',
  },
  {
    id: 'CIP-013-2',
    title: 'Supply Chain Risk Management',
    scope:
      'Supply-chain risk management plans for vendor products and services, including software integrity and authenticity.',
    pqcRelevance: 'The contractual lever for asking vendors for PQC firmware signing and roadmaps.',
  },
  {
    id: 'CIP-015-1',
    title: 'Internal Network Security Monitoring',
    scope:
      'Monitoring of network activity inside the Electronic Security Perimeter of high and medium impact systems.',
    pqcRelevance:
      'Monitoring has to keep working when the traffic it inspects moves to PQC handshakes.',
  },
]

export interface IEC62351Part {
  part: number
  title: string
  scope: string
  quantumExposure: string
}

export const IEC_62351_PARTS: IEC62351Part[] = [
  {
    part: 3,
    title: 'Profiles including TCP/IP',
    scope:
      'TLS profile for MMS, IEC 60870-5-104, DNP3/TCP and ICCP. Ed.2 (2023) adds TLS 1.3, per the standard (not independently verified).',
    quantumExposure: 'TLS key exchange (HNDL) and certificates (forgery).',
  },
  {
    part: 4,
    title: 'Profiles including MMS',
    scope: 'Application-level security for MMS-based protocols (IEC 61850 client/server, ICCP).',
    quantumExposure: 'Relies on certificates for peer authentication (forgery).',
  },
  {
    part: 5,
    title: 'Security for IEC 60870-5 and derivatives',
    scope:
      'Authentication for IEC 60870-5-101/-104 and DNP3 — the same HMAC challenge-response design as DNP3 SAv5.',
    quantumExposure:
      'None for the symmetric default; only the optional asymmetric update-key change.',
  },
  {
    part: 6,
    title: 'Security for IEC 61850',
    scope:
      'GOOSE and Sampled Values protection; the 2020 edition profiles include HMAC-SHA256 and AES-GMAC.',
    quantumExposure: 'Message MACs are symmetric (none). Exposure sits in key management (Part 9).',
  },
  {
    part: 8,
    title: 'Role-based access control',
    scope: 'Roles and access tokens for power-system operations.',
    quantumExposure: 'Signed access tokens and certificates (forgery).',
  },
  {
    part: 9,
    title: 'Cyber security key management',
    scope: 'Certificate lifecycle and group-key distribution via GDOI (RFC 8052) for GOOSE/SV.',
    quantumExposure: 'The GDOI registration channel and the PKI behind it (forgery and HNDL).',
  },
  {
    part: 14,
    title: 'Cyber security event logging',
    scope: 'Security-event log content, transported over syslog with TLS.',
    quantumExposure: 'Syslog/TLS handshake (HNDL) and certificates (forgery).',
  },
]

export interface CnsaCategory {
  category: string
  prefer: number | null
  exclusive: number
}

/** CNSA 2.0 per-category dates. Networking "prefer" (2026) has no shared constant. */
export const CNSA_2_0_CATEGORIES: CnsaCategory[] = [
  {
    category: 'Software and firmware signing',
    prefer: CNSA_2_0.softwarePreferred,
    exclusive: CNSA_2_0.softwareExclusive,
  },
  {
    category: 'Traditional networking equipment (VPNs, routers)',
    prefer: 2026,
    exclusive: CNSA_2_0.softwareExclusive,
  },
  {
    category: 'Operating systems',
    prefer: CNSA_2_0.networkingRequired,
    exclusive: CNSA_2_0.networkingExclusive,
  },
  { category: 'All National Security Systems', prefer: null, exclusive: CNSA_2_0.fullEnforcement },
]
