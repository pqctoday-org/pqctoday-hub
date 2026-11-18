// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it } from 'vitest'
import { SignedMxExercise } from './SignedMxExercise'

it('obtains the complete MX answer before verifying; TCP cannot repair a corrupt signature', () => {
  render(<SignedMxExercise />)
  const query = () => fireEvent.click(screen.getByRole('button', { name: 'Query over UDP' }))
  const retry = () => fireEvent.click(screen.getByRole('button', { name: 'Retry over TCP' }))
  const corrupt = screen.getByRole('checkbox')
  const status = screen.getByRole('status')
  query()
  expect(status.textContent).toContain('TC=1')
  retry()
  expect(status.textContent).toContain('AD=1')
  fireEvent.click(corrupt)
  expect(status.textContent).toBe('')
  query()
  retry()
  expect(status.textContent).toContain('SERVFAIL')
  fireEvent.click(screen.getByRole('radio', { name: '4096 bytes' }))
  query()
  expect(status.textContent).toContain('SERVFAIL')
  fireEvent.click(corrupt)
  query()
  expect(status.textContent).toContain('AD=1')
})
