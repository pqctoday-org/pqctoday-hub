// SPDX-License-Identifier: GPL-3.0-only
/**
 * Reference estates — B+ remediation 4.4 (2026-08-10).
 *
 * "Add a scenario mode for researcher — assess a documented reference estate
 * rather than your own." The wizard asks a researcher to describe an
 * organisation and an estate they very often do not have, so they answer "I
 * don't know" to the questions that carry the most weight, and the report they
 * get is correspondingly weak. That is the review's own diagnosis, and it
 * applies to anyone evaluating the tool rather than using it on themselves.
 *
 * WHAT THESE ARE, AND ARE NOT. Each entry is a COMPOSITE reference profile
 * assembled from publicly documented sector characteristics — not a real
 * organisation, not a claim about any particular one, and not survey data.
 * `basis` states, per estate, what the shape is drawn from, so a researcher can
 * judge it rather than trust it. `caveat` is the sentence the report carries so
 * a reader who did not run it cannot mistake the output for a real assessment.
 *
 * That honesty is the whole design constraint. A scenario mode that produced
 * something indistinguishable from a real report would be worse than no
 * scenario mode: the report is exportable, and an exported document has no
 * memory of how it was made.
 */
import type { AssessmentInput } from '../hooks/assessmentTypes'

export interface ReferenceEstate {
  id: string
  /** Short name for the picker. */
  label: string
  /** One line: who this is, in plain terms. */
  summary: string
  /** What the shape is drawn from. Shown in the picker, not hidden in a tooltip. */
  basis: string
  /** The sentence the report carries while this scenario is active. */
  caveat: string
  /**
   * The answers themselves. Field names match the assessment form store, and
   * every value must be a real option from that step — `assessmentScenarios.test.ts`
   * checks the ones with a fixed vocabulary, so a renamed option cannot leave a
   * scenario silently half-filled.
   */
  answers: {
    industry: string
    country: string
    currentCrypto: string[]
    currentCryptoCategories: string[]
    dataSensitivity: string[]
    complianceRequirements: string[]
    migrationStatus: NonNullable<AssessmentInput['migrationStatus']>
    cryptoUseCases: string[]
    dataRetention: string[]
    credentialLifetime: string[]
    systemCount: NonNullable<AssessmentInput['systemCount']>
    teamSize: NonNullable<AssessmentInput['teamSize']>
    cryptoAgility: NonNullable<AssessmentInput['cryptoAgility']>
    infrastructure: string[]
    vendorDependency: NonNullable<AssessmentInput['vendorDependency']>
    timelinePressure: NonNullable<AssessmentInput['timelinePressure']>
  }
}

export const REFERENCE_ESTATES: ReferenceEstate[] = [
  {
    id: 'retail-bank',
    label: 'Mid-size retail bank',
    summary:
      'A regional retail bank: card payments, long-lived customer records, a regulator with a published date, and a large vendor-supplied core.',
    basis:
      'Shaped from publicly stated finance-sector characteristics — PCI DSS 4.0 and DORA applicability, the sector’s typical multi-decade record retention, and the well-documented dependence on vendor core-banking platforms. Not modelled on any named institution.',
    caveat:
      'This report was produced from a reference estate, not from your own systems. The numbers are correct for the profile described; they are not a finding about any real organisation.',
    answers: {
      industry: 'Finance & Banking',
      country: 'United States',
      currentCrypto: ['RSA-2048', 'ECDH P-256', 'AES-256'],
      currentCryptoCategories: ['Key Exchange', 'Signatures', 'Encryption'],
      dataSensitivity: ['critical'],
      complianceRequirements: ['PCI DSS', 'DORA (EU Digital Operational Resilience)', 'ISO 27001'],
      migrationStatus: 'planning',
      cryptoUseCases: [
        'TLS/HTTPS',
        'Card payment encryption',
        'Data-at-rest encryption',
        'Digital signatures / code signing',
      ],
      dataRetention: ['10-25y'],
      credentialLifetime: ['3-10y'],
      systemCount: '51-200',
      teamSize: '11-50',
      cryptoAgility: 'partially-abstracted',
      infrastructure: ['Cloud', 'Application', 'Database'],
      vendorDependency: 'heavy-vendor',
      timelinePressure: 'within-2-3y',
    },
  },
  {
    id: 'hospital-group',
    label: 'Hospital group',
    summary:
      'A multi-site healthcare provider: patient records that stay sensitive for a lifetime, connected medical devices nobody can patch quickly.',
    basis:
      'Shaped from publicly stated healthcare characteristics — HIPAA applicability, lifetime-of-patient record sensitivity, and the documented difficulty of updating certified medical devices. Not modelled on any named provider.',
    caveat:
      'This report was produced from a reference estate, not from your own systems. The numbers are correct for the profile described; they are not a finding about any real organisation.',
    answers: {
      industry: 'Healthcare',
      country: 'United States',
      currentCrypto: ['RSA-2048', 'ECDH P-256', 'AES-256'],
      currentCryptoCategories: ['Key Exchange', 'Encryption'],
      dataSensitivity: ['critical'],
      complianceRequirements: ['HIPAA', 'HITECH Act', 'FDA 21 CFR Part 11'],
      migrationStatus: 'not-started',
      cryptoUseCases: [
        'TLS/HTTPS',
        'EHR/FHIR data exchange',
        'Medical device communication',
        'Data-at-rest encryption',
      ],
      dataRetention: ['indefinite'],
      credentialLifetime: ['10-25y'],
      systemCount: '51-200',
      teamSize: '1-10',
      cryptoAgility: 'hardcoded',
      infrastructure: ['OS', 'Hardware', 'Network'],
      vendorDependency: 'heavy-vendor',
      timelinePressure: 'no-deadline',
    },
  },
]

export function findReferenceEstate(id: string | null): ReferenceEstate | undefined {
  if (!id) return undefined
  return REFERENCE_ESTATES.find((e) => e.id === id)
}
