// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useTLSStore } from './tls-learning.store'

vi.mock('./useHistoryStore', () => ({
  useHistoryStore: {
    getState: () => ({ addEvent: () => {} }),
  },
}))

import { vi } from 'vitest'

const STORAGE_KEY = 'tls-learning-storage'

function resetStore() {
  localStorage.clear()
  // Force a fresh hydrate by re-instantiating ephemeral state via reset()
  useTLSStore.persist.clearStorage?.()
  useTLSStore.getState().reset()
}

describe('tls-learning.store defaults', () => {
  beforeEach(() => {
    resetStore()
  })

  it('defaults the preferred group to the X25519MLKEM768 hybrid', () => {
    const { clientConfig, serverConfig } = useTLSStore.getState()
    expect(clientConfig.groups[0]).toBe('X25519MLKEM768')
    expect(serverConfig.groups[0]).toBe('X25519MLKEM768')
    expect(clientConfig.groups).toContain('X25519')
    expect(serverConfig.groups).toContain('X25519')
  })

  it('keeps mldsa44/65/87 + classical signature algorithms by default', () => {
    const { clientConfig } = useTLSStore.getState()
    expect(clientConfig.signatureAlgorithms).toEqual(
      expect.arrayContaining(['mldsa44', 'mldsa65', 'mldsa87', 'rsa_pss_rsae_sha256'])
    )
  })
})

describe('tls-learning.store migration v1 -> v2', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('rewrites the legacy default groups to hybrid-first when migrating', () => {
    // Seed v1 persisted state with the classical-only default
    const v1State = {
      state: {
        clientConfig: {
          cipherSuites: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_AES_128_GCM_SHA256',
            'TLS_CHACHA20_POLY1305_SHA256',
          ],
          groups: ['X25519', 'P-256', 'P-384'],
          signatureAlgorithms: ['mldsa44', 'mldsa65'],
          certificates: {},
          rawConfig: '# v1',
          mode: 'ui',
          verifyClient: false,
          clientAuthEnabled: true,
        },
        serverConfig: {
          cipherSuites: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_AES_128_GCM_SHA256',
            'TLS_CHACHA20_POLY1305_SHA256',
          ],
          groups: ['X25519', 'P-256', 'P-384'],
          signatureAlgorithms: ['mldsa44', 'mldsa65'],
          certificates: {},
          rawConfig: '# v1',
          mode: 'ui',
          verifyClient: false,
          clientAuthEnabled: true,
        },
        runHistory: [],
        clientMessage: 'Hello Server (Encrypted)',
        serverMessage: 'Hello Client (Encrypted)',
      },
      version: 1,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1State))

    // Trigger rehydration
    return useTLSStore.persist.rehydrate()?.then(() => {
      const { clientConfig, serverConfig } = useTLSStore.getState()
      expect(clientConfig.groups[0]).toBe('X25519MLKEM768')
      expect(serverConfig.groups[0]).toBe('X25519MLKEM768')
    })
  })

  it('preserves a customized groups selection across migration (canonicalized in v3)', () => {
    const customized = ['ML-KEM-1024'] // user explicitly chose pure PQC L5 (legacy spelling)
    const v1State = {
      state: {
        clientConfig: {
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: customized,
          signatureAlgorithms: ['mldsa87'],
          certificates: {},
          rawConfig: '# v1 custom',
          mode: 'ui',
          verifyClient: false,
          clientAuthEnabled: true,
        },
        serverConfig: {
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: customized,
          signatureAlgorithms: ['mldsa87'],
          certificates: {},
          rawConfig: '# v1 custom',
          mode: 'ui',
          verifyClient: false,
          clientAuthEnabled: true,
        },
        runHistory: [],
        clientMessage: '',
        serverMessage: '',
      },
      version: 1,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1State))

    return useTLSStore.persist.rehydrate()?.then(() => {
      const { clientConfig, serverConfig } = useTLSStore.getState()
      // Selection intent (pure ML-KEM-1024) survives, spelled the way OpenSSL accepts
      expect(clientConfig.groups).toEqual(['MLKEM1024'])
      expect(serverConfig.groups).toEqual(['MLKEM1024'])
    })
  })
})

describe('tls-learning.store migration v2 -> v3', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const makeV2State = (groups: string[]) => ({
    state: {
      clientConfig: {
        cipherSuites: ['TLS_AES_256_GCM_SHA384'],
        groups,
        signatureAlgorithms: ['mldsa65'],
        certificates: {},
        rawConfig: '# v2',
        mode: 'ui',
        verifyClient: false,
        clientAuthEnabled: true,
      },
      serverConfig: {
        cipherSuites: ['TLS_AES_256_GCM_SHA384'],
        groups,
        signatureAlgorithms: ['mldsa65'],
        certificates: {},
        rawConfig: '# v2',
        mode: 'ui',
        verifyClient: false,
        clientAuthEnabled: true,
      },
      runHistory: [],
      clientMessage: '',
      serverMessage: '',
    },
    version: 2,
  })

  it('renames hyphenated ML-KEM groups to OpenSSL TLS names and drops X448MLKEM1024', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(makeV2State(['ML-KEM-768', 'X448MLKEM1024', 'X25519']))
    )

    return useTLSStore.persist.rehydrate()?.then(() => {
      const { clientConfig, serverConfig } = useTLSStore.getState()
      expect(clientConfig.groups).toEqual(['MLKEM768', 'X25519'])
      expect(serverConfig.groups).toEqual(['MLKEM768', 'X25519'])
    })
  })

  it('falls back to default groups when the migration would empty the list', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeV2State(['X448MLKEM1024'])))

    return useTLSStore.persist.rehydrate()?.then(() => {
      const { clientConfig } = useTLSStore.getState()
      expect(clientConfig.groups[0]).toBe('X25519MLKEM768')
      expect(clientConfig.groups.length).toBeGreaterThan(0)
    })
  })

  it('leaves already-canonical group names untouched', () => {
    const canonical = ['X25519MLKEM768', 'MLKEM512', 'P-256']
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeV2State(canonical)))

    return useTLSStore.persist.rehydrate()?.then(() => {
      const { clientConfig } = useTLSStore.getState()
      expect(clientConfig.groups).toEqual(canonical)
    })
  })
})
