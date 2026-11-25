// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The panels as a learner uses them: My work (A12, A13, A17, empty state, export, failures, no completion, no text to
 * analytics) and Updates (A06 in the screen, mark seen, empty state, the strip on a revised section).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '@/test/utils'

const logEvent = vi.hoisted(() => vi.fn())
vi.mock('@/utils/analytics', () => ({ logEvent }))
const saveAs = vi.hoisted(() => vi.fn())
vi.mock('file-saver', () => ({ saveAs }))

import { MyWorkPanel } from './MyWorkPanel'
import { UpdatesPanel } from './UpdatesPanel'
import { RevisedSectionStrip } from './RevisedSectionStrip'
import { saveAnswer } from '@/services/assistant/savedAnswers'
import { EMPTY_MY_WORK, useMyWorkStore } from '@/store/useMyWorkStore'
import { EMPTY_UPDATES, useUpdatesStore } from '@/store/useUpdatesStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { buildCatalog, type UpdatesObjective } from '@/services/myWork/updates'

const MARK = 'PRIVATE-ANSWER-TEXT-5b0e'
const tls = buildCatalog()['LM-008']

const objectives = [
  { id: 'review', title: 'TLS review', steps: [{ tag: 'LM-008' }] },
  { id: 'brief', title: 'Board briefing', steps: [{ tag: 'LM-009' }] },
]

beforeEach(() => {
  localStorage.clear()
  logEvent.mockClear()
  saveAs.mockClear()
  useMyWorkStore.setState({ ...EMPTY_MY_WORK })
  useUpdatesStore.setState({ ...EMPTY_UPDATES })
  useHistoryStore.setState({ events: [] })
  useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
})
afterEach(() => vi.restoreAllMocks())

const addComment = (id: string, tag: string, body: string) =>
  useMyWorkStore.getState().addComment({ id, tag, body })

describe('MyWorkPanel', () => {
  it('X09: empty state says "Nothing here yet" and how to start; the device-only notice is always there', () => {
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(
      screen.getByText(/stored on this device only\. nothing here counts as completion/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export as markdown/i })).toBeDisabled()
  })

  it('A12 and A17: filters by objective and type, counts equal the list, Not filed works', async () => {
    addComment('c1', 'LM-008/s:handshake', 'In the review')
    addComment('c2', 'LM-009/s:x', 'In the briefing')
    addComment('c3', 'LM-050/s:y', 'Nowhere')
    saveAnswer({
      question: 'A question?',
      savedAt: '2026-11-25T08:00:00.000Z',
      payload: { answerText: 'An answer' },
    })
    const user = userEvent.setup()
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    const items = () => screen.getAllByTestId('my-work-item')
    expect(items()).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'All (4)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'TLS review (1)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Not filed (2)' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'TLS review (1)' }))
    expect(items()).toHaveLength(1)
    expect(items()[0]).toHaveTextContent('In the review')
    await user.click(screen.getByRole('button', { name: 'Not filed (2)' }))
    expect(items()).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Artifacts and answers' }))
    expect(items()).toHaveLength(1)
    expect(items()[0]).toHaveAttribute('data-type', 'saved-answer')
  })

  it('A13: a tool run the Hub already recorded appears once, as a technical artifact with title and link only', async () => {
    useHistoryStore.getState().addEvent({
      type: 'tls_simulation',
      timestamp: Date.parse('2026-11-24T10:00:00.000Z'),
      title: 'Ran the TLS simulator',
      route: '/playground/tls-simulator',
    })
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    const item = await screen.findByTestId('my-work-item')
    expect(item).toHaveAttribute('data-type', 'technical-artifact')
    expect(item).toHaveTextContent('Title and link only today')
    expect(item).toHaveTextContent('Not filed')
    expect(useMyWorkStore.getState().outputs).toHaveLength(1)
  })

  it('files an output under an objective and back to Not filed (O03)', async () => {
    useHistoryStore.getState().addEvent({
      type: 'artifact_key',
      timestamp: Date.now(),
      title: 'Generated key',
      route: '/openssl',
    })
    const user = userEvent.setup()
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    const select = await screen.findByLabelText('Filed under')
    await user.selectOptions(select, 'review')
    expect(useMyWorkStore.getState().outputs[0].objectiveId).toBe('review')
    await user.selectOptions(select, '')
    expect(useMyWorkStore.getState().outputs[0].objectiveId).toBeUndefined()
  })

  it('O08: an item whose source has gone keeps its title and says what is missing', async () => {
    useMyWorkStore.getState().registerOutput({
      kind: 'business',
      producer: { toolId: 'roi-model', route: '/business/tools/roi-model' },
      ref: { type: 'executive-document', id: 'missing-doc' },
      title: 'Board pitch',
      storage: 'document',
      runId: 'doc:learning::roi-model',
    })
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    const item = await screen.findByTestId('my-work-item')
    expect(item).toHaveTextContent('Board pitch')
    expect(item).toHaveTextContent(/no longer on this device/i)
  })

  it('exports the filtered list as Markdown only when the learner presses the button (J2)', async () => {
    addComment('c1', 'LM-008/s:handshake', 'Export me')
    const user = userEvent.setup()
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    expect(saveAs).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /export as markdown/i }))
    expect(saveAs).toHaveBeenCalledTimes(1)
    const blob = saveAs.mock.calls[0][0] as Blob
    expect(await blob.text()).toContain('> Export me')
    expect(saveAs.mock.calls[0][1]).toMatch(/^pqc-today-my-work-\d{4}-\d{2}-\d{2}\.md$/)
  })

  it('a failed removal names the action, keeps the item, and Try again commits once (A21)', async () => {
    saveAnswer({ question: 'Remove me?', savedAt: '2026-11-25T08:00:00.000Z', payload: {} })
    const user = userEvent.setup()
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    await user.click(screen.getByRole('button', { name: /remove from my work/i }))
    const alerts = await screen.findAllByRole('alert')
    expect(alerts.some((a) => /The removal was not saved/.test(a.textContent ?? ''))).toBe(true)
    expect(useMyWorkStore.getState().answers).toHaveLength(1)
    spy.mockRestore()
    const retry = within(screen.getByTestId('my-work-item')).getByRole('button', {
      name: /try again/i,
    })
    await user.click(retry)
    await waitFor(() => expect(useMyWorkStore.getState().answers).toHaveLength(0))
  })

  it('says plainly when the browser will not save, and what stays readable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    expect(await screen.findByText('Your work cannot be saved right now')).toBeInTheDocument()
  })

  it('nothing in My work counts as completion, and no comment or answer text reaches analytics (J5, O05)', async () => {
    const progress = JSON.stringify(useModuleStore.getState().modules)
    addComment('c1', 'LM-008/s:handshake', `comment ${MARK}`)
    saveAnswer({
      question: `question ${MARK}`,
      savedAt: '2026-11-25T08:00:00.000Z',
      payload: { answerText: `answer ${MARK}` },
    })
    const user = userEvent.setup()
    renderWithRouter(<MyWorkPanel objectives={objectives} />)
    await user.click(screen.getByRole('button', { name: 'TLS review (1)' }))
    await user.click(screen.getByRole('button', { name: 'All (2)' }))
    await user.click(screen.getByRole('button', { name: /export as markdown/i }))
    await user.click(screen.getByRole('button', { name: /remove from my work/i }))
    expect(logEvent).toHaveBeenCalled()
    expect(JSON.stringify(logEvent.mock.calls)).not.toContain(MARK)
    expect(JSON.stringify(useModuleStore.getState().modules)).toBe(progress)
  })
})

describe('UpdatesPanel and the strip', () => {
  const stepObjectives: UpdatesObjective[] = [
    {
      id: 'review',
      title: 'TLS review',
      state: 'active',
      steps: [{ tag: 'LM-008', required: true, status: 'now' }],
    },
    {
      id: 'brief',
      title: 'Board briefing',
      state: 'active',
      steps: [{ tag: 'LM-008', required: true, status: 'not-started' }],
    },
  ]
  const engageBehind = () =>
    useUpdatesStore.setState({
      learnerReleaseSeen: '4.224.0',
      releaseSeenAt: '2026-11-20T00:00:00.000Z',
      engaged: {
        'LM-008': {
          version: tls.version - 1,
          moduleId: tls.moduleId,
          title: tls.title,
          takeFirst: tls.takeFirst,
        },
      },
    })

  it('X08: with nothing to say it says the learner is up to date', async () => {
    renderWithRouter(<UpdatesPanel objectives={stepObjectives} />)
    expect(await screen.findByTestId('updates-empty')).toHaveTextContent(
      'You’re up to date for your saved objectives.'
    )
  })

  it('shows one revised notice for a lesson used by two objectives, in terms of the learner’s work, and Mark seen clears it once (U04)', async () => {
    engageBehind()
    addComment('c1', 'LM-008/s:handshake', 'before the change')
    useMyWorkStore.setState((s) => ({
      comments: s.comments.map((c) => ({ ...c, contentVersion: tls.version - 1 })),
    }))
    const user = userEvent.setup()
    const counts: number[] = []
    renderWithRouter(
      <UpdatesPanel objectives={stepObjectives} onUnseenCountChange={(n) => counts.push(n)} />
    )
    const notice = await screen.findByTestId('update-notice')
    expect(notice).toHaveTextContent(`Revised · version ${tls.version}`)
    expect(notice).toHaveTextContent(
      `Revised from version ${tls.version - 1} to version ${tls.version}`
    )
    expect(notice).toHaveTextContent('It is your current step in TLS review.')
    expect(notice).toHaveTextContent('One of your comments was written before this change.')
    expect(screen.getAllByTestId('update-notice')).toHaveLength(1)
    expect(screen.getByTestId('updates-count')).toHaveTextContent('1 new')
    await user.click(within(notice).getByRole('button', { name: 'Mark seen' }))
    await waitFor(() => expect(screen.queryByTestId('update-notice')).not.toBeInTheDocument())
    expect(screen.getByTestId('updates-empty')).toBeInTheDocument()
    expect(useUpdatesStore.getState().noticesSeen).toEqual([
      { tag: 'LM-008', revision: tls.version },
    ])
    await waitFor(() => expect(counts.at(-1)).toBe(0))
  })

  it('Review update opens the lesson without marking the notice seen', async () => {
    engageBehind()
    const open = vi.fn()
    const user = userEvent.setup()
    renderWithRouter(<UpdatesPanel objectives={stepObjectives} onOpen={open} />)
    await user.click(await screen.findByRole('button', { name: 'Review update' }))
    expect(open).toHaveBeenCalledWith('/learn/tls-basics')
    expect(useUpdatesStore.getState().noticesSeen).toEqual([])
  })

  it('the digest is on demand and reads the changelog since the last release the learner saw', async () => {
    useUpdatesStore.setState({
      ...EMPTY_UPDATES,
      learnerReleaseSeen: '4.200.0',
      releaseSeenAt: '2026-10-01T00:00:00.000Z',
    })
    const user = userEvent.setup()
    renderWithRouter(<UpdatesPanel objectives={[]} />)
    expect(screen.queryByTestId('updates-digest')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /what changed for me/i }))
    expect(await screen.findByTestId('updates-digest')).toBeInTheDocument()
    expect(
      within(screen.getByTestId('updates-digest')).getAllByRole('listitem').length
    ).toBeGreaterThan(0)
  })

  it('the strip shows on a revised lesson and section, names the learner’s older comments, and Mark seen hides it', async () => {
    engageBehind()
    addComment('c1', 'LM-008/s:handshake', 'old')
    useMyWorkStore.setState((s) => ({
      comments: s.comments.map((c) => ({ ...c, contentVersion: tls.version - 1 })),
    }))
    const user = userEvent.setup()
    renderWithRouter(<RevisedSectionStrip tag="LM-008/s:handshake" onReview={() => undefined} />)
    const strip = await screen.findByTestId('revised-strip')
    expect(strip).toHaveTextContent(`Revised · version ${tls.version}`)
    expect(strip).toHaveTextContent(`You last read version ${tls.version - 1}`)
    expect(strip).toHaveTextContent('One of your comments here was written before this change.')
    expect(strip).toHaveTextContent('Your progress is unchanged.')
    await user.click(within(strip).getByRole('button', { name: 'Mark seen' }))
    await waitFor(() => expect(screen.queryByTestId('revised-strip')).not.toBeInTheDocument())
  })

  it('the strip shows nothing on a lesson the learner is caught up on, and starts them caught up on first visit', async () => {
    renderWithRouter(<RevisedSectionStrip tag="LM-008" />)
    await act(async () => undefined)
    expect(screen.queryByTestId('revised-strip')).not.toBeInTheDocument()
    expect(useUpdatesStore.getState().engaged['LM-008'].version).toBe(tls.version)
  })
})
