// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The scanner behind formatLint.test.ts (UX grammar v2.1, section 2.4, "Lint (CI)").
 *
 * It parses every source file under src/ and looks only at text a reader can see: string
 * literals, template literals (each `${...}` stands in as "1", so a computed "${n} bytes"
 * is caught), JSX text, and JSX attribute strings. Comments, imports, type names and
 * `typeof x === '...'` checks are never looked at.
 *
 * Two kinds of finding:
 *   - text rules: the old notations (`32 bytes`, `32B`, `KB`, `[48ms]`, `-$1`, `3yr`,
 *     `11/26/2026`, `NaN`, `undefined`, an ISO timestamp in JSX text);
 *   - call rules: a date or time built by hand (`toLocaleDateString`, `toLocaleTimeString`,
 *     `toDateString`, `Intl.DateTimeFormat`, a date-shaped `toLocaleString`) outside the
 *     format module.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type RuleId =
  | 'bytes'
  | 'byteCount'
  | 'KB'
  | 'bracketMs'
  | 'minusMoney'
  | 'yrMo'
  | 'slashDate'
  | 'isoTimestamp'
  | 'NaN'
  | 'undefined'
  | 'handBuiltDate'

export interface Finding {
  file: string
  line: number
  rule: RuleId
  text: string
}

/** What to use instead, shown in the failure message. */
export const RULE_FIX: Record<RuleId, string> = {
  bytes: 'formatBytes(n) from @/lib/format: "7,856 B", not "7856 bytes"',
  byteCount: 'formatBytes(n) from @/lib/format: "32 B", not "32B"',
  KB: 'formatBytes(n, { kib: true }) from @/lib/format: "7,856 B (7.7 KiB)", not "KB"',
  bracketMs: 'formatDuration(ms, "ms") from @/lib/format: "48 ms", not "[48ms]"',
  minusMoney: 'formatMoney(v) from @/lib/format: "−$1.5M" with a true minus, not "-$"',
  yrMo: 'formatDuration(v, "yr" | "mo") from @/lib/format: "3 yr", "50 mo", not "3yr"',
  slashDate: 'formatDate(d) from @/lib/format: "26 Nov 2026", not "11/26/2026"',
  isoTimestamp: 'formatDate / formatDateTime from @/lib/format: ISO stays in files, CSV and URLs',
  NaN: 'formatNumberOrMissing(v) from @/lib/format: a number or one of the four missing labels',
  undefined: 'formatNumberOrMissing(v) from @/lib/format, or a plain word: never "undefined"',
  handBuiltDate:
    'formatDate / formatDateTime / formatSessionTime from @/lib/format, never a hand-built date',
}

interface TextRule {
  id: RuleId
  re: RegExp
  /** Only look at JSX text and JSX string attributes (not every string in a .ts file). */
  jsxOnly?: boolean
  /** Skip a literal that has no whitespace and looks like an identifier ("dev-6mo-1"). */
  skipIdentifiers?: boolean
}

// The lookbehinds keep out hex ("0x1B"), money ("$7.1B", "USD 12.1B"), Tailwind classes
// ("duration-[2000ms]"), ids ("dev-6mo-1") and URL paths.
const TEXT_RULES: TextRule[] = [
  { id: 'bytes', re: /(?<![\w.])\d[\d,]*(?:\.\d+)? bytes\b/ },
  { id: 'byteCount', re: /(?<![\w$.])\d[\d,]*B\b/ },
  { id: 'KB', re: /\bKB\b/ },
  { id: 'bracketMs', re: /(?<![-\w])\[\d+ms\]/ },
  { id: 'minusMoney', re: /(?<![\w$])-\$\d/ },
  { id: 'yrMo', re: /(?<![a-zA-Z_])\d+(?:yr|mo)\b/, skipIdentifiers: true },
  { id: 'slashDate', re: /(?<![\w/.-])\d{1,2}\/\d{1,2}\/\d{4}\b/ },
  { id: 'isoTimestamp', re: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, jsxOnly: true },
  { id: 'NaN', re: /\bNaN\b/ },
  { id: 'undefined', re: /\bundefined\b/ },
]

const HAND_BUILT_METHODS = new Set([
  'toLocaleDateString',
  'toLocaleTimeString',
  'toDateString',
  'toTimeString',
])
const DATE_OPTION_KEYS = /\b(?:year|month|day|hour|minute|second|weekday|dateStyle|timeStyle)\b/
const DATE_LIKE_RECEIVER =
  /(?:^|[^A-Za-z])(?:date|time|timestamp|now)(?![a-z])|[a-z](?:Date|Time|Timestamp|At)\b|new Date/

/** Folders and files the lint does not read. */
const SKIP = [
  /\.(test|spec)\.(ts|tsx)$/,
  /\.d\.ts$/,
  /^src\/lib\/format\//, // the module itself
  /^src\/test\//,
  /^src\/data\/generated\//, // derived from sources that are scanned
]

/**
 * Pending another session's patch (owner decision, 4.229.0): the Assistant folders are
 * edited elsewhere right now. Remove an entry once its patch has landed and let the scan
 * read the folder.
 */
export const PENDING_ELSEWHERE = [/^src\/components\/Assistant\//, /^src\/services\/assistant\//]

function listSourceFiles(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue
        walk(full)
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        out.push(path.relative(root, full).split(path.sep).join('/'))
      }
    }
  }
  walk(path.join(root, 'src'))
  return out.sort()
}

function isIdentifierLike(text: string): boolean {
  return /^[\w.:/#@-]+$/.test(text)
}

function skipLiteral(node: ts.Node): boolean {
  const p = node.parent
  if (!p) return false
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true
  if (ts.isLiteralTypeNode(p) || ts.isImportTypeNode(p)) return true
  if (ts.isCaseClause(p)) return true
  if (ts.isExternalModuleReference(p)) return true
  // typeof x === 'undefined'
  if (
    ts.isBinaryExpression(p) &&
    (ts.isTypeOfExpression(p.left) || ts.isTypeOfExpression(p.right))
  ) {
    return true
  }
  // Property names ({ 'undefined': 1 }) are not rendered text.
  if (ts.isPropertyAssignment(p) && p.name === node) return true
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true
  return false
}

export interface ScanOptions {
  root: string
  /** Include the folders in PENDING_ELSEWHERE (used to report what is waiting on the other patch). */
  includePending?: boolean
}

export function scanSource(options: ScanOptions): Finding[] {
  const findings: Finding[] = []
  for (const file of listSourceFiles(options.root)) {
    if (SKIP.some((re) => re.test(file))) continue
    if (!options.includePending && PENDING_ELSEWHERE.some((re) => re.test(file))) continue
    const source = fs.readFileSync(path.join(options.root, file), 'utf8')
    const sf = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )
    const lineOf = (node: ts.Node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
    const seen = new Set<string>()

    const checkText = (node: ts.Node, text: string, jsx: boolean) => {
      for (const rule of TEXT_RULES) {
        if (rule.jsxOnly && !jsx) continue
        if (rule.skipIdentifiers && isIdentifierLike(text.trim())) continue
        if (!rule.re.test(text)) continue
        const key = `${rule.id}:${node.pos}`
        if (seen.has(key)) continue
        seen.add(key)
        findings.push({
          file,
          line: lineOf(node),
          rule: rule.id,
          text: text.replace(/\s+/g, ' ').trim().slice(0, 100),
        })
      }
    }

    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return
      if (ts.isTypeNode(node) && !ts.isTemplateLiteralTypeNode(node)) return

      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        if (!skipLiteral(node)) checkText(node, node.text, ts.isJsxAttribute(node.parent))
      } else if (ts.isTemplateExpression(node)) {
        let text = node.head.text
        for (const span of node.templateSpans) text += `1${span.literal.text}`
        checkText(node, text, false)
      } else if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
        // JSX children read as one run: "{n} bytes" becomes "1 bytes".
        let text = ''
        for (const child of node.children) {
          text += ts.isJsxText(child) ? child.text : ts.isJsxExpression(child) ? '1' : ' '
        }
        checkText(node, text, true)
      } else if (ts.isCallExpression(node)) {
        const callee = node.expression
        if (ts.isPropertyAccessExpression(callee)) {
          const name = callee.name.text
          if (HAND_BUILT_METHODS.has(name)) {
            findings.push({
              file,
              line: lineOf(node),
              rule: 'handBuiltDate',
              text: callee.getText(sf).slice(0, 100),
            })
          } else if (name === 'toLocaleString') {
            const optionsText = node.arguments.map((a) => a.getText(sf)).join(' ')
            const receiver = callee.expression.getText(sf)
            const dateOptions = DATE_OPTION_KEYS.test(optionsText)
            const dateReceiver = node.arguments.length === 0 && DATE_LIKE_RECEIVER.test(receiver)
            if (dateOptions || dateReceiver) {
              findings.push({
                file,
                line: lineOf(node),
                rule: 'handBuiltDate',
                text: `${receiver.slice(0, 60)}.toLocaleString(...)`,
              })
            }
          }
        }
      } else if (
        ts.isPropertyAccessExpression(node) &&
        node.getText(sf) === 'Intl.DateTimeFormat'
      ) {
        findings.push({
          file,
          line: lineOf(node),
          rule: 'handBuiltDate',
          text: 'Intl.DateTimeFormat',
        })
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
  return findings
}

/** { file: { rule: count } } */
export type Baseline = Record<string, Partial<Record<RuleId, number>>>

export function countByFileAndRule(findings: Finding[]): Baseline {
  const out: Baseline = {}
  for (const f of findings) {
    const entry = (out[f.file] ??= {})
    entry[f.rule] = (entry[f.rule] ?? 0) + 1
  }
  return out
}
