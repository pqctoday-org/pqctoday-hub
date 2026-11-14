// SPDX-License-Identifier: AGPL-3.0-only
/** NAV-5 / UX-5 (4.208): the phone list honours ?sort= / ?dir= like desktop,
 *  and a link to a sector with no published threat says so. */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { knownThreatIndustries, threatsData } from '@/data/threatsData'
import { compareThreats } from '@/components/Threats/threatSort'
import { MobileThreatsView } from './MobileThreatsView'
import { getTrustScore } from '@/data/trustScore'

const renderView = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MobileThreatsView />
    </MemoryRouter>
  )
const cardIds = () =>
  [...document.querySelectorAll('article[data-deeplink-id]')].map((el) =>
    el.getAttribute('data-deeplink-id')
  )

describe('MobileThreatsView ordering and sector notices', () => {
  it('orders cards by ?sort=threatId&dir=desc, the same order desktop uses', () => {
    renderView('/threats?sort=threatId&dir=desc')
    const expected = [...threatsData]
      .sort((a, b) => compareThreats(a, b, 'threatId', 'desc'))
      .slice(0, 12)
      .map((t) => t.threatId)
    expect(cardIds()).toEqual(expected)
  })

  const awaiting = [...knownThreatIndustries].filter(
    (ind) => !threatsData.some((t) => t.industry === ind)
  )
  it.runIf(awaiting.length > 0)('says when a linked sector has no published threat yet', () => {
    renderView(`/threats?industry=${encodeURIComponent(awaiting[0])}`)
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(
      `No published threats for ${awaiting[0]} yet`
    )
  })

  const notAuthoritative = threatsData.find(
    (t) => getTrustScore('threats', t.threatId)?.tier !== 'Authoritative'
  )
  it.runIf(!!notAuthoritative)(
    'a ?tier= link that hides the linked threat is widened, and listed',
    () => {
      renderView(`/threats?id=${notAuthoritative!.threatId}&tier=Authoritative`)
      expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(/trust-tier/)
    }
  )

  it('lists a link\'s trust tier in the "From your link" strip', () => {
    renderView('/threats?tier=Authoritative')
    expect(screen.getByText(/Trust tier: Authoritative/)).toBeInTheDocument()
  })
})
