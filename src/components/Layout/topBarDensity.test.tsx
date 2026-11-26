// SPDX-License-Identifier: AGPL-3.0-only
import { useRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { Bot, Bookmark } from 'lucide-react'
import { DrawerToggleButton } from './DrawerToggleButton'
import { TopBarDensityProvider, useTopBarDensityFor, type TopBarDensity } from './topBarDensity'

// jsdom has no layout, so the bar's measured widths are supplied: each group is wider at the fuller
// densities, and the bar is as wide as `room`.
const WIDTH_AT: Record<string, number> = { '0': 700, '1': 560, '2': 420, '3': 420 }
const measured = { room: 1000 }
const observers: Array<() => void> = []

class FakeResizeObserver {
  private cb: () => void
  constructor(cb: () => void) {
    this.cb = cb
    observers.push(cb)
  }
  observe() {}
  unobserve() {}
  disconnect() {
    const i = observers.indexOf(this.cb)
    if (i >= 0) observers.splice(i, 1)
  }
}

const original = {
  ro: globalThis.ResizeObserver,
  offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth'),
  clientWidth: Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth'),
}

beforeEach(() => {
  observers.length = 0
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      const density = document.querySelector('[data-testid="density"]')?.textContent ?? '0'
      // two groups share the natural width
      return (WIDTH_AT[density] ?? 0) / 2
    },
  })
  Object.defineProperty(Element.prototype, 'clientWidth', {
    configurable: true,
    get: () => measured.room,
  })
})

afterEach(() => {
  globalThis.ResizeObserver = original.ro
  if (original.offsetWidth)
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', original.offsetWidth)
  if (original.clientWidth)
    Object.defineProperty(Element.prototype, 'clientWidth', original.clientWidth)
})

function Bar() {
  const ref = useRef<HTMLDivElement>(null)
  const density = useTopBarDensityFor(ref, 'key')
  return (
    <TopBarDensityProvider value={density}>
      <p data-testid="density">{density}</p>
      <div ref={ref}>
        <div>
          <DrawerToggleButton tab="chat" icon={Bot} />
        </div>
        <div>
          <DrawerToggleButton tab="bookmarks" icon={Bookmark} />
        </div>
      </div>
    </TopBarDensityProvider>
  )
}

const settle = () => act(() => observers.slice().forEach((cb) => cb()))

describe('top bar density from the bar width', () => {
  it('keeps every label when the buttons fit', () => {
    measured.room = 1000
    render(<Bar />)
    settle()
    expect(screen.getByTestId('density')).toHaveTextContent('0')
    expect(screen.getByRole('button', { name: 'Assistant' })).toHaveTextContent('Assistant')
  })

  it('drops the labels, keeping each name and tooltip, when they do not fit', () => {
    measured.room = 450
    render(<Bar />)
    for (let i = 0; i < 4; i++) settle()
    expect(screen.getByTestId('density')).toHaveTextContent('2')
    const assistant = screen.getByRole('button', { name: 'Assistant' })
    expect(assistant).toHaveTextContent('')
    expect(assistant).toHaveAttribute('title', 'Assistant')
    expect(screen.getByRole('button', { name: 'Bookmarks' })).toHaveAttribute('title', 'Bookmarks')
  })

  it('wraps only when even icons do not fit, and goes back to labels when room returns', () => {
    measured.room = 300
    render(<Bar />)
    for (let i = 0; i < 6; i++) settle()
    expect(screen.getByTestId('density')).toHaveTextContent('3' satisfies `${TopBarDensity}`)
    measured.room = 1000
    for (let i = 0; i < 6; i++) settle()
    expect(screen.getByTestId('density')).toHaveTextContent('0')
    expect(screen.getByRole('button', { name: 'Assistant' })).toHaveTextContent('Assistant')
  })
})
