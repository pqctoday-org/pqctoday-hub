// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FheConceptsWorkshop } from './FheConceptsWorkshop'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
beforeEach(() => {
  usePersonaStore.getState().setPersona('cert-engineer')
  useModuleStore.getState().setActiveLearnPath('homomorphic-encryption', 'hsm-custody')
})
describe('FHE illustrative refusal reasons', () => {
  it('fifth Add explains TFHE noise overflow without claiming exhausted CKKS levels', () => {
    render(<FheConceptsWorkshop />)
    const add = screen.getByRole('button', { name: 'Add' })
    for (let i = 0; i < 4; i++) fireEvent.click(add)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'TFHE noise level' })).toHaveAttribute(
      'aria-valuenow',
      '98'
    )
    fireEvent.click(add)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This illustrative addition would exceed the noise margin.'
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent('multiplication level')
    expect(screen.getByRole('meter', { name: 'TFHE noise level' })).toHaveAttribute(
      'aria-valuenow',
      '98'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bootstrap' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'TFHE noise level' })).toHaveAttribute(
      'aria-valuenow',
      '10'
    )
  })
  it('seventh Multiply retains CKKS-specific level refusal', () => {
    render(<FheConceptsWorkshop />)
    for (let i = 0; i < 7; i++) fireEvent.click(screen.getByRole('button', { name: 'Multiply' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No multiplication level remains.')
    expect(screen.getByRole('alert')).not.toHaveTextContent('illustrative addition')
  })
})
