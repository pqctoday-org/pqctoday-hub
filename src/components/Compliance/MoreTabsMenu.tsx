// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, BookOpen, Award, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SecondaryTab = 'standards' | 'certification' | 'cswp39'

interface TabMeta {
  value: SecondaryTab
  label: string
  icon: React.ReactNode
}

const SECONDARY_TAB_META: TabMeta[] = [
  { value: 'standards', label: 'Standardization Bodies', icon: <BookOpen size={14} /> },
  { value: 'certification', label: 'Certification Schemes', icon: <Award size={14} /> },
  { value: 'cswp39', label: 'CSWP.39 Framework', icon: <Workflow size={14} /> },
]

interface MoreTabsMenuProps {
  activeTab: string
  onSelect: (tab: SecondaryTab) => void
}

export function MoreTabsMenu({ activeTab, onSelect }: MoreTabsMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Portal-positioned dropdown escapes the TabsList overflow-x-auto clipping context.
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const hasActiveSecondary = SECONDARY_TAB_META.some((t) => t.value === activeTab)

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors ${
          hasActiveSecondary
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        More
        <ChevronDown
          size={14}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </Button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            className="z-50 min-w-[200px] bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {SECONDARY_TAB_META.map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                role="option"
                aria-selected={activeTab === tab.value}
                onClick={() => {
                  onSelect(tab.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors justify-start ${
                  activeTab === tab.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
