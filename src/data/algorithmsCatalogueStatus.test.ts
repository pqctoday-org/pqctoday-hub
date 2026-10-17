// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { algorithmsData } from './algorithmsData'
import { loadPQCAlgorithmsData } from './pqcAlgorithmsData'

// Status corrections checked against primary sources on 2026-10-17:
// RFC 10024 (TLS hybrid groups), RFC 10042 (SSH hybrid key exchange),
// NIST's Round 3 page (HAWK withdrawn 29 Jul 2026) and BSI TR-02102-1
// Tables 2.5/2.6 (FrodoKEM-976/1344; mceliece460896/6688128/8192128).
describe('catalogue status corrections', () => {
  it('no transition row offers HAWK as an active candidate', () => {
    const hawk = algorithmsData.filter((r) => r.pqc.startsWith('HAWK'))
    expect(hawk.length).toBeGreaterThanOrEqual(3)
    for (const row of hawk) expect(row.statusTier, row.pqc).toBe('eliminated')
  })

  it('treats the TLS and SSH ML-KEM hybrids as published RFCs on both tabs', async () => {
    const tls = algorithmsData.filter((r) => /^(X25519|SecP256r1|SecP384r1)MLKEM/.test(r.pqc))
    expect(tls.length).toBe(3)
    for (const row of tls) expect(row.statusTier, row.pqc).toBe('final')
    const catalogue = await loadPQCAlgorithmsData()
    for (const id of [
      'x25519mlkem768',
      'secp256r1mlkem768',
      'secp384r1mlkem1024',
      'mlkem768x25519-sha256',
      'mlkem768nistp256-sha256',
      'mlkem1024nistp384-sha384',
    ]) {
      const algo = catalogue.find((a) => a.id === id)
      expect(algo?.statusTier, id).toBe('final')
    }
  })

  it('does not credit BSI with parameter sets it does not list', async () => {
    const catalogue = await loadPQCAlgorithmsData()
    for (const id of ['classic-mceliece-348864', 'classic-mceliece-6960119', 'frodokem-640']) {
      const algo = catalogue.find((a) => a.id === id)
      expect(algo, id).toBeDefined()
      expect(`${algo!.status} ${algo!.fipsStandard}`, id).not.toMatch(
        /BSI TR-02102-1(?! \(BSI lists)|BSI\/ANSSI & ISO/
      )
    }
    expect(algorithmsData.some((r) => r.pqc.includes('BSI/ISO'))).toBe(false)
  })
})
