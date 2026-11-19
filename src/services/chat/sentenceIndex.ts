// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Stable, deterministic sentence index over a retrieved chunk's content.
 *
 * The local prompt shows each chunk as numbered sentences and the model cites
 * "<chunkId>#<n>"; verification resolves the same reference with the same
 * splitter, so a citation is exact by construction and no model-copied text has
 * to match the source character for character.
 *
 * Rules (the splitter must never change without bumping every stored ref):
 *   1. Each non-empty line is a unit. Corpus chunks are mostly "Label: value"
 *      lines, so a line is the natural smallest quotable unit.
 *   2. A line is split further after `.`, `!` or `?` when whitespace and then an
 *      upper-case letter, digit, quote or opening bracket follows, unless the
 *      word before the full stop is a known abbreviation or a single capital
 *      initial.
 *   3. Rule lines made only of `-`, `=`, `_` or `*`, and blank lines, are skipped.
 * Sentences are numbered from 1.
 */
import type { RAGChunk } from '@/types/ChatTypes'

const ABBREVIATIONS = new Set([
  'e.g',
  'i.e',
  'etc',
  'vs',
  'cf',
  'approx',
  'no',
  'fig',
  'eq',
  'sec',
  'dr',
  'mr',
  'mrs',
  'ms',
  'inc',
  'ltd',
  'co',
  'corp',
  'al',
  'st',
  'ca',
])

const BOUNDARY = /([.!?])(["')\]]*)\s+(?=["'([]?[A-Z0-9])/g

function isRuleLine(line: string): boolean {
  return /^[-=_*\s]{3,}$/.test(line)
}

function splitLine(line: string): string[] {
  const out: string[] = []
  let start = 0
  BOUNDARY.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = BOUNDARY.exec(line)) !== null) {
    const end = match.index + match[1].length + match[2].length
    const head = line.slice(start, match.index)
    const lastWord = (head.match(/([A-Za-z.]+)$/)?.[1] ?? '').toLowerCase()
    const isAbbreviation =
      match[1] === '.' &&
      (ABBREVIATIONS.has(lastWord.replace(/\.$/, '')) || /^[a-z]$/.test(lastWord))
    if (isAbbreviation) continue
    const piece = line.slice(start, end).trim()
    if (piece) out.push(piece)
    start = match.index + match[0].length
  }
  const tail = line.slice(start).trim()
  if (tail) out.push(tail)
  return out
}

/** Split text into the numbered units (index 0 is sentence 1). */
export function splitSentences(text: string): string[] {
  const sentences: string[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || isRuleLine(line)) continue
    sentences.push(...splitLine(line))
  }
  return sentences
}

/** The citeable sentences of a chunk (its content; the title is not numbered). */
export function chunkSentences(chunk: Pick<RAGChunk, 'content'>): string[] {
  return splitSentences(chunk.content)
}

/**
 * Render a chunk body as "[n] sentence" lines for the prompt. Whole sentences
 * only; the marker characters count toward `maxChars`, so numbering is paid for
 * inside the existing per-chunk budget. The first sentence is always shown (cut
 * to `maxChars`, as the unnumbered prompt already cuts long content).
 */
export function formatNumberedSentences(
  chunk: Pick<RAGChunk, 'content'>,
  maxChars = Infinity
): string {
  const lines: string[] = []
  let used = 0
  chunkSentences(chunk).forEach((sentence, index) => {
    const line = `[${index + 1}] ${sentence}`
    const cost = line.length + (lines.length > 0 ? 1 : 0)
    if (lines.length === 0) {
      lines.push(line.length > maxChars ? line.slice(0, maxChars).trimEnd() : line)
      used = lines[0].length
      return
    }
    if (used + cost > maxChars) return
    // Numbers must stay contiguous from 1 so a shown "[n]" is never skipped past.
    if (lines.length !== index) return
    lines.push(line)
    used += cost
  })
  return lines.join('\n')
}

export interface ParsedEvidenceRef {
  chunkId: string
  /** 1-based sentence number. */
  n: number
}

/** Parse "<chunkId>#<n>". The id may itself contain '#'; the last one splits. */
export function parseEvidenceRef(ref: string): ParsedEvidenceRef | null {
  const text = ref.trim()
  const hash = text.lastIndexOf('#')
  if (hash <= 0) return null
  const num = text.slice(hash + 1).trim()
  if (!/^\d{1,4}$/.test(num)) return null
  const n = Number(num)
  const chunkId = text.slice(0, hash).trim()
  if (!chunkId || n < 1) return null
  return { chunkId, n }
}

export type RefResolution =
  | { ok: true; chunkId: string; sentence: string }
  | { ok: false; reason: 'malformed-ref' | 'unknown-chunk' | 'sentence-not-found' }

export function resolveEvidenceRef(ref: string, chunkById: Map<string, RAGChunk>): RefResolution {
  const parsed = parseEvidenceRef(ref)
  if (!parsed) return { ok: false, reason: 'malformed-ref' }
  const chunk = chunkById.get(parsed.chunkId)
  if (!chunk) return { ok: false, reason: 'unknown-chunk' }
  const sentence = chunkSentences(chunk)[parsed.n - 1]
  if (sentence === undefined) return { ok: false, reason: 'sentence-not-found' }
  return { ok: true, chunkId: chunk.id, sentence }
}
