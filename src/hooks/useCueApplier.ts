// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkshopCue, WorkshopFixtures } from '@/types/Workshop'
import { buildUrl } from '@/utils/workshopDeepLink'

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
    (cue: WorkshopCue, fixtures: WorkshopFixtures, currentStepId: string | null): void => {
      switch (cue.kind) {
        case 'navigate':
          navigate(buildUrl(cue.route, cue.query))
          return
        case 'caption':
          setCaptionState(cue.text)
          setCaptionVisible(true)
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
          const el = document.querySelector(cue.selector)
          if (el instanceof HTMLElement) el.click()
          return
        }
        case 'highlight-tab':
          selectTab(cue.tabName)
          return
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

function selectTab(tabName: string): void {
  // 1. Workshop target slug
  const slug = tabName.toLowerCase().replace(/\s+/g, '-')
  const targeted = document.querySelector(`[data-workshop-target="tab-${slug}"]`)
  if (targeted instanceof HTMLElement) {
    targeted.click()
    return
  }
  // 2. role="tab"
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
  const roleMatch = tabs.find(
    (t) => (t.textContent ?? '').trim().toLowerCase() === tabName.toLowerCase()
  )
  if (roleMatch instanceof HTMLElement) {
    roleMatch.click()
    return
  }
  // 3. <button>
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
