// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { AlgorithmComparison } from './AlgorithmComparison'
import { algorithmsData } from '@/data/algorithmsData'
import { transitionMatchesHighlight, transitionRowId } from './highlightMatch'

// Deep-link refresh audit (2026-10-02): on a phone, /algorithms?tab=transition
// &highlight=3des showed the transition wizard — no row, nothing highlighted —
// while the page's notice said the linked row was visible. A ?highlight link now
// opens the phone list with the matching cards tinted and tagged for scroll; a
// role-default highlight (executive/curious) keeps the wizard.
describe('AlgorithmComparison — phone highlight', () => {
  const highlight = new Set(['3DES'])
  const target = algorithmsData.find((r) => transitionMatchesHighlight(r, '3DES'))

  function renderAt(
    highlightFromLink: boolean,
    {
      highlightAlgorithms = highlight,
      selectedRowId = null,
    }: { highlightAlgorithms?: Set<string>; selectedRowId?: string | null } = {}
  ) {
    return render(
      <MemoryRouter>
        <AlgorithmComparison
          highlightAlgorithms={highlightAlgorithms}
          highlightFromLink={highlightFromLink}
          selectedRowId={selectedRowId}
          filteredData={algorithmsData}
          compareSet={new Set()}
          compareType={null}
          maxCompareReached={false}
          onToggleTransitionRow={() => {}}
        />
      </MemoryRouter>
    )
  }

  it('the fixture has a 3DES transition row', () => {
    expect(target).toBeDefined()
  })

  it('a ?highlight link opens the phone list on the tinted, scroll-tagged card', async () => {
    renderAt(true)
    expect(await screen.findByText('← Back to wizard')).toBeInTheDocument()
    const card = document.querySelector(
      `div[data-deeplink-id="${CSS.escape(transitionRowId(target!))}"]`
    )
    expect(card).not.toBeNull()
    expect(card!.className).toContain('ring-primary/30')
  })

  it('a role-default highlight keeps the wizard', async () => {
    renderAt(false)
    expect(await screen.findByText(/Show full table/)).toBeInTheDocument()
    expect(screen.queryByText('← Back to wizard')).toBeNull()
  })

  const card = (row: (typeof algorithmsData)[number]) =>
    document.querySelector(`div[data-deeplink-id="${CSS.escape(transitionRowId(row))}"]`)
  const des = algorithmsData.find((r) => r.classical === 'DES' && r.function === 'Symmetric')

  it('?highlight=3DES no longer tints the DES card (token-boundary rule)', async () => {
    expect(des).toBeDefined()
    renderAt(true)
    await screen.findByText('← Back to wizard')
    expect(card(target!)!.className).toContain('ring-primary/30')
    expect(card(des!)!.className).not.toContain('ring-primary/30')
  })

  it('a ?transition link opens the phone list and tints exactly that row', async () => {
    renderAt(true, { highlightAlgorithms: new Set(), selectedRowId: transitionRowId(des!) })
    expect(await screen.findByText('← Back to wizard')).toBeInTheDocument()
    expect(card(des!)!.className).toContain('ring-primary/30')
    expect(card(target!)!.className).not.toContain('ring-primary/30')
  })
})
