# Cryptography Implementation Guidelines

## OpenSSL WASM v3.5.4 & Module Integration

This document outlines the technical best practices for performing cryptography using OpenSSL WASM and managing keys within the application. It serves as a standard for implementing new cryptographic modules.

### 1. Architecture Overview

The application utilizes a **Service-Worker w/ Broker Pattern** to handle cryptographic operations without blocking the main thread.

- **Core Engine**: OpenSSL compiled to WebAssembly (WASM).
- **Worker Layer**: `openssl.worker.ts` handles the WASM module initialization, file system (MEMFS), and command execution.
- **Service Layer**: `OpenSSLService.ts` acts as the broker, managing the worker instance, message queues, and providing a Promise-based API for the UI.
- **Shared Singleton**: The application uses a single instance (`export const openSSLService = new OpenSSLService()`) shared across all modules (5G, Digital Assets, etc.) to prevent multiple heavy WASM runtimes from spawning.
- **State Management**: Zustand stores (persisted to `localStorage`) manage the virtual file system metadata and content.

### 2. OpenSSL WASM Setup & Initialization

#### Best Practices

1.  **Lazy Loading**: Do not initialize the WASM runtime until a user explicitly interacts with a crypto feature. This reduces initial bundle size and load time.
    ```typescript
    // Example from OpenSSLService.ts
    public async init(): Promise<void> {
      if (this.isReady) return;
      // ... initialization logic
    }
    ```
2.  **Entropy Injection**: WASM modules cannot access system entropy natively. You **MUST** inject entropy from the browser's `crypto.getRandomValues` into the WASM environment before performing sensitive operations (`genpkey`, `rand`, etc.).
    ```typescript
    // In openssl.worker.ts
    const injectEntropy = (module) => {
      const seedData = new Uint8Array(4096)
      self.crypto.getRandomValues(seedData)
      module.FS.writeFile('/random.seed', seedData)
      // ...
    }
    ```
3.  **Command Strategy Pattern**: Use strategies to handle different command requirements (e.g., injecting entropy for crypto commands vs. standard environment for others).

### 3. Key Management with OpenStudio (OpenSSLStudio)

"OpenStudio" refers to the **OpenSSL Studio** component, which provides a UI for the underlying virtual file system.

#### Key File Storage

- **Virtual File System (VFS)**: Inside the worker, files exist in an Emscripten `MEMFS` (in-memory file system).
- **Persistence**: The application persists these files to the browser's `localStorage` using Zustand middleware.
  - **Serialization**: `Uint8Array` content is serialized to a custom JSON format (`{ type: 'Buffer', data: [...] }`) to survive `JSON.stringify`.
  - **Security Note**: Keys in `localStorage` are **NOT** encrypted at rest by the application (relying on device security). _For high-security production apps, use WebCrypto's non-extractable keys or an encrypted container._

#### Virtual File System Operations

When implementing new modules, interact with files via the `OpenSSLService`:

1.  **Writing Files**: Pass file objects to `execute()`. The worker writes them to MEMFS before running the command.
    ```typescript
    const result = await openSSLService.execute(
      'openssl req -new -key private.key -out request.csr',
      [{ name: 'private.key', data: privateKeyBytes }]
    )
    ```
2.  **Reading Files**: The `execute()` result contains a `files` array with any _new_ or _modified_ files found in the output.

### 4. Cryptographic Best Practices

#### Key Generation

- **Algorithm**: Use **ECDSA (secp256k1)** or **Ed25519** for modern applications unless legacy support (RSA) is required.
- **Command**:
  ```bash
  # Generate Private Key (secp256k1)
  openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:secp256k1 -aes256 -out private.pem
  ```

#### Key Extraction (PEM Parsing)

To get raw key bytes from OpenSSL's PEM output for use in other JS libraries (like `ethers.js` or `solana/web3.js`):

1.  Use `openssl pkey -text -noout` to dump the key parameters.
2.  Parse the hex dump from the `stdout`.
3.  **Use the Helper**: `src/utils/cryptoUtils.ts` -> `extractKeyFromOpenSSLOutput`.
    ```typescript
    const rawBytes = await extractKeyFromOpenSSLOutput('private.pem', 'private', files)
    ```

#### Version Consistency

- Ensure `openssl-wasm` version updates are tested against all modules.
- Current Target: **OpenSSL v3.x** (via `openssl-wasm` ^3.1.0).

### 6. Validated Cryptographic Libraries & Mechanisms

This section maps the libraries currently validated in the web application to their specific cryptographic mechanisms and key types. Use this as a reference when choosing a library for a new feature.

| Module / Feature       | Library            | Mechanisms Used                 | Key Types / Curves              |
| :--------------------- | :----------------- | :------------------------------ | :------------------------------ |
| **Generative AI / 5G** | **OpenSSL WASM**   | Key Gen (A/B), Provisioning     | Curve25519, P-256               |
|                        | **Web Crypto API** | Milenage (AES), Transport (AES) | AES-128 (ECB/CBC)               |
|                        | **Simulation**     | ML-KEM (PQC), Fallback          | ML-KEM-768                      |
| **Bitcoin Flow**       | **OpenSSL WASM**   | Key Gen, Sign, ECDH             | ECDSA (secp256k1)               |
|                        | **@noble/hashes**  | Hashing (for address gen)       | SHA-256, RIPEMD-160             |
| **Ethereum Flow**      | **OpenSSL WASM**   | Key Gen, Sign                   | ECDSA (secp256k1)               |
|                        | **@noble/hashes**  | Hashing (Keccak)                | Keccak-256 (SHA3)               |
|                        | **Manual JS**      | RLP Encoding (Tx Format)        | N/A                             |
| **Solana / HD Wallet** | **@scure/bip39**   | Mnemonic Generation             | N/A (Entropy -> Phrase)         |
|                        | **@scure/bip32**   | HD Key Derivation               | Hierarchical Deterministic      |
|                        | **@noble/curves**  | Key Gen, Sign                   | Ed25519 (Solana), secp256k1     |
| **PQC Playground**     | **OpenSSL WASM**   | Key Encapsulation (KEM)         | ML-KEM-768, ML-KEM-1024 (Kyber) |
| **PQC Playground**     | **OpenSSL WASM**   | Symmetric Encryption            | AES-256-CBC                     |

#### Library Selection Guide

1.  **Core PKI & Legacy Support**: Use **OpenSSL WASM**. It mimics the CLI environment, making it perfect for educational flows showing "real" commands.
2.  **Modern Elliptic Curves (JS-native)**: Use **@noble/curves**. It is lightweight, tree-shakeable, and faster for pure JS implementations of Ed25519 or secp256k1 when CLI demonstration isn't needed.
3.  **Hashing**: Use **@noble/hashes**. Supports all standard algorithms (SHA2, SHA3, RIPEMD, BLAKE) with a consistent API.
4.  **Post-Quantum**: Use **OpenSSL WASM**. Implementation aligns with FIPS 203 standards via the OQS provider.
5.  **Wallets / Mnemonics**: Use **@scure/bip39** and **@scure/bip32** for standard compliant wallet creation.

### 7. Common Pitfalls, Known Issues & Traps

**Usage of these libraries has revealed several critical traps to avoid:**

#### ⚠️ OpenSSL WASM Traps

1.  **Text Parsing Fragility (CRITICAL)**
    - **Issue**: Extracting raw keys by parsing `openssl pkey -text` output via Regex is extremely fragile. OpenSSL output formats change between minor versions.
    - **Trap**: `match(/priv:([\s\S]*?)(?:pub:|ASN1|$)/)` works for v3.1 but may break.
    - **Fix**: Always verify extracted lengths (e.g., 32 bytes for private keys, 65 bytes for uncompressed public keys). If length mismatches, the Regex likely captured garbage.
2.  **Entropy Starvation**
    - **Issue**: `openssl-wasm` does NOT automatically seed from the browser's PRNG.
    - **Trap**: Running keygen without a seeded `/dev/urandom` results in **deterministic (insecure) keys**.
    - **Fix**: You **MUST** write a `/random.seed` file with valid entropy before _every_ crypto command (see `openssl.worker.ts`).
3.  **WASM Memory Limits ("Unreachable")**
    - **Issue**: Large operations (like generating 4096-bit DH params) can crash the WASM runtime with `RuntimeError: unreachable`.
    - **Trap**: The worker dies and must be fully restarted.
    - **Fix**: Avoid blocking the main thread. Use smaller key sizes for demos (2048-bit RSA) or use native JS libs (@noble) for heavy ECC math.
4.  **Worker Path Resolution & ImportScripts**
    - **Issue**: Vite's `?worker` imports compile files as Modules, which breaks `importScripts()` (required for OpenSSL). Relative paths in `new Worker()` break on nested routes.
    - **Trap**: "Cannot use import statement outside a module" or 404s on nested routes.
    - **Fix**: Use the **Static Asset Pattern** (see below).

#### ⚠️ Testing Pitfalls (JSDOM & Web Workers)

1.  **JSDOM lacks Web Worker Support**
    - **Issue**: Integration tests running in JSDOM (Vitest/Jest) cannot spawn real Web Workers. `OpenSSLService` will fail with "Worker is not defined" or hang.
    - **Trap**: Attempting to test full crypto flows that rely on `openssl.worker.ts` without mocking.
    - **Fix**: **Always mock `OpenSSLService`** in integration tests. Do not try to run the WASM binary in JSDOM.

    ```typescript
    // Recommended Mock for integration.test.tsx
    vi.mock('src/services/crypto/OpenSSLService', () => ({
      openSSLService: {
        execute: vi.fn().mockResolvedValue({
          stdout: 'mock output',
          files: [],
          error: null,
        }),
        isReady: () => true,
      },
    }))
    ```

#### ⚠️ @noble & @scure Traps

1.  **Sync vs Async**
    - **Issue**: `@noble/hashes` methods are synchronous.
    - **Trap**: Hashing widespread data (e.g., 100MB file) on the main thread will freeze the UI.
    - **Fix**: Run hashing in a Web Worker or chunk the data using the streaming API (`hash.update(chunk)`).
2.  **Address Checksums (EIP-55)**
    - **Issue**: Ethereum addresses are case-sensitive checksums.
    - **Trap**: Converting to lowercase (`addr.toLowerCase()`) breaks the checksum validity.
    - **Fix**: Use `micro-eth-signer` or a verified checksum utility. Never manually munge casing for display.

### 9. Cheatsheet: Reference Imports

Use these exact import patterns to ensure compatibility and correct bundling.

#### OpenSSL WASM (Worker)

```typescript
// The Service (Broker)
import { openSSLService } from '../../services/crypto/OpenSSLService'

// The Worker (Inside Service Implementation)
// USE STATIC ASSET PATTERN (Bypasses Vite Module transformation)
this.worker = new Worker('/wasm/openssl-worker.js')
```

#### Native JS Crypto (@noble & @scure)

```typescript
// Elliptic Curves (Ed25519, secp256k1)
import { ed25519, x25519 } from '@noble/curves/ed25519'
import { secp256k1 } from '@noble/curves/secp256k1'

// Hashing (SHA2, SHA3, RIPEMD)
import { sha256, sha512 } from '@noble/hashes/sha2'
import { keccak_256 } from '@noble/hashes/sha3'
import { ripemd160 } from '@noble/hashes/ripemd160'

// Wallets & Mnemonics
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { HDKey } from '@scure/bip32'
```

#### Web Crypto API (Browser Native)

```typescript
// No import required. Globally available as:
window.crypto.subtle.generateKey(...)
window.crypto.getRandomValues(...)
```

### 10. Implementation Checklist for New Modules

- [ ] **Worker Integration**: Does the module use `OpenSSLService`?
- [ ] **Entropy**: Is the worker injecting entropy for key generation?
- [ ] **File Handling**: Are input files passed correctly to the `execute` method?
- [ ] **Cleanup**: Are sensitive files removed from memory/store when no longer needed?
- [ ] **Async**: Are UI loaders used while waiting for WASM operations?
- [ ] **Error Handling**: Are OpenSSL errors (`stderr`) caught and displayed to the user?

### 11. Troubleshooting

- **"OpenSSL Service not available"**: Usually means the Worker failed to load `openssl.js`. Check network tab and paths.
- **"Unreachable"**: WASM crash. Often due to memory limits or invalid instructions. Restart the worker.
- **Empty Output**: Forgot to `console.log` or write to a file? WASM capturing relies on `stdout`/`stderr` streams.
