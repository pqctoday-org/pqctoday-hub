---
generated: 2026-03-06
collection: csc_006
documents_processed: 5
enrichment_method: ollama-qwen3.5:27b
---

## VeraCrypt

- **Category**: Disk and File Encryption Software
- **Product Name**: VeraCrypt
- **Product Brief**: Disk encryption with strong security based on TrueCrypt.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, schemes, or migration plans. It focuses on traditional disk encryption and code signing using standard certificates.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated (Document mentions "encryption" generally and digital signatures for code signing but does not list specific cryptographic primitives like AES, Serpent, Twofish, or RSA/ECC used internally).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial (Note: License field states "NOASSERTION" in metadata, but text mentions specific copyright holders and license terms in 'License.txt' requiring agreement; derived works cannot be named VeraCrypt).
- **License**: NOASSERTION (as per repository metadata); Text references a custom license file ('License.txt') with restrictions on naming derived works.
- **Latest Version**: Not stated (Text mentions "TrueCrypt 7.1a" as the base, but does not state the current VeraCrypt version number).
- **Release Date**: 2026-03-06 (Last Updated timestamp in repository metadata)
- **FIPS Validated**: No
- **Primary Platforms**: Windows (Vista and later), Linux, Mac OS X, FreeBSD (version 11+)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document mentions digital signatures for .sys and .exe files using IDRIX certificates issued by GlobalSign, but does not specify the signature algorithm).
- **Authoritative Source URL**: https://github.com/veracrypt/VeraCrypt

---

## BitLocker (Windows)

- **Category**: Disk and File Encryption Software
- **Product Name**: BitLocker
- **Product Brief**: Windows security feature providing encryption for entire volumes to mitigate data theft from lost or stolen devices.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, schemes, or migration plans. It only references classical encryption methods like XTS-AES 128-bit.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: XTS-AES 128-bit
- **Key Management Model**: Uses Trusted Platform Module (TPM) for key protection; supports recovery keys backed up to Microsoft Entra ID, Active Directory Domain Services (AD DS), or Microsoft accounts; uses startup keys on removable drives or PINs.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hardware-backed (TPM) with software implementation
- **Infrastructure Layer**: Application, Hardware
- **License Type**: Proprietary
- **License**: Commercial (requires specific Windows editions and license entitlements such as Windows Pro, Enterprise E3/E5, Education A3/A5)
- **Latest Version**: Not stated (Windows versions 11, 10, Server 2025, 2022, 2019, 2016 are listed as supported OS platforms)
- **Release Date**: Not stated (Document last updated on 2025-07-29)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows 11, Windows 10, Windows Server 2025, Windows Server 2022, Windows Server 2019, Windows Server 2016
- **Target Industries**: Enterprise (IT professionals and device administrators)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## LUKS/dm-crypt

- **Category**: Disk and File Encryption Software
- **Product Name**: cryptsetup / LUKS
- **Product Brief**: Open-source disk encryption software supporting full-disk encryption with LUKS and LUKS2 formats.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It only references standard disk encryption formats (LUKS, LUKS2).
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: GNU General Public License v2.0 or later
- **Latest Version**: Unknown
- **Release Date**: 2015-03-16 (Project creation date)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://gitlab.com/cryptsetup/cryptsetup

---

## FileVault (macOS)

- **Category**: Disk and File Encryption Software
- **Product Name**: FileVault
- **Product Brief**: Disk encryption software for macOS that protects data by requiring a login password or recovery key to decrypt.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document describes standard disk encryption using Apple silicon or T2 Security Chip but does not mention Post-Quantum Cryptography algorithms, migration plans, or quantum resistance.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Uses login passwords for user unlocking; supports iCloud account integration for recovery or a generated alphanumeric recovery key stored offline.
- **Supported Blockchains**: Not stated
- **Architecture Type**: OS-level disk encryption utilizing Apple silicon or T2 Security Chip hardware acceleration.
- **Infrastructure Layer**: Hardware, Security Stack
- **License Type**: Proprietary
- **License**: Proprietary (Apple Inc.)
- **Latest Version**: macOS Tahoe 26
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: macOS (Tahoe 26, Sequoia 15, Sonoma 14, Ventura 13, Monterey 12, Big Sur 11.0, Catalina 10.15, Mojave 10.14, High Sierra)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Linux LUKS / dm-crypt

- **Category**: Disk and File Encryption Software
- **Product Name**: cryptsetup
- **Product Brief**: Open-source disk encryption tool supporting LUKS, full-disk encryption, and related utilities.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text. The document contains no mention of Post-Quantum Cryptography algorithms, migration plans, or research status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: GNU General Public License v2.0 or later
- **Latest Version**: Unknown
- **Release Date**: 2015-03-16 (Project creation date)
- **FIPS Validated**: No
- **Primary Platforms**: Linux (inferred from "Linux LUKS / dm-crypt" context and project name, though specific OS list not explicitly detailed in text body beyond title)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://gitlab.com/cryptsetup/cryptsetup

---
