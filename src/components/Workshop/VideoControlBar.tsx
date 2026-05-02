// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoControlBarProps {
  stepIndex: number
  stepTotal: number
  paused: boolean
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  onPauseToggle: () => void
  onSkip: () => void
  onRestart: () => void
  onExit: () => void
}

/**
 * Video Mode bottom control bar. Auto-hides after 3 seconds of mouse
 * inactivity; reveals on mousemove. Hidden in headless contexts where
 * the cursor never moves (Playwright recorder).
 */
export const VideoControlBar: React.FC<VideoControlBarProps> = ({
  stepIndex,
  stepTotal,
  paused,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onPauseToggle,
  onSkip,
  onRestart,
  onExit,
}) => {
  // Start visible on Video Mode entry so the user knows the controls exist;
  // auto-hide after 5 seconds of inactivity. Reveal again on mousemove or
  // keypress with a 3-second hide-after-idle window.
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let timer: number | undefined
    // Initial visible window — give the user 5 seconds to notice the bar.
    timer = window.setTimeout(() => setVisible(false), 5000)

    const reveal = (): void => {
      setVisible(true)
      if (timer !== undefined) window.clearTimeout(timer)
      timer = window.setTimeout(() => setVisible(false), 3000)
    }
    window.addEventListener('mousemove', reveal, { passive: true })
    window.addEventListener('keydown', reveal, { passive: true })
    return () => {
      window.removeEventListener('mousemove', reveal)
      window.removeEventListener('keydown', reveal)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-[85] flex justify-center pb-4 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      data-workshop-overlay="control-bar"
    >
      <div className="flex items-center gap-1 rounded-full bg-card/95 border border-border px-3 py-1.5 shadow-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous step"
          className="h-9 w-9 p-0"
        >
          <ChevronLeft size={18} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onPauseToggle}
          aria-label={paused ? 'Resume' : 'Pause'}
          className="h-9 w-9 p-0"
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRestart}
          aria-label="Restart this step"
          className="h-9 w-9 p-0"
        >
          <RotateCcw size={18} />
        </Button>

        <span className="px-3 text-xs text-muted-foreground tabular-nums select-none">
          Step {stepIndex + 1} / {stepTotal}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          disabled={!canNext}
          aria-label="Skip step"
          className="h-9 w-9 p-0"
        >
          <SkipForward size={18} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next step"
          className="h-9 w-9 p-0"
        >
          <ChevronRight size={18} />
        </Button>

        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          aria-label="Exit Video Mode"
          className="h-9 px-2 text-xs"
        >
          <X size={16} className="mr-1" />
          Exit
        </Button>
      </div>
    </div>
  )
}
