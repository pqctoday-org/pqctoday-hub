// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import type { TrustTier } from '@/data/trustScore'

interface TrustBadgeProps {
  tier: TrustTier
  score: number
  size?: 'sm' | 'md'
  className?: string
}

const TIER_STYLES: Record<TrustTier, string> = {
  Authoritative: 'bg-status-success/15 text-status-success border-status-success/30',
  High: 'bg-primary/10 text-primary border-primary/30',
  Moderate: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  Low: 'bg-status-error/10 text-status-error border-status-error/20',
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ tier, score, size = 'md', className }) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full border select-none',
        TIER_STYLES[tier],
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        className
      )}
      title={`Trust Score: ${score}/100 (${tier})`}
    >
      <ShieldCheck className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {tier}
    </span>
  )
}
