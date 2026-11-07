// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { CRYPTO_LIBRARIES } from './cryptoLibraries'

const lib = (id: string) => {
  const l = CRYPTO_LIBRARIES.find((x) => x.id === id)
  if (!l) throw new Error(`missing library ${id}`)
  return l
}

describe('crypto library posture: a wrapper does not move an algorithm inside a validated boundary', () => {
  it('does not tell readers to put liboqs behind a FIPS provider shim', () => {
    const liboqs = lib('liboqs')
    expect(liboqs.notes).not.toMatch(/provider shim/i)
    expect(liboqs.notes).not.toMatch(/Use behind a FIPS-validated/i)
  })

  it('says a provider that loads liboqs does not bring its algorithms inside a validated module', () => {
    const notes = lib('liboqs').notes
    expect(notes).toMatch(/does not bring its algorithms inside a validated boundary/)
    expect(notes).toMatch(
      /covers only the named module, its approved algorithms and its tested configuration/
    )
    expect(notes).toMatch(/outside any certificate and as experimental/)
  })

  it('keeps liboqs out of any certificate', () => {
    const liboqs = lib('liboqs')
    expect(liboqs.fipsStatus).toBe('not-validated')
    expect(liboqs.cmvpCertNumber).toBeNull()
  })

  it('does not call every liboqs algorithm a NIST PQC family', () => {
    const support = lib('liboqs').pqcSupport
    expect(support).not.toMatch(/All NIST PQC families/)
    expect(support).toMatch(/standards not final/)
    expect(support).toMatch(/under ISO consideration/)
  })

  it('does not say pairing RustCrypto with another library puts it inside a FIPS boundary', () => {
    const notes = lib('rustcrypto').notes
    expect(notes).not.toMatch(/combine with aws-lc-rs if FIPS boundary needed/i)
    expect(notes).toMatch(/does not bring RustCrypto code inside that boundary/)
  })
})
