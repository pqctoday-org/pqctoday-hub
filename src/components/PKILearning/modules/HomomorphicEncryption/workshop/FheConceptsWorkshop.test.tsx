// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FheConceptsWorkshop } from './FheConceptsWorkshop'

const open = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('FheConceptsWorkshop', () => {
  it('shows the four concept cards', () => {
    render(<FheConceptsWorkshop />)
    for (const t of [
      /Noise budget and bootstrapping/,
      /Encode, decode and rounding/,
      /From a program to an FHE circuit/,
      /Key streaming and chunk size/,
    ]) {
      expect(screen.getByRole('button', { name: t })).toBeInTheDocument()
    }
    expect(screen.getAllByText('Illustration (simplified, not real encryption)').length).toBe(1)
  })

  it('refuses a CKKS multiply once the levels run out, and bootstrap restores them', () => {
    render(<FheConceptsWorkshop />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const mul = screen.getByRole('button', { name: 'Multiply' })
    for (let i = 0; i < 6; i++) fireEvent.click(mul)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(mul)
    expect(screen.getByRole('alert')).toHaveTextContent(/decryption would fail — bootstrap first/i)
    fireEvent.click(screen.getByRole('button', { name: 'Bootstrap' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'CKKS levels remaining' })).toHaveAttribute(
      'aria-valuenow',
      String(Math.round((4 / 6) * 100))
    )
  })

  it('encodes 3.14159265 and releases round(x·2^20) = 3294199 at p = 20', () => {
    render(<FheConceptsWorkshop />)
    open(/Encode, decode and rounding/)
    expect(screen.getByText(/release precision p = 20 bits/)).toBeInTheDocument()
    expect(screen.getByTestId('released-int-0')).toHaveTextContent('3,294,199')
  })

  it('TFHE noise past half a step flips the decrypted message', () => {
    render(<FheConceptsWorkshop />)
    open(/Encode, decode and rounding/)
    expect(screen.getByText(/the noise was rounded away/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('TFHE noise'), { target: { value: '1500' } })
    expect(screen.getByText(/flipped the message/)).toBeInTheDocument()
  })

  it('shows the measured MX95 time at 8 limbs per call and 1,001 calls', () => {
    const onComplete = vi.fn()
    render(<FheConceptsWorkshop onComplete={onComplete} />)
    open(/Key streaming and chunk size/)
    const devices = screen.getByRole('group', { name: 'Device' })
    fireEvent.click(within(devices).getByRole('button', { name: /^MX95, one core, before/ }))
    expect(screen.getByTestId('stream-seconds')).toHaveTextContent('473 s')
    expect(screen.getAllByText(/1,001/).length).toBeGreaterThan(0)
    // a chunk size the board was not measured at says so
    const limbs = screen.getByRole('group', { name: 'Limbs per call' })
    fireEvent.click(within(limbs).getByRole('button', { name: '4' }))
    expect(screen.getByTestId('stream-seconds')).toHaveTextContent('Not measured')
  })

  it('shows the cached-generator runs on the boards, with no fitted model', () => {
    render(<FheConceptsWorkshop />)
    open(/Key streaming and chunk size/)
    const devices = screen.getByRole('group', { name: 'Device' })
    fireEvent.click(within(devices).getByRole('button', { name: /^MX95, one core, cached/ }))
    expect(screen.getByTestId('stream-seconds')).toHaveTextContent('214 s')
    expect(screen.getByText(/No fitted model for this device/)).toBeInTheDocument()
    fireEvent.click(within(devices).getByRole('button', { name: /^MX95 Pro, six cores/ }))
    const limbs = screen.getByRole('group', { name: 'Limbs per call' })
    fireEvent.click(within(limbs).getByRole('button', { name: '30' }))
    expect(screen.getByTestId('stream-seconds')).toHaveTextContent('72.4 s')
  })
})
