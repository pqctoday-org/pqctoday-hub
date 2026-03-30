// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { TrustBadge } from './TrustBadge'
import { TrustScoreTooltip } from './TrustScoreTooltip'
import { getTrustScore, type ScoredResourceType } from '@/data/trustScore'

interface TrustScoreBadgeProps {
  resourceType: ScoredResourceType
  resourceId: string
  size?: 'sm' | 'md'
  className?: string
}

export const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  resourceType,
  resourceId,
  size = 'md',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLSpanElement>(null)

  const score = useMemo(() => getTrustScore(resourceType, resourceId), [resourceType, resourceId])

  const open = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const halfW = 160 // w-80 = 320px / 2
    const clampedX = Math.max(halfW + 8, Math.min(centerX, window.innerWidth - halfW - 8))

    if (window.innerHeight - rect.bottom >= 300) {
      setTooltipStyle({
        top: rect.bottom + 6,
        left: clampedX,
        transform: 'translateX(-50%)',
      })
    } else {
      setTooltipStyle({
        bottom: window.innerHeight - rect.top + 6,
        left: clampedX,
        transform: 'translateX(-50%)',
      })
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  // Close on scroll or escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleScroll = () => close()
    document.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [isOpen, close])

  if (!score) return null

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className={className}
      >
        <TrustBadge tier={score.tier} score={score.compositeScore} size={size} />
      </span>
      {isOpen && <TrustScoreTooltip score={score} style={tooltipStyle} onClose={close} />}
    </>
  )
}
