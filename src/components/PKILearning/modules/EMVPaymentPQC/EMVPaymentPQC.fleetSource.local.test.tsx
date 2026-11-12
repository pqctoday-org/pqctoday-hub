// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EMVPaymentIntroduction } from './components/EMVPaymentIntroduction'
import { EMV_CARD_POPULATION } from './data/emvCardPopulation'
import { MIGRATION_VECTORS } from './data/migrationRiskData'
import { CARD_AUTH_SPECS, PROVISIONING_STEPS } from './data/cardCryptoData'
import { KEY_INJECTION_CEREMONY } from './data/posCryptoData'
import { content } from './content'
import rag from './rag-summary.md?raw'
import curious from './curious-summary.md?raw'
import { JOSE_SIGNING_ALGORITHMS } from '../APISecurityJWT/constants'

describe('dated fleet context and distinct payment key roles', () => {
  it('renders the official current population source without counting all cards as RSA-dependent', () => {
    render(
      <MemoryRouter>
        <EMVPaymentIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    const source = screen.getByRole('link', { name: '15 July 2026 newsletter' })
    expect(source).toHaveAttribute(
      'href',
      'https://www.emvco.com/news-publications/emvco-newsletter-q2-2026/'
    )
    expect(source.parentElement).toHaveTextContent('over 15.6 billion')
    expect(source.parentElement).toHaveTextContent('end of 2025')
    expect(source.parentElement).toHaveTextContent(
      'not a count of cards using RSA-2048 or offline authentication'
    )
    expect(source.parentElement).not.toHaveTextContent(/largest deployed PKI|14\.7/)
  })
  it('keeps the same dated denominator and source across the learner prose aliases', () => {
    expect(EMV_CARD_POPULATION.published).toBe('2026-07-15')
    for (const text of [content.narratives.overview, rag, curious]) {
      expect(text).toMatch(/over 15\.6 billion/)
      expect(text).toMatch(/2025/)
      expect(text).toMatch(/15 July 2026/)
      expect(text).not.toMatch(/14\.7 billion|world.s largest deployed PKI/)
    }
    const context = MIGRATION_VECTORS.find((v) => v.affectedScale.includes('15.6'))!
    expect(context.affectedScale).toMatch(/RSA\/offline subset not counted/)
    expect(context.vulnerability).toMatch(
      /does not count the RSA-dependent or offline-authentication subset/
    )
    expect(content.lastReviewed).toBe('2026-08-24') // A source edit is not a whole-module review.
  })
  it('preserves the issuer/static-data distinction from ICC dynamic signatures and the BDK custody boundary', () => {
    const sda = CARD_AUTH_SPECS.find((x) => x.id === 'sda')!,
      dda = CARD_AUTH_SPECS.find((x) => x.id === 'dda')!
    expect(sda.howItWorks.join(' ')).toMatch(/Issuer public key then verifies the static signature/)
    expect(dda.howItWorks.join(' ')).toMatch(/ICC public key/)
    const injection = PROVISIONING_STEPS.find((x) => x.phase === 'key-injection')!
    expect(injection).toBeDefined()
    expect(injection.description).toMatch(/ICC public key certificate is created/)
    expect(JSON.stringify(KEY_INJECTION_CEREMONY)).toMatch(/derived initial key/)
    expect(JSON.stringify(KEY_INJECTION_CEREMONY)).toMatch(/BDK stays inside the authorised HSM/)
  })
  it('rounds only the existing raw signature byte ratio to about52, without treating it as a token ratio', () => {
    const ml = JOSE_SIGNING_ALGORITHMS.find((x) => x.jose === 'ML-DSA-65')!,
      ec = JOSE_SIGNING_ALGORITHMS.find((x) => x.jose === 'ES256')!
    expect(ml.sigBytes).toBe(3309)
    expect(ec.sigBytes).toBe(64)
    if (ml.sigBytes === undefined || ec.sigBytes === undefined)
      throw new Error('Signature sizes missing from the source algorithm rows')
    expect(Math.round(ml.sigBytes / ec.sigBytes)).toBe(52)
  })
})
