// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Stamp } from 'lucide-react'
import { Button } from './button'
import { logEndorsement } from '@/utils/endorsement'

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
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    logEndorsement(resourceType, resourceLabel)
    window.open(endorseUrl, '_blank', 'noopener,noreferrer')
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors ${className ?? ''}`}
        aria-label={`Endorse ${resourceLabel}`}
        title={`Endorse ${resourceLabel}`}
      >
        <Stamp size={16} className="animate-bounce-subtle" />
        {label}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`p-1.5 h-auto min-h-0 [@media(pointer:coarse)]:min-h-[36px] [@media(pointer:coarse)]:min-w-[36px] text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors rounded-lg ${className ?? ''}`}
      aria-label={`Endorse ${resourceLabel}`}
      title={`Endorse ${resourceLabel}`}
    >
      <Stamp size={18} className="animate-bounce-subtle" />
    </Button>
  )
}
