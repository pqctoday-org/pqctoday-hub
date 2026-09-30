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
const DEFAULT_NOTE = "The assistant's default in-browser model."

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
  write(
    'package-lock.json',
    JSON.stringify({
      packages: {
        'node_modules/react': { version: '19.3.0', license: 'MIT' },
        'node_modules/three': { version: '0.185.1', license: 'MIT' },
        'node_modules/vitest': { version: '5.0.1', license: '(MIT OR Apache-2.0)' },
        'node_modules/tiny-dep': { version: '1.0.0', license: 'ISC', integrity: 'sha512-AAAA' },
        'node_modules/react/node_modules/nested': { version: '2.0.0', license: 'MIT' },
      },
    })
  )
  write(
    'src/data/sbomBundledPackages.json',
    JSON.stringify({
      packages: [
        'node_modules/react',
        'node_modules/react/node_modules/nested',
        'node_modules/three',
        'node_modules/tiny-dep',
      ],
    })
  )
  write('node_modules/pyodide/pyodide-lock.json', JSON.stringify({ info: { python: '3.13.2' } }))
  write(
    'src/data/sbomCrateLicenses.json',
    JSON.stringify({
      crates: {
        aes: { '0.8.4': 'MIT OR Apache-2.0' },
        serde: { '1.0.228': 'MIT OR Apache-2.0' },
        sha2: { '0.10.9': 'MIT OR Apache-2.0' },
      },
    })
  )
  write(
    'src/services/chat/modelConfig.ts',
    "export const DEFAULT_LOCAL_MODEL = 'Chat-1-MLC'\nexport const SUPPORTED_LOCAL_MODELS = [DEFAULT_LOCAL_MODEL] as const\n"
  )
  write('public/data/embeddings-meta.json', JSON.stringify({ model: 'org/embed-1' }))
  write(
    'node_modules/@mlc-ai/web-llm/lib/index.js',
    'const modelLibURLPrefix = "https://libs.example/"; const modelVersion = "v1/base"; ' +
      '[{ model: "https://hf.example/org/Chat-1-MLC", model_id: "Chat-1-MLC", ' +
      'model_lib: modelLibURLPrefix + modelVersion + "/Chat-1.wasm" }]'
  )
  write(
    'src/data/sbomModels.json',
    JSON.stringify({
      fetchedAt: '2026-09-29',
      models: [
        {
          key: 'chat',
          id: 'Chat-1-MLC',
          role: "chat model weights, the assistant's default local model",
          sourceUrl: 'https://hf.example/org/Chat-1-MLC',
          license: 'Apache-2.0',
          revisionChecked: 'abc',
        },
        {
          key: 'lib',
          id: 'Chat-1.wasm',
          role: 'compiled model library for the default chat model',
          sourceUrl: 'https://libs.example/v1/base/Chat-1.wasm',
          license: 'not declared',
          revisionChecked: null,
        },
        {
          key: 'embed',
          id: 'org/embed-1',
          role: 'text embeddings',
          sourceUrl: 'https://huggingface.co/org/embed-1',
          license: 'MIT',
          revisionChecked: 'def',
        },
      ],
    })
  )
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
          { name: 'React', pkg: 'react' },
          { name: 'three', pkg: 'three' },
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
          {
            name: 'Chat-1 chat model (default; q4 build)',
            model: 'chat',
            note: DEFAULT_NOTE + " It follows the repository's default branch.",
          },
        ],
      },
      {
        category: SBOM_CATEGORIES[4],
        components: [
          { name: 'sha2', crate: 'sha2' },
          { name: 'fips204', crate: 'fips204' },
          { name: 'supporting', crates: ['aes', 'serde'] },
        ],
      },
      {
        category: SBOM_CATEGORIES[10],
        components: [{ name: 'Vitest', pkg: 'vitest' }],
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

  it('takes npm licenses from the lockfile and fails when one is missing', () => {
    const t = makeTree()
    expect(derive(t.root, t.curated).content).toContain("vitest: '(MIT OR Apache-2.0)'")
    t.write(
      'package-lock.json',
      JSON.stringify({
        packages: {
          'node_modules/react': { version: '19.3.0' },
          'node_modules/three': { version: '0.185.1', license: 'MIT' },
          'node_modules/vitest': { version: '5.0.1', license: 'MIT' },
        },
      })
    )
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /react: no license in package-lock\.json/
    )
  })

  it('takes npm licenses from the lockfile and fails when one is missing', () => {
    const t = makeTree()
    expect(derive(t.root, t.curated).content).toContain("vitest: '(MIT OR Apache-2.0)'")
    t.write(
      'package-lock.json',
      JSON.stringify({
        packages: {
          'node_modules/react': { version: '19.3.0' },
          'node_modules/three': { version: '0.185.1', license: 'MIT' },
          'node_modules/vitest': { version: '5.0.1', license: 'MIT' },
        },
      })
    )
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /react: no license in package-lock\.json/
    )
  })

  it('summarises the bundled packages that are not page rows, and writes the CycloneDX file', () => {
    const t = makeTree()
    const r = derive(t.root, t.curated)
    expect(r.problems).toEqual([])
    expect(r.content).toContain('"count":2')
    const doc = JSON.parse(r.files['public/data/pqctoday-sbom.cdx.json'])
    expect(doc.bomFormat).toBe('CycloneDX')
    const names = doc.components.map((c: { name: string }) => c.name)
    expect(names).toContain('tiny-dep')
    expect(names).toContain('nested')
    const tiny = doc.components.find((c: { name: string }) => c.name === 'tiny-dep')
    expect(tiny.purl).toBe('pkg:npm/tiny-dep@1.0.0')
    expect(tiny.licenses).toEqual([{ license: { id: 'ISC' } }])
    // deterministic: same tree, same bytes
    expect(derive(t.root, t.curated).files['public/data/pqctoday-sbom.cdx.json']).toBe(
      r.files['public/data/pqctoday-sbom.cdx.json']
    )
  })

  it('fails when the bundle snapshot is missing, names a package the lock lacks, or one has no license', () => {
    const t = makeTree()
    t.write(
      'src/data/sbomBundledPackages.json',
      JSON.stringify({ packages: ['node_modules/ghost'] })
    )
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /node_modules\/ghost: in src\/data\/sbomBundledPackages\.json but absent from package-lock\.json/
    )
    const t2 = makeTree()
    t2.write(
      'package-lock.json',
      JSON.stringify({
        packages: {
          'node_modules/react': { version: '19.3.0', license: 'MIT' },
          'node_modules/three': { version: '0.185.1', license: 'MIT' },
          'node_modules/vitest': { version: '5.0.1', license: 'MIT' },
          'node_modules/tiny-dep': { version: '1.0.0' },
          'node_modules/react/node_modules/nested': { version: '2.0.0', license: 'MIT' },
        },
      })
    )
    expect(derive(t2.root, t2.curated).problems.join('\n')).toMatch(
      /node_modules\/tiny-dep: bundled but no license/
    )
  })

  it("reads a license from the package's own license file only when the text is unambiguous", () => {
    const t = makeTree()
    t.write(
      'package-lock.json',
      JSON.stringify({
        packages: {
          'node_modules/react': { version: '19.3.0', license: 'MIT' },
          'node_modules/three': { version: '0.185.1', license: 'MIT' },
          'node_modules/vitest': { version: '5.0.1', license: 'MIT' },
          'node_modules/tiny-dep': { version: '1.0.0' },
          'node_modules/react/node_modules/nested': { version: '2.0.0', license: 'MIT' },
        },
      })
    )
    t.write(
      'node_modules/tiny-dep/license',
      'The MIT License (MIT)\n\nPermission is hereby granted, free of charge, to any person'
    )
    expect(derive(t.root, t.curated).problems).toEqual([])
    t.write('node_modules/tiny-dep/license', 'custom terms nobody recognises')
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /tiny-dep: bundled but no license/
    )
  })

  it('fails when the build bundles a package the SBOM claims is not shipped', () => {
    const t = makeTree()
    t.curated.excluded['tiny-dep'] = 'declared, never shipped'
    const p = derive(t.root, t.curated).problems.join('\n')
    expect(p).toMatch(/tiny-dep: the build bundles it, but SBOM_EXCLUDED says it is not shipped/)
  })

  it('accepts a listed package that no source imports when the build bundles it', () => {
    const t = makeTree()
    t.write('src/app.tsx', "import React from 'react'\n") // no import of three
    expect(derive(t.root, t.curated).problems).toEqual([])
  })

  it('fails when a listed runtime package is imported by no shipped code and not bundled', () => {
    const t = makeTree()
    t.write('src/app.tsx', "import React from 'react'\n")
    t.write(
      'src/data/sbomBundledPackages.json',
      JSON.stringify({ packages: ['node_modules/react'] })
    )
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /three: listed under .* but neither imported by shipped source nor bundled by the build/
    )
  })

  it('does not count test files as shipping a package', () => {
    const t = makeTree()
    t.write('src/app.tsx', "import React from 'react'\n")
    t.write('src/app.test.tsx', "import * as T from 'three'\n")
    t.write(
      'src/data/sbomBundledPackages.json',
      JSON.stringify({ packages: ['node_modules/react'] })
    )
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(/three: listed under/)
  })

  it('fails when a row lists a crate that is not in any shipped binary (ml-dsa)', () => {
    const t = makeTree()
    t.curated.groups[2].components = [
      ...t.curated.groups[2].components,
      { name: 'ml-dsa', crate: 'ml-dsa' },
    ]
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /crate ml-dsa: "ml-dsa" lists it but it is not in any shipped wasm bundle/
    )
  })

  it('fails when a compiled-in crate has no reviewed license entry, or an entry is stale', () => {
    const t = makeTree()
    t.write(
      'src/data/sbomCrateLicenses.json',
      JSON.stringify({ crates: { aes: { '0.8.4': 'MIT' } } })
    )
    const p = derive(t.root, t.curated).problems.join('\n')
    expect(p).toMatch(
      /crate sha2@0\.10\.9: no license recorded in src\/data\/sbomCrateLicenses\.json/
    )
    const t2 = makeTree()
    t2.write(
      'src/data/sbomCrateLicenses.json',
      JSON.stringify({
        crates: {
          aes: { '0.8.4': 'MIT' },
          serde: { '1.0.228': 'MIT' },
          sha2: { '0.10.9': 'MIT', '0.9.0': 'MIT' },
          gone: { '1.0.0': 'MIT' },
        },
      })
    )
    const p2 = derive(t2.root, t2.curated).problems.join('\n')
    expect(p2).toMatch(/crate gone: in sbomCrateLicenses\.json but not in any shipped bundle/)
    expect(p2).toMatch(
      /crate sha2@0\.9\.0: in sbomCrateLicenses\.json but not in any shipped bundle/
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

  it('fails when the shipped code names a model that is not recorded, or a record no code names', () => {
    const t = makeTree()
    t.write('public/data/embeddings-meta.json', JSON.stringify({ model: 'org/embed-2' }))
    const p = derive(t.root, t.curated).problems.join('\n')
    expect(p).toMatch(/org\/embed-2 \(embeddings\): named by shipped code .* but not recorded/)
    expect(p).toMatch(/embed: recorded in sbomModels\.json but no shipped code names/)
  })

  it('fails when the chat model catalog gains a model with no record', () => {
    const t = makeTree()
    t.write(
      'src/services/chat/modelConfig.ts',
      "export const DEFAULT_LOCAL_MODEL = 'Chat-1-MLC'\nexport const OTHER_LOCAL_MODEL = 'Chat-2-MLC'\nexport const SUPPORTED_LOCAL_MODELS = [DEFAULT_LOCAL_MODEL, OTHER_LOCAL_MODEL] as const\n"
    )
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /Chat-2-MLC: named by modelConfig\.ts but not found in the bundled @mlc-ai\/web-llm config/
    )
  })

  it('fails when SUPPORTED_LOCAL_MODELS is gone or names something it cannot resolve', () => {
    const t = makeTree()
    t.write('src/services/chat/modelConfig.ts', "export const OTHER = 'x'\n")
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
      /SUPPORTED_LOCAL_MODELS is missing or names something/
    )
    const t2 = makeTree()
    t2.write(
      'src/services/chat/modelConfig.ts',
      'export const SUPPORTED_LOCAL_MODELS = [UNKNOWN_CONSTANT] as const\n'
    )
    expect(derive(t2.root, t2.curated).problems.join('\n')).toMatch(
      /SUPPORTED_LOCAL_MODELS is missing or names something/
    )
  })

  it('accepts string literals in SUPPORTED_LOCAL_MODELS as well as constants', () => {
    const t = makeTree()
    t.write(
      'src/services/chat/modelConfig.ts',
      "export const DEFAULT_LOCAL_MODEL = 'Chat-1-MLC'\nexport const SUPPORTED_LOCAL_MODELS = ['Chat-1-MLC'] as const\n"
    )
    expect(derive(t.root, t.curated).problems).toEqual([])
  })

  // The default-model rule: a role says "default" iff the record is the weights or library of
  // DEFAULT_LOCAL_MODEL. On 2026-09-30 the code's default changed and the records kept the old one.
  describe('default local model', () => {
    const TWO_MODELS =
      "export const DEFAULT_LOCAL_MODEL = 'Chat-2-MLC'\nexport const SUPPORTED_LOCAL_MODELS = ['Chat-1-MLC', DEFAULT_LOCAL_MODEL] as const\n"
    // a tree that ships two chat models, Chat-1 (the fixture's) and Chat-2, each with weights + library
    const row = (n: 1 | 2, marker: 'default' | 'alternative', note = false) => ({
      name: `Chat-${n} chat model (${marker}; q4 build)`,
      model: `chat${n}-weights`,
      note: (note ? `${DEFAULT_NOTE} ` : '') + "Follows the repository's default branch.",
    })
    function twoModelTree(
      defaultRoleOn: 'chat-1' | 'chat-2' | 'none',
      rowsOverride?: ReturnType<typeof row>[]
    ) {
      const t = makeTree()
      t.write('src/services/chat/modelConfig.ts', TWO_MODELS)
      t.write(
        'node_modules/@mlc-ai/web-llm/lib/index.js',
        'const modelLibURLPrefix = "https://libs.example/"; const modelVersion = "v1/base"; ' +
          '[{ model: "https://hf.example/org/Chat-1-MLC", model_id: "Chat-1-MLC", ' +
          'model_lib: modelLibURLPrefix + modelVersion + "/Chat-1.wasm" }, ' +
          '{ model: "https://hf.example/org/Chat-2-MLC", model_id: "Chat-2-MLC", ' +
          'model_lib: modelLibURLPrefix + modelVersion + "/Chat-2.wasm" }]'
      )
      const rec = (n: 1 | 2, kind: 'weights' | 'library') => ({
        key: `chat${n}-${kind}`,
        id: kind === 'weights' ? `Chat-${n}-MLC` : `Chat-${n}.wasm`,
        role:
          (kind === 'weights' ? 'chat model weights' : 'compiled model library') +
          (defaultRoleOn === `chat-${n}` ? ', the default' : ''),
        sourceUrl:
          kind === 'weights'
            ? `https://hf.example/org/Chat-${n}-MLC`
            : `https://libs.example/v1/base/Chat-${n}.wasm`,
        license: 'Apache-2.0',
        revisionChecked: null,
      })
      const rows = rowsOverride ?? [row(1, 'alternative'), row(2, 'default', true)]
      t.curated.groups[1].components = [
        ...t.curated.groups[1].components.filter((c) => !('model' in c)),
        ...rows,
      ]
      t.write(
        'src/data/sbomModels.json',
        JSON.stringify({
          fetchedAt: '2026-09-30',
          models: [
            rec(1, 'weights'),
            rec(1, 'library'),
            rec(2, 'weights'),
            rec(2, 'library'),
            {
              key: 'embed',
              id: 'org/embed-1',
              role: 'text embeddings',
              sourceUrl: 'https://huggingface.co/org/embed-1',
              license: 'MIT',
              revisionChecked: null,
            },
          ],
        })
      )
      return t
    }

    it('passes when exactly the default model weights and library are marked default', () => {
      const t = twoModelTree('chat-2')
      expect(derive(t.root, t.curated).problems).toEqual([])
    })

    it('fails when the default model in code has no record marked default', () => {
      const t = twoModelTree('none')
      const p = derive(t.root, t.curated).problems.join('\n')
      expect(p).toMatch(
        /chat2-weights \(Chat-2-MLC\): it belongs to Chat-2-MLC, the DEFAULT_LOCAL_MODEL in modelConfig\.ts, but its role .* does not say "default"/
      )
      expect(p).toMatch(/chat2-library \(Chat-2\.wasm\): it belongs to Chat-2-MLC/)
    })

    it('fails when a model that is not the default is marked default', () => {
      // the code default moved to Chat-2; the records still call Chat-1 the default
      const t = twoModelTree('chat-1')
      const p = derive(t.root, t.curated).problems.join('\n')
      expect(p).toMatch(
        /chat1-weights \(Chat-1-MLC\): role "chat model weights, the default" in sbomModels\.json says "default", but DEFAULT_LOCAL_MODEL in modelConfig\.ts is Chat-2-MLC/
      )
      expect(p).toMatch(/chat1-library \(Chat-1\.wasm\): role .* says "default"/)
      expect(p).toMatch(/chat2-weights \(Chat-2-MLC\): it belongs to Chat-2-MLC/)
    })

    it('fails when DEFAULT_LOCAL_MODEL is missing or names something it cannot resolve', () => {
      const t = makeTree()
      t.write(
        'src/services/chat/modelConfig.ts',
        "export const SUPPORTED_LOCAL_MODELS = ['Chat-1-MLC'] as const\n"
      )
      expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
        /DEFAULT_LOCAL_MODEL is missing or names something/
      )
      const t2 = makeTree()
      t2.write(
        'src/services/chat/modelConfig.ts',
        "export const DEFAULT_LOCAL_MODEL = UNKNOWN_CONSTANT\nexport const SUPPORTED_LOCAL_MODELS = ['Chat-1-MLC'] as const\n"
      )
      expect(derive(t2.root, t2.curated).problems.join('\n')).toMatch(
        /DEFAULT_LOCAL_MODEL is missing or names something/
      )
    })

    it('resolves DEFAULT_LOCAL_MODEL through an exported constant', () => {
      const t = makeTree()
      t.write(
        'src/services/chat/modelConfig.ts',
        "export const CHAT_ONE = 'Chat-1-MLC'\nexport const DEFAULT_LOCAL_MODEL = CHAT_ONE\nexport const SUPPORTED_LOCAL_MODELS = [DEFAULT_LOCAL_MODEL] as const\n"
      )
      expect(derive(t.root, t.curated).problems).toEqual([])
    })

    it('fails when the default model row says "(alternative;"', () => {
      const t = twoModelTree('chat-2', [row(1, 'alternative'), row(2, 'alternative', true)])
      expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
        /"Chat-2 chat model \(alternative; q4 build\)" \(Chat-2-MLC\): it is Chat-2-MLC, the DEFAULT_LOCAL_MODEL in modelConfig\.ts, but its row name in sbomComponents\.ts does not say "\(default;"/
      )
    })

    it('fails when a model that is not the default has a row marked "(default;"', () => {
      const t = twoModelTree('chat-2', [row(1, 'default'), row(2, 'default', true)])
      expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
        /"Chat-1 chat model \(default; q4 build\)" \(Chat-1-MLC\): its row name in sbomComponents\.ts says "\(default;", but DEFAULT_LOCAL_MODEL in modelConfig\.ts is Chat-2-MLC/
      )
    })

    it("fails when the default note is on the wrong row, or missing from the default's row", () => {
      const t = twoModelTree('chat-2', [row(1, 'alternative', true), row(2, 'default')])
      const p = derive(t.root, t.curated).problems.join('\n')
      expect(p).toMatch(
        /"Chat-1 chat model \(alternative; q4 build\)" .*says "The assistant's default in-browser model\."/
      )
      expect(p).toMatch(
        /"Chat-2 chat model \(default; q4 build\)" .*lacks "The assistant's default in-browser model\."/
      )
    })

    it('fails when the default model has no weights row on the page', () => {
      const t = twoModelTree('chat-2', [row(1, 'alternative')])
      expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
        /Chat-2-MLC: DEFAULT_LOCAL_MODEL in modelConfig\.ts has no weights row/
      )
    })

    it('fails when DEFAULT_LOCAL_MODEL is not one of SUPPORTED_LOCAL_MODELS', () => {
      const t = makeTree()
      t.write(
        'src/services/chat/modelConfig.ts',
        "export const DEFAULT_LOCAL_MODEL = 'Chat-9-MLC'\nexport const SUPPORTED_LOCAL_MODELS = ['Chat-1-MLC'] as const\n"
      )
      expect(derive(t.root, t.curated).problems.join('\n')).toMatch(
        /Chat-9-MLC: DEFAULT_LOCAL_MODEL in modelConfig\.ts is not in SUPPORTED_LOCAL_MODELS/
      )
    })
  })

  it('fails when a model row names a record that does not exist', () => {
    const t = makeTree()
    t.curated.groups[1].components = [
      ...t.curated.groups[1].components,
      { name: 'Ghost model', model: 'ghost' },
    ]
    expect(derive(t.root, t.curated).problems.join('\n')).toMatch(/model source "ghost"/)
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

describe('bundle plugin key mapping', () => {
  it('maps module ids to package-lock keys, including nested and scoped packages', async () => {
    const { lockKeyOf } = await import('./vite-plugin-bundle-packages')
    expect(lockKeyOf('/w/node_modules/react/index.js')).toBe('node_modules/react')
    expect(lockKeyOf('/w/node_modules/@scope/pkg/dist/x.js')).toBe('node_modules/@scope/pkg')
    expect(lockKeyOf('/w/node_modules/a/node_modules/b/x.js')).toBe('node_modules/a/node_modules/b')
    expect(lockKeyOf('/w/node_modules/@s/a/node_modules/@t/b/x.js?commonjs-module')).toBe(
      'node_modules/@s/a/node_modules/@t/b'
    )
    expect(lockKeyOf('\0/w/node_modules/c/x.js?commonjs-proxy')).toBe('node_modules/c')
    expect(lockKeyOf('/w/src/app.tsx')).toBeNull()
  })
})
