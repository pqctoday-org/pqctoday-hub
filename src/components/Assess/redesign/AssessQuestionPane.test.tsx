// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AssessWizardScreen } from './AssessWizardScreen'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import {
  RENDER_ORDER_FULL,
  STEP_META,
  keyAtStoreIndex,
  storeIndexOf,
  type AssessStepKey,
} from './assessFlowModel'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const writeText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  useAssessmentStore.getState().reset()
  writeText.mockClear()
})

function renderFullTrack(initialEntry = '/assess') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AssessWizardScreen
        mode="comprehensive"
        onComplete={vi.fn()}
        onExitToChooser={vi.fn()}
        onSwitchTrack={vi.fn()}
      />
    </MemoryRouter>
  )
}

// A full-track question whose position on screen differs from its store index.
const DISPLACED: AssessStepKey[] = RENDER_ORDER_FULL.filter(
  (key, renderIdx) => storeIndexOf('comprehensive', key) !== renderIdx
)

describe('AssessQuestionPane resume link', () => {
  it('has full-track questions whose screen position differs from their store index', () => {
    // Guards the premise of the tests below: if the two orders ever coincide, the
    // regression tests would pass without proving anything.
    expect(DISPLACED.length).toBeGreaterThan(0)
  })

  it.each(DISPLACED)('copies a link that reopens on the same question ("%s")', async (key) => {
    const user = userEvent.setup()
    // userEvent installs its own clipboard stub on setup; replace it afterwards.
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    useAssessmentStore.getState().setStep(storeIndexOf('comprehensive', key))
    // eslint-disable-next-line security/detect-object-injection -- key comes from the step registry
    const question = STEP_META[key].question
    const { unmount } = renderFullTrack()
    expect(screen.getByRole('heading', { name: question })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /save link/i }))
    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = new URL(writeText.mock.calls[0][0] as string)
    const stepParam = copied.searchParams.get('step')

    // The number in the link is the store index, which is what the reader parses.
    expect(Number(stepParam)).toBe(storeIndexOf('comprehensive', key))
    expect(keyAtStoreIndex('comprehensive', Number(stepParam))).toBe(key)

    // Reopen the link: the step it carries, read the way the wizard reads it, must
    // land on the same question.
    unmount()
    useAssessmentStore.getState().setStep(Number(stepParam))
    renderFullTrack(`/assess?step=${stepParam}`)
    expect(screen.getByRole('heading', { name: question })).toBeInTheDocument()
  })
})
