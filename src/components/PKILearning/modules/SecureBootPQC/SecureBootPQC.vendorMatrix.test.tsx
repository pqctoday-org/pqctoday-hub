// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Firmware vendor matrix and the Firmware Signing Migrator notes.
 *
 * Every vendor row keeps only what its linked, dated public source states: a row without a
 * source URL and a date is a test failure. The wording that was removed (invented milliseconds,
 * unsourced vendor commitments, a typical NVRAM size) must not come back.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import {
  FIRMWARE_VENDORS,
  VENDOR_MATRIX_CHECKED_ON,
  VENDOR_STATUS_LABELS,
  formatVendorDate,
} from './data/secureBootProviderData'
import { FirmwareVendorMatrix } from './workshop/FirmwareVendorMatrix'
import { FirmwareSigningMigrator } from './workshop/FirmwareSigningMigrator'
import { SecureBootChainAnalyzer } from './workshop/SecureBootChainAnalyzer'
import { SecureBootIntroduction } from './components/SecureBootIntroduction'
import curiousSummary from './curious-summary.md?raw'

const flat = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/

const REMOVED_CLAIMS = [
  'Phoenix',
  'Lenovo',
  'ThinkShield',
  'Granite Rapids',
  'Emerald Rapids',
  '5.35',
  'BIOS Signing Upgrade Kit',
  'H1 2026',
  'stable-202502',
  'OpenEdition',
  'Merged / GA',
  'SUU',
  'FIPS 140-2',
  'CC EAL2',
  'efi-updatevar',
]

describe('Firmware vendor matrix data', () => {
  it('lists exactly the six vendors that have a public source', () => {
    expect(FIRMWARE_VENDORS.map((v) => v.id)).toEqual([
      'ami',
      'insyde',
      'tianocore',
      'dell',
      'hpe',
      'intel',
    ])
  })

  it('gives every row a source URL and a date', () => {
    for (const vendor of FIRMWARE_VENDORS) {
      expect(vendor.sources.length, `${vendor.id} has no source`).toBeGreaterThan(0)
      for (const source of vendor.sources) {
        expect(source.url, `${vendor.id} source url`).toMatch(/^https:\/\/[^\s]+$/)
        expect(source.label.length, `${vendor.id} source label`).toBeGreaterThan(0)
        if (source.date !== undefined) {
          expect(source.date, `${vendor.id} source date`).toMatch(ISO_DATE)
        }
      }
      expect(vendor.statementDate, `${vendor.id} statementDate`).toMatch(ISO_DATE)
      // The row's date is the date of one of its own sources.
      const dated = vendor.sources.filter((s) => s.date).map((s) => s.date)
      expect(dated, `${vendor.id} has no dated source`).toContain(vendor.statementDate)
    }
  })

  it('names an AMI, Insyde, Dell, HPE and Intel statement only as far as the source goes', () => {
    const byId = Object.fromEntries(FIRMWARE_VENDORS.map((v) => [v.id, v]))
    expect(byId.ami.notes).toContain('names no algorithm, version, platform or availability date')
    expect(byId.ami.pqcAlgorithm).toBe('Not stated in the announcement')
    expect(byId.insyde.statementDate).toBe('2026-06-03')
    expect(byId.dell.sources.map((s) => s.url)).toContain(
      'https://www.dell.com/en-us/blog/post-quantum-ready-or-not-why-your-next-pc-refresh-is-a-cryptography-decision'
    )
    expect(byId.dell.sources.find((s) => s.url.includes('/blog/'))?.date).toBe('2026-10-08')
    expect(byId.hpe.notes).toContain(
      'The certification is not obtained yet but we are intending to.'
    )
    expect(byId.intel.statementDate).toBe('2024-07')
  })

  it('shows TianoCore as in progress, with the ML-DSA authenticated-variable change not merged', () => {
    const tiano = FIRMWARE_VENDORS.find((v) => v.id === 'tianocore')
    expect(tiano?.pqcStatus).toBe('in-progress')
    expect(VENDOR_STATUS_LABELS['in-progress'].label).toBe('In progress')
    expect(tiano?.notes).toContain('ML-DSA-87')
    expect(tiano?.notes).toContain('edk2 PR #13365')
    expect(tiano?.notes).toContain('closed without merging on 29 October 2026')
    expect(tiano?.notes).toContain('PR #13411')
    expect(tiano?.sources.map((s) => s.url)).toContain(
      'https://github.com/tianocore/edk2/pull/13365'
    )
    expect(tiano?.sources.map((s) => s.url)).toContain(
      'https://github.com/tianocore/edk2/pull/13411'
    )
    expect(Object.keys(VENDOR_STATUS_LABELS)).not.toContain('merged')
  })

  it('does not bring back any removed vendor claim', () => {
    const text = JSON.stringify(FIRMWARE_VENDORS)
    for (const claim of REMOVED_CLAIMS) {
      expect(text, claim).not.toContain(claim)
    }
  })

  it('formats dates for display', () => {
    expect(formatVendorDate('2025-11-12')).toBe('12 Nov 2025')
    expect(formatVendorDate('2024-07')).toBe('Jul 2024')
  })
})

describe('Firmware Vendor Matrix workshop', () => {
  it('counts six vendors, prints the check date and links each source', () => {
    render(
      <MemoryRouter>
        <FirmwareVendorMatrix />
      </MemoryRouter>
    )
    expect(screen.getByText('6 of 6 vendors')).toBeInTheDocument()
    expect(VENDOR_MATRIX_CHECKED_ON).toBe('24 October 2026')
    expect(screen.getByText(/Checked on 24 October 2026\./)).toBeInTheDocument()
    expect(screen.queryByText(/Phoenix|Lenovo/)).not.toBeInTheDocument()
    expect(screen.queryByText('Merged / GA')).not.toBeInTheDocument()

    const tiano = screen.getByRole('button', { name: /EDK2 \(EFI Development Kit II\)/ })
    expect(within(tiano).getByText('In progress')).toBeInTheDocument()
    fireEvent.click(tiano)
    const link = screen.getByRole('link', {
      name: /edk2 pull request 13365 \(closed, not merged\)/,
    })
    expect(link).toHaveAttribute('href', 'https://github.com/tianocore/edk2/pull/13365')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })
})

describe('ML-DSA-65 box: no invented timings', () => {
  it('gives sizes only, with no milliseconds and no "faster than RSA verify" note', () => {
    render(
      <MemoryRouter>
        <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    fireEvent.click(
      screen.getByRole('button', { name: /ML-DSA-65 for Firmware Signature Migration/ })
    )
    for (const title of ['RSA-2048 (Current)', 'ML-DSA-65 (Target)']) {
      const box = screen.getByText(title).parentElement as HTMLElement // eslint-disable-line testing-library/no-node-access -- the list sits beside its title
      const text = flat(box.textContent ?? '')
      expect(text).toContain('Public key:')
      expect(text).toContain('Signature:')
      expect(text).not.toMatch(/Signing speed|Verification:/)
      expect(text).not.toMatch(/\d\s?ms\b/)
      expect(text).not.toMatch(/faster than RSA/i)
    }
  })

  it('states the variable-store size as platform-specific, without a typical figure', () => {
    render(
      <MemoryRouter>
        <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    fireEvent.click(
      screen.getByRole('button', { name: /ML-DSA-65 for Firmware Signature Migration/ })
    )
    const text = flat(document.body.textContent ?? '')
    expect(text).toContain(
      'Secure Boot variable storage is platform-specific; firmware reports it through QueryVariableInfo() (UEFI 2.11 section 8.2.4).'
    )
    expect(text).not.toMatch(/32\s?[–-]\s?64 KB/)
  })
})

describe('Secure Boot Chain Analyzer and summary: platform-specific variable storage', () => {
  it('has the same statement and no 32-64 KB figure', () => {
    render(
      <MemoryRouter>
        <SecureBootChainAnalyzer />
      </MemoryRouter>
    )
    // The storage note appears once the analysis has run.
    fireEvent.click(screen.getByRole('button', { name: /Analyze PQC Requirements/ }))
    const text = flat(document.body.textContent ?? '')
    expect(text).toContain(
      'Secure Boot variable storage is platform-specific; firmware reports it through QueryVariableInfo() (UEFI 2.11 section 8.2.4).'
    )
    expect(text).not.toMatch(/32\s?[–-]\s?64 KB/)
  })

  it('curious summary carries the same statement', () => {
    const text = flat(curiousSummary)
    expect(text).toContain('QueryVariableInfo() (UEFI 2.11 section 8.2.4)')
    expect(text).not.toMatch(/32\s?[–-]\s?64 KB/)
    expect(text).not.toMatch(/targeting 2026-2027/)
  })
})

describe('Firmware Signing Migrator notes', () => {
  const pageTextAtStep = (initialStep: number) => {
    render(
      <MemoryRouter>
        <FirmwareSigningMigrator initialStep={initialStep} />
      </MemoryRouter>
    )
    return flat(document.body.textContent ?? '')
  }

  it('SLH-DSA list item says it is not part of CNSA and not approved for any use in NSS', () => {
    const text = pageTextAtStep(0)
    expect(text).toContain(
      'not per-image signing. Not part of CNSA and not approved for any use in NSS (NSA CNSA 2.0 FAQ v2.2, p. 11)'
    )
  })

  it('key-size callout and signature note use the platform-specific statement', () => {
    const keys = pageTextAtStep(1)
    expect(keys).toContain(
      'Secure Boot variable storage is platform-specific; firmware reports it through QueryVariableInfo() (UEFI 2.11 section 8.2.4), so check your platform before planning.'
    )
    expect(keys).not.toMatch(/64\s?[–-]\s?128 KB/)
  })

  it('signing step no longer calls a db entry a .p7s envelope or ML-DSA signatures "acceptable"', () => {
    const sign = pageTextAtStep(2)
    expect(sign).toContain(
      'Secure Boot variable storage is platform-specific; firmware reports it through QueryVariableInfo() (UEFI 2.11 section 8.2.4), so check your platform before planning. OTA firmware update packages carry the signature in their manifest.'
    )
    expect(sign).toContain(
      'What db holds is the certificate: a minimal self-signed ML-DSA-65 certificate is about 5.5 KB against about 0.8 KB for RSA-2048 (measured with OpenSSL 3.6.3; real certificates are larger).'
    )
    expect(sign).not.toMatch(/stores a full \.p7s envelope/)
    expect(sign).not.toMatch(/acceptable for UEFI db/)
    expect(sign).not.toMatch(/64\s?[–-]\s?128 KB/)
  })

  it('puts the owner-approved lab-recipe note above Step A, linked to the UEFI 2.11 Library record', () => {
    const text = pageTextAtStep(3)
    const NOTE =
      "Lab recipe only. UEFI 2.11 never mentions ML-DSA or SLH-DSA; its required signature algorithms are SHA-256 and RSA (section 2.6.5), and the UEFI Forum's April 2026 white paper describes post-quantum changes as proposed, not yet approved. A certificate with a PQC key can be written to db, but nothing here shows a firmware verifier will accept it. Ask your firmware vendor before enrolling."
    expect(text).toContain(NOTE)
    const stepA = text.indexOf('Step A — Import PQC public key')
    expect(text.indexOf(NOTE)).toBeGreaterThan(-1)
    expect(text.indexOf(NOTE)).toBeLessThan(stepA)
    const link = screen
      .getAllByRole('link', { name: 'UEFI 2.11' })
      .find((a) => a.getAttribute('href') === '/library?ref=UEFI-SPEC-2.10-SecureBoot')
    expect(link).toBeDefined()
  })
})
