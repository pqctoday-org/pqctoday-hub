// SPDX-License-Identifier: AGPL-3.0-only
//
// The construction lens (2026-11-13): K11 (every count shown equals an
// independent count from the rows), K12 (?construction= deep links), K13
// (no construction chip shows zero; every listed use case names it). Real
// data, not fixtures, like the other landscape view tests.

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { CRYPTO_CONSTRUCTIONS } from '@/data/cryptoConstructions'
import { constructionUsage, constructionsInIndustry } from '@/data/constructionUsage'
import { looksLikeSlug, proofRefLabel } from '@/data/constructionRefLabels'
import { ConstructionCard, NO_ALGORITHM_TEXT } from './ConstructionLens'

const { useCases, standards } = loadIndustryLandscape()
const usage = constructionUsage(useCases, standards)

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/algorithms?tab=landscape${search}`]}>
      <IndustryLandscapeView />
    </MemoryRouter>
  )
}

/** Independent recount straight from the rows (K11). */
function recount(id: string) {
  const direct = useCases.filter(
    (u) => u.classicalConstructions.includes(id) || u.pqcConstructions.includes(id)
  )
  const std = standards.filter((s) => s.constructionsReferenced.includes(id))
  // Inside: a use case that does not name `id` but names a construction built on it,
  // following builtOn from the registry directly (not through constructionUsage).
  const builtOnClosure = (start: string): Set<string> => {
    const seen = new Set<string>()
    const stack = [...(CRYPTO_CONSTRUCTIONS.find((c) => c.id === start)?.builtOn ?? [])]
    while (stack.length) {
      const next = stack.pop()!
      if (seen.has(next)) continue
      seen.add(next)
      stack.push(...(CRYPTO_CONSTRUCTIONS.find((c) => c.id === next)?.builtOn ?? []))
    }
    return seen
  }
  const inside = useCases.filter((u) => {
    const named = [...u.classicalConstructions, ...u.pqcConstructions]
    return !named.includes(id) && named.some((n) => builtOnClosure(n).has(id))
  })
  return {
    direct: direct.length,
    standards: std.length,
    inside: inside.length,
    industries: new Set(direct.map((u) => u.industry)).size,
  }
}

describe('construction usage counts (K11)', () => {
  it('every construction’s counts match a recount from the rows', () => {
    for (const c of CRYPTO_CONSTRUCTIONS) {
      const u = usage.get(c.id)!
      const r = recount(c.id)
      expect(u.direct.length, c.id).toBe(r.direct)
      expect(u.standards.length, c.id).toBe(r.standards)
      expect(u.inside.length, c.id).toBe(r.inside)
      expect(u.industries.length, c.id).toBe(r.industries)
    }
  })

  it('every industry’s construction counts match a recount from the rows', () => {
    for (const ind of new Set(useCases.map((u) => u.industry)))
      for (const { id, count } of constructionsInIndustry(ind, usage)) {
        const n = useCases.filter(
          (u) =>
            u.industry === ind &&
            (u.classicalConstructions.includes(id) || u.pqcConstructions.includes(id))
        ).length
        expect(count, `${ind} / ${id}`).toBe(n)
      }
  })

  it('every use case listed under a construction names it (K13)', () => {
    for (const u of usage.values())
      for (const d of u.direct)
        expect(
          d.useCase.classicalConstructions.includes(u.id) ||
            d.useCase.pqcConstructions.includes(u.id),
          `${d.useCase.useCaseId} / ${u.id}`
        ).toBe(true)
  })

  it('no construction chip shows zero (K13)', () => {
    const zero = [...usage.values()]
      .filter((u) => u.direct.length + u.standards.length + u.inside.length === 0)
      .map((u) => u.id)
    expect(zero).toEqual([])
  })
})

describe('construction lens deep links (K12)', () => {
  it('?construction= with no id opens the lens with the transition map', () => {
    renderAt('&construction=')
    expect(screen.getByTestId('construction-chip-rows')).toBeInTheDocument()
    expect(screen.getByTestId('transition-map')).toBeInTheDocument()
  })

  it('?construction=HPKE shows its card, outlook, works-with strip and diagram', () => {
    renderAt('&construction=HPKE')
    const card = screen.getByTestId('construction-card-HPKE')
    expect(within(card).getByTestId('outlook-stays-both')).toBeInTheDocument()
    expect(within(card).getByTestId('construction-works-with')).toBeInTheDocument()
    expect(within(card).getByTestId('construction-diagram-HPKE')).toBeInTheDocument()
    expect(within(card).getByTestId('construction-usage-line')).toHaveTextContent(
      `Used in ${recount('HPKE').direct} use case`
    )
  })

  it('a replaced construction lists its successors with their context', () => {
    renderAt('&construction=ECIES')
    const succ = screen.getByTestId('construction-successors')
    expect(within(succ).getByTestId('construction-chip-HPKE')).toBeInTheDocument()
    expect(within(succ).getByTestId('construction-chip-PQ-SUCI-Profile')).toBeInTheDocument()
    expect(within(succ).getByTestId('status-research')).toBeInTheDocument()
  })

  it('an unknown construction id shows a not-found notice instead of a blank page', () => {
    renderAt('&construction=Not-A-Construction')
    expect(screen.getByText(/No construction matches "Not-A-Construction"/)).toBeInTheDocument()
    expect(screen.getByTestId('construction-chip-rows')).toBeInTheDocument()
  })

  it('an algorithm card lists the constructions built from it', () => {
    renderAt('&mechanism=ML-KEM')
    const inside = screen.getByTestId('lens-used-inside')
    expect(within(inside).getByTestId('construction-chip-Hybrid-KEM')).toBeInTheDocument()
  })
})

describe('construction lens — rendered counts and links (K11, K12)', () => {
  it('each chip shows the same number as a recount from the rows', () => {
    renderAt('&construction=')
    const rows = screen.getByTestId('construction-chip-rows')
    for (const c of CRYPTO_CONSTRUCTIONS) {
      const chip = within(rows).getByTestId(`construction-chip-${c.id}`)
      const r = recount(c.id)
      const total = r.direct + r.standards + r.inside
      expect(chip, c.id).toHaveTextContent(new RegExp(`${c.id}\\s*${total}$`))
    }
  })

  it('a lower-case id opens the same construction', () => {
    renderAt('&construction=hpke')
    expect(screen.getByTestId('construction-card-HPKE')).toBeInTheDocument()
  })

  it('?construction=&usecase= rings a use case the lens lists, or opens its industry', () => {
    const named = useCases.find(
      (u) => u.classicalConstructions.length > 0 || u.pqcConstructions.length > 0
    )
    expect(named, 'no use case names a construction').toBeDefined()
    const id = [...named!.classicalConstructions, ...named!.pqcConstructions][0]
    renderAt(`&construction=${id}&usecase=${named!.useCaseId}`)
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector(`[data-use-case="${named!.useCaseId}"]`)).not.toBeNull()
  })

  it('a successor our reading infers is worded differently from one a source states', () => {
    renderAt('&construction=ECIES')
    const succ = screen.getByTestId('construction-successors')
    expect(within(succ).getByText('Newer construction for the same job')).toBeInTheDocument()
    expect(within(succ).getByText('Replaced by')).toBeInTheDocument()
  })
})

describe('constructionUsage — inside another construction', () => {
  it('counts a use case under a building block it uses only through builtOn', () => {
    const base = useCases[0]
    const fake = {
      ...base,
      useCaseId: 'fake-hpke',
      classicalConstructions: ['HPKE'],
      pqcConstructions: [],
    }
    const u = constructionUsage([fake], [])
    expect(u.get('HPKE')!.direct.map((d) => d.side)).toEqual(['today'])
    expect(u.get('KDF')!.inside.map((i) => i.via)).toEqual(['HPKE'])
    expect(u.get('AEAD')!.inside).toHaveLength(1)
    expect(u.get('KDF')!.direct).toHaveLength(0)
  })

  it('a construction named in both columns is counted once, as both', () => {
    const base = useCases[0]
    const fake = {
      ...base,
      useCaseId: 'fake-both',
      classicalConstructions: ['HPKE'],
      pqcConstructions: ['HPKE'],
    }
    const u = constructionUsage([fake], [])
    expect(u.get('HPKE')!.direct.map((d) => d.side)).toEqual(['both'])
  })
})

describe('construction cards — source links and empty algorithm rows', () => {
  it('no card renders a raw Library slug as a source link', () => {
    const slugs: string[] = []
    for (const c of CRYPTO_CONSTRUCTIONS) {
      const { unmount } = render(
        <MemoryRouter>
          <ConstructionCard c={c} usage={usage.get(c.id)} onPick={() => {}} />
        </MemoryRouter>
      )
      for (const a of screen.queryAllByTestId('construction-proof-link')) {
        const text = a.textContent ?? ''
        if (looksLikeSlug(text)) slugs.push(`${c.id}: ${text}`)
        expect(a.getAttribute('href')).toMatch(/^\/library\?ref=/)
      }
      unmount()
    }
    expect(slugs).toEqual([])
  })

  it('short labels for the batch-2 documents', () => {
    expect(proofRefLabel('RFC-9591-The-Flexible-Round-Optimized-Schnorr-Threshold-FROS')).toBe(
      'RFC 9591'
    )
    expect(proofRefLabel('NIST-IR-8214C-NIST-First-Call-for-Multi-Party-Threshold-Sche')).toBe(
      'NIST IR 8214C'
    )
    expect(proofRefLabel('Post-Quantum-Noise-IACR-ePrint-2022-539')).toBe('IACR ePrint 2022/539')
    expect(proofRefLabel('Post-quantum-WireGuard-IACR-ePrint-2020-379')).toBe(
      'IACR ePrint 2020/379'
    )
    expect(proofRefLabel('NIST-SP-800-56C-R2')).toBe('NIST SP 800-56C Rev. 2')
    expect(proofRefLabel('RFC 9180')).toBe('RFC 9180')
  })

  it('a row with no algorithm says so neutrally, never "symmetric key only"', () => {
    for (const id of ['WireGuard-Noise', 'Secret-Sharing']) {
      const c = CRYPTO_CONSTRUCTIONS.find((x) => x.id === id)!
      const { container, unmount } = render(
        <MemoryRouter>
          <ConstructionCard c={c} usage={usage.get(c.id)} onPick={() => {}} />
        </MemoryRouter>
      )
      expect(container.textContent).not.toMatch(/symmetric key only/i)
      expect(container.textContent).toContain(NO_ALGORITHM_TEXT)
      unmount()
    }
  })

  it('the post-quantum WireGuard paper is shown as research', () => {
    const c = CRYPTO_CONSTRUCTIONS.find((x) => x.id === 'WireGuard-Noise')!
    for (const inst of c.classical ?? [])
      if (inst.proofRefs.includes('Post-quantum-WireGuard-IACR-ePrint-2020-379'))
        expect(inst.status).toBe('research')
  })
})
