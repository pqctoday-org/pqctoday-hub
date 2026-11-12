// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseX509Profile, serializeProfileExtensions } from './profileSemantics'
import type { X509Attribute } from './types'
import { newModule, runOpenssl, writeFile, readFileBin } from '../../../test/kat/openssl-driver'

function extension(label: string, oid: string, value: string, critical = false): X509Attribute {
  return {
    id: oid,
    oid,
    label,
    value,
    critical,
    enabled: true,
    status: 'unknown',
    elementType: 'Extension',
    placeholder: '',
    description: '',
  }
}
const nftypes = (value = 'AMF,SMF', critical = false) =>
  extension('nftypes', '1.3.6.1.5.5.7.1.34', value, critical)
const profile = (name: string) =>
  parseX509Profile(readFileSync(resolve('src/data/x509_profiles', name), 'utf8')).attributes

describe('semantic profile examples to existing OpenSSL configuration', () => {
  it('preserves raw display inputs while projecting SAN, AIA and key identifiers', () => {
    const attributes = [
      extension(
        'subjectAltName',
        '2.5.29.17',
        'dNSName=www.example.com,URI=spiffe://operator/nf/amf'
      ),
      extension('authorityInfoAccess', '1.3.6.1.5.5.7.1.1', 'OCSP http://ocsp.exampleca.com/'),
      extension('subjectKeyIdentifier', '2.5.29.14', 'hash of SPKI'),
      extension('authorityKeyIdentifier', '2.5.29.35', 'same as SKI'),
    ]
    const before = structuredClone(attributes)
    expect(serializeProfileExtensions(attributes, 'root')).toBe(
      'subjectAltName = DNS:www.example.com,URI:spiffe://operator/nf/amf\nauthorityInfoAccess = OCSP;URI:http://ocsp.exampleca.com/\nsubjectKeyIdentifier = hash\nauthorityKeyIdentifier = keyid:always\n'
    )
    expect(attributes).toEqual(before)
    expect(() => serializeProfileExtensions([attributes[3]], 'leaf')).toThrow(/self-signed|root/i)
    expect(
      serializeProfileExtensions(
        [extension('authorityKeyIdentifier', '2.5.29.35', 'keyIdentifier from issuer SKI')],
        'leaf'
      )
    ).toBe('authorityKeyIdentifier = keyid:always\n')
  })

  it.each(['http://pki.exampletelco.com/root.crl', 'https://crl.exampleca.com/root.crl'])(
    'encodes the complete existing bare CRL URL without rewriting raw fields: %s',
    (url) => {
      for (const critical of [false, true]) {
        const input = [extension('cRLDistributionPoints', '2.5.29.31', url, critical)]
        const before = structuredClone(input)
        expect(serializeProfileExtensions(input, 'root')).toBe(
          `crlDistributionPoints = ${critical ? 'critical,' : ''}URI:${url}\n`
        )
        expect(input).toEqual(before)
      }
    }
  )
  it('preserves explicit CRL GeneralNames and section references; empty/newline still fail', () => {
    for (const value of [
      'URI:http://crl.example.com/root.crl',
      'URI:https://crl.example.com/root.crl',
      '@crl_points',
    ]) {
      expect(
        serializeProfileExtensions([extension('cRLDistributionPoints', '2.5.29.31', value)], 'leaf')
      ).toBe(`crlDistributionPoints = ${value}\n`)
    }
    for (const value of ['', 'http://crl.example.com/root.crl\nkeyUsage=digitalSignature']) {
      expect(() =>
        serializeProfileExtensions([extension('cRLDistributionPoints', '2.5.29.31', value)], 'leaf')
      ).toThrow(/single-line/)
    }
  })

  it('leaves already encoded and unrelated extension outputs unchanged', () => {
    for (const [label, oid, value] of [
      ['subjectAltName', '2.5.29.17', 'DNS:www.example.com,IP:192.0.2.1'],
      ['authorityInfoAccess', '1.3.6.1.5.5.7.1.1', 'OCSP;URI:http://ocsp.example.com'],
      ['subjectKeyIdentifier', '2.5.29.14', 'hash'],
      ['authorityKeyIdentifier', '2.5.29.35', 'keyid:always'],
      ['keyUsage', '2.5.29.15', 'digitalSignature,keyEncipherment'],
      ['extendedKeyUsage', '2.5.29.37', 'serverAuth,clientAuth'],
      ['crlDistributionPoints', '2.5.29.31', 'URI:http://crl.example.com/root.crl'],
      ['basicConstraints', '2.5.29.19', 'CA:TRUE,pathlen:3'],
      ['nameConstraints', '2.5.29.30', 'permitted;DNS:.example.com'],
      ['policyConstraints', '2.5.29.36', 'requireExplicitPolicy:0'],
      ['1.2.3.4', '1.2.3.4', 'DER:05:00'],
    ]) {
      expect(serializeProfileExtensions([extension(label, oid, value, true)], 'root')).toBe(
        `${label} = critical,${value}\n`
      )
    }
    expect(serializeProfileExtensions([{ ...nftypes(), enabled: false }], 'leaf')).toBe('')
  })

  it('allocates auxiliary sections without capturing raw references or changing extension order', () => {
    const raw = extension('1.2.3.4', '1.2.3.4', 'ASN1:SEQUENCE:pqctoday_profile_nftypes_1')
    const nested = extension('1.2.3.5', '1.2.3.5', 'ASN1:EXPLICIT:0,SEQ:pqctoday_profile_nftypes_2')
    const output = serializeProfileExtensions(
      [nftypes('SMF,AMF'), raw, nested, extension('keyUsage', '2.5.29.15', 'digitalSignature')],
      'leaf'
    )
    expect(output).toContain('1.3.6.1.5.5.7.1.34 = ASN1:SEQUENCE:pqctoday_profile_nftypes_3\n')
    expect(output).toContain(
      '1.2.3.4 = ASN1:SEQUENCE:pqctoday_profile_nftypes_1\n1.2.3.5 = ASN1:EXPLICIT:0,SEQ:pqctoday_profile_nftypes_2\nkeyUsage = digitalSignature\n'
    )
    expect(output).not.toContain('[ pqctoday_profile_nftypes_1 ]')
    expect(output.indexOf('[ pqctoday_profile_nftypes_3 ]')).toBeGreaterThan(
      output.indexOf('keyUsage = digitalSignature')
    )
    expect(output.indexOf('IA5STRING:AMF')).toBeLessThan(output.indexOf('IA5STRING:SMF'))
    const qc = extension('qcStatements', '1.3.6.1.5.5.7.1.3', 'DER:300a3008060604008e460101')
    const withQc = serializeProfileExtensions([qc, nftypes()], 'leaf')
    expect(withQc).toContain('qcStatements = DER:300a3008060604008e460101')
    expect(withQc).not.toContain('[ qcs ]')
    expect(() => serializeProfileExtensions([nftypes(), nftypes()], 'leaf')).toThrow(/Duplicate/)
  })

  it.each(['', 'AMF,', 'AMF,AMF', 'AM F', 'AMF\u007f', 'AMF\u001f', 'ÅMF', 'A'.repeat(33)])(
    'rejects RFC 9310-invalid NFTypes %j',
    (value) => {
      expect(() => serializeProfileExtensions([nftypes(value)], 'leaf')).toThrow()
    }
  )
  it('does not silently change a critical NFTypes request or case-fold distinct values', () => {
    expect(() => serializeProfileExtensions([nftypes('AMF', true)], 'leaf')).toThrow(/critical/i)
    const output = serializeProfileExtensions([nftypes('amf,AMF')], 'leaf')
    expect(output).toContain('IA5STRING:AMF')
    expect(output).toContain('IA5STRING:amf')
  })

  it('encodes and independently parses actual selected profile outputs using shipped OpenSSL 3.6.3', async () => {
    const files = new Map<string, Uint8Array>()
    const commands: string[][] = []
    const run = async (args: string[], outputs: string[] = []) => {
      const module = await newModule({ quiet: true })
      for (const [name, data] of files) writeFile(module, `/${name}`, data)
      commands.push([...args])
      const result = runOpenssl(module, args)
      expect(result.rc, result.stderr).toBe(0)
      for (const name of outputs) files.set(name, readFileBin(module, `/${name}`))
      return result.stdout
    }
    expect(await run(['version'])).toMatch(/^OpenSSL 3\.6\.3 /)
    const rootExtensions = serializeProfileExtensions(
      profile('Cert-RootCA-GeneralIT_CABF_TLSBR_2025.csv'),
      'root'
    )
    const csrExtensions = serializeProfileExtensions(
      profile('CSR-GeneralIT_CABF_TLSBR_2025.csv'),
      'csr'
    )
    const telecomExtensions = serializeProfileExtensions(
      [
        ...profile('Cert-Telecom_3GPP_TS33310_04072026.csv'),
        // Exercise the original AIA alias as an explicitly selected extra field,
        // not a claim that every other field in that profile is supported.
        ...profile('Cert-GeneralIT_CABF_TLSBR_2025.csv').filter(
          (attribute) => attribute.label === 'authorityInfoAccess'
        ),
      ],
      'leaf'
    )
    const telecomRootExtensions = serializeProfileExtensions(
      profile('Cert-RootCA-Telecom_3GPP_TS33310_2025.csv'),
      'root'
    )
    const generalLeafExtensions = serializeProfileExtensions(
      profile('Cert-GeneralIT_CABF_TLSBR_2025.csv'),
      'leaf'
    )
    expect(telecomRootExtensions).toContain(
      'crlDistributionPoints = URI:http://pki.exampletelco.com/root.crl'
    )
    expect(generalLeafExtensions).toContain(
      'crlDistributionPoints = URI:http://crl.exampleca.com/root.crl'
    )
    const setText = (name: string, value: string) =>
      files.set(name, new TextEncoder().encode(value))
    setText(
      'root.conf',
      `[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3_ca\n[dn]\nC=US\nO=Example Public CA\nCN=Example Public Root CA X1\n[v3_ca]\n${rootExtensions}`
    )
    setText(
      'csr.conf',
      `[req]\nprompt=no\ndistinguished_name=dn\nreq_extensions=req_ext\n[dn]\nCN=www.example.com\n[req_ext]\n${csrExtensions}`
    )
    setText('telecom.conf', `[v3_ca]\n${telecomExtensions}`)
    setText(
      'telecom-root.conf',
      `[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3_ca\n[dn]\nC=FR\nO=Example Mobile Group PKI\nCN=Example 5G Core Root CA\n[v3_ca]\n${telecomRootExtensions}`
    )
    setText('general-leaf.conf', `[v3_ca]\n${generalLeafExtensions}`)
    await run(
      ['genpkey', '-algorithm', 'EC', '-pkeyopt', 'ec_paramgen_curve:P-384', '-out', 'root.key'],
      ['root.key']
    )
    await run(
      [
        'req',
        '-new',
        '-x509',
        '-key',
        'root.key',
        '-sha384',
        '-days',
        '1',
        '-config',
        'root.conf',
        '-out',
        'root.pem',
      ],
      ['root.pem']
    )
    const rootText = await run(['x509', '-in', 'root.pem', '-noout', '-text'])
    expect(rootText).toContain('CA:TRUE, pathlen:3')
    expect(rootText).toContain('Permitted:')
    expect(rootText).toContain('DNS:.example.com')
    const ski = rootText.match(/X509v3 Subject Key Identifier:\s*([A-F0-9:]+)/)?.[1]
    const aki = rootText.match(/X509v3 Authority Key Identifier:\s*([A-F0-9:]+)/)?.[1]
    expect(ski).toBeTruthy()
    expect(aki).toBe(ski)
    await run(
      [
        'req',
        '-new',
        '-x509',
        '-key',
        'root.key',
        '-sha384',
        '-days',
        '1',
        '-config',
        'telecom-root.conf',
        '-out',
        'telecom-root.pem',
      ],
      ['telecom-root.pem']
    )
    const telecomRootText = await run(['x509', '-in', 'telecom-root.pem', '-noout', '-text'])
    expect(telecomRootText).toContain('CA:TRUE, pathlen:2')
    expect(telecomRootText).toContain('URI:http://pki.exampletelco.com/root.crl')
    expect(telecomRootText).toContain('DNS:.5gc.mnc001.mcc001.3gppnetwork.org')
    await run(
      ['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', 'leaf.key'],
      ['leaf.key']
    )
    await run(
      ['req', '-new', '-key', 'leaf.key', '-sha256', '-config', 'csr.conf', '-out', 'leaf.csr'],
      ['leaf.csr']
    )
    const csrText = await run(['req', '-in', 'leaf.csr', '-noout', '-verify', '-text'])
    expect(csrText).toContain('DNS:www.example.com')
    await run(
      [
        'x509',
        '-req',
        '-in',
        'leaf.csr',
        '-CA',
        'root.pem',
        '-CAkey',
        'root.key',
        '-set_serial',
        '1',
        '-days',
        '1',
        '-sha384',
        '-extfile',
        'telecom.conf',
        '-extensions',
        'v3_ca',
        '-out',
        'telecom.pem',
      ],
      ['telecom.pem']
    )
    await run(
      [
        'x509',
        '-req',
        '-in',
        'leaf.csr',
        '-CA',
        'root.pem',
        '-CAkey',
        'root.key',
        '-set_serial',
        '2',
        '-days',
        '1',
        '-sha384',
        '-extfile',
        'general-leaf.conf',
        '-extensions',
        'v3_ca',
        '-out',
        'general-leaf.pem',
      ],
      ['general-leaf.pem']
    )
    const generalLeafText = await run(['x509', '-in', 'general-leaf.pem', '-noout', '-text'])
    expect(generalLeafText).toContain('CA:FALSE')
    expect(generalLeafText).toContain('URI:http://crl.exampleca.com/root.crl')
    expect(generalLeafText).toContain('OCSP - URI:http://ocsp.exampleca.com/')
    expect(generalLeafText).toContain('DNS:www.example.com')
    const telecomText = await run(['x509', '-in', 'telecom.pem', '-noout', '-text'])
    expect(telecomText).toContain('CA:FALSE')
    expect(telecomText).toContain('DNS:amf1.5gc.mnc001.mcc001.3gppnetwork.org')
    expect(telecomText).not.toContain('DNS:amf1.5gc...')
    expect(telecomText).toContain('URI:spiffe://operator/nf/amf')
    expect(telecomText).toContain('OCSP - URI:http://ocsp.exampleca.com/')
    await run(
      ['x509', '-in', 'telecom.pem', '-outform', 'DER', '-out', 'telecom.der'],
      ['telecom.der']
    )
    // RFC9310: noncritical extension OID, OCTET STRING wrapping SEQUENCE of two IA5Strings.
    expect(Buffer.from(files.get('telecom.der')!).toString('hex')).toContain(
      '301806082b06010505070122040c300a1603414d461603534d46'
    )
    const parsed = await run(['asn1parse', '-inform', 'DER', '-in', 'telecom.der', '-i'])
    expect(parsed).toContain('300A1603414D461603534D46')
    console.info(
      JSON.stringify({
        sampleEncodingOnly: true,
        rootExtensions,
        csrExtensions,
        telecomExtensions,
        commands,
      })
    )
  }, 120_000)

  it('quotes RFC-valid punctuation as literal ASN1 values rather than config syntax', async () => {
    const output = serializeProfileExtensions([nftypes('A#B,C$D,E"F,G\\H,I;J')], 'leaf')
    const section = output.match(/ASN1:SEQUENCE:([a-z0-9_]+)/)?.[1]
    expect(section).toBeTruthy()
    const module = await newModule({ quiet: true })
    writeFile(module, '/nf.conf', `[extensions]\n${output}`)
    const result = runOpenssl(module, [
      'asn1parse',
      '-genconf',
      'nf.conf',
      '-genstr',
      `SEQUENCE:${section}`,
      '-out',
      'nf.der',
      '-noout',
    ])
    expect(result.rc, result.stderr).toBe(0)
    const bytes = Buffer.from(readFileBin(module, '/nf.der'))
    for (const value of ['A#B', 'C$D', 'E"F', 'G\\H', 'I;J'])
      expect(bytes.includes(Buffer.from(value, 'ascii'))).toBe(true)
  }, 60_000)
})
