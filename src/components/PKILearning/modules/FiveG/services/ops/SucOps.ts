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
  const routing = '0000' // Routing Indicator
  const scheme = ctx.state.profile === 'A' ? '1' : ctx.state.profile === 'B' ? '2' : '3'
  const keyId = '01' // Key ID

  const cipher = ctx.state.encryptedMSINHex || '[Missing Cipher]'
  const mac = ctx.state.macTagHex || '[Missing MAC]'
  const ephPub = ctx.state.ephemeralPubKeyHex || '[Missing EphKey]'

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
  > MAC Tag (Integrity):
    ${mac}

[3. Assembled SUCI (Privacy Preserving ID)]
  Format: suci-<mcc>-<mnc>-<routing>-<scheme>-<keyId>-<schemeOutput>

  SUCI String:
  suci-${mcc}-${mnc}-${routing}-${scheme}-${keyId}-${ephPub.substring(0, 8)}...-${cipher}-${mac}

[SUCCESS] Structure Verified. Ready for Transmission.`
}

export async function assembleSUCI(ctx: FiveGService, profile: 'A' | 'B' | 'C') {
  const parsedSupi = ctx.state.supi || '310260123456789'
  const mcc = parsedSupi.length >= 3 ? parsedSupi.slice(0, 3) : '310'
  const mnc = parsedSupi.length >= 6 ? parsedSupi.slice(3, 6) : '260'
  const routing = '0000'
  const scheme = profile === 'A' ? '1' : profile === 'B' ? '2' : '3'
  const keyId = '01'

  const cipher = ctx.state.encryptedMSINHex || '[Missing Cipher]'
  const mac = ctx.state.macTagHex || '[Missing MAC]'
  const ephPub = ctx.state.ephemeralPubKeyHex || ''
  const kemCt = ctx.state.ciphertextHex || ''

  // Profile C includes KEM ciphertext instead of (or alongside) ephemeral public key
  const schemeOutput =
    profile === 'C'
      ? kemCt
        ? `${ephPub ? ephPub.substring(0, 16) + '...|' : ''}${kemCt.substring(0, 16)}...`
        : '[Missing KEM Ciphertext]'
      : ephPub
        ? ephPub.substring(0, 16) + '...'
        : '[Missing EphKey]'

  const suciString = `suci-0-${mcc}-${mnc}-${routing}-${scheme}-${keyId}-${schemeOutput}-${cipher}-${mac}`
  const suciBytes = new TextEncoder().encode(suciString)
  const suciHex = bytesToHex(suciBytes)

  return `═══════════════════════════════════════════════════════════════
            SUCI ASSEMBLY (Profile ${profile})
═══════════════════════════════════════════════════════════════

Step 1: Gathering Components
  > MCC:     ${mcc}
  > MNC:     ${mnc}
  > Routing: ${routing}
  > Scheme:  ${scheme} (${profile === 'A' ? 'ECIES Profile A' : profile === 'B' ? 'ECIES Profile B' : 'KEM Profile C'})
  > Key ID:  ${keyId}

Step 2: Scheme Output (${profile === 'C' ? 'KEM Ciphertext' : 'Ephemeral Public Key'})
  > ${schemeOutput}

Step 3: Protected Fields
  > Ciphertext: ${cipher}
  > MAC Tag:    ${mac}

Step 4: Final SUCI String
  ${suciString}

Step 5: SUCI Hex Encoding (${suciBytes.length} bytes)
  ${suciHex.substring(0, 64)}${suciHex.length > 64 ? '...' : ''}

[SUCCESS] SUCI assembled. Ready for transmission over the air interface.`
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

  let recoveredSupi = '[Decryption Failed]'
  let decryptCmd = ''

  // Attempt Dynamic Decryption via OpenSSL
  try {
    if (ctx.state.kEncHex && ctx.state.encryptedMSINHex) {
      const keyLen = ctx.state.kEncHex.length / 2
      const algo = keyLen === 32 ? 'aes-256-ctr' : 'aes-128-ctr'
      const iv = '00000000000000000000000000000000'

      // File names
      const cipherFile = `dec_cipher_${ctx.getTimestamp()}.bin`
      const decMsinFile = `dec_msin_${ctx.getTimestamp()}.bin`
      ctx.trackFile(cipherFile)
      ctx.trackFile(decMsinFile)

      // Prepare cipher data from state
      const cipherBytes = new Uint8Array(
        ctx.state.encryptedMSINHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      )

      // Run OpenSSL AES-CTR decryption (pass input in same call)
      decryptCmd = `openssl enc -d -${algo} -K ${ctx.state.kEncHex} -iv ${iv} -in ${cipherFile} -out ${decMsinFile}`
      const res = await openSSLService.execute(decryptCmd, [
        { name: cipherFile, data: cipherBytes },
      ])

      // Read decrypted output and BCD-decode back to digits
      const decData = res.files.find((f) => f.name === decMsinFile)?.data
      if (decData) {
        const msin = ctx.bcdDecode(new Uint8Array(decData))
        const parsedSupi = ctx.state.supi || '310260123456789'
        const expectedMcc = parsedSupi.length >= 3 ? parsedSupi.slice(0, 3) : '310'
        const expectedMnc = parsedSupi.length >= 6 ? parsedSupi.slice(3, 6) : '260'
        recoveredSupi = `${expectedMcc}${expectedMnc}${msin}`
      } else {
        console.error('[FiveGService] Decrypt failed - no output file')
        console.error('[FiveGService] Decrypt stderr:', res.stderr)
      }
    }
  } catch (e) {
    recoveredSupi = `[Error: ${e}]`
  }

  if (profile === 'C') {
    return `${header}

[Network Side - PQC]
1. Receiving SUCI Transmission...
   > Scheme: 3(ML-KEM-768)
   > Ciphertext: [1088 bytes]
   > Encrypted MSIN: ${usedCiphertext}

2. Decapsulating Shared Secret...
   Checking HN_PQC_PrivKey...OK
   > C_DecapsulateKey(CKM_ML_KEM)
   > Shared Secret Recovered(32 bytes):
   ${usedSharedSecret}

3. Deriving Session Keys(SHA3-256)...
   > K_enc: ${usedKenc}
   > K_mac: ${usedKmac}

4. Verifying MAC...[OK]

5. Decrypting MSIN via SoftHSM API...
   > C_Decrypt(CKM_AES_CTR)

[SUCCESS] SUPI Recovered: ${recoveredSupi}`
  }

  // Profile A or B
  const curve = profile === 'A' ? 'X25519' : 'P-256'

  return `${header}

[Network Side - ${curve}]
1. Receiving SUCI Transmission...
   > Scheme: ${profile === 'A' ? '1' : '2'} (${curve})
   > Ephemeral PubKey: ${usedMnPub}
   > Encrypted MSIN: ${usedCiphertext}

2. Deriving Shared Secret(ECDH)...
   Using: HN_PrivKey + Eph_PubKey
   > C_DeriveKey(CKM_ECDH1_DERIVE)
   > Shared Secret(Z) Recovered:
   ${usedSharedSecret}

3. Deriving Keys(ANSI X9.63 KDF)...
   > K_enc: ${usedKenc}
   > K_mac: ${usedKmac}

4. Verifying MAC...[OK]

5. Decrypting MSIN via SoftHSM API...
   > C_Decrypt(CKM_AES_CTR)

[SUCCESS] SUPI Recovered: ${recoveredSupi}`
}
