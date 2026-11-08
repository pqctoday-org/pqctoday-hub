// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { TLSNegotiationResults } from './TLSNegotiationResults'
import { useTLSStore, type TLSConfig } from '@/store/tls-learning.store'
import {
  DEFAULT_ROOT_CA,
  DEFAULT_MLDSA_ROOT_CA,
  DEFAULT_MLDSA87_ROOT_CA,
} from '../utils/defaultCertificates'

vi.mock('@/store/useHistoryStore', () => ({
  useHistoryStore: {
    getState: () => ({ addEvent: () => {} }),
  },
}))

// Self-signed ECDSA P-256 root (id-ecPublicKey, prime256v1) with no algorithm name in its text.
const CUSTOM_ECDSA_P256_ROOT = `-----BEGIN CERTIFICATE-----
MIIBoDCCAUWgAwIBAgIUQt1LwQqnRF4Tq69XwVsVtlmmaJowCgYIKoZIzj0EAwIw
JDEiMCAGA1UEAwwZQ3VzdG9tIEVDIFAtMjU2IFRlc3QgUm9vdDAgFw0yNjExMDYw
MTQ4MzFaGA8yMTI2MTAxMzAxNDgzMVowJDEiMCAGA1UEAwwZQ3VzdG9tIEVDIFAt
MjU2IFRlc3QgUm9vdDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCkAw7+W8V63
eKyXkH4c0kGa02U0Q3MpuvaN2nCOinx0Rc8mbY+Aej3lf+kB7u1WR0Xa0DqGcA+n
UNmkBA/KE3qjUzBRMB0GA1UdDgQWBBQRvipA11MSb/enbsqz6xe6wBUhbDAfBgNV
HSMEGDAWgBQRvipA11MSb/enbsqz6xe6wBUhbDAPBgNVHRMBAf8EBTADAQH/MAoG
CCqGSM49BAMCA0kAMEYCIQC3BYmjiDmRnU3v7FuBlMYHdO4vyCetP2SS8tR4xJdS
JgIhAIeNTy8n8FKZVQ6uyX5JRnXKOwOX1JcvutEeN0VDZl/A
-----END CERTIFICATE-----`

const SUCCESS = {
  status: 'success' as const,
  trace: [
    {
      side: 'connection' as const,
      event: 'established',
      details: 'Negotiated: TLS_AES_256_GCM_SHA384',
    },
    { side: 'client' as const, event: 'info', details: 'Key Exchange: X25519MLKEM768' },
  ],
}

function withCa(base: TLSConfig, caPem: string | undefined, verifyClient = false): TLSConfig {
  return { ...base, verifyClient, certificates: { ...base.certificates, caPem } }
}

/** Run the results view once and return the CA key types it recorded for the exported run. */
function recordedCaTypes(clientCa: string | undefined, serverCa?: string, mutual = false) {
  const { clientConfig, serverConfig } = useTLSStore.getState()
  useTLSStore.setState({
    clientConfig: withCa(clientConfig, clientCa),
    serverConfig: withCa(serverConfig, serverCa, mutual),
    results: SUCCESS,
  })
  render(<TLSNegotiationResults />)
  const [run] = useTLSStore.getState().runHistory
  return { serverCa: run.serverCaKeyType, clientCa: run.clientCaKeyType }
}

describe('TLS run record: CA key type comes from the CA certificate itself', () => {
  beforeEach(() => {
    localStorage.clear()
    useTLSStore.getState().reset()
    useTLSStore.getState().clearRunHistory()
  })

  it('names the bundled ML-DSA-44 root by its public-key algorithm, not RSA', () => {
    expect(recordedCaTypes(DEFAULT_MLDSA_ROOT_CA).serverCa).toBe('ML-DSA-44')
  })

  it('names the bundled ML-DSA-87 root by its public-key algorithm, not RSA', () => {
    expect(recordedCaTypes(DEFAULT_MLDSA87_ROOT_CA).serverCa).toBe('ML-DSA-87')
  })

  it('names the bundled classical root RSA', () => {
    expect(recordedCaTypes(DEFAULT_ROOT_CA).serverCa).toBe('RSA')
  })

  it('names a learner-supplied ECDSA root as EC, never RSA', () => {
    expect(recordedCaTypes(CUSTOM_ECDSA_P256_ROOT).serverCa).toBe('EC (P-256)')
  })

  it('records each side from its own CA when mutual TLS mixes algorithms', () => {
    const types = recordedCaTypes(DEFAULT_MLDSA_ROOT_CA, CUSTOM_ECDSA_P256_ROOT, true)
    expect(types).toEqual({ serverCa: 'ML-DSA-44', clientCa: 'EC (P-256)' })
  })

  it('keeps an unreadable certificate block unknown instead of defaulting to RSA', () => {
    const unreadable = '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----'
    expect(recordedCaTypes(unreadable).serverCa).toBe('Unknown')
  })

  it('keeps text that is not a certificate unknown instead of defaulting to RSA', () => {
    expect(recordedCaTypes('not a certificate at all').serverCa).toBe('Unknown')
  })

  it('reports N/A when no CA is configured or the client is not authenticated', () => {
    expect(recordedCaTypes(undefined, DEFAULT_MLDSA_ROOT_CA, false)).toEqual({
      serverCa: 'N/A',
      clientCa: 'N/A',
    })
  })
})
