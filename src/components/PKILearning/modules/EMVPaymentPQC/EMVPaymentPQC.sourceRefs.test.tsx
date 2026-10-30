// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Sources cited by the sector-body list and the card-side findings must resolve in the
 * standards registry, and the dated markers must carry the scope of their source.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { hasStandard } from '@/data/standardsRegistry'
import { content } from './content'
import { SECTOR_BODIES } from './data/bankingData'
import { CARD_CHIP_FINDINGS } from './data/cardCryptoData'
import { CardProvisioningVisualizer } from './workshop/CardProvisioningVisualizer'
import { MigrationRiskMatrix } from './workshop/MigrationRiskMatrix'
import { EMVPaymentIntroduction } from './components/EMVPaymentIntroduction'

describe('EMV module sources', () => {
  it('every sector body and card-side finding points at a library row', () => {
    for (const ref of [
      ...SECTOR_BODIES.map((b) => b.libraryRef),
      ...CARD_CHIP_FINDINGS.map((f) => f.libraryRef),
    ]) {
      expect(hasStandard(ref), ref).toBe(true)
    }
  })

  it('declares the hybrid TLS RFC among its standards', () => {
    expect(content.standards.map((s) => s.id)).toContain('RFC-10024')
  })

  it('presents the Nacha roadmap as a recommendation, not a mandate', () => {
    const nacha = SECTOR_BODIES.find((b) => b.id === 'nacha-roadmap')
    expect(nacha?.contribution).toMatch(/recommend/i)
    expect(nacha?.contribution).toMatch(/not a mandate/i)
  })
})

describe('EMV workshop source statements', () => {
  it('card provisioning reports the IDEMIA prototype with its toy-profile caveat', () => {
    render(
      <MemoryRouter>
        <CardProvisioningVisualizer />
      </MemoryRouter>
    )
    expect(screen.getByText('What has been measured on real cards')).toBeInTheDocument()
    expect(screen.getByText(/basic “toy” application profile/)).toBeInTheDocument()
  })

  it('migration timeline labels the 2030 and 2035 markers as RSA/ECC dates with their scope', () => {
    render(
      <MemoryRouter>
        <MigrationRiskMatrix />
      </MemoryRouter>
    )
    expect(screen.getByText('RSA/ECC deprecated after 2030')).toBeInTheDocument()
    expect(screen.getByText('RSA/ECC disallowed after 2035')).toBeInTheDocument()
    expect(screen.getByText(/not a payments-sector mandate/)).toBeInTheDocument()
  })
})

describe('EMV introduction source statements', () => {
  const sectionText = (id: string) => {
    const { container, unmount } = render(
      <MemoryRouter initialEntries={[`/learn/emv-payment-pqc?section=${id}`]}>
        <EMVPaymentIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    const text = container.textContent ?? ''
    unmount()
    return text
  }

  it('states the hybrid TLS update, the 3DS and device standards, and the sector bodies', () => {
    expect(sectionText('banking-key-management')).toContain(
      'RFC 10024 (IETF Standards Track, August 2026)'
    )
    expect(sectionText('ecommerce')).toContain('separate PCI 3DS Core standard')
    expect(sectionText('pos-terminals')).toContain('What certifies the device')
    const regulation = sectionText('sector-regulation')
    expect(regulation).toContain('Nacha Quantum-Safe Payments Readiness Road Map')
    expect(regulation).toContain('nine bodies below publish across six jurisdictions')
  })

  it('labels the card cycle as an estimate and keeps the HSM cut-off out of PQ dates', () => {
    const landscape = sectionText('migration-landscape')
    expect(landscape).toContain('not a sourced figure')
    expect(landscape).toContain('not post-quantum deadlines')
    expect(landscape).not.toContain('Leading candidate')
  })
})
