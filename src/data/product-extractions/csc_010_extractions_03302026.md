---
generated: 2026-03-30
collection: csc_010
documents_processed: 7
enrichment_method: ollama-qwen3.5:27b
---

## Mullvad VPN App

- **Category**: VPN and IPsec Software
- **Product Name**: Mullvad VPN App
- **Product Brief**: A desktop VPN application enabling quantum-resistant WireGuard tunnels by default.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Quantum-resistant WireGuard tunnels are enabled by default on desktop platforms (Windows, macOS, Linux) using post-quantum secure key encapsulation mechanisms for exchanging pre-shared keys. Algorithms used are Classic McEliece and ML-KEM (switched from Kyber). Mobile support is planned but not yet enabled by default.
- **PQC Migration Priority**: High
- **Crypto Primitives**: WireGuard, Classic McEliece, ML-KEM
- **Key Management Model**: Post-quantum secure key encapsulation mechanisms for exchanging a pre-shared key for WireGuard.
- **Supported Blockchains**: Not stated
- **Architecture Type**: VPN client application (desktop/mobile)
- **Infrastructure Layer**: Network
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: 2025.2
- **Release Date**: 2025-01-09
- **FIPS Validated**: No
- **Primary Platforms**: Windows, iOS, Android (desktop enabled by default; mobile planned)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Enable quantum-resistant tunnels by default on iOS and Android in the future once stability is confirmed. Switched from Kyber to NIST standard ML-KEM.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## ExpressVPN Lightway

- **Category**: VPN and IPsec Software
- **Product Name**: ExpressVPN Lightway
- **Product Brief**: Industry-leading, ultra-fast VPN protocol with secure servers in 105 countries and post-quantum encryption integration.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Lightway integrates ML-KEM (Module Lattice–Based Key Encapsulation Mechanism), the finalized NIST standard based on CRYSTALS-Kyber. It previously used Kyber and now uses a hybrid cryptography approach combining classical and post-quantum algorithms for seamless performance and future-proof security.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (formerly Kyber), AES, RSA, ECC
- **Key Management Model**: Hybrid cryptography approach combining classical and post-quantum algorithms; utilizes WolfSSL implementation for PQC.
- **Supported Blockchains**: Not stated
- **Architecture Type**: VPN Protocol / Virtual Appliance (Client/Server)
- **Infrastructure Layer**: Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2025-01-15
- **FIPS Validated**: No
- **Primary Platforms**: Windows, MacOS, Linux, iPhone/iPad, Android, Apple TV, Fire Stick, Android TV, Routers (Aircove), Chrome, Firefox, Edge
- **Target Industries**: Consumer, Enterprise (ExpressVPN for Teams)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Transitioned from Kyber to ML-KEM (NIST standard finalized August 2024); utilizing hybrid cryptography; aligned with NIST standards.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## VanDyke SecureCRT 10.x

- **Category**: VPN & SSH
- **Product Name**: SecureCRT
- **Product Brief**: Secure remote access, file transfer, and data tunneling client providing terminal emulation for computing professionals.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions SSH, FIPS 140-2-approved ciphers, and X.509 smart cards but contains no mention of Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: SSH (SSH2, SSH1), Telnet/TLS, HTTPS (WebDAV, Amazon S3), FTPS (FTP/TLS), SCP, X.509 certificates, FIPS 140-2-approved ciphers.
- **Key Management Model**: Supports global credential sets, public-key authentication using X.509 smart cards (PIV/CAC), and certificate selection for specific sessions.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Client application (terminal emulator)
- **Infrastructure Layer**: Application, Network
- **License Type**: Commercial
- **License**: Proprietary (30-day evaluation license available)
- **Latest Version**: 9.7
- **Release Date**: Unknown
- **FIPS Validated**: Yes (optional FIPS 140-2-approved ciphers)
- **Primary Platforms**: Windows, macOS, Linux, iOS
- **Target Industries**: Enterprise (computing professionals, network device management)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: X.509 public-key authentication (specific algorithms not detailed beyond standard SSH/X.509 support)
- **Authoritative Source URL**: Not stated

---

## Windscribe

- **Category**: VPN & SSH
- **Product Name**: Windscribe
- **Product Brief**: A VPN service offering Post-Quantum Encryption via a hybrid WireGuard implementation.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Windscribe apps support post-quantum WireGuard out of the box using TLS 1.3 with the hybrid key exchange mechanism X25519MLKEM768 to share the PresharedKey. The PSK is rotated on each login. Validated with Wireshark.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM-768 (referred to as X25519MLKEM768), TLS 1.3, WireGuard
- **Key Management Model**: PresharedKey parameter used in WireGuard; keys rotated on each login; shared via post-quantum-resistant encryption algorithm.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Classical + Post-Quantum)
- **Infrastructure Layer**: Application, Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Desktop: 2.17.9, Android: 3.93.1835, iOS: 3.9.4
- **Release Date**: 2025-10-06
- **FIPS Validated**: No
- **Primary Platforms**: Desktop, Android, iOS
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Currently implemented in versions Desktop 2.17.9, Android 3.93.1835, and iOS 3.9.4 using X25519MLKEM768 hybrid key exchange.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## NordVPN

- **Category**: VPN & SSH
- **Product Name**: NordVPN
- **Product Brief**: A cybersecurity company offering VPN applications with post-quantum encryption support across all platforms.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: NordVPN has rolled out post-quantum encryption (PQE) across all its VPN apps (Windows, macOS, iOS, Android, Android TV, tvOS, Linux). The upgrade integrates quantum-resistant algorithms into the NordLynx protocol (based on WireGuard), complying with NIST standards. Initially deployed on Linux in September 2024 to collect performance data, it expanded to all platforms in 2025. PQE is enabled via a toggle switch in settings and activates automatically when connecting via NordLynx.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions "quantum-resistant algorithms" and compliance with NIST standards but does not name specific primitives like Kyber, Dilithium, etc.)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2025-05-21 (Date of the press release announcing full rollout; Linux update was September 2024)
- **FIPS Validated**: No (Text mentions compliance with NIST standards but does not explicitly state FIPS 140-2 or 140-3 validation status)
- **Primary Platforms**: Windows, macOS, iOS, Android, Android TV, tvOS, Linux
- **Target Industries**: Not stated (General consumer/enterprise cybersecurity implied)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Initial deployment on Linux in September 2024 to gather performance metrics; full rollout across Windows, macOS, iOS, Android, Android TV, and tvOS completed in 2025.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Text mentions "quantum-resistant algorithms" generally but does not list specific signature schemes)
- **Authoritative Source URL**: Not stated

---

## Surfshark

- **Category**: VPN & SSH
- **Product Name**: Wireshark
- **Product Brief**: Network protocol analyzer supporting TLS decryption with post-quantum key log capabilities.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports analyzing real-world post-quantum TLS traffic using hybrid key agreement (X25519 + Kyber768 draft). Capable of decrypting sessions via embedded Decryption Secrets Blocks (DSB) in pcapng files. Mentions Cloudflare and Google server-side PQ KEX deployment and client support in Chrome 124 and Firefox 124/128.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: AES-GCM, ChaCha20-Poly1305, HMAC-SHA256, HMAC-SHA1, RSA, ECDSA, ECDHE (X25519, NIST P-256, NIST P-384, NIST P-521), Kyber768
- **Key Management Model**: Supports importing PEM-encoded or PKCS#12 key files; supports PKCS#11 tokens and HSMs for RSA keys; uses TLS key log files (SSLKEYLOGFILE) for session secrets.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Network protocol analyzer with TLS decryption capabilities
- **Infrastructure Layer**: Application, Network
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: 4.2 (mentioned in context of "Inject TLS Secrets" feature)
- **Release Date**: Not stated
- **FIPS Validated**: No mention of FIPS validation status for Wireshark; mentions NIST FIPS 203 standard as future basis for Kyber/ML-KEM.
- **Primary Platforms**: Windows, Linux, macOS (implied by Firefox/Chrome/curl instructions)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Mentions NIST is almost done standardizing initial PQC algorithms; Kyber768 is the basis for future NIST FIPS 203 (ML-KEM). Cloudflare enabled PQ KEX in 2022; Google enabled server-side support in 2023.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, ECDSA (classical); No specific PQC signature schemes listed as supported by Wireshark itself, only PQC Key Encapsulation Mechanisms (Kyber768) for key exchange.
- **Authoritative Source URL**: https://wireshark.org

---

## Proton VPN

- **Category**: VPN & SSH
- **Product Name**: Proton Authenticator
- **Product Brief**: Open-source two-factor authentication (2FA) app generating TOTP codes with end-to-end encryption.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, schemes, or migration plans. It describes the use of classical cryptographic methods including SRP, bcrypt, AES-GCM, and Argon2.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Secure Remote Password (SRP), bcrypt, 256-bit AES-GCM, Argon2
- **Key Management Model**: Local device key storage using OS-specific secure providers (Android Keystore, iOS Keychain, Windows Credential Manager, DBUS Secret Service) with optional password-based encryption for local keys.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Client-side encryption with local key storage and server-side encrypted sync keys.
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated (Document states it is "open source" but does not specify the license identifier)
- **Latest Version**: Unknown
- **Release Date**: 2025-10-29 (Publication date of the security model article)
- **FIPS Validated**: No
- **Primary Platforms**: Android, iOS, iPadOS, macOS, Windows, Linux
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document mentions data is "signed" with User Key but does not specify the signature algorithm)
- **Authoritative Source URL**: Not stated

---
