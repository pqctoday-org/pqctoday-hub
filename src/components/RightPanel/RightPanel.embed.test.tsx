// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { RightPanel } from './RightPanel'
import { useRightPanelStore } from '@/store/useRightPanelStore'

vi.mock('@/embed/EmbedProvider', () => ({
  useEmbedState: () => ({
    isEmbedded: true,
    policy: { features: { assistantEnabled: true, assistantTitle: 'Partner helper' } },
  }),
  useIsEmbedded: () => true,
}))

beforeEach(() => useRightPanelStore.setState({ isOpen: true, activeTab: 'chat' }))

describe('drawer in an embedded Hub page', () => {
  it('honours the certificate policy title', () => {
    render(
      <MemoryRouter>
        <RightPanel />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Partner helper' })).toBeInTheDocument()
    expect(
      screen.getByLabelText('Partner helper', { selector: '[role="region"]' })
    ).toBeInTheDocument()
  })
})
