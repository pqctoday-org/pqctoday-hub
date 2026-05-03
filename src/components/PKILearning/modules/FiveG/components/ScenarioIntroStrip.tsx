// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Shield, EyeOff, Radio } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'

export type ScenarioView = 'operator' | 'attacker'

interface ScenarioViewSwitcherProps {
  view: ScenarioView
  onViewChange: (view: ScenarioView) => void
}

export const ScenarioViewSwitcher: React.FC<ScenarioViewSwitcherProps> = ({
  view,
  onViewChange,
}) => (
  <div
    role="group"
    aria-label="Scenario perspective"
    className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
  >
    <Button
      variant="ghost"
      onClick={() => onViewChange('operator')}
      aria-pressed={view === 'operator'}
      className={clsx(
        'h-7 px-2 text-xs gap-1.5 rounded-md',
        view === 'operator'
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Radio size={12} />
      Operator view
    </Button>
    <Button
      variant="ghost"
      onClick={() => onViewChange('attacker')}
      aria-pressed={view === 'attacker'}
      className={clsx(
        'h-7 px-2 text-xs gap-1.5 rounded-md',
        view === 'attacker'
          ? 'bg-destructive/15 text-destructive'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <EyeOff size={12} />
      IMSI-catcher view
    </Button>
  </div>
)

export interface ScenarioIntroStripProps {
  view: ScenarioView
  onViewChange: (view: ScenarioView) => void
  plainEnglish: boolean
  onPlainEnglishChange: (enabled: boolean) => void
}

/**
 * Scenario-level framing strip shown above the Configure card.
 * Explains *why* SUCI matters in one sentence and exposes two global toggles:
 *   - Operator vs IMSI-catcher view (injects red-bordered sidecar into step descriptions)
 *   - Plain English (controls the PlainEnglishRail next to the terminal)
 */
export const ScenarioIntroStrip: React.FC<ScenarioIntroStripProps> = ({
  view,
  onViewChange,
  plainEnglish,
  onPlainEnglishChange,
}) => {
  return (
    <div className="glass-panel border border-border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="flex-1 flex items-start gap-3">
        <Shield size={20} className="text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/90 leading-snug">
          An IMSI catcher within radio range sees every packet your phone broadcasts. SUCI conceals
          your identity so the catcher sees only ephemeral ciphertext — never your real IMSI.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
        {/* Perspective toggle */}
        <div
          role="group"
          aria-label="Scenario perspective"
          className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
        >
          <Button
            variant="ghost"
            onClick={() => onViewChange('operator')}
            aria-pressed={view === 'operator'}
            className={clsx(
              'h-7 px-2 text-xs gap-1.5 rounded-md',
              view === 'operator'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Radio size={12} />
            Operator view
          </Button>
          <Button
            variant="ghost"
            onClick={() => onViewChange('attacker')}
            aria-pressed={view === 'attacker'}
            className={clsx(
              'h-7 px-2 text-xs gap-1.5 rounded-md',
              view === 'attacker'
                ? 'bg-destructive/15 text-destructive'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <EyeOff size={12} />
            IMSI-catcher view
          </Button>
        </div>

        {/* Plain-English toggle */}
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={plainEnglish}
            onChange={(e) => onPlainEnglishChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          Plain English
        </label>
      </div>
    </div>
  )
}
