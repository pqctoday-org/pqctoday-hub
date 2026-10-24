// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: FIPS author
/* eslint-disable security/detect-object-injection -- keys are item and mark ids from the typed step data */
/* eslint-disable testing-library/no-node-access -- the section ids and DOM order are part of what is asserted */
/**
 * Workshop step `fips-algorithm-records` ("Read the algorithm records"): the answer key for the
 * two-mark and three-mark items, the Check feedback, the as-of dates of both modules, the neutral
 * "listed" wording, the Luna T7 credit line, the duration and the step question.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FipsAlgorithmRecords } from './FipsAlgorithmRecords'
import {
  genericFeedback,
  judgeChoiceItem,
  judgeCompareItem,
  marksOf,
  scoreBandText,
  type MarkAnswers,
} from './algorithmRecordsScoring'
import {
  ALGORITHM_RECORD_ITEMS,
  ALGORITHM_RECORD_MODULES,
  ALGORITHM_RECORDS_AS_OF,
  ALGORITHM_RECORDS_AS_OF_LABEL,
  FIPS_FRESHNESS_CLAIMS,
  LUNA_POLICY_CREDIT,
  RECORD_MARK_LABELS,
  RECORDS_SCORE_BANDS,
  RECORDS_SCORE_ENDING,
  exercises,
  stepExercises,
  type AlgorithmRecordChoiceItem,
  type AlgorithmRecordCompareItem,
  type RecordQuote,
} from '../data/fipsData'
import { STEP_EXERCISES } from '@/data/stepExercises'
import { MANIFEST_BY_ID, MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { buildCatalog, buildStepCounts } from '@/components/PKILearning/manifest/derive'
import manifest from '../manifest'

const compareItems = ALGORITHM_RECORD_ITEMS.filter(
  (i): i is AlgorithmRecordCompareItem => i.kind === 'compare'
)
const choiceItem = ALGORITHM_RECORD_ITEMS.find(
  (i): i is AlgorithmRecordChoiceItem => i.kind === 'choose'
) as AlgorithmRecordChoiceItem

const item = (id: string): AlgorithmRecordCompareItem => {
  const found = compareItems.find((i) => i.id === id)
  if (!found) throw new Error(`no item ${id}`)
  return found
}

/** Expected [validation, Approved Algorithms table, function table?] per item, by the owner's rule. */
const ANSWER_KEY: Readonly<Record<string, readonly boolean[]>> = {
  'ml-dsa-65-external-pure': [true, true],
  'ml-dsa-65-deterministic': [true, true, false],
  'hss-siggen': [false, false],
  'luna-ml-dsa-deterministic': [true, true, false],
  'luna-ml-dsa-internal-mu': [true, false],
  'luna-shake-256-a7880': [true, false],
}

const correctAnswers = (it: AlgorithmRecordCompareItem): MarkAnswers =>
  Object.fromEntries(
    marksOf(it).map(({ id, mark }) => [id, mark.listed ? 'listed' : 'not-listed'])
  ) as MarkAnswers

const section = (id: string): HTMLElement => {
  const el = document.getElementById(`fips-records-item-${id}`)
  if (!el) throw new Error(`no section for ${id}`)
  return el
}

/** Answer one compare item. `flip` marks are answered the wrong way round. */
const answerItem = (it: AlgorithmRecordCompareItem, flip: readonly string[] = []) => {
  const groups = within(section(it.id)).getAllByRole('group')
  marksOf(it).forEach(({ id, mark }, i) => {
    const right = mark.listed ? 'Listed' : 'Not listed'
    const wrong = mark.listed ? 'Not listed' : 'Listed'
    fireEvent.click(within(groups[i]).getByLabelText(flip.includes(id) ? wrong : right))
  })
}

const answerChoice = (text: string) => {
  fireEvent.click(within(section(choiceItem.id)).getByLabelText(text))
}

const answerAllCorrectly = () => {
  for (const it of compareItems) answerItem(it)
  answerChoice(choiceItem.choices.find((c) => c.ok)?.text ?? '')
}

const check = () => fireEvent.click(screen.getByRole('button', { name: 'Check' }))

afterEach(() => {
  vi.restoreAllMocks()
})

// ── data and answer key ─────────────────────────────────────────────────────

describe('algorithm records: the items', () => {
  it('has the seven decided items, module 1 first, then module 2, the single choice last', () => {
    expect(ALGORITHM_RECORD_ITEMS.map((i) => `${i.module}:${i.id}`)).toEqual([
      '5497:ml-dsa-65-external-pure',
      '5497:ml-dsa-65-deterministic',
      '5497:hss-siggen',
      '5450:luna-ml-dsa-deterministic',
      '5450:luna-ml-dsa-internal-mu',
      '5450:luna-shake-256-a7880',
      '5497:what-a-validation-shows',
    ])
    expect(ALGORITHM_RECORD_ITEMS.at(-1)?.kind).toBe('choose')
    expect(new Set(ALGORITHM_RECORD_ITEMS.map((i) => i.id)).size).toBe(7)
  })

  it('uses the owner-decided mark labels', () => {
    expect(RECORD_MARK_LABELS.validation).toBe('Listed on the algorithm validation')
    expect(RECORD_MARK_LABELS['approved-table']).toBe(
      "Listed in the Policy's Approved Algorithms table"
    )
    expect(RECORD_MARK_LABELS['function-table']).toBe(
      "Listed in the Policy's function table (Security Function Implementations)"
    )
  })

  it('carries two marks on every item and a third, the function table, on the deterministic pair only', () => {
    const withThree = compareItems.filter((i) => i.functionTable).map((i) => i.id)
    expect(withThree).toEqual(['ml-dsa-65-deterministic', 'luna-ml-dsa-deterministic'])
    for (const it of compareItems) {
      expect(marksOf(it).map((m) => m.id)).toEqual(
        it.functionTable
          ? ['validation', 'approved-table', 'function-table']
          : ['validation', 'approved-table']
      )
    }
  })

  it.each(Object.entries(ANSWER_KEY))('answer key for %s', (id, expected) => {
    expect(marksOf(item(id)).map((m) => m.mark.listed)).toEqual(expected)
  })

  it('the three-mark items show the two Policy tables differing', () => {
    // QASM: the Approved Algorithms table prints "No, Yes"; the function table is "Deterministic:No".
    const qasm = item('ml-dsa-65-deterministic')
    expect([qasm.validation.listed, qasm.approvedTable.listed, qasm.functionTable?.listed]).toEqual(
      [true, true, false]
    )
    expect(qasm.approvedTable.quotes.map((q) => q.text).join(' ')).toContain(
      'Deterministic - No, Yes'
    )
    const qasmFunctionText = qasm.functionTable?.quotes.map((q) => q.text).join(' ') ?? ''
    expect(qasmFunctionText).toContain('Deterministic:No')
    expect(qasmFunctionText).not.toContain('Deterministic:Yes')
    // Luna T7: both Approved Algorithms tables print it; the function table shows no setting.
    const luna = item('luna-ml-dsa-deterministic')
    expect(luna.approvedTable.quotes.map((q) => q.text)).toEqual([
      'ML-DSA SigGen A7879 Deterministic - No, Yes',
      'ML-DSA SigGen A7880 Deterministic - No, Yes',
    ])
    expect(luna.functionTable?.note).toMatch(/no Deterministic setting/)
  })

  it('HSS is on neither list but sits in the separate Vendor-Affirmed Algorithms table', () => {
    const hss = item('hss-siggen')
    expect(hss.validation.listed).toBe(false)
    expect(hss.approvedTable.listed).toBe(false)
    expect(hss.approvedTable.note).toContain('Vendor-Affirmed Algorithms (Table 5')
    expect(hss.label).toMatch(/Neither mark applies/)
  })

  it('the Policy is silent on the internal interface and External Mu, and cites SHAKE-256 with A7879 only', () => {
    expect(item('luna-ml-dsa-internal-mu').approvedTable.listed).toBe(false)
    expect(item('luna-ml-dsa-internal-mu').label).toMatch(/does not mention it/)
    expect(item('luna-shake-256-a7880').approvedTable.listed).toBe(false)
    expect(item('luna-shake-256-a7880').label).toMatch(/A7879, not with A7880/)
  })

  it('the single choice has exactly one supported statement (the A5631 header fields)', () => {
    expect(choiceItem.choices.filter((c) => c.ok).map((c) => c.id)).toEqual(['header'])
    expect(judgeChoiceItem(choiceItem, 'header')).toBe(true)
    for (const id of ['level', 'status', 'any-mode', undefined]) {
      expect(judgeChoiceItem(choiceItem, id)).toBe(false)
    }
  })

  it('every quote has the record it comes from, a NIST link, and a page number for Policy quotes', () => {
    const all: RecordQuote[] = []
    for (const it of ALGORITHM_RECORD_ITEMS) {
      if (it.kind === 'compare') {
        all.push(
          ...it.validation.quotes,
          ...it.approvedTable.quotes,
          ...(it.functionTable?.quotes ?? []),
          ...(it.alsoQuotes ?? [])
        )
      } else {
        all.push(...it.quotes)
      }
    }
    expect(all.length).toBeGreaterThan(30)
    for (const q of all) {
      expect(q.text.length, q.text).toBeGreaterThan(0)
      expect(q.source, q.text).not.toBe('')
      expect(q.url, q.text).toMatch(/^https:\/\/csrc\.nist\.gov\//)
      if (q.record === 'policy') {
        expect(q.page, q.text).toBeGreaterThan(0)
        expect(q.url, q.text).toContain('140sp54')
        expect(q.url.endsWith(`.pdf#page=${q.page}`), q.text).toBe(true)
      }
    }
  })

  it('quotes are short: no quote runs past two lines of a table cell', () => {
    for (const it of ALGORITHM_RECORD_ITEMS) {
      const quotes =
        it.kind === 'compare'
          ? [
              ...it.validation.quotes,
              ...it.approvedTable.quotes,
              ...(it.functionTable?.quotes ?? []),
              ...(it.alsoQuotes ?? []),
            ]
          : it.quotes
      for (const q of quotes) expect(q.text.length, q.text).toBeLessThanOrEqual(220)
    }
  })
})

describe('algorithm records: scoring and feedback', () => {
  it('an item is right only when every mark matches', () => {
    for (const it of compareItems) {
      const right = correctAnswers(it)
      expect(judgeCompareItem(it, right).ok, it.id).toBe(true)
      for (const { id } of marksOf(it)) {
        const flipped: MarkAnswers = {
          ...right,
          [id]: right[id] === 'listed' ? 'not-listed' : 'listed',
        }
        const verdict = judgeCompareItem(it, flipped)
        expect(verdict.ok, `${it.id}/${id}`).toBe(false)
        expect(verdict.wrong, `${it.id}/${id}`).toBe(1)
      }
      expect(judgeCompareItem(it, {}).ok, `${it.id} unanswered`).toBe(false)
    }
  })

  it('generic feedback depends on how many marks differ', () => {
    expect(genericFeedback(1, 2)).toMatch(/^One of your marks does not match/)
    expect(genericFeedback(2, 3)).toMatch(/^Some of your marks do not match/)
    expect(genericFeedback(3, 3)).toMatch(/^Every mark differs/)
    expect(genericFeedback(2, 2)).toMatch(/^Every mark differs/)
  })

  it('score bands cover 0 to 7 and every band ends with the shared sentence', () => {
    for (let score = 0; score <= 7; score += 1) {
      expect(scoreBandText(score).endsWith(RECORDS_SCORE_ENDING), String(score)).toBe(true)
    }
    expect(scoreBandText(7)).toContain(RECORDS_SCORE_BANDS[0].text)
    expect(scoreBandText(6)).toContain(RECORDS_SCORE_BANDS[1].text)
    expect(scoreBandText(3)).toContain(RECORDS_SCORE_BANDS[2].text)
    expect(scoreBandText(2)).toContain(RECORDS_SCORE_BANDS[3].text)
  })
})

// ── the rendered step ───────────────────────────────────────────────────────

describe('algorithm records: the rendered step', () => {
  it('gives items 1, 3, 5 and 6 two marks, items 2 and 4 a third, and item 7 one group', () => {
    render(<FipsAlgorithmRecords />)
    const groupCounts = ALGORITHM_RECORD_ITEMS.map(
      (i) => within(section(i.id)).getAllByRole('group').length
    )
    // items 1 to 6: two marks, three on items 2 and 4; item 7: one radio group
    expect(groupCounts).toEqual([2, 3, 2, 3, 2, 2, 1])
    for (const i of compareItems) {
      for (const { id } of marksOf(i)) {
        expect(
          within(section(i.id)).getByRole('group', { name: RECORD_MARK_LABELS[id] })
        ).toBeInTheDocument()
      }
    }
  })

  it('keeps Check disabled until every mark and the last question are answered', () => {
    render(<FipsAlgorithmRecords />)
    const button = screen.getByRole('button', { name: 'Check' })
    expect(button).toBeDisabled()
    for (const i of compareItems) answerItem(i)
    expect(button).toBeDisabled()
    answerChoice(choiceItem.choices.find((c) => c.ok)?.text ?? '')
    expect(button).toBeEnabled()
  })

  it('"Not listed" is an answer: nothing is scored before the learner answers it', () => {
    render(<FipsAlgorithmRecords />)
    // HSS is Not listed / Not listed. Leaving both unanswered must not count as right.
    for (const i of compareItems) if (i.id !== 'hss-siggen') answerItem(i)
    answerChoice(choiceItem.choices.find((c) => c.ok)?.text ?? '')
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()
  })

  it('all right: 7 of 7, the top band, and every item states its result', () => {
    render(<FipsAlgorithmRecords />)
    answerAllCorrectly()
    check()
    const score = screen.getByTestId('fips-records-score')
    expect(score).toHaveTextContent('7 of 7 items match the records')
    expect(score).toHaveTextContent(RECORDS_SCORE_BANDS[0].text)
    expect(score).toHaveTextContent(RECORDS_SCORE_ENDING)
    for (const i of ALGORITHM_RECORD_ITEMS) {
      expect(section(i.id)).toHaveTextContent(i.feedbackRight)
    }
    for (const i of compareItems) expect(section(i.id)).toHaveTextContent(i.label)
  })

  it('the score sits in an aria-live region', () => {
    render(<FipsAlgorithmRecords />)
    answerAllCorrectly()
    check()
    expect(screen.getByTestId('fips-records-score').closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('three-mark item: marking the deterministic option as listed in the function table is wrong', () => {
    render(<FipsAlgorithmRecords />)
    const it = item('ml-dsa-65-deterministic')
    for (const i of compareItems) {
      if (i.id === it.id) answerItem(i, ['function-table'])
      else answerItem(i)
    }
    answerChoice(choiceItem.choices.find((c) => c.ok)?.text ?? '')
    check()
    expect(screen.getByTestId('fips-records-score')).toHaveTextContent('6 of 7 items match')
    const s = section(it.id)
    expect(s).toHaveTextContent(/One of your marks does not match the records/)
    expect(s).toHaveTextContent('(you marked: Listed)')
    expect(s).toHaveTextContent(it.functionTable?.hint ?? 'missing')
    expect(s).toHaveTextContent('Deterministic:No')
    expect(s).not.toHaveTextContent(it.feedbackRight)
    // the other two marks of the same item are shown as matching
    expect(within(s).getAllByLabelText('Matches the records')).toHaveLength(2)
    expect(within(s).getAllByLabelText('Differs from the records')).toHaveLength(1)
  })

  it('two-mark item with the Policy mark wrong shows that mark hint and the silence note', () => {
    render(<FipsAlgorithmRecords />)
    const it = item('luna-ml-dsa-internal-mu')
    for (const i of compareItems) {
      if (i.id === it.id) answerItem(i, ['approved-table'])
      else answerItem(i)
    }
    answerChoice(choiceItem.choices.find((c) => c.ok)?.text ?? '')
    check()
    const s = section(it.id)
    expect(s).toHaveTextContent(it.approvedTable.hint)
    expect(s).toHaveTextContent('Listed on the validations only. The Policy does not mention it.')
    expect(s).toHaveTextContent('The Policy is silent rather than negative')
  })

  it('every mark wrong shows the "every mark differs" feedback', () => {
    render(<FipsAlgorithmRecords />)
    const it = item('hss-siggen')
    for (const i of compareItems) {
      if (i.id === it.id) answerItem(i, ['validation', 'approved-table'])
      else answerItem(i)
    }
    answerChoice(choiceItem.choices.find((c) => c.ok)?.text ?? '')
    check()
    expect(section(it.id)).toHaveTextContent(/^.*Every mark differs from the records/)
    expect(section(it.id)).toHaveTextContent(it.validation.hint)
    expect(section(it.id)).toHaveTextContent(it.approvedTable.hint)
  })

  it('the single choice: a wrong statement shows why each statement does or does not hold', () => {
    render(<FipsAlgorithmRecords />)
    for (const i of compareItems) answerItem(i)
    answerChoice(choiceItem.choices.find((c) => c.id === 'level')?.text ?? '')
    check()
    const s = section(choiceItem.id)
    expect(s).toHaveTextContent('Not that one')
    for (const c of choiceItem.choices) expect(s).toHaveTextContent(c.why)
    expect(s).toHaveTextContent('(your choice)')
    expect(screen.getByTestId('fips-records-score')).toHaveTextContent('6 of 7 items match')
  })

  it('changing an answer after Check hides the results until Check is pressed again', () => {
    render(<FipsAlgorithmRecords />)
    answerAllCorrectly()
    check()
    expect(screen.getByTestId('fips-records-score')).toBeInTheDocument()
    answerItem(item('hss-siggen'), ['validation'])
    expect(screen.queryByTestId('fips-records-score')).not.toBeInTheDocument()
  })

  it('Reset clears the answers', () => {
    render(<FipsAlgorithmRecords />)
    answerAllCorrectly()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()
    expect(screen.queryByTestId('fips-records-score')).not.toBeInTheDocument()
  })

  it('opens on the item an exercise names: highlights it and scrolls to it', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    render(<FipsAlgorithmRecords config={{ item: 'hss-siggen' }} />)
    expect(section('hss-siggen').className).toContain('border-primary')
    expect(section('ml-dsa-65-deterministic').className).not.toContain('border-primary')
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
  })

  it('the reading note keeps the learner answers and the shared template', () => {
    render(<FipsAlgorithmRecords />)
    answerItem(item('hss-siggen'), [])
    const note = screen.getByLabelText('text code block')
    expect(note).toHaveTextContent('1. Certificate #5497: ML-DSA-65 signature generation')
    expect(note).toHaveTextContent(
      '4. Certificate #5450: ML-DSA signature generation, Deterministic setting'
    )
    expect(note).toHaveTextContent('3. Certificate #5497: HSS signature generation')
    expect(note).toHaveTextContent(`${RECORD_MARK_LABELS.validation}: Not listed`)
    expect(note).toHaveTextContent('(not answered)')
    expect(note).toHaveTextContent(
      'Claim I want to check: <operation> with <parameter set>, option <option>'
    )
    expect(note).toHaveTextContent('Question for the vendor or laboratory: <one question>')
  })
})

// ── as-of dates and record dates ────────────────────────────────────────────

describe('algorithm records: as-of dates', () => {
  it('has one as-of date per module', () => {
    expect(ALGORITHM_RECORDS_AS_OF).toEqual({ '5497': '2026-10-23', '5450': '2026-10-24' })
    expect(ALGORITHM_RECORDS_AS_OF_LABEL).toEqual({
      '5497': '23 October 2026',
      '5450': '24 October 2026',
    })
  })

  it('shows each module as-of date and its record dates and pins', () => {
    render(<FipsAlgorithmRecords />)
    const qasm = screen.getByTestId('fips-records-module-5497')
    expect(qasm).toHaveTextContent('records as of 23 October 2026')
    expect(qasm).toHaveTextContent('validation history 8/19/2026 Initial, 8/21/2026 Update')
    expect(qasm).toHaveTextContent('PDF file date 13 Aug 2026')
    expect(qasm).toHaveTextContent('First Validated: 8/14/2024')
    expect(qasm).toHaveTextContent(
      'SHA-256 c216bfd60c5d2616eb623eca4f8a7d94837a214d9e0171a5f3ce003d910c694f'
    )
    const luna = screen.getByTestId('fips-records-module-5450')
    expect(luna).toHaveTextContent('records as of 24 October 2026')
    expect(luna).toHaveTextContent('validation history 7/29/2026 Initial')
    expect(luna).toHaveTextContent('The page shows no Update entry')
    expect(luna).toHaveTextContent('Release Date May 1, 2026')
    expect(luna).toHaveTextContent('April 14, 2026')
    expect(luna).toHaveTextContent('PDF file date 27 Jul 2026')
    expect(luna).toHaveTextContent('First Validated: 1/16/2026')
    expect(luna).toHaveTextContent(
      'SHA-256 f0eb4ff7a8e2879e310cbc2ca252671055dcf69d49b1a5fdebd9264bbd671e81'
    )
  })

  it('links every record to NIST and puts each module list before its items', () => {
    render(<FipsAlgorithmRecords />)
    for (const mod of Object.values(ALGORITHM_RECORD_MODULES)) {
      const panel = screen.getByTestId(`fips-records-module-${mod.cert}`)
      const hrefs = within(panel)
        .getAllByRole('link')
        .map((l) => l.getAttribute('href'))
      for (const r of mod.records) {
        expect(hrefs).toContain(r.url)
        expect(r.url).toMatch(/^https:\/\/csrc\.nist\.gov\//)
      }
    }
    const first5450 = section('luna-ml-dsa-deterministic')
    const panel5450 = screen.getByTestId('fips-records-module-5450')
    expect(
      panel5450.compareDocumentPosition(first5450) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('has freshness claims for the facts that change when either certificate or validation is updated', () => {
    const records = FIPS_FRESHNESS_CLAIMS.filter((c) => c.id.startsWith('cert-module-records-'))
    expect(records.map((c) => c.id).sort()).toEqual([
      'cert-module-records-5450-a7879',
      'cert-module-records-5450-a7880',
      'cert-module-records-5450-certificate',
      'cert-module-records-5497-a5631',
      'cert-module-records-5497-certificate',
    ])
    for (const c of records) {
      const module = c.id.includes('-5497-') ? '5497' : '5450'
      expect(c.asOf, c.id).toBe(ALGORITHM_RECORDS_AS_OF[module])
      expect(c.recheck, c.id).toMatch(/^https:\/\/csrc\.nist\.gov\//)
    }
    expect(new Set(FIPS_FRESHNESS_CLAIMS.map((c) => c.id)).size).toBe(FIPS_FRESHNESS_CLAIMS.length)
  })
})

// ── Luna T7 credit line ─────────────────────────────────────────────────────

describe('algorithm records: the Luna T7 credit line', () => {
  it('is the owner-decided wording', () => {
    expect(LUNA_POLICY_CREDIT).toBe(
      '© 2026 SafeNet Assured Technologies, LLC. All rights reserved. Quoted from the NIST-listed Security Policy for certificate #5450.'
    )
  })

  it('sits beside the module list and, after Check, beside the quotes of every Luna item only', () => {
    render(<FipsAlgorithmRecords />)
    expect(
      within(screen.getByTestId('fips-records-module-5450')).getByText(LUNA_POLICY_CREDIT)
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('fips-records-module-5497')).queryByText(LUNA_POLICY_CREDIT)
    ).toBeNull()
    answerAllCorrectly()
    check()
    for (const id of [
      'luna-ml-dsa-deterministic',
      'luna-ml-dsa-internal-mu',
      'luna-shake-256-a7880',
    ]) {
      expect(within(section(id)).getByText(LUNA_POLICY_CREDIT), id).toBeInTheDocument()
    }
    for (const id of [
      'ml-dsa-65-external-pure',
      'ml-dsa-65-deterministic',
      'hss-siggen',
      'what-a-validation-shows',
    ]) {
      expect(within(section(id)).queryByText(LUNA_POLICY_CREDIT), id).toBeNull()
    }
  })

  it('quotes carry their page and a link to NIST, never a hosted copy', () => {
    render(<FipsAlgorithmRecords />)
    answerAllCorrectly()
    check()
    const links = within(section('luna-ml-dsa-deterministic')).getAllByRole('link')
    const policyLinks = links.filter((l) => l.getAttribute('href')?.includes('140sp5450.pdf'))
    expect(policyLinks.map((l) => l.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/security-policies/140sp5450.pdf#page=13',
        'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/security-policies/140sp5450.pdf#page=16',
        'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/security-policies/140sp5450.pdf#page=21',
      ])
    )
    for (const l of links)
      expect(l.getAttribute('href')).toMatch(/^https:\/\/(csrc|nvlpubs)\.nist\.gov\//)
  })
})

// ── neutral wording ─────────────────────────────────────────────────────────

/** The documents' own table names are allowed: they are not a label we put on a function. */
const withoutTableNames = (text: string): string =>
  text
    .replace(/Vendor-Affirmed Algorithms/g, '')
    .replace(/Approved Algorithms( - (Hybrid|Firmware))?/g, '')

describe('algorithm records: neutral "listed" wording', () => {
  const authoredTexts = (): string[] => {
    const out: string[] = Object.values(RECORD_MARK_LABELS)
    for (const m of Object.values(ALGORITHM_RECORD_MODULES)) {
      out.push(m.heading, m.source, ...m.tables, ...m.recordDates, ...m.setup)
    }
    for (const it of ALGORITHM_RECORD_ITEMS) {
      out.push(it.title, it.prompt, it.explanation, it.feedbackRight)
      if (it.kind === 'compare') {
        out.push(it.claim, it.label, it.approvedNote ?? '')
        for (const { mark } of marksOf(it)) out.push(mark.where, mark.note ?? '', mark.hint)
      } else {
        for (const c of it.choices) out.push(c.text, c.why)
      }
    }
    out.push(...RECORDS_SCORE_BANDS.map((b) => b.text), RECORDS_SCORE_ENDING)
    const q = stepExercises['fips-140-3-certification/fips-algorithm-records']
    out.push(q.prompt, ...q.options, q.why)
    for (const e of exercises.filter((x) => x.stepId === 'fips-algorithm-records')) {
      out.push(e.title, e.description, e.observe)
    }
    return out.filter(Boolean)
  }

  it('never says a function is approved or offered in the text we wrote', () => {
    for (const text of authoredTexts()) {
      expect(withoutTableNames(text), text).not.toMatch(/\bapproved\b/i)
      expect(withoutTableNames(text), text).not.toMatch(/\boffer(s|ed|ing)?\b/i)
    }
  })

  it('says nothing about quality and does not rank or recommend a module', () => {
    for (const text of authoredTexts()) {
      expect(text, text).not.toMatch(
        /\b(better|worse|best|safer|stronger|weaker|superior|inferior|recommend(ed|s)?|more secure|less secure|trustworthy)\b/i
      )
    }
  })

  it('the rendered step, before and after Check, never labels a function approved or offered', () => {
    render(<FipsAlgorithmRecords />)
    expect(withoutTableNames(document.body.textContent ?? '')).not.toMatch(/\bapproved\b/i)
    expect(withoutTableNames(document.body.textContent ?? '')).not.toMatch(/\boffer(s|ed|ing)?\b/i)
    answerAllCorrectly()
    check()
    expect(withoutTableNames(document.body.textContent ?? '')).not.toMatch(/\bapproved\b/i)
    expect(withoutTableNames(document.body.textContent ?? '')).not.toMatch(/\boffer(s|ed|ing)?\b/i)
  })

  it('states that the step neither rates nor compares the modules, and names vendors only as the source', () => {
    render(<FipsAlgorithmRecords />)
    expect(document.body.textContent).toMatch(
      /Each vendor is named only as the source of its records\. The step does not rate either module or compare them/
    )
    expect(ALGORITHM_RECORD_MODULES['5497'].source).toBe(
      'Source of the records: Crypto4A Technologies Inc. and NIST.'
    )
    expect(ALGORITHM_RECORD_MODULES['5450'].source).toBe(
      'Source of the records: Thales Trusted Cyber Technologies and NIST.'
    )
  })
})

// ── duration, registry, exercises and the step question ────────────────────

describe('algorithm records: the step in the lesson', () => {
  it('counts toward the lesson: 80 minutes, two workshop steps, the new one second', () => {
    expect(manifest.duration).toBe('80 min')
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual([
      'fips-level-planner',
      'fips-algorithm-records',
    ])
    expect(manifest.workshopSteps?.[1].label).toBe('Read the algorithm records')
    expect(buildCatalog(MANIFESTS)['fips-140-3-certification'].duration).toBe('80 min')
    expect(buildStepCounts(MANIFESTS)['fips-140-3-certification']).toBe(2)
    expect(MANIFEST_BY_ID['fips-140-3-certification'].duration).toBe('80 min')
  })

  it('every new exercise opens a real item of the step', () => {
    const ids = new Set(ALGORITHM_RECORD_ITEMS.map((i) => i.id))
    const mine = exercises.filter((e) => e.stepId === 'fips-algorithm-records')
    expect(mine.map((e) => e.id)).toEqual([
      'fips-same-name-different-mode',
      'fips-vendor-affirmed-entry',
      'fips-policy-silent-not-negative',
      'fips-number-beside-the-entry',
    ])
    for (const e of mine) expect(ids.has(String(e.config?.item)), e.id).toBe(true)
  })

  it('the step question is in stepExercises.ts word for word, and its answer is the Policy tables', () => {
    const key = 'fips-140-3-certification/fips-algorithm-records'
    expect(STEP_EXERCISES[key]).toEqual(stepExercises[key])
    const q = stepExercises[key]
    expect(q.options[q.answer]).toMatch(/Approved Algorithms table and its function table/)
    expect(q.prompt).toMatch(/\?$/)
  })
})
