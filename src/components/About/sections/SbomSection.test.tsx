// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SbomSection } from './SbomSection'
import { SBOM_GROUPS, sbomVersionLabel } from '@/data/sbomComponents'
import { SBOM_PACKAGE_VERSIONS } from '@/data/sbomVersions.generated'
import { SBOM_CATEGORIES } from '@/data/sbomCategories'
import pkg from '../../../../package.json'

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies }
const pin = (spec: string) => spec.replace(/^[\^~]/, '')

describe('SBOM component list', () => {
  it('renders every category heading exactly once', () => {
    const cats = SBOM_GROUPS.map((g) => g.category)
    expect([...cats].sort()).toEqual([...SBOM_CATEGORIES].sort())
  })

  it('derives every direct-dependency version from package.json, never from hand-typed text', () => {
    for (const g of SBOM_GROUPS) {
      for (const c of g.components) {
        if (c.pkg === undefined) continue
        const keys = typeof c.pkg === 'string' ? [c.pkg] : c.pkg
        for (const k of keys) {
          expect(deps[k], `${c.name} lists ${k}, which is not a direct dependency`).toBeDefined()
          expect(
            SBOM_PACKAGE_VERSIONS[k],
            `${k} missing from generated map — run gen:sbom-versions`
          ).toBe(pin(deps[k]))
        }
        expect(sbomVersionLabel(c)).toBe(keys.map((k) => `v${pin(deps[k])}`).join(' / '))
      }
    }
  })

  it('still lists the five names a hand-edit blanked in PR #598', () => {
    const names = SBOM_GROUPS.flatMap((g) => g.components.map((c) => c.name))
    for (const n of [
      '@noble/hashes',
      '@noble/curves',
      '@scure/bip32',
      '@scure/bip39',
      '@scure/base',
    ]) {
      expect(names).toContain(n)
    }
    expect(names.every((n) => n.trim().length > 0)).toBe(true)
  })
})

describe('SbomSection', () => {
  it('shows the live package.json version once the accordion is opened', () => {
    render(<SbomSection />)
    fireEvent.click(screen.getByRole('button', { name: /Software Bill of Materials/i }))
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText(`v${pin(deps.react)}`)).toBeInTheDocument()
    expect(screen.getByText(`v${pin(deps.vitest)}`)).toBeInTheDocument()
    // a hand-typed, non-npm entry renders verbatim
    expect(screen.getByText('OpenSSL WASM')).toBeInTheDocument()
    expect(screen.getByText('softhsmv3')).toHaveAttribute(
      'href',
      expect.stringContaining('pqctoday-hsm')
    )
  })
})
