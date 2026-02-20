---
reference_id: NIST IR 8547
document_type: Compliance/Guidance
document_status: Initial Public Draft
date_published: 2024-11-12
date_updated: 2024-11-12
region: USA; Global
migration_urgency: High
local_file: public/library/NIST_IR_8547.pdf
preview: NIST IR 8547.png
---

# Transition to Post-Quantum Cryptography Standards

## Authors

**Organization:** NIST

## Scope

**Industries:** IT; Gov; Finance; Telecom; Cloud
**Region:** USA; Global
**Document type:** Compliance/Guidance

## How It Relates to PQC

Enterprise-wide PQC migration planning

**Dependencies:** FIPS 203/204/205

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                                  |
| ---------------------- | -------------------------------------- |
| Algorithm family       | N/A                                    |
| Security levels        | N/A                                    |
| Protocol / tool impact | Enterprise-wide PQC migration planning |
| Toolchain support      | Migration tools                        |

## Short Description

Roadmap for transitioning to PQC. Proposes 2030 deprecation and 2035 disallowment of classical asymmetric crypto.

## Long Description

NIST Internal Report NIST IR 8547 ipd Transition to Post-Quantum Cryptography Standards Initial Public Draft Dustin Moody Ray Perlner Andrew Regenscheid Angela Robinson David Cooper This publication is available free of charge from: https://doi.org/10.6028/NIST.IR.8547.ipd NIST Internal Report NIST IR 8547 ipd Transition to Post-Quantum Cryptography Standards Initial Public Draft Dustin Moody Ray Perlner Andrew Regenscheid Angela Robinson David Cooper Computer Security Division Information Technology Lab This publication is available free of charge from: https://doi.org/10.6028/NIST.IR.8547.ipd November 2024 U.S. Department of Commerce Gina M. Raimondo, Secretary National Institute of Standards and Technology Laurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology NIST IR 8547 ipd (Initial Public Draft) November 2024 Transition to Post-Quantum Cryptography Standards Certain equipment, instruments, software, or materials, commercial or non-commercial, are identified in this paper in order to specify the experimental procedure adequately. Such identification does not imply recommendation or endorsement of any product or service by NIST, nor does it imply that the materials or equipment identified are necessarily the best available for the purpose. There may be references in this publication to other publications currently under development by NIST in accordance with its assigned statutory responsibilities. The information in this publication, including concepts and methodologies, may be used by federal agencies even before the completion of such companion publications. Thus, until each publication is completed, current requirements, guidelines, and procedures, where they exist, remain operative. For planning and transition purposes, federal agencies may wish to closely follow the development of these new publications by NIST. Organizations are encouraged to review all draft publications during public comment periods and provide feedback to NIST. Many NIST cybersecurity publications, other than the ones noted above, are available at https://csrc.nist.gov/publications. NIST Technical Series Policies Copyright, Use, and Licensing Statements NIST Technical Series Publication Identifier Syntax Publication History Approved by the NIST Editorial Review Board on YYYY-MM-DD [Will be added to final publication.] How to Cite this NIST Technical Series Publication Moody D, Perlner R, Regenscheid A, Robinson A, Cooper D (2024) Transition to Post-Quantum Cryptography Standards. (National Institute of Standards and Technology, Gaithersburg, MD), NIST Internal Report (IR) NIST IR 8547 ipd. https://doi.org/10.6028/NIST.IR.8547.ipd Author ORCID iDs David Cooper: 0009-0001-2410-5830 Dustin Moody: 0000-0002-4868-6684 Ray Perlner: 0000-0001-8793-2238 Andrew Regenscheid: 0000-0002-3930-527X Angela Robinson: 0000-0002-1209-0379 Public Comment Period November 12, 2024 – January 10, 2025 Submit Comments National Institute of Standards and Technology Attn: Computer Security Division, Information Technology Laboratory 100 Bureau Drive (Mail Stop 8930) Gaithersburg, MD 20899-8930 Additional Information Additional information about this publication is available at https://csrc.nist.gov/pubs/ir/8547/ipd, including related content, potential updates, and document history. All comments are subject to release under the Freedom of Information Act (FOIA). NIST IR 8547 ipd (Initial Public Draft) November 2024 Transition to Post-Quantum Cryptography Standards 1 Abstract 2 3 4 5 6 7 This report describes NIST’s expected approach to transitioning from quantum-vulnerable cryptographic algorithms to post-quantum digital signature algorithms and key-establishment schemes. It identifies existing quantum-vulnerable cryptographic standards and the quantumresistant standards to which information technology products and services will need to transition. It is intended to foster engagement with industry, standards organizations, and relevant agencies to facilitate and accelerate the adoption of post-quantum cryptography. 8 Keywords 9 cryptography; post-quantum cryptography; public key cryptography; quantum computing. 10 Reports on Computer Systems Technology 11 12 13 14 15 16 17 18 The Information Technology Laboratory (ITL) at the National Institute of Standards and Technology (NIST) promotes the U.S. economy and public welfare by providing technical leadership for the Nation’s measurement and standards infrastructure. ITL develops tests, test methods, reference data, proof of concept implementations, and technical analyses to advance

---

_NIST Internal Report NIST IR 8547 ipd Transition to Post-Quantum Cryptography Standards Initial Public Draft Dustin Moody Ray Perlner Andrew Regenscheid Angela Robinson David Cooper This publication is available free of charge from: https://doi.org/10.6028/NIST.IR.8547.ipd NIST Internal Report NIST IR 8547 ipd Transition to Post-Quantum Cryptography Standards Initial Public Draft Dustin Moody Ray Perlner Andrew Regenscheid Angela Robinson David Cooper Computer Security Division Information Technology Lab This publication is available free of charge from: https://doi.org/10.6028/NIST.IR.8547.ipd November 2024 U.S. Department of Commerce_
