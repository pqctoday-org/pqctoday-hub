// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ExecutiveDocument } from '@/services/storage/types'
import { TYPE_LABELS } from '@/data/artifactLabels'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ArtifactDrawer } from './ArtifactDrawer'

const createDrawer = (type: 'hsm-capacity-plan' | 'architecture-scope') =>
  render(
    <MemoryRouter>
      <ArtifactDrawer
        document={null}
        createType={type}
        mode="create"
        onClose={() => {}}
        onModeChange={() => {}}
      />
    </MemoryRouter>
  )

const savedSimRoadmap: ExecutiveDocument = {
  id: 'sim-1',
  moduleId: 'simulation',
  type: 'sim-roadmap',
  title: 'Saved roadmap',
  data: '# Roadmap\n\nBody.',
  createdAt: 1_700_000_000_000,
}

describe('ArtifactDrawer — types made on another page', () => {
  it('titles a create-mode drawer with the type label when no tool has that name', () => {
    createDrawer('hsm-capacity-plan')
    expect(
      screen.getByRole('heading', { name: `New ${TYPE_LABELS['hsm-capacity-plan']}` })
    ).toBeInTheDocument()
  })

  it('says where the document is made and links there, with no export button', () => {
    createDrawer('hsm-capacity-plan')
    expect(screen.getByText(/Made in the HSM capacity calculator/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open it there/i })).toHaveAttribute(
      'href',
      '/playground/hsm-capacity'
    )
    expect(screen.queryByText(/use the export button/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /markdown/i })).not.toBeInTheDocument()
  })

  it('names the pack panel and gives no link when the visitor has another persona', () => {
    usePersonaStore.setState({ selectedPersona: 'executive' })
    createDrawer('architecture-scope')
    expect(
      screen.getByText('Made in the Architecture pack, shown on this page for the Architect role.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /open it there/i })).toBeNull()
  })

  it('keeps the export wording when a saved document has no editor, since export is rendered', () => {
    render(
      <MemoryRouter>
        <ArtifactDrawer
          document={savedSimRoadmap}
          mode="edit"
          onClose={() => {}}
          onModeChange={() => {}}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/use the export button/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /markdown/i })).toBeInTheDocument()
  })
})
