// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Workshop entry points on a phone that cannot run the workshop.
 *
 * Owner decision D6 (2026-10-23): a workshop that is not available on a phone is
 * labelled "on a computer" wherever it is offered, instead of a button that does
 * nothing. A module's workshop is available on a phone when it is on
 * MOBILE_WORKSHOP_READY (the real workshop mounts in the phone shell) or has a
 * phone-capable twin tool (`mobilePracticeTool`). Every other module keeps the
 * reading content and gets the label.
 *
 * Why a DOM pass and not a prop: the "Start Workshop" buttons are written into each
 * module's own Learn component (about thirty hand-rolled copies, with labels such as
 * "Start Workshop", "Topology Builder (Workshop Step 1)" or "Model a signature's
 * lifetime in the Workshop"), and the shell only hands them an `onNavigateToWorkshop`
 * callback. One pass over the rendered Learn content covers all of them, and any
 * module added later, without editing each module. It only sets attributes and
 * inserts a caption next to a button or link; it never replaces React's own nodes.
 */
import { useLayoutEffect, type RefObject } from 'react'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { mobilePracticeTool } from '@/data/moduleToolLinks'
import { MOBILE_WORKSHOP_READY } from '@/data/mobileWorkshops'

/** The one label every workshop entry point carries on a phone that cannot run it. */
export const DESKTOP_ONLY_WORKSHOP_LABEL = 'Workshop: on a computer'

/** True when a phone can open this module's workshop (in the shell, or via its twin tool). */
export function workshopRunsOnPhone(moduleId: string): boolean {
  if (MOBILE_WORKSHOP_READY.has(moduleId)) return true
  const manifest = MANIFEST_BY_ID[moduleId]
  return manifest ? Boolean(mobilePracticeTool(manifest)) : false
}

/** A button whose whole label is a generic "Start/Open the Workshop" call to action. */
const GENERIC_CTA = /^(start|open|launch|begin|go to|continue to)\s+(the\s+|this\s+)?workshop\b/i

/** Marks every element this pass has handled, so the pass is safe to repeat. */
const MARK = 'data-desktop-only-workshop'

/**
 * The module whose workshop a `?tab=workshop` link opens (`/learn/<id>?tab=workshop…`),
 * or null when the link is not a workshop link. A bare `?tab=workshop` means the
 * current module.
 */
export function workshopLinkTarget(href: string, currentModuleId: string): string | null {
  let url: URL
  try {
    url = new URL(href, 'https://pqctoday.local/learn/' + currentModuleId)
  } catch {
    return null
  }
  if (url.searchParams.get('tab') !== 'workshop') return null
  const m = /^\/learn\/([^/]+)/.exec(url.pathname)
  return m ? decodeURIComponent(m[1]) : null
}

function caption(label: string, block: boolean): HTMLSpanElement {
  const note = document.createElement('span')
  note.setAttribute(`${MARK}-note`, '')
  note.textContent = label
  note.className = block
    ? 'inline-block rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground'
    : 'ml-2 text-[11px] font-semibold text-muted-foreground'
  return note
}

/**
 * Relabel the workshop entry points under `root`. A generic "Start Workshop" button is
 * hidden and replaced by the caption; a named button or a `?tab=workshop` link keeps
 * its words, stops being clickable and gets the caption after it.
 */
export function relabelWorkshopEntries(root: HTMLElement, currentModuleId: string): void {
  for (const el of root.querySelectorAll<HTMLElement>(
    `button:not([${MARK}]), a[href]:not([${MARK}])`
  )) {
    const label = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    let generic = false
    if (el.tagName === 'A') {
      const target = workshopLinkTarget(el.getAttribute('href') ?? '', currentModuleId)
      // A workshop link into a module whose workshop does run on a phone stays live.
      if (target === null || workshopRunsOnPhone(target)) continue
    } else {
      if (!/\bworkshop\b/i.test(label) || el.closest('[role="tablist"]')) continue
      generic = GENERIC_CTA.test(label)
    }
    el.setAttribute(MARK, '')
    el.setAttribute('aria-disabled', 'true')
    el.tabIndex = -1
    el.style.pointerEvents = 'none'
    if (generic) el.style.display = 'none'
    else el.style.opacity = '0.6'
    el.after(caption(DESKTOP_ONLY_WORKSHOP_LABEL, generic))
  }
}

/** Undo `relabelWorkshopEntries` (the shell stopped being a phone shell, or the module changed). */
function restoreWorkshopEntries(root: HTMLElement): void {
  for (const note of root.querySelectorAll(`[${MARK}-note]`)) note.remove()
  for (const el of root.querySelectorAll<HTMLElement>(`[${MARK}]`)) {
    el.removeAttribute(MARK)
    el.removeAttribute('aria-disabled')
    el.removeAttribute('tabindex')
    el.style.pointerEvents = ''
    el.style.display = ''
    el.style.opacity = ''
  }
}

/**
 * Keep the workshop entry points inside `ref` relabelled while `enabled`. Content that
 * mounts later (a section the reader opens, a re-render) is picked up by the observer.
 */
export function useDesktopOnlyWorkshopEntries(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  currentModuleId: string
): void {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || !enabled) return
    relabelWorkshopEntries(root, currentModuleId)
    const observer = new MutationObserver(() => relabelWorkshopEntries(root, currentModuleId))
    observer.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      restoreWorkshopEntries(root)
    }
  }, [ref, enabled, currentModuleId])
}
