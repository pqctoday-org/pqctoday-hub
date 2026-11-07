// SPDX-License-Identifier: AGPL-3.0-only
//
// What the About page and the FAQ say about the quantum threat, the licence, the browser
// cryptography and the status of FIPS 206 must match the sources they rest on:
//  - NIST's post-quantum project page: large-scale quantum computers "will be able to break
//    many of the public-key cryptosystems currently in use"; when one will exist is uncertain.
//  - GNU AGPL-3.0: section 2 (running or modifying without conveying carries no conditions),
//    section 5 (conveyed modified versions stay under the licence) and section 13 (users who
//    interact with a modified version over a network can ask for its source).
//  - The site's cryptography runs in the browser through WebAssembly, the Web Crypto API and
//    JavaScript libraries (see the Software Bill of Materials).
//  - NIST's standardization page lists FIPS 206 (FN-DSA) as in development.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { VisionSection } from './sections/VisionSection'
import { LicenseSection } from './sections/LicenseSection'
import { DataPrivacySection } from './sections/DataPrivacySection'
import { buildDataFoundation, type DataFoundationKey } from './aboutData'
import { FAQ_DATA, FIPS_206_STATUS } from '@/components/FAQ/faqData'
import { SBOM_GROUPS } from '@/data/sbomComponents'

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const text = (node: HTMLElement) => (node.textContent ?? '').replace(/\s+/g, ' ')

describe('quantum-exposure introduction', () => {
  it('names vulnerable public-key algorithms and a sufficiently capable quantum computer', () => {
    const { container } = render(
      <MemoryRouter>
        <VisionSection />
      </MemoryRouter>
    )
    const t = text(container)
    expect(t).toMatch(/RSA and elliptic-curve algorithms/)
    expect(t).toMatch(/RSA and ECDSA signatures/)
    expect(t).toMatch(/sufficiently capable quantum computer/)
  })

  it('does not say every digital signature is broken, or that the timing is certain', () => {
    const { container } = render(
      <MemoryRouter>
        <VisionSection />
      </MemoryRouter>
    )
    const t = text(container)
    expect(t).not.toMatch(/every digital signature/i)
    expect(t).not.toMatch(/will be broken by quantum computers/i)
    expect(t).not.toMatch(/The question is not whether/i)
    expect(t).toMatch(/uncertain/i)
  })
})

describe('open source licence summary', () => {
  it('limits the source obligation to conveyed copies and networked modified versions', () => {
    const { container } = render(
      <MemoryRouter>
        <LicenseSection />
      </MemoryRouter>
    )
    const t = text(container)
    // In scope: giving copies to others, and offering a modified version to users over a network.
    expect(t).toMatch(/give copies to others/i)
    expect(t).toMatch(/over a network/i)
    expect(t).toMatch(/source of your version/i)
    // Out of scope: private changes.
    expect(t).toMatch(/Changes you keep private are not covered/i)
    // The old summary required every modification to be released.
    expect(t).not.toMatch(/any modifications are also released/i)
    expect(t).toMatch(/full license text governs/i)
  })

  it('keeps the link to the full licence text', () => {
    render(
      <MemoryRouter>
        <LicenseSection />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /View Full License/i })).toBeInTheDocument()
  })
})

describe('browser cryptography statement', () => {
  it('names WebAssembly, the Web Crypto API and JavaScript libraries, and keeps the education caveat', () => {
    const { container } = render(
      <MemoryRouter>
        <DataPrivacySection />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /Data Privacy/i }))
    const t = text(container)
    expect(t).toMatch(/WebAssembly/)
    expect(t).toMatch(/Web Crypto API/)
    expect(t).toMatch(/JavaScript libraries/)
    expect(t).toMatch(/not certified cryptographic modules/)
    expect(t).not.toMatch(
      /all cryptographic operations run entirely in your browser via WebAssembly/i
    )
  })

  it('the Software Bill of Materials lists the Web Crypto API for more than two algorithms', () => {
    const native = SBOM_GROUPS.flatMap((g) => g.components).find(
      (c) => 'native' in c && c.native === true
    )
    expect(native).toBeDefined()
    expect(native!.name).toMatch(/AES/)
    expect(native!.name).toMatch(/SHA-2/)
    expect(native!.name).toMatch(/Ed25519/)
  })
})

describe('FIPS 206 status', () => {
  const records = Object.fromEntries(
    (
      [
        'timeline',
        'library',
        'algorithms',
        'compliance',
        'migrate',
        'threats',
        'leaders',
        'quiz',
        'sources',
        'modules',
        'patents',
      ] as DataFoundationKey[]
    ).map((k) => [k, 1])
  ) as Record<DataFoundationKey, number>

  it('the About data label calls FIPS 206 in development, not a draft', () => {
    const row = buildDataFoundation(records).find((r) => r.dataset === 'Algorithm Reference')
    expect(row).toBeDefined()
    expect(row!.sources).toMatch(/FIPS 206 in development/)
    expect(row!.sources).not.toMatch(/draft/i)
  })

  it('every FAQ answer that mentions FIPS 206 treats it as planned and unpublished', () => {
    const mentions = FAQ_DATA.flatMap((c) => c.items).filter((i) => /FIPS 206/.test(i.answer))
    expect(mentions.length).toBeGreaterThanOrEqual(3)
    for (const item of mentions) {
      expect(item.answer, item.question).toMatch(/planned|in development|not yet published/i)
      expect(item.answer, item.question).not.toMatch(
        /FIPS 206, pending|published draft of FIPS 206/i
      )
    }
  })

  it('the two FAQ answers about FN-DSA carry the same dated status record', () => {
    const items = FAQ_DATA.flatMap((c) => c.items).filter((i) => i.answer.includes(FIPS_206_STATUS))
    expect(items.length).toBe(2)
    expect(FIPS_206_STATUS).toMatch(/27 October 2026/)
    expect(FIPS_206_STATUS).toMatch(/planned, not published/)
  })
})
