// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import type { RefObject } from 'react'

/**
 * Wave A (2026-09-18): keyboard reachability for scrollable content.
 *
 * Learn modules and playground tools wrap wide tables and code in a plain
 * `<div className="overflow-x-auto">` — 169 of them across 126 files. When
 * such a box actually overflows and holds nothing focusable, a keyboard user
 * cannot scroll it at all; axe reports `scrollable-region-focusable`
 * (serious), which the round-8 sweep found on 21 items. The documented fix is
 * `tabIndex={0}` on the box, which `ScrollFadeContainer` already does — but
 * making every wrapper a tab stop whether it scrolls or not would add dozens
 * of empty stops to pages whose tables fit.
 *
 * This hook applies the fix only where it is needed, and only while it is
 * needed: on mount, on resize and on content changes it finds overflowing
 * boxes under `root` with no focusable descendant and gives them a tab stop,
 * a `region` role and a name; when a box stops overflowing (wider viewport,
 * tab switch) the attributes it added are removed again. Elements that carry
 * their own tabindex or role are left alone.
 */

const SCROLL_BOX =
  '[class*="overflow-x-auto"], [class*="overflow-auto"], [class*="overflow-y-auto"]'
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
const MARK = 'data-scroll-region'

function overflows(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
}

export function applyFocusableScrollRegions(root: HTMLElement): void {
  const boxes = root.querySelectorAll<HTMLElement>(SCROLL_BOX)
  boxes.forEach((el) => {
    const managed = el.getAttribute(MARK) === 'auto'
    if (!managed && (el.hasAttribute('tabindex') || el.hasAttribute('role'))) return
    const needs = overflows(el) && !el.querySelector(FOCUSABLE)
    if (needs && !managed) {
      el.setAttribute(MARK, 'auto')
      el.setAttribute('tabindex', '0')
      el.setAttribute('role', 'region')
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
        el.setAttribute(
          'aria-label',
          el.querySelector('table') ? 'Scrollable table' : 'Scrollable content'
        )
        el.setAttribute(`${MARK}-label`, '1')
      }
    } else if (!needs && managed) {
      el.removeAttribute(MARK)
      el.removeAttribute('tabindex')
      el.removeAttribute('role')
      if (el.hasAttribute(`${MARK}-label`)) {
        el.removeAttribute('aria-label')
        el.removeAttribute(`${MARK}-label`)
      }
    }
  })
}

export function useFocusableScrollRegions(root: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = root.current
    if (!el || typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined')
      return
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        applyFocusableScrollRegions(el)
      })
    }
    schedule()
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    const mo = new MutationObserver(schedule)
    mo.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style'],
    })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [root])
}
