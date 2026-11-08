// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'
import { HsmTestMethodologyModal } from './HsmTestMethodologyModal'

function Example() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open methodology</Button>
      {open && <HsmTestMethodologyModal onClose={() => setOpen(false)} />}
    </>
  )
}
describe('methodology header close control is named and keyboard operable', () => {
  it.each(['{Enter}', ' '])(
    'opens the actual modal and closes its named header control with %s',
    async (key) => {
      const user = userEvent.setup()
      render(<Example />)
      await user.click(screen.getByRole('button', { name: 'Open methodology' }))
      const close = screen.getByRole('button', { name: 'Close test methodology' })
      expect(close).toHaveAccessibleName('Close test methodology')
      await user.tab()
      expect(close).toHaveFocus()
      await user.keyboard(key)
      expect(
        screen.queryByRole('heading', { name: 'SoftHSMv3 WASM — Test Methodology' })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Close test methodology' })
      ).not.toBeInTheDocument()
    }
  )
  it('uses the existing overlay Escape behavior after opening and permits reopening', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Open methodology' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Close test methodology' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open methodology' }))
    expect(screen.getByRole('button', { name: 'Close test methodology' })).toBeVisible()
  })
})
