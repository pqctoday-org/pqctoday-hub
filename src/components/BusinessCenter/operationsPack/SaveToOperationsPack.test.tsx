// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { SaveToOperationsPack } from './SaveToOperationsPack'

const builder = (data: string) => () => ({
  type: 'hsm-capacity-plan' as const,
  moduleId: 'hsm-capacity',
  title: 'HSM capacity plan',
  data,
  inputs: { data },
})

const docs = () => useModuleStore.getState().artifacts.executiveDocuments ?? []

describe('SaveToOperationsPack', () => {
  it('is not offered to roles without the operations pack', () => {
    usePersonaStore.setState({ selectedPersona: 'architect' })
    render(
      <MemoryRouter>
        <SaveToOperationsPack build={builder('x')} testId="save" />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('save')).toBeNull()
  })

  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: 'ops' })
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [] } })
  })

  it('saves, then offers to save again once the inputs change, updating the same document', () => {
    const first = builder('plan A')
    const { rerender } = render(
      <MemoryRouter>
        <SaveToOperationsPack build={first} testId="save" />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTestId('save'))
    expect(screen.getByTestId('save')).toHaveTextContent('Saved to operations pack')
    expect(docs()).toHaveLength(1)

    // Same inputs, re-rendered: still saved.
    rerender(
      <MemoryRouter>
        <SaveToOperationsPack build={first} testId="save" />
      </MemoryRouter>
    )
    expect(screen.getByTestId('save')).toHaveTextContent('Saved to operations pack')

    // Inputs changed: the button no longer claims they are saved.
    const second = builder('plan B')
    rerender(
      <MemoryRouter>
        <SaveToOperationsPack build={second} testId="save" />
      </MemoryRouter>
    )
    expect(screen.getByTestId('save')).toHaveTextContent(/^Save to operations pack$/)
    fireEvent.click(screen.getByTestId('save'))
    expect(docs()).toHaveLength(1)
    expect(docs()[0].data).toBe('plan B')
  })
})
