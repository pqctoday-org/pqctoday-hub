# OpenSSL Studio Requirements & Implementation Status

## Overview

OpenSSL Studio is a browser-based interface for OpenSSL v3.5.4, powered by WebAssembly. It allows users to perform cryptographic operations (Key Generation, CSR Creation, Certificate Signing, and Verification) directly in the browser without server-side processing.

**Status**: ✅ Fully Functional (RSA, EC, Ed25519, X25519, Ed448, X448, ML-KEM, ML-DSA, SLH-DSA confirmed working).

## Core Features

### 1. WebAssembly Integration

- **Version**: OpenSSL v3.5.4 (LTS with PQC support).
- **Architecture**: Custom Emscripten build with `MODULARIZE=1` and `EXPORTED_RUNTIME_METHODS=['callMain', 'FS']`.
- **Loading Strategy**:
  - Uses `fetch` + `eval` to bypass Module Worker restrictions for UMD scripts.
  - Robust initialization with `waitForRuntime` to ensure `callMain` is available.
- **Entropy**: Injects browser-sourced entropy (`crypto.getRandomValues`) into `/random.seed` and uses `-rand` to ensure secure key generation.
- **Configuration**: Automatically loads and configures `openssl.cnf` with `OPENSSL_CONF` and `RANDFILE` environment variables.

### 2. Virtual File System (VFS)

- **Architecture**: Synchronization bridge between React State (Zustand) and Emscripten MEMFS.
- **Flow**:
  1. **Upload/Edit**: User modifies files in UI -> Updates Store.
  2. **Sync**: `useOpenSSL` hook writes all Store files to Worker MEMFS before execution.
  3. **Execute**: OpenSSL reads/writes to MEMFS.
  4. **Feedback**: Worker scans MEMFS for new files and sends them back to Store -> UI Updates.
- **Features**:
  - File Upload (Drag & Drop / Select / "Add File" button).
  - File Download.
  - Text File Editing (in-browser editor).
  - File Deletion.
  - Automatic `openssl.cnf` provisioning.

### 3. Workbench UI

- **Command Builder**: Dynamic form-based generation of OpenSSL CLI commands.
- **Supported Operations**:
  - **Key Generation (`genpkey`)**:
    - **Classical Algorithms**: RSA, EC, Ed25519, X25519, Ed448, X448.
    - **Post-Quantum KEM**: ML-KEM-512, ML-KEM-768, ML-KEM-1024.
    - **Post-Quantum Signatures**: ML-DSA-44/65/87, SLH-DSA (all 12 variants: SHA2 & SHAKE).
    - Options: Key Size (RSA), Curve Name (EC), Cipher (AES/ARIA/Camellia), Passphrase.
    - **Public Key Extraction**: Built-in button to extract `.pub` files from private keys (required for KEM encapsulation).
  - **CSR Request (`req`)**:
    - Fields: Common Name, Organization, Country.
    - Options: Digest Algorithm (SHA2/SHA3/BLAKE2).
  - **Certificate (`x509`)**:
    - Self-signed certificate generation.
    - Validity period configuration.
  - **Sign / Verify (`dgst`)**:
    - Sign data with private key.
    - Verify signatures with public key.
    - Algorithms: SHA2, SHA3, SHAKE, BLAKE2.
  - **Random Data (`rand`)**:
    - Generate cryptographically secure random bytes.
    - Options: Byte count, Hex output.
    - Used for verifying RNG functionality.
  - **Version Info (`version`)**:
    - Display detailed OpenSSL build information (`-a`).
    - **Location**: Moved to the top of the sidebar (before Operation Logs) for better visibility.
  - **Encryption (`enc`)**:
    - Symmetric encryption and decryption using passphrase-based key derivation.
    - Algorithms: AES-128/192/256 (CBC, CTR).
    - Options: Input/Output files, Passphrase, Show Derived Key & IV (`-p`), Custom IV support.
    - **Automation**: Automatically sets output filename to `<input>.enc` (encrypt) or original name (decrypt) and adds it to VFS.
    - **Note**: AES key generation via `genpkey` has been removed as it is not supported by the current OpenSSL build. Use passphrase-based encryption or the Playground for AES keys.
  - **Key Encapsulation (`pkeyutl`)**:
    - KEM Encapsulate (Public Key) and Decapsulate (Private Key).
    - Supports ML-KEM and other KEM-capable algorithms.
    - **Workflow**: Generate key → Extract public key (`.pub`) → Use `.pub` for encapsulation, `.key` for decapsulation.
  - **PKCS#12 (`pkcs12`)**:
    - Export: Bundle Certificate and Private Key into `.p12` file.
    - Import: Extract Certificate and Private Key from `.p12` file to `.pem`.
- **Configuration Editor**: Dedicated button to view/edit `openssl.cnf` directly.
- **File Manager (Enhanced)**:
  - **Location**: Right Pane (Permanent visibility).
  - **Features**:
    - **Size Column**: Displays human-readable file sizes.
    - **Sorting**: Sort by Name, Type, Size, or Date.
    - **Timestamps**: Compact formatting for better readability.
    - **Actions**: Preview, Download, Delete, Extract Public Key (from `.key`), Create ZIP backup.

### 4. Terminal & Logging

- **Terminal Output**: Real-time streaming of `stdout` and `stderr` from the WASM process.
- **Operation Log**:
  - **Persistence**: Logs persist across command runs (unlike terminal output which clears).
  - **Detailed Columns**: Displays Timestamp, Operation Type, Full Command, File Name, File Size, and Execution Duration.
  - **Visuals**: Color-coded duration (Green <100ms, Yellow <500ms, Red >500ms).
- **Command Preview**:
  - **Location**: Left Pane (Vertically Centered).
  - **Design**: Large, high-contrast code block (`min-height: 160px`) for visibility.
  - **Controls**: "Run Command" button embedded in the header to save space.
  - **Features**: One-click copy to clipboard.
- **Status**: Visual indicators for "Processing", "Ready", and "Error" states.

### 5. Navigation & Layout

- **Split-Pane Layout**:
  - **Left Pane**: Workbench Configuration & Command Preview.
  - **Right Pane**: File Manager & Terminal Output / Logs.
- **Sidebar-Driven**: Configuration capability via the Workbench sidebar.
- **Unified Workflow**: Command generation and execution are now visually contiguous in the left pane.
- **Clean Headers**: Simplified panel headers with static titles.

### 6. Analytics Tracking

- **Event Tracking**: User interactions are tracked via Google Analytics:
  - **Command Execution**: Tracks which commands (`genpkey`, `req`, `x509`, etc.) are run.
  - **File Operations**: Tracks file uploads, downloads, deletions, backups, and imports.
  - **Category Selection**: Tracks which operation categories users explore.

## Technical Implementation Details

### Worker (`openssl.worker.ts`)

- **Initialization**:
  - Fetches `openssl.js` and `openssl.wasm`.
  - Configures Emscripten module with `noInitialRun: true`.
  - Mounts `/ssl` directory and writes `openssl.cnf` (activating `default` and `legacy` providers).
  - Mounts `/random.seed` with 4KB of entropy from `crypto.getRandomValues`.
  - Attempts to seed `/dev/urandom` directly for robustness.
- **Execution**:
  - Sets `OPENSSL_CONF` and `RANDFILE` environment variables.
  - Prepends `-rand /random.seed` to command arguments to ensure entropy.
  - Invokes `callMain` with arguments.
  - Catches `ExitStatus` to prevent worker termination.
  - Scans for new files (`.key`, `.csr`, `.crt`, `.bin`, etc.) and emits `FILE_CREATED` events.

### State Management (`store.ts`)

- **Zustand Store**:
  - `files`: Array of virtual files (content, metadata).
  - `logs`: Command execution history.
  - `command`: Current command string.
  - `editingFile`: State for the active file editor.

### Components

- **`OpenSSLStudioView`**: Main layout container.
- **`Workbench`**: Command configuration and generation.
- **`FileManager`**: VFS visualization, upload/download/edit actions.
- **`TerminalOutput`**: Log display.

### Key Challenges & Solutions

1.  **WASM Entropy Injection**:
    - **Challenge**: OpenSSL WASM requires a seeded `/dev/urandom` or `RANDFILE` to function. Without it, commands fail silently or with PRNG errors.
    - **Solution**: We use `self.crypto.getRandomValues()` to generate a 4KB seed and write it to `/random.seed` and `/dev/urandom` in the WASM virtual filesystem before every command execution. We also set `RANDFILE=/random.seed` in the environment.

2.  **WASM Module Loading**:
    - **Challenge**: Loading the Emscripten-generated `openssl.js` via `fetch` + `eval` caused parsing errors ("Unexpected string literal") due to Vite's transformation. Using standard ES modules failed because `importScripts` is not available in module workers.
    - **Solution**: We switched the Web Worker to `type: 'classic'` and used `importScripts` to load the WASM glue code. To support this, we consolidated the worker logic into a single file (bundling internal modules) and added a shim for `module.exports` to robustly capture the OpenSSL factory function.

3.  **Algorithm Support & Limitations**:
    - **Fully Supported & Verified**:
      - **Classical**: RSA, EC (P-256, P-384, P-521, secp256k1), Ed25519, X25519, Ed448, X448.
      - **ML-DSA (FIPS 204)**: ML-DSA-44, ML-DSA-65, ML-DSA-87.
      - **SLH-DSA (FIPS 205)**: All 12 variants (SHA2-128s/f, SHA2-192s/f, SHA2-256s/f, SHAKE-128s/f, SHAKE-192s/f, SHAKE-256s/f).
      - **ML-KEM (FIPS 203)**: ML-KEM-512, ML-KEM-768, ML-KEM-1024.
    - **Gap Analysis (vs OpenSSL 3.5.4)**:
      - **Missing Classical**: DSA, DH (Diffie-Hellman), SM2, GOST.
      - **Missing Curves**: Brainpool, NIST K-curves.
      - **Missing Symmetric**: SM4, ChaCha20-Poly1305, 3DES, Blowfish, RC4, IDEA, SEED, CAST5.
      - **Missing Hashes**: SM3, RIPEMD-160, Whirlpool.
      - **Missing KDFs**: Argon2, SCRYPT, PBKDF2, HKDF (not exposed in UI).
    - **Known Limitations**:
      - **AES**: Key generation (`genpkey -algorithm AES`) is not supported. Use passphrase-based encryption (`enc`) or the Playground for AES operations.
    - **Recommendation**: The current suite covers all modern standard and post-quantum needs. Legacy algorithms (DSA, 3DES) are omitted by design but can be added if required.

4.  **React StrictMode & Worker Re-initialization**:
    - **Challenge**: In development, React StrictMode mounts components twice. This caused the `useOpenSSL` hook to spawn two workers, leading to duplicate log output. Furthermore, the worker script was being re-executed in the same global context, causing "Identifier has already been declared" errors for top-level `const` and `class` definitions.
    - **Solution**:
      - **Duplicate Logs**: Added an `active` flag in the `useOpenSSL` cleanup function to ignore messages from the terminated worker instance.
      - **Initialization Errors**: Converted all top-level `const` and `class` declarations in `openssl.worker.ts` to `var` assignments. This allows the script to be re-evaluated safely without throwing redeclaration errors.

5.  **Regression Test Timeouts (PQC Algorithms)**:
    - **Challenge**: End-to-end tests for `ML-KEM-768` keys were consistently timing out (>60s) in the automated environment, despite working manually (<1s).
    - **Investigation**: Resource monitoring showed low usage. Visual debugging revealed the test runner was waiting indefinitely for UI elements.
    - **Root Cause**: The Playwright tests were using an invalid CSS selector (`#key-algo-select`) instead of the correct ID (`#algo-select`).
    - **Solution**: Updated the test selectors in `e2e/openssl-pqc.spec.ts`. All regression tests now pass in <4s per case.

### Future Improvements

- [x] Test and verify all ML-KEM and SLH-DSA variants (Verified via E2E tests)
- Investigate a custom OpenSSL build with explicit support for `no-asm` and `no-threads` to potentially resolve RSA/EC stability issues.
- Explore migrating to a pure JS implementation (like `forge` or `noble-crypto`) if WASM limitations prove too restrictive for legacy algorithms.

## Future Roadmap

- [x] **PQC Algorithms**: Enable specific PQC providers/algorithms (Completed)
- [x] **File Backup/Restore**: Backup all files to ZIP and import from ZIP (Completed)
- **File Drag & Drop**: Enhance FileManager with drag-and-drop zone.
- **Command History**: Allow re-running previous commands.
- **Multiple Files**: Support selecting specific input files for operations (currently auto-detects or uses fixed names).
