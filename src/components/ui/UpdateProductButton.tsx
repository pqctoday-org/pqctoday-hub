// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { PenLine } from 'lucide-react'
import { Button } from './button'
import { logProductUpdate } from '@/utils/endorsement'

interface UpdateProductButtonProps {
  updateUrl: string
  resourceLabel: string
  variant?: 'icon' | 'text'
  label?: string
  className?: string
}

export const UpdateProductButton: React.FC<UpdateProductButtonProps> = ({
  updateUrl,
  resourceLabel,
  variant = 'icon',
  label = 'Update PQC Info',
  className,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    logProductUpdate(resourceLabel)
    window.open(updateUrl, '_blank', 'noopener,noreferrer')
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors ${className ?? ''}`}
        aria-label={`Submit PQC update for ${resourceLabel}`}
        title={`Submit PQC update for ${resourceLabel}`}
      >
        <PenLine size={16} className="animate-bounce-subtle" />
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
      aria-label={`Submit PQC update for ${resourceLabel}`}
      title={`Submit PQC update for ${resourceLabel}`}
    >
      <PenLine size={18} className="animate-bounce-subtle" />
    </Button>
  )
}
