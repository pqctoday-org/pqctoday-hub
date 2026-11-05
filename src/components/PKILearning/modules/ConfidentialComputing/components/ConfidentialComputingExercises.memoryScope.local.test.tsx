// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ConfidentialComputingExercises } from './ConfidentialComputingExercises'

describe('memory encryption sample scope', () => {
  it('qualifies processor-dependent modes and the idealized calculation without changing workshop routing', () => {
    const setConfig = vi.fn()
    const navigate = vi.fn()
    render(
      <MemoryRouter>
        <ConfidentialComputingExercises
          onNavigateToWorkshop={navigate}
          onSetWorkshopConfig={setConfig}
        />
      </MemoryRouter>
    )
    screen.getByRole('heading', {
      name: '3. Memory Encryption Grover Impact — Calculate post-quantum security of AES-128',
    })
    expect(screen.getByText(/This lesson uses a 128-bit key as its sample/)).toBeInTheDocument()
    expect(screen.getByText(/AMD documents AES-128 XEX and AES-256 XTS/)).toBeInTheDocument()
    expect(
      screen.getByText(/2\^128 to ~2\^64 operations in the idealized Grover model/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/where your processor generation enumerates and supports them/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Both use AES-XTS-128/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Upgrade path: AES-XTS-256/)).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[2])
    expect(setConfig).toHaveBeenCalledExactlyOnceWith({ step: 2 })
    expect(navigate).toHaveBeenCalledOnce()
  })
})
