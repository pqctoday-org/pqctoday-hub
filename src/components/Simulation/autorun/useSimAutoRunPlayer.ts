// SPDX-License-Identifier: GPL-3.0-only
/**
 * useSimAutoRunPlayer — the LIVE guided playthrough.
 *
 * The phase BOARD is the primary view: per gating step the tool opens inline for a
 * brief peek (like a manual click), then it completes the step and RETURNS to the
 * board so every section (Phase Journey, maturity checks, Critical Assets, KPIs,
 * stats) updates in view. The program clock advances Q1 2026 → Q1 2035 across the
 * run. Before each phase a framework-anchored intro modal explains what to expect.
 * Controls: play / pause / resume / stop / speed / voice / previous + next phase.
 * Scenario (sandbox-lab) steps are excluded by the queue (non-gating).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSimulationStore } from '@/store/useSimulationStore'
import type { PhaseId } from '@/data/frameworkPhases'
import type { TreeStep } from '@/simulation'
import { autoRunQueue, completeStepGenuine, type AutoRunQueueItem } from './simAutoRun'
import { FRAMEWORK_PHASE_INTROS } from '@/data/frameworkPhaseIntros.generated'
import { seedDemoOrg } from './seedDemoOrg'

export type AutoRunSpeed = 'slow' | 'normal' | 'fast'

export interface SimAutoRunPlayer {
  running: boolean
  paused: boolean
  done: boolean
  caption: string
  phaseLabel: string
  index: number
  total: number
  speed: AutoRunSpeed
  voiceOn: boolean
  /** Name of the speech voice in use (so the UI can show which one). */
  voiceName: string
  /** When set, the run is paused on a phase-intro modal for this phase. */
  phaseIntro: PhaseId | null
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  cycleSpeed: () => void
  toggleVoice: () => void
  /** Dismiss the phase-intro modal and start that phase's steps. */
  beginPhase: () => void
  /** Jump the playhead to the start of the previous phase (re-shows its intro). */
  prevPhase: () => void
  /** Jump the playhead to the start of the next phase (shows its intro). */
  nextPhase: () => void
}

// ── Program clock — the run spans the framework's multi-year program. ──────────
const SIM_START_YEAR = 2026
const SIM_START_Q = 1 // Q1 2026
const SIM_TOTAL_QUARTERS = 36 // Q1 2026 → Q1 2035 (9 years)

/** Advance the sim's turn clock proportionally to run progress (index/total),
 *  landing on Q1 2026 at the first step and Q1 2035 at the last. Keeps maturity
 *  checks / CRQC shift untouched (clock-only). */
function advanceClock(index: number, total: number): void {
  const st = useSimulationStore.getState()
  const denom = Math.max(1, total - 1)
  const elapsed = Math.round((Math.min(index, denom) / denom) * SIM_TOTAL_QUARTERS)
  const abs = SIM_START_YEAR * 4 + (SIM_START_Q - 1) + elapsed
  const year = Math.floor(abs / 4)
  const q = (abs % 4) + 1
  if (year !== st.year || q !== st.q) {
    st.applyQuarter({ checks: st.checks, crqcShift: st.crqcShift, year, q, newEvents: [] })
  }
}

// ── Voice selection (avoid robotic novelty voices; prefer natural ones). ───────
let cachedVoice: SpeechSynthesisVoice | null = null
let voiceResolved = false

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const english = voices.filter((v) => /^en(-|_|$)/i.test(v.lang) || /english/i.test(v.name))
  const pool = english.length ? english : voices
  // Neural / "AI" voices first: macOS (Premium)/(Enhanced) downloads, Edge "Online
  // (Natural)", then Chrome's network-neural "Google US English"; plain local
  // voices only as a fallback.
  const prefer = [
    /\((?:Premium|Enhanced)\)/i,
    /Online \(Natural\)/i,
    /Neural/i,
    /Google US English/i,
    /Google UK English (?:Female|Male)/i,
    /Microsoft (?:Aria|Jenny|Ava|Michelle|Libby|Sonia|Emma|Guy)/i,
    /Samantha/i,
    /Ava/i,
    /Allison/i,
    /Serena/i,
  ]
  for (const re of prefer) {
    const match = pool.find((v) => re.test(v.name))
    if (match) return match
  }
  const robotic =
    /Albert|Zarvox|Fred|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|eSpeak|Trinoids|Whisper|Wobble|Organ|Jester|Superstar|Good News|Pipe|Hysterical/i
  return pool.find((v) => !robotic.test(v.name)) ?? pool[0]
}

function resolveVoice(): SpeechSynthesisVoice | null {
  if (voiceResolved) return cachedVoice
  cachedVoice = pickVoice()
  if (cachedVoice) voiceResolved = true
  return cachedVoice
}

// Hard cap on spoken length. Chrome loops/freezes on long utterances and can keep
// the OS speech daemon running after the tab closes — so we NEVER speak long text.
const MAX_SPEAK_CHARS = 200

// Phonetic fixes so the voice pronounces domain abbreviations correctly. Applied to
// SPOKEN text only — the on-screen text is unchanged. Word-boundary replacements.
const PRONUNCIATION: Array<[RegExp, string]> = [
  [/\bCBOM\b/g, 'see-bom'],
  [/\bHNDL\b/g, 'harvest-now decrypt-later'],
  [/\bTNFL\b/g, 'trust-now forge-later'],
  [/\bCRQC\b/g, 'C R Q C'],
  [/\bPQC\b/g, 'P Q C'],
  [/\bQRPM\b/g, 'Q R P M'],
  [/\bRACI\b/g, 'racey'],
  [/\bSteerCo\b/g, 'steer-co'],
  [/\bHSMs\b/g, 'H S Ms'],
  [/\bHSM\b/g, 'H S M'],
  [/\bKMS\b/g, 'K M S'],
  [/\bPKI\b/g, 'P K I'],
  [/\bCISO\b/g, 'sea-so'],
  [/\bROI\b/g, 'R O I'],
  [/\bKPIs\b/g, 'K P Is'],
  [/\bKPI\b/g, 'K P I'],
  [/\bGRC\b/g, 'G R C'],
  [/\bSOC\b/g, 'sock'],
  [/\bNIST\b/g, 'nihst'],
  [/\bCNSA\b/g, 'C N S A'],
  [/\bGDPR\b/g, 'G D P R'],
  [/\bNIS2\b/g, 'N I S two'],
  [/\bPCI DSS\b/g, 'P C I, D S S'],
  [/\bTLS\b/g, 'T L S'],
  [/\bVPN\b/g, 'V P N'],
]

function pronounce(text: string): string {
  let out = text
  for (const [re, sub] of PRONUNCIATION) out = out.replace(re, sub)
  return out
}

// Speech sequencing — a monotonic token invalidates any in-flight sequence, so
// pause/stop/navigate cleanly halt it and nothing keeps speaking.
let seqToken = 0

function stopSpeech(): void {
  seqToken++
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Generous estimate of the time to speak a passage. */
function estSpeechMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(3000, Math.round((words / 1.9) * 1000))
}

/** Read a passage SENTENCE BY SENTENCE so each utterance stays short (avoids the
 *  Chrome long-utterance loop) while reading the full text. Phonetics applied per
 *  sentence; cleanly cancelled by stopSpeech() (token bump). */
function speakSequence(chunks: string[]): void {
  if (typeof window === 'undefined' || !window.speechSynthesis || chunks.length === 0) return
  const synth = window.speechSynthesis
  synth.cancel()
  const myToken = ++seqToken
  let i = 0
  const speakNext = () => {
    if (myToken !== seqToken) return // superseded / cancelled
    const raw = chunks.at(i)
    if (raw === undefined) return
    i++
    const spoken = pronounce(raw)
    const clipped =
      spoken.length > MAX_SPEAK_CHARS ? `${spoken.slice(0, MAX_SPEAK_CHARS)}…` : spoken
    const utterance = new SpeechSynthesisUtterance(clipped)
    const voice = resolveVoice()
    if (voice) utterance.voice = voice
    utterance.rate = 1.0
    utterance.pitch = 1.0
    let fired = false
    const next = () => {
      if (fired || myToken !== seqToken) return
      fired = true
      speakNext()
    }
    utterance.onend = next
    utterance.onerror = next
    synth.speak(utterance)
    // Fallback so a dropped onend never stalls the sequence.
    setTimeout(next, clipped.length * 95 + 2500)
  }
  speakNext()
}

/** Time to LOOK at the step's output on the board after it completes. */
function lookMs(speed: AutoRunSpeed): number {
  return speed === 'slow' ? 4500 : speed === 'fast' ? 1800 : 3200
}

/** The voice-over line for a phase — the framework's first "what to expect"
 *  sentence (distinct from the step titles shown in the overlay). */
function phaseSummary(phase: PhaseId): string {
  // eslint-disable-next-line security/detect-object-injection
  const intro = FRAMEWORK_PHASE_INTROS[phase]
  return intro?.summary || intro?.name || phaseLabel(phase)
}

function phaseLabel(phase: PhaseId): string {
  if (phase === 'foundations') return 'Foundations'
  if (phase === 'verify-close') return 'Verify & Close'
  return `Phase ${phase.slice(1)}`
}

function narrationFor(item: AutoRunQueueItem): string {
  // Just the step's own label — no phase prefix (it's in the badge) and no verb.
  return item.step.label
}

function scrollDurationMs(overflowPx: number, speed: AutoRunSpeed): number {
  // Constant SPEED (px per ms): longer content takes proportionally longer to scroll
  // (it does NOT scroll faster). The cap is only a generous safety bound.
  const pxPerMs = speed === 'slow' ? 0.08 : speed === 'fast' ? 0.26 : 0.13
  return Math.max(2000, Math.min(45000, overflowPx / pxPerMs))
}

/** Reset the board's scroll to the top so the Phase Journey + steps are visible
 *  again when we return from an embed. */
function scrollBoardToTop(): void {
  if (typeof document === 'undefined') return
  const board = document.querySelector<HTMLElement>('[data-sim-board]')
  if (!board) return
  board.scrollTop = 0
  board.querySelectorAll<HTMLElement>('[class*="overflow"]').forEach((el) => {
    el.scrollTop = 0
  })
}

/** Slowly auto-scroll the open embed through its FULL content, then call onDone —
 *  so a step never advances until the scroll has finished. Works for ANY embedded
 *  resource (Learn, reference, activity tools, workshops, catalog, scenarios) —
 *  they all mount in the one `[data-sim-embed-pane]`. Graceful: if nothing is
 *  scrollable it just dwells briefly; it bails WITHOUT advancing if the run is
 *  cancelled or the embed closes. */
function slowScrollEmbed(opts: {
  speed: AutoRunSpeed
  isCancelled: () => boolean
  onDone: () => void
}): void {
  const { speed, isCancelled, onDone } = opts
  const noScrollDwell = speed === 'slow' ? 4500 : speed === 'fast' ? 1800 : 3000
  const finish = () => {
    if (!isCancelled()) onDone()
  }
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    finish()
    return
  }
  const pane = document.querySelector<HTMLElement>('[data-sim-embed-pane]')
  if (!pane) {
    window.setTimeout(finish, noScrollDwell)
    return
  }
  // The real scroller may be the pane or a descendant — pick the most-scrollable.
  let scroller: HTMLElement = pane
  let maxOverflow = pane.scrollHeight - pane.clientHeight
  pane.querySelectorAll<HTMLElement>('div, section, main, article').forEach((el) => {
    const overflow = el.scrollHeight - el.clientHeight
    if (overflow > maxOverflow && /auto|scroll/.test(getComputedStyle(el).overflowY)) {
      maxOverflow = overflow
      scroller = el
    }
  })
  if (maxOverflow < 60) {
    window.setTimeout(finish, noScrollDwell) // nothing to scroll — just dwell
    return
  }
  const from = scroller.scrollTop
  const distance = maxOverflow - from
  const duration = scrollDurationMs(distance, speed)
  const startedAt = window.performance.now()
  const tick = (now: number) => {
    if (isCancelled() || !document.body.contains(scroller)) return // bail, no advance
    const t = Math.min(1, (now - startedAt) / duration)
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2 // ease-in-out
    scroller.scrollTop = from + distance * eased
    if (t < 1) window.requestAnimationFrame(tick)
    else finish() // reached the bottom → now advance
  }
  window.requestAnimationFrame(tick)
}

export function useSimAutoRunPlayer({
  openStep,
  closeEmbed,
}: {
  openStep: (step: TreeStep) => void
  closeEmbed: () => void
}): SimAutoRunPlayer {
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const [index, setIndex] = useState(0)
  const [total, setTotal] = useState(0)
  const [caption, setCaption] = useState('')
  const [label, setLabel] = useState('')
  const [speed, setSpeed] = useState<AutoRunSpeed>('normal')
  const [voiceOn, setVoiceOn] = useState(true) // on by default; safe (short, cancellable)
  const [voiceName, setVoiceName] = useState('')
  const [phaseIntro, setPhaseIntro] = useState<PhaseId | null>(null)

  const queueRef = useRef<AutoRunQueueItem[]>([])
  const phaseStartsRef = useRef<{ phase: PhaseId; start: number }[]>([])
  const lastPhaseRef = useRef<PhaseId | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceOnRef = useRef(voiceOn)
  const openStepRef = useRef(openStep)
  const closeEmbedRef = useRef(closeEmbed)
  const indexRef = useRef(index)
  const phaseIntroRef = useRef<PhaseId | null>(null)
  const spokenIntroForRef = useRef<PhaseId | null>(null)
  useEffect(() => {
    voiceOnRef.current = voiceOn
  }, [voiceOn])
  useEffect(() => {
    openStepRef.current = openStep
  }, [openStep])
  useEffect(() => {
    closeEmbedRef.current = closeEmbed
  }, [closeEmbed])
  useEffect(() => {
    indexRef.current = index
  }, [index])
  useEffect(() => {
    phaseIntroRef.current = phaseIntro
  }, [phaseIntro])

  // Warm the voice list (loads async) + HARD speech safety: cancel any speech if
  // the tab is hidden, navigated, or closed so it can never keep speaking after the
  // page goes away.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const warm = () => {
      const v = resolveVoice()
      setVoiceName(v?.name ?? '')
    }
    warm()
    const onHide = () => {
      if (document.hidden) stopSpeech()
    }
    window.speechSynthesis.addEventListener?.('voiceschanged', warm)
    window.addEventListener('pagehide', stopSpeech)
    window.addEventListener('beforeunload', stopSpeech)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', warm)
      window.removeEventListener('pagehide', stopSpeech)
      window.removeEventListener('beforeunload', stopSpeech)
      document.removeEventListener('visibilitychange', onHide)
      stopSpeech()
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearTimer()
    seedDemoOrg() // populate the scenario context so embeds have data + a scope to filter by
    const q = autoRunQueue()
    queueRef.current = q
    const starts: { phase: PhaseId; start: number }[] = []
    q.forEach((it, i) => {
      const last = starts.at(-1)
      if (!last || last.phase !== it.phase) starts.push({ phase: it.phase, start: i })
    })
    phaseStartsRef.current = starts
    lastPhaseRef.current = null
    setTotal(q.length)
    setIndex(0)
    setDone(false)
    setPaused(false)
    setLabel('')
    setCaption('Starting the migration playthrough…')
    setRunning(true)
  }, [clearTimer])

  const pause = useCallback(() => {
    stopSpeech()
    setPaused(true)
  }, [])
  const resume = useCallback(() => setPaused(false), [])
  const stop = useCallback(() => {
    clearTimer()
    stopSpeech()
    setRunning(false)
    setPaused(false)
  }, [clearTimer])
  const cycleSpeed = useCallback(
    () => setSpeed((s) => (s === 'normal' ? 'fast' : s === 'fast' ? 'slow' : 'normal')),
    []
  )
  const toggleVoice = useCallback(() => {
    setVoiceOn((v) => {
      if (v) stopSpeech()
      return !v
    })
  }, [])
  const beginPhase = useCallback(() => {
    const p = phaseIntroRef.current
    if (!p) return
    lastPhaseRef.current = p // mark this phase's intro consumed so steps don't re-trigger it
    useSimulationStore.getState().setSel(p)
    setLabel(phaseLabel(p))
    stopSpeech()
    setPhaseIntro(null)
  }, [])

  // Jump the playhead to an index and re-show that phase's intro modal.
  const jumpToIndex = useCallback(
    (target: number) => {
      clearTimer()
      stopSpeech()
      closeEmbedRef.current()
      lastPhaseRef.current = null // force the phase-intro modal wherever we land
      setPhaseIntro(null)
      setPaused(false)
      setIndex(target)
    },
    [clearTimer]
  )

  const currentBlock = useCallback(() => {
    let cur = 0
    phaseStartsRef.current.forEach((s, i) => {
      if (s.start <= indexRef.current) cur = i
    })
    return cur
  }, [])

  const nextPhase = useCallback(() => {
    const nxt = phaseStartsRef.current.at(currentBlock() + 1)
    if (nxt) jumpToIndex(nxt.start)
  }, [currentBlock, jumpToIndex])

  const prevPhase = useCallback(() => {
    const cur = currentBlock()
    const curStart = phaseStartsRef.current.at(cur)?.start ?? 0
    const target =
      indexRef.current > curStart ? curStart : (phaseStartsRef.current.at(cur - 1)?.start ?? 0)
    jumpToIndex(target)
  }, [currentBlock, jumpToIndex])

  // Phase-intro modal: speak the framework summary and auto-advance after a dwell
  // (the modal's "Begin" button advances sooner).
  useEffect(() => {
    if (!phaseIntro || paused || !running) return
    // Speak ONLY the short phase name, once. Never the long summary — long
    // utterances loop in Chrome. The modal shows the full text to read on screen.
    const summary = phaseSummary(phaseIntro)
    if (voiceOnRef.current && spokenIntroForRef.current !== phaseIntro) {
      spokenIntroForRef.current = phaseIntro
      speakSequence(splitSentences(summary)) // reads the FULL phase description aloud
    }
    // Stay on the modal long enough for the voice to cover the whole description
    // (or a comfortable read time when muted). The "Begin" button skips ahead.
    const dwell = voiceOnRef.current
      ? estSpeechMs(summary) + 2500
      : Math.min(16000, estSpeechMs(summary))
    const t = setTimeout(() => beginPhase(), dwell)
    return () => clearTimeout(t)
  }, [phaseIntro, paused, running, beginPhase])

  // The step cycle: peek the tool → complete + return to the board (sections update,
  // clock advances) → dwell on the board → next.
  useEffect(() => {
    if (!running || paused || done || phaseIntro) return
    const q = queueRef.current
    const item = q.at(index)
    if (!item) return

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const after = (ms: number, fn: () => void) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn()
        }, ms)
      )
    }

    after(index === 0 ? 500 : 300, () => {
      if (item.phase !== lastPhaseRef.current) {
        // New phase — pause for the intro modal first (board switches behind it).
        useSimulationStore.getState().setSel(item.phase)
        setLabel(phaseLabel(item.phase))
        setPhaseIntro(item.phase)
        return
      }
      // Beat A — open the tool inline (like a manual click) + narrate; wait for the
      // narration to ACTUALLY finish before moving on.
      const text = narrationFor(item)
      openStepRef.current(item.step)
      setCaption(text) // overlay shows the self-explanatory title; the voice never reads it
      const toOutput = () => {
        if (cancelled) return
        // Beat B — complete + return to the board so the OUTPUT shows (sections
        // update, clock advances).
        completeStepGenuine(item.step)
        closeEmbedRef.current()
        advanceClock(index, q.length)
        after(80, scrollBoardToTop) // board re-rendered — show it from the top
        const next = index + 1
        // Beat C — linger on the output before the next step.
        after(lookMs(speed), () => {
          if (next >= q.length) {
            setCaption('Migration complete — every phase cleared.')
            setRunning(false)
            setDone(true)
          } else {
            setIndex(next)
          }
        })
      }
      // Beat A — let the embed mount, then slowly scroll its FULL content; advance
      // ONLY when the scroll finishes (or, for an empty/non-scrollable page, after a
      // brief dwell).
      after(500, () => {
        slowScrollEmbed({ speed, isCancelled: () => cancelled, onDone: toOutput })
      })
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [running, paused, done, index, speed, phaseIntro])

  // Stop the timer + any speech if the sim unmounts mid-run.
  useEffect(
    () => () => {
      clearTimer()
      stopSpeech()
    },
    [clearTimer]
  )

  return {
    running,
    paused,
    done,
    caption,
    phaseLabel: label,
    index,
    total,
    speed,
    voiceOn,
    voiceName,
    phaseIntro,
    start,
    pause,
    resume,
    stop,
    cycleSpeed,
    toggleVoice,
    beginPhase,
    prevPhase,
    nextPhase,
  }
}
