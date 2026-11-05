// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EMVPaymentExercises } from './EMVPaymentExercises'

describe('payment dependency exercise is an illustrative planning question', () => {
  it('does not turn an assumed chain into universal prerequisites or a computed critical path', () => {
    const onNavigateToWorkshop = vi.fn(),
      onSetWorkshopConfig = vi.fn()
    render(
      <MemoryRouter>
        <EMVPaymentExercises
          onNavigateToWorkshop={onNavigateToWorkshop}
          onSetWorkshopConfig={onSetWorkshopConfig}
        />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('heading', { name: /6. End-to-End Migration Priority/ })
    ).toHaveTextContent('Explore illustrative dependency chains')
    const note = screen.getByText(/This sample includes a chain from HSM key wrapping/)
    expect(note).toHaveTextContent('e-commerce TLS, have no prerequisites recorded here')
    expect(note).toHaveTextContent(
      'do not require every preparation or pilot to wait for HSM migration'
    )
    expect(note).toHaveTextContent(
      'scoped activity durations, constraints and validated dependencies'
    )
    expect(note).not.toHaveTextContent(/must migrate.*first|enables all downstream/)
    expect(note).toHaveTextContent('3-5 year card cycle is an estimate')
    fireEvent.click(screen.getAllByRole('button', { name: /Load.*Run/ })[5])
    expect(onSetWorkshopConfig).toHaveBeenCalledWith({ step: 5 })
    expect(onNavigateToWorkshop).toHaveBeenCalledOnce()
  })
})
