// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { NGFWCipherAnalyzer } from './NGFWCipherAnalyzer'
import { NetworkSecurityExercises } from '../components/NetworkSecurityExercises'

const assumptionName = 'Assume selected algorithms are hardware-accelerated (sample)'
const tiers = [
  {
    name: 'Entry-Level (Branch/SMB)',
    base: '5,000',
    results: ['5,000', '3,600', '2,750'],
    capable: false,
  },
  {
    name: 'Mid-Range (Campus/DC Edge)',
    base: '50,000',
    results: ['50,000', '36,000', '27,500'],
    capable: false,
  },
  {
    name: 'High-End (Enterprise Core)',
    base: '500,000',
    results: ['500,000', '360,000', '275,000'],
    capable: true,
  },
] as const
const modes = [
  { name: 'Classical', factor: '1.00' },
  { name: 'Hybrid', factor: '0.72' },
  { name: 'Pure PQC', factor: '0.55' },
] as const
const renderAnalyzer = () =>
  render(
    <MemoryRouter>
      <NGFWCipherAnalyzer />
    </MemoryRouter>
  )
function selectTier(name: string) {
  fireEvent.click(screen.getByRole('button', { name: /Platform:/ }))
  fireEvent.click(screen.getByRole('option', { name }))
}
const assumption = () => screen.getByRole('checkbox', { name: assumptionName })
const calculation = () => screen.getByLabelText('Illustrative throughput calculation')

describe('NGFW explicit selected-algorithm sample offload assumption', () => {
  for (const tier of tiers)
    for (const [index, mode] of modes.entries()) {
      it(`defaults to the declared software factor for ${tier.name} / ${mode.name}`, () => {
        renderAnalyzer()
        selectTier(tier.name)
        fireEvent.click(screen.getByRole('button', { name: mode.name }))
        expect(assumption()).not.toBeChecked()
        expect(assumption()).toHaveProperty('disabled', !tier.capable || mode.name === 'Classical')
        expect(calculation()).toHaveTextContent(
          `${tier.base} × ${mode.factor} = ${tier.results.at(index)} connections/sec`
        )
        expect(screen.queryByText('Hardware offload available')).not.toBeInTheDocument()
        expect(
          screen.queryByText(/PQC operations accelerated by dedicated crypto ASIC/)
        ).not.toBeInTheDocument()
      })
    }
  it('requires explicit keyboard selection for0.90 and resets it on every changed mode, tier and PQC toggle', async () => {
    const user = userEvent.setup()
    renderAnalyzer()
    selectTier('High-End (Enterprise Core)')
    await user.click(screen.getByRole('button', { name: 'Hybrid' }))
    expect(calculation()).toHaveTextContent('500,000 × 0.72 = 360,000 connections/sec')
    assumption().focus()
    await user.keyboard('[Space]')
    expect(assumption()).toBeChecked()
    expect(calculation()).toHaveTextContent('500,000 × 0.90 = 450,000 connections/sec')
    await user.keyboard('[Space]')
    expect(assumption()).not.toBeChecked()
    expect(calculation()).toHaveTextContent('500,000 × 0.72 = 360,000 connections/sec')
    await user.keyboard('[Space]')
    await user.click(screen.getByRole('button', { name: 'Pure PQC' }))
    expect(assumption()).not.toBeChecked()
    expect(calculation()).toHaveTextContent('500,000 × 0.55 = 275,000 connections/sec')
    await user.click(assumption())
    expect(calculation()).toHaveTextContent('500,000 × 0.90 = 450,000 connections/sec')
    selectTier('Mid-Range (Campus/DC Edge)')
    expect(assumption()).not.toBeChecked()
    expect(assumption()).toBeDisabled()
    expect(calculation()).toHaveTextContent('50,000 × 0.55 = 27,500 connections/sec')
    selectTier('High-End (Enterprise Core)')
    expect(assumption()).not.toBeChecked()
    await user.click(assumption())
    await user.click(screen.getByRole('button', { name: 'Disable PQC' }))
    expect(assumption()).not.toBeChecked()
    expect(assumption()).toBeDisabled()
    expect(calculation()).toHaveTextContent('500,000 × 1.00 = 500,000 connections/sec')
    await user.click(screen.getByRole('button', { name: 'Enable PQC' }))
    expect(assumption()).not.toBeChecked()
    expect(calculation()).toHaveTextContent('500,000 × 0.72 = 360,000 connections/sec')
  })
  it('keeps an explicit assumption scoped to the current selection and reports it as fictional', () => {
    renderAnalyzer()
    selectTier('High-End (Enterprise Core)')
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid' }))
    fireEvent.click(assumption())
    expect(screen.getByText(/explicitly selected for this fictional scenario/)).toHaveTextContent(
      'factor 0.90'
    )
    expect(screen.getByText(/explicitly selected for this fictional scenario/)).toHaveTextContent(
      'does not verify algorithm-specific acceleration'
    )
    selectTier('Entry-Level (Branch/SMB)')
    expect(screen.getByText(/not selected; the software factor applies/)).toBeInTheDocument()
    expect(calculation()).toHaveTextContent('5,000 × 0.72 = 3,600 connections/sec')
  })
  it('makes the exercise reproduce the actual explicit-input cases and preserves Load & Run navigation', () => {
    const navigate = vi.fn(),
      config = vi.fn()
    const view = render(
      <MemoryRouter>
        <NetworkSecurityExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={config} />
      </MemoryRouter>
    )
    const text = screen.getByText(
      /Select Entry-Level and Hybrid with the acceleration assumption off/
    )
    expect(text).toHaveTextContent('5,000 × 0.72 = 3,600')
    expect(text).toHaveTextContent('500,000 × 0.72 = 360,000')
    expect(text).toHaveTextContent('apply 0.90 and obtain 450,000')
    fireEvent.click(screen.getAllByRole('button', { name: /Load.*Run/ })[0])
    expect(config).toHaveBeenCalledWith({ step: 0 })
    expect(navigate).toHaveBeenCalledOnce()
    view.unmount()
    renderAnalyzer()
    selectTier('Entry-Level (Branch/SMB)')
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid' }))
    expect(calculation()).toHaveTextContent('5,000 × 0.72 = 3,600')
    selectTier('High-End (Enterprise Core)')
    expect(calculation()).toHaveTextContent('500,000 × 0.72 = 360,000')
    fireEvent.click(assumption())
    expect(calculation()).toHaveTextContent('500,000 × 0.90 = 450,000')
  })
})
