// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, renderHook, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useOverlayEscape, overlayStackDepth } from './useOverlayEscape'
import { ShareButton } from '@/components/ui/ShareButton'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

const esc = () => fireEvent.keyDown(document, { key: 'Escape' })

function Overlay({ name, onClose }: { name: string; onClose: () => void }) {
  useOverlayEscape(true, onClose)
  return <div role="dialog" aria-label={name} />
}

/** Three stacked overlays, each closed by its own state — like the real app. */
function Stack({ initial = ['a', 'b', 'c'] }: { initial?: string[] }) {
  const [open, setOpen] = useState(initial)
  return (
    <>
      {open.map((n) => (
        <Overlay key={n} name={n} onClose={() => setOpen((o) => o.filter((x) => x !== n))} />
      ))}
    </>
  )
}

describe('useOverlayEscape', () => {
  beforeEach(() => {
    // Every earlier test unmounted its overlays: nothing leaks between tests.
    expect(overlayStackDepth()).toBe(0)
  })

  it('one Escape closes only the most recently opened overlay, in stack order', () => {
    render(<Stack />)
    expect(overlayStackDepth()).toBe(3)
    esc()
    expect(screen.queryByRole('dialog', { name: 'c' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'b' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'a' })).toBeInTheDocument()
    esc()
    expect(screen.queryByRole('dialog', { name: 'b' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'a' })).toBeInTheDocument()
    esc()
    expect(screen.queryAllByRole('dialog')).toHaveLength(0)
    expect(overlayStackDepth()).toBe(0)
  })

  it('two presses before a re-render still close two different overlays', () => {
    const a = vi.fn()
    const b = vi.fn()
    renderHook(() => {
      useOverlayEscape(true, a)
      useOverlayEscape(true, b)
    })
    esc()
    esc()
    expect(b).toHaveBeenCalledTimes(1)
    expect(a).toHaveBeenCalledTimes(1)
  })

  it('an overlay that closes out of order (unmount) drops out of the stack', () => {
    const a = vi.fn()
    const c = vi.fn()
    const { rerender } = renderHook(
      ({ bOpen }) => {
        useOverlayEscape(true, a)
        useOverlayEscape(bOpen, () => undefined)
        useOverlayEscape(true, c)
      },
      { initialProps: { bOpen: true } }
    )
    rerender({ bOpen: false })
    expect(overlayStackDepth()).toBe(2)
    esc()
    expect(c).toHaveBeenCalledTimes(1)
    expect(a).not.toHaveBeenCalled()
  })

  it('inactive overlays are not registered; a new onClose identity keeps the stack order', () => {
    const first = vi.fn()
    const later = vi.fn()
    const top = vi.fn()
    const { rerender } = renderHook(
      ({ cb, active }) => {
        useOverlayEscape(true, cb)
        useOverlayEscape(active, top)
      },
      { initialProps: { cb: first, active: false } }
    )
    expect(overlayStackDepth()).toBe(1)
    rerender({ cb: later, active: true })
    esc()
    expect(top).toHaveBeenCalledTimes(1)
    esc()
    expect(later).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  it('stops the Escape so a bubble-phase listener beneath does not also fire', () => {
    const legacy = vi.fn()
    document.addEventListener('keydown', legacy)
    renderHook(() => useOverlayEscape(true, () => undefined))
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(legacy).not.toHaveBeenCalled()
    document.removeEventListener('keydown', legacy)
  })

  it('ignores other keys and Escapes already claimed (defaultPrevented)', () => {
    const onClose = vi.fn()
    renderHook(() => useOverlayEscape(true, onClose))
    fireEvent.keyDown(document, { key: 'Enter' })
    const claim = (e: KeyboardEvent) => e.preventDefault()
    window.addEventListener('keydown', claim, true)
    esc()
    window.removeEventListener('keydown', claim, true)
    expect(onClose).not.toHaveBeenCalled()
    esc()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('isBlocked leaves the Escape to a non-stack pop-up above the top overlay', () => {
    const onClose = vi.fn()
    const legacy = vi.fn()
    let blocked = true
    document.addEventListener('keydown', legacy)
    renderHook(() => useOverlayEscape(true, onClose, { isBlocked: () => blocked }))
    esc()
    expect(onClose).not.toHaveBeenCalled()
    expect(legacy).toHaveBeenCalledTimes(1)
    blocked = false
    esc()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(legacy).toHaveBeenCalledTimes(1)
    document.removeEventListener('keydown', legacy)
  })

  it('lets an Escape from inside a foreign (non-stack) dialog through to that dialog', () => {
    const onClose = vi.fn()
    const legacy = vi.fn()
    function Drawer() {
      const rootRef = useRef<HTMLDivElement>(null)
      useOverlayEscape(true, onClose, { rootRef })
      return (
        <div ref={rootRef} role="dialog" aria-label="drawer">
          <input aria-label="in drawer" />
        </div>
      )
    }
    render(
      <>
        <Drawer />
        {/* A modal that still owns its own Esc listener, opened above. */}
        <div role="dialog" aria-modal="true" aria-label="foreign">
          <input aria-label="in foreign" />
        </div>
      </>
    )
    document.addEventListener('keydown', legacy)
    const foreignInput = screen.getByRole('textbox', { name: 'in foreign' })
    foreignInput.focus()
    fireEvent.keyDown(foreignInput, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    expect(legacy).toHaveBeenCalledTimes(1)

    // From inside the drawer's own root, it is the drawer's Escape again.
    const drawerInput = screen.getByRole('textbox', { name: 'in drawer' })
    drawerInput.focus()
    fireEvent.keyDown(drawerInput, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(legacy).toHaveBeenCalledTimes(1)
    document.removeEventListener('keydown', legacy)
  })

  it('a focused dialog that belongs to a lower stack entry does not block the top one', () => {
    const lower = vi.fn()
    const top = vi.fn()
    function Two() {
      const lowerRef = useRef<HTMLDivElement>(null)
      const topRef = useRef<HTMLDivElement>(null)
      useOverlayEscape(true, lower, { rootRef: lowerRef })
      useOverlayEscape(true, top, { rootRef: topRef })
      return (
        <>
          <div ref={lowerRef} role="dialog" aria-label="lower">
            <input aria-label="in lower" />
          </div>
          <div ref={topRef} role="dialog" aria-label="top" />
        </>
      )
    }
    render(<Two />)
    const input = screen.getByRole('textbox', { name: 'in lower' })
    input.focus()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(top).toHaveBeenCalledTimes(1)
    expect(lower).not.toHaveBeenCalled()
  })

  it('isTop() is true only for the topmost overlay', () => {
    const { result, rerender } = renderHook(
      ({ bOpen }) => ({
        a: useOverlayEscape(true, () => undefined),
        b: useOverlayEscape(bOpen, () => undefined),
      }),
      { initialProps: { bOpen: false } }
    )
    expect(result.current.a()).toBe(true)
    rerender({ bOpen: true })
    expect(result.current.a()).toBe(false)
    expect(result.current.b()).toBe(true)
  })

  it('an open ShareButton menu inside the top overlay wins the Escape', () => {
    const onClose = vi.fn()
    function WithShare() {
      useOverlayEscape(true, onClose)
      return <ShareButton title="t" url="/x" portal />
    }
    render(<WithShare />)
    fireEvent.click(screen.getByRole('button', { name: /^Share/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    esc()
    expect(screen.queryByRole('menu')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()
    esc()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
