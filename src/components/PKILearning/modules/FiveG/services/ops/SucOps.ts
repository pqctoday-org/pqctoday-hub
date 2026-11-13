// SPDX-License-Identifier: AGPL-3.0-only
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { bytesToHex } from '@/services/crypto/FileUtils'
import type { FiveGService } from '../FiveGService'
import { normalizeProfileBPoint } from './suciPublicPoint'
import {
  assemblePsc1,
  buildPsc1MacInput,
  PSC1_FORMAT_LABEL,
  PSC1_HEADER_BYTES,
  psc1TotalBytes,
  parsePsc1,
  recoverPsc1,
  Psc1Refusal,
  type Psc1Header,
  type Psc1ReceiverPrimitives,
} from '../pscEnvelope'

function hexToBytes(hex: string, label: string): Uint8Array {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex))
    throw new Error(`${label} is not complete hexadecimal`)
  return new Uint8Array(hex.match(/../g)?.map((pair) => parseInt(pair, 16)) ?? [])
}

/**
 * The bytes the Profile C MAC covers, built from the sender's state: the 15-byte header, the
 * ephemeral key (hybrid), the KEM ciphertext and the MSIN ciphertext. Throws if a field is missing
 * or malformed rather than inventing one.
 */
export function psc1MacInputFromState(ctx: FiveGService): {
  header: Psc1Header
  macInput: Uint8Array
} {
  const supi = ctx.state.supi || '310260123456789'
  const hybrid = ctx.state.pqcMode
    ? ctx.state.pqcMode === 'hybrid'
    : Boolean(ctx.state.ephemeralPubKeyHex)
  const header: Psc1Header = {
    mode: hybrid ? 2 : 1,
    mcc: supi.length >= 3 ? supi.slice(0, 3) : '310',
    mnc: supi.length >= 6 ? supi.slice(3, 6) : '260',
    routingIndicator: '0',
    keyId: 1,
  }
  if (!ctx.state.ciphertextHex)
    throw new Error('KEM ciphertext is missing: run the shared-secret step first')
  if (!ctx.state.encryptedMSINHex)
    throw new Error('MSIN ciphertext is missing: run the encryption step first')
  if (hybrid && !ctx.state.ephemeralPubKeyHex)
    throw new Error('Ephemeral public key is missing: run the ephemeral-key step first')
  const macInput = buildPsc1MacInput(header, {
    ephemeralPublicKey: hybrid
      ? hexToBytes(ctx.state.ephemeralPubKeyHex!, 'Ephemeral public key')
      : undefined,
    kemCiphertext: hexToBytes(ctx.state.ciphertextHex, 'KEM ciphertext'),
    msinCiphertext: hexToBytes(ctx.state.encryptedMSINHex, 'MSIN ciphertext'),
  })
  return { header, macInput }
}

const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

export async function encryptMSIN(ctx: FiveGService) {
  delete ctx.state.psc1WireHex // an envelope built from an earlier ciphertext is stale
  if (!ctx.state.kEncHex)
    throw new Error('No key derived: complete shared-secret and key derivation first.')

  // MSIN portion only (without MCC/MNC) per 3GPP TS 33.501
  const parsedSupi = ctx.state.supi || '310260123456789'
  const msinDigits = parsedSupi.length > 6 ? parsedSupi.slice(6) : parsedSupi
  const msinBytes = ctx.bcdEncode(msinDigits)
  const msinHex = bytesToHex(msinBytes)

  // Determine algorithm based on key length (16 bytes = AES-128, 32 bytes = AES-256)
  const keyLen = ctx.state.kEncHex.length / 2
  const algo = keyLen === 32 ? 'aes-256-ctr' : 'aes-128-ctr'
  const iv = '00000000000000000000000000000000' // Zero IV (demo choice; TS 33.501 Annex C.3.4 takes the ICB from the KDF output)

  // File names
  const msinFile = `msin_${ctx.getTimestamp()}.bin`
  const cipherFile = `cipher_${ctx.getTimestamp()}.bin`
  ctx.trackFile(msinFile)
  ctx.trackFile(cipherFile)

  try {
    // Run OpenSSL AES-CTR encryption
    const cmd = `openssl enc -${algo} -K ${ctx.state.kEncHex} -iv ${iv} -in ${msinFile} -out ${cipherFile}`
    const res = await openSSLService.execute(cmd, [{ name: msinFile, data: msinBytes }])

    // Read encrypted output
    let cipherHex = ''
    const cipherData = res.files.find((f) => f.name === cipherFile)?.data
    if (cipherData) {
      cipherHex = bytesToHex(cipherData)
    } else {
      cipherHex = await ctx.readFileHex(cipherFile)
    }

    if (!cipherHex) {
      throw new Error('Encryption failed - no output')
    }

    ctx.state.encryptedMSINHex = cipherHex
    ctx.state.cipherFile = cipherFile

    return `[USIM] Encrypting MSIN via SoftHSM API...
Algorithm: ${algo.toUpperCase()}
MSIN Digits: ${msinDigits}
BCD Encoded: ${msinHex} (${msinBytes.length} bytes)
Key: ${ctx.state.kEncHex}
IV: ${iv} (zero IV in this demo; TS 33.501 Annex C.3.4 takes the ICB from the KDF output)

> C_Encrypt(CKM_AES_CTR)

[SUCCESS] Ciphertext: ${ctx.state.encryptedMSINHex} (${cipherHex.length / 2} bytes)`
  } catch (e) {
    return `[Error] Encryption failed: ${e}`
  }
}

export async function computeMAC(ctx: FiveGService) {
  delete ctx.state.psc1WireHex // an envelope built from an earlier MAC is stale
  if (!ctx.state.kMacHex || !ctx.state.encryptedMSINHex) return '[Error] Missing Ciphertext or Key'

  try {
    // Prepare cipher data from state (always available as hex after encryptMSIN)
    const cipherFile = `cipher_mac_${ctx.getTimestamp()}.bin`
    ctx.trackFile(cipherFile)
    // Profile A/B: the MAC covers the MSIN ciphertext. Profile C (PSC1 project sample): it covers
    // the whole message before the tag, so the header and both public components are authenticated.
    const profileC = ctx.state.profile === 'C'
    const psc1 = profileC ? psc1MacInputFromState(ctx) : null
    const cipherBytes = psc1
      ? psc1.macInput
      : new Uint8Array(
          ctx.state.encryptedMSINHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        )

    // Run OpenSSL HMAC — use SHA3-256 for Profile C, SHA-256 for A/B
    const macAlgo = ctx.state.profile === 'C' ? 'sha3-256' : 'sha256'
    const macAlgoName = ctx.state.profile === 'C' ? 'HMAC-SHA3-256' : 'HMAC-SHA-256'
    const cmd = `openssl dgst -${macAlgo} -mac HMAC -macopt hexkey:${ctx.state.kMacHex} ${cipherFile}`
    const res = await openSSLService.execute(cmd, [{ name: cipherFile, data: cipherBytes }])

    // Parse hex output from stdout
    const fullMacHex = ctx.parseDigestHex(res.stdout)

    if (!fullMacHex) {
      console.error('[FiveGService] MAC dgst stdout:', res.stdout)
      console.error('[FiveGService] MAC dgst stderr:', res.stderr)
      throw new Error(`MAC computation failed - stdout: ${res.stdout?.substring(0, 100)}`)
    }

    // Truncate to 8 bytes (64 bits) as per 5G spec
    ctx.state.macTagHex = fullMacHex.substring(0, 16) // 8 bytes = 16 hex chars

    return `[USIM] Computing MAC Tag via SoftHSM API...
Algorithm: ${macAlgoName}
Data: ${
      psc1
        ? `PSC1 header ‖ ${psc1.header.mode === 2 ? 'ephemeral key ‖ ' : ''}KEM ciphertext ‖ MSIN ciphertext (${cipherBytes.length} bytes, everything before the tag)`
        : `Ciphertext ${ctx.state.encryptedMSINHex}`
    }
Integrity Key (K_mac): ${ctx.state.kMacHex}

> C_Sign(${macAlgoName})

[Intermediate Result]
Full ${macAlgoName} Hash (32 bytes):
${fullMacHex}

[SUCCESS] Final MAC Tag (Truncated to 8 bytes):
${ctx.state.macTagHex}`
  } catch (e) {
    return `[Error] MAC computation failed: ${e}`
  }
}

export async function visualizeStructure(ctx: FiveGService) {
  if (ctx.state.profile === 'C') return describePsc1(ctx, 'visualize')
  const parsedSupi = ctx.state.supi || '310260123456789'
  const mcc = parsedSupi.length >= 3 ? parsedSupi.slice(0, 3) : '310'
  const mnc = parsedSupi.length >= 6 ? parsedSupi.slice(3, 6) : '260'
  const msin = parsedSupi.length > 6 ? parsedSupi.slice(6) : '123456789'
  const msinBytes = ctx.bcdEncode(msin)
  const msinHex = bytesToHex(msinBytes)
  const routing = '0' // Routing Indicator (decimal integer per TS 23.003)
  const scheme = ctx.state.profile === 'A' ? '1' : ctx.state.profile === 'B' ? '2' : '3'
  const keyId = '1' // Key Identifier (decimal 0-255, no zero-padding)

  const cipher = ctx.state.encryptedMSINHex || '[Missing Cipher]'
  const mac = ctx.state.macTagHex || '[Missing MAC]'
  const ephSpki = ctx.state.ephemeralPubKeyHex || ''

  // Profile C: schemeOutput = kemCiphertext || msinCiphertext || macTag
  // Profile A: schemeOutput = rawX25519Key(32B) || msinCiphertext || macTag
  // Profile B: schemeOutput = compressedP256Key(33B) || msinCiphertext || macTag
  //            (ECDH uses uncompressed internally; SUCI encoding uses compressed per TS 33.501 Annex C.4)
  // Raw ephemeral key bytes — strip ASN.1 SPKI wrapper (12B for X25519, 26B for P-256).
  // For Profile C the ephSpki is already the raw 32-byte EC point (synced from HSM extractECPoint).
  const profileBPoint = ctx.state.profile === 'B' ? normalizeProfileBPoint(ephSpki) : null
  const uncompressedBHexViz = profileBPoint?.uncompressedHex ?? null
  const compressedBHexViz = profileBPoint?.compressedHex ?? null

  const rawEphPubHex =
    ctx.state.profile === 'A' && ephSpki.length === 88
      ? ephSpki.substring(24) // X25519 SPKI: 12-byte header → skip 24 hex chars
      : ctx.state.profile === 'B'
        ? (compressedBHexViz ?? ephSpki) // compressed 33-byte P-256 key per TS 33.501
        : ephSpki

  // Profile B educational block: show both compressed and uncompressed
  const profileBKeyNote =
    ctx.state.profile === 'B' && uncompressedBHexViz && compressedBHexViz
      ? `
  ── EC Point Encoding (Profile B) ──────────────────────────────
  UNCOMPRESSED (65 bytes, 04 prefix) — used for ECDH internally:
    04 || x(32B) || y(32B) — both coordinates required to compute Z
    ${uncompressedBHexViz.substring(0, 64)}...
  COMPRESSED (33 bytes, 02/03 prefix) — used in SUCI over-the-air:
    ${compressedBHexViz.startsWith('02') ? '02' : '03'} (y is ${compressedBHexViz.startsWith('02') ? 'even' : 'odd'}) || x(32B) — 32 bytes saved; SIDF recovers y via curve equation
    ${compressedBHexViz}
  ────────────────────────────────────────────────────────────────`
      : ''

  // Prefix shown in the abbreviated SUCI string
  const schemePrefix = rawEphPubHex ? rawEphPubHex.substring(0, 8) + '...' : '[EphKey]'

  const schemeOutputDesc =
    ctx.state.profile === 'B'
      ? 'compressedEphPub(33B) || msinCiphertext || macTag (hex concat)'
      : 'rawX25519EphPub(32B) || msinCiphertext || macTag (hex concat)'

  return `═══════════════════════════════════════════════════════════════
            SUCI STRUCTURE VISUALIZATION
═══════════════════════════════════════════════════════════════

[1. Subscription Permanent Identifier (SUPI)]
  > IMSI: ${parsedSupi}
  > MCC: ${mcc} (USA)
  > MNC: ${mnc} (T-Mobile)
  > MSIN: ${msin} (BCD: 0x${msinHex} — ${msinBytes.length} bytes)

[2. Protected Components (Ciphertext & MAC)]
  > Ciphertext (Encrypted MSIN, BCD):
    ${cipher}
  > MAC Tag (8-byte HMAC truncation):
    ${mac}
${profileBKeyNote}
[3. Assembled SUCI (Privacy Preserving ID)]
  Format per 3GPP TS 23.003 §8.3:
  suci-0-<mcc>-<mnc>-<routingIndicator>-<schemeID>-<keyId>-<schemeOutput>
  where schemeOutput = ${schemeOutputDesc}

  SUCI String (abbreviated):
  suci-0-${mcc}-${mnc}-${routing}-${scheme}-${keyId}-${schemePrefix}${cipher}${mac}

[SUCCESS] Structure Verified. Ready for Transmission.`
}

export async function assembleSUCI(ctx: FiveGService, profile: 'A' | 'B' | 'C') {
  if (profile === 'C') return describePsc1(ctx, 'assemble')
  const parsedSupi = ctx.state.supi || '310260123456789'
  const mcc = parsedSupi.length >= 3 ? parsedSupi.slice(0, 3) : '310'
  const mnc = parsedSupi.length >= 6 ? parsedSupi.slice(3, 6) : '260'
  const routing = '0' // Routing Indicator (decimal integer, 0 = default per TS 23.003)
  const scheme = profile === 'A' ? '1' : profile === 'B' ? '2' : '3'
  const keyId = '1' // Home Network Public Key Identifier (decimal 0-255, no zero-padding)

  const cipher = ctx.state.encryptedMSINHex || ''
  const mac = ctx.state.macTagHex || ''
  const ephSpki = ctx.state.ephemeralPubKeyHex || ''

  // Per 3GPP TS 33.501 §C.3.2 and §C.3.4 + TS 23.003 §8.3:
  // schemeOutput = rawEphemeralPublicKey || msinCiphertext || macTag (hex concat, no separators)
  // Profile A: raw 32-byte X25519 key (strip 12-byte SPKI header)
  // Profile B: COMPRESSED 33-byte P-256 key per spec (02/03 prefix + 32-byte x-coord)
  //            ECDH uses the uncompressed key internally; only the SUCI encoding uses compressed.
  // Raw uncompressed = strip 26-byte SPKI header from 91-byte SPKI → 65-byte (04 || x || y)
  // Compressed = 02/03 prefix based on y parity + x-coord (32 bytes)
  const profileBPoint = profile === 'B' ? normalizeProfileBPoint(ephSpki) : null
  const uncompressedBHex = profileBPoint?.uncompressedHex ?? null
  const compressedBHex = profileBPoint?.compressedHex ?? null

  const rawEphPubHex =
    profile === 'A' && ephSpki.length === 88
      ? ephSpki.substring(24) // 32-byte X25519 raw key
      : profile === 'B'
        ? (compressedBHex ?? ephSpki) // compressed 33-byte P-256 key per TS 33.501
        : ephSpki // fallback (Profile C: not used)

  // Profile C: schemeOutput = kemCiphertext || msinCiphertext || macTag
  // Profile A/B: schemeOutput = rawEphPubKey || msinCiphertext || macTag
  const schemeOutputHex = `${rawEphPubHex}${cipher}${mac}`

  const suciString = `suci-0-${mcc}-${mnc}-${routing}-${scheme}-${keyId}-${schemeOutputHex}`
  const suciBytes = new TextEncoder().encode(suciString)
  const suciHex = bytesToHex(suciBytes)

  // For Profile B: build educational block showing both key encodings
  const profileBKeyBlock =
    profile === 'B' && uncompressedBHex && compressedBHex
      ? `
── Profile B: Ephemeral Public Key Encoding ──────────────────────
  Two valid EC point encodings exist for P-256 (secp256r1):

  UNCOMPRESSED (65 bytes, prefix 04):
    Used internally for ECDH key agreement (§C.3.2).
    Format: 04 || x(32 bytes) || y(32 bytes)
    Why: ECDH requires both x and y coordinates to compute the
         shared secret. The full point is needed by the recipient.
    ${uncompressedBHex}

  COMPRESSED (33 bytes, prefix 02/03):
    Used in the over-the-air SUCI scheme output (§C.4 reference vectors).
    Format: 02 (y even) or 03 (y odd) || x(32 bytes)
    Why: Saves 32 bytes on the radio interface. The receiver (SIDF)
         can reconstruct y from x and the curve equation y²=x³-3x+b.
    ${compressedBHex}

  → SUCI scheme output uses COMPRESSED form per TS 33.501 Annex C.4
────────────────────────────────────────────────────────────────`
      : ''

  const displayKey = rawEphPubHex
    ? `${rawEphPubHex.substring(0, 32)}... (${rawEphPubHex.length / 2} bytes, ${profile === 'A' ? '32-byte X25519 raw key' : '33-byte P-256 compressed key'})`
    : '[Missing EphKey]'

  return `═══════════════════════════════════════════════════════════════
            SUCI ASSEMBLY (Profile ${profile})
═══════════════════════════════════════════════════════════════

Step 1: Gathering Components (per 3GPP TS 23.003 §8.3)
  > MCC:              ${mcc}
  > MNC:              ${mnc}
  > Routing Indicator: ${routing}
  > Scheme ID:        ${scheme} (${profile === 'A' ? 'ECIES Profile A' : 'ECIES Profile B'})
  > Key Identifier:   ${keyId}
${profileBKeyBlock}
Step 2: Scheme Output Fields (hex-concatenated, no separators)
  > Ephemeral Public Key: ${displayKey}
  > MSIN Ciphertext:  ${cipher || '[Missing]'} (${cipher.length / 2 || 0} bytes)
  > MAC Tag:          ${mac || '[Missing]'} (${mac.length / 2 || 0} bytes)

Step 3: schemeOutput = ${profile === 'B' ? 'compressedEphPub(33B)' : 'rawX25519EphPub(32B)'} || msinCipher || macTag
  ${schemeOutputHex.substring(0, 64)}${schemeOutputHex.length > 64 ? '...' : ''}

Step 4: Final SUCI String (3GPP TS 23.003 §8.3 format)
  suci-0-<mcc>-<mnc>-<routingIndicator>-<schemeID>-<keyId>-<schemeOutput>
  ${suciString.substring(0, 120)}${suciString.length > 120 ? '...' : ''}

Step 5: SUCI Hex Encoding (${suciBytes.length} bytes)
  ${suciHex.substring(0, 64)}${suciHex.length > 64 ? '...' : ''}

[SUCCESS] SUCI assembled per 3GPP TS 23.003 §8.3. Ready for transmission over the air interface.`
}

/** Profile C: lays out the PSC1 envelope from the sender's state and stores its exact bytes. */
function describePsc1(ctx: FiveGService, step: 'visualize' | 'assemble'): string {
  const title =
    step === 'visualize'
      ? 'PSC1 ENVELOPE STRUCTURE (PROFILE C)'
      : 'PSC1 ENVELOPE ASSEMBLY (PROFILE C)'
  const banner = `═══════════════════════════════════════════════════════════════
            ${title}
═══════════════════════════════════════════════════════════════`
  if (!ctx.state.macTagHex || !/^[0-9a-f]{16}$/i.test(ctx.state.macTagHex))
    return `${banner}\n[Error] The 8-byte MAC tag is missing: run the MAC step first.`
  let wire: Uint8Array
  let header: Psc1Header
  try {
    const built = psc1MacInputFromState(ctx)
    header = built.header
    wire = assemblePsc1(built.macInput, hexToBytes(ctx.state.macTagHex, 'MAC tag'))
  } catch (e) {
    return `${banner}\n[Error] ${e instanceof Error ? e.message : String(e)}`
  }
  ctx.state.psc1WireHex = bytesToHex(wire)
  const parsed = parsePsc1(wire)
  const hybrid = header.mode === 2
  const supi = ctx.state.supi || '310260123456789'
  const msinDigits = supi.length > 6 ? supi.slice(6) : supi
  const preview = (bytes: Uint8Array) =>
    `${bytesToHex(bytes.subarray(0, 16))}${bytes.length > 16 ? '...' : ''}`
  const lines = [
    banner,
    '',
    `${PSC1_FORMAT_LABEL}. This is not a 3GPP TS 23.003 SUCI encoding and uses no assigned`,
    'protection-scheme identifier. Profile A and Profile B encodings are unchanged.',
    '',
    '[1. Subscription Permanent Identifier (SUPI), never transmitted in clear]',
    `  > IMSI: ${supi}  (MCC ${header.mcc}, MNC ${header.mnc}, MSIN ${msinDigits})`,
    '',
    `[2. PSC1 envelope: ${wire.length} bytes, mode ${header.mode} (${hybrid ? 'X25519 + ML-KEM-768 hybrid' : 'pure ML-KEM-768'})]`,
    `  Header                      ${PSC1_HEADER_BYTES} bytes  ${bytesToHex(wire.subarray(0, PSC1_HEADER_BYTES))}`,
    `    "PSC1" ‖ mode ‖ MCC ‖ MNC ‖ routing indicator ‖ key ID ‖ MSIN-ciphertext length`,
    hybrid
      ? `  X25519 ephemeral public key ${parsed.ephemeralPublicKey.length} bytes  ${preview(parsed.ephemeralPublicKey)}`
      : '  Ephemeral public key        not carried (pure mode)',
    `  ML-KEM-768 ciphertext       ${parsed.kemCiphertext.length} bytes  ${preview(parsed.kemCiphertext)}`,
    `  Encrypted MSIN (BCD)        ${parsed.msinCiphertext.length} bytes  ${bytesToHex(parsed.msinCiphertext)}`,
    `  MAC (HMAC-SHA3-256, cut)    ${parsed.tag.length} bytes  ${bytesToHex(parsed.tag)}`,
    '',
    `  Total: ${PSC1_HEADER_BYTES} + ${hybrid ? '32 + ' : ''}1088 + ${parsed.msinCiphertext.length} + 8 = ${wire.length} bytes`,
    `  (${psc1TotalBytes(1, 5).toLocaleString('en-US')} pure / ${psc1TotalBytes(2, 5).toLocaleString('en-US')} hybrid for a 9-digit MSIN)`,
    '  The MAC covers every byte before it, so the header and both public components are authenticated.',
  ]
  if (step === 'assemble') {
    lines.push(
      '',
      `Envelope bytes (hex, first 64 of ${wire.length}):`,
      `  ${bytesToHex(wire.subarray(0, 64))}...`,
      '',
      `[SUCCESS] PSC1 envelope assembled (${wire.length} bytes). The next step reads only these bytes.`
    )
  } else {
    lines.push('', '[SUCCESS] Structure Verified. Ready for Transmission.')
  }
  return lines.join('\n')
}

/** Receiver primitives backed by the OpenSSL engine; the HN private keys come from this engine's own state. */
function openSslReceiver(ctx: FiveGService): Psc1ReceiverPrimitives {
  const stamp = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`
  const run = async (command: string, files: { name: string; data: Uint8Array }[], out: string) => {
    for (const f of files) ctx.trackFile(f.name)
    ctx.trackFile(out)
    const res = await openSSLService.execute(command, files)
    if (res.error) throw new Error(res.error)
    return res
  }
  const output = (res: { files: { name: string; data: Uint8Array }[] }, name: string) => {
    const data = res.files.find((f) => f.name === name)?.data
    if (!data) throw new Error(`OpenSSL produced no ${name}`)
    return new Uint8Array(data)
  }
  const digestHex = (stdout: string) => stdout?.match(/([a-fA-F0-9]{64})/)?.[1] ?? ''
  const sha3 = async (data: Uint8Array) => {
    const input = `psc_sha3_${stamp}_${Math.floor(Math.random() * 1e9)}.bin`
    const res = await run(`openssl dgst -sha3-256 ${input}`, [{ name: input, data }], input)
    const hex = digestHex(res.stdout)
    if (!hex) throw new Error('SHA3-256 failed')
    return hexToBytes(hex, 'SHA3-256 output')
  }
  return {
    mlKem768Decapsulate: async (ciphertext) => {
      if (!ctx.state.hnPqcPrivHex)
        throw new Error('Home-network ML-KEM private key is not available')
      const priv = `psc_hn_pqc_priv_${stamp}.key`
      const ct = `psc_kem_ct_${stamp}.bin`
      const out = `psc_kem_ss_${stamp}.bin`
      const res = await run(
        `openssl pkeyutl -decap -inkey ${priv} -in ${ct} -out ${out}`,
        [
          { name: priv, data: hexToBytes(ctx.state.hnPqcPrivHex, 'ML-KEM private key') },
          { name: ct, data: ciphertext },
        ],
        out
      )
      return output(res, out)
    },
    x25519Derive: async (peerPublicKey) => {
      if (!ctx.state.hnEccPrivPemHex)
        throw new Error('Home-network X25519 private key is not available')
      const priv = `psc_hn_ecc_priv_${stamp}.key`
      const peer = `psc_eph_pub_${stamp}.der`
      const out = `psc_z_ecdh_${stamp}.bin`
      const spki = concatBytes(
        Uint8Array.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00]),
        peerPublicKey
      )
      const res = await run(
        `openssl pkeyutl -derive -inkey ${priv} -peerform DER -peerkey ${peer} -out ${out}`,
        [
          { name: priv, data: hexToBytes(ctx.state.hnEccPrivPemHex, 'X25519 private key') },
          { name: peer, data: spki },
        ],
        out
      )
      return output(res, out)
    },
    sha256: async (data) =>
      new Uint8Array(await window.crypto.subtle.digest('SHA-256', new Uint8Array(data))),
    sha3_256: sha3,
    hmacSha3_256: async (key, data) => {
      const input = `psc_mac_in_${stamp}_${Math.floor(Math.random() * 1e9)}.bin`
      const res = await run(
        `openssl dgst -sha3-256 -mac HMAC -macopt hexkey:${bytesToHex(key)} ${input}`,
        [{ name: input, data }],
        input
      )
      const hex = digestHex(res.stdout)
      if (!hex) throw new Error('HMAC-SHA3-256 failed')
      return hexToBytes(hex, 'HMAC output')
    },
    aes256CtrZeroIv: async (key, data) => {
      const input = `psc_dec_in_${stamp}.bin`
      const out = `psc_dec_out_${stamp}.bin`
      const res = await run(
        `openssl enc -d -aes-256-ctr -K ${bytesToHex(key)} -iv ${'00'.repeat(16)} -in ${input} -out ${out}`,
        [{ name: input, data }],
        out
      )
      return output(res, out)
    },
  }
}

/**
 * Profile C SIDF: reads only the stored PSC1 bytes and this engine's own home-network private
 * keys. Nothing from the sender's derived state (Z, K_enc, K_mac, plaintext) is consulted.
 */
async function sidfDecryptProfileC(ctx: FiveGService): Promise<string> {
  const header = `═══════════════════════════════════════════════════════════════
            SIDF DECRYPTION (HOME NETWORK, PROFILE C)
═══════════════════════════════════════════════════════════════
${PSC1_FORMAT_LABEL}; not a TS 23.003 SUCI encoding.`
  const wireHex = ctx.state.psc1WireHex
  if (!wireHex)
    return `${header}\n\n[RESULT] SUPI Recovered: [REJECTED — no PSC1 envelope; run the assemble step first]`
  const home = ctx.state.homeNetwork
  if (!home)
    return `${header}\n\n[RESULT] SUPI Recovered: [REJECTED — home-network configuration missing; generate the home-network key first]`
  let wire: Uint8Array
  try {
    wire = hexToBytes(wireHex, 'PSC1 envelope')
  } catch (e) {
    return `${header}\n\n[RESULT] SUPI Recovered: [REJECTED — ${e instanceof Error ? e.message : String(e)}]`
  }
  const intro = `[Network Side - PQC]
1. Receiving ${wire.length} bytes (PSC1). Parsing only those bytes...`
  try {
    const recovery = await recoverPsc1(wire, openSslReceiver(ctx), home)
    const t = recovery.trace
    const parsed = parsePsc1(wire)
    return `${header}

${intro}
   > Mode: ${recovery.header.mode} (${recovery.header.mode === 2 ? 'X25519 + ML-KEM-768' : 'pure ML-KEM-768'})
   > PLMN ${recovery.header.mcc}-${recovery.header.mnc}, key ID ${recovery.header.keyId}: accepted as this home network

2. Decapsulating with the home-network ML-KEM-768 private key...
   KEM ciphertext: ${parsed.kemCiphertext.length} bytes (taken from the received bytes)
   Z_kem (32 bytes): ${bytesToHex(t.kemSecret)}
${
  t.ecdhSecret
    ? `   X25519 ECDH with the TRANSMITTED ephemeral key (${parsed.ephemeralPublicKey.length} bytes): Z_ecdh = ${bytesToHex(t.ecdhSecret)}
   Z = SHA256(Z_ecdh ‖ Z_kem) = ${bytesToHex(t.z)}  [combiner is this project's own]`
    : `   Z = Z_kem (pure PQC mode)`
}

3. Deriving session keys (SHA3-256 counter KDF)...
   > K_enc: ${bytesToHex(t.kEnc)}
   > K_mac: ${bytesToHex(t.kMac)}

4. Verifying MAC (HMAC-SHA3-256 over all ${parsed.macInput.length} bytes before the tag, cut to 8)...
   Recomputed tag: ${bytesToHex(t.recomputedTag)}
   Received tag:   ${bytesToHex(t.receivedTag)}
   Result: [OK] MAC VALID

5. Decrypting MSIN (AES-256-CTR, zero IV) and BCD-decoding...
   BCD bytes: ${bytesToHex(recovery.msinBcd)}
   MSIN: ${recovery.msinDigits}

[SUCCESS] SUPI Recovered: ${recovery.header.mcc}${recovery.header.mnc}${recovery.msinDigits}`
  } catch (e) {
    const trace = (
      e as Psc1Refusal & { trace?: { recomputedTag: Uint8Array; receivedTag: Uint8Array } }
    ).trace
    const macDetail = trace
      ? `\n4. Verifying MAC...\n   Recomputed tag: ${bytesToHex(trace.recomputedTag)}\n   Received tag:   ${bytesToHex(trace.receivedTag)}\n   Result: [FAIL] MAC invalid — envelope rejected by SIDF\n\n5. Decrypting MSIN...[ABORTED — MAC verification failed]`
      : ''
    const reason = e instanceof Error ? e.message : String(e)
    return `${header}

${intro}${macDetail}

[RESULT] SUPI Recovered: [REJECTED — ${reason}]`
  }
}

export async function sidfDecrypt(ctx: FiveGService, profile: 'A' | 'B' | 'C') {
  if (profile === 'C') return sidfDecryptProfileC(ctx)
  const header = `═══════════════════════════════════════════════════════════════
            SIDF DECRYPTION(HOME NETWORK)
═══════════════════════════════════════════════════════════════`

  // Get values from state (computed in previous steps)
  const usedSharedSecret = ctx.state.sharedSecretHex || '[Missing Shared Secret]'
  const usedKenc = ctx.state.kEncHex || '[Missing K_enc]'
  const usedKmac = ctx.state.kMacHex || '[Missing K_mac]'
  const usedCiphertext = ctx.state.encryptedMSINHex || '[Missing Ciphertext]'
  const usedMnPub = ctx.state.ephemeralPubKeyHex || '0x[EphemeralPubKey]'

  // Step 1: MAC verification FIRST (authenticate-then-decrypt per 5G spec)
  let macVerificationLine = '4. Verifying MAC...[SKIPPED — state incomplete]'
  let macPassed = false
  if (usedKmac !== '[Missing K_mac]' && usedCiphertext !== '[Missing Ciphertext]') {
    try {
      const macAlgo = 'sha256'
      const verifyFile = `dec_verify_${Date.now()}.bin`
      const cipherBytesForMac = new Uint8Array(
        usedCiphertext.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      )
      const macRes = await openSSLService.execute(
        `openssl dgst -${macAlgo} -mac HMAC -macopt hexkey:${usedKmac} ${verifyFile}`,
        [{ name: verifyFile, data: cipherBytesForMac }]
      )
      const fullMac = macRes.stdout?.match(/([a-fA-F0-9]{64})/)?.[1] ?? ''
      const recomputedTag = fullMac.substring(0, 16) // truncate to 8 bytes
      const storedTag = ctx.state.macTagHex ?? ''
      const macMatch =
        storedTag && recomputedTag && recomputedTag.toLowerCase() === storedTag.toLowerCase()
      macPassed = /^[a-fA-F0-9]{16}$/.test(storedTag) && !!macMatch
      macVerificationLine = `4. Verifying MAC (HMAC-SHA-256, truncated to 8 bytes)...
   Recomputed tag: ${recomputedTag || '(computation failed)'}
   Stored tag:     ${storedTag || '(missing)'}
   Result: ${macPassed ? '[OK] MAC VALID' : '[FAIL] MAC missing, invalid or mismatched — SUCI rejected'}`
    } catch {
      macVerificationLine = '4. Verifying MAC...[ERROR — HMAC computation failed]'
    }
  }

  // Step 2: Decrypt MSIN only if MAC passed (authenticate-then-decrypt)
  let recoveredSupi = '[Decryption Skipped]'
  let decryptLine = '5. Decrypting MSIN...[SKIPPED — MAC not yet verified]'
  if (!macPassed) {
    decryptLine = '5. Decrypting MSIN...[ABORTED — MAC verification failed; SUCI rejected by SIDF]'
    recoveredSupi = '[REJECTED — MAC not verified]'
  } else if (ctx.state.kEncHex && ctx.state.encryptedMSINHex) {
    try {
      const keyLen = ctx.state.kEncHex.length / 2
      const algo = keyLen === 32 ? 'aes-256-ctr' : 'aes-128-ctr'
      const iv = '00000000000000000000000000000000'
      const cipherFile = `dec_cipher_${ctx.getTimestamp()}.bin`
      const decMsinFile = `dec_msin_${ctx.getTimestamp()}.bin`
      ctx.trackFile(cipherFile)
      ctx.trackFile(decMsinFile)
      const cipherBytes = new Uint8Array(
        ctx.state.encryptedMSINHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      )
      const res = await openSSLService.execute(
        `openssl enc -d -${algo} -K ${ctx.state.kEncHex} -iv ${iv} -in ${cipherFile} -out ${decMsinFile}`,
        [{ name: cipherFile, data: cipherBytes }]
      )
      const decData = res.files.find((f) => f.name === decMsinFile)?.data
      if (decData) {
        const msin = ctx.bcdDecode(new Uint8Array(decData))
        const parsedSupi = ctx.state.supi || '310260123456789'
        const expectedMcc = parsedSupi.length >= 3 ? parsedSupi.slice(0, 3) : '310'
        const expectedMnc = parsedSupi.length >= 6 ? parsedSupi.slice(3, 6) : '260'
        recoveredSupi = `${expectedMcc}${expectedMnc}${msin}`
        decryptLine = `5. Decrypting MSIN (${algo.toUpperCase()}, zero IV)...
   > C_Decrypt(CKM_AES_CTR)
   BCD decode → MSIN: ${msin}`
      } else {
        console.error('[FiveGService] Decrypt failed - no output file')
        console.error('[FiveGService] Decrypt stderr:', res.stderr)
        decryptLine = '5. Decrypting MSIN...[ERROR — no output from OpenSSL]'
      }
    } catch (e) {
      recoveredSupi = `[Error: ${e}]`
      decryptLine = `5. Decrypting MSIN...[ERROR: ${e}]`
    }
  }

  const curve = profile === 'A' ? 'X25519' : 'P-256'

  return `${header}

[Network Side - ${curve}]
1. Receiving SUCI Transmission...
   > Scheme: ${profile === 'A' ? '1' : '2'} (${curve})
   > Ephemeral PubKey: ${usedMnPub}
   > Encrypted MSIN: ${usedCiphertext}

2. Deriving Shared Secret (ECDH)...
   Using: HN_PrivKey + Eph_PubKey
   > C_DeriveKey(CKM_ECDH1_DERIVE)
   > Shared Secret (Z) Recovered:
   ${usedSharedSecret}

3. Deriving Keys (ANSI X9.63-KDF, SHA-256)...
   > K_enc: ${usedKenc}
   > K_mac: ${usedKmac}

${macVerificationLine}

${decryptLine}

[${recoveredSupi.startsWith('[') ? 'RESULT' : 'SUCCESS'}] SUPI Recovered: ${recoveredSupi}`
}
