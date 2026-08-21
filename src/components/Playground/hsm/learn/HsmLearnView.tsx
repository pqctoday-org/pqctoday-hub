// SPDX-License-Identifier: GPL-3.0-only
//
// HsmLearnView — the HSM playground's "Learn" tab: two tracks ("PKCS#11
// Foundations" and "v3.2 & the PQC transformation"), each a sequence of
// guided lessons whose steps run real calls against the shared HsmContext
// session — the same session the rest of the playground's tabs use. Mirrors
// the KMIP playground's Learn tab shape (glossary rail, per-lesson quiz,
// "try it in the workbench" backlink) via the shared learnkit.
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  PlayCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logEvent } from '@/utils/analytics'
import { GlossaryProvider } from '@/components/Playground/learnkit/GlossaryProvider'
import { GlossaryRail } from '@/components/Playground/learnkit/GlossaryRail'
import { QuizCard } from '@/components/Playground/learnkit/QuizCard'
import { useHsmContext } from '../HsmContext'
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import { lookupCkr } from '@/wasm/pkcs11Inspect'
import { classifyStepOutcome } from './lessonRunner'
import { FOUNDATIONS_LESSONS, type Pkcs11LessonStep, type Pkcs11StepResult } from './pkcs11Lessons'
import { V32_LESSONS } from './pkcs11LessonsV32'
import { QUIZZES } from './pkcs11Quiz'
import { PKCS11_GLOSSARY_DATA } from './pkcs11Glossary'
import type { LinearLessonBase } from '@/components/Playground/learnkit/lessonTypes'
import { MiniPkcsLog } from '@/components/Playground/components/MiniPkcsLog'
import { HsmKeyTable } from '@/components/Playground/keystore/HsmKeyTable'
import { discoverHsmObjects } from '@/components/Playground/keystore/discoverHsmObjects'

type Track = 'foundations' | 'v32'

type StepStatus = 'pending' | 'running' | 'ok' | 'refused-ok' | 'failed'

interface StepRunState {
  status: StepStatus
  detail?: string
  /** The real (non-header) PKCS#11 calls THIS step made, chronological. */
  entries?: Pkcs11LogEntry[]
}

/** The actual PKCS#11 calls a single step made — inline, right under that
 * step, instead of only in the shared log panel below the whole lesson. */
function InlineStepLog({ entries }: { entries: Pkcs11LogEntry[] }) {
  if (entries.length === 0) return null
  return (
    <div className="mt-2 space-y-1 rounded-md border border-border/60 bg-background/60 p-2">
      {entries.map((e) => {
        const ckr = !e.ok ? lookupCkr(parseInt(e.rvHex, 16) || 0) : null
        return (
          <div key={e.id} className="text-[10.5px] leading-snug">
            <div className="grid grid-cols-[7.5rem_1fr_6.5rem_3rem] items-baseline gap-x-2 font-mono">
              <span className="truncate font-semibold text-primary" title={e.fn}>
                {e.fn}
              </span>
              <span className="truncate text-muted-foreground/80" title={e.args}>
                {e.args || '—'}
              </span>
              <span className={e.ok ? 'text-status-success' : 'text-status-error'}>{e.rvName}</span>
              <span className="text-right text-muted-foreground">{e.ms}ms</span>
            </div>
            {ckr && (
              <p className="mt-0.5 pl-1 text-[10px] text-status-error">
                {ckr.description}
                {ckr.hint && <span className="text-muted-foreground"> — {ckr.hint}</span>}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StepRow({
  step,
  index,
  state,
  onRun,
  disabled,
}: {
  step: Pkcs11LessonStep
  index: number
  state: StepRunState
  onRun: () => void
  disabled: boolean
}) {
  return (
    <li className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-muted-foreground">{step.op}</p>
          <p className="text-[13px] font-medium text-foreground">
            {index + 1}. {step.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {state.status === 'pending' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRun}
              disabled={disabled}
              title={disabled ? 'Run the previous step first' : undefined}
              className="h-7 gap-1 px-2 text-[11px]"
            >
              <PlayCircle size={13} /> Run
            </Button>
          )}
          {state.status === 'running' && (
            <Loader2 size={15} className="animate-spin text-primary" />
          )}
          {state.status === 'ok' && <CheckCircle2 size={15} className="text-status-success" />}
          {state.status === 'refused-ok' && (
            <span className="rounded bg-status-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-success">
              Refused, as expected
            </span>
          )}
          {state.status === 'failed' && <XCircle size={15} className="text-destructive" />}
        </div>
      </div>
      {state.detail && (
        <p
          className={cn(
            'mt-2 border-l-2 py-1.5 pl-2.5 text-[11.5px] leading-snug',
            state.status === 'failed'
              ? 'border-destructive/60 bg-destructive/5 text-destructive'
              : 'border-primary/60 bg-muted/30 text-muted-foreground'
          )}
        >
          {state.detail}
        </p>
      )}
      {state.entries && <InlineStepLog entries={state.entries} />}
    </li>
  )
}

function LessonRunner({
  lessons,
  navPrefix,
  namespace,
  analyticsCategory,
  onTryInWorkbench,
}: {
  lessons: LinearLessonBase<Pkcs11LessonStep>[]
  /** Nav badge prefix, e.g. "A" for A1/A2/… or "B" for B1/B2/… */
  navPrefix: string
  /** Quiz localStorage key prefix — must stay stable per track. */
  namespace: string
  analyticsCategory: string
  onTryInWorkbench: (tab: string) => void
}) {
  const hsm = useHsmContext()
  const [lessonIdx, setLessonIdx] = useState(0)
  const lesson = lessons[lessonIdx]
  const [stepStates, setStepStates] = useState<StepRunState[]>(() =>
    lesson.steps.map(() => ({ status: 'pending' }))
  )
  // A ref, not state: `runAll`'s for-loop calls `runStep` many times within
  // one closure, and a `useState` value captured at that closure's creation
  // would stay frozen at its initial value for the WHOLE loop (each step
  // would see every prior step's result as null). A ref's `.current` is
  // always current, so each step genuinely sees what the previous one wrote.
  const resultsRef = useRef<(Pkcs11StepResult | null)[]>(lesson.steps.map(() => null))

  const selectLesson = (idx: number) => {
    setLessonIdx(idx)
    setStepStates(lessons[idx].steps.map(() => ({ status: 'pending' })))
    resultsRef.current = lessons[idx].steps.map(() => null)
  }

  const runStep = async (i: number) => {
    setStepStates((prev) => prev.map((s, j) => (j === i ? { status: 'running' } : s)))
    const logCountBefore = hsm.hsmLogRef.current.length
    hsm.addHsmStepLog(`${navPrefix}${lesson.n} · step ${i + 1}: ${lesson.steps[i].op}`)
    // hsmLogRef, not hsmLog: a plain state read here would be stale until
    // the next render (the closure-over-stale-state bug this file was
    // already fixed for once — see resultsRef above). Newest-first, so
    // reverse for a chronological inline display; drop the header itself —
    // it's a label, not a call the step made.
    const stepEntries = (): Pkcs11LogEntry[] =>
      hsm.hsmLogRef.current
        .slice(0, hsm.hsmLogRef.current.length - logCountBefore)
        .filter((e) => !e.isStepHeader)
        .reverse()
    try {
      const result = await lesson.steps[i].run(hsm, resultsRef.current)
      resultsRef.current = resultsRef.current.map((r, j) => (j === i ? result : r))
      const entries = stepEntries()
      setStepStates((prev) =>
        prev.map((s, j) => (j === i ? { status: 'ok', detail: result.detail, entries } : s))
      )
      // Lesson steps call hsm_generate*/hsm_derive* directly rather than
      // through addHsmKey — sync the key registry so the call log and key
      // table below stay live as the user works through a lesson.
      try {
        discoverHsmObjects(hsm)
      } catch {
        // best-effort — never fail a step over registry bookkeeping
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const entries = stepEntries()
      const outcome = classifyStepOutcome(lesson.steps[i].expect, entries)
      logEvent(
        'Playground',
        `${analyticsCategory} Step`,
        `${lesson.id}:${lesson.steps[i].op}:${outcome}`
      )
      setStepStates((prev) =>
        prev.map((s, j) => (j === i ? { status: outcome, detail: message, entries } : s))
      )
    }
  }

  const runAll = async () => {
    for (let i = 0; i < lesson.steps.length; i++) {
      if (stepStates[i].status === 'ok' || stepStates[i].status === 'refused-ok') continue
      // Steps are deliberately sequential — each may read prior results.
      await runStep(i)
    }
  }

  const allDone = stepStates.every((s) => s.status === 'ok' || s.status === 'refused-ok')

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <nav className="w-full shrink-0 space-y-1 lg:w-48">
        {lessons.map((l, i) => (
          <Button
            key={l.id}
            variant="ghost"
            onClick={() => selectLesson(i)}
            className={cn(
              'flex h-auto min-h-[44px] w-full items-start justify-start gap-1.5 whitespace-normal break-words rounded-md px-2 py-1.5 text-left text-[12px] font-normal md:min-h-0',
              i === lessonIdx
                ? 'bg-primary/15 font-semibold text-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            <span className="mt-0.5 shrink-0 font-mono text-[10px] opacity-70">
              {navPrefix}
              {l.n}
            </span>
            <span>{l.title}</span>
          </Button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {lesson.tag}
            </span>
            <h3 className="text-[15px] font-bold text-foreground">{lesson.title}</h3>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {lesson.blurb}
          </p>
          <p className="mt-2 rounded-lg border border-border bg-muted/20 p-2.5 text-[12px] leading-relaxed text-foreground">
            {lesson.setup}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Steps
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={runAll}
            disabled={allDone}
            className="h-7 text-[11px]"
          >
            Run all
          </Button>
        </div>
        <ol className="space-y-2">
          {lesson.steps.map((step, i) => {
            const prev = i > 0 ? stepStates[i - 1].status : null
            const prevDone = prev === null || prev === 'ok' || prev === 'refused-ok'
            return (
              <StepRow
                key={i}
                step={step}
                index={i}
                state={stepStates[i]}
                onRun={() => runStep(i)}
                disabled={stepStates[i].status === 'running' || !prevDone}
              />
            )
          })}
        </ol>

        {/* Same call log + key registry every workbench tab surfaces — lets a
            lesson's C_* calls and the key objects they create be inspected
            here instead of switching to the Logs/Keys tabs mid-lesson. */}
        <div className="space-y-3">
          <MiniPkcsLog showBeginnerMode lessonMode />
          <HsmKeyTable />
        </div>

        {allDone && lesson.compare && lesson.compareHeaders && (
          <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-foreground">
              Compare
            </p>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-muted-foreground">
                  {lesson.compareHeaders.map((h, i) => (
                    <th key={i} className="pb-1.5 pr-3 font-semibold">
                      {h || ' '}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lesson.compare.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="py-1.5 pr-3 font-medium text-foreground">{row.label}</td>
                    <td
                      className={cn(
                        'py-1.5 pr-3',
                        row.same ? 'text-muted-foreground' : 'text-status-warning'
                      )}
                    >
                      {row.a}
                    </td>
                    <td
                      className={cn(
                        'py-1.5 pr-3',
                        row.same ? 'text-muted-foreground' : 'text-status-warning'
                      )}
                    >
                      {row.b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {allDone && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">Notes</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12px] leading-relaxed text-muted-foreground">
              {lesson.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground">
              <span className="font-semibold">Why it matters · </span>
              {lesson.whyItMatters}
            </p>
          </div>
        )}

        {allDone && (
          <QuizCard
            key={lesson.id}
            lessonId={lesson.id}
            questions={QUIZZES[lesson.id]}
            namespace={namespace}
            analyticsCategory={`${analyticsCategory} Quiz`}
          />
        )}

        {allDone && lesson.tryRef.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">
              Try it yourself in the workbench:
            </span>
            {lesson.tryRef.map((tab) => (
              <Button
                key={tab}
                size="sm"
                variant="outline"
                onClick={() => onTryInWorkbench(tab)}
                className="h-6 gap-1 px-2 text-[10.5px]"
              >
                {tab} <ChevronRight size={11} />
              </Button>
            ))}
          </div>
        )}

        {allDone && lesson.crossPlaygroundLink && (
          <Link
            to={lesson.crossPlaygroundLink.to}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            {lesson.crossPlaygroundLink.label} <ExternalLink size={11} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  )
}

export function HsmLearnView({ onTryInWorkbench }: { onTryInWorkbench: (tab: string) => void }) {
  const [track, setTrack] = useState<Track>('foundations')

  return (
    <GlossaryProvider data={PKCS11_GLOSSARY_DATA}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-1 border-b border-border">
            {(
              [
                { id: 'foundations', label: 'PKCS#11 Foundations' },
                { id: 'v32', label: 'v3.2 & the PQC transformation' },
              ] as const
            ).map((t) => (
              <Button
                key={t.id}
                variant="ghost"
                role="tab"
                aria-selected={track === t.id}
                onClick={() => setTrack(t.id)}
                className={cn(
                  '-mb-px h-auto rounded-none border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors hover:bg-transparent',
                  track === t.id
                    ? 'border-primary font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {track === 'foundations' && (
            <LessonRunner
              lessons={FOUNDATIONS_LESSONS}
              navPrefix="A"
              namespace="hsm-pkcs11"
              analyticsCategory="PKCS11 Foundations"
              onTryInWorkbench={onTryInWorkbench}
            />
          )}
          {track === 'v32' && (
            <LessonRunner
              lessons={V32_LESSONS}
              navPrefix="B"
              namespace="hsm-pkcs11-v32"
              analyticsCategory="PKCS11 v3.2"
              onTryInWorkbench={onTryInWorkbench}
            />
          )}
        </div>
        <GlossaryRail />
      </div>
    </GlossaryProvider>
  )
}
