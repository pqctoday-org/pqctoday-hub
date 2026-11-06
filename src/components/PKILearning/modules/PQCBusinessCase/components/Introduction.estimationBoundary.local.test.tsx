// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Introduction } from './Introduction'

it('keeps the six scenario methods and workshop navigation while rejecting independent-validation inference', async () => {
  Element.prototype.scrollIntoView = vi.fn()
  const user = userEvent.setup()
  const openWorkshop = vi.fn()
  const view = render(
    <MemoryRouter>
      <Introduction onNavigateToWorkshop={openWorkshop} />
    </MemoryRouter>
  )
  expect(screen.getByText(/Agreement between correlated/)).toHaveTextContent(
    'not independent validation'
  )
  expect(screen.getByText(/second, assessment-derived heuristic/)).toHaveTextContent(
    'agreement does not establish reliability or independent evidence'
  )
  for (const method of [
    'Parametric / budget-anchored',
    'Bottom-up activity-based',
    'Probabilistic (Monte Carlo)',
    'Judgemental / scenario',
    'Analogical / historical',
    'Risk / cost-of-inaction (ALE)',
  ]) {
    expect(screen.getByText(method)).toBeInTheDocument()
  }
  expect(screen.queryByText(/No published methodology yet/)).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Jump to section: Workshop & Resources' }))
  await user.click(screen.getByRole('button', { name: 'Start Workshop' }))
  expect(openWorkshop).toHaveBeenCalledOnce()
  view.unmount()
})
