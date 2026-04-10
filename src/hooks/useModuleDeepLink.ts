// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { logModuleTabSwitch } from '@/utils/analytics'

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
): { initialTab: string; initialStep: number; initialFlow: string | null } {
  const {
    validTabs = ['learn', 'visual', 'workshop', 'exercises', 'references', 'tools'],
    maxStep,
    defaultTab = 'learn',
  } = opts
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

  const flowParam = params.get('flow')

  return { initialTab, initialStep, initialFlow: flowParam }
}

/**
 * Keeps URL search params (?tab=, ?step=, ?flow=) in sync with module navigation state.
 * Uses replaceState to avoid polluting browser history.
 */
export function useSyncDeepLink(
  tab: string,
  step: number,
  flow?: string | null,
  defaultTab = 'learn'
) {
  const isMounted = useRef(false)

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

    if (flow) {
      url.searchParams.set('flow', flow)
    } else {
      url.searchParams.delete('flow')
    }

    window.history.replaceState(null, '', url.toString())

    // Track tab switches — skip the initial mount (deep-link or default)
    if (isMounted.current) {
      const segments = window.location.pathname.split('/')
      // pathname: /learn/<moduleId>/... or /embed/learn/<moduleId>/...
      const learnIdx = segments.indexOf('learn')
      const moduleId = learnIdx !== -1 ? (segments[learnIdx + 1] ?? '') : ''
      if (moduleId) logModuleTabSwitch(moduleId, tab)
    } else {
      isMounted.current = true
    }
  }, [tab, step, flow, defaultTab])
}
