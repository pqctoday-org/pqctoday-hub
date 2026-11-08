// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EMVPaymentExercises } from './EMVPaymentExercises'

function renderExercises() {
  return render(
    <MemoryRouter>
      <EMVPaymentExercises onNavigateToWorkshop={vi.fn()} onSetWorkshopConfig={vi.fn()} />
    </MemoryRouter>
  )
}

describe('EMV exercise observations use the names the module data uses', () => {
  it('names the offline CDA signature and its verification by SDAD', () => {
    renderExercises()
    const note = screen.getByText(/Offline CDA has 3 \(ICC certificate verification/)
    expect(note).toHaveTextContent(
      'the combined AC+SDAD signature (Signed Dynamic Application Data), and the SDAD verification'
    )
    expect(note).not.toHaveTextContent('SSAD')
  })

  it('places the remote key loading exposure on the terminal initial key, not the BDK', () => {
    renderExercises()
    const note = screen.getByText(/DUKPT per-transaction key derivation uses symmetric crypto/)
    expect(note).toHaveTextContent('fictional RSA remote key loading case')
    expect(note).toHaveTextContent("Step 2 wraps the terminal's derived initial key (not the BDK)")
    expect(note).toHaveTextContent('the BDK stays inside the HSM')
    expect(note).toHaveTextContent('(conceptual)')
    expect(note).not.toHaveTextContent('wraps the BDK under')
    expect(note).not.toHaveTextContent('which can derive ALL past and future transaction keys')
  })
})
