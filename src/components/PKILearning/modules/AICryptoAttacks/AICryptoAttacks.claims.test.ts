// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getStandard } from '@/data/standardsRegistry'
import { content } from './content'
import { SOURCE_CLAIMS, type SourceClaim } from './data/sourceClaims'
import { BINANCE_AI_BRANCHES } from './data/binanceAiBranches'
import { CLAIM_SORTER_ITEMS } from './data/claimSorterData'
import { DEFENCE_OPTIONS } from './data/defencePlannerData'
import { KEY_POLICY_TEMPLATES } from './data/keyPolicyData'
import { SAMPLE_REPO_FILES } from './data/secretHuntData'

const SOURCES = import.meta.glob(
  ['./components/*.tsx', './workshop/*.tsx', './data/*.ts', '!./data/sourceClaims.ts'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const ALL_MODULE_FILES = import.meta.glob(
  ['./**/*.ts', './**/*.tsx', './**/*.md', '!./AICryptoAttacks.claims.test.ts'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const CLAIM_ID = /['"](AI-(?:\d+\.\d+[a-z]*|x))['"]/g

describe('AICryptoAttacks source claims and capability rubric', () => {
  it('keys each claim by id, declares every Library sourceId in content.standards, and enforces rubric fields', () => {
    const declared = new Set(content.standards.map((s) => s.id))
    const allIds = new Set(Object.keys(SOURCE_CLAIMS))

    for (const [key, claim] of Object.entries(SOURCE_CLAIMS) as [string, SourceClaim][]) {
      expect(claim.id, key).toBe(key)
      expect(claim.text.length, key).toBeGreaterThan(20)
      expect(['demonstrated', 'reported', 'hypothesised']).toContain(claim.claimStatus)
      expect(claim.asOfDate, `${key} asOfDate`).toBe('2026-11-21')

      if (claim.recordType === 'PRIMARY') {
        expect(claim.sourceId, `${key} primary sourceId`).toBeTruthy()
        expect(() => getStandard(claim.sourceId!), key).not.toThrow()
        expect(declared.has(claim.sourceId!), `${key} -> ${claim.sourceId}`).toBe(true)
        for (const extra of claim.extraSourceIds ?? []) {
          expect(() => getStandard(extra), `${key} extra ${extra}`).not.toThrow()
          expect(declared.has(extra), `${key} extra -> ${extra}`).toBe(true)
        }
      } else {
        expect(claim.premiseIds.length, `${key} premiseIds`).toBeGreaterThan(0)
        for (const pid of claim.premiseIds) {
          expect(allIds.has(pid), `${key} unknown premise ${pid}`).toBe(true)
        }
      }

      if (claim.claimStatus === 'hypothesised') {
        expect(claim.premiseIds.length, `${key} hypothesised premiseIds`).toBeGreaterThan(0)
      }

      for (const field of [
        claim.assistanceMode,
        claim.discovery,
        claim.reproduction,
        claim.patch,
        claim.successfulExploitation,
        claim.independentlyReproduced,
        claim.modelAndTools,
        claim.humanEffort,
        claim.costAndAttempts,
        claim.successRate,
        claim.targetAndVersion,
        claim.adversaryAccess,
        claim.productionImpact,
      ]) {
        expect(field.trim().length, `${key} rubric field non-empty`).toBeGreaterThan(0)
      }
    }
  })

  it('renders every claim somewhere in components, workshop, or data (zero unused claims)', () => {
    const used = new Set<string>()
    for (const text of Object.values(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) used.add(m[1])
    }
    for (const id of Object.keys(SOURCE_CLAIMS)) {
      expect(used.has(id), `Unused claim ID: ${id}`).toBe(true)
    }
  })

  it('refers only to claim IDs that exist in SOURCE_CLAIMS (zero unknown IDs)', () => {
    const valid = new Set(Object.keys(SOURCE_CLAIMS))
    for (const [file, text] of Object.entries(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) {
        expect(valid.has(m[1]), `${file}: unknown claim ID ${m[1]}`).toBe(true)
      }
    }
    for (const item of CLAIM_SORTER_ITEMS) expect(valid.has(item.claimId)).toBe(true)
    for (const opt of DEFENCE_OPTIONS) expect(valid.has(opt.claimId)).toBe(true)
    for (const f of SAMPLE_REPO_FILES) expect(valid.has(f.relatedClaimId)).toBe(true)
    for (const t of KEY_POLICY_TEMPLATES) {
      for (const cid of t.claimIds) expect(valid.has(cid)).toBe(true)
    }
  })

  it('imports Binance chronology from canonicalBinanceIncident without local restatement', () => {
    const branchesSrc = SOURCES['./data/binanceAiBranches.ts'] ?? ''
    const claimSorterSrc = SOURCES['./data/claimSorterData.ts'] ?? ''
    expect(branchesSrc).toContain("from '@/data/canonicalBinanceIncident'")
    expect(claimSorterSrc).toContain("from '@/data/canonicalBinanceIncident'")
    for (const [file, text] of Object.entries(ALL_MODULE_FILES)) {
      expect(text, `${file}: hardcoded Binance Homebrew chronology`).not.toMatch(
        /tampered Homebrew/i
      )
      expect(text, `${file}: hardcoded Binance internal AI tool chronology`).not.toMatch(
        /used an internal AI tool/i
      )
      expect(text, `${file}: hardcoded Binance stage date`).not.toMatch(
        /20 October|(?<!\d )June 2026|September 2026|(?<!29 )October 2026 Binance/i
      )
      expect(text, `${file}: hardcoded Binance actor/branch chronology`).not.toMatch(
        /Engineer [ABC]|Engineers A and C|fake[- ]recruiter|pyenv/i
      )
    }
    expect(BINANCE_AI_BRANCHES.map((b) => [b.claimId, b.causalRole])).toEqual([
      ['AI-2.4a', 'none shown'],
      ['AI-2.4b', 'not stated'],
      ['AI-2.4c', 'tool-mediated'],
    ])
  })

  it('omits rejected TO VERIFY phrases and carries no private pipeline leaks', () => {
    for (const [file, text] of Object.entries(ALL_MODULE_FILES)) {
      expect(text, `${file}: banned Gohr phrase`).not.toMatch(/22 rounds/i)
      expect(text, `${file}: banned Gohr phrase`).not.toMatch(/7-round neural distinguisher/i)
      expect(text, `${file}: banned Gohr phrase`).not.toMatch(/6-round helper/i)
      expect(text, `${file}: banned Gohr phrase`).not.toMatch(/7r\s*\+\s*6r helper/i)
      expect(text, `${file}: banned SP 1800-44 phrase`).not.toMatch(/rigorous scrutiny/i)
      expect(text, `${file}: banned Binance wording`).not.toMatch(/Homebrew installer/i)
      const lower = text.toLowerCase()
      const bannedTokens = [
        ['pqctoday', 'priv'].join('-'),
        ['local', 'evidence', 'cache'].join('-'),
        ['codex', 'log'].join('-'),
        ['plan', 'ai', 'crypto'].join('-'),
        ['cx', '2026'].join('-'),
      ]
      for (const tok of bannedTokens) {
        expect(lower, `${file}: private leak check (${tok})`).not.toContain(tok)
      }
      expect(text, `${file}: TO VERIFY marker`).not.toContain(['TO', 'VERIFY'].join(' '))
      expect(text, `${file}: TO_VERIFY marker`).not.toContain(['TO', 'VERIFY'].join('_'))
    }
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.text, key).not.toMatch(/^OPTIONAL/)
      expect(claim.text, key).not.toMatch(/tightening|ledger|reviewer|local-evidence|pipeline/i)
    }
  })
})
