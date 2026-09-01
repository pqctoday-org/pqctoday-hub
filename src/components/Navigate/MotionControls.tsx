// SPDX-License-Identifier: GPL-3.0-only
import { Compass, Pause, Play, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type MotionMode = 'off' | 'spin' | 'tour'

export const MOTION_SPEED_MIN = 0.25
export const MOTION_SPEED_MAX = 3
export const MOTION_SPEED_STEP = 0.25
export const MOTION_SPEED_DEFAULT = 1

const MODE_OPTIONS: { mode: MotionMode; label: string; icon: typeof Compass }[] = [
  { mode: 'off', label: 'Off', icon: Pause },
  { mode: 'spin', label: 'Spin', icon: Compass },
  { mode: 'tour', label: 'Tour', icon: Rocket },
]

export interface TourProgress {
  stopIndex: number
  stopCount: number
  categoryLabel: string
}

interface MotionControlsProps {
  mode: MotionMode
  onModeChange: (mode: MotionMode) => void
  speed: number
  onSpeedChange: (speed: number) => void
  /** Non-null only once a tour has actually produced at least one stop. */
  tourProgress: TourProgress | null
  tourPaused: boolean
  onResumeTour: () => void
  /** Enabled categories with zero nodes visible at the current % density — see tourItinerary.ts skippedCategories(). */
  skippedCategoryLabels: string[]
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}×`
}

export function MotionControls({
  mode,
  onModeChange,
  speed,
  onSpeedChange,
  tourProgress,
  tourPaused,
  onResumeTour,
  skippedCategoryLabels,
}: MotionControlsProps) {
  return (
    <div className="space-y-2 border-t border-border pt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {MODE_OPTIONS.map(({ mode: m, label, icon: Icon }) => (
          <Button
            key={m}
            variant={mode === m ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onModeChange(m)}
            className="h-auto gap-1.5 rounded-full px-2.5 py-1 text-xs"
            aria-pressed={mode === m}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {label}
          </Button>
        ))}
        {mode === 'tour' && tourPaused && tourProgress && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onResumeTour}
            className="h-auto gap-1.5 rounded-full px-2.5 py-1 text-xs"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            Resume
          </Button>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="whitespace-nowrap">Speed {formatSpeed(speed)}</span>
        <input
          type="range"
          min={MOTION_SPEED_MIN}
          max={MOTION_SPEED_MAX}
          step={MOTION_SPEED_STEP}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Rotation and tour speed"
        />
      </label>
      {mode === 'tour' && tourProgress && (
        <p className="text-xs text-muted-foreground">
          Stop {tourProgress.stopIndex + 1} of {tourProgress.stopCount} ·{' '}
          {tourProgress.categoryLabel}
          {tourPaused ? ' · Paused' : ''}
        </p>
      )}
      {mode === 'tour' && skippedCategoryLabels.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Hidden at this density: {skippedCategoryLabels.join(', ')} — raise the % slider to include{' '}
          {skippedCategoryLabels.length === 1 ? 'it' : 'them'}.
        </p>
      )}
    </div>
  )
}
