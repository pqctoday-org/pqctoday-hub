// SPDX-License-Identifier: AGPL-3.0-only
//
// The start screen ("Choose how to start") sits below the page header on every
// screen size. On a phone the card is taller than the screen, so it must start
// under the header and let the page scroll, not centre itself upward beneath it.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SimulationView } from './SimulationView'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

beforeEach(() => {
  useSimulationStore.getState().reset()
  useAssessmentResultStore.getState().reset()
  useAssessmentResultStore.setState({ lastResult: null, completedAt: null })
  useSimulationStore.setState({ tourSeen: true })
})

describe('SimulationView start screen layout', () => {
  it.each([false, true])(
    'scrolls inside its own area and centres the card with auto margins (phone shell: %s)',
    (phone) => {
      mockUseIsMobileShell.mockReturnValue(phone)
      render(
        <MemoryRouter initialEntries={['/simulation']}>
          <SimulationView />
        </MemoryRouter>
      )
      const card = screen.getByTestId('sim-start-card')
      const area = screen.getByTestId('sim-start-main')
      const header = screen.getByRole('banner')

      // The card is a child of the scrolling area, which comes after the header.
      expect(area).toContainElement(card)
      expect(header.compareDocumentPosition(area) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(area).toHaveClass('overflow-y-auto')
      expect(area).toHaveClass('min-h-0')
      // Centred by auto margins, which collapse when the card is taller than the area.
      expect(card).toHaveClass('m-auto')
      // items-center / justify-center would push a tall card up under the header.
      expect(area).not.toHaveClass('items-center')
      expect(area).not.toHaveClass('justify-center')
    }
  )
})
