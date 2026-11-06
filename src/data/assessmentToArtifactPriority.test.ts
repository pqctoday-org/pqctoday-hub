// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getArtifactSuggestion } from './assessmentToArtifactPriority'
import type { AssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'

const baseInput: AssessmentInput = {
  industry: 'finance',
  currentCrypto: [],
  dataSensitivity: ['high'],
  complianceRequirements: [],
  migrationStatus: 'started',
}

const snap = (
  input: Partial<AssessmentInput> | null,
  result: Partial<AssessmentResult> | null = null
): AssessmentSnapshot => {
  const fullInput = input === null ? null : { ...baseInput, ...input }
  return {
    input: fullInput,
    result: result === null ? null : ({ ...result } as AssessmentResult),
    hasAssessment: fullInput !== null || result !== null,
    completedAt: null,
  }
}

describe('getArtifactSuggestion', () => {
  it('returns null when no assessment exists', () => {
    const empty: AssessmentSnapshot = {
      input: null,
      result: null,
      hasAssessment: false,
      completedAt: null,
    }
    expect(getArtifactSuggestion('crypto-cbom', empty)).toBeNull()
  })

  it('suggests CBOM when current crypto is reported', () => {
    expect(
      getArtifactSuggestion('crypto-cbom', snap({ currentCrypto: ['RSA-2048'] }))?.reason
    ).toMatch(/current cryptography/i)
  })

  it('suggests CBOM when crypto is unknown', () => {
    expect(
      getArtifactSuggestion('crypto-cbom', snap({ currentCryptoUnknown: true }))?.reason
    ).toMatch(/unknown/i)
  })

  it('suggests migration roadmap on tight timeline', () => {
    expect(
      getArtifactSuggestion('migration-roadmap', snap({ timelinePressure: 'within-1y' }))
    ).not.toBeNull()
  })

  it('suggests compliance timeline when frameworks are selected', () => {
    expect(
      getArtifactSuggestion('compliance-timeline', snap({ complianceRequirements: ['DORA'] }))
    ).not.toBeNull()
  })

  it('suggests policy draft when crypto agility is hardcoded', () => {
    expect(
      getArtifactSuggestion('policy-draft', snap({ cryptoAgility: 'hardcoded' }))
    ).not.toBeNull()
  })

  it('suggests risk register when risk level is high', () => {
    const result = { riskLevel: 'high' } as AssessmentResult
    expect(getArtifactSuggestion('risk-register', snap({}, result))).not.toBeNull()
  })

  it('suggests crqc-scenario for long retention', () => {
    expect(
      getArtifactSuggestion('crqc-scenario', snap({ dataRetention: ['25-plus'] }))
    ).not.toBeNull()
  })

  it('suggests crypto-architecture when use cases are reported', () => {
    expect(
      getArtifactSuggestion('crypto-architecture', snap({ cryptoUseCases: ['tls', 'storage'] }))
    ).not.toBeNull()
  })

  it('suggests vendor-scorecard for heavy vendor dependency', () => {
    expect(
      getArtifactSuggestion('vendor-scorecard', snap({ vendorDependency: 'heavy-vendor' }))
    ).not.toBeNull()
  })

  it('suggests deployment playbook when infrastructure layers are reported', () => {
    expect(
      getArtifactSuggestion('deployment-playbook', snap({ infrastructure: ['Cloud', 'OnPrem'] }))
    ).not.toBeNull()
  })

  it('suggests vulnerability watch for quantum-vulnerable algos', () => {
    expect(
      getArtifactSuggestion('crypto-vulnerability-watch', snap({ currentCrypto: ['RSA-2048'] }))
    ).not.toBeNull()
    expect(
      getArtifactSuggestion('crypto-vulnerability-watch', snap({ currentCrypto: ['ML-KEM-768'] }))
    ).toBeNull()
  })

  it('returns null for unknown artifact types', () => {
    expect(
      getArtifactSuggestion('audit-checklist', snap({ complianceRequirements: [] }))
    ).toBeNull()
  })

  it('suggests supply-chain-matrix for high-vendor-exposure industries', () => {
    expect(
      getArtifactSuggestion('supply-chain-matrix', snap({ industry: 'Finance & Banking' }))?.reason
    ).toMatch(/third-party crypto/i)
    expect(getArtifactSuggestion('supply-chain-matrix', snap({ industry: 'Other' }))).toBeNull()
  })

  it('suggests board-deck for high-board-visibility industries', () => {
    expect(
      getArtifactSuggestion('board-deck', snap({ industry: 'Government & Defense' }))?.reason
    ).toMatch(/visibility of cryptographic risk/i)
  })

  it('suggests audit-checklist when country has a known jurisdiction, as a conditional pointer', () => {
    const reason = getArtifactSuggestion('audit-checklist', snap({ country: 'Germany' }))?.reason
    expect(reason).toMatch(/BSI TR-02102/i)
    expect(reason).toMatch(/if .* applies to your organization/i)
  })

  it('suggests compliance-timeline from country jurisdiction when frameworks empty', () => {
    expect(
      getArtifactSuggestion('compliance-timeline', snap({ country: 'United States' }))?.reason
    ).toMatch(/OMB M-23-02/i)
  })

  describe('country selection alone does not create a legal duty', () => {
    const countries = [
      'United States',
      'Canada',
      'European Union',
      'United Kingdom',
      'France',
      'Germany',
      'Japan',
      'South Korea',
      'Australia',
      'Singapore',
      'China',
    ]
    // Phrases that present a framework as a duty simply because of the country.
    const dutyWording =
      /(sits under|audits expected|usually require|typically requires?|expect a written|requires? board)/i

    it.each(countries)(
      '%s: out-of-scope reader (no frameworks selected) gets a check-applicability prompt',
      (country) => {
        for (const type of ['compliance-timeline', 'audit-checklist'] as const) {
          const reason = getArtifactSuggestion(type, snap({ country }))?.reason ?? ''
          expect(reason).not.toBe('')
          expect(reason).not.toMatch(dutyWording)
          expect(reason).toMatch(/applies to your organization|not show that it applies/i)
        }
      }
    )

    it('in-scope reader who selected a framework is pointed to that framework, not the country', () => {
      const snapshot = snap({ country: 'United States', complianceRequirements: ['OMB M-23-02'] })
      expect(getArtifactSuggestion('compliance-timeline', snapshot)?.reason).toMatch(
        /you selected compliance frameworks/i
      )
      expect(getArtifactSuggestion('audit-checklist', snapshot)?.reason).toMatch(
        /frameworks you selected may call for audit evidence/i
      )
      expect(getArtifactSuggestion('policy-draft', snapshot)?.reason).toMatch(/you selected/i)
    })

    it('does not state a board attestation requirement for any listed industry', () => {
      for (const industry of [
        'Finance & Banking',
        'Government & Defense',
        'Healthcare',
        'Aerospace',
      ]) {
        const reason = getArtifactSuggestion('board-deck', snap({ industry }))?.reason ?? ''
        expect(reason).not.toMatch(/attestation/i)
        expect(reason).toMatch(/not a requirement/i)
      }
    })
  })

  it('suggests risk-register for high-sensitivity data', () => {
    expect(
      getArtifactSuggestion('risk-register', snap({ dataSensitivity: ['critical'] }))?.reason
    ).toMatch(/high-sensitivity data/i)
  })

  it('suggests crqc-scenario for high-sensitivity data', () => {
    expect(
      getArtifactSuggestion('crqc-scenario', snap({ dataSensitivity: ['regulated'] }))?.reason
    ).toMatch(/high-sensitivity data/i)
  })
})
