// SPDX-License-Identifier: AGPL-3.0-only
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAssistantWidthStore } from '@/store/useAssistantWidthStore'
import {
  drawerPaddingClass,
  drawerPaddingStyle,
  useAssistantDrawerWidth,
  useAssistantLayout,
} from './useAssistantLayout'

const embed = vi.hoisted(() => ({ embedded: false }))
vi.mock('@/embed/EmbedProvider', () => ({ useIsEmbedded: () => embed.embedded }))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

/** A window of this width, answering `(max-width: Npx)` queries the way a browser does. */
function setWindow(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*(\d+)px/.exec(query)
    return {
      matches: max ? width <= Number(max[1]) : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }
  }) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  embed.embedded = false
  localStorage.clear()
  useAssistantWidthStore.getState().reset()
})
afterEach(() => setWindow(1024))

describe('which layout the Assistant takes', () => {
  it.each([
    [1440, 'docked'],
    [1100, 'docked'],
    [1024, 'docked'],
    [1023, 'sheet'],
    [900, 'sheet'],
    [640, 'sheet'],
    [390, 'sheet'],
  ])('at %i px the Hub itself uses the %s layout', (width, layout) => {
    setWindow(width)
    expect(renderHook(() => useAssistantLayout()).result.current).toBe(layout)
  })

  it('keeps the docked drawer on an embedded page down to a phone width', () => {
    embed.embedded = true
    setWindow(900)
    expect(renderHook(() => useAssistantLayout()).result.current).toBe('docked')
    setWindow(639)
    expect(renderHook(() => useAssistantLayout()).result.current).toBe('sheet')
  })
})

describe('the docked drawer width', () => {
  it('is 520 px at 1,280 px and wider, and 400 px at 1,100 px', () => {
    setWindow(1280)
    expect(renderHook(() => useAssistantDrawerWidth()).result.current).toBe(520)
    setWindow(1100)
    expect(renderHook(() => useAssistantDrawerWidth()).result.current).toBe(400)
  })

  it("follows the learner's choice, within what the window allows, and a resize", () => {
    setWindow(1440)
    const { result } = renderHook(() => useAssistantDrawerWidth())
    act(() => useAssistantWidthStore.getState().setWidth(600))
    expect(result.current).toBe(600)
    act(() => {
      setWindow(1200)
      window.dispatchEvent(new Event('resize'))
    })
    // 1,200 px leaves 560 px at most, so the page keeps 640 px
    expect(result.current).toBe(560)
  })
})

describe('the page padding beside the drawer', () => {
  it('is the drawer width as a right padding, only when the drawer is open and docked', () => {
    expect(drawerPaddingStyle(true, 'docked', 'chat', 520)).toEqual({ paddingRight: 520 })
    expect(drawerPaddingStyle(true, 'docked', 'bookmarks', 600)).toEqual({ paddingRight: 600 })
    expect(drawerPaddingStyle(false, 'docked', 'chat', 520)).toBeUndefined()
    expect(drawerPaddingStyle(true, 'sheet', 'chat', 520)).toBeUndefined()
  })

  it('leaves the guided workshop its own 40vw padding as a class', () => {
    expect(drawerPaddingStyle(true, 'docked', 'workshop', 520)).toBeUndefined()
    expect(drawerPaddingClass(true, 'docked', 'workshop')).toBe('sm:pr-[40vw]')
    expect(drawerPaddingClass(true, 'docked', 'chat')).toBe('')
    expect(drawerPaddingClass(true, 'sheet', 'workshop')).toBe('')
  })
})
