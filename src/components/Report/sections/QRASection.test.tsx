// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { QRASection } from './QRASection'
import type { AssessmentInput, AssessmentResult } from '../../../hooks/assessmentTypes'

// framer-motion is pulled in transitively via CollapsibleSection's tree; mock it
// so the section mounts deterministically in jsdom.
vi.mock(
  'framer-motion',
  async () => (await import('../../../test/mocks/framer-motion')).framerMotionMock
)

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

const renderQRA = (overrides?: Partial<AssessmentResult>) =>
  render(
    <MemoryRouter>
      <QRASection input={input} result={{ ...result, ...overrides }} />
    </MemoryRouter>
  )

describe('QRASection', () => {
  it('renders the five framework section headings', () => {
    renderQRA()
    expect(screen.getByText(/Executive Summary & Aggregate Maturity/i)).toBeInTheDocument()
    expect(screen.getByText('Estate Heatmap')).toBeInTheDocument()
    expect(screen.getByText('Prioritised Backlog')).toBeInTheDocument()
    expect(screen.getByText('Gap Analysis vs. Regulatory')).toBeInTheDocument()
    expect(screen.getByText('Compliance Mapping')).toBeInTheDocument()
  })

  it('shows the exec-summary headline numbers', () => {
    renderQRA()
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getAllByText(/Tier 2/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the estate heatmap domains', () => {
    renderQRA()
    expect(screen.getByText('Quantum Exposure')).toBeInTheDocument()
    expect(screen.getByText('Organizational Readiness')).toBeInTheDocument()
  })

  it('renders the prioritised backlog with owner selects', () => {
    renderQRA()
    expect(screen.getByText('Build a cryptographic inventory and CBOM.')).toBeInTheDocument()
    // One owner <select> per backlog item, keyboard-accessible via label.
    const selects = screen.getAllByLabelText(/Owner for action/i)
    expect(selects).toHaveLength(2)
  })

  it('allows re-assigning a backlog item owner', () => {
    renderQRA()
    const select = screen.getByLabelText('Owner for action 1') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'qrpm' } })
    expect(select.value).toBe('qrpm')
  })

  it('lists regulatory gaps for PQC-required frameworks only', () => {
    renderQRA()
    // FIPS 140-3 requiresPQC=true → a gap; PCI DSS requiresPQC=false → not a gap.
    expect(screen.getByText(/1 in-scope framework/i)).toBeInTheDocument()
  })

  it('maps all compliance frameworks with obligation badges', () => {
    renderQRA()
    expect(screen.getByText('PQC Required')).toBeInTheDocument()
    expect(screen.getByText('No PQC mandate yet')).toBeInTheDocument()
  })

  it('degrades gracefully when category scores are absent (quick mode)', () => {
    renderQRA({ categoryScores: undefined })
    expect(
      screen.getByText(/Estate heatmap needs the comprehensive assessment/i)
    ).toBeInTheDocument()
  })
})
