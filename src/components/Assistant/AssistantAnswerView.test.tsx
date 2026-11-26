// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { AssistantAnswerView } from './AssistantAnswerView'
import type { RenderableAnswer } from './answerRules'
import { setSavedAnswersPort } from '@/services/assistant/drawerSaves'
import {
  banksEu,
  broadMatch,
  cnsaRow,
  conceptMlKem,
  directAnswerCnsa,
  directWithoutEvidence,
  makeRow,
  nameCardMlKem,
  nameChoices,
  notAFact,
  notHeld,
  planBank,
  withPrivateFields,
} from '@/test/fixtures/assistantAnswers'

afterEach(() => setSavedAnswersPort())

function show(answer: RenderableAnswer, onAction = vi.fn()) {
  render(<AssistantAnswerView answer={answer} onAction={onAction} />)
  return onAction
}

describe('direct answer', () => {
  it('shows the value, its evidence line and "Answer drawn from", then the groups', () => {
    show(directAnswerCnsa as RenderableAnswer)
    const box = screen.getByRole('group', { name: 'Direct answer' })
    expect(within(box).getByText(/2030 for software and firmware signing/)).toBeInTheDocument()
    expect(
      within(box).getByText(
        'Evidence: Compliance framework: CNSA 2.0 (CMP:CNSA-2). Data file compliance_11182026_r3. Checked against the record.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('Answer drawn from: Compliance framework: CNSA 2.0 (CMP:CNSA-2)')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Grouped for a fact, a date or a rule: best first, up to 3 per group.')
    ).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Hub resources in this answer' })).toBeInTheDocument()
  })

  it('does not draw a direct answer whose evidence is missing, and says resources only', () => {
    show(directWithoutEvidence as RenderableAnswer)
    expect(screen.queryByRole('group', { name: 'Direct answer' })).toBeNull()
    expect(screen.queryByText(/Evidence:/)).toBeNull()
    expect(screen.getByText(/No direct answer: resources only\./)).toBeInTheDocument()
    expect(screen.queryByText(/^Answer drawn from/)).toBeNull()
    expect(screen.getByText(/^Closest source: /)).toBeInTheDocument()
    // the resources still follow
    expect(screen.getByText('CNSA 2.0', { selector: 'p' })).toBeInTheDocument()
  })

  it('never draws a field the contract does not name', () => {
    const { container } = render(
      <AssistantAnswerView answer={withPrivateFields as RenderableAnswer} onAction={vi.fn()} />
    )
    expect(container.textContent).not.toContain('PRIVATE-WRITER')
    expect(container.textContent).not.toContain('PRIVATE-REVIEWER')
    expect(container.textContent).not.toContain('NICE-SECRET')
  })
})

describe('resources only', () => {
  it('names the closest source, notes that there is no direct answer, and draws References first when the engine orders them so', () => {
    show(conceptMlKem as RenderableAnswer)
    expect(screen.getByText(/No direct answer: resources only\./)).toBeInTheDocument()
    expect(
      screen.getByText('Closest source: Glossary term: ML-KEM (GL:ml-kem)')
    ).toBeInTheDocument()
    const groups = screen.getAllByRole('list').map((g) => g.getAttribute('aria-labelledby'))
    expect(groups.map((id) => document.getElementById(id!)?.textContent)).toEqual([
      'References',
      'Learn',
      'Tools',
    ])
  })

  it('shows at most three rows per group and hides the rest behind one "Show n more" control', async () => {
    const user = userEvent.setup()
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({
        kind: 'Library document',
        tag: `LIB:TEST ${i}`,
        title: `Test document ${i}`,
        action: 'Read here',
        group: 'References',
      })
    )
    const answer: RenderableAnswer = {
      ...(conceptMlKem as RenderableAnswer),
      groups: [{ name: 'References', rows, more: [] }],
    } as RenderableAnswer
    show(answer)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    const more = screen.getByRole('button', { name: 'Show 2 more records' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Show fewer records' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('draws the planning answer with Tools first', () => {
    show(planBank as RenderableAnswer)
    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Tools')
  })

  it('draws the date answer with several matches as resources only, DORA first', () => {
    show(banksEu as RenderableAnswer)
    expect(screen.queryByRole('group', { name: 'Direct answer' })).toBeNull()
    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('DORA')).toBeInTheDocument()
  })
})

describe('row anatomy', () => {
  it('draws kind, source, status, title, dimensions, extract, tag, one named action and Copy link', async () => {
    const onAction = show(directAnswerCnsa as RenderableAnswer)
    const item = screen.getAllByRole('listitem')[0]
    expect(within(item).getByText('Compliance framework')).toBeInTheDocument()
    expect(within(item).getByText('Source: NSA requirement')).toBeInTheDocument()
    expect(within(item).getByText('Active')).toBeInTheDocument()
    expect(within(item).getByText('CNSA 2.0')).toBeInTheDocument()
    expect(within(item).getByText('Industries: Government · Place: US')).toBeInTheDocument()
    expect(within(item).getByText(cnsaRow.extract)).toBeInTheDocument()
    expect(within(item).getByText('CMP:CNSA-2')).toBeInTheDocument()
    const action = within(item).getByRole('button', { name: 'Go to page: CNSA 2.0' })
    await userEvent.setup().click(action)
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ tag: 'CMP:CNSA-2' }))
    expect(within(item).getByRole('button', { name: 'Copy link: CNSA 2.0' })).toBeInTheDocument()
  })

  it('copies only the public short address', async () => {
    const user = userEvent.setup()
    show(directAnswerCnsa as RenderableAnswer)
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getAllByRole('button', { name: 'Copy link: CNSA 2.0' })[0])
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/go/CMP:CNSA-2`)
    expect(await screen.findByText('Link copied')).toBeInTheDocument()
  })

  it('offers no Copy link for a row whose address is not a /go address', () => {
    const odd = makeRow({
      kind: 'Module',
      tag: 'LM-001',
      title: 'Odd row',
      action: 'Go to module',
      group: 'Learn',
      goLink: 'https://example.com/private',
    })
    const answer = {
      ...(broadMatch as RenderableAnswer),
      groups: [{ name: 'Learn', rows: [odd], more: [] }],
    } as RenderableAnswer
    show(answer)
    expect(screen.queryByRole('button', { name: /Copy link/ })).toBeNull()
  })

  it('shows a paid standard with no quote, says the Hub links to it, and opens the publisher in a new tab', () => {
    show(conceptMlKem as RenderableAnswer)
    expect(
      screen.getByText('The Hub links to this standard and does not quote it.')
    ).toBeInTheDocument()
    const link = screen.getByRole('link', {
      name: 'Open reference: ISO/IEC 18033-2: Encryption algorithms, asymmetric ciphers',
    })
    expect(link).toHaveAttribute('href', 'https://www.iso.org/standard/37971.html')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows no NICE label and no source line for lesson rows', () => {
    show(conceptMlKem as RenderableAnswer)
    const lesson = screen
      .getAllByRole('listitem')
      .find((li) => within(li).queryByText('TLS Basics'))!
    expect(within(lesson).queryByText(/^Source:/)).toBeNull()
    expect(within(lesson).getByText('Stage: Practitioner')).toBeInTheDocument()
  })
})

describe('name lookup', () => {
  it('draws the record card, then related rows, with "Matched by name" and no source line', () => {
    show(nameCardMlKem as RenderableAnswer)
    expect(screen.getByText('One Hub record matches that name.')).toBeInTheDocument()
    const card = screen.getByRole('group', { name: 'ML-KEM (FIPS 203)' })
    expect(within(card).getByText('Algorithm')).toBeInTheDocument()
    expect(within(card).getByText(/Taught in TLS Basics/)).toBeInTheDocument()
    expect(within(card).getByText(/Try it in TLS simulator/)).toBeInTheDocument()
    expect(screen.getByText(/^Matched by name: one Hub record, shown above\./)).toBeInTheDocument()
    expect(screen.queryByText(/^(Answer drawn from|Closest source)/)).toBeNull()
  })

  it('draws named choices instead of a card when several records share the name', async () => {
    const onAction = show(nameChoices as RenderableAnswer)
    expect(screen.queryByRole('group', { name: /ML-DSA/ })).toBeNull()
    await userEvent.setup().click(screen.getByRole('button', { name: /ML-DSA \(FIPS 204\)/ }))
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ tag: 'ALG:ML-DSA' }))
  })
})

describe('notes without a source line', () => {
  it('not-a-fact: the exact note, resources, no source line', () => {
    show(notAFact as RenderableAnswer)
    expect(
      screen.getByText(
        'The Hub does not state this as a fact and gives no personal advice or prediction. These are the closest resources.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/^(Answer drawn from|Closest source)/)).toBeNull()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('broad: the exact note and no source line', () => {
    show(broadMatch as RenderableAnswer)
    expect(
      screen.getByText(
        'Broad match: the Hub has no direct answer to this. These are the closest resources.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/^(Answer drawn from|Closest source)/)).toBeNull()
  })
})

describe('nothing held', () => {
  it('draws the fixed not-held words and no resources', () => {
    show(notHeld as RenderableAnswer)
    expect(
      screen.getByText('The Hub does not hold an answer to this question.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save answer' })).toBeNull()
  })

  it('also covers an answer that carries no records at all', () => {
    show({ ...(broadMatch as RenderableAnswer), groups: [] } as RenderableAnswer)
    expect(
      screen.getByText('The Hub does not hold an answer to this question.')
    ).toBeInTheDocument()
  })
})

describe('built sentence with a passage box', () => {
  it('draws the module text in a box under the sentence', () => {
    const answer = {
      ...(broadMatch as RenderableAnswer),
      answerText: 'There are 4 workshop steps.',
      passage: {
        heading: 'TLS Basics · PQC in TLS & Hybrid Modes',
        text: 'Hybrid key exchange combines two groups.',
      },
    } as unknown as RenderableAnswer
    show(answer)
    expect(screen.getByText('There are 4 workshop steps.')).toBeInTheDocument()
    expect(screen.getByText('TLS Basics · PQC in TLS & Hybrid Modes')).toBeInTheDocument()
    expect(screen.getByText('Hybrid key exchange combines two groups.')).toBeInTheDocument()
  })
})

describe('Save answer', () => {
  it('hands tags, not text, to the saved-answers port and becomes "Saved to My work"', async () => {
    const user = userEvent.setup()
    const saveAnswer = vi.fn(() => ({ ok: true as const, alreadySaved: false }))
    setSavedAnswersPort({
      saveAnswer,
      isAnswerSaved: () => false,
      saveReference: () => ({ ok: true, alreadySaved: false }),
      isReferenceSaved: () => false,
    })
    show(directAnswerCnsa as RenderableAnswer)
    await user.click(screen.getByRole('button', { name: 'Save answer' }))
    expect(saveAnswer).toHaveBeenCalledWith({
      question: 'When is the CNSA 2.0 deadline?',
      answerText: directAnswerCnsa.answerText,
      note: directAnswerCnsa.note,
      sourceTag: 'CMP:CNSA-2',
      rowTags: ['CMP:CNSA-2', 'LIB:FIPS 203', 'LM-008'],
    })
    expect(await screen.findByRole('button', { name: 'Saved to My work' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('keeps keyboard focus on the button after saving, and a second press stores nothing more', async () => {
    const user = userEvent.setup()
    const saveAnswer = vi.fn(() => ({ ok: true as const, alreadySaved: false }))
    setSavedAnswersPort({
      saveAnswer,
      isAnswerSaved: () => false,
      saveReference: () => ({ ok: true, alreadySaved: false }),
      isReferenceSaved: () => false,
    })
    show(directAnswerCnsa as RenderableAnswer)
    const save = screen.getByRole('button', { name: 'Save answer' })
    save.focus()
    await user.keyboard('{Enter}')
    const saved = await screen.findByRole('button', { name: 'Saved to My work' })
    expect(saved).toBe(save)
    expect(saved).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(saveAnswer).toHaveBeenCalledTimes(1)
  })

  it('keeps the button and says so when the save fails', async () => {
    const user = userEvent.setup()
    setSavedAnswersPort({
      saveAnswer: () => ({ ok: false }),
      isAnswerSaved: () => false,
      saveReference: () => ({ ok: false }),
      isReferenceSaved: () => false,
    })
    show(directAnswerCnsa as RenderableAnswer)
    await user.click(screen.getByRole('button', { name: 'Save answer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not saved/i)
    expect(screen.getByRole('button', { name: 'Save answer' })).toBeEnabled()
  })

  it('is already "Saved to My work" for an answer saved before', () => {
    setSavedAnswersPort({
      saveAnswer: () => ({ ok: true, alreadySaved: true }),
      isAnswerSaved: () => true,
      saveReference: () => ({ ok: true, alreadySaved: true }),
      isReferenceSaved: () => true,
    })
    show(directAnswerCnsa as RenderableAnswer)
    expect(screen.getByRole('button', { name: 'Saved to My work' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})

describe('wording rule', () => {
  it.each([
    ['direct', directAnswerCnsa],
    ['concept', conceptMlKem],
    ['name', nameCardMlKem],
    ['not held', notHeld],
  ])('the %s answer never mentions a model, a provider, a download or a key', (_n, a) => {
    const { container } = render(
      <AssistantAnswerView answer={a as RenderableAnswer} onAction={vi.fn()} />
    )
    expect(container.textContent ?? '').not.toMatch(
      /\b(language model|LLM|AI|Gemini|WebLLM|OpenAI|download|API key|generated|confidence)\b/i
    )
  })
})
