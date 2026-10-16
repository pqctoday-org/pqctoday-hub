// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { tlsRunManifest, TLS_RUN_LIMITATIONS, TLS_SIMULATOR_VERSION } from './tlsRunManifest'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import type { TLSConfig, TLSRunRecord } from '@/store/tls-learning.store'

const CONFIG: TLSConfig = {
  cipherSuites: ['TLS_AES_256_GCM_SHA384'],
  groups: ['X25519MLKEM768', 'X25519'],
  signatureAlgorithms: ['rsa_pss_rsae_sha256'],
  certificates: {},
  rawConfig: '',
  mode: 'ui',
}
const RUN: TLSRunRecord = {
  id: 1,
  timestamp: new Date('2026-10-16T10:00:00Z'),
  cipher: 'TLS_AES_256_GCM_SHA384',
  keyExchange: 'X25519MLKEM768',
  signature: 'rsa_pss_rsae_sha256',
  clientIdentity: 'N/A',
  serverIdentity: 'RSA-2048',
  clientCaKeyType: 'N/A',
  serverCaKeyType: 'RSA',
  totalBytes: 4250,
  handshakeBytes: 3676,
  appDataBytes: 573,
  success: true,
  roundTrips: 1,
}
const SITE = { appVersion: '4.163.0', commit: 'c', wasmHash: 'w', buildTimestamp: 't' }

describe('TLS simulator run record', () => {
  it('records the negotiated parameters and sizes the run displayed', () => {
    const m = tlsRunManifest(
      {
        run: RUN,
        clientConfig: CONFIG,
        serverConfig: CONFIG,
        toolVersion: '1.0.2',
        startedAt: 'a',
        finishedAt: 'b',
      },
      SITE
    )
    expect(m.executionMode).toBe('in-browser-implementation')
    expect(m.summary).toEqual({ passed: 4, failed: 0 })
    const text = m.cases.map((c) => c.actual).join(' | ')
    expect(text).toContain('X25519MLKEM768')
    expect(text).toContain('3676 bytes handshake')
    expect(text).toContain('573 bytes application data')
    expect(m.limitations).toEqual(TLS_RUN_LIMITATIONS)
  })

  it('says plainly when the key exchange was classical only', () => {
    const m = tlsRunManifest(
      {
        run: { ...RUN, keyExchange: 'X25519' },
        clientConfig: CONFIG,
        serverConfig: CONFIG,
        toolVersion: '1.0.2',
        startedAt: 'a',
        finishedAt: 'b',
      },
      SITE
    )
    expect(m.cases.find((c) => c.id === 'post-quantum key exchange')?.actual).toMatch(
      /classical only/
    )
  })
})

describe('TLS simulator version', () => {
  it('matches the Playground registry entry', () => {
    expect(WORKSHOP_TOOLS.find((t) => t.id === 'tls-simulator')?.version).toBe(
      TLS_SIMULATOR_VERSION
    )
  })
})
