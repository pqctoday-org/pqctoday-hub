# OpenSSL TLS Client-Server Testing Module

## Functional Requirements Document

**Document Version:** 1.0  
**Target Platform:** PQC Today Learn Modules  
**Date:** December 12, 2025  
**Classification:** Educational / Training Material  
**Technology Stack:** OpenSSL v3.5.4 with WebAssembly (WASM)

---

## 1. Executive Summary

### 1.1 Purpose

This document specifies the functional requirements for an interactive educational module that enables users to configure, test, and observe **TLS 1.3** client-server connectivity using OpenSSL v3.5.4 compiled to WebAssembly. The module focuses exclusively on **modern, non-deprecated cipher suites** to teach current best practices in secure communications. It is designed to help security professionals, developers, and students understand TLS 1.3 cipher negotiation, configuration, and the practical implications of different cryptographic settings in a safe, browser-based sandbox environment.

### 1.2 Scope

The module provides a split-screen interface where users can:

- Configure independent OpenSSL TLS 1.3 client and server instances
- Establish TLS 1.3 connections with modern AEAD cipher suites only
- Observe real-time cipher negotiation outcomes
- Test post-quantum cryptography (PQC) cipher suites in hybrid mode
- Understand TLS 1.3's simplified cipher suite structure
- Transmit test messages and verify successful encrypted communication
- Learn TLS 1.3 best practices without requiring local OpenSSL installations

**SCOPE LIMITATION:** This module supports **TLS 1.3 ONLY** with **MODERN AEAD CIPHER SUITES ONLY**. No legacy protocols (TLS 1.2, TLS 1.1, TLS 1.0) or deprecated cipher suites are supported.

### 1.3 Educational Objectives

Upon completion of interaction with this module, users will be able to:

- Understand TLS 1.3 handshake mechanics and simplified cipher negotiation
- Configure OpenSSL TLS 1.3 cipher strings correctly
- Identify compatibility issues between client and server TLS 1.3 configurations
- Evaluate the impact of cipher suite ordering on negotiation
- Understand TLS 1.3's separation of cipher suites from key exchange and signature algorithms
- Test hybrid PQC/classical cryptographic configurations
- Explain why TLS 1.3 eliminates legacy cryptography
- Troubleshoot common TLS 1.3 connectivity issues

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser Environment                          │
│                                                                     │
│  ┌───────────────────────────┐  ┌───────────────────────────────┐ │
│  │   Client Panel (Left)     │  │   Server Panel (Right)        │ │
│  │                           │  │                               │ │
│  │  ┌─────────────────────┐  │  │  ┌─────────────────────┐     │ │
│  │  │ OpenSSL Config      │  │  │  │ OpenSSL Config      │     │ │
│  │  │ - Cipher String     │  │  │  │ - Cipher String     │     │ │
│  │  │ - Protocol Version  │  │  │  │ - Protocol Version  │     │ │
│  │  │ - Certificates      │  │  │  │ - Certificates      │     │ │
│  │  └─────────────────────┘  │  │  └─────────────────────┘     │ │
│  │                           │  │                               │ │
│  │  [Connect Button]         │  │  [● Connection Status]        │ │
│  │                           │  │                               │ │
│  │  ┌─────────────────────┐  │  │  ┌─────────────────────┐     │ │
│  │  │ Message Input       │  │  │  │ Received Message    │     │ │
│  │  │                     │  │  │  │                     │     │ │
│  │  └─────────────────────┘  │  │  └─────────────────────┘     │ │
│  └───────────────────────────┘  └───────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │         Negotiation Results Panel (Bottom)                  │  │
│  │                                                             │  │
│  │  Agreed Cipher Suite: TLS_AES_256_GCM_SHA384               │  │
│  │  Protocol Version: TLS 1.3                                 │  │
│  │  Key Exchange: X25519                                      │  │
│  │  Signature Algorithm: RSA-PSS-SHA256                       │  │
│  │  Forward Secrecy: Yes                                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                     │
│         ┌─────────────────────────────────────┐                    │
│         │  OpenSSL 3.5.4 WASM Runtime         │                    │
│         │  - s_client simulation              │                    │
│         │  - s_server simulation              │                    │
│         └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Interaction Flow

1. User configures client OpenSSL parameters (left panel)
2. User configures server OpenSSL parameters (right panel)
3. User clicks "Connect" button
4. WASM-compiled OpenSSL instances initiate TLS handshake
5. System displays negotiation progress and results
6. Upon successful connection, user can send test message
7. Server receives and displays message
8. Detailed cipher negotiation information displayed in results panel

---

## 3. Functional Requirements

### 3.1 User Interface Requirements

#### FR-UI-001: Split-Screen Layout

**Priority:** MUST  
**Description:** The module shall provide a horizontally split interface with equal-width panels for client (left) and server (right) configuration.

**Acceptance Criteria:**

- Left panel labeled "TLS Client Configuration"
- Right panel labeled "TLS Server Configuration"
- Responsive layout adapts to different screen sizes (minimum 1024px width)
- Clear visual separation between panels (vertical divider)

#### FR-UI-002: Client Configuration Panel

**Priority:** MUST  
**Description:** The left panel shall provide OpenSSL TLS 1.3 client configuration options.

**Configuration Fields:**

- **Cipher Suite String Input Field**
  - Label: "TLS 1.3 Cipher Suites"
  - Type: Text input (multi-line capable)
  - Default value: "TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256"
  - Placeholder: "e.g., TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256"
  - Validation: TLS 1.3 cipher suite format only
  - Help text: "TLS 1.3 cipher suites (AEAD only)"
- **Supported Groups (Key Exchange)**
  - Label: "Key Exchange Groups"
  - Type: Multi-select checkboxes
  - Options:
    - X25519 (default: checked)
    - X448
    - secp256r1 (P-256)
    - secp384r1 (P-384)
    - secp521r1 (P-521)
    - Kyber768 (if PQC supported)
  - Default: X25519, secp256r1
  - Help text: "Supported groups for key exchange"

- **Signature Algorithms**
  - Label: "Signature Algorithms"
  - Type: Multi-select checkboxes
  - Options:
    - rsa_pss_rsae_sha256 (default: checked)
    - rsa_pss_rsae_sha384
    - rsa_pss_rsae_sha512
    - ecdsa_secp256r1_sha256
    - ecdsa_secp384r1_sha384
    - ed25519
  - Default: rsa_pss_rsae_sha256, ecdsa_secp256r1_sha256
  - Help text: "Accepted signature algorithms for certificates"

- **Certificate Verification Toggle**
  - Label: "Verify Server Certificate"
  - Type: Checkbox
  - Default: Unchecked (for educational flexibility)
  - Warning: Display educational notice when disabled

- **SNI (Server Name Indication)**
  - Label: "Server Name (SNI)"
  - Type: Text input
  - Default: "localhost"
  - Optional field

- **Connect Button**
  - Label: "Establish TLS 1.3 Connection"
  - State: Enabled when valid configuration provided
  - Visual feedback during connection attempt

**Acceptance Criteria:**

- All fields properly labeled with tooltips explaining TLS 1.3 specifics
- Input validation prevents invalid cipher suite names
- Configuration can be saved/loaded via browser storage
- Clear error messages for invalid inputs
- Educational notes explain TLS 1.3's separation of cipher/key exchange/signature

#### FR-UI-003: Server Configuration Panel

**Priority:** MUST  
**Description:** The right panel shall provide OpenSSL TLS 1.3 server configuration options.

**Configuration Fields:**

- **Cipher Suite String Input Field**
  - Label: "TLS 1.3 Cipher Suites"
  - Type: Text input (multi-line capable)
  - Default value: "TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256"
  - Validation: TLS 1.3 cipher suite format only
  - Help text: "Server cipher preference order (first = highest priority)"

- **Supported Groups (Key Exchange)**
  - Label: "Key Exchange Groups"
  - Type: Multi-select checkboxes
  - Options: Same as client (X25519, X448, P-256, P-384, P-521, Kyber768)
  - Default: X25519, secp256r1
  - Help text: "Server supported groups for key exchange"

- **Signature Algorithms**
  - Label: "Signature Algorithms"
  - Type: Multi-select checkboxes
  - Options: Same as client
  - Default: rsa_pss_rsae_sha256, ecdsa_secp256r1_sha256

- **Certificate Selection**
  - Label: "Server Certificate"
  - Type: Dropdown
  - Options:
    - "Self-signed RSA 2048"
    - "Self-signed RSA 4096"
    - "Self-signed ECDSA P-256"
    - "Self-signed ECDSA P-384"
    - "Self-signed Ed25519"
  - Default: "Self-signed ECDSA P-256" (modern choice)
  - Help text: "Certificate type affects signature algorithm negotiation"

- **Connection Status Indicator**
  - Type: Visual indicator (icon + text)
  - States:
    - "Idle" (gray circle)
    - "Connecting..." (yellow animated circle)
    - "TLS 1.3 Connected" (green solid circle)
    - "Failed" (red circle with error icon)
  - Display duration of connection establishment
  - Display "TLS 1.3" protocol badge when connected

**Acceptance Criteria:**

- Server panel mirrors client panel layout for consistency
- Connection status updates in real-time
- Configuration persists across browser sessions
- Clear indication that only TLS 1.3 is supported

#### FR-UI-004: Message Transmission Interface

**Priority:** MUST  
**Description:** Upon successful connection, the module shall provide message transmission capability.

**Client Side (Left Panel):**

- **Message Input Field**
  - Label: "Message to Send"
  - Type: Text area
  - Default: "hello quantum world"
  - Max length: 1024 characters
  - Character counter displayed

- **Send Button**
  - Label: "Send Message"
  - State: Enabled only when connected
  - Visual feedback on transmission

**Server Side (Right Panel):**

- **Received Message Display**
  - Label: "Received Message"
  - Type: Read-only text area
  - Display timestamp of receipt
  - Character count of received message
  - Visual confirmation animation on receipt

**Acceptance Criteria:**

- Message transmission occurs over established TLS connection
- Received message matches sent message exactly
- Transmission latency displayed (educational metric)
- Support for multiple message exchanges without reconnection

#### FR-UI-005: Negotiation Results Panel

**Priority:** MUST  
**Description:** The module shall display comprehensive TLS 1.3 negotiation outcomes below the split panels.

**Display Fields:**

- **Protocol Version**
  - Fixed display: "TLS 1.3" (always, since TLS 1.3 only)
- **Negotiated Cipher Suite**
  - Full cipher suite name (e.g., "TLS_AES_256_GCM_SHA384")
  - IANA cipher suite code (e.g., "0x13,0x02")
  - Components breakdown:
    - Encryption: AES-256-GCM
    - Hash: SHA384
    - Note: "AEAD (Authenticated Encryption)"
- **Key Exchange Algorithm**
  - Negotiated group (e.g., "X25519", "secp256r1", "Kyber768")
  - Display which side offered this group
  - For hybrid PQC: Show both classical and PQ components
- **Signature Algorithm**
  - Server certificate signature algorithm
  - Handshake signature algorithm (e.g., "rsa_pss_rsae_sha256", "ecdsa_secp256r1_sha256")
- **TLS 1.3 Specific Information**
  - Handshake mode: "1-RTT" or "0-RTT" (if resumption supported)
  - Early data: Supported/Not supported
  - Session resumption: Available/Not available
  - PSK mode: None/PSK-DHE/PSK-only (if applicable)

- **Security Properties**
  - Forward Secrecy: "Yes (mandatory in TLS 1.3)"
  - Post-Quantum Safe: Yes/No/Hybrid
  - Encryption: "AEAD (authenticated encryption)"
  - Key size: Display in bits

- **Extensions Negotiated**
  - ALPN (Application-Layer Protocol Negotiation) if configured
  - SNI (Server Name Indication)
  - Supported versions
  - Key share

**Educational Notes:**

- Explain why TLS 1.3 removed non-AEAD ciphers
- Highlight that forward secrecy is mandatory
- Note that cipher suite no longer includes key exchange/signature

**Acceptance Criteria:**

- Results update immediately after successful handshake
- All information presented in readable, formatted manner
- Educational tooltips explain TLS 1.3 improvements
- Color coding: green for all fields (TLS 1.3 has no weak options)
- Export capability for results (JSON or text format)
- Clear indication that this is TLS 1.3 (modern protocol)

#### FR-UI-006: Preset Configurations

**Priority:** SHOULD  
**Description:** The module shall provide preset configuration scenarios for common use cases.

#### FR-UI-006: Preset Configurations

**Priority:** SHOULD  
**Description:** The module shall provide preset configuration scenarios for common TLS 1.3 use cases.

**Preset Scenarios:**

1. **"TLS 1.3 Default" (Recommended)**
   - Client Ciphers: `TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256`
   - Server Ciphers: `TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256`
   - Key Exchange: X25519, secp256r1
   - Certificate: ECDSA P-256
   - **Purpose:** Modern, efficient TLS 1.3 configuration

2. **"TLS 1.3 ChaCha20 (Mobile Optimized)"**
   - Client Ciphers: `TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256`
   - Server Ciphers: `TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256`
   - Key Exchange: X25519
   - Certificate: Ed25519
   - **Purpose:** Optimized for mobile devices without AES hardware acceleration

3. **"TLS 1.3 Maximum Security"**
   - Client Ciphers: `TLS_AES_256_GCM_SHA384`
   - Server Ciphers: `TLS_AES_256_GCM_SHA384`
   - Key Exchange: X448, secp384r1
   - Signature: rsa_pss_rsae_sha512, ecdsa_secp384r1_sha384
   - Certificate: ECDSA P-384
   - **Purpose:** Highest security parameters

4. **"Post-Quantum Hybrid"**
   - Client Ciphers: `TLS_AES_256_GCM_SHA384`
   - Server Ciphers: `TLS_AES_256_GCM_SHA384`
   - Key Exchange: Kyber768, X25519 (hybrid)
   - Certificate: ECDSA P-256 or Dilithium (if supported)
   - **Purpose:** Quantum-resistant cryptography testing

5. **"Cipher Suite Mismatch Test"**
   - Client Ciphers: `TLS_AES_256_GCM_SHA384`
   - Server Ciphers: `TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256`
   - Key Exchange: X25519
   - **Purpose:** Demonstrate negotiation failure (no common cipher)

6. **"Key Exchange Mismatch Test"**
   - Client Groups: X448 only
   - Server Groups: X25519 only
   - **Purpose:** Demonstrate group negotiation failure

7. **"Signature Algorithm Mismatch Test"**
   - Client Signatures: ecdsa_secp256r1_sha256 only
   - Server Certificate: RSA 2048
   - **Purpose:** Demonstrate signature algorithm compatibility issue

**Acceptance Criteria:**

- Preset selector dropdown in both panels
- One-click application of preset
- Preset includes educational description of scenario and expected outcome
- Custom configurations can be saved as user presets
- All presets use TLS 1.3 only with modern cipher suites
- Educational notes explain what each preset demonstrates

**Acceptance Criteria:**

- Preset selector dropdown in both panels
- One-click application of preset
- Preset includes educational description of scenario
- Custom configurations can be saved as user presets

---

### 3.2 OpenSSL Integration Requirements

#### FR-SSL-001: OpenSSL WASM Compilation

**Priority:** MUST  
**Description:** The module shall use OpenSSL v3.5.4 compiled to WebAssembly.

**Technical Requirements:**

- OpenSSL version: 3.5.4 (exact version for consistency)
- WASM target: emscripten with threading support if available
- Minimum compilation flags:
  - `no-asm` for WASM compatibility
  - `threads` support for performance (if browser supports)
  - `enable-tls1_3` for TLS 1.3 support
  - `enable-ec_nistp_64_gcc_128` for optimized ECC
  - PQC algorithm support if available in 3.5.4 (via OQS provider)

**Excluded Features** (to reduce WASM size):

- Legacy protocols (SSL 3.0, TLS 1.0, TLS 1.1)
- Weak ciphers (DES, RC4, MD5-based)
- Unnecessary engines
- Documentation and test tools

**Acceptance Criteria:**

- WASM binary size under 5MB (compressed)
- Load time under 3 seconds on standard broadband
- Memory footprint under 50MB per instance
- Support for at least 50 cipher suites

#### FR-SSL-002: Client Simulation

**Priority:** MUST  
**Description:** The module shall simulate OpenSSL s_client behavior for TLS 1.3 within the browser.

**Functional Capabilities:**

- Accept user-provided TLS 1.3 cipher suite string
- Accept user-provided supported groups (key exchange)
- Accept user-provided signature algorithms
- Force TLS 1.3 protocol version (no fallback)
- Generate ephemeral client keys for key exchange
- Perform TLS 1.3 handshake with simulated server
- Validate server certificate (if enabled)
- Support SNI extension
- Transmit application data over established connection
- Handle TLS 1.3-specific features (1-RTT handshake)
- Handle connection errors gracefully

**OpenSSL API Equivalents:**

```c
// Create TLS 1.3 context
SSL_CTX *ctx = SSL_CTX_new(TLS_client_method());

// Force TLS 1.3 only
SSL_CTX_set_min_proto_version(ctx, TLS1_3_VERSION);
SSL_CTX_set_max_proto_version(ctx, TLS1_3_VERSION);

// Set TLS 1.3 cipher suites
SSL_CTX_set_ciphersuites(ctx, "TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256");

// Set supported groups
SSL_CTX_set1_groups_list(ctx, "X25519:secp256r1");

// Set signature algorithms
SSL_CTX_set1_sigalgs_list(ctx, "rsa_pss_rsae_sha256:ecdsa_secp256r1_sha256");

// Create connection and perform handshake
SSL *ssl = SSL_new(ctx);
SSL_set_tlsext_host_name(ssl, "localhost");
SSL_connect(ssl);

// Send application data
SSL_write(ssl, "hello quantum world", 19);

// Query negotiated parameters
SSL_get_cipher(ssl);           // Get negotiated cipher suite
SSL_get_version(ssl);          // Get protocol version (TLS 1.3)
SSL_get_curve_name(ssl);       // Get negotiated group
```

**TLS 1.3 Handshake Simulation:**

1. **ClientHello:**
   - Offer TLS 1.3 cipher suites
   - Include supported_groups extension with key shares
   - Include signature_algorithms extension
   - Include SNI extension
2. **Process ServerHello:**
   - Verify selected cipher suite is from client's list
   - Verify selected key share group
   - Compute shared secret

3. **Verify EncryptedExtensions**

4. **Verify Server Certificate** (if verification enabled)
   - Check signature algorithm compatibility
5. **Verify CertificateVerify**
   - Validate server's handshake signature

6. **Send Finished message**

7. **Transition to application data mode**

**Acceptance Criteria:**

- Handshake completes within 1 second (local simulation)
- Accurate reflection of OpenSSL TLS 1.3 client behavior
- Comprehensive error reporting for TLS 1.3 specific failures
- No support for TLS 1.2 or earlier (hard-coded TLS 1.3)

#### FR-SSL-003: Server Simulation

**Priority:** MUST  
**Description:** The module shall simulate OpenSSL s_server behavior for TLS 1.3 within the browser.

**Functional Capabilities:**

- Accept user-provided TLS 1.3 cipher suite string with preference ordering
- Accept user-provided supported groups (key exchange)
- Accept user-provided signature algorithms
- Load server certificate and private key
- Force TLS 1.3 protocol version (no fallback)
- Accept incoming TLS 1.3 connections from simulated client
- Perform server-side TLS 1.3 handshake
- Receive application data
- Server cipher preference enforced (TLS 1.3 default behavior)

**OpenSSL API Equivalents:**

```c
// Create TLS 1.3 server context
SSL_CTX *ctx = SSL_CTX_new(TLS_server_method());

// Force TLS 1.3 only
SSL_CTX_set_min_proto_version(ctx, TLS1_3_VERSION);
SSL_CTX_set_max_proto_version(ctx, TLS1_3_VERSION);

// Set TLS 1.3 cipher suites (in preference order)
SSL_CTX_set_ciphersuites(ctx, "TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256");

// Load server certificate and key
SSL_CTX_use_certificate(ctx, cert);
SSL_CTX_use_PrivateKey(ctx, key);

// Set supported groups
SSL_CTX_set1_groups_list(ctx, "X25519:secp256r1");

// Set signature algorithms
SSL_CTX_set1_sigalgs_list(ctx, "rsa_pss_rsae_sha256:ecdsa_secp256r1_sha256");

// Accept connection
SSL *ssl = SSL_new(ctx);
SSL_accept(ssl);

// Receive application data
SSL_read(ssl, buffer, sizeof(buffer));
```

**TLS 1.3 Server Handshake:**

1. **Receive ClientHello:**
   - Extract client's offered cipher suites
   - Extract client's supported groups
   - Extract client's signature algorithms
   - Extract client's key shares

2. **Select Cipher Suite:**
   - Choose first cipher from server's list that client supports
   - Server preference enforced

3. **Select Key Exchange Group:**
   - Choose first group from server's list with client key share
   - If no key share available, request via HelloRetryRequest

4. **Send ServerHello:**
   - Selected cipher suite
   - Selected key share
   - Compute shared secret

5. **Send EncryptedExtensions**

6. **Send Certificate:**
   - Server certificate chain

7. **Send CertificateVerify:**
   - Sign handshake transcript with private key
   - Use signature algorithm compatible with certificate

8. **Send Finished message**

9. **Wait for client Finished**

10. **Transition to application data mode**

**Cipher Preference:**

- Server cipher order always takes precedence (TLS 1.3 specification default)
- First matching cipher from server's list is selected
- Clearly indicate in UI that server preference is used

**Acceptance Criteria:**

- Server responds to handshake within 500ms
- Accurate cipher negotiation per TLS 1.3 specification (RFC 8446)
- Support for sequential client connections (not concurrent)
- Proper handling of connection termination
- No support for TLS 1.2 or earlier

#### FR-SSL-004: Certificate Management

**Priority:** MUST  
**Description:** The module shall provide pre-generated certificates for server configuration.

**Built-in Certificates:**

1. **RSA 2048-bit Self-Signed**
   - Common Name: "localhost"
   - Validity: 365 days from module deployment
   - Subject: CN=localhost, O=PQC Today, C=EU

2. **RSA 4096-bit Self-Signed**
   - Same attributes, larger key size

3. **ECDSA P-256 Self-Signed**
   - Curve: prime256v1
   - Same subject attributes

4. **ECDSA P-384 Self-Signed**
   - Curve: secp384r1
   - Same subject attributes

5. **Ed25519 Self-Signed**
   - Same subject attributes
   - For TLS 1.3 compatibility testing

**Certificate Properties:**

- All certificates include subjectAltName with DNS:localhost
- Private keys embedded in WASM (educational context only)
- Educational warning: "These certificates are for learning purposes only"

**Future Enhancement (SHOULD):**

- User upload of custom certificate/key pairs (PEM format)
- Certificate chain support (intermediate CAs)
- Certificate validation against custom trust anchors

**Acceptance Criteria:**

- All certificates load without errors
- Private key pairs validated at module initialization
- Certificate details displayable to user
- Clear educational context provided

#### FR-SSL-005: Cipher Suite Support

**Priority:** MUST  
**Description:** The module shall support TLS 1.3 cipher suites exclusively. **NO legacy or deprecated cipher suites are supported.**

**TLS 1.3 DESIGN PRINCIPLE:**
TLS 1.3 was redesigned from the ground up to eliminate cryptographic weaknesses. It supports ONLY modern AEAD (Authenticated Encryption with Associated Data) cipher suites. There are NO deprecated, weak, or legacy options in TLS 1.3.

**Supported TLS 1.3 Cipher Suites:**

| Cipher Suite Name              | IANA Code | Encryption        | Hash    | Use Case                       | Priority     |
| ------------------------------ | --------- | ----------------- | ------- | ------------------------------ | ------------ |
| `TLS_AES_256_GCM_SHA384`       | 0x13,0x02 | AES-256-GCM       | SHA-384 | High security, AES-NI hardware | **HIGH**     |
| `TLS_AES_128_GCM_SHA256`       | 0x13,0x01 | AES-128-GCM       | SHA-256 | Balanced performance/security  | **HIGH**     |
| `TLS_CHACHA20_POLY1305_SHA256` | 0x13,0x03 | ChaCha20-Poly1305 | SHA-256 | Mobile/no AES hardware         | **MEDIUM**   |
| `TLS_AES_128_CCM_SHA256`       | 0x13,0x04 | AES-128-CCM       | SHA-256 | IoT/constrained devices        | **OPTIONAL** |

**Key Properties (ALL TLS 1.3 Cipher Suites):**

- ✅ **AEAD:** All cipher suites use authenticated encryption
- ✅ **Perfect Forward Secrecy:** Mandatory (ephemeral key exchange required)
- ✅ **Modern Algorithms:** No MD5, SHA-1, RC4, 3DES, or other deprecated crypto
- ✅ **No Static RSA:** Key exchange always uses ephemeral keys
- ✅ **Simplified Structure:** Cipher suite only specifies AEAD algorithm + hash

**Key Exchange (Separate from Cipher Suite in TLS 1.3):**
Negotiated via `supported_groups` extension:

- **X25519** (recommended, Curve25519)
- **X448** (high security, Curve448)
- **secp256r1** (NIST P-256, widely supported)
- **secp384r1** (NIST P-384, high security)
- **secp521r1** (NIST P-521, maximum classical security)
- **Kyber768** (post-quantum, hybrid mode - if OpenSSL 3.5.4 supports via OQS provider)

**Signature Algorithms (Separate from Cipher Suite in TLS 1.3):**
Negotiated via `signature_algorithms` extension:

- **rsa_pss_rsae_sha256** (RSA-PSS with SHA-256)
- **rsa_pss_rsae_sha384** (RSA-PSS with SHA-384)
- **rsa_pss_rsae_sha512** (RSA-PSS with SHA-512)
- **ecdsa_secp256r1_sha256** (ECDSA P-256 with SHA-256)
- **ecdsa_secp384r1_sha384** (ECDSA P-384 with SHA-384)
- **ed25519** (EdDSA on Curve25519)
- **ed448** (EdDSA on Curve448)

**OpenSSL Configuration API:**

```c
// TLS 1.3 cipher suites
SSL_CTX_set_ciphersuites(ctx, "TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256");

// Supported groups (key exchange)
SSL_CTX_set1_groups_list(ctx, "X25519:secp256r1:secp384r1");

// Signature algorithms
SSL_CTX_set1_sigalgs_list(ctx, "rsa_pss_rsae_sha256:ecdsa_secp256r1_sha256");

// Force TLS 1.3 only
SSL_CTX_set_min_proto_version(ctx, TLS1_3_VERSION);
SSL_CTX_set_max_proto_version(ctx, TLS1_3_VERSION);
```

**Acceptance Criteria:**

- Exactly 4 cipher suites supported (3 mandatory + 1 optional CCM)
- All are AEAD cipher suites
- Cipher string parser validates TLS 1.3 format
- Invalid cipher suite names produce helpful error messages
- UI clearly indicates separation of cipher suite, key exchange, and signature
- Educational tooltips explain TLS 1.3 improvements over 1.2
- No deprecated or legacy cipher suites available

**Post-Quantum (if supported in OpenSSL 3.5.4 via provider):**

- Kyber768 key exchange (hybrid mode)
- Dilithium authentication (hybrid mode)

**Cipher String Special Values:**

- `DEFAULT` - OpenSSL default cipher list
- `HIGH` - High-security ciphers only
- `!aNULL` - Exclude anonymous ciphers
- `!eNULL` - Exclude null encryption
- `@SECLEVEL=N` - Security level enforcement

**Acceptance Criteria:**

- Minimum 25 cipher suites supported
- Cipher string parser validates user input
- Invalid cipher strings produce helpful error messages
- Cipher capabilities documented in user interface

---

### 3.3 Educational Features

#### FR-EDU-001: Inline Documentation

**Priority:** MUST  
**Description:** The module shall provide contextual help and documentation.

**Documentation Elements:**

- **Tooltips:** Hover over any configuration field to see explanation
- **Cipher Information:** Click on cipher suite name to see algorithm breakdown
- **TLS Version Explanations:** Differences between TLS 1.2 and 1.3
- **Security Warnings:** When weak or deprecated configurations selected

**Content Requirements:**

- Explain cipher suite components (key exchange, encryption, MAC/AEAD, PRF)
- Define forward secrecy and its importance
- Describe security levels and their implications
- Link to relevant RFCs (RFC 8446 for TLS 1.3, etc.)

**Acceptance Criteria:**

- All UI elements have accessible tooltips
- Documentation is technically accurate
- Language appropriate for intermediate to advanced learners
- External links open in new tabs

#### FR-EDU-002: Configuration Examples

**Priority:** SHOULD  
**Description:** The module shall provide guided examples of common TLS 1.3 configurations.

**Example Scenarios:**

1. **"Why did my TLS 1.3 connection fail?"**
   - **Setup:**
     - Client: Only supports `TLS_AES_256_GCM_SHA384`
     - Server: Only supports `TLS_AES_128_GCM_SHA256`
   - **Result:** Handshake failure - no common cipher suite
   - **Learning:** TLS 1.3 requires at least one common cipher suite
   - **Fix:** Add overlapping cipher to either side

2. **"Understanding TLS 1.3 Cipher Suite Structure"**
   - **Setup:** Default configuration with `TLS_AES_256_GCM_SHA384`
   - **Observation:**
     - Cipher suite specifies ONLY: AEAD algorithm (AES-256-GCM) + hash (SHA-384)
     - Key exchange shown separately: X25519
     - Signature algorithm shown separately: rsa_pss_rsae_sha256
   - **Learning:** TLS 1.3 separates cipher suite from key exchange and signature
   - **Comparison:** Note how TLS 1.2 combined all three in cipher suite name

3. **"Testing Different Key Exchange Groups"**
   - **Scenario A:**
     - Groups: X25519 only
     - Result: Fast handshake, modern elliptic curve
   - **Scenario B:**
     - Groups: X448 only
     - Result: Higher security, slightly slower
   - **Scenario C:**
     - Groups: secp384r1 (NIST P-384)
     - Result: NIST compliance, traditional curve
   - **Learning:** Group selection affects security level and performance

4. **"Mandatory Forward Secrecy in TLS 1.3"**
   - **Demonstration:**
     - Show that ALL TLS 1.3 cipher suites use ephemeral key exchange
     - No "RSA" static key exchange possible
     - Explain why this is an improvement over TLS 1.2
   - **Learning:** Forward secrecy is mandatory, not optional

5. **"ChaCha20 vs. AES-GCM Performance"**
   - **Setup A:** `TLS_AES_256_GCM_SHA384`
   - **Setup B:** `TLS_CHACHA20_POLY1305_SHA256`
   - **Comparison:**
     - AES-GCM: Better with hardware acceleration (AES-NI)
     - ChaCha20: Better on mobile/devices without AES-NI
   - **Learning:** Cipher suite choice depends on hardware capabilities

6. **"Post-Quantum Hybrid Key Exchange"**
   - **Setup:**
     - Groups: Kyber768, X25519 (hybrid)
     - Cipher: `TLS_AES_256_GCM_SHA384`
   - **Result:** Both classical and PQ key exchange performed
   - **Learning:** Hybrid mode provides quantum resistance while maintaining classical security

7. **"Certificate and Signature Algorithm Matching"**
   - **Mismatch Example:**
     - Client accepts: ecdsa_secp256r1_sha256 only
     - Server certificate: RSA 2048
     - Result: Handshake failure
   - **Fix:** Change server certificate to ECDSA P-256 or add RSA signature algorithm to client
   - **Learning:** Signature algorithm must be compatible with server certificate type

**Acceptance Criteria:**

- At least 6 guided examples (7 provided above)
- Step-by-step instructions for each
- Expected outcomes documented
- Educational explanation of what is being demonstrated
- "Reset to Default" option after each example
- Examples focus on TLS 1.3 specific features and improvements

#### FR-EDU-003: Visualization of Handshake

**Priority:** SHOULD  
**Description:** The module should provide optional visualization of the TLS handshake process.

**Visualization Elements:**

- **Message Flow Diagram**
  - ClientHello with offered ciphers
  - ServerHello with selected cipher
  - Certificate exchange
  - Key exchange
  - Finished messages

- **State Machine View**
  - Current handshake state
  - Completed states (green)
  - Current state (yellow)
  - Pending states (gray)

- **Animation Toggle**
  - Enable/disable for performance
  - Slow-motion mode for educational clarity

**Acceptance Criteria:**

- Visualization accurately reflects TLS 1.2 and 1.3 handshakes
- Optional feature (can be hidden for advanced users)
- Does not impact core functionality performance

#### FR-EDU-004: Comparison Mode

**Priority:** SHOULD  
**Description:** The module should allow users to compare multiple configuration scenarios side-by-side.

**Functionality:**

- Save current configuration as "Scenario A"
- Modify configuration
- Save as "Scenario B"
- Display comparison table:
  - Configuration differences
  - Negotiation outcome differences
  - Performance metrics (if applicable)

**Use Cases:**

- Compare TLS 1.2 vs 1.3 performance
- Test different cipher suite orderings
- Evaluate security level impacts

**Acceptance Criteria:**

- Up to 3 scenarios can be compared
- Clear highlighting of differences
- Export comparison results

---

### 3.4 Performance and Constraints

#### FR-PERF-001: Performance Requirements

**Priority:** MUST  
**Description:** The module shall meet minimum performance benchmarks.

**Performance Targets:**

- **WASM Load Time:** < 3 seconds on 10 Mbps connection
- **Handshake Completion:** < 2 seconds for local simulation
- **Message Transmission:** < 100ms latency
- **UI Responsiveness:** All interactions < 200ms response time
- **Memory Usage:** < 100MB total (both client and server instances)

**Browser Compatibility:**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Acceptance Criteria:**

- Performance metrics meet targets on reference hardware (4-core CPU, 8GB RAM)
- No browser crashes or memory leaks during extended use
- Graceful degradation on slower hardware

#### FR-PERF-002: Resource Management

**Priority:** MUST  
**Description:** The module shall efficiently manage browser resources.

**Resource Controls:**

- **Connection Lifecycle**
  - Automatic cleanup of disconnected sessions
  - Memory release after connection termination
  - Maximum 1 active connection at a time

- **Certificate Caching**
  - Certificates loaded once at module initialization
  - Reuse across multiple connections

- **WASM Instance Management**
  - Single WASM runtime instance
  - Shared between client and server simulations

**Acceptance Criteria:**

- Memory usage stable over 10+ connection cycles
- No memory leaks detected in browser profiling
- Clean shutdown of all resources

---

### 3.5 Security and Safety

#### FR-SEC-001: Educational Sandbox

**Priority:** MUST  
**Description:** The module shall operate entirely within the browser sandbox.

**Security Constraints:**

- **No External Network Access**
  - All TLS simulation occurs locally in browser
  - No actual network sockets created
  - Client and server communicate via in-memory message passing

- **No Persistent Key Material**
  - All keys generated are ephemeral
  - Keys destroyed on page unload
  - No keys stored in browser storage

- **Data Privacy**
  - User configurations stored only in browser localStorage
  - No telemetry or analytics on user configurations
  - Clear privacy policy displayed

**Acceptance Criteria:**

- Module operates without internet connection (after initial load)
- Browser security policies not violated
- No access to user filesystem (except explicit upload/download)

#### FR-SEC-002: Educational Warnings

**Priority:** MUST  
**Description:** The module shall provide clear warnings about educational context.

**Warning Displays:**

- **Startup Warning**
  - "This is an educational simulation. Do not use for production security testing."
  - "Self-signed certificates are for learning only."

- **Weak Configuration Warnings**
  - When user selects deprecated ciphers
  - When disabling certificate verification
  - When using low security levels

- **Security Level Indicators**
  - Color-coded configurations (green/yellow/red)
  - Explanation of risk levels

**Acceptance Criteria:**

- Warnings prominent and unavoidable
- Educational context always clear
- No false sense of production security

---

### 3.6 Data Persistence and Export

#### FR-DATA-001: Configuration Persistence

**Priority:** SHOULD  
**Description:** The module should save user configurations across browser sessions.

**Stored Data:**

- Last used cipher strings (client and server)
- Protocol version preferences
- Certificate selections
- Custom presets

**Storage Mechanism:**

- Browser localStorage (per-origin)
- JSON format for easy export/import
- Maximum storage: 1MB

**Acceptance Criteria:**

- Configurations auto-save on change
- Configurations restored on page reload
- Clear data option available
- Import/export functionality

#### FR-DATA-002: Results Export

**Priority:** SHOULD  
**Description:** The module should allow export of test results.

**Export Formats:**

- **JSON:**

  ```json
  {
    "timestamp": "2025-12-12T10:30:00Z",
    "client_config": { ... },
    "server_config": { ... },
    "negotiation_result": { ... },
    "messages_exchanged": [ ... ]
  }
  ```

- **Text Report:**
  - Human-readable summary
  - Suitable for documentation
  - Markdown format

**Export Triggers:**

- Manual export button
- Auto-export on successful connection (optional)

**Acceptance Criteria:**

- Export file downloads to user's system
- Filename includes timestamp
- JSON validates against schema

---

### 3.7 Error Handling

#### FR-ERR-001: Connection Failure Handling

**Priority:** MUST  
**Description:** The module shall provide detailed error messages for TLS 1.3 connection failures.

**Error Scenarios:**

1. **No Cipher Suite Match**
   - Message: "TLS 1.3 handshake failed: No common AEAD cipher suite"
   - Details:

     ```
     Client offered:
     - TLS_AES_256_GCM_SHA384
     - TLS_CHACHA20_POLY1305_SHA256

     Server supports:
     - TLS_AES_128_GCM_SHA256
     - TLS_AES_128_CCM_SHA256

     No overlap found.
     ```

   - Suggested fix: "Add a common cipher suite to both client and server"

2. **No Common Supported Group**
   - Message: "TLS 1.3 handshake failed: No common key exchange group"
   - Details:

     ```
     Client supports: X448, secp521r1
     Server supports: X25519, secp256r1

     No overlap found.
     ```

   - Suggested fix: "Add a common group (e.g., X25519) to both sides"

3. **Signature Algorithm Incompatibility**
   - Message: "TLS 1.3 handshake failed: Server certificate signature algorithm not supported"
   - Details:

     ```
     Server certificate: RSA 2048
     Server certificate signature: rsa_pkcs1_sha256

     Client accepts:
     - ecdsa_secp256r1_sha256
     - ed25519

     Certificate type incompatible with client signature algorithms.
     ```

   - Suggested fix: "Use ECDSA certificate or add RSA signature algorithms to client"

4. **Missing Key Share**
   - Message: "TLS 1.3 optimization note: HelloRetryRequest would be needed"
   - Details:

     ```
     Client sent key_share for: X25519
     Server prefers: X448

     In real TLS 1.3, this would trigger HelloRetryRequest (adds 1 RTT).
     ```

   - Educational note: "This module doesn't implement HRR for simplicity"

5. **Invalid TLS 1.3 Cipher Suite Format**
   - Message: "Configuration error: Invalid TLS 1.3 cipher suite"
   - Details:

     ```
     Input: "ECDHE-RSA-AES256-GCM-SHA384"
     Error: This is TLS 1.2 cipher suite format.

     TLS 1.3 cipher suites must follow format:
     TLS_<AEAD>_<HASH>

     Example: TLS_AES_256_GCM_SHA384
     ```

6. **Certificate Validation Failure** (if enabled)
   - Message: "Server certificate validation failed"
   - Details:
     - Self-signed certificate (expected in educational context)
     - Hostname mismatch
     - Expired certificate
   - Note: "Certificate verification disabled for educational purposes"

**Error Display:**

- Errors shown in dedicated panel with red border
- Expandable details section
- Copy-to-clipboard button for error details
- Link to relevant documentation/examples
- Suggested fixes when determinable

**Error Recovery:**

- "Fix Configuration" button that suggests corrections
- "Load Working Example" button
- "View Tutorial" link for the error type

**Acceptance Criteria:**

- All TLS 1.3-specific error scenarios produce helpful messages
- Errors distinguish between cipher suite, group, and signature algorithm issues
- Educational context provided (why TLS 1.3 requires certain parameters)
- Error history maintained for session
- Errors include educational explanations
- No generic "connection failed" messages

#### FR-ERR-002: Input Validation

**Priority:** MUST  
**Description:** The module shall validate all user inputs for TLS 1.3 compliance before attempting connection.

**Validation Rules:**

**Cipher Suite String:**

- Format: `TLS_<ALGORITHM>_<MODE>_SHA<BITS>`
- Valid examples:
  - `TLS_AES_256_GCM_SHA384` ✓
  - `TLS_AES_128_GCM_SHA256` ✓
  - `TLS_CHACHA20_POLY1305_SHA256` ✓
  - `TLS_AES_128_CCM_SHA256` ✓
- Invalid examples:
  - `ECDHE-RSA-AES256-GCM-SHA384` ✗ (TLS 1.2 format)
  - `TLS_AES_256_CBC_SHA256` ✗ (CBC not AEAD)
  - `TLS_RSA_AES_256_GCM_SHA384` ✗ (invalid structure)
- Allow colon-separated list of multiple valid cipher suites
- Warning for deprecated but valid OpenSSL cipher names

**Supported Groups:**

- Valid: X25519, X448, secp256r1, secp384r1, secp521r1, Kyber768
- Minimum one group must be selected
- Warning if no common group between client and server (pre-validation)
- Must be ECDHE groups (TLS 1.3 requirement)

**Signature Algorithms:**

- Valid formats:
  - `rsa_pss_rsae_sha256` ✓
  - `rsa_pss_rsae_sha384` ✓
  - `rsa_pss_rsae_sha512` ✓
  - `ecdsa_secp256r1_sha256` ✓
  - `ecdsa_secp384r1_sha384` ✓
  - `ecdsa_secp521r1_sha512` ✓
  - `ed25519` ✓
  - `ed448` ✓
- Invalid:
  - `rsa_pkcs1_sha256` ✗ (deprecated in TLS 1.3)
  - `sha1` ✗ (weak hash)
- Minimum one signature algorithm must be selected
- Compatibility check with selected certificate type

**SNI (Server Name Indication):**

- Valid DNS hostname format
- Max 255 characters
- ASCII characters only (or properly encoded IDN)
- No IP addresses (RFC violation)

**Message:**

- Max 1024 characters
- UTF-8 encoding
- No control characters except newlines/tabs
- Educational note: Real TLS has 16KB record size limit

**Pre-Connection Validation:**

- Verify at least one cipher suite overlap
- Verify at least one group overlap
- Verify signature algorithm compatible with server certificate
- Warn if configuration likely to fail

**Validation Feedback:**

- Real-time validation as user types
- Visual indicators:
  - ✓ Green checkmark for valid
  - ✗ Red X for invalid
  - ⚠ Yellow warning for questionable
- Specific error messages below each field
- Tooltip with validation rules on hover

**Validation Examples:**

```
Input: "TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256"
Status: ✓ Valid - 2 modern TLS 1.3 cipher suites

Input: "ECDHE-RSA-AES256-GCM-SHA384"
Status: ✗ Invalid - This is TLS 1.2 format. Use TLS_AES_256_GCM_SHA384

Input: "TLS_AES_256_CBC_SHA384"
Status: ✗ Invalid - TLS 1.3 requires AEAD cipher suites (GCM/CCM/ChaCha20-Poly1305)

Input: "X25519:secp256r1"
Status: ✓ Valid - Modern key exchange groups

Input: Client groups: "X448" | Server groups: "X25519"
Status: ⚠ Warning - No common group. Connection will fail.
```

**Acceptance Criteria:**

- All TLS 1.3 format requirements enforced
- Invalid configurations prevented before connection attempt
- Educational explanations for why validation failed
- Clear distinction between TLS 1.2 and TLS 1.3 formats
- Validation does not block legitimate TLS 1.3 use cases
- Pre-validation catches obvious compatibility issues

---

## 4. Non-Functional Requirements

### 4.1 Usability

- **NFR-USE-001:** Interface shall be intuitive for users with basic TLS knowledge
- **NFR-USE-002:** All actions shall be reversible (undo capability)
- **NFR-USE-003:** Keyboard navigation fully supported (accessibility)
- **NFR-USE-004:** Screen reader compatible (WCAG 2.1 Level AA)

### 4.2 Reliability

- **NFR-REL-001:** Module shall handle 100 consecutive connections without failure
- **NFR-REL-002:** Browser tab crash shall not corrupt localStorage data
- **NFR-REL-003:** WASM runtime errors shall be caught and reported gracefully

### 4.3 Maintainability

- **NFR-MAIN-001:** OpenSSL version shall be easily upgradable (build system)
- **NFR-MAIN-002:** UI components shall be modular and reusable
- **NFR-MAIN-003:** Configuration presets shall be externally configurable (JSON)

### 4.4 Portability

- **NFR-PORT-001:** Module shall run on all major desktop browsers
- **NFR-PORT-002:** Module shall function on tablets (iPad, Android tablets)
- **NFR-PORT-003:** Responsive design adapts to 1024px - 2560px widths

### 4.5 Localization

- **NFR-LOC-001:** UI text shall be externalized for future localization
- **NFR-LOC-002:** Initial release in English
- **NFR-LOC-003:** Date/time formats shall respect browser locale

---

## 5. Constraints and Assumptions

### 5.1 Technical Constraints

- **C-001:** OpenSSL 3.5.4 is the fixed version (security and consistency)
- **C-002:** No actual network communication permitted (browser sandbox)
- **C-003:** Maximum WASM binary size: 10MB uncompressed
- **C-004:** No server-side components or backend services

### 5.2 Browser Constraints

- **C-005:** Requires WebAssembly support (all modern browsers)
- **C-006:** Requires JavaScript enabled
- **C-007:** Requires minimum 2GB available RAM
- **C-008:** IndexedDB or localStorage required for persistence

### 5.3 Educational Constraints

- **C-009:** Module is educational only, not for production testing
- **C-010:** Self-signed certificates only (no real PKI integration)
- **C-011:** Simplified handshake (no extensions like OCSP stapling initially)

### 5.4 Assumptions

- **A-001:** Users have intermediate understanding of TLS/SSL
- **A-002:** Users understand risks of self-signed certificates
- **A-003:** Users access module via modern desktop browser
- **A-004:** Users have basic understanding of cryptographic terminology

---

## 6. User Stories and Use Cases

### 6.1 Primary User Stories

#### US-001: Basic TLS 1.3 Connection Test

**As a** security engineer  
**I want to** configure client and server TLS 1.3 cipher suites and test connectivity  
**So that** I can understand how TLS 1.3 cipher negotiation works

**Acceptance Criteria:**

- Configure both client and server with compatible TLS 1.3 ciphers
- Configure key exchange groups (e.g., X25519)
- Configure signature algorithms
- Click connect button
- See successful TLS 1.3 connection with negotiated parameters displayed
- Send "hello quantum world" message
- Receive message on server side
- Observe that forward secrecy is mandatory

---

#### US-002: Troubleshoot TLS 1.3 Cipher Mismatch

**As a** developer debugging TLS issues  
**I want to** deliberately misconfigure client and server cipher suites  
**So that** I can see what error messages appear and understand the cause

**Acceptance Criteria:**

- Configure client with only `TLS_AES_256_GCM_SHA384`
- Configure server with only `TLS_AES_128_GCM_SHA256`
- Attempt connection
- Receive clear error: "No common cipher suite"
- See list of client-offered vs server-supported TLS 1.3 ciphers
- Understand TLS 1.3 negotiation requirements

---

#### US-003: Understand TLS 1.3 Separated Negotiation

**As a** security architect  
**I want to** observe how cipher suite, key exchange, and signature are negotiated separately  
**So that** I can understand TLS 1.3 improvements over TLS 1.2

**Acceptance Criteria:**

- Configure TLS 1.3 connection with default settings
- Establish connection successfully
- Observe negotiation results showing:
  - Cipher suite: `TLS_AES_256_GCM_SHA384` (specifies AEAD + hash only)
  - Key exchange: X25519 (negotiated separately via supported_groups)
  - Signature: rsa_pss_rsae_sha256 (negotiated separately)
- Compare with educational note explaining TLS 1.2 combined these
- Understand the flexibility this provides

---

#### US-004: Test Post-Quantum Hybrid Configuration

**As a** cryptographic engineer  
**I want to** test hybrid classical/PQC key exchange in TLS 1.3  
**So that** I can prepare for post-quantum migration

**Acceptance Criteria:**

- Load PQC preset with Kyber768 + X25519 hybrid key exchange
- Configure `TLS_AES_256_GCM_SHA384` cipher suite
- Establish connection
- Verify hybrid mode in negotiation results:
  - Classical: X25519
  - Post-quantum: Kyber768
- Send quantum-themed message successfully
- Understand quantum resistance implications

---

#### US-005: Export TLS 1.3 Configuration for Documentation

**As a** technical writer  
**I want to** export my TLS 1.3 test configuration and results  
**So that** I can include them in security documentation

**Acceptance Criteria:**

- Perform successful TLS 1.3 connection test
- Click export button
- Receive JSON or Markdown file containing:
  - Protocol version (TLS 1.3)
  - Cipher suite configuration
  - Supported groups
  - Signature algorithms
  - Negotiation results
  - Timestamp
- File is suitable for inclusion in technical documentation

---

#### US-006: Compare AES-GCM vs ChaCha20 Performance

**As a** mobile application developer  
**I want to** compare AES-GCM and ChaCha20 cipher suites  
**So that** I can choose the optimal cipher for mobile devices

**Acceptance Criteria:**

- Test configuration A: `TLS_AES_256_GCM_SHA384`
- Test configuration B: `TLS_CHACHA20_POLY1305_SHA256`
- See educational notes about:
  - AES-GCM benefits (hardware acceleration)
  - ChaCha20 benefits (mobile/no AES-NI)
- Make informed decision for deployment

---

### 6.2 Use Case Diagram

```
                         ┌─────────────────────┐
                         │   Security         │
                         │   Professional     │
                         └──────────┬──────────┘
                                    │
                ┌───────────────────┼────────────────────┐
                │                   │                    │
                ▼                   ▼                    ▼
     ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐
     │ Configure        │  │ Test Cipher    │  │ Compare         │
     │ TLS Parameters   │  │ Negotiation    │  │ Configurations  │
     └──────────────────┘  └────────────────┘  └─────────────────┘
                │                   │                    │
                └───────────────────┼────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────┐
                         │ Export Results   │
                         └──────────────────┘
```

---

## 7. Out of Scope

The following features are explicitly **out of scope** for this TLS 1.3-focused module:

### 7.1 Excluded Features

- **TLS 1.2 and Earlier Protocols:** Completely excluded to focus on modern best practices
- **Legacy or Deprecated Cipher Suites:** No weak, deprecated, or non-AEAD ciphers
- **Non-AEAD Cipher Suites:** TLS 1.3 only supports AEAD; no CBC, stream ciphers, or MAC-then-encrypt
- **Static RSA Key Exchange:** Not possible in TLS 1.3 (forward secrecy mandatory)
- **Real Network Communication:** No actual internet traffic or external server connections
- **Production PKI:** No integration with real Certificate Authorities or trust stores
- **Client Certificates:** Mutual TLS authentication not included in initial release
- **Session Tickets (0-RTT):** TLS 1.3 session resumption not included initially
- **DTLS:** Datagram TLS for UDP not included (this is TLS only)
- **Performance Benchmarking:** No timing attack testing or performance optimization tools
- **Protocol Downgrade Testing:** No intentional vulnerability or downgrade testing
- **Custom Crypto Providers:** Only built-in OpenSSL algorithms
- **HelloRetryRequest:** Advanced TLS 1.3 feature for unsupported groups
- **Post-Handshake Authentication:** TLS 1.3 advanced feature
- **Early Data (0-RTT):** TLS 1.3 session resumption feature

### 7.2 Rationale for TLS 1.3 Only Scope

This module focuses exclusively on TLS 1.3 because:

1. **Modern Best Practice:** TLS 1.3 is the current standard for secure communications
2. **Educational Clarity:** Avoiding legacy protocols eliminates confusion about deprecated crypto
3. **Post-Quantum Readiness:** TLS 1.3 is the foundation for PQC migration
4. **Simplified Learning:** TLS 1.3's cleaner design is easier to understand
5. **Future-Focused:** Organizations should deploy TLS 1.3, not maintain TLS 1.2

### 7.3 Future Enhancements (Roadmap)

- **Phase 2:** Client certificate authentication (mutual TLS)
- **Phase 3:** Session resumption with PSK
- **Phase 4:** 0-RTT early data demonstration
- **Phase 5:** Post-handshake authentication
- **Phase 6:** Integration with broader PQC Today educational modules

---

## 8. Success Criteria

### 8.1 Technical Success Metrics

- ✓ Module loads in < 3 seconds on reference hardware
- ✓ Successfully negotiates 95%+ of valid configuration combinations
- ✓ Zero browser crashes during 100+ connection test cycles
- ✓ WASM binary size under 5MB compressed
- ✓ All error scenarios produce actionable messages

### 8.2 Educational Success Metrics

- ✓ Users can explain cipher negotiation after using module
- ✓ Users can troubleshoot common TLS configuration errors
- ✓ Users understand difference between TLS 1.2 and 1.3 cipher suites
- ✓ Users can configure OpenSSL for their use case after training

### 8.3 Usability Success Metrics

- ✓ 90%+ of users can complete basic connection test without documentation
- ✓ Average time to first successful connection < 2 minutes
- ✓ User satisfaction rating > 4.0/5.0 in post-use survey
- ✓ < 10% of users request additional help documentation

---

## 9. Testing Requirements

### 9.1 Functional Testing

- Test all cipher suite combinations from requirements
- Verify error messages for all failure scenarios
- Test configuration persistence across browser sessions
- Validate export functionality for all formats
- Test all preset configurations load correctly

### 9.2 Cross-Browser Testing

- Chrome (latest stable + previous version)
- Firefox (latest stable + previous version)
- Safari (latest stable + previous version)
- Edge (latest stable)

### 9.3 Performance Testing

- Load time under various network conditions
- Memory leak detection over extended use
- Concurrent connection handling (sequentially)

### 9.4 Security Testing

- Verify no network requests beyond WASM loading
- Confirm ephemeral key destruction
- Validate sandbox constraints

### 9.5 Accessibility Testing

- Screen reader compatibility (NVDA, JAWS)
- Keyboard-only navigation
- Color contrast ratios (WCAG 2.1 AA)
- Focus indicators

---

## 10. Implementation Phases

### Phase 1: Core Functionality (MVP)

**Duration:** 6-8 weeks  
**Deliverables:**

- WASM compilation of OpenSSL 3.5.4
- Basic split-screen UI (client/server)
- TLS 1.3 cipher support (minimum 5 cipher suites)
- Connection establishment and message transmission
- Basic error handling

### Phase 2: Enhanced Features

**Duration:** 4-6 weeks  
**Deliverables:**

- TLS 1.2 support
- Full cipher suite library (25+ ciphers)
- Configuration presets
- Negotiation results panel
- Certificate selection

### Phase 3: Educational Enhancements

**Duration:** 3-4 weeks  
**Deliverables:**

- Inline documentation and tooltips
- Handshake visualization
- Guided examples
- Comparison mode
- Export functionality

### Phase 4: Polish and Optimization

**Duration:** 2-3 weeks  
**Deliverables:**

- Performance optimization
- Cross-browser testing and fixes
- Accessibility enhancements
- User feedback incorporation

---

## 11. Dependencies

### 11.1 Technical Dependencies

- **OpenSSL 3.5.4 Source Code:** Official release from OpenSSL project
- **Emscripten Toolchain:** For WASM compilation (version 3.1.50+)
- **Web Framework:** (TBD - React, Vue, or vanilla JS)
- **Build System:** (TBD - webpack, vite, or rollup)

### 11.2 Resource Dependencies

- Frontend developer with WASM/C experience
- UI/UX designer for educational interface
- TLS/cryptography subject matter expert
- Technical writer for documentation

### 11.3 External Dependencies

- OpenSSL project maintains stable 3.5.4 release
- Browser vendors maintain WebAssembly support
- No third-party API dependencies (self-contained)

---

## 12. Risks and Mitigations

### 12.1 Technical Risks

| Risk                            | Impact | Probability | Mitigation                                                  |
| ------------------------------- | ------ | ----------- | ----------------------------------------------------------- |
| OpenSSL WASM compilation issues | High   | Medium      | Early proof-of-concept build; community consultation        |
| Performance below targets       | Medium | Low         | Progressive optimization; acceptable degradation thresholds |
| Browser compatibility issues    | Medium | Medium      | Extensive testing; graceful feature degradation             |
| WASM size exceeds limits        | Low    | Low         | Aggressive feature pruning; compression techniques          |

### 12.2 Educational Risks

| Risk                                    | Impact | Probability | Mitigation                                        |
| --------------------------------------- | ------ | ----------- | ------------------------------------------------- |
| Users misunderstand educational context | High   | Medium      | Prominent warnings; clear documentation           |
| Over-simplified model misleads          | Medium | Low         | Expert review; accurate OpenSSL behavior          |
| Users attempt production use            | High   | Low         | Clear limitations; cannot connect to real servers |

### 12.3 Project Risks

| Risk                     | Impact | Probability | Mitigation                                             |
| ------------------------ | ------ | ----------- | ------------------------------------------------------ |
| Scope creep              | Medium | High        | Strict adherence to requirements; phase-based delivery |
| Resource availability    | High   | Medium      | Phased approach; MVP focus                             |
| OpenSSL security updates | Medium | Medium      | Documented upgrade process; semantic versioning        |

---

## 13. Glossary

| Term                    | Definition                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| **0-RTT**               | Zero Round Trip Time - TLS 1.3 feature for session resumption without handshake latency                    |
| **1-RTT**               | One Round Trip Time - Standard TLS 1.3 full handshake                                                      |
| **AEAD**                | Authenticated Encryption with Associated Data - All TLS 1.3 cipher suites are AEAD                         |
| **ChaCha20-Poly1305**   | Stream cipher with AEAD properties, optimized for software implementations                                 |
| **Cipher Suite**        | In TLS 1.3: Combination of AEAD algorithm and hash function only                                           |
| **ECDHE**               | Elliptic Curve Diffie-Hellman Ephemeral - Mandatory key exchange in TLS 1.3                                |
| **EdDSA**               | Edwards-curve Digital Signature Algorithm - Modern signature algorithm                                     |
| **Forward Secrecy**     | Property ensuring session keys remain secure even if long-term keys are compromised - Mandatory in TLS 1.3 |
| **GCM**                 | Galois/Counter Mode - AEAD mode for block ciphers                                                          |
| **Handshake**           | TLS negotiation process to establish connection parameters                                                 |
| **Hybrid PQC**          | Combination of classical and post-quantum cryptography for quantum resistance                              |
| **Key Share**           | TLS 1.3 extension containing client's ephemeral public key                                                 |
| **Kyber**               | Post-quantum key encapsulation mechanism (KEM)                                                             |
| **OpenSSL**             | Open-source cryptographic library implementing TLS protocols                                               |
| **PQC**                 | Post-Quantum Cryptography - Algorithms resistant to quantum computer attacks                               |
| **PSK**                 | Pre-Shared Key - Used in TLS 1.3 session resumption                                                        |
| **RSA-PSS**             | RSA Probabilistic Signature Scheme - Modern RSA signature variant                                          |
| **Signature Algorithm** | Algorithm used to sign certificates and handshake - Negotiated separately in TLS 1.3                       |
| **SNI**                 | Server Name Indication - TLS extension for virtual hosting                                                 |
| **Supported Groups**    | TLS 1.3 extension listing acceptable key exchange groups (curves)                                          |
| **TLS 1.3**             | Current version of Transport Layer Security protocol (RFC 8446)                                            |
| **WASM**                | WebAssembly - Binary instruction format for web browsers                                                   |
| **X25519**              | Key exchange protocol using Curve25519 - Recommended for TLS 1.3                                           |
| **X448**                | Key exchange protocol using Curve448 - High security variant                                               |

---

## 14. Appendices

### Appendix A: TLS 1.3 Cipher String Examples

```bash
# Default TLS 1.3 (recommended)
TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256

# Mobile-optimized (ChaCha20 preferred)
TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256

# Maximum security (AES-256 only)
TLS_AES_256_GCM_SHA384

# Balanced (all modern ciphers)
TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256

# IoT/Constrained devices (include CCM)
TLS_AES_128_CCM_SHA256:TLS_AES_128_GCM_SHA256

# Invalid examples (will fail)
TLS_RSA_WITH_AES_256_GCM_SHA384  # Error: Not a TLS 1.3 cipher suite
ECDHE-RSA-AES256-GCM-SHA384      # Error: TLS 1.2 cipher suite format
```

**Note:** In TLS 1.3, cipher suite strings ONLY specify the AEAD algorithm and hash. Key exchange and signature algorithms are configured separately.

**Supported Groups Configuration:**

```bash
# Modern elliptic curves
X25519:secp256r1:secp384r1

# High security
X448:secp521r1

# NIST compliance
secp256r1:secp384r1:secp521r1

# Post-quantum hybrid (if supported)
Kyber768:X25519
```

**Signature Algorithms Configuration:**

```bash
# Modern RSA and ECDSA
rsa_pss_rsae_sha256:ecdsa_secp256r1_sha256

# High security
rsa_pss_rsae_sha512:ecdsa_secp384r1_sha384

# EdDSA (modern)
ed25519:ed448

# Comprehensive
rsa_pss_rsae_sha256:rsa_pss_rsae_sha384:ecdsa_secp256r1_sha256:ed25519
```

### Appendix B: Reference Architecture

```
Browser (Single Page Application)
├── UI Layer (React/Vue)
│   ├── Client Configuration Panel
│   ├── Server Configuration Panel
│   ├── Negotiation Results Display
│   └── Message Transmission Interface
│
├── Business Logic Layer (JavaScript)
│   ├── Configuration Manager
│   ├── Connection State Machine
│   ├── Error Handler
│   └── Export Manager
│
├── WASM Integration Layer
│   ├── OpenSSL Wrapper (C/C++)
│   ├── Client Simulation Module
│   ├── Server Simulation Module
│   └── In-Memory Transport
│
└── OpenSSL 3.5.4 (WASM)
    ├── libssl (TLS Protocol)
    ├── libcrypto (Cryptographic Primitives)
    └── Certificate Store
```

### Appendix C: TLS 1.3 Negotiation Flow Example

**Scenario:** TLS 1.3 Connection with AES-256-GCM and X25519 Key Exchange

```
CLIENT                                                SERVER
  |                                                      |
  |  ClientHello                                         |
  |  - supported_versions: TLS 1.3                       |
  |  - cipher_suites:                                    |
  |    * TLS_AES_256_GCM_SHA384 (0x13,0x02)             |
  |    * TLS_AES_128_GCM_SHA256 (0x13,0x01)             |
  |  - supported_groups: X25519, secp256r1               |
  |  - signature_algorithms:                             |
  |    * rsa_pss_rsae_sha256                             |
  |    * ecdsa_secp256r1_sha256                          |
  |  - key_share: X25519 public key                      |
  |----------------------------------------------------->|
  |                                                      |
  |                                  ServerHello         |
  |                          - supported_versions: 1.3   |
  |                          - cipher_suite:             |
  |                            TLS_AES_256_GCM_SHA384    |
  |                          - key_share: X25519 key     |
  |<-----------------------------------------------------|
  |                                                      |
  | [Both sides derive handshake keys from X25519 ECDH]  |
  |                                                      |
  |                         {EncryptedExtensions}        |
  |<-----------------------------------------------------|
  |                                                      |
  |                         {Certificate}                |
  |                          - Server cert (ECDSA P-256) |
  |<-----------------------------------------------------|
  |                                                      |
  |                         {CertificateVerify}          |
  |                          - Signature algorithm:      |
  |                            ecdsa_secp256r1_sha256    |
  |<-----------------------------------------------------|
  |                                                      |
  |                         {Finished}                   |
  |<-----------------------------------------------------|
  |                                                      |
  |  {Finished}                                          |
  |----------------------------------------------------->|
  |                                                      |
  | [Both sides derive application traffic keys]         |
  |                                                      |
  |  [Application Data]: "hello quantum world"           |
  |----------------------------------------------------->|
  |                                                      |
  |                    [Application Data]: ACK           |
  |<-----------------------------------------------------|
  |                                                      |

{ } = Encrypted with handshake keys
[ ] = Encrypted with application keys

Negotiated Parameters:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Protocol Version:     TLS 1.3
Cipher Suite:         TLS_AES_256_GCM_SHA384 (0x13,0x02)
  ├─ Encryption:      AES-256-GCM (AEAD)
  └─ Hash:            SHA-384

Key Exchange:         X25519 (Curve25519 ECDHE)
  └─ Forward Secrecy: Yes (mandatory in TLS 1.3)

Signature Algorithm:  ecdsa_secp256r1_sha256
  └─ Certificate:     ECDSA P-256

TLS 1.3 Features:
  ├─ Handshake Mode:  1-RTT (full handshake)
  ├─ Encrypted Cert:  Yes (server cert encrypted)
  └─ Perfect FS:      Yes (ephemeral keys)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key Improvements Over TLS 1.2:
1. Cipher suite ONLY specifies AEAD + hash (not key exchange/sig)
2. Server certificate sent encrypted
3. Only 1-RTT required (vs 2-RTT in TLS 1.2)
4. Forward secrecy mandatory (no static RSA)
5. All handshake messages after ServerHello encrypted
```

**TLS 1.3 vs TLS 1.2 Cipher Suite Comparison:**

```
TLS 1.2 Style:
ECDHE-RSA-AES256-GCM-SHA384
  │    │   │        │
  │    │   │        └─ PRF hash
  │    │   └────────── Encryption + MAC/AEAD
  │    └────────────── Signature algorithm
  └─────────────────── Key exchange

TLS 1.3 Style:
TLS_AES_256_GCM_SHA384
    │             │
    │             └──── Hash function
    └───────────────── AEAD algorithm (AES-256-GCM)

Note: Key exchange (X25519) and signature (ecdsa_secp256r1_sha256)
negotiated via separate extensions, providing more flexibility.
```

---

## Document Approval

| Role                 | Name  | Signature | Date |
| -------------------- | ----- | --------- | ---- |
| **Product Owner**    | [TBD] |           |      |
| **Technical Lead**   | [TBD] |           |      |
| **Security SME**     | [TBD] |           |      |
| **Educational Lead** | [TBD] |           |      |

---

**Document Version Control:**

- Version 1.0: Initial release - December 12, 2025
- Next Review: Q1 2026

**Change Request Process:**
All functional requirement changes must be submitted via the project tracking system and approved by the Product Owner before implementation.

---

_This document is part of the PQC Today educational platform initiative and aligns with the broader mission of preparing security professionals for the post-quantum cryptography transition._
