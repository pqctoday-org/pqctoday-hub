# Post-Quantum KEM Integration in TLS 1.3

## Technical Addendum: Handling Variable Shared Secret Sizes

**Document Version:** 1.0  
**Date:** December 12, 2025  
**Related Document:** OpenSSL_TLS_Testing_Module_FRD.md  
**Classification:** Technical Reference

---

## Executive Summary

This document addresses the technical challenge of integrating Post-Quantum Key Encapsulation Mechanisms (KEMs) with varying shared secret sizes into TLS 1.3's key derivation framework. Different PQC algorithms (FrodoKEM, HQC, Classic McEliece, Kyber) produce shared secrets ranging from 128 to 256 bits, which must be normalized through a consistent key derivation process.

---

## 1. The Problem: Variable Shared Secret Sizes

### 1.1 PQC KEM Shared Secret Output Sizes

| Algorithm            | Variant         | Shared Secret Size  | Security Level |
| -------------------- | --------------- | ------------------- | -------------- |
| **Kyber**            | Kyber512        | 32 bytes (256 bits) | NIST Level 1   |
|                      | Kyber768        | 32 bytes (256 bits) | NIST Level 3   |
|                      | Kyber1024       | 32 bytes (256 bits) | NIST Level 5   |
| **FrodoKEM**         | FrodoKEM-640    | 16 bytes (128 bits) | NIST Level 1   |
|                      | FrodoKEM-976    | 24 bytes (192 bits) | NIST Level 3   |
|                      | FrodoKEM-1344   | 32 bytes (256 bits) | NIST Level 5   |
| **HQC**              | HQC-128         | 32 bytes (256 bits) | NIST Level 1   |
|                      | HQC-192         | 48 bytes (384 bits) | NIST Level 3   |
|                      | HQC-256         | 64 bytes (512 bits) | NIST Level 5   |
| **Classic McEliece** | mceliece348864  | 32 bytes (256 bits) | NIST Level 1   |
|                      | mceliece460896  | 32 bytes (256 bits) | NIST Level 3   |
|                      | mceliece6688128 | 32 bytes (256 bits) | NIST Level 5   |
| **BIKE**             | BIKE-L1         | 32 bytes (256 bits) | NIST Level 1   |
|                      | BIKE-L3         | 48 bytes (384 bits) | NIST Level 3   |

**Key Observation:** Shared secret sizes vary from 128 bits (16 bytes) to 512 bits (64 bytes).

### 1.2 Classical ECDHE for Comparison

| Algorithm         | Output Size         | Note                         |
| ----------------- | ------------------- | ---------------------------- |
| X25519            | 32 bytes (256 bits) | Shared secret from ECDH      |
| X448              | 56 bytes (448 bits) | Shared secret from ECDH      |
| secp256r1 (P-256) | 32 bytes (256 bits) | x-coordinate of shared point |
| secp384r1 (P-384) | 48 bytes (384 bits) | x-coordinate of shared point |
| secp521r1 (P-521) | 66 bytes (528 bits) | x-coordinate of shared point |

**Key Observation:** Classical key exchange also produces variable-sized outputs.

---

## 2. The Solution: TLS 1.3 HKDF Key Derivation

### 2.1 TLS 1.3 Key Schedule Overview

TLS 1.3 uses **HKDF (HMAC-based Key Derivation Function)** from RFC 5869, which is **agnostic to input size**. This is the elegant solution to the variable shared secret problem.

```
TLS 1.3 Key Schedule (Simplified)
─────────────────────────────────────────────────────────────────

Input: Shared Secret (variable size: 16-66+ bytes)
       ↓
    ┌──────────────────────────────────────┐
    │  HKDF-Extract(salt, IKM)             │
    │  - IKM = shared secret (any size)    │
    │  - Output: PRK (pseudorandom key)    │
    │  - Size: Hash output size (32/48/64) │
    └──────────────────────────────────────┘
       ↓
    Early Secret (fixed size based on hash)
       ↓
    ┌──────────────────────────────────────┐
    │  Derive-Secret("derived", ...)       │
    └──────────────────────────────────────┘
       ↓
    ┌──────────────────────────────────────┐
    │  HKDF-Extract(PRK, DHE/KEM shared)   │
    └──────────────────────────────────────┘
       ↓
    Handshake Secret (fixed size)
       ↓
    ┌──────────────────────────────────────┐
    │  HKDF-Expand-Label(...)              │
    │  Generate multiple keys:             │
    │  - client_handshake_traffic_secret   │
    │  - server_handshake_traffic_secret   │
    │  - client_application_traffic_secret │
    │  - server_application_traffic_secret │
    └──────────────────────────────────────┘
       ↓
    Application Keys (AES keys, IVs, etc.)
```

### 2.2 HKDF-Extract: The Normalizer

**HKDF-Extract** is the critical function that normalizes variable-sized inputs:

```c
PRK = HKDF-Extract(salt, IKM)
    = HMAC-Hash(salt, IKM)
```

**Key Properties:**

- **Input (IKM):** Can be ANY size (16 bytes, 32 bytes, 64 bytes, etc.)
- **Output (PRK):** ALWAYS hash output size
  - SHA-256: 32 bytes
  - SHA-384: 48 bytes
  - SHA-512: 64 bytes

**Example:**

```
FrodoKEM-640 shared secret: 16 bytes → HKDF-Extract → 32 bytes (SHA-256)
HQC-256 shared secret:      64 bytes → HKDF-Extract → 32 bytes (SHA-256)
X25519 shared secret:       32 bytes → HKDF-Extract → 32 bytes (SHA-256)

All normalized to same 32-byte PRK!
```

### 2.3 HKDF-Expand-Label: Generating Specific Keys

Once normalized to fixed-size PRK, **HKDF-Expand-Label** derives specific keys:

```c
HKDF-Expand-Label(Secret, Label, Context, Length) =
    HKDF-Expand(Secret, HkdfLabel, Length)

Where HkdfLabel = {
    uint16 length = Length;
    opaque label<7..255> = "tls13 " + Label;
    opaque context<0..255> = Context;
}
```

**Generates:**

- Handshake encryption keys (e.g., 16 bytes for AES-128, 32 bytes for AES-256)
- Handshake IVs (12 bytes for GCM)
- Application traffic keys
- Finished verification keys

---

## 3. Hybrid PQC/Classical Key Exchange

### 3.1 Hybrid Mode Construction

For quantum resistance with backward compatibility, **hybrid mode** combines classical and PQC shared secrets:

```
Hybrid Shared Secret Construction
──────────────────────────────────────────────────────────────

Classical ECDHE:     X25519 → 32-byte shared secret
Post-Quantum KEM:    Kyber768 → 32-byte shared secret

Concatenate:  shared_secret = classical_ss || pqc_ss
              shared_secret = 32 bytes || 32 bytes = 64 bytes

Feed to HKDF-Extract:
              PRK = HKDF-Extract(salt, 64-byte shared_secret)
              PRK = 32 bytes (SHA-256 output)

Continue with normal TLS 1.3 key schedule...
```

### 3.2 Hybrid Construction Standards

**IETF Draft: Hybrid Key Exchange in TLS 1.3**
(draft-ietf-tls-hybrid-design)

**Concatenation Order:**

```
hybrid_shared_secret = classical_shared_secret || pqc_shared_secret
```

**Rationale:**

- If PQC algorithm is broken: Classical ECDHE provides security
- If classical ECDHE is broken (quantum computer): PQC provides security
- Both must be broken to compromise the connection

### 3.3 Example: X25519 + Kyber768 Hybrid

```
Step 1: Classical Key Exchange
───────────────────────────────
X25519 ECDHE:
  Client public:  32 bytes
  Server public:  32 bytes
  Shared secret:  32 bytes

Step 2: Post-Quantum KEM
─────────────────────────
Kyber768:
  Client generates keypair
  Client sends public key:     1184 bytes
  Server encapsulates:
    Ciphertext:                1088 bytes
    Shared secret:             32 bytes

Step 3: Combine
───────────────
hybrid_ss = x25519_ss || kyber768_ss
hybrid_ss = 32 bytes || 32 bytes = 64 bytes

Step 4: Feed to TLS 1.3 Key Schedule
─────────────────────────────────────
HKDF-Extract(salt=derived_secret, IKM=hybrid_ss)
  Input:  64 bytes
  Output: 32 bytes (SHA-256 PRK)

Step 5: Derive All Session Keys
────────────────────────────────
From 32-byte PRK, derive:
  - Handshake traffic secrets
  - Application traffic secrets
  - Finished MAC keys
  - etc.
```

---

## 4. Practical Implementation in OpenSSL

### 4.1 OpenSSL 3.x KEM Provider Interface

OpenSSL 3.x uses a **provider architecture** for PQC algorithms (via OQS-OpenSSL provider):

```c
// Generic KEM encapsulation (works with any KEM)
EVP_PKEY_encapsulate_init(ctx);
EVP_PKEY_encapsulate(ctx,
                      ciphertext, &ciphertext_len,
                      shared_secret, &shared_secret_len);

// shared_secret_len varies by algorithm:
// - Kyber768:      32 bytes
// - FrodoKEM-976:  24 bytes
// - HQC-256:       64 bytes
```

### 4.2 TLS 1.3 Integration

OpenSSL's TLS 1.3 implementation handles variable sizes automatically:

```c
// Internal TLS 1.3 key derivation (simplified)

// 1. Normalize shared secret via HKDF-Extract
EVP_PKEY_CTX *pctx = EVP_PKEY_CTX_new_id(EVP_PKEY_HKDF, NULL);
EVP_PKEY_derive_init(pctx);
EVP_PKEY_CTX_set_hkdf_md(pctx, EVP_sha256());  // or SHA-384/SHA-512
EVP_PKEY_CTX_set1_hkdf_salt(pctx, salt, salt_len);
EVP_PKEY_CTX_set1_hkdf_key(pctx, shared_secret, shared_secret_len);  // ANY SIZE!

// Output is always hash_size bytes
unsigned char prk[32];  // 32 for SHA-256
size_t prk_len = sizeof(prk);
EVP_PKEY_derive(pctx, prk, &prk_len);

// 2. Expand to generate specific keys
tls13_hkdf_expand(prk, label, context, out, out_len);
```

**The key insight:** `EVP_PKEY_CTX_set1_hkdf_key()` accepts shared secrets of ANY size, and HKDF-Extract normalizes them all to the hash output size (32, 48, or 64 bytes depending on hash function).

### 4.3 Supported Groups Extension

In TLS 1.3, PQC KEMs are negotiated via the `supported_groups` extension:

```
ClientHello {
  ...
  Extension: supported_groups {
    NamedGroup x25519 (0x001d)
    NamedGroup secp256r1 (0x0017)
    NamedGroup kyber768 (0x?????)     // TBD IANA code point
    NamedGroup frodo976 (0x?????)     // TBD IANA code point
  }
  Extension: key_share {
    KeyShareEntry {
      group: x25519
      key_exchange: <32 bytes X25519 public key>
    }
    KeyShareEntry {
      group: kyber768
      key_exchange: <1184 bytes Kyber768 public key>
    }
  }
}
```

Server selects one group and responds with its key share:

```
ServerHello {
  Extension: key_share {
    KeyShareEntry {
      group: kyber768
      key_exchange: <1088 bytes Kyber768 ciphertext>
    }
  }
}
```

Both sides derive the 32-byte Kyber768 shared secret and feed it to HKDF.

---

## 5. Educational Module Implementation

### 5.1 Displaying Variable Shared Secret Sizes

In the negotiation results panel, display:

```
┌─────────────────────────────────────────────────────────────┐
│ TLS 1.3 Key Derivation Details                             │
├─────────────────────────────────────────────────────────────┤
│ Key Exchange:        Kyber768 (Post-Quantum KEM)           │
│ KEM Shared Secret:   32 bytes (256 bits)                   │
│                                                             │
│ HKDF Hash Function:  SHA-384                               │
│ HKDF-Extract Input:  32-byte shared secret                 │
│ HKDF-Extract Output: 48 bytes (SHA-384 PRK)               │
│                                                             │
│ Derived Keys:                                               │
│   └─ Handshake Key:      32 bytes (AES-256)               │
│   └─ Handshake IV:       12 bytes (GCM nonce)             │
│   └─ Application Key:    32 bytes (AES-256)               │
│   └─ Application IV:     12 bytes (GCM nonce)             │
│                                                             │
│ ℹ Note: HKDF normalizes all KEM shared secrets to the     │
│   hash output size, regardless of input size.              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Hybrid Mode Display

For hybrid PQC/classical:

```
┌─────────────────────────────────────────────────────────────┐
│ TLS 1.3 Hybrid Key Exchange                                │
├─────────────────────────────────────────────────────────────┤
│ Classical Component:                                        │
│   Algorithm:         X25519 (ECDHE)                        │
│   Shared Secret:     32 bytes                              │
│                                                             │
│ Post-Quantum Component:                                     │
│   Algorithm:         Kyber768 (KEM)                        │
│   Public Key Size:   1184 bytes                            │
│   Ciphertext Size:   1088 bytes                            │
│   Shared Secret:     32 bytes                              │
│                                                             │
│ Combined Hybrid Secret:                                     │
│   Construction:      classical_ss || pqc_ss                │
│   Total Size:        64 bytes (32 + 32)                    │
│                                                             │
│ HKDF Processing:                                            │
│   Input:             64-byte hybrid secret                  │
│   Hash:              SHA-384                                │
│   PRK Output:        48 bytes                               │
│                                                             │
│ Security Properties:                                        │
│   ✓ Classical Security:    ~128 bits (X25519)             │
│   ✓ Quantum Resistance:    NIST Level 3 (Kyber768)        │
│   ✓ Forward Secrecy:       Yes (ephemeral keys)           │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Educational Comparison: Different KEMs

Allow users to switch between KEMs and observe:

```
Scenario A: FrodoKEM-640
────────────────────────
  KEM Shared Secret:    16 bytes (128 bits)
  HKDF-Extract Input:   16 bytes
  HKDF-Extract Output:  32 bytes (SHA-256)

  Note: Smaller input, but normalized to 32 bytes

Scenario B: HQC-256
───────────────────
  KEM Shared Secret:    64 bytes (512 bits)
  HKDF-Extract Input:   64 bytes
  HKDF-Extract Output:  32 bytes (SHA-256)

  Note: Larger input, but normalized to 32 bytes

Scenario C: Kyber768
────────────────────
  KEM Shared Secret:    32 bytes (256 bits)
  HKDF-Extract Input:   32 bytes
  HKDF-Extract Output:  32 bytes (SHA-256)

  Note: Perfect match, no size change

Conclusion:
───────────
All three KEMs produce the same 32-byte PRK after HKDF-Extract,
which is then used to derive identical-sized session keys.

The TLS 1.3 key schedule is agnostic to KEM shared secret size!
```

---

## 6. Code Example: HKDF in Practice

### 6.1 Pseudocode for TLS 1.3 Key Derivation

```python
import hashlib
import hmac

def hkdf_extract(salt, ikm, hash_func=hashlib.sha256):
    """
    HKDF-Extract: Normalize variable-sized input to fixed-sized PRK

    Args:
        salt: Salt value (can be zero-length)
        ikm: Input Key Material (shared secret, ANY SIZE)
        hash_func: Hash function (SHA-256, SHA-384, SHA-512)

    Returns:
        PRK: Pseudorandom key (size = hash output size)
    """
    if len(salt) == 0:
        salt = bytes([0] * hash_func().digest_size)

    prk = hmac.new(salt, ikm, hash_func).digest()
    return prk

def hkdf_expand_label(secret, label, context, length, hash_func=hashlib.sha256):
    """
    HKDF-Expand-Label: TLS 1.3 specific key derivation

    Args:
        secret: PRK from HKDF-Extract
        label: TLS 1.3 label (e.g., "c hs traffic")
        context: Transcript hash
        length: Desired output length

    Returns:
        Derived key of specified length
    """
    hkdf_label = (
        length.to_bytes(2, 'big') +
        len(label).to_bytes(1, 'big') + label.encode() +
        len(context).to_bytes(1, 'big') + context
    )

    # HKDF-Expand
    t = b""
    okm = b""
    i = 0

    while len(okm) < length:
        i += 1
        t = hmac.new(secret, t + hkdf_label + bytes([i]), hash_func).digest()
        okm += t

    return okm[:length]

# Example: Different KEM sizes, same outcome
# ──────────────────────────────────────────────

# Scenario 1: FrodoKEM-640 (16-byte shared secret)
frodo_ss = b'\x01' * 16  # 16 bytes
prk_frodo = hkdf_extract(salt=b"", ikm=frodo_ss, hash_func=hashlib.sha256)
print(f"FrodoKEM PRK size: {len(prk_frodo)} bytes")  # Output: 32 bytes

# Scenario 2: HQC-256 (64-byte shared secret)
hqc_ss = b'\x02' * 64  # 64 bytes
prk_hqc = hkdf_extract(salt=b"", ikm=hqc_ss, hash_func=hashlib.sha256)
print(f"HQC PRK size: {len(prk_hqc)} bytes")  # Output: 32 bytes

# Scenario 3: Kyber768 (32-byte shared secret)
kyber_ss = b'\x03' * 32  # 32 bytes
prk_kyber = hkdf_extract(salt=b"", ikm=kyber_ss, hash_func=hashlib.sha256)
print(f"Kyber PRK size: {len(prk_kyber)} bytes")  # Output: 32 bytes

# All produce 32-byte PRK regardless of input size!

# Now derive session keys from any PRK
handshake_key = hkdf_expand_label(
    secret=prk_kyber,
    label="c hs traffic",
    context=b"\x00" * 32,  # Transcript hash
    length=32  # AES-256 key size
)
print(f"Handshake key size: {len(handshake_key)} bytes")  # Output: 32 bytes
```

### 6.2 OpenSSL C Code Example

```c
#include <openssl/evp.h>
#include <openssl/kdf.h>

// HKDF-Extract: Normalize any-sized shared secret
int hkdf_extract(
    const unsigned char *salt, size_t salt_len,
    const unsigned char *ikm, size_t ikm_len,  // Can be 16, 32, 64 bytes, etc.
    unsigned char *prk, size_t *prk_len,
    const EVP_MD *md)
{
    EVP_PKEY_CTX *pctx = EVP_PKEY_CTX_new_id(EVP_PKEY_HKDF, NULL);

    EVP_PKEY_derive_init(pctx);
    EVP_PKEY_CTX_set_hkdf_mode(pctx, EVP_KDF_HKDF_MODE_EXTRACT_ONLY);
    EVP_PKEY_CTX_set_hkdf_md(pctx, md);
    EVP_PKEY_CTX_set1_hkdf_salt(pctx, salt, salt_len);
    EVP_PKEY_CTX_set1_hkdf_key(pctx, ikm, ikm_len);  // ANY SIZE!

    *prk_len = EVP_MD_size(md);  // Output is hash size (32, 48, or 64 bytes)
    int ret = EVP_PKEY_derive(pctx, prk, prk_len);

    EVP_PKEY_CTX_free(pctx);
    return ret;
}

// Example usage with different KEM sizes
int main() {
    const EVP_MD *sha256 = EVP_sha256();
    unsigned char prk[32];
    size_t prk_len;

    // FrodoKEM-640: 16-byte shared secret
    unsigned char frodo_ss[16] = {/* ... */};
    hkdf_extract(NULL, 0, frodo_ss, 16, prk, &prk_len, sha256);
    printf("FrodoKEM PRK: %zu bytes\n", prk_len);  // 32 bytes

    // HQC-256: 64-byte shared secret
    unsigned char hqc_ss[64] = {/* ... */};
    hkdf_extract(NULL, 0, hqc_ss, 64, prk, &prk_len, sha256);
    printf("HQC PRK: %zu bytes\n", prk_len);  // 32 bytes

    // Kyber768: 32-byte shared secret
    unsigned char kyber_ss[32] = {/* ... */};
    hkdf_extract(NULL, 0, kyber_ss, 32, prk, &prk_len, sha256);
    printf("Kyber PRK: %zu bytes\n", prk_len);  // 32 bytes

    return 0;
}
```

---

## 7. Security Considerations

### 7.1 Hash Function Selection

The choice of hash function in HKDF affects security:

| Hash Function | PRK Size | Security Level | Use Case            |
| ------------- | -------- | -------------- | ------------------- |
| SHA-256       | 32 bytes | 128-bit        | NIST Level 1-3 KEMs |
| SHA-384       | 48 bytes | 192-bit        | NIST Level 3-5 KEMs |
| SHA-512       | 64 bytes | 256-bit        | NIST Level 5 KEMs   |

**Recommendation:**

- Match hash function to KEM security level
- Kyber768 (Level 3) → SHA-384
- Kyber1024 (Level 5) → SHA-512
- Never use SHA-1 (broken)

### 7.2 Entropy Preservation

**Question:** Does HKDF-Extract preserve entropy from smaller shared secrets?

**Answer:** Yes, with proper hash function selection.

- **16-byte (128-bit) shared secret** → SHA-256 HKDF → **32-byte PRK**
  - Entropy: min(128 bits, 256 bits) = **128 bits effective entropy**
  - SHA-256's 256-bit output provides **expansion**, not more entropy
- **64-byte (512-bit) shared secret** → SHA-256 HKDF → **32-byte PRK**
  - Entropy: min(512 bits, 256 bits) = **256 bits effective entropy**
  - SHA-256's 256-bit output provides **compression** with minimal loss

**Best Practice:** Use hash function with output size ≥ shared secret entropy.

### 7.3 Hybrid Mode Security

Hybrid shared secret: `classical_ss || pqc_ss`

**Security Properties:**

```
Security(Hybrid) = max(Security(Classical), Security(PQC))
```

**Analysis:**

- If quantum computer breaks PQC: Classical ECDHE still provides ~128 bits
- If classical ECDHE is broken: PQC provides quantum resistance
- Attacker must break BOTH to compromise session

**HKDF on concatenated secret:**

```
Input:  32 bytes (X25519) || 32 bytes (Kyber768) = 64 bytes
HKDF:   64 bytes → 32-byte or 48-byte PRK
Result: Full entropy from both components preserved in PRK
```

---

## 8. Testing and Validation

### 8.1 Test Vectors

Create test vectors for different KEM shared secret sizes:

```
Test Vector 1: FrodoKEM-640
──────────────────────────────
Shared Secret (16 bytes):
  0x00 0x01 0x02 0x03 0x04 0x05 0x06 0x07
  0x08 0x09 0x0a 0x0b 0x0c 0x0d 0x0e 0x0f

HKDF-Extract (SHA-256):
  Salt: (empty)
  IKM: above 16 bytes
  PRK (32 bytes):
  0x8e 0x94 0xf6 0x64 ... [32 bytes total]

Test Vector 2: HQC-256
──────────────────────
Shared Secret (64 bytes):
  [64 bytes of test data]

HKDF-Extract (SHA-256):
  PRK (32 bytes):
  0x... [32 bytes total]

Validation:
───────────
✓ Both produce 32-byte PRK
✓ PRKs are different (based on different inputs)
✓ Subsequent key derivation produces same-sized keys
```

### 8.2 Interoperability Testing

Test OpenSSL implementation against other TLS 1.3 + PQC libraries:

- BoringSSL with PQC
- LibreSSL (if PQC support added)
- wolfSSL with PQC
- OQS-OpenSSL provider

**Verification:**

- Same KEM shared secret → Same PRK → Same session keys
- Cross-library handshake succeeds
- Encrypted data decrypts correctly

---

## 9. References

### 9.1 Standards and RFCs

- **RFC 8446:** The Transport Layer Security (TLS) Protocol Version 1.3
- **RFC 5869:** HMAC-based Extract-and-Expand Key Derivation Function (HKDF)
- **draft-ietf-tls-hybrid-design:** Hybrid key exchange in TLS 1.3
- **NIST SP 800-56C Rev. 2:** Recommendation for Key-Derivation Methods in Key-Establishment Schemes

### 9.2 PQC Algorithm Specifications

- **NIST PQC Round 4:** Selected algorithms (Kyber, Dilithium, Falcon, SPHINCS+)
- **NIST Round 4 Submissions:** FrodoKEM, HQC, Classic McEliece, BIKE
- **ISO/IEC 23837-1:** Information security - CRYSTALS-Kyber

### 9.3 Implementation References

- **OQS-OpenSSL:** https://github.com/open-quantum-safe/openssl

- **Cloudflare PQC Blog:** Post-Quantum TLS implementation experiences

---

## 10. Conclusion

**Key Takeaways:**

1. **TLS 1.3's HKDF-Extract normalizes ALL shared secret sizes** to the hash output size (32, 48, or 64 bytes)

2. **Different PQC KEMs produce different shared secret sizes** (16-64 bytes), but this is NOT a problem

3. **The solution is built into TLS 1.3 by design** - no special handling needed beyond standard HKDF

4. **Hybrid mode simply concatenates classical and PQC shared secrets** before feeding to HKDF

5. **OpenSSL 3.x handles this automatically** via its KEM provider interface

6. **Educational modules should visualize this normalization process** to help users understand the key derivation flow

**For the OpenSSL TLS Testing Module:**

- Display KEM shared secret size alongside PRK size
- Show HKDF-Extract input/output sizes
- Provide side-by-side comparison of different KEMs
- Explain that final session keys are always the same size regardless of KEM choice

---

**Document Metadata:**

- Version: 1.1
- Author: PQC Today Technical Team
- Review Date: Q1 2026
- Related Standards: RFC 8446, RFC 5869, draft-ietf-tls-hybrid-design
- Last Updated: December 13, 2025

---

## 11. Playground KEM Implementation

### 11.1 Overview

The Playground module provides an interactive educational environment for understanding Key Encapsulation Mechanisms (KEMs) in classical, PQC, and hybrid modes. The implementation demonstrates the complete KEM flow with visual separation between encapsulation and decapsulation operations.

### 11.2 UI Structure

The KEM Operations tab (`KemOpsTab.tsx`) is organized into two parallel columns with aligned steps:

#### Left Column: Encapsulation (Sender)

- **Step 1: Select Keys**
  - Primary Public Key (PQC in hybrid mode, any KEM in non-hybrid)
  - Secondary Public Key (Classical in hybrid mode)
  - Hybrid Mode toggle
- **Step 2: Run Operation**
  - "Run Encapsulate" button (manual trigger)
- **Step 3: Ciphertext Output**
  - Hybrid mode: Separate PQC Ciphertext (ML-KEM) + Classical Ciphertext (Ephemeral PK)
  - Non-hybrid: Single ciphertext field
- **Step 4A: Raw Secrets** (Hybrid mode only)
  - PQC Shared Secret (Raw)
  - Classical Shared Secret (Raw)
- **Step 4B: Final Derived Secret**
  - Combination Process visualization (Classical + PQC → HKDF-Extract)
  - Final Derived Secret (after normalization)

#### Right Column: Decapsulation (Receiver)

- **Step 1: Select Keys**
  - Primary Private Key (PQC in hybrid mode, any KEM in non-hybrid)
  - Secondary Private Key (Classical in hybrid mode)
  - Hybrid Mode toggle (synchronized with left)
- **Step 2: Run Operation**
  - "Run Decapsulate" button (manual trigger)
- **Step 3: Ciphertext Input**
  - Hybrid mode: Separate PQC Ciphertext (Input) + Classical Ciphertext (Input)
  - Non-hybrid: Single ciphertext field
  - Auto-populated from left side ciphertext output
- **Step 4A: Raw Recovered Secrets** (Hybrid mode only)
  - PQC Shared Secret (Recovered)
  - Classical Shared Secret (Recovered)
- **Step 4B: Final Derived Secret**
  - Combination Process visualization (Classical + PQC → HKDF-Extract)
  - Final Derived Secret (after normalization)
  - Match/Mismatch indicator

### 11.3 State Management

#### Separate State Variables

**Left Side (Encapsulation):**

- `pqcSharedSecret`: Raw PQC shared secret (before normalization)
- `classicalSharedSecret`: Raw classical shared secret (before normalization)
- `sharedSecret`: Final derived secret (after HKDF normalization)
- `ciphertext`: Generated ciphertext(s)

**Right Side (Decapsulation):**

- `pqcRecoveredSecret`: Recovered PQC shared secret (before normalization)
- `classicalRecoveredSecret`: Recovered classical shared secret (before normalization)
- `decapsulatedSecret`: Final derived secret (after HKDF normalization)
- `kemDecapsulationResult`: Boolean indicating if secrets match

#### State Clearing Rules

When "Run Encapsulate" is clicked:

- Clear all right-side states: `decapsulatedSecret`, `pqcRecoveredSecret`, `classicalRecoveredSecret`, `kemDecapsulationResult`
- This ensures the right side remains empty until "Run Decapsulate" is explicitly clicked

When "Run Decapsulate" is clicked:

- Populate right-side states with recovered values
- Compare `decapsulatedSecret` with `sharedSecret` to verify correctness

### 11.4 Hybrid Mode Features

#### Key Derivation Methods

Users can select between two methods via the "Key Derivation" selector:

1. **HKDF-Extract (Normalized)** (Default)
   - Applies SHA-256 HKDF-Extract to normalize secrets
   - Used in all modes (classical, PQC, hybrid)
   - Output: 32 bytes (256 bits) regardless of input size

2. **Raw (No Normalization)**
   - Uses raw concatenated secrets without HKDF
   - For educational comparison only
   - Output: Variable size based on algorithm

#### Hybrid Secret Combination

In hybrid mode with HKDF enabled:

```
Classical Secret (32 bytes) + PQC Secret (32 bytes)
           ↓
    Concatenate (64 bytes)
           ↓
    HKDF-Extract (SHA-256)
           ↓
    Final Derived Secret (32 bytes)
```

#### Ciphertext Handling

**Hybrid Mode:**

- Internally stored as: `PQC_CT|CLASSICAL_CT` (pipe-separated)
- UI displays: Two separate fields for clarity
- Encapsulate side: "PQC Ciphertext (ML-KEM)" + "Classical Ciphertext (Ephemeral PK)"
- Decapsulate side: "PQC Ciphertext (Input)" + "Classical Ciphertext (Input)"

**Non-Hybrid Mode:**

- Single ciphertext field
- Label: "Ciphertext (Send to Receiver)" / "Ciphertext (Input)"

### 11.5 Educational Flow

The implementation is designed to teach users the complete KEM process:

1. **Key Selection**: Choose appropriate public/private keys
2. **Encapsulation**: Generate shared secret and ciphertext
3. **Ciphertext Transmission**: Visualize ciphertext transfer (auto-populated)
4. **Decapsulation**: Recover shared secret from ciphertext
5. **Verification**: Compare generated vs recovered secrets
6. **Secret Derivation**: Understand HKDF normalization process

#### Visual Comparison

The parallel column layout enables users to:

- See raw secrets side-by-side (generated vs recovered)
- Verify the combination process is identical on both sides
- Confirm final derived secrets match
- Understand the role of HKDF in normalizing variable-sized secrets

### 11.6 Implementation Details

#### File Structure

- **UI Component**: `src/components/Playground/tabs/KemOpsTab.tsx`
- **Logic Hook**: `src/components/Playground/hooks/useKemOperations.ts`
- **Context**: `src/components/Playground/contexts/OperationsProvider.tsx`
- **Types**: `src/components/Playground/contexts/types.ts`

#### Key Functions

**`useKemOperations.ts`:**

- `runKemOperation(type: 'encapsulate' | 'decapsulate')`: Main operation handler
- Supports classical (WebCrypto), PQC (WASM), and hybrid modes
- Handles HKDF normalization when `hybridMethod === 'concat-hkdf'`
- Manages state updates for both sides independently

**Classical KEM (WebCrypto):**

- Algorithms: X25519, P-256
- Uses `crypto.subtle.generateKey()` and `crypto.subtle.deriveBits()`

**PQC KEM (WASM via OpenSSL OQS Provider):**

- Algorithms: ML-KEM-512, ML-KEM-768, ML-KEM-1024
- Uses `MLKEM.encapsulateBits()` and `MLKEM.decapsulateBits()` (Adapter pattern wrapping OpenSSL)

**Hybrid KEM:**

- Combines classical + PQC operations
- Concatenates shared secrets
- Applies HKDF-Extract for normalization
- Splits ciphertexts for separate display

### 11.7 User Workflow Example

**Hybrid Mode with HKDF:**

1. **Setup (Both Sides)**
   - Enable "Hybrid Mode" toggle
   - Left: Select PQC Public Key + Classical Public Key
   - Right: Select corresponding Private Keys

2. **Encapsulation (Left Side)**
   - Click "Run Encapsulate"
   - Step 3: PQC and Classical ciphertexts appear
   - Step 4A: Raw PQC (32B) + Classical (32B) secrets shown
   - Step 4B: Combination visualization + Final secret (32B) shown

3. **Decapsulation (Right Side)**
   - Step 3: Ciphertexts auto-populated from left
   - Click "Run Decapsulate"
   - Step 4A: Recovered PQC (32B) + Classical (32B) secrets appear
   - Step 4B: Combination visualization + Final secret (32B) shown
   - Match indicator: "✓ MATCH" (green) or "✗ MISMATCH" (red)

4. **Verification**
   - Compare left vs right raw secrets (should match)
   - Compare left vs right final secrets (should match)
   - Observe HKDF normalization process

### 11.8 Security Considerations

**Educational vs Production:**

- This implementation is for educational purposes
- Production TLS implementations should use OpenSSL's built-in KEM providers
- Raw secret display is for learning - never expose secrets in production

**Hybrid Mode Security:**

- Provides quantum-safe security even if classical algorithm is broken
- Maintains classical security if PQC algorithm is broken
- HKDF ensures proper key derivation from combined secrets

### 11.9 Future Enhancements

**Planned Features:**

- Support for additional PQC KEMs (FrodoKEM, HQC, Classic McEliece)
- Visualization of TLS 1.3 handshake using derived secrets
- Performance metrics comparison (classical vs PQC vs hybrid)
- Export/import of KEM parameters for testing

**Testing Integration:**

- Automated E2E tests for all KEM modes
- Cross-validation with OpenSSL 3.x KEM operations
- Interoperability testing with other PQC implementations

---
