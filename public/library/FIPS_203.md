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

## Author & Organization

**Organization:** NIST

## Scope

**Industries:** Generic IT; Finance; Telecom; Government; Healthcare; Critical Infrastructure
**Region:** USA; Global
**Document type:** Algorithm

## How It Relates to PQC

TLS 1.3, QUIC, SSH, IPsec/IKE, CMS key wrapping

**Dependencies:** NIST PQC Project; CRYSTALS-Kyber

## Risks Addressed

**Migration urgency:** High
**Security levels:** L1,L3,L5

## PQC Key Types & Mechanisms

| Field                  | Value                                           |
| ---------------------- | ----------------------------------------------- |
| Algorithm family       | Lattice-based                                   |
| Security levels        | L1,L3,L5                                        |
| Protocol / tool impact | TLS 1.3, QUIC, SSH, IPsec/IKE, CMS key wrapping |
| Toolchain support      | OpenSSL 3.5+; BoringSSL; AWS-LC; liboqs         |

## Description

Specifies ML-KEM (Kyber) with three parameter sets (512, 768, 1024) for quantum-resistant key establishment. Errata Oct 2024.

---

_FIPS 203 Federal Information Processing Standards Publication Module-Lattice-Based Key-Encapsulation Mechanism Standard Category: Computer Security Subcategory: Cryptography Information Technology Laboratory National Institute of Standards and Technology Gaithersburg, MD 20899-8900 This publication is available free of charge from: https://doi.org/10.6028/NIST.FIPS.203 Published August 13, 2024 U.S. Department of Commerce Gina M. Raimondo, Secretary National Institute of Standards and Technology Laurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology Foreword The Federal Information Processing Standards (FIPS) Publication Series of the National Institute of Standards and Technology is the official series of publications relating to standards and guidelines developed under 15 U.S.C. 278g-3, and issued by the Secretary of Commerce under 40 U.S.C. 11331. Comments concerning this Federal Information Processing Standard publication are welcomed and should be submitted using the contact information in the “Inquiries and Comments” clause of the announcement section. Kevin M. Stine, Director Information Technology Laboratory FIPS 203 MODULE-LATTICE-BASED KEY-ENCAPSULATION MECHANISM Abstract A key-encapsulation mechanism (KEM) is a set of algorithms that, under certain conditions, can be used by two parties to establish a shared secret key over a public channel. A shared secret key that is securely established using a KEM can then be used with symmetric-key cryptographic algorithms to perform basic tasks in secure communications, such as encryption and authentication. This standard specifies a key-encapsulation mechanism called ML-KEM. The security of ML-KEM is related to the computational difficulty of the Module Learning with Errors problem. At present, ML-KEM is believed to be secure, even against adversaries who possess a quantum computer. This standard specifies three parameter sets for ML-KEM. In order of increasing security strength and decreasing performance, these are ML-KEM-512, ML-KEM-768, and ML-KEM-1024. Keywords: computer security; cryptography; encryption; Federal Information Processing Standards; key-encapsulation mechanism; lattice-based cryptography; post-quantum; public-key cryptography._
