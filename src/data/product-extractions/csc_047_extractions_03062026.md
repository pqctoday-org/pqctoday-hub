---
generated: 2026-03-06
collection: csc_047
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## ID Quantique Quantis QRNG

- **Category**: Quantum Random Number Generator (QRNG)
- **Product Name**: Quantis QRNG (including Quantis QRNG USB, Quantis QRNG PCIe, Quantis QRNG Chips)
- **Product Brief**: Hardware Quantum Random Number Generator providing true randomness via quantum optics for cryptographic key generation.
- **PQC Support**: No
- **PQC Capability Description**: The document describes the product as a source of "true randomness" and "entropy" to secure keys against predictability, but it does not state that the device implements Post-Quantum Cryptography (PQC) algorithms itself. It is positioned as a component for "Quantum-Safe Security" by providing high-quality entropy for key generation, not as a PQC algorithm implementation.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated (Product generates random numbers/entropy; does not implement specific crypto primitives like ECDSA or RSA)
- **Key Management Model**: Hardware-based secure key generation source; provides entropy for external systems; includes live monitoring and failure detection to disable output on failure.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware (USB module, PCIe card, embedded chip)
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated (Specific versions like "Quantis Appliance 2.0" mentioned in navigation, but no version number for the core QRNG product)
- **Release Date**: Not stated (First released in 2001; document mentions events up to January 2025)
- **FIPS Validated**: No (Passed NIST SP800-22 and SP800-90B statistical tests; AIS31 validated versions available; no FIPS 140-2/3 validation explicitly stated)
- **Primary Platforms**: Compatible with most platforms; drivers provided for commonly used operating systems.
- **Target Industries**: Banking, Gaming and Lotteries, Automotive, Telecommunications, IoT, Satellites, Government & Defense, Healthcare, Critical Infrastructure.
- **Regulatory Status**: AIS31 validated (BSI test procedure by French ANSSI); Certified by CTL (English) and METAS (Swiss); ISO 14001 certification for ID Quantique company.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.idquantique.com (inferred from text "ID Quantique SA" and context, though specific URL not explicitly listed as a link in the raw text provided)

---

## Quantinuum Quantum Origin

- **Category**: Quantum Random Number Generator (QRNG)
- **Product Name**: Quantum Origin
- **Product Brief**: Advanced quantum random number generator (QRNG) using software deployment to strengthen encryption with proven quantum randomness.
- **PQC Support**: No
- **PQC Capability Description**: The document describes Quantum Origin as a QRNG designed to "strengthen encryption" and help organizations become "post-quantum ready" by providing provable quantum entropy for key generation. It does not state that the product implements specific Post-Quantum Cryptography (PQC) algorithms (e.g., CRYSTALS-Kyber, Dilithium) or replaces classical signature schemes with PQC primitives.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions RSA certificates as an example of weak keys in legacy systems but does not list specific primitives implemented by Quantum Origin).
- **Key Management Model**: Software-based randomness enhancement; uses a "Quantum Seed" generated on a quantum computer to enhance local classical randomness via randomness extractors. No hardware key storage or HSM mentioned for the product itself.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Standalone software module (software-based deployment); utilizes remote quantum computer (System Model H2) for seed generation.
- **Infrastructure Layer**: Security Stack, Software (Note: Context provided in prompt lists "Hardware", but document explicitly states "no extra hardware" and "software-based deployment").
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Document discusses NIST SP 800-90B standards but does not claim FIPS 140-2 or 140-3 validation for Quantum Origin).
- **Primary Platforms**: Linux operating system (explicitly mentioned as an integration example); general "target system" deployment.
- **Target Industries**: Enterprise, Government, Cybersecurity (Mentions Honeywell, Fornetix, Thales, Keyfactor, Senetas as partners/customers).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated (Product is positioned to enable post-quantum readiness via entropy, not as a PQC algorithm migration tool).
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains "Quantinuum_Quantum_Origin.html" and "Quantinuum_Quantum_Origin_doc1.pdf" as source filenames, but no external URL).

---
