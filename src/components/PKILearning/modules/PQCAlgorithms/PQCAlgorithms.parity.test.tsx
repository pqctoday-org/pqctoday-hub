// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection, testing-library/no-node-access -- checks the claim lines by their data attribute */
/**
 * Render and registration checks for the PQC Algorithms module.
 */
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CuriousSummaryBanner } from '../../common/CuriousSummaryBanner'
import { PQCAlgorithmsModule } from './index'
import { PQCAlgorithmsIntroduction } from './components/PQCAlgorithmsIntroduction'
import { LESSON_OUTLINE } from './data/lessonOutline'
import { SOURCE_CLAIMS } from './data/sourceClaims'
import manifest from './manifest'
import { content } from './content'

describe('PQCAlgorithms', () => {
  it('renders the module header and the standard tab set', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCAlgorithmsModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'The PQC Algorithms: How They Work and How to Choose' })
    ).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Foundations track', () => {
    expect(manifest.track).toBe('Foundations')
    expect(manifest.id).toBe('pqc-algorithms')
    expect(manifest.lm_id).toBe('LM-088')
    expect(manifest.difficulty).toBe('intermediate')
  })

  it('declares seven Learn sections and three workshop steps', () => {
    expect(manifest.learnSections?.length).toBe(7)
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual([
      'ml-kem-round-trip',
      'ml-dsa-sign-verify',
      'size-comparator',
    ])
    expect(manifest.startHere?.step).toBe('ml-kem-round-trip')
  })

  it('cites the Library documents the lesson reads', () => {
    const ids = content.standards.map((s) => s.id)
    for (const id of ['FIPS 203', 'FIPS 204', 'FIPS 205', 'NIST SP 800-227', 'NIST IR 8547']) {
      expect(ids, id).toContain(id)
    }
  })

  it('renders every section of the outline with its claims, panels collapsed', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCAlgorithmsIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    for (const [i, s] of LESSON_OUTLINE.entries()) {
      expect(
        screen.getByRole('heading', { level: 2, name: `${i + 1}. ${s.title}` })
      ).toBeInTheDocument()
    }
    // The first section is open; its claims are in the page.
    const first = LESSON_OUTLINE[0].blocks[0].claims[0]
    expect(document.querySelector(`[data-claim="${first}"]`)).not.toBeNull()
    expect(screen.getByText(SOURCE_CLAIMS[first].text)).toBeInTheDocument()
    // Open every section, then check the role panels are collapsed toggles.
    for (const h of screen.getAllByRole('heading', { level: 2 })) {
      const toggle = h.closest('button')
      if (toggle && toggle.getAttribute('aria-expanded') === 'false') fireEvent.click(toggle)
    }
    const developers = screen.getAllByRole('button', { name: /^For developers: / })
    const validation = screen.getAllByRole('button', { name: /^For validation engineers: / })
    expect(developers.length).toBeGreaterThan(0)
    expect(validation.length).toBeGreaterThan(0)
    for (const b of [...developers, ...validation]) {
      expect(b).toHaveAttribute('aria-expanded', 'false')
    }
    const panelBlocks = LESSON_OUTLINE.flatMap((s) => s.blocks).filter((b) => b.panel !== 'none')
    expect(developers.length + validation.length).toBe(panelBlocks.length)
    expect(
      within(document.body).queryAllByRole('link', { name: 'PQC 101' }).length
    ).toBeGreaterThan(0)
  })

  it('loads the plain-language summary for the Visual tab', () => {
    render(<CuriousSummaryBanner moduleId="pqc-algorithms" isFullPage />)
    expect(screen.queryByText('No visual summary yet')).not.toBeInTheDocument()
  })
})
