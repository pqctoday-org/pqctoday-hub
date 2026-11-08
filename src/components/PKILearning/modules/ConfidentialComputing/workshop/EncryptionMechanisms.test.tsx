// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EncryptionMechanisms } from './EncryptionMechanisms'

const slider = () => screen.getByLabelText('AES Key Size') as HTMLInputElement
const calculator = () => {
  const panel = screen.getByText(/Grover Impact Calculator/).closest('.glass-panel')
  if (!panel) throw new Error('calculator panel not found')
  return panel as HTMLElement
}
const setSize = (bits: number) => fireEvent.change(slider(), { target: { value: String(bits) } })

describe('Grover calculator: real AES sizes, no verdict from a halving heuristic', () => {
  it('only offers the three AES key sizes', () => {
    render(<EncryptionMechanisms />)
    const min = Number(slider().min)
    const max = Number(slider().max)
    const step = Number(slider().step)
    const sizes: number[] = []
    for (let v = min; v <= max; v += step) sizes.push(v)
    expect(sizes).toEqual([128, 192, 256])
    expect(calculator().textContent).not.toMatch(/\b64-bit\b/)
  })

  it('labels the Grover figure as an idealized illustration, separate from the NIST category', () => {
    render(<EncryptionMechanisms />)
    const text = calculator().textContent ?? ''
    expect(text).toMatch(/idealized/i)
    expect(text).toMatch(/Idealized Grover iterations/)
    expect(text).toMatch(/NIST category \(definition\)/)
    expect(text).toMatch(/policy choice/)
    expect(text).not.toMatch(/Post-Quantum Security/)
  })

  it('shows the same neutral reading at 128 and 256 bits, with no safe or unsafe styling', () => {
    render(<EncryptionMechanisms />)
    for (const bits of [128, 192, 256]) {
      setSize(bits)
      const panel = calculator()
      expect(panel.querySelector('[class*="status-error"]')).toBeNull()
      expect(panel.querySelector('[class*="status-success"]')).toBeNull()
      expect(panel.textContent).toMatch(/does not give a safe or unsafe verdict/)
    }
  })

  it('states the category as a definition and the gate estimate as a published estimate', () => {
    render(<EncryptionMechanisms />)
    setSize(128)
    expect(calculator().textContent).toMatch(
      /Category 1 is defined as at least as hard to break as key search on AES-128/
    )
    setSize(256)
    expect(calculator().textContent).toMatch(
      /Category 5 is defined as at least as hard to break as key search on AES-256/
    )
    expect(calculator().textContent).toMatch(/2016 estimate/)
  })
})

describe('memory engine cards keep ownership checks apart from cryptographic integrity', () => {
  it('names the kind of check on the AMD card instead of a bare Yes', () => {
    render(<EncryptionMechanisms />)
    fireEvent.click(screen.getAllByText('AMD SME/SEV Encryption Engine')[0])
    expect(
      screen.getByText(/SEV-SNP only: hardware ownership checks \(RMP\), not cryptographic/)
    ).toBeInTheDocument()
  })

  it('does not call the platform-isolation engines quantum safe', () => {
    render(<EncryptionMechanisms />)
    expect(screen.queryByText('Quantum Safe')).toBeNull()
    expect(screen.getAllByText('No AES Key Documented').length).toBeGreaterThan(0)
  })
})
