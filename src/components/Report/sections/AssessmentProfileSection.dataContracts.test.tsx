// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AssessmentProfileSummary } from './AssessmentProfileSection'
import { computeAssessment } from '@/hooks/assessment/orchestrator'

vi.mock(
  'framer-motion',
  async () => (await import('../../../test/mocks/framer-motion')).framerMotionMock
)

const base = {
  industry: 'Finance & Banking',
  currentCrypto: [] as string[],
  dataSensitivity: ['high'],
  complianceRequirements: [] as string[],
  migrationStatus: 'planning' as const,
}

describe('AssessmentProfileSummary', () => {
  it('shows the ticked families, not "None", when no specific algorithm was picked', () => {
    const result = computeAssessment({
      ...base,
      currentCryptoCategories: ['Key Exchange', 'Signatures'],
    })
    render(<AssessmentProfileSummary profile={result.assessmentProfile!} defaultOpen />)
    expect(
      screen.getByText('Key Exchange, Signatures (all algorithms assumed)')
    ).toBeInTheDocument()
  })

  it('shows the crypto libraries and automation of a full assessment', () => {
    const result = computeAssessment({
      ...base,
      cryptoAgility: 'hardcoded',
      cryptoLibraries: ['OpenSSL', 'BoringSSL'],
      infraAutomation: ['cert-manager'],
    })
    render(<AssessmentProfileSummary profile={result.assessmentProfile!} defaultOpen />)
    expect(screen.getByText('OpenSSL, BoringSSL')).toBeInTheDocument()
    expect(screen.getByText('cert-manager')).toBeInTheDocument()
  })
})
