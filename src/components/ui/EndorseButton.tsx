// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Stamp } from 'lucide-react'
import { Button } from './button'
import { logEndorsement, buildDiscussionSearchUrl } from '@/utils/endorsement'
import { useEndorsementStore } from '@/store/useEndorsementStore'

interface EndorseButtonProps {
  endorseUrl: string
  resourceLabel: string
  resourceType: string
  variant?: 'icon' | 'text'
  label?: string
  className?: string
}

export const EndorseButton: React.FC<EndorseButtonProps> = ({
  endorseUrl,
  resourceLabel,
  resourceType,
  variant = 'icon',
  label = 'Endorse',
  className,
}) => {
  const { isEndorsed, markEndorsed } = useEndorsementStore()
  const endorsed = isEndorsed(resourceType, resourceLabel)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (endorsed) {
      window.open(buildDiscussionSearchUrl(resourceLabel), '_blank', 'noopener,noreferrer')
    } else {
      logEndorsement(resourceType, resourceLabel)
      markEndorsed(resourceType, resourceLabel)
      window.open(endorseUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs min-h-[44px] transition-colors ${
          endorsed
            ? 'text-primary bg-primary/15 hover:bg-primary/20'
            : 'text-primary hover:text-primary/80'
        } ${className ?? ''}`}
        aria-label={
          endorsed ? `You endorsed ${resourceLabel} — view on GitHub` : `Endorse ${resourceLabel}`
        }
        title={
          endorsed ? `You endorsed this — click to view on GitHub` : `Endorse ${resourceLabel}`
        }
      >
        <Stamp size={16} className={endorsed ? '' : 'animate-bounce-subtle'} />
        {endorsed ? 'Endorsed' : label}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`p-1.5 h-auto min-h-0 [@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:min-w-[44px] transition-colors rounded-lg ${
        endorsed
          ? 'text-primary bg-primary/15 ring-1 ring-primary/30 hover:bg-primary/20'
          : 'text-primary hover:text-primary/80 hover:bg-primary/10'
      } ${className ?? ''}`}
      aria-label={
        endorsed ? `You endorsed ${resourceLabel} — view on GitHub` : `Endorse ${resourceLabel}`
      }
      title={endorsed ? 'You endorsed this — click to view on GitHub' : `Endorse ${resourceLabel}`}
    >
      <Stamp size={18} className={endorsed ? '' : 'animate-bounce-subtle'} />
    </Button>
  )
}
