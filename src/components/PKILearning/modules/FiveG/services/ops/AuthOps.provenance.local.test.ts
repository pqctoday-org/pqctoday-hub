// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { FiveGService } from '../FiveGService'

vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn(), deleteFile: vi.fn() },
}))

const vector = {
  k: '465b5ce8b199b49faa5f0a2ee238a6bc',
  op: 'cdc202d5123e20f62b6d676ac72cb318',
  rand: '23553cbe9637a89d218ae64dae47bf35',
}

describe('Authentication step logs say what actually ran', () => {
  it('does not describe the sample credential load as an HSM retrieval', async () => {
    const service = new FiveGService()
    const log = await service.retrieveCredentials()
    // The software constants are not "retrieved from an HSM": the log must say no HSM is used
    expect(log).toContain('No database is read and no HSM is used')
    expect(log).not.toMatch(/Injecting Keys into HSM/)
    // The production architecture is still described, but labelled as modeled
    expect(log).toMatch(/\[MODELED\] In a production home network/)
    expect(log).toMatch(/protected import/)
    // Each step names whether it was modeled or executed here
    expect(log).toMatch(/Step 1 \[MODELED\]/)
    expect(log).toMatch(/Step 2 \[EXECUTED\]/)
    // the sample constants are named as such
    expect(log).toContain('fixed sample constants')
  })

  it('names the injected test vector as the source of K and OP when one is loaded', async () => {
    const service = new FiveGService()
    service.enableTestMode({ milenage: vector })
    const log = await service.retrieveCredentials()
    expect(log).toContain('taken from the injected GSMA test vector')
    expect(log).toContain(vector.k)
  })

  it('does not call browser getRandomValues output a hardware TRNG', async () => {
    const service = new FiveGService()
    const log = await service.generateRAND()
    expect(log).not.toMatch(/True Random Number Generator/)
    expect(log).not.toMatch(/Hardware RNG/)
    expect(log).toMatch(/cryptographically secure pseudo-random generator \(CSPRNG\)/)
    expect(log).toMatch(/not a hardware true random number generator/)
    // entropy-source and DRBG evidence are taught as a separate production requirement
    expect(log).toMatch(/\[MODELED\] A production ARPF/)
    expect(log).toMatch(/entropy-source and DRBG evidence/)
  })

  it('says the RAND is not random when it comes from a fixed test vector', async () => {
    const service = new FiveGService()
    service.enableTestMode({ milenage: vector })
    const log = await service.generateRAND()
    expect(log).toContain('a fixed RAND from the injected test vector (not random)')
    expect(log).not.toContain('getRandomValues(), the browser')
    expect(log).toContain(vector.rand)
  })
})
