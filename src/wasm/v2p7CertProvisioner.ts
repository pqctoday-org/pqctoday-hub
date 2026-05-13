/**
 * v2p7CertProvisioner.ts
 *
 * Generates X.509 EK certificates for the 6 V2.7 RC1 PQC EKs and writes
 * them to the spec-mandated §5.3.1 NV slots in the WASM TPM. Runs once at
 * boot after `tpm_wasm_provision_v2p7` (which sets up the EK keys) and
 * `registerPqcBridge` (which wires libtpms ML-KEM/ML-DSA to softhsmv3).
 *
 * Why this lives in JS instead of pqctoday-tpm/wasm/wasm_platform.c:
 *   The stripped libcrypto.a linked into pqctpm.wasm does not expose
 *   EVP_PKEY_keygen for ML-DSA / EC / Ed25519 (no default-provider auto
 *   wiring in that minimal build). The full openssl.wasm CLI used here
 *   via openSSLService DOES support `openssl genpkey -algorithm ML-DSA-65`
 *   and `openssl x509 -new -force_pubkey subject.pem -key issuer.key` —
 *   proven daily by liboqs_dsa.ts and PKIWorkshop/CertSigner.tsx.
 *
 * The cert is INTENTIONALLY non-trust-anchored (ephemeral ML-DSA-65 issuer,
 * one per session). It exists so:
 *   - V2.7 §6.2.x SPKI OID byte-match conformance (the EK Cert Reader tab)
 *     can read a real X.509 from each §5.3.1 NV slot.
 *   - Downstream code can `TPM2_NV_Read 0x01c00072` and get a structurally
 *     valid ML-DSA-65 EK cert (just not signed by a real CA).
 */
import { openSSLService } from '../services/crypto/OpenSSLService'
import { readPublic, nvWrite, nvDefineSpace } from './tpmBridge'

// ── V2.7 EK slot table (mirrors v2p7-reference.ts but lives here too to
//    avoid pulling the playground UI module into the boot path) ────────────
interface EkSlot {
  label: 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024' | 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'
  persistentHandle: number
  nvCertIndex: number
  /** TPMS_*_PARMS byte width: ML-KEM uses 8 (sym+kem 2+2+2+2), ML-DSA uses 3 (parmSet+allowExternalMu). */
  parmsLen: number
  fipsPubKeySize: number
  /** NIST CSOR OID body (9 bytes post tag/length, X.690 §8.19). */
  oidBody: Uint8Array
}

const V2P7_SLOTS: readonly EkSlot[] = [
  {
    label: 'ML-KEM-512',
    persistentHandle: 0x810100b0,
    nvCertIndex: 0x01c00060,
    parmsLen: 8,
    fipsPubKeySize: 800,
    oidBody: new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x04, 0x01]),
  },
  {
    label: 'ML-KEM-768',
    persistentHandle: 0x810100a0,
    nvCertIndex: 0x01c00062,
    parmsLen: 8,
    fipsPubKeySize: 1184,
    oidBody: new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x04, 0x02]),
  },
  {
    label: 'ML-KEM-1024',
    persistentHandle: 0x810100b2,
    nvCertIndex: 0x01c00064,
    parmsLen: 8,
    fipsPubKeySize: 1568,
    oidBody: new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x04, 0x03]),
  },
  {
    label: 'ML-DSA-44',
    persistentHandle: 0x810100b4,
    nvCertIndex: 0x01c00070,
    parmsLen: 3,
    fipsPubKeySize: 1312,
    oidBody: new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x11]),
  },
  {
    label: 'ML-DSA-65',
    persistentHandle: 0x810100b5,
    nvCertIndex: 0x01c00072,
    parmsLen: 3,
    fipsPubKeySize: 1952,
    oidBody: new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x12]),
  },
  {
    label: 'ML-DSA-87',
    persistentHandle: 0x810100b6,
    nvCertIndex: 0x01c00074,
    parmsLen: 3,
    fipsPubKeySize: 2592,
    oidBody: new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x13]),
  },
]

// ── Extract pubkey bytes from a TPMT_PUBLIC blob ────────────────────────────
// TPMT_PUBLIC layout: type(2) + nameAlg(2) + objAttrs(4) + authPolicy{size(2),
//   bytes[authPolicySize]} + parms[parmsLen] + unique{size(2), bytes[uniqueSize]}.
function extractPubFromTpmtPublic(tpmtPublic: Uint8Array, parmsLen: number): Uint8Array {
  let off = 2 + 2 + 4
  const apSize = (tpmtPublic[off] << 8) | tpmtPublic[off + 1]
  off += 2 + apSize
  off += parmsLen
  const uSize = (tpmtPublic[off] << 8) | tpmtPublic[off + 1]
  off += 2
  return tpmtPublic.slice(off, off + uSize)
}

// ── Minimal DER builders for SPKI ──────────────────────────────────────────
function derTLV(tag: number, value: Uint8Array): Uint8Array {
  let lenBytes: number[]
  if (value.length < 0x80) lenBytes = [value.length]
  else if (value.length < 0x100) lenBytes = [0x81, value.length]
  else if (value.length < 0x10000)
    lenBytes = [0x82, (value.length >>> 8) & 0xff, value.length & 0xff]
  else
    lenBytes = [
      0x83,
      (value.length >>> 16) & 0xff,
      (value.length >>> 8) & 0xff,
      value.length & 0xff,
    ]
  const out = new Uint8Array(1 + lenBytes.length + value.length)
  out[0] = tag
  out.set(lenBytes, 1)
  out.set(value, 1 + lenBytes.length)
  return out
}
const derSeq = (c: Uint8Array) => derTLV(0x30, c)
const derOid = (body: Uint8Array) => derTLV(0x06, body)
const derBitString = (c: Uint8Array) => {
  const wrapped = new Uint8Array(c.length + 1)
  wrapped[0] = 0
  wrapped.set(c, 1)
  return derTLV(0x03, wrapped)
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(s)
}

function pemSpki(pubkey: Uint8Array, oidBody: Uint8Array): Uint8Array {
  const algIdent = derSeq(derOid(oidBody))
  const bitStr = derBitString(pubkey)
  const spki = derSeq(new Uint8Array([...algIdent, ...bitStr]))
  const b64 = bytesToBase64(spki)
  const lines = b64.match(/.{1,64}/g)?.join('\n') || b64
  return new TextEncoder().encode(
    `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----\n`
  )
}

// ── PEM → DER (strip BEGIN/END + base64-decode) ────────────────────────────
function pemToDer(pem: Uint8Array): Uint8Array {
  const text = new TextDecoder().decode(pem)
  const stripped = text
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  const bin = atob(stripped)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ── Set up issuer key + CA cert + reusable CSR (shared across all 6 EKs) ──
//
// The workflow is:
//   1. genpkey ML-DSA-65 issuer key (once)
//   2. req -new -x509 -key issuer.key  → CA cert (once)
//   3. req -new -key issuer.key  → dummy CSR (once, subject overwritten later)
//   4. PER EK: x509 -req -in csr -CA ca -CAkey issuer -force_pubkey subj.pem
//      → cert.pem with SUBJECT SPKI = EK pubkey, signed by ML-DSA-65 issuer
//
// The -force_pubkey flag lives on `openssl x509`, NOT on `openssl req`
// (the first attempt failed because we tried it on `req`).
interface IssuerSetup {
  issuerKeyName: string
  issuerKeyFile: { name: string; data: Uint8Array }
  caCertName: string
  caCertFile: { name: string; data: Uint8Array }
  csrName: string
  csrFile: { name: string; data: Uint8Array }
}

async function setupIssuer(sessionId: string): Promise<IssuerSetup | null> {
  const issuerKeyName = `v2p7_issuer_${sessionId}.key`
  const caCertName = `v2p7_ca_${sessionId}.pem`
  const csrName = `v2p7_csr_${sessionId}.pem`

  // Step 1: issuer key
  const r1 = await openSSLService.execute(
    `openssl genpkey -algorithm ML-DSA-65 -out ${issuerKeyName}`
  )
  if (r1.error || (r1.stderr && r1.stderr.toLowerCase().includes('error'))) {
    console.warn(`[V2.7 cert] issuer keygen failed: ${r1.stderr || r1.error}`)
    return null
  }
  const issuerKeyFile = r1.files.find((f) => f.name === issuerKeyName)
  if (!issuerKeyFile) {
    console.warn(
      `[V2.7 cert] issuer key file missing. files=${r1.files.map((f) => f.name).join(',')}`
    )
    return null
  }

  // Step 2: self-signed CA cert
  const r2 = await openSSLService.execute(
    `openssl req -new -x509 -key ${issuerKeyName} -days 3650 -out ${caCertName} -subj "/CN=pqctoday-tpm PQC EK CA (ephemeral)/O=pqctoday-tpm"`,
    [issuerKeyFile]
  )
  if (r2.error || (r2.stderr && r2.stderr.toLowerCase().includes('error'))) {
    console.warn(`[V2.7 cert] CA cert build failed: ${r2.stderr || r2.error}`)
    return null
  }
  const caCertFile = r2.files.find((f) => f.name === caCertName)
  if (!caCertFile) {
    console.warn(`[V2.7 cert] CA cert file missing. files=${r2.files.map((f) => f.name).join(',')}`)
    return null
  }

  // Step 3: dummy CSR (subject CN overridden by -subj at x509 -req time)
  const r3 = await openSSLService.execute(
    `openssl req -new -key ${issuerKeyName} -out ${csrName} -subj "/CN=placeholder/O=pqctoday-tpm"`,
    [issuerKeyFile]
  )
  if (r3.error || (r3.stderr && r3.stderr.toLowerCase().includes('error'))) {
    console.warn(`[V2.7 cert] CSR build failed: ${r3.stderr || r3.error}`)
    return null
  }
  const csrFile = r3.files.find((f) => f.name === csrName)
  if (!csrFile) {
    console.warn(`[V2.7 cert] CSR file missing. files=${r3.files.map((f) => f.name).join(',')}`)
    return null
  }

  console.log(`[V2.7 cert] issuer setup OK (key+CA+CSR)`)
  return { issuerKeyName, issuerKeyFile, caCertName, caCertFile, csrName, csrFile }
}

// ── Build one V2.7 EK cert + write to NV ───────────────────────────────────
async function provisionOneCert(
  slot: EkSlot,
  issuer: IssuerSetup,
  sessionId: string
): Promise<boolean> {
  // 1. Read the EK pubkey from the TPM.
  let pubkey: Uint8Array
  try {
    const tpmtPublic = await readPublic(slot.persistentHandle)
    pubkey = extractPubFromTpmtPublic(tpmtPublic, slot.parmsLen)
  } catch (e) {
    console.warn(`[V2.7 cert] ${slot.label} ReadPublic failed (EK not provisioned?):`, e)
    return false
  }
  if (pubkey.length !== slot.fipsPubKeySize) {
    console.warn(
      `[V2.7 cert] ${slot.label} pubkey size ${pubkey.length} != FIPS expected ${slot.fipsPubKeySize}`
    )
    return false
  }

  // 2. PEM SPKI wrapping the raw EK pubkey under the NIST CSOR OID.
  const subjectPubPem = pemSpki(pubkey, slot.oidBody)
  const subjectPubName = `v2p7_subject_${slot.label.replace(/-/g, '_')}_${sessionId}.pem`
  const certName = `v2p7_cert_${slot.label.replace(/-/g, '_')}_${sessionId}.pem`
  const cn = `TPM EK (${slot.label})`

  // 3. Sign the dummy CSR with the issuer key, replacing the SPKI with the
  //    EK pubkey via -force_pubkey. -CAcreateserial generates the serial.
  const certRes = await openSSLService.execute(
    `openssl x509 -req -in ${issuer.csrName} -CA ${issuer.caCertName} -CAkey ${issuer.issuerKeyName} -CAcreateserial -force_pubkey ${subjectPubName} -days 3650 -out ${certName} -subj "/CN=${cn}/O=pqctoday-tpm"`,
    [
      issuer.csrFile,
      issuer.caCertFile,
      issuer.issuerKeyFile,
      { name: subjectPubName, data: subjectPubPem },
    ]
  )
  if (certRes.error || (certRes.stderr && certRes.stderr.toLowerCase().includes('error'))) {
    console.warn(
      `[V2.7 cert] ${slot.label} x509 build failed: stdout="${certRes.stdout}" stderr="${certRes.stderr}" error="${certRes.error}"`
    )
    return false
  }
  const certFile = certRes.files.find((f) => f.name === certName)
  if (!certFile) {
    console.warn(
      `[V2.7 cert] ${slot.label} cert file ${certName} not produced. files=${certRes.files.map((f) => f.name).join(',')} stdout="${certRes.stdout}" stderr="${certRes.stderr}"`
    )
    return false
  }

  const certDer = pemToDer(certFile.data)
  console.log(`[V2.7 cert] ${slot.label} x509 produced ${certDer.length} B (DER)`)

  // 4. Write cert DER to its §5.3.1 NV slot via raw TPM commands.
  try {
    await nvDefineSpace(slot.nvCertIndex, certDer.length)
    await nvWrite(slot.nvCertIndex, certDer)
  } catch (e) {
    console.warn(`[V2.7 cert] ${slot.label} NV write failed:`, e)
    return false
  }

  console.log(
    `[V2.7 cert] ${slot.label} EK cert (${certDer.length} B) -> NV 0x${slot.nvCertIndex.toString(16)} OK`
  )
  return true
}

/** Top-level entry: provision V2.7 EK certs into all 6 §5.3.1 NV slots.
 *  Returns the count of successfully provisioned slots (0..6). */
export async function provisionV2p7Certs(provisionStatus: number[] | null): Promise<number> {
  const sessionId = Date.now().toString()
  const issuer = await setupIssuer(sessionId)
  if (!issuer) {
    console.warn(`[V2.7 cert] issuer setup failed; skipping all 6 EK certs`)
    return 0
  }
  let ok = 0
  for (let i = 0; i < V2P7_SLOTS.length; i++) {
    if (provisionStatus && provisionStatus[i] !== 1) continue
    if (await provisionOneCert(V2P7_SLOTS[i], issuer, sessionId)) ok++
  }
  console.log(`[V2.7 cert] V2.7 EK cert NV provisioning: ${ok}/${V2P7_SLOTS.length} OK`)
  return ok
}
