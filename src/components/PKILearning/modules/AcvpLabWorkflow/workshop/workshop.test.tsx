// SPDX-License-Identifier: AGPL-3.0-only
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

  it('ML-DSA: external pure and internal external-mu groups execute, preHash groups are partly executable, internal raw-M′ groups unsupported', async () => {
    const p = await preparePrompt(await PUBLIC_FIXTURES['ML-DSA-sigVer-FIPS204'].loadPrompt())
    if (!p.ok) throw new Error('fixture rejected')
    const o = groupOutcomes(p.plan.items)
    for (const g of p.ir.testGroups) {
      const props = g.properties
      const expected =
        props.signatureInterface !== 'external'
          ? props.externalMu === true
            ? 'executes'
            : 'unsupported'
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
    const how = screen.getByTestId('how-to-choose')
    expect(how).toHaveTextContent('How to choose for each group.')
    expect(how).toHaveTextContent(
      'the test supplies m, the random input NIST fixes so the answer is repeatable'
    )
    expect(how).toHaveTextContent(
      'Choose ‘Some tests execute’ only when a group mixes both kinds of case.'
    )
    const tg1 = screen.getByTestId('tg-1')
    fireEvent.click(within(tg1).getByRole('button', { name: /Unsupported/ }))
    expect(tg1).toHaveTextContent('0 executable · 25 unsupported')
    expect(tg1).toHaveTextContent('C_EncapsulateKey')
    expect(tg1).toHaveTextContent('the standard PKCS#11 path cannot answer this test')
    expect(screen.getByTestId('tg-1-step3')).toHaveTextContent(
      'This is the standard PKCS#11 v3.2 path only. Step 3 answers these tests through the engines’ labelled test-only inputs'
    )
    expect(
      within(tg1).getByRole('button', { name: 'Unsupported through standard PKCS#11' })
    ).toBeVisible()
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
    // A version 2 file has neither the input-kind breakdown nor, here, a comparison.
    expect(s.byInputKind).toBeNull()
    expect(s.answerKinds).toBeNull()
    expect(s.golden).toBeNull()
  })

  it('summarizeEvidence also reads the version 3 breakdown and the NIST comparison', () => {
    const s = summarizeEvidence({
      evidenceVersion: 'pqctoday.acvp-evidence/3',
      evidenceClass: 'nist-acvp-reference-sample',
      prompt: {},
      engine: { label: 'softhsmv3 C++ engine' },
      summary: {
        answered: 165,
        unsupported: 0,
        error: 0,
        byInputKind: { standard: 30, 'test-input-m': 75, 'key-import-result': 60 },
      },
      cases: [
        { tgId: 1, tcId: 1, disposition: 'answered', mechanismKind: 'pkcs11-v3.2' },
        {
          tgId: 2,
          tcId: 1,
          disposition: 'answered',
          mechanismKind: 'pkcs11-v3.2',
          inputKind: 'test-input-m',
        },
        {
          tgId: 3,
          tcId: 1,
          disposition: 'answered',
          mechanismKind: 'pkcs11-v3.2',
          inputKind: 'key-import-result',
        },
        { tgId: 4, tcId: 1, disposition: 'answered', mechanismKind: 'vendor-defined' },
      ],
      goldenComparison: {
        matched: 165,
        mismatched: 0,
        unanswered: 0,
        unexpected: 0,
        expectedTotal: 165,
      },
    })
    expect(s.evidenceVersion).toBe('pqctoday.acvp-evidence/3')
    expect(s.byInputKind?.['test-input-m']).toBe(75)
    // The displayed split comes from the cases: the vendor-defined answer is not a standard call.
    expect(s.answerKinds).toEqual({
      standardV32: 1,
      vendorDefined: 1,
      v33Draft: 0,
      testInputM: 1,
      computed: 0,
      keyImportResult: 1,
    })
    expect(s.golden).toEqual({
      matched: 165,
      mismatched: 0,
      unanswered: 0,
      unexpected: 0,
      expectedTotal: 165,
    })
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
