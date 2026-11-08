// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useUrlBackedText } from './useUrlBackedText'

// The address is modelled as a value the test controls, so it can lag behind the keystrokes the
// way react-router's transitions make it lag in the browser.
function setup(initialUrl = '') {
  const write = vi.fn()
  const view = renderHook(({ url }) => useUrlBackedText(url, write), {
    initialProps: { url: initialUrl },
  })
  const urlShows = (url: string) => view.rerender({ url })
  return { view, write, urlShows }
}

describe('useUrlBackedText', () => {
  it('starts with the address text', () => {
    const { view } = setup('tls')
    expect(view.result.current.text).toBe('tls')
  })

  it('shows typed text at once and writes it to the address', () => {
    const { view, write } = setup()
    act(() => view.result.current.update('h'))
    expect(view.result.current.text).toBe('h')
    expect(write).toHaveBeenLastCalledWith('h')
  })

  // Typing "hsm" while the address is still catching up: the box must not be put back to an
  // earlier keystroke when the address shows "h" or "hs" late. A box read straight from the
  // address would show "h" here.
  it('is not put back to an earlier keystroke when the address shows it late', () => {
    const { view, urlShows } = setup()
    act(() => view.result.current.update('h'))
    act(() => view.result.current.update('hs'))
    act(() => view.result.current.update('hsm'))
    expect(view.result.current.text).toBe('hsm')
    urlShows('h')
    expect(view.result.current.text).toBe('hsm')
    urlShows('hs')
    expect(view.result.current.text).toBe('hsm')
    urlShows('hsm')
    expect(view.result.current.text).toBe('hsm')
  })

  it('copes with the address skipping keystrokes', () => {
    const { view, urlShows } = setup()
    act(() => view.result.current.update('h'))
    act(() => view.result.current.update('hs'))
    act(() => view.result.current.update('hsm'))
    urlShows('hsm') // the two earlier addresses were never shown
    expect(view.result.current.text).toBe('hsm')
    act(() => view.result.current.update('hsmx'))
    urlShows('hsmx')
    expect(view.result.current.text).toBe('hsmx')
  })

  it('takes a change to the address that it did not write (a followed link)', () => {
    const { view, urlShows } = setup('tls')
    act(() => view.result.current.update('tlsx'))
    urlShows('tlsx')
    urlShows('hsm')
    expect(view.result.current.text).toBe('hsm')
  })

  it('a link followed while keystrokes are still pending wins over the stale ones', () => {
    const { view, urlShows } = setup()
    act(() => view.result.current.update('a'))
    act(() => view.result.current.update('ab'))
    urlShows('other')
    expect(view.result.current.text).toBe('other')
    // The old keystrokes arriving afterwards are outside changes now, not echoes.
    urlShows('ab')
    expect(view.result.current.text).toBe('ab')
  })

  it('reset shows the text without writing, and its echo does not clobber later typing', () => {
    const { view, write, urlShows } = setup('abc')
    act(() => view.result.current.reset(''))
    expect(view.result.current.text).toBe('')
    expect(write).not.toHaveBeenCalled()
    act(() => view.result.current.update('z'))
    urlShows('') // the caller's own navigation lands
    expect(view.result.current.text).toBe('z')
    urlShows('z')
    expect(view.result.current.text).toBe('z')
  })

  it('uses the latest write function', () => {
    const first = vi.fn()
    const second = vi.fn()
    const view = renderHook(({ w }) => useUrlBackedText('', w), { initialProps: { w: first } })
    view.rerender({ w: second })
    act(() => view.result.current.update('x'))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('x')
  })
})
