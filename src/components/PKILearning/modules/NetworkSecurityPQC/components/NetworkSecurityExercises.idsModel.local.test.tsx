// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { NetworkSecurityExercises } from './NetworkSecurityExercises'
import { IDSSignatureUpdater } from '../workshop/IDSSignatureUpdater'

describe('IDS exercise interpretation of the existing illustrative model', () => {
  it('shows 5% with no high-risk rule and 7% with one at the same base rate', () => {
    render(<IDSSignatureUpdater />)
    fireEvent.click(screen.getByRole('button', { name: 'Disable All' }))
    expect(screen.getByText('5%', { exact: true })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Enable PQC Downgrade Attack Detection' }))
    expect(screen.getAllByText('7%', { exact: true })[0]).toBeVisible()
    expect(screen.getByRole('slider', { name: 'Base false positive rate' })).toHaveValue('5')
    fireEvent.click(screen.getByRole('button', { name: 'Disable PQC Downgrade Attack Detection' }))
    expect(screen.getByText('5%', { exact: true })).toBeVisible()
  })

  it('teaches model outputs rather than a guaranteed low-noise configuration and preserves navigation', () => {
    const onNavigateToWorkshop = vi.fn()
    const onSetWorkshopConfig = vi.fn()
    render(
      <MemoryRouter>
        <NetworkSecurityExercises
          onNavigateToWorkshop={onNavigateToWorkshop}
          onSetWorkshopConfig={onSetWorkshopConfig}
        />
      </MemoryRouter>
    )
    const observation = screen.getByText(
      /In this illustrative model, enabling one high false positive risk rule/
    )
    expect(observation).toHaveTextContent('7% (5% × 1.4)')
    expect(observation).toHaveTextContent('the same base rate remains 5%')
    expect(observation).toHaveTextContent('not measured IDS performance')
    expect(observation).not.toHaveTextContent(/90%\+|<5%|9%/)
    expect(screen.getByText(/all five components set to Hybrid/)).toHaveTextContent('28 (Low Risk)')
    expect(screen.getByText(/all five components set to Hybrid/)).toHaveTextContent(
      '40 (Moderate Risk)'
    )
    fireEvent.click(screen.getAllByRole('button', { name: /Load.*Run/ })[2])
    expect(onSetWorkshopConfig).toHaveBeenCalledWith({ step: 2 })
    expect(onNavigateToWorkshop).toHaveBeenCalledOnce()
  })
})
