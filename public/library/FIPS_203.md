---
reference_id: FIPS 203
document_type: Algorithm
document_status: Final Standard
date_published: 2023-08-24
date_updated: 2024-08-13
region: USA; Global
migration_urgency: High
local_file: public/library/FIPS_203.pdf
preview: FIPS 203.png
---

# Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)

## Authors

**Organization:** NIST

## Scope

**Industries:** Generic IT; Finance; Telecom; Government; Healthcare; Critical Infrastructure
**Region:** USA; Global
**Document type:** Algorithm

## How It Relates to PQC

TLS 1.3, QUIC, SSH, IPsec/IKE, CMS key wrapping

**Dependencies:** NIST PQC Project; CRYSTALS-Kyber

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                                           |
| ---------------------- | ----------------------------------------------- |
| Algorithm family       | Lattice-based                                   |
| Security levels        | L1,L3,L5                                        |
| Protocol / tool impact | TLS 1.3, QUIC, SSH, IPsec/IKE, CMS key wrapping |
| Toolchain support      | OpenSSL 3.5+; BoringSSL; AWS-LC; liboqs         |

## Short Description

Specifies ML-KEM (Kyber) with three parameter sets (512, 768, 1024) for quantum-resistant key establishment. Errata Oct 2024.

## Long Description

FIPS 203 Federal Information Processing Standards Publication Module-Lattice-Based Key-Encapsulation Mechanism Standard Category: Computer Security Subcategory: Cryptography Information Technology Laboratory National Institute of Standards and Technology Gaithersburg, MD 20899-8900 This publication is available free of charge from: https://doi.org/10.6028/NIST.FIPS.203 Published August 13, 2024 U.S. Department of Commerce Gina M. Raimondo, Secretary National Institute of Standards and Technology Laurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology Foreword The Federal Information Processing Standards (FIPS) Publication Series of the National Institute of Standards and Technology is the official series of publications relating to standards and guidelines developed under 15 U.S.C. 278g-3, and issued by the Secretary of Commerce under 40 U.S.C. 11331. Comments concerning this Federal Information Processing Standard publication are welcomed and should be submitted using the contact information in the “Inquiries and Comments” clause of the announcement section. Kevin M. Stine, Director Information Technology Laboratory FIPS 203 MODULE-LATTICE-BASED KEY-ENCAPSULATION MECHANISM Abstract A key-encapsulation mechanism (KEM) is a set of algorithms that, under certain conditions, can be used by two parties to establish a shared secret key over a public channel. A shared secret key that is securely established using a KEM can then be used with symmetric-key cryptographic algorithms to perform basic tasks in secure communications, such as encryption and authentication. This standard specifies a key-encapsulation mechanism called ML-KEM. The security of ML-KEM is related to the computational difficulty of the Module Learning with Errors problem. At present, ML-KEM is believed to be secure, even against adversaries who possess a quantum computer. This standard specifies three parameter sets for ML-KEM. In order of increasing security strength and decreasing performance, these are ML-KEM-512, ML-KEM-768, and ML-KEM-1024. Keywords: computer security; cryptography; encryption; Federal Information Processing Standards; key-encapsulation mechanism; lattice-based cryptography; post-quantum; public-key cryptography. FIPS 203 MODULE-LATTICE-BASED KEY-ENCAPSULATION MECHANISM Federal Information Processing Standards Publication 203 Published: August 13, 2024 Effective: August 13, 2024 Announcing the Module-Lattice-Based Key-Encapsulation Mechanism Standard Federal Information Processing Standards (FIPS) publications are developed by the National Institute of Standards and Technology (NIST) under 15 U.S.C. 278g-3 and issued by the Secretary of Commerce under 40 U.S.C. 11331. 1. Name of Standard. Module-Lattice-Based Key-Encapsulation Mechanism Standard (FIPS 203). 2. Category of Standard. Computer Security. Subcategory. Cryptography. 3. Explanation. A cryptographic key (or simply “key”) is represented in a computer as a string of bits. A shared secret key is a cryptographic key that is computed jointly by two parties (e.g., Alice and Bob) using a set of algorithms. Under certain conditions, these algorithms ensure that both parties will produce the same key and that this key is secret from adversaries. Such a shared secret key can then be used with symmetric-key cryptographic algorithms (specified in other NIST standards) to perform tasks such as encryption and authentication of digital information. This standard specifies a set of algorithms for establishing a shared secret key. While there are many methods for establishing a shared secret key, the particular method described in this standard is a key-encapsulation mechanism (KEM). In a KEM, the computation of the shared secret key begins with Alice generating a decapsulation key and an encapsulation key. Alice keeps the decapsulation key private and makes the encapsulation key available to Bob. Bob then uses Alice’s encapsulation key to generate one copy of a shared secret key along with an associated ciphertext. Bob then sends the ciphertext to Alice. Finally, Alice uses the ciphertext from Bob along with Alice’s private decapsulation key to compute another copy of the shared secret key. The security of the particular KEM specified in this standard is related to the computational difficulty of solving

---

_FIPS 203 Federal Information Processing Standards Publication Module-Lattice-Based Key-Encapsulation Mechanism Standard Category: Computer Security Subcategory: Cryptography Information Technology Laboratory National Institute of Standards and Technology Gaithersburg, MD 20899-8900 This publication is available free of charge from: https://doi.org/10.6028/NIST.FIPS.203 Published August 13, 2024 U.S. Department of Commerce Gina M. Raimondo, Secretary National Institute of Standards and Technology Laurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology Foreword The Federal Information Processing Standards (FIPS) Publication Series of the_
