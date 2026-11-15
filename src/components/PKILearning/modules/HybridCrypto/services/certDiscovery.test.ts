// SPDX-License-Identifier: AGPL-3.0-only
//
// Certificate Discovery (draft-ietf-lamps-certdiscovery-06) wire format.
//
// The expected bytes below were produced by a separate encoder written from the
// draft's Appendix A module (DEFINITIONS EXPLICIT TAGS), not by certBuilder:
//
//   RelatedCertificateDescriptor ::= SEQUENCE {
//     method CertDiscoveryMethod,                -- CHOICE { byUri IA5String, … }
//     signatureAlgorithm [0] AlgorithmIdentifier OPTIONAL,
//     publicKeyAlgorithm [1] AlgorithmIdentifier OPTIONAL,
//     certHash [2] RelatedCertificate OPTIONAL } -- RFC 9763
//
// -03 carried `byUri [0] IMPLICIT`, an `intent` OID and IMPLICIT algorithm
// fields; -06 has none of those, so a regression to the -03 layout fails here.
import { describe, expect, it } from 'vitest'
import { OctetString } from '@peculiar/asn1-schema'
import { Certificate, Extension, Extensions, TBSCertificate } from '@peculiar/asn1-x509'
import {
  buildCertDiscoveryExtension,
  CERT_DISCOVERY_PLACEHOLDER_OIDS,
  ML_DSA_65_OID_STR,
} from './certBuilder'
import { readDiscoveryAdvertisement } from './certVerifier'

const hex = (b: ArrayBuffer | Uint8Array) => Buffer.from(new Uint8Array(b)).toString('hex')
const URI = 'https://pqctoday.invalid/s.der'
const HASH = new Uint8Array(32).fill(0x11)

// subjectInfoAccess extnValue, -06 layout, with certHash (SHA-256, parameters absent).
const SIA_WITH_HASH =
  '308193308190060a2b0601040181fd590101a08181060a2b0601040181fd590102a0733071' +
  '161e68747470733a2f2f707163746f6461792e696e76616c69642f732e646572' +
  'a00d300b0609608648016503040312a10d300b0609608648016503040312' +
  'a231302f300b06096086480165030402010420' +
  '1111111111111111111111111111111111111111111111111111111111111111'
// Same, without certHash.
const SIA_NO_HASH =
  '305e305c060a2b0601040181fd590101a04e060a2b0601040181fd590102a040303e' +
  '161e68747470733a2f2f707163746f6461792e696e76616c69642f732e646572' +
  'a00d300b0609608648016503040312a10d300b0609608648016503040312'

/** A certificate shell carrying one extension — enough for the reader, which only looks there. */
function certWith(ext: Extension): Certificate {
  return new Certificate({
    tbsCertificate: new TBSCertificate({ extensions: new Extensions([ext]) }),
  })
}

describe('Certificate Discovery -06 encoding', () => {
  it('encodes byUri, EXPLICIT [0]/[1] algorithms and certHash [2] byte for byte', () => {
    const ext = buildCertDiscoveryExtension({
      uri: URI,
      signatureOid: ML_DSA_65_OID_STR,
      publicKeyOid: ML_DSA_65_OID_STR,
      certHash: HASH,
    })
    expect(ext.extnID).toBe('1.3.6.1.5.5.7.1.11')
    expect(ext.critical).toBe(false)
    expect(hex(ext.extnValue.buffer)).toBe(SIA_WITH_HASH)
  })

  it('omits certHash when none is given', () => {
    const ext = buildCertDiscoveryExtension({
      uri: URI,
      signatureOid: ML_DSA_65_OID_STR,
      publicKeyOid: ML_DSA_65_OID_STR,
    })
    expect(hex(ext.extnValue.buffer)).toBe(SIA_NO_HASH)
  })

  it('carries no -03 intent field and no IMPLICIT byUri', () => {
    const der = hex(
      buildCertDiscoveryExtension({
        uri: URI,
        signatureOid: ML_DSA_65_OID_STR,
        publicKeyOid: ML_DSA_65_OID_STR,
        certHash: HASH,
      }).extnValue.buffer
    )
    // byUri is a universal IA5String (0x16), never the -03 context tag 0x80.
    expect(der).toContain('161e' + Buffer.from(URI).toString('hex'))
    expect(der).not.toContain('801e')
    // No id-rcd intent OID under the placeholder arc 1.3.6.1.4.1.32473.1.3.
    expect(der).not.toContain('060b2b0601040181fd59010301')
  })

  it('reads its own encoding back, including certHash', () => {
    const ext = buildCertDiscoveryExtension({
      uri: URI,
      signatureOid: ML_DSA_65_OID_STR,
      publicKeyOid: ML_DSA_65_OID_STR,
      certHash: HASH,
    })
    expect(readDiscoveryAdvertisement(certWith(ext), CERT_DISCOVERY_PLACEHOLDER_OIDS)).toEqual({
      method: 'byUri',
      uri: URI,
      signatureOid: ML_DSA_65_OID_STR,
      publicKeyOid: ML_DSA_65_OID_STR,
      certHash: { hashAlgorithmOid: '2.16.840.1.101.3.4.2.1', hashValue: HASH },
    })
  })

  it('reads the pinned vector (independent of the builder) the same way', () => {
    const ext = new Extension({
      extnID: '1.3.6.1.5.5.7.1.11',
      critical: false,
      extnValue: new OctetString(new Uint8Array(Buffer.from(SIA_NO_HASH, 'hex')).buffer),
    })
    const adv = readDiscoveryAdvertisement(certWith(ext), CERT_DISCOVERY_PLACEHOLDER_OIDS)
    expect(adv).toEqual({
      method: 'byUri',
      uri: URI,
      signatureOid: ML_DSA_65_OID_STR,
      publicKeyOid: ML_DSA_65_OID_STR,
      certHash: null,
    })
  })
})
