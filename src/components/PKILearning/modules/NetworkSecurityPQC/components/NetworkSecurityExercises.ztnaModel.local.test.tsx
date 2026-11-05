// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { ZTNA_COMPONENTS } from '../data/networkConstants'
import { NetworkSecurityExercises } from './NetworkSecurityExercises'
import { ZTNAPQCDesigner } from '../workshop/ZTNAPQCDesigner'

describe('ZTNA exercise interpretation of the unchanged sample model', () => {
  it('matches the actual all-Hybrid and classical-IdP model outcomes', () => {
    render(<ZTNAPQCDesigner />)
    expect(8 + 4 + 4 + 8 + 4).toBe(28)
    expect(screen.getByText('28', { exact: true })).toBeVisible()
    expect(screen.getByText('Low Risk', { exact: true })).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: 'Classical' })[0])
    expect(20 + 4 + 4 + 8 + 4).toBe(40)
    expect(screen.getByText('40', { exact: true })).toBeVisible()
    expect(screen.getByText('Moderate Risk', { exact: true })).toBeVisible()
    expect(screen.queryByText('High Risk', { exact: true })).not.toBeInTheDocument()
  })

  it('teaches the same score boundary without promising compatibility from a selector', () => {
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
    const observation = screen.getByText(/In this illustrative scoring model/)
    expect(observation).toHaveTextContent('28 (Low Risk)')
    expect(observation).toHaveTextContent('40 (Moderate Risk)')
    expect(observation).toHaveTextContent('Selecting Hybrid does not establish compatibility')
    expect(observation).toHaveTextContent('certificate or token profile support')
    expect(observation).toHaveTextContent('test it with your own tools')
    fireEvent.click(screen.getAllByRole('button', { name: /Load.*Run/ })[4])
    expect(onSetWorkshopConfig).toHaveBeenCalledWith({ step: 4 })
    expect(onNavigateToWorkshop).toHaveBeenCalledOnce()
  })

  it('keeps the stored IdP and gateway notes conditional rather than promising compatibility', () => {
    const identity = ZTNA_COMPONENTS.find((component) => component.id === 'identity-provider')
    const gateway = ZTNA_COMPONENTS.find((component) => component.id === 'application-gateway')
    expect(identity?.notes).toContain(
      'Compatibility during transition depends on matching endpoint'
    )
    expect(identity?.notes).toContain('selecting Hybrid alone does not establish it')
    expect(gateway?.notes).toContain('Certificate compatibility depends on endpoint support')
    expect(gateway?.notes).toContain('a hybrid label alone is insufficient')
  })
})
