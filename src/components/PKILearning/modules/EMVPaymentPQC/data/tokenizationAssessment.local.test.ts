// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { TokenizationProtectionComponent } from './emvConstants'
import { assessTokenizationProtection, withTokenizationAssessment } from './tokenizationAssessment'
import { TOKENIZATION_FLOWS } from './tokenizationData'

const symmetric: TokenizationProtectionComponent = {
  boundary: 'payload-protection',
  assessment: 'symmetric',
  provenance: 'authored-sample',
  description: 'AES-256 payload protection',
}
const classical: TokenizationProtectionComponent = {
  boundary: 'transport-authentication',
  assessment: 'classical-public-key',
  provenance: 'approved-shared-tls-assumption',
  description: 'RSA/ECDSA certificate authentication',
}
const unknown: TokenizationProtectionComponent = {
  boundary: 'internal-operation',
  assessment: 'unspecified',
  provenance: 'authored-sample',
  description: 'HSM operation with no specified algorithm',
}

describe('explicit tokenization protection assessment', () => {
  it('recognizes a declared symmetric-only boundary without claiming a complete protocol', () => {
    expect(assessTokenizationProtection([symmetric])).toBe('symmetric-only')
  })
  it('does not let AES/HMAC or an unknown operation cancel a known classical exposure', () => {
    expect(assessTokenizationProtection([symmetric, classical])).toBe('exposed')
    expect(assessTokenizationProtection([classical, unknown])).toBe('exposed')
  })
  it('does not turn unknown, missing, or mixed symmetric/unknown boundaries into safe outcomes', () => {
    expect(assessTokenizationProtection([unknown])).toBe('not-assessed')
    expect(assessTokenizationProtection([])).toBe('not-assessed')
    expect(assessTokenizationProtection([symmetric, unknown])).toBe('not-assessed')
  })
  it('retains classical certificate exposure when only a transport key-establishment fixture changes', () => {
    const transport: TokenizationProtectionComponent = {
      ...symmetric,
      boundary: 'transport-key-establishment',
      description: 'Explicitly symmetric test boundary, not a TLS profile',
    }
    expect(assessTokenizationProtection([transport, classical])).toBe('exposed')
    expect(
      assessTokenizationProtection([
        transport,
        { ...unknown, boundary: 'transport-authentication' },
      ])
    ).toBe('not-assessed')
    expect(assessTokenizationProtection([transport, symmetric])).toBe('symmetric-only')
  })
  it.each([
    [[symmetric], false],
    [[classical, unknown], true],
    [[unknown], null],
    [[], null],
  ] as const)(
    'derives the nullable compatibility flag without mutating its inputs (%j)',
    (components, expected) => {
      const step = {
        id: 'fixture',
        order: 1,
        label: 'Fixture',
        actor: 'Sample',
        description: 'Declared boundaries only',
        cryptoUsed: ['Fixture'],
        protectionComponents: [...components],
      }
      const before = structuredClone(step)
      const result = withTokenizationAssessment(step)
      expect(result.quantumVulnerable).toBe(expected)
      expect(step).toEqual(before)
      expect(result).not.toBe(step)
      expect(result.cryptoUsed).toEqual(before.cryptoUsed)
    }
  )
  it('preserves all eighteen IDs and records the shared TLS assumption separately from authored algorithms', () => {
    const steps = TOKENIZATION_FLOWS.flatMap((flow) => flow.steps)
    expect(steps.map((s) => s.id)).toEqual([
      'vts-1',
      'vts-2',
      'vts-3',
      'vts-4',
      'vts-5',
      'vts-6',
      'mdes-1',
      'mdes-2',
      'mdes-3',
      'mdes-4',
      'mdes-5',
      'mdes-6',
      'est-1',
      'est-2',
      'est-3',
      'est-4',
      'est-5',
      'est-6',
    ])
    const tlsIDs = ['vts-1', 'vts-2', 'vts-6', 'mdes-1', 'mdes-2', 'mdes-6', 'est-1', 'est-6']
    for (const id of tlsIDs) {
      const step = steps.find((s) => s.id === id)!
      const tls = step.protectionComponents.filter(
        (c) => c.provenance === 'approved-shared-tls-assumption'
      )
      expect(
        tls.map((c) => c.boundary),
        id
      ).toEqual(['transport-key-establishment', 'transport-authentication'])
      expect(
        tls.every((c) => c.assessment === 'classical-public-key'),
        id
      ).toBe(true)
      expect(step.quantumVulnerable, id).toBe(true)
    }
    const internal = steps.find((s) => s.id === 'est-2')!
    expect(internal.cryptoUsed).toEqual(['Internal HSM operations'])
    expect(internal.protectionComponents).toEqual([
      expect.objectContaining({
        boundary: 'internal-operation',
        assessment: 'unspecified',
        provenance: 'authored-sample',
      }),
    ])
    expect(internal.quantumVulnerable).toBeNull()
    for (const id of ['vts-3', 'mdes-2', 'mdes-3', 'est-3']) {
      const components = steps.find((s) => s.id === id)!.protectionComponents
      expect(
        components.some((c) => c.assessment === 'symmetric'),
        id
      ).toBe(true)
      expect(
        components.some((c) => c.assessment === 'classical-public-key'),
        id
      ).toBe(true)
    }
  })
})
