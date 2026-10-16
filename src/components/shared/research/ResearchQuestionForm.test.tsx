// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { readQuestion } from '@/services/research/researchQuestion'
import { ResearchQuestionForm } from './ResearchQuestionForm'

const questions = () =>
  (useModuleStore.getState().artifacts.executiveDocuments ?? []).filter(
    (d) => d.type === 'research-question'
  )

describe('ResearchQuestionForm', () => {
  beforeEach(() => {
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [] } })
  })

  it('saves a question, names blank criteria, and edits it in place', () => {
    render(<ResearchQuestionForm />)
    expect(screen.getByTestId('research-question-save')).toBeDisabled()
    fireEvent.change(screen.getByTestId('research-question-text'), {
      target: { value: 'Does SP 800-90B min-entropy hold for this source?' },
    })
    fireEvent.change(screen.getByLabelText('Evidence threshold'), {
      target: { value: 'One reproduced run with a negative control' },
    })
    fireEvent.click(screen.getByTestId('research-question-save'))
    expect(questions()).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Still blank: inclusion criteria, exclusion criteria'
    )
    expect(readQuestion(questions()[0])?.threshold).toBe(
      'One reproduced run with a negative control'
    )

    fireEvent.change(screen.getByLabelText('Inclusion criteria'), {
      target: { value: 'NIST SP 800-90 series' },
    })
    fireEvent.click(screen.getByTestId('research-question-save'))
    expect(questions()).toHaveLength(1)
    expect(questions()[0].revisions).toHaveLength(1)
    expect(readQuestion(questions()[0])?.inclusion).toBe('NIST SP 800-90 series')
  })
})
