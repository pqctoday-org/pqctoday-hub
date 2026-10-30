// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render and registration checks for the Media, Entertainment & DRM module.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { MediaDrmPQCModule } from './index'
import manifest from './manifest'
import { content } from './content'

describe('MediaDrmPQC', () => {
  it('renders the module header and the standard tab set', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <MediaDrmPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Media, Entertainment & DRM PQC' })
    ).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Industries track after the existing modules', () => {
    expect(manifest.track).toBe('Industries')
    expect(manifest.id).toBe('media-drm-pqc')
    expect(manifest.lm_id).toBe('LM-077')
    expect(manifest.trackOrder).toBe(8)
  })

  it('declares one Learn section per section id and three workshop steps', () => {
    expect(manifest.learnSections?.map((s) => s.id)).toEqual([
      'threat-model',
      'disc-keys',
      'broadcast-ci-plus',
      'streaming-transport',
      'provenance',
      'migration-surface',
    ])
    expect(manifest.workshopSteps?.length).toBe(3)
  })

  it('cites the Library documents the lesson reads', () => {
    const ids = content.standards.map((s) => s.id)
    for (const id of [
      'MovieLabs-ECP-v1-4',
      'AACS-Introduction-and-Common-Cryptographic-Elements-Book-Rev',
      'CI-Plus-Spec-v1.3.2',
      'Content-Credentials-C2PA-Technical-Specification-Version-2-4',
      'RFC-10024',
      'NIST IR 8547',
    ]) {
      expect(ids, id).toContain(id)
    }
  })
})
