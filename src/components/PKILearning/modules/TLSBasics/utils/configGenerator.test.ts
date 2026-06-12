// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { generateOpenSSLConfig } from './configGenerator'
import type { TLSConfig } from '@/store/tls-learning.store'

const baseConfig: TLSConfig = {
  cipherSuites: ['TLS_AES_256_GCM_SHA384'],
  groups: ['X25519MLKEM768', 'X25519', 'P-256'],
  signatureAlgorithms: ['mldsa44', 'ecdsa_secp256r1_sha256'],
  certificates: {},
  rawConfig: '',
  mode: 'ui',
  verifyClient: false,
  clientAuthEnabled: true,
}

describe('generateOpenSSLConfig', () => {
  it('emits group names exactly as configured (canonical OpenSSL TLS names)', () => {
    const conf = generateOpenSSLConfig({ ...baseConfig, groups: ['MLKEM768', 'X25519'] }, 'client')
    expect(conf).toContain('Groups = MLKEM768:X25519')
    // The hyphenated EVP spelling must never reach the OpenSSL config — it fails
    // SSL_CTX_set1_groups_list and silently reverts the whole list to defaults.
    expect(conf).not.toContain('ML-KEM-')
  })

  it('pins TLS 1.3 on both ends', () => {
    const conf = generateOpenSSLConfig(baseConfig, 'server')
    expect(conf).toContain('MinProtocol = TLSv1.3')
    expect(conf).toContain('MaxProtocol = TLSv1.3')
  })

  it('emits sigalgs and ciphersuites joined with colons', () => {
    const conf = generateOpenSSLConfig(baseConfig, 'client')
    expect(conf).toContain('Ciphersuites = TLS_AES_256_GCM_SHA384')
    expect(conf).toContain('SignatureAlgorithms = mldsa44:ecdsa_secp256r1_sha256')
  })

  it('requests client verification only when verifyClient is set on the server side', () => {
    const off = generateOpenSSLConfig(baseConfig, 'server')
    expect(off).not.toContain('VerifyMode')
    const on = generateOpenSSLConfig({ ...baseConfig, verifyClient: true }, 'server')
    expect(on).toContain('VerifyMode = Peer,Request')
  })

  it('returns the raw config untouched in raw mode', () => {
    const raw = '# my raw config\nGroups = MLKEM1024\n'
    const conf = generateOpenSSLConfig({ ...baseConfig, mode: 'raw', rawConfig: raw }, 'client')
    expect(conf).toBe(raw)
  })
})
