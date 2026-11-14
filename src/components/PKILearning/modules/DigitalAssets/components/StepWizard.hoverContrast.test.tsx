// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The green "Next Step" and "Completed" buttons use the ghost variant, whose
 * hover rule turns the label to the page foreground (near-black). On the green
 * background that reads at about 3:1, under the 4.5:1 floor. The last click of a
 * step usually leaves the pointer exactly where these buttons appear, so the
 * hover state is what many learners see. The label must keep its light colour
 * on hover.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepWizard, type Step } from './StepWizard'

const steps: Step[] = [
  { id: 'a', title: 'First', description: 'one', code: 'echo 1', language: 'bash' },
  { id: 'b', title: 'Last', description: 'two', code: 'echo 2', language: 'bash' },
]

function renderAt(index: number) {
  render(
    <StepWizard
      steps={steps}
      currentStepIndex={index}
      onNext={vi.fn()}
      onBack={vi.fn()}
      onExecute={vi.fn(async () => {})}
      isExecuting={false}
      output="done"
      error={null}
      isStepComplete
    />
  )
}

function hoverTextClasses(el: HTMLElement): string[] {
  return el.className.split(/\s+/).filter((c) => c.startsWith('hover:text-'))
}

describe('StepWizard green buttons keep a readable label on hover', () => {
  it('Next Step', () => {
    renderAt(0)
    const b = screen.getByRole('button', { name: /Next Step/ })
    expect(hoverTextClasses(b)).toEqual(['hover:text-success-foreground'])
  })

  it('Completed', () => {
    renderAt(1)
    const b = screen.getByRole('button', { name: /Completed/ })
    expect(hoverTextClasses(b)).toEqual(['hover:text-success-foreground'])
  })
})
