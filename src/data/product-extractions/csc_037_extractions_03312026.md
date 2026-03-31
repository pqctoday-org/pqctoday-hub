---
generated: 2026-03-31
collection: csc_037
documents_processed: 8
enrichment_method: ollama-qwen3.5:27b
---

## Google Chrome

- **Category**: Web Browsers
- **Product Name**: Google Chrome
- **Product Brief**: Web browser with hybrid post-quantum key establishment support via ML-KEM.
- **PQC Support**: Yes (Hybrid ML-KEM enabled by default in TLS 1.3)
- **PQC Capability Description**: Chrome offers hybrid ML-KEM (formerly Kyber) by default on desktop since version 131 and Android since version 133. It uses X25519+ML-KEM for key exchange with ECDSA for authentication. Google servers prefer ML-KEM. Experimental support for Kyber began in Chrome 116. ML-DSA signatures are under standardization and not yet deployed by default due to size/latency concerns.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM (Kyber), ECDSA, Curve25519, AES, ChaCha-Poly, Simon/Speck, RSA, ECDH
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Classical + PQC)
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Chrome 133 (Android), Chrome 131 (Desktop)
- **Release Date**: 2024-10-01 (Chrome 131 ML-KEM default enablement mentioned as Oct 2024)
- **FIPS Validated**: No (ML-DSA recently defined in FIPS standard, but Chrome implementation status not stated as validated)
- **Primary Platforms**: Desktop, Android, iOS (via system-wide support context), macOS
- **Target Industries**: General Consumer, Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: ML-KEM enabled by default in Chrome 131 (Oct 2024) for desktop and 133 for Android. ML-DSA adoption is delayed due to handshake size/latency; standardization ongoing at IETF.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA, RSA Sign (Classical); ML-DSA (Planned/Under Standardization)
- **Authoritative Source URL**: https://dadrian.io/blog/posts/pqc-signatures-2024/ (Referenced in text), Chrome Security documentation implied.

---

## Microsoft Edge

- **Category**: Web Browsers
- **Product Name**: Microsoft Edge
- **Product Brief**: Web browser with integrated security features, AI capabilities, and enterprise management policies.
- **PQC Support**: No (PQC algorithms are available in Windows OS and .NET 10, but not explicitly stated as supported within the Microsoft Edge browser itself).
- **PQC Capability Description**: The document states that PQC algorithms (ML-KEM, ML-DSA) are generally available in Windows Server 2025, Windows 11, and .NET 10 via CNG libraries. It mentions that development of PQC support for securing TLS is proceeding in alignment with IETF standards, but does not confirm current implementation or support within the Microsoft Edge browser application.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions ML-KEM and ML-DSA availability in Windows/.NET, but does not list specific primitives used by Edge).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 145.0.3800.82
- **Release Date**: 2026-02-26
- **FIPS Validated**: No
- **Primary Platforms**: Windows, macOS (implied by "non-Windows platforms" mention), Linux (implied by .NET context)
- **Target Industries**: Enterprise, Government (implied by Intune MAM, Microsoft 365 admin center features)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: PQC support for TLS is proceeding in alignment with IETF standards; PQC in Active Directory Certificate Services (ADCS) targeted for early 2026.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Mozilla Firefox

- **Category**: Web Browsers
- **Product Name**: Mozilla Firefox
- **Product Brief**: Web browser with experimental PQC support via a modified NSS library and external PKCS#11 modules.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports hybrid key agreements using X25519MLKEM768 (default in Firefox 132+ Desktop, 145+ Android) and X25519Kyber768Draft00 (Firefox 124-131 via config). A research fork integrates ML-DSA for signatures and ML-KEM for key encapsulation using the Qryptotoken PKCS#11 module and Libcrux library.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM (Kyber), ML-DSA, TLS 1.3, QUIC/HTTP3
- **Key Management Model**: PKCS#11 compliant software token (Qryptotoken) with shallow module architecture delegating operations to external libraries; supports programmatic key management via NSS.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer with modular PKCS#11 integration
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Firefox 145 (Android), Firefox 132 (Desktop) for default PQC; Firefox 128+ for QUIC/HTTP3 Kyber support.
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Desktop, Android, iOS (via system-wide support mentioned in context of other browsers), macOS
- **Target Industries**: General consumer and enterprise web browsing
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Default deployment of X25519MLKEM768 in Firefox 132+; research integration of ML-DSA and ML-KEM via Qryptotoken for future interoperability.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA (implied by standard NSS), Ed25519 (implied by standard NSS), ML-DSA (research fork only, not exposed in default signature list yet)
- **Authoritative Source URL**: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/index.md

---

## Apple Safari

- **Category**: Web Browsers
- **Product Name**: Safari
- **Product Brief**: Web browser for iPhone, iPad, and Mac offering fast performance, energy efficiency, and quantum-secure cryptography support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Apple adopts hybrid cryptography combining classic and post-quantum algorithms. PQC is deployed in TLS/HTTPS (via URLSession/Network framework), VPN (IKEv2), SSH, and Apple Watch pairing using ML-KEM. CryptoKit supports ML-KEM 768/1024 for encryption and ML-DSA-65/ML-DSA-87 for authentication in iOS/iPadOS/macOS/tvOS/watchOS 26.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, Elliptic Curve Diffie-Hellman, Elliptic Curve signature, ML-KEM (768, 1024), ML-DSA (65, 87)
- **Key Management Model**: Hybrid cryptography; keys backed up and synced via iCloud Keychain; Passkeys use WebAuthn.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Classic + PQC)
- **Infrastructure Layer**: Application, Network
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: Safari 16 (mentioned for Web Push); iOS/iPadOS/macOS/tvOS/watchOS 26 (for PQC features)
- **Release Date**: 2026-01-28
- **FIPS Validated**: Not stated
- **Primary Platforms**: iOS, iPadOS, macOS, tvOS, visionOS, watchOS
- **Target Industries**: Consumer, Enterprise, General Web Browsing
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Deployed hybrid cryptography in iOS 17.4+ (iMessage PQ3) and OS version 26 (TLS, VPN, SSH, CryptoKit). Uses ML-KEM and ML-DSA algorithms.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Elliptic Curve signature, ML-DSA-65, ML-DSA-87
- **Authoritative Source URL**: https://developer.apple.com/safari/ (inferred from context "Apple Developer" and "Safari for developers")

---
## Google Chrome

- **Category**: Web Browsers
- **Product Name**: Google Chrome
- **Product Brief**: Web browser with hybrid post-quantum key establishment support via ML-KEM.
- **PQC Support**: Yes (Hybrid ML-KEM enabled by default on desktop since Chrome 131 and Android since Chrome 133; experimental Kyber support in Chrome 116).
- **PQC Capability Description**: Chrome offers hybrid ML-KEM (formerly Kyber) by default for key establishment. Desktop platforms use it since Chrome 131, Android since Chrome 133. Client Hello includes X25519+ML-KEM with ECDSA signatures. Google servers prefer ML-KEM for properties. Authentication remains classical (ECDSA); PQC authentication is not yet required as quantum computers do not exist.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM, ECDSA, Curve25519, AES, ChaCha-Poly, Simon/Speck, RSA (mentioned as vulnerable), Diffie-Hellman, ECDH.
- **Key Management Model**: Hybrid key establishment (Classical + PQC)
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid Key Establishment
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Chrome 133 (Android), Chrome 131 (Desktop)
- **Release Date**: 2024-10-01 (Chrome 131 enables ML-KEM by default in Oct 2024; Android version 133 implied later)
- **FIPS Validated**: No (ML-DSA only recently defined in FIPS standard, but Chrome status not stated as validated)
- **Primary Platforms**: Desktop, Android, iOS (via system-wide support mentioned for Apple OS), macOS
- **Target Industries**: General Consumer, Enterprise (implied by Google properties)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: ML-KEM enabled by default in Chrome 131 (Oct 2024). PQC authentication not needed until quantum computers exist. NIST renamed Kyber to ML-KEM and Dilithium to ML-DSA in Aug 2024.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (current), ML-DSA (planned/under standardization, not yet deployed for authentication)
- **Authoritative Source URL**: https://dadrian.io

---

## Microsoft Edge

- **Category**: Web Browsers
- **Product Name**: Microsoft Edge
- **Product Brief**: Web browser with enterprise security features, AI integration, and upcoming PQC support via Windows/.NET infrastructure.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: PQC algorithms (ML-KEM, ML-DSA) are GA in Windows Server 2025, Windows 11, and .NET 10, which Edge relies on. PQC for TLS is proceeding per IETF standards. PQC in Active Directory Certificate Services (ADCS) is targeted for early 2026. No explicit statement of PQC implementation directly within the Edge browser binary itself in the provided text.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 145.0.3800.82
- **Release Date**: 2026-02-26
- **FIPS Validated**: No
- **Primary Platforms**: Windows Server 2025, Windows 11 (24H2, 25H2), .NET 10
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: PQC in ADCS targeted for early 2026. TLS PQC support proceeding per IETF standards. SymCrypt to incorporate additional quantum-resistant algorithms.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (planned/available via OS), ECDSA, Ed25519 (implied by standard browser context but not explicitly listed as current PQC status in text)
- **Authoritative Source URL**: Not stated

---

## Mozilla Firefox

- **Category**: Web Browsers
- **Product Name**: Mozilla Firefox
- **Product Brief**: Web browser with experimental PQC support via a modified NSS library and external PKCS#11 modules.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports X25519MLKEM768 by default in Firefox 132+ (Desktop) and 145+ (Android); supports X25519Kyber768Draft00 in versions 124-131 via config flags. A research fork implements ML-DSA and ML-KEM using the Qryptotoken PKCS#11 module and Libcrux library, enabling hybrid TLS 1.3 handshakes with OQS and Cloudflare servers.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, MLKEM768 (Kyber), Kyber768Draft00, ML-DSA, ML-KEM, TLS 1.3
- **Key Management Model**: PKCS#11 based external software token (Qryptotoken) with shallow module architecture delegating to Libcrux
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based cryptographic agility via loadable PKCS#11 modules
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Firefox 145 (Android), Firefox 132 (Desktop) for default PQC; research fork version not specified
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Desktop, Android, iOS (via system-wide support mentioned in context of other browsers, but specific Firefox mobile versions listed are Android)
- **Target Industries**: General consumer, Research
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Default deployment of X25519MLKEM768 starting Firefox 132+; research implementation of ML-DSA and ML-KEM via Qryptotoken for interoperability testing.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (research fork), ECDSA (implied existing), EdDSA (implied existing)
- **Authoritative Source URL**: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/index.md

---

## Apple Safari

- **Category**: Web Browsers
- **Product Name**: Apple Safari
- **Product Brief**: Web browser for iPhone, iPad, and Mac offering fast performance, energy efficiency, and advanced developer tools.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Apple supports quantum-secure encryption in TLS/HTTPS via URLSession and Network frameworks in iOS 26, iPadOS 26, macOS 26, tvOS 26, and watchOS 26. Hybrid cryptography combines classic algorithms with post-quantum algorithms (ML-KEM for key exchange, ML-DSA for authentication) to mitigate "Harvest Now, Decrypt Later" attacks. Support is enabled by default for system services and apps using these APIs.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, Elliptic Curve Diffie-Hellman, Elliptic Curve signature, ML-KEM (768, 1024), ML-DSA (65, 87)
- **Key Management Model**: Hybrid cryptography combining classic algorithms and post-quantum algorithms; iCloud Keychain for credential syncing.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid cryptography
- **Infrastructure Layer**: Application, Security Stack, Network
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: Safari 16 (mentioned for Web Push), iOS 26/macOS 26/iPadOS 26/tvOS 26/watchOS 26 (for PQC features)
- **Release Date**: 2026-01-28
- **FIPS Validated**: Not stated
- **Primary Platforms**: iOS, iPadOS, macOS, tvOS, watchOS, visionOS
- **Target Industries**: General consumer and enterprise web browsing; not specific to a single industry.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Apple has deployed quantum-secure cryptography in TLS/HTTPS, VPN (IKEv2), SSH, iMessage (PQ3), and CryptoKit for iOS 26/iPadOS 26/macOS 26/tvOS 26/watchOS 26. Uses hybrid approach with ML-KEM and ML-DSA.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Elliptic Curve signature, ML-DSA-65, ML-DSA-87
- **Authoritative Source URL**: Not stated

---
