// SPDX-License-Identifier: GPL-3.0-only
//
// Curriculum guarantee for the OpenSSL Studio Learn tab. Replays every
// lesson step against the REAL openssl.wasm (via src/test/kat/openssl-driver.ts
// — the same driver the crypto KAT suite uses), asserting each step reaches
// its declared outcome (expect:'refusal' steps must throw; all others must
// return). This is what stops the curriculum from silently drifting out of
// sync with the actual OpenSSL build — mirroring
// TpmPlayground/learn/tpmLessons.local.test.ts and
// hsm/learn/pkcs11Lessons.local.test.ts.
//
// Also asserts the structural curriculum invariants (every lesson has a
// quiz and vice versa; valid answer indices; non-empty "why"; every
// glossary flag entry is reused, not duplicated, from the Workbench's own
// verified FLAG_HINTS).
//
// Venue: `*.local.test.ts` per the 2026-07-01 new-test-suite convention —
// local gate only, not CI.
import { describe, it, expect, beforeAll } from 'vitest'
import { OPENSSL_LESSONS } from './opensslLessons'
import { OPENSSL_QUIZZES } from './opensslQuiz'
import { TAG_GLOSSARY, TERMS } from './opensslGlossary'
import { FLAG_HINTS } from '../../../utils/opensslDocsData'
import { parseOpensslArgs } from '../worker/commandParser'
import type { OpenSslLearnContext } from './opensslLearnContext'
import {
  newModule,
  runOpenssl,
  writeFile,
  readFileBin,
  listNewOutputFiles,
} from '../../../test/kat/openssl-driver'

// ── Structural curriculum invariants (no engine needed) ────────────────────
describe('OpenSSL Studio curriculum structure', () => {
  it('every lesson has a quiz bank and vice versa', () => {
    const lessonIds = OPENSSL_LESSONS.map((l) => l.id).sort()
    const quizIds = Object.keys(OPENSSL_QUIZZES).sort()
    expect(quizIds).toEqual(lessonIds)
  })

  it('every lesson id and number is unique and sequential', () => {
    expect(new Set(OPENSSL_LESSONS.map((l) => l.id)).size).toBe(OPENSSL_LESSONS.length)
    expect(OPENSSL_LESSONS.map((l) => l.n)).toEqual(OPENSSL_LESSONS.map((_, i) => i + 1))
  })

  it('every lesson has ≥1 step, non-empty setup/blurb/whyItMatters/notes', () => {
    for (const l of OPENSSL_LESSONS) {
      expect(l.steps.length, l.id).toBeGreaterThan(0)
      expect(l.setup.length, l.id).toBeGreaterThan(0)
      expect(l.blurb.length, l.id).toBeGreaterThan(0)
      expect(l.whyItMatters.length, l.id).toBeGreaterThan(0)
      expect(l.notes.length, l.id).toBeGreaterThan(0)
    }
  })

  it('every quiz question has ≥2 options, an in-range answer, and a non-empty why', () => {
    for (const [id, bank] of Object.entries(OPENSSL_QUIZZES)) {
      expect(bank.length, id).toBeGreaterThan(0)
      for (const q of bank) {
        expect(q.options.length, `${id}: ${q.q}`).toBeGreaterThanOrEqual(2)
        expect(q.answer, `${id}: ${q.q}`).toBeGreaterThanOrEqual(0)
        expect(q.answer, `${id}: ${q.q}`).toBeLessThan(q.options.length)
        expect(q.why.length, `${id}: ${q.q}`).toBeGreaterThan(0)
      }
    }
  })

  it("every glossary flag entry matches the Workbench's own verified FLAG_HINTS (no duplicate/drifted copy)", () => {
    for (const [flag, hint] of Object.entries(FLAG_HINTS)) {
      expect(TAG_GLOSSARY[flag]?.def, flag).toBe(hint)
    }
  })

  it('no key collides between tagGlossary and terms (both namespaces share one lookup)', () => {
    const tagKeys = new Set(Object.keys(TAG_GLOSSARY))
    for (const term of TERMS) {
      expect(tagKeys.has(term.id), `${term.id} collides with a tagGlossary key`).toBe(false)
    }
  })

  it('every tryRef names a real Workbench category', () => {
    const VALID_CATEGORIES = new Set([
      'genpkey',
      'req',
      'x509',
      'enc',
      'dgst',
      'hash',
      'rand',
      'version',
      'files',
      'kem',
      'pkcs12',
      'lms',
      'configutl',
      'kdf',
    ])
    for (const l of OPENSSL_LESSONS) {
      for (const ref of l.tryRef) {
        expect(VALID_CATEGORIES.has(ref), `${l.id}: tryRef "${ref}"`).toBe(true)
      }
    }
  })

  it('has ~45+ glossary entries as the KMIP/PKCS#11/TPM curricula target', () => {
    expect(Object.keys(TAG_GLOSSARY).length + TERMS.length).toBeGreaterThanOrEqual(45)
  })
})

// ── Live engine replay of every lesson step ────────────────────────────────
//
// A fresh module per openssl invocation (EXIT_RUNTIME=1 constraint — see
// openssl-driver.ts), with a persistent virtual-file Map threaded across
// ALL lessons for the whole test run, mirroring the browser's single
// shared Zustand file store (a real session never resets between lessons
// either — a learner can jump straight to Lesson 8 after only Lesson 1).
describe('OpenSSL Studio lessons replay against the real WASM engine', () => {
  let ctx: OpenSslLearnContext

  beforeAll(() => {
    const files = new Map<string, Uint8Array>()

    ctx = {
      async run(cmd: string) {
        const args = parseOpensslArgs(cmd)
        const M = await newModule({ quiet: true })
        for (const [name, data] of files) writeFile(M, `/${name}`, data)
        const preExisting = new Set(files.keys())
        const r = runOpenssl(M, args)
        for (const name of listNewOutputFiles(M, preExisting)) {
          files.set(name, readFileBin(M, `/${name}`))
        }
        if (r.rc !== 0) {
          throw new Error(r.stderr.trim() || `openssl ${args.join(' ')} exited ${r.rc}`)
        }
        return { stdout: r.stdout }
      },
      readFile: (name) => files.get(name),
      writeFile: (name, content) => {
        files.set(name, typeof content === 'string' ? new TextEncoder().encode(content) : content)
      },
    }
  })

  for (const lesson of OPENSSL_LESSONS) {
    it(`L${lesson.n} — ${lesson.title}`, async () => {
      for (let i = 0; i < lesson.steps.length; i++) {
        const step = lesson.steps[i]
        const where = `${lesson.id} step ${i + 1} (${step.op})`
        if (step.expect === 'refusal') {
          await expect(step.run(ctx), `${where} must be refused`).rejects.toThrow()
          continue
        }
        const r = await step.run(ctx)
        expect(r.detail.length, where).toBeGreaterThan(0)
      }
    }, 30_000)
  }
})
