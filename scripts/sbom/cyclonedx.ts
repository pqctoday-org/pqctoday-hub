// SPDX-License-Identifier: GPL-3.0-only
/**
 * Builds the complete, machine-readable SBOM (CycloneDX) that the About page's curated rows
 * summarise. Everything in it was derived by derive.ts from the shipped build; this module only
 * shapes it. The output is deterministic (no timestamp; the serial number is a hash of the
 * content) so the committed file can be compared byte-for-byte by the check.
 */
import { createHash } from 'node:crypto'

export interface CdxLicenseInput {
  spdx: string
}

export interface CdxComponent {
  type: 'library' | 'application' | 'data' | 'machine-learning-model' | 'framework'
  name: string
  version?: string
  purl?: string
  licenses?: unknown[]
  hashes?: { alg: string; content: string }[]
  externalReferences?: { type: string; url: string }[]
  properties: { name: string; value: string }[]
}

/** SPDX expression -> CycloneDX license choice. */
export function cdxLicense(spdx: string): unknown[] {
  const s = spdx.trim()
  if (!s || /^(not recorded|not declared|\?)$/i.test(s))
    return [{ license: { name: 'not recorded' } }]
  // "MIT / Apache-2.0" is this project's display form of the SPDX expression "MIT OR Apache-2.0"
  if (/\s\/\s/.test(s)) return [{ expression: s.split(/\s\/\s/).join(' OR ') }]
  if (/\s(OR|AND|WITH)\s|[()]/.test(s)) return [{ expression: s }]
  if (/^[A-Za-z0-9.+-]+$/.test(s)) return [{ license: { id: s } }]
  return [{ license: { name: s } }]
}

export function npmPurl(name: string, version: string): string {
  return `pkg:npm/${name.startsWith('@') ? `%40${name.slice(1)}` : name}@${version}`
}

/** "sha512-<base64>" from a lockfile -> CycloneDX hash, or undefined. */
export function integrityHash(integrity: string | undefined) {
  const m = /^sha512-(.+)$/.exec(integrity ?? '')
  return m ? { alg: 'SHA-512', content: Buffer.from(m[1], 'base64').toString('hex') } : undefined
}

function uuidFrom(content: string): string {
  const h = createHash('sha256').update(content).digest('hex')
  // RFC 4122 layout with version 5 / variant bits, so it is a well-formed UUID.
  const v = `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${h.slice(18, 20)}-${h.slice(20, 32)}`
  return `urn:uuid:${v}`
}

export function buildCycloneDx(input: {
  app: { name: string; version: string }
  components: CdxComponent[]
}) {
  const components = [...input.components].sort(
    (a, b) =>
      a.type.localeCompare(b.type) ||
      a.name.localeCompare(b.name) ||
      (a.version ?? '').localeCompare(b.version ?? '')
  )
  const doc = {
    bomFormat: 'CycloneDX',
    specVersion: '1.7',
    version: 1,
    metadata: {
      component: { type: 'application', name: input.app.name, version: input.app.version },
      properties: [
        {
          name: 'pqctoday:scope',
          value:
            'Software the site ships or downloads at run time: npm packages bundled into the production build, Rust crates and libraries compiled into the served WebAssembly, fonts, and AI models fetched by the browser.',
        },
        {
          name: 'pqctoday:generated-by',
          value: 'scripts/gen-sbom-versions.ts (npm run gen:sbom-versions); not signed',
        },
        {
          name: 'pqctoday:evidence',
          value:
            "Each component names how it was established: the production build's emitted chunks, the served binaries, their shipped build records, package-lock.json, or a dated read of a model repository.",
        },
      ],
    },
    components,
  }
  const serialNumber = uuidFrom(JSON.stringify(doc))
  return {
    bomFormat: doc.bomFormat,
    specVersion: doc.specVersion,
    serialNumber,
    version: doc.version,
    metadata: doc.metadata,
    components: doc.components,
  }
}
