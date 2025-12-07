# Digital Assets Cryptographic Implementation Plan

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-06

## Educational Guide: Bitcoin, Ethereum, and Solana

### OpenSSL 3.5.4 + JavaScript/WebAssembly Hybrid Approach

---

## Document Overview

This consolidated implementation plan provides a complete hands-on educational guide for understanding digital asset cryptographic operations. It combines:

1. **OpenSSL 3.5.4 commands** for operations natively supported
2. **JavaScript/WebAssembly libraries** for operations not supported by OpenSSL
3. **Complete working examples** for Bitcoin, Ethereum, and Solana

---

## Table of Contents

1. [Architecture Overview](#part-1-architecture-overview)
2. [Environment Setup](#part-2-environment-setup)
3. [Bitcoin Implementation](#part-3-bitcoin-implementation)
4. [Ethereum Implementation](#part-4-ethereum-implementation)
5. [Solana Implementation](#part-5-solana-implementation)
6. [HD Wallet Implementation](#part-6-hd-wallet-implementation)
7. [Cross-Chain Comparison](#part-7-cross-chain-comparison)
8. [Complete Working Scripts](#part-8-complete-working-scripts)
9. [Security Considerations](#part-9-security-considerations)

---

## Part 1: Architecture Overview

### 1.1 Blockchain Cryptographic Requirements

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BLOCKCHAIN CRYPTOGRAPHIC REQUIREMENTS                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Blockchain     Curve         Signature    Address Derivation               ║
║   ─────────────────────────────────────────────────────────────────────────  ║
║   Bitcoin        secp256k1     ECDSA        SHA256 → RIPEMD160 → Base58Check ║
║   Ethereum       secp256k1     ECDSA        Keccak-256 → Last 20 bytes → Hex ║
║   Solana         Ed25519       EdDSA        Public Key → Base58              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 1.2 OpenSSL 3.5.4 Support Matrix

| Operation              | Bitcoin | Ethereum | Solana | OpenSSL Support | Alternative        |
| ---------------------- | ------- | -------- | ------ | --------------- | ------------------ |
| secp256k1 keygen       | ✅      | ✅       | -      | ✅ **Yes**      | `@noble/curves`    |
| Ed25519 keygen         | -       | -        | ✅     | ✅ **Yes**      | `@noble/curves`    |
| ECDSA signing          | ✅      | ✅       | -      | ✅ **Yes**      | `@noble/curves`    |
| EdDSA signing          | -       | -        | ✅     | ✅ **Yes**      | `@noble/curves`    |
| SHA-256                | ✅      | ✅       | ✅     | ✅ **Yes**      | `@noble/hashes`    |
| SHA-512                | ✅      | -        | -      | ✅ **Yes**      | `@noble/hashes`    |
| RIPEMD-160             | ✅      | -        | -      | ✅ **Yes**      | `@noble/hashes`    |
| HMAC-SHA512            | ✅      | ✅       | ✅     | ✅ **Yes**      | `@noble/hashes`    |
| **Keccak-256**         | -       | ✅       | -      | ❌ **NO**       | `@noble/hashes`    |
| **Base58**             | ✅      | -        | ✅     | ❌ **NO**       | `@scure/base`      |
| **Base58Check**        | ✅      | -        | -      | ❌ **NO**       | `@scure/base`      |
| **BIP32 HD**           | ✅      | ✅       | -      | ❌ **NO**       | `@scure/bip32`     |
| **BIP39 Mnemonic**     | ✅      | ✅       | ✅     | ❌ **NO**       | `@scure/bip39`     |
| **SLIP-0010 HD**       | -       | -        | ✅     | ❌ **NO**       | `ed25519-hd-key`   |
| **RLP Encoding**       | -       | ✅       | -      | ❌ **NO**       | `micro-eth-signer` |
| **Recovery Param (v)** | -       | ✅       | -      | ❌ **NO**       | `@noble/curves`    |
| **WASM Hashing**       | ✅      | ✅       | ✅     | ✅ **Yes**      | `hash-wasm`        |

### 1.3 Implementation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HYBRID IMPLEMENTATION STRATEGY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        OpenSSL 3.5.4 Layer                          │   │
│   │  ✅ Key Generation (secp256k1, Ed25519)                             │   │
│   │  ✅ Basic Hashing (SHA-256, SHA-512, RIPEMD-160)                    │   │
│   │  ✅ HMAC Operations                                                 │   │
│   │  ✅ Digital Signatures (ECDSA, EdDSA)                               │   │
│   │  ✅ Signature Verification                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     JavaScript/WASM Layer                           │   │
│   │  ⚠️  Keccak-256 (Ethereum addresses)                                │   │
│   │  ⚠️  Base58/Base58Check encoding                                    │   │
│   │  ⚠️  BIP32/39/44 HD derivation                                      │   │
│   │  ⚠️  SLIP-0010 Ed25519 derivation                                   │   │
│   │  ⚠️  RLP encoding                                                   │   │
│   │  ⚠️  ECDSA recovery parameter                                       │   │
│   │  ⚠️  Transaction serialization                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Environment Setup

### 2.1 OpenSSL Verification

```bash
# Verify OpenSSL version
openssl version
# Expected: OpenSSL 3.5.4 or higher

# Verify secp256k1 support
openssl ecparam -list_curves | grep secp256k1

# Verify Ed25519 support
openssl genpkey -algorithm Ed25519 -out /dev/null 2>&1 && echo "Ed25519 supported"

# Create working directory
mkdir -p ~/crypto_education && cd ~/crypto_education
```

### 2.2 Node.js Environment Setup

```bash
# Initialize Node.js project
npm init -y

# Install Noble/Scure ecosystem (audited, minimal dependencies)
npm install @noble/hashes @noble/curves @scure/base @scure/bip32 @scure/bip39

# Install blockchain-specific libraries
npm install ed25519-hd-key micro-eth-signer

# Optional: WebAssembly high-performance hashing
npm install hash-wasm
```

### 2.3 Package.json Configuration

```json
{
  "name": "crypto-education",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "bitcoin": "node bitcoin_flow.js",
    "ethereum": "node ethereum_flow.js",
    "solana": "node solana_flow.js",
    "hd-wallet": "node hd_wallet_flow.js"
  },
  "dependencies": {
    "@noble/hashes": "^1.3.0",
    "@noble/curves": "^1.3.0",
    "@scure/base": "^1.1.0",
    "@scure/bip32": "^1.3.0",
    "@scure/bip39": "^1.2.0",
    "ed25519-hd-key": "^1.3.0",
    "micro-eth-signer": "^0.8.0",
    "hash-wasm": "^4.12.0"
  }
}
```

---

## Part 3: Bitcoin Implementation

### 3.1 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BITCOIN KEY & TRANSACTION FLOW                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    OpenSSL     ┌──────────────┐    OpenSSL              │
│   │   Entropy    │───────────────▶│ Private Key  │───────────────▶         │
│   │  (256 bits)  │   ecparam      │ (secp256k1)  │   ec -pubout           │
│   └──────────────┘                └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │ Public Key   │                         │
│                                   │(compressed)  │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                          ┌───────────────┼───────────────┐                 │
│                          ▼               ▼               ▼                 │
│                    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│       OpenSSL───▶  │ SHA-256  │    │ SHA-256  │    │  Bech32  │ ◀──JS    │
│                    └──────────┘    └──────────┘    └──────────┘           │
│                          │               │               │                 │
│                          ▼               │               ▼                 │
│                    ┌──────────┐          │         ┌──────────┐           │
│       OpenSSL───▶  │RIPEMD160 │          │         │ SegWit   │           │
│                    └──────────┘          │         │ Address  │           │
│                          │               │         │ (bc1...) │           │
│                          ▼               │         └──────────┘           │
│                    ┌──────────┐          │                                 │
│          JS ───▶   │Base58Chk │          │                                 │
│                    └──────────┘          │                                 │
│                          │               │                                  │
│                          ▼               ▼                                  │
│                    ┌──────────┐    ┌──────────┐                            │
│                    │  Legacy  │    │  Sign    │◀─── OpenSSL                │
│                    │ Address  │    │ (ECDSA)  │                            │
│                    │ (1.....)│    └──────────┘                            │
│                    └──────────┘                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Step-by-Step: Direct Key Generation

#### Step 1: Generate Private Key (OpenSSL)

```bash
# Generate secp256k1 private key for User A
openssl ecparam -name secp256k1 -genkey -noout -out userA_btc_private.pem

# View private key details
openssl ec -in userA_btc_private.pem -text -noout

# Extract raw private key (32 bytes hex)
openssl ec -in userA_btc_private.pem -text -noout 2>/dev/null | \
  grep -A 3 "priv:" | tail -3 | tr -d ' :\n'
```

#### Step 2: Derive Public Key (OpenSSL)

```bash
# Extract public key
openssl ec -in userA_btc_private.pem -pubout -out userA_btc_public.pem

# Export as DER for processing
openssl ec -in userA_btc_private.pem -pubout -outform DER -out userA_btc_public.der

# View raw public key bytes
xxd -p userA_btc_public.der
```

#### Step 3: Hash Public Key (OpenSSL)

```bash
# SHA256 of public key
openssl dgst -sha256 -binary userA_btc_public.der > userA_sha256.bin

# RIPEMD160 of SHA256 result (Hash160)
openssl dgst -ripemd160 -binary userA_sha256.bin > userA_hash160.bin

# View Hash160 (20 bytes - this is the pubkey hash)
xxd -p userA_hash160.bin
```

#### Step 4: Encode Address (JavaScript Required)

```javascript
// bitcoin_address.js
import { sha256 } from '@noble/hashes/sha256'
import { createBase58check, bech32 } from '@scure/base'
import { readFileSync } from 'fs'

// Read Hash160 from OpenSSL output
const hash160 = readFileSync('userA_hash160.bin')

// Create Base58Check encoder with SHA256
const base58check = createBase58check(sha256)

// Legacy P2PKH Address (starts with 1)
const versionByte = Buffer.from([0x00]) // Mainnet
const legacyAddress = base58check.encode(Buffer.concat([versionByte, hash160]))
console.log('Legacy Address:', legacyAddress)

// SegWit P2WPKH Address (starts with bc1)
const words = bech32.toWords(hash160)
const segwitAddress = bech32.encode('bc', [0x00, ...words])
console.log('SegWit Address:', segwitAddress)
```

#### Step 5: Sign Transaction (OpenSSL)

```bash
# Create transaction data
cat > btc_transaction.txt << 'EOF'
Bitcoin Transaction
From: UserA
To: UserB
Amount: 0.5 BTC
Fee: 0.0001 BTC
EOF

# Double SHA256 (Bitcoin's standard)
openssl dgst -sha256 -binary btc_transaction.txt > btc_hash1.bin
openssl dgst -sha256 -binary btc_hash1.bin > btc_sighash.bin

# Sign with ECDSA
openssl pkeyutl -sign \
  -inkey userA_btc_private.pem \
  -in btc_sighash.bin \
  -out btc_signature.der

# View DER-encoded signature
xxd -p btc_signature.der
```

#### Step 6: Verify Signature (OpenSSL)

```bash
# Verify signature
openssl pkeyutl -verify \
  -pubin -inkey userA_btc_public.pem \
  -in btc_sighash.bin \
  -sigfile btc_signature.der

# Expected: "Signature Verified Successfully"
```

### 3.3 Complete Bitcoin Script (Hybrid)

```javascript
// bitcoin_flow.js
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { sha256 } from '@noble/hashes/sha256'
import { createBase58check, bech32 } from '@scure/base'

console.log('═══════════════════════════════════════════════════════════════')
console.log('              BITCOIN CRYPTOGRAPHIC FLOW                        ')
console.log('═══════════════════════════════════════════════════════════════\n')

// ========== USER A (SENDER) ==========
console.log('>>> USER A (Sender) <<<\n')

// Step 1: Generate private key (OpenSSL)
console.log('Step 1: Generating secp256k1 private key...')
execSync('openssl ecparam -name secp256k1 -genkey -noout -out userA_btc.pem')

// Step 2: Extract public key (OpenSSL)
console.log('Step 2: Deriving public key...')
execSync('openssl ec -in userA_btc.pem -pubout -outform DER -out userA_btc_pub.der 2>/dev/null')

// Step 3: Hash public key (OpenSSL)
console.log('Step 3: Computing Hash160 (SHA256 → RIPEMD160)...')
execSync(
  'openssl dgst -sha256 -binary userA_btc_pub.der | openssl dgst -ripemd160 -binary > userA_hash160.bin'
)

// Step 4: Generate addresses (JavaScript)
console.log('Step 4: Generating addresses (JavaScript)...')
const hash160A = readFileSync('userA_hash160.bin')
const base58check = createBase58check(sha256)

const legacyA = base58check.encode(Buffer.concat([Buffer.from([0x00]), hash160A]))
const segwitWordsA = bech32.toWords(hash160A)
const segwitA = bech32.encode('bc', [0x00, ...segwitWordsA])

console.log(`   Legacy Address:  ${legacyA}`)
console.log(`   SegWit Address:  ${segwitA}\n`)

// ========== USER B (RECEIVER) ==========
console.log('>>> USER B (Receiver) <<<\n')

execSync('openssl ecparam -name secp256k1 -genkey -noout -out userB_btc.pem')
execSync('openssl ec -in userB_btc.pem -pubout -outform DER -out userB_btc_pub.der 2>/dev/null')
execSync(
  'openssl dgst -sha256 -binary userB_btc_pub.der | openssl dgst -ripemd160 -binary > userB_hash160.bin'
)

const hash160B = readFileSync('userB_hash160.bin')
const legacyB = base58check.encode(Buffer.concat([Buffer.from([0x00]), hash160B]))
console.log(`   Legacy Address:  ${legacyB}\n`)

// ========== TRANSACTION SIGNING ==========
console.log('>>> TRANSACTION SIGNING <<<\n')

// Create transaction data
const txData = `Transfer 0.5 BTC from ${legacyA} to ${legacyB}`
writeFileSync('btc_tx.txt', txData)
console.log(`Step 5: Transaction: "${txData}"`)

// Double SHA256 (OpenSSL)
console.log('Step 6: Computing double SHA256 (sighash)...')
execSync('openssl dgst -sha256 -binary btc_tx.txt | openssl dgst -sha256 -binary > btc_sighash.bin')

// Sign (OpenSSL)
console.log('Step 7: Signing with ECDSA...')
execSync('openssl pkeyutl -sign -inkey userA_btc.pem -in btc_sighash.bin -out btc_sig.der')

// Verify (OpenSSL)
console.log('Step 8: Verifying signature...')
execSync('openssl ec -in userA_btc.pem -pubout -out userA_btc_pub.pem 2>/dev/null')
const verifyResult = execSync(
  'openssl pkeyutl -verify -pubin -inkey userA_btc_pub.pem -in btc_sighash.bin -sigfile btc_sig.der 2>&1'
).toString()
console.log(`   Result: ${verifyResult.trim()}`)

console.log('\n═══════════════════════════════════════════════════════════════')
console.log('              BITCOIN FLOW COMPLETE                             ')
console.log('═══════════════════════════════════════════════════════════════')
```

---

## Part 4: Ethereum Implementation

### 4.1 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ETHEREUM KEY & TRANSACTION FLOW                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    OpenSSL     ┌──────────────┐    OpenSSL              │
│   │   Entropy    │───────────────▶│ Private Key  │───────────────▶         │
│   │  (256 bits)  │   ecparam      │ (secp256k1)  │   ec -pubout           │
│   └──────────────┘                └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │ Public Key   │                         │
│                                   │(uncompressed)│                         │
│                                   │  64 bytes    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│              ⚠️ JS REQUIRED ───▶  │ Keccak-256   │  ◀─── NOT in OpenSSL   │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │ Last 20 bytes│                         │
│                                   │  = Address   │                         │
│                                   │  (0x....)    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                          ┌───────────────┴───────────────┐                 │
│                          ▼                               ▼                 │
│                    ┌──────────────┐              ┌──────────────┐          │
│     ⚠️ JS ────▶    │ RLP Encode   │              │ Keccak-256   │ ◀── JS  │
│                    │ Transaction  │              │  Tx Hash     │          │
│                    └──────────────┘              └──────────────┘          │
│                                                        │                   │
│                                                        ▼                   │
│                                                  ┌──────────────┐          │
│                                   ⚠️ JS ────▶    │ Sign (ECDSA) │          │
│                                                  │ + Recovery v │          │
│                                                  └──────────────┘          │
│                                                                             │
│   Legend: ⚠️ = JavaScript required (not supported by OpenSSL)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Critical Limitation: Keccak-256 ≠ SHA3-256

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ⚠️  CRITICAL: OpenSSL SHA3 vs Keccak                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   OpenSSL's SHA3-256 is NOT compatible with Ethereum's Keccak-256!          ║
║                                                                              ║
║   • Keccak-256 was the SHA3 candidate (pre-standardization)                 ║
║   • NIST SHA3-256 uses different padding than original Keccak               ║
║   • Ethereum uses the original Keccak-256, not NIST SHA3-256                ║
║                                                                              ║
║   Test vector for "hello":                                                   ║
║   • Keccak-256: 1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7... ║
║   • SHA3-256:   3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202... ║
║                                                                              ║
║   SOLUTION: Use @noble/hashes or hash-wasm for Ethereum operations          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 4.3 Step-by-Step: Direct Key Generation

#### Step 1: Generate Private Key (OpenSSL)

```bash
# Generate secp256k1 private key
openssl ecparam -name secp256k1 -genkey -noout -out userA_eth_private.pem

# Extract raw 32-byte private key
openssl ec -in userA_eth_private.pem -text -noout 2>/dev/null | \
  grep -A 3 "priv:" | tail -3 | tr -d ' :\n' | cut -c1-64
```

#### Step 2: Extract Uncompressed Public Key (OpenSSL)

```bash
# Export public key as DER
openssl ec -in userA_eth_private.pem -pubout -outform DER -out userA_eth_pub.der 2>/dev/null

# Extract 64-byte uncompressed public key (remove DER header and 0x04 prefix)
# The last 65 bytes are: 04 || X (32 bytes) || Y (32 bytes)
# We need just X || Y (64 bytes)
tail -c 65 userA_eth_pub.der | tail -c 64 > userA_eth_pubkey_raw.bin
xxd -p userA_eth_pubkey_raw.bin | tr -d '\n'
```

#### Step 3: Derive Address (JavaScript Required)

```javascript
// ethereum_address.js
import { keccak_256 } from '@noble/hashes/sha3'
import { readFileSync } from 'fs'

// Read raw 64-byte public key from OpenSSL output
const publicKey = readFileSync('userA_eth_pubkey_raw.bin')

// Keccak-256 hash
const hash = keccak_256(publicKey)

// Take last 20 bytes
const addressBytes = hash.slice(-20)

// Convert to checksummed address (EIP-55)
const addressHex = Buffer.from(addressBytes).toString('hex')
const addressHash = Buffer.from(keccak_256(addressHex)).toString('hex')

let checksumAddress = '0x'
for (let i = 0; i < 40; i++) {
  if (parseInt(addressHash[i], 16) >= 8) {
    checksumAddress += addressHex[i].toUpperCase()
  } else {
    checksumAddress += addressHex[i].toLowerCase()
  }
}

console.log('Ethereum Address:', checksumAddress)
```

#### Step 4: Sign Transaction (JavaScript Required)

```javascript
// ethereum_sign.js
import { secp256k1 } from '@noble/curves/secp256k1'
import { keccak_256 } from '@noble/hashes/sha3'
import { RLP } from 'micro-eth-signer/rlp.js'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// Extract private key from PEM
const pemContent = readFileSync('userA_eth_private.pem', 'utf8')
const privateKeyHex = execSync(
  "openssl ec -in userA_eth_private.pem -text -noout 2>/dev/null | grep -A 3 'priv:' | tail -3 | tr -d ' :\\n'"
)
  .toString()
  .trim()
  .slice(0, 64)
const privateKey = Buffer.from(privateKeyHex, 'hex')

// Create EIP-1559 transaction
const tx = {
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 2000000000n, // 2 gwei
  maxFeePerGas: 50000000000n, // 50 gwei
  gasLimit: 21000n,
  to: Buffer.from('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'hex'),
  value: 1000000000000000000n, // 1 ETH
  data: Buffer.alloc(0),
  accessList: [],
}

// RLP encode for signing
const txType = 0x02
const encoded = RLP.encode([
  tx.chainId,
  tx.nonce,
  tx.maxPriorityFeePerGas,
  tx.maxFeePerGas,
  tx.gasLimit,
  tx.to,
  tx.value,
  tx.data,
  tx.accessList,
])
const txForSigning = Buffer.concat([Buffer.from([txType]), encoded])

// Keccak-256 hash
const txHash = keccak_256(txForSigning)

// Sign with recovery
const signature = secp256k1.sign(txHash, privateKey, { lowS: true })

console.log('Transaction Hash:', Buffer.from(txHash).toString('hex'))
console.log('Signature r:', signature.r.toString(16).padStart(64, '0'))
console.log('Signature s:', signature.s.toString(16).padStart(64, '0'))
console.log('Recovery v:', signature.recovery)
```

### 4.4 Complete Ethereum Script (JavaScript-Heavy)

```javascript
// ethereum_flow.js
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { secp256k1 } from '@noble/curves/secp256k1'
import { keccak_256 } from '@noble/hashes/sha3'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

console.log('═══════════════════════════════════════════════════════════════')
console.log('              ETHEREUM CRYPTOGRAPHIC FLOW                       ')
console.log('═══════════════════════════════════════════════════════════════\n')

// Helper: Get checksummed address
function toChecksumAddress(address) {
  const addr = address.toLowerCase().replace('0x', '')
  const hash = bytesToHex(keccak_256(addr))
  let result = '0x'
  for (let i = 0; i < 40; i++) {
    result += parseInt(hash[i], 16) >= 8 ? addr[i].toUpperCase() : addr[i]
  }
  return result
}

// Helper: Extract private key from OpenSSL PEM
function extractPrivateKey(pemFile) {
  const output = execSync(
    `openssl ec -in ${pemFile} -text -noout 2>/dev/null | grep -A 3 'priv:' | tail -3 | tr -d ' :\\n'`
  )
    .toString()
    .trim()
  return hexToBytes(output.slice(0, 64))
}

// ========== USER A (SENDER) ==========
console.log('>>> USER A (Sender) <<<\n')

// Step 1: Generate private key (OpenSSL)
console.log('Step 1: Generating secp256k1 private key (OpenSSL)...')
execSync('openssl ecparam -name secp256k1 -genkey -noout -out userA_eth.pem')

// Step 2: Extract private key and derive public key (JS for uncompressed)
console.log('Step 2: Deriving uncompressed public key...')
const privKeyA = extractPrivateKey('userA_eth.pem')
const pubKeyA = secp256k1.getPublicKey(privKeyA, false).slice(1) // Remove 04 prefix

// Step 3: Derive address using Keccak-256 (JS Required)
console.log('Step 3: Deriving address using Keccak-256 (JavaScript)...')
const hashA = keccak_256(pubKeyA)
const addressA = toChecksumAddress(bytesToHex(hashA.slice(-20)))
console.log(`   Address: ${addressA}\n`)

// ========== USER B (RECEIVER) ==========
console.log('>>> USER B (Receiver) <<<\n')

execSync('openssl ecparam -name secp256k1 -genkey -noout -out userB_eth.pem')
const privKeyB = extractPrivateKey('userB_eth.pem')
const pubKeyB = secp256k1.getPublicKey(privKeyB, false).slice(1)
const hashB = keccak_256(pubKeyB)
const addressB = toChecksumAddress(bytesToHex(hashB.slice(-20)))
console.log(`   Address: ${addressB}\n`)

// ========== TRANSACTION SIGNING ==========
console.log('>>> TRANSACTION SIGNING <<<\n')

// Step 4: Create transaction message
const txMessage = `Transfer 1.5 ETH from ${addressA} to ${addressB}`
console.log(`Step 4: Transaction: "${txMessage}"`)

// Step 5: Hash with Keccak-256 (JS Required)
console.log('Step 5: Computing Keccak-256 hash (JavaScript)...')
const messageBytes = new TextEncoder().encode(txMessage)
const txHash = keccak_256(messageBytes)
console.log(`   Hash: 0x${bytesToHex(txHash)}`)

// Step 6: Sign with ECDSA + recovery (JS Required for v)
console.log('Step 6: Signing with ECDSA (JavaScript for recovery param)...')
const signature = secp256k1.sign(txHash, privKeyA, { lowS: true })
console.log(`   r: 0x${signature.r.toString(16).padStart(64, '0')}`)
console.log(`   s: 0x${signature.s.toString(16).padStart(64, '0')}`)
console.log(`   v: ${signature.recovery + 27}`)

// Step 7: Verify signature
console.log('Step 7: Verifying signature...')
const isValid = secp256k1.verify(signature, txHash, secp256k1.getPublicKey(privKeyA))
console.log(`   Valid: ${isValid}`)

// Step 8: Recover public key from signature
console.log('Step 8: Recovering public key from signature...')
const recoveredPubKey = signature.recoverPublicKey(txHash).toRawBytes(false).slice(1)
const recoveredHash = keccak_256(recoveredPubKey)
const recoveredAddress = toChecksumAddress(bytesToHex(recoveredHash.slice(-20)))
console.log(`   Recovered Address: ${recoveredAddress}`)
console.log(`   Matches Sender: ${recoveredAddress === addressA}`)

console.log('\n═══════════════════════════════════════════════════════════════')
console.log('              ETHEREUM FLOW COMPLETE                            ')
console.log('═══════════════════════════════════════════════════════════════')
```

---

## Part 5: Solana Implementation

### 5.1 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOLANA KEY & TRANSACTION FLOW                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    OpenSSL     ┌──────────────┐    OpenSSL              │
│   │   Entropy    │───────────────▶│ Private Key  │───────────────▶         │
│   │  (256 bits)  │   genpkey      │  (Ed25519)   │   pkey -pubout         │
│   └──────────────┘   Ed25519      │  32 bytes    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │ Public Key   │                         │
│                                   │  32 bytes    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│              ⚠️ JS REQUIRED ───▶  │   Base58     │  ◀─── NOT in OpenSSL   │
│                                   │   Encode     │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                                   │   Solana     │                         │
│                                   │   Address    │                         │
│                                   │  (Base58)    │                         │
│                                   └──────────────┘                         │
│                                          │                                  │
│                                          ▼                                  │
│                                   ┌──────────────┐                         │
│                    OpenSSL ───▶   │ Sign (EdDSA) │  ◀─── SUPPORTED!       │
│                                   │  Raw message │                         │
│                                   │  (no hash)   │                         │
│                                   └──────────────┘                         │
│                                                                             │
│   ✅ Solana is the BEST supported by OpenSSL (except Base58 encoding)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Step-by-Step: Direct Key Generation

#### Step 1: Generate Ed25519 Key (OpenSSL)

```bash
# Generate Ed25519 private key
openssl genpkey -algorithm Ed25519 -out userA_sol_private.pem

# View key details
openssl pkey -in userA_sol_private.pem -text -noout
```

#### Step 2: Extract Public Key (OpenSSL)

```bash
# Extract public key
openssl pkey -in userA_sol_private.pem -pubout -out userA_sol_public.pem

# Export raw 32-byte public key
openssl pkey -in userA_sol_private.pem -pubout -outform DER | tail -c 32 > userA_sol_pubkey.bin

# View raw public key
xxd -p userA_sol_pubkey.bin
```

#### Step 3: Generate Address (JavaScript Required)

```javascript
// solana_address.js
import { base58 } from '@scure/base'
import { readFileSync } from 'fs'

// Read raw 32-byte public key
const publicKey = readFileSync('userA_sol_pubkey.bin')

// Solana address IS the Base58-encoded public key
const solanaAddress = base58.encode(publicKey)

console.log('Solana Address:', solanaAddress)
```

#### Step 4: Sign Message (OpenSSL - Fully Supported!)

```bash
# Create message
echo -n "Transfer 2 SOL from UserA to UserB" > sol_message.txt

# Sign with Ed25519 (raw message, no prehashing)
openssl pkeyutl -sign \
  -inkey userA_sol_private.pem \
  -in sol_message.txt \
  -out sol_signature.bin \
  -rawin

# View 64-byte signature
xxd -p sol_signature.bin
```

#### Step 5: Verify Signature (OpenSSL)

```bash
# Verify signature
openssl pkeyutl -verify \
  -pubin -inkey userA_sol_public.pem \
  -in sol_message.txt \
  -sigfile sol_signature.bin \
  -rawin

# Expected: "Signature Verified Successfully"
```

### 5.3 Complete Solana Script (Hybrid)

```javascript
// solana_flow.js
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { base58 } from '@scure/base'

console.log('═══════════════════════════════════════════════════════════════')
console.log('              SOLANA CRYPTOGRAPHIC FLOW                         ')
console.log('═══════════════════════════════════════════════════════════════\n')

// ========== USER A (SENDER) ==========
console.log('>>> USER A (Sender) <<<\n')

// Step 1: Generate Ed25519 private key (OpenSSL)
console.log('Step 1: Generating Ed25519 private key (OpenSSL)...')
execSync('openssl genpkey -algorithm Ed25519 -out userA_sol.pem')

// Step 2: Extract public key (OpenSSL)
console.log('Step 2: Extracting public key (OpenSSL)...')
execSync('openssl pkey -in userA_sol.pem -pubout -out userA_sol_pub.pem')
execSync('openssl pkey -in userA_sol.pem -pubout -outform DER | tail -c 32 > userA_sol_pubkey.bin')

// Step 3: Generate address (JavaScript)
console.log('Step 3: Encoding address as Base58 (JavaScript)...')
const pubKeyA = readFileSync('userA_sol_pubkey.bin')
const addressA = base58.encode(pubKeyA)
console.log(`   Address: ${addressA}\n`)

// ========== USER B (RECEIVER) ==========
console.log('>>> USER B (Receiver) <<<\n')

execSync('openssl genpkey -algorithm Ed25519 -out userB_sol.pem')
execSync('openssl pkey -in userB_sol.pem -pubout -outform DER | tail -c 32 > userB_sol_pubkey.bin')
const pubKeyB = readFileSync('userB_sol_pubkey.bin')
const addressB = base58.encode(pubKeyB)
console.log(`   Address: ${addressB}\n`)

// ========== TRANSACTION SIGNING ==========
console.log('>>> TRANSACTION SIGNING <<<\n')

// Step 4: Create message
const message = `Transfer 2 SOL from ${addressA} to ${addressB}`
writeFileSync('sol_message.txt', message)
console.log(`Step 4: Message: "${message}"`)

// Step 5: Sign with Ed25519 (OpenSSL - fully supported!)
console.log('Step 5: Signing with EdDSA (OpenSSL)...')
execSync('openssl pkeyutl -sign -inkey userA_sol.pem -in sol_message.txt -out sol_sig.bin -rawin')

// Step 6: Verify (OpenSSL)
console.log('Step 6: Verifying signature (OpenSSL)...')
const verifyResult = execSync(
  'openssl pkeyutl -verify -pubin -inkey userA_sol_pub.pem -in sol_message.txt -sigfile sol_sig.bin -rawin 2>&1'
)
  .toString()
  .trim()
console.log(`   Result: ${verifyResult}`)

// Step 7: Display signature in Base58
const signature = readFileSync('sol_sig.bin')
const signatureBase58 = base58.encode(signature)
console.log(`\nStep 7: Signature (Base58): ${signatureBase58}`)

console.log('\n═══════════════════════════════════════════════════════════════')
console.log('              SOLANA FLOW COMPLETE                              ')
console.log('═══════════════════════════════════════════════════════════════')
```

---

## Part 6: HD Wallet Implementation

### 6.1 HD Derivation Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HD WALLET DERIVATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐   BIP39 (JS)   ┌─────────────────┐                   │
│   │    Entropy      │───────────────▶│    Mnemonic     │                   │
│   │  (128-256 bits) │                │  (12-24 words)  │                   │
│   │  openssl rand   │                │                 │                   │
│   └─────────────────┘                └─────────────────┘                   │
│                                              │                              │
│                                              ▼                              │
│                                       ┌─────────────────┐                  │
│                          PBKDF2 ───▶  │     Seed        │                  │
│                        (JS/OpenSSL)   │   (512 bits)    │                  │
│                                       └─────────────────┘                  │
│                                              │                              │
│                               ┌──────────────┴──────────────┐              │
│                               ▼                              ▼              │
│                        ┌─────────────────┐          ┌─────────────────┐    │
│                        │  BIP32 (JS)     │          │ SLIP-0010 (JS)  │    │
│                        │  secp256k1      │          │  Ed25519        │    │
│                        └─────────────────┘          └─────────────────┘    │
│                               │                              │              │
│               ┌───────────────┼───────────────┐              │              │
│               ▼               ▼               ▼              ▼              │
│        ┌───────────┐   ┌───────────┐   ┌───────────┐  ┌───────────┐       │
│        │  Bitcoin  │   │ Ethereum  │   │  Other    │  │  Solana   │       │
│        │ m/44'/0'  │   │ m/44'/60' │   │  Coins    │  │ m/44'/501'│       │
│        └───────────┘   └───────────┘   └───────────┘  └───────────┘       │
│                                                                             │
│   ⚠️  ALL HD DERIVATION REQUIRES JAVASCRIPT (not supported by OpenSSL)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 BIP44 Derivation Paths

| Blockchain | Path             | Coin Type | Notes                            |
| ---------- | ---------------- | --------- | -------------------------------- |
| Bitcoin    | m/44'/0'/0'/0/x  | 0         | BIP32, secp256k1                 |
| Ethereum   | m/44'/60'/0'/0/x | 60        | BIP32, secp256k1                 |
| Solana     | m/44'/501'/0'/0' | 501       | SLIP-0010, Ed25519, all hardened |

### 6.3 Complete HD Wallet Implementation

```javascript
// hd_wallet_flow.js
import { execSync } from 'child_process'
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { HDKey } from '@scure/bip32'
import { derivePath, getMasterKeyFromSeed, getPublicKey } from 'ed25519-hd-key'
import { sha256 } from '@noble/hashes/sha256'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { keccak_256 } from '@noble/hashes/sha3'
import { secp256k1 } from '@noble/curves/secp256k1'
import { ed25519 } from '@noble/curves/ed25519'
import { base58, createBase58check, bech32 } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils'

console.log('═══════════════════════════════════════════════════════════════')
console.log('              HD WALLET MULTI-CHAIN DERIVATION                  ')
console.log('═══════════════════════════════════════════════════════════════\n')

// ========== STEP 1: ENTROPY GENERATION ==========
console.log('>>> STEP 1: Entropy Generation <<<\n')

// Option A: Use OpenSSL for entropy
console.log('Generating 256-bit entropy using OpenSSL...')
const entropyHex = execSync('openssl rand -hex 32').toString().trim()
const entropy = Buffer.from(entropyHex, 'hex')
console.log(`Entropy: ${entropyHex}\n`)

// ========== STEP 2: MNEMONIC GENERATION ==========
console.log('>>> STEP 2: BIP39 Mnemonic Generation (JavaScript) <<<\n')

const mnemonic = bip39.entropyToMnemonic(entropy, wordlist)
console.log(`Mnemonic (24 words):\n${mnemonic}\n`)

// Validate mnemonic
const isValid = bip39.validateMnemonic(mnemonic, wordlist)
console.log(`Valid mnemonic: ${isValid}\n`)

// ========== STEP 3: SEED DERIVATION ==========
console.log('>>> STEP 3: Seed Derivation (JavaScript) <<<\n')

const seed = bip39.mnemonicToSeedSync(mnemonic)
console.log(`Seed (512 bits): ${bytesToHex(seed).slice(0, 64)}...`)
console.log(`Seed length: ${seed.length} bytes\n`)

// ========== STEP 4: BITCOIN HD DERIVATION ==========
console.log('>>> STEP 4: Bitcoin HD Derivation (BIP32) <<<\n')

const btcMaster = HDKey.fromMasterSeed(seed)
console.log('Master xprv:', btcMaster.privateExtendedKey.slice(0, 40) + '...')
console.log('Master xpub:', btcMaster.publicExtendedKey.slice(0, 40) + '...\n')

// Derive first Bitcoin address: m/44'/0'/0'/0/0
const btcPath = "m/44'/0'/0'/0/0"
const btcKey = btcMaster.derive(btcPath)
const btcPrivKey = btcKey.privateKey
const btcPubKey = btcKey.publicKey

console.log(`Path: ${btcPath}`)
console.log(`Private Key: ${bytesToHex(btcPrivKey)}`)
console.log(`Public Key: ${bytesToHex(btcPubKey)}`)

// Generate Bitcoin addresses
const base58check = createBase58check(sha256)
const hash160 = ripemd160(sha256(btcPubKey))

// Legacy address
const legacyAddr = base58check.encode(Buffer.concat([Buffer.from([0x00]), hash160]))
console.log(`Legacy Address: ${legacyAddr}`)

// SegWit address
const segwitWords = bech32.toWords(hash160)
const segwitAddr = bech32.encode('bc', [0x00, ...segwitWords])
console.log(`SegWit Address: ${segwitAddr}\n`)

// ========== STEP 5: ETHEREUM HD DERIVATION ==========
console.log('>>> STEP 5: Ethereum HD Derivation (BIP32) <<<\n')

// Derive first Ethereum address: m/44'/60'/0'/0/0
const ethPath = "m/44'/60'/0'/0/0"
const ethKey = btcMaster.derive(ethPath) // Same master, different path
const ethPrivKey = ethKey.privateKey

// Get uncompressed public key for Ethereum
const ethPubKeyFull = secp256k1.getPublicKey(ethPrivKey, false)
const ethPubKeyNoPrefix = ethPubKeyFull.slice(1) // Remove 04 prefix

// Derive address using Keccak-256
const ethHash = keccak_256(ethPubKeyNoPrefix)
const ethAddrBytes = ethHash.slice(-20)
const ethAddrHex = bytesToHex(ethAddrBytes)

// Checksum address (EIP-55)
const ethAddrHash = bytesToHex(keccak_256(ethAddrHex))
let ethAddr = '0x'
for (let i = 0; i < 40; i++) {
  ethAddr += parseInt(ethAddrHash[i], 16) >= 8 ? ethAddrHex[i].toUpperCase() : ethAddrHex[i]
}

console.log(`Path: ${ethPath}`)
console.log(`Private Key: ${bytesToHex(ethPrivKey)}`)
console.log(`Address: ${ethAddr}\n`)

// ========== STEP 6: SOLANA HD DERIVATION ==========
console.log('>>> STEP 6: Solana HD Derivation (SLIP-0010) <<<\n')

// IMPORTANT: Solana uses SLIP-0010, not BIP32
const hexSeed = bytesToHex(seed)
const solPath = "m/44'/501'/0'/0'"
const { key: solPrivKey } = derivePath(solPath, hexSeed)

// Get Ed25519 public key
const solPubKey = ed25519.getPublicKey(solPrivKey)
const solAddr = base58.encode(solPubKey)

console.log(`Path: ${solPath}`)
console.log(`Private Key: ${bytesToHex(solPrivKey)}`)
console.log(`Public Key: ${bytesToHex(solPubKey)}`)
console.log(`Address: ${solAddr}\n`)

// ========== STEP 7: DERIVE MULTIPLE ACCOUNTS ==========
console.log('>>> STEP 7: Derive Multiple Accounts <<<\n')

console.log("Bitcoin Addresses (m/44'/0'/0'/0/x):")
for (let i = 0; i < 3; i++) {
  const key = btcMaster.derive(`m/44'/0'/0'/0/${i}`)
  const h160 = ripemd160(sha256(key.publicKey))
  const addr = base58check.encode(Buffer.concat([Buffer.from([0x00]), h160]))
  console.log(`  [${i}] ${addr}`)
}

console.log("\nEthereum Addresses (m/44'/60'/0'/0/x):")
for (let i = 0; i < 3; i++) {
  const key = btcMaster.derive(`m/44'/60'/0'/0/${i}`)
  const pub = secp256k1.getPublicKey(key.privateKey, false).slice(1)
  const hash = keccak_256(pub)
  const addr = '0x' + bytesToHex(hash.slice(-20))
  console.log(`  [${i}] ${addr}`)
}

console.log("\nSolana Addresses (m/44'/501'/x'/0'):")
for (let i = 0; i < 3; i++) {
  const { key } = derivePath(`m/44'/501'/${i}'/0'`, hexSeed)
  const pub = ed25519.getPublicKey(key)
  const addr = base58.encode(pub)
  console.log(`  [${i}] ${addr}`)
}

// ========== SUMMARY ==========
console.log('\n═══════════════════════════════════════════════════════════════')
console.log('                    DERIVATION SUMMARY                          ')
console.log('═══════════════════════════════════════════════════════════════')
console.log(`
┌─────────────────────────────────────────────────────────────────────────────┐
│  Mnemonic: ${mnemonic.split(' ').slice(0, 4).join(' ')}...                  
├─────────────────────────────────────────────────────────────────────────────┤
│  Bitcoin  │ ${btcPath.padEnd(25)} │ ${legacyAddr}                          
│  Ethereum │ ${ethPath.padEnd(25)} │ ${ethAddr}                             
│  Solana   │ ${solPath.padEnd(25)} │ ${solAddr}                             
└─────────────────────────────────────────────────────────────────────────────┘
`)
console.log('═══════════════════════════════════════════════════════════════')
```

### 6.4 OpenSSL Contribution to HD Wallets

OpenSSL can assist with specific parts of HD derivation:

```bash
# Generate entropy for mnemonic
openssl rand -hex 32 > entropy.txt

# HMAC-SHA512 for master key derivation
echo -n "seed_bytes_here" | xxd -r -p > seed.bin
openssl dgst -sha512 -hmac "Bitcoin seed" -binary seed.bin > master_raw.bin

# Split master key material
head -c 32 master_raw.bin > master_privkey.bin   # First 32 bytes = key
tail -c 32 master_raw.bin > master_chaincode.bin # Last 32 bytes = chaincode

# For Ed25519 (Solana), use different HMAC key
openssl dgst -sha512 -hmac "ed25519 seed" -binary seed.bin > ed25519_master.bin
```

**However**, the actual child key derivation requires elliptic curve operations that OpenSSL doesn't expose in a usable way for BIP32, so JavaScript libraries remain necessary.

---

## Part 7: Cross-Chain Comparison

### 7.1 Implementation Complexity

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    IMPLEMENTATION COMPLEXITY COMPARISON                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Feature              │ Bitcoin │ Ethereum │ Solana  │ OpenSSL Alone?      ║
║   ─────────────────────┼─────────┼──────────┼─────────┼─────────────────────║
║   Key Generation       │ ✅ Easy │ ✅ Easy  │ ✅ Easy │ ✅ Yes              ║
║   Public Key Derivation│ ✅ Easy │ ✅ Easy  │ ✅ Easy │ ✅ Yes              ║
║   Hashing for Address  │ ✅ Easy │ ⚠️ JS    │ N/A     │ Partial             ║
║   Address Encoding     │ ⚠️ JS   │ ✅ Easy  │ ⚠️ JS   │ ❌ No               ║
║   Transaction Signing  │ ✅ Easy │ ⚠️ JS    │ ✅ Easy │ Partial             ║
║   Signature Verify     │ ✅ Easy │ ⚠️ JS    │ ✅ Easy │ Partial             ║
║   HD Key Derivation    │ ⚠️ JS   │ ⚠️ JS    │ ⚠️ JS   │ ❌ No               ║
║   Transaction Building │ ⚠️ JS   │ ⚠️ JS    │ ⚠️ JS   │ ❌ No               ║
║   ─────────────────────┼─────────┼──────────┼─────────┼─────────────────────║
║   Overall OpenSSL Use  │ ~60%    │ ~30%     │ ~70%    │                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Legend: ✅ = Fully supported by OpenSSL
        ⚠️ = Requires JavaScript
        ❌ = Not possible with OpenSSL alone
```

### 7.2 Quick Reference Commands

#### Bitcoin Quick Reference

```bash
# OpenSSL Commands
openssl ecparam -name secp256k1 -genkey -noout -out btc.pem  # Generate key
openssl ec -in btc.pem -pubout -out btc_pub.pem              # Extract pubkey
openssl dgst -sha256 -binary file | openssl dgst -sha256 -binary  # Double SHA256
openssl dgst -ripemd160 -binary file                         # RIPEMD160
openssl pkeyutl -sign -inkey btc.pem -in hash -out sig       # Sign

# JavaScript Required For
- Base58Check address encoding
- Bech32/Bech32m encoding
- BIP32/39/44 HD derivation
- Transaction serialization
```

#### Ethereum Quick Reference

```bash
# OpenSSL Commands
openssl ecparam -name secp256k1 -genkey -noout -out eth.pem  # Generate key

# JavaScript Required For (most operations)
- Keccak-256 hashing (address derivation)
- Checksummed address (EIP-55)
- RLP encoding
- Transaction signing with recovery parameter (v)
- BIP32/39/44 HD derivation
- EIP-712 typed data signing
```

#### Solana Quick Reference

```bash
# OpenSSL Commands (Best Supported!)
openssl genpkey -algorithm Ed25519 -out sol.pem              # Generate key
openssl pkey -in sol.pem -pubout -out sol_pub.pem            # Extract pubkey
openssl pkeyutl -sign -inkey sol.pem -in msg -out sig -rawin # Sign
openssl pkeyutl -verify -pubin -inkey sol_pub.pem -in msg -sigfile sig -rawin

# JavaScript Required For
- Base58 address encoding
- SLIP-0010 HD derivation
- Transaction message serialization
```

---

## Part 8: Complete Working Scripts

### 8.1 All-in-One Demo Script

```javascript
// complete_demo.js
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { HDKey } from '@scure/bip32'
import { derivePath } from 'ed25519-hd-key'
import { sha256 } from '@noble/hashes/sha256'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { keccak_256 } from '@noble/hashes/sha3'
import { secp256k1 } from '@noble/curves/secp256k1'
import { ed25519 } from '@noble/curves/ed25519'
import { base58, createBase58check, bech32 } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils'

// Create output directory
const DIR = './crypto_demo'
if (!existsSync(DIR)) mkdirSync(DIR)
process.chdir(DIR)

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║          DIGITAL ASSETS CRYPTOGRAPHIC EDUCATION DEMO                         ║
║          Bitcoin • Ethereum • Solana                                         ║
║                                                                              ║
║          OpenSSL 3.5.4 + JavaScript Hybrid Implementation                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`)

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: DIRECT KEY USAGE
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n┌──────────────────────────────────────────────────────────────────┐')
console.log('│                  SECTION 1: DIRECT KEY USAGE                     │')
console.log('└──────────────────────────────────────────────────────────────────┘\n')

// --- BITCOIN ---
console.log('━━━ BITCOIN (secp256k1 + ECDSA) ━━━\n')

// Generate keys (OpenSSL)
execSync('openssl ecparam -name secp256k1 -genkey -noout -out alice_btc.pem')
execSync('openssl ecparam -name secp256k1 -genkey -noout -out bob_btc.pem')

// Get public keys and compute addresses (Hybrid)
execSync(
  'openssl ec -in alice_btc.pem -pubout -outform DER 2>/dev/null | tail -c 33 > alice_btc_pub.bin'
)
execSync(
  'openssl ec -in bob_btc.pem -pubout -outform DER 2>/dev/null | tail -c 33 > bob_btc_pub.bin'
)

const aliceBtcPub = readFileSync('alice_btc_pub.bin')
const bobBtcPub = readFileSync('bob_btc_pub.bin')

const base58c = createBase58check(sha256)
const aliceBtcAddr = base58c.encode(
  Buffer.concat([Buffer.from([0x00]), ripemd160(sha256(aliceBtcPub))])
)
const bobBtcAddr = base58c.encode(
  Buffer.concat([Buffer.from([0x00]), ripemd160(sha256(bobBtcPub))])
)

console.log(`Alice (sender):   ${aliceBtcAddr}`)
console.log(`Bob (receiver):   ${bobBtcAddr}`)

// Sign transaction (OpenSSL)
const btcTx = `BTC: 0.5 from ${aliceBtcAddr} to ${bobBtcAddr}`
writeFileSync('btc_tx.txt', btcTx)
execSync('openssl dgst -sha256 -binary btc_tx.txt | openssl dgst -sha256 -binary > btc_hash.bin')
execSync('openssl pkeyutl -sign -inkey alice_btc.pem -in btc_hash.bin -out btc_sig.der')

// Verify (OpenSSL)
execSync('openssl ec -in alice_btc.pem -pubout -out alice_btc_pub.pem 2>/dev/null')
const btcVerify = execSync(
  'openssl pkeyutl -verify -pubin -inkey alice_btc_pub.pem -in btc_hash.bin -sigfile btc_sig.der 2>&1'
)
  .toString()
  .trim()
console.log(`Transaction:      "${btcTx}"`)
console.log(`Signature valid:  ${btcVerify.includes('Verified Successfully')}\n`)

// --- ETHEREUM ---
console.log('━━━ ETHEREUM (secp256k1 + Keccak-256) ━━━\n')

// Generate keys (OpenSSL)
execSync('openssl ecparam -name secp256k1 -genkey -noout -out alice_eth.pem')
execSync('openssl ecparam -name secp256k1 -genkey -noout -out bob_eth.pem')

// Extract private keys and derive addresses (JavaScript - Keccak required)
const aliceEthPrivHex = execSync(
  "openssl ec -in alice_eth.pem -text -noout 2>/dev/null | grep -A 3 'priv:' | tail -3 | tr -d ' :\\n'"
)
  .toString()
  .trim()
  .slice(0, 64)
const bobEthPrivHex = execSync(
  "openssl ec -in bob_eth.pem -text -noout 2>/dev/null | grep -A 3 'priv:' | tail -3 | tr -d ' :\\n'"
)
  .toString()
  .trim()
  .slice(0, 64)

const aliceEthPriv = Buffer.from(aliceEthPrivHex, 'hex')
const bobEthPriv = Buffer.from(bobEthPrivHex, 'hex')

const aliceEthPub = secp256k1.getPublicKey(aliceEthPriv, false).slice(1)
const bobEthPub = secp256k1.getPublicKey(bobEthPriv, false).slice(1)

const aliceEthAddr = '0x' + bytesToHex(keccak_256(aliceEthPub).slice(-20))
const bobEthAddr = '0x' + bytesToHex(keccak_256(bobEthPub).slice(-20))

console.log(`Alice (sender):   ${aliceEthAddr}`)
console.log(`Bob (receiver):   ${bobEthAddr}`)

// Sign transaction (JavaScript - recovery parameter needed)
const ethTx = `ETH: 1.5 from ${aliceEthAddr} to ${bobEthAddr}`
const ethTxHash = keccak_256(new TextEncoder().encode(ethTx))
const ethSig = secp256k1.sign(ethTxHash, aliceEthPriv, { lowS: true })

console.log(`Transaction:      "${ethTx}"`)
console.log(
  `Signature (r,s,v): (${ethSig.r.toString(16).slice(0, 8)}..., ${ethSig.s.toString(16).slice(0, 8)}..., ${ethSig.recovery + 27})`
)
console.log(
  `Signature valid:  ${secp256k1.verify(ethSig, ethTxHash, secp256k1.getPublicKey(aliceEthPriv))}\n`
)

// --- SOLANA ---
console.log('━━━ SOLANA (Ed25519 + EdDSA) ━━━\n')

// Generate keys (OpenSSL - fully supported!)
execSync('openssl genpkey -algorithm Ed25519 -out alice_sol.pem')
execSync('openssl genpkey -algorithm Ed25519 -out bob_sol.pem')

// Extract public keys
execSync('openssl pkey -in alice_sol.pem -pubout -outform DER | tail -c 32 > alice_sol_pub.bin')
execSync('openssl pkey -in bob_sol.pem -pubout -outform DER | tail -c 32 > bob_sol_pub.bin')
execSync('openssl pkey -in alice_sol.pem -pubout -out alice_sol_pub.pem')

const aliceSolPub = readFileSync('alice_sol_pub.bin')
const bobSolPub = readFileSync('bob_sol_pub.bin')

const aliceSolAddr = base58.encode(aliceSolPub)
const bobSolAddr = base58.encode(bobSolPub)

console.log(`Alice (sender):   ${aliceSolAddr}`)
console.log(`Bob (receiver):   ${bobSolAddr}`)

// Sign transaction (OpenSSL - fully supported!)
const solTx = `SOL: 2.0 from Alice to Bob`
writeFileSync('sol_tx.txt', solTx)
execSync('openssl pkeyutl -sign -inkey alice_sol.pem -in sol_tx.txt -out sol_sig.bin -rawin')

// Verify (OpenSSL)
const solVerify = execSync(
  'openssl pkeyutl -verify -pubin -inkey alice_sol_pub.pem -in sol_tx.txt -sigfile sol_sig.bin -rawin 2>&1'
)
  .toString()
  .trim()
console.log(`Transaction:      "${solTx}"`)
console.log(`Signature valid:  ${solVerify.includes('Verified Successfully')}\n`)

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: HD WALLET DERIVATION
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n┌──────────────────────────────────────────────────────────────────┐')
console.log('│                  SECTION 2: HD WALLET DERIVATION                 │')
console.log('└──────────────────────────────────────────────────────────────────┘\n')

// Generate mnemonic
const entropy = Buffer.from(execSync('openssl rand -hex 32').toString().trim(), 'hex')
const mnemonic = bip39.entropyToMnemonic(entropy, wordlist)
const seed = bip39.mnemonicToSeedSync(mnemonic)

console.log(`Mnemonic: ${mnemonic.split(' ').slice(0, 6).join(' ')} ...\n`)

// BIP32 Master Key
const master = HDKey.fromMasterSeed(seed)

// Derive accounts
const btcHD = master.derive("m/44'/0'/0'/0/0")
const ethHD = master.derive("m/44'/60'/0'/0/0")
const { key: solHD } = derivePath("m/44'/501'/0'/0'", bytesToHex(seed))

// Generate addresses
const btcHDAddr = base58c.encode(
  Buffer.concat([Buffer.from([0x00]), ripemd160(sha256(btcHD.publicKey))])
)

const ethHDPub = secp256k1.getPublicKey(ethHD.privateKey, false).slice(1)
const ethHDAddr = '0x' + bytesToHex(keccak_256(ethHDPub).slice(-20))

const solHDPub = ed25519.getPublicKey(solHD)
const solHDAddr = base58.encode(solHDPub)

console.log(
  '┌─────────────┬────────────────────────┬──────────────────────────────────────────────┐'
)
console.log(
  '│ Blockchain  │ Derivation Path        │ Address                                      │'
)
console.log(
  '├─────────────┼────────────────────────┼──────────────────────────────────────────────┤'
)
console.log(`│ Bitcoin     │ m/44'/0'/0'/0/0        │ ${btcHDAddr} │`)
console.log(`│ Ethereum    │ m/44'/60'/0'/0/0       │ ${ethHDAddr}   │`)
console.log(`│ Solana      │ m/44'/501'/0'/0'       │ ${solHDAddr} │`)
console.log(
  '└─────────────┴────────────────────────┴──────────────────────────────────────────────┘'
)

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                              IMPLEMENTATION SUMMARY                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                    OpenSSL 3.5.4 Handled:                           │   ║
║   │    ✅ secp256k1 key generation and ECDSA signing (BTC, ETH)        │   ║
║   │    ✅ Ed25519 key generation and EdDSA signing (SOL)               │   ║
║   │    ✅ SHA-256, SHA-512, RIPEMD-160 hashing                         │   ║
║   │    ✅ HMAC-SHA512 operations                                       │   ║
║   │    ✅ Cryptographic random number generation                       │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                    JavaScript Libraries Handled:                    │   ║
║   │    ⚠️  Keccak-256 (Ethereum addresses) - @noble/hashes             │   ║
║   │    ⚠️  Base58/Base58Check encoding - @scure/base                   │   ║
║   │    ⚠️  Bech32/Bech32m encoding - @scure/base                       │   ║
║   │    ⚠️  BIP32 HD derivation - @scure/bip32                          │   ║
║   │    ⚠️  BIP39 mnemonic phrases - @scure/bip39                       │   ║
║   │    ⚠️  SLIP-0010 Ed25519 HD - ed25519-hd-key                       │   ║
║   │    ⚠️  ECDSA recovery parameter - @noble/curves                    │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`)
```

### 8.2 Run Instructions

```bash
# Navigate to project directory
cd ~/crypto_education

# Run individual blockchain flows
node bitcoin_flow.js
node ethereum_flow.js
node solana_flow.js

# Run HD wallet derivation
node hd_wallet_flow.js

# Run complete demo
node complete_demo.js
```

---

## Part 9: Security Considerations

### 9.1 Private Key Handling

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        SECURITY BEST PRACTICES                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   DO:                                                                        ║
║   ✅ Use secure random sources (openssl rand, crypto.getRandomValues)       ║
║   ✅ Wipe private keys from memory after use                                ║
║   ✅ Store mnemonics offline (paper, metal backup)                          ║
║   ✅ Use hardware wallets for production                                    ║
║   ✅ Validate all inputs before cryptographic operations                    ║
║   ✅ Use audited libraries (Noble, Scure ecosystem)                         ║
║                                                                              ║
║   DON'T:                                                                     ║
║   ❌ Log private keys or mnemonics                                          ║
║   ❌ Store private keys in version control                                  ║
║   ❌ Use Math.random() for cryptographic operations                         ║
║   ❌ Trust user input without validation                                    ║
║   ❌ Use unaudited cryptographic libraries                                  ║
║   ❌ Reuse keys across different blockchains                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 9.2 Secure Key Wiping

```javascript
// Example: Wipe sensitive data
import { HDKey } from '@scure/bip32'

const hdkey = HDKey.fromMasterSeed(seed)
const derived = hdkey.derive("m/44'/0'/0'/0/0")

// Use the key...
const signature = derived.sign(hash)

// Wipe private data when done
derived.wipePrivateData()

// Zero out buffers
function secureWipe(buffer) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = 0
  }
}

secureWipe(seed)
secureWipe(privateKey)
```

### 9.3 Production Recommendations

| Component        | Development | Production                       |
| ---------------- | ----------- | -------------------------------- |
| Key Generation   | OpenSSL/JS  | Hardware Security Module (HSM)   |
| Key Storage      | File system | Hardware wallet / Secure enclave |
| Signing          | Software    | Hardware wallet / HSM            |
| Mnemonic Storage | Plain text  | Encrypted / Metal backup         |
| Network          | Testnet     | Mainnet with audited code        |

---

## References

### Standards Documents

- [BIP32: Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP39: Mnemonic Code for Deterministic Keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP44: Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [SLIP-0010: Universal Ed25519 HD Derivation](https://github.com/satoshilabs/slips/blob/master/slip-0010.md)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)

### Library Documentation

- [Noble Cryptography](https://paulmillr.com/noble/)
- [Scure Libraries](https://github.com/paulmillr?tab=repositories&q=scure)
- [OpenSSL 3.5 Documentation](https://www.openssl.org/docs/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

### Tools

- [Ian Coleman BIP39 Tool](https://iancoleman.io/bip39/)
- [Etherscan](https://etherscan.io/)
- [Solscan](https://solscan.io/)

---

## Appendix: Quick Command Reference Card

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPENSSL QUICK REFERENCE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KEY GENERATION                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  secp256k1:  openssl ecparam -name secp256k1 -genkey -noout -out key.pem   │
│  Ed25519:    openssl genpkey -algorithm Ed25519 -out key.pem                │
│                                                                             │
│  PUBLIC KEY EXTRACTION                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  secp256k1:  openssl ec -in key.pem -pubout -out pub.pem                   │
│  Ed25519:    openssl pkey -in key.pem -pubout -out pub.pem                 │
│  Raw DER:    openssl [ec|pkey] -in key.pem -pubout -outform DER            │
│                                                                             │
│  HASHING                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  SHA-256:    openssl dgst -sha256 -binary file.bin                         │
│  SHA-512:    openssl dgst -sha512 -binary file.bin                         │
│  RIPEMD160:  openssl dgst -ripemd160 -binary file.bin                      │
│  Double:     openssl dgst -sha256 -binary | openssl dgst -sha256 -binary   │
│  HMAC:       openssl dgst -sha512 -hmac "key" -binary file.bin             │
│                                                                             │
│  SIGNING                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ECDSA:      openssl pkeyutl -sign -inkey key.pem -in hash -out sig        │
│  EdDSA:      openssl pkeyutl -sign -inkey key.pem -in msg -out sig -rawin  │
│                                                                             │
│  VERIFICATION                                                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ECDSA:      openssl pkeyutl -verify -pubin -inkey pub.pem \               │
│                              -in hash -sigfile sig                         │
│  EdDSA:      openssl pkeyutl -verify -pubin -inkey pub.pem \               │
│                              -in msg -sigfile sig -rawin                   │
│                                                                             │
│  RANDOM                                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Hex:        openssl rand -hex 32                                          │
│  Binary:     openssl rand -out random.bin 32                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    JAVASCRIPT LIBRARY REFERENCE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  import { sha256 } from '@noble/hashes/sha256';                            │
│  import { ripemd160 } from '@noble/hashes/ripemd160';                      │
│  import { keccak_256 } from '@noble/hashes/sha3';                          │
│  import { hmac } from '@noble/hashes/hmac';                                │
│  import { secp256k1 } from '@noble/curves/secp256k1';                      │
│  import { ed25519 } from '@noble/curves/ed25519';                          │
│  import { base58, createBase58check, bech32 } from '@scure/base';          │
│  import { HDKey } from '@scure/bip32';                                     │
│  import * as bip39 from '@scure/bip39';                                    │
│  import { derivePath } from 'ed25519-hd-key';                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

_Document Version: 1.0_  
_Last Updated: December 2025_  
_Compatible with: OpenSSL 3.5.4, Node.js 20+_
