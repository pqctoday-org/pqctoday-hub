// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { APISecurityExercises } from './APISecurityExercises'
it('keeps the nested exercise routing while explaining its emitted token limits', () => {
  const config = vi.fn(),
    navigate = vi.fn()
  render(
    <MemoryRouter>
      <APISecurityExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={config} />
    </MemoryRouter>
  )
  expect(screen.getByText(/not the simple sum of two token lengths/)).toBeInTheDocument()
  expect(screen.getByText(/unmodified classical-only verifier cannot validate/)).toBeInTheDocument()
  expect(screen.queryByText(/roughly the sum of both JWTs/)).not.toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: /Load.*Run/ })[2])
  expect(config).toHaveBeenCalledWith({ step: 2 })
  expect(navigate).toHaveBeenCalledOnce()
})
