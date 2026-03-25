// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Flag } from 'lucide-react'
import { Button } from './button'
import { logFlag, buildDiscussionSearchUrl } from '@/utils/endorsement'
import { useEndorsementStore } from '@/store/useEndorsementStore'

interface FlagButtonProps {
  flagUrl: string
  resourceLabel: string
  resourceType: string
  variant?: 'icon' | 'text'
  label?: string
  className?: string
}

export const FlagButton: React.FC<FlagButtonProps> = ({
  flagUrl,
  resourceLabel,
  resourceType,
  variant = 'icon',
  label = 'Flag',
  className,
}) => {
  const { isFlagged, markFlagged } = useEndorsementStore()
  const flagged = isFlagged(resourceType, resourceLabel)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (flagged) {
      window.open(buildDiscussionSearchUrl(resourceLabel), '_blank', 'noopener,noreferrer')
    } else {
      logFlag(resourceType, resourceLabel)
      markFlagged(resourceType, resourceLabel)
      window.open(flagUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs min-h-[44px] transition-colors ${
          flagged
            ? 'text-status-error bg-status-error/15 hover:bg-status-error/20'
            : 'text-status-error hover:text-status-error/80'
        } ${className ?? ''}`}
        aria-label={
          flagged
            ? `You flagged ${resourceLabel} — view on GitHub`
            : `Flag issue with ${resourceLabel}`
        }
        title={
          flagged
            ? 'You flagged this — click to view on GitHub'
            : `Flag issue with ${resourceLabel}`
        }
      >
        <Flag size={16} className={flagged ? '' : 'animate-bounce-subtle'} />
        {flagged ? 'Flagged' : label}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`p-1.5 h-auto min-h-0 [@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:min-w-[44px] transition-colors rounded-lg ${
        flagged
          ? 'text-status-error bg-status-error/15 ring-1 ring-status-error/30 hover:bg-status-error/20'
          : 'text-status-error hover:text-status-error/80 hover:bg-status-error/10'
      } ${className ?? ''}`}
      aria-label={
        flagged
          ? `You flagged ${resourceLabel} — view on GitHub`
          : `Flag issue with ${resourceLabel}`
      }
      title={
        flagged ? 'You flagged this — click to view on GitHub' : `Flag issue with ${resourceLabel}`
      }
    >
      <Flag size={18} className={flagged ? '' : 'animate-bounce-subtle'} />
    </Button>
  )
}
