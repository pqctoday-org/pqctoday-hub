// SPDX-License-Identifier: GPL-3.0-only
// Each test builds a minimal consistent tree on disk, breaks exactly one thing, and
// expects the SBOM gate to name it. The passing baseline proves the gate is not
// simply failing on everything; the failing cases are the ways the live About page
// was actually wrong on 2026-09-29.
import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { derive, type Curated } from './derive'
import { scanEmbeddedVersion, scanRustWasm } from './wasm-scan.mjs'
import { SBOM_CATEGORIES } from '../../src/data/sbomCategories'

const roots: string[] = []
afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const registry = (name: string, ver: string) =>
  `registry/src/index.crates.io-1949cf8c6b5b557f/${name}-${ver}/src/lib.rs\0`

const ENGINE = Buffer.from(
  `${registry('sha2', '0.10.9')}${registry('aes', '0.8.4')}fips204-patched/src/lib.rs\0`
)
const KMIP = Buffer.from(`${registry('sha2', '0.10.9')}${registry('serde', '1.0.228')}`)
const OPENSSL = Buffer.from('xx OpenSSL 3.6.3 9 Jun 2026 xx pkcs11-provider 0.4.0 xx')
const STRONGSWAN = Buffer.from('strongSwan 6.0.5')
const TPM = Buffer.from('tpm-bytes')
const FONT = Buffer.from('font-bytes')
const COMMIT = 'a'.repeat(40)

interface Tree {
  root: string
  curated: Curated
  write: (rel: string, data: string | Buffer) => void
}

function makeTree(): Tree {
  const root = mkdtempSync(join(tmpdir(), 'sbom-gate-'))
  roots.push(root)
  const write = (rel: string, data: string | Buffer) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), data)
  }
  write(
    'package.json',
    JSON.stringify({
      dependencies: { react: '^19.3.0', three: '^0.185.1' },
      devDependencies: { vitest: '^5.0.1', '@types/react': '^19.3.0' },
    })
  )
  write('src/app.tsx', "import React from 'react'\nimport * as T from 'three'\n")
  write('vite.config.ts', '')
  write('index.html', '')
  write('public/wasm/rust/softhsmrustv3_bg.wasm', ENGINE)
  write('public/wasm/rust-kmip/pqctoday_kmip_wasm_bg.wasm', KMIP)
  write('public/wasm/openssl.wasm', OPENSSL)
  write('public/wasm/strongswan.wasm', STRONGSWAN)
  write('public/wasm/pqctpm.wasm', TPM)
  write(
    'public/wasm/wasm-provenance.json',
    JSON.stringify({
      hsmRepo: 'org/hsm',
      bundles: [
        {
          name: 'softhsmrustv3-engine',
          files: ['public/wasm/rust/softhsmrustv3_bg.wasm'],
          hsmCommit: COMMIT,
        },
        {
          name: 'cacp-kmip',
          files: ['public/wasm/rust-kmip/pqctoday_kmip_wasm_bg.wasm'],
          hsmCommit: COMMIT,
        },
        {
          name: 'openssl-pkcs11',
          files: ['public/wasm/openssl.js', 'public/wasm/openssl.wasm'],
          hsmCommit: COMMIT,
        },
        { name: 'strongswan', files: ['public/wasm/strongswan.wasm'], hsmCommit: COMMIT },
      ],
    })
  )
  write(
    'src/data/sbomWasmArtifacts.json',
    JSON.stringify({
      artifacts: [
        {
          key: 'pqctoday-tpm',
          repo: 'org/tpm',
          commit: null,
          files: { 'public/wasm/pqctpm.wasm': sha(TPM) },
        },
      ],
    })
  )
  write(
    'src/data/sbomRustLock.json',
    JSON.stringify({
      bundle: 'softhsmrustv3-engine',
      commit: COMMIT,
      forks: { 'fips204-patched': { crate: 'fips204', version: '0.4.6', license: 'MIT' } },
      unscannable: {},
    })
  )
  write('package-lock.json', JSON.stringify({ packages: {} }))
  write('node_modules/pyodide/pyodide-lock.json', JSON.stringify({ info: { python: '3.13.2' } }))
  write('public/fonts/inter.woff2', FONT)
  write(
    'src/data/sbomAssets.json',
    JSON.stringify({
      assets: [
        {
          key: 'inter-font',
          license: 'SIL Open Font License 1.1',
          files: { 'public/fonts/inter.woff2': sha(FONT) },
        },
      ],
    })
  )
  const curated: Curated = {
    excluded: { '@types/react': 'type declarations only' },
    groups: [
      {
        category: SBOM_CATEGORIES[0],
        components: [
          { name: 'React', license: 'MIT', pkg: 'react' },
          { name: 'three', license: 'MIT', pkg: 'three' },
        ],
      },
      {
        category: SBOM_CATEGORIES[2],
        components: [
          { name: 'OpenSSL', license: 'Apache-2.0', embedded: 'openssl' },
          { name: 'strongSwan', license: 'x', embedded: 'strongswan' },
          { name: 'TPM', license: 'x', built: 'pqctoday-tpm' },
          { name: 'Web Crypto API (X25519, P-256)', license: 'W3C', native: true },
          { name: 'pkcs11-provider', license: 'Apache-2.0', embedded: 'pkcs11-provider' },
          { name: 'Python', license: 'PSF', embedded: 'python' },
          { name: 'Inter', license: 'SIL Open Font License 1.1', asset: 'inter-font' },
        ],
      },
      {
        category: SBOM_CATEGORIES[4],
        components: [
          { name: 'sha2', license: 'MIT', crate: 'sha2' },
          { name: 'fips204', license: 'MIT', crate: 'fips204' },
          { name: 'supporting', license: 'MIT', crates: ['aes', 'serde'] },
        ],
      },
      {
        category: SBOM_CATEGORIES[10],
        components: [{ name: 'Vitest', license: 'MIT', pkg: 'vitest' }],
      },
    ],
  }
  return { root, curated, write }
}

describe('SBOM gate', () => {
  it('passes on a consistent tree and reads versions from the binaries', () => {
    const t = makeTree()
    const { problems, content } = derive(t.root, t.curated)
    expect(problems).toEqual([])
    expect(content).toContain("openssl: '3.6.3'")
    expect(content).toContain("strongswan: '6.0.5'")
    expect(content).toContain("sha2: { engine: ['0.10.9'], kmip: ['0.10.9'] }")
    expect(content).toContain("'pqctoday-tpm': { repo: 'org/tpm', commit: null")
  })

  it('fails when a direct dependency is neither listed nor excluded (three was missing)', () => {
    const t = makeTree()
    t.curated.groups[0].components = t.curated.groups[0].components.filter(
      (c) => c.name !== 'three'
    )
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /three: direct dependency is neither on the SBOM page nor in SBOM_EXCLUDED/
    )
  })

  it('fails on an SBOM_EXCLUDED entry with no reason, a stale one, or a double entry', () => {
    const t = makeTree()
    t.curated.excluded['@types/react'] = ' '
    t.curated.excluded['gone'] = 'no longer a dependency'
    t.curated.excluded['react'] = 'also listed'
    const p = derive(t.root, t.curated).problems.join('\n')
    expect(p).toMatch(/@types\/react: SBOM_EXCLUDED entry has no reason/)
    expect(p).toMatch(/gone: in SBOM_EXCLUDED but not a direct dependency/)
    expect(p).toMatch(/react: both listed and in SBOM_EXCLUDED/)
  })

  it('fails when a listed runtime package is imported by no shipped code', () => {
    const t = makeTree()
    t.write('src/app.tsx', "import React from 'react'\n")
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /three: listed under .* but imported by no shipped source/
    )
  })

  it('does not count test files as shipping a package', () => {
    const t = makeTree()
    t.write('src/app.tsx', "import React from 'react'\n")
    t.write('src/app.test.tsx', "import * as T from 'three'\n")
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(/three: listed under/)
  })

  it('fails when a row lists a crate that is not in any shipped binary (ml-dsa)', () => {
    const t = makeTree()
    t.curated.groups[2].components = [
      ...t.curated.groups[2].components,
      { name: 'ml-dsa', license: 'MIT', crate: 'ml-dsa' },
    ]
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /crate ml-dsa: "ml-dsa" lists it but it is not in any shipped wasm bundle/
    )
  })

  it('fails when a crate compiled into a bundle is not on the page', () => {
    const t = makeTree()
    t.write(
      'public/wasm/rust-kmip/pqctoday_kmip_wasm_bg.wasm',
      Buffer.concat([KMIP, Buffer.from(registry('frodo-kem', '0.1.0'))])
    )
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /crate frodo-kem: compiled into a shipped wasm bundle but not on the SBOM page/
    )
  })

  it('fails when a shipped wasm file has no record at all', () => {
    const t = makeTree()
    t.write('public/wasm/entropy90b/ea_iid.wasm', 'new binary')
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /entropy90b\/ea_iid\.wasm: shipped wasm with no record/
    )
  })

  it('fails when a pinned binary changes without its record being updated', () => {
    const t = makeTree()
    t.write('public/wasm/pqctpm.wasm', 'rebuilt tpm')
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /pqctpm\.wasm: sha256 is .* but src\/data\/sbomWasmArtifacts\.json pins/
    )
  })

  it('fails when the engine is rebuilt but the fork/lock record is not re-read', () => {
    const t = makeTree()
    const prov = JSON.parse(
      JSON.stringify({
        hsmRepo: 'org/hsm',
        bundles: [
          {
            name: 'softhsmrustv3-engine',
            files: ['public/wasm/rust/softhsmrustv3_bg.wasm'],
            hsmCommit: 'b'.repeat(40),
          },
        ],
      })
    )
    t.write('public/wasm/wasm-provenance.json', JSON.stringify(prov))
    t.write('public/wasm/openssl.wasm', OPENSSL) // keep coverage for the other files
    const p = derive(t.root, t.curated).problems.join('\n')
    expect(p).toMatch(
      /sbomRustLock\.json was read at aaaaaaaa but wasm-provenance\.json records bbbbbbbb/
    )
  })

  it('fails when an embedded version string disappears from the binary', () => {
    const t = makeTree()
    t.write('public/wasm/openssl.wasm', 'no version here')
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /openssl: no version string found in public\/wasm\/openssl\.wasm/
    )
  })

  it('refuses a hand-typed "Native" on anything but Web Crypto', () => {
    const t = makeTree()
    t.curated.groups[1].components = [
      ...t.curated.groups[1].components,
      { name: 'Something', license: 'x', native: true },
    ]
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /only the browser's own Web Crypto/
    )
  })

  it('fails when a shipped font has no record, or changed since it was pinned', () => {
    const t = makeTree()
    t.write('public/fonts/new.woff2', 'another font')
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /public\/fonts\/new\.woff2: shipped font with no record/
    )
    const t2 = makeTree()
    t2.write('public/fonts/inter.woff2', 'a different font')
    expect(derive(t2.root, t2.curated).problems.join('\n')).toMatch(
      /inter\.woff2: sha256 differs from src\/data\/sbomAssets\.json/
    )
  })

  it('fails when an asset row disagrees with its record, or the record is missing', () => {
    const t = makeTree()
    ;(
      t.curated.groups[1].components.find((c) => c.name === 'Inter') as { license: string }
    ).license = 'MIT'
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /row says "MIT" but sbomAssets\.json records/
    )
  })

  it('fails when the pkcs11-provider banner is gone from openssl.wasm', () => {
    const t = makeTree()
    t.write('public/wasm/openssl.wasm', OPENSSL.toString().replace('pkcs11-provider 0.4.0', ''))
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /pkcs11-provider: no version string found/
    )
  })

  it('reads the Python version from the installed Pyodide runtime', () => {
    const t = makeTree()
    expect(derive(t.root, t.curated).content).toContain("python: '3.13.2'")
    t.write('node_modules/pyodide/pyodide-lock.json', JSON.stringify({ info: {} }))
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(/has no info\.python/)
  })

  it('fails when a `built` row names a bundle with no provenance', () => {
    const t = makeTree()
    t.curated.groups[1].components = [
      ...t.curated.groups[1].components,
      { name: 'Ghost', license: 'x', built: 'ghost-bundle' },
    ]
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(/built source "ghost-bundle"/)
  })
})

describe('wasm scan', () => {
  it('reads crate names and versions, including pre-release and multi-hyphen crates', () => {
    const buf = Buffer.from(
      registry('ed448-goldilocks', '0.14.0-pre.15') +
        registry('aes-gcm', '0.11.1') +
        registry('serde_yaml', '0.9.34+deprecated') +
        'fips205-patched/src/lib.rs classic-mceliece-multi/src/x.rs'
    )
    const r = scanRustWasm(buf)
    expect(r.crates['ed448-goldilocks']).toEqual(['0.14.0-pre.15'])
    expect(r.crates['aes-gcm']).toEqual(['0.11.1'])
    expect(r.crates['serde_yaml']).toEqual(['0.9.34+deprecated'])
    expect(r.forks).toEqual(['classic-mceliece-multi', 'fips205-patched'])
  })

  it('returns null when the embedded version is absent', () => {
    expect(scanEmbeddedVersion(Buffer.from('nothing'), /strongSwan (\d+\.\d+\.\d+)/)).toBeNull()
  })
})
