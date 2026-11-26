// SPDX-License-Identifier: AGPL-3.0-only
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate, useNavigationType } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { GlossaryAddressHost } from './GlossaryAddressHost'
import { GlossaryDrawerView } from '../RightPanel/DrawerViews'
import { useGlossaryDrawerStore } from '@/store/useGlossaryDrawerStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'

vi.mock('../../data/glossary', () => ({
  loadGlossary: async () => [
    {
      id: 'a',
      term: 'Key Encapsulation Mechanism',
      acronym: 'KEM',
      definition: 'A KEM mentions ML-KEM in passing.',
      complexity: 'beginner',
      category: 'concept',
    },
    {
      id: 'b',
      term: 'ML-KEM',
      definition: 'Module-lattice key encapsulation.',
      complexity: 'beginner',
      category: 'algorithm',
    },
  ],
}))

/** Two buttons: one pushes an address (as a link does), one goes Back. */
function Nav({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <>
      <Button onClick={() => navigate(to)}>push</Button>
      <Button onClick={() => navigate(-1)}>back</Button>
    </>
  )
}

function Where() {
  const l = useLocation()
  return (
    <>
      <p data-testid="where">{`${l.pathname}${l.search}`}</p>
      <p data-testid="how">{useNavigationType()}</p>
    </>
  )
}

beforeEach(() => {
  useRightPanelStore.setState({ isOpen: false, activeTab: 'chat' })
  useGlossaryDrawerStore.getState().clear()
})

describe('GlossaryAddressHost', () => {
  const mount = (url: string) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <GlossaryAddressHost />
        <Where />
      </MemoryRouter>
    )

  it('opens the drawer on the Glossary view, on that term, from any page', async () => {
    mount('/library?glossary=ML-KEM&x=1')
    await waitFor(() =>
      expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'glossary' })
    )
    expect(useGlossaryDrawerStore.getState()).toMatchObject({
      focusTerm: 'ML-KEM',
      fromAnswer: false,
    })
    // The address stays while the view is showing.
    expect(screen.getByTestId('where')).toHaveTextContent('/library?glossary=ML-KEM&x=1')
  })

  it('closing the drawer removes only the glossary parameter, with a replace', async () => {
    mount('/library?glossary=ML-KEM&x=1')
    await waitFor(() => expect(useRightPanelStore.getState().isOpen).toBe(true))
    act(() => useRightPanelStore.getState().close())
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/library?x=1'))
    expect(screen.getByTestId('how')).toHaveTextContent('REPLACE')
  })

  it('switching the drawer to another view also removes the parameter', async () => {
    mount('/learn?glossary=ML-KEM')
    await waitFor(() => expect(useRightPanelStore.getState().activeTab).toBe('glossary'))
    act(() => useRightPanelStore.getState().open('faq'))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/learn$/))
  })

  it('going Back to an address without the parameter closes the drawer the address opened', async () => {
    render(
      <MemoryRouter initialEntries={['/learn/stateful-signatures?tab=learn']}>
        <GlossaryAddressHost />
        <Where />
        <Nav to="/learn/stateful-signatures?tab=learn&glossary=LMS%2FHSS" />
      </MemoryRouter>
    )
    expect(useRightPanelStore.getState().isOpen).toBe(false)
    // A link opens a term on the lesson's own address (a push), as a glossary chip in the lesson does.
    await userEvent.click(screen.getByRole('button', { name: 'push' }))
    await waitFor(() =>
      expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'glossary' })
    )
    await userEvent.click(screen.getByRole('button', { name: 'back' }))
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent(
        /^\/learn\/stateful-signatures\?tab=learn$/
      )
    )
    await waitFor(() => expect(useRightPanelStore.getState().isOpen).toBe(false))
  })

  it('a link to another page without the parameter leaves the drawer as it is', async () => {
    render(
      <MemoryRouter initialEntries={['/learn?glossary=ML-KEM']}>
        <GlossaryAddressHost />
        <Where />
        <Nav to="/library" />
      </MemoryRouter>
    )
    await waitFor(() => expect(useRightPanelStore.getState().isOpen).toBe(true))
    await userEvent.click(screen.getByRole('button', { name: 'push' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/library$/))
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'glossary' })
  })

  it('does nothing without the parameter', () => {
    mount('/learn')
    expect(useRightPanelStore.getState().isOpen).toBe(false)
  })
})

describe('the Glossary view of the drawer', () => {
  const view = () =>
    render(
      <MemoryRouter>
        <GlossaryDrawerView />
      </MemoryRouter>
    )

  it('starts on the asked term: search prefilled, the exact term first', async () => {
    useGlossaryDrawerStore.getState().focus('ml-kem')
    view()
    expect(screen.getByRole('textbox', { name: 'Search glossary terms' })).toHaveValue('ml-kem')
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2))
    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('ML-KEM')
  })

  it('matches the acronym too', async () => {
    useGlossaryDrawerStore.getState().focus('KEM')
    view()
    await waitFor(() =>
      expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)
    )
    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Key Encapsulation')
  })

  it('an unknown term leaves the normal no-match state', async () => {
    useGlossaryDrawerStore.getState().focus('zzzz-unknown')
    view()
    expect(await screen.findByText('No terms match your search.')).toBeInTheDocument()
  })

  it('without a term it lists the whole glossary and offers no way back', async () => {
    view()
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2))
    expect(screen.queryByRole('button', { name: 'Back to your answer' })).toBeNull()
  })

  it('reached from an answer it offers Back to your answer, which returns to the Assistant', async () => {
    useGlossaryDrawerStore.getState().focus('ML-KEM', { fromAnswer: true })
    useRightPanelStore.setState({ isOpen: true, activeTab: 'glossary' })
    view()
    await userEvent.click(screen.getByRole('button', { name: 'Back to your answer' }))
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'chat' })
  })
})
