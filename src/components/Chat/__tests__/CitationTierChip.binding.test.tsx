// SPDX-License-Identifier: GPL-3.0-only
/**
 * Citation tier chip binding test (C7).
 *
 * Pins: the rendered chip's accessible label reflects exactly the tier
 * computed by the trust engine for the cited chunk. No drift between data
 * and UI.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CitationTierChip } from '@/components/ui/CitationTierChip'
import { chunkToResource } from '@/services/search/chunkToResource'
import { getTrustScore } from '@/data/trustScore'
import type { TrustTier } from '@/data/trustScore'
import { makeChunk, makeLibraryChunk } from '@/test/fixtures/trustChunks'

describe('C7 — CitationTierChip rendering', () => {
  it('renders nothing when tier is undefined', () => {
    const { container } = render(<CitationTierChip tier={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  const tiers: TrustTier[] = ['Authoritative', 'High', 'Moderate', 'Low']
  for (const tier of tiers) {
    it(`renders ${tier} with the correct aria-label`, () => {
      render(<CitationTierChip tier={tier} />)
      const chip = screen.getByLabelText(`Trust tier: ${tier}`)
      expect(chip).toBeTruthy()
      // First letter glyph
      expect(chip.textContent).toBe(tier[0])
    })
  }
})

describe('C7 — chip binding mirrors the trust engine', () => {
  function tierForChunk(chunk: ReturnType<typeof makeChunk>): TrustTier | undefined {
    const ref = chunkToResource(chunk)
    if (!ref) return undefined
    return getTrustScore(ref.resourceType, ref.resourceId)?.tier
  }

  it('unscored chunk → no chip rendered (parity with useChatSend behavior)', () => {
    const chunk = makeChunk({ source: 'glossary', title: 'Lattice' })
    const tier = tierForChunk(chunk)
    expect(tier).toBeUndefined()
    const { container } = render(<CitationTierChip tier={tier} />)
    expect(container.firstChild).toBeNull()
  })

  it('library chunk with unknown referenceId → no chip', () => {
    const chunk = makeLibraryChunk('zzz-not-a-real-ref-123')
    const tier = tierForChunk(chunk)
    expect(tier).toBeUndefined()
  })

  it('rendered chip aria-label matches the tier resolved by the engine, when tier is defined', () => {
    // We don't depend on a specific corpus row's tier (which can drift); we
    // assert the *binding contract*: whatever the engine returns is what the
    // UI shows. Probe a real referenceId from libraryData and assert parity.
    const chunk = makeLibraryChunk('FIPS_203')
    const tier = tierForChunk(chunk)
    if (!tier) {
      // If FIPS_203 isn't scored in the current dataset, the binding contract
      // says: render no chip. That's still a valid pass for C7.
      const { container } = render(<CitationTierChip tier={tier} />)
      expect(container.firstChild).toBeNull()
      return
    }
    render(<CitationTierChip tier={tier} />)
    expect(screen.getByLabelText(`Trust tier: ${tier}`)).toBeTruthy()
  })
})
