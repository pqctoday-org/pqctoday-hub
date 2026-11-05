// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FheConceptsWorkshop } from './FheConceptsWorkshop'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'

beforeEach(() => {
  usePersonaStore.getState().setPersona('cert-engineer')
  useModuleStore.getState().setActiveLearnPath('homomorphic-encryption', 'hsm-custody')
})

function openRounding() {
  render(<FheConceptsWorkshop />)
  fireEvent.click(screen.getByRole('button', { name: /Encode, decode and rounding/ }))
}

describe('Rounding interpretation follows the existing boundary-dependent illustration', () => {
  it('a sub-step perturbation can change the released integer near a boundary', () => {
    openRounding()
    const x = 2 ** -21 - 2 ** -40
    fireEvent.change(screen.getByLabelText('Value 1'), { target: { value: String(x) } })
    expect(screen.getByTestId('released-int-0')).toHaveTextContent(/^0$/)
    fireEvent.change(screen.getByLabelText('Illustrative noise exponent'), {
      target: { value: '1' },
    })
    expect(2 / 2 ** 40).toBeLessThan(2 ** -20)
    expect(screen.getByTestId('released-int-0')).toHaveTextContent(/^1$/)
    expect(screen.getByText(/Stability depends on the distance/)).toHaveTextContent(
      /rounding alone does not establish confidentiality/
    )
    expect(screen.queryByText(/below it, the release hides the noise/)).not.toBeInTheDocument()
  })

  it('the same perturbation away from a boundary leaves the existing release unchanged', () => {
    openRounding()
    fireEvent.change(screen.getByLabelText('Value 1'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Illustrative noise exponent'), {
      target: { value: '1' },
    })
    expect(screen.getByTestId('released-int-0')).toHaveTextContent(/^0$/)
    fireEvent.change(screen.getByLabelText('Illustrative noise exponent'), {
      target: { value: '0' },
    })
    fireEvent.change(screen.getByLabelText('Value 1'), { target: { value: '3.14159265' } })
    expect(screen.getByTestId('released-int-0')).toHaveTextContent('3,294,199')
    expect(screen.getByText(/MX95 and MX95 Pro tokens, 32,768 slots/)).toBeInTheDocument()
  })
})
