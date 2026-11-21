// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { getModuleDeepLink } from '@/hooks/useModuleDeepLink'

/**
 * Step links for workshops that show every step on one page.
 *
 * Most workshops are steppers, and `?tab=workshop&step=N` selects step N. A few
 * (MLS, TLS Basics) lay all their tools out on one page, so the link has
 * nothing to select and used to land at the top. Mark each tool's container
 * with `data-workshop-step="<manifest workshopSteps[].id>"` and call this once:
 * a step link then scrolls to that tool.
 */
export const useWorkshopStepAnchor = (steps: readonly { id: string }[] | undefined): void => {
  useEffect(() => {
    if (!steps?.length) return
    const dl = getModuleDeepLink({ maxStep: steps.length - 1 })
    if (!dl.stepGiven || dl.initialTab !== 'workshop') return
    const id = steps[dl.initialStep]?.id
    if (!id) return
    const raf = requestAnimationFrame(() => {
      document
        .querySelector(`[data-workshop-step="${CSS.escape(id)}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(raf)
  }, [steps])
}
