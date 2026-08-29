// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ReportContent } from './ReportContent'
import '@testing-library/jest-dom'
import type { AssessmentResult } from '../../hooks/assessmentTypes'
import { usePersonaStore } from '../../store/usePersonaStore'

// Mock framer-motion
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

// Mock collapsible-section children (always mounted in DOM for print support)
vi.mock('./ReportTimelineStrip', () => ({
  ReportTimelineStrip: () => <div data-testid="report-timeline-strip" />,
}))

vi.mock('./ReportThreatsAppendix', () => ({
  ReportThreatsAppendix: () => <div data-testid="report-threats-appendix" />,
  ASSESS_TO_THREATS_INDUSTRY: { Technology: ['IT Industry / Software'] },
}))

vi.mock('./MigrationToolkit', () => ({
  MigrationToolkit: () => <div data-testid="migration-toolkit" />,
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockStore = {
  reset: vi.fn(),
  editFromStep: vi.fn(),
  getInput: vi.fn(() => ({
    industry: 'Technology',
    currentCrypto: ['RSA-2048'],
    dataSensitivity: ['high'],
    complianceRequirements: ['FIPS 140-3'],
    migrationStatus: 'not-started' as const,
  })),
  previousRiskScore: null as number | null,
  lastModifiedAt: null as string | null,
  industry: 'Technology',
  country: 'United States',
  dataSensitivity: ['high'],
  currentCrypto: ['RSA-2048'],
  cryptoUnknown: false,
  infrastructure: [] as string[],
  hiddenThreats: [] as string[],
  hideThreat: vi.fn(),
  restoreAllThreats: vi.fn(),
}

vi.mock('../../store/useAssessmentStore', () => ({
  useAssessmentStore: Object.assign(
    (selector?: (s: typeof mockStore) => unknown) => (selector ? selector(mockStore) : mockStore),
    { getState: () => mockStore }
  ),
}))

// Mock URL methods for CSV export
URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL

const baseResult: AssessmentResult = {
  riskScore: 65,
  riskLevel: 'high',
  algorithmMigrations: [
    {
      classical: 'RSA-2048',
      quantumVulnerable: true,
      replacement: 'ML-KEM-768 / ML-DSA-65',
      urgency: 'immediate',
      notes: "Broken by Shor's algorithm.",
    },
    {
      classical: 'AES-256',
      quantumVulnerable: false,
      replacement: 'No change needed',
      urgency: 'long-term',
      notes: 'Quantum-safe.',
    },
  ],
  complianceImpacts: [
    {
      framework: 'FIPS 140-3',
      requiresPQC: true,
      deadline: '2030 (NIST deprecation target)',
      notes: 'CMVP validation will require PQC algorithm support.',
    },
    {
      framework: 'PCI DSS',
      requiresPQC: false,
      deadline: 'No explicit PQC timeline yet',
      notes: 'Payment card industry will follow NIST guidance.',
    },
  ],
  recommendedActions: [
    {
      priority: 1,
      action: 'Migrate 1 quantum-vulnerable algorithm to PQC equivalents.',
      category: 'immediate',
      relatedModule: '/algorithms',
    },
    {
      priority: 2,
      action: 'Implement hybrid PQC encryption for data-at-rest.',
      category: 'short-term',
      relatedModule: '/threats',
    },
    {
      priority: 3,
      action: 'Build PQC awareness across teams.',
      category: 'long-term',
      relatedModule: '/learn',
    },
  ],
  narrative:
    'Your organization in the Technology sector has a quantum risk score of 65/100 (high).',
  generatedAt: '2026-02-16T00:00:00.000Z',
}

const renderReport = (result = baseResult) =>
  render(
    <MemoryRouter>
      <ReportContent result={result} />
    </MemoryRouter>
  )

describe('ReportContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  describe('header', () => {
    it('renders the methodology info button', () => {
      renderReport()
      expect(screen.getByRole('button', { name: /How this report works/i })).toBeInTheDocument()
    })

    it('renders the generated date from result', () => {
      renderReport()
      expect(screen.getByText(/Generated on.*2026/)).toBeInTheDocument()
    })
  })

  describe('risk gauge', () => {
    it('renders SVG gauge with accessible label', () => {
      renderReport()
      expect(
        screen.getByRole('img', { name: /Risk score: 65 out of 100.*High Risk/ })
      ).toBeInTheDocument()
    })

    it('displays the risk level label', () => {
      renderReport()
      expect(screen.getByText(/High Risk/)).toBeInTheDocument()
    })

    it('displays the narrative', () => {
      renderReport()
      expect(screen.getByText(/Technology sector.*65\/100/)).toBeInTheDocument()
    })

    it('with a persona selected: verdict shows personaNarrative, risk score shows the neutral narrative — never the same text twice', () => {
      usePersonaStore.getState().setPersona('architect')
      try {
        renderReport({
          ...baseResult,
          personaNarrative: 'Architect-specific take on this exact result.',
        })
        expect(
          screen.getByText('Architect-specific take on this exact result.')
        ).toBeInTheDocument()
        expect(screen.getByText(/Technology sector.*65\/100/)).toBeInTheDocument()
        expect(screen.queryAllByText('Architect-specific take on this exact result.')).toHaveLength(
          1
        )
      } finally {
        usePersonaStore.getState().setPersona(null)
      }
    })

    it('renders correct label for low risk', () => {
      renderReport({ ...baseResult, riskScore: 10, riskLevel: 'low' })
      expect(screen.getByText(/Low Risk/)).toBeInTheDocument()
    })

    it('renders correct label for critical risk', () => {
      renderReport({ ...baseResult, riskScore: 95, riskLevel: 'critical' })
      expect(screen.getByText(/Critical Risk/)).toBeInTheDocument()
    })

    it('renders correct label for medium risk', () => {
      renderReport({ ...baseResult, riskScore: 45, riskLevel: 'medium' })
      expect(screen.getByText(/Medium Risk/)).toBeInTheDocument()
    })
  })

  describe('algorithm migration table', () => {
    it('renders the section heading', () => {
      renderReport()
      expect(screen.getAllByText('Algorithm Migration Priority').length).toBeGreaterThanOrEqual(1)
    })

    it('shows algorithm names', () => {
      renderReport()
      expect(screen.getByText('RSA-2048')).toBeInTheDocument()
      expect(screen.getByText('AES-256')).toBeInTheDocument()
    })

    it('shows PQC replacement', () => {
      renderReport()
      expect(screen.getByText('ML-KEM-768 / ML-DSA-65')).toBeInTheDocument()
    })

    it('marks vulnerable algorithms with Yes', () => {
      renderReport()
      expect(screen.getAllByText('Yes')).toHaveLength(1)
    })

    it('marks safe algorithms with No', () => {
      renderReport()
      expect(screen.getAllByText('No')).toHaveLength(1)
    })

    it('hides section when no algorithm migrations', () => {
      renderReport({ ...baseResult, algorithmMigrations: [] })
      expect(screen.queryByText('Algorithm Migration Priority')).not.toBeInTheDocument()
    })
  })

  describe('compliance impact', () => {
    it('renders the section heading', () => {
      renderReport()
      expect(screen.getAllByText('Compliance Impact').length).toBeGreaterThanOrEqual(1)
    })

    it('shows framework names', () => {
      renderReport()
      // FIPS 140-3 may also appear in the applicability panel for Technology/US
      // and in the QRA compliance-mapping table, so allow ≥1 occurrence; PCI DSS
      // appears in both the Compliance Impact section and the QRA table.
      expect(screen.getAllByText('FIPS 140-3').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('PCI DSS').length).toBeGreaterThanOrEqual(1)
    })

    it('shows PQC Required badge for required frameworks', () => {
      renderReport()
      // Rendered in both the Compliance Impact section and the QRA compliance map.
      expect(screen.getAllByText('PQC Required').length).toBeGreaterThanOrEqual(1)
    })

    it('shows No PQC mandate badge for non-required frameworks', () => {
      renderReport()
      // Rendered in both the Compliance Impact section and the QRA compliance map.
      expect(screen.getAllByText('No PQC mandate yet').length).toBeGreaterThanOrEqual(1)
    })

    it('shows deadline information', () => {
      renderReport()
      expect(screen.getAllByText(/2030/).length).toBeGreaterThanOrEqual(1)
    })

    it('hides section when no compliance impacts', () => {
      renderReport({ ...baseResult, complianceImpacts: [] })
      expect(screen.queryByText('Compliance Impact')).not.toBeInTheDocument()
    })
  })

  describe('recommended actions', () => {
    it('renders the section heading', () => {
      renderReport()
      expect(screen.getAllByText('Recommended Actions').length).toBeGreaterThanOrEqual(1)
    })

    it('renders all actions', () => {
      renderReport()
      expect(screen.getAllByText(/quantum-vulnerable/).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/hybrid PQC/).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/awareness/).length).toBeGreaterThanOrEqual(1)
    })

    it('displays action category labels', () => {
      renderReport()
      expect(screen.getByText('immediate')).toBeInTheDocument()
      expect(screen.getByText('short-term')).toBeInTheDocument()
      expect(screen.getByText('long-term')).toBeInTheDocument()
    })

    it('renders Explore links for each action', () => {
      renderReport()
      const links = screen.getAllByText('Explore')
      expect(links).toHaveLength(3)
    })
  })

  describe('action buttons', () => {
    // Share is no longer one of these — it lives ONLY in the global top bar
    // (2026-08-27 remediation). Its exact-result encoding is covered by
    // ReportView.share.test.tsx, which tests the surviving mechanism
    // (ReportView's usePageActionsStore registration) directly.
    it('renders all four action buttons', () => {
      renderReport()
      expect(screen.getByText('Print / Save as PDF')).toBeInTheDocument()
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
      expect(screen.getByText('Edit Answers')).toBeInTheDocument()
      expect(screen.getByText('Start Over')).toBeInTheDocument()
    })

    it('calls window.print when Print / Save as PDF is clicked', () => {
      const printMock = vi.fn()
      vi.spyOn(window, 'print').mockImplementation(printMock)
      renderReport()
      fireEvent.click(screen.getByText('Print / Save as PDF'))
      expect(printMock).toHaveBeenCalledOnce()
      vi.restoreAllMocks()
    })

    it('triggers CSV download when Export CSV is clicked', () => {
      renderReport()
      fireEvent.click(screen.getByText('Export CSV'))
      expect(URL.createObjectURL).toHaveBeenCalledOnce()
      expect(URL.revokeObjectURL).toHaveBeenCalledOnce()
    })

    it('calls editFromStep(0) and navigates to /assess when Edit Answers is clicked', () => {
      renderReport()
      fireEvent.click(screen.getByText('Edit Answers'))
      expect(mockStore.editFromStep).toHaveBeenCalledWith(0)
      expect(mockNavigate).toHaveBeenCalledWith('/assess')
    })

    it('calls reset and navigates to /assess when Start Over is clicked', () => {
      renderReport()
      fireEvent.click(screen.getByText('Start Over'))
      expect(mockStore.reset).toHaveBeenCalledOnce()
      expect(mockNavigate).toHaveBeenCalledWith('/assess')
    })
  })
})
