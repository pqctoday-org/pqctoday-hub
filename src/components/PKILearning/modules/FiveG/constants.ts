export const FIVE_G_CONSTANTS = {
  SUCI_STEPS_A: [
    {
      id: 'init_network_key',
      title: '1. Home Network Key Generation (Profile A)',
      description:
        "The Home Network (UDM) must first establish a long-term asymmetric key pair. For Profile A, 5G mandates the use of Curve25519 (X25519), a state-of-the-art elliptic curve tailored for speed and security. The private key remains effectively locked within the UDM's HSM, while the public key fits into 32 bytes.",
      code: `# Generate Curve25519 Private Key
openssl genpkey -algorithm X25519 -out hn_priv.key

# Derive Public Key (32 bytes)
openssl pkey -in hn_priv.key -pubout -out hn_pub.key

# Inspect Key Parameters
openssl pkey -in hn_pub.key -pubout -text_pub`,
      output: `[Home Network] Generating Profile A Key Pair...
[Home Network] Private Key stored in HSM.
[Home Network] Public Key: 0x8520f009... (32 bytes) ready for provisioning.`,
    },
    {
      id: 'provision_usim',
      title: '2. Provision USIM',
      description:
        "The standardized Home Network Public Key (HN_PubKey) is written into the USIM's secure file system (EF_SUCI_Calc_Info) during SIM card personalization. This allows the USIM to encrypt the subscriber identity in a way that only the Home Network can decrypt.",
      code: `# Simulated Provisioning API
USIM.write('EF_SUCI_Calc_Info', {
  HN_PubKey: readFile('hn_pub.key'),
  ProtectionScheme: 'Profile A (X25519)',
  KeyId: 1
});`,
      output: `[Provisioning] Writing to USIM EF_SUCI_Calc_Info...
[Provisioning] Success. USIM now holds the network public key.`,
    },
    {
      id: 'retrieve_key',
      title: '3. Retrieve Home Network Public Key',
      description:
        'When the phone initiates a connection, the USIM reads the HN_PubKey. This key identifies the destination of the encrypted identity.',
      code: `// USIM Internal Operation
const suciInfo = USIM.readFile('EF_SUCI_Calc_Info');
const hnPubKey = suciInfo.HN_PubKey; // Curve25519 Public Key`,
      output: `[USIM] Reading EF_SUCI_Calc_Info...\n[USIM] Scheme: Profile A (Curve25519)\n[USIM] HN Public Key: 0x8520f009... (32 bytes)`,
    },
    {
      id: 'gen_ephemeral_key',
      title: '4. Generate Ephemeral Key Pair',
      description:
        'The USIM generates a fresh, temporary (ephemeral) X25519 key pair for this specific session. This ensures "Forward Secrecy" - even if the long-term key is compromised later, past sessions remain secure.',
      code: `# Generate Ephemeral Private Key
openssl genpkey -algorithm X25519 -out eph_priv.key

# Extract Ephemeral Public Key to send to Network
openssl pkey -in eph_priv.key -pubout -out eph_pub.key`,
      output: `[USIM] Generating Ephemeral Key Pair (X25519)...\n[USIM] Ephemeral PubKey: 0x1a2b3c4d... (32 bytes)`,
    },
    {
      id: 'compute_shared_secret',
      title: '5. Compute Shared Secret (ECDH)',
      description:
        "The USIM performs Elliptic Curve Diffie-Hellman (ECDH) using its ephemeral private key and the Home Network's public key. This results in a shared secret (Z) that is mathematically identical to what the Home Network will calculate.",
      code: `# Derive Shared Secret (Z)
openssl pkeyutl -derive \\
  -inkey eph_priv.key \\
  -peerkey hn_pub.key \\
  -out shared_secret.bin

# View Raw Secret (for verifying)
xxd -p shared_secret.bin`,
      output: `[USIM] Executing ECDH...\n[USIM] Shared Secret (Z): [PROTECTED]`,
    },
    {
      id: 'derive_keys',
      title: '6. Derive Keys (ANSI-X9.63-KDF)',
      description:
        'The shared secret (Z) is not used directly. Instead, it is passed through a Key Derivation Function (KDF) along with the ephemeral public key (SharedInfo) to generate two distinct keys: K_enc for encryption (AES-128, 128 bits) and K_mac for integrity (HMAC-SHA-256, 256 bits). The KDF runs two iterations of SHA-256.',
      code: `// ANSI X9.63 KDF (2 iterations, SharedInfo = EphPubKey)
const block1 = SHA256(Z || 0x00000001 || EphPubKey);
const block2 = SHA256(Z || 0x00000002 || EphPubKey);

const K_enc = block1.slice(0, 16);  // 128-bit AES Key
const K_mac = block2;               // 256-bit HMAC Key`,
      output: `[USIM] Deriving Keys...\n[USIM] K_enc: 128-bit AES Key\n[USIM] K_mac: 256-bit HMAC Key`,
    },
    {
      id: 'encrypt_msin',
      title: '7. Encrypt MSIN (Encryption Point)',
      description:
        'This is the Encryption Point. The cleartext MSIN is now encrypted using AES-128-CTR. From this point forward, the identity is concealed.',
      code: `openssl enc -aes-128-ctr \\
  -K <K_enc_hex> \\
  -iv 00000000000000000000000000000000 \\
  -in msin.txt -out encrypted_msin.bin`,
      output: `[USIM] Encrypting MSIN...\n[USIM] Ciphertext: 0x4f8a2b1c9d... (5 bytes)`,
    },
    {
      id: 'compute_mac',
      title: '8. Compute MAC Tag',
      description:
        'An HMAC-SHA-256 tag is computed over the ciphertext and header data to prevent tampering. The first 64 bits (8 bytes) are used as the tag.',
      code: `# Compute HMAC
openssl dgst -sha256 -mac HMAC -macopt hexkey:<K_mac_hex> \\
  -out mac_full.bin encrypted_msin.bin

# Truncate to 8 bytes
head -c 8 mac_full.bin > mac_tag.bin`,
      output: `[USIM] Computed MAC Tag: 0xa1b2c3d4...`,
    },
    {
      id: 'visualize_suci',
      title: '9. Visual Inspection: SUPI vs SUCI',
      description:
        'Compare the sensitive cleartext identity (SUPI) with the protected SUCI structure. The SUCI includes the ephemeral public key needed by the network to derive the decryption key.',
      code: '# Visual Verification',
      output: '[Visualizing Data Structures...]',
      explanationTable: [
        {
          label: 'SUPI (Input)',
          value: 'IMSI: 310260123456789 (MCC=310, MNC=260, MSIN=123456789)',
          description: 'Subscriber Permanent Identifier (Cleartext). No dashes per 3GPP TS 23.003.',
        },
        {
          label: 'SUPI Hex',
          value: '333130323630313233343536373839',
          description: 'Raw Hexadecimal of IMSI digits (310260123456789).',
        },
        {
          label: 'Ciphertext',
          value: '0x4F 0x8A 0x2B 0x1C 0x9D',
          description: 'Encrypted MSIN (AES-128-CTR). Unintelligible without Derived Key.',
        },
        {
          label: 'MAC Tag',
          value: '0xA1 0xB2 0xC3 0xD4 ...',
          description: 'HMAC Integrity Tag. Validates authenticity.',
        },
        {
          label: 'SUCI (Output)',
          value: 'suci-0-310-260-1-1-0x1a2b...-0x4f8a...',
          description: 'Concealed Identifier. Safe for transmission.',
        },
        {
          label: 'SUCI Hex',
          value: '737563692d302d3331302d3236302d312d31...',
          description: 'Partial Raw Hex of the full SUCI string.',
        },
      ],
    },
    {
      id: 'assemble_suci',
      title: '10. Assemble SUCI',
      description:
        'The final SUCI is concatenated in the standard format: <MCC>.<MNC>.<RoutingIndicator>.<Scheme>.<HomeNetPubKeyID>.<EphPubKey>.<Ciphertext>.<MAC>.',
      code: `// Final SUCI String Construction
const suci = [
  type=0, mcc=310, mnc=260,
  routing=1, scheme=1, keyId=1,
  ephKey=0x1a2b...,
  cipher=0x4f8a...,
  mac=0xa1b2...
].join('-');`,
      output: `[USIM] SUCI-0-310-260-1-1-0x1a2b...-0x4f8a...-0xa1b2...`,
    },
    {
      id: 'sidf_decryption',
      title: '11. Network SIDF: Decrypt SUCI (Decryption Point)',
      description:
        'The SUCI reaches the Home Network. The SIDF (Subscription Identifier De-concealing Function) uses the Network Private Key (HN_Priv) to derive the same shared secret, generate the same keys, and decrypt the SUCI back to the original SUPI.',
      code: `# Network Side Decryption
# 1. Derive Shared Secret using HN_Priv
openssl pkeyutl -derive -inkey hn_priv.key -peerkey eph_pub.key ...

# 2. Decrypt MSIN
openssl enc -d -aes-128-ctr -in ciphertext.bin ...`,
      output: `[SIDF] Receiving SUCI...
[SIDF] Deriving Keys... Matches USIM.
[SIDF] Decrypting...
[SIDF] SUPI Recovered: 310260123456789`,
    },
  ],

  SUCI_STEPS_B: [
    {
      id: 'init_network_key',
      title: '1. Home Network Key Generation (Profile B)',
      description:
        'For Profile B, the Home Network generates a long-term key pair using the NIST P-256 (secp256r1) elliptic curve. This profile is common in legacy-compliant 5G deployments.',
      code: `# Generate P-256 Private Key
openssl genpkey -algorithm EC \\
  -pkeyopt ec_paramgen_curve:P-256 \\
  -out hn_priv.key

# Derive Public Key (65 bytes uncompressed)
openssl pkey -in hn_priv.key -pubout -out hn_pub.key

# Inspect Curve Parameters
openssl pkey -in hn_pub.key -pubout -text_pub`,
      output: `[Home Network] Generating Profile B Key Pair...
[Home Network] NIST P-256 Key generated.
[Home Network] Public Key: 0x04...... (65 bytes) ready.`,
    },
    {
      id: 'provision_usim',
      title: '2. Provision USIM',
      description:
        'The P-256 Public Key is provisioned to the USIM secure element (EF_SUCI_Calc_Info), along with the Profile B identifier.',
      code: `# Simulated Provisioning API
USIM.write('EF_SUCI_Calc_Info', {
  HN_PubKey: readFile('hn_pub.key'),
  ProtectionScheme: 'Profile B (P-256)',
  KeyId: 2
});`,
      output: `[Provisioning] Writing to USIM EF_SUCI_Calc_Info...
[Provisioning] Success. USIM configured for Profile B.`,
    },
    {
      id: 'retrieve_key',
      title: '3. Retrieve Home Network Public Key',
      description:
        'The USIM reads the Home Network Public Key (HN_PubKey) for Profile B (P-256) from EF_SUCI_Calc_Info.',
      code: `const suciInfo = USIM.readFile('EF_SUCI_Calc_Info');\nconst hnPubKey = suciInfo.HN_PubKey; // P-256 Public Key`,
      output: `[USIM] Reading EF_SUCI_Calc_Info...\n[USIM] Scheme: Profile B (secp256r1)\n[USIM] HN Public Key: 0x04...... (65 bytes)`,
    },
    {
      id: 'gen_ephemeral_key',
      title: '4. Generate Ephemeral Key Pair',
      description:
        'Generate a fresh ephemeral key pair using NIST P-256. This key pair is unique to this connection attempt.',
      code: `# Generate Ephemeral P-256 Private Key
openssl genpkey -algorithm EC \\
  -pkeyopt ec_paramgen_curve:P-256 \\
  -out eph_priv.key

# Extract Public Key
openssl pkey -in eph_priv.key -pubout -out eph_pub.key`,
      output: `[USIM] Generating Ephemeral Key Pair (P-256)...\n[USIM] Ephemeral PubKey: 0x04...... (65 bytes)`,
    },
    {
      id: 'compute_shared_secret',
      title: '5. Compute Shared Secret (ECDH)',
      description:
        "Perform P-256 Diffie-Hellman Key Agreement. The USIM combines its ephemeral private key with the network's public key.",
      code: `# Derive Shared Secret (Z)
openssl pkeyutl -derive \\
  -inkey eph_priv.key \\
  -peerkey hn_pub.key \\
  -out shared_secret.bin`,
      output: `[USIM] Executing ECDH...\n[USIM] Shared Secret (Z): [PROTECTED]`,
    },
    {
      id: 'derive_keys',
      title: '6. Derive Keys (ANSI-X9.63-KDF)',
      description:
        'The shared secret (Z) is passed through ANSI X9.63 KDF with the ephemeral public key as SharedInfo. Two SHA-256 iterations produce K_enc (128-bit AES) and K_mac (256-bit HMAC).',
      code: `// ANSI X9.63 KDF (2 iterations, SharedInfo = EphPubKey)
const block1 = SHA256(Z || 0x00000001 || EphPubKey);
const block2 = SHA256(Z || 0x00000002 || EphPubKey);

const K_enc = block1.slice(0, 16);  // 128-bit AES Key
const K_mac = block2;               // 256-bit HMAC Key`,
      output: `[USIM] Deriving Keys...\n[USIM] K_enc: 128-bit AES Key\n[USIM] K_mac: 256-bit HMAC Key`,
    },
    {
      id: 'encrypt_msin',
      title: '7. Encrypt MSIN (Encryption Point)',
      description: 'This is the Encryption Point where the MSIN becomes ciphertext.',
      code: `openssl enc -aes-128-ctr \\
  -K <K_enc_hex> \\
  -iv 00000000000000000000000000000000 \\
  -in msin.txt -out encrypted_msin.bin`,
      output: `[USIM] Encrypting MSIN...\n[USIM] Ciphertext: 0x4f8a2b1c9d... (5 bytes)`,
    },
    {
      id: 'compute_mac',
      title: '8. Compute MAC Tag',
      description: 'Compute and truncate HMAC-SHA-256 tag.',
      code: `openssl dgst -sha256 -mac HMAC -macopt hexkey:<K_mac_hex> \\
  -out mac_full.bin encrypted_msin.bin`,
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
          description: 'Encrypted MSIN (AES-128-CTR).',
        },
        {
          label: 'MAC Tag',
          value: '0xA1 0xB2 ...',
          description: 'HMAC-SHA-256 Integrity Tag.',
        },
        {
          label: 'SUCI (Output)',
          value: 'suci-0-310-260-2-1-0x04...-0x4f...-0xa1...',
          description: 'Concealed Identifier (Profile B).',
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
      title: '10. Assemble SUCI (Profile B)',
      description: 'Combine parameters. Note the different scheme ID (2) and Public Key format.',
      code: `const suci = {\n  scheme: 2,\n  eccPubKey: ephPubKey,\n  ciphertext: encryptedMSIN,\n  macTag: macTag\n};`,
      output: `[USIM] SUCI-0-310-260-2-1-0x04...-0x4f8a...-0xa1b2...`,
    },
    {
      id: 'sidf_decryption',
      title: '11. Network SIDF: Decrypt SUCI (Decryption Point)',
      description: 'The Home Network SIDF reverses the process using the Home Network Private Key.',
      code: `# Network Side Decryption
# 1. Derive Shared Secret (Z)
openssl pkeyutl -derive -inkey hn_priv.key -peerkey eph_pub.key ...

# 2. Decrypt
openssl enc -d -aes-128-ctr ...`,
      output: `[SIDF] Processing SUCI (Profile B)...
[SIDF] SUPI Recovered: 310260123456789`,
    },
  ],

  SUCI_STEPS_C: [
    {
      id: 'init_network_key',
      title: '1. Home Network Key Generation (Profile C)',
      description:
        'For Profile C (Post-Quantum), the Home Network generates a key pair using ML-KEM (Kyber), a lattice-based algorithm resistant to quantum attacks.',
      code: `# Generate ML-KEM Private Key
openssl genpkey -algorithm ML-KEM-768 -out hn_pqc.key

# Derive Public Key (1184 bytes)
openssl pkey -in hn_pqc.key -pubout -out hn_pqc.pub`,
      output: `[Home Network] Generating Profile C (PQC) Key Pair...
[Home Network] ML-KEM-768 Keys generated.
[Home Network] Public Key: 1184 bytes.`,
    },
    {
      id: 'provision_usim',
      title: '2. Provision USIM',
      description:
        'The large ML-KEM Public Key (1184 bytes) is provisioned to the USIM secure file system.',
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
      description: 'The USIM reads the HN Public Key for Profile C (ML-KEM / Kyber PQC).',
      code: `const suciInfo = USIM.readFile('EF_SUCI_Calc_Info');\nconst hnPubKey = suciInfo.HN_PubKey; // ML-KEM Public Key`,
      output: `[USIM] Reading EF_SUCI_Calc_Info...\n[USIM] Scheme: Profile C (ML-KEM/Kyber)\n[USIM] HN Public Key: 0x... (1184 bytes)`,
    },
    {
      id: 'gen_ephemeral_key',
      title: '4. Generate Ephemeral Key (Hybrid)',
      description:
        'In Hybrid Mode, the USIM generates an X25519 ephemeral key pair. In Pure PQC mode, this step is skipped (or prepares for Encapsulation).',
      code: `# Hybrid: Generate X25519 Ephemeral Key
openssl genpkey -algorithm X25519 -out eph_priv.key

# Pure PQC:
# No classic ephemeral key needed.`,
      output: `[USIM] Generating Ephemeral Key...`,
    },
    {
      id: 'compute_shared_secret',
      title: '5. Compute Shared Secret (Hybrid / Encap)',
      description:
        'Hybrid: Compute ECDH shared secret (Z_ecdh) AND Encapsulate PQC shared secret (Z_kem). Derive final Z = SHA256(Z_ecdh || Z_kem). Pure: Encapsulate only.',
      code: `# Hybrid:
openssl pkeyutl -derive ... # Z_ecdh
openssl pkeyutl -encap ...  # Z_kem (Ciphertext)
SHA256(Z_ecdh || Z_kem)

# Pure:
openssl pkeyutl -encap ...`,
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

enc_key = block1          # 256-bit AES Key (full block)
mac_key = block2          # 256-bit HMAC Key`,
      output: `[USIM] Deriving Keys w/ SHA3...\n[USIM] K_enc: 256-bit AES Key\n[USIM] K_mac: 256-bit HMAC Key`,
    },
    {
      id: 'encrypt_msin',
      title: '7. Encrypt MSIN (Encryption Point)',
      description: 'This is the Encryption Point (AES-256-CTR).',
      code: `openssl enc -aes-256-ctr \\
  -K <K_enc_hex> -iv 0 \\
  -in msin.txt -out encrypted_msin.bin`,
      output: `[USIM] Encrypting MSIN (AES-256)...\n[USIM] Ciphertext: 0x...`,
    },
    {
      id: 'compute_mac',
      title: '8. Compute MAC Tag (HMAC-SHA3)',
      description: 'Compute HMAC-SHA3-256 tag.',
      code: `openssl dgst -sha3-256 -mac HMAC \\
  -macopt hexkey:<K_mac_hex> \\
  -out mac_tag.bin encrypted_msin.bin`,
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
          description: 'AES-256-CTR Encrypted.',
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
        'For Post-Quantum Profile C, the SIDF Decapsulates the shared secret using the ML-KEM Private Key and decrypts the MSIN.',
      code: `# Network Side Decaptulation (ML-KEM)
openssl pkeyutl -decap \\
  -inkey hn_pqc.key \\
  -in ciphertext.bin \\
  -secret shared_secret.bin

# Decrypt
openssl enc -d -aes-256-ctr ...`,
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
        'The UDM (Unified Data Management) retrieves the subscriber Key (K), Operator Key (OP), and Sequence Number (SQN) from the ARPF (Authentication credential Repository and Processing Function) inside the HSM. The SEAF (Security Anchor Function) in the serving AMF forwarded the SUPI after SUCI deconcealment. SQN prevents replay attacks — the USIM will reject authentication if SQN is not fresh.',
      code: `// Inside UDM/HSM (ARPF)
const subProfile = HSM.getProfile(SUPI);
const K = subProfile.Ki;  // Never exposes K outside HSM
const OP = HSM.getOP();   // Operator Key
const SQN = subProfile.SQN;`,
      output: `[HSM] Retrieving subscriber credentials...
[HSM] Ki: [PROTECTED]
[HSM] OP: [PROTECTED]
[HSM] Current SQN: 0x00...01`,
    },
    {
      id: 'gen_rand',
      title: '2. Generate Random Challenge',
      description:
        'The HSM generates a cryptographically secure 128-bit random number (RAND) to challenge the USIM. RAND is sent in cleartext to the UE via the SEAF — its secrecy is not required because the authentication relies on K (the shared secret), not RAND confidentiality.',
      code: `// Generate 128-bit random challenge
const RAND = crypto.randomBytes(16);`,
      output: `[HSM] Assessing TRNG...
[HSM] Generated RAND: 0x23553CBE... (128 bits)`,
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
      id: 'gen_ki',
      title: '1. Generate Ki (SIM Manufacturer)',
      description:
        'In a secure facility, the SIM manufacturer generates a unique subscriber key (Ki) for the new SIM card using a high-quality TRNG inside an HSM.',
      code: `// Inside Manufacturer HSM
const Ki = crypto.generateRandom(128); // 128-bit Key`,
      output: `[Factory HSM] Generating Subscriber Key...
[Factory HSM] Ki Generated: [PROTECTED]
[Factory HSM] ID: IMSI 310260123456789`,
    },
    {
      id: 'compute_opc_sim',
      title: '2. Compute OPc',
      description:
        "The manufacturer computes the OPc (derived operator key) using the Operator's OP key and the unique Ki. Only OPc is written to the SIM, never the global OP.",
      code: `// Compute OPc per SIM
const OPc = AES_Encrypt(Ki, OP) XOR OP;`,
      output: `[Factory HSM] Computing OPc...
[Factory HSM] OPc: 0xCD63CB71...
[Factory HSM] OPc is unique to this SIM (bound to Ki).`,
    },
    {
      id: 'personalize_sim',
      title: '3. Personalize USIM',
      description:
        "The Ki, OPc, and other data are written into the USIM's secure tamper-resistant memory during the personalization phase.",
      code: `// Write to USIM Files
USIM.write('EF_Ki', Ki);
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
        'To send the keys to the Mobile Network Operator (MNO), the Ki is encrypted with a pre-agreed Transport Key (TK). This ensures Ki is never exposed during transit.',
      code: `// Encrypt Ki for output file
const eKi = AES_Encrypt(TransportKey, Ki);

// Generate Output Record
const record = {
  IMSI: '310260123456789',
  eKi: eKi,
  OPc: OPc
};`,
      output: `[Factory HSM] Encrypting export batch...
[Factory HSM] eKi generated.
[Factory HSM] Output file 'out_batch_2025.enc' created.`,
    },
    {
      id: 'import_udm',
      title: '5. Import at UDM/HSM',
      description:
        'The MNO receives the file and decrypts the Ki inside their own HSM using the Transport Key, then stores it securely for future authentication.',
      code: `// MNO Import Process
const record = file.readRecord();
const Ki = HSM.decrypt(TransportKey, record.eKi);

HSM.store(record.IMSI, Ki);`,
      output: `[MNO HSM] Importing key batch...
[MNO HSM] Decrypting eKi... Success.
[MNO HSM] Ki stored in secure repository.
[MNO HSM] Subscriber provisioning complete.`,
    },
  ],
}
