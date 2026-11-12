// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { fromBER, Sequence } from 'asn1js'
import { AsnConvert } from '@peculiar/asn1-schema'
import { GeneralNames, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { PemConverter, Pkcs10CertificateRequest } from '@peculiar/x509'
import { base64urlnopad } from '@scure/base'
import { openSSLService, type OpenSSLCommandResult } from '@/services/crypto/OpenSSLService'

const ML_DSA_65_OID = '2.16.840.1.101.3.4.3.18'
export const ACME_SAMPLE_DOMAIN = 'example.com'
let nextRun = 0

class SampleRequest extends Pkcs10CertificateRequest {
  get requestInfo() {
    return this.asn.certificationRequestInfo
  }
  get signatureIdentifier() {
    return this.asn.signatureAlgorithm
  }
  get canonicalDer() {
    const originalInfo = this.asn.certificationRequestInfoRaw
    this.asn.certificationRequestInfoRaw = undefined
    try {
      return AsnConvert.serialize(this.asn)
    } finally {
      this.asn.certificationRequestInfoRaw = originalInfo
    }
  }
}

export interface AcmeSampleArtifacts {
  publicKeyPem: string
  csrPem: string
  csrDerBase64Url: string
  subject: string
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  const remaining = b.values()
  return a.every((value) => value === remaining.next().value)
}
function singlePem(pem: string, tag: string) {
  if (
    !pem.trim().startsWith(`-----BEGIN ${tag}-----`) ||
    !pem.trim().endsWith(`-----END ${tag}-----`)
  )
    throw new Error(`Expected a complete ${tag} PEM artifact.`)
  const blocks = PemConverter.decode(pem)
  if (blocks.length !== 1) throw new Error(`Expected one ${tag} artifact.`)
  const der = blocks[0]
  const decoded = fromBER(der)
  if (decoded.offset !== der.byteLength || !(decoded.result instanceof Sequence))
    throw new Error(`Malformed or trailing ${tag} DER data.`)
  return der
}

/** Inspection of this fixed generated sample, not a general CSR profile validator. */
export function inspectAcmeSampleArtifacts(
  csrPem: string,
  publicKeyPem: string
): AcmeSampleArtifacts {
  const csrDer = singlePem(csrPem, 'CERTIFICATE REQUEST')
  const publicDer = singlePem(publicKeyPem, 'PUBLIC KEY')
  const request = new SampleRequest(csrDer)
  const info = request.requestInfo
  if (!equalBytes(new Uint8Array(request.canonicalDer), new Uint8Array(csrDer)))
    throw new Error('The sample CSR must be a complete DER-encoded request.')
  const publicInfo = AsnConvert.parse(publicDer, SubjectPublicKeyInfo)
  if (info.version !== 0) throw new Error('The sample requires PKCS#10 request version 0.')
  for (const identifier of [
    info.subjectPKInfo.algorithm,
    publicInfo.algorithm,
    request.signatureIdentifier,
  ]) {
    if (identifier.algorithm !== ML_DSA_65_OID || identifier.parameters !== undefined)
      throw new Error('The sample must use ML-DSA-65 with absent algorithm parameters.')
  }
  const expectedPublicDer = new Uint8Array(AsnConvert.serialize(info.subjectPKInfo))
  if (!equalBytes(expectedPublicDer, new Uint8Array(publicDer)))
    throw new Error('The CSR public key does not match the exported sample public key.')
  if (!equalBytes(new Uint8Array(AsnConvert.serialize(publicInfo)), new Uint8Array(publicDer)))
    throw new Error('The exported sample public-key encoding was not fully decoded.')
  if (info.attributes.length !== 1 || info.attributes[0].type !== '1.2.840.113549.1.9.14')
    throw new Error('Unexpected attributes in the fixed sample CSR.')
  if (request.extensions.length !== 1)
    throw new Error('Unexpected extensions in the fixed sample CSR.')
  const commonNames = request.subjectName.getField('2.5.4.3')
  if (commonNames.length !== 1 || commonNames[0] !== ACME_SAMPLE_DOMAIN)
    throw new Error('The sample CSR subject must identify example.com.')
  const san = request.getExtension('2.5.29.17')
  if (!san) throw new Error('The sample CSR must request the example.com DNS name.')
  const names = AsnConvert.parse(san.value, GeneralNames)
  if (names.length !== 1 || names[0].dNSName !== ACME_SAMPLE_DOMAIN)
    throw new Error('The sample CSR requested DNS names do not match the example order.')
  return {
    publicKeyPem,
    csrPem,
    csrDerBase64Url: base64urlnopad.encode(new Uint8Array(csrDer)),
    subject: request.subject,
  }
}

function outputFile(result: OpenSSLCommandResult, filename: string) {
  if (result.error) throw new Error(result.error)
  const files = result.files.filter((item) => item.name === filename)
  if (files.length !== 1 || !files[0].data.length)
    throw new Error(`The sample operation did not produce one nonempty ${filename} file.`)
  return files[0]
}

/** Existing software OpenSSL operations; no ACME request is transmitted. */
export async function generateAcmeSampleArtifacts(
  isCurrent: () => boolean
): Promise<AcmeSampleArtifacts> {
  const prefix = `acme-sample-${Date.now()}-${++nextRun}`
  const keyName = `${prefix}.key.pem`
  const publicName = `${prefix}.pub.pem`
  const csrName = `${prefix}.csr.pem`
  const configName = `${prefix}.cnf`
  const assertCurrent = () => {
    if (!isCurrent()) throw new Error('The sample artifact run is no longer current.')
  }
  const config = new TextEncoder().encode(
    '[req]\nprompt = no\ndistinguished_name = dn\nreq_extensions = req_ext\n[dn]\nCN = example.com\n[req_ext]\nsubjectAltName = DNS:example.com\n'
  )
  let keyRequested = false
  try {
    assertCurrent()
    keyRequested = true
    const key = outputFile(
      await openSSLService.execute(`openssl genpkey -algorithm ml-dsa-65 -out ${keyName}`),
      keyName
    )
    assertCurrent()
    const publicFile = outputFile(
      await openSSLService.execute(`openssl pkey -in ${keyName} -pubout -out ${publicName}`, [key]),
      publicName
    )
    assertCurrent()
    const csrFile = outputFile(
      await openSSLService.execute(
        `openssl req -new -key ${keyName} -out ${csrName} -config ${configName}`,
        [key, { name: configName, data: config }]
      ),
      csrName
    )
    assertCurrent()
    const verification = await openSSLService.execute(`openssl req -verify -in ${csrName} -noout`, [
      csrFile,
    ])
    assertCurrent()
    const verified =
      !verification.error &&
      `${verification.stdout}\n${verification.stderr}`
        .split(/\r?\n/)
        .some((line) => /^Certificate request self-signature verify OK$/i.test(line.trim()))
    if (!verified) throw new Error('The sample CSR self-signature could not be verified.')
    return inspectAcmeSampleArtifacts(
      new TextDecoder().decode(csrFile.data),
      new TextDecoder().decode(publicFile.data)
    )
  } finally {
    // Existing best-effort virtual-file cleanup; not a secure-erasure claim.
    if (keyRequested) {
      try {
        await openSSLService.deleteFile(keyName)
      } catch {
        /* Best-effort cleanup only. */
      }
    }
  }
}
