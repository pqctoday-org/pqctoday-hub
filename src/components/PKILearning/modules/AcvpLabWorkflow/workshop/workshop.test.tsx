// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Workshop logic for acvp-lab-workflow, driven by the real public NIST
 * fixtures and the real WS-F pipeline (no mocks of parsing or planning).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { preparePrompt } from '@/services/acvp/run'
import { compareToExpected } from '@/services/acvp/compare'
import mlKemGolden from '@/services/acvp/__fixtures__/goldens/ML-KEM-encapDecap-FIPS203.response.json'
import { PUBLIC_FIXTURES } from '../data/publicFixtures'
import { VectorSetAnatomy } from './VectorSetAnatomy'
import { groupOutcomes, summarizeEvidence } from './workshopLogic'
import { EvidenceClassifier } from './EvidenceClassifier'
import { EVIDENCE_SCENARIOS } from '../data/evidenceLevels'
import { ResponseArtifactLab } from './ResponseArtifactLab'

// The engine panel pulls in the PKCS#11 WASM loaders; step C does not need it.
vi.mock('@/components/Playground/acvpio/AcvpFormatPrototypePanel', async () => {
  const React = await import('react')
  return {
    AcvpFormatPrototypePanel: () => React.createElement('div', { 'data-testid': 'panel-stub' }),
  }
})

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

// ── step C: what a learner sees after choosing a response.json ──────────────

type Sample = {
  id: 'ML-KEM-encapDecap-FIPS203' | 'ML-DSA-sigVer-FIPS204'
  label: string
  total: number
  fieldTotal: number
  /** An answer field to remove from the first case of the first group that carries it. */
  field: string
}
const SAMPLES: Sample[] = [
  {
    id: 'ML-KEM-encapDecap-FIPS203',
    label: 'ML-KEM / encapDecap / FIPS203',
    total: 165,
    fieldTotal: 240,
    field: 'k',
  },
  {
    id: 'ML-DSA-sigVer-FIPS204',
    label: 'ML-DSA / sigVer / FIPS204',
    total: 180,
    fieldTotal: 180,
    field: 'testPassed',
  },
]

type VectorSet = {
  vsId: number
  testGroups: Array<{ tgId: number; tests: Array<Record<string, unknown>> }>
}
const answersFor = async (id: Sample['id']): Promise<VectorSet> => {
  const ref = JSON.parse(await PUBLIC_FIXTURES[id].loadExpected()) as VectorSet
  return JSON.parse(JSON.stringify({ vsId: ref.vsId, testGroups: ref.testGroups })) as VectorSet
}

const renderLab = () =>
  render(
    <MemoryRouter>
      <ResponseArtifactLab />
    </MemoryRouter>
  )

const chooseResponse = async (
  user: ReturnType<typeof userEvent.setup>,
  doc: unknown,
  name = 'response.json'
) =>
  user.upload(
    screen.getByLabelText('Load response.json'),
    new File([typeof doc === 'string' ? doc : JSON.stringify(doc)], name, {
      type: 'application/json',
    })
  )

const shown = async () => screen.findByTestId('ral-comparison', {}, { timeout: 10000 })

describe('ResponseArtifactLab step C: uploaded response.json', () => {
  afterEach(() => vi.restoreAllMocks())

  describe.each(SAMPLES)('$label', (sample) => {
    const pick = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole('button', { name: sample.label }))
      expect(screen.getByRole('button', { name: sample.label })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    }

    it('a complete response is reported as a full match with every case counted', async () => {
      const user = userEvent.setup()
      renderLab()
      await pick(user)
      await chooseResponse(user, await answersFor(sample.id))
      await shown()
      expect(screen.getByTestId('ral-comparison-verdict')).toHaveTextContent(
        `All ${sample.total} expected cases match NIST’s published sample answers.`
      )
      expect(screen.getByTestId('ral-comparison-counts')).toHaveTextContent(
        `${sample.total} matched · 0 cases differ (0 field differences) · 0 unanswered · 0 unexpected (of ${sample.total} expected, ${sample.label})`
      )
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('case ids without answers are not a match: every case differs and the fields are listed', async () => {
      const user = userEvent.setup()
      renderLab()
      await pick(user)
      const idsOnly = await answersFor(sample.id)
      for (const g of idsOnly.testGroups) g.tests = g.tests.map((t) => ({ tcId: t.tcId }))
      await chooseResponse(user, idsOnly)
      const box = await shown()
      expect(screen.getByTestId('ral-comparison-verdict')).toHaveTextContent(
        `Not a full match: 0 of ${sample.total} expected cases match`
      )
      expect(screen.getByTestId('ral-comparison-verdict')).not.toHaveTextContent('All ')
      expect(screen.getByTestId('ral-comparison-counts')).toHaveTextContent(
        `0 matched · ${sample.total} cases differ (${sample.fieldTotal} field differences) · 0 unanswered · 0 unexpected`
      )
      expect(within(box).getAllByText(/is missing from the response/)).toHaveLength(10)
      expect(box).toHaveTextContent(`…and ${sample.fieldTotal - 10} more field differences.`)
    })

    it('one missing answer leaves exactly that case unmatched, and says it is missing, not wrong', async () => {
      const user = userEvent.setup()
      renderLab()
      await pick(user)
      const resp = await answersFor(sample.id)
      const group = resp.testGroups.find((g) => sample.field in g.tests[0])!
      const tcId = group.tests[0].tcId
      delete group.tests[0][sample.field]
      await chooseResponse(user, resp)
      const box = await shown()
      expect(screen.getByTestId('ral-comparison-verdict')).toHaveTextContent(
        `Not a full match: ${sample.total - 1} of ${sample.total} expected cases match`
      )
      expect(screen.getByTestId('ral-comparison-counts')).toHaveTextContent(
        `${sample.total - 1} matched · 1 case differs (1 field difference) · 0 unanswered · 0 unexpected`
      )
      expect(box).toHaveTextContent(
        `tgId ${group.tgId} / tcId ${String(tcId)}: ${sample.field} is missing from the response`
      )
      expect(box).not.toHaveTextContent('differs from the published answer')
    })

    it('a well-formed extra case is listed as not in the sample, and the file is not a full match', async () => {
      const user = userEvent.setup()
      renderLab()
      await pick(user)
      const resp = await answersFor(sample.id)
      const last = resp.testGroups[resp.testGroups.length - 1]
      last.tests.push({ ...last.tests[0], tcId: 99999 })
      await chooseResponse(user, resp)
      const box = await shown()
      expect(screen.getByTestId('ral-comparison-verdict')).toHaveTextContent(
        `Not a full match: ${sample.total} of ${sample.total} expected cases match`
      )
      expect(screen.getByTestId('ral-comparison-verdict')).not.toHaveTextContent('All ')
      expect(screen.getByTestId('ral-comparison-counts')).toHaveTextContent(
        `${sample.total} matched · 0 cases differ (0 field differences) · 0 unanswered · 1 unexpected`
      )
      expect(box).toHaveTextContent(`tgId ${last.tgId} / tcId 99999: not in the sample`)
    })

    it('a changed answer is reported as different, an absent case as unanswered', async () => {
      const user = userEvent.setup()
      renderLab()
      await pick(user)
      const resp = await answersFor(sample.id)
      const first = resp.testGroups[0].tests[0]
      const field = Object.keys(first).find((k) => k !== 'tcId')!
      const was = first[field]
      first[field] =
        typeof was === 'boolean'
          ? !was
          : `${String(was).slice(0, -1)}${String(was).endsWith('0') ? '1' : '0'}`
      const dropped = resp.testGroups.pop()!.tests.length
      await chooseResponse(user, resp)
      const box = await shown()
      expect(screen.getByTestId('ral-comparison-counts')).toHaveTextContent(
        `${sample.total - 1 - dropped} matched · 1 case differs (1 field difference) · ${dropped} unanswered`
      )
      expect(box).toHaveTextContent(`${field} differs from the published answer`)
    })
  })

  it.each([
    ['text that is not JSON', '{"vsId": 42,', /The file is not valid JSON/],
    [
      'null instead of a vector set',
      'null',
      /The response cannot be compared: \$: the vector set must be a JSON object/,
    ],
    [
      'a vector set of another number',
      '{"vsId": 7, "testGroups": []}',
      /vsId mismatch: response 7 vs expected 42/,
    ],
    ['a missing vsId', '{"testGroups": []}', /\$\.vsId: vsId is missing/],
    [
      'a group without tests',
      '{"vsId": 42, "testGroups": [{"tgId": 1}]}',
      /testGroups\[0\]\.tests: tests is missing/,
    ],
  ])('%s is refused with a message and no result', async (_name, text, message) => {
    const user = userEvent.setup()
    renderLab()
    await chooseResponse(user, text)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(message)
    expect(alert).toHaveTextContent('Nothing was compared, so nothing is counted as a match.')
    expect(screen.queryByTestId('ral-comparison')).toBeNull()
    // announced politely through the live region the results share
    const live = screen.getByTestId('ral-compare-live')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(within(live).getByRole('alert')).toBe(alert)
  })

  it('a duplicate case id is refused even though both copies agree', async () => {
    const user = userEvent.setup()
    renderLab()
    const resp = await answersFor('ML-DSA-sigVer-FIPS204')
    await user.click(screen.getByRole('button', { name: 'ML-DSA / sigVer / FIPS204' }))
    resp.testGroups[0].tests.push({ ...resp.testGroups[0].tests[0] })
    await chooseResponse(user, resp)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /duplicates tests\[0\] in the same group/
    )
    expect(screen.queryByTestId('ral-comparison')).toBeNull()
  })

  it('an old result never stays on screen after a failed upload, and a valid file recovers the page', async () => {
    const user = userEvent.setup()
    renderLab()
    const good = await answersFor('ML-KEM-encapDecap-FIPS203')
    await chooseResponse(user, good)
    await shown()
    expect(screen.getByTestId('ral-comparison-verdict')).toHaveTextContent('All 165 expected')

    await chooseResponse(user, '{"vsId": 42,')
    expect(await screen.findByRole('alert')).toHaveTextContent('The file is not valid JSON')
    expect(screen.queryByTestId('ral-comparison')).toBeNull()

    await chooseResponse(user, { vsId: 42, testGroups: [{ tgId: 1, tests: [] }] })
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/tests: a group lists at least one test/)
    )
    expect(screen.queryByTestId('ral-comparison')).toBeNull()

    await chooseResponse(user, good)
    await shown()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByTestId('ral-comparison-verdict')).toHaveTextContent('All 165 expected')
  })

  it('a file that cannot be read clears the previous result and says so', async () => {
    const user = userEvent.setup()
    renderLab()
    await chooseResponse(user, await answersFor('ML-KEM-encapDecap-FIPS203'))
    await shown()

    const unreadable = new File(['x'], 'response.json', { type: 'application/json' })
    Object.defineProperty(unreadable, 'text', {
      value: () => Promise.reject(new Error('disk went away')),
    })
    await user.upload(screen.getByLabelText('Load response.json'), unreadable)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The file could not be read: disk went away'
    )
    expect(screen.queryByTestId('ral-comparison')).toBeNull()
  })

  it('switching the sample clears the result and the error, and the same file is then judged by the new sample', async () => {
    const user = userEvent.setup()
    renderLab()
    const kem = await answersFor('ML-KEM-encapDecap-FIPS203')
    await chooseResponse(user, kem)
    await shown()
    await user.click(screen.getByRole('button', { name: 'ML-DSA / sigVer / FIPS204' }))
    expect(screen.queryByTestId('ral-comparison')).toBeNull()

    // an ML-KEM response is not an ML-DSA answer sheet: same vsId, but its c and k are answers
    // that no ML-DSA signature check carries, so it is refused rather than counted
    await chooseResponse(user, kem)
    expect(await screen.findByRole('alert')).toHaveTextContent(/is not an answer field/)
    expect(screen.queryByTestId('ral-comparison')).toBeNull()

    await chooseResponse(user, '[1')
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'ML-KEM / encapDecap / FIPS203' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it.each([
    ['result', { vsId: 42, testGroups: [] }, 'Not a full match'],
    ['refusal', { vsId: 42, testGroups: [{ tgId: 1 }] }, 'cannot be compared'],
  ])(
    'a slow earlier upload that would end in a %s cannot overwrite the result of a newer one',
    async (_kind, earlier, wouldShow) => {
      const user = userEvent.setup()
      renderLab()
      // read the real answers first: the spy below holds back the next load
      const good = await answersFor('ML-KEM-encapDecap-FIPS203')
      const real = await PUBLIC_FIXTURES['ML-KEM-encapDecap-FIPS203'].loadExpected()
      let release: (text: string) => void = () => undefined
      const slow = new Promise<string>((resolve) => (release = resolve))
      const spy = vi
        .spyOn(PUBLIC_FIXTURES['ML-KEM-encapDecap-FIPS203'], 'loadExpected')
        .mockImplementationOnce(() => slow)
      await chooseResponse(user, earlier) // held back by the spy
      await waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
      await chooseResponse(user, good) // loads at once: full match
      await shown()
      expect(screen.getByTestId('ral-comparison-verdict')).toHaveTextContent('All 165 expected')
      release(real)
      await new Promise((r) => setTimeout(r, 50))
      expect(screen.getByTestId('ral-comparison-verdict')).toHaveTextContent('All 165 expected')
      expect(screen.queryByRole('alert')).toBeNull()
      expect(document.body).not.toHaveTextContent(wouldShow)
    }
  )

  it('a result for one sample is not shown after the learner switches to the other while it loads', async () => {
    const user = userEvent.setup()
    renderLab()
    let release: (text: string) => void = () => undefined
    const slow = new Promise<string>((resolve) => (release = resolve))
    const kem = await answersFor('ML-KEM-encapDecap-FIPS203')
    const real = await PUBLIC_FIXTURES['ML-KEM-encapDecap-FIPS203'].loadExpected()
    const spy = vi
      .spyOn(PUBLIC_FIXTURES['ML-KEM-encapDecap-FIPS203'], 'loadExpected')
      .mockImplementationOnce(() => slow)
    await chooseResponse(user, kem)
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'ML-DSA / sigVer / FIPS204' }))
    release(real)
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByTestId('ral-comparison')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('the evidence summary labels its count as field differences', async () => {
    const user = userEvent.setup()
    renderLab()
    await user.upload(
      screen.getByLabelText('Load evidence.json'),
      new File(
        [
          JSON.stringify({
            evidenceClass: 'nist-acvp-reference-sample',
            engine: { label: 'softhsmv3 C++ engine' },
            summary: { answered: 30, unsupported: 135, error: 0 },
            goldenComparison: {
              matched: 28,
              mismatched: 3,
              unanswered: 135,
              unexpected: 0,
              expectedTotal: 165,
            },
          }),
        ],
        'evidence.json',
        { type: 'application/json' }
      )
    )
    const box = await screen.findByTestId('ral-evidence')
    expect(box).toHaveTextContent('28 matched · 3 field differences · 135 unanswered (of 165)')
    expect(box).not.toHaveTextContent('mismatched')
  })
})
