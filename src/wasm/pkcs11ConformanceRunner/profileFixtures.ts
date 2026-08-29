// PKCS#11 v3.2 Profiles — WS-11 Phase 4 fixture provisioning.
//
// AUTH-M-1-32 and CERT-M-1-32 each assume token objects OASIS's own example
// pre-supposes but never creates itself (a "testrsa-pub"/"testrsa-pri" key
// pair; a "Mozilla Builtin Roots" data object plus a GlobalSign Root CA
// certificate). This module provisions the real objects those test cases
// need, via plain PKCS#11 calls on a freshly initialized token — never
// fabricated data injected past the engine.

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  buildTemplate,
  freeTemplate,
  buildMech,
  writeBytes,
  checkRV,
  type AttrDef,
  CKA_CLASS,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_LABEL,
  CKA_ID,
  CKA_VALUE,
  CKA_KEY_TYPE,
  CKA_MODULUS_BITS,
  CKA_MODULUS,
  CKA_PUBLIC_EXPONENT,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_SIGN,
  CKA_VERIFY,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_CERTIFICATE_TYPE,
  CKA_SUBJECT,
  CKA_ISSUER,
  CKA_SERIAL_NUMBER,
  CKO_DATA,
  CKO_CERTIFICATE,
  CKO_PUBLIC_KEY,
  CKO_PRIVATE_KEY,
  CKK_RSA,
  CKC_X_509,
  CKM_RSA_PKCS_KEY_PAIR_GEN,
} from '../softhsm'

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.trim()
  const out = new Uint8Array(Math.floor(clean.length / 2))
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16)
  return out
}

const createObject = (M: SoftHSMModule, hSession: number, attrs: AttrDef[]): number => {
  const tpl = buildTemplate(M, attrs)
  const hPtr = M._malloc(4)
  try {
    checkRV(M._C_CreateObject(hSession, tpl.ptr, attrs.length, hPtr), 'C_CreateObject (fixture)')
    return M.getValue(hPtr, 'i32') >>> 0
  } finally {
    freeTemplate(M, tpl, attrs.length)
    M._free(hPtr)
  }
}

const getAttrBytes = (
  M: SoftHSMModule,
  hSession: number,
  hObject: number,
  type: number
): Uint8Array => {
  const lenTpl = buildTemplate(M, [{ type }])
  try {
    checkRV(
      M._C_GetAttributeValue(hSession, hObject, lenTpl.ptr, 1),
      'C_GetAttributeValue(size query, fixture readback)'
    )
    const len = M.getValue(lenTpl.ptr + 8, 'i32') >>> 0
    const ptr = M._malloc(Math.max(len, 1))
    try {
      const valTpl = buildTemplate(M, [{ type, bytesPtr: ptr, bytesLen: len }])
      try {
        checkRV(
          M._C_GetAttributeValue(hSession, hObject, valTpl.ptr, 1),
          'C_GetAttributeValue(fetch, fixture readback)'
        )
        return M.HEAPU8.slice(ptr, ptr + len)
      } finally {
        freeTemplate(M, valTpl, 1)
      }
    } finally {
      M._free(ptr)
    }
  } finally {
    freeTemplate(M, lenTpl, 1)
  }
}

export interface AuthFixtureBindings {
  'Fixture.Modulus': string
  'Fixture.PublicExponent': string
  // Structurally compatible with runXmlTestCase's initialBindings
  // (Record<string, string | number>) — TS won't treat an interface with
  // only named properties as assignable to a Record without this.
  [key: string]: string | number
}

/**
 * AUTH-M-1-32 §5.4 fixture: an RSA-2048 key pair labeled exactly
 * "testrsa-pub"/"testrsa-pri" (the labels the XML's C_FindObjectsInit
 * templates look up), sharing a CKA_ID. Reads the real generated
 * CKA_MODULUS/CKA_PUBLIC_EXPONENT back so the executor's D1 verification
 * has something genuine to check against — never OASIS's static example,
 * which no implementation can reproduce (its signing key was never
 * published).
 */
export const provisionAuthFixture = (M: SoftHSMModule, hSession: number): AuthFixtureBindings => {
  const mech = buildMech(M, CKM_RSA_PKCS_KEY_PAIR_GEN)
  const expBytes = new Uint8Array([0x01, 0x00, 0x01]) // e=65537
  const expPtr = writeBytes(M, expBytes)
  const idBytes = new TextEncoder().encode('ws11-auth-fixture')
  const idPtr = writeBytes(M, idBytes)
  const pubLabelPtr = writeBytes(M, new TextEncoder().encode('testrsa-pub'))
  const prvLabelPtr = writeBytes(M, new TextEncoder().encode('testrsa-pri'))

  const pubAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: true },
    { type: CKA_PRIVATE, boolVal: false },
    { type: CKA_LABEL, bytesPtr: pubLabelPtr, bytesLen: 11 },
    { type: CKA_ID, bytesPtr: idPtr, bytesLen: idBytes.length },
    { type: CKA_MODULUS_BITS, ulongVal: 2048 },
    { type: CKA_PUBLIC_EXPONENT, bytesPtr: expPtr, bytesLen: 3 },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: true },
  ]
  const prvAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: true },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_LABEL, bytesPtr: prvLabelPtr, bytesLen: 11 },
    { type: CKA_ID, bytesPtr: idPtr, bytesLen: idBytes.length },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DECRYPT, boolVal: true },
  ]

  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubHPtr = M._malloc(4)
  const prvHPtr = M._malloc(4)
  let pubHandle = 0
  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubHPtr,
        prvHPtr
      ),
      'C_GenerateKeyPair (AUTH fixture)'
    )
    pubHandle = M.getValue(pubHPtr, 'i32') >>> 0
  } finally {
    M._free(mech)
    M._free(expPtr)
    M._free(idPtr)
    M._free(pubLabelPtr)
    M._free(prvLabelPtr)
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }

  const modulus = getAttrBytes(M, hSession, pubHandle, CKA_MODULUS)
  const publicExponent = getAttrBytes(M, hSession, pubHandle, CKA_PUBLIC_EXPONENT)
  return {
    'Fixture.Modulus': bytesToHex(modulus),
    'Fixture.PublicExponent': bytesToHex(publicExponent),
  }
}

// WS-11 Phase 4 (2026-08-28) — extracted byte-for-byte from the vendored
// src/data/pkcs11-profiles/test-cases/CERT-M-1-32.xml (Object[1]'s VALUE),
// re-verified against src/data/pkcs11-profiles/fixtures/_provenance.json
// (sha256 eb:d4:10:40:...:c9:9). The Subject/Issuer DN DER (identical —
// self-signed root) and serial number were derived by parsing that same
// DER with python cryptography==49.0.0 (`cert.subject.public_bytes()`),
// not hand-encoded; see fixtures/_provenance.json for the derivation note.
const GLOBALSIGN_SUBJECT_ISSUER_DER_HEX =
  '3057310b300906035504061302424531193017060355040a1310476c6f62616c5369676e206e762d73613110300e060355040b1307526f6f74204341311b301906035504031312476c6f62616c5369676e20526f6f74204341'
const GLOBALSIGN_SERIAL_NUMBER_HEX = '040000000001154b5ac394'

/**
 * CERT-M-1-32 §5.5 fixture: a "Mozilla Builtin Roots" CKO_DATA descriptor
 * object, a public GlobalSign Root CA CKO_CERTIFICATE (the exact DER bytes
 * OASIS's own example embeds), and — to make §5.5 conditions 8.b/8.c
 * actually exercisable rather than vacuously true — a second RSA key pair
 * sharing the certificate's CKA_ID. Creation order matters: CERT-M-1-32's
 * unauthenticated C_FindObjects(TOKEN=TRUE) expects the data object at
 * index 0 and the certificate at index 1 (both engines' C_FindObjectsInit
 * now returns non-descriptor objects in creation order — WS-11 Phases 1-2).
 *
 * `certXml` is the vendored CERT-M-1-32.xml text (the caller already loads
 * it via `?raw` to run the test case itself) — the 889-byte certificate DER
 * is read out of it directly rather than duplicated as a second copy that
 * could silently drift from the fixture the executor replays against.
 */
export const provisionCertFixture = (M: SoftHSMModule, hSession: number, certXml: string): void => {
  // 1. "Mozilla Builtin Roots" — 22 bytes: 21 ASCII chars OASIS's captured
  // NSS module label carries, plus the trailing NUL that module stored it
  // with (the XML's own C_GetAttributeValue expects length=22 on this
  // attribute — see the executor's decodeAttrText/D7 note).
  const labelBytes = new Uint8Array([...new TextEncoder().encode('Mozilla Builtin Roots'), 0x00])
  const labelPtr = writeBytes(M, labelBytes)
  const dataValuePtr = writeBytes(M, new Uint8Array(0))
  try {
    createObject(M, hSession, [
      { type: CKA_CLASS, ulongVal: CKO_DATA },
      { type: CKA_TOKEN, boolVal: true },
      { type: CKA_PRIVATE, boolVal: false },
      { type: CKA_LABEL, bytesPtr: labelPtr, bytesLen: labelBytes.length },
      { type: CKA_VALUE, bytesPtr: dataValuePtr, bytesLen: 0 },
    ])
  } finally {
    M._free(labelPtr)
    M._free(dataValuePtr)
  }

  // 2. The certificate itself — publicly findable, no login required.
  const certDerMatch = /type="VALUE" value="([0-9a-f]+)"/.exec(certXml)
  if (!certDerMatch) throw new Error('provisionCertFixture: no hex VALUE attribute in certXml')
  const certDer = hexToBytes(certDerMatch[1])
  const subjectIssuerDer = hexToBytes(GLOBALSIGN_SUBJECT_ISSUER_DER_HEX)
  const serialDer = hexToBytes(GLOBALSIGN_SERIAL_NUMBER_HEX)
  const certLabelBytes = new TextEncoder().encode('GlobalSign Root CA')
  const certIdBytes = new TextEncoder().encode('ws11-cert-fixture')
  const valuePtr = writeBytes(M, certDer)
  const subjectPtr = writeBytes(M, subjectIssuerDer)
  const issuerPtr = writeBytes(M, subjectIssuerDer)
  const serialPtr = writeBytes(M, serialDer)
  const certLabelPtr = writeBytes(M, certLabelBytes)
  const certIdPtr = writeBytes(M, certIdBytes)
  let certHandle = 0
  try {
    certHandle = createObject(M, hSession, [
      { type: CKA_CLASS, ulongVal: CKO_CERTIFICATE },
      { type: CKA_CERTIFICATE_TYPE, ulongVal: CKC_X_509 },
      { type: CKA_TOKEN, boolVal: true },
      { type: CKA_PRIVATE, boolVal: false },
      { type: CKA_VALUE, bytesPtr: valuePtr, bytesLen: certDer.length },
      { type: CKA_SUBJECT, bytesPtr: subjectPtr, bytesLen: subjectIssuerDer.length },
      { type: CKA_ISSUER, bytesPtr: issuerPtr, bytesLen: subjectIssuerDer.length },
      { type: CKA_SERIAL_NUMBER, bytesPtr: serialPtr, bytesLen: serialDer.length },
      { type: CKA_LABEL, bytesPtr: certLabelPtr, bytesLen: certLabelBytes.length },
      { type: CKA_ID, bytesPtr: certIdPtr, bytesLen: certIdBytes.length },
    ])
  } finally {
    M._free(valuePtr)
    M._free(subjectPtr)
    M._free(issuerPtr)
    M._free(serialPtr)
    M._free(certLabelPtr)
    M._free(certIdPtr)
  }
  void certHandle

  // 3. §5.5 cond. 8.b/8.c: a key pair sharing the cert's CKA_ID, so a
  // matching public *and* private key are both findable by that ID
  // without a login — otherwise 8.b/8.c would pass vacuously (no key to
  // find at all is indistinguishable from "the spec doesn't require one
  // here" unless a probe actually creates one and looks for it).
  const mech = buildMech(M, CKM_RSA_PKCS_KEY_PAIR_GEN)
  const expPtr = writeBytes(M, new Uint8Array([0x01, 0x00, 0x01]))
  const keyIdPtr = writeBytes(M, certIdBytes)
  const pubAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: true },
    { type: CKA_PRIVATE, boolVal: false },
    { type: CKA_ID, bytesPtr: keyIdPtr, bytesLen: certIdBytes.length },
    { type: CKA_MODULUS_BITS, ulongVal: 2048 },
    { type: CKA_PUBLIC_EXPONENT, bytesPtr: expPtr, bytesLen: 3 },
    { type: CKA_VERIFY, boolVal: true },
  ]
  const prvAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: true },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_ID, bytesPtr: keyIdPtr, bytesLen: certIdBytes.length },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
  ]
  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubHPtr = M._malloc(4)
  const prvHPtr = M._malloc(4)
  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubHPtr,
        prvHPtr
      ),
      'C_GenerateKeyPair (CERT fixture key pair)'
    )
  } finally {
    M._free(mech)
    M._free(expPtr)
    M._free(keyIdPtr)
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}
