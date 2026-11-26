// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The new-objective flow and the knowledge model it loads lazily: it must work while the model is loading, when it
 * never loads, and when it arrives after the learner has already asked for a preview.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewObjectiveFlow } from './NewObjectiveFlow'
import { renderAt, resetJourneyWorld, TLS_GOAL } from './journeyTestUtils'
import { useJourneyStore } from '@/store/useJourneyStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import type { KnowledgeCore, KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'

const load = vi.hoisted(() => vi.fn())
vi.mock('@/services/knowledge/knowledgeReader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/knowledge/knowledgeReader')>()),
  loadKnowledgeReader: load,
}))

const rec = (id: string, kind: string, label: string): KnowledgeRecord => ({
  id,
  kind,
  type: 't',
  family: 'f',
  label,
  link: `/x/${id}`,
  status: 'active',
})

/** A made-up term that no lesson says in words, taught in the TLS Basics lesson (LM-008) by a link. */
const fixtureReader = () =>
  new KnowledgeReader({
    schema: 'knowledge-core/1',
    meta: {
      counts: { records: 1, links: 1, aliases: 1, by_kind: {} },
      inputs: [],
      input_patterns: [],
    },
    records: [rec('GL:zorbkem', 'glossary term', 'Zorbkem')],
    aliases: { zorbkem: [['GL:zorbkem', 'label']] },
    links: [['GL:zorbkem', 'taught_in', 'LM-008', 'declared', 'x']],
    relations: {},
  } as unknown as KnowledgeCore)

beforeEach(() => {
  load.mockReset()
  resetJourneyWorld()
  usePersonaStore.setState({ selectedPersona: 'architect', experienceLevel: 'basics' })
})

const ask = async (goal: string) => {
  const user = userEvent.setup()
  renderAt(<NewObjectiveFlow onCreated={() => {}} onCancel={() => {}} />)
  await user.type(screen.getByLabelText('What do you want to be able to do?'), goal)
  await user.click(screen.getByRole('button', { name: 'Preview' }))
  return user
}

describe('new objective with the knowledge model', () => {
  it('loads the model once, when the flow opens', () => {
    load.mockReturnValue(new Promise(() => {}))
    renderAt(<NewObjectiveFlow onCreated={() => {}} onCancel={() => {}} />)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('works fully, with no error shown, when the model fails to load', async () => {
    load.mockRejectedValue(new Error('knowledge core: 503'))
    const user = await ask(TLS_GOAL)
    expect(await screen.findByText('Preview · nothing is saved yet')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText(/knowledge|503|error|failed/i)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Create objective' }))
    expect(Object.values(useJourneyStore.getState().objectives)).toHaveLength(1)
  })

  it('shows the word preview at once, and rebuilds it when the model arrives', async () => {
    let arrive: (r: KnowledgeReader) => void = () => {}
    load.mockReturnValue(new Promise<KnowledgeReader>((res) => (arrive = res)))
    await ask('zorbkem')
    // The words alone say nothing about the made-up term.
    expect(screen.getByTestId('preview-gap')).toBeInTheDocument()
    await act(async () => arrive(fixtureReader()))
    expect(screen.getByTestId('preview-ready')).toBeInTheDocument()
    expect(screen.getByText('TLS Basics')).toBeInTheDocument()
    expect(screen.getByText(/teaches Zorbkem/)).toBeInTheDocument()
  })

  it('does not move focus when the model arrives, and says so politely', async () => {
    let arrive: (r: KnowledgeReader) => void = () => {}
    load.mockReturnValue(new Promise<KnowledgeReader>((res) => (arrive = res)))
    await ask('zorbkem')
    // The learner asked for the preview, so focus is on it; they then move on to the Change the goal button.
    expect(screen.getByTestId('preview-gap')).toHaveFocus()
    const change = screen.getByRole('button', { name: 'Change the goal' })
    change.focus()
    expect(change).toHaveFocus()
    await act(async () => arrive(fixtureReader()))
    expect(screen.getByTestId('preview-ready')).toBeInTheDocument()
    expect(screen.getByTestId('preview-ready')).not.toHaveFocus()
    expect(document.activeElement).not.toBe(screen.getByTestId('preview-ready'))
    expect(
      screen.getByText('The preview was updated with more of what the Hub teaches.')
    ).toHaveAttribute('aria-live', 'polite')
  })

  it('uses the model for a preview asked for after it has loaded', async () => {
    load.mockResolvedValue(fixtureReader())
    renderAt(<NewObjectiveFlow onCreated={() => {}} onCancel={() => {}} />)
    await act(async () => {
      await load.mock.results[0].value
    })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('What do you want to be able to do?'), 'zorbkem')
    await user.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByTestId('preview-ready')).toBeInTheDocument()
  })
})
