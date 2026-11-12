// SPDX-License-Identifier: AGPL-3.0-only
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { ContentInfo, SignedData } from '@peculiar/asn1-cms'
import { RsaSaPssParams } from '@peculiar/asn1-rsa'
import { inspectDualCms, type ExpectedDualSigner } from './dualCmsInspection'

const cli = process.env.PQC_A131_OPENSSL_BIN || 'openssl'
let directory: string
let substituted: Uint8Array
let rsa2048: { bytes: Uint8Array; expected: ExpectedDualSigner[] }
const samples: { name: string; bytes: Uint8Array; expected: ExpectedDualSigner[] }[] = []
const read = (name: string) => new Uint8Array(readFileSync(join(directory, name)))
const run = (args: string[]) => execFileSync(cli, args, { cwd: directory, stdio: 'pipe' })
const pqs = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'SLH-DSA-SHA2-128s']
function edit(bytes: Uint8Array, change: (data: SignedData) => void) {
  const ci = AsnConvert.parse(bytes.slice().buffer, ContentInfo)
  const data = AsnConvert.parse(ci.content, SignedData)
  change(data)
  ci.content = AsnConvert.serialize(data)
  return new Uint8Array(AsnConvert.serialize(ci))
}
function joint(bytes: Uint8Array) {
  writeFileSync(join(directory, 'verify.der'), bytes)
  return (
    spawnSync(
      cli,
      [
        'cms',
        '-verify',
        '-noverify',
        '-binary',
        '-inform',
        'DER',
        '-in',
        'verify.der',
        '-out',
        'recovered',
      ],
      { cwd: directory }
    ).status === 0
  )
}
beforeAll(() => {
  const version = execFileSync(cli, ['version'], { encoding: 'utf8' })
  if (!/^OpenSSL 3\./.test(version))
    throw new Error('Set PQC_A131_OPENSSL_BIN to OpenSSL 3.x for the native CMS fixture')
  directory = mkdtempSync(join(tmpdir(), 'pqctoday-a131-inspection-'))
  writeFileSync(join(directory, 'payload'), 'Fictional two-signer sample')
  run(['genpkey', '-algorithm', 'EC', '-pkeyopt', 'ec_paramgen_curve:P-256', '-out', 'EC.key'])
  run(['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:3072', '-out', 'RSA-PSS.key'])
  for (const alg of [...pqs, 'EC', 'RSA-PSS']) {
    if (pqs.includes(alg)) run(['genpkey', '-algorithm', alg, '-out', alg + '.key'])
    run([
      'req',
      '-new',
      '-x509',
      '-key',
      alg + '.key',
      '-subj',
      '/CN=Fictional ' + alg,
      '-days',
      '1',
      '-out',
      alg + '.crt',
    ])
    run(['x509', '-in', alg + '.crt', '-outform', 'DER', '-out', alg + '.der'])
  }
  // A real, valid alternative key/certificate with the SAME issuer and serial
  // must not impersonate the generated expected certificate during joint verify.
  const ecSerial = run(['x509', '-in', 'EC.crt', '-noout', '-serial'])
    .toString()
    .trim()
    .split('=')[1]
  run(['genpkey', '-algorithm', 'EC', '-pkeyopt', 'ec_paramgen_curve:P-256', '-out', 'other.key'])
  run([
    'req',
    '-new',
    '-x509',
    '-key',
    'other.key',
    '-subj',
    '/CN=Fictional EC',
    '-set_serial',
    '0x' + ecSerial,
    '-days',
    '1',
    '-out',
    'other.crt',
  ])
  run([
    'cms',
    '-sign',
    '-signer',
    'ML-DSA-44.crt',
    '-inkey',
    'ML-DSA-44.key',
    '-signer',
    'other.crt',
    '-inkey',
    'other.key',
    '-in',
    'payload',
    '-binary',
    '-nodetach',
    '-outform',
    'DER',
    '-out',
    'substituted.der',
    '-md',
    'sha256',
  ])
  substituted = read('substituted.der')
  run(['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', 'small.key'])
  run([
    'req',
    '-new',
    '-x509',
    '-key',
    'small.key',
    '-subj',
    '/CN=Fictional RSA2048',
    '-days',
    '1',
    '-out',
    'small.crt',
  ])
  run(['x509', '-in', 'small.crt', '-outform', 'DER', '-out', 'small.der'])
  run([
    'cms',
    '-sign',
    '-signer',
    'ML-DSA-44.crt',
    '-inkey',
    'ML-DSA-44.key',
    '-signer',
    'small.crt',
    '-inkey',
    'small.key',
    '-keyopt',
    'rsa_padding_mode:pss',
    '-keyopt',
    'rsa_pss_saltlen:32',
    '-keyopt',
    'rsa_mgf1_md:sha256',
    '-in',
    'payload',
    '-binary',
    '-nodetach',
    '-outform',
    'DER',
    '-out',
    'small-cms.der',
    '-md',
    'sha256',
  ])
  rsa2048 = {
    bytes: read('small-cms.der'),
    expected: [
      { certificate: read('ML-DSA-44.der'), algorithm: 'ML-DSA-44' },
      { certificate: read('small.der'), algorithm: 'RSA-PSS' },
    ],
  }
  for (const pq of pqs)
    for (const cl of ['EC', 'RSA-PSS']) {
      const args = [
        'cms',
        '-sign',
        '-signer',
        pq + '.crt',
        '-inkey',
        pq + '.key',
        '-signer',
        cl + '.crt',
        '-inkey',
        cl + '.key',
      ]
      if (cl === 'RSA-PSS')
        args.push(
          '-keyopt',
          'rsa_padding_mode:pss',
          '-keyopt',
          'rsa_pss_saltlen:32',
          '-keyopt',
          'rsa_mgf1_md:sha256'
        )
      run([
        ...args,
        '-in',
        'payload',
        '-binary',
        '-nodetach',
        '-outform',
        'DER',
        '-out',
        'signed.der',
        '-md',
        'sha256',
      ])
      const bytes = read('signed.der')
      // Independent CLI inspection and joint mathematics, not a parser self-roundtrip.
      const printed = run([
        'cms',
        '-cmsout',
        '-print',
        '-inform',
        'DER',
        '-in',
        'signed.der',
      ]).toString()
      expect(printed.split('signerInfos:')[1].match(/issuerAndSerialNumber:/g)).toHaveLength(2)
      expect(printed).toContain(cl === 'RSA-PSS' ? 'rsassaPss' : 'ecdsa-with-SHA256')
      expect(joint(bytes)).toBe(true)
      expect(readFileSync(join(directory, 'recovered'), 'utf8')).toBe('Fictional two-signer sample')
      samples.push({
        name: pq + ' + ' + cl,
        bytes,
        expected: [
          { certificate: read(pq + '.der'), algorithm: pq },
          { certificate: read(cl + '.der'), algorithm: cl },
        ],
      })
    }
})
afterAll(() => {
  if (directory) rmSync(directory, { recursive: true, force: true })
})
describe('actual CMS pair identity and existing selected profiles', () => {
  it.each(pqs.flatMap((pq) => ['EC', 'RSA-PSS'].map((cl) => pq + ' + ' + cl)))(
    '%s has two distinct expected signers and exact algorithms',
    (name) => {
      const sample = samples.find((s) => s.name === name)!
      expect(inspectDualCms(sample.bytes, sample.expected)).toBe(2)
    }
  )
  it('does not depend on SignerInfo order', () => {
    const sample = samples[0]
    expect(
      inspectDualCms(
        edit(sample.bytes, (data) => data.signerInfos.reverse()),
        sample.expected
      )
    ).toBe(2)
  })
  it('rejects stripping although the remaining genuine signature verifies', () => {
    const sample = samples[0]
    const stripped = edit(sample.bytes, (data) => {
      data.signerInfos.splice(1, 1)
    })
    expect(joint(stripped)).toBe(true)
    expect(() => inspectDualCms(stripped, sample.expected)).toThrow(/two SignerInfos/)
  })
  it('rejects a duplicated signer although its signature remains valid', () => {
    const sample = samples[0]
    const duplicate = edit(sample.bytes, (data) => {
      data.signerInfos[1] = data.signerInfos[0]
    })
    expect(joint(duplicate)).toBe(true)
    expect(() => inspectDualCms(duplicate, sample.expected)).toThrow(/duplicate/)
  })
  it('rejects an unexpected valid pair, not just unknown signature OIDs', () => {
    const sample = samples[0]
    expect(() => inspectDualCms(sample.bytes, samples[2].expected)).toThrow(
      /Embedded certificate does not match the generated signer pair/
    )
  })
  it('rejects an independently valid substituted key with the same issuer and serial', () => {
    expect(joint(substituted)).toBe(true)
    expect(() => inspectDualCms(substituted, samples[0].expected)).toThrow(/Embedded certificate/)
  })
  it('rejects ordinary RSA under the RSA-PSS selection and incorrect PSS salt length', () => {
    const sample = samples[1]
    const changed = edit(sample.bytes, (data) => {
      const signer = data.signerInfos.find(
        (s) => s.signatureAlgorithm.algorithm === '1.2.840.113549.1.1.10'
      )!
      signer.signatureAlgorithm.algorithm = '1.2.840.113549.1.1.1'
    })
    expect(() => inspectDualCms(changed, sample.expected)).toThrow(/signature algorithm/)
    const wrongSalt = edit(sample.bytes, (data) => {
      const signer = data.signerInfos.find(
        (s) => s.signatureAlgorithm.algorithm === '1.2.840.113549.1.1.10'
      )!
      const pss = AsnConvert.parse(signer.signatureAlgorithm.parameters!, RsaSaPssParams)
      pss.saltLength = 20
      signer.signatureAlgorithm.parameters = AsnConvert.serialize(pss)
    })
    expect(() => inspectDualCms(wrongSalt, sample.expected)).toThrow(/RSA-PSS parameters/)
  })
  it('rejects independently valid RSA2048 under this existing RSA3072 generation contract', () => {
    expect(joint(rsa2048.bytes)).toBe(true)
    expect(() => inspectDualCms(rsa2048.bytes, rsa2048.expected)).toThrow(/RSA-3072/)
  })
  it.each(['EC', 'ML-DSA-44', 'SLH-DSA-SHA2-128s'])(
    'rejects nonabsent %s SignerInfo parameters even when its OID stays unchanged',
    (algorithm) => {
      const sample = samples.find(
        (s) => s.expected.some((e) => e.algorithm === algorithm) && s.name.endsWith('EC')
      )!
      const oid =
        algorithm === 'EC'
          ? '1.2.840.10045.4.3.2'
          : algorithm === 'ML-DSA-44'
            ? '2.16.840.1.101.3.4.3.17'
            : '2.16.840.1.101.3.4.3.20'
      const changed = edit(sample.bytes, (data) => {
        data.signerInfos.find(
          (signer) => signer.signatureAlgorithm.algorithm === oid
        )!.signatureAlgorithm.parameters = new Uint8Array([5, 0]).buffer
      })
      // OpenSSL 3.6.2 currently accepts this NULL mutation; the sample's explicit
      // selected profile inspection is therefore necessary in addition to math.
      expect(joint(changed)).toBe(true)
      expect(() => inspectDualCms(changed, sample.expected)).toThrow(/parameters must be absent/)
    }
  )
  it('does not confuse structural pair inspection with checking altered signatures', () => {
    const sample = samples[0]
    const changed = edit(sample.bytes, (data) => {
      const bytes = new Uint8Array(data.signerInfos[0].signature.buffer).slice()
      bytes[0] ^= 1
      data.signerInfos[0].signature = new OctetString(bytes)
    })
    expect(inspectDualCms(changed, sample.expected)).toBe(2)
    expect(joint(changed)).toBe(false)
    const changedPayload = edit(sample.bytes, (data) => {
      const content = new Uint8Array(data.encapContentInfo.eContent!.single!.buffer).slice()
      content[0] ^= 1
      data.encapContentInfo.eContent!.single = new OctetString(content)
    })
    expect(inspectDualCms(changedPayload, sample.expected)).toBe(2)
    expect(joint(changedPayload)).toBe(false)
  })
  it('rejects truncation, trailing bytes and unsupported identifiers', () => {
    const sample = samples[0]
    expect(() => inspectDualCms(sample.bytes.slice(0, -1), sample.expected)).toThrow()
    expect(() => inspectDualCms(new Uint8Array([...sample.bytes, 0]), sample.expected)).toThrow()
    expect(() =>
      inspectDualCms(
        edit(sample.bytes, (data) => {
          data.signerInfos[0].sid.issuerAndSerialNumber = undefined
          data.signerInfos[0].sid.subjectKeyIdentifier = new OctetString(new Uint8Array([1, 2, 3]))
        }),
        sample.expected
      )
    ).toThrow(/Unsupported signer identifier/)
  })
})
