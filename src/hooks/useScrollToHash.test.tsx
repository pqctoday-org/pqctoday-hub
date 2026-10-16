// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useScrollToHash } from './useScrollToHash'

function Page({ showTarget = true }: { showTarget?: boolean }) {
  useScrollToHash({ timeoutMs: 200 })
  return (
    <div>
      <section id="about-vision">Vision</section>
      {showTarget && <section id="about-data-foundation">Platform Data</section>}
    </div>
  )
}

describe('useScrollToHash', () => {
  let scroll: ReturnType<typeof vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>>

  beforeEach(() => {
    scroll = vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>()
    Element.prototype.scrollIntoView = scroll
    // jsdom has no layout; the hook only scrolls an element that has a box.
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
  })

  afterEach(() => vi.restoreAllMocks())

  it('aligns the element named by the hash to the top of the scroll container', async () => {
    render(
      <MemoryRouter initialEntries={['/about#about-data-foundation']}>
        <Page />
      </MemoryRouter>
    )
    await vi.waitFor(() => expect(scroll).toHaveBeenCalledTimes(1))
    expect(scroll).toHaveBeenCalledWith({ block: 'start' })
    expect(scroll.mock.contexts[0]).toHaveProperty('id', 'about-data-foundation')
  })

  it('does nothing without a hash', async () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <Page />
      </MemoryRouter>
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(scroll).not.toHaveBeenCalled()
  })

  it('waits for a target that renders after the first frame', async () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/about#about-data-foundation']}>
        <Page showTarget={false} />
      </MemoryRouter>
    )
    await new Promise((r) => setTimeout(r, 30))
    expect(scroll).not.toHaveBeenCalled()
    rerender(
      <MemoryRouter initialEntries={['/about#about-data-foundation']}>
        <Page showTarget />
      </MemoryRouter>
    )
    await vi.waitFor(() => expect(scroll).toHaveBeenCalledTimes(1))
  })

  it('gives up quietly when the target never renders', async () => {
    render(
      <MemoryRouter initialEntries={['/about#no-such-section']}>
        <Page />
      </MemoryRouter>
    )
    await new Promise((r) => setTimeout(r, 300))
    expect(scroll).not.toHaveBeenCalled()
  })
})
