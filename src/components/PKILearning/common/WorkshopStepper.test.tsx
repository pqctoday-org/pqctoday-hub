// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkshopStepper } from './WorkshopStepper'

const STEPS = [
  { id: 'step-1', label: 'Key Setup' },
  { id: 'step-2', label: 'Sign' },
  { id: 'step-3', label: 'Verify' },
]

describe('WorkshopStepper', () => {
  it('renders nothing when fewer than 2 steps', () => {
    const { container } = render(
      <WorkshopStepper steps={[{ id: 'only', label: 'Only' }]} currentStep={0} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders all step buttons', () => {
    render(<WorkshopStepper steps={STEPS} currentStep={1} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('marks step before current as completed', () => {
    render(<WorkshopStepper steps={STEPS} currentStep={1} completedSteps={['step-1']} />)
    expect(screen.getByRole('button', { name: /key setup.*completed/i })).toBeInTheDocument()
  })

  it('marks current step with aria-current="step"', () => {
    render(<WorkshopStepper steps={STEPS} currentStep={1} />)
    const currentBtn = screen.getByRole('button', { name: /sign.*current/i })
    expect(currentBtn).toHaveAttribute('aria-current', 'step')
  })

  it('disables future steps', () => {
    render(<WorkshopStepper steps={STEPS} currentStep={0} />)
    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled()
  })

  it('calls onStepClick when clicking a completed step', async () => {
    const user = userEvent.setup()
    const onStepClick = vi.fn()
    render(
      <WorkshopStepper
        steps={STEPS}
        currentStep={2}
        completedSteps={['step-1', 'step-2']}
        onStepClick={onStepClick}
      />
    )
    await user.click(screen.getByRole('button', { name: /key setup/i }))
    expect(onStepClick).toHaveBeenCalledWith(0)
  })
})
