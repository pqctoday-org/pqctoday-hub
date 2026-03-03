// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { CheckCircle, ShieldAlert } from 'lucide-react'

/** Three-tier FIPS badge: Validated (green), Partial (amber), No (gray) */
export const renderFipsStatus = (status: string): React.ReactElement => {
  const lower = (status || '').toLowerCase()
  const isFipsCertified = lower.includes('fips 140') || lower.includes('fips 203')
  const isPartial = !isFipsCertified && lower.startsWith('yes')

  if (isFipsCertified) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-success text-status-success">
        <CheckCircle size={10} /> Validated
      </span>
    )
  }
  if (isPartial) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-warning text-status-warning">
        <ShieldAlert size={10} /> Partial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">
      <span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> No
    </span>
  )
}

/** PQC Support badge with level-specific colors */
export const renderPqcSupport = (support: string): React.ReactElement => {
  const lower = (support || '').toLowerCase()
  let badgeClass: string
  if (lower.startsWith('yes')) {
    badgeClass = 'bg-status-success text-status-success'
  } else if (lower.startsWith('limited')) {
    badgeClass = 'bg-status-warning text-status-warning'
  } else if (lower.startsWith('planned')) {
    badgeClass = 'bg-primary/10 text-primary border-primary/20'
  } else if (lower.startsWith('no')) {
    badgeClass = 'bg-destructive/10 text-destructive border-destructive/20'
  } else {
    badgeClass = 'bg-muted/50 text-muted-foreground border-border'
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${badgeClass}`}
    >
      {support || 'Unknown'}
    </span>
  )
}
