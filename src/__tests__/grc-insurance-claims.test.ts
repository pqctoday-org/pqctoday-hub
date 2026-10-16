// SPDX-License-Identifier: GPL-3.0-only
/**
 * GRC insurance and procurement claims (GRC journey audit, 15 Oct 2026).
 *
 * Pins three corrections so the wording cannot drift back:
 *  - no "underwriters now/already price/ask" claim: no insurer's quantum-specific
 *    wording was found, so the reader is sent to their broker instead;
 *  - no "must mandate … CBOM": asking vendors for a CBOM is a procurement control
 *    an organization chooses, not an external mandate;
 *  - the Lloyd's Y5258 bulletin is never described as a quantum exclusion clause
 *    (it is the 2019 affirm-or-exclude cyber cover rule).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import coverage from '@/data/actuarial/coverageGapMatrix.json'

const ROOT = join(__dirname, '..')
const MODULES = join(ROOT, 'components/PKILearning/modules')

const FILES = [
  join(MODULES, 'PqcGrc/components/Introduction.tsx'),
  join(MODULES, 'PqcGrc/data/grcData.ts'),
  join(MODULES, 'PqcGrc/curious-summary.md'),
  join(MODULES, 'PqcGrc/rag-summary.md'),
  join(MODULES, 'VendorRisk/curious-summary.md'),
  join(ROOT, 'components/BusinessCenter/sections/CyberInsuranceLensSection.tsx'),
]

const BANNED: { pattern: RegExp; why: string }[] = [
  {
    pattern: /(underwriters|insurers)[^.]{0,60}(now|already) (ask|price|pricing)/i,
    why: 'unsourced claim about what insurers do — send the reader to their broker',
  },
  {
    pattern: /must mandate[^.]{0,40}CBOM/i,
    why: 'a CBOM request is a procurement control, not an external mandate',
  },
  {
    pattern: /Y5258[^.]{0,40}quantum/i,
    why: "Lloyd's Y5258 is the 2019 affirm-or-exclude cyber cover rule, not a quantum clause",
  },
]

describe('GRC insurance and procurement claims', () => {
  for (const file of FILES) {
    const text = readFileSync(file, 'utf8').replace(/\s+/g, ' ')
    for (const { pattern, why } of BANNED) {
      it(`${file.slice(ROOT.length + 1)} avoids ${pattern}`, () => {
        expect(text.match(pattern)?.[0], why).toBeUndefined()
      })
    }
  }

  it('the coverage model cites no quantum exclusion and claims no exclusion it cannot source', () => {
    const sources = coverage._meta.sources.join(' ')
    expect(sources).not.toMatch(/quantum[^.]{0,20}exclusion/i)
    const cells = Object.values(coverage.matrix).flatMap((row) => Object.values(row))
    expect(new Set(cells)).toEqual(new Set(['ambiguous']))
  })
})
