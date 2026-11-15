// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Guard: no shipped source text presents a sunset date as a mandatory CSWP.39
 * (or NIST) requirement. CSWP 39-upd1 §4.6 describes the crypto-gateway
 * architecture and does not prescribe a sunset date; a sunset date is a Hub
 * suggestion. Scans non-test TypeScript under src/ as whitespace-normalised
 * text, so a sentence wrapped across lines is still matched.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(__dirname, '..', '..')

// A line that makes a sunset date mandatory, required, or must-carry.
const MANDATORY_SUNSET = [
  /mandatory[^\n]{0,40}sunset/gi,
  /sunset[^\n]{0,40}\bmandatory\b/gi,
  /requires?\s+(a|an|the)?\s*sunset/gi,
  /sunset[^\n]{0,30}\b(is|are)\s+required\b/gi,
  /must\s+carry\s+a\s+sunset/gi,
]

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'archive' || name === 'node_modules') continue
      sourceFiles(full, out)
      continue
    }
    if (!/\.tsx?$/.test(name)) continue
    if (/\.(test|local\.test|stories)\.tsx?$/.test(name)) continue
    out.push(full)
  }
  return out
}

/** A whole-line comment: its text is the developer's, not a reader's. */
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/

/**
 * Mandatory-sunset sentences in one source file, as `line: snippet`. Comment
 * lines are dropped, the rest is joined as whitespace-normalised text, and each
 * match is mapped back to the line where it starts.
 */
function mandatorySunsetOffenders(source: string): string[] {
  const starts: number[] = []
  const lineNumbers: number[] = []
  const pieces: string[] = []
  let length = 0
  source.split('\n').forEach((line, i) => {
    if (COMMENT_LINE.test(line)) return
    const text = line.replace(/\s+/g, ' ').trim()
    if (!text) return
    starts.push(length)
    lineNumbers.push(i + 1)
    pieces.push(text)
    length += text.length + 1
  })
  const joined = pieces.join(' ')
  const lineAt = (index: number): number => {
    let k = 0
    while (k + 1 < starts.length && starts[k + 1] <= index) k++
    return lineNumbers[k]
  }
  const found: string[] = []
  for (const re of MANDATORY_SUNSET) {
    for (const m of joined.matchAll(re)) {
      found.push(`${lineAt(m.index ?? 0)}: ${m[0].slice(0, 160)}`)
    }
  }
  return found
}

describe('CSWP.39 sunset attribution guard', () => {
  it('flags a mandatory-sunset sentence that is wrapped across source lines', () => {
    const wrapped = [
      'export const COPY = (',
      '  <p>',
      '    Mitigation gateways carry',
      '    mandatory',
      '    sunset dates for every key.',
      '  </p>',
      ')',
    ].join('\n')
    expect(mandatorySunsetOffenders(wrapped)).toHaveLength(1)
  })

  it('ignores a mandatory-sunset phrase that only appears in a comment', () => {
    const commented = [
      '// Earlier copy said mandatory sunset dates; this was removed.',
      '/**',
      ' * a mandatory',
      ' * sunset dates note',
      ' */',
      'export const ok = 1',
    ].join('\n')
    expect(mandatorySunsetOffenders(commented)).toEqual([])
  })

  it('no non-test source makes a sunset date mandatory', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      for (const found of mandatorySunsetOffenders(readFileSync(file, 'utf8'))) {
        offenders.push(`${file.slice(SRC.length)}:${found}`)
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it('the Command Center ops tagline no longer carries a sunset claim', () => {
    const personaConfig = readFileSync(join(SRC, 'data', 'personaConfig.ts'), 'utf8')
    expect(personaConfig).not.toMatch(/Mitigation gateways carry mandatory sunset/)
  })
})
