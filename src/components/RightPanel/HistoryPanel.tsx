// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { usePersonaStore } from '@/store/usePersonaStore'
import { JourneyMapPanel } from './JourneyMapPanel'
import { ProgressDashboard } from './ProgressDashboard'
import { HistoryFeed } from './HistoryFeed'

export const HistoryPanel: React.FC = () => {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  // When a persona is selected, show the journey map; otherwise fall back to
  // the classic progress dashboard + history feed.
  if (selectedPersona) {
    return <JourneyMapPanel />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ProgressDashboard />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <HistoryFeed />
      </div>
    </div>
  )
}
