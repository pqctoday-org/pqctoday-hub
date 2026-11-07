// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QRASection } from './QRASection'
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'
vi.mock('framer-motion', async () => (await import('@/test/mocks/framer-motion')).framerMotionMock)
const input: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: ['RSA-2048'],
  dataSensitivity: ['high'],
  complianceRequirements: ['FIPS 140-3', 'PCI DSS'],
  migrationStatus: 'not-started',
  country: 'United States',
}

const result: AssessmentResult = {
  riskScore: 72,
  riskLevel: 'high',
  algorithmMigrations: [],
  complianceImpacts: [
    {
      framework: 'FIPS 140-3',
      requiresPQC: true,
      deadline: '2030 (NIST deprecation target)',
      notes: 'CMVP validation will require PQC.',
    },
    {
      framework: 'PCI DSS',
      requiresPQC: false,
      deadline: 'No explicit PQC timeline yet',
      notes: 'Will follow NIST guidance.',
    },
  ],
  recommendedActions: [
    {
      priority: 1,
      action: 'Build a cryptographic inventory and CBOM.',
      category: 'immediate',
      relatedModule: '/migrate',
    },
    {
      priority: 2,
      action: 'Pilot ML-KEM in internet-facing TLS.',
      category: 'short-term',
      relatedModule: '/migrate',
    },
  ],
  narrative: 'High quantum risk.',
  generatedAt: '2026-06-13T00:00:00.000Z',
  categoryScores: {
    quantumExposure: 80,
    migrationComplexity: 60,
    regulatoryPressure: 70,
    organizationalReadiness: 30,
  },
}

it('keeps report scenario years without attributing survey quantiles or a most-likely year', () => {
  render(
    <MemoryRouter>
      <QRASection input={input} result={result} />
    </MemoryRouter>
  )
  const anchors = screen.getByText(/earlier ~2030/)
  expect(anchors).toHaveTextContent('earlier ~2030')
  expect(anchors).toHaveTextContent('central ~2035')
  expect(anchors).toHaveTextContent('later ~2040')
  expect(anchors).toHaveTextContent(
    'not survey forecast quantiles or a published most-likely arrival year'
  )
  expect(anchors).toHaveTextContent('site’s own conservative planning figure'.replace('’', "'"))
  expect(anchors).not.toHaveTextContent('Source of the window')
})
