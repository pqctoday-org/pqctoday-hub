// SPDX-License-Identifier: GPL-3.0-only
import { useState, type FC } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DrillItem } from '../data'

interface Props {
  heading: string
  intro: string
  items: DrillItem[]
}

/**
 * One multiple-choice drill: the learner picks the most accurate option for
 * each item and immediately sees why it holds up. Options are shown in their
 * authored order; nothing is scored or persisted.
 */
export const ChoiceDrill: FC<Props> = ({ heading, intro, items }) => {
  const [picked, setPicked] = useState<Record<string, number>>({})
  const answered = items.filter((item) => picked[item.id] !== undefined)
  const accurate = answered.filter((item) => item.options[picked[item.id]]?.correct).length

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
        <p className="text-sm text-muted-foreground mt-1">{intro}</p>
        {answered.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3" aria-live="polite">
            {accurate} of {answered.length} answered accurately so far ({items.length} in total).
          </p>
        )}
      </div>

      {items.map((item) => {
        const choice = picked[item.id]
        const done = choice !== undefined
        return (
          <fieldset key={item.id} className="glass-panel p-5 space-y-3">
            <legend className="sr-only">{item.prompt}</legend>
            <p className="text-sm font-semibold text-foreground">{item.prompt}</p>
            {item.context && <p className="text-xs text-muted-foreground">{item.context}</p>}
            <div className="space-y-2">
              {item.options.map((option, i) => {
                const selected = choice === i
                const tone = !done
                  ? 'border-border hover:border-primary/60'
                  : option.correct
                    ? 'border-status-success bg-status-success/10'
                    : selected
                      ? 'border-status-error bg-status-error/10'
                      : 'border-border'
                return (
                  <Button
                    key={i}
                    type="button"
                    variant="outline"
                    disabled={done}
                    aria-pressed={selected}
                    onClick={() => setPicked((prev) => ({ ...prev, [item.id]: i }))}
                    className={`w-full h-auto justify-start whitespace-normal text-left font-normal p-3 items-start gap-2 disabled:opacity-100 ${tone}`}
                  >
                    {done && option.correct && (
                      <CheckCircle2
                        size={16}
                        className="text-status-success mt-0.5 shrink-0"
                        aria-label="Accurate"
                      />
                    )}
                    {done && selected && !option.correct && (
                      <XCircle
                        size={16}
                        className="text-status-error mt-0.5 shrink-0"
                        aria-label="Not accurate"
                      />
                    )}
                    <span className="text-foreground">{option.text}</span>
                  </Button>
                )
              })}
            </div>
            {done && (
              <p className="text-sm text-foreground/90 bg-muted/50 rounded-lg p-3 border border-border">
                {item.why}
              </p>
            )}
          </fieldset>
        )
      })}

      {answered.length > 0 && (
        <Button type="button" variant="link" size="sm" onClick={() => setPicked({})}>
          Start again
        </Button>
      )}
    </div>
  )
}
