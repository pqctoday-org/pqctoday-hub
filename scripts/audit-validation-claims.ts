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
 *   - role confusions (WS-I Learn sweep): ACVP called a program or an issuer
 *     of certificates, .req/.rsp (legacy CAVS files) presented as ACVP,
 *     "legally enforced" attached to ACVP/KAT testing, and a KAT/sample pass
 *     presented as validated/certified. Some of these read the sentence with
 *     markup blanked out, or a window around the match (`contextChars`);
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
 * WS-B generated counts (src/data/validation/validation-counts.generated.json).
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
  /** Fire only when the sentence also matches this (e.g. names ACVP). */
  sentenceRequires?: RegExp
  /** Never fire when the sentence matches this (e.g. names the legacy CAVS tool). */
  sentenceExempt?: RegExp
  /**
   * Apply sentenceRequires/sentenceExempt to this many characters either side
   * of the match instead of the sentence (ACVP is often named one sentence
   * before the file format it is wrongly given).
   */
  contextChars?: number
  /**
   * Match against the text with HTML/JSX tags blanked out, so a sentence split
   * by markup (`files (<em>.req</em>) containing ...`) is read as one sentence.
   */
  stripTags?: boolean
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
  // ── ACVP / CAVP / CMVP role confusions (WS-I Learn sweep, 2026-09-24) ──────
  // ACVP is the Automated Cryptographic Validation *Protocol* (JSON over HTTPS,
  // draft-ietf-acvp-spec-01 §1, §6, §8), spoken by NIST's ACVTS. CAVP issues
  // algorithm validation certificates; CMVP validates modules to FIPS 140-3.
  {
    id: 'acvp-as-program',
    description:
      'ACVP described as a program ("Automated Cryptographic Validation Program", "ACVP program") — ACVP is a protocol; the program is CAVP',
    pattern:
      /\bAutomated Cryptographic Validation Program(?:me)?\b|\bACVP\s*\(\s*Cryptographic Algorithm Validation Program(?:me)?\s*\)|\bACVP (?:program(?:me)?|validation program(?:me)?)\b/i,
  },
  {
    id: 'acvp-as-certificate',
    description:
      'ACVP described as issuing a certificate/certification ("ACVP certificate", "ACVP re-certification", "ACVP issues validation IDs") — CAVP issues algorithm certificates',
    pattern:
      // Case-sensitive on "ACVP" so identifiers such as the 'acvp-cert' role id do not match.
      /\bACVP[- ](?:[Rr]e-?)?(?:[Cc]ertificates?|[Cc]erts?|[Cc]ertification|[Rr]ecertification)\b|\bACVP\b[^.!?]{0,40}?\b(?:grants|issues|awards)\b[^.!?]{0,40}?\b(?:certificates?|validation (?:IDs?|numbers?)|validations)\b/,
  },
  {
    id: 'req-rsp-as-acvp',
    description:
      '.req/.rsp files described as ACVP — those are the legacy CAVS tool files (e.g. SHAVS §6.2.1); ACVP exchanges JSON over HTTPS',
    pattern: /(?<![\w/])\.(?:req|rsp)\b/i,
    // ACVP named nearby, or the .req called JSON (it never was).
    sentenceRequires: /\bACVP\b|Automated Cryptographic Validation Protocol|\bJSON\b/i,
    sentenceExempt: /\bCAVS\b/,
    contextChars: 300,
    stripTags: true,
  },
  {
    id: 'legally-enforced-validation',
    description:
      '"legally enforced/required/mandated" attached to ACVP/CAVP/KAT testing — FIPS 140-3 applies to US federal agencies (§6 Applicability); ACVP is a test protocol, not a law',
    pattern: /\blegally (?:enforced|required|mandated|binding)\b/i,
    sentenceRequires:
      /\b(?:ACVP|ACVTS|CAVP|KATs?|known[- ]answer)\b|Automated Cryptographic Validation/i,
    stripTags: true,
  },
  {
    id: 'kat-equals-validation',
    description:
      'Passing KATs/sample vectors presented as being validated/certified — a KAT or public sample pass is test evidence, not a CAVP/CMVP validation',
    pattern:
      /\bpass(?:es|ed|ing)?\b[^.!?]{0,40}?\b(?:KATs?|known[- ]answer tests?|(?:reference |sample |test )?vectors?)\b[^.!?]{0,40}?\b(?:is|are|means|makes?|proves?)\b(?:(?!\b(?:not|never|no)\b)[^.!?]){0,20}?\b(?:(?:FIPS(?: 140-[23])?|CAVP|CMVP|NIST|ACVP)[- ])?(?:validated|certified)\b/i,
    stripTags: true,
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

/**
 * Blank out HTML/JSX tags (keeping length and newlines, so line numbers hold)
 * for rules that must read a sentence across inline markup.
 */
function stripMarkup(text: string): string {
  return text.replace(/<\/?[A-Za-z][^<>]*>/g, (m) => m.replace(/[^\n]/g, ' '))
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
  const plain = normalise(text)
  let untagged: ReturnType<typeof normalise> | null = null
  const original = text.split('\n')
  const findings: ClaimFinding[] = []
  for (const rule of rules) {
    if (rule.stripTags && !untagged) untagged = normalise(stripMarkup(text))
    const { flat, lineAt } = rule.stripTags && untagged ? untagged : plain
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
      const context = rule.contextChars
        ? flat.slice(Math.max(0, start - rule.contextChars), end + rule.contextChars)
        : sentence
      if (rule.sentenceRequires && !rule.sentenceRequires.test(context)) continue
      if (rule.sentenceExempt?.test(context)) continue
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

function loadAllowlist(): AllowEntry[] {
  if (!fs.existsSync(ALLOWLIST_PATH)) return []
  return JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8')) as AllowEntry[]
}

export function runAudit(extraPaths: string[] = []): {
  findings: ClaimFinding[]
  scanned: number
  nistReferenceFiles: number
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
  for (const f of extraFiles) {
    const text = fs.readFileSync(f, 'utf8')
    findings.push(...scanText(text, rel(f), allow))
    findings.push(...scanCountDrift(text, rel(f), nist))
  }
  return { findings, scanned: files.length + extraFiles.length, nistReferenceFiles: nist }
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
  const { findings, scanned, nistReferenceFiles } = runAudit(extra)
  if (wantJson) {
    process.stdout.write(JSON.stringify({ scanned, nistReferenceFiles, findings }, null, 2) + '\n')
    process.exit(findings.length > 0 ? 1 : 0)
  }
  if (findings.length === 0) {
    console.log(
      `PASS validation-claims — ${scanned} files scanned, no banned validation claims` +
        (extra.length
          ? ` (incl. ${extra.join(', ')}; ${nistReferenceFiles} NIST ACVP-Server files)`
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
