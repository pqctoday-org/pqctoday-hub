// SPDX-License-Identifier: GPL-3.0-only
//
// OpenSslLearnView — OpenSSL Studio's "Learn" tab: 11 guided lessons whose
// steps run REAL `openssl` commands against the same WASM engine the
// Workbench tab drives (via runCommand, sourced once from useOpenSSL() at
// the OpenSSLStudioView level — see WorkbenchPreview.tsx for why). Mirrors
// TpmLearnView / HsmLearnView: lesson nav rail, per-step Run with honest
// refusals as first-class outcomes, compare table + notes + quiz gated on
// completion, "try it in the Workbench" chips, and the shared glossary
// rail. The GlossaryProvider lives in OpenSSLStudioView so the Workbench's
// own command preview could (in a later pass) share the same glossary
// session; for now this view is its own consumer.
import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { logEvent } from '../../../utils/analytics'
import { tokenizeCommand } from '../../../utils/opensslDocsData'
import { GlossaryRail } from '../../Playground/learnkit/GlossaryRail'
import { QuizCard } from '../../Playground/learnkit/QuizCard'
import { Term } from '../../Playground/learnkit/Term'
import { useOpenSSLStore } from '../store'
import type { OpenSSLCategory } from '../categories'
import { OPENSSL_LESSONS } from './opensslLessons'
import { OPENSSL_QUIZZES } from './opensslQuiz'
import type { OpenSslLearnContext } from './opensslLearnContext'
import type { OpenSslLessonStep } from './opensslLessons'

type StepStatus = 'pending' | 'running' | 'ok' | 'refused-ok' | 'failed'

interface StepRunState {
  status: StepStatus
  detail?: string
}

function OpTokens({ op }: { op: string }) {
  return (
    <>
      {tokenizeCommand(op).map((tok, i) => (
        <Term key={i} glossaryKey={tok.text}>
          {tok.text}
        </Term>
      ))}
    </>
  )
}

function StepRow({
  step,
  index,
  state,
  onRun,
  disabled,
}: {
  step: OpenSslLessonStep
  index: number
  state: StepRunState
  onRun: () => void
  disabled: boolean
}) {
  return (
    <li className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-muted-foreground break-all">
            <OpTokens op={step.op} />
          </p>
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
    </li>
  )
}

export function OpenSslLearnView({
  isReady,
  runCommand,
  onTryInWorkbench,
}: {
  isReady: boolean
  runCommand: (cmd: string) => Promise<{ stdout: string }>
  onTryInWorkbench: (category: OpenSSLCategory) => void
}) {
  const [lessonIdx, setLessonIdx] = useState(0)
  const lesson = OPENSSL_LESSONS[lessonIdx]
  const [stepStates, setStepStates] = useState<StepRunState[]>(() =>
    lesson.steps.map(() => ({ status: 'pending' }))
  )

  const ctx: OpenSslLearnContext = {
    run: runCommand,
    readFile: (name) => {
      const f = useOpenSSLStore.getState().getFile(name)
      if (!f) return undefined
      return f.content instanceof Uint8Array ? f.content : new TextEncoder().encode(f.content)
    },
    writeFile: (name, content) => {
      const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
      useOpenSSLStore.getState().addFile({
        name,
        type: 'text',
        content: bytes,
        size: bytes.length,
        timestamp: Date.now(),
      })
    },
  }

  const selectLesson = (idx: number) => {
    setLessonIdx(idx)
    setStepStates(OPENSSL_LESSONS[idx].steps.map(() => ({ status: 'pending' })))
  }

  const runStep = async (i: number) => {
    setStepStates((prev) => prev.map((s, j) => (j === i ? { status: 'running' } : s)))
    try {
      const result = await lesson.steps[i].run(ctx)
      setStepStates((prev) =>
        prev.map((s, j) => (j === i ? { status: 'ok', detail: result.detail } : s))
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const expectedRefusal = lesson.steps[i].expect === 'refusal'
      logEvent(
        'Playground',
        'OpenSSL Learn Step',
        `${lesson.id}:${i}:${expectedRefusal ? 'refused-ok' : 'failed'}`
      )
      setStepStates((prev) =>
        prev.map((s, j) =>
          j === i ? { status: expectedRefusal ? 'refused-ok' : 'failed', detail: message } : s
        )
      )
    }
  }

  const runAll = async () => {
    for (let i = 0; i < lesson.steps.length; i++) {
      if (stepStates[i].status === 'ok' || stepStates[i].status === 'refused-ok') continue
      // Deliberately sequential — later steps read files earlier ones wrote.
      await runStep(i)
    }
  }

  const allDone = stepStates.every((s) => s.status === 'ok' || s.status === 'refused-ok')

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex gap-4">
          <nav className="w-52 shrink-0 space-y-1">
            {OPENSSL_LESSONS.map((l, i) => (
              <Button
                key={l.id}
                variant="ghost"
                onClick={() => selectLesson(i)}
                className={cn(
                  'flex h-auto w-full items-start justify-start gap-1.5 whitespace-normal break-words rounded-md px-2 py-1.5 text-left text-[12px] font-normal',
                  i === lessonIdx
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <span className="mt-0.5 shrink-0 font-mono text-[10px] opacity-70">L{l.n}</span>
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

            {!isReady && (
              <p className="rounded-lg border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-[12px] text-status-warning">
                Waiting for the OpenSSL WASM engine to initialize — steps enable once it&apos;s
                ready.
              </p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Steps
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={runAll}
                disabled={allDone || !isReady}
                className="h-7 text-[11px]"
              >
                Run all
              </Button>
            </div>
            <ol className="space-y-2">
              {lesson.steps.map((step, i) => (
                <StepRow
                  key={i}
                  step={step}
                  index={i}
                  state={stepStates[i]}
                  onRun={() => runStep(i)}
                  disabled={stepStates[i].status === 'running' || !isReady}
                />
              ))}
            </ol>

            {allDone && lesson.compare && (
              <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-foreground">
                  Compare
                </p>
                <table className="w-full text-[12px]">
                  <tbody>
                    {lesson.compare.map((row) => (
                      <tr key={row.label} className="border-t border-border first:border-t-0">
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
                <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                  Notes
                </p>
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
                questions={OPENSSL_QUIZZES[lesson.id]}
                namespace="openssl-learn"
                analyticsCategory="OpenSSL Learn Quiz"
              />
            )}

            {allDone && lesson.tryRef.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Try it yourself in the Workbench:
                </span>
                {lesson.tryRef.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant="outline"
                    onClick={() => onTryInWorkbench(cat as OpenSSLCategory)}
                    className="h-6 gap-1 px-2 text-[10.5px]"
                  >
                    {cat} <ChevronRight size={11} />
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
      </div>
      <GlossaryRail />
    </div>
  )
}
