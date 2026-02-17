import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ExecutiveView } from './ExecutiveView'
import '@testing-library/jest-dom'

// Mock compliance hook
vi.mock('../Compliance/services', () => ({
  useComplianceRefresh: () => ({
    data: [
      { id: '1', type: 'FIPS 140-3', status: 'Active' },
      { id: '2', type: 'ACVP', status: 'Active' },
      { id: '3', type: 'Common Criteria', status: 'Active' },
      { id: '4', type: 'EUCC', status: 'Active' },
    ],
    loading: false,
    error: null,
    lastUpdated: null,
    refresh: vi.fn(),
    enrichRecord: vi.fn(),
  }),
}))

// Mock data modules
vi.mock('../../data/threatsData', () => ({
  threatsData: [
    { industry: 'Finance', criticality: 'Critical', threatId: 'T1' },
    { industry: 'Healthcare', criticality: 'High', threatId: 'T2' },
    { industry: 'Government', criticality: 'Medium', threatId: 'T3' },
  ],
}))

vi.mock('../../data/algorithmsData', () => ({
  algorithmsData: [
    { classical: 'RSA-2048', pqc: 'ML-KEM-768' },
    { classical: 'N/A', pqc: 'ML-KEM-512' },
  ],
}))

vi.mock('../../data/migrateData', () => ({
  softwareData: [{ softwareName: 'Tool1' }],
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, transition, whileHover, whileTap, ...validProps } = props
      void initial
      void animate
      void transition
      void whileHover
      void whileTap
      return (
        <div {...(validProps as React.HTMLAttributes<HTMLDivElement>)}>
          {children as React.ReactNode}
        </div>
      )
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock localforage (used by compliance services)
vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockAssessmentStore = {
  lastResult: null as unknown,
}

vi.mock('../../store/useAssessmentStore', () => ({
  useAssessmentStore: (selector: (s: typeof mockAssessmentStore) => unknown) =>
    selector(mockAssessmentStore),
}))

const renderView = () =>
  render(
    <MemoryRouter>
      <ExecutiveView />
    </MemoryRouter>
  )

describe('ExecutiveView', () => {
  beforeEach(() => {
    mockAssessmentStore.lastResult = null
  })

  it('renders the page title', () => {
    renderView()

    expect(screen.getByText('PQC Readiness Summary')).toBeInTheDocument()
  })

  it('renders KPI cards with correct labels', () => {
    renderView()

    expect(screen.getByText('Critical Threats')).toBeInTheDocument()
    expect(screen.getByText('Algorithms at Risk')).toBeInTheDocument()
    expect(screen.getByText('Migration Tools')).toBeInTheDocument()
    expect(screen.getByText('Active Standards')).toBeInTheDocument()
  })

  it('renders dynamic active standards from compliance data', () => {
    renderView()

    // 4 distinct active types from the mock compliance data
    // Find the KPI card containing "Active Standards" and verify its value
    const standardsLabel = screen.getByText('Active Standards')
    const kpiCard = standardsLabel.closest('a')!
    expect(kpiCard).toBeInTheDocument()
    expect(kpiCard.textContent).toContain('4')
  })

  it('renders the priority actions table', () => {
    renderView()

    expect(screen.getByText('Top Priority Actions')).toBeInTheDocument()
    expect(screen.getByText(/Address critical quantum threats/)).toBeInTheDocument()
  })

  it('renders the risk summary section', () => {
    renderView()

    expect(screen.getByText('Risk Summary')).toBeInTheDocument()
  })

  it('shows assessment CTA when no assessment exists', () => {
    renderView()

    expect(screen.getByText('No assessment on file')).toBeInTheDocument()
    expect(screen.getByText('Start Assessment')).toBeInTheDocument()
  })

  it('shows org risk section when assessment result exists', () => {
    mockAssessmentStore.lastResult = {
      riskScore: 65,
      riskLevel: 'high',
      algorithmMigrations: [],
      complianceImpacts: [],
      recommendedActions: [
        { priority: 1, action: 'Migrate RSA', category: 'immediate', relatedModule: 'PKI' },
      ],
      narrative: 'Custom narrative.',
    }

    renderView()

    expect(screen.getByText('Your Organization')).toBeInTheDocument()
    expect(screen.getByText('65')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('Recommended Actions')).toBeInTheDocument()
    expect(screen.queryByText(/Take the PQC Readiness Assessment/)).not.toBeInTheDocument()
  })

  it('renders export buttons', () => {
    renderView()

    expect(screen.getByText('Download PDF')).toBeInTheDocument()
    expect(screen.getByText('Copy Link')).toBeInTheDocument()
  })
})
