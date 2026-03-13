// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Flag } from 'lucide-react'
import { Button } from './button'
import { logFlag } from '@/utils/endorsement'

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
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    logFlag(resourceType, resourceLabel)
    window.open(flagUrl, '_blank', 'noopener,noreferrer')
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs text-status-error hover:text-status-error/80 transition-colors ${className ?? ''}`}
        aria-label={`Flag issue with ${resourceLabel}`}
        title={`Flag issue with ${resourceLabel}`}
      >
        <Flag size={16} className="animate-bounce-subtle" />
        {label}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`p-1.5 h-auto min-h-0 [@media(pointer:coarse)]:min-h-[36px] [@media(pointer:coarse)]:min-w-[36px] text-status-error hover:text-status-error/80 hover:bg-status-error/10 transition-colors rounded-lg ${className ?? ''}`}
      aria-label={`Flag issue with ${resourceLabel}`}
      title={`Flag issue with ${resourceLabel}`}
    >
      <Flag size={18} className="animate-bounce-subtle" />
    </Button>
  )
}
