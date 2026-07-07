// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'

interface ThreatActionsMenuProps {
  endorseUrl: string
  flagUrl: string
  resourceLabel: string
  resourceType: string
}

/** Consolidates EndorseButton + FlagButton into one overflow menu — shared by
 *  ThreatCard and ThreatsTable so per-item chrome doesn't stay duplicated. */
export const ThreatActionsMenu = ({
  endorseUrl,
  flagUrl,
  resourceLabel,
  resourceType,
}: ThreatActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Close (rather than float away from its anchor) on scroll, matching FilterDropdown.
  // The delay avoids closing immediately from the same scroll/focus adjustment
  // that can accompany opening the menu.
  useEffect(() => {
    if (!isOpen) return
    const handleScroll = () => setIsOpen(false)
    const timeoutId = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }, 100)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isOpen])

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOpen) {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) {
        const menuWidth = 180
        setMenuPos({
          top: rect.bottom + 4,
          left: Math.min(rect.left, window.innerWidth - menuWidth - 8),
        })
      }
    }
    setIsOpen((prev) => !prev)
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        onClick={toggleOpen}
        className="h-auto rounded p-1 text-muted-foreground/50 hover:text-foreground"
        aria-label={`More actions for ${resourceLabel}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal size={16} />
      </Button>
      {isOpen &&
        menuPos &&
        createPortal(
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- closes the popover after a menu item's own click handler runs; Escape/outside-click are the keyboard/focus paths
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: Math.max(8, menuPos.left),
              zIndex: 9999,
              minWidth: 180,
            }}
            className="flex flex-col gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-xl"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          >
            <EndorseButton
              endorseUrl={endorseUrl}
              resourceLabel={resourceLabel}
              resourceType={resourceType}
              variant="text"
              className="w-full justify-start"
            />
            <FlagButton
              flagUrl={flagUrl}
              resourceLabel={resourceLabel}
              resourceType={resourceType}
              variant="text"
              className="w-full justify-start"
            />
          </div>,
          document.body
        )}
    </>
  )
}
