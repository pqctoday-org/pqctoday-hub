---
reference_id: FIPS 206
document_type: Algorithm
document_status: Initial Public Draft
date_published: 2025-01-01
date_updated: 2025-12-09
region: USA; Global
migration_urgency: High
local_file: public/library/FIPS_206.html
---

# FFT over NTRU-Lattice-Based Digital Signature Algorithm (FN-DSA)

## Authors

**Organization:** NIST

## Scope

**Industries:** Constrained Devices; IoT; Embedded Systems; Mobile
**Region:** USA; Global
**Document type:** Algorithm

## How It Relates to PQC

Compact signatures for resource-constrained environments

**Dependencies:** FALCON; FIPS 186-5

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| Algorithm family       | Lattice-based (NTRU)                                     |
| Security levels        | L1,L5                                                    |
| Protocol / tool impact | Compact signatures for resource-constrained environments |
| Toolchain support      | In development                                           |

## Short Description

Specifies FN-DSA (FALCON) compact signature algorithm with two parameter sets (512, 1024). Currently in public draft stage; final standard expected in 2026. Offers significantly smaller signatures than ML-DSA, suited for constrained environments.

## Long Description

Post-Quantum Cryptography | CSRC You are viewing this page in an unauthorized frame window. This is a potential security issue, you are being redirected to https://csrc.nist.gov . An official website of the United States government Here’s how you know Here’s how you know Official websites use .gov A .gov website belongs to an official government organization in the United States. Secure .gov websites use HTTPS A lock ( Lock Locked padlock icon ) or https:// means you’ve safely connected to the .gov website. Share sensitive information only on official, secure websites. Search Search CSRC MENU Search Search Projects Publications Expand or Collapse Drafts for Public Comment All Public Drafts Final Pubs FIPS (standards) Special Publications (SP s ) IR (interagency/internal reports) CSWP (cybersecurity white papers) ITL Bulletins Project Descriptions Journal Articles Conference Papers Books Topics Expand or Collapse Security & Privacy Applications Technologies Sectors Laws & Regulations Activities & Products News & Updates Events Glossary About CSRC Expand or Collapse Computer Security Division Cryptographic Technology Secure Systems and Applications Security Components and Mechanisms Security Engineering and Risk Management Security Testing, Validation, and Measurement Applied Cybersecurity Division Cybersecurity and Privacy Applications National Cybersecurity Center of Excellence (NCCoE) National Initiative for Cybersecurity Education (NICE) Contact Us Information Technology Laboratory Computer Security Resource Center Projects Post-Quantum Cryptography PQC Share to Facebook Share to X Share to LinkedIn Share ia Email Project Links Overview FAQs News & Updates Events Publications Presentations Overview Short URL: https://www.nist.gov/pqcrypto For a plain-language introduction to post-quantum cryptography, see What Is Post-Quantum Cryptography? PQC Standards | Migration to PQC | Ongoing PQC Standardization Process NIST’s Post-Quantum Cryptography (PQC) project leads the national and global effort to secure electronic information against the future threat of quantum computers—machines that may be years or decades away but could eventually break many of today’s widely used cryptographic systems. Through a multi-year international competition involving industry, academia, and governments, NIST released the principal three PQC standards in 2024 and is developing additional standards to serve as backups or alternatives. Organizations should begin applying these standards now to migrate their systems to quantum-resistant cryptography. Alongside these standards, NIST conducts foundational cryptographic research; collaborates with industry and federal partners to guide organizations preparing for PQC migration; and administers the Cryptographic Module Validation Program to promote validated, trustworthy cryptography. These efforts both protect data and information systems and sustain U.S. leadership in quantum information science and cryptographic innovation. PQC Standards In August 2024, NIST released its principal PQC standards (as Federal Information Processing Standards, or FIPS), specifying key establishment and digital signature schemes based on candidates evaluated and selected through this multi-year process. FIPS 203 Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM) FIPS 204 Module-Lattice-Based Digital Signature Standard (ML-DSA) FIPS 205 Stateless Hash-Based Digital Signature Standard (SLH-DSA) Migration to PQC With the release of the first three final PQC standards, organizations should begin migrating their systems to quantum-resistant cryptography. Cybersecurity products, services, and protocols will need updates, and organizations must identify where vulnerable algorithms are used and plan to replace or update them. Under the transition timeline in NIST IR 8547 , NIST will deprecate and ultimately remove quantum-vulnerable algorithms from its standards by 2035, with high-risk systems transitioning much earlier. The Migration to Post-Quantum Project at the National Cybersecurity Center of Excellence is working with industry, academia, and federal partners to accelerate this shift by demonstrating tools to find and prioritize vulnerable systems, supporting interoperable solutions, and developing migration guidance. Ongoing PQC Standardization Process NIST expects that the two digital signature standards (ML-DSA and SLH-DSA) and key-encapsulation mechanism standard (ML-KEM) will provide the foundation for most deployments of post-quantum

---

_Post-Quantum Cryptography | CSRC You are viewing this page in an unauthorized frame window. This is a potential security issue, you are being redirected to https://csrc.nist.gov . An official website of the United States government Here’s how you know Here’s how you know Official websites use .gov A .gov website belongs to an official government organization in the United States. Secure .gov websites use HTTPS A lock ( Lock Locked padlock icon ) or https:// means you’ve safely connected to_
