// SPDX-License-Identifier: AGPL-3.0-only
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { AssistantConversation } from './AssistantConversation'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useAssistantReturnStore } from '@/store/useAssistantReturnStore'
import { useChatStore } from '@/store/useChatStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { setSavedAnswersPort } from '@/services/assistant/drawerSaves'

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
  layout.value = 'docked'
  useAssistantSessionStore.getState().reset()
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

  it('keeps earlier answers with their own resources when a new question is asked', async () => {
    const user = userEvent.setup()
    mount()
    await user.type(box(), 'When is the CNSA 2.0 deadline?{Enter}')
    await answered('When is the CNSA 2.0 deadline?')
    await user.type(box(), 'What is ML-KEM?{Enter}')
    const first = await answered('When is the CNSA 2.0 deadline?')
    const second = await answered('What is ML-KEM?')
    expect(
      within(first).getByRole('group', { name: 'Hub resources in this answer' })
    ).toBeInTheDocument()
    expect(
      within(second).getByRole('group', { name: 'Hub resources in this answer' })
    ).toBeInTheDocument()
    expect(screen.getByText('Earlier answer')).toBeInTheDocument()
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
    expect(await screen.findByRole('button', { name: 'Saved to My work' })).toBeDisabled()
  })

  it('Go to module navigates and leaves the desktop drawer open, with no return bar', async () => {
    const user = await askConcept()
    await user.click(screen.getByRole('button', { name: 'Go to module: TLS Basics' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/learn/tls-basics')
    expect(useRightPanelStore.getState().isOpen).toBe(true)
    expect(useAssistantReturnStore.getState().target).toBeNull()
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
