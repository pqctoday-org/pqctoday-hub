// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import type { WorkshopCue, WorkshopFixtures } from '@/types/Workshop'
import { buildUrl } from '@/utils/workshopDeepLink'

interface ActiveCallout {
  id: number
  selector: string
  label: string
  arrow?: 'left' | 'right' | 'top' | 'bottom'
}

interface WorkshopOverlayState {
  caption: string
  captionVisible: boolean
  spotlightSelector: string | null
  callouts: ActiveCallout[]
  /** Optional hook for the navigate function. Set by WorkshopOverlayHost on mount. */
  navigate: ((to: string) => void) | null

  setCaption: (text: string, visible?: boolean) => void
  clearOverlays: () => void
  setNavigate: (nav: (to: string) => void) => void
  /**
   * Apply a single cue. Used by both VideoOverlay (timer-driven) and the
   * Workshop Mode manual stepper. Pure side-effects; does not advance steps.
   *
   * `nextCues` (optional) is the list of cues that come after this one in the
   * same step. When `cue.kind === 'navigate'` and no explicit `scroll-to` cue
   * is queued, the engine auto-scrolls to the first selector found in `nextCues`
   * after a short delay (gives the new route time to render).
   */
  applyCue: (
    cue: WorkshopCue,
    fixtures: WorkshopFixtures,
    currentStepId: string | null,
    nextCues?: WorkshopCue[]
  ) => void
}

let calloutCounter = 0

export const useWorkshopOverlayStore = create<WorkshopOverlayState>()((set, get) => ({
  caption: '',
  captionVisible: false,
  spotlightSelector: null,
  callouts: [],
  navigate: null,

  setCaption: (text, visible = true) => set({ caption: text, captionVisible: visible }),
  clearOverlays: () => set({ spotlightSelector: null, callouts: [] }),
  setNavigate: (nav) => set({ navigate: nav }),

  applyCue: (cue, fixtures, currentStepId, nextCues) => {
    switch (cue.kind) {
      case 'navigate': {
        const nav = get().navigate
        if (nav) nav(buildUrl(cue.route, cue.query))
        scheduleAutoScrollFromNextCues(nextCues)
        return
      }
      case 'caption':
        set({ caption: cue.text, captionVisible: true })
        return
      case 'spotlight':
        set({ spotlightSelector: cue.selector })
        return
      case 'callout': {
        const id = ++calloutCounter
        set((s) => ({
          callouts: [
            ...s.callouts,
            { id, selector: cue.selector, label: cue.label, arrow: cue.arrow },
          ],
        }))
        return
      }
      case 'click': {
        retrySelector(cue.selector, (el) => {
          el.click()
          return true
        })
        return
      }
      case 'highlight-tab':
      case 'select-tab':
        selectTab(cue.tabName)
        return
      case 'expand-section': {
        retrySelector(cue.selector, (el) => {
          if (el.getAttribute('aria-expanded') === 'true') return true
          el.click()
          return true
        })
        return
      }
      case 'collapse-section': {
        retrySelector(cue.selector, (el) => {
          if (el.getAttribute('aria-expanded') !== 'true') return true
          el.click()
          return true
        })
        return
      }
      case 'scroll-to': {
        if (cue.selector) {
          const el = document.querySelector(cue.selector)
          if (el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
          }
        }
        if (typeof cue.topPx === 'number') {
          window.scrollTo({ top: cue.topPx, behavior: 'smooth' })
        }
        return
      }
      case 'fill-from-fixture': {
        if (!currentStepId) return
        const value = fixtures[currentStepId]?.[cue.fixtureKey]
        if (value === undefined) return
        fillElement(cue.selector, String(value))
        return
      }
      case 'fill-literal':
        fillElement(cue.selector, cue.value)
        return
      case 'select-from-fixture': {
        if (!currentStepId) return
        const value = fixtures[currentStepId]?.[cue.fixtureKey]
        if (value === undefined) return
        selectOption(cue.selector, String(value))
        return
      }
      case 'generate-artifact': {
        retrySelector(
          `[data-workshop-target="business-artifact-${cue.artifactType}-create"]`,
          (el) => {
            el.click()
            // Drawer mounts, then the builder's primary CTA renders. Click it
            // shortly after so the artifact is actually created.
            setTimeout(() => {
              const generate = document.querySelector(
                '[data-workshop-target="business-builder-generate"]'
              )
              if (generate instanceof HTMLElement) generate.click()
            }, 600)
            return true
          }
        )
        return
      }
      case 'view-artifact': {
        retrySelector(
          `[data-workshop-target="business-artifact-${cue.artifactType}-view"]`,
          (el) => {
            el.click()
            return true
          }
        )
        return
      }
      case 'download-artifact': {
        const format = cue.format ?? 'markdown'
        retrySelector(`[data-workshop-target="business-artifact-export-${format}"]`, (el) => {
          el.click()
          return true
        })
        return
      }
      case 'advance':
        // Caller decides what to do with 'advance' — overlay store never
        // mutates step state.
        return
    }
  },
}))

/**
 * After a `navigate` cue, look for the first selector in upcoming cues and
 * scroll it into view (after a short delay for route + lazy chunks). Skipped
 * when an explicit `scroll-to` cue is already queued — the author wins.
 */
function scheduleAutoScrollFromNextCues(nextCues?: WorkshopCue[]): void {
  if (!nextCues || nextCues.length === 0) return
  if (nextCues.some((c) => c.kind === 'scroll-to')) return
  const firstWithSelector = nextCues.find(
    (c): c is WorkshopCue & { selector: string } =>
      'selector' in c && typeof (c as { selector?: unknown }).selector === 'string'
  )
  if (!firstWithSelector) return
  const sel = firstWithSelector.selector
  let n = 0
  const tick = () => {
    const el = document.querySelector(sel)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    n++
    if (n < 4) setTimeout(tick, 200)
  }
  setTimeout(tick, 700)
}

/**
 * Try a selector now, then retry up to `attempts` times with `delay` ms between
 * attempts. Used for `click` / `expand-section` / `collapse-section` cues so a
 * fired cue isn't lost when the target element hasn't rendered yet (route just
 * changed, lazy chunk still loading, etc.). Returns immediately on first match.
 */
function retrySelector(
  selector: string,
  apply: (el: HTMLElement) => boolean,
  attempts = 4,
  delay = 200
): void {
  let n = 0
  const tick = () => {
    const el = document.querySelector(selector)
    if (el instanceof HTMLElement) {
      if (apply(el)) return
    }
    n++
    if (n < attempts) setTimeout(tick, delay)
  }
  tick()
}

function selectTab(tabName: string): void {
  const slug = tabName.toLowerCase().replace(/\s+/g, '-')
  const targeted = document.querySelector(`[data-workshop-target="tab-${slug}"]`)
  if (targeted instanceof HTMLElement) {
    targeted.click()
    return
  }
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
  const roleMatch = tabs.find(
    (t) => (t.textContent ?? '').trim().toLowerCase() === tabName.toLowerCase()
  )
  if (roleMatch instanceof HTMLElement) {
    roleMatch.click()
    return
  }
  const btnMatch = Array.from(document.querySelectorAll('button')).find(
    (b) => (b.textContent ?? '').trim().toLowerCase() === tabName.toLowerCase()
  )
  if (btnMatch) btnMatch.click()
}

function fillElement(selector: string, value: string): void {
  const el = document.querySelector(selector)
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const proto =
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    setter?.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

function selectOption(selector: string, label: string): void {
  const el = document.querySelector(selector)
  if (el instanceof HTMLSelectElement) {
    const opt = Array.from(el.options).find(
      (o) => o.label === label || o.value === label || o.textContent?.trim() === label
    )
    if (opt) {
      el.value = opt.value
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    return
  }
  if (el instanceof HTMLElement) {
    el.click()
    setTimeout(() => {
      const items = document.querySelectorAll('[role="option"], [role="menuitem"]')
      for (const item of Array.from(items)) {
        if ((item.textContent ?? '').trim() === label) {
          ;(item as HTMLElement).click()
          break
        }
      }
    }, 100)
  }
}
