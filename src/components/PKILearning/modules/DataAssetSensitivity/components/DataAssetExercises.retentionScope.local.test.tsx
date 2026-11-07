// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DataAssetExercises } from './DataAssetExercises'

describe('hospital retention teaching scope', () => {
  it('distinguishes documentation retention from the fictional hospital assumption', () => {
    const setConfig = vi.fn()
    const navigate = vi.fn()
    render(
      <MemoryRouter>
        <DataAssetExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={setConfig} />
      </MemoryRouter>
    )
    screen.getByRole('heading', {
      name: '1. Healthcare HNDL Classification Challenge',
    })
    expect(
      screen.getByText(/6-year rule covers required compliance documentation, not patient records/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/For this sample, assume a 30-year retention period/)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/6-year minimum retention from last patient encounter/)
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[0])
    expect(setConfig).toHaveBeenCalledExactlyOnceWith({ step: 0 })
    expect(navigate).toHaveBeenCalledOnce()
  })
})
