#!/usr/bin/env tsx
/**
 * scripts/audit-role-board-literals.ts
 *
 * CI gate against hand-typed facts drifting from their live source in the
 * role-home boards (`src/data/role_board_content_*.csv`).
 *
 * WHY THIS EXISTS. The 2026-08-23 accuracy audit of all 36 boards found 16
 * defects, and every one of them was the same shape: a fact copied by hand
 * from somewhere else in the codebase, which then drifted when the original
 * changed and nothing noticed —
 *
 *   - curious/break's CRQC arrival year was fixed to '2033 (2030-2036)' on
 *     the executive board on 2026-08-02, and left as the literal '~2032' on
 *     the curious board.
 *   - researcher/reproduce misattributed two SP 800-22 tests to SP 800-90B;
 *     workshopRegistry.tsx:410-417 had already corrected the exact same
 *     sentence, with the old wording preserved in a code comment.
 *   - developer/inventory advertised OpenSSL 3.6.2 while the Studio it
 *     described had shipped 3.6.3 for weeks.
 *   - executive/verify called the simulation's nine played phases "the
 *     published framework['s]" phases, while executive/roadmap on the same
 *     role correctly said eight.
 *   - Three boards independently guessed the /assess quick track was
 *     6/10/11 minutes and "8 questions" — the live track is 6 questions,
 *     3 minutes (assessFlowModel.ts's own TRACK_INFO.quick).
 *
 * None of that is caught by `audit-role-board-ctas.ts` (checks hrefs, not
 * prose) or `generate-role-board-content.ts --check` (checks the CSV against
 * its own generated output, not against the rest of the codebase). The
 * boards themselves carry the proof chip "Drift guards fail the build on
 * silent data change" — this is the gate that makes that true for board
 * copy, not just for the generator's own staleness.
 *
 * WHAT THIS CATCHES, AND WHAT IT DELIBERATELY DOES NOT. This is not a
 * general fact-checker — it cannot tell you a number is wrong, only that a
 * number of a shape known to have caused real defects was typed as a literal
 * instead of pulled from `{token}`. Four patterns, deliberately narrow (a
 * noisy gate gets disabled): a year near CRQC/arrival language, an OpenSSL
 * version string, an `SP 800-nnn` reference, and a count immediately before
 * "module/phase/operation/sector/parameter set". Widen the pattern set only
 * after a real defect of a new shape escapes it — see the 2026-08-23 audit
 * for the method.
 *
 * A hit is allowed two ways: it is inside a `{token}` placeholder (already
 * live), or it is listed in `role-board-literal-exceptions.json` with a
 * `source` and `last_reviewed` date — which this gate then holds to the same
 * 180-day freshness window `audit-role-board-content.ts` uses, so an
 * exception cannot become a permanent escape hatch.
 *
 * Modes:
 *   (default) human-readable report
 *   --json    machine-readable summary
 *
 * Run via:
 *   npm run audit:role-board-literals
 *   npm run audit:role-board-literals -- --json
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { latestDatedCsv, ROLE_BOARD_CONTENT_RE } from './lib/latestDatedCsv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const EXCEPTIONS_PATH = join(ROOT, 'src/data/role-board-literal-exceptions.json')

/** Same freshness threshold audit-role-board-content.ts and the CTA gate use. */
export const EXCEPTION_MAX_AGE_DAYS = 180

interface BoardRow {
  role_id: string
  variant_id: string
  slot: string
  slot_index: string
  content: string
  status: string
}

export interface LiteralException {
  /** The exact literal text this exception covers (substring match). */
  literal: string
  /** Why this literal is allowed to stay hand-typed rather than tokenised. */
  reason: string
  /** Where the literal's value actually comes from, so it can be re-checked. */
  source: string
  last_reviewed: string
}

export interface LiteralHit {
  role_id: string
  variant_id: string
  slot: string
  slot_index: string
  pattern: string
  match: string
  content: string
}

/**
 * The four patterns responsible for every literal-drift defect the
 * 2026-08-23 audit found. Each runs against `content` with its `{token}`
 * placeholders already stripped, so a token expansion can never trip its own
 * guard.
 */
const PATTERNS: { name: string; re: RegExp }[] = [
  {
    name: 'crqc-year',
    // A ~2028-2045 year within ~8 words of arrival/CRQC language — the class
    // '~2032' belonged to (real value: 2033, window 2030-2036).
    re: /\b(?:20(?:2[89]|3\d|4[0-5]))\b(?=(?:\W+\w+){0,8}\W*\b(?:arrives?|CRQC|machine|quantum computer)\b)|\b(?:arrives?|CRQC|machine|quantum computer)\b(?:\W+\w+){0,8}\W*\b(?:20(?:2[89]|3\d|4[0-5]))\b/gi,
  },
  {
    name: 'openssl-version',
    re: /\bOpenSSL\s+v?\d+\.\d+\.\d+\b/gi,
  },
  {
    name: 'sp-800-series',
    re: /\bSP\s?800-\d+[A-Za-z]?\b/gi,
  },
  {
    name: 'bare-count-before-noun',
    // A digit or number-word immediately before one of the nouns that has
    // actually drifted (phase count 8 vs 9; module count 23 vs 24; KMIP
    // operation count 66 vs 62; "22 sectors"). Excludes a digit preceded by
    // "FIPS " — "FIPS 205 parameter sets" is a standard number, not a count,
    // and the backfill run against the 2026-08-23 CSV showed it matching
    // "205" as if it were "how many parameter sets" (real count: 12,
    // non-adjacent to the noun). Left the false positive as the example
    // rather than deleting the note — the next pattern edit should re-run
    // the backfill and check for exactly this shape of miss.
    //
    // [ \t]+ not \s+: a plain \s+ crosses the newline the board-level scan
    // joins rows with, which bridged an unrelated pronoun ("...not a maths
    // one") into a sibling row whose label happened to be "Parameter set" —
    // a false positive the 2026-08-23 self-test caught. This pattern only
    // needs to fire within one row anyway; every real defect it targets
    // (module/phase/operation/sector counts) is a single hand-typed cell.
    re: /\b(?<!FIPS )(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[ \t]+(?:modules?|phases?|operations?|sectors?|parameter sets?)\b/gi,
  },
]

function loadRows(csvPath: string): BoardRow[] {
  const raw = readFileSync(csvPath, 'utf8')
  const parsed = Papa.parse<BoardRow>(raw, { header: true, skipEmptyLines: true })
  return parsed.data.filter((r) => r.status === 'active')
}

function loadExceptions(): LiteralException[] {
  if (!existsSync(EXCEPTIONS_PATH)) return []
  return JSON.parse(readFileSync(EXCEPTIONS_PATH, 'utf8')) as LiteralException[]
}

/** Strips `{token}` and `{token:arg1:arg2}` placeholders before pattern matching. */
function stripTokens(content: string): string {
  return content.replace(/\{[a-zA-Z0-9_]+(?::[^{}]*)?\}/g, ' ')
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return Infinity
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
}

/**
 * Scans per BOARD (role_id + variant_id), not per row.
 *
 * WHY. The CSV stores a label and its value as two separate rows
 * (`side_card_row_label` / `side_card_row_value`) — "And the machine arrives
 * in" and "~2032" are different `content` cells. A per-row proximity check
 * (year within N words of "arrives"/"CRQC") can never see across that split,
 * so it would have missed the exact defect this gate exists to catch. Fixed
 * 2026-08-23 after a self-test (scanning the literal '~2032' alone, with no
 * surrounding words in its own cell) confirmed the per-row version produced
 * zero hits. Concatenates every row's `content` for a board, in CSV order,
 * before matching — the same order a reader encounters label-then-value.
 */
export function scanRows(
  rows: BoardRow[],
  exceptions: LiteralException[]
): { hits: LiteralHit[]; staleExceptions: LiteralException[] } {
  const hits: LiteralHit[] = []
  const seen = new Set<string>()
  const exceptionLiterals = new Set(exceptions.map((e) => e.literal))
  const staleExceptions = exceptions.filter(
    (e) => daysSince(e.last_reviewed) > EXCEPTION_MAX_AGE_DAYS
  )

  const boards = new Map<string, BoardRow[]>()
  for (const row of rows) {
    const key = `${row.role_id} ${row.variant_id}`
    const list = boards.get(key)
    if (list) list.push(row)
    else boards.set(key, [row])
  }

  for (const [key, boardRows] of boards) {
    const [role_id, variant_id] = key.split(' ')
    let blob = ''
    const spans: { row: BoardRow; start: number; end: number }[] = []
    for (const row of boardRows) {
      const scanned = stripTokens(row.content ?? '')
      const start = blob.length
      blob += scanned + '\n'
      spans.push({ row, start, end: blob.length })
    }

    for (const { name, re } of PATTERNS) {
      re.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = re.exec(blob)) !== null) {
        const matchText = m[0]
        if (exceptionLiterals.has(matchText)) continue
        const matchStart = m.index
        const matchEnd = matchStart + matchText.length
        const overlapping = spans.filter((s) => matchStart < s.end && matchEnd > s.start)
        const targets = overlapping.length > 0 ? overlapping : [spans[spans.length - 1]]
        for (const s of targets) {
          const dedupeKey = `${role_id}|${variant_id}|${s.row.slot}|${s.row.slot_index}|${name}|${matchText}`
          if (seen.has(dedupeKey)) continue
          seen.add(dedupeKey)
          hits.push({
            role_id,
            variant_id,
            slot: s.row.slot,
            slot_index: s.row.slot_index,
            pattern: name,
            match: matchText,
            content: s.row.content,
          })
        }
      }
    }
  }
  return { hits, staleExceptions }
}

function main(): void {
  const jsonMode = process.argv.includes('--json')
  const dataDir = join(ROOT, 'src/data')
  const csvPath = latestDatedCsv(dataDir, ROLE_BOARD_CONTENT_RE)
  if (!csvPath) {
    console.error('No role_board_content_*.csv found.')
    process.exit(1)
  }

  const rows = loadRows(csvPath)
  const exceptions = loadExceptions()
  const { hits, staleExceptions } = scanRows(rows, exceptions)

  if (jsonMode) {
    console.log(JSON.stringify({ csvPath, hits, staleExceptions }, null, 2))
  } else {
    console.log(`Role-board literal-drift audit — ${csvPath.replace(ROOT + '/', '')}`)
    console.log(
      `${rows.length} active rows scanned against ${PATTERNS.length} patterns, ${exceptions.length} exceptions on file.\n`
    )

    if (hits.length === 0) {
      console.log('✓ No un-tokenised high-risk literals found.')
    } else {
      console.log(`✗ ${hits.length} un-tokenised literal(s) found:\n`)
      for (const h of hits) {
        console.log(`  [${h.pattern}] ${h.role_id},${h.variant_id},${h.slot},${h.slot_index}`)
        console.log(`    matched: "${h.match}"`)
        console.log(`    row:     ${h.content.slice(0, 100)}${h.content.length > 100 ? '…' : ''}\n`)
      }
      console.log(
        'Fix: replace the literal with a {token} backed by its live source, or add an\n' +
          'entry to src/data/role-board-literal-exceptions.json with a source and\n' +
          'last_reviewed date if the literal is deliberately hand-curated.'
      )
    }

    if (staleExceptions.length > 0) {
      console.log(
        `\n⚠ ${staleExceptions.length} exception(s) past the ${EXCEPTION_MAX_AGE_DAYS}-day freshness window:\n`
      )
      for (const e of staleExceptions) {
        console.log(`  "${e.literal}" — last_reviewed ${e.last_reviewed} (source: ${e.source})`)
      }
    }
  }

  if (hits.length > 0 || staleExceptions.length > 0) process.exit(1)
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  main()
}
