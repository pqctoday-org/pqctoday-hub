// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sample SBOMs for the SBOM -> CBOM mapper tool.
 * Intentionally simplified for teaching; not full spec-compliant documents.
 */

export interface SampleSBOM {
  id: string
  format: 'CycloneDX' | 'SPDX'
  filename: string
  description: string
  content: string // raw JSON string
}

const cyclonedxPayments = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: 'urn:uuid:c4a5c8f3-8a2b-4c6f-9e8d-0f1a2b3c4d5e',
  version: 1,
  metadata: {
    timestamp: '2026-04-15T08:00:00Z',
    component: { type: 'application', name: 'payments-service', version: '2.4.1' },
  },
  components: [
    { type: 'library', name: 'openssl', version: '1.1.1w', purl: 'pkg:generic/openssl@1.1.1w' },
    {
      type: 'library',
      name: 'bcprov-jdk18on',
      version: '1.78',
      purl: 'pkg:maven/org.bouncycastle/bcprov-jdk18on@1.78',
    },
    {
      type: 'library',
      name: 'bcprov-fips',
      version: '2.0.0',
      purl: 'pkg:maven/org.bouncycastle/bc-fips@2.0.0',
    },
    {
      type: 'library',
      name: 'netty-handler',
      version: '4.1.105.Final',
      purl: 'pkg:maven/io.netty/netty-handler@4.1.105.Final',
    },
    {
      type: 'library',
      name: 'pycryptodome',
      version: '3.20.0',
      purl: 'pkg:pypi/pycryptodome@3.20.0',
    },
  ],
}

const cyclonedxEdge = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: 'urn:uuid:a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  version: 1,
  metadata: {
    timestamp: '2026-04-17T12:30:00Z',
    component: { type: 'application', name: 'edge-gateway', version: '1.9.0' },
  },
  components: [
    { type: 'library', name: 'openssl', version: '3.5.0', purl: 'pkg:generic/openssl@3.5.0' },
    {
      type: 'library',
      name: 'boringssl',
      version: '20250310',
      purl: 'pkg:generic/boringssl@20250310',
    },
    { type: 'library', name: 'liboqs', version: '0.12.0', purl: 'pkg:generic/liboqs@0.12.0' },
    { type: 'library', name: 'aws-lc', version: '1.38.0', purl: 'pkg:generic/aws-lc@1.38.0' },
    { type: 'library', name: 'mbedtls', version: '3.6.2', purl: 'pkg:generic/mbedtls@3.6.2' },
  ],
}

export const SAMPLE_SBOMS: SampleSBOM[] = [
  {
    id: 'sbom-payments',
    format: 'CycloneDX',
    filename: 'payments-service-2.4.1.cdx.json',
    description:
      'A regulated payments service. Mixes a legacy OpenSSL 1.1.1 (EoL), a non-FIPS Bouncy Castle, and BC-FIPS. The CBOM output should surface the crypto-debt.',
    content: JSON.stringify(cyclonedxPayments, null, 2),
  },
  {
    id: 'sbom-edge',
    format: 'CycloneDX',
    filename: 'edge-gateway-1.9.0.cdx.json',
    description:
      'A modern edge service. OpenSSL 3.5 LTS, BoringSSL snapshot, liboqs, aws-lc, Mbed TLS. CBOM should flag liboqs + Mbed TLS as not inside a FIPS boundary.',
    content: JSON.stringify(cyclonedxEdge, null, 2),
  },
]
