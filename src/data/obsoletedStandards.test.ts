// SPDX-License-Identifier: GPL-3.0-only
/**
 * No module may declare a standard the library records as obsoleted or expired.
 *
 * THE FAILURE THIS EXISTS FOR, found 2026-08-22. RFC 9846 obsoleted RFC 8446 in July
 * 2026 — "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446" in its own header. The
 * library had ALREADY recorded the supersession in RFC 8446's supersededBy column and
 * carried the RFC 9846 row. Meanwhile eight Learn modules still declared RFC 8446 and
 * zero declared RFC 9846, one of them asserting "TLS 1.3 (RFC 8446) is the latest
 * version of the Transport Layer Security protocol".
 *
 * The accuracy spot-check graded that exact claim SUPPORTED, because it checked it
 * against the cached RFC 8446 — which of course says it specifies TLS 1.3. No verdict
 * can catch this: the sampled document is the stale one. Only the library's own
 * status column knows, and nothing read it.
 *
 * THE BAR IS DISCLOSURE, NOT PROHIBITION. The first version banned declaring a stale row
 * outright and immediately flagged three modules that were doing it deliberately and
 * well: MLSGroupMessaging writes "`draft-ietf-mls-combiner-02` (expired, WGLC revival
 * pending)", TrustServicesPQC calls EU 910/2014 "eIDAS 1.0" alongside eIDAS 2.0, and
 * HybridCrypto says "IMPORTANT STATUS: ... EXPIRED on 2026-04-21 and was never adopted
 * as a LAMPS working-group document". Teaching a document's death is a legitimate reason
 * to cite it — banning that would have deleted three correct explanations to fix one
 * stale reference.
 *
 * So a module may declare a superseded document PROVIDED it tells the reader. That bar
 * still catches the case this was written for: not one of the eight modules declaring
 * RFC 8446 mentioned that it had been obsoleted, and one asserted the opposite.
 *
 * THE FIRST DISCLOSURE VERSION WAS A TEST THAT PASSED FOR THE WRONG REASON, twice, and
 * both ways are worth naming because they are easy to write again:
 *
 *   1. It searched for a status word anywhere in the module. A module is thousands of
 *      lines; "expired" appears in some unrelated sentence in most of them. Stripping
 *      HybridCrypto's chameleon disclosure entirely still passed.
 *   2. It searched source text INCLUDING comments — so the maintainer comment added
 *      alongside the fix ("RFC 9846 ... obsoletes it") satisfied the check by itself.
 *      Reverting tls-basics to declare RFC 8446 still passed.
 *
 * Both are fixed by tying the disclosure to the DOCUMENT: a status word must appear
 * within a bounded window of a mention of that specific document, in comment-free
 * reader-facing text. Verified by reverting each defect and watching it fail.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'

const MODULES = join(process.cwd(), 'src/components/PKILearning/modules')
/** Status text meaning "do not cite this as current". Substring, case-insensitive. */
const STALE = [/\bobsoleted\b/i, /\bexpired\b/i, /\bwithdrawn\b/i, /\bsuperseded\b/i]

interface Row {
  reference_id: string
  document_status: string
  status: string
}

/** Newest library_MMDDYYYY[_rN].csv by DATE then REVISION — never lexical order.
 *  `sorted(glob)[-1]` picks _r9 over _r11 because '1' < '9'; that bug cost a
 *  re-verification pass the same day this test was written. */
function latestLibraryCsv(): string {
  const dir = join(process.cwd(), 'src/data')
  const re = /^library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  const files = readdirSync(dir)
    .map((f) => ({ f, m: re.exec(f) }))
    .filter((x): x is { f: string; m: RegExpExecArray } => x.m !== null)
    .sort((a, b) => {
      const key = (m: RegExpExecArray) => [+m[3], +m[1], +m[2], +(m[4] ?? 0)]
      const [ay, am, ad, ar] = key(a.m)
      const [by, bm, bd, br] = key(b.m)
      return ay - by || am - bm || ad - bd || ar - br
    })
  if (files.length === 0) throw new Error('no library_*.csv in src/data')
  return join(dir, files[files.length - 1].f)
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Generic words in a reference_id that identify no particular document. */
const NOISE = new Set([
  'draft',
  'ietf',
  'lamps',
  'certs',
  'cert',
  'reg',
  'rfc',
  'nist',
  'fips',
  'etsi',
  'iso',
  'the',
  'and',
  'for',
  'version',
  'protocol',
  'security',
  'layer',
  'transport',
])

/**
 * Distinctive tokens to look for in prose. A reference_id and the way prose names the
 * same document rarely match exactly — EIDAS-REG-910-2014 is written "EU 910/2014",
 * draft-bonnell-lamps-chameleon-certs-07 is "chameleon certificates" — so match on the
 * parts that identify it rather than on the id string.
 */
function searchKeys(id: string): string[] {
  return [...new Set(id.split(/[^A-Za-z0-9]+/).filter((t) => t.length >= 4))].filter(
    (t) => !NOISE.has(t.toLowerCase())
  )
}

/** Reader-facing text only: every .ts/.tsx/.md in the module, tests excluded, comments
 *  stripped. Comments must NOT count — a maintainer note explaining the supersession is
 *  not the reader being told, and letting it count made this test pass on the exact
 *  defect it exists to catch. */
function readerFacingText(dir: string): string {
  let out = ''
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out += readerFacingText(full)
    } else if (/\.(ts|tsx|md)$/.test(entry.name) && !entry.name.includes('.test.')) {
      const raw = readFileSync(full, 'utf-8')
      out += entry.name.endsWith('.md') ? raw : stripComments(raw)
    }
  }
  return out
}

/** Blank out // and block comments, preserving length so windows stay meaningful. */
function stripComments(src: string): string {
  const out = src.split('')
  let i = 0
  let quote: string | null = null
  while (i < src.length) {
    const c = src[i]
    if (quote) {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === quote) quote = null
      i++
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      i++
      continue
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') {
        out[i] = ' '
        i++
      }
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2)
      const stop = end < 0 ? src.length : end + 2
      for (let k = i; k < stop; k++) if (out[k] !== '\n') out[k] = ' '
      i = stop
      continue
    }
    i++
  }
  return out.join('')
}

describe('modules that declare a superseded standard must say so', () => {
  it('every getStandard() id resolves to a library row that is still citable', () => {
    const rows = Papa.parse<Row>(readFileSync(latestLibraryCsv(), 'utf-8'), {
      header: true,
      skipEmptyLines: true,
    }).data
    expect(rows.length).toBeGreaterThan(100) // guard the guard: an empty CSV passes vacuously

    const staleIds = new Map<string, string>()
    for (const r of rows) {
      const id = (r.reference_id ?? '').trim()
      const st = (r.document_status ?? '').trim()
      if (id && STALE.some((re) => re.test(st))) staleIds.set(id, st)
    }
    expect(staleIds.size).toBeGreaterThan(0) // and guard that the corpus HAS stale rows

    // 'rewritten' and 'amended' added 2026-08-22: an EU regulation that is heavily
    // amended is not 'obsoleted' in the IETF sense, and the honest disclosure for the
    // 2014 capture of eIDAS is that Regulation (EU) 2024/1183 rewrote it — 39 'is
    // replaced by the following' instructions. Forcing RFC vocabulary onto a
    // regulation would make the page less accurate to satisfy a regex.
    const DISCLOSES =
      /obsolet|expir|withdrawn|supersed|no longer|replaced by|revival|deprecat|rewritten|amended/i
    /** How far from a mention of the document the status word may sit. */
    const WINDOW = 260

    const offenders: string[] = []
    for (const dir of readdirSync(MODULES)) {
      const content = join(MODULES, dir, 'content.ts')
      if (!existsSync(content)) continue
      const declared = [
        ...readFileSync(content, 'utf-8').matchAll(/getStandard\(\s*'([^']+)'\s*\)/g),
      ].map((m) => m[1])
      const stale = declared.filter((id) => staleIds.has(id))
      if (stale.length === 0) continue

      const prose = readerFacingText(join(MODULES, dir))
      for (const id of stale) {
        const keys = searchKeys(id)
        // Guard the guard: an id that yields no distinctive token would pass vacuously.
        expect(keys.length, `no search key derived from ${id}`).toBeGreaterThan(0)
        let disclosed = false
        for (const key of keys) {
          for (const m of prose.matchAll(new RegExp(escapeRe(key), 'gi'))) {
            const from = Math.max(0, m.index - WINDOW)
            if (DISCLOSES.test(prose.slice(from, m.index + key.length + WINDOW))) {
              disclosed = true
              break
            }
          }
          if (disclosed) break
        }
        if (!disclosed) {
          offenders.push(
            `${dir} declares ${id} — library says "${staleIds.get(id)}" — and no ` +
              `reader-facing text near it says so`
          )
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
