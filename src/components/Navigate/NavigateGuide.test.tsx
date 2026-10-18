// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NavigateGuide } from './NavigateGuide'

describe('NavigateGuide', () => {
  it('explains the graph encoding without turning connectivity into importance', () => {
    render(<NavigateGuide persona="curious" onTour={() => {}} onList={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Explore how the hub connects' })).toBeVisible()
    expect(screen.getByText(/each node is a hub record/i)).toBeVisible()
    expect(screen.getByText(/not more important, trustworthy, or mature/i)).toBeVisible()
    expect(screen.getByText(/guided tour first/i)).toBeVisible()
  })

  it('offers working tour and keyboard-list entry points', () => {
    const onTour = vi.fn()
    const onList = vi.fn()
    render(<NavigateGuide persona="cert-engineer" onTour={onTour} onList={onList} />)

    fireEvent.click(screen.getByRole('button', { name: 'Start guided tour' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open accessible list' }))

    expect(onTour).toHaveBeenCalledOnce()
    expect(onList).toHaveBeenCalledOnce()
  })
})
