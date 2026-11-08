// SPDX-License-Identifier: AGPL-3.0-only
import { useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterDropdown } from './FilterDropdown'
import { useOverlayEscape, overlayStackDepth } from '@/hooks/useOverlayEscape'
import { Button } from '@/components/ui/button'

let view: ReturnType<typeof render> | null = null
const parentClose = vi.fn()
const newerClose = vi.fn()
const foreignClose = vi.fn()
function RegisteredDialog({ newer = false }: { newer?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  useOverlayEscape(true, newer ? newerClose : parentClose, { rootRef: root })
  return (
    <div role="dialog" aria-label={newer ? 'Newer dialog' : 'Underlying dialog'} ref={root}>
      <Button>Dialog action</Button>
    </div>
  )
}
function Fixture({
  underlying = false,
  multi = false,
  searchable = false,
}: {
  underlying?: boolean
  multi?: boolean
  searchable?: boolean
}) {
  const [selection, setSelection] = useState('A')
  const [selected, setSelected] = useState<string[]>([])
  const [newer, setNewer] = useState(false)
  const [foreign, setForeign] = useState(false)
  return (
    <>
      {underlying && <RegisteredDialog />}
      <FilterDropdown
        ariaLabel="Fixture choice"
        items={['A', 'B']}
        selectedId={selection}
        onSelect={setSelection}
        searchable={searchable}
        {...(multi ? { multiSelectedIds: selected, onMultiSelect: setSelected } : {})}
      />
      <output aria-label="Selected choice">{selection}</output>
      <output aria-label="Multi choices">{selected.join(',')}</output>
      <Button onClick={() => setNewer(true)}>Open newer dialog</Button>
      <Button onClick={() => setForeign(true)}>Open foreign dialog</Button>
      <Button>Outside action</Button>
      {newer && <RegisteredDialog newer />}
      {foreign && (
        <div role="dialog" aria-label="Foreign dialog">
          <Button
            onKeyDown={(event) => {
              if (event.key === 'Escape') foreignClose()
            }}
          >
            Foreign action
          </Button>
        </div>
      )}
    </>
  )
}
afterEach(() => {
  view?.unmount()
  view = null
  vi.clearAllMocks()
  expect(overlayStackDepth()).toBe(0)
})
const openWithKeyboard = async () => {
  const user = userEvent.setup()
  screen.getByRole('button', { name: 'Fixture choice' }).focus()
  await user.keyboard('{ArrowDown}')
  await screen.findByRole('listbox', { name: 'Fixture choice' })
  await waitFor(() => expect(screen.getByRole('option', { name: 'All' })).toHaveFocus())
  return user
}
describe('dropdown portal owns only its open-menu Escape', () => {
  it('closes a standalone portal option and returns keyboard focus', async () => {
    view = render(<Fixture />)
    const user = await openWithKeyboard()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fixture choice' })).toHaveFocus()
  })
  it('does not let a competing underlying overlay consume the portal Escape', async () => {
    view = render(<Fixture underlying />)
    const user = await openWithKeyboard()
    await user.keyboard('{Escape}')
    expect(parentClose).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fixture choice' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(parentClose).toHaveBeenCalledTimes(1)
  })
  it('leaves a newer registered dialog above the dropdown in charge of Escape', async () => {
    view = render(<Fixture underlying />)
    const user = await openWithKeyboard()
    // Native pointer outside closes the menu, so the new dialog is activated via
    // its existing callback while the portal stays open in this controlled fixture.
    screen.getByRole('button', { name: 'Open newer dialog' }).focus()
    await user.keyboard('{Enter}')
    screen.getAllByRole('button', { name: 'Dialog action' }).at(-1)?.focus()
    await user.keyboard('{Escape}')
    expect(newerClose).toHaveBeenCalledTimes(1)
    expect(parentClose).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
  it('keeps ordinary selection and outside pointer close without stealing focus', async () => {
    view = render(<Fixture />)
    const user = await openWithKeyboard()
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(screen.getByLabelText('Selected choice')).toHaveTextContent('B')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fixture choice' }))
    await user.click(screen.getByRole('button', { name: 'Outside action' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Outside action' })).toHaveFocus()
  })
  it('preserves multi selection and dismisses its portal from a focused option', async () => {
    view = render(<Fixture multi />)
    const user = await openWithKeyboard()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByLabelText('Multi choices')).toHaveTextContent('A')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
  it('leaves a newer foreign dialog Escape handler in charge without closing the menu', async () => {
    view = render(<Fixture underlying />)
    const user = await openWithKeyboard()
    screen.getByRole('button', { name: 'Open foreign dialog' }).focus()
    await user.keyboard('{Enter}')
    screen.getByRole('button', { name: 'Foreign action' }).focus()
    await user.keyboard('{Escape}')
    expect(foreignClose).toHaveBeenCalledTimes(1)
    expect(parentClose).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
  it('preserves searchable filtering and Escape from its focused text input', async () => {
    view = render(<Fixture searchable />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Fixture choice' }))
    const input = screen.getByPlaceholderText('Search…')
    await waitFor(() => expect(input).toHaveFocus())
    await user.type(input, 'B')
    expect(screen.queryByRole('option', { name: 'A' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'B' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fixture choice' })).toHaveFocus()
  })
  it('allows ordinary Tab traversal out of the trigger and releases registrations on unmount', async () => {
    const view = render(<Fixture underlying />)
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Fixture choice' })
    trigger.focus()
    await user.keyboard('{Enter}{Tab}')
    expect(screen.getByRole('button', { name: 'Open newer dialog' })).toHaveFocus()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    view.unmount()
    expect(overlayStackDepth()).toBe(0)
  })
  it('retains the initial focus-scroll grace period and later pointer-style scroll dismissal', async () => {
    view = render(<Fixture />)
    const user = await openWithKeyboard()
    fireEvent.scroll(window)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 130))
    screen.getByRole('button', { name: 'Outside action' }).focus()
    fireEvent.scroll(window)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Outside action' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
