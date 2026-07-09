// SPDX-License-Identifier: GPL-3.0-only
/**
 * Small local sample set for the SBOM Format Explorer workshop step —
 * deliberately generic software components (not cryptographic assets, which
 * are @/data/cryptoEstate's job for the CBOM module's Format Chooser).
 */
export interface SampleComponent {
  id: string
  name: string
  version: string
  supplier: string
  license: string
  purl: string
  hash: string
  dependsOn?: string
}

export const SAMPLE_COMPONENTS: SampleComponent[] = [
  {
    id: 'pkg-express',
    name: 'express',
    version: '4.19.2',
    supplier: 'OpenJS Foundation',
    license: 'MIT',
    purl: 'pkg:npm/express@4.19.2',
    hash: 'sha256:3af12b8b2e...',
    dependsOn: 'payments-service',
  },
  {
    id: 'pkg-pg',
    name: 'pg',
    version: '8.11.5',
    supplier: 'node-postgres',
    license: 'MIT',
    purl: 'pkg:npm/pg@8.11.5',
    hash: 'sha256:9d4e6f11a0...',
    dependsOn: 'payments-service',
  },
  {
    id: 'pkg-openssl',
    name: 'openssl',
    version: '3.0.13',
    supplier: 'OpenSSL Project',
    license: 'Apache-2.0',
    purl: 'pkg:generic/openssl@3.0.13',
    hash: 'sha256:1a2e7d4c88...',
    dependsOn: 'express',
  },
]

export const SBOM_DOCUMENT_META = {
  documentName: 'payments-service-1.4.0.sbom',
  createdBy: 'Tool: cdxgen-10.4.0',
  created: '2026-06-30T09:15:00Z',
}
