// SPDX-License-Identifier: AGPL-3.0-only
import {
  DEFAULT_CLIENT_CERT,
  DEFAULT_CLIENT_KEY,
  DEFAULT_SERVER_CERT,
  DEFAULT_SERVER_KEY,
  DEFAULT_ROOT_CA,
  DEFAULT_MLDSA_ROOT_CA,
  DEFAULT_MLDSA_CLIENT_CERT,
  DEFAULT_MLDSA_SERVER_CERT,
  DEFAULT_MLDSA87_ROOT_CA,
  DEFAULT_MLDSA87_CLIENT_CERT,
  DEFAULT_MLDSA87_SERVER_CERT,
} from './defaultCertificates'
import type { TLSConfig } from '@/store/tls-learning.store'

/** Exact bundled identities only. Unknown certificates never imply a trusted CA. */
export function sampleCaForCertificate(pem?: string): string | undefined {
  if (pem === DEFAULT_CLIENT_CERT || pem === DEFAULT_SERVER_CERT) return DEFAULT_ROOT_CA
  if (pem === DEFAULT_MLDSA_CLIENT_CERT || pem === DEFAULT_MLDSA_SERVER_CERT)
    return DEFAULT_MLDSA_ROOT_CA
  if (pem === DEFAULT_MLDSA87_CLIENT_CERT || pem === DEFAULT_MLDSA87_SERVER_CERT)
    return DEFAULT_MLDSA87_ROOT_CA
  return undefined
}

export function initialSampleCertificateSelection(
  config: TLSConfig,
  side: 'client' | 'server'
): string {
  const pem = config.certificates.certPem
  if (pem === DEFAULT_CLIENT_CERT || pem === DEFAULT_SERVER_CERT) return 'default'
  if (pem === DEFAULT_MLDSA_CLIENT_CERT || pem === DEFAULT_MLDSA_SERVER_CERT) return 'mldsa44'
  if (pem === DEFAULT_MLDSA87_CLIENT_CERT || pem === DEFAULT_MLDSA87_SERVER_CERT) return 'mldsa87'
  if (pem) return 'custom'
  if (
    config.trustSelection === 'sample-default' &&
    !Object.values(config.certificates).some(Boolean)
  )
    return 'default'
  return side === 'client' ? 'none' : 'custom'
}

export function freshSampleIdentities(
  client: TLSConfig,
  server: TLSConfig
): { client: TLSConfig['certificates']; server: TLSConfig['certificates'] } | null {
  if (
    client.trustSelection !== 'sample-default' ||
    server.trustSelection !== 'sample-default' ||
    Object.values(client.certificates).some(Boolean) ||
    Object.values(server.certificates).some(Boolean)
  )
    return null
  return {
    client: { certPem: DEFAULT_CLIENT_CERT, keyPem: DEFAULT_CLIENT_KEY, caPem: DEFAULT_ROOT_CA },
    server: { certPem: DEFAULT_SERVER_CERT, keyPem: DEFAULT_SERVER_KEY, caPem: DEFAULT_ROOT_CA },
  }
}

/** This teaching run uses explicit sample trust material, not an OS trust store. */
export function requireSampleTrustInputs(client: TLSConfig, server: TLSConfig): void {
  if (!client.certificates.caPem?.trim()) {
    throw new Error(
      'Select a trusted sample CA for the client before running server-certificate verification.'
    )
  }
  if (server.verifyClient && !server.certificates.caPem?.trim()) {
    throw new Error('Select a trusted sample CA for the server before running mutual TLS.')
  }
}
