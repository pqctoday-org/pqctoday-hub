// SPDX-License-Identifier: AGPL-3.0-only
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { AssistantConversation } from './AssistantConversation'
import { useAssistantAskedStore } from '@/store/useAssistantAskedStore'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useAssistantReturnStore } from '@/store/useAssistantReturnStore'
import { useChatStore } from '@/store/useChatStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { useGlossaryDrawerStore } from '@/store/useGlossaryDrawerStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { setSavedAnswersPort } from '@/services/assistant/drawerSaves'
import type { AssistantResourcesAnswer } from '@/services/assistant/contract'

const client = vi.hoisted(() => ({ failNext: 0, calls: [] as string[] }))
vi.mock('./assistantClient', async () => {
  const engine = await import('@/test/fixtures/assistantFixtureEngine')
  const fixtures = await import('@/test/fixtures/assistantAnswers')
  return {
    askAssistant: async (
      question: string,
      context: import('@/services/assistant/contract').AssistantContext
    ) => {
      client.calls.push(question)
      if (client.failNext > 0) {
        client.failNext -= 1
        return fixtures.dataNotLoaded(question)
      }
      return engine.answer(question, context)
    },
  }
})

vi.mock('@/services/assistant/termLessons', async (orig) => ({
  ...(await orig<typeof import('@/services/assistant/termLessons')>()),
  termLessonsFor: async (tag: string) =>
    tag === 'GL:ml-kem'
      ? [
          {
            lessonTitle: 'Post-Quantum Algorithms',
            link: '/learn/pqc-algorithms?section=ml-kem-fips-203',
            tag: 'LM-088/s:ml-kem-fips-203',
          },
        ]
      : [],
}))

// The starting list holds three questions when nothing else is known; a flag lets one test see the
// collapsed "More questions" list that a longer list produces.
const suggestionMode = vi.hoisted(() => ({ many: false }))
vi.mock('./suggestionRanker', async (orig) => {
  const real = await orig<typeof import('./suggestionRanker')>()
  return {
    ...real,
    rankSuggestions: (state: Parameters<typeof real.rankSuggestions>[0]) => {
      const base = real.rankSuggestions(state)
      if (!suggestionMode.many) return base
      return [
        ...base,
        ...['Q four', 'Q five', 'Q six', 'Q seven'].map((question) => ({
          question,
          rule: 6 as const,
          basedOn: 'a test',
        })),
      ]
    },
  }
})

const layout = vi.hoisted(() => ({ value: 'docked' as 'docked' | 'sheet' }))
vi.mock('./useAssistantLayout', async (orig) => ({
  ...(await orig<typeof import('./useAssistantLayout')>()),
  useAssistantLayout: () => layout.value,
}))

function Where() {
  const l = useLocation()
  return <p data-testid="where">{`${l.pathname}${l.search}`}</p>
}

function mount(initial = '/learn') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <AssistantConversation />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  client.failNext = 0
  client.calls = []
  suggestionMode.many = false
  layout.value = 'docked'
  useAssistantSessionStore.getState().reset()
  useAssistantAskedStore.getState().clear() // earlier tests' questions are remembered on the device
  useAchievementStore.getState().resetAchievements()
  useAssistantReturnStore.getState().clear()
  useChatStore.setState({ pendingQuestion: null })
  useRightPanelStore.setState({ isOpen: true, activeTab: 'chat' })
  setSavedAnswersPort()
})
afterEach(() => vi.restoreAllMocks())

/** Waits for the answer itself: the loading placeholder is replaced by it. */
async function answered(name: string | RegExp) {
  await screen.findByRole('article', { name })
  await waitFor(() =>
    expect(
      within(screen.getByRole('article', { name })).queryByText('Looking in the Hub records.')
    ).toBeNull()
  )
  return screen.getByRole('article', { name })
}

const box = () => screen.getByRole('textbox', { name: 'Your question' })

describe('empty drawer (first visit)', () => {
  it('says "Ask anything. No sign-up or objective needed." and offers starting questions as plain buttons', () => {
    mount()
    expect(screen.getByText('Ask anything. No sign-up or objective needed.')).toBeInTheDocument()
    const group = screen.getByRole('group', { name: 'Suggested questions' })
    expect(
      within(group).getByRole('button', {
        name: 'What is post-quantum cryptography, in two minutes?',
      })
    ).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Edit before asking' })).toBeInTheDocument()
  })

  it('focuses the question box on open, and never pre-fills it', () => {
    mount()
    expect(box()).toHaveFocus()
    expect(box()).toHaveValue('')
  })

  it('sends a tapped suggestion at once', async () => {
    mount()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Which deadlines apply to banks in the EU\?/ }))
    await answered('Which deadlines apply to banks in the EU?')
  })

  it('does not offer a question again in a new conversation while the state is the same', async () => {
    const question = 'Which deadlines apply to banks in the EU?'
    const view = mount()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: new RegExp(question.replace('?', '\\?')) }))
    await answered(question)
    view.unmount()
    // a new visit: the conversation is gone, what was asked is remembered on the device
    act(() => useAssistantSessionStore.getState().reset())
    mount()
    expect(
      screen.queryByRole('button', { name: new RegExp(question.replace('?', '\\?')) })
    ).toBeNull()
    expect(screen.getByRole('group', { name: 'Suggested questions' })).toBeInTheDocument()
  })

  it('copies the question into the box for "Edit before asking" without sending it', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: 'Edit before asking' }))
    expect(box()).toHaveValue('What is post-quantum cryptography, in two minutes?')
    expect(box()).toHaveFocus()
    expect(screen.queryByRole('article')).toBeNull()
  })
})

describe('asking', () => {
  it('desktop: Return sends and Shift+Return adds a line', async () => {
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'line one{Shift>}{Enter}{/Shift}line two')
    expect(box()).toHaveValue('line one\nline two')
    await user.clear(box())
    await user.type(box(), 'ML-KEM{Enter}')
    await answered('ML-KEM')
    expect(box()).toHaveValue('')
  })

  it('phone: Return adds a new line and only the Send button sends', async () => {
    layout.value = 'sheet'
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'ML-KEM{Enter}')
    expect(box()).toHaveValue('ML-KEM\n')
    expect(screen.queryByRole('article')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await answered('ML-KEM')
  })

  it('an empty send shows a message and sends nothing; the box is never disabled', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Type a question first.')
    expect(screen.queryByRole('article')).toBeNull()
    expect(box()).toBeEnabled()
  })

  it('opens each new answer and folds the one before it to a single line', async () => {
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'When is the CNSA 2.0 deadline?{Enter}')
    await answered('When is the CNSA 2.0 deadline?')
    await user.type(box(), 'What is ML-KEM?{Enter}')
    const second = await answered('What is ML-KEM?')
    const first = screen.getByRole('article', { name: 'When is the CNSA 2.0 deadline?' })
    // the earlier answer is one button; only the new one has tabs
    const folded = within(first).getByRole('button', { name: /Earlier answer/ })
    expect(folded).toHaveAttribute('aria-expanded', 'false')
    expect(folded).toHaveTextContent('3 resources · Learn, Compliance, Library')
    expect(within(first).queryByRole('tablist')).toBeNull()
    expect(within(second).getByRole('tablist', { name: 'Resource types' })).toBeInTheDocument()
    expect(screen.getAllByRole('tablist')).toHaveLength(1)
  })

  it('opening a folded card folds the open one, and each card remembers its place', async () => {
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'When is the CNSA 2.0 deadline?{Enter}')
    const cnsa = await answered('When is the CNSA 2.0 deadline?')
    await user.click(within(cnsa).getByRole('button', { name: 'Next resource' }))
    expect(within(cnsa).getByText('Top 5 · 2 of 3')).toBeInTheDocument()
    await user.type(box(), 'What is ML-KEM?{Enter}')
    await answered('What is ML-KEM?')

    await user.click(within(cnsa).getByRole('button', { name: /Earlier answer/ }))
    expect(within(cnsa).getByRole('tablist')).toBeInTheDocument()
    expect(within(cnsa).getByText('Top 5 · 2 of 3')).toBeInTheDocument()
    const mlkem = screen.getByRole('article', { name: 'What is ML-KEM?' })
    expect(within(mlkem).queryByRole('tablist')).toBeNull()
    expect(within(mlkem).getByRole('button', { name: /Earlier answer/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('scrolls the open card to the top of the list when its answer arrives (and when another card opens)', async () => {
    // jsdom has no layout: give each card a position by its place in the list.
    const top = vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
      this: HTMLElement
    ) {
      const parent = this.parentElement
      return parent?.getAttribute('data-testid') === 'assistant-list'
        ? Array.from(parent.children).indexOf(this) * 500
        : 0
    })
    const user = userEvent.setup()
    mount()
    const list = screen.getByTestId('assistant-list')
    await user.type(box(), 'When is the CNSA 2.0 deadline?{Enter}')
    await answered('When is the CNSA 2.0 deadline?')
    await user.type(box(), 'What is ML-KEM?{Enter}')
    await answered('What is ML-KEM?')
    // the empty-state paragraph is gone, so the second card is the second child
    expect(list.scrollTop).toBe(500)
    const first = screen.getByRole('article', { name: 'When is the CNSA 2.0 deadline?' })
    await user.click(within(first).getByRole('button', { name: /Earlier answer/ }))
    expect(list.scrollTop).toBe(0)
    top.mockRestore()
  })

  it('offers suggestions in a compact form under the open answer', async () => {
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'ML-KEM{Enter}')
    await answered('ML-KEM')
    const group = screen.getByRole('group', { name: 'Suggested questions' })
    expect(within(group).getByText('Suggested')).toBeInTheDocument()
    expect(within(group).getAllByRole('button')[0]).toHaveTextContent(/\?$/)
    expect(screen.queryByText('Suggested for you')).toBeNull()
  })

  it('announces "Answer ready, n resources" politely', async () => {
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'Tell me something{Enter}')
    await answered('Tell me something')
    const live = screen
      .getAllByRole('status')
      .find((el) => el.getAttribute('aria-live') === 'polite')
    expect(live).toHaveTextContent('Answer ready, 1 resource')
  })

  it('says the Hub holds nothing for a question it cannot place', async () => {
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'What is the airspeed of a swallow?{Enter}')
    expect(
      await screen.findByText('The Hub does not hold an answer to this question.')
    ).toBeInTheDocument()
  })
})

describe('data did not load', () => {
  it('shows one notice, keeps the question in the box and shows no resources; Try again asks it again', async () => {
    const user = userEvent.setup()
    client.failNext = 1
    mount()
    await user.type(box(), 'ML-KEM{Enter}')
    const notice = await screen.findByRole('alert')
    expect(notice).toHaveTextContent('The Hub could not load the data for this answer.')
    expect(notice).toHaveTextContent('Your question is kept in the box below. Nothing was lost.')
    expect(box()).toHaveValue('ML-KEM')
    expect(screen.queryByRole('article')).toBeNull()
    expect(screen.queryByRole('listitem')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await answered('ML-KEM')
    expect(client.calls).toEqual(['ML-KEM', 'ML-KEM'])
    expect(screen.queryByText('The Hub could not load the data for this answer.')).toBeNull()
    expect(box()).toHaveValue('')
  })
})

describe('opening a resource', () => {
  /** Steps with Next until the resource's action is on screen, as a learner does. */
  async function reveal(user: ReturnType<typeof userEvent.setup>, name: string | RegExp) {
    for (let i = 0; i < 30 && !screen.queryByRole('button', { name }); i++) {
      await user.click(screen.getByRole('button', { name: /^Next resource/ }))
    }
    return screen.getByRole('button', { name })
  }

  async function askConcept() {
    const user = userEvent.setup()
    mount('/learn')
    await user.type(box(), 'What is ML-KEM?{Enter}')
    await answered('What is ML-KEM?')
    return user
  }

  it('Read here opens the record viewer with "Back to your answer"; back returns focus to the row action', async () => {
    const user = await askConcept()
    await user.click(screen.getByRole('button', { name: 'Read here: ML-KEM' }))
    const viewer = screen.getByRole('region', { name: 'ML-KEM' })
    expect(within(viewer).getByText(/GL:ml-kem/)).toBeInTheDocument()
    expect(within(viewer).getByText('In the Hub’s words')).toBeInTheDocument()
    expect(within(viewer).getByRole('button', { name: 'Save to My work' })).toBeInTheDocument()
    await user.click(within(viewer).getByRole('button', { name: 'Back to your answer' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Read here: ML-KEM' })).toHaveFocus()
    )
    expect(screen.queryByRole('region', { name: 'ML-KEM' })).toBeNull()
  })

  it('Save to My work stores a reference once', async () => {
    const user = await askConcept()
    await user.click(screen.getByRole('button', { name: 'Read here: ML-KEM' }))
    await user.click(screen.getByRole('button', { name: 'Save to My work' }))
    expect(await screen.findByRole('button', { name: 'Saved to My work' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('Go to module navigates, leaves the desktop drawer open and starts the way back', async () => {
    const user = await askConcept()
    await user.click(await reveal(user, 'Go to module: TLS Basics'))
    expect(screen.getByTestId('where')).toHaveTextContent('/learn/tls-basics')
    expect(useRightPanelStore.getState().isOpen).toBe(true)
    expect(useAssistantReturnStore.getState().target).toMatchObject({
      path: '/learn',
      origin: 'Go to module: TLS Basics',
    })
  })

  it('Go to page sets the return and, on the phone, closes the sheet', async () => {
    layout.value = 'sheet'
    const user = userEvent.setup()
    mount('/learn')
    await user.type(box(), 'When is the CNSA 2.0 deadline?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await user.click(await screen.findByRole('button', { name: 'Go to page: CNSA 2.0' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/compliance')
    expect(useRightPanelStore.getState().isOpen).toBe(false)
    expect(useAssistantReturnStore.getState().target).toMatchObject({ path: '/learn' })
  })

  it('Open reference to a Library record sets the return, like Go to page', async () => {
    const { conceptMlKem, fips203Row } = await import('@/test/fixtures/assistantAnswers')
    const row = { ...fips203Row, action: 'Open reference' as const, link: '/library?ref=FIPS-203' }
    act(() =>
      useAssistantSessionStore.setState({
        turns: [
          {
            id: 'seeded',
            question: 'What is ML-KEM?',
            status: 'done',
            answer: {
              ...conceptMlKem,
              groups: [{ name: 'References', rows: [row], more: [] }],
            } as AssistantResourcesAnswer,
          },
        ],
      })
    )
    const user = userEvent.setup()
    mount('/learn')
    await user.click(await screen.findByRole('button', { name: `Open reference: ${row.title}` }))
    expect(screen.getByTestId('where')).toHaveTextContent('/library?ref=FIPS-203')
    expect(useAssistantReturnStore.getState().target).toMatchObject({ path: '/learn' })
  })

  it('a glossary term opens the lesson that teaches it, with the way back set', async () => {
    const user = await askConcept()
    await user.click(screen.getByRole('button', { name: 'Read here: ML-KEM' }))
    await user.click(
      await screen.findByRole('button', { name: 'Open the lesson: Post-Quantum Algorithms' })
    )
    expect(screen.getByTestId('where')).toHaveTextContent(
      '/learn/pqc-algorithms?section=ml-kem-fips-203'
    )
    expect(useAssistantReturnStore.getState().target).toMatchObject({
      path: '/learn',
      origin: 'Read here: ML-KEM',
    })
  })

  it('Open in the glossary shows the Glossary view on that term; coming back keeps the answer and the record', async () => {
    const user = userEvent.setup()
    const view = mount('/learn')
    await user.type(box(), 'What is ML-KEM?{Enter}')
    await answered('What is ML-KEM?')
    await user.click(screen.getByRole('button', { name: 'Read here: ML-KEM' }))
    await user.click(await screen.findByRole('button', { name: 'Open in the glossary' }))
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'glossary' })
    expect(useGlossaryDrawerStore.getState()).toMatchObject({
      focusTerm: 'ML-KEM',
      fromAnswer: true,
    })
    // The page did not change, and no return bar was started.
    expect(screen.getByTestId('where')).toHaveTextContent('/learn')
    expect(useAssistantReturnStore.getState().target).toBeNull()
    // The drawer shows the Glossary instead of the Assistant; coming back shows both as they were.
    view.unmount()
    mount('/learn')
    expect(screen.getByRole('region', { name: 'ML-KEM' })).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: 'What is ML-KEM?', hidden: true })
    ).toBeInTheDocument()
  })

  it('on the phone, the record opens as a pinned card with Close', async () => {
    layout.value = 'sheet'
    const user = userEvent.setup()
    mount('/learn')
    await user.type(box(), 'What is ML-KEM?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await user.click(await screen.findByRole('button', { name: 'Read here: ML-KEM' }))
    const card = screen.getByRole('region', { name: 'ML-KEM' })
    expect(within(card).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Back to your answer' })).toBeNull()
    // the conversation stays visible beside it
    expect(screen.getByRole('article', { name: 'What is ML-KEM?' })).toBeVisible()
  })
})

describe('a question queued by another page', () => {
  it('is asked once the drawer is open and then cleared', async () => {
    act(() => useChatStore.getState().setPendingQuestion('ML-KEM'))
    mount()
    // the answer's own text, not the loading placeholder that it replaces
    expect(await screen.findByText('One Hub record matches that name.')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'ML-KEM' })).toBeInTheDocument()
    expect(useChatStore.getState().pendingQuestion).toBeNull()
  })
})

describe('counting questions for the Conversation Starter badge', () => {
  const asked = () => useAchievementStore.getState().assistantQuestionCount

  it('counts a typed question once (desktop: Return)', async () => {
    mount()
    await userEvent.setup().type(box(), 'ML-KEM{Enter}')
    await answered('ML-KEM')
    expect(asked()).toBe(1)
  })

  it('counts a typed question once (phone: the Send button)', async () => {
    layout.value = 'sheet'
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'ML-KEM')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await answered('ML-KEM')
    expect(asked()).toBe(1)
  })

  it('counts a chosen suggested question once', async () => {
    mount()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Which deadlines apply to banks in the EU\?/ }))
    await answered('Which deadlines apply to banks in the EU?')
    expect(asked()).toBe(1)
  })

  it('counts a question from the "More questions" list once', async () => {
    suggestionMode.many = true
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: 'More questions (3)' }))
    await user.click(screen.getByRole('button', { name: 'Q seven' }))
    await screen.findByRole('article', { name: 'Q seven' })
    expect(client.calls).toEqual(['Q seven'])
    expect(useAchievementStore.getState().assistantQuestionCount).toBe(1)
  })

  it('counts a question handed over by another page once', async () => {
    act(() => useChatStore.getState().setPendingQuestion('ML-KEM'))
    mount()
    await screen.findByText('One Hub record matches that name.')
    expect(asked()).toBe(1)
  })

  it('does not count an empty send, and does not count "Try again"', async () => {
    const user = userEvent.setup()
    client.failNext = 1
    mount()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(asked()).toBe(0)
    await user.type(box(), 'ML-KEM{Enter}')
    await screen.findByRole('alert')
    expect(asked()).toBe(1)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await answered('ML-KEM')
    expect(client.calls).toEqual(['ML-KEM', 'ML-KEM'])
    expect(asked()).toBe(1)
  })

  it('counts each of several different questions', async () => {
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'ML-KEM{Enter}')
    await answered('ML-KEM')
    await user.type(box(), 'ML-DSA{Enter}')
    await answered('ML-DSA')
    expect(asked()).toBe(2)
  })
})
