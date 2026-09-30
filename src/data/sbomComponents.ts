// SPDX-License-Identifier: GPL-3.0-only
//
// The curated Software Bill of Materials the About page renders (SbomSection.tsx).
//
// This file is the editorial half: WHICH components appear, under which of the
// SBOM_CATEGORIES headings, with which license and link. The VERSION column is
// never typed here. Every row names the evidence its version comes from, and
// scripts/gen-sbom-versions.ts (run on every build and test, and by
// `gen:sbom-versions:check` in the local gate) fails if that evidence is missing
// or disagrees with what this build ships:
//
//   pkg      direct npm dependency          -> package.json
//   lock     bundled npm package that is not a direct dependency
//                                           -> package-lock.json
//   crate    Rust crate in a shipped wasm   -> the binary itself (crate paths the
//                                              compiler left in it); vendored forks
//                                              and crates the scan cannot see come
//                                              from sbomRustLock.json, pinned to the
//                                              engine's build commit
//   crates   a labelled group of the above  (supporting crates, listed by name)
//   embedded a version the binary or its shipped BUILDINFO.json states about itself
//   built    a bundle with no embedded version -> "built from <repo> @ <commit>",
//                                              from wasm-provenance.json /
//                                              sbomWasmArtifacts.json; no release
//                                              number is invented for it
//   asset    a shipped non-code file (font)   -> sbomAssets.json, sha256-pinned; name and
//                                              version read from the font's own name table
//   native   the browser's own Web Crypto API
//
// The check is two-way. A direct dependency, a shipped wasm file, or a crate
// compiled into a bundle that is not accounted for below fails it, and so does
// a row whose subject is not actually shipped. History: on 2026-09-29 the live
// page was missing three, react-dom, strongSwan, OpenSSH, the SP 800-90B
// estimators and ~60 compiled-in crates, and still listed "ml-dsa" and
// "slh-dsa" (the engine ships the patched fips204/fips205 forks) and OpenSSL
// 3.6.1 (the served binary says 3.6.3).
import { SBOM_CATEGORIES } from './sbomCategories'
import {
  SBOM_BUILDS,
  SBOM_CRATES,
  SBOM_EMBEDDED_VERSIONS,
  SBOM_CRATE_LICENSES,
  SBOM_LOCK_VERSIONS,
  SBOM_PACKAGE_LICENSES,
  SBOM_PACKAGE_VERSIONS,
} from './sbomVersions.generated'
import rustLock from './sbomRustLock.json'
import assetRecords from './sbomAssets.json'

type Base = {
  /** Display name — may be prose ("React Router") rather than the package name. */
  name: string
  /** Optional release / project link rendered on the name. */
  href?: string
  /** A caveat shown under the row, e.g. what the binary does not tell us. */
  note?: string
}
type NoOther = {
  pkg?: never
  lock?: never
  crate?: never
  crates?: never
  embedded?: never
  built?: never
  native?: never
  asset?: never
}

/**
 * npm rows (`pkg`, `lock`) carry no license: it is generated from package-lock.json, so it
 * cannot be mistyped or go stale (jszip was shown as MIT; its lock entry is "MIT OR
 * GPL-3.0-or-later"). Every other kind has no machine-readable source in the build, so its
 * license is typed here from the component's own shipped license file / banner, or says
 * "not recorded".
 */
export type SbomComponent = Base &
  (
    | (Omit<NoOther, 'pkg'> & { pkg: string | readonly string[]; license?: never })
    | (Omit<NoOther, 'lock'> & { lock: string; license?: never })
    | (Omit<NoOther, 'crate'> & { crate: string | readonly string[]; license?: never })
    | (Omit<NoOther, 'crates'> & { crates: readonly string[]; license?: never })
    | (Omit<NoOther, 'embedded'> & { embedded: string; license: string })
    | (Omit<NoOther, 'built'> & { built: string; license: string })
    | (Omit<NoOther, 'native'> & { native: true; license: string })
    | (Omit<NoOther, 'asset'> & { asset: string; license: string })
  )

export interface SbomGroup {
  category: (typeof SBOM_CATEGORIES)[number]
  /** Small heading suffix, e.g. the bundle a Rust group ships in. */
  note?: string
  components: readonly SbomComponent[]
}

const v = (x: string) => `v${x}`

function crateVersions(name: string): string {
  const parts: string[] = []
  const fork = Object.values(rustLock.forks).find((f) => f.crate === name)
  if (fork) parts.push(`${v(fork.version)} (engine, patched fork)`)
  const bin = SBOM_CRATES[name]
  if (bin) {
    const e = bin.engine?.map(v).join(', ')
    const k = bin.kmip?.map(v).join(', ')
    if (e && k && e === k && !fork) parts.push(e)
    else {
      if (e && !fork) parts.push(`${e} (engine)`)
      if (k) parts.push(`${k} (KMIP)`)
    }
  }
  const lock = (rustLock.unscannable as Record<string, { versions: string[] }>)[name]
  if (lock) parts.push(`${lock.versions.map(v).join(', ')} (Cargo.lock)`)
  return parts.length ? parts.join(' · ') : 'v?'
}

/** "(MIT OR Apache-2.0)" -> "MIT / Apache-2.0": the page's existing style for dual licenses. */
function displayLicense(spdx: string): string {
  return spdx
    .replace(/[()]/g, '')
    .replace(/\s+OR\s+/g, ' / ')
    .trim()
}

/** Union of the SPDX identifiers of the named crates: "Apache-2.0 / BSD-3-Clause / MIT". */
function crateLicenses(names: readonly string[]): string {
  const all = new Set(names.flatMap((n) => SBOM_CRATE_LICENSES[n] ?? ['?']))
  return [...all].sort().join(' / ')
}

/** The license text a row renders: generated for npm rows, typed for everything else. */
export function sbomLicense(c: SbomComponent): string {
  if ('pkg' in c && c.pkg !== undefined) {
    const keys = typeof c.pkg === 'string' ? [c.pkg] : c.pkg
    return [...new Set(keys.map((k) => displayLicense(SBOM_PACKAGE_LICENSES[k] ?? '?')))].join(
      ' / '
    )
  }
  if ('lock' in c && c.lock !== undefined)
    return displayLicense(SBOM_PACKAGE_LICENSES[c.lock] ?? '?')
  if ('crate' in c && c.crate !== undefined)
    return crateLicenses(typeof c.crate === 'string' ? [c.crate] : c.crate)
  if ('crates' in c && c.crates !== undefined) return crateLicenses(c.crates)
  return c.license ?? '?'
}

/**
 * The version text a component renders. Everything is derived; a `?` here
 * means the generated data is missing a key the curated list names, which the
 * generator refuses to emit, so it is unreachable in a shipped build.
 */
export function sbomVersionLabel(c: SbomComponent): string {
  if ('native' in c && c.native) return 'Native'
  if ('pkg' in c && c.pkg !== undefined) {
    const keys = typeof c.pkg === 'string' ? [c.pkg] : c.pkg
    return keys.map((k) => v(SBOM_PACKAGE_VERSIONS[k] ?? '?')).join(' / ')
  }
  if ('lock' in c && c.lock !== undefined)
    return `${v(SBOM_LOCK_VERSIONS[c.lock] ?? '?')} (lockfile)`
  if ('crate' in c && c.crate !== undefined) {
    const names = typeof c.crate === 'string' ? [c.crate] : c.crate
    return names.map(crateVersions).join(' / ')
  }
  if ('crates' in c && c.crates !== undefined) return `${c.crates.length} crates`
  if ('asset' in c && c.asset !== undefined) {
    const a = assetRecords.assets.find((r) => r.key === c.asset)
    return a ? v(a.version) : 'v?'
  }
  if ('embedded' in c && c.embedded !== undefined)
    return v(SBOM_EMBEDDED_VERSIONS[c.embedded] ?? '?')
  if ('built' in c && c.built !== undefined) {
    const b = SBOM_BUILDS[c.built]
    if (!b) return 'built from: unknown'
    const repo = b.repo ? b.repo.split('/').pop() : 'unknown repository'
    return b.commit
      ? `built from ${repo} @ ${b.commit.slice(0, 8)}`
      : `build commit not recorded · sha256 ${b.sha256.slice(0, 8)}`
  }
  return 'v?'
}

/** Link for the row: the row's own, or the exact commit a `built` bundle came from. */
export function sbomHref(c: SbomComponent): string | undefined {
  if (c.href) return c.href
  if ('built' in c && c.built !== undefined) {
    const b = SBOM_BUILDS[c.built]
    if (b?.repo && b.commit) return `https://github.com/${b.repo}/commit/${b.commit}`
  }
  return undefined
}

/** For a `crates` group: the members with their versions, e.g. "der v0.7.10". */
export function sbomGroupMembers(c: SbomComponent): readonly string[] {
  if (!('crates' in c) || c.crates === undefined) return []
  return c.crates.map((n) => `${n} ${crateVersions(n)}`)
}

/**
 * package.json dependencies that are intentionally not on the page, each with
 * the reason. An entry that stops being a dependency, or is also listed, fails
 * the check, so this cannot rot into a silent allow-list.
 */
export const SBOM_EXCLUDED: Readonly<Record<string, string>> = {
  '@peculiar/asn1-x509-post-quantum':
    'declared in package.json, imported by no shipped code (named only in a comment in certBuilder.ts)',
  'ed25519-hd-key':
    'declared in package.json, imported by no shipped code (named only in teaching copy)',
  'micro-eth-signer':
    'declared in package.json, imported by no shipped code (named only in teaching copy)',
  'ajv-formats':
    'dev-only companion of ajv (a test/script dependency); imported by no shipped code',
  'pdf-parse': 'imported by no shipped code (repository scripts only)',
  '@eslint/js': 'lint rules; ships nothing',
  'eslint-config-prettier': 'lint rules; ships nothing',
  'eslint-plugin-jsx-a11y': 'lint rules; ships nothing',
  'eslint-plugin-react-hooks': 'lint rules; ships nothing',
  'eslint-plugin-react-refresh': 'lint rules; ships nothing',
  'eslint-plugin-security': 'lint rules; ships nothing',
  'eslint-plugin-testing-library': 'lint rules; ships nothing',
  'eslint-plugin-unused-imports': 'lint rules; ships nothing',
  globals: 'lint configuration data; ships nothing',
  'typescript-eslint': 'lint rules; ships nothing',
  acorn: 'development-time only: imported by no shipped code',
  daff: 'development-time only: imported by no shipped code',
  entities: 'development-time only: imported by no shipped code',
  'ts-morph': 'development-time only: imported by no shipped code',
  '@types/dagre': 'type declarations only; no code is shipped',
  '@types/file-saver': 'type declarations only; no code is shipped',
  '@types/jsdom': 'type declarations only; no code is shipped',
  '@types/lodash': 'type declarations only; no code is shipped',
  '@types/node': 'type declarations only; no code is shipped',
  '@types/papaparse': 'type declarations only; no code is shipped',
  '@types/pdf-parse': 'type declarations only; no code is shipped',
  '@types/react': 'type declarations only; no code is shipped',
  '@types/react-dom': 'type declarations only; no code is shipped',
  '@types/three': 'type declarations only; no code is shipped',
}

/** Groups in the order the desktop accordion renders them (Rust groups last). */
export const SBOM_GROUPS: readonly SbomGroup[] = [
  {
    category: SBOM_CATEGORIES[0],
    components: [
      { name: 'React', pkg: 'react' },
      { name: 'React DOM', pkg: 'react-dom' },
      { name: 'Framer Motion', pkg: 'framer-motion' },
      { name: 'Lucide React', pkg: 'lucide-react' },
      { name: 'Tailwind CSS', pkg: 'tailwindcss' },
      { name: 'clsx', pkg: 'clsx' },
      { name: 'tailwind-merge', pkg: 'tailwind-merge' },
      { name: 'class-variance-authority', pkg: 'class-variance-authority' },
      { name: 'React Router', pkg: 'react-router' },
      { name: '@xyflow/react', pkg: '@xyflow/react' },
      { name: 'dagre (graph layout)', pkg: 'dagre' },
      { name: 'three (3D graphics)', pkg: 'three' },
      { name: '@tanstack/react-virtual', pkg: '@tanstack/react-virtual' },
      { name: 'React Markdown', pkg: 'react-markdown' },
      { name: 'remark-gfm', pkg: 'remark-gfm' },
      { name: 'React Focus Lock', pkg: 'react-focus-lock' },
      {
        name: 'Inter (typeface)',
        license: 'SIL Open Font License 1.1',
        asset: 'inter-font',
        href: 'https://github.com/rsms/inter',
      },
      { name: '@monaco-editor/react (code editor)', pkg: '@monaco-editor/react' },
      {
        name: 'monaco-editor (bundled with the code editor)',
        lock: 'monaco-editor',
      },
    ],
  },
  {
    category: SBOM_CATEGORIES[1],
    components: [
      { name: 'localforage', pkg: 'localforage' },
      { name: 'jszip', pkg: 'jszip' },
      { name: 'file-saver', pkg: 'file-saver' },
      { name: 'papaparse', pkg: 'papaparse' },
      { name: 'minisearch', pkg: 'minisearch' },
      { name: 'recharts', pkg: 'recharts' },
      { name: 'mermaid', pkg: 'mermaid' },
      { name: 'jspdf + jspdf-autotable', pkg: ['jspdf', 'jspdf-autotable'] },
      { name: 'docx', pkg: 'docx' },
      { name: 'cborg', pkg: 'cborg' },
      { name: 'lodash', pkg: 'lodash' },
      { name: 'reflect-metadata', pkg: 'reflect-metadata' },
      { name: 'Pyodide (Python runtime, self-hosted)', pkg: 'pyodide' },
      {
        name: 'Python (CPython, inside the Pyodide runtime)',
        license: "Python Software Foundation (per the runtime's copyright banner)",
        embedded: 'python',
        note: "The site serves only the Pyodide core and standard library; none of the 343 Python packages in Pyodide's lock file is served.",
      },
    ],
  },
  {
    category: SBOM_CATEGORIES[2],
    components: [
      { name: 'OpenSSL WASM (OpenSSL Studio)', license: 'Apache-2.0', embedded: 'openssl' },
      {
        name: 'pkcs11-provider (OpenSSL PKCS#11 provider, inside OpenSSL Studio)',
        license: 'Apache-2.0',
        embedded: 'pkcs11-provider',
      },
      { name: 'Web Crypto API (X25519, P-256)', license: 'W3C', native: true },
      { name: '@oqs/liboqs-js', pkg: '@oqs/liboqs-js' },
      { name: '@noble/hashes', pkg: '@noble/hashes' },
      { name: '@noble/curves', pkg: '@noble/curves' },
      {
        name: '@noble/post-quantum (ML-DSA-65 attestation)',
        pkg: '@noble/post-quantum',
      },
      { name: '@peculiar/x509', pkg: '@peculiar/x509' },
      { name: '@scure/bip32', pkg: '@scure/bip32' },
      { name: '@scure/bip39', pkg: '@scure/bip39' },
      { name: '@scure/base', pkg: '@scure/base' },
      { name: '@peculiar/asn1-schema', pkg: '@peculiar/asn1-schema' },
      { name: '@peculiar/asn1-x509', pkg: '@peculiar/asn1-x509' },
      { name: '@peculiar/asn1-cms', pkg: '@peculiar/asn1-cms' },
      {
        name: '@pqctoday/softhsm-wasm (npm wrapper of the SoftHSM engines)',
        pkg: '@pqctoday/softhsm-wasm',
      },
      {
        name: 'softhsmv3 (PKCS#11 v3.2 engine, C++ / WASM)',
        license: 'BSD-2-Clause',
        built: 'softhsm-cpp-engine',
        note: 'Contains OpenSSL code; the OpenSSL version is not embedded in the binary.',
      },
      {
        name: 'softhsmrustv3 (PKCS#11 v3.2 engine, Rust / WASM)',
        license: 'BSD-2-Clause',
        built: 'softhsmrustv3-engine',
      },
      {
        name: 'pqctoday-kmip (CACP KMIP 3.0 control plane, Rust / WASM)',
        license: 'MIT',
        built: 'cacp-kmip',
      },
      {
        name: 'pqctoday-tpm (TCG V1.85 PQC TPM emulator, WASM)',
        license: 'BSD-3-Clause',
        built: 'pqctoday-tpm',
        note: 'Contains libtpms and OpenSSL code; neither version is embedded in the binary.',
      },
      {
        name: 'OpenSSH server (PKCS#11 build, WASM)',
        license: 'BSD-style (OpenSSH LICENCE)',
        built: 'openssh-pkcs11',
        note: 'Contains OpenSSL code; the OpenSSL version is not embedded in the binary.',
      },
      { name: 'strongSwan (IKEv2 / VPN, WASM)', license: 'not recorded', embedded: 'strongswan' },
      { name: 'LMS/HSS hash-based signature module (WASM)', license: 'not recorded', built: 'lms' },
      {
        name: 'NIST SP 800-90B EntropyAssessment (WASM estimators)',
        license: 'NIST software notice (public domain in the US)',
        href: 'https://github.com/usnistgov/SP800-90B_EntropyAssessment/commit/87c104d0ed4cbc96103e7b8b38d6f2c7e0a6b289',
        embedded: 'entropy90b.tool',
      },
      {
        name: 'bzip2 (SP 800-90B build)',
        license: 'bzip2 (BSD-style)',
        embedded: 'entropy90b.bzip2',
      },
      {
        name: 'libdivsufsort (SP 800-90B build)',
        license: 'MIT',
        embedded: 'entropy90b.libdivsufsort',
      },
      { name: 'JsonCpp (SP 800-90B build)', license: 'MIT', embedded: 'entropy90b.jsoncpp' },
      {
        name: 'OpenSSL libcrypto (SP 800-90B build, per BUILDINFO.json)',
        license: 'Apache-2.0',
        embedded: 'entropy90b.openssl',
      },
    ],
  },
  {
    category: SBOM_CATEGORIES[5],
    components: [
      {
        name: '@mlc-ai/web-llm (in-browser Qwen 3 8B)',
        pkg: '@mlc-ai/web-llm',
      },
      {
        name: '@huggingface/transformers (bge-base-en-v1.5 embeddings)',
        pkg: '@huggingface/transformers',
      },
      { name: '@react-oauth/google', pkg: '@react-oauth/google' },
    ],
  },
  {
    category: SBOM_CATEGORIES[6],
    components: [{ name: 'Zustand', pkg: 'zustand' }],
  },
  {
    category: SBOM_CATEGORIES[7],
    components: [{ name: 'React GA4', pkg: 'react-ga4' }],
  },
  {
    category: SBOM_CATEGORIES[8],
    components: [{ name: 'React Hot Toast', pkg: 'react-hot-toast' }],
  },
  {
    category: SBOM_CATEGORIES[9],
    components: [
      { name: 'Vite', pkg: 'vite' },
      { name: '@vitejs/plugin-react', pkg: '@vitejs/plugin-react' },
      { name: '@tailwindcss/vite', pkg: '@tailwindcss/vite' },
      { name: 'vite-plugin-wasm', pkg: 'vite-plugin-wasm' },
      { name: 'vite-plugin-top-level-await', pkg: 'vite-plugin-top-level-await' },
      { name: 'TypeScript', pkg: 'typescript' },
      { name: 'tsx', pkg: 'tsx' },
      { name: 'ESLint', pkg: 'eslint' },
      { name: 'Prettier', pkg: 'prettier' },
      { name: 'Husky', pkg: 'husky' },
      { name: 'lint-staged', pkg: 'lint-staged' },
      { name: 'vite-plugin-pwa', pkg: 'vite-plugin-pwa' },
    ],
  },
  {
    category: SBOM_CATEGORIES[10],
    components: [
      { name: 'Vitest', pkg: 'vitest' },
      { name: '@vitest/coverage-v8', pkg: '@vitest/coverage-v8' },
      { name: 'jsdom', pkg: 'jsdom' },
      { name: 'Playwright', pkg: '@playwright/test' },
      { name: 'Testing Library (React)', pkg: '@testing-library/react' },
      { name: 'Testing Library (jest-dom)', pkg: '@testing-library/jest-dom' },
      { name: 'Testing Library (user-event)', pkg: '@testing-library/user-event' },
      { name: 'axe-playwright (Accessibility)', pkg: 'axe-playwright' },
      { name: 'ajv (JSON Schema, test cross-check)', pkg: 'ajv' },
    ],
  },
  {
    category: SBOM_CATEGORIES[3],
    note: '(softhsmrustv3 engine + KMIP control plane bundles)',
    components: [
      { name: 'wasm-bindgen', crate: 'wasm-bindgen' },
      { name: 'js-sys', crate: 'js-sys' },
      {
        name: 'console_error_panic_hook',
        crate: 'console_error_panic_hook',
      },
      { name: 'getrandom', crate: 'getrandom' },
    ],
  },
  {
    category: SBOM_CATEGORIES[4],
    note: '(softhsmrustv3 engine + KMIP control plane bundles)',
    components: [
      { name: 'fips204 (ML-DSA)', crate: 'fips204' },
      { name: 'fips205 (SLH-DSA)', crate: 'fips205' },
      { name: 'ml-kem', crate: 'ml-kem' },
      { name: 'frodo-kem', crate: 'frodo-kem' },
      {
        name: 'classic-mceliece-multi (fork, all 10 parameter sets)',
        crate: 'classic-mceliece-multi',
      },
      { name: 'xmss (XMSS / XMSS-MT)', crate: 'xmss' },
      { name: 'hbs-lms (LMS/HSS)', crate: 'hbs-lms' },
      { name: 'ed25519-dalek', crate: 'ed25519-dalek' },
      { name: 'ed448-goldilocks', crate: 'ed448-goldilocks' },
      { name: 'x448', crate: 'x448' },
      { name: 'rsa', crate: 'rsa' },
      { name: 'k256 (secp256k1)', crate: 'k256' },
      { name: 'p256 / p384 / p521', crate: ['p256', 'p384', 'p521'] },
      { name: 'ecdsa', crate: 'ecdsa' },
      {
        name: 'aes / aes-gcm / aes-kw / ctr / cmac',
        crate: ['aes', 'aes-gcm', 'aes-kw', 'ctr', 'cmac'],
      },
      { name: 'cbc', crate: 'cbc' },
      { name: 'xts-mode', crate: 'xts-mode' },
      { name: 'chacha20poly1305', crate: 'chacha20poly1305' },
      { name: 'sha2', crate: 'sha2' },
      { name: 'sha3', crate: 'sha3' },
      { name: 'tiny-keccak (Keccak-256)', crate: 'tiny-keccak' },
      { name: 'hmac / hkdf / pbkdf2', crate: ['hmac', 'hkdf', 'pbkdf2'] },
      { name: 'md-5 / sha1 / ripemd', crate: ['md-5', 'sha1', 'ripemd'] },
      { name: 'sp800-185 (cSHAKE / KMAC)', crate: 'sp800-185' },
      { name: 'pkcs8 / spki', crate: ['pkcs8', 'spki'] },
      { name: 'signature', crate: 'signature' },
      { name: 'rand', crate: 'rand' },
      { name: 'tinyvec', crate: 'tinyvec' },
      {
        name: 'RustCrypto traits and primitives (supporting)',
        crates: [
          'aead',
          'block-buffer',
          'block-padding',
          'chacha20',
          'cipher',
          'ctutils',
          'dbl',
          'digest',
          'generic-array',
          'hybrid-array',
          'keccak',
          'poly1305',
          'ppv-lite86',
          'rand_chacha',
          'rand_core',
          'sponge-cursor',
          'subtle',
          'universal-hash',
        ],
      },
      {
        name: 'Curve and big-integer arithmetic (supporting)',
        crates: [
          'crypto-bigint',
          'curve25519-dalek',
          'ed25519',
          'ed448',
          'elliptic-curve',
          'num-bigint',
          'num-bigint-dig',
          'num-integer',
          'primeorder',
          'rfc6979',
          'sec1',
        ],
      },
      {
        name: 'ASN.1 and X.509 parsing (supporting, KMIP bundle)',
        crates: [
          'asn1-rs',
          'const-oid',
          'data-encoding',
          'der',
          'der-parser',
          'nom',
          'x509-cert',
          'x509-parser',
        ],
      },
      {
        name: 'Serialization and utilities (supporting)',
        crates: [
          'byteorder',
          'bytes',
          'hashbrown',
          'indexmap',
          'itoa',
          'once_cell',
          'serde',
          'serde_core',
          'serde_json',
          'serde_yaml',
          'smallvec',
          'spin',
          'time',
          'unsafe-libyaml',
          'uuid',
        ],
      },
    ],
  },
]
