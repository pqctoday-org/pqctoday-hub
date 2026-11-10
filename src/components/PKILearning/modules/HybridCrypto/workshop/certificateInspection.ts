// SPDX-License-Identifier: AGPL-3.0-only
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate, type Name } from '@peculiar/asn1-x509'
import type { VirtualFile } from '@/components/OpenSSLStudio/store'
import { HYBRID_CERT_FORMATS } from '../constants'
import { oidToLabel, type CertInfo } from '../services/derParser'
import { derToPem } from '../data/ietfTestVectors'

export interface CertificateInspection {
  der: Uint8Array
  pem: string
  text: string
  info: CertInfo
  selfIssued: boolean
  sizes: { derSize: number; pemSize: number; pubKeySize: number; sigSize: number; overhead: number }
}

const hex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

function nameText(name: Name): string {
  return (
    name
      .map((rdn) =>
        rdn
          .map((attribute) => {
            const value = attribute.value
            const text =
              value.utf8String ??
              value.printableString ??
              value.ia5String ??
              value.bmpString ??
              value.universalString ??
              value.teletexString
            const short = (
              { '2.5.4.3': 'CN', '2.5.4.6': 'C', '2.5.4.10': 'O', '2.5.4.11': 'OU' } as Record<
                string,
                string
              >
            )[attribute.type]
            return text === undefined
              ? `${attribute.type}=#${hex(value.anyValue ?? AsnConvert.serialize(value))}`
              : `${short ?? attribute.type}=${JSON.stringify(text)}`
          })
          .join('+')
      )
      .join(', ') || '(empty encoded name)'
  )
}

/** Check complete outer DER framing; the existing schema parser reads its fields. */
function requireCompleteCertificate(der: Uint8Array) {
  if (der.length < 2 || der[0] !== 0x30) throw new Error('Expected a complete certificate SEQUENCE')
  let offset = 2
  let length = der[1]
  if (length & 0x80) {
    const count = length & 0x7f
    if (!count || count > 4 || offset + count > der.length)
      throw new Error('Invalid certificate length')
    length = 0
    for (let i = 0; i < count; i++) length = length * 256 + der[offset++]
  }
  if (offset + length !== der.length) throw new Error('Certificate length does not match its bytes')
}

export function inspectCertificateDer(
  input: Uint8Array,
  originalPem?: string
): CertificateInspection {
  const der = new Uint8Array(input)
  requireCompleteCertificate(der)
  const cert = AsnConvert.parse(der, Certificate)
  const tbs = cert.tbsCertificate
  const key = new Uint8Array(tbs.subjectPublicKeyInfo.subjectPublicKey)
  const signature = new Uint8Array(cert.signatureValue)
  const before = tbs.validity.notBefore.getTime()
  const after = tbs.validity.notAfter.getTime()
  if (!Number.isFinite(before.getTime()) || !Number.isFinite(after.getTime()) || !key.length) {
    throw new Error('Certificate fields are incomplete')
  }
  const pem = originalPem ?? derToPem(der)
  const sizes = {
    derSize: der.length,
    pemSize: new TextEncoder().encode(pem).length,
    pubKeySize: key.length,
    sigSize: signature.length,
    overhead: der.length - key.length - signature.length,
  }
  if (sizes.overhead < 0) throw new Error('Certificate byte partitions are inconsistent')
  const info: CertInfo = {
    algorithmOID: cert.signatureAlgorithm.algorithm,
    publicKeyOID: tbs.subjectPublicKeyInfo.algorithm.algorithm,
    extensionOIDs: (tbs.extensions ?? []).map((e) => e.extnID),
    publicKeySizeBytes: key.length,
    signatureSizeBytes: signature.length,
    publicKeyBytes: key,
    signatureBytes: signature,
  }
  const text = [
    'Certificate (custom structural display; parsing is not verification):',
    `    Version: ${tbs.version + 1}`,
    `    Serial Number (encoded hex): ${hex(tbs.serialNumber)}`,
    `    Issuer: ${nameText(tbs.issuer)}`,
    `    Subject: ${nameText(tbs.subject)}`,
    `    Not Before: ${before.toISOString()}`,
    `    Not After: ${after.toISOString()}`,
    `    Signature Algorithm: ${oidToLabel(info.algorithmOID)} (${info.algorithmOID})`,
    `    Public Key Algorithm: ${oidToLabel(info.publicKeyOID)} (${info.publicKeyOID})`,
    `    Subject public-key payload: ${key.length} octets`,
    `    Signature payload: ${signature.length} octets`,
    ...info.extensionOIDs.map((oid) => `    Extension: ${oidToLabel(oid)} (${oid})`),
  ].join('\n')
  return {
    der,
    pem,
    text,
    info,
    sizes,
    selfIssued: hex(AsnConvert.serialize(tbs.issuer)) === hex(AsnConvert.serialize(tbs.subject)),
  }
}

export function inspectCertificatePem(content: Uint8Array | string): CertificateInspection {
  const pem =
    typeof content === 'string'
      ? content
      : new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(content)
  const match = pem.match(
    /^\s*-----BEGIN CERTIFICATE-----\s+([A-Za-z0-9+/=\s]+?)\s+-----END CERTIFICATE-----\s*$/
  )
  if (!match) throw new Error('Expected one public CERTIFICATE PEM block')
  const base64 = match[1].replace(/\s/g, '')
  if (!base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64))
    throw new Error('Invalid certificate base64')
  const binary = atob(base64)
  if (btoa(binary) !== base64) throw new Error('Invalid certificate base64 encoding')
  return inspectCertificateDer(
    Uint8Array.from(binary, (c) => c.charCodeAt(0)),
    pem
  )
}

export interface WorkspaceCertificate {
  label: string
  file: VirtualFile
  pem: string
  parsed: string
  inspection?: CertificateInspection
  error?: string
}

/** Exact existing Step6 public-output filenames; names are source labels, not provenance. */
export function workspaceCertificateGroups(files: VirtualFile[]) {
  return HYBRID_CERT_FORMATS.flatMap((format) => {
    const suffixes =
      format.id === 'related-certs'
        ? ['-ca', '-cert-a', '-cert-b']
        : format.id === 'cert-discovery'
          ? ['-ca', '-cert-a', '']
          : ['pure-pqc', 'pure-pqc-slh', 'pure-pqc-kem', 'composite-kem'].includes(format.id)
            ? ['-ca', '']
            : ['']
    const names = suffixes.map((suffix) => `hybrid-${format.id}${suffix}.pem`)
    const certs = names.flatMap((name): WorkspaceCertificate[] => {
      const file = files.find((f) => f.name === name && f.type === 'cert')
      if (!file) return []
      try {
        const inspection = inspectCertificatePem(file.content)
        return [{ label: name, file, pem: inspection.pem, parsed: inspection.text, inspection }]
      } catch (e) {
        return [
          {
            label: name,
            file,
            pem: '',
            parsed: '',
            error: e instanceof Error ? e.message : 'Certificate inspection failed',
          },
        ]
      }
    })
    return certs.length ? [{ formatId: format.id, formatLabel: format.label, certs }] : []
  })
}
