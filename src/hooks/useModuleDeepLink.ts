// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'

/**
 * Parses ?tab= and ?step= from the current URL for module deep-linking.
 * Called inside useState initializers — runs once per mount.
 */
export function getModuleDeepLink(
  opts: {
    validTabs?: string[]
    maxStep?: number
    defaultTab?: string
  } = {}
): { initialTab: string; initialStep: number } {
  const { validTabs = ['learn', 'workshop'], maxStep, defaultTab = 'learn' } = opts
  const params = new URLSearchParams(window.location.search)

  const tabParam = params.get('tab')
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : defaultTab

  const stepParam = params.get('step')
  let initialStep = 0
  if (stepParam !== null) {
    const parsed = parseInt(stepParam, 10)
    if (!Number.isNaN(parsed) && parsed >= 0) {
      initialStep = maxStep !== undefined ? Math.min(parsed, maxStep) : parsed
    }
  }

  return { initialTab, initialStep }
}

/**
 * Keeps URL search params (?tab=, ?step=) in sync with module navigation state.
 * Uses replaceState to avoid polluting browser history.
 */
export function useSyncDeepLink(tab: string, step: number, defaultTab = 'learn') {
  useEffect(() => {
    const url = new URL(window.location.href)

    if (tab !== defaultTab) {
      url.searchParams.set('tab', tab)
    } else {
      url.searchParams.delete('tab')
    }

    if (step > 0) {
      url.searchParams.set('step', String(step))
    } else {
      url.searchParams.delete('step')
    }

    window.history.replaceState(null, '', url.toString())
  }, [tab, step, defaultTab])
}
