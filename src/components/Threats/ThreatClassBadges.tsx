// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ThreatItem } from '@/data/threatsData'
import { Button } from '@/components/ui/button'
import {
  getThreatClass,
  getShorTier,
  THREAT_CLASS_DEFS,
  SHOR_TIER_DEFS,
} from './threatClassification'

/**
 * Compact badges that surface the derived threat dimensions (Threats #2
 * threat_class + #4 Shor tier) inline in the table and cards. Their
 * definitions used to be conveyed only via a hover `title=` attribute, which
 * is invisible on touch devices. `DefinitionBadge` makes the definition
 * reachable by tap — the same open-on-click / close-on-outside-click-or-Escape
 * idiom already established for popovers on this page (`GanttDetailPopover` on
 * /timeline, `InlineTooltip` for glossary terms) — while remaining hoverable
 * on desktop and safe to nest inside an already-clickable table row/card
 * (the trigger stops the click from bubbling to the row).
 */

const CLASS_BADGE_STYLE: Record<string, string> = {
  hndl: 'bg-secondary/10 text-secondary border-secondary/20',
  hnfl: 'bg-warning/10 text-warning border-warning/20',
  both: 'bg-destructive/10 text-destructive border-destructive/20',
  unclassified: 'bg-muted/40 text-muted-foreground border-border',
}

const DefinitionBadge: React.FC<{
  label: string
  definition: string
  badgeClassName: string
  className?: string
}> = ({ label, definition, badgeClassName, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [style, setStyle] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setIsOpen(false), [])

  const open = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const halfW = 130
      const clampedX = Math.max(
        halfW + 8,
        Math.min(rect.left + rect.width / 2, window.innerWidth - halfW - 8)
      )
      setStyle({ top: rect.bottom + 6, left: clampedX })
    }
    setIsOpen(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      )
        return
      close()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('scroll', close, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('scroll', close, { capture: true })
    }
  }, [isOpen, close])

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        ref={triggerRef}
        onClick={(e) => {
          // Badges live inside clickable table rows / cards — stop the tap
          // from also opening the row's detail dialog.
          e.stopPropagation()
          setIsOpen((v) => !v)
          if (!isOpen) open()
        }}
        onMouseEnter={open}
        onMouseLeave={close}
        aria-expanded={isOpen}
        aria-label={`${label} definition`}
        className={`h-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-help ${badgeClassName} ${className}`}
      >
        {label}
      </Button>
      {isOpen &&
        style &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            style={{ position: 'fixed', zIndex: 9999, transform: 'translateX(-50%)', ...style }}
            className="w-64 p-2.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg text-xs leading-relaxed"
          >
            {definition}
          </div>,
          document.body
        )}
    </>
  )
}

export const ThreatClassBadge: React.FC<{ threat: ThreatItem; className?: string }> = ({
  threat,
  className = '',
}) => {
  const cls = getThreatClass(threat)
  // eslint-disable-next-line security/detect-object-injection
  const def = THREAT_CLASS_DEFS[cls]
  return (
    <DefinitionBadge
      label={def.label}
      definition={`${def.full} — threatens ${def.property.toLowerCase()}.`}
      // eslint-disable-next-line security/detect-object-injection
      badgeClassName={CLASS_BADGE_STYLE[cls]}
      className={className}
    />
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
    <DefinitionBadge
      label={def.label}
      definition={def.blurb}
      badgeClassName={`${def.bg} ${def.color}`}
      className={className}
    />
  )
}
