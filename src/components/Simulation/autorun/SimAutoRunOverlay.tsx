// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimAutoRunOverlay — an opaque transport bar pinned to the bottom of the screen
 * during the live auto-run. Shows the focused phase's title and its framework
 * explanation as a normal, readable block of text (wraps; scrolls within the bar
 * if it's long — so the user can scroll the board AND this panel independently),
 * plus the transport controls. Renders nothing until a run is playing (or has
 * just finished).
 */
import { Button } from '@/components/ui/button'
import type { SimAutoRunPlayer } from './useSimAutoRunPlayer'

const btn =
  'h-auto rounded-md border border-background/25 px-2.5 py-1 font-mono text-[11px] font-bold text-background/80 hover:bg-background/10'

export function SimAutoRunOverlay({ player }: { player: SimAutoRunPlayer }) {
  if (!player.running && !player.done) return null
  const pct = player.total ? Math.round((player.index / player.total) * 100) : 0
  const focus = player.phaseFocus

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-background/20 bg-foreground px-5 py-3 text-background shadow-2xl">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
        {focus && (
          <div className="min-h-0">
            <div className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-primary">
              {focus.name}
            </div>
            <div className="mt-1 max-h-[24vh] overflow-y-auto pr-2 text-[16px] leading-relaxed text-background/90">
              <p>{focus.summary}</p>
              {focus.gate && (
                <p className="mt-2 text-[14px] leading-relaxed text-background/60">
                  <span className="font-bold text-background/80">Exit gate:</span> {focus.gate}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="h-0.5 flex-1 overflow-hidden rounded bg-background/20">
            <div className="h-full rounded bg-primary transition-all" style={{ width: `${pct}%` }} />
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
