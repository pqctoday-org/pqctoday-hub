// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Comment box acceptance: A11 (persist, version stamp), A19 (changed since, edit re-stamps), A20 (delete asks,
 * Keep it changes nothing), A21 (failures keep the text, retry commits once), C08 (labelled, status, focus back),
 * and J5 (no comment text reaches analytics).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const logEvent = vi.hoisted(() => vi.fn())
vi.mock('@/utils/analytics', () => ({ logEvent }))

import { CommentBox } from './CommentBox'
import { useMyWorkStore, EMPTY_MY_WORK, MY_WORK_KEY } from '@/store/useMyWorkStore'
import { currentContentVersion } from '@/services/myWork/tags'

const TAG = 'LM-008/s:handshake'
const MARK = 'PRIVATE-COMMENT-TEXT-71c2'
const live = currentContentVersion(TAG)

beforeEach(() => {
  localStorage.clear()
  logEvent.mockClear()
  useMyWorkStore.setState({ ...EMPTY_MY_WORK })
})
afterEach(() => vi.restoreAllMocks())

async function addComment(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole('button', { name: /add a comment/i }))
  await user.type(screen.getByLabelText(/add a comment on/i), text)
  await user.click(screen.getByRole('button', { name: /save comment/i }))
}

const failStorage = (name: string) =>
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('no', name)
  })

describe('CommentBox', () => {
  it('A11: adds a comment with no objective, shows its version, and it survives a reload', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<CommentBox tag={TAG} />)
    await addComment(user, 'Why hybrid here?')
    const item = await screen.findByTestId('comment-item')
    expect(within(item).getByText('Why hybrid here?')).toBeInTheDocument()
    expect(item).toHaveTextContent(`version ${live}`)
    expect(item).not.toHaveTextContent('changed since')
    unmount()
    // A reload: the store reads the device again.
    useMyWorkStore.setState({ ...EMPTY_MY_WORK })
    useMyWorkStore.getState().rehydrate()
    render(<CommentBox tag={TAG} />)
    expect(await screen.findByText('Why hybrid here?')).toBeInTheDocument()
  })

  it('C08: a labelled text area, a polite "Comment saved", focus back on the control that opened it', async () => {
    const user = userEvent.setup()
    render(<CommentBox tag={TAG} />)
    await user.click(screen.getByRole('button', { name: /add a comment/i }))
    const area = screen.getByLabelText(/add a comment on/i)
    expect(area.tagName).toBe('TEXTAREA')
    await user.type(area, 'noted')
    await user.click(screen.getByRole('button', { name: /save comment/i }))
    await waitFor(() =>
      expect(screen.getByTestId('comment-status')).toHaveTextContent('Comment saved')
    )
    expect(screen.getByTestId('comment-status')).toHaveAttribute('aria-live', 'polite')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add a comment/i })).toHaveFocus()
    )
  })

  it('A19: an older comment says the section changed; editing re-stamps it, marks it edited, clears the notice, keeps the count', async () => {
    useMyWorkStore.setState({
      comments: [
        {
          id: 'old',
          tag: TAG,
          anchorKind: 'section',
          body: 'Written against the old text',
          createdAt: '2026-11-03T10:00:00.000Z',
          updatedAt: '2026-11-03T10:00:00.000Z',
          contentVersion: live - 1,
          edited: false,
        },
      ],
    })
    const user = userEvent.setup()
    render(<CommentBox tag={TAG} />)
    const item = await screen.findByTestId('comment-item')
    expect(item).toHaveTextContent('This section changed since you wrote this')
    expect(item).toHaveTextContent(`version ${live - 1}`)
    await user.click(within(item).getByRole('button', { name: /edit comment/i }))
    const box = screen.getByLabelText(/edit your comment/i)
    await user.clear(box)
    await user.type(box, 'Re-read and updated')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    const after = await screen.findByTestId('comment-item')
    expect(after).toHaveTextContent('Re-read and updated')
    expect(after).toHaveTextContent(`version ${live}`)
    expect(after).toHaveTextContent('edited')
    expect(after).not.toHaveTextContent('changed since')
    expect(useMyWorkStore.getState().comments).toHaveLength(1)
  })

  it('A20: Keep it changes nothing; Delete comment removes it and the status says so', async () => {
    useMyWorkStore.getState().addComment({ id: 'x', tag: TAG, body: 'To be deleted' })
    const user = userEvent.setup()
    render(<CommentBox tag={TAG} />)
    await user.click(screen.getByRole('button', { name: /delete comment from/i }))
    expect(screen.getByText(/removed from this device and from my work/i)).toBeInTheDocument()
    expect(screen.getByText('To be deleted')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /keep it/i }))
    expect(useMyWorkStore.getState().comments).toHaveLength(1)
    expect(screen.getByText('To be deleted')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /delete comment from/i }))
    await user.click(screen.getByRole('button', { name: 'Delete comment' }))
    await waitFor(() => expect(useMyWorkStore.getState().comments).toHaveLength(0))
    expect(screen.queryByText('To be deleted')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('comment-status')).toHaveTextContent('Comment deleted')
    )
  })

  it('A21: with storage unavailable, add, edit and delete each name the action, keep the text, and a retry commits once', async () => {
    useMyWorkStore.getState().addComment({ id: 'keep', tag: TAG, body: 'Earlier saved text' })
    const user = userEvent.setup()
    render(<CommentBox tag={TAG} />)

    // Add fails.
    const spy = failStorage('QuotaExceededError')
    await addComment(user, 'Typed while full')
    expect(await screen.findByRole('alert')).toHaveTextContent('Your comment was not saved')
    expect(screen.getByLabelText(/add a comment on/i)).toHaveValue('Typed while full')
    expect(useMyWorkStore.getState().comments).toHaveLength(1)

    // Edit fails: the earlier saved version is unchanged and the edited text stays.
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await user.click(screen.getByRole('button', { name: /edit comment/i }))
    const box = screen.getByLabelText(/edit your comment/i)
    await user.clear(box)
    await user.type(box, 'Edited while full')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Your changes were not saved')
    expect(screen.getByLabelText(/edit your comment/i)).toHaveValue('Edited while full')
    expect(useMyWorkStore.getState().comments[0].body).toBe('Earlier saved text')

    // Restore storage and retry the edit: commits once.
    spy.mockRestore()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() =>
      expect(useMyWorkStore.getState().comments[0].body).toBe('Edited while full')
    )
    expect(useMyWorkStore.getState().comments).toHaveLength(1)

    // Delete fails, then retries.
    const spy2 = failStorage('SecurityError')
    await user.click(screen.getByRole('button', { name: /delete comment from/i }))
    await user.click(screen.getByRole('button', { name: 'Delete comment' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The comment was not deleted')
    expect(useMyWorkStore.getState().comments).toHaveLength(1)
    spy2.mockRestore()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(useMyWorkStore.getState().comments).toHaveLength(0))
  })

  it('A21: retrying a failed add after storage returns saves the comment exactly once', async () => {
    const user = userEvent.setup()
    render(<CommentBox tag={TAG} />)
    const spy = failStorage('QuotaExceededError')
    await addComment(user, 'Only once please')
    await screen.findByRole('alert')
    spy.mockRestore()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(useMyWorkStore.getState().comments).toHaveLength(1))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(MY_WORK_KEY) ?? '{}').state.comments).toHaveLength(1)
  })

  it('J5: no analytics event carries any comment text', async () => {
    const user = userEvent.setup()
    render(<CommentBox tag={TAG} />)
    await addComment(user, MARK)
    await user.click(await screen.findByRole('button', { name: /edit comment/i }))
    const box = screen.getByLabelText(/edit your comment/i)
    await user.type(box, ` ${MARK} edited`)
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await user.click(await screen.findByRole('button', { name: /delete comment from/i }))
    await user.click(screen.getByRole('button', { name: 'Delete comment' }))
    await waitFor(() => expect(useMyWorkStore.getState().comments).toHaveLength(0))
    expect(logEvent).toHaveBeenCalled() // counts are sent...
    expect(JSON.stringify(logEvent.mock.calls)).not.toContain(MARK) // ...text never is
    expect(JSON.stringify(logEvent.mock.calls)).not.toContain('PRIVATE')
  })

  describe('timers on unmount', () => {
    const FAKE = [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ] as const
    afterEach(() => vi.useRealTimers())

    // The box's own timers: the 30 ms announcement and the focus frame, with the ids they were given.
    const spyOwnTimers = () => {
      vi.useFakeTimers({ toFake: [...FAKE] })
      const setT = vi.spyOn(window, 'setTimeout')
      const clearT = vi.spyOn(window, 'clearTimeout')
      const raf = vi.spyOn(window, 'requestAnimationFrame')
      const cancelRaf = vi.spyOn(window, 'cancelAnimationFrame')
      const announceIds = () =>
        setT.mock.calls.flatMap((c, i) =>
          c[1] === 30 ? [setT.mock.results[i].value as number] : []
        )
      const frameIds = () => raf.mock.results.map((r) => r.value as number)
      return { clearT, cancelRaf, announceIds, frameIds }
    }
    const save = (text: string) => {
      fireEvent.click(screen.getByRole('button', { name: /add a comment/i }))
      fireEvent.change(screen.getByLabelText(/add a comment on/i), { target: { value: text } })
      fireEvent.click(screen.getByRole('button', { name: /save comment/i }))
    }

    it('cancels the pending announcement and focus frame when the box is unmounted', () => {
      const t = spyOwnTimers()
      const { unmount } = render(<CommentBox tag={TAG} />)
      save('a note')
      // The save announced "Comment saved" (30 ms timer) and asked for focus (a frame): both pending.
      expect(t.announceIds()).toHaveLength(1)
      expect(t.frameIds()).toHaveLength(1)
      const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      unmount()
      expect(t.clearT).toHaveBeenCalledWith(t.announceIds()[0])
      expect(t.cancelRaf).toHaveBeenCalledWith(t.frameIds()[0])
      // Running the clock now must change nothing and raise nothing.
      expect(() => act(() => void vi.advanceTimersByTime(500))).not.toThrow()
      expect(errors).not.toHaveBeenCalled()
    })

    it('a second announcement replaces the pending one instead of stacking', () => {
      const t = spyOwnTimers()
      render(<CommentBox tag={TAG} />)
      save('one')
      save('two')
      const [first, second] = t.announceIds()
      expect(second).not.toBe(first)
      expect(t.clearT).toHaveBeenCalledWith(first)
      act(() => void vi.advanceTimersByTime(100))
      expect(screen.getByTestId('comment-status')).toHaveTextContent('Comment saved')
    })
  })

  it('renders nothing for a tag that is not a lesson part', () => {
    const { container } = render(<CommentBox tag="GL:ml-kem" />)
    expect(container).toBeEmptyDOMElement()
  })
})
