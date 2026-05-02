// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useState } from 'react'

interface CalloutProps {
  selector: string
  label: string
  arrow?: 'left' | 'right' | 'top' | 'bottom'
}

interface Position {
  top: number
  left: number
}

export const Callout: React.FC<CalloutProps> = ({ selector, label, arrow = 'left' }) => {
  const [pos, setPos] = useState<Position | null>(null)

  useEffect(() => {
    let stopped = false
    const recompute = (): void => {
      if (stopped) return
      const el = document.querySelector(selector)
      if (!el) {
        setPos(null)
        return
      }
      const r = el.getBoundingClientRect()
      switch (arrow) {
        case 'left':
          setPos({ top: r.top + r.height / 2 - 16, left: r.right + 16 })
          break
        case 'right':
          setPos({ top: r.top + r.height / 2 - 16, left: r.left - 220 })
          break
        case 'top':
          setPos({ top: r.bottom + 12, left: r.left + r.width / 2 - 110 })
          break
        case 'bottom':
          setPos({ top: r.top - 48, left: r.left + r.width / 2 - 110 })
          break
      }
    }
    recompute()
    const interval = window.setInterval(recompute, 33)
    window.addEventListener('resize', recompute, { passive: true })
    window.addEventListener('scroll', recompute, { passive: true, capture: true })
    return () => {
      stopped = true
      window.clearInterval(interval)
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, { capture: true })
    }
  }, [selector, arrow])

  if (!pos) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[75]"
      style={{ top: pos.top, left: pos.left }}
      data-workshop-overlay="callout"
    >
      <div className="flex items-center gap-2 max-w-[220px]">
        {arrow === 'left' && (
          <span className="block w-3 h-3 border-l-2 border-b-2 border-primary -rotate-45" />
        )}
        <div className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium shadow-lg">
          {label}
        </div>
        {arrow === 'right' && (
          <span className="block w-3 h-3 border-r-2 border-t-2 border-primary -rotate-45" />
        )}
      </div>
    </div>
  )
}
