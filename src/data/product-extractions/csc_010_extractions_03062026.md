---
generated: 2026-03-06
collection: csc_010
documents_processed: 6
enrichment_method: ollama-qwen3.5:27b
---

## strongSwan

- **Category**: VPN and IPsec Software
- **Product Name**: strongSwan
- **Product Brief**: An OpenSource IPsec-based VPN solution supporting IKEv2, site-to-site, and roadwarrior configurations.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms, migration plans, or quantum-resistant capabilities. It explicitly mentions the generation of Ed25519 keys, which are classical elliptic curve cryptography.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Ed25519, EAP-MD5, EAP-MSCHAPv2, X.509 certificates (pubkey)
- **Key Management Model**: Certificate-based authentication using X.509 CA and private keys; Pre-shared secrets for EAP authentication; No mention of HSM, MPC, or quantum key distribution.
- **Supported Blockchains**: Not stated
- **Architecture Type**: VPN concentrator / IPsec gateway (software daemon)
- **Infrastructure Layer**: Network
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Configuration files imply Linux/Unix environment)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Ed25519, X.509 (pubkey), EAP-MD5, EAP-MSCHAPv2
- **Authoritative Source URL**: https://github.com/strongswan/strongswan

---

## Libreswan

- **Category**: VPN and IPsec Software
- **Product Name**: Libreswan
- **Product Brief**: An Internet Key Exchange (IKE) implementation for Linux, FreeBSD, NetBSD, and OpenBSD supporting IKEv1, IKEv2, and IPsec.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any plans for PQC migration. It only references standard X.509 Digital Certificates and NSS for key storage.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions support for X.509 Digital Certificates and IPsec extensions but does not list specific primitives like ECDSA, RSA, or AES).
- **Key Management Model**: Uses NSS (Network Security Services) to store private keys and X.509 certificates; supports PKCS#12 certificate import; configuration stored in /etc/ipsec.secrets.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software implementation for Linux, FreeBSD, NetBSD, and OpenBSD; integrates with init systems (systemd, upstart, sysvinit, openrc).
- **Infrastructure Layer**: Network
- **License Type**: Open Source
- **License**: GNU General Public License version 2 (GPLv2)
- **Latest Version**: Not stated (Document mentions "Libreswan 5.x" in the context of upgrading from older versions, but does not specify a current release number).
- **Release Date**: 2026-03-06 (Last Updated timestamp in repository metadata)
- **FIPS Validated**: No
- **Primary Platforms**: Linux (RHEL, Fedora, CentOS, Ubuntu, Debian, Arch, Alpine), FreeBSD, NetBSD, OpenBSD, OpenWrt
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document mentions X.509 Digital Certificates but does not specify signature algorithms).
- **Authoritative Source URL**: https://libreswan.org/

---

## OpenVPN

- **Category**: VPN and IPsec Software
- **Product Name**: OpenVPN
- **Product Brief**: OpenVPN is an open source VPN daemon providing secure tunneling.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text mentions RSA keys and certificates but does not reference any Post-Quantum Cryptography algorithms or implementations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, X509 (mentioned as "embedded X509 certificate fields" and "Sample RSA keys")
- **Key Management Model**: Certificate-based authentication using X509 certificates; pre-shared keys not explicitly detailed but standard for VPNs; no mention of quantum key distribution or MPC.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Secure tunneling daemon (VPN concentrator/daemon)
- **Infrastructure Layer**: Network
- **License Type**: Open Source
- **License**: GNU General Public License version 2
- **Latest Version**: Unknown (text references "openvpn-<version>" as a placeholder)
- **Release Date**: Not stated (Last Updated: 2026-03-06T16:24:59Z refers to repository metadata, not a specific software release date)
- **FIPS Validated**: No
- **Primary Platforms**: Windows (MinGW, MSVC), Linux/Unix (implied by configure/make), Debian packages mentioned
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA (implied via "Sample RSA keys")
- **Authoritative Source URL**: https://github.com/OpenVPN/openvpn

---

## WireGuard

- **Category**: VPN and IPsec Software
- **Product Name**: WireGuard
- **Product Brief**: A modern, fast, simple, and secure VPN protocol designed for the Linux kernel.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text. The document contains no mention of Post-Quantum Cryptography algorithms, migration plans, or quantum-resistant implementations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Linux kernel module (implied by "WireGuard for the Linux kernel" and branch names like "wireguard-linux")
- **Infrastructure Layer**: Network
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-11-18
- **FIPS Validated**: No
- **Primary Platforms**: Linux kernel (specifically mentioned: x86, loongarch, OpenRISC)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://git.zx2c4.com/wireguard-linux

---

## Cisco Secure Client (AnyConnect)

- **Category**: VPN and IPsec Software
- **Product Name**: Cisco Secure Client (including AnyConnect)
- **Product Brief**: Unified endpoint security agent providing VPN/ZTNA access and advanced protection.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The provided text contains no information regarding Post-Quantum Cryptography, quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Endpoint security agent / Virtual appliance (implied by "endpoint agents" and "cloud management")
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Endpoint (implied by "endpoint security agents"), Cloud (management console)
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.cisco.com (inferred from "Cisco.com" in text, specific product URL not explicitly listed as a standalone link)

---

## Palo Alto GlobalProtect

- **Category**: VPN and IPsec Software
- **Product Name**: GlobalProtect
- **Product Brief**: Network security client for endpoints enabling secure remote access for the hybrid workforce.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Network security client for endpoints; supports client or clientless deployment methods.
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2024-12-10 (Datasheet date)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Endpoints (mobile users), hybrid workforce environments; integrates with Prisma Access.
- **Target Industries**: Enterprise, Hybrid Workforce
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filenames provided: Palo_Alto_GlobalProtect.html, Palo_Alto_GlobalProtect_doc1.html, Palo_Alto_GlobalProtect_doc2.html)

---
