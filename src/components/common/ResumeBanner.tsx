// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useModuleStore } from '@/store/useModuleStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { logEvent, personaLabel } from '@/utils/analytics'

interface Props {
  /** Optional dismiss key — defaults to current pathname so the banner shows once per route per session. */
  dismissKey?: string
}

const STORAGE_PREFIX = 'resume-banner-dismissed:'

function dismissed(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(STORAGE_PREFIX + key) === '1'
  } catch {
    return false
  }
}

function markDismissed(key: string) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, '1')
  } catch {
    /* sessionStorage unavailable */
  }
}

/**
 * Shows a "Continue {Module}" link when the user has an in-progress or recently
 * completed module. Renders nothing if no module qualifies or the user dismissed
 * the banner for the current route this session.
 *
 * Selects the most-recently-visited module across all modules in
 * useModuleStore.modules where status !== 'not-started'.
 */
export const ResumeBanner: React.FC<Props> = ({ dismissKey }) => {
  const location = useLocation()
  const modules = useModuleStore((s) => s.modules)
  const key = dismissKey ?? `route:${location.pathname}`
  const [isDismissed, setIsDismissed] = useState<boolean>(() => dismissed(key))

  const lastVisitedModule = useMemo(() => {
    const entries = Object.entries(modules)
      .filter(([, m]) => m.status !== 'not-started' && m.lastVisited)
      .sort(([, a], [, b]) => b.lastVisited - a.lastVisited)
    const topEntry = entries[0]
    if (!topEntry) return null
    const [moduleId] = topEntry
    const catalog = MODULE_CATALOG[moduleId]
    if (!catalog) return null
    return { id: moduleId, title: catalog.title, path: `/learn/${moduleId}` }
  }, [modules])

  useEffect(() => {
    if (lastVisitedModule && !isDismissed) {
      logEvent('Resume Banner', 'Shown', personaLabel(lastVisitedModule.id))
    }
  }, [lastVisitedModule, isDismissed])

  if (isDismissed || !lastVisitedModule) return null

  const handleDismiss = () => {
    markDismissed(key)
    logEvent('Resume Banner', 'Dismissed', personaLabel(lastVisitedModule.id))
    setIsDismissed(true)
  }

  return (
    <div className="mb-4 flex justify-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm text-foreground">
        <Link
          to={lastVisitedModule.path}
          onClick={() =>
            logEvent('Resume Banner', 'Resume Clicked', personaLabel(lastVisitedModule.id))
          }
          className="flex items-center gap-2 group hover:text-primary transition-colors"
        >
          <GraduationCap size={15} className="text-primary shrink-0" aria-hidden="true" />
          <span>
            Continue{' '}
            <span className="font-semibold group-hover:text-primary transition-colors">
              {lastVisitedModule.title}
            </span>
          </span>
          <ArrowRight
            size={13}
            className="text-primary/60 group-hover:text-primary transition-colors"
          />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          aria-label="Dismiss resume banner"
          className="h-6 w-6 p-0 shrink-0 -mr-1"
        >
          <X size={12} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
