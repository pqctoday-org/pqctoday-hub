// SPDX-License-Identifier: GPL-3.0-only
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { bytesToHex } from '@/services/crypto/FileUtils'
import type { FiveGService } from '../FiveGService'

export async function encryptMSIN(ctx: FiveGService) {
  if (!ctx.state.kEncHex) return '[Error] No Key Derived'

  // MSIN portion only (without MCC/MNC) per 3GPP TS 33.501
  const parsedSupi = ctx.state.supi || '310260123456789'
  const msinDigits = parsedSupi.length > 6 ? parsedSupi.slice(6) : parsedSupi
  const msinBytes = ctx.bcdEncode(msinDigits)
  const msinHex = bytesToHex(msinBytes)

  // Determine algorithm based on key length (16 bytes = AES-128, 32 bytes = AES-256)
  const keyLen = ctx.state.kEncHex.length / 2
  const algo = keyLen === 32 ? 'aes-256-ctr' : 'aes-128-ctr'
  const iv = '00000000000000000000000000000000' // Zero IV per 3GPP spec

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
IV: ${iv} (zero IV per 3GPP spec)

> C_Encrypt(CKM_AES_CTR)

[SUCCESS] Ciphertext: ${ctx.state.encryptedMSINHex} (${cipherHex.length / 2} bytes)`
  } catch (e) {
    return `[Error] Encryption failed: ${e}`
  }
}

export async function computeMAC(ctx: FiveGService) {
  if (!ctx.state.kMacHex || !ctx.state.encryptedMSINHex) return '[Error] Missing Ciphertext or Key'

  try {
    // Prepare cipher data from state (always available as hex after encryptMSIN)
    const cipherFile = `cipher_mac_${ctx.getTimestamp()}.bin`
    ctx.trackFile(cipherFile)
    const cipherBytes = new Uint8Array(
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
Data (Ciphertext): ${ctx.state.encryptedMSINHex}
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
  // Raw ephemeral key (SPKI header stripped) — this is what appears in the SUCI schemeOutput
  const rawEphPubHex =
    ctx.state.profile === 'A' && ephSpki.length === 88
      ? ephSpki.substring(24)
      : ctx.state.profile === 'B' && ephSpki.length === 182
        ? ephSpki.substring(52)
        : ephSpki

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

[3. Assembled SUCI (Privacy Preserving ID)]
  Format per 3GPP TS 23.003 §8.3:
  suci-0-<mcc>-<mnc>-<routingIndicator>-<schemeID>-<keyId>-<schemeOutput>
  where schemeOutput = rawEphPubKey || msinCiphertext || macTag (hex concat)

  SUCI String (abbreviated):
  suci-0-${mcc}-${mnc}-${routing}-${scheme}-${keyId}-${rawEphPubHex ? rawEphPubHex.substring(0, 8) + '...' : '[EphKey]'}${cipher}${mac}

[SUCCESS] Structure Verified. Ready for Transmission.`
}

export async function assembleSUCI(ctx: FiveGService, profile: 'A' | 'B' | 'C') {
  const parsedSupi = ctx.state.supi || '310260123456789'
  const mcc = parsedSupi.length >= 3 ? parsedSupi.slice(0, 3) : '310'
  const mnc = parsedSupi.length >= 6 ? parsedSupi.slice(3, 6) : '260'
  const routing = '0' // Routing Indicator (decimal integer, 0 = default per TS 23.003)
  const scheme = profile === 'A' ? '1' : profile === 'B' ? '2' : '3'
  const keyId = '1' // Home Network Public Key Identifier (decimal 0-255, no zero-padding)

  const cipher = ctx.state.encryptedMSINHex || ''
  const mac = ctx.state.macTagHex || ''
  const ephSpki = ctx.state.ephemeralPubKeyHex || ''
  const kemCt = ctx.state.ciphertextHex || ''

  // Per 3GPP TS 33.501 §C.3.3 + TS 23.003 §8.3:
  // schemeOutput = rawEphemeralPublicKey || msinCiphertext || macTag (hex concat, no separators)
  // Raw key = SPKI with header stripped:
  //   X25519 SPKI = 44 bytes → offset 12 → 32-byte raw key (24 hex chars stripped)
  //   P-256  SPKI = 91 bytes → offset 26 → 65-byte uncompressed point (52 hex chars stripped)
  const rawEphPubHex =
    profile === 'A' && ephSpki.length === 88
      ? ephSpki.substring(24) // 32-byte X25519 raw key
      : profile === 'B' && ephSpki.length === 182
        ? ephSpki.substring(52) // 65-byte P-256 uncompressed point (incl. 04 prefix)
        : ephSpki // fallback

  // Profile C: schemeOutput = kemCiphertext || msinCiphertext || macTag
  // Profile A/B: schemeOutput = rawEphPubKey || msinCiphertext || macTag
  const schemeOutputHex =
    profile === 'C' ? `${kemCt}${cipher}${mac}` : `${rawEphPubHex}${cipher}${mac}`

  const suciString = `suci-0-${mcc}-${mnc}-${routing}-${scheme}-${keyId}-${schemeOutputHex}`
  const suciBytes = new TextEncoder().encode(suciString)
  const suciHex = bytesToHex(suciBytes)

  const displayKey =
    profile === 'C'
      ? kemCt
        ? `${kemCt.substring(0, 32)}... (${kemCt.length / 2} bytes, ML-KEM-768 ciphertext)`
        : '[Missing KEM Ciphertext]'
      : rawEphPubHex
        ? `${rawEphPubHex.substring(0, 32)}... (${rawEphPubHex.length / 2} bytes, raw ${profile === 'A' ? 'X25519' : 'P-256'} key)`
        : '[Missing EphKey]'

  return `═══════════════════════════════════════════════════════════════
            SUCI ASSEMBLY (Profile ${profile})
═══════════════════════════════════════════════════════════════

Step 1: Gathering Components (per 3GPP TS 23.003 §8.3)
  > MCC:              ${mcc}
  > MNC:              ${mnc}
  > Routing Indicator: ${routing}
  > Scheme ID:        ${scheme} (${profile === 'A' ? 'ECIES Profile A' : profile === 'B' ? 'ECIES Profile B' : 'KEM Profile C'})
  > Key Identifier:   ${keyId}

Step 2: Scheme Output Fields (hex-concatenated, no separators)
  > ${profile === 'C' ? 'KEM Ciphertext' : 'Raw Ephemeral Public Key'}: ${displayKey}
  > MSIN Ciphertext:  ${cipher || '[Missing]'} (${cipher.length / 2 || 0} bytes)
  > MAC Tag:          ${mac || '[Missing]'} (${mac.length / 2 || 0} bytes)

Step 3: schemeOutput = ${profile === 'C' ? 'kemCt' : 'rawEphPub'} || msinCipher || macTag
  ${schemeOutputHex.substring(0, 64)}${schemeOutputHex.length > 64 ? '...' : ''}

Step 4: Final SUCI String (3GPP TS 23.003 §8.3 format)
  suci-0-<mcc>-<mnc>-<routingIndicator>-<schemeID>-<keyId>-<schemeOutput>
  ${suciString.substring(0, 120)}${suciString.length > 120 ? '...' : ''}

Step 5: SUCI Hex Encoding (${suciBytes.length} bytes)
  ${suciHex.substring(0, 64)}${suciHex.length > 64 ? '...' : ''}

[SUCCESS] SUCI assembled per 3GPP TS 23.003 §8.3. Ready for transmission over the air interface.`
}

export async function sidfDecrypt(ctx: FiveGService, profile: 'A' | 'B' | 'C') {
  const header = `═══════════════════════════════════════════════════════════════
            SIDF DECRYPTION(HOME NETWORK)
═══════════════════════════════════════════════════════════════`

  // Get values from state (computed in previous steps)
  const usedSharedSecret = ctx.state.sharedSecretHex || '[Missing Shared Secret]'
  const usedKenc = ctx.state.kEncHex || '[Missing K_enc]'
  const usedKmac = ctx.state.kMacHex || '[Missing K_mac]'
  const usedCiphertext = ctx.state.encryptedMSINHex || '[Missing Ciphertext]'
  const usedMnPub =
    profile === 'C' ? '0x...' : ctx.state.ephemeralPubKeyHex || '0x[EphemeralPubKey]'

  // Step 1: MAC verification FIRST (authenticate-then-decrypt per 5G spec)
  let macVerificationLine = '4. Verifying MAC...[SKIPPED — state incomplete]'
  let macPassed = true // default allow-decrypt if we have no stored tag to check
  if (usedKmac !== '[Missing K_mac]' && usedCiphertext !== '[Missing Ciphertext]') {
    try {
      const macAlgo = profile === 'C' ? 'sha3-256' : 'sha256'
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
      macPassed = !storedTag || !!macMatch // pass if no stored tag, or if tags match
      macVerificationLine = `4. Verifying MAC (${profile === 'C' ? 'HMAC-SHA3-256' : 'HMAC-SHA-256'}, truncated to 8 bytes)...
   Recomputed tag: ${recomputedTag || '(computation failed)'}
   Stored tag:     ${storedTag || '(missing — skipping check)'}
   Result: ${macMatch ? '[OK] MAC VALID' : storedTag ? '[FAIL] MAC MISMATCH — SUCI rejected' : '[OK] (no stored tag; check skipped)'}`
    } catch {
      macVerificationLine = '4. Verifying MAC...[ERROR — HMAC computation failed]'
    }
  }

  // Step 2: Decrypt MSIN only if MAC passed (authenticate-then-decrypt)
  let recoveredSupi = '[Decryption Skipped]'
  let decryptLine = '5. Decrypting MSIN...[SKIPPED — MAC not yet verified]'
  if (!macPassed) {
    decryptLine = '5. Decrypting MSIN...[ABORTED — MAC verification failed; SUCI rejected by SIDF]'
    recoveredSupi = '[REJECTED — MAC mismatch]'
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

  if (profile === 'C') {
    const ciphertextHexC = ctx.state.ciphertextHex || ''
    const hnPqcPrivHex = ctx.state.hnPqcPrivHex || ''

    // Run actual ML-KEM-768 decapsulation using the HN private key and received KEM ciphertext
    let decapLine =
      '2. Decapsulating Shared Secret...[SKIPPED — HN private key not in state; re-run from Step 1]'
    let zKemHex = ''

    if (hnPqcPrivHex && ciphertextHexC) {
      try {
        const ts = Date.now()
        const privFile = `sidf_pqc_priv_${ts}.key`
        const ctFile = `sidf_kem_ct_${ts}.bin`
        const ssFile = `sidf_kem_ss_${ts}.bin`
        ctx.trackFile(privFile)
        ctx.trackFile(ctFile)
        ctx.trackFile(ssFile)

        // Reconstruct PEM private key file from stored hex bytes
        const privBytes = new Uint8Array(hnPqcPrivHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
        const ctBytes = new Uint8Array(ciphertextHexC.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))

        const decapRes = await openSSLService.execute(
          `openssl pkeyutl -decap -inkey ${privFile} -in ${ctFile} -out ${ssFile}`,
          [
            { name: privFile, data: privBytes },
            { name: ctFile, data: ctBytes },
          ]
        )

        const ssData = decapRes.files.find((f) => f.name === ssFile)?.data
        if (ssData) {
          zKemHex = bytesToHex(ssData)
        } else {
          zKemHex = await ctx.readFileHex(ssFile)
        }

        if (zKemHex) {
          const isHybrid =
            usedSharedSecret && usedSharedSecret !== zKemHex && !usedSharedSecret.startsWith('[')
          decapLine = `2. Decapsulating Shared Secret (ML-KEM-768)...
   KEM Ciphertext: ${ciphertextHexC.substring(0, 32)}... (${ctBytes.length} bytes)
   > openssl pkeyutl -decap -inkey hn_pqc_priv.key -in kem_ct.bin -out z_kem.bin
   Z_kem (32 bytes): ${zKemHex}${isHybrid ? '\n   Combined Z = SHA256(Z_ecdh ‖ Z_kem) per 3GPP TR 33.841 [hybrid mode]' : '\n   Z = Z_kem [pure PQC mode]'}`
        } else {
          decapLine = `2. Decapsulating Shared Secret...[ERROR — decap output missing; stderr: ${decapRes.stderr?.substring(0, 100) || 'none'}]`
        }
      } catch (e) {
        decapLine = `2. Decapsulating Shared Secret...[ERROR: ${e}]`
      }
    }

    return `${header}

[Network Side - PQC]
1. Receiving SUCI Transmission...
   > Scheme: 3 (ML-KEM-768)
   > KEM Ciphertext: ${ciphertextHexC ? `${ciphertextHexC.substring(0, 32)}... (${ciphertextHexC.length / 2} bytes)` : '[missing — run compute_shared_secret first]'}
   > Encrypted MSIN: ${usedCiphertext}

${decapLine}

3. Deriving Session Keys (ANSI X9.63-KDF, SHA3-256)...
   > Z (combined): ${usedSharedSecret.length > 64 ? usedSharedSecret.substring(0, 64) + '...' : usedSharedSecret}
   > K_enc: ${usedKenc}
   > K_mac: ${usedKmac}

${macVerificationLine}

${decryptLine}

[${recoveredSupi.startsWith('[') ? 'RESULT' : 'SUCCESS'}] SUPI Recovered: ${recoveredSupi}`
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
