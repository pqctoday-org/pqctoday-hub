// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkshopCue, WorkshopFixtures } from '@/types/Workshop'
import { buildUrl } from '@/utils/workshopDeepLink'
import { useWorkshopStore } from '@/store/useWorkshopStore'

interface ActiveCallout {
  id: number
  selector: string
  label: string
  arrow?: 'left' | 'right' | 'top' | 'bottom'
}

export interface CueApplierState {
  caption: string
  captionVisible: boolean
  spotlightSelector: string | null
  callouts: ActiveCallout[]
}

export interface CueApplierActions {
  setCaption: (text: string, visible?: boolean) => void
  clearOverlays: () => void
  applyCue: (cue: WorkshopCue, fixtures: WorkshopFixtures, currentStepId: string | null) => void
}

/**
 * Reusable cue applier. Owns the visual overlay state (caption, spotlight,
 * callouts) and exposes `applyCue` that performs the side-effects required
 * by each cue kind. Used by both VideoOverlay (timer-driven) and Workshop
 * Mode (manual Prev/Next stepping).
 */
export function useCueApplier(): CueApplierState & CueApplierActions {
  const navigate = useNavigate()
  const [caption, setCaptionState] = useState<string>('')
  const [captionVisible, setCaptionVisible] = useState(false)
  const [spotlightSelector, setSpotlightSelector] = useState<string | null>(null)
  const [callouts, setCallouts] = useState<ActiveCallout[]>([])
  const calloutCounter = useRef(0)

  const setCaption = useCallback((text: string, visible: boolean = true): void => {
    setCaptionState(text)
    setCaptionVisible(visible)
  }, [])

  const clearOverlays = useCallback((): void => {
    setSpotlightSelector(null)
    setCallouts([])
  }, [])

  const applyCue = useCallback(
    (
      cue: WorkshopCue,
      fixtures: WorkshopFixtures,
      currentStepId: string | null,
      nextCues?: WorkshopCue[]
    ): void => {
      switch (cue.kind) {
        case 'navigate':
          navigate(buildUrl(cue.route, cue.query))
          scheduleAutoScrollFromNextCues(nextCues)
          return
        case 'caption':
          setCaptionState(cue.text)
          setCaptionVisible(true)
          scheduleCaptionAutoScroll(cue.text, nextCues)
          speakCaption(cue.text)
          return
        case 'spotlight':
          setSpotlightSelector(cue.selector)
          return
        case 'callout': {
          const id = ++calloutCounter.current
          setCallouts((prev) => [
            ...prev,
            { id, selector: cue.selector, label: cue.label, arrow: cue.arrow },
          ])
          return
        }
        case 'click': {
          retrySelector(cue.selector, (el) => {
            el.click()
            if (cue.selector.includes('learn-stepper-')) scrollToTopAfterContentChange()
            return true
          })
          return
        }
        case 'highlight-tab':
          selectTab(cue.tabName)
          scrollToTopAfterContentChange()
          return
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
          const fmt = cue.format ?? 'markdown'
          retrySelector(`[data-workshop-target="business-artifact-export-${fmt}"]`, (el) => {
            el.click()
            return true
          })
          return
        }
        case 'advance':
          // Caller decides what to do with 'advance' — useCueApplier never
          // mutates step state.
          return
      }
    },
    [navigate]
  )

  return {
    caption,
    captionVisible,
    spotlightSelector,
    callouts,
    setCaption,
    clearOverlays,
    applyCue,
  }
}

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
    utter.lang = 'en-US'
    utter.rate = 0.85
    if (ttsVoiceURI) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === ttsVoiceURI)
      if (voice) utter.voice = voice
    }
    window.speechSynthesis.speak(utter)
  } catch (e) {
    console.warn('[workshop] TTS speak failed:', e)
  }
}

function scheduleAutoScrollFromNextCues(nextCues?: WorkshopCue[]): void {
  // Suppress only if a scroll-to fires before the first caption.
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

function scheduleCaptionAutoScroll(text: string, nextCues?: WorkshopCue[]): void {
  // Suppress only if scroll-to is queued before the next caption (same section).
  if (nextCues) {
    for (const c of nextCues) {
      if (c.kind === 'caption') break
      if (c.kind === 'scroll-to') return
    }
  }
  const candidates = extractCaptionSubjects(text)
  if (candidates.length === 0) return
  setTimeout(() => {
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

function extractCaptionSubjects(text: string): string[] {
  const out: string[] = []
  const stripped = text
    .replace(
      /^(Section|Step|Workshop|Layer|Hint|Artifact|Module|Tab)\s+\d+(?:\s*(?:\/|of|out of)\s*\d+)?\s*[:.\-—]\s*/i,
      ''
    )
    .replace(/^[—-]\s*/, '')
    .trim()
  const colonIdx = stripped.indexOf(':')
  if (colonIdx > 0 && colonIdx < 40) {
    const head = stripped.slice(0, colonIdx).trim()
    if (head.length >= 3 && /[a-zA-Z]/.test(head)) out.push(head)
  }
  const dashIdx = stripped.indexOf(' — ')
  if (dashIdx > 0) {
    const head = stripped.slice(0, dashIdx).trim()
    if (head.length >= 3 && /[a-zA-Z]/.test(head)) out.push(head)
  }
  let s = stripped.split(/[.!?]/)[0].trim()
  if (colonIdx > 0 && colonIdx < 40) s = s.slice(colonIdx + 1).trim()
  if (s.length > 60) s = s.slice(0, 60).trim()
  if (s.length >= 3 && /[a-zA-Z]/.test(s)) out.push(s)
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

function scrollToTopAfterContentChange(): void {
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 250)
}

function retrySelector(
  selector: string,
  apply: (el: HTMLElement) => boolean,
  attempts = 4,
  delay = 200
): void {
  let n = 0
  const tick = () => {
    const el = document.querySelector(selector)
    if (el instanceof HTMLElement && apply(el)) return
    n++
    if (n < attempts) {
      setTimeout(tick, delay)
    } else {
      console.warn('[workshop] cue selector unresolved after retries:', selector)
    }
  }
  tick()
}

function selectTab(tabName: string): void {
  const wantSlug = tabName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const wantLower = tabName.toLowerCase().trim()

  const tryOnce = (): boolean => {
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
    const roleTab = Array.from(document.querySelectorAll('[role="tab"]')).find(
      (el) => (el.textContent ?? '').trim().toLowerCase() === wantLower
    )
    if (roleTab instanceof HTMLElement) {
      roleTab.click()
      return true
    }
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
