// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { AsnConvert } from '@peculiar/asn1-schema'
import {
  Certificate,
  CertificateList,
  Name,
  AuthorityKeyIdentifier,
  SubjectKeyIdentifier,
  BasicConstraints,
  type Extension,
} from '@peculiar/asn1-x509'
import { fromBER } from 'asn1js'
import { sha256 } from '@noble/hashes/sha2.js'
import type { OpenSSLCommandResult } from '@/services/crypto/OpenSSLService'

const hex = (input: ArrayBuffer) =>
  Array.from(new Uint8Array(input), (b) => b.toString(16).padStart(2, '0')).join('')
export const sampleInputId = (input: string | Uint8Array) =>
  hex(
    sha256(typeof input === 'string' ? new TextEncoder().encode(input) : input)
      .buffer as ArrayBuffer
  )
const nameId = (name: Name) => hex(AsnConvert.serialize(name))
function der(input: string | Uint8Array, label: string): ArrayBuffer {
  const text = typeof input === 'string' ? input : new TextDecoder().decode(input)
  let data: Uint8Array
  if (text.trimStart().startsWith('-----BEGIN')) {
    const match = text
      .trim()
      .match(new RegExp(`^-----BEGIN ${label}-----\\s+([A-Za-z0-9+/=\\s]+)-----END ${label}-----$`))
    if (!match) throw new Error(`Select one well-formed ${label} sample`)
    data = Uint8Array.from(atob(match[1].replace(/\s/g, '')), (c) => c.charCodeAt(0))
  } else if (input instanceof Uint8Array) data = input
  else throw new Error(`Select a PEM ${label} sample`)
  const buffer = data.slice().buffer
  if (fromBER(buffer).offset !== data.length) throw new Error(`Malformed or trailing ${label} data`)
  return buffer
}
function extension(extensions: Extension[] | undefined, oid: string) {
  const matches = (extensions ?? []).filter((e) => e.extnID === oid)
  if (matches.length > 1) throw new Error('Repeated sample extension; applicability is incomplete')
  return matches[0]
}
function checkKeyIdentifier(
  extensions: Extension[] | undefined,
  caExtensions: Extension[] | undefined
) {
  const akiExt = extension(extensions, '2.5.29.35')
  const skiExt = extension(caExtensions, '2.5.29.14')
  if (!akiExt) return
  const aki = AsnConvert.parse(akiExt.extnValue.buffer, AuthorityKeyIdentifier)
  if (aki.authorityCertIssuer || aki.authorityCertSerialNumber) {
    throw new Error(
      'Issuer/serial-form authority identifiers are unsupported in this direct-CRL sample'
    )
  }
  if (aki.keyIdentifier && skiExt) {
    const ski = AsnConvert.parse(skiExt.extnValue.buffer, SubjectKeyIdentifier)
    if (hex(aki.keyIdentifier.buffer) !== hex(ski.buffer)) {
      throw new Error(
        'Authority and subject key identifiers differ; choose the matching sample issuer'
      )
    }
  }
}

/** Conservative direct-issuer sample preflight. OpenSSL performs signatures,
 * dates, key-usage and chain/CRL validation; names alone never prove trust. */
export function inspectSampleIssuer(certificatePem: string, caPem: string) {
  const certificate = AsnConvert.parse(der(certificatePem, 'CERTIFICATE'), Certificate)
  const ca = AsnConvert.parse(der(caPem, 'CERTIFICATE'), Certificate)
  const bc = extension(ca.tbsCertificate.extensions, '2.5.29.19')
  if (!bc || !AsnConvert.parse(bc.extnValue.buffer, BasicConstraints).cA)
    throw new Error('Selected sample issuer is not a CA certificate')
  if (nameId(certificate.tbsCertificate.issuer) !== nameId(ca.tbsCertificate.subject)) {
    throw new Error(
      'Encoded issuer and CA subject names do not match; no filename or partial-name fallback is used'
    )
  }
  checkKeyIdentifier(certificate.tbsCertificate.extensions, ca.tbsCertificate.extensions)
  return { certificate, ca }
}

export function inspectSampleCrl(
  certificatePem: string,
  caPem: string,
  crlInput: string | Uint8Array
) {
  const { certificate, ca } = inspectSampleIssuer(certificatePem, caPem)
  const bc = extension(certificate.tbsCertificate.extensions, '2.5.29.19')
  if (bc && AsnConvert.parse(bc.extnValue.buffer, BasicConstraints).cA)
    throw new Error('This direct-CRL exercise supports end-entity samples only')
  const crl = AsnConvert.parse(der(crlInput, 'X509 CRL'), CertificateList)
  if (nameId(crl.tbsCertList.issuer) !== nameId(ca.tbsCertificate.subject))
    throw new Error('CRL issuer does not match the selected sample CA')
  checkKeyIdentifier(crl.tbsCertList.crlExtensions, ca.tbsCertificate.extensions)
  if (
    extension(crl.tbsCertList.crlExtensions, '2.5.29.27') ||
    extension(crl.tbsCertList.crlExtensions, '2.5.29.28') ||
    crl.tbsCertList.revokedCertificates?.some((entry) =>
      extension(entry.crlEntryExtensions, '2.5.29.29')
    )
  ) {
    throw new Error('Delta, scoped or indirect CRLs are unsupported in this direct full-CRL sample')
  }
  if (!crl.tbsCertList.nextUpdate)
    throw new Error('CRL has no nextUpdate; this sample cannot establish its freshness interval')
  return {
    serial: hex(certificate.tbsCertificate.serialNumber),
    thisUpdate: crl.tbsCertList.thisUpdate.getTime().toISOString(),
    nextUpdate: crl.tbsCertList.nextUpdate.getTime().toISOString(),
  }
}
export type SampleCheckStatus = 'passed' | 'revoked' | 'incomplete' | 'error'
export function classifySampleVerify(
  result: Pick<OpenSSLCommandResult, 'stdout' | 'stderr' | 'error'>,
  crl: boolean
): SampleCheckStatus {
  const diagnostic = `${result.stdout}\n${result.stderr}`
  const codes = [...diagnostic.matchAll(/^error (\d+) at (\d+) depth lookup:/gm)].map((m) => ({
    code: Number(m[1]),
    depth: Number(m[2]),
  }))
  // Observed OpenSSL 3.6 verify revoked-certificate outcome: error 23 at leaf
  // depth 0, exit status 2. Other errors (including other codes plus 23) do not
  // establish a completed revocation check.
  if (
    crl &&
    codes.length > 0 &&
    codes.every((c) => c.code === 23 && c.depth === 0) &&
    result.error === 'OpenSSL exited with status 2' &&
    !/:error:[0-9a-f]+:/i.test(diagnostic)
  )
    return 'revoked'
  if (
    !result.error &&
    result.stderr.trim() === '' &&
    codes.length === 0 &&
    /^cert\.pem: OK\s*$/m.test(result.stdout)
  )
    return 'passed'
  return codes.length > 0 ? 'incomplete' : 'error'
}

/** The existing service rejects nonzero command results and appends stderr.
 * Recognize only its observed wrapper; unrelated exceptions stay errors. */
export function sampleVerifyFailure(
  error: unknown
): Pick<OpenSSLCommandResult, 'stdout' | 'stderr' | 'error'> {
  const message = error instanceof Error ? error.message : String(error)
  const match = message.match(/^OpenSSL exited with status (\d+)(?:: ([\s\S]*))?$/)
  return match
    ? { stdout: '', stderr: match[2] ?? '', error: `OpenSSL exited with status ${match[1]}` }
    : { stdout: '', stderr: message, error: 'Verification operation did not complete' }
}
