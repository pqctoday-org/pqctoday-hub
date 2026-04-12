// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import type { TrustScore } from '@/data/trustScore'
import { DIMENSION_LABELS } from '@/data/trustScore'

interface TrustScoreTooltipProps {
  score: TrustScore
  style: React.CSSProperties
  onClose: () => void
}

function scoreBarColor(rawScore: number): string {
  if (rawScore >= 70) return 'bg-status-success'
  if (rawScore >= 40) return 'bg-status-warning'
  return 'bg-status-error'
}

function tierColor(tier: string): string {
  switch (tier) {
    case 'Authoritative':
      return 'text-status-success'
    case 'High':
      return 'text-primary'
    case 'Moderate':
      return 'text-status-warning'
    default:
      return 'text-status-error'
  }
}

export const TrustScoreTooltip: React.FC<TrustScoreTooltipProps> = ({ score, style, onClose }) => {
  return createPortal(
    <div
      role="tooltip"
      className="fixed z-50 w-80 glass-panel border border-border rounded-lg shadow-lg p-3 text-sm embed-backdrop"
      style={style}
      onMouseLeave={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">{score.compositeScore}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        <span className={clsx('text-sm font-semibold', tierColor(score.tier))}>{score.tier}</span>
      </div>

      {/* Dimension breakdown */}
      <div className="space-y-1.5">
        {score.dimensions.map((dim) => (
          <div key={dim.dimension}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {DIMENSION_LABELS[dim.dimension]}
                <span className="ml-1 opacity-60">({Math.round(dim.weight * 100)}%)</span>
              </span>
              <span className="font-medium text-foreground">{Math.round(dim.rawScore)}</span>
            </div>
            <div className="h-1 bg-muted rounded-full mt-0.5 overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all', scoreBarColor(dim.rawScore))}
                style={{ width: `${dim.rawScore}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
              {dim.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}
