// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useRef, type RefObject } from 'react'

/**
 * One Escape press closes only the TOPMOST overlay.
 *
 * Every item overlay (drawers, detail pop-ups, the revision drill-down, the
 * mobile sheet, …) used to add its own document/window Escape listener, so
 * with two stacked (e.g. RevisionDrilldownPanel over ComplianceDetailDrawer)
 * one press closed both. Instead each overlay registers here while open; a
 * single keydown listener closes only the most recently opened entry.
 *
 * The listener sits on `document` in the CAPTURE phase:
 *  - capture, so it runs before any bubble-phase Escape handler left in the
 *    page and its stopPropagation keeps those from also firing;
 *  - `document`, not `window`, so ShareButton's open menu — which swallows
 *    Escape with a window capture listener + stopImmediatePropagation — still
 *    wins: window capture always runs before document capture.
 * An Escape that something earlier already claimed (`defaultPrevented`) or
 * that ends an IME composition is left alone.
 *
 * Foreign-dialog guard: a modal that is NOT on this stack (anything still
 * using its own Esc listener) can open above a registered overlay. When the
 * Escape comes from inside a visible dialog that belongs to no registered
 * overlay, the stack steps aside and lets the event through, so that modal —
 * not the drawer beneath it — closes. Ownership is judged against the
 * `rootRef`s overlays register; it applies whenever the top entry has one.
 */

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"], [aria-modal="true"]'

interface OverlayEntry {
  id: number
  close: () => void
  isBlocked: () => boolean
  root: () => HTMLElement | null
}

const stack: OverlayEntry[] = []
let nextId = 0

function related(a: Element, b: Element): boolean {
  return a === b || a.contains(b) || b.contains(a)
}

/** The visible dialog the Escape came from — its target, else the focused
 *  element — or null when it came from the page itself. */
function originDialog(e: KeyboardEvent): Element | null {
  const target = e.target instanceof Element ? e.target : null
  const origin =
    target && target !== document.body && target !== document.documentElement
      ? target
      : document.activeElement
  const dialog = origin?.closest(DIALOG_SELECTOR) ?? null
  if (!dialog || dialog.closest('[hidden], [aria-hidden="true"], [inert]')) return null
  return dialog
}

/** True when the Escape came from inside a dialog no registered overlay owns. */
function fromForeignDialog(e: KeyboardEvent, top: OverlayEntry): boolean {
  if (!top.root()) return false // unknown ownership: keep plain stack behaviour
  const dialog = originDialog(e)
  if (!dialog) return false
  return !stack.some((entry) => {
    const root = entry.root()
    return root !== null && related(root, dialog)
  })
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return
  const top = stack[stack.length - 1]
  // Something outside the stack sits above the top entry (a modal that keeps
  // its own Esc listener): leave the Escape to it.
  if (!top || top.isBlocked() || fromForeignDialog(e, top)) return
  e.preventDefault()
  e.stopImmediatePropagation()
  // Pop now, not on the overlay's unmount: a second press that lands before
  // React re-renders must go to the next overlay, not re-close this one.
  stack.pop()
  if (stack.length === 0) document.removeEventListener('keydown', handleKeyDown, true)
  top.close()
}

function push(entry: OverlayEntry) {
  if (stack.length === 0) document.addEventListener('keydown', handleKeyDown, true)
  stack.push(entry)
}

function remove(id: number) {
  const i = stack.findIndex((e) => e.id === id)
  if (i === -1) return
  stack.splice(i, 1)
  if (stack.length === 0) document.removeEventListener('keydown', handleKeyDown, true)
}

/** Number of overlays currently registered (tests / diagnostics). */
export function overlayStackDepth(): number {
  return stack.length
}

export interface OverlayEscapeOptions {
  /** Checked on each Escape while this overlay is the top entry. True leaves
   *  the key alone (no close, no stopPropagation) — for an overlay that can
   *  host a nested pop-up which isn't on this stack. */
  isBlocked?: () => boolean
  /** The overlay's own element (its dialog or a panel inside it). Lets the
   *  foreign-dialog guard tell this overlay's dialog from a modal above it. */
  rootRef?: RefObject<HTMLElement | null>
}

/**
 * Register an overlay on the Escape stack while `active`.
 *
 * `onClose` may change identity every render — the latest one is always
 * called, and a new identity never re-orders the stack.
 *
 * Returns `isTop()`: true while this overlay is the topmost registered one
 * (e.g. to ignore a scrim click that belongs to a pop-up above it).
 */
export function useOverlayEscape(
  active: boolean,
  onClose: () => void,
  options?: OverlayEscapeOptions
): () => boolean {
  const closeRef = useRef(onClose)
  const blockedRef = useRef(options?.isBlocked)
  const rootRefRef = useRef(options?.rootRef)
  useEffect(() => {
    closeRef.current = onClose
    blockedRef.current = options?.isBlocked
    rootRefRef.current = options?.rootRef
  })
  const idRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    const id = ++nextId
    idRef.current = id
    push({
      id,
      close: () => closeRef.current(),
      isBlocked: () => blockedRef.current?.() ?? false,
      root: () => rootRefRef.current?.current ?? null,
    })
    return () => {
      remove(id)
      if (idRef.current === id) idRef.current = null
    }
  }, [active])

  return useCallback(() => {
    const top = stack[stack.length - 1]
    return top !== undefined && top.id === idRef.current
  }, [])
}
