// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NavigateGuide } from './NavigateGuide'

describe('NavigateGuide', () => {
  it('explains the graph encoding without turning connectivity into importance', () => {
    render(
      <NavigateGuide persona="curious" onTour={() => {}} onList={() => {}} onDismiss={() => {}} />
    )

    expect(screen.getByRole('heading', { name: 'Explore how the hub connects' })).toBeVisible()
    expect(screen.getByText(/each node is a hub record/i)).toBeVisible()
    expect(screen.getByText(/not more important, trustworthy, or mature/i)).toBeVisible()
    expect(screen.getByText(/guided tour first/i)).toBeVisible()
  })

  it('gives the certification role a start point that does not read a link as a validation', () => {
    render(
      <NavigateGuide
        persona="cert-engineer"
        onTour={() => {}}
        onList={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(
      screen.getByText(/FIPS 140-3 compliance record or the CMVP trusted source/)
    ).toBeVisible()
    expect(screen.getByText(/not a validation/)).toBeVisible()
  })

  it('is a narrow card from the sm breakpoint up, so it stays in the left margin and does not cover category labels', () => {
    render(
      <NavigateGuide persona="curious" onTour={() => {}} onList={() => {}} onDismiss={() => {}} />
    )
    const card = screen.getByTestId('navigate-guide')
    expect(card).toHaveClass('sm:w-72')
    // The old max-w-xl card alone (576 px) reached the graph's labels.
    expect(card.className).not.toMatch(/sm:w-(xl|2xl|full)/)
  })

  it('offers working tour and keyboard-list entry points', () => {
    const onTour = vi.fn()
    const onList = vi.fn()
    render(
      <NavigateGuide persona="cert-engineer" onTour={onTour} onList={onList} onDismiss={() => {}} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Start guided tour' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open accessible list' }))

    expect(onTour).toHaveBeenCalledOnce()
    expect(onList).toHaveBeenCalledOnce()
  })

  it('can be closed', () => {
    const onDismiss = vi.fn()
    render(
      <NavigateGuide persona={null} onTour={() => {}} onList={() => {}} onDismiss={onDismiss} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close guide' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
