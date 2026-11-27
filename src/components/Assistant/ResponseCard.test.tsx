// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ResponseCard } from './ResponseCard'
import type { RenderableAnswer } from './answerRules'
import type { CardNav } from './resourceTabs'
import type { AssistantRow } from '@/services/assistant/contract'
import type { AssistantTurn } from '@/store/useAssistantSessionStore'
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

const turnOf = (answer: RenderableAnswer): AssistantTurn => ({
  id: 'turn-1',
  question: answer.question,
  status: 'done',
  answer,
})

function show(
  answer: RenderableAnswer,
  extra: {
    open?: boolean
    onAction?: Mock<(row: AssistantRow) => void>
    onOpen?: Mock<() => void>
    sheet?: boolean
  } = {}
) {
  const onAction = extra.onAction ?? vi.fn<(row: AssistantRow) => void>()
  const onOpen = extra.onOpen ?? vi.fn<() => void>()
  function Harness() {
    const [nav, setNav] = useState<CardNav | undefined>()
    return (
      <ResponseCard
        turn={turnOf(answer)}
        open={extra.open ?? true}
        onOpen={onOpen}
        nav={nav}
        onNav={setNav}
        sheet={extra.sheet}
        onAction={onAction}
      />
    )
  }
  const view = render(<Harness />)
  return { onAction, onOpen, view }
}

const next = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /^Next resource/ }))

describe('direct answer', () => {
  it('shows the value, the evidence on one line with the whole line as its title, and "From:" for the source', () => {
    show(directAnswerCnsa as RenderableAnswer)
    const box = screen.getByRole('group', { name: 'Direct answer' })
    expect(within(box).getByText(/2030 for software and firmware signing/)).toBeInTheDocument()
    const evidence =
      'Evidence: Compliance framework: CNSA 2.0 (CMP:CNSA-2). Data file compliance_11182026_r3. Checked against the record.'
    expect(within(box).getByText(evidence)).toHaveAttribute('title', evidence)
    const source = screen.getByText('From: Compliance framework: CNSA 2.0 (CMP:CNSA-2)')
    expect(source).toHaveAttribute(
      'title',
      'Answer drawn from: Compliance framework: CNSA 2.0 (CMP:CNSA-2)'
    )
  })

  it('does not draw the fixed "Here is what the Hub holds on this." line beside a direct answer', () => {
    show({
      ...directAnswerCnsa,
      answerText: 'Here is what the Hub holds on this.',
    } as RenderableAnswer)
    expect(screen.queryByText('Here is what the Hub holds on this.')).toBeNull()
  })

  it('does not draw a direct answer whose evidence is missing, and says resources only', () => {
    show(directWithoutEvidence as RenderableAnswer)
    expect(screen.queryByRole('group', { name: 'Direct answer' })).toBeNull()
    expect(screen.queryByText(/Evidence:/)).toBeNull()
    expect(screen.getByText(/No direct answer: resources only\./)).toBeInTheDocument()
    expect(screen.queryByText(/^From:/)).toBeNull()
    expect(screen.getByText(/^Closest: /)).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('CNSA 2.0')
  })

  it('never draws a field the contract does not name', () => {
    const { view } = show(withPrivateFields as RenderableAnswer)
    expect(view.container.textContent).not.toContain('PRIVATE-WRITER')
    expect(view.container.textContent).not.toContain('PRIVATE-REVIEWER')
    expect(view.container.textContent).not.toContain('NICE-SECRET')
  })
})

describe('resources only', () => {
  it('uses the note as the answer line, names the closest source and opens on Top 5', () => {
    show(conceptMlKem as RenderableAnswer)
    expect(screen.getByText(/No direct answer: resources only\./)).toBeInTheDocument()
    expect(screen.queryByText('Here is what the Hub holds on this.')).toBeNull()
    expect(screen.getByText('Closest: Glossary term: ML-KEM (GL:ml-kem)')).toBeInTheDocument()
    expect(screen.getByRole('tab', { selected: true })).toHaveAccessibleName('Top 5, 5 resources')
  })

  it('draws the date answer with several matches as resources only, DORA first', () => {
    show(banksEu as RenderableAnswer)
    expect(screen.queryByRole('group', { name: 'Direct answer' })).toBeNull()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('DORA')
  })

  it('gives the planning answer a Tools tab', () => {
    show(planBank as RenderableAnswer)
    expect(screen.getByRole('tab', { name: 'Tools, 1 resource' })).toBeInTheDocument()
  })
})

describe('the resource shown', () => {
  it('draws kind, status, rank, title, dimensions, extract, tag, one named action, Save and Copy link', async () => {
    const user = userEvent.setup()
    const { onAction } = show(directAnswerCnsa as RenderableAnswer)
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByText('Compliance framework')).toBeInTheDocument()
    expect(within(panel).getByText('Active')).toBeInTheDocument()
    expect(within(panel).getByText('#1 by relevance')).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { name: 'CNSA 2.0' })).toBeInTheDocument()
    // one line: the source in words, then the dimensions
    expect(
      within(panel).getByText('Source: NSA requirement · Industries: Government · Place: US')
    ).toBeInTheDocument()
    expect(within(panel).getByText(cnsaRow.extract)).toBeInTheDocument()
    expect(within(panel).getByText('CMP:CNSA-2')).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Save to My work' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Copy link: CNSA 2.0' })).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Go to page: CNSA 2.0' }))
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ tag: 'CMP:CNSA-2' }))
  })

  it('carries the tag on the panel, so focus can come back to its action', () => {
    show(directAnswerCnsa as RenderableAnswer)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-tag', 'CMP:CNSA-2')
  })

  it('copies only the public short address, from the row and from the header', async () => {
    const user = userEvent.setup()
    show(directAnswerCnsa as RenderableAnswer)
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: 'Copy link: CNSA 2.0' }))
    expect(writeText).toHaveBeenLastCalledWith(`${window.location.origin}/go/CMP:CNSA-2`)
    await user.click(screen.getByRole('button', { name: 'Copy link to the source: CNSA 2.0' }))
    expect(writeText).toHaveBeenLastCalledWith(`${window.location.origin}/go/CMP:CNSA-2`)
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
    show({
      ...(broadMatch as RenderableAnswer),
      groups: [{ name: 'Learn', rows: [odd], more: [] }],
    } as RenderableAnswer)
    expect(screen.queryByRole('button', { name: /Copy link/ })).toBeNull()
  })

  it('shows a paid standard with no quote, says the Hub links to it, and opens the publisher in a new tab', async () => {
    const user = userEvent.setup()
    show(conceptMlKem as RenderableAnswer)
    // the documents of the answer, in their own tab: the paid standard is the second
    await user.click(screen.getByRole('tab', { name: /^Library, / }))
    await next(user)
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

  it('shows the dimension line for a lesson row, with no source line', async () => {
    const user = userEvent.setup()
    show(conceptMlKem as RenderableAnswer)
    await user.click(screen.getByRole('tab', { name: 'Learn, 2 resources' }))
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: 'TLS Basics' })).toBeInTheDocument()
    expect(within(panel).getByText('Stage: Practitioner')).toBeInTheDocument()
    expect(within(panel).queryByText(/^Source:/)).toBeNull()
  })
})

describe('name lookup', () => {
  it('draws the record card in the header and puts the record in Top 5', () => {
    show(nameCardMlKem as RenderableAnswer)
    expect(screen.getByText('One Hub record matches that name.')).toBeInTheDocument()
    const card = screen.getByRole('group', { name: 'ML-KEM (FIPS 203)' })
    expect(within(card).getByText('Algorithm')).toBeInTheDocument()
    expect(within(card).getByText(/Taught in TLS Basics/)).toBeInTheDocument()
    expect(within(card).getByText(/Try it in TLS simulator/)).toBeInTheDocument()
    expect(screen.getByText(/^Matched by name: one Hub record, shown above\./)).toBeInTheDocument()
    expect(screen.queryByText(/^(From|Closest):/)).toBeNull()
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-tag', 'ALG:ML-KEM')
  })

  it('copies the short link of the name card, since the answer has none of its own', async () => {
    const user = userEvent.setup()
    show(nameCardMlKem as RenderableAnswer)
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(
      screen.getByRole('button', { name: 'Copy link to the source: ML-KEM (FIPS 203)' })
    )
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/go/ALG:ML-KEM`)
  })

  it('draws named choices instead of a card and shows no tabs', async () => {
    const { onAction } = show(nameChoices as RenderableAnswer)
    expect(screen.queryByRole('group', { name: /ML-DSA/ })).toBeNull()
    expect(screen.queryByRole('tablist')).toBeNull()
    await userEvent.setup().click(screen.getByRole('button', { name: /ML-DSA \(FIPS 204\)/ }))
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ tag: 'ALG:ML-DSA' }))
  })
})

describe('notes without a source line', () => {
  it('not-a-fact: the note is the answer line, with no contradicting fixed line and no source', () => {
    show(notAFact as RenderableAnswer)
    expect(
      screen.getByText(
        'The Hub does not state this as a fact and gives no personal advice or prediction. These are the closest resources.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Here is what the Hub holds on this.')).toBeNull()
    expect(screen.queryByText(/^(From|Closest):/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Copy link to the source/ })).toBeNull()
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('broad: the note is the answer line and there is no source line', () => {
    show(broadMatch as RenderableAnswer)
    expect(
      screen.getByText(
        'Broad match: the Hub has no direct answer to this. These are the closest resources.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/^(From|Closest):/)).toBeNull()
  })
})

describe('nothing held', () => {
  it('draws the fixed not-held words, no tabs and no Save', () => {
    show(notHeld as RenderableAnswer)
    expect(
      screen.getByText('The Hub does not hold an answer to this question.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByRole('tabpanel')).toBeNull()
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
    show({
      ...(broadMatch as RenderableAnswer),
      answerText: 'There are 4 workshop steps.',
      passage: {
        heading: 'TLS Basics · PQC in TLS & Hybrid Modes',
        text: 'Hybrid key exchange combines two groups.',
      },
    } as unknown as RenderableAnswer)
    expect(screen.getByText('Hybrid key exchange combines two groups.')).toBeInTheDocument()
    expect(screen.getByText('TLS Basics · PQC in TLS & Hybrid Modes')).toBeInTheDocument()
  })
})

describe('folded card', () => {
  it('is one button with the eyebrow, the question and a summary; it opens on a press', async () => {
    const user = userEvent.setup()
    const { onOpen } = show(directAnswerCnsa as RenderableAnswer, { open: false })
    const button = screen.getByRole('button', { name: /Earlier answer/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls')
    expect(button).toHaveTextContent('When is the CNSA 2.0 deadline?')
    expect(button).toHaveTextContent('3 resources · Learn, Compliance, Library')
    expect(screen.queryByRole('tablist')).toBeNull()
    await user.click(button)
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('marks more than three types with an ellipsis, and says "No resources" for an answer without any', () => {
    const many = {
      ...(broadMatch as RenderableAnswer),
      groups: [
        {
          name: 'Learn' as const,
          rows: [
            makeRow({
              kind: 'Module',
              tag: 'LM-001',
              title: 'a',
              action: 'Go to module',
              group: 'Learn',
            }),
            makeRow({
              kind: 'Threat',
              tag: 'THR:a',
              title: 'b',
              action: 'Go to page',
              group: 'Learn',
            }),
            makeRow({
              kind: 'Patent',
              tag: 'PAT:a',
              title: 'c',
              action: 'Go to page',
              group: 'Learn',
            }),
            makeRow({
              kind: 'Leader',
              tag: 'LDR:a',
              title: 'd',
              action: 'Go to page',
              group: 'Learn',
            }),
          ],
          more: [],
        },
      ],
    } as RenderableAnswer
    const first = show(many, { open: false })
    expect(screen.getByRole('button')).toHaveTextContent(
      '4 resources · Learn, Threats, Community …'
    )
    first.view.unmount()
    show(notHeld as RenderableAnswer, { open: false })
    expect(screen.getByRole('button')).toHaveTextContent('No resources')
  })
})

describe('loading', () => {
  it('shows the question and the loading line', () => {
    render(
      <ResponseCard
        turn={{ id: 't', question: 'What is ML-KEM?', status: 'loading' }}
        open
        onOpen={vi.fn()}
        nav={undefined}
        onNav={vi.fn()}
        onAction={vi.fn()}
      />
    )
    expect(screen.getByRole('article', { name: 'What is ML-KEM?' })).toHaveTextContent(
      'Looking in the Hub records.'
    )
  })
})

describe('Save answer', () => {
  it('sits in the header, hands tags, not text, to the saved-answers port and becomes "Saved to My work"', async () => {
    const user = userEvent.setup()
    const saveAnswer = vi.fn(() => ({ ok: true as const, alreadySaved: false }))
    setSavedAnswersPort({
      saveAnswer,
      isAnswerSaved: () => false,
      saveReference: () => ({ ok: true, alreadySaved: false }),
      isReferenceSaved: () => false,
    })
    show(directAnswerCnsa as RenderableAnswer)
    const tablist = screen.getByRole('tablist')
    const save = screen.getByRole('button', { name: 'Save answer' })
    // above the tabs, in the header
    expect(save.compareDocumentPosition(tablist) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await user.click(save)
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
      isReferenceSaved: () => false,
    })
    show(directAnswerCnsa as RenderableAnswer)
    expect(screen.getByRole('button', { name: 'Saved to My work' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('Save to My work on the resource shown stores that record once', async () => {
    const user = userEvent.setup()
    const saveReference = vi.fn(() => ({ ok: true as const, alreadySaved: false }))
    setSavedAnswersPort({
      saveAnswer: () => ({ ok: true, alreadySaved: false }),
      isAnswerSaved: () => false,
      saveReference,
      isReferenceSaved: () => false,
    })
    show(directAnswerCnsa as RenderableAnswer)
    await user.click(screen.getByRole('button', { name: 'Save to My work' }))
    expect(saveReference).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'CMP:CNSA-2', question: 'When is the CNSA 2.0 deadline?' })
    )
    // the answer's own Save answer button has not been used, so only the resource's button changed
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
    const { view } = show(a as RenderableAnswer)
    expect(view.container.textContent ?? '').not.toMatch(
      /\b(language model|LLM|AI|Gemini|WebLLM|OpenAI|download|API key|generated|confidence)\b/i
    )
  })
})
