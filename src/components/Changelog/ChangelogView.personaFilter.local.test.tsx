// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ChangelogView } from './ChangelogView'
import { usePersonaStore } from '@/store/usePersonaStore'
vi.mock('../../utils/changelogParser', () => ({
  HAS_DATA_SECTIONS: false,
  HAS_SECURITY_SECTIONS: false,
  ALL_CHANGELOG_VERSIONS: [
    {
      version: '9.9.9',
      date: 'November 5, 2026',
      summary: 'Controlled fictional filter fixture',
      sections: [
        {
          type: 'added',
          entries: [
            {
              title: 'Fixture explicit leader',
              body: '',
              meta: { personas: ['executive'], views: [] },
            },
            {
              title: 'Fixture NIST architect-only',
              body: '',
              meta: { personas: ['architect'], views: [] },
            },
            { title: 'Fixture NIST untagged', body: '', meta: { personas: [], views: [] } },
            { title: 'Fixture unrelated', body: '', meta: { personas: [], views: [] } },
            {
              title: 'Fixture shared explicit',
              body: '',
              meta: { personas: ['architect', 'executive'], views: [] },
            },
          ],
        },
        {
          type: 'fixed',
          entries: [
            {
              title: 'Fixture fixed leader',
              body: '',
              meta: { personas: ['executive'], views: [] },
            },
          ],
        },
      ],
    },
  ],
}))
beforeEach(() => usePersonaStore.setState({ selectedPersona: 'executive' }))
const open = () =>
  render(
    <MemoryRouter>
      <ChangelogView />
    </MemoryRouter>
  )
describe('changelog role tags precede untagged keyword guesses', () => {
  it('keeps explicit selected and multi-role entries, guesses only untagged, and restores all when switched off', () => {
    open()
    expect(screen.getByText('Fixture NIST architect-only')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'For me' }))
    expect(screen.getByText('Fixture explicit leader')).toBeInTheDocument()
    expect(screen.getByText('Fixture shared explicit')).toBeInTheDocument()
    expect(screen.getByText('Fixture NIST untagged')).toBeInTheDocument()
    expect(screen.getByText('Fixture fixed leader')).toBeInTheDocument()
    expect(screen.queryByText('Fixture NIST architect-only')).not.toBeInTheDocument()
    expect(screen.queryByText('Fixture unrelated')).not.toBeInTheDocument()
    expect(screen.getByText(/explicitly tagged for your role/)).toHaveTextContent(
      'Showing 3 entries explicitly tagged for your role, plus 1 matched by keyword'
    )
    fireEvent.click(screen.getByRole('button', { name: 'For me' }))
    expect(screen.getByText('Fixture NIST architect-only')).toBeInTheDocument()
    expect(screen.getByText('Fixture unrelated')).toBeInTheDocument()
  })
  it('retains search and section intersections and updates when the selected role changes', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'For me' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Search changelog entries' }), {
      target: { value: 'NIST' },
    })
    expect(screen.getByText('Fixture NIST untagged')).toBeInTheDocument()
    expect(screen.queryByText('Fixture NIST architect-only')).not.toBeInTheDocument()
    expect(screen.queryByText('Fixture explicit leader')).not.toBeInTheDocument()
    act(() => usePersonaStore.setState({ selectedPersona: 'architect' }))
    expect(screen.getByText('Fixture NIST architect-only')).toBeInTheDocument()
    expect(screen.queryByText('Fixture NIST untagged')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Search changelog entries' }), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'New Features' }))
    expect(screen.queryByText('Fixture NIST architect-only')).not.toBeInTheDocument()
    expect(screen.queryByText('Fixture shared explicit')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'For me' }))
    expect(screen.getByText('Fixture fixed leader')).toBeInTheDocument()
  })
})
