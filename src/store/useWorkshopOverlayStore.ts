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
        scheduleCaptionAutoScroll(cue.text, nextCues)
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
          // Stepper-next/prev clicks swap the visible content panel; scroll the
          // user back to the top so the new section/step renders from its
          // heading rather than wherever they last scrolled to.
          if (cue.selector.includes('learn-stepper-')) scrollToTopAfterContentChange()
          return true
        })
        return
      }
      case 'highlight-tab':
      case 'select-tab':
        selectTab(cue.tabName)
        scrollToTopAfterContentChange()
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
 * After a `navigate` cue, scroll the page back to the top so the user sees
 * the new content from the heading down. Skipped when an explicit `scroll-to`
 * cue is queued — the author wins.
 *
 * (Earlier we tried scrolling to the first cue selector, but for module
 * tours the first selector is often the Next button at page bottom — that
 * scrolled past the actual content. Top-of-page is the right default.)
 */
function scheduleAutoScrollFromNextCues(nextCues?: WorkshopCue[]): void {
  if (nextCues && nextCues.some((c) => c.kind === 'scroll-to')) return
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 700)
}

/**
 * When a caption cue mentions a section name, smooth-scroll to the matching
 * heading on the current page. Skipped if an explicit `scroll-to` cue is
 * queued (author override wins). The "subject" is extracted by stripping
 * leading prefixes like "Section N/M:", "Step N:", "Workshop N/M:", "Artifact:".
 */
function scheduleCaptionAutoScroll(text: string, nextCues?: WorkshopCue[]): void {
  if (nextCues && nextCues.some((c) => c.kind === 'scroll-to')) return
  const subject = extractCaptionSubject(text)
  if (!subject) return
  setTimeout(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    const wanted = subject.toLowerCase()
    const match = headings.find((h) => {
      const t = (h.textContent ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, '')
      const w = wanted.replace(/[^a-z0-9 ]+/g, '')
      return t.includes(w) || w.includes(t)
    })
    if (match instanceof HTMLElement) {
      match.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 400)
}

function extractCaptionSubject(text: string): string | null {
  // Drop common workshop prefixes
  let s = text
    .replace(/^(Section|Step|Workshop|Artifact|Module|Tab)\s*\d*\s*\/?\s*\d*\s*:\s*/i, '')
    .replace(/^[—-]\s*/, '')
    .trim()
  // Take only the first sentence / before the dash
  const dashIdx = s.indexOf(' — ')
  if (dashIdx > 0) s = s.slice(0, dashIdx)
  s = s.split(/[.!?]/)[0].trim()
  // Need at least one alpha char and reasonable length
  if (s.length < 3 || s.length > 60) return null
  if (!/[a-zA-Z]/.test(s)) return null
  return s
}

/** Same as auto-scroll on navigate but with a shorter delay for in-page content changes. */
function scrollToTopAfterContentChange(): void {
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 250)
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

/**
 * Select a tab by either its data-workshop-target slug, role=tab textContent,
 * or button textContent. Retries up to 4×200ms when the tab list isn't yet in
 * the DOM (route just changed, lazy module still loading).
 *
 * Slug derivation strips non-alphanumerics so cue authors can use either the
 * canonical tab `value` ("tools") OR the human label ("Tools & Products") —
 * both resolve to the same selector slug.
 */
function selectTab(tabName: string): void {
  const wantSlug = tabName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const wantLower = tabName.toLowerCase().trim()

  const tryOnce = (): boolean => {
    // 1. data-workshop-target match (covers both canonical "tab-tools" and
    //    label-derived "tab-tools-products" via the slug normalisation).
    const targets = document.querySelectorAll('[data-workshop-target^="tab-"]')
    for (const t of Array.from(targets)) {
      const attr = t.getAttribute('data-workshop-target') ?? ''
      const slug = attr.replace(/^tab-/, '')
      if (slug === wantSlug || wantSlug.startsWith(slug + '-') || slug.startsWith(wantSlug + '-')) {
        if (t instanceof HTMLElement) {
          t.click()
          return true
        }
      }
    }
    // 2. Fallback: role="tab" textContent
    const roleTab = Array.from(document.querySelectorAll('[role="tab"]')).find(
      (el) => (el.textContent ?? '').trim().toLowerCase() === wantLower
    )
    if (roleTab instanceof HTMLElement) {
      roleTab.click()
      return true
    }
    // 3. Fallback: any <button> whose textContent matches
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim().toLowerCase() === wantLower
    )
    if (btn instanceof HTMLElement) {
      btn.click()
      return true
    }
    return false
  }

  if (tryOnce()) return
  let n = 0
  const tick = () => {
    if (tryOnce()) return
    n++
    if (n < 4) setTimeout(tick, 200)
  }
  setTimeout(tick, 200)
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
