// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import type { WorkshopCue, WorkshopFixtures } from '@/types/Workshop'
import { buildUrl } from '@/utils/workshopDeepLink'
import { useWorkshopStore } from './useWorkshopStore'

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
  /**
   * Absolute `performance.now()` timestamp when the last TTS utterance ended
   * (or will end, if set to a far-future value while speech is in progress).
   * The RAF scheduler checks this instead of an estimated duration so captions
   * never fire while the previous one is still being spoken.
   */
  speechEndedAt: number

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
  speechEndedAt: 0,

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
        // Block the scheduler from advancing to the next caption until speech
        // actually ends. The far-future value is reset by utter.onend in speakCaption.
        set({ caption: cue.text, captionVisible: true, speechEndedAt: performance.now() + 120_000 })
        scheduleCaptionAutoScroll(cue.text, nextCues)
        speakCaption(cue.text)
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
 * Speak a caption via the browser's native Web Speech API. Reads ttsEnabled
 * + playbackSpeed lazily so toggling either takes effect on the next caption.
 * Cancels any in-flight utterance so words don't pile up across captions.
 */
/**
 * Convert a screen-reading caption into something that speaks well:
 *   - Strip "Section N/M:", "Workshop N/M:", "Layer N/M:", "Step N:" prefixes
 *     (visual signposting, not meant to be read aloud).
 *   - Em-dash with spaces → period (creates a natural sentence-break pause).
 *   - Center dot · → comma (avoids "middle dot" being read literally).
 *   - "X / Y" → "X or Y" (slash is awkwardly read as "slash").
 *   - "X.Y.Z" version numbers and slug-ids stay as-is.
 *   - Strip markdown emphasis markers.
 */
function prepareForSpeech(text: string): string {
  return text
    .replace(
      /^\s*(?:Section|Workshop|Layer|Step|Hint|Artifact|Module|Tab)\s+\d+(?:\s*(?:\/|of|out of)\s*\d+)?\s*[:.\-—]\s*/i,
      ''
    )
    .replace(/\s*[—–]\s*/g, '. ')
    .replace(/\s+·\s+/g, ', ')
    .replace(/\s+\/\s+/g, ' or ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function speakCaption(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const { ttsEnabled, ttsVoiceURI } = useWorkshopStore.getState()
    if (!ttsEnabled) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(prepareForSpeech(text))
    // English-only captions — force `lang` so the browser picks an English
    // voice when no specific voice is selected.
    utter.lang = 'en-US'
    // Fixed narration pace, decoupled from playbackSpeed.
    utter.rate = 0.85
    utter.pitch = 1.0
    utter.volume = 1.0
    if (ttsVoiceURI) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === ttsVoiceURI)
      if (voice) utter.voice = voice
    }
    utter.onend = () => {
      useWorkshopOverlayStore.setState({ speechEndedAt: performance.now() })
    }
    window.speechSynthesis.speak(utter)
  } catch (e) {
    console.warn('[workshop] TTS speak failed:', e)
    // Release the block so the scheduler can continue even if TTS fails.
    useWorkshopOverlayStore.setState({ speechEndedAt: performance.now() })
  }
}

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
  // Only suppress if a scroll-to fires before the first caption — that scroll-to
  // is part of the navigation sequence. A scroll-to AFTER the first caption
  // belongs to a later section, so post-navigate scroll-to-top is still wanted.
  if (nextCues) {
    for (const c of nextCues) {
      if (c.kind === 'caption') break
      if (c.kind === 'scroll-to') return
    }
  }
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 700)
}

/**
 * When a caption cue mentions a section name, smooth-scroll to the matching
 * heading on the current page. Skipped only if an explicit `scroll-to` cue is
 * queued BEFORE the next caption — that means the author is overriding scroll
 * for THIS section. A scroll-to for a future section (after the next caption)
 * does not suppress; it belongs to that future section.
 */
function scheduleCaptionAutoScroll(text: string, nextCues?: WorkshopCue[]): void {
  if (nextCues) {
    for (const c of nextCues) {
      if (c.kind === 'caption') break
      if (c.kind === 'scroll-to') return
    }
  }
  const candidates = extractCaptionSubjects(text)
  if (candidates.length === 0) return
  setTimeout(() => {
    // Prefer headings inside <main>; fall back to all visible h1-h3 if none.
    const mainHeadings = Array.from(document.querySelectorAll('main h1, main h2, main h3'))
    const headings =
      mainHeadings.length > 0 ? mainHeadings : Array.from(document.querySelectorAll('h1, h2, h3'))

    let best: { el: HTMLElement; score: number } | null = null
    for (const wanted of candidates) {
      const w = wanted
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, '')
        .trim()
      if (w.length < 3) continue
      for (const h of headings) {
        if (!(h instanceof HTMLElement)) continue
        const t = (h.textContent ?? '')
          .toLowerCase()
          .replace(/[^a-z0-9 ]+/g, '')
          .trim()
        if (!t) continue
        let score = 0
        if (t === w) score = 1.0
        else if (t.startsWith(w + ' ') || t.endsWith(' ' + w)) score = 0.9
        else if (t.includes(` ${w} `)) score = 0.7
        else if (t.includes(w) || w.includes(t)) score = 0.5
        // Require coverage: candidate length / heading length >= 0.5 OR exact-word
        const coverage = w.length / Math.max(t.length, 1)
        if (score < 1 && coverage < 0.5) continue
        if (score > 0 && (!best || score > best.score)) {
          best = { el: h, score }
        }
        if (best && best.score >= 0.9) break
      }
      if (best && best.score >= 0.9) break
    }
    if (best) {
      best.el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 400)
}

/**
 * Extract a list of candidate "section subjects" from a caption, in priority
 * order. The matcher tries each candidate against page headings until one hits.
 *
 * Examples:
 *   "Section 2/5: Whats Changing"        → ["Whats Changing"]
 *   "Mission: educate every persona…"    → ["Mission", "educate every persona…"]
 *   "PQC 101 — post-quantum cryptography" → ["PQC 101", "PQC 101 — post-quantum cryptography"]
 *   "Six roles: executive, developer, …"  → ["Six roles"]
 */
function extractCaptionSubjects(text: string): string[] {
  const out: string[] = []
  // Strip common workshop prefixes
  const stripped = text
    // Match both old `Section 1/3:` and new spoken-friendly `Section 1 of 3.` forms
    .replace(
      /^(Section|Step|Workshop|Layer|Hint|Artifact|Module|Tab)\s+\d+(?:\s*(?:\/|of|out of)\s*\d+)?\s*[:.\-—]\s*/i,
      ''
    )
    .replace(/^[—-]\s*/, '')
    .trim()

  // 1. Prefix before the first ":" — e.g. "Mission" from "Mission: ..."
  const colonIdx = stripped.indexOf(':')
  if (colonIdx > 0 && colonIdx < 40) {
    const head = stripped.slice(0, colonIdx).trim()
    if (head.length >= 3 && /[a-zA-Z]/.test(head)) out.push(head)
  }

  // 2. Prefix before " — " (em-dash with spaces) — e.g. "PQC 101"
  const dashIdx = stripped.indexOf(' — ')
  if (dashIdx > 0) {
    const head = stripped.slice(0, dashIdx).trim()
    if (head.length >= 3 && /[a-zA-Z]/.test(head)) out.push(head)
  }

  // 3. First sentence (without prefixes) capped to first 60 chars
  let s = stripped.split(/[.!?]/)[0].trim()
  if (colonIdx > 0 && colonIdx < 40) s = s.slice(colonIdx + 1).trim()
  if (s.length > 60) s = s.slice(0, 60).trim()
  if (s.length >= 3 && /[a-zA-Z]/.test(s)) out.push(s)

  // 4. First N words (1-4) — last-resort fuzzy match
  const words = stripped.split(/\s+/).filter(Boolean)
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    const phrase = words
      .slice(0, n)
      .join(' ')
      .replace(/[:.,—-]+$/, '')
    if (phrase.length >= 3 && /[a-zA-Z]/.test(phrase) && !out.includes(phrase)) {
      out.push(phrase)
    }
  }
  return out
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
    if (n < attempts) {
      setTimeout(tick, delay)
    } else {
      console.warn('[workshop] cue selector unresolved after retries:', selector)
    }
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
