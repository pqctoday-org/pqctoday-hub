// SPDX-License-Identifier: GPL-3.0-only
//
// Integration test for the Learn walkthroughs' step specs — replays every
// lesson side's step sequence against the REAL wasm engine exactly the way
// LearnView's `runSide` does (friendly `runOp` steps + raw-TTLV steps with
// harvest/expect semantics), asserting each step achieves its declared
// outcome. Guards the lesson content against engine drift: if a future
// engine changes a behavior a lesson demonstrates, this fails before a
// learner sees a broken walkthrough.
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the
// local gate (project directive 2026-07-01: new suites are local-only).
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo dir */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import { KmipEngine, type OpResult } from '@/wasm/kmip/kmipEngine'
import { CodepointTable } from '@/wasm/kmip/ttlv/codepointTable'
import { runOp as runRawOp } from '@/wasm/kmip/ttlv/runner'
import { find } from '@/wasm/kmip/ttlv/nodes'
import { LESSONS, type LessonSide, type LessonStep } from './learnLessons'

const SPEC_JSON = JSON.parse(
  readFileSync(join(__dirname, '../../../../../public/kmip-corpus/tags-enums.json'), 'utf8')
) as Parameters<typeof CodepointTable.fromSpec>[0]

describe('Learn walkthrough step specs (real wasm engine)', () => {
  let engine: KmipEngine
  let table: CodepointTable

  beforeAll(async () => {
    engine = await KmipEngine.boot()
    table = CodepointTable.fromSpec(SPEC_JSON)
  })

  /** Mirror of LearnView's `runStep` + outcome evaluation. */
  const runStep = (step: LessonStep, results: (OpResult | null)[]): OpResult => {
    step.preRun?.(engine)
    if (step.buildRaw) {
      const raw = step.buildRaw(results)
      const rr = runRawOp(engine, table, raw.op, raw.payload, raw.headerExtras)
      const pending = find(rr.namedResponseTree, 'ResultStatus')?.value === '0x00000002'
      return {
        ok: rr.ok,
        operation: raw.op,
        status: rr.ok ? 'Success' : pending ? 'OperationPending' : 'OperationFailed',
        resultReason: null,
        message: rr.resultMessage ?? null,
        summary: raw.harvest?.(rr.namedResponseTree) ?? {},
        responseWireHex: rr.responseWireHex,
        responseWireLen: rr.responseWireHex.length / 2,
        responseTree: rr.responseTree,
        audit: [],
      }
    }
    const spec = step.buildSpec!(results)
    const result = engine.runOp(spec)
    return spec.ivHex ? { ...result, summary: { ...result.summary, ivHex: spec.ivHex } } : result
  }

  const runSide = (lessonId: string, sideName: string, side: LessonSide) => {
    const results: (OpResult | null)[] = []
    for (let i = 0; i < side.steps.length; i++) {
      const step = side.steps[i]
      const stored = runStep(step, results)
      results.push(stored)
      const want = step.expect ?? 'success'
      const achieved =
        want === 'success'
          ? stored.ok
          : want === 'pending'
            ? stored.status === 'OperationPending'
            : !stored.ok && stored.status !== 'Error'
      expect(
        achieved,
        `${lessonId}/${sideName} step ${i} (${step.label}) wanted ${want}, got ` +
          `${stored.status}${stored.message ? ` — ${stored.message}` : ''}`
      ).toBe(true)
    }
  }

  for (const lesson of LESSONS) {
    // Generous timeout: lesson 2's classical side generates an RSA-3072 key
    // in wasm — multi-second on its own, slower still under parallel suite
    // load. The budget is for real crypto, not slack.
    it(
      `lesson ${lesson.n} "${lesson.title}" — every step achieves its declared outcome`,
      { timeout: 60_000 },
      () => {
        runSide(lesson.id, 'classical', lesson.classical)
        if (!lesson.modernize.skipReplay) runSide(lesson.id, 'modernize', lesson.modernize)
      }
    )
  }

  it('every lesson has a quiz bank, every quiz maps to a lesson, every answer is in range', async () => {
    const { QUIZZES } = await import('./quiz')
    const lessonIds = new Set(LESSONS.map((l) => l.id))
    for (const [id, questions] of Object.entries(QUIZZES)) {
      expect(lessonIds.has(id), `quiz bank "${id}" has no matching lesson`).toBe(true)
      for (const q of questions) {
        expect(q.options.length, `${id}: "${q.q}" needs ≥2 options`).toBeGreaterThanOrEqual(2)
        expect(q.answer, `${id}: "${q.q}" answer index out of range`).toBeLessThan(q.options.length)
        expect(q.why.length, `${id}: "${q.q}" needs a why`).toBeGreaterThan(0)
      }
    }
    for (const l of LESSONS) {
      expect(QUIZZES[l.id]?.length ?? 0, `lesson "${l.id}" has no quiz bank`).toBeGreaterThan(0)
    }
  })

  it('every lesson has exactly one builder per step and unique ids', () => {
    const ids = new Set(LESSONS.map((l) => l.id))
    expect(ids.size).toBe(LESSONS.length)
    for (const l of LESSONS) {
      for (const step of [...l.classical.steps, ...l.modernize.steps]) {
        expect(
          Boolean(step.buildSpec) !== Boolean(step.buildRaw),
          `${l.id}: step "${step.label}" must have exactly one of buildSpec/buildRaw`
        ).toBe(true)
      }
    }
  })
})
