// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The comment box for a lesson, a section or a step, keyed by its canonical tag (requirements C01 to C08).
 *
 * - Works with no objective and no sign-up (C01). The comment belongs to the learner and the tag, so it shows
 *   wherever the resource appears (C02).
 * - Each comment says which content version it was written against; when the lesson has moved on it says "This
 *   section changed since you wrote this" with the current version (C03). Saving an edit re-stamps it, marks it
 *   edited and clears the notice (C06).
 * - Delete asks first and shows the text; there is no undo (C06).
 * - A failed add, edit or delete names the action, says what is intact, keeps the typed text and offers
 *   Try again, which commits once (C07, J08).
 * - A labelled text area, a polite status after each save, and focus back on the control that opened it (C08).
 * - Writing, editing or deleting never touches progress, evidence or any finish condition (C04).
 *
 * Nothing the learner types is sent to analytics (J5); only a count is.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { MessageSquare, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import {
  StickerCard,
  StoryButton,
  StoryRow,
  StoryTextarea,
  StatusChip,
} from '@/components/storybook'
import {
  MAX_COMMENT_LENGTH,
  newCommentId,
  useMyWorkStore,
  type MyComment,
} from '@/store/useMyWorkStore'
import { FAILURE_WORDS, type StorageFailureReason } from '@/store/deviceLocalJson'
import { currentContentVersion, parseTag } from '@/services/myWork/tags'
import { trackMyWork } from '@/services/myWork/myWorkAnalytics'
import { useTagLabels } from './useTagLabels'
import { formatDate } from '@/lib/format'

export interface CommentBoxProps {
  /** Canonical tag of what is being commented on: `LM-008`, `LM-008/s:handshake`, `LM-008/w:simulate`. */
  tag: string
  /** Heading override. Default: "Your comments on <where>". */
  title?: string
  /** Told the number of comments on this tag after each change, so a host can show a count in an outline. */
  onCountChange?: (count: number) => void
  /** Open the Updates view for the changed lesson (shown beside the "changed since" line when given). */
  onReviewUpdate?: () => void
  className?: string
}

type Failure = { action: 'add' | 'edit' | 'delete'; reason: StorageFailureReason; id?: string }

const FAILURE_HEADLINE: Record<Failure['action'], string> = {
  add: 'Your comment was not saved',
  edit: 'Your changes were not saved',
  delete: 'The comment was not deleted',
}
const FAILURE_INTACT: Record<Failure['action'], string> = {
  add: 'What you typed is still in the box. Nothing else was changed.',
  edit: 'What you edited is still in the box, and the earlier saved version is unchanged.',
  delete: 'The comment is still saved on this device.',
}

const dayLabel = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : formatDate(d, 'day', { relative: false })
}

export function CommentBox({
  tag,
  title,
  onCountChange,
  onReviewUpdate,
  className,
}: CommentBoxProps) {
  const uid = useId()
  const { labelOf } = useTagLabels()
  const where = labelOf(tag)
  const allComments = useMyWorkStore((s) => s.comments)
  const comments = useMemo(
    () =>
      allComments
        .filter((c) => c.tag === tag)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0)),
    [allComments, tag]
  )
  const addComment = useMyWorkStore((s) => s.addComment)
  const editComment = useMyWorkStore((s) => s.editComment)
  const deleteComment = useMyWorkStore((s) => s.deleteComment)
  const live = currentContentVersion(tag)
  const valid = parseTag(tag) !== undefined

  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const draftId = useRef<string>('')
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [status, setStatus] = useState('')

  const addButton = useRef<HTMLButtonElement>(null)
  const openers = useRef(new Map<string, HTMLButtonElement | null>())

  // The pending announcement timer and focus frame are kept so an unmount (or a newer announcement)
  // cancels them: a timer left running would set state on a box that is gone.
  const announceTimer = useRef<number | undefined>(undefined)
  const focusFrame = useRef<number | undefined>(undefined)
  useEffect(
    () => () => {
      window.clearTimeout(announceTimer.current)
      window.cancelAnimationFrame(focusFrame.current ?? 0)
    },
    []
  )

  const announce = (message: string) => {
    // Cleared first so the same message twice is still announced.
    setStatus('')
    window.clearTimeout(announceTimer.current)
    announceTimer.current = window.setTimeout(() => setStatus(message), 30)
  }
  // The control may not exist yet (it is shown once the box closes), so it is looked up when the frame comes.
  const focusLater = (find: () => HTMLElement | null | undefined) => {
    window.cancelAnimationFrame(focusFrame.current ?? 0)
    focusFrame.current = window.requestAnimationFrame(() => find()?.focus())
  }

  const countAfter = useCallback(
    () => useMyWorkStore.getState().comments.filter((c) => c.tag === tag).length,
    [tag]
  )

  function openAdd() {
    draftId.current = newCommentId()
    setDraft('')
    setFailure(null)
    setAdding(true)
  }

  function saveAdd() {
    const result = addComment({ id: draftId.current, tag, body: draft })
    if (!result.ok) {
      setFailure({ action: 'add', reason: result.reason })
      trackMyWork('comment_failed')
      return
    }
    setFailure(null)
    setAdding(false)
    setDraft('')
    announce('Comment saved')
    trackMyWork('comment_added', countAfter())
    onCountChange?.(countAfter())
    focusLater(() => addButton.current)
  }

  function saveEdit() {
    if (!editing) return
    const result = editComment(editing.id, editing.text)
    if (!result.ok) {
      setFailure({ action: 'edit', reason: result.reason, id: editing.id })
      trackMyWork('comment_failed')
      return
    }
    const id = editing.id
    setFailure(null)
    setEditing(null)
    announce('Changes saved')
    trackMyWork('comment_edited', countAfter())
    focusLater(() => openers.current.get(`edit:${id}`))
  }

  function confirmDelete(id: string) {
    const result = deleteComment(id)
    if (!result.ok) {
      setFailure({ action: 'delete', reason: result.reason, id })
      trackMyWork('comment_failed')
      return
    }
    setFailure(null)
    setConfirming(null)
    announce('Comment deleted')
    trackMyWork('comment_deleted', countAfter())
    onCountChange?.(countAfter())
    focusLater(() => addButton.current)
  }

  function retry() {
    if (!failure) return
    if (failure.action === 'add') saveAdd()
    else if (failure.action === 'edit') saveEdit()
    else if (failure.id) confirmDelete(failure.id)
  }

  const heading = title ?? `Your comments on ${where}`
  const headingId = `${uid}-heading`

  if (!valid) return null

  const failureView = (forId?: string) =>
    failure && (failure.id ?? undefined) === forId ? (
      <div
        role="alert"
        className="mt-3 rounded-2xl border-2 border-ink bg-caution px-4 py-3 text-caution-foreground"
      >
        <p className="flex items-center gap-2 text-sm font-bold">
          <AlertTriangle size={16} aria-hidden="true" />
          {FAILURE_HEADLINE[failure.action]}
        </p>
        <p className="mt-1 text-sm">
          {FAILURE_WORDS[failure.reason]} {FAILURE_INTACT[failure.action]}
        </p>
        <StoryButton variant="secondary" className="mt-3" onClick={retry}>
          Try again
        </StoryButton>
      </div>
    ) : null

  return (
    <StickerCard
      as="section"
      aria-labelledby={headingId}
      padding="default"
      className={className}
      data-testid="comment-box"
    >
      <h3 id={headingId} className="flex items-center gap-2 text-base font-extrabold text-heading">
        <MessageSquare size={18} aria-hidden="true" />
        {heading}
        <span className="text-sm font-semibold text-muted-foreground">({comments.length})</span>
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Stored on this device only. A comment never counts toward your progress.
      </p>

      <ul className="mt-3 space-y-3" aria-label="Comments">
        {comments.map((c: MyComment) => {
          const changed = live > c.contentVersion
          const isEditing = editing?.id === c.id
          const isConfirming = confirming === c.id
          return (
            <StoryRow as="li" key={c.id} data-testid="comment-item">
              {isEditing ? (
                <div>
                  <label htmlFor={`${uid}-edit-${c.id}`} className="text-sm font-bold text-heading">
                    Edit your comment on {where}
                  </label>
                  <StoryTextarea
                    id={`${uid}-edit-${c.id}`}
                    className="mt-2"
                    value={editing.text}
                    maxLength={MAX_COMMENT_LENGTH}
                    onChange={(e) => setEditing({ id: c.id, text: e.target.value })}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StoryButton onClick={saveEdit} disabled={!editing.text.trim()}>
                      Save changes
                    </StoryButton>
                    <StoryButton
                      variant="secondary"
                      onClick={() => {
                        setEditing(null)
                        setFailure(null)
                        focusLater(() => openers.current.get(`edit:${c.id}`))
                      }}
                    >
                      Cancel
                    </StoryButton>
                  </div>
                  {failureView(c.id)}
                </div>
              ) : isConfirming ? (
                <div role="group" aria-label="Delete this comment?">
                  <p className="whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
                  <p className="mt-2 text-sm font-semibold text-heading">
                    It is removed from this device and from My work. This can’t be undone.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StoryButton onClick={() => confirmDelete(c.id)}>Delete comment</StoryButton>
                    <StoryButton
                      variant="secondary"
                      onClick={() => {
                        setConfirming(null)
                        setFailure(null)
                        focusLater(() => openers.current.get(`delete:${c.id}`))
                      }}
                    >
                      Keep it
                    </StoryButton>
                  </div>
                  {failureView(c.id)}
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      You · {dayLabel(c.updatedAt)} · version {c.contentVersion}
                      {c.edited ? ' · edited' : ''}
                    </span>
                    {changed && (
                      <StatusChip
                        status="changed"
                        label={`This section changed since you wrote this · now version ${live}`}
                      />
                    )}
                  </p>
                  {changed && onReviewUpdate && (
                    <StoryButton variant="quiet" onClick={onReviewUpdate}>
                      See what changed
                    </StoryButton>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <StoryButton
                      variant="quiet"
                      ref={(el) => void openers.current.set(`edit:${c.id}`, el)}
                      aria-label={`Edit comment from ${dayLabel(c.updatedAt)} on ${where}`}
                      onClick={() => {
                        setFailure(null)
                        setEditing({ id: c.id, text: c.body })
                      }}
                    >
                      <Pencil size={14} aria-hidden="true" /> Edit
                    </StoryButton>
                    <StoryButton
                      variant="quiet"
                      ref={(el) => void openers.current.set(`delete:${c.id}`, el)}
                      aria-label={`Delete comment from ${dayLabel(c.updatedAt)} on ${where}`}
                      onClick={() => {
                        setFailure(null)
                        setConfirming(c.id)
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" /> Delete
                    </StoryButton>
                  </div>
                  {failureView(c.id)}
                </div>
              )}
            </StoryRow>
          )
        })}
      </ul>

      {adding ? (
        <div className="mt-4">
          <label htmlFor={`${uid}-new`} className="text-sm font-bold text-heading">
            Add a comment on {where}
          </label>
          <StoryTextarea
            id={`${uid}-new`}
            className="mt-2"
            value={draft}
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- the learner just asked to write; focus goes to the box they opened
            autoFocus
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <StoryButton onClick={saveAdd} disabled={!draft.trim()}>
              Save comment
            </StoryButton>
            <StoryButton
              variant="secondary"
              onClick={() => {
                setAdding(false)
                setFailure(null)
                focusLater(() => addButton.current)
              }}
            >
              Cancel
            </StoryButton>
          </div>
          {failureView(undefined)}
        </div>
      ) : (
        <StoryButton
          ref={addButton}
          variant="secondary"
          className="mt-4"
          onClick={openAdd}
          aria-label={`Add a comment on ${where}`}
        >
          Add a comment
        </StoryButton>
      )}

      <p role="status" aria-live="polite" className="sr-only" data-testid="comment-status">
        {status}
      </p>
    </StickerCard>
  )
}
