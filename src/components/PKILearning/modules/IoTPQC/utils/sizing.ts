// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure sizing models for the IoT & Embedded Device PQC module.
 *
 * Every function here is a MODEL built on exact sizes from constants.ts and on
 * protocol structure from the cited specifications; the UI labels each output
 * "Model estimate". IoTPQC.sizing.test.ts pins the structural rules the audit
 * found broken (issuer signature, root omitted, 2 pk + 2 sig in the TLS chain).
 */
import {
  CONSTRAINED_ALGORITHMS,
  DEVICE_CLASSES,
  MODEL_MCU_HZ,
  type Build,
  type ConstrainedAlgorithm,
  type Op,
} from '../constants'

// ── Fit model (step 1) ───────────────────────────────────────────────────────

export type DeviceRole = 'verify' | 'sign' | 'kem'

export const ROLE_LABELS: Record<DeviceRole, string> = {
  verify: 'Device verifies signatures (firmware, certificates)',
  sign: 'Device signs (device authentication, attestation)',
  kem: 'Device runs key establishment (initiator: keygen + decapsulate)',
}

export type FitVerdict = 'fits' | 'tight' | 'too-large'

export interface FitResult {
  applicable: boolean
  /** benchmark stack of the heaviest operation in this role */
  stackBytes: number
  /** keys / ciphertext / signature the device must hold while it runs */
  bufferBytes: number
  peakBytes: number
  ramPct: number
  verdict: FitVerdict
  cycles: number
  ms: number
  /** full-scheme code size, if the source reports it */
  codeBytes?: number
  /** code size checked against flash only where the role needs most of the scheme */
  flashVerdict?: FitVerdict
  buildUsed: Build
  impl: string
  sourceId: ConstrainedAlgorithm['builds']['stack']['source']
  approximate: boolean
}

/** Fraction of class RAM above which a fit is shown as tight. Model rule of thumb. */
export const TIGHT_FRACTION = 0.5

function verdictFor(bytes: number, capacity: number): FitVerdict {
  if (bytes > capacity) return 'too-large'
  if (bytes > capacity * TIGHT_FRACTION) return 'tight'
  return 'fits'
}

function opsForRole(alg: ConstrainedAlgorithm, role: DeviceRole): Op[] {
  if (alg.type === 'KEM') return role === 'kem' ? ['keygen', 'decaps'] : []
  if (role === 'verify') return ['verify']
  if (role === 'sign') return ['sign']
  return []
}

function buffersForRole(alg: ConstrainedAlgorithm, role: DeviceRole): number {
  if (role === 'verify') return alg.publicKeyBytes + alg.outputBytes
  if (role === 'sign') return alg.secretKeyBytes + alg.outputBytes
  // initiator holds its key pair and the peer's ciphertext
  return alg.publicKeyBytes + alg.secretKeyBytes + alg.outputBytes
}

export function assessFit(
  alg: ConstrainedAlgorithm,
  classIdx: number,
  role: DeviceRole,
  build: Build
): FitResult {
  const dc = DEVICE_CLASSES[classIdx] ?? DEVICE_CLASSES[1]
  const bench = (build === 'speed' ? alg.builds.speed : undefined) ?? alg.builds.stack
  const ops = opsForRole(alg, role)
  const benches = ops.map((o) => bench.ops[o]).filter((b) => b !== undefined)
  const applicable = ops.length > 0 && benches.length === ops.length
  const stackBytes = applicable ? Math.max(...benches.map((b) => b.stackBytes)) : 0
  const cycles = applicable ? benches.reduce((s, b) => s + b.cycles, 0) : 0
  const bufferBytes = applicable ? buffersForRole(alg, role) : 0
  const peakBytes = stackBytes + bufferBytes
  const flashVerdict =
    applicable && role !== 'verify' && bench.codeBytes !== undefined
      ? verdictFor(bench.codeBytes, dc.flashBytes)
      : undefined
  const ramVerdict = verdictFor(peakBytes, dc.ramBytes)
  const verdict: FitVerdict =
    flashVerdict === 'too-large' || ramVerdict === 'too-large'
      ? 'too-large'
      : flashVerdict === 'tight' || ramVerdict === 'tight'
        ? 'tight'
        : 'fits'
  return {
    applicable,
    stackBytes,
    bufferBytes,
    peakBytes,
    ramPct: dc.ramBytes > 0 ? (peakBytes / dc.ramBytes) * 100 : 0,
    verdict,
    cycles,
    ms: (cycles / MODEL_MCU_HZ) * 1000,
    codeBytes: bench.codeBytes,
    flashVerdict,
    buildUsed: bench === alg.builds.stack ? 'stack' : 'speed',
    impl: bench.impl,
    sourceId: bench.source,
    approximate: Boolean(bench.approximate),
  }
}

/** Algorithms grouped by verdict for a class/role/build — the step 1 summary is generated from this. */
export function fitSummary(classIdx: number, role: DeviceRole, build: Build) {
  const rows = CONSTRAINED_ALGORITHMS.map((alg) => ({
    alg,
    fit: assessFit(alg, classIdx, role, build),
  })).filter((r) => r.fit.applicable)
  return {
    fits: rows.filter((r) => r.fit.verdict === 'fits').map((r) => r.alg.name),
    tight: rows.filter((r) => r.fit.verdict === 'tight').map((r) => r.alg.name),
    tooLarge: rows.filter((r) => r.fit.verdict === 'too-large').map((r) => r.alg.name),
  }
}

// ── Certificates (step 4, and the chain inside step 3) ───────────────────────

export type CertEncoding = 'x509' | 'c509'

/**
 * Bytes of a certificate that are NOT the subject key or the issuer signature:
 * names, validity, serial, extensions, algorithm identifiers and DER framing.
 * C509 (draft-ietf-cose-cbor-encoded-cert) re-encodes these fields in CBOR;
 * it cannot shrink the key or the signature. Model estimate.
 */
export const CERT_OVERHEAD_BYTES: Record<CertEncoding, number> = { x509: 300, c509: 140 }

export interface SigAlgSizes {
  publicKeyBytes: number
  signatureBytes: number
}

/**
 * One certificate = overhead + the SUBJECT's public key + the ISSUER's
 * signature over it (RFC 5280 §4.1.1.3: signatureValue is computed by the
 * issuing CA). The pre-split version used the subject's own signature size.
 */
export function certSize(
  subject: SigAlgSizes,
  issuer: SigAlgSizes,
  encoding: CertEncoding = 'x509'
): number {
  return CERT_OVERHEAD_BYTES[encoding] + subject.publicKeyBytes + issuer.signatureBytes
}

export interface ChainSizes {
  /** self-signed trust anchor — stored on the device, not sent (RFC 8446 §4.4.2) */
  root: number
  intermediate: number
  leaf: number
  /** what crosses the wire in a TLS/DTLS Certificate message: leaf + intermediate */
  sent: number
}

export function chainSizes(
  root: SigAlgSizes,
  intermediate: SigAlgSizes,
  leaf: SigAlgSizes,
  encoding: CertEncoding = 'x509'
): ChainSizes {
  const r = certSize(root, root, encoding)
  const i = certSize(intermediate, root, encoding)
  const l = certSize(leaf, intermediate, encoding)
  return { root: r, intermediate: i, leaf: l, sent: i + l }
}

export function sigSizesOf(algId: string): SigAlgSizes {
  if (algId === 'rsa-2048') return { publicKeyBytes: 256, signatureBytes: 256 }
  const a = CONSTRAINED_ALGORITHMS.find((x) => x.id === algId)
  if (!a || a.type !== 'Signature') throw new Error(`IoTPQC: ${algId} is not a signature algorithm`)
  return { publicKeyBytes: a.publicKeyBytes, signatureBytes: a.outputBytes }
}

/** A homogeneous chain (all three levels the same algorithm) — what the Learn table shows. */
export function uniformChain(algId: string, encoding: CertEncoding = 'x509'): ChainSizes {
  const s = sigSizesOf(algId)
  return chainSizes(s, s, s, encoding)
}

// ── Chain delivery modes (step 4 mitigations) ────────────────────────────────

export type DeliveryMode = 'full' | 'compressed' | 'c509' | 'raw-key' | 'mtc' | 'resumption'

export interface DeliveryResult {
  bytes: number
  caveat: string
}

/** RFC 8879: only the structured, repetitive part compresses; keys and signatures are random. Model. */
export const COMPRESSIBLE_FRACTION_OF_OVERHEAD = 0.5
/** SubjectPublicKeyInfo framing around a raw public key (RFC 7250). Model. */
export const SPKI_FRAMING_BYTES = 30
/** MTC inclusion proof = one 32-byte SHA-256 hash per tree level (draft-ietf-plants-merkle-tree-certs). */
export const MTC_HASH_BYTES = 32

export function deliveredChainBytes(
  mode: DeliveryMode,
  root: SigAlgSizes,
  intermediate: SigAlgSizes,
  leaf: SigAlgSizes,
  mtcTreeDepth = 20
): DeliveryResult {
  const x = chainSizes(root, intermediate, leaf, 'x509')
  switch (mode) {
    case 'full':
      return { bytes: x.sent, caveat: 'Leaf + intermediate; the root stays on the device.' }
    case 'compressed': {
      const saved = Math.round(2 * CERT_OVERHEAD_BYTES.x509 * COMPRESSIBLE_FRACTION_OF_OVERHEAD)
      return {
        bytes: x.sent - saved,
        caveat:
          'RFC 8879 compresses names, extensions and DER framing; PQC keys and signatures are high-entropy and do not compress, so the saving is a few hundred bytes, not a percentage of the chain.',
      }
    }
    case 'c509':
      return {
        bytes: chainSizes(root, intermediate, leaf, 'c509').sent,
        caveat:
          'C509 (draft-ietf-cose-cbor-encoded-cert) shrinks the encoding, not the key or signature. Both peers must support it.',
      }
    case 'raw-key':
      return {
        bytes: leaf.publicKeyBytes + SPKI_FRAMING_BYTES,
        caveat:
          'RFC 7250 raw public key: no chain at all, but trust comes from a key pinned at provisioning — no CA, no revocation, no rotation without re-provisioning.',
      }
    case 'mtc':
      return {
        bytes: CERT_OVERHEAD_BYTES.x509 + leaf.publicKeyBytes + MTC_HASH_BYTES * mtcTreeDepth,
        caveat: `Merkle Tree Certificate: no intermediate and no CA signature; a ${mtcTreeDepth}-level inclusion proof instead. Works only if the device already holds current trusted tree heads, distributed out of band — a device offline for months needs a fallback chain.`,
      }
    case 'resumption':
      return {
        bytes: 0,
        caveat:
          'PSK resumption sends no certificate — but only after one full handshake has set up the ticket, and the ticket must be refreshed.',
      }
  }
}

// ── Handshakes (step 3) ──────────────────────────────────────────────────────

export interface KemSizes {
  /** key share the initiator sends */
  publicKeyBytes: number
  /** what the responder sends back */
  ciphertextBytes: number
}

export const HANDSHAKE_KEMS: Record<string, { name: string; sizes: KemSizes; hybrid?: boolean }> = {
  x25519: { name: 'X25519', sizes: { publicKeyBytes: 32, ciphertextBytes: 32 } },
  'ml-kem-512': { name: 'ML-KEM-512', sizes: { publicKeyBytes: 800, ciphertextBytes: 768 } },
  'ml-kem-768': { name: 'ML-KEM-768', sizes: { publicKeyBytes: 1184, ciphertextBytes: 1088 } },
  'x25519-ml-kem-768': {
    name: 'X25519MLKEM768 (hybrid)',
    sizes: { publicKeyBytes: 32 + 1184, ciphertextBytes: 32 + 1088 },
    hybrid: true,
  },
}

export const HANDSHAKE_SIGS: Record<string, { name: string; algId: string }> = {
  'ecdsa-p256': { name: 'ECDSA P-256', algId: 'ecdsa-p256' },
  'ml-dsa-44': { name: 'ML-DSA-44', algId: 'ml-dsa-44' },
  'ml-dsa-65': { name: 'ML-DSA-65', algId: 'ml-dsa-65' },
  'fn-dsa-512': { name: 'FN-DSA-512 (pre-standard)', algId: 'fn-dsa-512' },
}

/** DTLS 1.3 handshake-message header (RFC 9147 §5.2). */
export const DTLS_HS_HEADER = 12
/** Per-datagram record overhead: unified header + AEAD tag (RFC 9147 §4). Model. */
export const DTLS_RECORD_OVERHEAD = 21
/** IPv6 minimum MTU minus IPv6 (40) and UDP (8) headers. */
export const IPV6_MIN_DATAGRAM_PAYLOAD = 1280 - 40 - 8
/** Usable payload of a 127-byte IEEE 802.15.4 frame with link security (7228bis Table 10, S1). */
export const IEEE802154_PAYLOAD = 80

export interface HandshakeMessage {
  label: string
  from: 'client' | 'server'
  bytes: number
}

export interface HandshakeResult {
  messages: HandshakeMessage[]
  totalBytes: number
  /** IPv6 datagrams at the 1,280-byte minimum MTU */
  datagrams: number
  /** IEEE 802.15.4 frames if carried over 6LoWPAN */
  radioFrames: number
}

function framing(messages: HandshakeMessage[], perDatagramPayload: number, recordOverhead: number) {
  const totalBytes = messages.reduce((s, m) => s + m.bytes, 0)
  // consecutive messages in one direction form one flight, packed together
  const flights: number[] = []
  messages.forEach((m, i) => {
    if (i > 0 && messages[i - 1].from === m.from) flights[flights.length - 1] += m.bytes
    else flights.push(m.bytes)
  })
  let datagrams = 0
  let radioFrames = 0
  for (const flight of flights) {
    const n = Math.ceil(flight / (perDatagramPayload - recordOverhead))
    datagrams += n
    const onIp = flight + n * (recordOverhead + 8) // + UDP header per datagram
    radioFrames += Math.ceil(onIp / IEEE802154_PAYLOAD)
  }
  return { totalBytes, datagrams, radioFrames }
}

/**
 * DTLS 1.3 full handshake, server-authenticated with a two-certificate chain
 * (leaf + intermediate; root omitted). The Certificate message therefore holds
 * 2 public keys and 2 signatures — not "3 pk + 2 sig". Model estimate.
 */
export function dtlsHandshake(kemId: string, sigId: string): HandshakeResult {
  const kem = (HANDSHAKE_KEMS[kemId] ?? HANDSHAKE_KEMS['x25519']).sizes
  const sig = sigSizesOf((HANDSHAKE_SIGS[sigId] ?? HANDSHAKE_SIGS['ecdsa-p256']).algId)
  const chain = chainSizes(sig, sig, sig)
  const messages: HandshakeMessage[] = [
    { label: 'ClientHello (key_share)', from: 'client', bytes: 110 + kem.publicKeyBytes },
    { label: 'ServerHello (key_share)', from: 'server', bytes: 90 + kem.ciphertextBytes },
    { label: 'EncryptedExtensions', from: 'server', bytes: 20 },
    { label: 'Certificate (leaf + intermediate)', from: 'server', bytes: 8 + 2 * 5 + chain.sent },
    { label: 'CertificateVerify', from: 'server', bytes: 4 + sig.signatureBytes },
    { label: 'Finished', from: 'server', bytes: 32 },
    { label: 'Finished', from: 'client', bytes: 32 },
  ].map((m) => ({ ...m, from: m.from as 'client' | 'server', bytes: m.bytes + DTLS_HS_HEADER }))
  return { messages, ...framing(messages, IPV6_MIN_DATAGRAM_PAYLOAD, DTLS_RECORD_OVERHEAD) }
}

/**
 * EDHOC (RFC 9528) method 0 (signature/signature), credentials sent by
 * reference (kid), no EAD. For a KEM the initiator's G_X becomes the KEM
 * public key and the responder's G_Y the ciphertext, as in
 * draft-ietf-lake-pqsuites. EDHOC has no record layer; messages travel as
 * CoAP payloads (OSCORE then protects application data). Model estimate.
 */
export function edhocHandshake(kemId: string, sigId: string, credByValue = false): HandshakeResult {
  const kem = (HANDSHAKE_KEMS[kemId] ?? HANDSHAKE_KEMS['x25519']).sizes
  const sig = sigSizesOf((HANDSHAKE_SIGS[sigId] ?? HANDSHAKE_SIGS['ecdsa-p256']).algId)
  const cred = credByValue ? certSize(sig, sig) : 1 // kid by reference: one byte
  const cborHdr = (n: number) => (n < 24 ? 1 : n < 256 ? 2 : n < 65536 ? 3 : 5)
  const ct2Body = 1 + cred + cborHdr(sig.signatureBytes) + sig.signatureBytes
  const ct3Body = cred + cborHdr(sig.signatureBytes) + sig.signatureBytes + 8 // AEAD tag
  const m2Payload = kem.ciphertextBytes + ct2Body
  const messages: HandshakeMessage[] = [
    {
      label: 'message_1 (METHOD, SUITES, G_X / KEM key, C_I)',
      from: 'client',
      bytes: 3 + cborHdr(kem.publicKeyBytes) + kem.publicKeyBytes,
    },
    {
      label: 'message_2 (G_Y / ciphertext ‖ CIPHERTEXT_2)',
      from: 'server',
      bytes: cborHdr(m2Payload) + m2Payload,
    },
    {
      label: 'message_3 (CIPHERTEXT_3)',
      from: 'client',
      bytes: cborHdr(ct3Body) + ct3Body,
    },
  ]
  // CoAP header + token ≈ 8 B per message, no DTLS record overhead
  return { messages, ...framing(messages, IPV6_MIN_DATAGRAM_PAYLOAD, 8) }
}

// ── BLE Mesh provisioning (step 3, provisioning view) ────────────────────────

/** Mesh Protocol PB-ADV Generic Provisioning: Transaction Start carries 20 B, each Continuation 23 B. */
export const PBADV_FIRST_SEGMENT = 20
export const PBADV_CONT_SEGMENT = 23
/** SegN is a 6-bit field: at most 64 segments per transaction. */
export const PBADV_MAX_SEGMENTS = 64
export const PBADV_MAX_TRANSACTION =
  PBADV_FIRST_SEGMENT + (PBADV_MAX_SEGMENTS - 1) * PBADV_CONT_SEGMENT

export function pbAdvSegments(pduBytes: number): { segments: number; fits: boolean } {
  const segments =
    pduBytes <= PBADV_FIRST_SEGMENT
      ? 1
      : 1 + Math.ceil((pduBytes - PBADV_FIRST_SEGMENT) / PBADV_CONT_SEGMENT)
  return { segments, fits: segments <= PBADV_MAX_SEGMENTS }
}
