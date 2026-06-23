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
import { getScenario, type SimScenario } from './scenarioConfig'
import { seedDemoOrg } from './seedDemoOrg'
import { setAutoRunFill } from './autoRunFill'

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
  /** When set, the run is paused on a maturity-pass intro modal. */
  passIntro: PassIntro | null
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  cycleSpeed: () => void
  toggleVoice: () => void
  /** Dismiss the pass-intro modal and start that pass's steps. */
  beginPass: () => void
  /** Jump the playhead to the start of the previous maturity pass (re-shows its intro). */
  prevPass: () => void
  /** Jump the playhead to the start of the next maturity pass (shows its intro). */
  nextPass: () => void
}

// ── Program clock — paced by the SCENARIO's maturity passes (not linear). ──────
// The four maturity passes (L1→L4) land on scenario years: governance(~2027) ·
// L2 "proceed" bar(~2029) · critical assets protected(scenario, e.g. 2031) ·
// program horizon(2035). The general-asset tracks genuinely carry the clock to 2035.
function passEndYears(scenario: SimScenario): number[] {
  const gov = scenario.governanceYear
  const critical =
    scenario.objectives.find((o) => o.id === 'critical')?.byYear ?? scenario.programEndYear
  const proceed = Math.round((gov + critical) / 2)
  return [gov, proceed, critical, scenario.programEndYear] // pass 1..4 end years
}

function yearToQuarter(frac: number): { year: number; q: number } {
  const year = Math.floor(frac)
  const q = Math.min(4, Math.max(1, Math.floor((frac - year) * 4) + 1))
  return { year, q }
}

/** A per-queue-index {year,q} plan: within each maturity pass, interpolate from the
 *  previous pass-end year to this pass-end year by progress through the pass. */
export function buildClockPlan(
  queue: AutoRunQueueItem[],
  scenario: SimScenario
): { year: number; q: number }[] {
  const ends = passEndYears(scenario)
  const startYear = scenario.programStartYear
  const first = new Map<number, number>()
  const last = new Map<number, number>()
  queue.forEach((it, i) => {
    if (!first.has(it.level)) first.set(it.level, i)
    last.set(it.level, i)
  })
  return queue.map((it, i) => {
    const lvl = it.level
    const ps = first.get(lvl) ?? 0
    const pe = last.get(lvl) ?? ps
    const span = Math.max(1, pe - ps)
    const frac = (i - ps) / span
    const prevEnd = lvl <= 1 ? startYear : (ends[lvl - 2] ?? startYear)
    const thisEnd = ends[lvl - 1] ?? scenario.programEndYear
    return yearToQuarter(prevEnd + frac * (thisEnd - prevEnd))
  })
}

// Maturity-pass (climb) metadata for the intro modal + voice-over.
const PASS_META: Record<number, { name: string; goal: string }> = {
  1: {
    name: 'Establish',
    goal: 'Stand up governance and a baseline cryptographic inventory across the whole program.',
  },
  2: {
    name: 'Protect',
    goal: 'Raise every phase to maturity level 2 — the framework’s "done well enough to proceed" bar. Governance is in place and pilots are running.',
  },
  3: {
    name: 'Scale',
    goal: 'Drive the migration: critical / high-value assets onto post-quantum cryptography, harvest-now (HNDL) first, then forge-later (TNFL).',
  },
  4: {
    name: 'Optimise',
    goal: 'Complete the migration across the general estate and make crypto-agility business-as-usual.',
  },
}

export interface PassIntro {
  level: number
  name: string
  summary: string
}

function passIntroFor(level: number, scenario: SimScenario): PassIntro {
  const meta = PASS_META[level] ?? { name: `Pass ${level}`, goal: '' }
  const crit = scenario.objectives.find((o) => o.id === 'critical')?.byYear
  const anchor =
    level === 2
      ? ` Governance in place by ${scenario.governanceYear}.`
      : level === 3 && crit
        ? ` Critical assets protected by ${crit} (${scenario.standards.HNDL}, then ${scenario.standards.TNFL}).`
        : level === 4
          ? ` Full migration complete by ${scenario.programEndYear}.`
          : ''
  return { level, name: `Pass ${level} — ${meta.name}`, summary: meta.goal + anchor }
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
  const [passIntro, setPassIntro] = useState<PassIntro | null>(null)

  const queueRef = useRef<AutoRunQueueItem[]>([])
  const passStartsRef = useRef<{ level: number; start: number }[]>([])
  const lastLevelRef = useRef<number | null>(null) // the pass whose intro was consumed
  const lastSelPhaseRef = useRef<PhaseId | null>(null) // the phase the board is focused on
  const clockPlanRef = useRef<{ year: number; q: number }[]>([])
  const scenarioRef = useRef<SimScenario | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceOnRef = useRef(voiceOn)
  const openStepRef = useRef(openStep)
  const closeEmbedRef = useRef(closeEmbed)
  const indexRef = useRef(index)
  const passIntroRef = useRef<number | null>(null)
  const spokenIntroForRef = useRef<number | null>(null)
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
    passIntroRef.current = passIntro?.level ?? null
  }, [passIntro])

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
    setAutoRunFill(true) // tools opened during the run fill their forms with demo content
    useSimulationStore.getState().markTourSeen() // the first-run tour must not block the playthrough
    const q = autoRunQueue()
    queueRef.current = q
    const scenario = getScenario(useSimulationStore.getState().country)
    scenarioRef.current = scenario
    clockPlanRef.current = buildClockPlan(q, scenario)
    const starts: { level: number; start: number }[] = []
    q.forEach((it, i) => {
      const last = starts.at(-1)
      if (!last || last.level !== it.level) starts.push({ level: it.level, start: i })
    })
    passStartsRef.current = starts
    lastLevelRef.current = null
    lastSelPhaseRef.current = null
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
    setAutoRunFill(false)
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
  const advancePass = useCallback((stopVoice: boolean) => {
    const lvl = passIntroRef.current
    if (lvl == null) return
    lastLevelRef.current = lvl // mark this pass's intro consumed so steps don't re-trigger it
    if (stopVoice) stopSpeech()
    setPassIntro(null)
  }, [])
  // Manual "Begin" click cuts the narration short; the 6s auto-advance lets it keep
  // reading the pass description.
  const beginPass = useCallback(() => advancePass(true), [advancePass])

  // Jump the playhead to an index and re-show the pass intro wherever we land.
  const jumpToIndex = useCallback(
    (target: number) => {
      clearTimer()
      stopSpeech()
      closeEmbedRef.current()
      lastLevelRef.current = null // force the pass-intro modal wherever we land
      lastSelPhaseRef.current = null
      setPassIntro(null)
      setPaused(false)
      setIndex(target)
    },
    [clearTimer]
  )

  const currentBlock = useCallback(() => {
    let cur = 0
    passStartsRef.current.forEach((s, i) => {
      if (s.start <= indexRef.current) cur = i
    })
    return cur
  }, [])

  const nextPass = useCallback(() => {
    const nxt = passStartsRef.current.at(currentBlock() + 1)
    if (nxt) jumpToIndex(nxt.start)
  }, [currentBlock, jumpToIndex])

  const prevPass = useCallback(() => {
    const cur = currentBlock()
    const curStart = passStartsRef.current.at(cur)?.start ?? 0
    const target =
      indexRef.current > curStart ? curStart : (passStartsRef.current.at(cur - 1)?.start ?? 0)
    jumpToIndex(target)
  }, [currentBlock, jumpToIndex])

  // Pass-intro modal: speak the maturity-pass summary and auto-advance after 6s
  // (the modal's "Begin" button advances sooner; the voice keeps reading into the pass).
  useEffect(() => {
    if (!passIntro || paused || !running) return
    if (voiceOnRef.current && spokenIntroForRef.current !== passIntro.level) {
      spokenIntroForRef.current = passIntro.level
      speakSequence(splitSentences(passIntro.summary))
    }
    const t = setTimeout(() => advancePass(false), 6000)
    return () => clearTimeout(t)
  }, [passIntro, paused, running, advancePass])

  // The step cycle: peek the tool → complete + return to the board (sections update,
  // clock advances) → dwell on the board → next.
  useEffect(() => {
    if (!running || paused || done || passIntro) return
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
      if (item.level !== lastLevelRef.current) {
        // New maturity pass — pause for the pass-intro modal (the board stays behind it).
        const sc = scenarioRef.current
        if (sc) {
          setPassIntro(passIntroFor(item.level, sc))
          return
        }
        lastLevelRef.current = item.level
      }
      // Within a pass: keep the board focused on the phase currently being raised.
      if (item.phase !== lastSelPhaseRef.current) {
        lastSelPhaseRef.current = item.phase
        useSimulationStore.getState().setSel(item.phase)
        setLabel(phaseLabel(item.phase))
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
        // Scenario-paced clock: this index's planned {year, q} (passes land on the EO years).
        const plan = clockPlanRef.current[index]
        if (plan) {
          const cs = useSimulationStore.getState()
          if (plan.year !== cs.year || plan.q !== cs.q) {
            cs.applyQuarter({
              checks: cs.checks,
              crqcShift: cs.crqcShift,
              year: plan.year,
              q: plan.q,
              newEvents: [],
            })
          }
        }
        after(80, scrollBoardToTop) // board re-rendered — show it from the top
        const next = index + 1
        // Beat C — linger on the output before the next step.
        after(lookMs(speed), () => {
          if (next >= q.length) {
            setCaption('Migration complete — full program maturity reached.')
            setAutoRunFill(false)
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
  }, [running, paused, done, index, speed, passIntro])

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
    passIntro,
    start,
    pause,
    resume,
    stop,
    cycleSpeed,
    toggleVoice,
    beginPass,
    prevPass,
    nextPass,
  }
}
