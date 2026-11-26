// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- a focusable separator is the WAI-ARIA window splitter: an interactive widget, not a static element */
import { useCallback, useEffect, useRef } from 'react'
import { ASSISTANT_WIDTH_KEY_STEP } from '@/store/useAssistantWidthStore'
import { COPY } from '../Assistant/copy'
import { useAssistantWidth } from '../Assistant/useAssistantLayout'

/**
 * The drag handle on the docked drawer's left edge. Dragging left makes the drawer wider.
 * Arrow keys move the edge by 20 px (Left: wider, Right: narrower); a double click goes back to the
 * automatic width. The width is remembered on this device.
 */
export function AssistantResizeHandle() {
  const { width, min, max, setWidth, reset } = useAssistantWidth()
  const drag = useRef<{ startX: number; startWidth: number; frame: number | null } | null>(null)

  useEffect(
    () => () => {
      if (drag.current?.frame != null) cancelAnimationFrame(drag.current.frame)
    },
    []
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      e.currentTarget.setPointerCapture?.(e.pointerId)
      drag.current = { startX: e.clientX, startWidth: width, frame: null }
      e.preventDefault()
    },
    [width]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current
      if (!d) return
      const next = d.startWidth + (d.startX - e.clientX)
      if (d.frame != null) cancelAnimationFrame(d.frame)
      d.frame = requestAnimationFrame(() => {
        d.frame = null
        setWidth(next)
      })
    },
    [setWidth]
  )

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    if (d.frame != null) cancelAnimationFrame(d.frame)
    drag.current = null
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') setWidth(width + ASSISTANT_WIDTH_KEY_STEP)
    else if (e.key === 'ArrowRight') setWidth(width - ASSISTANT_WIDTH_KEY_STEP)
    else if (e.key === 'Home') setWidth(min)
    else if (e.key === 'End') setWidth(max)
    else return
    e.preventDefault()
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={COPY.resize}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      tabIndex={0}
      data-testid="assistant-resize-handle"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDoubleClick={reset}
      className="absolute inset-y-0 left-0 z-10 w-2 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-highlight-border/40 focus-visible:bg-highlight-border focus-visible:outline-none"
    />
  )
}
