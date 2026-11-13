// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { CarKeyProtocolExplorer } from './CarKeyProtocolExplorer'
import { AutomotivePQCExercises } from '../components/AutomotivePQCExercises'

function selectNfcAndPqc() {
  fireEvent.click(screen.getByRole('button', { name: /^NFC/ }))
  fireEvent.click(screen.getByRole('switch', { name: 'Toggle PQC mode' }))
}

describe('Car key explorer: fictional sample with separate network and radio figures', () => {
  it('says plainly that it is a fictional sample with no new wire format', () => {
    render(<CarKeyProtocolExplorer />)
    const note = screen.getByText(/This is a fictional project sample/)
    expect(note).toHaveTextContent('not the CCC Digital Key wire format')
    expect(note).toHaveTextContent('defines no new wire format')
  })

  it('shows the pinned whole-flow totals and the network and radio split', () => {
    render(<CarKeyProtocolExplorer />)
    fireEvent.click(screen.getByRole('button', { name: /^NFC/ }))
    expect(screen.getByText('2,164 bytes')).toBeInTheDocument()
    expect(screen.getByText(/1,540 bytes in 5/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch', { name: 'Toggle PQC mode' }))
    expect(screen.getByText('38,604 bytes')).toBeInTheDocument()
    expect(screen.getByText(/25,356 bytes in 5/)).toBeInTheDocument()
    expect(screen.getByText(/NFC 57 fragments/)).toBeInTheDocument()
  })

  it('explains 5 + 5 = 10 fragments for the 2,272-byte key agreement over NFC', () => {
    render(<CarKeyProtocolExplorer />)
    selectNfcAndPqc()
    const alert = screen.getByText(/This calculation assumes short NFC commands/)
    expect(alert).toHaveTextContent('not a universal ISO 7816 APDU limit')
    expect(alert).toHaveTextContent('5 + 5 = 10 fragments')
    expect(alert).toHaveTextContent('2,272 bytes')
    fireEvent.click(screen.getByRole('button', { name: /^BLE Range/ }))
    expect(
      screen.queryByText(/This calculation assumes short NFC commands/)
    ).not.toBeInTheDocument()
    expect(screen.getByText(/not universal NFC, BLE or UWB limits/)).toBeInTheDocument()
  })

  it('shows no elapsed time by default and only totals the inputs you enter', () => {
    render(<CarKeyProtocolExplorer />)
    selectNfcAndPqc()
    const result = screen.getByTestId('elapsed-result')
    expect(result).toHaveTextContent('No elapsed time shown')
    expect(result).not.toHaveTextContent(/\d+ ms/)
    expect(screen.queryByText(/200 ms/)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('NFC: ms per fragment'), { target: { value: '2' } })
    expect(result).toHaveTextContent('No elapsed time shown')
    fireEvent.change(screen.getByLabelText('Carmaker network: ms per message'), {
      target: { value: '10' },
    })
    // classical: 10 NFC fragments x 2 + 5 network messages x 10; PQC: 57 x 2 + 5 x 10
    expect(result).toHaveTextContent('70 ms classical')
    expect(result).toHaveTextContent('164 ms PQC')
    fireEvent.change(screen.getByLabelText('NFC: ms per fragment'), { target: { value: '0' } })
    expect(result).toHaveTextContent('No elapsed time shown')
  })

  it('adds a UWB box only in the BLE + UWB scenario and keeps UWB out of the other scenarios', () => {
    render(<CarKeyProtocolExplorer />)
    expect(screen.queryByLabelText('UWB: ms per fragment')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^BLE \+ UWB/ }))
    expect(screen.getByLabelText('UWB: ms per fragment')).toBeInTheDocument()
    expect(screen.getByLabelText('BLE: ms per fragment')).toBeInTheDocument()
  })

  it('lists radio events and local key derivation as not counted', () => {
    render(<CarKeyProtocolExplorer />)
    expect(screen.getByText('Not counted in the totals')).toBeInTheDocument()
    expect(screen.getByText(/never transmitted/)).toBeInTheDocument()
    expect(screen.getByText(/BLE advertisement is not the same event as NFC/)).toBeInTheDocument()
  })

  it('keeps the exercise consistent with the explorer and free of the old unsupported numbers', () => {
    render(
      <MemoryRouter>
        <AutomotivePQCExercises onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    const text = screen.getByText(/ML-KEM-768 public value \(1,184 bytes\) takes/).textContent ?? ''
    expect(text).toContain('5 + 5 = 10 fragments for 2,272 bytes')
    expect(text).toContain('2,164 payload bytes classical and 38,604 bytes PQC')
    expect(text).not.toMatch(/800ms|9\+ APDUs|~120ms/)
  })
})
