// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity test for the IoT & Embedded Device PQC module (LM-074).
 * Originally captured for the ModuleShell conversion; updated 2026-10-01 for
 * the IoT/OT split (new title, description and workshop steps). It also pins
 * the two manifest ↔ render seams: workshopSteps ids equal the PARTS ids in
 * index.tsx (same order) and the Learn tab renders one anchor per learnSection.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { IoTPQCModule } from './index'
import manifest from './manifest'
import indexSource from './index.tsx?raw'

describe('IoTPQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    const { container } = render(
      <EmbedProvider>
        <MemoryRouter>
          <IoTPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'IoT & Embedded Device PQC' })).toBeInTheDocument()
    expect(screen.getByText(/PQC for constrained devices — algorithm fit/)).toBeInTheDocument()
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    // Learn tab is the default: one rendered anchor per manifest learnSection, in order.
    // A data attribute has no accessible role, so this reads the DOM directly.
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const anchors = [...container.querySelectorAll('[data-section-id]')].map((el) =>
      el.getAttribute('data-section-id')
    )
    expect(anchors).toEqual(manifest.learnSections!.map((s) => s.id))
  })

  it('workshopSteps ids equal the PARTS ids in index.tsx, in order', () => {
    const partsBlock = indexSource.slice(
      indexSource.indexOf('const PARTS'),
      indexSource.indexOf('export const IoTPQCModule')
    )
    const ids = [...partsBlock.matchAll(/id: '([a-z-]+)'/g)].map((m) => m[1])
    expect(ids).toEqual(manifest.workshopSteps!.map((s) => s.id))
    expect(manifest.startHere?.step).toBe(ids[0])
  })
})
