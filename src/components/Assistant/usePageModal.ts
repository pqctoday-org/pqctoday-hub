// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useSyncExternalStore } from 'react'

/**
 * The modal dialog that currently covers the page, if any. A page the learner was sent to can open
 * its own detail dialog on arrival; its backdrop sits over the page chrome, and a screen reader
 * treats everything outside a modal dialog as unavailable. The Assistant's own sheet is not counted.
 */
export function currentPageModal(): HTMLElement | null {
  const modals = document.querySelectorAll<HTMLElement>(
    '[aria-modal="true"]:not([data-assistant-layout])'
  )
  return modals.length > 0 ? modals[modals.length - 1] : null
}

function subscribeToModals(onChange: () => void): () => void {
  let frame = 0
  const schedule = () => {
    if (!frame)
      frame = requestAnimationFrame(() => {
        frame = 0
        onChange()
      })
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-modal'],
  })
  return () => {
    observer.disconnect()
    if (frame) cancelAnimationFrame(frame)
  }
}

const noSubscription = (): (() => void) => () => {}

/**
 * The page's open modal dialog (re-read as dialogs open and close), or null. With `enabled` false
 * nothing is watched and the result is null.
 */
export function usePageModal(enabled = true): HTMLElement | null {
  const snapshot = useCallback(() => (enabled ? currentPageModal() : null), [enabled])
  return useSyncExternalStore(enabled ? subscribeToModals : noSubscription, snapshot, () => null)
}
