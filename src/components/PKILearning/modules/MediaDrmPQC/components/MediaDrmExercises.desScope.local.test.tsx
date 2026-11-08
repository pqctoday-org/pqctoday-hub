// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MediaDrmExercises } from './MediaDrmExercises'

describe('CI Plus classification exercise', () => {
  it('says that absence from the NIST tables is not a recommendation to use DES', () => {
    const setConfig = vi.fn()
    const navigate = vi.fn()
    render(
      <MemoryRouter>
        <MediaDrmExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={setConfig} />
      </MemoryRouter>
    )
    screen.getByRole('heading', { name: '2. Classify the CI Plus rungs against the NIST tables' })
    const observation = screen.getByText(/The authentication signatures \(RSASSA-PSS\)/)
    expect(observation).toHaveTextContent(
      'The lesson draws no conclusion about the strength of DES-56 or AES-128. NIST withdrew DES (FIPS 46-3) in 2005 for classical-security reasons, so absence from these tables is not a recommendation to use it.'
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[1])
    expect(setConfig).toHaveBeenCalledExactlyOnceWith({ step: 0 })
    expect(navigate).toHaveBeenCalledOnce()
  })
})
