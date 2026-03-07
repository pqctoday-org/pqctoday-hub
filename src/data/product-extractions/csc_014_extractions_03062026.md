---
generated: 2026-03-06
collection: csc_014
documents_processed: 6
enrichment_method: ollama-qwen3.5:27b
---

## OpenSSH

- **Category**: SSH Implementation Software
- **Product Name**: Portable OpenSSH
- **Product Brief**: Complete implementation of SSH protocol version 2 for secure remote login, command execution, and file transfer.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It only lists dependencies on standard crypto libraries (LibreSSL, OpenSSL, AWS-LC, BoringSSL) without specifying PQC support within them.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions dependency on libcrypto from LibreSSL, OpenSSL, AWS-LC, or BoringSSL but does not list specific algorithms like ECDSA, Ed25519, etc.)
- **Key Management Model**: Run-time key storage via ssh-agent; key generation via ssh-keygen. Specific formats (PKCS#8/PKCS#12) are not stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer SSH implementation with optional sandboxing and OS-native authentication (PAM).
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Unknown (Referenced as "openssh-X.YpZ" in build instructions)
- **Release Date**: 2026-03-06 (Last Updated timestamp)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Unix-like operating systems, Linux, OS X, Cygwin
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/openssh/openssh-portable

---

## wolfSSH

- **Category**: SSH Implementation Software
- **Product Name**: wolfSSH
- **Product Brief**: A small, fast, portable SSH implementation including support for SCP and SFTP.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It only references RSA and ECC (Elliptic Curve Cryptography) in the context of example keys and authentication.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: RSA, ECC
- **Key Management Model**: Uses wolfSSL's certificate manager system for X.509; supports key generation via `--enable-keygen`; examples use PEM format private keys (RSA/ECC).
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (C) dependent on wolfCrypt/wolfSSL
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: Not stated
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Linux, macOS, Windows (Visual Studio), Embedded/IoT devices
- **Target Industries**: IoT, Embedded, General Security
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, ECC
- **Authoritative Source URL**: https://github.com/wolfSSL/wolfssh

---

## PuTTY

- **Category**: SSH Implementation Software
- **Product Name**: PuTTY
- **Product Brief**: A free implementation of SSH and Telnet for Windows and Unix platforms, along with an xterm terminal emulator.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Version 0.83 adds support for a second post-quantum key exchange algorithm, ML-KEM. The document does not specify the first PQC algorithm supported in previous versions or provide further implementation details beyond this addition.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ECDSA (specifically ecdsa-sha2-nistp521 mentioned in vulnerability context), ML-KEM
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Client software for Windows and Unix platforms; not a centralized/distributed infrastructure service.
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Open Source
- **License**: Not stated (Text mentions "Licence" page but does not specify the license name or terms in the provided text)
- **Latest Version**: 0.83
- **Release Date**: 2025-02-08
- **FIPS Validated**: No
- **Primary Platforms**: Windows, Unix
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated (Text mentions legal warnings regarding encryption laws but no specific regulatory charters or registrations)
- **PQC Roadmap Details**: Version 0.83 includes ML-KEM support; no future timeline or additional algorithm plans explicitly stated beyond the current release notes.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (specifically ecdsa-sha2-nistp521 mentioned); GPG keys used for signing releases.
- **Authoritative Source URL**: putty.software (redirects to chiark)

---

## Paramiko (Python SSH)

- **Category**: SSH Implementation Software
- **Product Name**: Paramiko
- **Product Brief**: The leading native Python SSHv2 protocol library providing client and server functionality.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text mentions reliance on the `cryptography` library for crypto functionality but does not specify any Post-Quantum Cryptography algorithms or support.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions reliance on `cryptography` library but does not list specific primitives like ECDSA, Ed25519, etc.)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable / Not stated
- **Architecture Type**: Pure-Python implementation of SSHv2 protocol; relies on `cryptography` library which uses C and Rust extensions.
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: LGPL-2.1
- **Latest Version**: Unknown (Text references a PyPI version badge but does not state the specific version number)
- **Release Date**: 2026-03-05 (Last Updated date provided in metadata)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Python environments; relies on `cryptography` library with precompiled options.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated (Text mentions a general project roadmap exists but provides no PQC-specific details)
- **Consensus Mechanism**: Not applicable / Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/paramiko/paramiko

---

## AsyncSSH

- **Category**: SSH Implementation Software
- **Product Name**: AsyncSSH
- **Product Brief**: Python package providing asynchronous SSHv2 client and server implementation on top of asyncio.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Includes support for post-quantum key exchange algorithms ML-KEM and SNTRUP. This functionality is optional and requires manual installation of the liboqs library, as it is not a direct Python package installable via pip. No mention of PQC signature schemes or production deployment status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM, SNTRUP (Key Exchange); UMAC (Hash); X.509; OpenSSH-compatible algorithms for key exchange, encryption, and MAC. Specific standard primitives like ECDSA or Ed25519 are not explicitly named in the text, only referenced as "a variety of" algorithms.
- **Key Management Model**: Supports accessing keys managed by ssh-agent (UNIX), PuTTY's Pageant agent (Windows), U2F/FIDO2 security keys, PKCS#11 for PIV security tokens, and X.509 certificates. Does not describe internal key hierarchy or escrow policies.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Python library/package; supports client and server implementations within a single event loop; agent-based support via ssh-agent/Pageant.
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Open Source
- **License**: EPL-2.0 OR GPL-2.0-or-later
- **Latest Version**: Not stated (PyPI badge link present but version number not extracted in text)
- **Release Date**: 2026-03-06 (Last Updated date)
- **FIPS Validated**: No
- **Primary Platforms**: Python 3.10+; UNIX systems; Windows
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Support for ML-KEM and SNTRUP is available via optional liboqs dependency; no specific timeline or future algorithm plans mentioned beyond current support.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text mentions "public keys and certificates" and authentication methods but does not list specific signature algorithms like ECDSA or Ed25519).
- **Authoritative Source URL**: https://github.com/ronf/asyncssh

---

## libssh

- **Category**: SSH Implementation Software
- **Product Name**: libssh
- **Product Brief**: An SSH library providing secure shell protocol implementation.
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no mention of Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It only identifies the product as an SSH library.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: BSD 2-Clause "Simplified" License
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.libssh.org/

---
