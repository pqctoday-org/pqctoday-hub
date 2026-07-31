// SPDX-License-Identifier: GPL-3.0-only
/**
 * Locks the deep-link + learn-path behaviour added 2026-07-30.
 *
 * The bug this guards against already happened once: LearnStepper's docstring
 * advertised `#section-id` deep links for months while no code read the URL at
 * all. A documented capability with no test is how that survives.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { LearnSection } from './LearnSection'
import { useModuleStore } from '@/store/useModuleStore'
import manifest from '@/components/PKILearning/modules/EMVPaymentPQC/manifest'

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <LearnSection sectionId="interbank-rails" title="Interbank Rails" icon={null}>
        <p>settlement body copy</p>
      </LearnSection>
    </MemoryRouter>
  )

describe('LearnSection deep linking', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
  })

  it('stays collapsed when the URL does not name it', () => {
    renderAt('/learn/emv-payment-pqc')
    expect(screen.queryByText('settlement body copy')).not.toBeInTheDocument()
  })

  it('opens when named via ?section=', () => {
    renderAt('/learn/emv-payment-pqc?section=interbank-rails')
    expect(screen.getByText('settlement body copy')).toBeInTheDocument()
  })

  it('opens when named via a hash anchor', () => {
    renderAt('/learn/emv-payment-pqc#interbank-rails')
    expect(screen.getByText('settlement body copy')).toBeInTheDocument()
  })

  it('does not open for a different section id', () => {
    renderAt('/learn/emv-payment-pqc?section=card-auth')
    expect(screen.queryByText('settlement body copy')).not.toBeInTheDocument()
  })

  it('renders the anchor the workshop scroll-to cues rely on', () => {
    renderAt('/learn/emv-payment-pqc')
    // Queried from the document rather than the render container: this anchor
    // is a DOM contract consumed by `document.querySelector` in the workshop
    // scroll-to cues and in the deep-link effect, so asserting it the same way
    // those consumers read it is the point.
    expect(document.querySelector('[data-section-id="interbank-rails"]')).toBeInTheDocument()
  })
})

describe('EMV learn paths', () => {
  const paths = manifest.learnPaths ?? []

  it('declares the three industry paths', () => {
    expect(paths.map((p) => p.id).sort()).toEqual(['banking', 'cards', 'retail'])
  })

  it('every path section and entry section is a real section of the module', () => {
    const known = new Set((manifest.learnSections ?? []).map((s) => s.id))
    for (const p of paths) {
      expect(known, `${p.id}: entrySection`).toContain(p.entrySection)
      for (const s of p.sections) expect(known, `${p.id}: ${s}`).toContain(s)
    }
  })

  it('every path starts at its own entry section', () => {
    for (const p of paths) expect(p.sections, p.id).toContain(p.entrySection)
  })

  it('no path demands the whole module', () => {
    const total = (manifest.learnSections ?? []).length
    for (const p of paths) expect(p.sections.length, p.id).toBeLessThan(total)
  })

  it('the payoff sections are in every path', () => {
    for (const p of paths) {
      expect(p.sections, p.id).toContain('quantum-threats')
      expect(p.sections, p.id).toContain('migration-landscape')
    }
  })
})
