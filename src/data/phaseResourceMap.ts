// SPDX-License-Identifier: GPL-3.0-only
/**
 * phaseResourceMap — the many-to-many phase ↔ hub-resource overlay.
 *
 * Each Learn module / Command-Center tool carries a single `frameworkPhase`
 * (its primary "home"). Real coverage is many-to-many: `crypto-mgmt-modernization`
 * (tagged `foundations`) teaches P1 + P2; `pqc-testing-validation` (tagged `p6`)
 * hosts the P1 discovery labs. Any surface that filters on `frameworkPhase === p`
 * therefore under-counts. This map is the content-verified overlay that fixes that.
 *
 * Source of truth: reports/framework-gap/phase_resource_crosscheck_06132026.csv.
 * Maintained by hand; phaseResourceMap.test.ts guards it against registry drift.
 * `frameworkPhase` stays the primary badge and MUST be ∈ `phasesServed`.
 *
 * Split by registry because 6 ids collide across the learn and playground
 * registries (pki-workshop, email-signing, slh-dsa, api-security-jwt,
 * mls-group-messaging, digital-id) — a flat id-keyed map would overwrite them.
 */
import type { PhaseId } from './frameworkPhases'

export type ResourceLeg = 'learn' | 'practice' | 'reference' | 'output'

export interface PhaseResource {
  /** Content-verified phases this resource serves. Includes the primary frameworkPhase. */
  phasesServed: PhaseId[]
  /** Which framework legs this resource provides. */
  legs: ResourceLeg[]
}

export const LEARN_PHASES: Record<string, PhaseResource> = {
  'pqc-101': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'quantum-threats': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'pqc-candidates': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'hybrid-crypto': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'crypto-agility': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'crypto-mgmt-modernization': {
    phasesServed: ['p1', 'p2'],
    legs: ['learn', 'practice', 'reference'],
  },
  'tls-basics': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'vpn-ssh-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'email-signing': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'mls-group-messaging': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'pki-workshop': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'pki-enrollment-protocols': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'kms-pqc': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'hsm-pqc': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'slh-dsa': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'stateful-signatures': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'digital-assets': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  '5g-security': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'digital-id': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'entropy-randomness': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'merkle-tree-certs': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  qkd: { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'code-signing': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'api-security-jwt': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'crypto-dev-apis': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'web-gateway-pqc': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'iot-ot-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'pqc-risk-management': { phasesServed: ['p3'], legs: ['learn', 'reference'] },
  'pqc-business-case': { phasesServed: ['p0'], legs: ['learn', 'reference'] },
  'pqc-governance': { phasesServed: ['p0'], legs: ['learn', 'reference'] },
  'pqc-team': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'vendor-risk': { phasesServed: ['p7'], legs: ['learn', 'reference'] },
  'migration-program': { phasesServed: ['p4'], legs: ['learn', 'reference'] },
  'compliance-strategy': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'data-asset-sensitivity': { phasesServed: ['p1', 'p3'], legs: ['learn', 'reference'] },
  'standards-bodies': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'confidential-computing': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'database-encryption-pqc': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'energy-utilities-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'emv-payment-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'ai-security-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'platform-eng-pqc': { phasesServed: ['p1', 'p5'], legs: ['learn', 'practice', 'reference'] },
  'healthcare-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'aerospace-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'automotive-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'exec-quantum-impact': { phasesServed: ['p0'], legs: ['learn', 'reference'] },
  'dev-quantum-impact': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'arch-quantum-impact': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'ops-quantum-impact': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'research-quantum-impact': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'secrets-management-pqc': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'network-security-pqc': { phasesServed: ['p6'], legs: ['learn', 'practice', 'reference'] },
  'pqc-testing-validation': { phasesServed: ['p6'], legs: ['learn', 'practice', 'reference'] },
  'iam-pqc': { phasesServed: ['p5'], legs: ['learn', 'reference'] },
  'secure-boot-pqc': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'os-pqc': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'soc-implementation-pqc': { phasesServed: ['p6'], legs: ['learn', 'reference'] },
  'pqc-grc': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  'skills-team-structure': { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
  quiz: { phasesServed: ['foundations'], legs: ['learn', 'reference'] },
}

export const BUSINESS_PHASES: Record<string, PhaseResource> = {
  'roi-calculator': { phasesServed: ['p0'], legs: ['practice', 'output'] },
  'board-pitch': { phasesServed: ['p0'], legs: ['practice', 'output'] },
  'crqc-scenario': { phasesServed: ['p0'], legs: ['practice', 'output'] },
  'risk-register': { phasesServed: ['p3'], legs: ['practice', 'output'] },
  'risk-treatment-plan': { phasesServed: ['p3'], legs: ['practice', 'output'] },
  'compliance-checklist': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'audit-checklist': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'compliance-timeline': { phasesServed: ['p4'], legs: ['practice', 'output'] },
  'raci-builder': { phasesServed: ['p0'], legs: ['practice', 'output'] },
  'policy-generator': { phasesServed: ['p0'], legs: ['practice', 'output'] },
  'kpi-dashboard': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'vendor-scorecard': { phasesServed: ['p7'], legs: ['practice', 'output'] },
  'contract-clause': { phasesServed: ['p7'], legs: ['practice', 'output'] },
  'supply-chain-matrix': { phasesServed: ['p7'], legs: ['practice', 'output'] },
  'roadmap-builder': { phasesServed: ['p4'], legs: ['practice', 'output'] },
  'stakeholder-comms': { phasesServed: ['p4'], legs: ['practice', 'output'] },
  'kpi-tracker': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'deployment-playbook': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'hybrid-transition-planner': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'mti-negotiator': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'crypto-api-refactor-audit': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'cloud-responsibility-matrix': { phasesServed: ['p7'], legs: ['practice', 'output'] },
  'crypto-architecture-diagram': { phasesServed: ['p1'], legs: ['practice', 'output'] },
  'management-tools-audit': { phasesServed: ['p1'], legs: ['practice', 'output'] },
  'crypto-cbom-builder': { phasesServed: ['p2'], legs: ['practice', 'output'] },
  'crypto-vulnerability-watch': { phasesServed: ['p1'], legs: ['practice', 'output'] },
  'program-charter': { phasesServed: ['p0'], legs: ['practice', 'output'] },
  'initial-scoping': { phasesServed: ['p0'], legs: ['practice', 'output'] },
  'skills-team-plan': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'infra-modernization-planner': { phasesServed: ['p6'], legs: ['practice', 'output'] },
  'refresh-cycle-alignment': { phasesServed: ['p4'], legs: ['practice', 'output'] },
  'accelerated-execution-profile': { phasesServed: ['p4'], legs: ['practice', 'output'] },
  'data-at-rest-strategy': { phasesServed: ['p5'], legs: ['practice', 'output'] },
}

export const PLAYGROUND_PHASES: Record<string, PhaseResource> = {
  'qrng-demo': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'rng-demo': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'entropy-test': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'source-combining': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'drbg-demo': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'kdf-derivation': { phasesServed: ['foundations'], legs: ['practice', 'output'] },
  'tls-simulator': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'hybrid-encrypt': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'envelope-encrypt': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'vpn-sim': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'pqc-ssh-sim': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'suci-flow': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'firmware-signing': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'token-migration': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'hybrid-sigs': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'email-signing': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'api-security-jwt': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'mls-group-messaging': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'digital-id': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'bitcoin-flow': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'solana-flow': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'hd-wallet': { phasesServed: ['p5'], legs: ['practice', 'output'] },
  'pki-workshop': { phasesServed: ['p6'], legs: ['practice', 'output'] },
  'hybrid-certs': { phasesServed: ['p5', 'p6'], legs: ['practice', 'output'] },
  'merkle-proof': { phasesServed: ['p6'], legs: ['practice', 'output'] },
  'cert-capacity': { phasesServed: ['p6'], legs: ['practice', 'output'] },
  'hsm-capacity': { phasesServed: ['p6'], legs: ['practice', 'output'] },
  'tpm-playground': { phasesServed: ['p6'], legs: ['practice', 'output'] },
  'tee-channel': { phasesServed: ['p6'], legs: ['practice', 'output'] },
  'pki-enrollment': { phasesServed: ['p5', 'p6'], legs: ['practice', 'output'] },
  'slh-dsa': { phasesServed: ['foundations', 'p5'], legs: ['practice', 'output'] },
  'lms-hss': { phasesServed: ['foundations', 'p5'], legs: ['practice', 'output'] },
  'openssl-studio': { phasesServed: ['foundations', 'p5'], legs: ['practice', 'output'] },
}

/**
 * Reference pages / engines / report sections. These are not registry-backed
 * (synthetic ids), so the drift guard skips them. `deepUrl` is the param-level
 * entry point a phase-driven surface navigates to.
 */
export interface ReferenceResource extends PhaseResource {
  deepUrl: string
}

export const REFERENCE_PHASES: Record<string, ReferenceResource> = {
  'algorithms-catalog': {
    phasesServed: ['p3', 'p5', 'p6'],
    legs: ['reference'],
    deepUrl: '/algorithms',
  },
  'algorithms-protocol-matrix': {
    phasesServed: ['p3', 'p5', 'p6', 'p7'],
    legs: ['reference'],
    deepUrl: '/algorithms?tab=support',
  },
  'algorithms-transition': {
    phasesServed: ['p3', 'p5'],
    legs: ['reference'],
    deepUrl: '/algorithms?tab=transition',
  },
  'algorithms-detailed': {
    // Surfaced in the P3 resource rail at parity with the Transition tab so the
    // detailed candidate comparison (the analysis that informs the architecture
    // decision) is reachable immediately, not only deep in a later activity.
    phasesServed: ['p3'],
    legs: ['reference'],
    deepUrl: '/algorithms?tab=detailed',
  },
  timeline: { phasesServed: ['p3', 'p4'], legs: ['reference'], deepUrl: '/timeline' },
  compliance: {
    phasesServed: ['p3', 'p4', 'p7'],
    legs: ['reference', 'output'],
    deepUrl: '/compliance',
  },
  'compliance-cert-check': {
    phasesServed: ['p6', 'p7'],
    legs: ['reference'],
    deepUrl: '/compliance?cert=',
  },
  threats: { phasesServed: ['p3'], legs: ['reference'], deepUrl: '/threats' },
  migrate: {
    phasesServed: ['p1', 'p2', 'p5', 'p6'],
    legs: ['reference', 'practice', 'output'],
    deepUrl: '/migrate',
  },
  library: { phasesServed: ['p1', 'p2', 'p5'], legs: ['reference'], deepUrl: '/library' },
  'assess-engine': { phasesServed: ['p1', 'p3'], legs: ['practice', 'output'], deepUrl: '/assess' },
  report: { phasesServed: ['p3', 'p4'], legs: ['output'], deepUrl: '/report' },
}

export type ResourceKind = 'learn' | 'business' | 'playground' | 'reference'

const MAPS: Record<ResourceKind, Record<string, PhaseResource>> = {
  learn: LEARN_PHASES,
  business: BUSINESS_PHASES,
  playground: PLAYGROUND_PHASES,
  reference: REFERENCE_PHASES,
}

/** Does the given resource serve the given phase (by content, not just its tag)? */
export function servesPhase(kind: ResourceKind, id: string, phase: PhaseId): boolean {
  return MAPS[kind][id]?.phasesServed.includes(phase) ?? false
}

/** All resource ids of a kind that serve a phase, optionally filtered by leg. */
export function resourcesForPhase(kind: ResourceKind, phase: PhaseId, leg?: ResourceLeg): string[] {
  return Object.entries(MAPS[kind])
    .filter(([, r]) => r.phasesServed.includes(phase) && (!leg || r.legs.includes(leg)))
    .map(([id]) => id)
}

/** Every phase a resource serves (empty if unknown). */
export function phasesFor(kind: ResourceKind, id: string): PhaseId[] {
  return MAPS[kind][id]?.phasesServed ?? []
}
