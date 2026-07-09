// SPDX-License-Identifier: GPL-3.0-only
//
// LessonsTour — the guided cross-tab lesson path (A-grade review item #19).
// A coachmark overlay (dimmed veil + spotlight "hole" + a positioned tooltip
// card) that drives the REAL app — each step's `act` calls the same handlers
// the buttons on screen call, so what a learner sees is exactly what would
// happen if they clicked it themselves. Behavior reference:
// `design_handoff_cacp_a_grade/cacp2/cacp-app.jsx`'s Lessons engine — NOT
// ported code (that file is a vanilla-DOM Babel prototype); this is a
// from-scratch React/TypeScript build over this app's actual state.
//
// Steps whose target lives in a state this component's caller (`KmipPlayground
// View`) owns directly (active policy, algorithm picker, workbench buttons)
// call real setters. A few steps cross into state owned by a nested
// subcomponent this tour doesn't have a prop path into (Inspector's internal
// tab, PolicyView's `detailTab`/as-of slider) — for exactly those, `act`
// falls back to a scoped `querySelector` + native click/input-event dispatch,
// the same escape hatch the reference prototype uses for the same reason.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'
import { Route, X, ChevronRight, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface LessonStep {
  title: string
  body: string
  /** CSS selector for the spotlight target. Omitted → tooltip centers on screen. */
  target?: string
  /** When set, narrows `target`'s matches to the first whose text includes this. */
  targetText?: string
  /** Runs when the step becomes active — the real action, not a simulation. */
  act?: () => void | Promise<void>
}

export interface Lesson {
  id: string
  title: string
  icon: LucideIcon
  /** Which top-level tab this lesson lives on — the tour switches to it on start. */
  plane: 'agility' | 'policy' | 'kmip3'
  blurb: string
  steps: LessonStep[]
}

/** Click the first element matching `selector` whose text includes `text` —
 * the escape hatch for state a nested subcomponent owns (see file doc). */
export function clickByText(selector: string, text: string): void {
  const el = Array.from(document.querySelectorAll<HTMLElement>(selector)).find((e) =>
    e.textContent?.includes(text)
  )
  el?.click()
}

/** Drag a range input to its max and fire the `input` event React listens
 * for — plain `.value =` assignment doesn't notify React's synthetic
 * listener, so this goes through the native property setter (same technique
 * the reference prototype uses for its Timeline "cross 2030" step). */
export function dragRangeToMax(selector: string): void {
  const el = document.querySelector<HTMLInputElement>(selector)
  if (!el) return
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  setter?.call(el, el.max)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function findTourTarget(step: LessonStep): HTMLElement | null {
  if (!step.target) return null
  if (step.targetText) {
    return (
      Array.from(document.querySelectorAll<HTMLElement>(step.target)).find((e) =>
        e.textContent?.includes(step.targetText!)
      ) ?? null
    )
  }
  return document.querySelector<HTMLElement>(step.target)
}

/** Owns the tour's running state — which lesson, which step, the current
 * spotlight rect — and the effects that place/reposition it. Kept as a hook
 * (rather than folded into `KmipPlaygroundView`) so that 870-line file gains
 * one call + two renders, not a second copy of this state machine. */
export function useLessonsTour(lessons: Lesson[], onLessonPlane: (p: Lesson['plane']) => void) {
  const [hubOpen, setHubOpen] = useState(false)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [tourStep, setTourStep] = useState(-1)
  const [tourRect, setTourRect] = useState<DOMRect | null>(null)
  const [doneLessons, setDoneLessons] = useState<Record<string, boolean>>({})

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? null
  const steps = activeLesson?.steps ?? []

  const startLesson = (id: string) => {
    const l = lessons.find((x) => x.id === id)
    if (!l) return
    setHubOpen(false)
    onLessonPlane(l.plane)
    setActiveLessonId(id)
    setTourStep(0)
  }
  const endTour = () => {
    if (activeLessonId) setDoneLessons((d) => ({ ...d, [activeLessonId]: true }))
    setActiveLessonId(null)
    setTourStep(-1)
    setTourRect(null)
  }
  const nextStep = () => {
    if (tourStep < steps.length - 1) setTourStep((s) => s + 1)
    else endTour()
  }
  const backStep = () => setTourStep((s) => Math.max(0, s - 1))

  // Place (or re-place) the spotlight whenever the step changes: run the
  // step's real action first, then find + scroll to + measure its target.
  useEffect(() => {
    if (tourStep < 0 || !activeLesson) return
    let cancelled = false
    // eslint-disable-next-line security/detect-object-injection -- `tourStep` is a numeric array index into this hook's own state, never user input.
    const step = steps[tourStep]
    const place = () => {
      if (cancelled) return
      const el = findTourTarget(step)
      if (!el) {
        setTourRect(null)
        return
      }
      // `scrollIntoView` (not `window.scrollTo`) — this page's actual
      // scrolling container is an inner `overflow-auto` div, not the
      // window, so a `window.scrollTo` call was a silent no-op that left
      // the target (and the spotlight built from its rect) off-screen.
      // `scrollIntoView` walks the real ancestor chain regardless of which
      // element happens to own the scrollbar.
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => !cancelled && setTourRect(el.getBoundingClientRect()), 320)
    }
    const run = async () => {
      if (step.act) await step.act()
      setTimeout(place, step.act ? 320 : 40)
    }
    const t = setTimeout(run, 60)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // `steps`/`activeLesson` are derived from `lessons`+`activeLessonId` every
    // render (stable per id) — only the step index actually needs to retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStep, activeLessonId])

  // Keep the spotlight aligned with its target across resize/scroll.
  useEffect(() => {
    if (tourStep < 0 || !activeLesson) return
    // eslint-disable-next-line security/detect-object-injection -- `tourStep` is a numeric array index into this hook's own state, never user input.
    const step = steps[tourStep]
    const onReposition = () => {
      const el = findTourTarget(step)
      setTourRect(el ? el.getBoundingClientRect() : null)
    }
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStep, activeLessonId])

  return {
    hubOpen,
    openHub: () => setHubOpen(true),
    closeHub: () => setHubOpen(false),
    doneLessons,
    activeLesson,
    tourStep,
    tourRect,
    startLesson,
    nextStep,
    backStep,
    endTour,
  }
}

/** The lesson picker modal — "Lessons" button in the header opens this. */
export function LessonsHub({
  lessons,
  done,
  onStart,
  onClose,
}: {
  lessons: Lesson[]
  done: Record<string, boolean>
  onStart: (id: string) => void
  onClose: () => void
}) {
  // Portaled to `document.body` — a `position: fixed` element nested inside
  // any ancestor with a transform/filter/animation (this app has several)
  // would otherwise anchor to THAT ancestor's box instead of the viewport,
  // same reason `WhatsNewModal.tsx` portals its own backdrop.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-4 shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
              <Route size={13} /> Guided lessons
            </p>
            <h3 className="mt-0.5 text-base font-bold text-foreground">
              Learn crypto-agility by doing
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Each lesson drives the real controls across tabs. Take them in order, or jump in
              anywhere.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="h-7 w-7 shrink-0 p-0"
          >
            <X size={15} />
          </Button>
        </div>
        <div className="mt-3 space-y-1.5">
          {lessons.map((l, i) => {
            const Icon = l.icon
            return (
              <Button
                key={l.id}
                variant="ghost"
                onClick={() => onStart(l.id)}
                className="h-auto w-full items-center justify-start gap-2.5 rounded-lg border border-border bg-background/40 p-2.5 text-left font-normal hover:border-primary/40"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-bold text-muted-foreground">
                  {done[l.id] ? <Check size={13} className="text-status-success" /> : i + 1}
                </span>
                <Icon size={15} className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
                    {l.title}
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide',
                        l.plane === 'policy'
                          ? 'bg-primary/10 text-primary'
                          : l.plane === 'kmip3'
                            ? 'bg-status-info/10 text-status-info'
                            : 'bg-status-warning/10 text-status-warning'
                      )}
                    >
                      {l.plane === 'policy'
                        ? 'Policy'
                        : l.plane === 'kmip3'
                          ? 'KMIP3.0'
                          : 'Workbench'}
                    </span>
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{l.blurb}</span>
                </span>
                <ChevronRight size={15} className="shrink-0 text-muted-foreground" />
              </Button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

/** The coachmark: dimmed veil (click outside → end), a spotlight "hole" drawn
 * with a box-shadow spread over the target rect, and a positioned tooltip
 * card with Back/Next/Done. `rect === null` centers the card (no live
 * target — an intro/outro step, or a target the DOM didn't have yet). */
export function TourOverlay({
  lessonTitle,
  step,
  stepIndex,
  stepCount,
  rect,
  onNext,
  onBack,
  onEnd,
}: {
  lessonTitle: string
  step: LessonStep
  stepIndex: number
  stepCount: number
  rect: DOMRect | null
  onNext: () => void
  onBack: () => void
  onEnd: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const pad = 8

  const holeStyle: React.CSSProperties | undefined = rect
    ? {
        position: 'fixed',
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: 10,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
        border: '2px solid hsl(var(--primary))',
        pointerEvents: 'none',
        zIndex: 61,
      }
    : undefined

  let cardStyle: React.CSSProperties
  if (!rect) {
    cardStyle = { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }
  } else {
    // Clamp on BOTH axes — a target near the bottom (or top) of a long
    // scrolled page must not push the card past the viewport edge, only
    // clamping `left` (as the reference prototype does) still lets a
    // near-bottom target land the card off-screen and unreachable.
    const cardWidth = 340
    const estCardHeight = 200
    const below = rect.top < window.innerHeight * 0.55
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - cardWidth - 12)
    const rawTop = below ? rect.bottom + pad + 12 : rect.top - pad - 12 - estCardHeight
    // Final hard clamp regardless of branch — `rect` can transiently sit
    // far outside the viewport (mid-scroll, or a `scrollIntoView` still in
    // flight), and an unclamped `rawTop` would place the card somewhere
    // neither branch's own math accounted for.
    const top = Math.min(Math.max(12, rawTop), window.innerHeight - estCardHeight - 12)
    cardStyle = { position: 'fixed', left, top }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0"
        style={{ background: rect ? 'transparent' : 'rgba(0,0,0,0.6)' }}
        onClick={onEnd}
        aria-hidden="true"
      />
      {holeStyle && <div style={holeStyle} />}
      <div
        ref={cardRef}
        style={{ ...cardStyle, width: 340 }}
        className="z-[62] rounded-xl border border-primary/40 bg-card p-3.5 shadow-glow"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            <Sparkles size={11} /> {lessonTitle}
          </span>
          <span className="ml-auto text-[10.5px] font-mono text-muted-foreground">
            {stepIndex + 1} / {stepCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEnd}
            aria-label="End tour"
            className="h-6 w-6 p-0 text-muted-foreground"
          >
            <X size={14} />
          </Button>
        </div>
        <h4 className="mt-2 text-sm font-bold text-foreground">{step.title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          {stepIndex > 0 ? (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-7 px-2 text-[11px]">
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={onNext} className="h-7 gap-1 px-2.5 text-[11px]">
            {stepIndex < stepCount - 1 ? (
              <>
                Next <ChevronRight size={12} />
              </>
            ) : (
              'Done'
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
