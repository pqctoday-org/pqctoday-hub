// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logPersonaSelected } from '@/utils/analytics'

/**
 * One-time, dismissible, nonblocking notice for a legacy Executive user
 * migrated across the 2026-09-07 Executive/GRC persona split
 * (executive-grc-split-plan.md §3 item 6). `usePersonaStore`'s v11
 * migration sets `hasAcknowledgedExecutiveGrcSplit: false` ONLY for a
 * pre-v11 store whose selected persona was 'executive' — every other user
 * (fresh installs, other personas) gets `true` and never sees this.
 *
 * Deliberately an inline banner (matches WorkflowBanner/PreviewBanner's
 * shape), not a modal — "nonblocking" per the plan means the reader can
 * keep using the page underneath it. Any of the three actions
 * (Keep Executive / Switch to GRC / dismiss-X) acknowledges it so it never
 * shows again; only "Switch to GRC" also changes the selected persona.
 * Region/industry, progress and artifacts are untouched either way —
 * `setPersona` never resets them.
 */
export const ExecutiveGrcSplitNotice: React.FC = () => {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const hasAcknowledged = usePersonaStore((s) => s.hasAcknowledgedExecutiveGrcSplit)
  const acknowledge = usePersonaStore((s) => s.acknowledgeExecutiveGrcSplit)
  const setPersona = usePersonaStore((s) => s.setPersona)

  if (hasAcknowledged || selectedPersona !== 'executive') return null

  const handleSwitchToGrc = () => {
    setPersona('grc')
    logPersonaSelected('grc', 'switch')
    acknowledge()
  }

  return (
    <div
      className="glass-panel p-3 mb-4 print:hidden"
      role="status"
      aria-label="Executive and GRC are now separate roles"
    >
      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
        <p className="text-sm text-foreground flex-1 min-w-0">
          Executive and GRC now have separate paths. Keep Executive for sponsorship and decisions,
          or switch to GRC for risk, controls and evidence.
        </p>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={acknowledge} className="flex-1 sm:flex-none">
            Keep Executive
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSwitchToGrc}
            className="flex-1 sm:flex-none"
          >
            Switch to GRC
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={acknowledge}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
