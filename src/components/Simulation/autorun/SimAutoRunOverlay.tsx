// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimAutoRunOverlay — the bottom narration + transport bar for the live auto-run.
 * Renders nothing until a run is playing (or has just finished). Fixed-position, so
 * it can be mounted anywhere in the sim tree.
 */
import { Button } from '@/components/ui/button'
import type { SimAutoRunPlayer } from './useSimAutoRunPlayer'

const btn =
  'h-auto rounded-md border border-background/25 px-2.5 py-1 font-mono text-[11px] font-bold text-background/80 hover:bg-background/10'

export function SimAutoRunOverlay({ player }: { player: SimAutoRunPlayer }) {
  if (!player.running && !player.done) return null
  const pct = player.total ? Math.round((player.index / player.total) * 100) : 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 border-t border-background/20 bg-foreground/95 px-4 py-3 text-background shadow-2xl backdrop-blur">
      <div className="flex w-full max-w-3xl items-center gap-3">
        <span className="shrink-0 rounded bg-primary px-2 py-0.5 font-mono text-[11px] font-bold text-background">
          {player.phaseLabel || 'AUTO-RUN'}
        </span>
        <span className="flex-1 truncate text-sm font-semibold">{player.caption}</span>
        <span className="shrink-0 font-mono text-[11px] text-background/60">
          {player.index}/{player.total}
        </span>
      </div>
      <div className="h-1 w-full max-w-3xl overflow-hidden rounded bg-background/20">
        <div className="h-full rounded bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!player.done && (
          <Button type="button" variant="ghost" onClick={player.prevPhase} className={btn}>
            ⏮ Prev phase
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
          <Button type="button" variant="ghost" onClick={player.nextPhase} className={btn}>
            Next phase ⏭
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
  )
}
