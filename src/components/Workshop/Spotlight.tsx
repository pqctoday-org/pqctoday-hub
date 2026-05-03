// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useState } from 'react'

interface SpotlightProps {
  selector: string | null
  padding?: number
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Renders a fixed full-screen SVG with a mask cutout around the resolved
 * selector. Recomputes position on resize, scroll, and at 30Hz while the
 * selector is set (catches layout changes from lazy-loaded content).
 */
export const Spotlight: React.FC<SpotlightProps> = ({ selector, padding = 8 }) => {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (!selector) return
    let stopped = false

    const recompute = (): void => {
      if (stopped) return
      const el = document.querySelector(selector)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({
        x: Math.max(0, r.left - padding),
        y: Math.max(0, r.top - padding),
        w: r.width + padding * 2,
        h: r.height + padding * 2,
      })
    }

    const initial = window.requestAnimationFrame(recompute)
    const interval = window.setInterval(recompute, 33)
    window.addEventListener('resize', recompute, { passive: true })
    window.addEventListener('scroll', recompute, { passive: true, capture: true })
    return () => {
      stopped = true
      window.cancelAnimationFrame(initial)
      window.clearInterval(interval)
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, { capture: true })
    }
  }, [selector, padding])

  if (!selector || !rect) return null

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
      width="100%"
      height="100%"
      data-workshop-overlay="spotlight"
    >
      <defs>
        <mask id="workshop-spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={8} ry={8} fill="black" />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="black"
        opacity="0.5"
        mask="url(#workshop-spotlight-mask)"
      />
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        rx={8}
        ry={8}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-primary"
      />
    </svg>
  )
}
