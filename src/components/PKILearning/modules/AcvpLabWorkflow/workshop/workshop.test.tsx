// SPDX-License-Identifier: GPL-3.0-only
/**
 * Workshop logic for acvp-lab-workflow, driven by the real public NIST
 * fixtures and the real WS-F pipeline (no mocks of parsing or planning).
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { preparePrompt } from '@/services/acvp/run'
import { compareToExpected } from '@/services/acvp/compare'
import mlKemGolden from '@/services/acvp/__fixtures__/goldens/ML-KEM-encapDecap-FIPS203.response.json'
import { PUBLIC_FIXTURES } from '../data/publicFixtures'
import { VectorSetAnatomy } from './VectorSetAnatomy'
import { groupOutcomes, summarizeEvidence } from './workshopLogic'
import { EvidenceClassifier } from './EvidenceClassifier'
import { EVIDENCE_SCENARIOS } from '../data/evidenceLevels'

describe('public fixture loaders', () => {
  it('load the exact pinned bytes (the prototype recognises them as NIST samples)', async () => {
    for (const f of Object.values(PUBLIC_FIXTURES)) {
      const prepared = await preparePrompt(await f.loadPrompt())
      expect(prepared.ok, f.id).toBe(true)
    }
  })
})

describe('groupOutcomes (vector-set anatomy answers)', () => {
  it('ML-KEM: decapsulation groups execute, encapsulation and key-check groups are unsupported', async () => {
    const p = await preparePrompt(await PUBLIC_FIXTURES['ML-KEM-encapDecap-FIPS203'].loadPrompt())
    if (!p.ok) throw new Error('fixture rejected')
    const o = groupOutcomes(p.plan.items)
    for (const g of p.ir.testGroups) {
      const fn = g.properties.function
      expect(o.get(g.tgId)?.actual, `tgId ${g.tgId} ${String(fn)}`).toBe(
        fn === 'decapsulation' ? 'executes' : 'unsupported'
      )
    }
  })

  it('ML-DSA: external pure groups execute, preHash groups are partly executable, internal groups unsupported', async () => {
    const p = await preparePrompt(await PUBLIC_FIXTURES['ML-DSA-sigVer-FIPS204'].loadPrompt())
    if (!p.ok) throw new Error('fixture rejected')
    const o = groupOutcomes(p.plan.items)
    for (const g of p.ir.testGroups) {
      const props = g.properties
      const expected =
        props.signatureInterface !== 'external'
          ? 'unsupported'
          : props.preHash === 'preHash'
            ? 'partly'
            : 'executes'
      expect(o.get(g.tgId)?.actual, `tgId ${g.tgId}`).toBe(expected)
    }
  })
})

describe('VectorSetAnatomy', () => {
  it('loads the ML-KEM sample, identifies it by hash, and reveals the answer for a group', async () => {
    render(<VectorSetAnatomy />)
    fireEvent.click(screen.getByRole('button', { name: /Load ML-KEM/ }))
    const header = await screen.findByTestId('vector-set-header', {}, { timeout: 10000 })
    expect(header).toHaveTextContent('vsId 42')
    expect(header).toHaveTextContent('Matches the pinned public sample')
    const tg1 = screen.getByTestId('tg-1')
    fireEvent.click(within(tg1).getByRole('button', { name: /Unsupported/ }))
    expect(tg1).toHaveTextContent('0 executable · 25 unsupported')
    expect(tg1).toHaveTextContent('C_EncapsulateKey')
  })
})

describe('ResponseArtifactLab helpers', () => {
  it('the golden ML-KEM response matches NIST on every answered case and leaves the rest unanswered', async () => {
    const expected = JSON.parse(await PUBLIC_FIXTURES['ML-KEM-encapDecap-FIPS203'].loadExpected())
    const cmp = compareToExpected(mlKemGolden, expected)
    expect(cmp.mismatched).toEqual([])
    expect(cmp.unexpected).toEqual([])
    expect(cmp.matched).toBe(30)
    expect(cmp.matched + cmp.unanswered).toBe(cmp.expectedTotal)
  })

  it('summarizeEvidence reads the reviewer fields and rejects a non-evidence file', () => {
    const s = summarizeEvidence({
      evidenceClass: 'nist-acvp-reference-sample',
      prompt: {
        knownPublicFixture: {
          upstreamPath: 'gen-val/json-files/ML-KEM-encapDecap-FIPS203/prompt.json',
          commit: '975de31eb83d87039ec88934fdc47d8c312b892d',
        },
      },
      engine: { label: 'softhsmv3 Rust engine', artifactSha256Note: 'not computed' },
      summary: { answered: 30, unsupported: 135, error: 0 },
    })
    expect(s.evidenceClass).toBe('nist-acvp-reference-sample')
    expect(s.knownFixture).toContain('@ 975de31')
    expect(s.answered).toBe(30)
    expect(() => summarizeEvidence({ vsId: 42 })).toThrow(/evidenceClass/)
  })
})

describe('EvidenceClassifier', () => {
  it('reveals the answer, the permitted claim and the trap after a choice', () => {
    render(<EvidenceClassifier />)
    const first = EVIDENCE_SCENARIOS[0]
    const card = screen.getByTestId(`evidence-scenario-${first.id}`)
    fireEvent.click(within(card).getByRole('button', { name: 'NIST ACVP-Server reference sample' }))
    expect(card).toHaveTextContent('Correct')
    expect(card).toHaveTextContent('Passes this public NIST ACVP-Server reference sample')
    expect(card).toHaveTextContent('Trap:')
  })
})
