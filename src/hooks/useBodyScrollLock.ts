// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'

/**
 * Lock page scroll behind an open overlay.
 *
 * Ref-counted: with overlays stacked (a pop-up over a drawer) the page stays
 * locked until the LAST one closes — the old inline
 * `document.body.style.overflow = ''` in each overlay unlocked the page as
 * soon as the top one closed, with the drawer still open.
 *
 * On first lock it saves the body's inline overflow / padding-right and pads
 * the body by the scrollbar's width, so hiding the scrollbar doesn't shift the
 * layout sideways. The last unlock restores both exactly as they were.
 */

let lockCount = 0
let saved: { overflow: string; paddingRight: string } | null = null

function lock() {
  lockCount += 1
  if (lockCount > 1) return
  const body = document.body
  saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  if (scrollbarWidth > 0) {
    const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0
    body.style.paddingRight = `${current + scrollbarWidth}px`
  }
  body.style.overflow = 'hidden'
}

function unlock() {
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount > 0 || !saved) return
  document.body.style.overflow = saved.overflow
  document.body.style.paddingRight = saved.paddingRight
  saved = null
}

/** Number of overlays currently holding the lock (tests / diagnostics). */
export function bodyScrollLockCount(): number {
  return lockCount
}

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    lock()
    return unlock
  }, [active])
}
