// SPDX-License-Identifier: GPL-3.0-only
/**
 * Learn-tab structure for the HomomorphicEncryption module: the nine sections
 * in learning order (matching the manifest), a "Key takeaways" box in each,
 * one grouped References list, and the eight exercises.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Introduction } from './components/Introduction'
import { FheExercises } from './components/FheExercises'
import {
  FheCostSection,
  FheStandardsSection,
  FheUseCasesSection,
} from './components/FheContextSections'
import {
  FheCustodySection,
  FheFundamentalsSection,
  FheImplementationsSection,
  FheSchemesSection,
} from './components/FheSections'
import { FHE_REFERENCE_GROUPS, TAKEAWAYS } from './data/fheContextData'
import { FHE_SCHEMES } from './data/fheData'
import manifest from './manifest'

const noop = () => {}

describe('HomomorphicEncryption Learn tab', () => {
  it('renders the nine manifest sections in order, then the References list', () => {
    render(
      <MemoryRouter>
        <Introduction onNavigateToWorkshop={noop} />
      </MemoryRouter>
    )
    // eslint-disable-next-line testing-library/no-node-access -- the section anchors are data attributes, not roles
    const ids = [...document.querySelectorAll('[data-section-id]')].map(
      (el) => (el as HTMLElement).dataset.sectionId
    )
    expect(ids).toEqual(manifest.learnSections?.map((s) => s.id))
    expect(ids).toHaveLength(9)
    expect(screen.getByRole('heading', { name: 'References' })).toBeInTheDocument()
    for (const group of FHE_REFERENCE_GROUPS) {
      expect(screen.getByRole('heading', { name: group.topic })).toBeInTheDocument()
    }
  })

  it('gives every section two or three takeaways, or one for the short last section', () => {
    for (const [key, items] of Object.entries(TAKEAWAYS)) {
      const max = 3
      const min = key === 'implementations' ? 1 : 2
      expect(items.length, key).toBeGreaterThanOrEqual(min)
      expect(items.length, key).toBeLessThanOrEqual(max)
    }
  })

  it('shows the takeaways box and the new boxes in the section bodies', () => {
    render(
      <MemoryRouter>
        <FheFundamentalsSection />
        <FheSchemesSection />
        <FheUseCasesSection />
        <FheCostSection />
        <FheStandardsSection />
      </MemoryRouter>
    )
    expect(screen.getAllByText('Key takeaways')).toHaveLength(5)
    expect(screen.getByText(/promises, and what it does not/)).toBeInTheDocument()
    expect(screen.getByText('Fixed-point, not floating-point')).toBeInTheDocument()
    expect(screen.getByText('Which scheme for which data')).toBeInTheDocument()
    expect(screen.getByText(/When FHE.s value justifies its cost/)).toBeInTheDocument()
    expect(screen.getByText('What you can and cannot claim')).toBeInTheDocument()
  })

  it('lists the ISO/IEC 28033 parts at their current stages', () => {
    const byId = Object.fromEntries(FHE_SCHEMES.map((s) => [s.id, s.isoPart]))
    expect(byId.bgv).toBe('ISO/IEC DIS 28033-2')
    expect(byId.ckks).toBe('ISO/IEC FDIS 28033-3')
    expect(byId.tfhe).toBe('ISO/IEC FDIS 28033-4')
  })
})

describe('HomomorphicEncryption exercises', () => {
  it('renders eight exercises; the three Learn-based ones open the Learn tab', () => {
    render(
      <MemoryRouter>
        <FheExercises onNavigateToWorkshop={noop} onNavigateToLearn={noop} />
      </MemoryRouter>
    )
    for (const title of [
      /6\. Read a noisy CKKS result/,
      /7\. Pick a scheme for three use cases/,
      /8\. Check a compliance claim/,
    ]) {
      const heading = screen.getByRole('heading', { name: title })
      // eslint-disable-next-line testing-library/no-node-access -- the card has no role of its own
      const card = heading.closest('.glass-panel') as HTMLElement
      expect(within(card).getByRole('button', { name: /Open Learn/ })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('button', { name: /Open Workshop/ })).toHaveLength(5)
  })
})

describe('HomomorphicEncryption Learn tab: links to the key-lifecycle views', () => {
  it('the rotation and threshold cards open their view in the concepts step and the flow diagrams', () => {
    const open = vi.fn()
    render(
      <MemoryRouter>
        <FheCustodySection onOpenLifecycleView={open} />
      </MemoryRouter>
    )
    // eslint-disable-next-line testing-library/no-node-access -- the anchors are element ids
    expect(document.getElementById('fhe-key-rotation')).toBeInTheDocument()
    const rot = screen.getByRole('group', { name: 'Open the key-rotation view in the workshop' })
    fireEvent.click(within(rot).getByRole('button', { name: /Interactive view/ }))
    fireEvent.click(within(rot).getByRole('button', { name: /Flow diagram/ }))
    const shared = screen.getByRole('group', {
      name: 'Open the shared-decryption view in the workshop',
    })
    fireEvent.click(within(shared).getByRole('button', { name: /Interactive view/ }))
    fireEvent.click(within(shared).getByRole('button', { name: /Flow diagram/ }))
    expect(open.mock.calls).toEqual([
      ['rotation', 'concepts'],
      ['rotation', 'flows'],
      ['shared', 'concepts'],
      ['shared', 'flows'],
    ])
  })

  it('the reference-runs card links to both views, and shows nothing without a handler', () => {
    const open = vi.fn()
    const { unmount } = render(
      <MemoryRouter>
        <FheImplementationsSection onOpenLifecycleView={open} />
      </MemoryRouter>
    )
    // eslint-disable-next-line testing-library/no-node-access -- the anchors are element ids
    expect(document.getElementById('fhe-reference-runs')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Key rotation view/ }))
    fireEvent.click(screen.getByRole('button', { name: /Shared decryption view/ }))
    expect(open.mock.calls).toEqual([
      ['rotation', 'concepts'],
      ['shared', 'concepts'],
    ])
    unmount()
    render(
      <MemoryRouter>
        <FheImplementationsSection />
      </MemoryRouter>
    )
    expect(screen.queryByRole('button', { name: /Key rotation view/ })).not.toBeInTheDocument()
  })
})
