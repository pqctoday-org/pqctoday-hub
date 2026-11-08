// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PQCTestingExercises } from './PQCTestingExercises'

describe('satellite sample target comparison', () => {
  it('does not recommend a failing sample and preserves its workshop action', () => {
    const onNavigateToWorkshop = vi.fn()
    const onSetWorkshopConfig = vi.fn()
    render(
      <MemoryRouter>
        <PQCTestingExercises
          onNavigateToWorkshop={onNavigateToWorkshop}
          onSetWorkshopConfig={onSetWorkshopConfig}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /Satellite Link Performance Impact/ })).toBeVisible()
    expect(screen.getByText(/This illustrative scenario uses remote sites/)).toHaveTextContent(
      'VPN setup target below 2 seconds'
    )
    const observation = screen.getByText(/The illustrative VPN setup times are/)
    for (const seconds of [4.8, 7.2, 95]) {
      expect(seconds < 2).toBe(false)
      expect(observation).toHaveTextContent(`${seconds} seconds`)
    }
    expect(observation).toHaveTextContent('None meets the stated target below 2 seconds')
    expect(observation).toHaveTextContent('that comparison alone does not justify recommending it')
    expect(observation).not.toHaveTextContent('already at SLA limit')
    expect(observation).not.toHaveTextContent('satellite sites require hybrid PQC only')
    fireEvent.click(screen.getAllByRole('button', { name: 'Try It' })[2])
    expect(onSetWorkshopConfig).toHaveBeenCalledWith({ step: 2 })
    expect(onNavigateToWorkshop).toHaveBeenCalledOnce()
  })
})
