---
generated: 2026-03-31
collection: csc_031
documents_processed: 19
enrichment_method: ollama-qwen3.5:27b
---

## Windows Server 2025

- **Category**: Operating Systems
- **Product Name**: Windows Server 2025
- **Product Brief**: Next-generation operating system offering flexible, reliable infrastructure with enhanced security and hybrid cloud capabilities.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: PQC capabilities available for Windows Insiders (Canary Channel Build 27852+) via CNG libraries and SymCrypt. Supports ML-KEM (Key Encapsulation) and ML-DSA (Digital Signatures). Hybrid approach recommended alongside ECDH, RSA, ECDSA. Linux support via SymCrypt-OpenSSL 1.9.0 for TLS hybrid key exchange. SLH-DSA planned for future updates.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA, ECDH, RSA, ECDSA, SLH-DSA (planned), LMS/XMSS (planned)
- **Key Management Model**: Windows certificate store architecture; supports installing, importing, exporting, and validating PQ certificate chains via wincrypt.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Kernel-level crypto support via Cryptography API: Next Generation (CNG); provider/plugin model via SymCrypt.
- **Infrastructure Layer**: OS, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Windows Server 2025; Build 27852 (Windows Insiders); SymCrypt-OpenSSL version 1.9.0
- **Release Date**: 2025-05-19
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows Server 2025, Windows Insiders (Canary Channel), Linux
- **Target Industries**: Enterprise, Government, Financial services, Healthcare, Manufacturing, Retail, Education
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Plan to incorporate SLH-DSA into SymCrypt, CNG, and SymCrypt-OpenSSL. Working on bringing hybrid key exchange to Windows TLS stack (Schannel). Collaborating with IETF LAMPS working group on X.509 standardizations for ML-DSA, composite ML-DSA, SLH-DSA, ML-KEM, composite ML-KEM, and LMS/XMSS.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: ECDSA, RSA; PQC: ML-DSA (Level 2, 3, 5); Planned: SLH-DSA, LMS/XMSS
- **Authoritative Source URL**: https://techcommunity.microsoft.com/blog/microsoft-security-community-blog/post-quantum-cryptography-comes-to-windows-insiders-and-linux/

---
## Windows Server 2025

- **Category**: Operating Systems
- **Product Name**: Windows Server 2025
- **Product Brief**: Next-generation operating system offering flexible, reliable infrastructure with enhanced security and hybrid cloud capabilities.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: PQC capabilities available for Windows Insiders (Canary Channel Build 27852+) via CNG libraries and SymCrypt. Supports ML-KEM (Key Encapsulation) and ML-DSA (Digital Signatures). Hybrid approach recommended alongside ECDH, RSA, ECDSA. Linux support via SymCrypt-OpenSSL 1.9.0 for TLS hybrid key exchange. SLH-DSA planned for future updates.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA, ECDH, RSA, ECDSA, SLH-DSA (planned), LMS/XMSS (planned)
- **Key Management Model**: Windows certificate store architecture; supports installing, importing, exporting, and validating PQ certificate chains via wincrypt.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Kernel-level crypto support via Cryptography API: Next Generation (CNG); provider/plugin model via SymCrypt.
- **Infrastructure Layer**: OS, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Windows Server 2025; Build 27852 (Windows Insiders); SymCrypt-OpenSSL version 1.9.0
- **Release Date**: 2025-05-19
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows Server 2025, Windows Insiders (Canary Channel), Linux
- **Target Industries**: Enterprise, Government, Financial services, Healthcare, Manufacturing, Retail, Education
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Plan to incorporate SLH-DSA into SymCrypt, CNG, and SymCrypt-OpenSSL. Working on bringing hybrid key exchange to Windows TLS stack (Schannel). Collaborating with IETF LAMPS working group on X.509 standardizations for ML-DSA, composite ML-DSA, SLH-DSA, ML-KEM, composite ML-KEM, and LMS/XMSS.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: ECDSA, RSA; PQC: ML-DSA (Level 2, 3, 5); Planned: SLH-DSA, LMS/XMSS
- **Authoritative Source URL**: https://techcommunity.microsoft.com/blog/microsoft-security-community-blog/post-quantum-cryptography-comes-to-windows-insiders-and-linux/

---

## Android 16

- **Category**: Operating Systems
- **Product Name**: Android 16
- **Product Brief**: Operating system implementing Post-Quantum Cryptography as announced in a Google Security Blog post.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document announces the implementation of Post-Quantum Cryptography in Android, titled "Security for the Quantum Era," but does not specify specific algorithms, maturity levels, or current deployment status beyond the announcement date.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: OS
- **License Type**: Open Source/Commercial (inferred from "Open Source" label and Google product context, but specific license type not explicitly defined in text) -> Unknown
- **License**: Not stated
- **Latest Version**: Android 16
- **Release Date**: 2026-03-25
- **FIPS Validated**: No
- **Primary Platforms**: Android
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implementation of Post-Quantum Cryptography announced for March 25, 2026; specific algorithm choices or detailed timelines not stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## iOS 26 / macOS 26

- **Category**: Operating Systems
- **Product Name**: iOS 26 / macOS 26 (Apple Operating Systems)
- **Product Brief**: Apple operating systems featuring hybrid post-quantum cryptography support across messaging, TLS, VPN, and developer APIs.
- **PQC Support**: Yes (with details: Hybrid cryptography deployed in iMessage PQ3, TLS, VPN, SSH, and CryptoKit for iOS 26/macOS 26).
- **PQC Capability Description**: Apple uses hybrid cryptography combining classical and post-quantum algorithms. Deployed in iMessage (PQ3), TLS/HTTPS (URLSession/Network framework), native VPN/IKEv2, SSH (macOS 26), and Apple Watch pairing. CryptoKit supports ML-KEM (768, 1024) for encryption and ML-DSA (65, 87) for authentication.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, Elliptic Curve Diffie-Hellman, Elliptic Curve signature, ML-KEM, ML-DSA
- **Key Management Model**: Hybrid cryptography; utilizes Secure Enclave and iCloud Keychain (mentioned in context of OS security).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (combines classic algorithms with post-quantum algorithms); Kernel-level support via native APIs.
- **Infrastructure Layer**: Operating Systems, Security Stack, Network
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: iOS 26, macOS 26, iPadOS 26, watchOS 26, tvOS 26, visionOS 26
- **Release Date**: 2026-01-28 (Published Date of document)
- **FIPS Validated**: Not stated
- **Primary Platforms**: iOS, macOS, iPadOS, watchOS, tvOS, visionOS
- **Target Industries**: Consumer, Enterprise, Government, Education
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Adopting hybrid cryptography; deployed ML-KEM and ML-DSA in CryptoKit for iOS 26/macOS 26; prioritizing sensitive user information protocols.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Elliptic Curve signature, ML-DSA-65, ML-DSA-87
- **Authoritative Source URL**: Not stated (Document source: iOS_26___macOS_26_doc1.html)

---

## Windows 11

- **Category**: Operating Systems
- **Product Name**: Windows 11
- **Product Brief**: Operating system with integrated Post-Quantum Cryptography (PQC) capabilities via CNG and SymCrypt libraries.
- **PQC Support**: Yes (ML-KEM and ML-DSA available in Windows Server 2025, Windows 11 24H2/25H2, and Insiders Build 27852+).
- **PQC Capability Description**: PQC is Generally Available (GA) in Windows 11 (24H2, 25H2) and Server 2025 via CNG updates. Supports ML-KEM (Key Encapsulation) and ML-DSA (Digital Signatures) with NIST levels 1-5. Hybrid approaches recommended alongside RSA/ECDH/ECDSA. Certificate store supports PQ chain validation. TLS hybrid key exchange planned for Schannel; currently available in Linux SymCrypt-OpenSSL.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA, ECDH, RSA, ECDSA, Keccak (SHA-3/SHAKE), SLH-DSA (planned)
- **Key Management Model**: OS certificate store architecture with support for importing/exporting PQ certificates; integration with Microsoft Active Directory Certificate Services (ADCS) and TPM/VBS mentioned in general security context.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Kernel-level crypto via Cryptography API: Next Generation (CNG); SymCrypt core library; Hybrid mode (PQC + Classical).
- **Infrastructure Layer**: OS, Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Windows 11 25H2 (also mentions Build 27852 for Insiders)
- **Release Date**: 2025-11-18
- **FIPS Validated**: Yes (Completed FIPS validations mentioned in documentation links, specific version details not explicitly stated in text body).
- **Primary Platforms**: Windows 11, Windows Server 2025, Linux (via SymCrypt-OpenSSL)
- **Target Industries**: Enterprise, Government (implied by "organizations", "hybrid work", "global regulations")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: GA for ML-KEM/ML-DSA in Nov 2025. Planned: SLH-DSA integration, TLS hybrid key exchange via Schannel, ADCS support for PQ CA certificates, Intune Certificate Connector updates. Collaboration on X.509 standardization (LAMPS working group).
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), ECDSA, RSA; Planned: SLH-DSA, LMS/XMSS.
- **Authoritative Source URL**: Not stated

---

## Ubuntu 24.04 LTS

- **Category**: Operating Systems
- **Product Name**: Ubuntu 24.04 LTS
- **Product Brief**: Linux-based operating system providing enterprise-grade security, up to 15 years of support, and FIPS-validated cryptographic modules.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "FIPS-validated cryptographic modules" and "FIPS 140-2 certified packages" but does not mention Post-Quantum Cryptography (PQC), specific PQC algorithms, or migration plans for quantum resistance.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions FIPS validation but does not list specific primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated (Document mentions "Full Disk Encryption" and "Secure Boot" but does not describe the keychain architecture, TPM integration details, or certificate store architecture).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Linux-based OS with kernel-level security features including AppArmor, Mandatory Access Control, and Full Disk Encryption.
- **Infrastructure Layer**: Operating Systems, Security Stack
- **License Type**: Open Source/Commercial
- **License**: Not stated (Document mentions "open source" and "Ubuntu Pro" subscription but does not specify the license name like GPL or Apache).
- **Latest Version**: 24.04 LTS
- **Release Date**: Unknown
- **FIPS Validated**: Yes, FIPS 140-2 certified packages available via Ubuntu Pro; provides FIPS-validated cryptographic modules.
- **Primary Platforms**: Desktop workstation, Physical server, Public cloud (Azure, AWS), Virtual machine, IoT/Edge device
- **Target Industries**: Enterprise, Government, Automotive, Industrial, Telco, Finance, Public sector
- **Regulatory Status**: Supports compliance with NIST, FedRAMP, PCI-DSS, ISO27001, CIS benchmarks, DISA STIG, HIPAA, FISMA.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no explicit authoritative source URL for the product documentation).

---

## Red Hat Enterprise Linux 9

- **Category**: Operating Systems
- **Product Name**: Red Hat Enterprise Linux 9
- **Product Brief**: An operating system providing hardened solutions for enterprises to work across platforms and environments.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The provided text contains no mention of Post-Quantum Cryptography, PQC algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "Security-Enhanced Linux", "smart card authentication", and "certificates" but does not list specific cryptographic primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated (Text mentions "Working with vaults in Identity Management" for storing sensitive data and "Managing certificates in IdM", but does not describe the underlying key management architecture or provider model).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Text mentions kernel management, userspace tools like Podman/Buildah, and SELinux, but does not explicitly define a crypto provider/plugin architecture type).
- **Infrastructure Layer**: OS, Cloud, Security Stack
- **License Type**: Commercial
- **License**: Not stated (Text mentions "Subscription management" and "Red Hat Store", implying a commercial model, but does not specify the license name).
- **Latest Version**: 9.7
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Red Hat Enterprise Linux 9, Amazon Web Services, Google Cloud, Microsoft Azure, Red Hat OpenStack Platform
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Fedora Linux

- **Category**: Operating Systems
- **Product Name**: Fedora Linux
- **Product Brief**: An innovative, free, and open source platform for hardware, clouds, and containers enabling tailored solutions.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports experimental PQ algorithms via liboqs and oqsprovider integrated into OpenSSL and NSS. Includes Kyber, Dilithium, ML-KEM, and ML-DSA in Fedora 39, 40, and Rawhide. Enables hybrid PQ key exchange in TLS for NGINX and curl. Not yet supported for package signature verification or secure boot.
- **PQC Migration Priority**: Medium
- **Crypto Primitives**: Kyber, Dilithium, ML-KEM, ML-DSA (PQ); OpenSSL, NSS, GnuTLS (libraries)
- **Key Management Model**: OS keychain via crypto policies; manual key generation required for testing containers; no specific TPM or HSM integration stated.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Kernel vs userspace crypto via pluggable provider model (OpenSSL providers API, NSS PKCS#11)
- **Infrastructure Layer**: OS, Security Stack
- **License Type**: Open Source
- **License**: Not stated (described as "free, and open source")
- **Latest Version**: Fedora Rawhide (future Fedora 41)
- **Release Date**: 2024-07-05
- **FIPS Validated**: No
- **Primary Platforms**: Fedora Linux (versions 39, 40, Rawhide/41); containers; Flatpak for Firefox
- **Target Industries**: Software developers, community members, research environments (QUBIP consortium)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Integrating liboqs and oqsprovider; upgrading to match NIST draft standards (ML-KEM, ML-DSA); adding hybrid Kyber algorithms; planning documentation before public release.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Dilithium, ML-DSA (PQ signatures mentioned as supported in Rawhide)
- **Authoritative Source URL**: Not stated

---

## Debian 12 (Bookworm)

- **Category**: Operating Systems
- **Product Name**: Debian 12 (Bookworm)
- **Product Brief**: Operating system platform with a wiki page collating ideas and questions regarding Post-Quantum Cryptography (PQC) use.
- **PQC Support**: Planned (with timeline: "TODO: Add questions, FAQs, links later")
- **PQC Capability Description**: The document is a draft wiki page intended to collate ideas and questions about PQC in Debian. It lists external resources including IETF drafts and NIST FIPS standards (FIPS 203 ML-KEM/Kyber, FIPS 204 ML-DSA/Dilithium, FIPS 205 Sphincs+, DRAFT FIPS 206 FN-DSA/NTRU) and links to Open Quantum Safe libraries. No specific implementation status or maturity level within Debian 12 is stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document lists external standards like ML-KEM, CRYSTALS-Dilithium, Sphincs+, NTRU as references, but does not state they are currently implemented in the OS)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Operating Systems
- **License Type**: Open Source (implied by "Debian" and "Creative Commons Attribution-ShareAlike 4.0 International" for the wiki content)
- **License**: Creative Commons Attribution-ShareAlike 4.0 International (for the wiki page content); OS license not explicitly stated in text.
- **Latest Version**: Debian 12 (Bookworm)
- **Release Date**: Not stated (Document last modified: 2024-11-12)
- **FIPS Validated**: No (Document lists FIPS 203, 204, 205, and DRAFT 206 as external references/links, not as validation status for the OS)
- **Primary Platforms**: Debian 12 (Bookworm)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: "TODO: Add questions, FAQs, links later"; lists external standards and drafts as reference material.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (References to ML-DSA, Sphincs+, FN-DSA are listed as external standards, not current OS capabilities)
- **Authoritative Source URL**: Not stated (Document contains links to IETF, NIST, Open Quantum Safe, but no specific product URL for Debian 12 PQC implementation)

---

## Alpine Linux

- **Category**: Operating Systems
- **Product Name**: Alpine Linux
- **Product Brief**: Operating system providing PQC support via OpenSSL 3.5.x in release 3.22.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: PQC support is available in Alpine Linux 3.22 which ships with OpenSSL 3.5.x, enabling NIST-approved PQC algorithms by default. Version 3.21 uses OpenSSL 3.3.x and does not support PQC. Older versions can use the OQS provider workaround for key exchange but lack server authentication support until OpenSSL 3.2+.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519MLKEM768, X25519, prime256v1, NIST-approved PQC algorithms (specific names not listed beyond hybrid group)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: OS-level crypto support via OpenSSL library integration; supports OQS provider plugin model for older versions.
- **Infrastructure Layer**: Operating Systems, Security Stack
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: 3.22
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Alpine Linux (specifically version 3.22)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: PQC enabled by default in OpenSSL 3.5.x (Alpine 3.22); older versions require manual OQS provider installation with limitations on TLS 1.3 server authentication for OpenSSL <3.2.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document notes PQC signature algorithms are not supported for TLS 1.3 server authentication in OpenSSL 3.0.x/3.1.x)
- **Authoritative Source URL**: github.com/nginxinc (referenced as source context, though document is an NGINX blog post about Alpine compatibility)

---

## FreeBSD

- **Category**: Operating Systems
- **Product Name**: FreeBSD
- **Product Brief**: An operating system used to power modern servers, desktops, and embedded platforms with advanced networking, security, and storage features.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the document. The text mentions a "crypto" directory and "secure" directory for cryptographic libraries but does not specify Post-Quantum Cryptography algorithms or implementation status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document lists directories for cryptography but does not enumerate specific algorithms like ECDSA, RSA, etc.)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable / Not stated
- **Architecture Type**: Not stated (Document mentions kernel sources and userland libraries but does not describe the specific crypto provider architecture)
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: NOASSERTION (Note: Text states "NOASSERTION" for the repository license, while also referencing GPL/LGPL for GNU components and CDDL for cddl components).
- **Latest Version**: Not stated
- **Release Date**: 2026-03-06 (Last Updated date of the repository)
- **FIPS Validated**: No mention
- **Primary Platforms**: Servers, desktops, embedded platforms
- **Target Industries**: Web sites, embedded networking, storage devices
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable / Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/freebsd/freebsd-src

---

## openSUSE Leap

- **Category**: Operating Systems
- **Product Name**: openSUSE Leap
- **Product Brief**: A worldwide effort promoting the use of Linux everywhere, creating one of the world's best Linux distributions.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text. The document describes general Linux distribution tools and repositories but contains no information regarding Post-Quantum Cryptography algorithms, implementation status, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions SSH for secure channels but does not list specific cryptographic primitives like ECDSA, RSA, or PQC algorithms).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable / Not stated
- **Architecture Type**: Not stated (Text mentions kernel patches and userspace tools but does not describe a specific crypto architecture model).
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: GPL-2.0, GPL-3.0, LGPL-2.1, MIT (varies by repository component)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No mention
- **Primary Platforms**: Linux
- **Target Industries**: Not stated (Text mentions "Enterprises", "Small and medium teams", "Startups", "Nonprofits" in the context of GitHub, not openSUSE specifically).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable / Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: http://www.opensuse.org

---

## Rocky Linux

- **Category**: Operating Systems
- **Product Name**: Rocky Linux
- **Product Brief**: An open enterprise operating system, built by the @resforg.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: Not stated (Repository licenses include CC-BY-SA-4.0, BSD-3-Clause, GPL-2.0 for specific repos)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No mention
- **Primary Platforms**: Linux distributions and forks
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://rockylinux.org

---

## CentOS Stream

- **Category**: Operating Systems
- **Product Name**: CentOS Stream
- **Product Brief**: Continuously delivered distro that tracks just ahead of Red Hat Enterprise Linux (RHEL) development.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable / Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: Not stated (described as "Community-driven free software effort")
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No mention
- **Primary Platforms**: CentOS Stream (Linux)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable / Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## ChromeOS

- **Category**: Operating Systems
- **Product Name**: ChromeOS / ChromiumOS
- **Product Brief**: An operating system based on the open source Chromium project, with a blog post mentioning advancements in asymmetric cryptography.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated. The document mentions "Advancing Our Amazing Bet on Asymmetric Cryptography" but does not specify Post-Quantum Cryptography algorithms, implementation status, or maturity levels.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (General mention of "Asymmetric Cryptography", "TLS", "SSL", "HTTPS", "DNS-over-HTTPS", "QUIC" found in tags, but no specific primitives like ECDSA or Ed25519 are listed).
- **Key Management Model**: Unknown
- **Supported Blockchains**: Not stated
- **Architecture Type**: Unknown
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: Not stated (Text mentions "open source browser project" and repository access, but does not specify the license name like Apache-2.0 or BSD).
- **Latest Version**: Not stated (Repository commit hashes and branch names like "stabilize-cfm-16503.60.B" are present, but no official product version number is explicitly defined).
- **Release Date**: 2024-05-23 (Date of the blog post "Advancing Our Amazing Bet on Asymmetric Cryptography")
- **FIPS Validated**: Not stated
- **Primary Platforms**: ChromeOS, Linux, Android, iOS, Mac (inferred from tags like "Chrome OS", "linux", "android", "ios", "mac" in the blog tag list).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains repository paths and blog tags, but no explicit authoritative product URL is provided).

---

## NixOS

- **Category**: Operating Systems
- **Product Name**: NixOS / nixpkgs
- **Product Brief**: A purely-functional Linux distribution and a collection of over 120,000 software packages.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 25.11 (release)
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Linux
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/NixOS/nixpkgs

---

## SUSE Linux Enterprise Server (SLES)

- **Category**: Operating Systems
- **Product Name**: SUSE Linux Enterprise Server (SLES)
- **Product Brief**: A resilient, secure, and AI-ready Linux foundation enabling agentic AI modernization across data center, cloud, and edge.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions security features like SELinux, AppArmor, Common Criteria EAL4+ validation, and reproducible builds, but contains no explicit mention of Post-Quantum Cryptography (PQC) algorithms, support, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: OS-level; Kernel vs userspace crypto not explicitly detailed beyond SELinux/AppArmor frameworks and systemd init system.
- **Infrastructure Layer**: Operating Systems, Security Stack
- **License Type**: Open Source/Commercial
- **License**: GNU Free Documentation License (for documentation); Product is a commercial distribution of open source software recognized as a Digital Public Good.
- **Latest Version**: SUSE Linux Enterprise Server 16 (SLES 16) / SUSE Linux 16.0
- **Release Date**: 2025-11 (Planned for initial release 16.0); Document publication date: 2026-03-05
- **FIPS Validated**: No (Document mentions Common Criteria EAL4+ validation, but does not state FIPS 140-2 or 140-3 status)
- **Primary Platforms**: AMD64/Intel 64 (x86-64), IBM POWER (ppc64le), IBM Z (s390x), Arm (AArch64); Virtualization via KVM; Cloud and Edge environments.
- **Target Industries**: Automotive, Telecom, Banking and Financial Systems, Healthcare, Manufacturing, Retail, Technology & Software, Federal, SAP applications.
- **Regulatory Status**: Recognized as a Digital Public Good (DPG); Validated by Common Criteria EAL4+.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document source filenames provided, but no external URL extracted)

---

## Arch Linux

- **Category**: Operating Systems
- **Product Name**: Arch Linux
- **Product Brief**: An independently developed, x86-64 general-purpose GNU/Linux distribution following a rolling-release model.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text. The document describes general OS features and repositories but contains no mention of Post-Quantum Cryptography algorithms, implementations, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "commit signature verification" and "SSH" generally, but does not list specific primitives like ECDSA, Ed25519, etc.)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Text mentions kernel sources and user-configured base system, but no specific crypto architecture details)
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: GPL-3.0, GPL-2.0, MIT (varies by repository; e.g., archinstall is GPL-3.0, archweb is GPL-2.0, gluebuddy is MIT)
- **Latest Version**: Not stated
- **Release Date**: Not stated (Text mentions "Updated Mar 6, 2026" for repositories, but no specific OS version release date)
- **FIPS Validated**: No
- **Primary Platforms**: x86-64 GNU/Linux
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.archlinux.org/

---

## OpenWrt

- **Category**: Operating Systems
- **Product Name**: OpenWrt
- **Product Brief**: A Linux operating system targeting embedded devices with a fully writable filesystem and package management.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Linux operating system targeting embedded devices with a fully writable filesystem and package management.
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Open Source
- **License**: GPL-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Embedded devices (Linux-based)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/openwrt/openwrt

---
