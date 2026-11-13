// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parseX509Profile, serializeProfileExtensions } from './profileSemantics'

const profiles = import.meta.glob<string>('../../../data/x509_profiles/*Telecom*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const attributes = (file: string) => {
  const raw = profiles[`../../../data/x509_profiles/${file}`]
  expect(raw, file).toBeDefined()
  return parseX509Profile(raw).attributes
}

describe.each(['2025', '04072026'])('Telecom namespace, %s profile', (alias) => {
  it('issues the existing full NF identity inside the unchanged root DNS constraint', () => {
    const root = attributes(`Cert-RootCA-Telecom_3GPP_TS33310_${alias}.csv`)
    const csr = attributes(`CSR-Telecom_3GPP_TS33310_${alias}.csv`)
    const leaf = attributes(`Cert-Telecom_3GPP_TS33310_${alias}.csv`)
    const identity = 'amf1.5gc.mnc001.mcc001.3gppnetwork.org'
    expect(csr.find((a) => a.label === 'commonName')?.value).toBe(identity)
    expect(serializeProfileExtensions(root, 'root')).toContain(
      'nameConstraints = critical,permitted;DNS:.5gc.mnc001.mcc001.3gppnetwork.org'
    )
    for (const [purpose, values] of [
      ['csr', csr],
      ['leaf', leaf],
    ] as const) {
      const config = serializeProfileExtensions(values, purpose)
      expect(config).toContain(`DNS:${identity}`)
      expect(config).toContain('URI:spiffe://operator/nf/amf')
      expect(config).not.toContain('amf1.5gc...')
    }
  })
})
