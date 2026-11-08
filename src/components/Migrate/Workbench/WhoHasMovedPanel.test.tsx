// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { SoftwareItem } from '@/types/MigrateTypes'

const rows = vi.hoisted(() => ({ software: [] as SoftwareItem[] }))

vi.mock('@/data/migrateData', () => ({
  get softwareData() {
    return rows.software
  },
}))

import { WhoHasMovedPanel } from './WhoHasMovedPanel'

const row = (
  productId: string,
  pqcStatusCanonical: string,
  extra: Partial<SoftwareItem> = {}
): SoftwareItem =>
  ({
    productId,
    softwareName: `Product ${productId}`,
    categoryName: 'Networking',
    pqcStatusCanonical,
    verificationStatus: 'Verified',
    proofUrl: 'https://example.com/proof',
    proofPublicationDate: '2026-10-01',
    ...extra,
  }) as SoftwareItem

const panelText = () => {
  const { container } = render(
    <MemoryRouter>
      <WhoHasMovedPanel />
    </MemoryRouter>
  )
  return container.textContent ?? ''
}

describe('WhoHasMovedPanel', () => {
  it('does not count a pre-shared-key-only product as having moved, even with reviewed evidence', () => {
    rows.software = [
      row('a', 'available'),
      row('b', 'psk'),
      row('c', 'psk'),
      row('d', 'partial'),
      row('e', 'roadmap'),
      row('f', 'none'),
      row('g', 'unknown'),
    ]
    const text = panelText()
    expect(text).toMatch(
      /Of the 7 products we track, 1 are recorded as having post-quantum support/
    )
    expect(text).not.toMatch(/Product b|Product c/)
  })

  it('names the pre-shared-key-only products separately and leaves them out of "not yet determined"', () => {
    rows.software = [
      row('a', 'available'),
      row('b', 'psk'),
      row('c', 'psk'),
      row('d', 'partial'),
      row('e', 'roadmap'),
      row('f', 'none'),
      row('g', 'unknown'),
    ]
    const text = panelText()
    expect(text).toMatch(/1 more have partial support, 2 rely on a pre-shared key \(PSK\) only/)
    expect(text).toMatch(/1 are planned or on a roadmap, and 1 are not yet determined/)
  })

  it('leaves the sentence unchanged when no product is in that status', () => {
    rows.software = [row('a', 'available'), row('d', 'partial'), row('g', 'unknown')]
    const text = panelText()
    expect(text).toMatch(/1 more have partial support, 0 are planned or on a roadmap/)
    expect(text).not.toMatch(/PSK|pre-shared/)
  })
})
