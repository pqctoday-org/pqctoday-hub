// SPDX-License-Identifier: GPL-3.0-only
/**
 * Board-facing claim invariants (executive journey audit, 15 Oct 2026).
 *
 * Executives repeat what this site says in funding papers and risk committees,
 * so a handful of legal and regulatory overclaims are banned outright. Each one
 * shipped before and was corrected; these checks stop it coming back.
 *
 * Scope: Learn module sources, the Compliance landing model, and the LATEST
 * dated module Q&A and quiz CSVs (the files the build ships — archives are
 * history and are not scanned). The RAG corpus is generated from these, so it
 * follows once the index is refreshed.
 *
 * Run locally: `npx vitest run src/__tests__/board-claim-invariants.test.ts`
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (/\.(tsx?|md)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(p)
  }
  return out
}

/** Latest dated file for a prefix, by the MMDDYYYY date and then the _rN suffix. */
function latestDated(dir: string, prefix: string): string {
  const key = (f: string) => {
    const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
    return m ? `${m[3]}${m[1]}${m[2]}-${(m[4] ?? '0').padStart(3, '0')}` : ''
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && key(f) !== '')
    .sort((a, b) => key(a).localeCompare(key(b)))
  if (files.length === 0) throw new Error(`no ${prefix}* file in ${dir}`)
  return path.join(dir, files[files.length - 1])
}

const SOURCES: string[] = [
  ...walk(path.join(ROOT, 'src/components/PKILearning/modules')),
  path.join(ROOT, 'src/components/Compliance/redesign/pillarModel.ts'),
  path.join(ROOT, 'src/components/Algorithms/Cnsa20Panel.tsx'),
  path.join(ROOT, 'src/components/Algorithms/cnsa20.ts'),
  path.join(ROOT, 'src/data/algorithmEntryIntents.tsx'),
  latestDated(path.join(ROOT, 'src/data/module-qa'), 'module_qa_combined_'),
  latestDated(path.join(ROOT, 'src/data'), 'pqcquiz_'),
]

/**
 * Split a file into records: one per CSV row (keyed by its leading id, so a row's
 * sentences stay attributable), or the whole file for source code.
 */
function records(file: string): { row: string | null; text: string }[] {
  const raw = fs.readFileSync(file, 'utf-8')
  if (!file.endsWith('.csv')) return [{ row: null, text: raw }]
  return raw
    .split(/\r?\n(?=[a-z][a-z0-9-]*,)/)
    .map((text) => ({ row: text.slice(0, text.indexOf(',')), text }))
}

/** Sentences of every scanned file, whitespace-normalised so JSX line wraps don't hide a match. */
const SENTENCES: { file: string; row: string | null; text: string }[] = SOURCES.flatMap((file) =>
  records(file).flatMap(({ row, text }) =>
    text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => ({ file: path.relative(ROOT, file), row, text: sentence }))
  )
)

/**
 * Quiz rows whose correction ships in the data release that carries the quiz CSV
 * (4.163.0). Self-expiring: the last test fails once a pending row no longer
 * offends, so this list cannot outlive the fix — delete the entry then.
 */
const PENDING_QUIZ_ROWS = new Set(['cstr-006', 'cstr-008', 'das-005'])
const pendingSeen = new Set<string>()

function offenders(test: (s: string) => boolean): string[] {
  return SENTENCES.filter((s) => test(s.text))
    .filter((s) => {
      if (s.row && s.file.includes('pqcquiz_') && PENDING_QUIZ_ROWS.has(s.row)) {
        pendingSeen.add(s.row)
        return false
      }
      return true
    })
    .map((s) => `${s.file}${s.row ? ` [${s.row}]` : ''}: ${s.text.slice(0, 200)}`)
}

describe('board-facing claim invariants', () => {
  it('scans the shipped files', () => {
    expect(SOURCES.length).toBeGreaterThan(100)
  })

  it('never presents NIS2 or DORA as setting a PQC deadline', () => {
    // NIS2/DORA within ~120 characters of mandate wording, either order; a window that
    // also carries a negation ("no PQC deadline", "not PQC-specific") is the correct claim.
    const mandate =
      'mandates? PQC|PQC mandates?|hard deadlines? for PQC|require[sd]? validated PQC|PQC migration on fixed timelines'
    const near = new RegExp(
      `\\b(NIS2|DORA)\\b.{0,120}?(${mandate})|(${mandate}).{0,120}?\\b(NIS2|DORA)\\b`,
      'i'
    )
    const negated = /\b(no|not|without|isn't|aren't|does not|do not|nor)\b/i
    expect(
      offenders((s) => {
        const m = s.match(near)
        return m !== null && !negated.test(m[0])
      })
    ).toEqual([])
  })

  it('states the SEC trigger as the materiality determination, not discovery', () => {
    expect(offenders((s) => /within (4|four) (business )?days of discovery/i.test(s))).toEqual([])
  })

  it('does not derive personal liability from the SEC disclosure rules', () => {
    expect(offenders((s) => /\bSEC\b/.test(s) && /personal liability/i.test(s))).toEqual([])
  })

  it('does not attribute quotations to an unnamed consensus', () => {
    expect(offenders((s) => /Industry consensus from/i.test(s))).toEqual([])
  })

  it('does not label a single study as authoritative', () => {
    expect(offenders((s) => /anchors? \(authoritative\)/i.test(s))).toEqual([])
  })

  it('does not say ANSSI or BSI require hybrid, outside the French regulated perimeter', () => {
    expect(
      offenders(
        (s) =>
          /(ANSSI|BSI)[^.]{0,40}\brequire[sd]?\b[^.]{0,20}hybrid/i.test(s) &&
          !/regulated perimeter/i.test(s)
      )
    ).toEqual([])
  })

  it('does not claim every framework converges on one hybrid-then-pure arc', () => {
    expect(
      offenders((s) => /converge on/i.test(s)).filter((o) => o.includes('ComplianceStrategy'))
    ).toEqual([])
  })

  it('does not put separate assurance programs on one validation spectrum', () => {
    expect(offenders((s) => /validation (exists )?on a spectrum/i.test(s))).toEqual([])
  })

  it('does not attribute PQC requirements to SOX or PCI DSS, or call DORA the PQC instrument', () => {
    expect(
      offenders(
        (s) =>
          /\b(SOX|PCI DSS)\b[^.]{0,60}\bPQC requirement/i.test(s) ||
          /primary instrument for [^.]{0,40}PQC compliance/i.test(s)
      )
    ).toEqual([])
  })

  it('does not state unsourced cyber-insurance premium figures', () => {
    expect(offenders((s) => /insur/i.test(s) && /\d+\s*[-–]\s*\d+% premium/i.test(s))).toEqual([])
  })

  // Must stay last: it reads what the tests above recorded.
  it('keeps the pending quiz allowlist honest', () => {
    expect([...PENDING_QUIZ_ROWS].filter((r) => !pendingSeen.has(r))).toEqual([])
  })
})
