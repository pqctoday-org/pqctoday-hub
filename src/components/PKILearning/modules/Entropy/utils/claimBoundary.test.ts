// SPDX-License-Identifier: GPL-3.0-only
//
// Claim-boundary regression checks (plan §10.2) for the strings review pass 2
// found WRONG or UNSUPPORTED on shared surfaces. Each pattern names the source
// that contradicts it; a match means the claim came back.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

/** Newest module_qa_<prefix>_MMDDYYYY[_rN].csv, by date then revision. */
function latestQa(prefix: string): string {
  const dir = 'src/data/module-qa'
  const re = new RegExp(`^module_qa_${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const key = (f: string) => {
    const m = re.exec(f)
    return m ? Number(`${m[3]}${m[1]}${m[2]}`) * 1000 + Number(m[4] ?? 0) : -1
  }
  const f = readdirSync(join(ROOT, dir))
    .filter((x) => key(x) >= 0)
    .sort((a, b) => key(a) - key(b))
    .at(-1)!
  return `${dir}/${f}`
}

const E = 'src/components/PKILearning/modules/Entropy'
const CHECKS: { file: string; banned: RegExp; why: string }[] = [
  {
    file: 'src/data/glossary/concepts.json',
    banned: /guaranteed by the laws of quantum physics/i,
    why: 'no normative source (plan §1 item 7)',
  },
  {
    file: 'src/data/glossary/concepts.json',
    banned: /typically achieve 6-8 bits per byte/i,
    why: 'unsourced; SP 800-90B estimates per source',
  },
  {
    file: 'src/data/glossary/concepts.json',
    banned: /RDRAND[^.]*are common TRNG implementations/i,
    why: 'Intel DRNG guide 3.3.1: RDRAND returns SP 800-90A DRBG output',
  },
  {
    file: 'src/data/implementationAttackProfiles.ts',
    banned: /800-90B (compliant )?DRBG/,
    why: 'DRBGs are SP 800-90A; 90B covers entropy sources',
  },
  {
    file: `${E}/components/EntropyIntroduction.tsx`,
    banned: /sliding\s+window|frequency of the most common value/i,
    why: 'SP 800-90B §4.4.2 counts the first sample of each window',
  },
  {
    file: `${E}/workshop/ESVWalkthroughDemo.tsx`,
    banned: /maximum count of the most frequent value/i,
    why: 'SP 800-90B §4.4.2: C is a cutoff',
  },
  {
    file: `${E}/workshop/SourceCombiningDemo.tsx`,
    banned: /256-bit block holds at most the \{credited\}/,
    why: 'SP 800-90B §3.1.5: output entropy is capped by nout',
  },
  {
    file: `${E}/workshop/RandomGenerationDemo.tsx`,
    banned: /§11 approves|explicitly\s+excluded/,
    why: 'SP 800-90A §11 is Assurance and never mentions LCGs',
  },
  {
    file: `${E}/workshop/DrbgArchitectureDemo.tsx`,
    banned: /should be obtained from an external source/,
    why: 'SP 800-90A §8.6.7: generated within a cryptographic module boundary',
  },
  {
    file: `${E}/workshop/QRNGDemo.tsx`,
    banned: /QRNG noise sources with CMVP/,
    why: 'E214 is certified Non-Physical',
  },
  {
    file: 'src/components/PKILearning/modules/ResearchQuantumImpact/rag-summary.md',
    banned:
      /Level 3 validation is available for select QRNG|provide NIST SP 800-90B-compliant entropy/,
    why: 'unsourced certification claims',
  },
  {
    file: 'src/data/glossary/standards.json',
    banned: /All three DRBGs use symmetric primitives and are quantum-safe/,
    why: 'blanket claim; engineering judgment at most',
  },
]

describe('entropy claim boundary — review pass 2 strings stay gone', () => {
  it.each(CHECKS)('$file has no /$banned/ ($why)', ({ file, banned }) => {
    expect(read(file)).not.toMatch(banned)
  })

  it('the latest entropy QA file carries none of the three rejected answers', () => {
    const qa = read(latestQa('entropy-randomness'))
    expect(qa).not.toMatch(/mandatory components of the NIST SP 800-90B/)
    expect(qa).not.toMatch(/running entropy tests on generated data/)
    expect(qa).not.toMatch(/derive randomness directly from quantum mechanical phenomena/)
  })

  it('the latest combined QA file agrees with the latest entropy QA file', () => {
    const combined = read(latestQa('combined'))
    const rows = read(latestQa('entropy-randomness')).trim().split('\n').slice(1)
    for (const row of rows) expect(combined).toContain(row)
  })
})
