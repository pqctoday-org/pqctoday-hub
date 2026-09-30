// SPDX-License-Identifier: GPL-3.0-only
// aria-modal without a focus trap let Tab walk out of the panel into the page
// (and into the overlay that opened it). The panel is usually opened from
// INSIDE another focus-locked overlay, so the nested case is the one to prove.
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import FocusLock from 'react-focus-lock'
import { Button } from './button'
import { RevisionDrilldownPanel } from './RevisionDrilldownPanel'

function Host({ nested }: { nested: boolean }) {
  const [open, setOpen] = useState(false)
  const panel = open && (
    <RevisionDrilldownPanel
      domain="compliance"
      entityId="cnsa-2-0"
      entityLabel="CNSA 2.0"
      revisions={[]}
      onClose={() => setOpen(false)}
    />
  )
  return (
    <>
      <Button type="button">page button</Button>
      <FocusLock returnFocus>
        <div role="dialog" aria-label="parent overlay">
          <Button type="button" onClick={() => setOpen(true)}>
            open history
          </Button>
          <Button type="button">parent other</Button>
          {nested && panel}
        </div>
      </FocusLock>
      {!nested && panel}
    </>
  )
}

describe.each([
  ['nested inside the parent overlay’s FocusLock', true],
  ['a sibling of the parent overlay’s FocusLock', false],
])('RevisionDrilldownPanel focus trap — %s', (_label, nested) => {
  it('moves focus in, keeps it in, and hands it back to the parent lock on close', async () => {
    render(<Host nested={nested} />)
    const trigger = screen.getByRole('button', { name: 'open history' })
    trigger.focus()
    fireEvent.click(trigger)

    const panel = screen.getByRole('dialog', { name: 'Revision history for CNSA 2.0' })
    const close = screen.getByRole('button', { name: 'Close panel' })
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))

    // Focus escaping to the parent overlay or the page is pulled back.
    screen.getByRole('button', { name: 'parent other' }).focus()
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))
    screen.getByRole('button', { name: 'page button' }).focus()
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))

    fireEvent.click(close)
    expect(screen.queryByRole('dialog', { name: /Revision history/ })).toBeNull()
    // Focus returns to the trigger, and the parent lock is live again.
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    screen.getByRole('button', { name: 'page button' }).focus()
    await waitFor(() =>
      expect(
        screen.getByRole('dialog', { name: 'parent overlay' }).contains(document.activeElement)
      ).toBe(true)
    )
  })
})
