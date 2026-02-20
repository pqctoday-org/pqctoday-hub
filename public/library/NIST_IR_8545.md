---
reference_id: NIST IR 8545
document_type: Research/Report
document_status: Final
date_published: 2025-03-11
date_updated: 2025-03-11
region: USA; Global
migration_urgency: Medium
local_file: public/library/NIST_IR_8545.pdf
preview: NIST IR 8545.png
---

# Status Report on the Fourth Round of the NIST PQC Standardization Process

## Authors

**Organization:** NIST

## Scope

**Industries:** IT; Cryptography Research
**Region:** USA; Global
**Document type:** Research/Report

## How It Relates to PQC

Future FIPS standard (HQC)

**Dependencies:** FIPS 203; HQC

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                      |
| ---------------------- | -------------------------- |
| Algorithm family       | Code-based                 |
| Security levels        | L1,L3,L5                   |
| Protocol / tool impact | Future FIPS standard (HQC) |
| Toolchain support      | Reference                  |

## Short Description

Documents HQC selection as fourth PQC standard providing code-based cryptographic diversity.

## Long Description

NIST Internal Report NIST IR 8545 Status Report on the Fourth Round of the NIST Post-Quantum Cryptography Standardization Process Gorjan Alagic Maxime Bros Pierre Ciadoux David Cooper Quynh Dang Thinh Dang John Kelsey Jacob Lichtinger Yi-Kai Liu Carl Miller Dustin Moody Rene Peralta Ray Perlner Angela Robinson Hamilton Silberg Daniel Smith-Tone Noah Waller This publication is available free of charge from: https://doi.org/10.6028/NIST.IR.8545 NIST Internal Report NIST IR 8545 Status Report on the Fourth Round of the NIST Post-Quantum Cryptography Standardization Process Gorjan Alagic Maxime Bros Pierre Ciadoux David Cooper Quynh Dang Thinh Dang John Kelsey Jacob Lichtinger Carl Miller Dustin Moody Rene Peralta Ray Perlner Angela Robinson Hamilton Silberg Daniel Smith-Tone Noah Waller Computer Security Division Information Technology Laboratory Yi-Kai Liu Applied and Computational Mathematics Division Information Technology Laboratory This publication is available free of charge from: https://doi.org/10.6028/NIST.IR.8545 March 2025 U.S. Department of Commerce Howard Lutnick, Secretary National Institute of Standards and Technology Craig Burkhardt, Acting Under Secretary of Commerce for Standards and Technology and Acting NIST Director Certain equipment, instruments, software, or materials, commercial or non-commercial, are identified in this paper in order to specify the experimental procedure adequately. Such identification does not imply recommendation or endorsement of any product or service by NIST, nor does it imply that the materials or equipment identified are necessarily the best available for the purpose. There may be references in this publication to other publications currently under development by NIST in accordance with its assigned statutory responsibilities. The information in this publication, including concepts and methodologies, may be used by federal agencies even before the completion of such companion publications. Thus, until each publication is completed, current requirements, guidelines, and procedures, where they exist, remain operative. For planning and transition purposes, federal agencies may wish to closely follow the development of these new publications by NIST. Organizations are encouraged to review all draft publications during public comment periods and provide feedback to NIST. Many NIST cybersecurity publications, other than the ones noted above, are available at https://csrc.nist.gov/publications. NIST Technical Series Policies Copyright, Use, and Licensing Statements NIST Technical Series Publication Identifier Syntax Publication History Approved by the NIST Editorial Review Board on 2025-03-05 How to cite this NIST Technical Series Publication: Alagic G, Bros M, Ciadoux P, Cooper D, Dang Q, Dang T, Kelsey J, Lichtinger J, Liu YK, Miller C, Moody D, Peralta R, Perlner R, Robinson A, Silberg H, Smith-Tone D, Waller N (2025) Status Report on the Fourth Round of the NIST Post-Quantum Cryptography Standardization Process. (National Institute of Standards and Technology, Gaithersburg, MD), NIST Internal Report (IR) NIST IR 8545. https://doi.org/10.6028/NIST.IR.8545 Author ORCID iDs Gorjan Alagic: 0000-0002-0107-6037 Maxime Bros: 0000-0001-7838-2529 Pierre Ciadoux: 0009-0001-2272-681X David Cooper: 0009-0001-2410-5830 Quynh Dang: 0009-0005-9801-6805 Thinh Dang: 0000-0001-9705-0925 John Kelsey: 0000-0002-3427-1744 Jacob Lichtinger: 0000-0003-2407-5309 Yi-Kai Liu: 0000-0001-7458-4721 Carl Miller: 0000-0003-1917-1531 Dustin Moody: 0000-0002-4868-6684 Rene Peralta: 0000-0002-2318-7563 Ray Perlner: 0000-0001-8793-2238 Angela Robinson: 0000-0002-1209-0379 Hamilton Silberg: 0009-0004-4178-8954 Daniel Smith-Tone: 0000-0002-7995-8734 Noah Waller: 0000-0002-6979-9725 Contact Information Additional Information Additional information about this publication is available at https://csrc.nist.gov/pubs/ir/8545/final, including related content, potential updates, and document history. All comments are subject to release under the Freedom of Information Act (FOIA). NIST IR 8545 March 2025 Fourth Round Status Report Abstract NIST is selecting public-key cryptographic algorithms through a public, competition-like process to specify additional digital signature, public-key encryption, and key-establishment algorithms to supplement FIPS 186-5, SP 800-56Ar3, and SP 800-56Br2. These algorithms are intended to protect sensitive information well into the foreseeable future, including after the advent of quantum computers. In the fourth round of the Post-Quantum Cryptography Standardization Process, NIST selected four candidate algorithms for key establishment to

---

_NIST Internal Report NIST IR 8545 Status Report on the Fourth Round of the NIST Post-Quantum Cryptography Standardization Process Gorjan Alagic Maxime Bros Pierre Ciadoux David Cooper Quynh Dang Thinh Dang John Kelsey Jacob Lichtinger Yi-Kai Liu Carl Miller Dustin Moody Rene Peralta Ray Perlner Angela Robinson Hamilton Silberg Daniel Smith-Tone Noah Waller This publication is available free of charge from: https://doi.org/10.6028/NIST.IR.8545 NIST Internal Report NIST IR 8545 Status Report on the Fourth Round of the NIST Post-Quantum Cryptography Standardization_
