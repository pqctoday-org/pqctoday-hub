// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Glossary } from './Glossary'
import { Button } from '@/components/ui/button'
function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <MemoryRouter>
      <Button onClick={() => setOpen(true)}>Open glossary</Button>
      <Glossary isOpen={open} onClose={() => setOpen(false)} />
    </MemoryRouter>
  )
}
describe('Glossary modal access', () => {
  it('keeps focus inside the dialog and restores its opener on Escape', async () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open glossary' })
    opener.focus()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'PQC Glossary' })
    const search = within(dialog).getByRole('textbox', { name: 'Search glossary terms' })
    await waitFor(() => expect(search).toHaveFocus())
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.change(search, { target: { value: 'X25519MLKEM768' } })
    const last = await within(dialog).findByRole('link', { name: 'Related module →' })
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(within(dialog).getByRole('button', { name: 'Close glossary' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'PQC Glossary' })).not.toBeInTheDocument()
    )
    expect(opener).toHaveFocus()
    expect(document.body.style.overflow).not.toBe('hidden')
  })
  it('closes from its visible button and restores focus', async () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open glossary' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.click(screen.getByRole('button', { name: 'Close glossary' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
  })
})
