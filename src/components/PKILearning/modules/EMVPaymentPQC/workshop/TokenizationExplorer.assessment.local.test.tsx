// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { TokenizationExplorer } from './TokenizationExplorer'
import { EMVPaymentExercises } from '../components/EMVPaymentExercises'

function choose(label: string, value: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}:`) }))
  fireEvent.click(screen.getByRole('option', { name: value }))
}
function count(label: string, value: number) {
  expect(screen.getByText(label).parentElement).toHaveTextContent(String(value))
}

describe('tokenization sample protection boundaries', () => {
  it.each([
    ['Visa Token Service (VTS)', 6, 0],
    ['Mastercard Digital Enablement Service (MDES)', 6, 0],
    ['American Express Token Service (EST)', 5, 1],
  ])('shows separate exposure and unknown counts for %s', (tsp, exposed, unknown) => {
    render(<TokenizationExplorer />)
    choose('TSP', tsp)
    count('Classical public-key exposure', exposed)
    count('Symmetric-only in this sample', 0)
    count('Not assessed', unknown)
    expect(screen.getByText(/Sample TLS assumption/)).toHaveTextContent('classical (EC)DHE')
    expect(screen.getByText(/Sample TLS assumption/)).toHaveTextContent('RSA/ECDSA certificate')
    expect(screen.getByText(/Illustrative sequence:/)).toHaveTextContent('not')
    expect(screen.queryByText('Quantum-Safe')).not.toBeInTheDocument()
    choose('Wallet', 'Google Pay')
    count('Classical public-key exposure', exposed)
    count('Not assessed', unknown)
  })

  it('plays the real EST sequence, keeps its unspecified HSM step unassessed, and resets', async () => {
    render(<TokenizationExplorer />)
    choose('TSP', 'American Express Token Service (EST)')
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Play animation' }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6300)
      })
      const internal = screen.getByRole('article', { name: 'Internal ID&V' })
      expect(within(internal).getByText('Not assessed')).toBeInTheDocument()
      expect(internal).toHaveTextContent('HSM label alone does not specify an algorithm')
      expect(within(internal).queryByText('Symmetric-only in this sample')).not.toBeInTheDocument()
      const activation = screen.getByRole('article', { name: 'Token Activation' })
      expect(activation).toHaveTextContent('Classical public-key exposure')
      expect(activation).toHaveTextContent('(EC)DHE')
      expect(activation).toHaveTextContent('RSA/ECDSA certificate authentication')
      fireEvent.click(screen.getByRole('button', { name: 'Reset animation' }))
      expect(screen.queryByRole('article', { name: 'Internal ID&V' })).not.toBeInTheDocument()
      count('Not assessed', 1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('pairs the real exercise with the component-versus-step explanation and correct workshop', () => {
    const onNavigateToWorkshop = vi.fn(),
      onSetWorkshopConfig = vi.fn()
    render(
      <MemoryRouter>
        <EMVPaymentExercises
          onNavigateToWorkshop={onNavigateToWorkshop}
          onSetWorkshopConfig={onSetWorkshopConfig}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/All six VTS steps/)).toHaveTextContent('classical')
    expect(screen.getByText(/All six VTS steps/)).toHaveTextContent('AES')
    expect(screen.getByText(/All six VTS steps/)).toHaveTextContent('certificate')
    fireEvent.click(screen.getAllByRole('button', { name: /Load.*Run/ })[3])
    expect(onSetWorkshopConfig).toHaveBeenCalledWith({ step: 3 })
    expect(onNavigateToWorkshop).toHaveBeenCalledOnce()
  })
})
