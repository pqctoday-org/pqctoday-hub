// SPDX-License-Identifier: GPL-3.0-only
/**
 * Constants for cryptographic visualizations and explanations
 */

export const CRYPTO_TOOLTIPS = {
  // Elliptic Curves
  secp256k1: {
    title: 'secp256k1',
    description:
      'Elliptic curve used by Bitcoin and Ethereum. Provides 128-bit security with 256-bit keys. Known for efficient computation and compact signatures.',
  },
  ed25519: {
    title: 'Ed25519',
    description:
      'Modern elliptic curve used by Solana. Offers strong security, fast signature generation, and resistance to side-channel attacks.',
  },

  // Hash Functions
  sha256: {
    title: 'SHA-256',
    description:
      'Cryptographic hash function producing 256-bit output. Used extensively in Bitcoin for hashing blocks, transactions, and addresses.',
  },
  pbkdf2: {
    title: 'PBKDF2 (Password-Based Key Derivation Function 2)',
    description:
      'Derives a secure cryptographic key from a password (seed) and salt. It applies a hash function (HMAC-SHA512 in BIP39) many times to slow down brute-force attacks.',
  },
  ripemd160: {
    title: 'RIPEMD-160',
    description:
      'Hash function producing 160-bit output. Used in Bitcoin address generation after SHA-256 to create shorter addresses.',
  },
  keccak256: {
    title: 'Keccak-256',
    description:
      'Hash function used by Ethereum. Important: This is NOT the same as NIST SHA3-256. Ethereum uses the original Keccak submission.',
  },

  // Encoding
  base58: {
    title: 'Base58',
    description:
      'Encoding scheme that avoids ambiguous characters (0, O, I, l). Used by Bitcoin and Solana for human-readable addresses.',
  },
  base58check: {
    title: 'Base58Check',
    description:
      'Base58 encoding with checksum. Adds 4-byte checksum to detect typos in Bitcoin addresses.',
  },
  bech32: {
    title: 'Bech32',
    description:
      'Modern Bitcoin address format (bc1...). Provides better error detection and is case-insensitive.',
  },

  // HD Wallets
  bip32: {
    title: 'BIP32',
    description:
      'Hierarchical Deterministic wallet standard. Allows deriving multiple keys from a single seed using a tree structure.',
  },
  bip39: {
    title: 'BIP39',
    description:
      'Mnemonic phrase standard. Converts random entropy into 12-24 memorable words for wallet backup.',
  },
  bip44: {
    title: 'BIP44',
    description:
      "Multi-account hierarchy standard. Defines derivation paths like m/44'/0'/0'/0/0 for organizing keys across different coins.",
  },
  slip0010: {
    title: 'SLIP-0010',
    description:
      "HD wallet key derivation standard for Ed25519 (and other curves). Unlike BIP-32 which was designed for secp256k1, SLIP-0010 supports Ed25519 by using HMAC-SHA512 with hardened derivation only (all path components must use hardened indices, e.g. m/44'/501'/0'/0'). Solana wallets use path m/44'/501'/0'/0' per SLIP-0044. The 64-byte HMAC output is split: left 32 bytes → Ed25519 seed (private scalar), right 32 bytes → chain code for further derivation.",
  },

  // Signatures
  ecdsa: {
    title: 'ECDSA',
    description:
      'Elliptic Curve Digital Signature Algorithm. Used by Bitcoin and Ethereum for signing transactions.',
  },
  ecdsaNonce: {
    title: 'ECDSA Nonce (k)',
    description:
      'A random integer k used once per signature. If k is reused across two signatures with the same private key, the private key can be algebraically recovered. The Sony PS3 (2010) was compromised this way. RFC 6979 defines a deterministic derivation of k from the private key and message hash, eliminating the randomness requirement.',
  },
  derEncoding: {
    title: 'DER Encoding',
    description:
      'Distinguished Encoding Rules (DER) — a strict ASN.1 subset. Bitcoin scripts carry ECDSA signatures in DER format: a 6-72 byte structure encoding r and s as signed big-endian integers. PKCS#11 CKM_ECDSA returns raw r||s (64 bytes, fixed-width) which is NOT DER; wallets must convert raw r||s to DER before broadcasting a transaction.',
  },
  eddsa: {
    title: 'EdDSA',
    description:
      'Edwards-curve Digital Signature Algorithm. Used by Solana. Faster than ECDSA with stronger resistance to implementation errors (deterministic nonces, side-channel resistance).',
  },

  // Ethereum Specific
  rlp: {
    title: 'RLP Encoding',
    description:
      "Recursive Length Prefix encoding. Ethereum's serialization format for transactions and blocks.",
  },
  recoveryParam: {
    title: 'Recovery Parameter (v)',
    description:
      'Additional value in Ethereum signatures allowing public key recovery from signature. Enables address verification without storing public keys.',
  },
  eip55: {
    title: 'EIP-55 Checksum',
    description:
      'Ethereum address checksum standard. Uses mixed case to detect typos (e.g., 0xAb5801a7...).',
  },

  // Solana Specific
  lamports: {
    title: 'Lamports',
    description:
      'Smallest unit of SOL (1 SOL = 1 billion lamports). Named after Leslie Lamport, pioneer in distributed systems.',
  },
  instruction: {
    title: 'Instruction',
    description:
      'Solana transaction component specifying program to call, accounts to use, and data to pass. Transactions can contain multiple instructions.',
  },
  recentBlockhash: {
    title: 'Recent Blockhash',
    description:
      'Recent block hash included in Solana transactions for deduplication and expiration. Transactions expire after ~60 seconds (150 blocks × ~400ms block time). Using a stale blockhash causes the transaction to be rejected by validators.',
  },
  pda: {
    title: 'Program-Derived Address (PDA)',
    description:
      'A Solana address derived deterministically from a program ID and seeds using SHA-256. PDAs are intentionally off the Ed25519 curve — they have no private key and can only be signed for by the program that owns them. Unlike wallet addresses (on-curve Ed25519 pubkeys), PDAs cannot initiate transactions themselves.',
  },
  feepayer: {
    title: 'Fee Payer',
    description:
      "The account that pays transaction fees in Solana. By convention the fee payer is the first account in the transaction's account keys array and must be a signer. In simple transfers the sender is also the fee payer, but they can be separated (e.g., a relayer pays fees on behalf of a user).",
  },
  systemprogram: {
    title: 'System Program',
    description:
      'The native Solana program at address 11111111111111111111111111111111 (32 zero bytes, Base58-encoded). It handles fundamental operations: creating accounts, allocating data space, assigning account ownership, and transferring SOL. Instruction type 2 (Transfer) moves lamports from the source to the destination. The System Program is the only program that can debit a user-owned account without explicit delegation.',
  },
  compactu16: {
    title: 'Compact-u16 Encoding',
    description:
      "Solana's variable-length integer encoding for counts up to 65,535. Values 0–127 are encoded in 1 byte. Values 128–16,383 use 2 bytes with the MSB of the first byte set as a continuation flag. Values 16,384–65,535 use 3 bytes. This is distinct from standard LEB128 — Solana's variant is little-endian with a different bit layout. Used for account key counts, instruction counts, and data lengths in the wire format.",
  },
  anchorDiscriminator: {
    title: 'Anchor Discriminator',
    description:
      'An 8-byte prefix prepended to instruction data by the Anchor framework (first 8 bytes of SHA-256("global:<instruction_name>")). Allows programs to route incoming instructions to the correct handler. This demo uses the legacy System Program format (4-byte little-endian type field) which predates Anchor — native programs have their own instruction schemas.',
  },

  // Ethereum Specific (additional to existing RLP, recoveryParam, eip55)
  nonce: {
    title: 'Nonce',
    description:
      'Transaction counter for an Ethereum account. Prevents replay attacks by ensuring each transaction is unique. Must increment sequentially.',
  },
  gas: {
    title: 'Gas',
    description:
      'Computational unit measure in Ethereum. Gas limit specifies max computation allowed; gas price determines cost per unit. Total fee = gas used × gas price.',
  },
  wei: {
    title: 'Wei',
    description:
      'Smallest unit of Ether (1 ETH = 10^18 wei). Named after Wei Dai, cryptography pioneer. All Ethereum amounts are internally represented in wei.',
  },
  gwei: {
    title: 'Gwei',
    description:
      'Common gas price unit (1 gwei = 10^9 wei = 0.000000001 ETH). Pronounced "giga-wei". Typical gas prices range from 1-100 gwei.',
  },

  // PQC / Quantum Threats
  shors: {
    title: "Shor's Algorithm",
    description:
      'A quantum algorithm that efficiently solves the discrete logarithm problem, breaking ECDSA (secp256k1) and EdDSA (Ed25519). Requires a cryptographically relevant quantum computer (CRQC) with thousands of logical qubits.',
  },
  hnfl: {
    title: 'Harvest Now, Forge Later (HNFL)',
    description:
      'An attack strategy where adversaries collect exposed public keys today, intending to forge signatures once quantum computers become available. On-chain data is immutable, making blockchain especially vulnerable.',
  },
  qday: {
    title: 'Q-Day',
    description:
      'The hypothetical future date when a quantum computer becomes powerful enough to break current public-key cryptography (RSA, ECDSA, EdDSA). Estimates range from 2030 to 2040+.',
  },

  // Bitcoin Address Types
  p2pkh: {
    title: 'P2PKH (Pay-to-Public-Key-Hash)',
    description:
      'Legacy Bitcoin address format starting with "1". The address is a hash of the public key (SHA-256 then RIPEMD-160), encoded with Base58Check. Most common address type, supported by all wallets.',
  },

  // Custody & Institutional
  mpc: {
    title: 'Multi-Party Computation (MPC)',
    description:
      'Distributes key generation and signing across multiple independent parties so no single party ever holds the complete private key. Used by institutional custody platforms to eliminate single points of compromise.',
  },
  hsm: {
    title: 'Hardware Security Module (HSM)',
    description:
      'Tamper-resistant physical device that generates, stores, and uses cryptographic keys without exposing them. FIPS 140-3 certified. Provides hardware-enforced key isolation for custody platforms.',
  },
  shamir: {
    title: "Shamir's Secret Sharing",
    description:
      'Splits a secret into N shares where any K shares can reconstruct it (K-of-N threshold). Used in cold wallet disaster recovery to distribute backup key material across geographically separated custodians.',
  },
  coldStorage: {
    title: 'Cold Storage',
    description:
      'Offline key storage with no network connectivity. Keys are generated and used on air-gapped hardware (typically HSMs in secure facilities). Holds the majority of custodied assets.',
  },
  keyCeremony: {
    title: 'Key Ceremony',
    description:
      'Formal multi-person procedure for generating and distributing root cryptographic keys under dual-control, physical security (Faraday cage), and complete audit trail. The most security-critical operational process in custody.',
  },
}

export type CryptoTooltipKey = keyof typeof CRYPTO_TOOLTIPS

// Flow diagram step configurations
export interface FlowStep {
  id: string
  label: string
  icon: string
  description: string
  color: string
}

export const BITCOIN_FLOW_STEPS: FlowStep[] = [
  {
    id: 'private-key',
    label: 'Private Key',
    icon: 'Key',
    description: 'secp256k1 curve',
    color: 'text-primary',
  },
  {
    id: 'public-key',
    label: 'Public Key',
    icon: 'KeyRound',
    description: 'Compressed (33 bytes)',
    color: 'text-primary',
  },
  {
    id: 'sha256',
    label: 'SHA-256',
    icon: 'Hash',
    description: 'First hash',
    color: 'text-primary',
  },
  {
    id: 'ripemd160',
    label: 'RIPEMD-160',
    icon: 'Hash',
    description: 'Second hash',
    color: 'text-success',
  },
  {
    id: 'base58check',
    label: 'Base58Check',
    icon: 'Binary',
    description: 'With checksum',
    color: 'text-warning',
  },
  {
    id: 'address',
    label: 'Address',
    icon: 'Wallet',
    description: '1... (P2PKH)',
    color: 'text-warning',
  },
]

export const ETHEREUM_FLOW_STEPS: FlowStep[] = [
  {
    id: 'private-key',
    label: 'Private Key',
    icon: 'Key',
    description: 'secp256k1 curve',
    color: 'text-primary',
  },
  {
    id: 'public-key',
    label: 'Public Key',
    icon: 'KeyRound',
    description: 'Uncompressed (64 bytes)',
    color: 'text-primary',
  },
  {
    id: 'keccak256',
    label: 'Keccak-256',
    icon: 'Hash',
    description: 'NOT SHA3-256!',
    color: 'text-accent',
  },
  {
    id: 'last20',
    label: 'Last 20 Bytes',
    icon: 'Scissors',
    description: 'Take suffix',
    color: 'text-primary',
  },
  {
    id: 'checksum',
    label: 'EIP-55 Checksum',
    icon: 'CheckCircle',
    description: 'Mixed case',
    color: 'text-primary',
  },
  {
    id: 'address',
    label: 'Address',
    icon: 'Wallet',
    description: '0x...',
    color: 'text-primary',
  },
]

export const SOLANA_FLOW_STEPS: FlowStep[] = [
  {
    id: 'private-key',
    label: 'Private Key',
    icon: 'Key',
    description: 'Ed25519 curve',
    color: 'text-primary',
  },
  {
    id: 'public-key',
    label: 'Public Key',
    icon: 'KeyRound',
    description: '32 bytes',
    color: 'text-primary',
  },
  {
    id: 'base58',
    label: 'Base58',
    icon: 'Binary',
    description: 'Direct encoding',
    color: 'text-accent',
  },
  {
    id: 'address',
    label: 'Address',
    icon: 'Wallet',
    description: 'Base58 string',
    color: 'text-accent',
  },
]

export const HD_WALLET_FLOW_STEPS: FlowStep[] = [
  {
    id: 'entropy',
    label: 'Entropy',
    icon: 'Dices',
    description: '256 bits random',
    color: 'text-primary',
  },
  {
    id: 'mnemonic',
    label: 'Mnemonic',
    icon: 'FileText',
    description: '24 words (BIP39)',
    color: 'text-primary',
  },
  {
    id: 'seed',
    label: 'Seed',
    icon: 'Sprout',
    description: '512 bits (PBKDF2)',
    color: 'text-success',
  },
  {
    id: 'master',
    label: 'Master Key',
    icon: 'KeyRound',
    description: 'Root of tree',
    color: 'text-warning',
  },
  {
    id: 'derive',
    label: 'Derivation',
    icon: 'GitBranch',
    description: 'BIP32/SLIP-0010',
    color: 'text-primary',
  },
  {
    id: 'addresses',
    label: 'Addresses',
    icon: 'Wallet',
    description: 'BTC, ETH, SOL',
    color: 'text-accent',
  },
]

// Derivation path explanations
export const DERIVATION_PATH_EXPLANATIONS = {
  bitcoin: {
    path: "m/44'/0'/0'/0/0",
    breakdown: [
      { segment: 'm', description: 'Master key' },
      { segment: "44'", description: 'BIP44 purpose (hardened)' },
      { segment: "0'", description: 'Bitcoin coin type (hardened)' },
      { segment: "0'", description: 'Account #0 (hardened)' },
      { segment: '0', description: 'External chain (receiving)' },
      { segment: '0', description: 'Address index #0' },
    ],
  },
  ethereum: {
    path: "m/44'/60'/0'/0/0",
    breakdown: [
      { segment: 'm', description: 'Master key' },
      { segment: "44'", description: 'BIP44 purpose (hardened)' },
      { segment: "60'", description: 'Ethereum coin type (hardened)' },
      { segment: "0'", description: 'Account #0 (hardened)' },
      { segment: '0', description: 'External chain (receiving)' },
      { segment: '0', description: 'Address index #0' },
    ],
  },
  solana: {
    path: "m/44'/501'/0'/0'",
    breakdown: [
      { segment: 'm', description: 'Master key' },
      { segment: "44'", description: 'BIP44 purpose (hardened)' },
      { segment: "501'", description: 'Solana coin type (hardened)' },
      { segment: "0'", description: 'Account #0 (hardened)' },
      { segment: "0'", description: 'Ed25519 requires all hardened' },
    ],
  },
}

// Hardened vs Non-Hardened derivation explanation
export const HARDENED_DERIVATION = {
  label: 'Hardened Derivation',
  description:
    "Hardened child keys (index ≥ 2³¹, notated i') use the parent PRIVATE key in the HMAC — " +
    'meaning a compromised child key cannot be used to recover sibling keys or the parent. ' +
    'Non-hardened keys use the parent PUBLIC key, enabling watch-only wallets but creating a ' +
    'gap: knowing a child private key + parent chain code reveals the parent private key (xprv gap). ' +
    'Ed25519 (Solana/SLIP-0010) supports hardened derivation ONLY.',
}

// Security warnings
export const SECURITY_WARNINGS = {
  educational: {
    title: 'Educational Use Only',
    message:
      'Never use keys generated in this tool for real transactions. This is for learning purposes only.',
    severity: 'error' as const,
  },
  keyStorage: {
    title: 'Key Storage',
    message:
      'Real wallets encrypt private keys and use secure random number generators. This demo uses browser-based crypto.',
    severity: 'warning' as const,
  },
  testnet: {
    title: 'Testnet vs Mainnet',
    message:
      'Always test with testnet coins first. Mainnet transactions are irreversible and involve real money.',
    severity: 'info' as const,
  },
}
