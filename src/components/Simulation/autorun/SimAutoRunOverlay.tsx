// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimAutoRunOverlay — a compact, opaque transport bar pinned to the bottom of the
 * screen during the live auto-run. The phase title sits fixed on the left; the phase
 * explanation scrolls horizontally on a single line (the existing sim-ticker marquee)
 * so the bar stays short and the sim board above it stays visible. Renders nothing
 * until a run is playing (or has just finished).
 */
import { Button } from '@/components/ui/button'
import type { SimAutoRunPlayer } from './useSimAutoRunPlayer'

const btn =
  'h-auto rounded-md border border-background/25 px-2.5 py-1 font-mono text-[11px] font-bold text-background/80 hover:bg-background/10'

export function SimAutoRunOverlay({ player }: { player: SimAutoRunPlayer }) {
  if (!player.running && !player.done) return null
  const pct = player.total ? Math.round((player.index / player.total) * 100) : 0
  const focus = player.phaseFocus
  const tickerText = focus ? focus.summary + (focus.gate ? ` · Exit gate: ${focus.gate}` : '') : ''
  // Constant, slow reading pace (~0.22s per character) regardless of phase length.
  const tickerDur = Math.max(28, Math.round(tickerText.length * 0.22))

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-background/20 bg-foreground px-5 py-2.5 text-background shadow-2xl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
        {focus && (
          <div>
            <div className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-primary">
              {focus.name}
            </div>
            <div className="mt-1 overflow-hidden">
              <div
                className="animate-sim-ticker inline-flex whitespace-nowrap text-[18px] leading-snug text-background/90"
                style={{ animationDuration: `${tickerDur}s` }}
              >
                <span className="pr-24">{tickerText}</span>
                <span className="pr-24" aria-hidden="true">
                  {tickerText}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="h-0.5 flex-1 overflow-hidden rounded bg-background/20">
            <div
              className="h-full rounded bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[10px] text-background/55">
            {player.phaseLabel} · {player.index}/{player.total}
          </span>
        </div>

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
