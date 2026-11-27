// SPDX-License-Identifier: AGPL-3.0-only
/**
 * CI lint for the one format module (UX grammar v2.1, section 2.4).
 *
 * Fails when text a reader can see uses an old notation (`32 bytes`, `32B`, `KB`, `[48ms]`,
 * `-$1`, `3yr`, `11/26/2026`, `NaN`, `undefined`) or when a date is built by hand
 * (`toLocaleDateString` and friends). Fix a failure with the function the message names.
 *
 * How the baseline works: the Hub already has authored lesson text in the old notations
 * (about a thousand sentences such as "the signature is 3,309 bytes"). Changing lesson text
 * means a search-index rebuild and re-signing, so those are counted per file in
 * formatLint.baseline.json and may only go down. A file may not gain a finding, and a file
 * that is not in the baseline may have none. Rewrite a lesson sentence, then lower its
 * count with `FORMAT_LINT_WRITE_BASELINE=1 npx vitest run src/lib/format/formatLint.test.ts`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  RULE_FIX,
  countByFileAndRule,
  scanSource,
  type Baseline,
  type Finding,
  type RuleId,
} from './formatLint'

const ROOT = path.resolve(__dirname, '../../..')
const BASELINE_PATH = path.join(__dirname, 'formatLint.baseline.json')

function loadBaseline(): Baseline {
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) as Baseline
}

function describeFindings(findings: Finding[]): string {
  return findings
    .map((f) => `  ${f.file}:${f.line}  [${f.rule}] "${f.text}"\n      use ${RULE_FIX[f.rule]}`)
    .join('\n')
}

describe('format lint: the old notations stay out of rendered text', () => {
  const findings = scanSource({ root: ROOT })

  it('writes the baseline when asked (FORMAT_LINT_WRITE_BASELINE=1)', () => {
    if (process.env.FORMAT_LINT_WRITE_BASELINE !== '1') return
    const sorted = Object.fromEntries(
      Object.entries(countByFileAndRule(findings)).sort(([a], [b]) => a.localeCompare(b))
    )
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(sorted, null, 2)}\n`)
  })

  it('no file gains a finding beyond its baseline', () => {
    if (process.env.FORMAT_LINT_WRITE_BASELINE === '1') return
    const baseline = loadBaseline()
    const counts = countByFileAndRule(findings)
    const over: Finding[] = []
    for (const [file, rules] of Object.entries(counts)) {
      for (const [rule, count] of Object.entries(rules) as Array<[RuleId, number]>) {
        const allowed = baseline[file]?.[rule] ?? 0
        if (count > allowed) {
          over.push(...findings.filter((f) => f.file === file && f.rule === rule))
        }
      }
    }
    expect(over.length, `New old-notation text (see section 2.4):\n${describeFindings(over)}`).toBe(
      0
    )
  }, 120_000)
})

describe('format lint: the scanner itself', () => {
  const scanText = (name: string, code: string): Finding[] => {
    const dir = fs.mkdtempSync(path.join(ROOT, 'node_modules', '.format-lint-'))
    try {
      const file = path.join(dir, 'src', name)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, code)
      return scanSource({ root: dir })
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }

  it('catches each old notation in rendered text, computed or typed', () => {
    const found = scanText(
      'bad.tsx',
      [
        "export const a = '7856 bytes'",
        'export const b = `pk: ${n}B`',
        "export const c = '12 KB'",
        'export const d = `[${ms}ms]`',
        "export const e = 'Total -$1,500'",
        "export const f = 'over 3yr'",
        "export const g = 'on 11/26/2026'",
        "export const h = 'value NaN'",
        "export const i = 'is undefined'",
        'export const J = () => <p>{n} bytes</p>',
        'export const K = () => <p>2026-11-26T13:18:02Z</p>',
        'export const l = new Date().toLocaleDateString()',
        "export const m = d.toLocaleString('en-US', { month: 'short' })",
        'export const n2 = new Intl.DateTimeFormat("en-GB")',
      ].join('\n')
    )
    const rules = new Set(found.map((f) => f.rule))
    for (const r of [
      'bytes',
      'byteCount',
      'KB',
      'bracketMs',
      'minusMoney',
      'yrMo',
      'slashDate',
      'NaN',
      'undefined',
      'isoTimestamp',
      'handBuiltDate',
    ] as RuleId[]) {
      expect(rules.has(r), `rule ${r} did not fire`).toBe(true)
    }
    expect(found.filter((f) => f.rule === 'handBuiltDate')).toHaveLength(3)
  })

  it('leaves alone what is not rendered text or not the old notation', () => {
    const found = scanText(
      'good.tsx',
      [
        "import x from './32 bytes'",
        '// 7856 bytes in a comment, 11/26/2026, NaN',
        "export const a = typeof z === 'undefined'",
        "export const b = '0x1B'",
        "export const c = '$7.1B'",
        "export const d = 'USD 12.1B'",
        "export const e = 'duration-[2000ms]'",
        "export const f = 'dev-6mo-1'",
        "export const g = '7,856 B (7.7 KiB)'",
        "export const h = '48 ms'",
        "export const i = '\\u2212$1.5M'",
        "export const j = '3 yr'",
        "export const k = '26 Nov 2026'",
        "export const l = 'https://x.example/documents/2026/06/25/2026-12909/a'",
        "export const m = 'Intl.DateTimeFormatOptions'",
      ].join('\n')
    )
    expect(found).toEqual([])
  })
})
