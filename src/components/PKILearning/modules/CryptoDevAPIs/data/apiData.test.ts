// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { CRYPTO_APIS } from './apiData'

const jcprov = CRYPTO_APIS.find((a) => a.id === 'jcprov')!
const pkcs11 = CRYPTO_APIS.find((a) => a.id === 'pkcs11')!

describe('Thales Luna Java integration is taught as two routes', () => {
  it('describes the PKCS#11 wrapper and the JCA/JCE provider as separate components', () => {
    expect(jcprov.description).toMatch(/two separate/i)
    expect(jcprov.description).toMatch(/com\.safenetinc\.jcprov/)
    expect(jcprov.description).toMatch(/com\.safenetinc\.luna/)
  })

  it('does not say the PKCS#11 wrapper registers itself as a JCA provider', () => {
    const everything = JSON.stringify(jcprov)
    expect(everything).not.toMatch(/Can register as a JCA provider/i)
    expect(everything).not.toMatch(/transparent to application code/i)
  })

  it('shows provider registration only for the provider route', () => {
    const [providerRoute, wrapperRoute] = jcprov.providerPattern.split('// Route 2')
    expect(providerRoute).toMatch(/insertProviderAt|addProvider/)
    expect(providerRoute).toMatch(/LunaProvider/)
    expect(wrapperRoute).not.toMatch(/addProvider|insertProviderAt|LunaProvider\(/)
    expect(wrapperRoute).toMatch(/com\.safenetinc\.jcprov/)
  })

  it('does not infer PQC support for the wrapper from the firmware alone', () => {
    expect(jcprov.pqcStatus).not.toMatch(/passes through to firmware/i)
    expect(jcprov.pqcStatus).toMatch(/JCPROV classes expose is not stated/i)
  })
})

describe('hardware-backed key claims are conditional on key attributes and module policy', () => {
  const claimsFor = (api: (typeof CRYPTO_APIS)[number]) => [...api.strengths, ...api.limitations]

  it('no API says keys never leave the hardware or are never extractable', () => {
    for (const api of CRYPTO_APIS) {
      for (const line of claimsFor(api)) {
        expect(line, `${api.id}: ${line}`).not.toMatch(
          /never leave|never extractable|keys? (are|is) never/i
        )
      }
    }
  })

  it('does not infer a key policy from a FIPS level', () => {
    for (const api of CRYPTO_APIS) {
      for (const line of [...claimsFor(api), ...api.standards]) {
        expect(line, `${api.id}: ${line}`).not.toMatch(/Level 3(\/4)? (validated|when backed)/i)
      }
    }
    const fipsLine = pkcs11.strengths.find((s) => /FIPS 140/.test(s))!
    expect(fipsLine).toMatch(/Security Policy/)
    expect(fipsLine).toMatch(/does not set a key policy/i)
  })

  it('names the attributes that decide extractability', () => {
    const keyLine = pkcs11.strengths.find((s) => /non-extractable/.test(s))!
    expect(keyLine).toMatch(/CKA_EXTRACTABLE/)
    expect(keyLine).toMatch(/CKA_SENSITIVE/)
    expect(keyLine).toMatch(/token policy/i)
  })
})

describe('PKCS#11 v3.2 status separates the committee specification from the OASIS Standard', () => {
  it('does not call the committee specification a draft or the two content-identical', () => {
    expect(pkcs11.pqcStatus).not.toMatch(/CS01 draft/i)
    expect(pkcs11.pqcStatus).toMatch(/Committee Specification 01/)
    expect(pkcs11.pqcStatus).toMatch(/OASIS Standard/)
  })
})
