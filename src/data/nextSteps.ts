// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.2 (2026-09-19) — the declared next step out of every routed
 * item: 65 modules, 34 playground tools, 37 business tools, 29 pages.
 *
 * Keyed by route. Rendered as the item's exit by NextStepCard (desktop) and
 * MobileNextStepCard (phone). The chain is module → the tool that practises
 * it → the business tool that produces the phase's deliverable → the report;
 * where a link in the chain does not exist the entry points at the next module
 * in the track instead. Entries were generated from the registries
 * (moduleToolLinks, frameworkPhase, category order; the business tool is the
 * phase's tool with the most keyword overlap) and every `why` states only what
 * the registries say. nextSteps.test.ts pins coverage and that every target
 * resolves. Edit an entry by hand when a better exit exists; the rule is a
 * starting point, not a constraint.
 */

export interface NextStep {
  /** Route the exit points at. */
  to: string
  /** Button text, e.g. "Practice it: HSM Capacity Calculator". */
  label: string
  /** One sentence on why this is the next step. */
  why: string
}

export const NEXT_STEPS: Record<string, NextStep> = {
  // ── module→business ──
  '/learn/ai-security-pqc': {
    to: '/business/tools/data-at-rest-strategy',
    label: 'Produce the artifact: Data-at-Rest Strategy',
    why: 'This module belongs to phase 5 (Pilots & Migration); Data-at-Rest Strategy produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/api-security-jwt': {
    to: '/playground/api-security-jwt',
    label: 'Practice it: API Security & JWT Workshop',
    why: 'API Security & JWT Workshop is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/aerospace-pqc': {
    to: '/business/tools/deployment-playbook',
    label: 'Produce the artifact: Deployment Playbook',
    why: 'This module belongs to phase 5 (Pilots & Migration); Deployment Playbook produces a deliverable of that phase in the Command Center.',
  },
  // ── module→track ──
  '/learn/arch-quantum-impact': {
    to: '/learn/ops-quantum-impact',
    label: 'Continue the Role Guides track: Ops Quantum Impact',
    why: 'Ops Quantum Impact is the next module in the Role Guides track.',
  },
  // ── module→business ──
  '/learn/automotive-pqc': {
    to: '/business/tools/crypto-api-refactor-audit',
    label: 'Produce the artifact: Crypto API Refactor Audit',
    why: 'This module belongs to phase 5 (Pilots & Migration); Crypto API Refactor Audit produces a deliverable of that phase in the Command Center.',
  },
  '/learn/cbom': {
    to: '/business/tools/crypto-cbom-builder',
    label: 'Produce the artifact: Crypto BOM (CBOM) Builder',
    why: 'This module belongs to phase 2 (CBOM); Crypto BOM (CBOM) Builder produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/code-signing': {
    to: '/playground/firmware-signing',
    label: 'Practice it: Firmware Signing',
    why: 'Firmware Signing is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/compliance-strategy': {
    to: '/business/tools/compliance-checklist',
    label: 'Produce the artifact: Compliance Checklist',
    why: 'This module belongs to the Foundations phase; Compliance Checklist produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/confidential-computing': {
    to: '/playground/tee-channel',
    label: 'Practice it: TEE-HSM Secure Channel',
    why: 'TEE-HSM Secure Channel is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/crypto-agility': {
    to: '/business/tools/compliance-checklist',
    label: 'Produce the artifact: Compliance Checklist',
    why: 'This module belongs to the Foundations phase; Compliance Checklist produces a deliverable of that phase in the Command Center.',
  },
  '/learn/crypto-dev-apis': {
    to: '/business/tools/kpi-dashboard',
    label: 'Produce the artifact: KPI Dashboard Builder',
    why: 'This module belongs to the Foundations phase; KPI Dashboard Builder produces a deliverable of that phase in the Command Center.',
  },
  '/learn/crypto-mgmt-modernization': {
    to: '/business/tools/management-tools-audit',
    label: 'Produce the artifact: Management Tools Audit',
    why: 'This module belongs to phase 1 (Discovery & Inventory); Management Tools Audit produces a deliverable of that phase in the Command Center.',
  },
  '/learn/crypto-product-certification': {
    to: '/business/tools/vendor-scorecard',
    label: 'Produce the artifact: Vendor Scorecard Builder',
    why: 'This module belongs to phase 7 (Vendor & Supply Chain); Vendor Scorecard Builder produces a deliverable of that phase in the Command Center.',
  },
  '/learn/crypto-registry': {
    to: '/business/tools/crypto-cbom-builder',
    label: 'Produce the artifact: Crypto BOM (CBOM) Builder',
    why: 'This module belongs to phase 2 (CBOM); Crypto BOM (CBOM) Builder produces a deliverable of that phase in the Command Center.',
  },
  '/learn/dnssec-pqc': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Produce the artifact: Hybrid Transition Planner',
    why: 'This module belongs to phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase in the Command Center.',
  },
  '/learn/data-asset-sensitivity': {
    to: '/business/tools/management-tools-audit',
    label: 'Produce the artifact: Management Tools Audit',
    why: 'This module belongs to phase 1 (Discovery & Inventory); Management Tools Audit produces a deliverable of that phase in the Command Center.',
  },
  '/learn/database-encryption-pqc': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  '/learn/dev-quantum-impact': {
    to: '/business/tools/audit-checklist',
    label: 'Produce the artifact: Audit Readiness Checklist',
    why: 'This module belongs to the Foundations phase; Audit Readiness Checklist produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/digital-assets': {
    to: '/playground/bitcoin-flow',
    label: 'Practice it: Bitcoin Transaction',
    why: 'Bitcoin Transaction is the hands-on version of this module: the same ideas, run in your browser.',
  },
  '/learn/digital-id': {
    to: '/playground/digital-id',
    label: 'Practice it: EUDI Wallet Architecture',
    why: 'EUDI Wallet Architecture is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/emv-payment-pqc': {
    to: '/business/tools/data-at-rest-strategy',
    label: 'Produce the artifact: Data-at-Rest Strategy',
    why: 'This module belongs to phase 5 (Pilots & Migration); Data-at-Rest Strategy produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/email-signing': {
    to: '/playground/email-signing',
    label: 'Practice it: S/MIME & CMS Workshop',
    why: 'S/MIME & CMS Workshop is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/energy-utilities-pqc': {
    to: '/business/tools/mti-negotiator',
    label: 'Produce the artifact: MTI Negotiator',
    why: 'This module belongs to phase 5 (Pilots & Migration); MTI Negotiator produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/entropy-randomness': {
    to: '/playground/entropy-test',
    label: 'Practice it: Entropy Testing',
    why: 'Entropy Testing is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/exec-quantum-impact': {
    to: '/business/tools/board-pitch',
    label: 'Produce the artifact: Board Pitch Builder',
    why: 'This module belongs to phase 0 (Executive Mandate); Board Pitch Builder produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/5g-security': {
    to: '/playground/suci-flow',
    label: 'Practice it: 5G SUCI Construction',
    why: '5G SUCI Construction is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/government-defense-pqc': {
    to: '/business/tools/mti-negotiator',
    label: 'Produce the artifact: MTI Negotiator',
    why: 'This module belongs to phase 5 (Pilots & Migration); MTI Negotiator produces a deliverable of that phase in the Command Center.',
  },
  '/learn/healthcare-pqc': {
    to: '/business/tools/data-at-rest-strategy',
    label: 'Produce the artifact: Data-at-Rest Strategy',
    why: 'This module belongs to phase 5 (Pilots & Migration); Data-at-Rest Strategy produces a deliverable of that phase in the Command Center.',
  },
  '/learn/hsm-pqc': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/hybrid-crypto': {
    to: '/playground/hybrid-certs',
    label: 'Practice it: Hybrid Certificates',
    why: 'Hybrid Certificates is the hands-on version of this module: the same ideas, run in your browser.',
  },
  '/learn/iam-pqc': {
    to: '/playground/token-migration',
    label: 'Practice it: Multi-Algorithm Signing',
    why: 'Multi-Algorithm Signing is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/iot-ot-pqc': {
    to: '/business/tools/mti-negotiator',
    label: 'Produce the artifact: MTI Negotiator',
    why: 'This module belongs to phase 5 (Pilots & Migration); MTI Negotiator produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/kms-pqc': {
    to: '/playground/envelope-encrypt',
    label: 'Practice it: Envelope Encryption',
    why: 'Envelope Encryption is the hands-on version of this module: the same ideas, run in your browser.',
  },
  '/learn/mls-group-messaging': {
    to: '/playground/mls-group-messaging',
    label: 'Practice it: MLS Group Messaging',
    why: 'MLS Group Messaging is the hands-on version of this module: the same ideas, run in your browser.',
  },
  '/learn/merkle-tree-certs': {
    to: '/playground/merkle-proof',
    label: 'Practice it: Merkle Tree Workshop',
    why: 'Merkle Tree Workshop is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/migration-program': {
    to: '/business/tools/roadmap-builder',
    label: 'Produce the artifact: Roadmap Builder',
    why: 'This module belongs to phase 4 (Roadmap & Governance); Roadmap Builder produces a deliverable of that phase in the Command Center.',
  },
  // ── module→track ──
  '/learn/pqc-101': {
    to: '/learn/quantum-threats',
    label: 'Continue the Foundations track: Quantum Threats',
    why: 'Quantum Threats is the next module in the Foundations track.',
  },
  // ── module→business ──
  '/learn/network-security-pqc': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  '/learn/os-pqc': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  '/learn/ops-quantum-impact': {
    to: '/business/tools/kpi-dashboard',
    label: 'Produce the artifact: KPI Dashboard Builder',
    why: 'This module belongs to the Foundations phase; KPI Dashboard Builder produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/pki-enrollment-protocols': {
    to: '/playground/pki-enrollment',
    label: 'Practice it: PKI Enrollment (EST + CMP)',
    why: 'PKI Enrollment (EST + CMP) is the hands-on version of this module: the same ideas, run in your browser.',
  },
  '/learn/pki-workshop': {
    to: '/playground/pki-workshop',
    label: 'Practice it: PKI Workshop',
    why: 'PKI Workshop is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/pqc-business-case': {
    to: '/business/tools/roi-calculator',
    label: 'Produce the artifact: ROI Calculator',
    why: 'This module belongs to phase 0 (Executive Mandate); ROI Calculator produces a deliverable of that phase in the Command Center.',
  },
  // ── module→assess ──
  '/learn/pqc-candidates': {
    to: '/assess',
    label: 'Apply it: take the readiness assessment',
    why: 'The assessment scores your own estate against what this module covers.',
  },
  // ── module→business ──
  '/learn/pqc-governance': {
    to: '/business/tools/raci-builder',
    label: 'Produce the artifact: RACI Builder',
    why: 'This module belongs to phase 0 (Executive Mandate); RACI Builder produces a deliverable of that phase in the Command Center.',
  },
  '/learn/pqc-risk-management': {
    to: '/business/tools/risk-register',
    label: 'Produce the artifact: Risk Register Builder',
    why: 'This module belongs to phase 3 (Risk Scoring); Risk Register Builder produces a deliverable of that phase in the Command Center.',
  },
  '/learn/pqc-testing-validation': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  '/learn/platform-eng-pqc': {
    to: '/business/tools/management-tools-audit',
    label: 'Produce the artifact: Management Tools Audit',
    why: 'This module belongs to phase 1 (Discovery & Inventory); Management Tools Audit produces a deliverable of that phase in the Command Center.',
  },
  '/learn/pqc-grc': {
    to: '/business/tools/compliance-checklist',
    label: 'Produce the artifact: Compliance Checklist',
    why: 'This module belongs to the Foundations phase; Compliance Checklist produces a deliverable of that phase in the Command Center.',
  },
  '/learn/qkd': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  // ── module→track ──
  '/learn/quantum-threats': {
    to: '/learn/pqc-candidates',
    label: 'Continue the Foundations track: PQC Candidates & Lifecycle',
    why: 'PQC Candidates & Lifecycle is the next module in the Foundations track.',
  },
  // ── module→assess ──
  '/learn/research-quantum-impact': {
    to: '/assess',
    label: 'Apply it: take the readiness assessment',
    why: 'The assessment scores your own estate against what this module covers.',
  },
  // ── module→tool ──
  '/learn/slh-dsa': {
    to: '/playground/slh-dsa',
    label: 'Practice it: SLH-DSA Sign & Verify',
    why: 'SLH-DSA Sign & Verify is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/sbom': {
    to: '/business/tools/management-tools-audit',
    label: 'Produce the artifact: Management Tools Audit',
    why: 'This module belongs to phase 1 (Discovery & Inventory); Management Tools Audit produces a deliverable of that phase in the Command Center.',
  },
  '/learn/secrets-management-pqc': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/secure-boot-pqc': {
    to: '/playground/firmware-signing',
    label: 'Practice it: Firmware Signing',
    why: 'Firmware Signing is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/skills-team-structure': {
    to: '/business/tools/skills-team-plan',
    label: 'Produce the artifact: Skills & Team Plan',
    why: 'This module belongs to the Foundations phase; Skills & Team Plan produces a deliverable of that phase in the Command Center.',
  },
  '/learn/soc-implementation-pqc': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  '/learn/standards-bodies': {
    to: '/business/tools/compliance-checklist',
    label: 'Produce the artifact: Compliance Checklist',
    why: 'This module belongs to the Foundations phase; Compliance Checklist produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/stateful-signatures': {
    to: '/playground/lms-hss',
    label: 'Practice it: Stateful Hash Signatures',
    why: 'Stateful Hash Signatures is the hands-on version of this module: the same ideas, run in your browser.',
  },
  '/learn/tls-basics': {
    to: '/playground/tls-simulator',
    label: 'Practice it: TLS 1.3 Simulator',
    why: 'TLS 1.3 Simulator is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/trust-services-pqc': {
    to: '/business/tools/deployment-playbook',
    label: 'Produce the artifact: Deployment Playbook',
    why: 'This module belongs to phase 5 (Pilots & Migration); Deployment Playbook produces a deliverable of that phase in the Command Center.',
  },
  // ── module→tool ──
  '/learn/vpn-ssh-pqc': {
    to: '/playground/vpn-sim',
    label: 'Practice it: PQC VPN Simulator',
    why: 'PQC VPN Simulator is the hands-on version of this module: the same ideas, run in your browser.',
  },
  // ── module→business ──
  '/learn/vendor-risk': {
    to: '/business/tools/vendor-scorecard',
    label: 'Produce the artifact: Vendor Scorecard Builder',
    why: 'This module belongs to phase 7 (Vendor & Supply Chain); Vendor Scorecard Builder produces a deliverable of that phase in the Command Center.',
  },
  '/learn/verification-closure': {
    to: '/business/tools/migration-verification',
    label: 'Produce the artifact: Migration Verification & Closure',
    why: 'This module belongs to the Verification & Closure phase; Migration Verification & Closure produces a deliverable of that phase in the Command Center.',
  },
  '/learn/web-gateway-pqc': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Produce the artifact: Infrastructure Modernization Planner',
    why: 'This module belongs to phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase in the Command Center.',
  },
  // ── tool→report ──
  '/playground/cacp-kmip': {
    to: '/report',
    label: 'Put it in your report',
    why: 'Your readiness report is where the results of the Playground tools become recommendations.',
  },
  // ── tool→business ──
  '/playground/hsm-capacity': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the PKI module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  '/playground/hybrid-encrypt': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the Hybrid Cryptography module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/envelope-encrypt': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the KMS & PQC Key Management module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  '/playground/token-migration': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the Identity & Access Management with PQC module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/firmware-signing': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the Secure Boot & Firmware PQC module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  // ── tool→module ──
  '/playground/slh-dsa': {
    to: '/learn/soc-implementation-pqc',
    label: 'Keep learning: SOC Implementation for PQC',
    why: 'SOC Implementation for PQC follows SLH-DSA: Stateless Hash Signatures, the module this tool practises, in the Software Infrastructure track.',
  },
  '/playground/lms-hss': {
    to: '/learn/slh-dsa',
    label: 'Keep learning: SLH-DSA: Stateless Hash Signatures',
    why: 'SLH-DSA: Stateless Hash Signatures follows Stateful Hash Signatures, the module this tool practises, in the Software Infrastructure track.',
  },
  // ── tool→business ──
  '/playground/hybrid-sigs': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the Hybrid Cryptography module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/kdf-derivation': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the KMS & PQC Key Management module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  '/playground/tee-channel': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the Confidential Computing & TEEs module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  '/playground/tls-simulator': {
    to: '/business/tools/mti-negotiator',
    label: 'Turn it into a plan: MTI Negotiator',
    why: 'This tool practises the TLS Basics module, phase 5 (Pilots & Migration); MTI Negotiator produces a deliverable of that phase.',
  },
  '/playground/vpn-sim': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the VPN/IPsec & SSH module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/pqc-ssh-sim': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the VPN/IPsec & SSH module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/suci-flow': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the 5G Security module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/mls-group-messaging': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the MLS — Group Messaging module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/tpm-playground': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the Secure Boot & Firmware PQC module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  // ── tool→module ──
  '/playground/rng-demo': {
    to: '/learn/pqc-101',
    label: 'Keep learning: PQC 101',
    why: 'PQC 101 follows Entropy & Randomness, the module this tool practises, in the Foundations track.',
  },
  '/playground/qrng-demo': {
    to: '/learn/pqc-101',
    label: 'Keep learning: PQC 101',
    why: 'PQC 101 follows Entropy & Randomness, the module this tool practises, in the Foundations track.',
  },
  '/playground/entropy-test': {
    to: '/learn/pqc-101',
    label: 'Keep learning: PQC 101',
    why: 'PQC 101 follows Entropy & Randomness, the module this tool practises, in the Foundations track.',
  },
  '/playground/drbg-demo': {
    to: '/learn/pqc-101',
    label: 'Keep learning: PQC 101',
    why: 'PQC 101 follows Entropy & Randomness, the module this tool practises, in the Foundations track.',
  },
  '/playground/source-combining': {
    to: '/learn/pqc-101',
    label: 'Keep learning: PQC 101',
    why: 'PQC 101 follows Entropy & Randomness, the module this tool practises, in the Foundations track.',
  },
  // ── tool→business ──
  '/playground/pki-workshop': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the PKI module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  '/playground/cert-capacity': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the PKI module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  '/playground/hybrid-certs': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the Hybrid Cryptography module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/merkle-proof': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Turn it into a plan: Infrastructure Modernization Planner',
    why: 'This tool practises the Merkle Tree Certificates module, phase 6 (Infrastructure & Performance); Infrastructure Modernization Planner produces a deliverable of that phase.',
  },
  '/playground/digital-id': {
    to: '/business/tools/deployment-playbook',
    label: 'Turn it into a plan: Deployment Playbook',
    why: 'This tool practises the Digital ID module, phase 5 (Pilots & Migration); Deployment Playbook produces a deliverable of that phase.',
  },
  '/playground/bitcoin-flow': {
    to: '/business/tools/deployment-playbook',
    label: 'Turn it into a plan: Deployment Playbook',
    why: 'This tool practises the Digital Assets module, phase 5 (Pilots & Migration); Deployment Playbook produces a deliverable of that phase.',
  },
  '/playground/hd-wallet': {
    to: '/business/tools/deployment-playbook',
    label: 'Turn it into a plan: Deployment Playbook',
    why: 'This tool practises the Digital Assets module, phase 5 (Pilots & Migration); Deployment Playbook produces a deliverable of that phase.',
  },
  '/playground/solana-flow': {
    to: '/business/tools/deployment-playbook',
    label: 'Turn it into a plan: Deployment Playbook',
    why: 'This tool practises the Digital Assets module, phase 5 (Pilots & Migration); Deployment Playbook produces a deliverable of that phase.',
  },
  // ── tool→report ──
  '/playground/openssl-studio': {
    to: '/report',
    label: 'Put it in your report',
    why: 'Your readiness report is where the results of the Playground tools become recommendations.',
  },
  // ── tool→business ──
  '/playground/api-security-jwt': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the API Security & JWT module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/pki-enrollment': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Turn it into a plan: Hybrid Transition Planner',
    why: 'This tool practises the PKI Enrollment Protocols (EST & CMP) module, phase 5 (Pilots & Migration); Hybrid Transition Planner produces a deliverable of that phase.',
  },
  '/playground/email-signing': {
    to: '/business/tools/mti-negotiator',
    label: 'Turn it into a plan: MTI Negotiator',
    why: 'This tool practises the Email & Document Signing module, phase 5 (Pilots & Migration); MTI Negotiator produces a deliverable of that phase.',
  },
  // ── business→next ──
  '/business/tools/roi-calculator': {
    to: '/business/tools/board-pitch',
    label: 'Next in Risk & Strategy: Board Pitch Builder',
    why: 'Board Pitch Builder is the next Risk & Strategy tool in the Command Center.',
  },
  '/business/tools/board-pitch': {
    to: '/business/tools/breach-simulator',
    label: 'Next in Risk & Strategy: Breach Scenario Simulator',
    why: 'Breach Scenario Simulator is the next Risk & Strategy tool in the Command Center.',
  },
  '/business/tools/breach-simulator': {
    to: '/business/tools/cost-of-inaction',
    label: 'Next in Risk & Strategy: Cost of Inaction Analyzer',
    why: 'Cost of Inaction Analyzer is the next Risk & Strategy tool in the Command Center.',
  },
  '/business/tools/cost-of-inaction': {
    to: '/business/tools/cost-model-explorer',
    label: 'Next in Risk & Strategy: Cost Model Explorer',
    why: 'Cost Model Explorer is the next Risk & Strategy tool in the Command Center.',
  },
  '/business/tools/cost-model-explorer': {
    to: '/business/tools/crqc-scenario',
    label: 'Next in Risk & Strategy: CRQC Scenario Planner',
    why: 'CRQC Scenario Planner is the next Risk & Strategy tool in the Command Center.',
  },
  '/business/tools/crqc-scenario': {
    to: '/business/tools/risk-register',
    label: 'Next in Risk & Strategy: Risk Register Builder',
    why: 'Risk Register Builder is the next Risk & Strategy tool in the Command Center.',
  },
  '/business/tools/risk-register': {
    to: '/business/tools/risk-treatment-plan',
    label: 'Next in Risk & Strategy: Risk Heatmap & Treatment Plan',
    why: 'Risk Heatmap & Treatment Plan is the next Risk & Strategy tool in the Command Center.',
  },
  '/business/tools/risk-treatment-plan': {
    to: '/business/tools/initial-scoping',
    label: 'Next in Risk & Strategy: Initial Scoping Assessment',
    why: 'Initial Scoping Assessment is the next Risk & Strategy tool in the Command Center.',
  },
  // ── business→report ──
  '/business/tools/initial-scoping': {
    to: '/report',
    label: 'Put it in your report',
    why: 'Your readiness report collects what the Risk & Strategy tools produce.',
  },
  // ── business→next ──
  '/business/tools/compliance-checklist': {
    to: '/business/tools/audit-checklist',
    label: 'Next in Compliance & Audit: Audit Readiness Checklist',
    why: 'Audit Readiness Checklist is the next Compliance & Audit tool in the Command Center.',
  },
  '/business/tools/audit-checklist': {
    to: '/business/tools/compliance-timeline',
    label: 'Next in Compliance & Audit: Compliance Timeline Builder',
    why: 'Compliance Timeline Builder is the next Compliance & Audit tool in the Command Center.',
  },
  // ── business→report ──
  '/business/tools/compliance-timeline': {
    to: '/report',
    label: 'Put it in your report',
    why: 'Your readiness report collects what the Compliance & Audit tools produce.',
  },
  // ── business→next ──
  '/business/tools/raci-builder': {
    to: '/business/tools/policy-generator',
    label: 'Next in Governance & Policy: Policy Template Generator',
    why: 'Policy Template Generator is the next Governance & Policy tool in the Command Center.',
  },
  '/business/tools/policy-generator': {
    to: '/business/tools/kpi-dashboard',
    label: 'Next in Governance & Policy: KPI Dashboard Builder',
    why: 'KPI Dashboard Builder is the next Governance & Policy tool in the Command Center.',
  },
  '/business/tools/kpi-dashboard': {
    to: '/business/tools/program-charter',
    label: 'Next in Governance & Policy: Program Charter',
    why: 'Program Charter is the next Governance & Policy tool in the Command Center.',
  },
  '/business/tools/program-charter': {
    to: '/business/tools/skills-team-plan',
    label: 'Next in Governance & Policy: Skills & Team Plan',
    why: 'Skills & Team Plan is the next Governance & Policy tool in the Command Center.',
  },
  '/business/tools/skills-team-plan': {
    to: '/business/tools/accelerated-execution-profile',
    label: 'Next in Governance & Policy: Accelerated Execution Profile',
    why: 'Accelerated Execution Profile is the next Governance & Policy tool in the Command Center.',
  },
  // ── business→report ──
  '/business/tools/accelerated-execution-profile': {
    to: '/report',
    label: 'Put it in your report',
    why: 'Your readiness report collects what the Governance & Policy tools produce.',
  },
  // ── business→next ──
  '/business/tools/vendor-scorecard': {
    to: '/business/tools/contract-clause',
    label: 'Next in Vendor & Supply Chain: Contract Clause Generator',
    why: 'Contract Clause Generator is the next Vendor & Supply Chain tool in the Command Center.',
  },
  '/business/tools/contract-clause': {
    to: '/business/tools/supply-chain-matrix',
    label: 'Next in Vendor & Supply Chain: Supply Chain Risk Matrix',
    why: 'Supply Chain Risk Matrix is the next Vendor & Supply Chain tool in the Command Center.',
  },
  // ── business→report ──
  '/business/tools/supply-chain-matrix': {
    to: '/report',
    label: 'Put it in your report',
    why: 'Your readiness report collects what the Vendor & Supply Chain tools produce.',
  },
  // ── business→next ──
  '/business/tools/roadmap-builder': {
    to: '/business/tools/stakeholder-comms',
    label: 'Next in Migration Planning: Stakeholder Comms Planner',
    why: 'Stakeholder Comms Planner is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/stakeholder-comms': {
    to: '/business/tools/kpi-tracker',
    label: 'Next in Migration Planning: KPI Tracker Template',
    why: 'KPI Tracker Template is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/kpi-tracker': {
    to: '/business/tools/deployment-playbook',
    label: 'Next in Migration Planning: Deployment Playbook',
    why: 'Deployment Playbook is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/deployment-playbook': {
    to: '/business/tools/hybrid-transition-planner',
    label: 'Next in Migration Planning: Hybrid Transition Planner',
    why: 'Hybrid Transition Planner is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/hybrid-transition-planner': {
    to: '/business/tools/mti-negotiator',
    label: 'Next in Migration Planning: MTI Negotiator',
    why: 'MTI Negotiator is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/mti-negotiator': {
    to: '/business/tools/crypto-api-refactor-audit',
    label: 'Next in Migration Planning: Crypto API Refactor Audit',
    why: 'Crypto API Refactor Audit is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/crypto-api-refactor-audit': {
    to: '/business/tools/cloud-responsibility-matrix',
    label: 'Next in Migration Planning: Cloud Responsibility Matrix',
    why: 'Cloud Responsibility Matrix is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/cloud-responsibility-matrix': {
    to: '/business/tools/crypto-architecture-diagram',
    label: 'Next in Migration Planning: Crypto Architecture Diagram',
    why: 'Crypto Architecture Diagram is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/crypto-architecture-diagram': {
    to: '/business/tools/management-tools-audit',
    label: 'Next in Migration Planning: Management Tools Audit',
    why: 'Management Tools Audit is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/management-tools-audit': {
    to: '/business/tools/crypto-cbom-builder',
    label: 'Next in Migration Planning: Crypto BOM (CBOM) Builder',
    why: 'Crypto BOM (CBOM) Builder is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/crypto-cbom-builder': {
    to: '/business/tools/crypto-vulnerability-watch',
    label: 'Next in Migration Planning: Crypto Vulnerability Watch',
    why: 'Crypto Vulnerability Watch is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/crypto-vulnerability-watch': {
    to: '/business/tools/infra-modernization-planner',
    label: 'Next in Migration Planning: Infrastructure Modernization Planner',
    why: 'Infrastructure Modernization Planner is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/infra-modernization-planner': {
    to: '/business/tools/refresh-cycle-alignment',
    label: 'Next in Migration Planning: Refresh-Cycle Alignment',
    why: 'Refresh-Cycle Alignment is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/refresh-cycle-alignment': {
    to: '/business/tools/data-at-rest-strategy',
    label: 'Next in Migration Planning: Data-at-Rest Strategy',
    why: 'Data-at-Rest Strategy is the next Migration Planning tool in the Command Center.',
  },
  '/business/tools/data-at-rest-strategy': {
    to: '/business/tools/migration-verification',
    label: 'Next in Migration Planning: Migration Verification & Closure',
    why: 'Migration Verification & Closure is the next Migration Planning tool in the Command Center.',
  },
  // ── business→report ──
  '/business/tools/migration-verification': {
    to: '/report',
    label: 'Put it in your report',
    why: 'Your readiness report collects what the Migration Planning tools produce.',
  },
  // ── page ──
  '/': {
    to: '/assess',
    label: 'Start with the readiness assessment',
    why: 'A fast or full track of questions gives you a quantum risk score, migration priorities and recommendations for your organisation.',
  },
  '/assess': {
    to: '/report',
    label: 'Read your readiness report',
    why: 'The report turns your answers into a score, priorities and recommended actions, section by section.',
  },
  '/report': {
    to: '/business',
    label: 'Produce the artifacts',
    why: 'The Command Center tools turn each recommendation into a document you can hand over.',
  },
  '/learn': {
    to: '/learn/pqc-101',
    label: 'Start with PQC 101',
    why: 'The foundations module: what breaks, when, and the vocabulary every other module uses.',
  },
  '/playground': {
    to: '/learn',
    label: 'Learn the theory behind the tools',
    why: 'Every Playground tool links to the Learn module it practises.',
  },
  '/playground/cacp': {
    to: '/playground/cacp-kmip',
    label: 'Run the KMIP control plane',
    why: 'The control-plane tool runs KMIP 3.0 operations against a live key store, step by step.',
  },
  '/playground/hsm': {
    to: '/learn/hsm-pqc',
    label: 'Learn HSMs and PQC',
    why: 'The module behind this lab: how hardware security modules take on post-quantum keys.',
  },
  '/playground/interactive': {
    to: '/learn',
    label: 'Learn the theory behind the tools',
    why: 'Every Playground tool links to the Learn module it practises.',
  },
  '/openssl': {
    to: '/playground',
    label: 'More hands-on tools',
    why: 'The Playground holds the other in-browser tools, grouped by what each one exercises.',
  },
  '/algorithms': {
    to: '/playground',
    label: 'Try the algorithms in the Playground',
    why: 'The Playground runs ML-KEM, ML-DSA and SLH-DSA in your browser.',
  },
  '/compliance': {
    to: '/business/tools/compliance-checklist',
    label: 'Build your compliance checklist',
    why: 'The checklist tool turns the frameworks that apply to you into a tracked list.',
  },
  '/migrate': {
    to: '/business/tools/roadmap-builder',
    label: 'Build the roadmap',
    why: 'The Roadmap Builder sequences the migration the catalogue rows describe.',
  },
  '/business': {
    to: '/business/tools/initial-scoping',
    label: 'Start with Initial Scoping',
    why: 'Initial Scoping sizes the programme before any other tool asks for detail.',
  },
  '/timeline': {
    to: '/migrate',
    label: 'Check your vendors against the dates',
    why: 'The migration catalogue records when each product supports PQC.',
  },
  '/library': {
    to: '/revisions',
    label: 'See what changed',
    why: 'The revisions page lists the corrections made to the documents and data in the library.',
  },
  '/threats': {
    to: '/assess',
    label: 'Assess your exposure',
    why: 'The assessment scores the threats on this page against your own estate.',
  },
  '/simulation': {
    to: '/assess',
    label: 'Run it on your own estate',
    why: 'The simulation walks a reference programme; the assessment starts yours.',
  },
  '/patents': {
    to: '/algorithms',
    label: 'See the algorithms the claims cover',
    why: 'The algorithms page compares the schemes these patents were filed on.',
  },
  '/leaders': {
    to: '/library',
    label: 'Read what they wrote',
    why: 'The library holds the standards and papers the people on this page authored.',
  },
  '/explore': {
    to: '/assess',
    label: 'Take the readiness assessment',
    why: 'A few minutes of questions give you a score and a first stop.',
  },
  '/revisions': {
    to: '/changelog',
    label: 'Release notes',
    why: 'The changelog lists what each release changed, beyond the data corrections here.',
  },
  '/changelog': {
    to: '/revisions',
    label: 'Data corrections',
    why: 'Row-level corrections to the data live on the revisions page.',
  },
  '/faq': {
    to: '/learn',
    label: 'Go deeper in the Learn modules',
    why: 'Each FAQ answer links to the module that explains it fully.',
  },
  '/about': {
    to: '/editorial-independence',
    label: 'How the content stays independent',
    why: 'The policy behind the assessments and vendor rows on this site.',
  },
  '/editorial-independence': {
    to: '/sponsor',
    label: 'Support the site',
    why: 'Sponsorship funds hosting and data work and buys no placement.',
  },
  '/sponsor': {
    to: '/about',
    label: 'How the site is built',
    why: 'Who builds this site, why, and what is and is not tracked.',
  },
  '/terms': {
    to: '/about',
    label: 'How the site is built',
    why: 'Who builds this site, why, and what is and is not tracked.',
  },
  '/embed': {
    to: '/learn',
    label: 'Browse the modules you can embed',
    why: 'Every Learn module has an embeddable view.',
  },
  '/navigate': {
    to: '/explore',
    label: 'Browse by topic instead',
    why: 'Explore lists every topic on the site in plain words with a first stop for each.',
  },
}

/** The routed pages whose exit MainLayout renders (modules and tools render their own). */
export const PAGE_NEXT_STEP_ROUTES: ReadonlySet<string> = new Set(
  Object.keys(NEXT_STEPS).filter(
    (r) => !r.startsWith('/learn/') && !r.startsWith('/business/tools/') && !isToolRoute(r)
  )
)

function isToolRoute(route: string): boolean {
  // Playground TOOL routes carry their own card; the three playground PAGES
  // (/playground/cacp, /playground/hsm, /playground/interactive) do not.
  return (
    route.startsWith('/playground/') &&
    !['/playground/cacp', '/playground/hsm', '/playground/interactive'].includes(route)
  )
}

export function nextStepFor(route: string): NextStep | undefined {
  // eslint-disable-next-line security/detect-object-injection -- route is a literal from the calling component, not user input
  return NEXT_STEPS[route]
}
