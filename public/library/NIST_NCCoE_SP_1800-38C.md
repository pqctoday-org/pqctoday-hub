---
reference_id: NIST NCCoE SP 1800-38C
document_type: Guidance
document_status: Preliminary Draft Practice Guide
date_published: 2023-12-01
date_updated: 2023-12-01
region: USA
migration_urgency: High
local_file: public/library/NIST_NCCoE_SP_1800-38C.pdf
preview: NIST NCCoE SP 1800-38C.png
---

# Migration to Post-Quantum Cryptography (Preliminary Draft)

## Authors

**Organization:** NIST NCCoE

## Scope

**Industries:** Enterprise IT; Gov; Finance
**Region:** USA
**Document type:** Guidance

## How It Relates to PQC

Enterprise migration planning

**Dependencies:** FIPS 203/204/205

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                         |
| ---------------------- | ----------------------------- |
| Algorithm family       | N/A                           |
| Security levels        | N/A                           |
| Protocol / tool impact | Enterprise migration planning |
| Toolchain support      | Reference implementations     |

## Short Description

Practical guidance for enterprise PQC migration with use cases and reference architectures.

## Long Description

NIST SPECIAL PUBLICATION 1800-38C Migration to Post-Quantum Cryptography Quantum Readiness: Testing Draft Standards Volume C: Quantum-Resistant Cryptography Technology Interoperability and Performance Report William Newhouse Murugiah Souppaya National Institute of Standards and Technology Rockville, Maryland William Barker Dakota Consulting Silver Spring, Maryland Chris Brown The MITRE Corporation Mclean, Virginia Panos Kampanakis Amazon Web Services, Inc. (AWS) Arlington, Virginia Jim Goodman Crypto4A Technologies, Inc. Ontario, Canada Julien Prat Robin Larrieu CryptoNext Security Paris, France John Gray Mike Ounsworth Cleandro Viana Entrust Minneapolis, Minnesota Hubert Le Van Gong JPMorgan Chase Bank, N.A. Jersey City, New Jersey Kris Kwiatkowski PQShield Oxford, United Kingdom Anthony Hu wolfSSL Seattle, Washington Robert Burns Thales DIS CPL USA, Inc. Austin, Texas Christian Paquin Microsoft Redmond, Washington Jane Gilbert Gina Scinta Thales Trusted Cyber Technologies Abingdon, MD Eunkyung Kim Samsung SDS Co., Ltd. Seoul, Republic of South Korea Volker Krummel Utimaco Nordrhein-Westfalen, Germany December 2023 PRELIMINARY DRAFT This publication is available free of charge from https://www.nccoe.nist.gov/crypto-agility-considerations-migrating-post-quantum-cryptographic-algorithms PRELIMINARY DRAFT 1 DISCLAIMER 2 3 4 5 6 7 Certain commercial entities, equipment, products, or materials may be identified by name or company logo or other insignia in order to acknowledge their participation in this collaboration or to describe an experimental procedure or concept adequately. Such identification is not intended to imply special status or relationship with NIST or recommendation or endorsement by NIST or NCCoE; neither is it intended to imply that the entities, equipment, products, or materials are necessarily the best available for the purpose. 8 9 10 11 12 While NIST and the NCCoE address goals of improving management of cybersecurity and privacy risk through outreach and application of standards and best practices, it is the stakeholder’s responsibility to fully perform a risk assessment to include the current threat, vulnerabilities, likelihood of a compromise, and the impact should the threat be realized before adopting cybersecurity measures such as this recommendation. 13 14 15 National Institute of Standards and Technology Special Publication 1800-38C Natl. Inst. Stand. Technol. Spec. Publ. 1800-38C, 100 pages, (December 2023), CODEN: NSPUE2 16 FEEDBACK 17 You can improve this initial public draft by submitting comments. 18 19 20 21 This initial draft offers: (1) identification of compatibility issues between quantum-ready algorithms; (2) resolution of compatibility issues in a controlled, non-production environment; and (3) reduction of time spent by individual organizations performing similar interoperability testing for their own PQC migration efforts. 22 23 24 25 You can improve this initial public draft by submitting comments. We are always seeking feedback on our publications and how they support our readers’ needs. We are particularly interested in learning from readers if this initial draft is helpful to you and what you want to see covered in future versions of this publication. 26 Comments on this publication may be submitted to: 27 Public comment period: December 19, 2023 through February 20, 2024 28 All comments are subject to release under the Freedom of Information Act. 29 30 31 32 33 34 National Cybersecurity Center of Excellence National Institute of Standards and Technology 100 Bureau Drive Mailstop 2002 Gaithersburg, MD 20899 Email: NIST SP 1800-38C: Migration to Post-Quantum Cryptography ii PRELIMINARY DRAFT 35 NATIONAL CYBERSECURITY CENTER OF EXCELLENCE 36 37 38 39 40 41 42 43 44 45 46 47 48 The National Cybersecurity Center of Excellence (NCCoE), a part of the National Institute of Standards and Technology (NIST), is a collaborative hub where industry organizations, government agencies, and academic institutions work together to address businesses’ most pressing cybersecurity issues. This public-private partnership enables the creation of practical cybersecurity solutions for specific industries, as well as for broad, cross-sector technology challenges.

---

_NIST SPECIAL PUBLICATION 1800-38C Migration to Post-Quantum Cryptography Quantum Readiness: Testing Draft Standards Volume C: Quantum-Resistant Cryptography Technology Interoperability and Performance Report William Newhouse Murugiah Souppaya National Institute of Standards and Technology Rockville, Maryland William Barker Dakota Consulting Silver Spring, Maryland Chris Brown The MITRE Corporation Mclean, Virginia Panos Kampanakis Amazon Web Services, Inc. (AWS) Arlington, Virginia Jim Goodman Crypto4A Technologies, Inc. Ontario, Canada Julien Prat Robin Larrieu CryptoNext Security Paris, France John Gray Mike Ounsworth Cleandro Viana Entrust Minneapolis,_
