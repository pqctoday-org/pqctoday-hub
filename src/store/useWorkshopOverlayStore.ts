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
   */
  applyCue: (cue: WorkshopCue, fixtures: WorkshopFixtures, currentStepId: string | null) => void
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

  applyCue: (cue, fixtures, currentStepId) => {
    switch (cue.kind) {
      case 'navigate': {
        const nav = get().navigate
        if (nav) nav(buildUrl(cue.route, cue.query))
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
        const el = document.querySelector(cue.selector)
        if (el instanceof HTMLElement) el.click()
        return
      }
      case 'highlight-tab':
      case 'select-tab':
        selectTab(cue.tabName)
        return
      case 'expand-section': {
        const el = document.querySelector(cue.selector)
        if (!(el instanceof HTMLElement)) return
        if (el.getAttribute('aria-expanded') === 'true') return
        el.click()
        return
      }
      case 'collapse-section': {
        const el = document.querySelector(cue.selector)
        if (!(el instanceof HTMLElement)) return
        if (el.getAttribute('aria-expanded') !== 'true') return
        el.click()
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
      case 'advance':
        // Caller decides what to do with 'advance' — overlay store never
        // mutates step state.
        return
    }
  },
}))

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
