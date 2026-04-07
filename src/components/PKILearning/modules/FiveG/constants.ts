// SPDX-License-Identifier: GPL-3.0-only
export const FIVE_G_CONSTANTS = {
  SUCI_STEPS_A: [
    {
      id: 'init_network_key',
      title: '1. Home Network Key Generation (Profile A)',
      description:
        'The home network operator provisions a long-term asymmetric key pair. For Profile A, 5G mandates the use of Curve25519 (X25519), a state-of-the-art elliptic curve tailored for speed and security. The private key is securely stored for use by the SIDF (Subscription Identifier De-concealing Function) at the UDM for SUCI deconcealment, while the public key (32 bytes) is distributed to USIMs during SIM personalization.',
      code: `// SoftHSMv3 WASM: Generate Home Network X25519 Key
const { pubHandle, privHandle } = hsm_generateECKeyPair(hsmd, sessionHandle, 'X25519'
, false, 'derive');

// Or inject Profile A explicit test vectors for KAT validation:
const hnPrivHandle = await hsm_injectTestKey(
  hsmd, sessionHandle, hnPrivBytes, 'X25519'
);`,
      output: `[Home Network] Generating Profile A/B Key Pair...
[Home Network] X25519 / P-256 Key generated.
[Home Network] Public Key ready.`,
    },
    {
      id: 'provision_usim',
      title: '2. Provision USIM',
      description:
        'The Home Network Public Key is provisioned to the USIM secure element (EF_SUCI_Calc_Info), along with the profile identifier (Profile A: scheme ID 1 / X25519, Profile B: scheme ID 2 / P-256). The EF_SUCI_Calc_Info also stores the Routing Indicator (0–4 decimal digits, default 0000) — a network-assigned value that routes the SUCI to the correct UDM/SIDF instance for deconcealment in roaming scenarios.',
      code: `# Simulated Provisioning API
USIM.write('EF_SUCI_Calc_Info', {
  HN_PubKey: readFile('hn_pub.key'),
  ProtectionScheme: 'Profile A (X25519) / Profile B (P-256)',
  KeyId: 1 // 1 = Profile A (X25519), 2 = Profile B (P-256)
});`,
      output: `[Provisioning] Writing to USIM EF_SUCI_Calc_Info...
[Provisioning] Success. USIM configured for selected protection scheme.`,
    },
    {
      id: 'retrieve_key',
      title: '3. Retrieve Home Network Public Key',
      description:
        'The USIM reads the Home Network Public Key from EF_SUCI_Calc_Info. Profile A uses X25519 (Curve25519, 32 bytes); Profile B uses P-256 (secp256r1, 65-byte uncompressed point). SUCI can conceal two SUPI types: IMSI (type 0 — 15-digit numeric identity, MSIN is 5–9 BCD bytes) or NAI (type 1 — a network-specific identifier that may be longer; the full identifier is encrypted, producing more ciphertext bytes than an IMSI).',
      code: `const suciInfo = USIM.readFile('EF_SUCI_Calc_Info');\nconst hnPubKey = suciInfo.HN_PubKey; // X25519 (32 bytes) or P-256 (65 bytes)`,
      output: `[USIM] Reading EF_SUCI_Calc_Info...\n[USIM] Profile A: X25519 (Curve25519) | Profile B: P-256 (secp256r1)\n[USIM] HN Public Key: ready for ECDH key agreement`,
    },
    {
      id: 'gen_ephemeral_key',
      title: '4. Generate Ephemeral Key Pair',
      description:
        'Generate a fresh ephemeral key pair using the selected curve (X25519 for Profile A, P-256 for Profile B). This key pair is unique to this connection attempt and provides forward secrecy.',
      code: `// SoftHSMv3 WASM: Generate Ephemeral Key
// Profile A uses X25519; Profile B uses P-256
const { pubHandle: ephPub, privHandle: ephPriv } = hsm_generateECKeyPair(
  hsmd, sessionHandle,
  'X25519' /* or 'P-256' for Profile B */
);`,
      output: `[USIM] Generating Ephemeral Key Pair (X25519 or P-256)...\n[USIM] Ephemeral key pair generated and stored in SoftHSM3.`,
    },
    {
      id: 'compute_shared_secret',
      title: '5. Compute Shared Secret (ECDH)',
      description:
        "Perform Diffie-Hellman Key Agreement using the selected curve (X25519 for Profile A, P-256 for Profile B). The USIM combines its ephemeral private key with the Home Network's public key to derive the shared secret Z.",
      code: `// SoftHSMv3 WASM: Diffie-Hellman Key Agreement (X25519)
// PKCS#11 v3.2: Both X25519 and P-256 use CKM_ECDH1_DERIVE (0x1050).
// SoftHSMv3 dispatches internally based on CKA_KEY_TYPE:
//   CKK_EC_MONTGOMERY (0x41) → X25519 Montgomery DH (deriveEDDSA path)
//   CKK_EC (0x03)            → P-256 Weierstrass DH (deriveECDH path)
const sharedSecretHandle = hsm_ecdhDerive(
  hsmd,
  sessionHandle,
  ephPriv,      // Ephemeral Private Key (CKK_EC_MONTGOMERY for X25519)
  hnPubHandle,  // Network Public Key
  false         // False = Raw Z extraction
); // → C_DeriveKey(CKM_ECDH1_DERIVE) — routed to Montgomery DH by key type`,
      output: `[USIM] Executing ECDH (X25519)...\n[USIM] Shared Secret (Z): [PROTECTED]`,
    },
    {
      id: 'derive_keys',
      title: '6. Derive Keys (ANSI-X9.63-KDF)',
      description:
        'The shared secret (Z) is passed through ANSI X9.63 KDF with the ephemeral public key as SharedInfo. Two SHA-256 iterations produce K_enc (128-bit AES) and K_mac (256-bit HMAC).',
      code: `// ANSI X9.63-KDF: Z ‖ counter ‖ SharedInfo (raw ephemeral public key)
block1 = SHA-256(Z || 0x00000001 || sharedInfo)  // 32 bytes — sharedInfo = raw eph pub key
block2 = SHA-256(Z || 0x00000002 || sharedInfo)  // 32 bytes

// K_enc = first 128 bits of block1 (AES-128)
const kEnc = block1.slice(0, 16);
// K_mac = trailing 128 bits of block1 + first 128 bits of block2 (256-bit HMAC)
const kMac = [...block1.slice(16), ...block2.slice(0, 16)];`,
      output: `[USIM] Deriving Keys...\n[USIM] K_enc: 128-bit AES Key\n[USIM] K_mac: 256-bit HMAC Key`,
    },
    {
      id: 'encrypt_msin',
      title: '7. Encrypt MSIN (Encryption Point)',
      description:
        'This is the Encryption Point where the MSIN becomes ciphertext. AES-CTR mode is chosen deliberately: it is length-preserving — the ciphertext is exactly the same byte length as the plaintext MSIN, keeping the SUCI compact over the air interface.',
      code: `// SoftHSMv3 WASM: C_Encrypt (AES-128-CTR)
// 3GPP TS 33.501 §C.3.3 mandates AES-128-CTR with zero IV
const iv = new Uint8Array(16) // zero per TS 33.501 — all 16 bytes = 0x00
const ciphertext = hsm_aesEncrypt(
  hsmd, sessionHandle, hKenc, msinBcd, iv, 'ctr'
);`,
      output: `[USIM] Encrypting MSIN...\n[USIM] Ciphertext: 0x4f8a2b1c9d... (5 bytes)`,
    },
    {
      id: 'compute_mac',
      title: '8. Compute MAC Tag',
      description:
        'Compute HMAC-SHA-256 over the ciphertext using K_mac, then truncate to 8 bytes (64 bits). Truncation is intentional: SUCI is an over-the-air identifier where space is constrained, and a 64-bit authentication code provides sufficient integrity protection for this use case.',
      code: `// SoftHSMv3 WASM: C_Sign (HMAC-SHA256)
const macTagFull = hsm_hmac(
  hsmd, sessionHandle, hKmac, ciphertext, 'SHA256'
);`,
      output: `[USIM] Computed MAC Tag: 0xa1b2c3d4...`,
    },
    {
      id: 'visualize_suci',
      title: '9. Visual Inspection: SUPI vs SUCI',
      description:
        'Compare the sensitive cleartext identity (SUPI) with the protected SUCI structure.',
      code: '# Visual Verification',
      output: '[Visualizing Data Structures...]',
      explanationTable: [
        {
          label: 'SUPI (Input)',
          value: 'IMSI: 310260123456789 (MCC=310, MNC=260, MSIN=123456789)',
          description: 'Subscriber Permanent Identifier. No dashes per 3GPP TS 23.003.',
        },
        {
          label: 'SUPI Hex',
          value: '333130323630313233343536373839',
          description: 'Raw Hexadecimal of IMSI digits.',
        },
        {
          label: 'Ciphertext',
          value: '0x4F 0x8A 0x2B ...',
          description:
            'Encrypted MSIN (AES-128-CTR, zero IV). Length-preserving — same byte count as BCD-encoded MSIN.',
        },
        {
          label: 'MAC Tag',
          value: '0xA1 0xB2 ...',
          description: 'HMAC-SHA-256 Integrity Tag.',
        },
        {
          label: 'SUCI (Output)',
          value: 'suci-0-310-260-1-1-{rawX25519EphPub(32B)}-{ciphertext}-{mac}',
          description:
            'Concealed Identifier. Scheme ID: 1 = Profile A. The ephemeral public key is a raw 32-byte X25519 scalar — Montgomery curves do not use compressed/uncompressed encoding; the key is always 32 bytes in both internal ECDH use and over-the-air transmission.',
        },
        {
          label: 'SUCI Hex',
          value: '737563692d302d3331302d3236302d322d31...',
          description: 'Partial Raw Hex of SUCI.',
        },
      ],
    },
    {
      id: 'assemble_suci',
      title: '10. Assemble SUCI',
      description:
        'Combine parameters into the final SUCI. Profile A uses scheme ID 1: the ephemeral public key is transmitted as a raw 32-byte X25519 value (Montgomery curve — no compression concept applies). Profile B uses scheme ID 2: the P-256 ephemeral key is transmitted in COMPRESSED form (33 bytes: 02/03 prefix + 32-byte x-coordinate) per TS 33.501 Annex C.4 — not the 65-byte uncompressed form used internally for ECDH.',
      code: `// Profile A: raw 32-byte X25519 key (no compression — Montgomery curves use raw scalars)
const suciA = {
  scheme: 1,
  eccPubKey: ephPubKey, // 32 bytes, raw little-endian scalar
  ciphertext: encryptedMSIN,
  macTag: macTag
};

// Profile B: compressed P-256 key for over-the-air encoding
// ECDH uses uncompressed (04 || x || y) internally — SUCI encodes compressed (02/03 || x)
const yLastByte = parseInt(uncompressedPub.slice(-2), 16);
const prefix = (yLastByte % 2 === 0) ? '02' : '03'; // 02=y even, 03=y odd
const compressedPub = prefix + uncompressedPub.slice(2, 66); // 33 bytes
const suciB = {
  scheme: 2,
  eccPubKey: compressedPub, // 33 bytes — saves 32 bytes on air interface vs uncompressed
  ciphertext: encryptedMSIN,
  macTag: macTag
};`,
      output: `[USIM] SUCI-0-310-260-{1|2}-1-{ephPub}-0x4f8a...-0xa1b2...`,
    },
    {
      id: 'sidf_decryption',
      title: '11. Network SIDF: Decrypt SUCI (Decryption Point)',
      description: 'The Home Network SIDF reverses the process using the Home Network Private Key.',
      code: `// SoftHSMv3 WASM: Network SIDF — Full Deconcealment (Profile A, X25519)
// 1. Re-derive Z (X25519 ECDH: HN private key + UE ephemeral public key)
// PKCS#11 v3.2: CKM_ECDH1_DERIVE (0x1050) is used for both X25519 and P-256.
// SoftHSMv3 routes to Montgomery DH because hnPrivHandle has CKA_KEY_TYPE=CKK_EC_MONTGOMERY.
const Z = hsm_ecdhDerive(hsmd, hSession, hnPrivHandle, ephPubBytes)
// → C_DeriveKey(CKM_ECDH1_DERIVE) — X25519 path selected by key type

// 2. ANSI X9.63-KDF (SHA-256) per 3GPP TS 33.501 §C.3.3
const block1 = hsm_digest(M, hSession, concat(Z, 0x00000001, sharedInfo), CKM_SHA256)
const block2 = hsm_digest(M, hSession, concat(Z, 0x00000002, sharedInfo), CKM_SHA256)
const kEnc = block1.slice(0, 16)                          // 128-bit AES-128 key
const kMac = [...block1.slice(16), ...block2.slice(0, 16)] // 256-bit HMAC-SHA-256 key

// 3. Authenticate-then-decrypt: verify MAC BEFORE decryption (per 3GPP TS 33.501)
const macBytes = hsm_hmac(M, hSession, kMacHandle, ciphertext)
const recomputedTag = Array.from(macBytes.slice(0, 8)).map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase()
if (recomputedTag !== storedMacTag) throw new Error('MAC mismatch — SUCI rejected by SIDF')

// 4. Decrypt MSIN only after MAC passes (AES-128-CTR, zero IV per TS 33.501)
const iv = new Uint8Array(16) // all zeros
const msinBcd = hsm_aesDecrypt(hsmd, hSession, kEncHandle, ciphertext, iv, 'ctr')

// 5. BCD decode → MSIN digits → full SUPI
const msin = bcdDecode(msinBcd)  // e.g. '123456789'
const supi = mcc + mnc + msin    // e.g. '310260123456789'`,
      output: `[SIDF] Processing SUCI...
[SIDF] SUPI Recovered: 310260123456789`,
    },
  ],

  SUCI_STEPS_B: [
    {
      id: 'init_network_key',
      title: '1. Home Network Key Generation (Profile B)',
      description:
        'The home network operator provisions a long-term asymmetric key pair. For Profile B, 5G mandates the use of NIST P-256 (secp256r1), the standard NIST elliptic curve widely supported by HSMs and national standards. The private key is securely stored for use by the SIDF (Subscription Identifier De-concealing Function) at the UDM for SUCI deconcealment, while the public key (65-byte uncompressed point) is distributed to USIMs during SIM personalization.',
      code: `// SoftHSMv3 WASM: Generate Home Network P-256 Key
const { pubHandle, privHandle } = hsm_generateECKeyPair(hsmd, sessionHandle, 'P-256'
, false, 'derive');

// Or inject Profile B explicit test vectors for KAT validation:
const hnPrivHandle = await hsm_injectTestKey(
  hsmd, sessionHandle, hnPrivBytes, 'P-256'
);`,
      output: `[Home Network] Generating Profile B Key Pair...
[Home Network] P-256 Key generated.
[Home Network] Public Key ready.`,
    },
    {
      id: 'provision_usim',
      title: '2. Provision USIM',
      description:
        'The Home Network Public Key is provisioned to the USIM secure element (EF_SUCI_Calc_Info), along with the profile identifier (Profile A: scheme ID 1 / X25519, Profile B: scheme ID 2 / P-256). The EF_SUCI_Calc_Info also stores the Routing Indicator (0–4 decimal digits, default 0000) — a network-assigned value that routes the SUCI to the correct UDM/SIDF instance for deconcealment in roaming scenarios.',
      code: `# Simulated Provisioning API
USIM.write('EF_SUCI_Calc_Info', {
  HN_PubKey: readFile('hn_pub.key'),
  ProtectionScheme: 'Profile B (P-256)',
  KeyId: 2 // 2 = Profile B (P-256)
});`,
      output: `[Provisioning] Writing to USIM EF_SUCI_Calc_Info...
[Provisioning] Success. USIM configured for selected protection scheme.`,
    },
    {
      id: 'retrieve_key',
      title: '3. Retrieve Home Network Public Key',
      description:
        'The USIM reads the Home Network Public Key from EF_SUCI_Calc_Info. Profile A uses X25519 (Curve25519, 32 bytes); Profile B uses P-256 (secp256r1, 65-byte uncompressed point). SUCI can conceal two SUPI types: IMSI (type 0 — 15-digit numeric identity, MSIN is 5–9 BCD bytes) or NAI (type 1 — a network-specific identifier that may be longer; the full identifier is encrypted, producing more ciphertext bytes than an IMSI).',
      code: `const suciInfo = USIM.readFile('EF_SUCI_Calc_Info');\nconst hnPubKey = suciInfo.HN_PubKey; // P-256 (65 bytes, uncompressed)`,
      output: `[USIM] Reading EF_SUCI_Calc_Info...\n[USIM] Profile B: P-256 (secp256r1, 65-byte uncompressed point)\n[USIM] HN Public Key: ready for ECDH key agreement`,
    },
    {
      id: 'gen_ephemeral_key',
      title: '4. Generate Ephemeral Key Pair',
      description:
        'Generate a fresh ephemeral key pair using P-256 for Profile B (NIST secp256r1). This key pair is unique to this connection attempt and provides forward secrecy.',
      code: `// SoftHSMv3 WASM: Generate Ephemeral Key
// Profile B uses P-256
const { pubHandle: ephPub, privHandle: ephPriv } = hsm_generateECKeyPair(
  hsmd, sessionHandle,
  'P-256'
);`,
      output: `[USIM] Generating Ephemeral Key Pair (P-256)...\n[USIM] Ephemeral key pair generated and stored in SoftHSM3.`,
    },
    {
      id: 'compute_shared_secret',
      title: '5. Compute Shared Secret (ECDH)',
      description:
        "Perform Diffie-Hellman Key Agreement using P-256 for Profile B. The USIM combines its ephemeral private key with the Home Network's public key to derive the shared secret Z.",
      code: `// SoftHSMv3 WASM: Diffie-Hellman Key Agreement (ECDH P-256)
const sharedSecretHandle = hsm_ecdhDerive(
  hsmd,
  sessionHandle,
  ephPriv,      // Ephemeral Private Key
  hnPubHandle,  // Network Public Key
  false         // False = Raw Z extraction
);`,
      output: `[USIM] Executing ECDH (P-256)...\n[USIM] Shared Secret (Z): [PROTECTED]`,
    },
    {
      id: 'derive_keys',
      title: '6. Derive Keys (ANSI-X9.63-KDF)',
      description:
        'The shared secret (Z) is passed through ANSI X9.63 KDF with the ephemeral public key as SharedInfo. Two SHA-256 iterations produce K_enc (128-bit AES) and K_mac (256-bit HMAC).',
      code: `// ANSI X9.63-KDF: Z ‖ counter ‖ SharedInfo (raw ephemeral public key)
block1 = SHA-256(Z || 0x00000001 || sharedInfo)  // 32 bytes — sharedInfo = raw eph pub key
block2 = SHA-256(Z || 0x00000002 || sharedInfo)  // 32 bytes

// K_enc = first 128 bits of block1 (AES-128)
const kEnc = block1.slice(0, 16);
// K_mac = trailing 128 bits of block1 + first 128 bits of block2 (256-bit HMAC)
const kMac = [...block1.slice(16), ...block2.slice(0, 16)];`,
      output: `[USIM] Deriving Keys...\n[USIM] K_enc: 128-bit AES Key\n[USIM] K_mac: 256-bit HMAC Key`,
    },
    {
      id: 'encrypt_msin',
      title: '7. Encrypt MSIN (Encryption Point)',
      description:
        'This is the Encryption Point where the MSIN becomes ciphertext. AES-CTR mode is chosen deliberately: it is length-preserving — the ciphertext is exactly the same byte length as the plaintext MSIN, keeping the SUCI compact over the air interface.',
      code: `// SoftHSMv3 WASM: C_Encrypt (AES-128-CTR)
// 3GPP TS 33.501 §C.3.3 mandates AES-128-CTR with zero IV
const iv = new Uint8Array(16) // zero per TS 33.501 — all 16 bytes = 0x00
const ciphertext = hsm_aesEncrypt(
  hsmd, sessionHandle, hKenc, msinBcd, iv, 'ctr'
);`,
      output: `[USIM] Encrypting MSIN...\n[USIM] Ciphertext: 0x4f8a2b1c9d... (5 bytes)`,
    },
    {
      id: 'compute_mac',
      title: '8. Compute MAC Tag',
      description:
        'Compute HMAC-SHA-256 over the ciphertext using K_mac, then truncate to 8 bytes (64 bits). Truncation is intentional: SUCI is an over-the-air identifier where space is constrained, and a 64-bit authentication code provides sufficient integrity protection for this use case.',
      code: `// SoftHSMv3 WASM: C_Sign (HMAC-SHA256)
const macTagFull = hsm_hmac(
  hsmd, sessionHandle, hKmac, ciphertext, 'SHA256'
);`,
      output: `[USIM] Computed MAC Tag: 0xa1b2c3d4...`,
    },
    {
      id: 'visualize_suci',
      title: '9. Visual Inspection: SUPI vs SUCI',
      description:
        'Compare the sensitive cleartext identity (SUPI) with the protected SUCI structure.',
      code: '# Visual Verification',
      output: '[Visualizing Data Structures...]',
      explanationTable: [
        {
          label: 'SUPI (Input)',
          value: 'IMSI: 310260123456789 (MCC=310, MNC=260, MSIN=123456789)',
          description: 'Subscriber Permanent Identifier. No dashes per 3GPP TS 23.003.',
        },
        {
          label: 'SUPI Hex',
          value: '333130323630313233343536373839',
          description: 'Raw Hexadecimal of IMSI digits.',
        },
        {
          label: 'Ciphertext',
          value: '0x4F 0x8A 0x2B ...',
          description:
            'Encrypted MSIN (AES-128-CTR, zero IV). Length-preserving — same byte count as BCD-encoded MSIN.',
        },
        {
          label: 'MAC Tag',
          value: '0xA1 0xB2 ...',
          description: 'HMAC-SHA-256 Integrity Tag.',
        },
        {
          label: 'SUCI (Output)',
          value: 'suci-0-310-260-2-1-{compressedEphPub(33B)}-{ciphertext}-{mac}',
          description:
            'Concealed Identifier. Scheme ID: 2 = Profile B (P-256). The ephemeral public key in the SUCI is COMPRESSED (33 bytes: 02/03 prefix + x-coord). ECDH uses the uncompressed form (65 bytes) internally — only the over-the-air encoding compresses. SIDF decompresses by solving y²=x³-3x+b (mod p).',
        },
        {
          label: 'SUCI Hex',
          value: '737563692d302d3331302d3236302d322d31...',
          description: 'Partial Raw Hex of SUCI.',
        },
      ],
    },
    {
      id: 'assemble_suci',
      title: '10. Assemble SUCI',
      description:
        'Combine parameters into the final Profile B SUCI. The P-256 ephemeral key has two representations: the 65-byte UNCOMPRESSED form (04 || x || y) used internally for ECDH, and the 33-byte COMPRESSED form (02/03 || x) used in the over-the-air SUCI encoding per TS 33.501 Annex C.4. Compression saves 32 bytes on the radio interface; the SIDF reconstructs y from x using the P-256 curve equation y²=x³-3x+b (mod p). This is application-layer math — the HSM has no C_CompressECPoint; the application derives prefix from y-parity and transmits x-only.',
      code: `// P-256 EC point encoding — two forms, different purposes:
//
// UNCOMPRESSED (65 bytes) — used for ECDH key agreement inside the HSM:
//   Format: 04 || x(32B) || y(32B)
//   Why: Both x and y are required to place the point on the curve
//        and compute the shared secret Z = ECDH(ephPriv, hnPub).
const uncompressed = hsm_extractECPoint(M, hSession, ephPubHandle);
// → "04 E8B452... 36E0265" (65 bytes)
//
// COMPRESSED (33 bytes) — used in SUCI scheme output over the air:
//   Format: 02 (y even) or 03 (y odd) || x(32B)
//   Why: SIDF can recover y from x via y²=x³-3x+b (mod p).
//        Saves 32 bytes on the 5G radio interface (NAS message).
//   Note: Compression is application-layer — PKCS#11 has no C_CompressECPoint.
const y_last = parseInt(uncompressed.slice(-2), 16);
const prefix = (y_last % 2 === 0) ? '02' : '03';
const compressed = prefix + uncompressed.slice(2, 66); // 33 bytes
//
const suci = {
  scheme: 2,                   // Profile B (P-256)
  eccPubKey: compressed,       // 33 bytes over the air
  ciphertext: encryptedMSIN,
  macTag: macTag
};`,
      output: `[USIM] SUCI-0-310-260-2-1-{compressedEphPub}-0x4f8a...-0xa1b2...`,
    },
    {
      id: 'sidf_decryption',
      title: '11. Network SIDF: Decrypt SUCI (Decryption Point)',
      description: 'The Home Network SIDF reverses the process using the Home Network Private Key.',
      code: `// SoftHSMv3 WASM: Network SIDF — Full Deconcealment (Profile B)
// 1. Re-derive Z (ECDH P-256: HN private key + UE ephemeral public key)
const Z = hsm_ecdhDerive(hsmd, hSession, hnPrivHandle, ephPubBytes)

// 2. ANSI X9.63-KDF (SHA-256) per 3GPP TS 33.501 §C.3.3
const block1 = hsm_digest(M, hSession, concat(Z, 0x00000001, sharedInfo), CKM_SHA256)
const block2 = hsm_digest(M, hSession, concat(Z, 0x00000002, sharedInfo), CKM_SHA256)
const kEnc = block1.slice(0, 16)                          // 128-bit AES-128 key
const kMac = [...block1.slice(16), ...block2.slice(0, 16)] // 256-bit HMAC-SHA-256 key

// 3. Authenticate-then-decrypt: verify MAC BEFORE decryption (per 3GPP TS 33.501)
const macBytes = hsm_hmac(M, hSession, kMacHandle, ciphertext)
const recomputedTag = Array.from(macBytes.slice(0, 8)).map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase()
if (recomputedTag !== storedMacTag) throw new Error('MAC mismatch — SUCI rejected by SIDF')

// 4. Decrypt MSIN only after MAC passes (AES-128-CTR, zero IV per TS 33.501)
const iv = new Uint8Array(16) // all zeros
const msinBcd = hsm_aesDecrypt(hsmd, hSession, kEncHandle, ciphertext, iv, 'ctr')

// 5. BCD decode → MSIN digits → full SUPI
const msin = bcdDecode(msinBcd)  // e.g. '123456789'
const supi = mcc + mnc + msin    // e.g. '310260123456789'`,
      output: `[SIDF] Processing SUCI...
[SIDF] SUPI Recovered: 310260123456789`,
    },
  ],

  SUCI_STEPS_C: [
    {
      id: 'init_network_key',
      title: '1. Home Network Key Generation (Profile C)',
      description:
        'For Profile C (Post-Quantum), the home network provisions key material per 3GPP TR 33.841. In Hybrid mode, two keypairs are generated: an ML-KEM-768 keypair (FIPS 203, lattice-based, quantum-resistant) for the KEM component, and an X25519 keypair for the classical ECDH component. The combined shared secret Z = SHA256(Z_ecdh ‖ Z_kem) provides security against both classical and quantum adversaries. In Pure PQC mode, only the ML-KEM-768 keypair is generated. Both private keys are held in the HSM for SIDF deconcealment.',
      code: `// SoftHSMv3 WASM: Generate ML-KEM-768 + X25519 HN keypairs (Hybrid mode)
const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
  hsmd, sessionHandle, 768, false, '5G HN Key (ML-KEM)'
)
// Hybrid only: also generate X25519 HN ECC keypair
const { pubHandle: eccPub, privHandle: eccPriv } = hsm_generateECKeyPair(
  hsmd, sessionHandle, 'X25519', false, '5G HN ECC Key (X25519)'
)`,
      output: `[Home Network] Generating Profile C (PQC) Key Pair...
[Home Network] ML-KEM-768 Keys generated.
[Home Network] Public Key: 1184 bytes.`,
    },
    {
      id: 'provision_usim',
      title: '2. Provision USIM',
      description:
        'The large ML-KEM Public Key (1184 bytes) is provisioned to the USIM secure file system (EF_SUCI_Calc_Info). The file also stores the Routing Indicator (0–4 decimal digits, default 0000) — a network-assigned value that routes the SUCI to the correct UDM/SIDF instance for deconcealment in roaming scenarios.',
      code: `# Provisioning Logic
USIM.write('EF_SUCI_Calc_Info', {
  HN_PubKey: readFile('hn_pqc.pub'),
  ProtectionScheme: 'Profile C (ML-KEM-768)',
  KeyId: 3
});`,
      output: `[Provisioning] Writing large PQC key to USIM...
[Provisioning] Success. USIM ready for Post-Quantum privacy.`,
    },
    {
      id: 'retrieve_key',
      title: '3. Retrieve Home Network Public Key',
      description: 'The USIM reads the HN Public Key for Profile C (ML-KEM-768, FIPS 203).',
      code: `const suciInfo = USIM.readFile('EF_SUCI_Calc_Info');\nconst hnPubKey = suciInfo.HN_PubKey; // ML-KEM-768 Public Key (1184 bytes)`,
      output: `[USIM] Reading EF_SUCI_Calc_Info...\n[USIM] Scheme: Profile C (ML-KEM-768, FIPS 203)\n[USIM] HN Public Key: 0x... (1184 bytes)`,
    },
    {
      id: 'gen_ephemeral_key',
      title: '4. Generate Ephemeral Key',
      description:
        'In Hybrid Mode, the USIM generates an X25519 ephemeral key pair. In Pure PQC mode, this step is skipped (or prepares for Encapsulation).',
      code: `// In ML-KEM, Ephemeral keys are generated dynamically during Encapsulation.
// No explicit ephemeral generation is required prior to Encap.`,
      output: `[USIM] Generating Ephemeral Key...`,
    },
    {
      id: 'compute_shared_secret',
      title: '5. Compute Shared Secret (Hybrid / Encap)',
      description:
        'Hybrid: Compute ECDH shared secret (Z_ecdh) AND Encapsulate PQC shared secret (Z_kem). Derive final Z = SHA256(Z_ecdh || Z_kem). Pure: Encapsulate only.',
      code: `// SoftHSMv3 WASM: Profile C Hybrid — ML-KEM Encap + ECDH + Z Combination
// Step A: ML-KEM-768 Encapsulation → Z_kem + KEM ciphertext
// → C_EncapsulateKey(CKM_ML_KEM)
const { ciphertextBytes, secretHandle } = hsm_pqcEncap(M, hSession, hnPubHandle, 'ML-KEM-768')
const zKemBytes = hsm_extractKeyValue(M, hSession, secretHandle)

// Step B (hybrid only): X25519 ECDH(ephPriv, hnEccPub) → Z_ecdh
// PKCS#11 v3.2: CKM_ECDH1_DERIVE (0x1050) is used; SoftHSMv3 routes to
// Montgomery DH because the private key has CKA_KEY_TYPE=CKK_EC_MONTGOMERY.
// → C_DeriveKey(CKM_ECDH1_DERIVE) — X25519 path selected by key type
const hnEccPubBytes = hsm_extractECPoint(M, hSession, hnEccPubHandle)
const zEcdhHandle = hsm_ecdhDerive(M, hSession, ephPrivHandle, hnEccPubBytes)
const zEcdhBytes = hsm_extractKeyValue(M, hSession, zEcdhHandle)

// Step C: Z = SHA256(Z_ecdh || Z_kem) per 3GPP TR 33.841 §5.2.5.2
const Z = hsm_digest(M, hSession, concat(zEcdhBytes, zKemBytes), CKM_SHA256)`,
      output: `[USIM] Computing Hybrid Shared Secret...`,
    },
    {
      id: 'derive_keys',
      title: '6. Derive Keys (KDF w/ SHA3)',
      description:
        'The shared secret is passed through ANSI X9.63 KDF using SHA3-256 (higher security assurance for PQC). Two iterations produce K_enc (256-bit AES-256 from block1) and K_mac (256-bit HMAC-SHA3-256 from block2).',
      code: `# ANSI X9.63 KDF with SHA3-256 (2 iterations)
block1 = SHA3_256(Z || 0x00000001 || SharedInfo)
block2 = SHA3_256(Z || 0x00000002 || SharedInfo)

K = block1 + block2       # Concatenated KDF output
enc_key = K[0:32]         # 256-bit AES Key (full block1)
mac_key = K[32:64]        # 256-bit HMAC Key (full block2)`,
      output: `[USIM] Deriving Keys w/ SHA3...\n[USIM] K_enc: 256-bit AES Key\n[USIM] K_mac: 256-bit HMAC Key`,
    },
    {
      id: 'encrypt_msin',
      title: '7. Encrypt MSIN (Encryption Point)',
      description:
        'This is the Encryption Point (AES-256-CTR). AES-CTR is length-preserving — the ciphertext has the same byte length as the plaintext MSIN, keeping the SUCI compact over the air interface.',
      code: `// SoftHSMv3 WASM: C_Encrypt (AES-256-CTR)
// 3GPP TR 33.841 Profile C uses AES-256-CTR with zero IV
const ciphertext = hsm_aesEncrypt(
  hsmd, sessionHandle, hKenc, Buffer.from(msin), iv, 'ctr'
);`,
      output: `[USIM] Encrypting MSIN (AES-256)...\n[USIM] Ciphertext: 0x...`,
    },
    {
      id: 'compute_mac',
      title: '8. Compute MAC Tag (HMAC-SHA3)',
      description:
        'Compute HMAC-SHA3-256 over the ciphertext using K_mac, then truncate to 8 bytes (64 bits). Truncation is intentional: SUCI is an over-the-air identifier where space is constrained, and a 64-bit authentication code provides sufficient integrity protection for this use case.',
      code: `// SoftHSMv3 WASM: C_Sign (HMAC-SHA3-256)
const macTagFull = hsm_hmac(
  hsmd, sessionHandle, hKmac, ciphertext, 'SHA3-256'
);`,
      output: `[USIM] Computed PQC MAC Tag: 0x...`,
    },
    {
      id: 'visualize_suci',
      title: '9. Visual Inspection: SUPI vs SUCI (PQC)',
      description:
        'Compare the SUPI with the much larger PQC SUCI structure. Notice the ciphertext size (ML-KEM Encapsulation is 1088 bytes).',
      code: '# Visual Verification',
      output: '[Visualizing PQC Data Structures...]',
      explanationTable: [
        {
          label: 'SUPI',
          value: 'IMSI: 310260123456789 (MCC=310, MNC=260, MSIN=123456789)',
          description: 'Cleartext Identity. No dashes per 3GPP TS 23.003.',
        },
        {
          label: 'SUPI Hex',
          value: '333130323630313233343536373839',
          description: 'Raw Hexadecimal of IMSI digits.',
        },
        {
          label: 'ML-KEM Ciphertext',
          value: '0x... (1088 bytes)',
          description: 'Encapsulated Shared Key.',
        },
        {
          label: 'Encrypted MSIN',
          value: '0x...',
          description:
            'Encrypted MSIN (AES-256-CTR, zero IV). Length-preserving — same byte count as BCD-encoded MSIN.',
        },
        {
          label: 'SUCI',
          value: 'suci-0-310-260-3-1-0x...',
          description: 'Post-quantum secure identifier.',
        },
        {
          label: 'SUCI Hex',
          value: '737563692d302d3331302d3236302d33...',
          description: 'Raw Hex of PQC SUCI.',
        },
      ],
    },
    {
      id: 'assemble_suci',
      title: '10. Assemble SUCI (Profile C)',
      description: 'Combine parameters. Note significantly larger SUCI size.',
      code: `const suci = {\n  scheme: 3,\n  ciphertext: ciphertext,\n  encMSIN: encryptedMSIN,\n  macTag: macTag\n};`,
      output: `[USIM] SUCI-0-310-260-3-1-0x...(1KB+)-0x...`,
    },
    {
      id: 'sidf_decryption',
      title: '11. Network SIDF: Decrypt SUCI (Decryption Point)',
      description:
        'For Profile C, the SIDF re-derives the same combined shared secret and verifies integrity before decrypting. Authenticate-then-decrypt is mandatory per 3GPP TR 33.841: MAC MUST pass before decryption begins.',
      code: `// SoftHSMv3 WASM: Profile C SIDF — Hybrid Deconcealment (TR 33.841)

// 1. ML-KEM-768 Decapsulation → Z_kem
// → C_DecapsulateKey(CKM_ML_KEM)
const zKemHandle = hsm_pqcDecap(M, hSession, hnPrivHandle, kemCiphertext, 'ML-KEM-768')
const zKemBytes = hsm_extractKeyValue(M, hSession, zKemHandle)

// 2. Hybrid only: X25519 ECDH(hn_ecc_priv, eph_pub) → Z_ecdh, then combine
// PKCS#11 v3.2: CKM_ECDH1_DERIVE (0x1050) is used for both X25519 and P-256.
// SoftHSMv3 routes to Montgomery DH because hnEccPrivHandle has CKA_KEY_TYPE=CKK_EC_MONTGOMERY.
// → C_DeriveKey(CKM_ECDH1_DERIVE) — X25519 path selected by key type
const ephPubBytes = hsm_extractECPoint(M, hSession, ephPubHandle)
const zEcdhHandle = hsm_ecdhDerive(M, hSession, hnEccPrivHandle, ephPubBytes)
const zEcdhBytes = hsm_extractKeyValue(M, hSession, zEcdhHandle)
const Z = hsm_digest(M, hSession, concat(zEcdhBytes, zKemBytes), CKM_SHA256)

// 3. ANSI X9.63-KDF (SHA3-256) per 3GPP TR 33.841
const kEnc = hsm_digest(M, hSession, concat(Z, 0x00000001, sharedInfo), CKM_SHA3_256)
const kMac = hsm_digest(M, hSession, concat(Z, 0x00000002, sharedInfo), CKM_SHA3_256)

// 4. Authenticate-then-decrypt: verify MAC BEFORE decryption
const macBytes = hsm_hmac(M, hSession, kMacHandle, encMsin, CKM_SHA3_256_HMAC)
const recomputedTag = Array.from(macBytes.slice(0, 8)).map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase()
if (recomputedTag !== storedMacTag) throw new Error('MAC mismatch — SUCI rejected by SIDF')

// 5. Decrypt MSIN only after MAC passes (AES-256-CTR, zero IV)
const msinBcd = hsm_aesDecrypt(M, hSession, kEncHandle, encMsin, zeroIv, 'ctr')
const supi = mcc + mnc + bcdDecode(msinBcd)`,
      output: `[SIDF] Decapsulating ML-KEM Secret...
[SIDF] Keys Derived.
[SIDF] SUPI Recovered: 310260123456789`,
    },
  ],

  AUTH_STEPS: [
    {
      id: 'retrieve_creds',
      title: '1. Retrieve Credentials (UDM/HSM)',
      description:
        "The ARPF (Authentication credential Repository and Processing Function) retrieves the subscriber's encrypted K, Operator Key (OP), and Sequence Number (SQN) from the subscriber database and injects them into the HSM for authentication vector computation. The HSM holds K only for the duration of this computation — it is not stored permanently, as operators manage millions of subscribers. The SEAF (Security Anchor Function) in the serving AMF forwarded the SUPI after SUCI deconcealment. SQN prevents replay attacks — the USIM will reject authentication if SQN is not fresh.",
      code: `// ARPF retrieves credentials from subscriber DB → injects into HSM
const encRecord = subscriberDB.get(SUPI);
const K = HSM.decrypt(encRecord.eK);  // K injected for computation only
const OP = HSM.getOP();               // Operator Key
const SQN = encRecord.SQN;`,
      output: `[ARPF] Retrieving subscriber credentials from database...
[ARPF] Injecting K into HSM for computation...
[ARPF] K: [PROTECTED — transient in HSM]
[ARPF] OP: [PROTECTED]
[ARPF] Current SQN: 0x00...01`,
    },
    {
      id: 'gen_rand',
      title: '2. Generate Random Challenge',
      description:
        "The ARPF's HSM generates a cryptographically secure 128-bit random number (RAND) to challenge the USIM. RAND is sent in cleartext to the UE via the SEAF — its secrecy is not required because the authentication relies on K (the shared secret), not RAND confidentiality.",
      code: `// Generate 128-bit random challenge
const RAND = crypto.randomBytes(16);`,
      output: `[ARPF/HSM] Assessing TRNG...
[ARPF/HSM] Generated RAND: 0x23553CBE... (128 bits)`,
    },
    {
      id: 'compute_milenage',
      title: '3. Compute MILENAGE Functions',
      description:
        "Using K, OPc, and RAND, the HSM computes the MILENAGE function set (f1-f5) per 3GPP TS 35.206. MILENAGE uses AES-128 internally — a symmetric algorithm that is quantum-resistant (Grover's algorithm only halves the effective key length to 64 bits, still computationally secure). This means 5G-AKA authentication itself does not require PQC upgrades, unlike SUCI concealment which relies on asymmetric crypto. On the UE side, the USIM performs the identical MILENAGE computation with its copy of K to verify the network and produce RES.",
      code: `// Execute MILENAGE algorithm (both UDM and USIM compute this)
const { MAC, XRES, CK, IK, AK } = milenage(K, OPc, RAND, SQN, AMF);

// f1: MAC-A  — Network authentication (USIM verifies this)
// f2: XRES   — Expected response (network verifies USIM's RES)
// f3: CK     — Cipher Key (128-bit)
// f4: IK     — Integrity Key (128-bit)
// f5: AK     — Anonymity Key (conceals SQN in AUTN)`,
      output: `[HSM] Computing MILENAGE (f1-f5)...
[HSM] MAC-A: 0x4A9FFAC3...
[HSM] XRES: 0xA54211D5...
[HSM] CK: 0xB40BA9A3...
[HSM] IK: 0xF769BCD7...
[HSM] AK: 0xAA689C64...`,
    },
    {
      id: 'compute_autn',
      title: '4. Compute AUTN (Mutual Authentication)',
      description:
        "The Authentication Token (AUTN) proves the network's identity to the UE — this is the 'mutual' in mutual authentication. AUTN = (SQN XOR AK) || AMF || MAC-A. The UE receives RAND + AUTN, recomputes MILENAGE with its own K, and verifies: (1) MAC-A matches (proving the network knows K), and (2) SQN is in the acceptable range (preventing replays). If verification passes, the USIM sends back RES. The SEAF compares HXRES* (hash of XRES*) to verify the UE without ever seeing the raw XRES.",
      code: `// Network Side: Construct AUTN
const concealedSQN = XOR(SQN, AK);
const AUTN = concealedSQN + AMF + MAC;

// UE Side (mirror verification):
// 1. Compute MILENAGE(K, OPc, RAND, ...)
// 2. Recover SQN = concealedSQN XOR AK
// 3. Verify MAC-A matches → network is authentic
// 4. Verify SQN is fresh → not a replay
// 5. Send RES back to network`,
      output: `[HSM] Assembling AUTN...
[HSM] Concealed SQN: 0x55F23ED0...
[HSM] AUTN: 0x55F23ED08D0CB9B94A9FFAC354DFAFB3`,
    },
    {
      id: 'derive_kausf',
      title: '5. Derive 5G Keys (KAUSF)',
      description:
        'The 5G anchor key (KAUSF) is derived from CK and IK bound to the Serving Network Name (SNN). This binding ensures keys cannot be reused across networks (preventing roaming attacks). KAUSF feeds the full 5G key hierarchy: KAUSF → KSEAF (anchor at serving network) → KAMF (at AMF) → KNASint/KNASenc (NAS signaling protection) → KgNB (radio layer). The SEAF in the serving AMF receives KSEAF and never sees KAUSF itself, enforcing home-network control.',
      code: `// KDF for 5G Anchor Key (TS 33.501 Annex A.2)
// FC=0x6A binds to serving network name
const SNN = "5G:mnc260.mcc310.3gppnetwork.org";
const KAUSF = HMAC_SHA256(CK || IK, FC || SNN || len(SNN) || SQN_xor_AK || 0x0006);

// Downstream Key Hierarchy:
// KAUSF → KSEAF → KAMF → KNASint, KNASenc, KgNB`,
      output: `[UDM] Deriving 5G Anchor Key...
[UDM] KAUSF: 0x8a9b... derived successfully.
[UDM] Authentication Vector Ready: RAND, AUTN, XRES*, KAUSF`,
    },
  ],

  PROVISIONING_STEPS: [
    {
      id: 'gen_k',
      title: '1. Generate K (SIM Manufacturer)',
      description:
        'In a secure facility, the SIM manufacturer generates a unique subscriber key (K) for the new SIM card using a high-quality TRNG inside an HSM.',
      code: `// Inside Manufacturer HSM
const K = crypto.generateRandom(128); // 128-bit Key`,
      output: `[Factory HSM] Generating Subscriber Key...
[Factory HSM] K Generated: [PROTECTED]
[Factory HSM] ID: IMSI 310260123456789`,
    },
    {
      id: 'compute_opc_sim',
      title: '2. Compute OPc',
      description:
        "The manufacturer computes the OPc (derived operator key) using the Operator's OP key and the unique K. Only OPc is written to the SIM, never the global OP.",
      code: `// Compute OPc per SIM
const OPc = AES_Encrypt(K, OP) XOR OP;`,
      output: `[Factory HSM] Computing OPc...
[Factory HSM] OPc: 0xCD63CB71...
[Factory HSM] OPc is unique to this SIM (bound to K).`,
    },
    {
      id: 'personalize_sim',
      title: '3. Personalize USIM',
      description:
        "K, OPc, and other data are written into the USIM's secure tamper-resistant memory during the personalization phase.",
      code: `// Write to USIM Files
USIM.write('EF_K', K);
USIM.write('EF_OPc', OPc);
USIM.write('EF_IMSI', '310260123456789');`,
      output: `[Factory] Personalizing USIM...
[Factory] Keys written to secure element.
[Factory] Transport lock enabled.`,
    },
    {
      id: 'encrypt_transport',
      title: '4. Encrypt for Transport',
      description:
        'To send the keys to the Mobile Network Operator (MNO), K is encrypted with a pre-agreed Transport Key (TK). This ensures K is never exposed during transit.',
      code: `// Encrypt K for output file
const eK = AES_Encrypt(TransportKey, K);

// Generate Output Record
const record = {
  IMSI: '310260123456789',
  eK: eK,
  OPc: OPc
};`,
      output: `[Factory HSM] Encrypting export batch...
[Factory HSM] eK generated.
[Factory HSM] Output file 'out_batch_2025.enc' created.`,
    },
    {
      id: 'import_udm',
      title: '5. Import at Operator',
      description:
        "The MNO receives the encrypted key file and decrypts K inside the HSM using the Transport Key. K is then re-encrypted and stored in the subscriber database — not in the HSM itself. Operators manage millions of subscribers, so K is loaded into the ARPF's HSM only when authentication vectors need to be computed.",
      code: `// MNO Import Process
const record = file.readRecord();
const K = HSM.decrypt(TransportKey, record.eK);

// Re-encrypt K for database storage (K never persists in HSM)
subscriberDB.store(record.IMSI, HSM.reEncrypt(K));`,
      output: `[MNO] Importing key batch...
[MNO HSM] Decrypting eK... Success.
[MNO] K re-encrypted and stored in subscriber database.
[MNO] Subscriber provisioning complete.`,
    },
  ],
}
