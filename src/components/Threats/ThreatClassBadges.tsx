// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import type { ThreatItem } from '@/data/threatsData'
import {
  getThreatClass,
  getShorTier,
  THREAT_CLASS_DEFS,
  SHOR_TIER_DEFS,
} from './threatClassification'

/**
 * Compact, read-only badges that surface the derived threat dimensions
 * (PER-PAGE-CHANGES Threats #2 threat_class + #4 Shor tier) inline in the
 * table and cards. Purely presentational; no interactivity, so they are safe
 * to drop inside existing row/card click targets.
 */

const CLASS_BADGE_STYLE: Record<string, string> = {
  hndl: 'bg-secondary/10 text-secondary border-secondary/20',
  hnfl: 'bg-warning/10 text-warning border-warning/20',
  both: 'bg-destructive/10 text-destructive border-destructive/20',
}

export const ThreatClassBadge: React.FC<{ threat: ThreatItem; className?: string }> = ({
  threat,
  className = '',
}) => {
  const cls = getThreatClass(threat)
  // eslint-disable-next-line security/detect-object-injection
  const def = THREAT_CLASS_DEFS[cls]
  return (
    <span
      // eslint-disable-next-line security/detect-object-injection
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${CLASS_BADGE_STYLE[cls]} ${className}`}
      title={`${def.full} — threatens ${def.property.toLowerCase()}`}
    >
      {def.label}
    </span>
  )
}

export const ShorTierBadge: React.FC<{ threat: ThreatItem; className?: string }> = ({
  threat,
  className = '',
}) => {
  const tier = getShorTier(threat)
  // eslint-disable-next-line security/detect-object-injection
  const def = SHOR_TIER_DEFS[tier]
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${def.bg} ${def.color} ${className}`}
      title={def.blurb}
    >
      {def.label}
    </span>
  )
}
