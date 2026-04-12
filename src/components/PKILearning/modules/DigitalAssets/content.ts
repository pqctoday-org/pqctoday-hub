// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the DigitalAssets module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'digital-assets',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('RFC-8032'),
    getStandard('SLIP-0010'),
    getStandard('BIP-32'),
    getStandard('BIP-39'),
    getStandard('BIP-44'),
    getStandard('Solana-PQC-Helius'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 206'),
  ],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    keyConcepts:
      'Elliptic curve cryptography: secp256k1 (Bitcoin, Ethereum) uses ECDSA with random nonces (nonce reuse leaks the private key); Ed25519 (Solana) uses EdDSA with deterministic nonces, eliminating nonce-reuse vulnerabilities. Address derivation pipelines: Bitcoin applies SHA-256 then RIPEMD-160 then Base58Check encoding; Ethereum applies Keccak-256 and takes the last 20 bytes with EIP-55 checksum; Solana directly Base58-encodes the 32-byte Ed25519 public key.',
    workshopSummary:
      'Bitcoin Flow: Generate a secp256k1 key pair inside SoftHSMv3 via PKCS#11 C_GenerateKeyPair, derive a Bitcoin address through the SHA-256/RIPEMD-160/Base58Check pipeline, format a transaction, sign it with CKM_ECDSA (raw ECDSA via C_Sign), and verify the signature. Ethereum Flow: Generate secp256k1 keys, derive an Ethereum address via Keccak-256 with EIP-55 checksumming, create and sign a transaction with recovery parameter, and verify. HD Wallet Flow (5-step): Generate a 24-word BIP39 mnemonic, derive the 512-bit PBKDF2 seed, demonstrate hardened vs non-hardened BIP32 derivation with a live KAT (including Ed25519 hardened-only enforcement), derive Bitcoin/Ethereum/Solana addresses with an inline BIP44 derivation tree visualization, and assess the quantum threat surface of the HD wallet stack.',
    relatedStandards:
      'SEC 2 (secp256k1 curve specification), RFC 8032 (Ed25519/EdDSA), BIP-32 (HD wallet derivation), BIP-39 (mnemonic seed phrases), BIP-44 (multi-account hierarchy), SLIP-0010 (Ed25519 HD derivation), BIP-141 (Segregated Witness — P2WPKH/P2WSH, bech32 addresses), BIP-341 (Taproot — P2TR spending rules, Schnorr signatures), BIP-350 (bech32m encoding for Taproot/SegWit v1+ addresses). EIP-55 (Ethereum address checksumming), EIP-155 (replay protection with chain ID). FIPS 204 (ML-DSA), FIPS 203 (ML-KEM) as potential PQC replacements for blockchain signature and key exchange schemes',
  },
}
