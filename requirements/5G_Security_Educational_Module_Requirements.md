# 5G Security Educational Module

## SUCI Deconcealment & Subscriber Authentication with HSM Integration

**Document Version:** 1.0  
**Target Platform:** PQC Today Learn Modules  
**Date:** December 2025  
**Classification:** Educational / Training Material

---

## Executive Summary

This document specifies the educational content structure for a comprehensive 5G security learning module covering three critical security functions:

1. **SUCI Deconcealment** - Privacy protection of subscriber identity using ECIES (Profile A, B) and post-quantum Profile C (ML-KEM/Kyber)
2. **Subscriber Authentication** - 5G-AKA protocol with MILENAGE algorithm implementation
3. **Key Provisioning** - Secure Ki/OP key lifecycle from SIM manufacturer to UDM/HSM

The module is designed for security professionals, telecom engineers, and cryptography practitioners requiring deep understanding of 5G security mechanisms.

---

## Part 1: Applicable Standards & References

### 3GPP Technical Specifications

| Standard      | Title                                                        | Relevance                                           |
| ------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| **TS 33.501** | Security architecture and procedures for 5G System           | Primary specification for 5G security, SUCI, 5G-AKA |
| **TS 33.102** | 3G Security; Security architecture                           | Foundation for authentication functions             |
| **TS 35.205** | MILENAGE Algorithm Set - Document 1: General                 | Algorithm framework overview                        |
| **TS 35.206** | MILENAGE Algorithm Set - Document 2: Algorithm Specification | Detailed f1-f5 function specifications              |
| **TS 35.207** | MILENAGE Algorithm Set - Document 3: Implementors' Test Data | Test vectors for validation                         |
| **TS 35.231** | TUAK Algorithm Set - Document 1: Algorithm Specification     | Alternative to MILENAGE (256-bit capable)           |
| **TS 23.501** | System architecture for the 5G System                        | SUPI/SUCI structure definitions                     |
| **TS 23.003** | Numbering, addressing and identification                     | Identifier formats                                  |
| **TS 31.102** | USIM Application Characteristics                             | SIM-side operations                                 |

### NIST & IETF Standards

| Standard       | Title                                          | Relevance                   |
| -------------- | ---------------------------------------------- | --------------------------- |
| **FIPS 197**   | AES (Advanced Encryption Standard)             | Core cipher for MILENAGE    |
| **FIPS 203**   | ML-KEM (Module-Lattice-Based KEM)              | Post-quantum Profile C      |
| **SP 800-56A** | Recommendation for Pair-Wise Key Establishment | ECDH key agreement          |
| **SP 800-38A** | Block Cipher Modes - CTR Mode                  | AES-CTR for SUCI encryption |
| **RFC 7748**   | Elliptic Curves for Security (X25519)          | Profile A curve             |
| **SEC 2**      | Recommended Elliptic Curve Domain Parameters   | secp256r1 for Profile B     |

### GSMA Specifications

| Standard   | Title                            | Relevance                     |
| ---------- | -------------------------------- | ----------------------------- |
| **FS.27**  | SIM Security Guidelines          | Key management best practices |
| **SGP.02** | Remote Provisioning Architecture | eSIM key provisioning         |

---

## Part 2: Architecture Overview

### 2.1 Network Elements Involved

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        5G SECURITY ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐         ┌──────────┐         ┌──────────────────────┐   │
│   │   UE     │         │   AMF    │         │        UDM           │   │
│   │          │ ──N1──► │          │ ──N12─► │   ┌──────────────┐   │   │
│   │ ┌──────┐ │         │          │         │   │    ARPF      │   │   │
│   │ │ USIM │ │         │          │         │   │  (Auth Repo) │   │   │
│   │ │      │ │         │          │         │   └──────┬───────┘   │   │
│   │ │ • Ki │ │         └──────────┘         │          │           │   │
│   │ │ • OP │ │               │              │   ┌──────┴───────┐   │   │
│   │ │ • HN │ │               │              │   │    SIDF      │   │   │
│   │ │  Pub │ │         ┌─────┴─────┐        │   │ (De-conceal) │   │   │
│   │ └──────┘ │         │   AUSF    │        │   └──────┬───────┘   │   │
│   └──────────┘         │           │        │          │           │   │
│                        └───────────┘        │   ┌──────┴───────┐   │   │
│                                             │   │     HSM      │   │   │
│                                             │   │  • HN Priv   │   │   │
│                                             │   │  • OP        │   │   │
│                                             │   │  • Ki import │   │   │
│                                             │   └──────────────┘   │   │
│                                             └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Elements Description

| Element  | Function                                       | Keys Stored                       | Security Level            |
| -------- | ---------------------------------------------- | --------------------------------- | ------------------------- |
| **USIM** | Subscriber identity module in UE               | Ki, OPc, HN Public Key, SUPI      | Tamper-resistant hardware |
| **AMF**  | Access and Mobility Management                 | Session keys (temporary)          | Network function          |
| **AUSF** | Authentication Server Function                 | Anchor key (KAUSF)                | Network function          |
| **UDM**  | Unified Data Management                        | Subscriber profiles               | Network function          |
| **ARPF** | Authentication Repository                      | OP (operator key)                 | Protected by HSM          |
| **SIDF** | Subscription Identifier De-concealing Function | HN Private Key                    | Protected by HSM          |
| **HSM**  | Hardware Security Module                       | HN Private Key, OP, Ki (imported) | FIPS 140-2/3 Level 3+     |

---

## Part 3: SUCI Deconcealment Flow

### 3.1 SUCI Structure

The Subscription Concealed Identifier (SUCI) protects subscriber privacy by encrypting the MSIN portion of the SUPI.

```
SUCI Structure (per TS 23.003):
┌─────────────────────────────────────────────────────────────────────────┐
│ SUPI  │ Protection │ HN Public │ Routing    │ Protection              │
│ Type  │ Scheme ID  │ Key ID    │ Indicator  │ Scheme Output           │
│ (1)   │ (4 bits)   │ (8 bits)  │ (MCC+MNC)  │ (Variable length)       │
├───────┼────────────┼───────────┼────────────┼─────────────────────────┤
│  0    │ 0=Null     │ Key index │  MCC|MNC   │ Ephemeral Pub Key ||    │
│ (IMSI)│ 1=Profile A│ in UDM    │            │ Encrypted MSIN ||       │
│       │ 2=Profile B│           │            │ MAC Tag                 │
│       │ 3+=Custom  │           │            │                         │
└───────┴────────────┴───────────┴────────────┴─────────────────────────┘
```

### 3.2 Protection Scheme Profiles

#### 3.2.1 Profile A - Curve25519/X25519

**Reference:** 3GPP TS 33.501, Annex C.3.4.1

| Parameter           | Value                               | Standard Reference |
| ------------------- | ----------------------------------- | ------------------ |
| **Elliptic Curve**  | Curve25519                          | RFC 7748           |
| **Key Agreement**   | X25519 (ECDH)                       | RFC 7748           |
| **KDF**             | ANSI-X9.63-KDF with SHA-256         | SEC 1              |
| **Encryption**      | AES-128-CTR                         | NIST SP 800-38A    |
| **MAC**             | HMAC-SHA-256 (truncated to 64 bits) | RFC 2104           |
| **Public Key Size** | 256 bits (32 bytes)                 | -                  |
| **MAC Tag Size**    | 64 bits (8 bytes)                   | -                  |

#### 3.2.2 Profile B - secp256r1/P-256

**Reference:** 3GPP TS 33.501, Annex C.3.4.2

| Parameter           | Value                               | Standard Reference |
| ------------------- | ----------------------------------- | ------------------ |
| **Elliptic Curve**  | secp256r1 (P-256)                   | SEC 2, FIPS 186-4  |
| **Key Agreement**   | ECDH                                | SP 800-56A         |
| **KDF**             | ANSI-X9.63-KDF with SHA-256         | SEC 1              |
| **Encryption**      | AES-128-CTR                         | NIST SP 800-38A    |
| **MAC**             | HMAC-SHA-256 (truncated to 64 bits) | RFC 2104           |
| **Public Key Size** | 512 bits (64 bytes, uncompressed)   | -                  |
| **MAC Tag Size**    | 64 bits (8 bytes)                   | -                  |

#### 3.2.3 Profile C - Post-Quantum (ML-KEM/Kyber)

**Reference:** Proposed for 3GPP Release 19/20, based on NIST FIPS 203

| Parameter           | Value                                 | Standard Reference  |
| ------------------- | ------------------------------------- | ------------------- |
| **KEM Algorithm**   | ML-KEM-768 (Kyber-768)                | FIPS 203            |
| **Hybrid Scheme**   | X25519 + ML-KEM-768                   | Custom / Release 19 |
| **KDF**             | SHA3-256 or SHAKE256                  | FIPS 202            |
| **Encryption**      | AES-256-CTR                           | NIST SP 800-38A     |
| **MAC**             | HMAC-SHA3-256                         | FIPS 202            |
| **Public Key Size** | 1,184 bytes (Pure)                    | FIPS 203            |
| **Ciphertext Size** | 1,088 bytes (Pure)                    | FIPS 203            |
| **Shared Secret**   | 256 bits (SHA-256(Z_ecdh \|\| Z_kem)) | -                   |

---

### 3.3 SUCI Concealment Flow (UE/USIM Side)

#### Step 1: Retrieve Home Network Public Key

**Location:** USIM  
**Trigger:** Initial registration or SUCI refresh required

| Data Element         | Source                   | Description                                     |
| -------------------- | ------------------------ | ----------------------------------------------- |
| HN_PubKey            | EF_SUCI_Calc_Info (USIM) | Home Network public key for selected profile    |
| Protection_Scheme_ID | EF_SUCI_Calc_Info        | Profile A (1), Profile B (2), or Profile C (3+) |
| HN_PubKey_ID         | EF_SUCI_Calc_Info        | Key identifier for key rotation support         |

**Crypto Operation:** None (key retrieval only)

---

#### Step 2: Generate Ephemeral Key Pair

**Location:** USIM or ME (Mobile Equipment)  
**Reference:** TS 33.501 Section C.3.2

##### Profile A (Curve25519):

```
Crypto Operation: X25519 Key Generation
─────────────────────────────────────────
Input:  Random seed (256 bits from TRNG)
Output: eph_PrivKey (256 bits) - Ephemeral private key
        eph_PubKey (256 bits)  - Ephemeral public key

Algorithm:
1. Generate 32 random bytes
2. Apply X25519 scalar clamping
3. Compute public key: eph_PubKey = X25519(eph_PrivKey, G)
   where G is the base point of Curve25519
```

##### Profile B (secp256r1):

```
Crypto Operation: ECDSA/ECDH Key Generation
─────────────────────────────────────────────
Input:  Random seed (256 bits from TRNG)
Output: eph_PrivKey (256 bits) - Ephemeral private key
        eph_PubKey (512 bits)  - Ephemeral public key (uncompressed)

Algorithm:
1. Generate random integer k in range [1, n-1] where n is curve order
2. Compute public key point: Q = k × G
3. Encode as: 0x04 || x-coordinate || y-coordinate
```

##### Profile C (ML-KEM):

```
Crypto Operation: ML-KEM Key Encapsulation
─────────────────────────────────────────────
Input:  HN_PubKey (1,184 bytes)
        Random seed (256 bits from TRNG)
Output: ciphertext (1,088 bytes)
        shared_secret (256 bits)

Algorithm: ML-KEM.Encaps(pk) → (ct, ss)
```

---

#### Step 3: Compute Shared Secret (ECDH)

**Location:** USIM or ME  
**Reference:** TS 33.501 Section C.3.2, SEC 1

##### Profile A:

```
Crypto Operation: X25519 Key Agreement
───────────────────────────────────────
Input:  eph_PrivKey (256 bits)
        HN_PubKey (256 bits)
Output: shared_secret (256 bits)

Algorithm:
shared_secret = X25519(eph_PrivKey, HN_PubKey)
```

##### Profile B:

```
Crypto Operation: ECDH Key Agreement
────────────────────────────────────
Input:  eph_PrivKey (256 bits)
        HN_PubKey (512 bits, uncompressed point)
Output: shared_secret (256 bits) - x-coordinate of shared point

Algorithm:
1. Parse HN_PubKey as point P
2. Compute shared point: S = eph_PrivKey × P
3. shared_secret = x-coordinate of S
```

##### Profile C:

```
Crypto Operation: (Shared secret already derived in Step 2)
─────────────────────────────────────────────────────────────
shared_secret already obtained from ML-KEM.Encaps()
```

---

#### Step 4: Derive Encryption and MAC Keys (KDF)

**Location:** USIM or ME  
**Reference:** TS 33.501 Section C.3.2, ANSI X9.63

```
Crypto Operation: ANSI-X9.63-KDF with SHA-256
─────────────────────────────────────────────
Input:  shared_secret (256 bits)
        eph_PubKey (as SharedInfo for key separation)
Output: enc_key (128 bits) - AES encryption key
        mac_key (256 bits) - HMAC key

Algorithm:
1. counter = 0x00000001
2. K = SHA-256(shared_secret || counter || eph_PubKey)
3. enc_key = K[0:127]   (first 128 bits)
4. mac_key = K[128:383] (next 256 bits)

For Profile C (PQC):
─────────────────────
1. Use SHA3-256 or SHAKE256 as KDF
2. enc_key = 256 bits (AES-256)
3. mac_key = 256 bits
```

---

#### Step 5: Encrypt MSIN

**Location:** USIM or ME  
**Reference:** TS 33.501 Section C.3.2, NIST SP 800-38A

```
Crypto Operation: AES-128-CTR Encryption (Profile A/B)
──────────────────────────────────────────────────────
Input:  enc_key (128 bits)
        MSIN (40-50 bits, BCD encoded)
        IV = 0 (per 3GPP specification)
Output: encrypted_MSIN

Algorithm:
1. Pad MSIN to block boundary if needed
2. CTR_block = AES_Encrypt(enc_key, counter)
3. encrypted_MSIN = MSIN XOR CTR_block[0:len(MSIN)]

For Profile C (PQC):
────────────────────
Crypto Operation: AES-256-CTR Encryption
Input:  enc_key (256 bits)
        MSIN
Output: encrypted_MSIN
```

---

#### Step 6: Compute MAC Tag

**Location:** USIM or ME  
**Reference:** TS 33.501 Section C.3.2, RFC 2104

```
Crypto Operation: HMAC-SHA-256 (truncated)
──────────────────────────────────────────
Input:  mac_key (256 bits)
        encrypted_MSIN
Output: MAC_tag (64 bits)

Algorithm:
1. full_mac = HMAC-SHA-256(mac_key, encrypted_MSIN)
2. MAC_tag = full_mac[0:63] (first 64 bits)

For Profile C (PQC):
────────────────────
Crypto Operation: HMAC-SHA3-256
Output: MAC_tag (64 or 128 bits)
```

---

#### Step 7: Assemble SUCI

**Location:** USIM or ME

```
SUCI Assembly:
──────────────
Profile A Output (Total ~49 bytes for 10-digit MSIN):
┌────────────┬─────────────────┬────────────┐
│ eph_PubKey │ encrypted_MSIN  │  MAC_tag   │
│ (32 bytes) │ (5 bytes BCD)   │ (8 bytes)  │
└────────────┴─────────────────┴────────────┘

Profile B Output (Total ~77 bytes for 10-digit MSIN):
┌────────────┬─────────────────┬────────────┐
│ eph_PubKey │ encrypted_MSIN  │  MAC_tag   │
│ (64 bytes) │ (5 bytes BCD)   │ (8 bytes)  │
└────────────┴─────────────────┴────────────┘

Profile C Output (Total ~2,285 bytes for 10-digit MSIN):
┌────────────┬─────────────────┬────────────┐
│ ciphertext │ encrypted_MSIN  │  MAC_tag   │
│(1088 bytes)│ (5 bytes BCD)   │ (8+ bytes) │
└────────────┴─────────────────┴────────────┘

Full SUCI Structure:
SUCI = SUPI_Type || Scheme_ID || HN_PubKey_ID || MCC || MNC || Protection_Scheme_Output
```

---

### 3.4 SUCI Deconcealment Flow (UDM/SIDF Side with HSM)

#### Step 1: Receive SUCI from AMF

**Location:** UDM/SIDF  
**Interface:** N12 (Nudm_UEAuthentication)

| Data Received        | Size     | Description                    |
| -------------------- | -------- | ------------------------------ |
| SUCI                 | Variable | Complete concealed identifier  |
| Serving Network Name | Variable | SN identity for key derivation |

---

#### Step 2: Parse SUCI and Retrieve Private Key from HSM

**Location:** UDM/SIDF ↔ HSM

```
HSM Operation: Private Key Retrieval
────────────────────────────────────
Input to HSM:  HN_PubKey_ID (from SUCI)
               Protection_Scheme_ID
Output:        Key handle (private key never leaves HSM)

Security Note:
- Private key MUST remain inside HSM boundary
- All cryptographic operations performed within HSM
- Audit logging of key access required
```

---

#### Step 3: Compute Shared Secret (Inside HSM)

**Location:** HSM  
**Reference:** TS 33.501 Section C.3.3

##### Profile A (Inside HSM):

```
HSM Crypto Operation: X25519 Key Agreement
──────────────────────────────────────────
Input:  HN_PrivKey (stored in HSM)
        eph_PubKey (from SUCI, 256 bits)
Output: shared_secret (256 bits) - returned to SIDF or kept in HSM

Algorithm (inside HSM):
shared_secret = X25519(HN_PrivKey, eph_PubKey)
```

##### Profile B (Inside HSM):

```
HSM Crypto Operation: ECDH Key Agreement
────────────────────────────────────────
Input:  HN_PrivKey (stored in HSM)
        eph_PubKey (from SUCI, 512 bits)
Output: shared_secret (256 bits)

Algorithm (inside HSM):
1. Parse eph_PubKey as point P
2. Compute shared point: S = HN_PrivKey × P
3. shared_secret = x-coordinate of S
```

##### Profile C (Inside HSM):

```
HSM Crypto Operation: ML-KEM Decapsulation
──────────────────────────────────────────
Input:  HN_PrivKey (ML-KEM private key in HSM)
        ciphertext (from SUCI, 1,088 bytes)
Output: shared_secret (256 bits)

Algorithm (inside HSM):
shared_secret = ML-KEM.Decaps(HN_PrivKey, ciphertext)
```

---

#### Step 4: Derive Decryption and MAC Keys

**Location:** HSM or SIDF (depending on security policy)

```
Crypto Operation: ANSI-X9.63-KDF with SHA-256
─────────────────────────────────────────────
(Same as UE-side derivation)

Input:  shared_secret
        eph_PubKey (or ciphertext for Profile C)
Output: dec_key (128/256 bits)
        mac_key (256 bits)

Security Option:
- Keys can be derived inside HSM and used there
- Or exported to SIDF for decryption (less secure)
```

---

#### Step 5: Verify MAC Tag

**Location:** HSM or SIDF

```
Crypto Operation: HMAC-SHA-256 Verification
───────────────────────────────────────────
Input:  mac_key (256 bits)
        encrypted_MSIN (from SUCI)
        received_MAC_tag (from SUCI)
Output: VALID or INVALID

Algorithm:
1. computed_MAC = HMAC-SHA-256(mac_key, encrypted_MSIN)
2. Compare computed_MAC[0:63] with received_MAC_tag
3. If match: VALID, proceed to decryption
4. If no match: INVALID, reject SUCI

Security: Use constant-time comparison to prevent timing attacks
```

---

#### Step 6: Decrypt MSIN

**Location:** HSM or SIDF

```
Crypto Operation: AES-128-CTR Decryption (Profile A/B)
──────────────────────────────────────────────────────
Input:  dec_key (128 bits)
        encrypted_MSIN (from SUCI)
        IV = 0
Output: MSIN (plaintext)

Algorithm:
1. CTR_block = AES_Encrypt(dec_key, counter)
2. MSIN = encrypted_MSIN XOR CTR_block[0:len(encrypted_MSIN)]
```

---

#### Step 7: Reconstruct SUPI

**Location:** SIDF

```
SUPI Reconstruction:
────────────────────
Input:  MCC (from SUCI routing indicator)
        MNC (from SUCI routing indicator)
        MSIN (decrypted)
Output: SUPI = MCC || MNC || MSIN

Example:
MCC = "310", MNC = "260", MSIN = "1234567890"
SUPI = "3102601234567890"
```

---

## Part 4: Subscriber Authentication Flow (5G-AKA with MILENAGE)

### 4.1 MILENAGE Algorithm Overview

**Reference:** 3GPP TS 35.206

MILENAGE is a set of cryptographic functions (f1, f1*, f2, f3, f4, f5, f5*) built on AES-128 (Rijndael) used for 3G/4G/5G authentication.

```
MILENAGE Function Set:
──────────────────────
┌──────────┬──────────────────────────────┬─────────────────┐
│ Function │ Purpose                      │ Output Size     │
├──────────┼──────────────────────────────┼─────────────────┤
│ f1       │ Network authentication (MAC) │ 64 bits (MAC-A) │
│ f1*      │ Re-sync authentication       │ 64 bits (MAC-S) │
│ f2       │ User authentication response │ 64 bits (RES)   │
│ f3       │ Cipher key derivation        │ 128 bits (CK)   │
│ f4       │ Integrity key derivation     │ 128 bits (IK)   │
│ f5       │ Anonymity key derivation     │ 48 bits (AK)    │
│ f5*      │ Re-sync anonymity key        │ 48 bits (AK)    │
└──────────┴──────────────────────────────┴─────────────────┘
```

### 4.2 Key Hierarchy

```
MILENAGE Key Inputs:
────────────────────
K (Ki)  : 128-bit subscriber secret key (unique per subscriber)
OP      : 128-bit operator variant algorithm configuration field
OPc     : Derived from OP: OPc = OP ⊕ AES_K(OP)
RAND    : 128-bit random challenge (generated by network)
SQN     : 48-bit sequence number (replay protection)
AMF     : 16-bit authentication management field
```

### 4.3 OPc Computation

**Location:** SIM Manufacturing or UDM/HSM  
**Reference:** TS 35.206 Section 4.1

```
Crypto Operation: OPc Derivation
────────────────────────────────
Input:  K (128 bits) - Subscriber key
        OP (128 bits) - Operator key
Output: OPc (128 bits) - Derived operator key

Algorithm:
OPc = OP ⊕ AES_Encrypt(K, OP)

Security Notes:
- OP is common to all subscribers of an operator
- OPc is unique per subscriber (due to unique K)
- Either OP or OPc stored in SIM; if OP stored, OPc computed on-the-fly
- Best practice: Store OPc in SIM, not OP (limits exposure)
```

### 4.4 Authentication Vector Generation (Network Side)

**Location:** UDM/ARPF with HSM  
**Reference:** TS 33.501 Section 6.1.3.2

#### Step 1: Retrieve Subscriber Credentials

**Location:** UDM/ARPF ↔ HSM

```
HSM Operation: Credential Retrieval
───────────────────────────────────
Input:  SUPI (subscriber identifier)
Output: K (retrieved from imported Ki)
        OP (stored in HSM, common for operator)
        SQN (sequence number state)

Key Management Model (as specified):
- OP: Stored permanently in HSM (configured by operator)
- Ki: Imported from SIM manufacturer (encrypted with transport key)
- SQN: Managed per-subscriber to prevent replay
```

---

#### Step 2: Generate Random Challenge

**Location:** HSM (TRNG)

```
Crypto Operation: Random Number Generation
──────────────────────────────────────────
Output: RAND (128 bits)

Requirement: RAND must be generated using FIPS 140-2/3
             compliant True Random Number Generator (TRNG)
```

---

#### Step 3: Compute MILENAGE Functions (Inside HSM)

**Location:** HSM  
**Reference:** TS 35.206 Section 4

##### 3.1 Compute OPc (if not pre-computed)

```
If OP stored (not OPc):
OPc = OP ⊕ AES_K(OP)
```

##### 3.2 Compute f1 (MAC-A for network authentication)

```
Crypto Operation: f1 - Network Authentication Code
──────────────────────────────────────────────────
Input:  K, OPc, RAND, SQN, AMF
Output: MAC-A (64 bits)

Algorithm:
1. TEMP = AES_K(RAND ⊕ OPc)
2. IN1 = SQN || AMF || SQN || AMF (128 bits)
3. OUT1 = AES_K(TEMP ⊕ rotate(OPc, r1) ⊕ c1 ⊕ IN1) ⊕ OPc
4. MAC-A = OUT1[0:63]

Constants: r1 = 64, c1 = 0x00...01
```

##### 3.3 Compute f2 (Expected Response - XRES)

```
Crypto Operation: f2 - Expected User Response
─────────────────────────────────────────────
Input:  K, OPc, RAND
Output: XRES (64 bits)

Algorithm:
1. TEMP = AES_K(RAND ⊕ OPc)
2. OUT2 = AES_K(TEMP ⊕ rotate(OPc, r2) ⊕ c2) ⊕ OPc
3. XRES = OUT2[64:127]

Constants: r2 = 0, c2 = 0x00...02
```

##### 3.4 Compute f3 (Cipher Key - CK)

```
Crypto Operation: f3 - Cipher Key
─────────────────────────────────
Input:  K, OPc, RAND
Output: CK (128 bits)

Algorithm:
1. TEMP = AES_K(RAND ⊕ OPc)
2. OUT3 = AES_K(TEMP ⊕ rotate(OPc, r3) ⊕ c3) ⊕ OPc
3. CK = OUT3

Constants: r3 = 32, c3 = 0x00...04
```

##### 3.5 Compute f4 (Integrity Key - IK)

```
Crypto Operation: f4 - Integrity Key
────────────────────────────────────
Input:  K, OPc, RAND
Output: IK (128 bits)

Algorithm:
1. TEMP = AES_K(RAND ⊕ OPc)
2. OUT4 = AES_K(TEMP ⊕ rotate(OPc, r4) ⊕ c4) ⊕ OPc
3. IK = OUT4

Constants: r4 = 64, c4 = 0x00...08
```

##### 3.6 Compute f5 (Anonymity Key - AK)

```
Crypto Operation: f5 - Anonymity Key
────────────────────────────────────
Input:  K, OPc, RAND
Output: AK (48 bits)

Algorithm:
1. TEMP = AES_K(RAND ⊕ OPc)
2. OUT2 = AES_K(TEMP ⊕ rotate(OPc, r2) ⊕ c2) ⊕ OPc
3. AK = OUT2[0:47]

Note: AK is derived from same OUT2 as XRES (f2)
```

---

#### Step 4: Compute Authentication Token (AUTN)

**Location:** HSM or ARPF

```
AUTN Computation:
─────────────────
Input:  SQN (48 bits)
        AK (48 bits)
        AMF (16 bits)
        MAC-A (64 bits)
Output: AUTN (128 bits)

Algorithm:
1. Concealed_SQN = SQN ⊕ AK
2. AUTN = Concealed_SQN || AMF || MAC-A
```

---

#### Step 5: Derive 5G Keys (KAUSF)

**Location:** ARPF/UDM  
**Reference:** TS 33.501 Section 6.1.3.2

```
Crypto Operation: 5G Key Derivation
───────────────────────────────────
Input:  CK (128 bits)
        IK (128 bits)
        SN_name (Serving Network Name)
        SQN ⊕ AK
Output: KAUSF (256 bits)

Algorithm (KDF per TS 33.220):
1. FC = 0x6A
2. P0 = SN_name, L0 = length(SN_name)
3. P1 = SQN ⊕ AK, L1 = 0x0006
4. KAUSF = HMAC-SHA-256(CK || IK, FC || P0 || L0 || P1 || L1)
```

---

#### Step 6: Compute XRES* and HXRES*

**Location:** ARPF/UDM  
**Reference:** TS 33.501 Section A.4

```
Crypto Operation: XRES* Derivation
──────────────────────────────────
Input:  CK, IK, SN_name, RAND, XRES
Output: XRES* (128 bits)

Algorithm:
1. FC = 0x6B
2. P0 = SN_name, L0 = length(SN_name)
3. P1 = RAND, L1 = 0x0010
4. P2 = XRES, L2 = length(XRES)
5. XRES* = HMAC-SHA-256(CK || IK, FC || P0 || L0 || P1 || L1 || P2 || L2)[128:255]

Crypto Operation: HXRES* Derivation
───────────────────────────────────
Input:  RAND, XRES*
Output: HXRES* (128 bits)

Algorithm:
HXRES* = SHA-256(RAND || XRES*)[128:255]
```

---

#### Step 7: Assemble 5G Home Environment Authentication Vector (5G HE AV)

```
5G HE AV Structure:
───────────────────
┌────────┬────────┬─────────┬────────┐
│  RAND  │  AUTN  │  XRES*  │ KAUSF  │
│128 bits│128 bits│128 bits │256 bits│
└────────┴────────┴─────────┴────────┘
```

---

### 4.5 Authentication at UE/USIM

**Location:** USIM  
**Reference:** TS 33.501 Section 6.1.3.2

#### Step 1: Receive Challenge

```
Data Received via NAS:
──────────────────────
RAND (128 bits) - Random challenge
AUTN (128 bits) - Authentication token
```

---

#### Step 2: Execute MILENAGE in USIM

```
USIM executes same f1-f5 functions:
───────────────────────────────────
Input:  K (stored in USIM)
        OPc (stored or computed in USIM)
        RAND (received)
        AMF (from AUTN)
Output: MAC-A', XRES, CK, IK, AK
```

---

#### Step 3: Verify Network Authentication

```
Verification Steps:
───────────────────
1. Extract Concealed_SQN from AUTN
2. Recover SQN = Concealed_SQN ⊕ AK
3. Verify SQN is in acceptable range (replay protection)
4. Compute MAC-A' using f1 with recovered SQN
5. Compare MAC-A' with MAC-A from AUTN
6. If match: Network authenticated
7. If no match: Reject with MAC failure
```

---

#### Step 4: Compute Response (RES\*)

```
USIM computes:
──────────────
1. RES = f2(K, OPc, RAND) - 64 bits
2. CK, IK from f3, f4
3. Derive RES* using same KDF as network
4. Return RES* to ME for transmission to network
```

---

## Part 5: Key Provisioning Flow (SIM Manufacturer to UDM/HSM)

### 5.1 Overview of Key Lifecycle

```
Key Provisioning Lifecycle:
───────────────────────────
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Key         │    │ SIM         │    │ Secure      │    │ UDM/HSM     │
│ Generation  │───►│ Perso-      │───►│ Transport   │───►│ Import      │
│ (SIM Mfr)   │    │ nalization  │    │ (Encrypted) │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
   Ki, OPc           Ki, OPc →         eKi (encrypted)    Ki → HSM
   generated         USIM              sent to MNO        OP in HSM
                                                          OPc computed
```

### 5.2 Key Generation at SIM Manufacturer

**Location:** SIM Manufacturer Secure Facility (FIPS 140-2 Level 3+ HSM)

#### Step 1: Generate Ki (Subscriber Key)

```
Crypto Operation: Ki Generation
───────────────────────────────
Output: Ki (128 bits)

Requirements:
- TRNG compliant with FIPS 140-2/3
- Generated inside HSM boundary
- Never exposed in plaintext outside secure perimeter
```

---

#### Step 2: Receive OP from Operator (or Generate OPc Directly)

**Option A: Operator provides OP**

```
Secure Transfer:
────────────────
1. Operator generates OP in their HSM
2. OP encrypted with SIM manufacturer's transport key
3. SIM manufacturer decrypts OP inside their HSM
4. OP stored securely for batch processing
```

**Option B: Unique OPc per SIM (Best Practice)**

```
Modern Approach:
────────────────
1. Generate random OP per SIM (128 bits)
2. Compute OPc = OP ⊕ AES_Ki(OP)
3. Store OPc in SIM (not OP)
4. Include OPc in output file for operator
5. OP is discarded after OPc computation

Security Benefit: No common secret across all SIMs
```

---

#### Step 3: Compute OPc (if OP provided)

```
Crypto Operation: OPc Computation (inside SIM Manufacturer HSM)
──────────────────────────────────────────────────────────────
Input:  Ki (generated)
        OP (from operator)
Output: OPc (128 bits)

Algorithm:
OPc = OP ⊕ AES_Encrypt(Ki, OP)
```

---

### 5.3 SIM Personalization

**Location:** SIM Manufacturer Personalization Line

#### Step 1: Write Keys to USIM

```
Data Written to USIM:
─────────────────────
┌─────────────────────────────────────────────────────────┐
│ EF_Ki       : Ki (128 bits) - Subscriber key            │
│ EF_OPc      : OPc (128 bits) - Derived operator key     │
│ EF_IMSI     : IMSI (up to 15 digits)                    │
│ EF_ACC      : Access Control Class                       │
│ EF_SUCI_Calc: HN Public Key, Protection Scheme ID       │
│ EF_SQN      : Initial sequence number (typically 0)     │
└─────────────────────────────────────────────────────────┘

Security Requirements:
- Personalization in physically secure environment
- Keys encrypted in transit to personalization machine
- Audit logging of all operations
- Secure destruction of source key material after loading
```

---

### 5.4 Secure Key Transport to Operator

**Location:** SIM Manufacturer → MNO

#### Step 1: Establish Transport Key

```
Transport Key Agreement:
────────────────────────
1. SIM Manufacturer and MNO agree on transport key (TK)
2. TK is typically:
   - 3DES (legacy): 128-bit or 192-bit
   - AES (modern): 128-bit or 256-bit
3. TK exchanged via secure channel (e.g., HSM-to-HSM)
4. TK stored in both parties' HSMs
```

---

#### Step 2: Encrypt Ki for Transport

```
Crypto Operation: Ki Encryption with Transport Key
──────────────────────────────────────────────────
Input:  Ki (128 bits)
        TK (Transport Key, 128/256 bits)
Output: eKi (encrypted Ki)

Algorithm Options:
- AES-ECB: eKi = AES_Encrypt(TK, Ki)
- AES-CBC: eKi = AES_CBC_Encrypt(TK, IV, Ki)
- 3DES-CBC (legacy): eKi = 3DES_CBC_Encrypt(TK, IV, Ki)

Note: Some implementations use key diversification
      eKi = AES_Encrypt(TK, Ki ⊕ ICCID_derived_value)
```

---

#### Step 3: Generate Output File

```
Output File Format (typical):
─────────────────────────────
Per-SIM Record:
┌──────────┬──────────┬───────────┬──────────────┐
│  ICCID   │   IMSI   │    eKi    │    OPc       │
│(19-20 dig)│(15 dig) │(encrypted)│(clear or enc)│
└──────────┴──────────┴───────────┴──────────────┘

File Security:
- File itself may be encrypted (file-level encryption)
- Transmitted via secure channel (SFTP, dedicated link)
- Access logging and chain of custody required
```

---

### 5.5 Key Import at UDM/HSM

**Location:** MNO UDM/ARPF with HSM

#### Step 1: Receive and Validate File

```
Validation Steps:
─────────────────
1. Verify file integrity (checksum/signature)
2. Verify sender authentication
3. Log receipt with timestamp
4. Quarantine until import complete
```

---

#### Step 2: Decrypt Ki Inside HSM

```
HSM Operation: Ki Decryption and Storage
────────────────────────────────────────
Input:  eKi (encrypted Ki from file)
        TK (Transport Key in HSM)
Output: Ki stored in HSM secure storage

Algorithm (inside HSM):
1. Decrypt: Ki = AES_Decrypt(TK, eKi)
2. Validate Ki format (128 bits)
3. Store Ki indexed by IMSI/SUPI
4. Never export Ki in plaintext
```

---

#### Step 3: Configure OP in HSM

**As specified in requirements: UDM keeps OP, not OPc**

```
OP Configuration:
─────────────────
1. OP loaded into HSM during initial setup
2. OP is common for all subscribers of operator
3. OP protected by HSM access controls
4. OPc computed on-the-fly during authentication:
   OPc = OP ⊕ AES_Encrypt(Ki, OP)

Alternative (if OPc in output file):
────────────────────────────────────
1. Import OPc directly alongside Ki
2. Store OPc indexed by IMSI/SUPI
3. Skip OPc computation during auth
```

---

#### Step 4: Subscriber Record Creation

```
UDM Subscriber Profile:
───────────────────────
┌───────────────────────────────────────────────────────┐
│ SUPI        : 310260123456789                         │
│ Ki_ref      : HSM_key_handle_12345 (HSM reference)    │
│ OP_ref      : HSM_key_handle_OP_001 (common OP)       │
│ Auth_Method : 5G-AKA                                  │
│ SQN         : 0x000000000000 (initial)                │
│ SQN_window  : 32 (acceptable SQN delta)               │
└───────────────────────────────────────────────────────┘

Note: Actual Ki never stored in UDM database
      Only HSM key handles/references stored
```

---

## Part 6: HSM Integration Requirements

### 6.1 HSM Functions for SUCI Deconcealment

| Function              | Input                         | Output           | Security Requirement                  |
| --------------------- | ----------------------------- | ---------------- | ------------------------------------- |
| **GenerateHNKeyPair** | Profile (A/B/C)               | Key handle       | Key generated inside HSM              |
| **ExportHNPublicKey** | Key handle                    | Public key bytes | For SIM provisioning                  |
| **ECDHKeyAgreement**  | eph_PubKey, HN_PrivKey handle | Shared secret    | Shared secret may be exported or kept |
| **MLKEMDecaps**       | ciphertext, HN_PrivKey handle | Shared secret    | For Profile C                         |
| **DeriveKeys**        | Shared secret, info           | enc_key, mac_key | Keys may be exported or kept          |
| **VerifyMAC**         | mac_key, data, tag            | VALID/INVALID    | Constant-time comparison              |
| **DecryptMSIN**       | enc_key, ciphertext           | MSIN plaintext   | AES-CTR decryption                    |

### 6.2 HSM Functions for Authentication

| Function         | Input                   | Output          | Security Requirement |
| ---------------- | ----------------------- | --------------- | -------------------- |
| **ImportKi**     | eKi, TK handle          | Ki handle       | Ki never leaves HSM  |
| **StoreOP**      | OP                      | OP handle       | One per operator     |
| **ComputeOPc**   | Ki handle, OP handle    | OPc             | Computed inside HSM  |
| **GenerateRAND** | -                       | RAND (128 bits) | TRNG required        |
| **ComputeMAC_A** | Ki, OPc, RAND, SQN, AMF | MAC-A           | f1 function          |
| **ComputeXRES**  | Ki, OPc, RAND           | XRES            | f2 function          |
| **ComputeCK**    | Ki, OPc, RAND           | CK              | f3 function          |
| **ComputeIK**    | Ki, OPc, RAND           | IK              | f4 function          |
| **ComputeAK**    | Ki, OPc, RAND           | AK              | f5 function          |
| **DeriveKAUSF**  | CK, IK, SN_name, SQN⊕AK | KAUSF           | 5G key derivation    |

### 6.3 HSM Certification Requirements

| Requirement         | Standard                              | Minimum Level |
| ------------------- | ------------------------------------- | ------------- |
| **FIPS 140-2/3**    | Cryptographic module validation       | Level 3       |
| **Common Criteria** | Security evaluation                   | EAL4+         |
| **PCI HSM**         | Payment card industry (if applicable) | v3.0          |
| **GSMA SAS**        | SIM provisioning (if acting as SM-DP) | SAS-UP        |

---

## Part 7: Educational Module Structure

### 7.1 Proposed Module Breakdown

| Module  | Title                                    | Duration | Prerequisites  |
| ------- | ---------------------------------------- | -------- | -------------- |
| **M1**  | Introduction to 5G Security Architecture | 30 min   | None           |
| **M2**  | SUPI and SUCI: Subscriber Privacy in 5G  | 45 min   | M1             |
| **M3**  | ECIES Profile A Deep Dive (Curve25519)   | 60 min   | M2, ECC basics |
| **M4**  | ECIES Profile B Deep Dive (P-256)        | 45 min   | M3             |
| **M5**  | Post-Quantum Profile C (ML-KEM/Kyber)    | 60 min   | M2, PQC basics |
| **M6**  | MILENAGE Algorithm Internals             | 90 min   | AES knowledge  |
| **M7**  | 5G-AKA Protocol Flow                     | 60 min   | M6             |
| **M8**  | SIM Key Provisioning & Lifecycle         | 45 min   | M6, M7         |
| **M9**  | HSM Integration for 5G Security          | 60 min   | M3-M8          |
| **M10** | Hands-on Lab: End-to-End Flow            | 120 min  | All above      |

### 7.2 Learning Objectives per Module

#### Module 2: SUPI and SUCI

- Explain the purpose of SUCI in 5G privacy protection
- Describe the SUCI structure per TS 23.003
- Compare Protection Scheme Profiles A, B, and C
- Identify the network elements involved in SUCI processing

#### Module 3: ECIES Profile A

- Explain X25519 key agreement mechanics
- Perform KDF derivation step-by-step
- Describe AES-CTR encryption for MSIN
- Compute HMAC-SHA-256 MAC tag

#### Module 6: MILENAGE

- Describe the role of each function (f1-f5, f1*, f5*)
- Explain the relationship between OP, OPc, and Ki
- Walk through the MILENAGE computation for a given test vector
- Identify the security properties of MILENAGE

#### Module 8: Key Provisioning

- Describe the SIM manufacturing key generation process
- Explain transport key usage and key encryption
- Detail the key import process at UDM/HSM
- Identify best practices for key lifecycle management

---

## Part 8: Test Vectors and Validation

### 8.1 MILENAGE Test Vector (from TS 35.207)

```
Test Set 1:
───────────
K     = 465B5CE8 B199B49F AA5F0A2E E238A6BC
OP    = CDC20200 9666D0C5 0C3B3AA8 8CCA9FD3
RAND  = 23553CBE 9662D8C6 6DFA2E26 B01CF7B6
SQN   = FF9BB4D0 B607
AMF   = B9B9

Expected Outputs:
─────────────────
OPc   = CD63CB71 954A9F4E 48A5994E 37A02BAF
f1 (MAC-A) = 4A9FFAC3 54DFAFB3
f2 (RES)   = A54211D5 E3BA50BF
f3 (CK)    = B40BA9A3 C58B2A05 BBF0D987 B21BF8CB
f4 (IK)    = F769BCD7 51044604 12767271 1C6D3441
f5 (AK)    = AA689C64 8370
AUTN  = 55F23ED0 8D0C B9B9 4A9FFAC3 54DFAFB3
       (SQN⊕AK || AMF || MAC-A)
```

### 8.2 SUCI Profile A Test Vector (from TS 33.501 Annex C)

```
Profile A Test Data:
────────────────────
HN Private Key = c53c2208 b61860b0 6c62e542 3b7c9baa
                 4a8f5c14 906aaac8 d47a65bb e4d1c9dd
HN Public Key  = 5a8d38e6 f5d7a8c0 76afcc4f 6b1c7f4f
                 a7cb11c1 81a4a5a4 0e17b0f8 c3c7e8d9

MSIN           = 0000000001 (BCD encoded: 00000000 0F1)
MCC||MNC       = 310260

UE Ephemeral Private = a1b2c3d4 e5f6a7b8 c9d0e1f2 a3b4c5d6
                       e7f8a9b0 c1d2e3f4 a5b6c7d8 e9f0a1b2

Expected SUCI Protection Scheme Output:
- Ephemeral Public Key (32 bytes)
- Encrypted MSIN (5 bytes)
- MAC Tag (8 bytes)
```

---

## Part 10: Technical Implementation & Validation Service

### 10.1 Core Cryptographic Identity

The module ensures educational accuracy by using **real cryptographic libraries**, not simulations.

| Component        | Implementation     | Version   | Purpose                         |
| :--------------- | :----------------- | :-------- | :------------------------------ |
| **Network Side** | **OpenSSL WASM**   | **3.5.4** | Validation Authority (SIDF/HSM) |
| **USIM Side**    | **Web Crypto API** | Native    | Profile A/B Operations          |
| **PQC USIM**     | **mlkem-wasm**     | Latest    | Profile C (Kyber) Operations    |

### 10.2 Automated Audit & Verification

To guarantee that the USIM logic (JavaScript/Wasm) produces standard-compliant outputs, an automated audit suite runs validation against the OpenSSL 3.5.4 binary.

**Audit Validations (`audit_suci.test.ts`):**

1. **Profile A (Curve25519)**: Verifies USIM ECDH shared secret matches OpenSSL `pkeyutl -derive`.
2. **Profile B (P-256)**: Verifies USIM ECDH shared secret matches OpenSSL `pkeyutl -derive`.
3. **Profile C (Hybrid)**: Verifies that the `mlkem-wasm` ciphertext can be decapsulated by OpenSSL 3.5.4 and that the Hybrid Combiner (SHA256(ECC||PQC)) is correct.
4. **Profile C (Pure)**: Verifies raw ML-KEM encapsulation/decapsulation interoperability.

---

## Part 11: Glossary

| Term         | Definition                                                   |
| ------------ | ------------------------------------------------------------ |
| **5G-AKA**   | 5G Authentication and Key Agreement protocol                 |
| **AK**       | Anonymity Key (48 bits, derived by f5)                       |
| **AMF**      | Authentication Management Field (16 bits)                    |
| **ARPF**     | Authentication credential Repository and Processing Function |
| **AUSF**     | Authentication Server Function                               |
| **AUTN**     | Authentication Token (SQN⊕AK \|\| AMF \|\| MAC)              |
| **CK**       | Cipher Key (128 bits, derived by f3)                         |
| **ECIES**    | Elliptic Curve Integrated Encryption Scheme                  |
| **HN**       | Home Network                                                 |
| **HSM**      | Hardware Security Module                                     |
| **IK**       | Integrity Key (128 bits, derived by f4)                      |
| **IMSI**     | International Mobile Subscriber Identity                     |
| **Ki/K**     | Subscriber Authentication Key (128 bits)                     |
| **KDF**      | Key Derivation Function                                      |
| **KAUSF**    | Anchor key derived during 5G-AKA                             |
| **MAC-A**    | Message Authentication Code for network auth (64 bits)       |
| **MILENAGE** | Example algorithm set for 3GPP authentication                |
| **ML-KEM**   | Module-Lattice-Based Key Encapsulation Mechanism             |
| **MSIN**     | Mobile Subscriber Identification Number                      |
| **OP**       | Operator Variant Algorithm Configuration Field               |
| **OPc**      | Derived operator key: OPc = OP ⊕ AES_K(OP)                   |
| **RAND**     | Random challenge (128 bits)                                  |
| **RES**      | Response to authentication challenge                         |
| **SIDF**     | Subscription Identifier De-concealing Function               |
| **SQN**      | Sequence Number (48 bits, replay protection)                 |
| **SUCI**     | Subscription Concealed Identifier                            |
| **SUPI**     | Subscription Permanent Identifier                            |
| **UDM**      | Unified Data Management                                      |
| **USIM**     | Universal Subscriber Identity Module                         |
| **XRES**     | Expected Response (network-computed RES)                     |

---

## Document Control

| Version | Date     | Author    | Changes                                |
| ------- | -------- | --------- | -------------------------------------- |
| 1.0     | Dec 2025 | PQC Today | Initial release                        |
| 1.1     | Dec 2025 | PQC Today | Update for Profiles B/C Implementation |

---

_This document is intended for educational purposes as part of the PQC Today learning platform. For implementation guidance, always refer to the official 3GPP specifications._
