// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Claims-lineage, canonical-Binance-import, and leak-free tests for CustodyThreatsControls (LM-083).
 */
import { describe, it, expect } from 'vitest'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { SOURCE_CLAIMS } from './data/sourceClaims'
import { content } from './content'

const SOURCES = import.meta.glob(
  ['./components/*.tsx', './workshop/*.tsx', './data/*.ts', '!./data/sourceClaims.ts'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const ALL_MODULE_SOURCES = import.meta.glob(
  ['./**/*.ts', './**/*.tsx', '!./**/*.test.ts', '!./**/*.test.tsx'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const CLAIM_ID = /['"](DA-\d+\.\d+[a-z0-9-]*)['"]/g

describe('CustodyThreatsControls source claims', () => {
  it('keys each claim by its own id and cites a single Library document declared in content.standards', () => {
    const declared = new Set(content.standards.map((s) => s.id))
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.id, key).toBe(key)
      expect(() => getStandard(claim.sourceId), key).not.toThrow()
      expect(declared.has(claim.sourceId), `${key} -> ${claim.sourceId}`).toBe(true)
      expect(claim.text.length, key).toBeGreaterThan(20)
    }
  })

  it('cites every claim somewhere in the lesson, workshop, or data files (zero unused claims)', () => {
    const used = new Set<string>()
    for (const text of Object.values(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) used.add(m[1])
    }
    for (const id of Object.keys(SOURCE_CLAIMS)) {
      expect(used.has(id), `Unused claim in SOURCE_CLAIMS: ${id}`).toBe(true)
    }
  })

  it('refers only to claim ids that exist in SOURCE_CLAIMS (zero unknown ids)', () => {
    for (const [file, text] of Object.entries(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) {
        expect(Object.keys(SOURCE_CLAIMS), `${file}: unknown claim ${m[1]}`).toContain(m[1])
      }
    }
  })

  it('carries no reviewer or internal pipeline wording', () => {
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.text, key).not.toMatch(/^OPTIONAL/)
      expect(claim.text, key).not.toMatch(
        /(?:\bclaim[_-]?ledger\b|tightening|reviewer|local-evidence|pipeline)/i
      )
    }
  })

  it('declares valid algorithm entries in content.algorithms', () => {
    expect(content.algorithms.length).toBeGreaterThan(0)
    for (const alg of content.algorithms) {
      expect(getAlgorithm(alg.name)).toBeDefined()
    }
  })
})

describe('Canonical Binance incident single-source enforcement', () => {
  it('imports canonicalBinanceIncident directly and avoids duplicating hardcoded Binance chronology strings', () => {
    const introSrc = ALL_MODULE_SOURCES['./components/CustodyThreatsIntroduction.tsx'] ?? ''
    const claimsSrc = ALL_MODULE_SOURCES['./data/sourceClaims.ts'] ?? ''
    expect(introSrc).toContain("from '@/data/canonicalBinanceIncident'")
    expect(claimsSrc).toContain("from '@/data/canonicalBinanceIncident'")

    const forbiddenHardcoded = [
      'tampered Homebrew installation',
      '/opt/homebrew/Cellar/pyenv',
      '233.46 million XRP',
      '970,500 SOL',
      '44.2 million OP',
      '18,270 BTC',
      '2,961.9 ETH',
      '6.34 billion',
      '2.85 billion',
      'Binance14',
      'TraderTraitor',
    ]

    for (const [file, text] of Object.entries(ALL_MODULE_SOURCES)) {
      const sanitized = text.replace(/fbiTraderTraitorAlert/g, '')
      for (const literal of forbiddenHardcoded) {
        // TraderTraitor is also the Bybit FBI campaign name in DA-2.1b; allow it only in DA-2.1b
        if (literal === 'TraderTraitor' && file === './data/sourceClaims.ts') {
          const outsideBybit = sanitized.replace(/TraderTraitor\./g, '')
          expect(outsideBybit, `${file} hardcoded "${literal}"`).not.toContain(literal)
          continue
        }
        expect(
          sanitized,
          `${file} must source "${literal}" from canonicalBinanceIncident`
        ).not.toContain(literal)
      }
    }
  })
})
