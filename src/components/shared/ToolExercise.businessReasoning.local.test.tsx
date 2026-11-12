// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToolExercise } from './ToolExercise'
import { useModuleStore } from '@/store/useModuleStore'


describe('Business exercise evidence and uncertainty reasoning', () => {
  it('accepts the policy-scoped hybrid outcome without treating filled references as proof', async () => {
    const user = userEvent.setup()
    const before = useModuleStore.getState()
    render(<ToolExercise toolId="migration-verification" family="business" />)
    expect(screen.getByText(/captures show that hybrid path/i)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^The tested path supports/ }))
    const feedback = screen.getByRole('status')
    expect(feedback).toHaveTextContent('Right.')
    expect(feedback).toHaveTextContent(
      'Intentional traditional+PQC hybrid is not the same as unintended traditional-only fallback'
    )
    expect(feedback).toHaveTextContent('not technical proof of removal')
    expect(feedback).toHaveTextContent('withdrawal of obsolete verifier trust')
    expect(useModuleStore.getState()).toBe(before)
  })

  it('rejects both a categorical hybrid rejection and the checklist-removal claim in the real consumer', async () => {
    const user = userEvent.setup()
    render(<ToolExercise toolId="migration-verification" family="business" />)
    for (const choice of [
      /^The transition must be rejected solely/,
      /^The filled checklist proves/,
    ]) {
      await user.click(screen.getByRole('button', { name: choice }))
      expect(screen.getByRole('status')).toHaveTextContent('Not quite')
      expect(screen.getByRole('status')).toHaveTextContent(
        'The tested path supports the stated hybrid policy'
      )
      expect(screen.getByRole('status')).toHaveTextContent(
        'do not establish coverage of every endpoint'
      )
    }
  })

  it('accepts method agreement only conditional on shared inputs and teaches how to repair the wrong assumption', async () => {
    const user = userEvent.setup()
    const before = useModuleStore.getState()
    render(<ToolExercise toolId="cost-model-explorer" family="business" />)
    expect(screen.getByText(/inventory that omits several systems/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Only limited disagreement/ }))
    const feedback = screen.getByRole('status')
    expect(feedback).toHaveTextContent('Right.')
    expect(feedback).toHaveTextContent('both estimates wrong in the same direction')
    expect(feedback).toHaveTextContent('Correct that inventory, rerun the estimates')
    expect(feedback).toHaveTextContent('vary uncertain assumptions')
    expect(feedback).toHaveTextContent('costs the models omit')
    expect(feedback).toHaveTextContent('not by itself a calibrated confidence interval')
    expect(useModuleStore.getState()).toBe(before)
  })

  it('rejects calibrated-interval and missing-system assurances even when two estimates agree', async () => {
    const user = userEvent.setup()
    render(<ToolExercise toolId="cost-model-explorer" family="business" />)
    for (const choice of [
      /^The spread includes all uncertainty/,
      /^Agreement means the missing systems/,
    ]) {
      await user.click(screen.getByRole('button', { name: choice }))
      const feedback = screen.getByRole('status')
      expect(feedback).toHaveTextContent('Not quite')
      expect(feedback).toHaveTextContent('their errors are correlated')
      expect(feedback).toHaveTextContent('separately from common-input and unmodeled uncertainty')
    }
  })
})
