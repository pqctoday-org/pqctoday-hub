// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the OpsQuantumImpact module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'ops-quantum-impact',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('NIST SP 800-227'),
    getStandard('RFC 4253'),
  ],

  algorithms: [getAlgorithm('ML-DSA-65'), getAlgorithm('ML-KEM-768')],

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
      'The Ops/DevOps Quantum Impact module equips infrastructure operators, SREs, and DevOps engineers with the operational runbooks, configuration patterns, and monitoring tooling needed to manage PQC migration at scale.',
    keyConcepts:
      "PQC Certificate Rotation at Scale — PQC certificates are expected to have shorter validity periods (90-day maximum per CA/Browser Forum baseline requirements); at 10,000 certificates on 90-day cycles, rotation events increase 4× compared to 1-year classical certs; ACME v2 (RFC 8555) with ML-DSA support planned for Let's Encrypt staging in 2026 and production in 2027; EST (RFC 7030) is the preferred enrollment protocol for enterprise and device fleet PQC certificate automation; cert-manager v...",
    workshopSummary:
      'The workshop has 3 interactive steps: Threat Impact Explorer — six-panel operational briefing: certificate rotation scale calculator (input: cert count + validity period → output: rotations/day, ACME request rate, cert-manager replica sizing), VPN/SSH migration checklist with config snippet diffs for strongSwan and OpenSSH, monitoring threshold recalibration guide with before/after values for the most common alert rules, CI/CD signing migration decision matrix (cosign vs. Notation vs.',
    relatedStandards:
      'FIPS 203 (ML-KEM — key encapsulation for TLS and VPN key exchange). FIPS 204 (ML-DSA — digital signatures for certificates, code signing, SSH host keys). RFC 8555 (ACME v2 — Automatic Certificate Management Environment). RFC 7030 (EST — Enrollment over Secure Transport for certificate automation). RFC 4253 (SSH Transport Layer Protocol — host key algorithm negotiation). RFC 7296 (IKEv2 — Internet Key Exchange for IPsec VPN). NIST SP 800-57 Part 1 Rev. 5 (Key Management Recommendations).',
  },
}
