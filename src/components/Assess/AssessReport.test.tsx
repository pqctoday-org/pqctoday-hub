import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AssessReport } from './AssessReport'
import type { AssessmentResult } from '../../hooks/useAssessmentEngine'
import '@testing-library/jest-dom'

// Mock framer-motion
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

const mockStore = {
  reset: vi.fn(),
  editFromStep: vi.fn(),
  getInput: vi.fn(() => ({
    industry: 'Technology',
    currentCrypto: ['RSA-2048'],
    dataSensitivity: 'high' as const,
    complianceRequirements: ['FIPS 140-3'],
    migrationStatus: 'not-started' as const,
  })),
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
      <AssessReport result={result} />
    </MemoryRouter>
  )

describe('AssessReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  describe('header', () => {
    it('renders the report title', () => {
      renderReport()
      expect(screen.getByText('Your PQC Risk Assessment Report')).toBeInTheDocument()
    })

    it('renders the generated date from result', () => {
      renderReport()
      // UTC midnight renders as local date — just check that the date element exists
      expect(screen.getByText(/Generated on/)).toBeInTheDocument()
      expect(screen.getByText(/2026/)).toBeInTheDocument()
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
      expect(screen.getByText('Algorithm Migration Priority')).toBeInTheDocument()
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
      expect(screen.getByText('Compliance Impact')).toBeInTheDocument()
    })

    it('shows framework names', () => {
      renderReport()
      expect(screen.getByText('FIPS 140-3')).toBeInTheDocument()
      expect(screen.getByText('PCI DSS')).toBeInTheDocument()
    })

    it('shows PQC Required badge for required frameworks', () => {
      renderReport()
      expect(screen.getByText('PQC Required')).toBeInTheDocument()
    })

    it('shows No PQC mandate badge for non-required frameworks', () => {
      renderReport()
      expect(screen.getByText('No PQC mandate yet')).toBeInTheDocument()
    })

    it('shows deadline information', () => {
      renderReport()
      expect(screen.getByText(/2030/)).toBeInTheDocument()
    })

    it('hides section when no compliance impacts', () => {
      renderReport({ ...baseResult, complianceImpacts: [] })
      expect(screen.queryByText('Compliance Impact')).not.toBeInTheDocument()
    })
  })

  describe('recommended actions', () => {
    it('renders the section heading', () => {
      renderReport()
      expect(screen.getByText('Recommended Actions')).toBeInTheDocument()
    })

    it('renders all actions', () => {
      renderReport()
      expect(screen.getByText(/quantum-vulnerable/)).toBeInTheDocument()
      expect(screen.getByText(/hybrid PQC/)).toBeInTheDocument()
      expect(screen.getByText(/awareness/)).toBeInTheDocument()
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
    it('renders all five action buttons', () => {
      renderReport()
      expect(screen.getByText('Download PDF')).toBeInTheDocument()
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
      expect(screen.getByText('Share')).toBeInTheDocument()
      expect(screen.getByText('Edit Answers')).toBeInTheDocument()
      expect(screen.getByText('Start Over')).toBeInTheDocument()
    })

    it('calls window.print when Download PDF is clicked', () => {
      const printMock = vi.fn()
      vi.spyOn(window, 'print').mockImplementation(printMock)
      renderReport()
      fireEvent.click(screen.getByText('Download PDF'))
      expect(printMock).toHaveBeenCalledOnce()
      vi.restoreAllMocks()
    })

    it('triggers CSV download when Export CSV is clicked', () => {
      renderReport()
      fireEvent.click(screen.getByText('Export CSV'))
      expect(URL.createObjectURL).toHaveBeenCalledOnce()
      expect(URL.revokeObjectURL).toHaveBeenCalledOnce()
    })

    it('copies share URL to clipboard when Share is clicked', async () => {
      renderReport()
      fireEvent.click(screen.getByText('Share'))
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('i=Technology')
        )
      })
    })

    it('encodes all assessment params in share URL', async () => {
      renderReport()
      fireEvent.click(screen.getByText('Share'))
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled()
      })
      const url = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('c=RSA-2048')
      expect(url).toContain('d=high')
      expect(url).toContain('m=not-started')
    })

    it('calls editFromStep(0) when Edit Answers is clicked', () => {
      renderReport()
      fireEvent.click(screen.getByText('Edit Answers'))
      expect(mockStore.editFromStep).toHaveBeenCalledWith(0)
    })

    it('calls reset when Start Over is clicked', () => {
      renderReport()
      fireEvent.click(screen.getByText('Start Over'))
      expect(mockStore.reset).toHaveBeenCalledOnce()
    })
  })
})
