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
      'Derives a secure cryptographic key from a password (seed) and salt. It applies a hash function (like HMAC-SHA256) many times to slow down brute-force attacks.',
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
      'HD wallet standard for Ed25519 curves. Extends BIP32 to support curves like Ed25519 used by Solana.',
  },

  // Signatures
  ecdsa: {
    title: 'ECDSA',
    description:
      'Elliptic Curve Digital Signature Algorithm. Used by Bitcoin and Ethereum for signing transactions.',
  },
  eddsa: {
    title: 'EdDSA',
    description:
      'Edwards-curve Digital Signature Algorithm. Used by Solana. Faster and more secure than ECDSA.',
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
      'Recent block hash included in Solana transactions for deduplication and expiration. Transactions expire after ~2 minutes.',
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

  // Bitcoin Address Types
  p2pkh: {
    title: 'P2PKH (Pay-to-Public-Key-Hash)',
    description:
      'Legacy Bitcoin address format starting with "1". The address is a hash of the public key (SHA-256 then RIPEMD-160), encoded with Base58Check. Most common address type, supported by all wallets.',
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
    color: 'text-blue-400',
  },
  {
    id: 'ripemd160',
    label: 'RIPEMD-160',
    icon: 'Hash',
    description: 'Second hash',
    color: 'text-green-400',
  },
  {
    id: 'base58check',
    label: 'Base58Check',
    icon: 'Binary',
    description: 'With checksum',
    color: 'text-yellow-400',
  },
  {
    id: 'address',
    label: 'Address',
    icon: 'Wallet',
    description: '1... or bc1...',
    color: 'text-yellow-400',
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
    color: 'text-purple-400',
  },
  {
    id: 'last20',
    label: 'Last 20 Bytes',
    icon: 'Scissors',
    description: 'Take suffix',
    color: 'text-blue-400',
  },
  {
    id: 'checksum',
    label: 'EIP-55 Checksum',
    icon: 'CheckCircle',
    description: 'Mixed case',
    color: 'text-blue-400',
  },
  {
    id: 'address',
    label: 'Address',
    icon: 'Wallet',
    description: '0x...',
    color: 'text-blue-400',
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
    color: 'text-purple-400',
  },
  {
    id: 'address',
    label: 'Address',
    icon: 'Wallet',
    description: 'Base58 string',
    color: 'text-purple-400',
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
    color: 'text-green-400',
  },
  {
    id: 'master',
    label: 'Master Key',
    icon: 'KeyRound',
    description: 'Root of tree',
    color: 'text-yellow-400',
  },
  {
    id: 'derive',
    label: 'Derivation',
    icon: 'GitBranch',
    description: 'BIP32/SLIP-0010',
    color: 'text-blue-400',
  },
  {
    id: 'addresses',
    label: 'Addresses',
    icon: 'Wallet',
    description: 'BTC, ETH, SOL',
    color: 'text-purple-400',
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
