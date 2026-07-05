// SPDX-License-Identifier: GPL-3.0-only
/**
 * sectorTrack — optional, non-gating learn steps surfaced alongside the phase
 * tree for sector-specific organisations. These steps never affect maturity or
 * gating; they direct the player to an industry-relevant module that the core
 * framework tree (which is sector-neutral) does not reference.
 *
 * Completion is tracked via the learn module's own completion state
 * (useModuleStore progress) — the same path as tree `kind='learn'` steps —
 * NOT via visitedRefs (which is for reference steps).
 *
 * sectorTrack.test.ts asserts every moduleId here resolves in SIM_LEARN_MODULES
 * so a renamed module fails CI instead of silently breaking.
 */
import type { PhaseId } from '@/data/frameworkPhases'

export interface SectorStep {
  moduleId: string
  label: string
  /** Deep link to the learn module. */
  to: string
}

/**
 * Sector-specific optional steps per phase.
 * Key: sector id matching useSimulationStore.sector (from SECTOR_SEEDS).
 * Value: map of PhaseId → steps to surface in that phase's rail.
 *
 * Use arrays so a phase can have more than one sector module.
 * Keep 2 entries per sector: one early phase (discovery/governance context)
 * and one operational phase (deployment/supply-chain context).
 */
export const SECTOR_STEPS: Partial<Record<string, Partial<Record<PhaseId, SectorStep[]>>>> = {
  financial: {
    p0: [
      {
        moduleId: 'pqc-grc',
        label: 'PQC governance, risk & compliance for financial services',
        to: '/learn/pqc-grc',
      },
    ],
    p5: [
      {
        moduleId: 'iam-pqc',
        label: 'Identity & access management PQC migration for financial services',
        to: '/learn/iam-pqc',
      },
    ],
    p7: [
      {
        moduleId: 'vendor-risk',
        label: 'Vendor & third-party PQC risk for financial services',
        to: '/learn/vendor-risk',
      },
    ],
  },
  healthcare: {
    p0: [
      {
        moduleId: 'healthcare-pqc',
        label: 'PQC migration primer for healthcare & life sciences',
        to: '/learn/healthcare-pqc',
      },
    ],
    p2: [
      {
        moduleId: 'healthcare-pqc',
        label: 'HIPAA / HL7 FHIR cryptographic inventory for healthcare',
        to: '/learn/healthcare-pqc',
      },
    ],
  },
  government: {
    p0: [
      {
        moduleId: 'aerospace-pqc',
        label: 'PQC migration for government & defense',
        to: '/learn/aerospace-pqc',
      },
    ],
    p3: [
      {
        moduleId: 'standards-bodies',
        label: 'NIST / CISA / NSA standards for government migration',
        to: '/learn/standards-bodies',
      },
    ],
    p5: [
      {
        moduleId: 'pki-enrollment-protocols',
        label: 'PKI enrollment protocols for government credentialing (PIV/CAC-style)',
        to: '/learn/pki-enrollment-protocols',
      },
    ],
  },
  energy: {
    p0: [
      {
        moduleId: 'energy-utilities-pqc',
        label: 'PQC for energy & utilities — OT/ICS context',
        to: '/learn/energy-utilities-pqc',
      },
    ],
    p4: [
      {
        moduleId: 'iot-ot-pqc',
        label: 'IoT/OT device migration for operational technology',
        to: '/learn/iot-ot-pqc',
      },
    ],
  },
  telecom: {
    p0: [
      {
        moduleId: '5g-security',
        label: '5G PQC security — SUCI, SUPI, and network slicing',
        to: '/learn/5g-security',
      },
    ],
    p5: [
      {
        moduleId: 'network-security-pqc',
        label: 'PQC deployment patterns for telecom network infrastructure',
        to: '/learn/network-security-pqc',
      },
      {
        moduleId: 'api-security-jwt',
        label: 'API & JWT security for telecom network-API exposure (Open Gateway)',
        to: '/learn/api-security-jwt',
      },
    ],
  },
  retail: {
    p0: [
      {
        moduleId: 'emv-payment-pqc',
        label: 'PQC for payment systems — EMV, PCI DSS & contactless',
        to: '/learn/emv-payment-pqc',
      },
    ],
    p5: [
      {
        moduleId: 'email-signing',
        label: 'Transactional email & receipt signing PQC migration for retail',
        to: '/learn/email-signing',
      },
    ],
    p7: [
      {
        moduleId: 'database-encryption-pqc',
        label: 'Database & data-at-rest PQC for retail & e-commerce',
        to: '/learn/database-encryption-pqc',
      },
    ],
  },
  general: {
    p0: [
      {
        moduleId: 'crypto-agility',
        label: 'Crypto agility — building algorithm-agile systems',
        to: '/learn/crypto-agility',
      },
    ],
    p5: [
      {
        moduleId: 'network-security-pqc',
        label: 'PQC deployment patterns for network infrastructure',
        to: '/learn/network-security-pqc',
      },
    ],
  },
}

/**
 * Return the sector-specific steps for a given sector and phase.
 * Returns an empty array when no steps are configured for that combination.
 */
export function sectorStepsForPhase(sector: string, phase: PhaseId): SectorStep[] {
  return SECTOR_STEPS[sector]?.[phase] ?? []
}
