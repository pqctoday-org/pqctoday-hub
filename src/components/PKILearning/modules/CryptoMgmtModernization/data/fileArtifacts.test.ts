// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { FILE_ARTIFACTS } from './fileArtifacts'

const row = (id: string) => {
  const r = FILE_ARTIFACTS.find((x) => x.id === id)
  if (!r) throw new Error(`missing artifact ${id}`)
  return r
}

describe('file artifacts: authentication and key exchange are separate dependencies', () => {
  it('points a TLS server certificate at a signature migration, not a KEM group', () => {
    const tls = row('tls-server-cert')
    expect(tls.pqcTarget).toMatch(/signature/i)
    expect(tls.pqcTarget).not.toMatch(/ML-KEM|X25519/)
  })

  it('names the TLS key exchange as its own dependency and the one exposed to recorded traffic', () => {
    const notes = row('tls-server-cert').notes
    expect(notes).toMatch(/key exchange/)
    expect(notes).toMatch(/separate dependency/)
    expect(notes).toMatch(/harvest-now-decrypt-later/)
    expect(notes).toMatch(/session authentication cannot be retroactively broken/)
  })

  it('describes code-signing risk as forgery and lost trust, not decryption of recorded data', () => {
    const notes = row('codesign-binary').notes
    expect(notes).not.toMatch(/HNDL-sensitive/)
    expect(notes).toMatch(/forgery/)
    expect(notes).toMatch(/not harvest-now-decrypt-later/)
    expect(notes).toMatch(/verification policy/)
  })

  it('never assigns a KEM target to a signature-bearing artifact', () => {
    for (const id of ['tls-server-cert', 'codesign-binary', 'pgp-release-sig']) {
      expect(row(id).pqcTarget).not.toMatch(/ML-KEM|X25519MLKEM/)
    }
  })

  it('keeps the symmetric Grover remark labelled as the idealized model', () => {
    expect(row('disk-encryption-keys').notes).toMatch(/idealized Grover model/)
  })
})
