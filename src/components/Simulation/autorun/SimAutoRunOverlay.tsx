// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimAutoRunOverlay — an opaque transport bar pinned to the bottom of the screen
 * during the live auto-run. On each new phase it expands for ~10s to show that
 * phase's framework explanation (a readable, wrapping block) + a progress bar,
 * then shrinks to just the phase title and the controls to save vertical space.
 * Click the title to re-open/close it. Renders nothing until a run is playing
 * (or has just finished).
 */
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SimAutoRunPlayer } from './useSimAutoRunPlayer'

const btn =
  'h-auto rounded-md border border-background/25 px-2.5 py-1 font-mono text-[11px] font-bold text-background/80 hover:bg-background/10'

const EXPAND_MS = 10000

export function SimAutoRunOverlay({ player }: { player: SimAutoRunPlayer }) {
  const focus = player.phaseFocus
  const [expanded, setExpanded] = useState(true)
  const [prevPhase, setPrevPhase] = useState(focus?.name)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On each new phase, re-open the explanation. Adjusting state during render
  // (React's "reset state when a prop changes" pattern) avoids a synchronous
  // setState inside an effect, which can trigger cascading renders.
  if (focus?.name !== prevPhase) {
    setPrevPhase(focus?.name)
    setExpanded(true)
  }

  // After re-opening, auto-collapse to just the title after ~10s. The collapse
  // runs inside the timer callback (async), not synchronously in the effect.
  useEffect(() => {
    if (!focus) return
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    collapseTimer.current = setTimeout(() => setExpanded(false), EXPAND_MS)
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current)
    }
  }, [focus?.name])

  // Manual toggle cancels the auto-collapse so it stays where the user put it.
  const toggle = () => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current)
      collapseTimer.current = null
    }
    setExpanded((v) => !v)
  }

  if (!player.running && !player.done) return null
  const pct = player.total ? Math.round((player.index / player.total) * 100) : 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-background/20 bg-foreground px-5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] text-background shadow-2xl">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
        {focus && (
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={toggle}
              aria-expanded={expanded}
              className="flex h-auto w-full items-center justify-start gap-2 p-0 text-left font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-primary hover:bg-transparent hover:text-primary/80"
            >
              <span className="shrink-0 text-[10px] text-background/50">
                {expanded ? '▾' : '▸'}
              </span>
              <span className="truncate">{focus.name}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] normal-case tracking-normal text-background/55">
                {player.phaseLabel} · {player.index}/{player.total}
              </span>
            </Button>
            {/* Progress stays visible in BOTH states (07-29 review U10) — it
                previously lived inside the collapsible block, so percent
                complete vanished after the ~10s auto-collapse. */}
            <div className="mt-1.5 h-0.5 overflow-hidden rounded bg-background/20">
              <div
                className="h-full rounded bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Collapsed: keep the current narration line readable (07-29
                review E6) — voice keeps talking after the collapse, and a
                muted or deaf/HoH viewer loses the words otherwise. */}
            {!expanded && player.caption && (
              <p
                aria-live="polite"
                className="mt-1 truncate text-[13px] leading-snug text-background/75"
              >
                {player.caption}
              </p>
            )}
            <div
              className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-out ${
                expanded ? 'mt-1.5 max-h-[26vh] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="overflow-y-auto pr-2 text-[16px] leading-relaxed text-background/90">
                <p>{focus.summary}</p>
                {focus.gate && (
                  <p className="mt-2 text-[14px] leading-relaxed text-background/60">
                    <span className="font-bold text-background/80">Exit gate:</span> {focus.gate}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          {!player.done && (
            <Button type="button" variant="ghost" onClick={player.prevPass} className={btn}>
              ⏮ Prev pass
            </Button>
          )}
          {player.running && !player.paused && (
            <Button type="button" variant="ghost" onClick={player.pause} className={btn}>
              ❚❚ Pause
            </Button>
          )}
          {player.running && player.paused && (
            <Button type="button" variant="ghost" onClick={player.resume} className={btn}>
              ▶ Resume
            </Button>
          )}
          {!player.done && (
            <Button type="button" variant="ghost" onClick={player.nextPass} className={btn}>
              Next pass ⏭
            </Button>
          )}
          {!player.done && (
            <Button type="button" variant="ghost" onClick={player.cycleSpeed} className={btn}>
              Speed: {player.speed}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={player.toggleVoice}
            className={btn}
            title={player.voiceName ? `Voice: ${player.voiceName}` : 'Browser voice'}
          >
            {player.voiceOn ? `🔊 ${player.voiceName || 'Voice'}` : '🔇 Muted'}
          </Button>
          <Button type="button" variant="ghost" onClick={player.stop} className={btn}>
            {player.done ? 'Close' : '■ Stop'}
          </Button>
        </div>
      </div>
    </div>
  )
}
