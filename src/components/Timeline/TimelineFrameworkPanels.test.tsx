// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RoadmapOverlay } from './RoadmapOverlay'
import { SqueezeRibbon } from './SqueezeRibbon'
import { MilestoneGateColumn } from './MilestoneGateColumn'
import { TimelinePlanningNotes } from './TimelinePlanningNotes'
import {
  ROADMAP_5_YEAR,
  SQUEEZE_2026_2030,
  CAB_FORUM_CERT_LIFETIME,
  CNSA_2_0_BY_CLASS,
  PHASE_REGULATION_SATISFIES,
} from '@/data/regulatoryTimelines'
import { FRAMEWORK_PHASES, PHASE_ORDER } from '@/data/frameworkPhases'

const expand = (name: RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('Timeline framework panels (Wave-5)', () => {
  describe('RoadmapOverlay (#1)', () => {
    it('is collapsed by default (additive)', () => {
      render(<RoadmapOverlay />)
      expect(screen.queryByText(ROADMAP_5_YEAR[0].theme)).not.toBeInTheDocument()
    })

    it('renders all 5 roadmap years when expanded', () => {
      render(<RoadmapOverlay />)
      expand(/show roadmap/i)
      for (const y of ROADMAP_5_YEAR) {
        expect(screen.getByTestId(`roadmap-year-${y.year}`)).toBeInTheDocument()
        expect(screen.getByText(y.theme)).toBeInTheDocument()
      }
    })
  })

  describe('SqueezeRibbon (#2)', () => {
    it('is collapsed by default', () => {
      render(<SqueezeRibbon />)
      expect(screen.queryByTestId('squeeze-sequence')).not.toBeInTheDocument()
    })

    it('renders the converging sequence and CA/B Forum track when expanded', () => {
      render(<SqueezeRibbon />)
      expand(/show squeeze/i)
      expect(screen.getByTestId('squeeze-sequence')).toBeInTheDocument()
      const cab = screen.getByTestId('cab-forum-track')
      // 200d / 100d / 47d steps present
      for (const step of CAB_FORUM_CERT_LIFETIME) {
        expect(cab).toHaveTextContent(`${step.maxDays}d`)
      }
      // every converging-deadline event is rendered
      for (const ev of SQUEEZE_2026_2030) {
        expect(screen.getByText(ev.label)).toBeInTheDocument()
      }
    })
  })

  describe('MilestoneGateColumn (#3)', () => {
    it('surfaces every FRAMEWORK_PHASES gate when expanded', () => {
      render(<MilestoneGateColumn />)
      expand(/show gates/i)
      const gated = PHASE_ORDER.map(
        // eslint-disable-next-line security/detect-object-injection
        (id) => FRAMEWORK_PHASES[id]
      ).filter((p) => p.gate)
      expect(gated.length).toBeGreaterThan(0)
      for (const p of gated) {
        const row = screen.getByTestId(`gate-row-${p.gate!.id}`)
        expect(row).toHaveTextContent(p.gate!.criterion)
        expect(row).toHaveTextContent(p.gate!.authority)
      }
    })
  })

  describe('TimelinePlanningNotes (#5–7)', () => {
    it('shows satisfies-it map, CNSA-by-class, and infra-refresh note when expanded', () => {
      render(<TimelinePlanningNotes />)
      expand(/show context/i)
      // #5 satisfies-it
      for (const entry of PHASE_REGULATION_SATISFIES) {
        expect(screen.getByTestId(`satisfies-row-${entry.regulation}`)).toBeInTheDocument()
      }
      // #7 CNSA by class — reconciled years
      for (const c of CNSA_2_0_BY_CLASS) {
        expect(screen.getByTestId(`cnsa-class-${c.year}`)).toHaveTextContent(c.class)
      }
      // #6 infra-refresh + accelerated note
      expect(screen.getByTestId('infra-refresh-note')).toHaveTextContent(/Accelerated-Execution/i)
    })
  })
})
