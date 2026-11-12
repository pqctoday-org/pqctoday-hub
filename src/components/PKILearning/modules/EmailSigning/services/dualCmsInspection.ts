// SPDX-License-Identifier: AGPL-3.0-only
import { fromBER } from 'asn1js'
import { AsnConvert } from '@peculiar/asn1-schema'
import { ContentInfo, SignedData, id_signedData } from '@peculiar/asn1-cms'
import { Certificate, AlgorithmIdentifier } from '@peculiar/asn1-x509'
import { RsaSaPssParams, RSAPublicKey } from '@peculiar/asn1-rsa'

export interface ExpectedDualSigner {
  certificate: Uint8Array
  algorithm: string
}
const SHA256 = '2.16.840.1.101.3.4.2.1'
const signatures: Record<string, string> = {
  'ML-DSA-44': '2.16.840.1.101.3.4.3.17',
  'ML-DSA-65': '2.16.840.1.101.3.4.3.18',
  'ML-DSA-87': '2.16.840.1.101.3.4.3.19',
  'SLH-DSA-SHA2-128s': '2.16.840.1.101.3.4.3.20',
  EC: '1.2.840.10045.4.3.2',
  'RSA-PSS': '1.2.840.113549.1.1.10',
}
const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')
const serial = (buffer: ArrayBuffer) => hex(buffer).replace(/^(00)+(?=..)/, '')
function parse<T>(bytes: Uint8Array, schema: new () => T): T {
  const input = bytes.slice().buffer
  if (fromBER(input).offset !== bytes.length) throw new Error('Malformed or trailing CMS data')
  return AsnConvert.parse(input, schema)
}
const issuer = (name: Certificate['tbsCertificate']['issuer']) => hex(AsnConvert.serialize(name))

/** Bounded inspection of this workshop's two generated issuer/serial signers.
 * Signature mathematics remain the existing joint OpenSSL verification; this
 * does not establish certificate trust or general CMS/profile conformance. */
export function inspectDualCms(bytes: Uint8Array, expected: ExpectedDualSigner[]): number {
  if (expected.length !== 2) throw new Error('Expected exactly the workshop signer pair')
  const certificates = expected.map(({ certificate, algorithm }) => {
    const cert = parse(certificate, Certificate)
    const spki = cert.tbsCertificate.subjectPublicKeyInfo.algorithm
    const expectedSpki =
      algorithm === 'EC'
        ? '1.2.840.10045.2.1'
        : algorithm === 'RSA-PSS'
          ? '1.2.840.113549.1.1.1'
          : signatures[algorithm]
    if (!expectedSpki || spki.algorithm !== expectedSpki)
      throw new Error('Generated certificate algorithm does not match selected signer')
    if (algorithm === 'RSA-PSS') {
      const rsa = parse(
        new Uint8Array(cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey),
        RSAPublicKey
      )
      const modulus = new Uint8Array(rsa.modulus)
      let first = 0
      while (first < modulus.length && modulus[first] === 0) first++
      const bits =
        first === modulus.length
          ? 0
          : (modulus.length - first - 1) * 8 + (32 - Math.clz32(modulus[first]))
      if (bits !== 3072) throw new Error('Expected the generated RSA-3072 certificate')
    }
    // The existing EC generation contract is P-256, not an arbitrary EC key.
    if (algorithm === 'EC' && (!spki.parameters || hex(spki.parameters) !== '06082a8648ce3d030107'))
      throw new Error('Expected the generated P-256 certificate')
    return {
      id: issuer(cert.tbsCertificate.issuer) + ':' + serial(cert.tbsCertificate.serialNumber),
      algorithm,
      der: hex(AsnConvert.serialize(cert)),
    }
  })
  if (certificates[0].id === certificates[1].id)
    throw new Error('Expected signer certificates are not distinct')
  const ci = parse(bytes, ContentInfo)
  if (ci.contentType !== id_signedData) throw new Error('Expected CMS SignedData')
  const data = parse(new Uint8Array(ci.content), SignedData)
  if (data.signerInfos.length !== 2)
    throw new Error(`Expected two SignerInfos; found ${data.signerInfos.length}`)
  // The joint verifier uses embedded certificates. Bind those actual public
  // keys too: issuer/serial alone must not permit a substituted certificate.
  if (data.certificates?.length !== 2)
    throw new Error('Expected exactly the two generated sample certificates')
  const embedded = new Set<string>()
  for (const choice of data.certificates) {
    if (!choice.certificate) throw new Error('Unsupported embedded certificate in this sample')
    const der = hex(AsnConvert.serialize(choice.certificate))
    if (!certificates.some((cert) => cert.der === der) || embedded.has(der))
      throw new Error('Embedded certificate does not match the generated signer pair')
    embedded.add(der)
  }
  const seen = new Set<string>()
  for (const signer of data.signerInfos) {
    const sid = signer.sid.issuerAndSerialNumber
    if (!sid) throw new Error('Unsupported signer identifier in this sample')
    const id = issuer(sid.issuer) + ':' + serial(sid.serialNumber)
    const match = certificates.find((cert) => cert.id === id)
    if (!match || seen.has(id)) throw new Error('Missing, duplicate or unexpected workshop signer')
    seen.add(id)
    if (signer.signatureAlgorithm.algorithm !== signatures[match.algorithm])
      throw new Error('CMS signature algorithm does not match selected signer')
    if (match.algorithm !== 'RSA-PSS' && signer.signatureAlgorithm.parameters !== undefined)
      throw new Error('Selected PQ/ECDSA sample signature parameters must be absent')
    if (signer.digestAlgorithm.algorithm !== SHA256)
      throw new Error('Unexpected sample CMS digest algorithm')
    if (match.algorithm === 'RSA-PSS') {
      const parameters = signer.signatureAlgorithm.parameters
      if (!parameters) throw new Error('Missing RSA-PSS parameters')
      const pss = parse(new Uint8Array(parameters), RsaSaPssParams)
      const mgfHash =
        pss.maskGenAlgorithm.parameters &&
        AsnConvert.parse(pss.maskGenAlgorithm.parameters, AlgorithmIdentifier)
      if (
        pss.hashAlgorithm.algorithm !== SHA256 ||
        pss.maskGenAlgorithm.algorithm !== '1.2.840.113549.1.1.8' ||
        mgfHash?.algorithm !== SHA256 ||
        pss.saltLength !== 32 ||
        pss.trailerField !== 1
      )
        throw new Error('RSA-PSS parameters do not match the existing SHA-256 sample profile')
    }
  }
  return data.signerInfos.length
}
