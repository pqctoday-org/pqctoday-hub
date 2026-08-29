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

export function SimAutoRunOverlay({
  player,
  defaultCollapsed = false,
  publishHeightVar = false,
}: {
  player: SimAutoRunPlayer
  /** mobile-ux-layer (WS-B3): the mobile call site passes true so the caption
   *  region starts (and re-starts, on every phase change) collapsed instead of
   *  eating ~26vh of a phone screen by default — still one tap away via the
   *  existing expand/collapse toggle below. Desktop's own call site never
   *  passes this, so its always-expand-then-auto-collapse behavior (07-29
   *  review U10) is unchanged. */
  defaultCollapsed?: boolean
  /** mobile-ux-layer (WS-B1): the mobile call site passes true so this, the
   *  ONLY visible instance at <768px (the desktop call site's own instance is
   *  invisible there — inside `hidden md:flex`, see SimulationView.tsx), is
   *  the one that publishes this bar's real measured height as the
   *  `--sim-transport-h` CSS var. SimArtifactReveal's mobile variant reads it
   *  to sit above the bar instead of underneath it (previously covered:
   *  z-[55] card under this bar's z-[60], with zero scroll clearance below
   *  it either). Deliberately opt-in per call site, not viewport-detected
   *  internally — the invisible desktop-branch instance would otherwise also
   *  fire (mounted, just display:none) and report a bogus 0px height,
   *  fighting the visible instance's real one for the same global property. */
  publishHeightVar?: boolean
}) {
  const focus = player.phaseFocus
  const [expanded, setExpanded] = useState(!defaultCollapsed)
  const [prevPhase, setPrevPhase] = useState(focus?.name)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  // NEW-overlay-40pct-viewport-clipped-text (mobile-only): the expanded text
  // block below gets a real max-height + overflow-y-auto scroll region on
  // narrow viewports (max-md:), so it can genuinely be scrolled rather than
  // just hard-clipped by this outer max-h-[26vh] wrapper with no way back. This
  // tracks whether that inner region actually has more content below the fold
  // (and hasn't already been scrolled there), to drive a bottom fade + "scroll
  // for more" hint — desktop is untouched, the inner block keeps no height
  // constraint of its own above md.
  const textRef = useRef<HTMLDivElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  // On each new phase, re-open the explanation. Adjusting state during render
  // (React's "reset state when a prop changes" pattern) avoids a synchronous
  // setState inside an effect, which can trigger cascading renders.
  if (focus?.name !== prevPhase) {
    setPrevPhase(focus?.name)
    setExpanded(!defaultCollapsed)
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

  // Tracks the mobile-only scroll region's real overflow state (see textRef
  // above) — recomputed whenever the phase text changes or the block
  // opens/closes, plus on resize/scroll so the hint disappears once the user
  // has actually scrolled to the end.
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const update = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 1
      const atBottom = el.scrollTop >= el.scrollHeight - el.clientHeight - 1
      setShowScrollHint(hasOverflow && !atBottom)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [expanded, focus?.summary, focus?.gate])

  // mobile-ux-layer (WS-B1): publishes this bar's real rendered height (only
  // when publishHeightVar is set — see the prop doc above) as a CSS var on the
  // document root, so a sibling fixed-position element (SimArtifactReveal's
  // mobile variant) can sit above it instead of guessing a fixed offset that
  // drifts every time this bar's own content/height changes (expanded vs
  // collapsed, one-line vs wrapped phase name, safe-area inset). Cleared
  // whenever this instance isn't actually rendering the bar (early-returns
  // null below), so nothing stale lingers once a run ends.
  useEffect(() => {
    if (!publishHeightVar) return
    const el = rootRef.current
    if (!el) {
      document.documentElement.style.removeProperty('--sim-transport-h')
      return
    }
    const update = () => {
      document.documentElement.style.setProperty(
        '--sim-transport-h',
        `${Math.ceil(el.getBoundingClientRect().height)}px`
      )
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty('--sim-transport-h')
    }
  }, [publishHeightVar, player.running, player.done, expanded])

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
    <div
      ref={rootRef}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-background/20 bg-foreground px-5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] text-background shadow-2xl"
    >
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
              <div className="relative">
                <div
                  ref={textRef}
                  className="overflow-y-auto pr-2 text-[16px] leading-relaxed text-background/90 max-md:max-h-[24vh]"
                >
                  <p>{focus.summary}</p>
                  {focus.gate && (
                    <p className="mt-2 text-[14px] leading-relaxed text-background/60">
                      <span className="font-bold text-background/80">Exit gate:</span> {focus.gate}
                    </p>
                  )}
                </div>
                {/* Mobile-only bottom fade + hint — the desktop block above md
                    has no height constraint of its own, so this can never
                    trigger there (hasOverflow stays false against an
                    unconstrained clientHeight). */}
                {showScrollHint && (
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-6 items-end justify-center bg-gradient-to-t from-foreground to-transparent max-md:flex"
                    aria-hidden="true"
                  >
                    <span className="mb-0.5 font-mono text-[10px] text-background/70">
                      ▾ scroll for more
                    </span>
                  </div>
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
