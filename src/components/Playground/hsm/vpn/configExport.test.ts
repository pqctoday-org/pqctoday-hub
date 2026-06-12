// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture every zip.file() call and the saveAs invocation without touching
// real zip/binary machinery (jsdom has no Blob download path anyway).
const { zipState, saveAsMock } = vi.hoisted(() => ({
  zipState: {
    files: new Map<string, string>(),
    generateCalls: 0,
  },
  saveAsMock: vi.fn(),
}))

vi.mock('jszip', () => ({
  default: class FakeJSZip {
    file(path: string, content: string) {
      zipState.files.set(path, content)
      return this
    }
    async generateAsync() {
      zipState.generateCalls += 1
      return new Blob(['fake-zip'])
    }
  },
}))

vi.mock('file-saver', () => ({
  saveAs: saveAsMock,
}))

import { exportVpnConfigBundle, type VpnConfigExport } from './configExport'

const baseCfg: VpnConfigExport = {
  mode: 'hybrid',
  authMode: 'psk',
  mtu: 1500,
  allowFragmentation: true,
  clientAlg: 'ML-DSA',
  clientSize: '65',
  clientClassAlg: 'RSA-2048',
  serverAlg: 'ML-DSA',
  serverSize: '65',
  serverClassAlg: 'RSA-2048',
  clientPsk: 'client-psk-secret',
  serverPsk: 'server-psk-secret',
  strongswanConfInit: '# strongswan.conf (initiator)',
  strongswanConfResp: '# strongswan.conf (responder)',
  ipsecConfInit: '# ipsec.conf (initiator)',
  ipsecConfResp: '# ipsec.conf (responder)',
}

describe('exportVpnConfigBundle', () => {
  beforeEach(() => {
    zipState.files.clear()
    zipState.generateCalls = 0
    saveAsMock.mockClear()
  })

  it('always bundles README + both roles of strongswan.conf / ipsec.conf', async () => {
    await exportVpnConfigBundle(baseCfg)
    expect(zipState.files.has('README.md')).toBe(true)
    expect(zipState.files.get('initiator/strongswan.conf')).toBe('# strongswan.conf (initiator)')
    expect(zipState.files.get('initiator/ipsec.conf')).toBe('# ipsec.conf (initiator)')
    expect(zipState.files.get('responder/strongswan.conf')).toBe('# strongswan.conf (responder)')
    expect(zipState.files.get('responder/ipsec.conf')).toBe('# ipsec.conf (responder)')
  })

  it('PSK mode writes ipsec.secrets for both sides and no certs', async () => {
    await exportVpnConfigBundle(baseCfg)
    expect(zipState.files.get('initiator/ipsec.secrets')).toContain('client-psk-secret')
    expect(zipState.files.get('responder/ipsec.secrets')).toContain('server-psk-secret')
    const certFiles = [...zipState.files.keys()].filter((k) => k.includes('certs/'))
    expect(certFiles).toEqual([])
  })

  it('dual mode places BOTH certs in each side certs/ directory', async () => {
    await exportVpnConfigBundle({
      ...baseCfg,
      authMode: 'dual',
      initiatorCertPem: 'INITIATOR-CERT-PEM',
      responderCertPem: 'RESPONDER-CERT-PEM',
    })

    // Initiator side: own cert + peer cert.
    expect(zipState.files.get('initiator/certs/initiator.crt')).toBe('INITIATOR-CERT-PEM')
    expect(zipState.files.get('initiator/certs/responder.crt')).toBe('RESPONDER-CERT-PEM')
    // Responder side: own cert + peer cert.
    expect(zipState.files.get('responder/certs/responder.crt')).toBe('RESPONDER-CERT-PEM')
    expect(zipState.files.get('responder/certs/initiator.crt')).toBe('INITIATOR-CERT-PEM')
    // No PSK secrets in dual mode.
    expect(zipState.files.has('initiator/ipsec.secrets')).toBe(false)
    expect(zipState.files.has('responder/ipsec.secrets')).toBe(false)
  })

  it('dual mode skips missing certs gracefully', async () => {
    await exportVpnConfigBundle({
      ...baseCfg,
      authMode: 'dual',
      initiatorCertPem: 'INITIATOR-CERT-PEM',
      responderCertPem: null,
    })
    expect(zipState.files.has('initiator/certs/initiator.crt')).toBe(true)
    expect(zipState.files.has('responder/certs/initiator.crt')).toBe(true)
    expect(zipState.files.has('initiator/certs/responder.crt')).toBe(false)
    expect(zipState.files.has('responder/certs/responder.crt')).toBe(false)
  })

  it('README cites current references, not stale drafts', async () => {
    await exportVpnConfigBundle(baseCfg)
    const readme = zipState.files.get('README.md') ?? ''
    expect(readme).not.toContain('ipsecme-ikev2-pqc-ake')
    expect(readme).not.toContain('dilithium-certificates')
    expect(readme).toContain('RFC 9881')
    // ML-KEM IKEv2 Key Exchange Method IDs are IANA-assigned.
    expect(readme).toContain('35/36/37')
    expect(readme).toContain('IANA')
  })

  it('README reflects the selected configuration', async () => {
    await exportVpnConfigBundle(baseCfg)
    const readme = zipState.files.get('README.md') ?? ''
    expect(readme).toContain('`hybrid`')
    expect(readme).toContain('`psk`')
    expect(readme).toContain('ML-DSA-65')
    expect(readme).toContain('MTU: 1500')
  })

  it('saves the zip with a mode/auth-stamped filename', async () => {
    await exportVpnConfigBundle({ ...baseCfg, mode: 'pure-pqc', authMode: 'psk' })
    expect(zipState.generateCalls).toBe(1)
    expect(saveAsMock).toHaveBeenCalledTimes(1)
    const [, filename] = saveAsMock.mock.calls[0]
    expect(filename).toMatch(/^pqc-vpn-config-pure-pqc-psk-.*\.zip$/)
  })
})
