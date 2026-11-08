// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PACKAGE_FORMATS } from '../data/osConstants'
import { Button } from '@/components/ui/button'

vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: () => null,
}))

// Replace the portal dropdown with plain buttons so a test can pick a format.
vi.mock('@/components/common/FilterDropdown', () => ({
  FilterDropdown: ({
    items,
    onSelect,
  }: {
    items: Array<{ id: string; label: string }>
    onSelect: (id: string) => void
  }) => (
    <div>
      {items.map((i) => (
        <Button key={i.id} onClick={() => onSelect(i.id)}>
          {`pick ${i.id}`}
        </Button>
      ))}
    </div>
  ),
}))

import { PackageSigningMigrator } from './PackageSigningMigrator'

function pageText(): string {
  return document.body.textContent ?? ''
}

function showPqc() {
  fireEvent.click(screen.getByRole('button', { name: 'PQC Migration' }))
}

function openStep(title: string) {
  const el = screen.getByText(title)
  fireEvent.click(el.closest('button') as HTMLButtonElement)
}

describe('PackageSigningMigrator RPM post-quantum path', () => {
  it('describes the RPM 6 / OpenPGP v6 signature Red Hat already ships, beside the RSA signature', () => {
    render(<PackageSigningMigrator />)
    showPqc()
    openStep('Add the signature without removing the RSA one')
    const text = pageText()
    expect(text).toMatch(/OpenPGP v6/)
    expect(text).toMatch(/rpmsign --addsign --rpmv6/)
    expect(text).toMatch(/RPM 6/)
    expect(text).toMatch(/next to the RSA one/)
    expect(text).toMatch(/technology preview/i)
    // old approach presented as the RPM path
    expect(text).not.toMatch(/libgcrypt PQC patch/)
    expect(text).not.toMatch(/createrepo_c --pqc-key/)
  })

  it('keeps the detached signature only as a lab with its own trust and verifier limits', () => {
    render(<PackageSigningMigrator />)
    showPqc()
    // the lab step is the fifth step and states that no package manager checks it
    const labStep = screen.getByText('Lab only: detached ML-DSA-65 signature')
    fireEvent.click(labStep.closest('button') as HTMLButtonElement)
    const text = pageText()
    expect(text).toMatch(/No package manager checks this/)
    expect(text).toMatch(/channel independent of the download/)
    expect(text).toMatch(/not by rpm or dnf/)
    // the old text claimed a future dnf plugin verified it
    expect(text).not.toMatch(/DNF PQC verification plugin/)
  })

  it('lists compatibility entries that state what older RPM versions verify', () => {
    render(<PackageSigningMigrator />)
    const text = pageText()
    expect(text).toMatch(/RPM 6\.0\.0 and later/)
    expect(text).toMatch(/Verifies only the classical RSA signature/)
    expect(text).not.toMatch(/PQC metadata planned for 2\.x/)
  })
})

describe('PackageSigningMigrator DEB post-quantum path', () => {
  it('does not present DEP-18 or an Ubuntu release as a post-quantum signing plan', () => {
    render(<PackageSigningMigrator />)
    fireEvent.click(screen.getByRole('button', { name: 'pick deb' }))
    showPqc()
    openStep('Verify by hand (no apt support cited)')
    const text = pageText()
    expect(text).not.toMatch(/GnuPG PQC extension \(DEP-18\)/)
    expect(text).not.toMatch(/Ubuntu 28\.04/)
    expect(text).not.toMatch(/apt-ftparchive --pqc-sign/)
    expect(text).not.toMatch(/apt 3\.x target/)
    expect(text).toMatch(/lab sketch only/)
    expect(text).toMatch(/No ML-DSA verification cited/)
    expect(text).toMatch(/cites no Debian or Ubuntu release that provides it/)
  })
})

describe('PACKAGE_FORMATS ecosystem data', () => {
  it('describes the RPM entry from the RPM 6 and Red Hat statements, not a pluggable-backend claim', () => {
    const rpm = PACKAGE_FORMATS.find((f) => f.id === 'rpm')!
    expect(rpm.pqcMigrationPath).toMatch(/RPM 6\.0\.0/)
    expect(rpm.pqcMigrationPath).toMatch(/ML-DSA-87/)
    expect(rpm.notes).toMatch(/older systems verify only the RSA signature/)
    expect(rpm.notes).not.toMatch(/pluggable signature backends/)
    expect(rpm.notes).not.toMatch(/RHEL 11/)
  })

  it('does not call DEP-18 a signing proposal', () => {
    const deb = PACKAGE_FORMATS.find((f) => f.id === 'deb')!
    expect(deb.status).toBe('unverified')
    expect(deb.notes).toMatch(/DEP-18 is the Debian Enhancement Proposal/)
    expect(deb.notes).toMatch(/not post-quantum signatures/)
    expect(deb.notes).not.toMatch(/tracking PQC signing as DEP-18/)
    expect(deb.notes).not.toMatch(/Ubuntu 26\.04 LTS target/)
  })
})
