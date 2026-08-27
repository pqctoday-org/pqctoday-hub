// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MobileSheet } from './Sheet'
import { Button } from '@/components/ui/button'

function ControlledSheet(props: { testId: string; title?: string }) {
  const [open, setOpen] = useState(true)
  return (
    <MobileSheet
      open={open}
      onClose={() => setOpen(false)}
      title={props.title}
      testId={props.testId}
    >
      <Button type="button">inside action</Button>
    </MobileSheet>
  )
}

describe('MobileSheet', () => {
  it('renders nothing when closed', () => {
    render(<MobileSheet open={false} onClose={() => {}} testId="s1" />)
    expect(screen.queryByTestId('s1')).not.toBeInTheDocument()
  })

  it('renders with role dialog and aria-modal when open, with a title', () => {
    render(<MobileSheet open onClose={() => {}} title="Test Sheet" testId="s1" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Test Sheet')).toBeInTheDocument()
  })

  it('closes on overlay click', () => {
    const onClose = vi.fn()
    render(<MobileSheet open onClose={onClose} testId="s1" />)
    fireEvent.click(screen.getByTestId('s1-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on the Close button', () => {
    const onClose = vi.fn()
    render(<MobileSheet open onClose={onClose} title="X" testId="s1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<MobileSheet open onClose={onClose} testId="s1" />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(<MobileSheet open onClose={() => {}} testId="s1" />)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<MobileSheet open={false} onClose={() => {}} testId="s1" />)
    expect(document.body.style.overflow).toBe('')
  })

  it('traps focus: Tab from the last focusable element cycles to the first', async () => {
    const user = userEvent.setup()
    render(
      <MobileSheet open onClose={() => {}} title="Focus test" testId="s1">
        <Button type="button">one</Button>
        <Button type="button">two</Button>
      </MobileSheet>
    )
    const closeBtn = screen.getByRole('button', { name: 'Close' })
    const two = screen.getByRole('button', { name: 'two' })
    two.focus()
    expect(document.activeElement).toBe(two)
    await user.tab()
    expect(document.activeElement).toBe(closeBtn)
    // Shift+Tab from the first (Close, since it renders before content) cycles to the last.
    closeBtn.focus()
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(two)
  })

  it('enforces one sheet at a time: opening a second closes the first', () => {
    const closeFirst = vi.fn()
    const { rerender } = render(<MobileSheet open onClose={closeFirst} testId="first" />)
    rerender(
      <>
        <MobileSheet open onClose={closeFirst} testId="first" />
        <MobileSheet open onClose={vi.fn()} testId="second" />
      </>
    )
    expect(closeFirst).toHaveBeenCalled()
  })

  it('is a controlled component that can close itself via its own onClose', () => {
    render(<ControlledSheet testId="s1" title="Controlled" />)
    expect(screen.getByTestId('s1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('s1')).not.toBeInTheDocument()
  })
})
