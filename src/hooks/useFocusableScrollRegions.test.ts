// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { applyFocusableScrollRegions } from './useFocusableScrollRegions'

function box(cls: string, inner: string, scrollWidth: number, clientWidth: number): HTMLElement {
  const el = document.createElement('div')
  el.className = cls
  el.innerHTML = inner
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
  Object.defineProperty(el, 'scrollHeight', { value: 10, configurable: true })
  Object.defineProperty(el, 'clientHeight', { value: 10, configurable: true })
  return el
}

describe('applyFocusableScrollRegions', () => {
  it('gives an overflowing box with no focusable content a tab stop, role and name', () => {
    const root = document.createElement('main')
    const el = box('overflow-x-auto', '<table><tr><td>x</td></tr></table>', 900, 300)
    root.appendChild(el)
    applyFocusableScrollRegions(root)
    expect(el.getAttribute('tabindex')).toBe('0')
    expect(el.getAttribute('role')).toBe('region')
    expect(el.getAttribute('aria-label')).toBe('Scrollable table')
  })

  it('leaves a box that fits, or that holds a focusable element, untouched', () => {
    const root = document.createElement('main')
    const fits = box('overflow-x-auto', '<table></table>', 300, 300)
    const hasButton = box('overflow-x-auto', '<button>go</button>', 900, 300)
    root.append(fits, hasButton)
    applyFocusableScrollRegions(root)
    expect(fits.hasAttribute('tabindex')).toBe(false)
    expect(hasButton.hasAttribute('tabindex')).toBe(false)
  })

  it('never overrides semantics a component set itself', () => {
    const root = document.createElement('main')
    const own = box('overflow-x-auto', '<span>x</span>', 900, 300)
    own.setAttribute('role', 'tablist')
    root.appendChild(own)
    applyFocusableScrollRegions(root)
    expect(own.getAttribute('role')).toBe('tablist')
    expect(own.hasAttribute('tabindex')).toBe(false)
  })

  it('removes what it added once the box no longer overflows', () => {
    const root = document.createElement('main')
    const el = box('overflow-x-auto', '<span>x</span>', 900, 300)
    root.appendChild(el)
    applyFocusableScrollRegions(root)
    expect(el.getAttribute('tabindex')).toBe('0')
    Object.defineProperty(el, 'clientWidth', { value: 900, configurable: true })
    applyFocusableScrollRegions(root)
    expect(el.hasAttribute('tabindex')).toBe(false)
    expect(el.hasAttribute('role')).toBe(false)
    expect(el.hasAttribute('aria-label')).toBe(false)
  })
})
