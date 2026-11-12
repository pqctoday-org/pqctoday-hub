// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { fromBER } from 'asn1js'
import { AsnConvert } from '@peculiar/asn1-schema'
import { ContentInfo, SignedData, id_signedData } from '@peculiar/asn1-cms'
import { Certificate } from '@peculiar/asn1-x509'
import { RSAPublicKey } from '@peculiar/asn1-rsa'
import { X509Certificate } from '@peculiar/x509'
import { smimeEnvelopeSigned } from './smimeMultipart'

const utf8 = (s: string) => new TextEncoder().encode(s)
export const sampleMailHeaders = {
  from: 'alice@pqc-workshop.example',
  to: 'bob@pqc-workshop.example',
  date: 'Thu, 12 Nov 2026 12:00:00 GMT',
} as const
export function decodeSampleBase64(text: string): Uint8Array {
  if (text.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(text))
    throw new Error('Malformed base64 sample')
  try {
    return Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
  } catch {
    throw new Error('Malformed base64 sample')
  }
}
export function certificateDer(pem: string): Uint8Array {
  const lines = pem.replace(/\r\n/g, '\n').split('\n')
  while (lines.at(-1) === '') lines.pop()
  if (
    lines.shift() !== '-----BEGIN CERTIFICATE-----' ||
    lines.pop() !== '-----END CERTIFICATE-----'
  )
    throw new Error('Expected one complete certificate PEM')
  return decodeSampleBase64(lines.join(''))
}
function parse<T>(bytes: Uint8Array, schema: new () => T): T {
  const input = bytes.slice().buffer
  if (!bytes.length || fromBER(input).offset !== bytes.length)
    throw new Error('Malformed or trailing DER sample')
  return AsnConvert.parse(input, schema)
}
const same = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b.at(i))
/** Count the existing opaque-signed MIME serialization. This is not CMS signature verification. */
export function measureMime(cms: Uint8Array, payloadBytes: number, subject: string) {
  if (!Number.isSafeInteger(payloadBytes) || payloadBytes < 0)
    throw new Error('Invalid payload length')
  if (/[\r\n]/.test(subject)) throw new Error('Subject must be one header line')
  const mime = smimeEnvelopeSigned(cms, { ...sampleMailHeaders, subject })
  const separator = mime.indexOf('\r\n\r\n') + 4
  const encodedBody = mime.slice(separator)
  if (!same(decodeSampleBase64(encodedBody.replace(/\r\n/g, '')), cms))
    throw new Error('MIME body differs from CMS sample')
  const mimeBytes = utf8(mime).length
  return {
    mime,
    mimeBytes,
    headerBytes: utf8(mime.slice(0, separator)).length,
    bodyBytes: utf8(encodedBody).length,
    overheadBytes: mimeBytes - payloadBytes,
  }
}
/** Parse complete public encodings from the retained, independently verified samples.
 * Encoding consistency checks do not establish signature validity, trust or S/MIME policy compliance.
 */
export function measureEmailSample(
  sample: { certPem: string; cmsBase64: string },
  payload: string,
  subject: string
) {
  const der = certificateDer(sample.certPem)
  const cert = parse(der, Certificate)
  const x509 = new X509Certificate(der.slice().buffer)
  const spki = cert.tbsCertificate.subjectPublicKeyInfo
  const spkiDer = new Uint8Array(AsnConvert.serialize(spki))
  const cms = decodeSampleBase64(sample.cmsBase64)
  const ci = parse(cms, ContentInfo)
  if (ci.contentType !== id_signedData) throw new Error('Expected opaque CMS SignedData')
  const data = parse(new Uint8Array(ci.content), SignedData)
  if (data.signerInfos.length !== 1 || data.certificates?.length !== 1)
    throw new Error('Expected one signer and its embedded certificate')
  const embedded = data.certificates[0].certificate
  if (!embedded || !same(new Uint8Array(AsnConvert.serialize(embedded)), der))
    throw new Error('Embedded signer certificate differs from displayed certificate')
  const encapsulated = data.encapContentInfo.eContent
  if (!encapsulated?.single) throw new Error('Expected embedded opaque signed content')
  const content = new Uint8Array(encapsulated.single.buffer)
  if (!same(content, utf8(payload)))
    throw new Error('CMS content differs from the captured payload')
  let componentBytes = spki.subjectPublicKey.byteLength
  let rsaBits: number | null = null
  if (spki.algorithm.algorithm === '1.2.840.113549.1.1.1') {
    const rsa = parse(new Uint8Array(spki.subjectPublicKey), RSAPublicKey)
    const modulus = new Uint8Array(rsa.modulus)
    let first = 0
    while (first < modulus.length && modulus.at(first) === 0) first++
    componentBytes = modulus.length - first
    rsaBits = componentBytes
      ? (componentBytes - 1) * 8 + (32 - Math.clz32(modulus.at(first) ?? 0))
      : 0
  }
  const signatureBytes = cert.signatureValue.byteLength
  return {
    ...measureMime(cms, content.length, subject),
    payloadBytes: content.length,
    certDerBytes: der.length,
    certPemBytes: utf8(sample.certPem).length,
    spkiDerBytes: spkiDer.length,
    componentBytes,
    rsaBits,
    certSignatureBytes: signatureBytes,
    certOtherBytes: der.length - spkiDer.length - signatureBytes,
    cmsBytes: cms.length,
    cmsSignatureBytes: data.signerInfos[0].signature.byteLength,
    keyOid: spki.algorithm.algorithm,
    certSignatureOid: cert.signatureAlgorithm.algorithm,
    cmsSignatureOid: data.signerInfos[0].signatureAlgorithm.algorithm,
    subject: x509.subject,
    issuer: x509.issuer,
    notBefore: x509.notBefore.toISOString(),
    notAfter: x509.notAfter.toISOString(),
    extensions: x509.extensions.map((e) => e.type),
  }
}
