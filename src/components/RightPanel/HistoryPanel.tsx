// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { ProgressDashboard } from './ProgressDashboard'
import { HistoryFeed } from './HistoryFeed'

export const HistoryPanel: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ProgressDashboard />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <HistoryFeed />
      </div>
    </div>
  )
}
