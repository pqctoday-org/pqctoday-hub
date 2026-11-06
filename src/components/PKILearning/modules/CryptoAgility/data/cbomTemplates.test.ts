// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SAMPLE_CBOM, CBOM_CYCLONEDX_SAMPLE } from './cbomTemplates'

const hostAuth = SAMPLE_CBOM.find((e) => /host key authentication/i.test(e.usage))
const transportKex = SAMPLE_CBOM.find(
  (e) => /ssh/i.test(e.component) && /key exchange/i.test(e.usage)
)

describe('SSH records in the sample CBOM', () => {
  it('keeps the host-authentication signature and the transport key exchange as separate records', () => {
    expect(hostAuth).toBeDefined()
    expect(transportKex).toBeDefined()
    expect(hostAuth?.id).not.toBe(transportKex?.id)
    expect(hostAuth?.algorithm).toBe('Ed25519')
    expect(transportKex?.algorithm).toBe('X25519')
  })

  it('does not remediate the host signature with a key-exchange change', () => {
    const rec = hostAuth?.recommendation ?? ''
    expect(rec).toMatch(/does not replace this Ed25519 host signature/)
    expect(rec).not.toMatch(/^Enable mlkem768x25519-sha256/)
    // the hybrid key-exchange name belongs to the key-exchange record only
    expect(rec).not.toMatch(/mlkem768x25519/)
  })

  it('recommends the hybrid key exchange on the key-exchange record, with version context', () => {
    const rec = transportKex?.recommendation ?? ''
    expect(rec).toMatch(/mlkem768x25519-sha256/)
    expect(rec).toMatch(/OpenSSH/)
    expect(rec).toMatch(/9\.9/)
    expect(rec).toMatch(/10\.0/)
  })

  it('names the post-quantum host-key option with its draft status and a compatibility caveat', () => {
    const rec = hostAuth?.recommendation ?? ''
    expect(rec).toMatch(/ssh-mldsa44-ed25519/)
    expect(rec).toMatch(/Internet-Draft/)
    expect(rec).toMatch(/both ends must support/)
  })
})

describe('CycloneDX sample', () => {
  it('has one cryptographic asset per sample CBOM entry', () => {
    expect(CBOM_CYCLONEDX_SAMPLE.components.length).toBe(SAMPLE_CBOM.length)
  })

  it('lists the SSH host signature and the SSH key exchange as different primitives', () => {
    const host = CBOM_CYCLONEDX_SAMPLE.components.find((c) => /SSH Host Key/.test(c.name))
    const kex = CBOM_CYCLONEDX_SAMPLE.components.find((c) => /SSH Key Exchange/.test(c.name))
    expect(host?.cryptoProperties.algorithmProperties.primitive).toBe('signature')
    expect(kex?.cryptoProperties.algorithmProperties.primitive).toBe('key-agree')
  })
})
