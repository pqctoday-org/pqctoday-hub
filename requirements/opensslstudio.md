# OpenSSL Studio Requirements & Implementation Status

## Overview
OpenSSL Studio is a browser-based interface for OpenSSL v3.5.4, powered by WebAssembly. It allows users to perform cryptographic operations (Key Generation, CSR Creation, Certificate Signing, and Verification) directly in the browser without server-side processing.

**Status**: ✅ Fully Functional (RSA, EC, Ed25519, Random Data, Version Info confirmed working).

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
  - File Upload (Drag & Drop / Select).
  - File Download.
  - Text File Editing (in-browser editor).
  - File Deletion.
  - Automatic `openssl.cnf` provisioning.

### 3. Workbench UI
- **Command Builder**: Dynamic form-based generation of OpenSSL CLI commands.
- **Supported Operations**:
  - **Key Generation (`genpkey`)**:
    - Algorithms: RSA, EC, Ed25519, X25519, Ed448, X448.
    - Options: Key Size (RSA), Curve Name (EC), Cipher (AES/ARIA/Camellia), Passphrase.
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
- **Configuration Editor**: Dedicated button to view/edit `openssl.cnf` directly.

### 4. Terminal & Logging
- **Output**: Real-time streaming of `stdout` and `stderr` from the WASM process.
- **Command Preview**: Live preview of the generated OpenSSL command.
- **Status**: Visual indicators for "Processing", "Ready", and "Error" states.

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
- **RNG Initialization (`BN lib` error)**:
  - **Issue**: RSA key generation failed with `rsa_multiprime_keygen:BN lib` due to insufficient entropy or uninitialized DRBG.
  - **Solution**: 
    1. Inject 4KB of browser-sourced entropy into `/random.seed`.
    2. Attempt to write to `/dev/urandom` in MEMFS.
    3. Generate a minimal `openssl.cnf` that explicitly activates the `default` provider.
    4. Set `OPENSSL_CONF` and `RANDFILE` environment variables.
    5. Prepend `-rand /random.seed` to all commands.

## Future Roadmap
- **PQC Algorithms**: Enable specific PQC providers/algorithms if supported by the build.
- **File Drag & Drop**: Enhance FileManager with drag-and-drop zone.
- **Command History**: Allow re-running previous commands.
- **Multiple Files**: Support selecting specific input files for operations (currently auto-detects or uses fixed names).
