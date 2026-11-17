// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { SecurityTargetScopeExercise } from './SecurityTargetScopeExercise'

it('corrects a whole-target overclaim and clears the verdict between source records', () => {
  render(<SecurityTargetScopeExercise />)
  fireEvent.click(screen.getByText('Read the exact Security Target scope'))
  const check = () => fireEvent.click(screen.getByRole('button', { name: 'Check interpretation' }))
  fireEvent.click(screen.getByLabelText('Supported', { exact: true }))
  check()
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'Review the scope.'
  )
  fireEvent.click(screen.getByLabelText('Contradicted by the stated scope'))
  expect(
    screen.getByRole('status', { name: 'Security Target interpretation' })
  ).toBeEmptyDOMElement()
  check()
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'Correct.'
  )
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'global claim is EAL5'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Example 2' }))
  expect(
    screen.getByRole('status', { name: 'Security Target interpretation' })
  ).toBeEmptyDOMElement()
  expect(screen.getByRole('button', { name: 'Check interpretation' })).toBeDisabled()
  fireEvent.click(screen.getByLabelText('Supported', { exact: true }))
  check()
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'Correct.'
  )
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'verification operation'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Example 3' }))
  fireEvent.click(screen.getByLabelText('Not established by the reviewed evidence'))
  check()
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'Correct.'
  )
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'parameter set'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Example 4' }))
  fireEvent.click(screen.getByLabelText('Supported', { exact: true }))
  check()
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'Correct.'
  )
  expect(screen.getByRole('status', { name: 'Security Target interpretation' })).toHaveTextContent(
    'document revision'
  )
})
