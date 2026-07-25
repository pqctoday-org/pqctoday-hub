// SPDX-License-Identifier: GPL-3.0-only
//
// section61CitationDrift.local.test.ts — §6.1.x citation drift guard
// (2026-07-24 CSD02 migration). Hub-side counterpart to
// pqctoday-hsm/kmip/tests/section61_citation_drift.rs — same algorithm,
// same rationale, ported so hub's own `§6.1.N` citations (Learn lessons,
// glossary, op templates, the CACP guide) get the same protection.
//
// CSD02 inserted `Decapsulate`/`Encapsulate` early in the §6.1.x operation
// numbering, shifting every operation section from §6.1.15 onward by one or
// two relative to CSD01 — the baseline this codebase's citations were
// originally written against. Those were re-based onto CSD02 numbering in
// one pass, matched by operation name rather than blind number substitution:
// a citation was only rewritten when the CSD01 name for its OWN cited number
// appeared in the surrounding 3-line block — a much weaker "any known op
// name within N characters" heuristic was tried first and rejected after it
// produced real false positives (e.g. matching "Ping" inside "Key
// Wrapping", or the ordinary English word "hash" in "padding/hash" near an
// unrelated §6.1.61 Signature Verify citation).
//
// This test re-runs that exact detection rule going forward. It
// intentionally does NOT try to validate every citation in the codebase —
// narrower and reliable beats broad and noisy.
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo dir */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { describe, it, expect } from 'vitest'

interface Section61Headings {
  csd01_operations: Record<string, string>
  csd02_operations: Record<string, string>
}

const REPO_ROOT = join(__dirname, '../../..')

function norm(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, '')
}

function loadHeadings(): Section61Headings {
  const p = join(REPO_ROOT, 'public/kmip-corpus/section61-headings.json')
  return JSON.parse(readFileSync(p, 'utf8')) as Section61Headings
}

/** CSD01 §6.1.x number (bare digits) -> name, ONLY for operations CSD02
 * actually renumbered — derived by diffing the two checked-in tables, never
 * hand-transcribed (a hand-transcription of this exact table into Rust
 * during the migration silently dropped one entry and shifted 43 subsequent
 * entries by one position). */
function csd01NamesWhereNumberShifted(h: Section61Headings): Map<string, string> {
  const out = new Map<string, string>()
  for (const [num, name] of Object.entries(h.csd01_operations)) {
    if (h.csd02_operations[num] !== name) {
      out.set(num.split('.').pop()!, name)
    }
  }
  return out
}

function csd02NumberForName(h: Section61Headings): Map<string, string> {
  const out = new Map<string, string>()
  for (const [num, name] of Object.entries(h.csd02_operations)) {
    out.set(norm(name), num.split('.').pop()!)
  }
  return out
}

/** Every word-boundary-safe occurrence of `name` in `text`, as
 * [normalizedStart, normalizedEnd) index pairs into the alphanumeric-only
 * character stream — not merely a substring of a longer identifier ("Get"
 * must not match inside "GetAttributeList"). */
function wholeNameOccurrences(text: string, name: string): Array<[number, number]> {
  const target = norm(name)
  if (!target) return []
  const mapped: Array<{ ch: string; byteIdx: number }> = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (/[a-zA-Z0-9]/.test(c)) mapped.push({ ch: c.toLowerCase(), byteIdx: i })
  }
  const normChars = mapped.map((m) => m.ch).join('')
  const targetLower = target.toLowerCase()
  const hits: Array<[number, number]> = []
  let searchFrom = 0
  for (;;) {
    const idx = normChars.indexOf(targetLower, searchFrom)
    if (idx === -1) break
    const end = idx + targetLower.length - 1
    const beforeOk = idx === 0 || !/[a-zA-Z0-9]/.test(text[mapped[idx].byteIdx - 1] ?? '')
    const afterOk =
      end + 1 === mapped.length || !/[a-zA-Z0-9]/.test(text[mapped[end].byteIdx + 1] ?? '')
    if (beforeOk && afterOk) hits.push([idx, idx + targetLower.length])
    searchFrom = idx + 1
  }
  return hits
}

/** `true` if `name` appears in `text` as a whole word/phrase AND that
 * occurrence isn't actually the leading words of a DIFFERENT, longer known
 * operation name starting at the same position — "Query" is a real whole
 * word inside "Query Asynchronous Requests" too, but a §6.1.N citation next
 * to that phrase means Query Asynchronous Requests, not bare Query. */
function containsWholeName(text: string, name: string, otherNames: string[]): boolean {
  const hits = wholeNameOccurrences(text, name)
  for (const [start, end] of hits) {
    const shadowed = otherNames.some((other) => {
      if (other === name || other.length <= name.length) return false
      return wholeNameOccurrences(text, other).some(([os, oe]) => os === start && oe > end)
    })
    if (!shadowed) return true
  }
  return false
}

function walkFiles(dir: string, exts: string[], excludes: Set<string>, out: string[]): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.startsWith('.') || excludes.has(entry)) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walkFiles(full, exts, excludes, out)
    } else if (exts.includes(extname(entry))) {
      out.push(full)
    }
  }
}

describe('§6.1.x citation drift guard (2026-07-24 CSD02 migration)', () => {
  it('no citation in src/ still uses CSD01 numbering for a renumbered operation', () => {
    const headings = loadHeadings()
    expect(Object.keys(headings.csd01_operations)).toHaveLength(62)
    expect(Object.keys(headings.csd02_operations)).toHaveLength(64)
    const csd01 = csd01NamesWhereNumberShifted(headings)
    const csd02Num = csd02NumberForName(headings)
    const allCsd01Names = [...csd01.values()]

    const files: string[] = []
    walkFiles(join(REPO_ROOT, 'src'), ['.ts', '.tsx'], new Set(['node_modules']), files)
    expect(files.length).toBeGreaterThan(0)

    const violations: string[] = []
    const citeRe = /§6\.1\.(\d+)/g

    const selfPath = join(__dirname, 'section61CitationDrift.local.test.ts')
    for (const path of files) {
      if (path === selfPath) continue // this file's own doc comment cites §6.1.61 as a worked example
      const text = readFileSync(path, 'utf8')
      const lines = text.split('\n')
      const lineStarts: number[] = [0]
      for (const l of lines) lineStarts.push(lineStarts[lineStarts.length - 1] + l.length + 1)

      const lineIndexForOffset = (off: number): number => {
        let lo = 0
        let hi = lines.length - 1
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2)
          if (lineStarts[mid] <= off) lo = mid
          else hi = mid - 1
        }
        return lo
      }

      let m: RegExpExecArray | null
      citeRe.lastIndex = 0
      while ((m = citeRe.exec(text)) !== null) {
        const num = m[1]
        const oldName = csd01.get(num)
        if (!oldName) continue
        const li = lineIndexForOffset(m.index)
        const blockLo = Math.max(0, li - 1)
        const blockHi = Math.min(lines.length, li + 2)
        const block = lines.slice(blockLo, blockHi).join('\n')
        if (containsWholeName(block, oldName, allCsd01Names)) {
          const realNum = csd02Num.get(norm(oldName))
          if (realNum && realNum !== num) {
            const ctxStart = Math.max(0, m.index - 60)
            const ctxEnd = Math.min(text.length, m.index + m[0].length + 60)
            violations.push(
              `${path.replace(REPO_ROOT + '/', '')}: §6.1.${num} '${oldName}' is CSD01 numbering — ` +
                `CSD02 renumbered it to §6.1.${realNum} — context: ${JSON.stringify(
                  text.slice(ctxStart, ctxEnd).replace(/\n/g, ' ')
                )}`
            )
          }
        }
      }
    }

    expect(
      violations,
      `found ${violations.length} §6.1.x citation(s) still using CSD01 numbering:\n${violations.join('\n')}`
    ).toHaveLength(0)
  })
})
