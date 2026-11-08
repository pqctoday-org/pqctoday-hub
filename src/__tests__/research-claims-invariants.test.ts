// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Research and healthcare claim invariants (researcher journey audit, 16 Oct 2026).
 *
 * Claims the Researcher Quantum Impact and Healthcare modules used to make, and must
 * not make again:
 *
 * - FDA 21 CFR Part 11 sets no retention period. Retention comes from the applicable
 *   predicate rule (for IND investigators, 21 CFR 312.62(c): 2 years after approval, or
 *   after discontinuation with FDA notified). A sentence that puts Part 11 next to a
 *   year count must also name the predicate rule (or 312.62, or Part 11's own "at least
 *   as long as" audit-trail rule).
 * - GA4GH has published no requirement for PQC token signing.
 * - "DARPA PQMS" is not a programme we could find a primary source for.
 * - ML-KEM and ML-DSA rest on Module-LWE / Module-SIS, not Ring-LWE.
 * - McEliece dates from 1978, so "50+ years" (or "over 50 years") of cryptanalysis is wrong.
 * - CNSA 2.0 dates come from NSA's FAQ version 2.2 (1 January 2027, 31 December 2030,
 *   31 December 2031); the 2022 per-category schedule ending in 2033 is only quoted as older guidance.
 * - The assessment retention periods are sample assumptions: HIPAA sets no medical-record
 *   retention minimum, PCI DSS sets no cardholder-data storage period, and FERPA financial
 *   aid periods are record-specific.
 *
 * Scope: Learn module sources, the topic summaries the assistant reads, and the LATEST
 * dated quiz, assessment and combined module Q&A CSVs. Checked per sentence, whitespace-normalised.
 *
 * Run locally: `npx vitest run src/__tests__/research-claims-invariants.test.ts`
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

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
  path.join(ROOT, 'src/data/module-topic-summaries.md'),
  latestDated(path.join(ROOT, 'src/data/module-qa'), 'module_qa_combined_'),
  latestDated(path.join(ROOT, 'src/data'), 'pqcquiz_'),
  latestDated(path.join(ROOT, 'src/data'), 'pqcassessment_'),
]

interface Sentence {
  file: string
  text: string
}

/** Split text into sentences. "312.62(c)" survives: a split needs whitespace after the stop. */
const toSentences = (text: string): string[] =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?;])\s+/)
    .filter((t) => t.trim() !== '')

/**
 * Text units of a source: for a CSV, each CELL is split into sentences on its own, so a
 * question that ends "…as ML-KEM." is never glued to the next cell's first sentence (the
 * full stop there is followed by a quote and comma, not whitespace). Other files are split
 * line by line.
 */
function unitsOf(file: string): string[] {
  const raw = fs.readFileSync(file, 'utf-8')
  if (!file.endsWith('.csv')) return raw.split(/\r?\n/).flatMap(toSentences)
  const parsed = Papa.parse<string[]>(raw, { skipEmptyLines: true })
  return parsed.data.flatMap((row) => row.flatMap(toSentences))
}

/** Every sentence of every source. */
const SENTENCES: Sentence[] = SOURCES.flatMap((file) =>
  unitsOf(file).map((text) => ({ file: path.relative(ROOT, file), text }))
)

interface Rule {
  name: string
  test: (s: string) => boolean
}

const YEAR_COUNT = /\b\d+\s*\+?\s*-?\s*(years?|yrs?)\b/i

const RULES: Rule[] = [
  {
    name: 'Part 11 given a retention period (retention comes from the predicate rule)',
    test: (s) =>
      /Part 11\b/.test(s) &&
      YEAR_COUNT.test(s) &&
      !/predicate rule|312\.62|at least as long as/i.test(s),
  },
  {
    name: 'GA4GH said to require PQC',
    test: (s) =>
      /GA4GH/.test(s) &&
      /\b(required|will require|requires|must use|mandat\w*)\b/i.test(s) &&
      /\bPQC\b|post-quantum/i.test(s),
  },
  { name: 'PQMS (no primary source)', test: (s) => /\bPQMS\b/.test(s) },
  {
    name: 'Ring-LWE given as the basis of ML-KEM / ML-DSA (they use Module-LWE / Module-SIS)',
    test: (s) =>
      /Ring-LWE|\bRLWE\b/.test(s) &&
      /ML-KEM|ML-DSA/.test(s) &&
      !/rather than|instead of|not Ring-LWE/i.test(s),
  },
  {
    name: '"50+ years" of cryptanalysis (McEliece dates from 1978)',
    test: (s) =>
      /\b(50\s*\+|over 50|more than 50)[- ]?years?\b/i.test(s) &&
      /cryptanaly|McEliece|syndrome decoding|no successful attack/i.test(s),
  },
  {
    // HIPAA's own retention rule (45 CFR 164.316(b)(2)) is 6 years and covers compliance
    // documentation; medical-record retention is set by state law.
    name: 'HIPAA given a 7-year PHI retention requirement (it is 6 years, for documentation)',
    test: (s) => /HIPAA|PHI/.test(s) && /\b(7|seven)[- ]year (minimum |retention)/i.test(s),
  },
  {
    // NSA's CNSA 2.0 FAQ (version 2.2) sets the NSS dates: new acquisitions 1 January 2027,
    // phase-out 31 December 2030, algorithms mandated 31 December 2031. The 2022 per-category
    // schedule that ended in 2033 may only be quoted as older guidance.
    name: 'CNSA 2.0 given a 2033 end date without saying it is the older 2022 schedule',
    test: (s) =>
      /CNSA/.test(s) &&
      /\b2033\b/.test(s) &&
      !/2022|older|superseded|history|historical|previous|earlier|no longer|retired/i.test(s),
  },
  {
    // HIPAA sets no medical-record retention period (state law does); its 6 years covers the
    // compliance documentation. The corrected retention rows call the 6 years a sample assumption.
    name: 'HIPAA given as the source of a minimum retention period for health records',
    test: (s) => /HIPAA minimum(?! necessary)|Minimum retention under HIPAA/i.test(s),
  },
  {
    // PCI DSS sets no minimum or maximum storage time for cardholder data.
    name: 'PCI DSS given as the source of a cardholder-data retention period',
    test: (s) =>
      /\d+ years? \(PCI DSS cardholder data\)|Maximum cardholder data storage period/i.test(s),
  },
  {
    // 34 CFR 668.24(e) sets record-specific periods for financial aid records, not a flat 6 years.
    name: 'FERPA / financial aid given a flat 6-year retention period',
    test: (s) => /\b6 years? \(FERPA/i.test(s),
  },
]

/**
 * Data-lane rows whose correction is queued for the data worktree but not yet in the
 * latest CSV on this branch. Matched by file pattern and a sentence substring. Once the
 * corrected CSV ships an entry stops matching; the second test then fails until the
 * entry is deleted, so the list cannot rot.
 */
const PENDING_DATA_FIXES: { file: RegExp; text: string }[] = []

const isPending = (s: Sentence) =>
  PENDING_DATA_FIXES.some((p) => p.file.test(s.file) && s.text.includes(p.text))

describe('Ring-LWE rule: wording cases (aisec-008)', () => {
  const rule = RULES.find((r) => r.name.startsWith('Ring-LWE given'))!
  it('passes the corrected FHE explanation, sentence by sentence', () => {
    const corrected =
      'Most practical fully homomorphic encryption (FHE) schemes — BGV, CKKS, and TFHE — are based on the Learning With Errors (LWE) problem or its ring variant (Ring-LWE). ML-KEM (FIPS 203) uses the related Module-LWE problem.'
    expect(toSentences(corrected).some((t) => rule.test(t))).toBe(false)
  })
  it('flags the old wordings', () => {
    expect(
      rule.test(
        'These schemes rely on LWE or Ring-LWE, the same lattice problems underlying ML-KEM.'
      )
    ).toBe(true)
    expect(
      rule.test(
        'the hardness of ML-KEM and ML-DSA rests on the Learning With Errors (LWE) problem and its variants Module-LWE (MLWE) and Ring-LWE (RLWE)'
      )
    ).toBe(true)
  })
  it('keeps a question cell apart from the next cell', () => {
    const units = Papa.parse<string[]>('id,q,e\nx,"…as ML-KEM.","Based on Ring-LWE."', {
      skipEmptyLines: true,
    }).data.flatMap((row) => row.flatMap(toSentences))
    expect(units.some((t) => rule.test(t))).toBe(false)
  })
})

describe('research and healthcare claim invariants', () => {
  for (const rule of RULES) {
    it(`no source states: ${rule.name}`, () => {
      const offenders = SENTENCES.filter((s) => rule.test(s.text) && !isPending(s)).map(
        (s) => `${s.file}: ${s.text.slice(0, 220)}`
      )
      expect(offenders).toEqual([])
    })
  }

  it('gives the CNSA 2.0 31 December 2030 phase-out with its exception in every topic summary', () => {
    // NSA's FAQ attaches an exception to the phase-out ("unless otherwise granted an exception").
    const phaseOuts = SENTENCES.filter(
      (s) => /module-topic-summaries\.md$/.test(s.file) && /31 December 2030/.test(s.text)
    )
    expect(phaseOuts.length).toBeGreaterThan(0)
    for (const s of phaseOuts) {
      expect(s.text, s.text.slice(0, 100)).toMatch(/exceptions? possible|exception is granted/)
    }
  })

  it('every pending data-fix entry still matches a banned sentence (delete it once fixed)', () => {
    const stale = PENDING_DATA_FIXES.filter(
      (p) =>
        !SENTENCES.some(
          (s) => p.file.test(s.file) && s.text.includes(p.text) && RULES.some((r) => r.test(s.text))
        )
    ).map((p) => `${p.file} / ${p.text}`)
    expect(stale).toEqual([])
  })

  it('the guard rules still catch the sentences they were written for', () => {
    const fires = (text: string) => RULES.some((r) => r.test(text))
    expect(
      fires('Clinical trial data under FDA 21 CFR Part 11 must be preserved for 15+ years.')
    ).toBe(true)
    expect(fires('GA4GH Passports APIs: PQC JWT signing required as these APIs evolve.')).toBe(true)
    expect(fires('DARPA PQMS (Post-Quantum Microelectronics Security) program.')).toBe(true)
    expect(fires('ML-KEM and ML-DSA rest on Module-LWE and Ring-LWE.')).toBe(true)
    expect(fires('McEliece has 50+ years of cryptanalysis history.')).toBe(true)
    // The corrected wording must pass.
    expect(
      fires(
        'FDA 21 CFR Part 11 governs electronic records; retention comes from the applicable predicate rule (21 CFR 312.62(c): 2 years after approval).'
      )
    ).toBe(false)
    expect(fires('McEliece has been studied since 1978.')).toBe(false)
    expect(fires('CNSA 2.0 requires exclusive PQC for NSS by 2033.')).toBe(true)
    expect(
      fires(
        "NSA's 2022 category guidance had web browsers, servers and cloud services exclusive by 2033 (CNSA 2.0)."
      )
    ).toBe(false)
    expect(fires('6 years (HIPAA minimum)')).toBe(true)
    // the Privacy Rule's "minimum necessary" standard is not a retention period
    expect(fires('Apply the HIPAA minimum necessary standard to every disclosure.')).toBe(false)
    expect(fires('2 years (PCI DSS cardholder data)')).toBe(true)
    expect(fires('6 years (FERPA / financial aid)')).toBe(true)
    expect(fires('6 years (sample assumption)')).toBe(false)
    expect(fires('2 years (sample retention period)')).toBe(false)
    expect(fires('6 years (institutional policy example)')).toBe(false)
  })
})
