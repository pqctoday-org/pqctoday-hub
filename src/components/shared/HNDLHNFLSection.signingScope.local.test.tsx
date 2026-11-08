// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HNDLHNFLSection } from './HNDLHNFLSection'
import { computeTNFLRiskWindow } from '@/hooks/assessment/riskWindows'
import type { AssessmentInput } from '@/hooks/assessmentTypes'

const input: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: [],
  dataSensitivity: ['high'],
  complianceRequirements: [],
  migrationStatus: 'planning',
  credentialLifetime: ['indefinite'],
}
afterEach(() => vi.useRealTimers())
const setup = (algorithms: string[]) => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-05T12:00:00Z'))
  const window = computeTNFLRiskWindow({ ...input, currentCrypto: algorithms })!
  render(<HNDLHNFLSection hnfl={window} />)
  return window
}

describe('credential-window narration follows lifetime and vulnerable-signing inputs separately', () => {
  it.each([{ algorithms: ['ML-DSA-65'] }, { algorithms: ['AES-256'] }, { algorithms: [] }])(
    'does not claim long-lived $algorithms credentials expire early merely because no vulnerable signature was selected',
    ({ algorithms }) => {
      const window = setup(algorithms)
      expect(window.hasSigningAlgorithms).toBe(false)
      expect(window.isAtRisk).toBe(false)
      expect(window.riskWindowYears).toBeGreaterThan(0)
      expect(screen.getByText(/The entered credential lifetime extends beyond/)).toBeVisible()
      expect(
        screen.getByText(/No Shor-vulnerable signing algorithm is recorded in this model/)
      ).toBeVisible()
      expect(
        screen.getByRole('img', { name: /Entered credential lifetime ends in 2126/ })
      ).toBeVisible()
      expect(screen.getByText(/beyond anchor; no vulnerable signing selection/)).toBeVisible()
      expect(
        screen.queryByText(/within safe window|Safe zone|Credential lifetimes expire before/)
      ).not.toBeInTheDocument()
    }
  )

  it('preserves the existing flagged classical-signature result and its actual window', () => {
    const window = setup(['RSA-2048'])
    expect(window.hasSigningAlgorithms).toBe(true)
    expect(window.isAtRisk).toBe(true)
    expect(
      screen.getByRole('img', {
        name: `Your credentials remain trusted ${window.riskWindowYears} years beyond the ${window.estimatedQuantumThreatYear} CRQC planning anchor.`,
      })
    ).toBeVisible()
    expect(screen.getByText(/Your credentials are trusted/)).toBeVisible()
    expect(screen.queryByText(/No Shor-vulnerable/)).not.toBeInTheDocument()
  })

  it('describes expiry exactly at the planning anchor as not extending beyond it', () => {
    render(
      <HNDLHNFLSection
        hnfl={{
          currentYear: 2026,
          credentialLifetimeYears: 10,
          estimatedQuantumThreatYear: 2036,
          crqcEstimateYear: 2036,
          isAtRisk: false,
          riskWindowYears: 0,
          hasSigningAlgorithms: true,
          tnflRelevantUseCases: [],
          isEstimated: false,
        }}
      />
    )
    expect(screen.getByRole('img', { name: /does not extend beyond the 2036/ })).toBeVisible()
    expect(
      screen.getByText(/This is a model comparison, not assurance of future security/)
    ).toBeVisible()
    expect(screen.getByText('not beyond planning anchor')).toBeVisible()
    expect(screen.queryByText(/expire before/)).not.toBeInTheDocument()
  })
})
