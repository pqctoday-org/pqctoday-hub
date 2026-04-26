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

  it('preserves a customized groups array across migration', () => {
    const customized = ['ML-KEM-1024'] // user explicitly chose pure PQC L5
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
      expect(clientConfig.groups).toEqual(customized)
      expect(serverConfig.groups).toEqual(customized)
    })
  })
})
