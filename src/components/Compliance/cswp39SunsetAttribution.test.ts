// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Guard: no shipped source text presents a sunset date as a mandatory CSWP.39
 * (or NIST) requirement. CSWP 39-upd1 §4.6 describes the crypto-gateway
 * architecture and does not prescribe a sunset date; a sunset date is a Hub
 * suggestion. Scans non-test TypeScript under src/ line by line.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(__dirname, '..', '..')

// A line that makes a sunset date mandatory, required, or must-carry.
const MANDATORY_SUNSET = [
  /mandatory[^\n]{0,40}sunset/i,
  /sunset[^\n]{0,40}\bmandatory\b/i,
  /requires?\s+(a|an|the)?\s*sunset/i,
  /sunset[^\n]{0,30}\b(is|are)\s+required\b/i,
  /must\s+carry\s+a\s+sunset/i,
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

describe('CSWP.39 sunset attribution guard', () => {
  it('no non-test source line makes a sunset date mandatory', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (!/sunset/i.test(line)) return
        // Code comments explain removals (e.g. "'Mandatory sunset date' was
        // dropped"); the rule is about text a reader sees.
        if (/^\s*(\/\/|\/\*|\*)/.test(line)) return
        if (MANDATORY_SUNSET.some((re) => re.test(line))) {
          offenders.push(`${file.slice(SRC.length)}:${i + 1}: ${line.trim().slice(0, 160)}`)
        }
      })
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it('the Command Center ops tagline no longer carries a sunset claim', () => {
    const personaConfig = readFileSync(join(SRC, 'data', 'personaConfig.ts'), 'utf8')
    expect(personaConfig).not.toMatch(/Mitigation gateways carry mandatory sunset/)
  })
})
