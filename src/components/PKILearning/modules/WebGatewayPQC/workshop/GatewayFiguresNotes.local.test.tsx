// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HandshakeBudgetCalculator } from './HandshakeBudgetCalculator'
import { TLSTerminationPatterns } from './TLSTerminationPatterns'
import { GATEWAY_FIGURES_NOTE, HANDSHAKE_MITIGATIONS_NOTE } from '../data/gatewayData'

describe('gateway workshop tools say their figures are illustrative', () => {
  it('the handshake calculator shows the mitigation note and the capacity-table note', () => {
    render(<HandshakeBudgetCalculator />)
    expect(screen.getByTestId('handshake-mitigations-note')).toHaveTextContent(
      HANDSHAKE_MITIGATIONS_NOTE
    )
    expect(screen.getByTestId('gateway-figures-note')).toHaveTextContent(GATEWAY_FIGURES_NOTE)
    expect(screen.getByTestId('gateway-figures-note')).toHaveTextContent(
      'not measurements or vendor specifications'
    )
  })

  it('the termination patterns show the figures note above the comparison table', () => {
    render(<TLSTerminationPatterns />)
    const note = screen.getByTestId('gateway-figures-note')
    expect(note).toHaveTextContent(GATEWAY_FIGURES_NOTE)
    const heading = screen.getByText('Pattern Comparison Summary')
    expect(note.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
