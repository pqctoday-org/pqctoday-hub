// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GanttDetailPopover } from './GanttDetailPopover'
import type { TimelinePhase } from '../../types/timeline'

// Phase 8.5 — the enrichment analysis must render directly on open, with no
// extra "Analysis" expand click (GanttDetailPopover used to default-collapse
// it behind a button while TimelineDocumentDetailPopover never did — this
// test locks in the now-shared, zero-extra-click behavior). The enrichment
// lookup is mocked so this doesn't depend on real doc-enrichment markdown.
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  }
})

const { mockEnrichment, ENRICHMENT_KEY } = vi.hoisted(() => {
  const key = 'Test Country:Test Agency — Quantum-Safe Discovery'
  const enrichment = {
    mainTopic: 'Quantum-safe migration overview',
    pqcAlgorithms: [],
    quantumThreats: [],
    migrationTimeline: null,
    regionsAndBodies: null,
    leadersContributions: [],
    pqcProducts: [],
    protocols: [],
    infrastructureLayers: [],
    standardizationBodies: [],
    complianceFrameworks: [],
    classicalAlgorithms: [],
    keyTakeaways: [],
    securityLevels: [],
    hybridApproaches: [],
    performanceConsiderations: [],
    targetAudience: [],
    implementationPrereqs: [],
    relevantFeatures: [],
    implementationAttackSurface: [],
    cryptoDiscovery: [],
    testingValidation: [],
    qkdProtocols: [],
    qrngEntropy: [],
    constrainedDeviceIoT: [],
    supplyChainRisk: [],
    deploymentComplexity: [],
    financialBusinessImpact: [],
    organizationalReadiness: [],
    // timeline-specific dimensions — what TimelineAnalysisPanel renders
    phaseClassification:
      'Classified as Discovery because the country published an initial assessment.',
    mandateLevel: 'Mandatory',
    sectorApplicability: ['Finance', 'Government'],
    migrationUrgency: 'Critical',
    phaseTransition: null,
    historicalSignificance: null,
    implementationDates: [] as string[],
    successorDependencies: null,
  }
  return { mockEnrichment: enrichment, ENRICHMENT_KEY: key }
})

vi.mock('../../data/timelineEnrichmentData', () => ({
  timelineEnrichments: { [ENRICHMENT_KEY]: mockEnrichment },
  hasSubstantiveEnrichment: (e: { mainTopic?: string; mandateLevel?: string | null } | undefined) =>
    !!(e && (e.mainTopic || e.mandateLevel)),
  getTimelineEnrichmentKey: (countryName: string, org: string, title: string) =>
    `${countryName}:${org} — ${title}`,
}))

describe('GanttDetailPopover — enrichment analysis click depth (Phase 8.5)', () => {
  const mockPhase: TimelinePhase = {
    startYear: 2024,
    endYear: 2026,
    phase: 'Discovery',
    type: 'Phase',
    title: 'Quantum-Safe Discovery',
    description: 'Initial assessment of quantum threats',
    events: [
      {
        startYear: 2024,
        endYear: 2026,
        phase: 'Discovery',
        type: 'Phase',
        title: 'Quantum-Safe Discovery',
        description: 'Initial assessment',
        orgName: 'Test Agency',
        orgFullName: 'Test Agency',
        countryName: 'Test Country',
        flagCode: 'tc',
        sourceUrl: 'https://example.com/source',
        sourceDate: '2024-01-15',
        entityType: 'government',
      },
    ],
  }

  const onClose = vi.fn()

  it('renders the enrichment analysis immediately, with no expand/Analysis button required', () => {
    // MemoryRouter added 2026-08-26: this mock enrichment has a `mainTopic`,
    // so DocumentAnalysis now also renders here, and its "Explore on PQC
    // Today" links call useNavigate().
    render(
      <MemoryRouter>
        <GanttDetailPopover isOpen={true} onClose={onClose} phase={mockPhase} />
      </MemoryRouter>
    )

    // No collapse toggle gating the 8-dimension panel specifically should
    // exist anymore (scoped to "8-dimension" rather than a blanket /analysis/i
    // match, 2026-08-26: this popover now also renders the separate, still-
    // legitimately-collapsible "Document Analysis" panel — see
    // DocumentAnalysis.tsx — added the same day this test's own mock
    // enrichment gained a `mainTopic`, which is what makes it render).
    expect(screen.queryByRole('button', { name: /8.dimension/i })).not.toBeInTheDocument()
    expect(screen.queryByText('expand')).not.toBeInTheDocument()
    expect(screen.queryByText('collapse')).not.toBeInTheDocument()

    // The full panel content is visible without any interaction, labeled per
    // the master plan's explicit wording (Phase 8, item 5).
    expect(screen.getByText('8-Dimension Enrichment Analysis')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Classified as Discovery because the country published an initial assessment.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Mandatory')).toBeInTheDocument()
  })
})
