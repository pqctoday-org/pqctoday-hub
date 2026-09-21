// SPDX-License-Identifier: GPL-3.0-only
//
// The curated Software Bill of Materials the About page renders (SbomSection.tsx).
//
// This file is the editorial half: WHICH components appear, under which of the
// SBOM_CATEGORIES headings, with which license, link and note. It is
// hand-maintained on purpose — the list is a statement about what this app is
// built from, not a dump of package-lock.json.
//
// The VERSION column is not hand-maintained. Every entry that is a direct npm
// dependency names its package.json key in `pkg`, and the version shown is
// read from src/data/sbomVersions.generated.ts, which
// scripts/gen-sbom-versions.mjs regenerates from package.json on every build
// (and CI checks for staleness). A dependency bump therefore updates the page
// by itself; there is no second copy of the version to forget. Before this
// (2026-08-09) eleven hand-typed versions were wrong in both directions, and a
// hand-edit that tried to keep up (PR #598) blanked five component names.
//
// Entries with no `pkg` are not direct npm dependencies — Rust crates compiled
// into the WASM engine, the OpenSSL WASM build, the engine bundles vendored
// under src/vendor, the browser's own Web Crypto API — and keep a hand-typed
// `version`. Exactly one of `pkg` / `version` is set per entry.
import { SBOM_CATEGORIES } from './sbomCategories'
import { SBOM_PACKAGE_VERSIONS } from './sbomVersions.generated'

export type SbomComponent = {
  /** Display name — may be prose ("React Router") rather than the package name. */
  name: string
  license: string
  /** Optional release / project link rendered on the name. */
  href?: string
} & (
  | {
      /**
       * package.json key(s) this entry ships from. Two keys render as
       * "vA / vB" (one row for a library and its companion plugin).
       */
      pkg: string | readonly string[]
      version?: never
    }
  | {
      /** Hand-typed version text for anything that is not a direct npm dependency. */
      version: string
      pkg?: never
    }
)

export interface SbomGroup {
  category: (typeof SBOM_CATEGORIES)[number]
  /** Small heading suffix, e.g. the engine crate version a Rust group ships in. */
  note?: string
  components: readonly SbomComponent[]
}

/**
 * The version text a component renders. Derived for direct dependencies;
 * verbatim for everything else. A `pkg` key the generated map does not carry
 * is a build defect (gen-sbom-versions.mjs refuses to emit when the curated
 * list names a package that is not a direct dependency), so the fallback
 * below is belt-and-braces for tests that stub the generated module, not a
 * path a shipped build can reach.
 */
export function sbomVersionLabel(c: SbomComponent): string {
  if (c.pkg === undefined) return c.version
  const keys = typeof c.pkg === 'string' ? [c.pkg] : c.pkg
  return keys.map((k) => `v${SBOM_PACKAGE_VERSIONS[k] ?? '?'}`).join(' / ')
}

/** Groups in the order the desktop accordion renders them (Rust groups last). */
export const SBOM_GROUPS: readonly SbomGroup[] = [
  {
    category: SBOM_CATEGORIES[0],
    components: [
      { name: 'React', license: 'MIT', pkg: 'react' },
      { name: 'Framer Motion', license: 'MIT', pkg: 'framer-motion' },
      { name: 'Lucide React', license: 'ISC', pkg: 'lucide-react' },
      { name: 'Tailwind CSS', license: 'MIT', pkg: 'tailwindcss' },
      { name: 'clsx', license: 'MIT', pkg: 'clsx' },
      { name: 'tailwind-merge', license: 'MIT', pkg: 'tailwind-merge' },
      { name: 'class-variance-authority', license: 'Apache-2.0', pkg: 'class-variance-authority' },
      { name: 'React Router', license: 'MIT', pkg: 'react-router' },
      { name: '@xyflow/react', license: 'MIT', pkg: '@xyflow/react' },
      { name: 'dagre (graph layout)', license: 'MIT', pkg: 'dagre' },
      { name: '@tanstack/react-virtual', license: 'MIT', pkg: '@tanstack/react-virtual' },
      { name: 'React Markdown', license: 'MIT', pkg: 'react-markdown' },
      { name: 'remark-gfm', license: 'MIT', pkg: 'remark-gfm' },
      { name: 'React Focus Lock', license: 'MIT', pkg: 'react-focus-lock' },
    ],
  },
  {
    category: SBOM_CATEGORIES[1],
    components: [
      { name: 'localforage', license: 'Apache-2.0', pkg: 'localforage' },
      { name: 'jszip', license: 'MIT', pkg: 'jszip' },
      { name: 'file-saver', license: 'MIT', pkg: 'file-saver' },
      { name: 'papaparse', license: 'MIT', pkg: 'papaparse' },
      { name: 'pdf-parse', license: 'MIT', pkg: 'pdf-parse' },
      { name: 'minisearch', license: 'MIT', pkg: 'minisearch' },
      { name: 'recharts', license: 'MIT', pkg: 'recharts' },
      { name: 'mermaid', license: 'MIT', pkg: 'mermaid' },
      { name: 'jspdf + jspdf-autotable', license: 'MIT', pkg: ['jspdf', 'jspdf-autotable'] },
      { name: 'docx', license: 'MIT', pkg: 'docx' },
      { name: 'cborg', license: 'Apache-2.0', pkg: 'cborg' },
      { name: 'lodash', license: 'MIT', pkg: 'lodash' },
      { name: 'ajv (JSON Schema / CBOM validation)', license: 'MIT', pkg: 'ajv' },
      { name: 'ajv-formats', license: 'MIT', pkg: 'ajv-formats' },
      { name: 'reflect-metadata', license: 'Apache-2.0', pkg: 'reflect-metadata' },
    ],
  },
  {
    category: SBOM_CATEGORIES[2],
    components: [
      { name: 'OpenSSL WASM', license: 'Apache-2.0', version: 'v3.6.1' },
      { name: 'Web Crypto API (X25519, P-256)', license: 'W3C', version: 'Native' },
      { name: '@oqs/liboqs-js', license: 'MIT', pkg: '@oqs/liboqs-js' },
      { name: '@noble/hashes', license: 'MIT', pkg: '@noble/hashes' },
      { name: '@noble/curves', license: 'MIT', pkg: '@noble/curves' },
      {
        name: '@noble/post-quantum (ML-DSA-65 attestation)',
        license: 'MIT',
        pkg: '@noble/post-quantum',
      },
      { name: '@peculiar/x509', license: 'MIT', pkg: '@peculiar/x509' },
      { name: '@scure/bip32', license: 'MIT', pkg: '@scure/bip32' },
      { name: '@scure/bip39', license: 'MIT', pkg: '@scure/bip39' },
      { name: '@scure/base', license: 'MIT', pkg: '@scure/base' },
      { name: 'micro-eth-signer', license: 'MIT', pkg: 'micro-eth-signer' },
      { name: 'ed25519-hd-key', license: 'MIT', pkg: 'ed25519-hd-key' },
      { name: '@peculiar/asn1-schema', license: 'MIT', pkg: '@peculiar/asn1-schema' },
      { name: '@peculiar/asn1-x509', license: 'MIT', pkg: '@peculiar/asn1-x509' },
      {
        name: '@peculiar/asn1-x509-post-quantum',
        license: 'MIT',
        pkg: '@peculiar/asn1-x509-post-quantum',
      },
      { name: '@peculiar/asn1-cms', license: 'MIT', pkg: '@peculiar/asn1-cms' },
      {
        name: 'softhsmv3',
        license: 'BSD-2-Clause',
        version:
          'v0.10.0 — native PKCS#11 v3.2 C-ABI 315/315, KMIP CACP control plane, Ed25519 + classical X25519/X448 KEM, crypto-agility policies',
        href: 'https://github.com/pqctoday-org/pqctoday-hsm/releases/tag/v0.10.0',
      },
      {
        name: 'pqctoday-kmip (CACP control plane)',
        license: 'MIT',
        version:
          'v0.10.0 — in-browser KMIP 3.0 crypto-agility control plane (label-only migration, rekey-on-use, run_batch, policies, dry-run, audit)',
        href: 'https://github.com/pqctoday-org/pqctoday-hsm/releases/tag/v0.10.0',
      },
      {
        name: 'pqctoday-tpm',
        license: 'BSD-3-Clause',
        version:
          'v0.3.0 — TCG V1.85 PQC TPM emulator (fork of swtpm + libtpms); ML-KEM-768 + ML-DSA-65 command codes 0x1a3-0x1aa, Emscripten WASM',
        href: 'https://github.com/pqctoday-org/pqctoday-tpm/releases/tag/v0.3.0',
      },
    ],
  },
  {
    category: SBOM_CATEGORIES[5],
    components: [
      {
        name: '@mlc-ai/web-llm (in-browser Qwen 3 8B)',
        license: 'Apache-2.0',
        pkg: '@mlc-ai/web-llm',
      },
      {
        name: '@huggingface/transformers (bge-small embeddings)',
        license: 'Apache-2.0',
        pkg: '@huggingface/transformers',
      },
      { name: '@react-oauth/google', license: 'MIT', pkg: '@react-oauth/google' },
    ],
  },
  {
    category: SBOM_CATEGORIES[6],
    components: [{ name: 'Zustand', license: 'MIT', pkg: 'zustand' }],
  },
  {
    category: SBOM_CATEGORIES[7],
    components: [{ name: 'React GA4', license: 'MIT', pkg: 'react-ga4' }],
  },
  {
    category: SBOM_CATEGORIES[8],
    components: [{ name: 'React Hot Toast', license: 'MIT', pkg: 'react-hot-toast' }],
  },
  {
    category: SBOM_CATEGORIES[9],
    components: [
      { name: 'Vite', license: 'MIT', pkg: 'vite' },
      { name: 'TypeScript', license: 'Apache-2.0', pkg: 'typescript' },
      { name: 'tsx', license: 'MIT', pkg: 'tsx' },
      { name: 'ESLint', license: 'MIT', pkg: 'eslint' },
      { name: 'Prettier', license: 'MIT', pkg: 'prettier' },
      { name: 'Husky', license: 'MIT', pkg: 'husky' },
      { name: 'vite-plugin-pwa', license: 'MIT', pkg: 'vite-plugin-pwa' },
    ],
  },
  {
    category: SBOM_CATEGORIES[10],
    components: [
      { name: 'Vitest', license: 'MIT', pkg: 'vitest' },
      { name: 'Playwright', license: 'Apache-2.0', pkg: '@playwright/test' },
      { name: 'Testing Library (React)', license: 'MIT', pkg: '@testing-library/react' },
      { name: 'axe-playwright (Accessibility)', license: 'MIT', pkg: 'axe-playwright' },
    ],
  },
  {
    category: SBOM_CATEGORIES[3],
    note: '(softhsmrustv3 v0.4.23)',
    components: [
      { name: 'wasm-bindgen', license: 'MIT / Apache-2.0', version: 'v0.2.117' },
      { name: 'js-sys', license: 'MIT / Apache-2.0', version: 'v0.3.69' },
      { name: 'web-sys', license: 'MIT / Apache-2.0', version: 'v0.3.69' },
      { name: 'getrandom', license: 'MIT / Apache-2.0', version: 'v0.2.17' },
      { name: 'console_error_panic_hook', license: 'MIT / Apache-2.0', version: 'v0.1.7' },
    ],
  },
  {
    category: SBOM_CATEGORIES[4],
    note: '(softhsmrustv3 v0.4.23)',
    components: [
      { name: 'ml-kem', license: 'MIT / Apache-2.0', version: 'v0.2.3' },
      { name: 'ml-dsa', license: 'MIT / Apache-2.0', version: 'v0.1.0-rc.7' },
      { name: 'slh-dsa', license: 'MIT / Apache-2.0', version: 'v0.2.0-rc.4' },
      { name: 'ed25519-dalek', license: 'BSD-3-Clause', version: 'v2.1' },
      { name: 'x25519-dalek', license: 'BSD-3-Clause', version: 'v2.0' },
      { name: 'p256', license: 'MIT / Apache-2.0', version: 'v0.13' },
      { name: 'p384', license: 'MIT / Apache-2.0', version: 'v0.13' },
      { name: 'p521', license: 'MIT / Apache-2.0', version: 'v0.13' },
      { name: 'rsa', license: 'MIT / Apache-2.0', version: 'v0.9' },
      {
        name: 'aes / aes-gcm / aes-kw',
        license: 'MIT / Apache-2.0',
        version: 'v0.8 / v0.10 / v0.2',
      },
      { name: 'cbc / ctr', license: 'MIT / Apache-2.0', version: 'v0.1.2 / v0.9.2' },
      { name: 'sha2 / sha3', license: 'MIT / Apache-2.0', version: 'v0.10.8' },
      {
        name: 'hmac / pbkdf2 / hkdf',
        license: 'MIT / Apache-2.0',
        version: 'v0.12 / v0.12 / v0.12',
      },
      { name: 'pkcs8 / spki', license: 'MIT / Apache-2.0', version: 'v0.11-rc / v0.8-rc' },
      { name: 'signature', license: 'MIT / Apache-2.0', version: 'v3.0.0-rc.10' },
      { name: 'rand', license: 'MIT / Apache-2.0', version: 'v0.8.5' },
      { name: 'k256 (secp256k1)', license: 'MIT / Apache-2.0', version: 'v0.13.4' },
      { name: 'x448', license: 'MIT / Apache-2.0', version: 'v0.14.0-pre.8' },
      { name: 'hbs-lms (LMS/HSS)', license: 'Apache-2.0', version: 'v0.1.1' },
      { name: 'tiny-keccak (Keccak-256)', license: 'CC0-1.0', version: 'v2.0.2' },
      { name: 'tinyvec', license: 'MIT / Apache-2.0 / Zlib', version: 'v1.11.0' },
    ],
  },
]
