// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SbomSection } from './SbomSection'
import { SBOM_GROUPS, sbomHref, sbomVersionLabel } from '@/data/sbomComponents'
import { SBOM_PACKAGE_VERSIONS } from '@/data/sbomVersions.generated'
import { SBOM_CATEGORIES } from '@/data/sbomCategories'
import embeddingsMeta from '../../../../public/data/embeddings-meta.json'
import pkg from '../../../../package.json'
import vendoredWasm from '../../../vendor/softhsm-wasm/package.json'

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
// A `file:` dependency has no version in package.json; its own manifest is the source.
const expected = (key: string) =>
  deps[key].startsWith('file:') ? vendoredWasm.version : pin(deps[key])

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
          ).toBe(expected(k))
        }
        expect(sbomVersionLabel(c)).toBe(keys.map((k) => `v${expected(k)}`).join(' / '))
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

describe('SBOM content is the shipped build, not a hand-typed list', () => {
  const rows = SBOM_GROUPS.flatMap((g) => g.components)
  const byName = (re: RegExp) => rows.find((c) => re.test(c.name))!

  it('never renders an unresolved version', () => {
    for (const c of rows) expect(sbomVersionLabel(c), c.name).not.toMatch(/\?/)
  })

  it('lists what the served binaries contain that the page used to omit', () => {
    for (const re of [
      /^React DOM/,
      /^three/,
      /^strongSwan/,
      /^OpenSSH server/,
      /^NIST SP 800-90B/,
      /^pqctoday-tpm/,
      /^frodo-kem/,
      /^classic-mceliece-multi/,
      /^xmss/,
    ])
      expect(byName(re), String(re)).toBeDefined()
  })

  it('names the PQC crates the engine actually compiles, not ml-dsa / slh-dsa', () => {
    const names = rows.map((c) => c.name)
    expect(names).toContain('fips204 (ML-DSA)')
    expect(names).toContain('fips205 (SLH-DSA)')
    expect(names.some((n) => /^(ml-dsa|slh-dsa)$/.test(n))).toBe(false)
  })

  it('reads OpenSSL and strongSwan from the binaries', () => {
    expect(sbomVersionLabel(byName(/^OpenSSL WASM/))).toBe('v3.6.3')
    expect(sbomVersionLabel(byName(/^strongSwan/))).toBe('v6.0.5')
  })

  it('does not invent a release for bundles whose binary embeds none', () => {
    const tpm = sbomVersionLabel(byName(/^pqctoday-tpm/))
    expect(tpm).toMatch(/^build commit not recorded · sha256 [0-9a-f]{8}$/)
    expect(sbomVersionLabel(byName(/^softhsmv3/))).toMatch(
      /^built from pqctoday-hsm @ [0-9a-f]{8}$/
    )
    expect(sbomHref(byName(/^softhsmv3/))).toMatch(
      /github\.com\/pqctoday-org\/pqctoday-hsm\/commit\//
    )
  })

  it('names the embedding model the shipped search index was built with', () => {
    // public/data/embeddings-meta.json is what production serves; the page used to say
    // "bge-small" while the index was built with bge-base.
    const model = embeddingsMeta.model
      .split('/')
      .pop()!
      .replace(/-en-v1\.5$/, '')
    expect(byName(/^@huggingface\/transformers/).name).toContain(model)
    expect(byName(/^@huggingface\/transformers/).name).toContain('v1.5')
  })

  it('states per-bundle versions when the engine and KMIP bundles differ', () => {
    expect(sbomVersionLabel(byName(/^x448/))).toMatch(/\(engine\).*\(KMIP\)/)
  })
})

describe('SbomSection', () => {
  it('shows the live package.json version once the accordion is opened', () => {
    render(<SbomSection />)
    fireEvent.click(screen.getByRole('button', { name: /Software Bill of Materials/i }))
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getAllByText(`v${pin(deps.react)}`).length).toBeGreaterThan(0)
    expect(screen.getAllByText(`v${pin(deps.vitest)}`).length).toBeGreaterThan(0)
    expect(screen.getByText('OpenSSL WASM (OpenSSL Studio)')).toBeInTheDocument()
    expect(screen.getByText('softhsmv3 (PKCS#11 v3.2 engine, C++ / WASM)')).toHaveAttribute(
      'href',
      expect.stringContaining('pqctoday-hsm/commit/')
    )
  })

  it('offers the member list of a supporting-crate group', () => {
    render(<SbomSection />)
    fireEvent.click(screen.getByRole('button', { name: /Software Bill of Materials/i }))
    expect(screen.getAllByText(/^Show the \d+ crates$/).length).toBeGreaterThan(0)
  })
})
