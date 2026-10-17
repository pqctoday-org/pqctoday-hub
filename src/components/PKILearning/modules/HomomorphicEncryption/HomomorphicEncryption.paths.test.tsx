// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { HomomorphicEncryptionModule } from './index'
import manifest from './manifest'

const renderModule = (url = '/learn/homomorphic-encryption') =>
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[url]}>
        <HomomorphicEncryptionModule />
      </MemoryRouter>
    </EmbedProvider>
  )

describe('HomomorphicEncryption role paths', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
    usePersonaStore.getState().setPersona(null)
  })

  it('defaults a certification engineer to the advanced path', () => {
    usePersonaStore.getState().setPersona('cert-engineer')
    renderModule()
    expect(screen.getByRole('button', { name: /Advanced HSM custody/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(useModuleStore.getState().modules[manifest.id]?.activeLearnPath).toBe('hsm-custody')
  })

  it('lets a developer choose advanced custody but starts on foundations', () => {
    usePersonaStore.getState().setPersona('developer')
    renderModule()
    expect(screen.getByRole('button', { name: /FHE foundations/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: /Advanced HSM custody/ })).toBeInTheDocument()
  })

  it('keeps the advanced path hidden from curious, executive and GRC roles', () => {
    for (const persona of ['curious', 'executive', 'grc'] as const) {
      usePersonaStore.getState().setPersona(persona)
      useModuleStore.getState().setActiveLearnPath(manifest.id, 'hsm-custody')
      const view = renderModule('/learn/homomorphic-encryption?path=hsm-custody')
      expect(screen.queryByRole('button', { name: /Advanced HSM custody/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'All sections' })).not.toBeInTheDocument()
      expect(useModuleStore.getState().modules[manifest.id]?.activeLearnPath).toBe(
        'fhe-foundations'
      )
      view.unmount()
    }
  })
})
