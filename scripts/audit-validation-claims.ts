// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-validation-claims — banned-claims lint for validation language
 * (ACVP validation remediation plan 2026-09-24, WS-A item A-6).
 *
 * PQC Today runs selected public NIST ACVP-Server reference samples,
 * published-standard KATs, oracle comparisons and functional round-trips. It
 * is not an ACVTS session, a CAVP/CMVP certificate or an exhaustive
 * conformance run, and copy must never say or imply otherwise. This gate
 * fails on phrases that do.
 *
 * Scanned (all tracked by the hub repo, so CI can run it on a clean clone):
 *   - UI copy and Learn content: src/**\/*.{ts,tsx,md}, excluding tests,
 *     src/wasm/ (engine bindings, not copy) and src/data/archive/.
 *   - Validation docs at the repo root: README.md, TESTING.md, GATES.md,
 *     CONTRIBUTING.md. CHANGELOG.md is deliberately NOT scanned: it is a
 *     historical record of what each release said, and rewriting history
 *     would hide exactly the overclaims this plan corrects.
 *   - Optional extra paths given on the command line (files or directories,
 *     *.md / *.html / *.txt / *.ts / *.tsx), e.g. the conference deck:
 *       npm run audit:validation-claims -- ../presentations/fipsandchips2026
 *     Extra paths are never required: CI clones only this repo.
 *
 * Two kinds of rule:
 *   - context-free phrases that are wrong wherever they appear unless negated
 *     ("ACVP validated", "complete ACVP", "all mechanisms covered", "NIST
 *     validated", the suite-level "NIST ACVP Known Answer Tests", ...);
 *   - self-claims: a certification/validation word in the same sentence as a
 *     reference to PQC Today's own engine/suite/playground. This is what lets
 *     Learn prose say "a FIPS 140-3 certified HSM" about a real vendor product
 *     while still catching "our WASM engine is FIPS certified".
 *
 * Every finding can be cleared three ways, in order of preference:
 *   1. fix the copy;
 *   2. negate it — a match preceded, within the same sentence, by "not",
 *      "never", "no", "isn't", "without", "rather than", ... is not a claim;
 *   3. allowlist it — an inline `claims-lint-allow: <reason>` comment on the
 *      same or previous line, or an entry in
 *      scripts/audit-validation-claims.allowlist.json ({ file, match, reason }).
 *
 * Presentation drift (plan A-5): in extra paths only, a sentence of the form
 * "<N> ... NIST ACVP-Server" must use `nistReferenceSampleFileCount` from the
 * WS-B generated counts (src/data/validation/validation-counts.generated.json),
 * and "<N> test groups/sections … <M> families" must match the CATEGORIES table
 * in src/components/Playground/hsm/acvp/useAcvpSuite.ts (M = categories, N = the
 * sum of their `groups`).
 *
 * Exit 0 = clean, 1 = findings. `--json` prints machine-readable output.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ClaimRule {
  id: string
  description: string
  pattern: RegExp
  /** Self-claim rules only fire when the sentence also names PQC Today's own stack. */
  requiresSelfReference?: boolean
}

export interface ClaimFinding {
  file: string
  line: number
  rule: string
  match: string
  sentence: string
}

export interface AllowEntry {
  file: string
  match: string
  reason: string
}

/** A reference to PQC Today's own implementation/suite (for self-claim rules). */
export const SELF_REFERENCE =
  /\b(PQC Today|pqctoday|the Hub|this (?:playground|workbench|emulator|engine|implementation|suite|app|site|page|tool|module's engine)|our (?:engine|engines|implementation|WASM|HSM|emulator|suite|tests?|numbers|results)|SoftHSMv3|softhsmv3|the (?:WASM|WebAssembly) (?:engine|library|PKCS#11)|both engines|the (?:C\+\+|Rust) engine|Cryptographic Validation Workbench)\b/i

export const RULES: ClaimRule[] = [
  {
    id: 'acvp-validated',
    description:
      'Unqualified "ACVP validated" — a public reference sample is not an ACVP validation',
    pattern: /\bACVP[- ](?:validated|certified|approved|compliant)\b/i,
  },
  {
    id: 'complete-acvp',
    description: '"complete/full/exhaustive ACVP" — no complete ACVP matrix exists here',
    pattern:
      /\b(?:complete|full|fully|exhaustive|comprehensive|entire)(?:ly)? ACVP(?: (?:support|coverage|suite|matrix|validation|conformance|test(?:s|ing)?))?\b/i,
  },
  {
    id: 'all-mechanisms-covered',
    description: '"all mechanisms covered/tested/validated" — coverage is sampled, not exhaustive',
    pattern:
      /\b(?:all|every) (?:advertised |supported |PKCS#11 )?mechanisms? (?:are |is |were )?(?:fully )?(?:covered|tested|validated|verified)\b/i,
  },
  {
    id: 'nist-validated',
    description:
      '"NIST validated/certified/approved" as a claim — only NIST can publish a validation',
    pattern: /\b(?:NIST[- ](?:validated|certified)|(?:validated|certified) by NIST)\b/i,
  },
  {
    id: 'acvp-suite-heading',
    description:
      'Suite-level "NIST ACVP Known Answer Tests" — the suite mixes evidence classes (use "Cryptographic Validation Workbench")',
    // Case-sensitive on purpose: Title-Case "Known Answer Tests" is a heading;
    // lowercase "an ACVP known-answer test" in a comment names one real case.
    pattern: /\b(?:NIST )?ACVP Known[- ]Answer Tests?\b/,
  },
  {
    id: 'nist-kat-button',
    description:
      'Generic "Run NIST KAT" action — name the evidence ("Run reference sample", "Run standard KAT", ...) or use "Run validation tests"',
    pattern: /\bRun (?:the )?NIST KATs?\b/i,
  },
  {
    id: 'acvts-verdict',
    description: 'Claims an ACVTS verdict/acceptance or an issued-vector run that does not exist',
    pattern:
      /\b(?:passe[sd]|pass(?:ing)?|accepted by|verdict from) (?:the )?ACVTS\b|\bACVTS[- ](?:accepted|approved|passed)\b/i,
  },
  {
    id: 'self-certified',
    description:
      'Certification/validation word applied to PQC Today\'s own engine or suite ("FIPS certified", "CMVP validated", "FIPS 140-3 compliant", "validated implementation")',
    pattern:
      /\b(?:FIPS(?: 140-[23])?[- ](?:certified|validated|compliant)|CMVP[- ](?:certified|validated)|CAVP[- ](?:certified|validated))\b/i,
    requiresSelfReference: true,
  },
]

/** Negation within the same sentence, before the match, clears it. */
const NEGATION =
  /\b(?:not|never|no|nor|isn't|aren't|wasn't|doesn't|don't|cannot|can't|without|rather than|instead of|neither|nothing|none)\b[^.!?]*$/i

const SCAN_EXT = new Set(['.ts', '.tsx', '.md', '.html', '.txt'])

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.join(HERE, '..')
const ALLOWLIST_PATH = path.join(HERE, 'audit-validation-claims.allowlist.json')
const ROOT_DOCS = ['README.md', 'TESTING.md', 'GATES.md', 'CONTRIBUTING.md']

function isExcluded(rel: string): boolean {
  const p = rel.split(path.sep).join('/')
  return (
    /\.(test|spec)\.(ts|tsx)$/.test(p) ||
    p.startsWith('src/wasm/') ||
    p.includes('/archive/') ||
    // LLM enrichment digests of third-party documents — they quote vendors'
    // own certification language about their products, not PQC Today copy.
    p.startsWith('src/data/doc-enrichments/') ||
    p.startsWith('src/data/product-extractions/') ||
    p.includes('/node_modules/') ||
    p.includes('/__golden__/')
  )
}

export function listFiles(dir: string, root: string = REPO_ROOT, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  const stat = fs.statSync(dir)
  if (stat.isFile()) {
    if (SCAN_EXT.has(path.extname(dir))) out.push(dir)
    return out
  }
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const p = path.join(dir, name)
    const s = fs.statSync(p)
    if (s.isDirectory()) listFiles(p, root, out)
    else if (SCAN_EXT.has(path.extname(name)) && !isExcluded(path.relative(root, p))) out.push(p)
  }
  return out
}

/**
 * Collapse JSX/markdown line-wrapping so a phrase split across source lines
 * still matches, keeping a map back to the original line numbers.
 */
function normalise(text: string): { flat: string; lineAt: (i: number) => number } {
  let flat = ''
  const lines: number[] = []
  let line = 1
  let lastWasSpace = false
  // JSX artefacts that sit between words: {' '} and {" "}
  const src = text.replace(/\{\s*(['"])\s\1\s*\}/g, (m) => ' '.repeat(m.length))
  for (const ch of src) {
    if (ch === '\n') line++
    const space = /\s/.test(ch)
    if (space && lastWasSpace) continue
    flat += space ? ' ' : ch
    lines.push(line)
    lastWasSpace = space
  }
  return { flat, lineAt: (i) => lines[Math.min(i, lines.length - 1)] ?? 1 }
}

/** Sentence/string boundary: end punctuation, a quote that is not an apostrophe, or a tag edge. */
const BOUNDARY = /[.!?](?=\s)|["`<>]|(?<![A-Za-z])'|'(?![A-Za-z])/g

function sentenceAround(
  flat: string,
  start: number,
  end: number
): { text: string; offset: number } {
  let s = 0
  for (const m of flat.slice(0, start).matchAll(BOUNDARY)) s = (m.index ?? 0) + 1
  BOUNDARY.lastIndex = 0
  const after = flat.slice(end)
  const next = after.search(/[.!?](?=\s|$)|["`<>]|(?<![A-Za-z])'|'(?![A-Za-z])/)
  const e = next < 0 ? flat.length : end + next + 1
  return { text: flat.slice(s, e).trim(), offset: s }
}

function inlineAllowed(original: string[], line: number): boolean {
  const same = original[line - 1] ?? ''
  const prev = original[line - 2] ?? ''
  return /claims-lint-allow:\s*\S/.test(same) || /claims-lint-allow:\s*\S/.test(prev)
}

export function scanText(
  text: string,
  file: string,
  allow: AllowEntry[] = [],
  rules: ClaimRule[] = RULES
): ClaimFinding[] {
  const { flat, lineAt } = normalise(text)
  const original = text.split('\n')
  const findings: ClaimFinding[] = []
  for (const rule of rules) {
    const re = new RegExp(
      rule.pattern.source,
      rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g'
    )
    for (const m of flat.matchAll(re)) {
      const start = m.index ?? 0
      const end = start + m[0].length
      const { text: sentence, offset } = sentenceAround(flat, start, end)
      const prefix = flat.slice(offset, start)
      if (NEGATION.test(prefix)) continue
      // A question ("Is SoftHSMv3 FIPS validated?") asserts nothing.
      if (sentence.endsWith('?')) continue
      if (rule.requiresSelfReference && !SELF_REFERENCE.test(sentence)) continue
      const line = lineAt(start)
      if (inlineAllowed(original, line)) continue
      if (allow.some((a) => a.file === file && sentence.includes(a.match))) continue
      findings.push({ file, line, rule: rule.id, match: m[0], sentence })
    }
  }
  return findings
}

/** Count of vector files backed by the public NIST ACVP-Server repository. */
export const GENERATED_COUNTS_PATH = path.join(
  REPO_ROOT,
  'src',
  'data',
  'validation',
  'validation-counts.generated.json'
)

/**
 * Count of vector files backed by the public NIST ACVP-Server repository.
 * Source of truth is the WS-B generated manifest counts
 * (src/data/validation/validation-counts.generated.json,
 * `nistReferenceSampleFileCount`, itself checked by gen:validation-counts:check);
 * the provenance scan is only a fallback for a checkout without it.
 */
export function countNistReferenceFiles(
  acvpDir: string = path.join(REPO_ROOT, 'src', 'data', 'acvp'),
  countsPath: string = GENERATED_COUNTS_PATH
): number {
  if (fs.existsSync(countsPath)) {
    const c = JSON.parse(fs.readFileSync(countsPath, 'utf8')) as {
      nistReferenceSampleFileCount?: number
    }
    if (typeof c.nistReferenceSampleFileCount === 'number') return c.nistReferenceSampleFileCount
  }
  return fs
    .readdirSync(acvpDir)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => {
      const j = JSON.parse(fs.readFileSync(path.join(acvpDir, f), 'utf8')) as {
        _provenance?: { producer?: string }
      }
      return j._provenance?.producer?.startsWith('NIST ACVP-Server') ?? false
    }).length
}

const NUMBER_WORDS: Record<string, number> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
}

/** Presentation drift: "<N> ... NIST ACVP-Server" must equal the live count. */
export function scanCountDrift(text: string, file: string, expected: number): ClaimFinding[] {
  // Tags become spaces so `<span class="c">13</span><b>NIST ACVP …` reads as
  // "13 NIST ACVP …"; the number may sit up to 8 words before "NIST" (as in
  // "Thirteen of the thirty vector files come from the NIST ACVP-Server
  // repository") and a bare "13 NIST / 7 standard KAT" table cell counts too.
  const { flat, lineAt } = normalise(text.replace(/<[^>\n]*>/g, (m) => ' '.repeat(m.length)))
  const re =
    /(?<![\w-])(?<!(?:Demo|[Ss]lide|[Ss]tep|Level|Layer|FIPS|SP|IR|§) )(\d{1,3}|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b((?:\s+[^\s\d|]+){0,8}?)\s+NIST(?:\s+ACVP(?:-Server)?\b|(?=\s+\/))/gi
  const out: ClaimFinding[] = []
  for (const m of flat.matchAll(re)) {
    const raw = m[1].toLowerCase()
    const n = /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw]
    if (n === expected) continue
    const start = m.index ?? 0
    out.push({
      file,
      line: lineAt(start),
      rule: 'reference-sample-count-drift',
      match: m[0],
      sentence: `says ${n}; the generated manifest counts (src/data/validation/validation-counts.generated.json) say ${expected} NIST ACVP-Server reference-sample files`,
    })
  }
  return out
}

/**
 * Workbench size (coordinator request 2026-09-24, plan A-5 / J-6): the deck and
 * README quote "N test groups/sections in M families". The source of truth is
 * the CATEGORIES table in useAcvpSuite.ts — M = its length, N = the sum of its
 * `groups`. Parsed statically (importing the hook would load React and both
 * WASM engines); a CATEGORIES table this parser cannot read is an error, never
 * a silent pass.
 */
export const WORKBENCH_SUITE_SOURCE = path.join(
  REPO_ROOT,
  'src',
  'components',
  'Playground',
  'hsm',
  'acvp',
  'useAcvpSuite.ts'
)

export interface WorkbenchGroups {
  families: number
  groups: number
  categories: Array<{ id: string; label: string; groups: number }>
}

export function countWorkbenchGroups(source: string = WORKBENCH_SUITE_SOURCE): WorkbenchGroups {
  const text = fs.readFileSync(source, 'utf8')
  const block = /export const CATEGORIES\b[^=]*=\s*\[([\s\S]*?)\n\]/.exec(text)
  if (!block) throw new Error(`countWorkbenchGroups: no CATEGORIES table in ${source}`)
  const categories = [
    ...block[1].matchAll(/\{\s*id:\s*'([^']+)',\s*label:\s*(['"])(.*?)\2,\s*groups:\s*(\d+)\s*\}/g),
  ].map((m) => ({ id: m[1], label: m[3], groups: Number(m[4]) }))
  const entries = (block[1].match(/\bid:/g) ?? []).length
  if (categories.length === 0 || categories.length !== entries)
    throw new Error(
      `countWorkbenchGroups: read ${categories.length} of ${entries} CATEGORIES entries in ${source} — update the parser`
    )
  return {
    families: categories.length,
    groups: categories.reduce((n, c) => n + c.groups, 0),
    categories,
  }
}

const COUNT_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ...NUMBER_WORDS,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
}
const COUNT = `(?<![\\w-])~?\\s*(\\d+|(?:thirty|forty|fifty|sixty)-(?:one|two|three|four|five|six|seven|eight|nine)|${Object.keys(COUNT_WORDS).join('|')})`
const parseCount = (raw: string): number => {
  const k = raw.toLowerCase()
  const [tens, unit] = k.split('-')
  if (unit !== undefined) return (COUNT_WORDS[tens] ?? NaN) + (COUNT_WORDS[unit] ?? NaN) // eslint-disable-line security/detect-object-injection
  return /^\d+$/.test(k) ? Number(k) : (COUNT_WORDS[k] ?? NaN) // eslint-disable-line security/detect-object-injection
}

/**
 * Presentation / docs drift: "N test groups" or "N test sections" must equal
 * the CATEGORIES group total, and on the same line "M (algorithm) families"
 * or "M categories" must equal the number of categories.
 */
export function scanWorkbenchCountDrift(
  text: string,
  file: string,
  expected: WorkbenchGroups
): ClaimFinding[] {
  const out: ClaimFinding[] = []
  // eslint-disable-next-line security/detect-non-literal-regexp
  const groupsRe = new RegExp(`${COUNT}\\s+(?:grouped\\s+)?test\\s+(?:groups|sections)\\b`, 'gi')
  // eslint-disable-next-line security/detect-non-literal-regexp
  const familiesRe = new RegExp(
    `${COUNT}\\s+(?:algorithm[- ](?:family\\s+)?)?(?:families|categories)\\b`,
    'gi'
  )
  text.split('\n').forEach((raw, i) => {
    const line = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    if (!/\btest\s+(?:groups|sections)\b/i.test(line)) return
    const src = 'src/components/Playground/hsm/acvp/useAcvpSuite.ts CATEGORIES'
    for (const m of line.matchAll(groupsRe)) {
      const n = parseCount(m[1])
      if (n === expected.groups) continue
      out.push({
        file,
        line: i + 1,
        rule: 'workbench-group-count-drift',
        match: m[0].trim(),
        sentence: `says ${n}; ${src} sums to ${expected.groups} test groups`,
      })
    }
    for (const m of line.matchAll(familiesRe)) {
      const n = parseCount(m[1])
      if (n === expected.families) continue
      out.push({
        file,
        line: i + 1,
        rule: 'workbench-family-count-drift',
        match: m[0].trim(),
        sentence: `says ${n}; ${src} has ${expected.families} families`,
      })
    }
  })
  return out
}

function loadAllowlist(): AllowEntry[] {
  if (!fs.existsSync(ALLOWLIST_PATH)) return []
  return JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8')) as AllowEntry[]
}

export function runAudit(extraPaths: string[] = []): {
  findings: ClaimFinding[]
  scanned: number
  nistReferenceFiles: number
  workbench: WorkbenchGroups | null
} {
  const allow = loadAllowlist()
  const files = [
    ...listFiles(path.join(REPO_ROOT, 'src')),
    ...ROOT_DOCS.map((d) => path.join(REPO_ROOT, d)).filter((p) => fs.existsSync(p)),
  ]
  const extraFiles = extraPaths.flatMap((p) => listFiles(path.resolve(p), path.resolve(p)))
  const nist = countNistReferenceFiles()
  const findings: ClaimFinding[] = []
  const rel = (p: string) => {
    const r = path.relative(REPO_ROOT, p)
    return r.startsWith('..') ? p : r.split(path.sep).join('/')
  }
  for (const f of files) findings.push(...scanText(fs.readFileSync(f, 'utf8'), rel(f), allow))
  const workbench = extraFiles.length ? countWorkbenchGroups() : null
  for (const f of extraFiles) {
    const text = fs.readFileSync(f, 'utf8')
    findings.push(...scanText(text, rel(f), allow))
    findings.push(...scanCountDrift(text, rel(f), nist))
    findings.push(...scanWorkbenchCountDrift(text, rel(f), workbench!))
  }
  return {
    findings,
    scanned: files.length + extraFiles.length,
    nistReferenceFiles: nist,
    workbench,
  }
}

function main(): void {
  const args = process.argv.slice(2)
  const wantJson = args.includes('--json')
  const extra = args.filter((a) => !a.startsWith('--'))
  for (const p of extra) {
    if (!fs.existsSync(p)) {
      console.error(`FAIL extra path does not exist: ${p}`)
      process.exit(1)
    }
  }
  const { findings, scanned, nistReferenceFiles, workbench } = runAudit(extra)
  if (wantJson) {
    process.stdout.write(JSON.stringify({ scanned, nistReferenceFiles, findings }, null, 2) + '\n')
    process.exit(findings.length > 0 ? 1 : 0)
  }
  if (findings.length === 0) {
    console.log(
      `PASS validation-claims — ${scanned} files scanned, no banned validation claims` +
        (extra.length
          ? ` (incl. ${extra.join(', ')}; ${nistReferenceFiles} NIST ACVP-Server files; ${workbench?.groups} test groups in ${workbench?.families} families)`
          : '')
    )
    process.exit(0)
  }
  console.log(`FAIL ${findings.length} banned validation claim(s):\n`)
  for (const f of findings) {
    console.log(`  ${f.file}:${f.line} [${f.rule}] "${f.match}"`)
    console.log(`      ${f.sentence.slice(0, 220)}`)
  }
  console.log(
    '\nFix the copy, negate it, or — only for a legitimate use — add `claims-lint-allow: <reason>`' +
      ' on the line or an entry in scripts/audit-validation-claims.allowlist.json.'
  )
  process.exit(1)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
