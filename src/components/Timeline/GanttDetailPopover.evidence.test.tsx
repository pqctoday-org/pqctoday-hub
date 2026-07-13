// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GanttDetailPopover } from './GanttDetailPopover'
import type { TimelinePhase } from '../../types/timeline'

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  }
})

interface BuildPhaseOptions {
  confidenceScore?: number
  trustedSourceIdStatus?: string
  sourceDate?: string
}

function buildPhase(opts: BuildPhaseOptions): TimelinePhase {
  return {
    startYear: 2024,
    endYear: 2026,
    phase: 'Discovery',
    type: 'Phase',
    title: 'Quantum-Safe Discovery',
    description: 'Initial assessment',
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
        sourceDate: opts.sourceDate,
        confidenceScore: opts.confidenceScore,
        trustedSourceIdStatus: opts.trustedSourceIdStatus,
        entityType: 'government',
      },
    ],
  }
}

describe('GanttDetailPopover — electronic evidence', () => {
  const onClose = vi.fn()

  it('renders the evidence section with a source link when the primary event has a sourceUrl', () => {
    const phase = buildPhase({
      confidenceScore: 80,
      trustedSourceIdStatus: 'registered',
      sourceDate: '2025-06-01',
    })

    render(<GanttDetailPopover isOpen={true} onClose={onClose} phase={phase} />)

    expect(screen.getByText('Electronic evidence')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /view source/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com/source')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders badges even with a low-confidence/proposed tier', () => {
    const phase = buildPhase({
      confidenceScore: 55,
      trustedSourceIdStatus: 'proposed',
    })

    render(<GanttDetailPopover isOpen={true} onClose={onClose} phase={phase} />)

    expect(screen.getByText('Electronic evidence')).toBeInTheDocument()
    // Tier badge for "proposed" → Tier 2 label
    expect(screen.getByText('Tier 2')).toBeInTheDocument()
  })

  it('hides the entire evidence section when the primary event has no evidence metadata', () => {
    const phase = buildPhase({})

    render(<GanttDetailPopover isOpen={true} onClose={onClose} phase={phase} />)

    expect(screen.queryByText('Electronic evidence')).not.toBeInTheDocument()
  })
})
