// SPDX-License-Identifier: GPL-3.0-only
// The revision panel covers its parent overlay's Share, so when the caller
// passes the entity's canonical link it carries its own Share for it.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { RevisionEntry } from '@/hooks/useRevisions'
import { RevisionDrilldownPanel } from './RevisionDrilldownPanel'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

const revisions: RevisionEntry[] = []

describe('RevisionDrilldownPanel — Share', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('shares the entity link it is given, without closing', async () => {
    const onClose = vi.fn()
    render(
      <RevisionDrilldownPanel
        domain="library"
        entityId="FIPS 203"
        entityLabel="FIPS 203"
        revisions={revisions}
        onClose={onClose}
        sharePath="/library?ref=FIPS%20203"
      />
    )
    const dialog = screen.getByRole('dialog', { name: 'Revision history for FIPS 203' })
    fireEvent.click(within(dialog).getByRole('button', { name: /^Share FIPS 203/ }))
    const copy = within(screen.getByRole('menu')).getByRole('button', { name: /Copy link/ })
    fireEvent.pointerDown(copy)
    fireEvent.mouseDown(copy)
    fireEvent.click(copy)
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/library?ref=FIPS%20203`
      )
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('has no Share when no link is given', () => {
    render(
      <RevisionDrilldownPanel
        domain="module"
        entityId="m1"
        entityLabel="Module one"
        revisions={revisions}
        onClose={() => undefined}
      />
    )
    expect(screen.queryByRole('button', { name: /^Share / })).toBeNull()
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeInTheDocument()
  })
})
