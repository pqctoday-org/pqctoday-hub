---
generated: 2026-03-06
collection: csc_008
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## Proton Mail

- **Category**: Email Encryption Software
- **Product Name**: Proton Mail
- **Product Brief**: Secure your communications with encrypted email.
- **PQC Support**: Planned (with details)
- **PQC Capability Description**: Proton is leading standardization of quantum-safe OpenPGP extensions using hybrid modes. Selected algorithms: CRYSTALS-Dilithium + Ed25519 for signatures; CRYSTALS-Kyber + X25519 for encryption. Work began in 2021 with BSI. Rollout planned before quantum threat materializes.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, Elliptic Curve Cryptography (ECC), Ed25519, X25519, CRYSTALS-Dilithium, CRYSTALS-Kyber
- **Key Management Model**: OpenPGP-based asymmetric encryption; proposed draft standard for persistent symmetric keys derived from recipient passwords for re-encryption.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Classical + Post-Quantum)
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: GPL-3.0, MIT, BSD-3-Clause (varies by repository)
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Web, iOS, Android, Desktop (via Bridge)
- **Target Industries**: General Public, Business, Privacy-conscious users
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Developing OpenPGP extension for post-quantum algorithms since 2021. Using lattice-based algorithms (CRYSTALS-Dilithium, CRYSTALS-Kyber) in hybrid mode with classical counterparts. Aiming to roll out before quantum computers become a threat.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Ed25519, CRYSTALS-Dilithium (planned/hybrid), RSA (current), Elliptic Curve Cryptography (current)
- **Authoritative Source URL**: https://proton.me/mail

---

## GnuPG

- **Category**: Email Encryption Software
- **Product Name**: GnuPG (GNU Privacy Guard)
- **Product Brief**: A complete and free implementation of the OpenPGP standard enabling encryption, signing, and key management.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, schemes, or migration plans. It only references the OpenPGP standard (RFC4880), S/MIME, and Secure Shell.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated (Document mentions support for OpenPGP, S/MIME, and SSH protocols but does not list specific underlying algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Versatile key management system with access modules for public key directories; supports storage in SQLite database via "keyboxd" daemon (since v2.3.0) or keyring.kbx file; private keys stored as separate files.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer command line tool with support for daemons (gpg-agent, dirmngr, keyboxd).
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: GPL-3.0
- **Latest Version**: 2.5 (stable version mentioned); 2.6 (mentioned in build instructions as a dependency context)
- **Release Date**: Not stated (Last Updated: 2026-03-05T17:32:50Z refers to repository update, not software release date)
- **FIPS Validated**: No
- **Primary Platforms**: Unix, Windows (via gnupg-w32 tarball), Apple OSX, Cygwin
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document confirms support for signing data and communication via OpenPGP/S/MIME/SSH but does not enumerate specific signature algorithms).
- **Authoritative Source URL**: https://gnupg.org

---
