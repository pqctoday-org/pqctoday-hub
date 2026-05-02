// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useState } from 'react'
import { Info } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { SuciFlow } from '@/components/PKILearning/modules/FiveG/SuciFlow'
import { Button } from '@/components/ui/button'

/**
 * Playground wrapper for SuciFlow.
 * URL is the single source of truth. SuciFlow is keyed on profile+pqcMode so
 * it remounts cleanly on every profile or mode change.
 */
export function SuciFlowRoute() {
  const [searchParams, setSearchParams] = useSearchParams()

  const p = searchParams.get('profile')
  const mode = searchParams.get('pqcMode')

  // Canonical values derived from URL
  const profile: 'A' | 'B' | 'C' = p === 'B' || p === 'C' ? p : 'A'
  // pqcMode only applies to Profile C; default is hybrid
  const pqcMode: 'hybrid' | 'pure' = profile === 'C' && mode === 'pure' ? 'pure' : 'hybrid'

  const handleProfileChange = useCallback(
    (newProfile: 'A' | 'B' | 'C') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('profile', newProfile)
          // Profile C always starts in hybrid; A/B don't use pqcMode
          if (newProfile === 'C') {
            next.set('pqcMode', 'hybrid')
          } else {
            next.delete('pqcMode')
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handlePqcModeChange = useCallback(
    (newMode: 'hybrid' | 'pure') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          // Always set pqcMode explicitly so the URL reflects the active mode
          next.set('pqcMode', newMode)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // First-visit detection: no URL params at all means the user arrived via
  // the Playground catalog, not a deep link. Drives the collapsed Configure card.
  const isFirstVisit = !searchParams.get('profile') && !searchParams.get('pqcMode')

  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const pqcModeIgnoredNotice =
    !noticeDismissed && !!(searchParams.get('pqcMode') && profile !== 'C')

  return (
    <>
      {pqcModeIgnoredNotice && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-muted px-3 py-2 text-xs text-muted-foreground">
          <span>
            <Info size={11} className="inline mr-1" />
            The <code>pqcMode</code> URL parameter only applies to Profile C. Switch to Profile C to
            use the hybrid/pure PQC mode setting.
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNoticeDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>
      )}
      <SuciFlow
        key={`${profile}-${pqcMode}`}
        onBack={() => window.history.back()}
        initialProfile={profile}
        initialPqcMode={pqcMode}
        onProfileChange={handleProfileChange}
        onPqcModeChange={handlePqcModeChange}
        isFirstVisit={isFirstVisit}
      />
    </>
  )
}
