// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PolicyScopeExercise } from './PolicyScopeExercise'

it('rejects an empty year, recovers, and invalidates the old result when assumptions change', () => {
  render(<PolicyScopeExercise />)
  fireEvent.click(screen.getByText('Practice: policy scope, algorithm use and retention risk'))
  const year = screen.getByLabelText('Migration completion year')
  const evaluate = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Evaluate the fictional scenario' }))
  fireEvent.change(year, { target: { value: '' } })
  evaluate()
  expect(screen.getByRole('alert')).toHaveTextContent('whole completion year')
  expect(screen.queryByText('Scenario arithmetic:', { exact: false })).toBeNull()
  fireEvent.change(year, { target: { value: '2031' } })
  evaluate()
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('status')).toHaveTextContent('exceeds this policy')
  expect(screen.getByRole('status')).toHaveTextContent('does not supply')
  fireEvent.change(year, { target: { value: '2030' } })
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
  evaluate()
  expect(screen.getByRole('status')).not.toHaveTextContent('exceeds this policy')
})
