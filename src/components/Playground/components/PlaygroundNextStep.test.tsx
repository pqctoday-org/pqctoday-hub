// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { PlaygroundNextStep } from './PlaygroundNextStep'
import {
  ModuleWorkshopNextContext,
  WorkshopNavigationContext,
} from '../contexts/WorkshopNavigationContext'

const card = (
  <PlaygroundNextStep toolId="drbg-demo" name="SP 800-90A DRBG" description="Seed an HMAC_DRBG." />
)

describe('PlaygroundNextStep', () => {
  it('opens the next Playground tool when it runs in the Playground', () => {
    const selectTool = vi.fn()
    render(
      <WorkshopNavigationContext.Provider value={{ selectTool }}>
        {card}
      </WorkshopNavigationContext.Provider>
    )
    expect(screen.getByText('SP 800-90A DRBG')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Open/ }))
    expect(selectTool).toHaveBeenCalledWith('drbg-demo')
  })

  it('names the next step on the learner’s path when it runs inside a Learn module', () => {
    const open = vi.fn()
    render(
      <ModuleWorkshopNextContext.Provider
        value={{ name: 'ESV Validation', description: 'Walk through the ESV process.', open }}
      >
        {card}
      </ModuleWorkshopNextContext.Provider>
    )
    expect(screen.getByText('ESV Validation')).toBeInTheDocument()
    expect(screen.queryByText('SP 800-90A DRBG')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Open/ }))
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('shows no card on the last step of a Learn module', () => {
    render(
      <ModuleWorkshopNextContext.Provider value={null}>{card}</ModuleWorkshopNextContext.Provider>
    )
    expect(screen.queryByText('Next in sequence')).not.toBeInTheDocument()
  })
})
