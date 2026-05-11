// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import type { ChatSourceRef } from '@/types/ChatTypes'

/**
 * CitationTierChip — sized-down trust-tier indicator next to inline citations
 * in the assistant's message and Cmd-K rows. §14.3 step 4 of
 * trust-engine-explainability.
 *
 * Renders nothing when `tier` is undefined (chunk did not resolve to a scored
 * resource). When a tier is present, renders a one-character glyph + accessible
 * label so screen readers see "Authoritative source" rather than "A".
 */
interface CitationTierChipProps {
  tier: ChatSourceRef['trustTier']
  className?: string
}

const TIER_GLYPH: Record<NonNullable<ChatSourceRef['trustTier']>, string> = {
  Authoritative: 'A',
  High: 'H',
  Moderate: 'M',
  Low: 'L',
}

const TIER_CLS: Record<NonNullable<ChatSourceRef['trustTier']>, string> = {
  Authoritative: 'bg-status-success/15 text-status-success border-status-success/30',
  High: 'bg-primary/15 text-primary border-primary/30',
  Moderate: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  Low: 'bg-status-error/10 text-status-error border-status-error/30',
}

export const CitationTierChip: React.FC<CitationTierChipProps> = ({ tier, className }) => {
  if (!tier) return null
  return (
    <span
      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border text-[9px] font-mono font-bold leading-none shrink-0 ${TIER_CLS[tier]} ${className ?? ''}`}
      aria-label={`Trust tier: ${tier}`}
      title={`${tier} trust tier — see About → Trust Score Methodology`}
    >
      {TIER_GLYPH[tier]}
    </span>
  )
}
