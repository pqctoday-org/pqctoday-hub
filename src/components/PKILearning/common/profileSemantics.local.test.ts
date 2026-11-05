// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { parseX509Profile, serializeProfileExtensions } from './profileSemantics'
import type { X509Attribute } from './types'
const profiles = import.meta.glob<string>(
  ['../../../data/x509_profiles/Cert*.csv', '../../../data/x509_profiles/CSR*.csv'],
  { query: '?raw', import: 'default', eager: true }
)
const extension = (
  label: string,
  value: string,
  critical: boolean | undefined = false
): X509Attribute => ({
  id: label,
  oid: label,
  label,
  value,
  critical,
  enabled: true,
  status: 'unknown',
  elementType: 'Extension',
  placeholder: '',
  description: '',
})
describe('profile criticality and presence', () => {
  it('blocks repeated editor identities and canonical extension-name aliases', () => {
    expect(() =>
      parseX509Profile(
        'ElementType,Name,OID,Critical,ExampleValue\nExtension,keyUsage,2.5.29.15,TRUE,digitalSignature\nExtension,keyUsage,2.5.29.15,FALSE,keyEncipherment'
      )
    ).toThrow(/Repeated profile attributes/)
    expect(() =>
      serializeProfileExtensions(
        [
          { ...extension('keyUsage', 'digitalSignature'), oid: '2.5.29.15' },
          { ...extension('keyUsage', 'keyEncipherment'), oid: '1.2.3.4' },
        ],
        'leaf'
      )
    ).toThrow(/Duplicate/)
  })
  it('maps the ASN.1 CRL distribution-points OID to the OpenSSL configuration name', () => {
    expect(
      serializeProfileExtensions(
        [
          {
            ...extension('cRLDistributionPoints', 'URI:http://crl.example.com/root.crl'),
            oid: '2.5.29.31',
          },
        ],
        'leaf'
      )
    ).toBe('crlDistributionPoints = URI:http://crl.example.com/root.crl\n')
  })
  it('preserves constraint rows across the corpus and reports the algorithm-only file unsupported', () => {
    expect(Object.keys(profiles)).toHaveLength(15)
    let constraints = 0
    for (const [name, text] of Object.entries(profiles)) {
      if (name.endsWith('Cert-GeneralIT_CABF_TLSBR_2025_PQC.csv')) {
        expect(() => parseX509Profile(text)).toThrow(/no supported attribute rows/)
        continue
      }
      const { attributes } = parseX509Profile(text)
      expect(attributes.every((a) => a.status === 'unknown')).toBe(true)
      for (const a of attributes) {
        expect(a.enabled).toBe(Boolean(a.value))
        if (a.elementType === 'Extension') expect(typeof a.critical).toBe('boolean')
        else expect(a.critical).toBeUndefined()
        if (a.label.toLowerCase().includes('constraints')) constraints++
      }
    }
    expect(constraints).toBe(13)
  })
  it('does not convert extension criticality or RDN Critical cells into mandatory presence', () => {
    const text =
      'Industry,Standard,StandardDate,ElementType,Name,OID,Critical,AllowedValuesOrUsage,ExampleValue\nSample,Sample,2026,Extension,keyUsage,2.5.29.15,TRUE,"signing, not transport",digitalSignature\nSample,Sample,2026,SubjectRDN,commonName,2.5.4.3,TRUE,example,sample.example'
    const { attributes } = parseX509Profile(text)
    expect(attributes[0]).toMatchObject({
      status: 'unknown',
      critical: true,
      enabled: true,
      description: 'signing, not transport',
    })
    expect(attributes[1]).toMatchObject({ status: 'unknown', enabled: true })
    expect(attributes[1].critical).toBeUndefined()
  })
  it('preserves a separately authored required noncritical field', () => {
    expect(
      serializeProfileExtensions(
        [{ ...extension('basicConstraints', 'CA:FALSE', false), status: 'mandatory' }],
        'leaf'
      )
    ).toBe('basicConstraints = CA:FALSE\n')
  })
  it('rejects malformed CSV and unknown extension criticality', () => {
    expect(() => parseX509Profile('Name,OID\ninvalid')).toThrow()
    expect(() =>
      parseX509Profile(
        'ElementType,Name,OID,Critical,ExampleValue\nExtension,keyUsage,2.5.29.15,maybe,digitalSignature'
      )
    ).toThrow(/Criticality/)
  })
  it.each([
    ['CA:TRUE', 'basicConstraints = critical,CA:TRUE\n'],
    ['cA=TRUE, pathLenConstraint=3', 'basicConstraints = critical,CA:TRUE,pathlen:3\n'],
    ['CA:TRUE,pathlen:0', 'basicConstraints = critical,CA:TRUE,pathlen:0\n'],
  ])('preserves basic constraint meaning: %s', (value, expected) => {
    expect(serializeProfileExtensions([extension('basicConstraints', value, true)], 'root')).toBe(
      expected
    )
  })
  it('preserves explicit critical and noncritical leaf flags, including a compatible prefix', () => {
    expect(
      serializeProfileExtensions([extension('basicConstraints', 'CA:FALSE', true)], 'leaf')
    ).toBe('basicConstraints = critical,CA:FALSE\n')
    expect(
      serializeProfileExtensions([extension('keyUsage', 'critical,digitalSignature', true)], 'leaf')
    ).toBe('keyUsage = critical,digitalSignature\n')
  })
  it.each([
    'CA:FALSE,pathlen:0',
    'CA:TRUE,pathlen:-1',
    'CA:TRUE,pathlen:1,pathlen:2',
    'CA:TRUE,other:1',
    'CA:TRUE,pathlen:9007199254740993',
  ])('rejects unsupported or incompatible basic constraints: %s', (value) => {
    expect(() =>
      serializeProfileExtensions([extension('basicConstraints', value, true)], 'root')
    ).toThrow()
  })
  it('blocks CA/leaf substitutions; CSR requests do not grant an issuer decision', () => {
    expect(() =>
      serializeProfileExtensions([extension('basicConstraints', 'CA:TRUE', true)], 'leaf')
    ).toThrow(/end-entity/)
    expect(() =>
      serializeProfileExtensions([extension('basicConstraints', 'CA:FALSE', false)], 'root')
    ).toThrow(/explicit profile value/)
    expect(
      serializeProfileExtensions([extension('basicConstraints', 'CA:TRUE', true)], 'csr')
    ).toContain('CA:TRUE')
  })
  it('preserves DNS constraint direction and leading-dot scope', () => {
    expect(
      serializeProfileExtensions(
        [
          extension(
            'nameConstraints',
            'Permitted: dNSName=.example.com, excluded;DNS:.blocked.example.com',
            true
          ),
        ],
        'root'
      )
    ).toBe(
      'nameConstraints = critical,permitted;DNS:.example.com,excluded;DNS:.blocked.example.com\n'
    )
  })
  it('keeps unsupported directory constraints visible and incomplete', () => {
    expect(() =>
      serializeProfileExtensions(
        [extension('nameConstraints', 'permitted;dirName:C=FR', true)],
        'root'
      )
    ).toThrow(/No constraint has been dropped/)
    expect(() =>
      serializeProfileExtensions(
        [extension('nameConstraints', 'permitted;DNS:.example.com', true)],
        'leaf'
      )
    ).toThrow(/end-entity/)
  })
  it('preserves supported policy constraints and rejects duplicate fields', () => {
    expect(
      serializeProfileExtensions(
        [extension('policyConstraints', 'requireExplicitPolicy:0,inhibitPolicyMapping:1', true)],
        'root'
      )
    ).toContain('critical,requireExplicitPolicy:0,inhibitPolicyMapping:1')
    expect(() =>
      serializeProfileExtensions(
        [extension('policyConstraints', 'requireExplicitPolicy:0,requireExplicitPolicy:1', true)],
        'root'
      )
    ).toThrow()
  })
  it('requires review of legacy criticality instead of guessing from selection/presence', () => {
    expect(() =>
      serializeProfileExtensions(
        [
          {
            ...extension('keyUsage', 'digitalSignature'),
            critical: undefined,
            status: 'mandatory',
          },
        ],
        'leaf'
      )
    ).toThrow(/Review criticality/)
    expect(() =>
      serializeProfileExtensions(
        [extension('keyUsage', 'critical,digitalSignature', false)],
        'leaf'
      )
    ).toThrow(/separate critical flag/)
  })
  it('rejects duplicate and unsupported selected extensions rather than silently overriding/dropping', () => {
    expect(() =>
      serializeProfileExtensions(
        [extension('basicConstraints', 'CA:FALSE'), extension('basicConstraints', 'CA:TRUE')],
        'leaf'
      )
    ).toThrow(/Duplicate/)
    expect(() =>
      serializeProfileExtensions([extension('futureConstraints', 'anything', true)], 'root')
    ).toThrow(/Unsupported constraint/)
  })
})
