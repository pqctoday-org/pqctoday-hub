// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonaSwitchModal } from '@/components/Persona/PersonaSwitchModal'
import { logPreviewBannerShown, logPreviewBannerDismissed } from '@/utils/analytics'

interface Props {
  /** Short description of who this page is "most useful for" — e.g. "Architect, Developer". */
  pageContext?: string
  /**
   * Stable key for session-dismiss persistence. Defaults to the current route pathname.
   * Override when multiple banners share a route (rare).
   */
  dismissKey?: string
}

const STORAGE_PREFIX = 'preview-banner-dismissed:'

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
    /* sessionStorage unavailable — ignore */
  }
}

export const PreviewBanner: React.FC<Props> = ({ pageContext, dismissKey }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const key = dismissKey ?? location.pathname
  const [switchOpen, setSwitchOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState<boolean>(() => dismissed(key))

  // Fire telemetry once per mount when the banner is actually rendered
  useEffect(() => {
    if (!isDismissed) {
      logPreviewBannerShown(key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (isDismissed) return null

  const handleDismiss = () => {
    markDismissed(key)
    logPreviewBannerDismissed(key)
    setIsDismissed(true)
  }

  return (
    <>
      <div
        role="status"
        className="glass-panel border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3 flex-wrap sm:flex-nowrap"
      >
        <Lock size={15} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium">
            Preview locked — switch to a technical role for the full feature.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pageContext ? (
              <>
                Most useful for <span className="text-foreground">{pageContext}</span>. New to PQC?
                Start with <span className="text-foreground">PQC 101</span> first.
              </>
            ) : (
              <>
                New to PQC? Start with <span className="text-foreground">PQC 101</span> first to
                build the foundation, then come back here.
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learn/pqc-101')}
            className="h-7 text-xs flex-1 sm:flex-none"
          >
            Start PQC 101
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSwitchOpen(true)}
            className="h-7 text-xs flex-1 sm:flex-none"
          >
            Switch role
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            aria-label="Dismiss preview banner"
            className="h-7 w-7 p-0 shrink-0"
          >
            <X size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {switchOpen && <PersonaSwitchModal onClose={() => setSwitchOpen(false)} />}
    </>
  )
}
