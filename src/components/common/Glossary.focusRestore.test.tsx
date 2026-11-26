// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { Glossary } from './Glossary'
import { Button } from '@/components/ui/button'

vi.mock('../../data/glossary', () => ({ loadGlossary: async () => [] }))

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <MemoryRouter>
      <Button onClick={() => setOpen(true)}>Open glossary</Button>
      <Glossary isOpen={open} onClose={() => setOpen(false)} />
    </MemoryRouter>
  )
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('Glossary modal focus on a quick close', () => {
  it('does not take focus back from the opener while the panel slides out', () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open glossary' })
    opener.focus()
    fireEvent.click(opener)
    // Close before the search box would have taken focus (it waits 200 ms).
    fireEvent.click(screen.getByRole('button', { name: 'Close glossary' }))
    expect(opener).toHaveFocus()
    // The panel is still sliding out; the late focus move must not fire.
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(screen.queryByRole('textbox', { name: 'Search glossary terms' })).not.toHaveFocus()
    expect(opener).toHaveFocus()
  })
})
