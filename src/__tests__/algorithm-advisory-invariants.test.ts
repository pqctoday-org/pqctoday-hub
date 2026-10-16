// SPDX-License-Identifier: GPL-3.0-only
/**
 * Algorithm advisory invariants (researcher journey audit, 16 Oct 2026).
 *
 * On 1 Oct 2026 the BSI advised against Classic McEliece for new developments
 * (Hinweis Classic McEliece). It did not withdraw it: TR-02102-1 (2026-01) still
 * lists it until the next revision. So the site may say "listed in TR-02102-1",
 * but it must not call Classic McEliece BSI-recommended or BSI-recognised without
 * the advisory, and it must not say it has decades of cryptanalysis "with no
 * successful attack" as if nothing changed.
 *
 * Scope: Learn module sources, the topic summaries the assistant reads, the KMIP
 * policy files, the advisory module itself, and the LATEST dated quiz, module Q&A,
 * algorithm reference and transitions CSVs.
 *
 * Run locally: `npx vitest run src/__tests__/algorithm-advisory-invariants.test.ts`
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getAlgorithmAdvisory } from '../data/algorithmAdvisories'

const ROOT = process.cwd()

function walk(dir: string, re: RegExp, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, re, out)
    else if (re.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(p)
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
  ...walk(path.join(ROOT, 'src/components/PKILearning/modules'), /\.(tsx?|md)$/),
  ...walk(path.join(ROOT, 'public/kmip-policies'), /\.ya?ml$/),
  path.join(ROOT, 'src/data/module-topic-summaries.md'),
  latestDated(path.join(ROOT, 'src/data/module-qa'), 'module_qa_combined_'),
  latestDated(path.join(ROOT, 'src/data'), 'pqcquiz_'),
  latestDated(path.join(ROOT, 'src/data'), 'pqc_complete_algorithm_reference_'),
  latestDated(path.join(ROOT, 'src/data'), 'algorithms_transitions_'),
]

/**
 * Units mentioning McEliece: a whole row for CSVs (a row is about one algorithm, so
 * a later sentence in the same row is still about McEliece), otherwise a sentence,
 * whitespace-normalised so line wraps don't hide a match.
 */
const MCELIECE_SENTENCES = SOURCES.flatMap((file) => {
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/)
  const units = file.endsWith('.csv')
    ? lines
    : lines.flatMap((line) => line.replace(/\s+/g, ' ').split(/(?<=[.!?;])\s+/))
  return units
    .filter((s) => /mceliece/i.test(s))
    .map((text) => ({ file: path.relative(ROOT, file), text }))
})

const ENDORSEMENT =
  /BSI[- ]recommended|recommended by (the )?BSI|BSI (recommends|recognises|recognizes)|TR-02102-1 recommended|recommended Level 5|no successful attack/i
const MENTIONS_ADVISORY = /advis(es|ed) against|not for new use|2026-10-01|1 Oct 2026/i

/**
 * Data-lane rows whose correction is queued for the data worktree (reference CSV
 * Classic-McEliece-6688128 / -6960119, transitions rows for 460896 / 6688128).
 * Matched by a sentence substring. Once the newer CSVs ship these no longer match;
 * the second test then fails until the entry is deleted, so the list cannot rot.
 */
const PENDING_DATA_FIXES: { file: RegExp; text: string }[] = []

const isPending = (s: { file: string; text: string }) =>
  PENDING_DATA_FIXES.some((p) => p.file.test(s.file) && s.text.includes(p.text))

describe('Classic McEliece advisory invariants', () => {
  it('no source calls Classic McEliece BSI-endorsed without the 2026-10-01 advisory', () => {
    const offenders = MCELIECE_SENTENCES.filter(
      (s) => ENDORSEMENT.test(s.text) && !MENTIONS_ADVISORY.test(s.text) && !isPending(s)
    ).map((s) => `${s.file}: ${s.text.slice(0, 200)}`)
    expect(offenders).toEqual([])
  })

  it('every pending data-fix entry still matches something (delete it once fixed)', () => {
    const stale = PENDING_DATA_FIXES.filter(
      (p) => !MCELIECE_SENTENCES.some((s) => p.file.test(s.file) && s.text.includes(p.text))
    ).map((p) => `${p.file} / ${p.text}`)
    expect(stale).toEqual([])
  })

  it('every Classic McEliece parameter set carries the BSI advisory', () => {
    for (const name of [
      'Classic-McEliece-348864',
      'Classic-McEliece-460896',
      'Classic-McEliece-6688128',
      'Classic-McEliece-6960119',
      'Classic-McEliece-8192128',
      'Classic McEliece 6688128 (BSI Level 5)',
    ]) {
      const advisory = getAlgorithmAdvisory(name)
      expect(advisory?.issuer).toBe('BSI')
      expect(advisory?.date).toBe('2026-10-01')
    }
    expect(getAlgorithmAdvisory('FrodoKEM-976')).toBeUndefined()
    expect(getAlgorithmAdvisory('ML-KEM-768')).toBeUndefined()
  })

  it('the advisory never says "withdrawn" (the BSI has not removed it from TR-02102-1)', () => {
    expect(getAlgorithmAdvisory('Classic-McEliece-460896')?.note).not.toMatch(/withdraw/i)
  })
})
