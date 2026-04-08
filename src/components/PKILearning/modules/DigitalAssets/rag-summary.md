# Blockchain Cryptography Module

The Blockchain Cryptography module teaches the cryptographic primitives underpinning major blockchain networks and analyzes their vulnerability to quantum computing attacks. Learners explore key generation, address derivation, transaction signing, and HD wallet construction across Bitcoin (secp256k1/ECDSA/SHA-256), Ethereum (secp256k1/ECDSA/Keccak-256), and Solana (Ed25519/EdDSA), then examine post-quantum threats and proposed defense strategies. All operations run in-browser using SoftHSMv3 (PKCS#11 via WebAssembly), OpenSSL WASM, and noble/scure cryptographic libraries, generating real keys and signatures for educational inspection.

## Key Concepts

- Elliptic curve cryptography: secp256k1 (Bitcoin, Ethereum) uses ECDSA with random nonces (nonce reuse leaks the private key); Ed25519 (Solana) uses EdDSA with deterministic nonces, eliminating nonce-reuse vulnerabilities
- Address derivation pipelines: Bitcoin applies SHA-256 then RIPEMD-160 then Base58Check encoding; Ethereum applies Keccak-256 and takes the last 20 bytes with EIP-55 checksum; Solana directly Base58-encodes the 32-byte Ed25519 public key
- Digital signatures: ECDSA produces (r, s) signatures; EdDSA produces (R, s) signatures; Ethereum ECDSA includes a recovery parameter (v) per EIP-155 allowing public key recovery from signatures alone
- Hierarchical Deterministic (HD) wallets: BIP-39 converts entropy to a 24-word mnemonic; BIP-32 defines tree derivation; BIP-44 standardizes derivation paths (Bitcoin m/44'/0'/0'/0/0, Ethereum m/44'/60'/0'/0/0); Solana uses SLIP-0010 with all-hardened segments because Ed25519 does not support non-hardened derivation
- Quantum threats: all blockchain elliptic curve algorithms (secp256k1 ECDSA, Ed25519 EdDSA, ECDH in HD wallets) are vulnerable to Shor's algorithm; hash functions (SHA-256, Keccak-256, RIPEMD-160) remain quantum-resistant against Grover's algorithm
- PQC migration challenges for blockchains: immutable ledger history, larger post-quantum signatures and public keys, consensus protocol changes required, and backward compatibility with existing address formats

## Workshop Activities

- **Bitcoin Flow**: Generate a secp256k1 key pair inside SoftHSMv3 via PKCS#11 C_GenerateKeyPair (CKM_EC_KEY_PAIR_GEN), derive a Bitcoin address through the SHA-256/RIPEMD-160/Base58Check pipeline, format a transaction, sign it with CKM_ECDSA (raw pre-hashed ECDSA via C_Sign), and verify the signature with C_Verify
- **Ethereum Flow**: Generate secp256k1 keys, derive an Ethereum address via Keccak-256 with EIP-55 checksumming, create and sign a transaction with recovery parameter, and verify
- **Solana Flow**: Generate an Ed25519 key pair, derive a Solana address (direct Base58 encoding of the public key), sign a message with EdDSA, and verify
- **HD Wallet Flow**: Generate a BIP-39 mnemonic, derive a master seed, walk the BIP-32/BIP-44 derivation tree for Bitcoin/Ethereum/Solana, and inspect child key relationships
- **PQC Defense Flow**: Explore post-quantum migration proposals and initiatives for blockchain ecosystems, comparing classical and PQC signature sizes and their impact on block capacity

## Related Standards

- SEC 2 (secp256k1 curve specification), RFC 8032 (Ed25519/EdDSA), BIP-32 (HD wallet derivation), BIP-39 (mnemonic seed phrases), BIP-44 (multi-account hierarchy), SLIP-0010 (Ed25519 HD derivation)
- EIP-55 (Ethereum address checksumming), EIP-155 (replay protection with chain ID)
- FIPS 204 (ML-DSA), FIPS 203 (ML-KEM) as potential PQC replacements for blockchain signature and key exchange schemes
