// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { PharmaIPCalculator } from './PharmaIPCalculator'

function totalAmount() {
  return screen.getByText('Total Illustrative Scenario Amount').parentElement?.textContent
}

describe('Pharmaceutical scenario attribution', () => {
  it('does not attribute unchanged timing/value results to the selected cryptography', async () => {
    const user = userEvent.setup()
    const view = render(<PharmaIPCalculator />)
    expect(screen.getByText(/The timing\/value calculation/)).toHaveTextContent(
      'These outputs do not establish cryptographic exposure, reduced risk or expected financial loss.'
    )
    const initialAmount = totalAmount()
    const initialUrgency = screen.getByText(/^Scenario Urgency:/).textContent
    for (const scheme of ['AES-256-GCM', 'TLS 1.3 hybrid', 'RSA-2048']) {
      await user.click(screen.getAllByRole('button', { name: 'Encryption:' })[0])
      await user.click(screen.getByRole('option', { name: scheme }))
      expect(totalAmount()).toBe(initialAmount)
      expect(screen.getByText(/^Scenario Urgency:/)).toHaveTextContent(initialUrgency!)
    }
    expect(screen.queryByText('Migration Urgency:')).not.toBeInTheDocument()
    expect(screen.queryByText('Financial Exposure Dashboard')).not.toBeInTheDocument()
    view.unmount()
  })

  it('retains value-driven thresholds with explicit fictional, non-cryptographic explanations', async () => {
    const user = userEvent.setup()
    const view = render(<PharmaIPCalculator />)
    await user.click(screen.getByRole('button', { name: 'Remove ABX-4415' }))
    await user.click(screen.getByRole('button', { name: 'Remove NRO-1182' }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '2028' } })
    const value = screen.getByRole('spinbutton', { name: 'Value ($M)' })
    for (const [amount, range] of [
      [800, 'Medium'],
      [3000, 'High'],
      [9000, 'Critical'],
    ] as const) {
      fireEvent.change(value, { target: { value: String(amount) } })
      expect(totalAmount()).toContain(`$${amount.toLocaleString()}M`)
      expect(screen.getByText(`Scenario Urgency: ${range}`)).toBeInTheDocument()
      expect(
        screen.getByText(
          `This fictional amount is in the sample’s ${range.toLowerCase()} range. It does not assess the selected encryption or its key-management and transport dependencies.`
        )
      ).toBeInTheDocument()
    }
    fireEvent.change(value, { target: { value: '0' } })
    expect(totalAmount()).toContain('$0M')
    expect(screen.getByText('Scenario Urgency: Medium')).toBeInTheDocument()
    view.unmount()
  })
})
