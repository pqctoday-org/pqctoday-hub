// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the SocImplementationPqc module.
 * Source: Applied Quantum — The Applied Quantum PQC Migration Framework,
 * "SOC Implementation" section (pp. 165–175). Licensed under CC BY 4.0.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'soc-implementation-pqc',
  version: '1.0.0',
  lastReviewed: '2026-06-13',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-227'),
    getStandard('NIST IR 8547'),
    getStandard('RFC 8446'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 networking equipment must support PQC',
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0',
    },
    {
      label: 'CNSA 2.0 software signing exclusive',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
  ],

  narratives: {
    overview:
      'The SOC Implementation for PQC module equips SOC directors and senior analysts to build quantum-related detection, threat intelligence, and incident response. It maps quantum security onto existing detection infrastructure (SIEM, network monitoring, certificate management) rather than introducing exotic quantum-specific tooling. The SOC has a dual mandate: verify during migration that hybrid implementations are not silently downgraded and migrated systems do not drift, and permanently maintain cryptographic posture and respond to future algorithm transitions.',
    prerequisite:
      'Every detection capability depends on one prerequisite: a queryable, continuously updated cryptographic posture registry that maps each system to its expected cryptographic configuration (hybrid / classical-only-pending / PQC-only, expected algorithms and cipher suites, and last status-change date). The registry is a derivative of the Phase 1/2 cryptographic inventory and CBOM: the migration program builds it, GRC governs it, the SOC consumes it. It must be machine-readable and SIEM-integrated — designing that integration is a Phase 1 architecture decision.',
    detectionUseCases:
      'Five detection use cases build on existing infrastructure. (1) Hybrid downgrade detection — flag connections negotiating classical-only key shares when hybrid is expected; requires adding ML-KEM and hybrid NamedGroup codepoints to traffic rules and suppressing benign middlebox-induced fallbacks. (2) Cryptographic drift monitoring — continuous network monitoring that flags migration-complete systems reverting to classical-only; tracked as Cryptographic Migration Coverage and requires east-west visibility. (3) Certificate lifecycle anomalies — failed PQC chain validations (Medium), unauthorized PQC issuance (High), and out-of-window CA signing-key access (Critical). (4) TNFL and signature integrity — heightened monitoring of code-signing, software-update authentication, and signature-verification policy changes (target MTD-Signing under 15 minutes). (5) Enhanced HNDL-indicator detection — exfiltration monitoring reweighted by data longevity, depending on data classification quality.',
    cyberThreatIntelligence:
      'Quantum CTI spans three horizons. Tactical (hours–days): triage liboqs CVEs, hardware ML-KEM side-channels, and cryptanalysis papers with implementation impact; target TTAssess-PQC under 4 hours for deployed implementations; sources include the NIST PQC mailing list, IETF pquip/lamps, CERT and vendor advisories. Operational (weeks–months): watch for adversary collection shifts toward long-lived archives and PQC supply-chain probing — a watch-and-wait posture, since no campaign has been publicly attributed as of mid-2026. Strategic (months–years): track quantum hardware progress against the CRQC Quantum Capability Framework and national quantum programs, producing a quarterly Quantum Threat Landscape Assessment for the CISO. Strategic CTI is scarce; most organizations should borrow it.',
    incidentResponsePlaybooks:
      'Four quantum-specific playbooks are developed during Phase 0 governance setup, each with a trigger, immediate actions, coordination requirements, and a drill metric. Playbook 1 — PQC Algorithm Vulnerability Disclosure: assess whether it is a full algorithm break or an implementation bug, query the registry for affected systems, deliver impact assessment under 4 hours, and either emergency-patch or activate crypto-agility for algorithm rotation. Playbook 2 — Confirmed Hybrid Downgrade Attack: isolate the path, preserve packet captures, determine mechanism and scope, and escalate to the CISO as an indicator of a sophisticated adversary. Playbook 3 — Credible CRQC Announcement: invoke crisis communications and emergency migration; prior preparation matters most. Playbook 4 — Emergency Algorithm Rotation: the SOC must not mistake an authorized rotation (mass revocations, cipher-suite changes, KMS spikes) for an attack, keeping the rotation-drill false-positive rate under 10%.',
    tabletopExercises:
      'Five named tabletop exercises should run at least annually with the migration program office, CISO, GRC, and application owners, each producing a structured after-action report. (1) The Friday Afternoon CVE — a critical liboqs CVE at 16:30 Friday in the production TLS layer; can all affected systems be identified in 4 hours and who authorizes out-of-window patching? (2) The Ambiguous Cryptanalysis Paper — an arXiv claim of a polynomial-time attack against ML-KEM security level 3 that cryptographers dispute within 24 hours; how is credibility evaluated and when does the SOC escalate? (3) Silent Downgrade — internal services negotiating classical-only TLS for 72 hours alongside a vendor load-balancer firmware update; was it detected automatically and is it misconfiguration or exploitation? (4) The CRQC Announcement — a national lab factors a 1024-bit RSA key in under 8 hours; tests the communication chain, exposure-assessment speed, and emergency-migration readiness. (5) Signing Key Compromise — unauthorized code signing whose firmware already reached three branch offices; tests artifact identification, rollback, and key revocation without disrupting legitimate signed artifacts.',
    skillsAndGaps:
      'Three recurring gaps shape the build plan. The protocol-parsing gap: most SIEMs and network tools cannot yet parse PQC cipher-suite identifiers, hybrid key-exchange groups, or PQC TLS extensions — plan 2–4 weeks of custom Suricata/Zeek/SIEM engineering per platform plus ongoing maintenance. The CTI skills gap: tactical CTI suits existing analysts with modest training, but strategic CTI requires specialized quantum knowledge best contracted externally while in-house tactical/operational capability matures over 12–18 months. The east-west visibility gap: limited internal traffic inspection, especially in cloud-native and service-mesh environments, is a prerequisite for drift monitoring and may require infrastructure investment flagged in the Phase 0 business case.',
    relatedStandards:
      'FIPS 203 (ML-KEM — the key-encapsulation NamedGroups that hybrid downgrade detection must parse). FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA — the certificate and code-signing algorithms behind certificate-lifecycle and TNFL monitoring). NIST SP 800-227 (KEM recommendations underpinning hybrid configurations). NIST IR 8547 (Transition to PQC Standards — the program context the posture registry derives from). RFC 8446 (TLS 1.3 — where hybrid key shares are negotiated by NamedGroup codepoints, not X.509 OIDs).',
  },
}
