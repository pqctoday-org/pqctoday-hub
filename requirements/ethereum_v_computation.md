# Ethereum Signature v Parameter Computation with OpenSSL

## Overview

This document explains how to create Ethereum-compatible signatures using OpenSSL 3.5.4's standard ECDSA signing functions and compute the required `v` (recovery) parameter.

## Background

### Standard ECDSA vs Ethereum ECDSA

**Standard ECDSA (OpenSSL output):**

- Produces: `(r, s)` signature components
- Requires public key for verification

**Ethereum ECDSA:**

- Produces: `(r, s, v)` signature components
- The `v` parameter enables public key recovery from the signature
- Ethereum derives the sender's address from the recovered public key

### The Challenge

OpenSSL's standard ECDSA signing doesn't preserve the recovery information needed for `v`. This document shows how to compute `v` as a post-processing step.

---

## Prerequisites

- OpenSSL 3.5.4 (or compatible version with secp256k1 support)
- Transaction data prepared for signing
- Your secp256k1 private and public keys

---

## Step-by-Step Process

### Step 1: Prepare the Transaction Hash

**Pre-EIP-155 (Legacy):**

```
Transaction fields to hash:
[nonce, gasPrice, gasLimit, to, value, data]

Hash using Keccak-256 (NOT SHA-256)
```

**EIP-155 (Replay Protection):**

```
Transaction fields to hash:
[nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]

Hash using Keccak-256
```

**Important:** OpenSSL doesn't support Keccak-256 natively. Use an external library (e.g., `libkeccak`, `sha3sum`, or language-specific crypto libraries).

### Step 2: Sign with OpenSSL

Use OpenSSL's ECDSA signing with secp256k1 curve:

```
Input: 32-byte Keccak-256 hash of transaction
Curve: secp256k1
Output: (r, s) signature components
```

**Key points:**

- `r` and `s` are 32-byte values each
- These are standard ECDSA signature components
- No `v` parameter is produced yet

### Step 3: Compute the Recovery Parameter (v)

The recovery ID is fundamentally either **0 or 1**. You determine which by testing:

**Algorithm:**

```
1. For recovery_id in [0, 1]:

   a. Perform ECDSA public key recovery:
      - Input: (r, s, recovery_id, message_hash)
      - Output: recovered_public_key

   b. Compare recovered_public_key with your actual public key

   c. If match found:
      - This recovery_id is correct
      - Proceed to Step 4 with this value
      - Stop iteration

2. If no match found (rare):
   - Signature may be invalid
   - Retry signing process
```

**Implementation note:** Most ECDSA libraries provide a public key recovery function. If not available, you'll need to implement the recovery algorithm based on the secp256k1 curve parameters.

### Step 4: Encode v Parameter

Once you have the correct recovery_id (0 or 1), encode it based on transaction type:

#### Pre-EIP-155 (Legacy) Encoding

```
v = recovery_id + 27

Possible values:
- recovery_id = 0 → v = 27
- recovery_id = 1 → v = 28
```

#### EIP-155 Encoding (Recommended)

```
v = (chainId * 2) + 35 + recovery_id

Examples:
- Ethereum Mainnet (chainId = 1):
  - recovery_id = 0 → v = 37
  - recovery_id = 1 → v = 38

- Sepolia Testnet (chainId = 11155111):
  - recovery_id = 0 → v = 22310257
  - recovery_id = 1 → v = 22310258
```

### Step 5: Construct Final Signature

Your Ethereum-compatible signature is now:

```
Signature = (r, s, v)

Where:
- r: 32 bytes (from OpenSSL)
- s: 32 bytes (from OpenSSL)
- v: 1-4 bytes (computed value)
```

---

## Complete Workflow Summary

```
┌─────────────────────────────────────┐
│ 1. Prepare Transaction Data         │
│    - Serialize fields (RLP encoding)│
│    - Include chainId for EIP-155    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Hash with Keccak-256             │
│    (External library required)      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Sign with OpenSSL                │
│    - Curve: secp256k1               │
│    - Output: (r, s)                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Determine recovery_id            │
│    - Try recovery_id = 0            │
│    - Recover public key             │
│    - Compare with actual public key │
│    - If no match, try recovery_id=1 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. Encode v parameter               │
│    Pre-EIP-155: v = recovery_id+27  │
│    EIP-155: v = chainId*2+35+rec_id │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 6. Final Signature (r, s, v)        │
│    Ready for Ethereum broadcast     │
└─────────────────────────────────────┘
```

---

## Important Notes

### Keccak-256 Hashing

- OpenSSL uses SHA family (SHA-256, SHA-3, etc.)
- Ethereum uses **Keccak-256** (original Keccak, not NIST SHA-3)
- You must use an external library for correct hashing
- Using wrong hash function will result in invalid signatures

### Recovery ID Edge Cases

- In theory, there can be 4 possible recovery values (0, 1, 2, 3)
- In practice with secp256k1, it's almost always just 2 values (0 or 1)
- Always test both 0 and 1; if neither works, signature generation failed

### Chain ID Values

Common Ethereum networks:

- Mainnet: 1
- Sepolia: 11155111
- Goerli (deprecated): 5
- Polygon: 137
- Arbitrum One: 42161
- Optimism: 10

### Security Considerations

- Never reuse the same `k` value (nonce) for different signatures
- OpenSSL handles this automatically with proper random number generation
- Ensure your OpenSSL is properly configured with secure entropy source

---

## Why This Process Is Necessary

**Standard cryptographic tools (OpenSSL, PKCS#11):**

- Built for traditional verification model (signature + public key)
- Don't preserve recovery information
- Follow standard ECDSA specifications

**Ethereum's design:**

- Optimized for space efficiency (no public key in transactions)
- Derives sender address from signature
- Requires recovery parameter

**The bridge:** This post-processing step to compute `v` allows you to use battle-tested, standard cryptographic libraries while producing Ethereum-compatible signatures.

---

## Verification

To verify your signature is correct:

1. Use an Ethereum library to recover the public key from `(r, s, v)`
2. Derive the Ethereum address from the recovered public key
3. Confirm it matches your expected sender address

If verification fails:

- Check Keccak-256 implementation
- Verify correct recovery_id was used
- Ensure proper v encoding for your chain
- Confirm transaction data was serialized correctly

---

## References

- EIP-155: Simple replay attack protection - https://eips.ethereum.org/EIPS/eip-155
- secp256k1 curve parameters - https://www.secg.org/sec2-v2.pdf
- ECDSA signature recovery algorithm - SEC 1 v2.0 Section 4.1.6
- Ethereum Yellow Paper - Appendix F (Signing Transactions)

---

## Summary

Using OpenSSL for Ethereum signing is feasible with this approach:

1. OpenSSL performs standard ECDSA signing → `(r, s)`
2. You test 2 recovery values to find correct `v`
3. Encode `v` based on pre-EIP-155 or EIP-155 format
4. Result: Ethereum-compatible signature `(r, s, v)`

The computational overhead is minimal (2 public key recovery operations), making this practical for production use.
