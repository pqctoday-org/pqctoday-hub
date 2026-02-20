---
reference_id: CA-B-Forum-Ballot-SMC013
document_type: Compliance/Policy
document_status: Adopted
date_published: 2025-07-02
date_updated: 2025-08-22
region: Global
migration_urgency: High
local_file: public/library/CA-B-Forum-Ballot-SMC013.html
---

# CA/Browser Forum Ballot SMC013 - Enable PQC Algorithms for S/MIME

## Authors

**Organization:** CA/Browser Forum

## Scope

**Industries:** Email Security; S/MIME; Certificate Authorities
**Region:** Global
**Document type:** Compliance/Policy

## How It Relates to PQC

S/MIME certificates with ML-DSA

**Dependencies:** FIPS 204; RFC 9881

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                           |
| ---------------------- | ------------------------------- |
| Algorithm family       | Lattice-based                   |
| Security levels        | L2,L3,L5                        |
| Protocol / tool impact | S/MIME certificates with ML-DSA |
| Toolchain support      | CAs; Email clients              |

## Short Description

Enables ML-DSA post-quantum digital signatures in S/MIME certificates. IPR Exclusion period completed with no notices filed. Adopted August 22 2025.

## Long Description

Home » All CA/Browser Forum Posts » Ballot SMC013: Enable PQC Algorithms for S/MIME Ballot SMC013: Enable PQC Algorithms for S/MIME The Intellectual Property Review (IPR) period for Ballot SMC013 (Enable PQC Algorithms for S/MIME) has completed. No IPR Exclusion Notices were filed, and the ballot is adopted as of August 22, 2025. The new S/MIME BR v.1.0.11 have been published to the CABF public website in accordance with the Bylaws: https://cabforum.org/uploads/CA-Browser-Forum-SMIMEBR-1.0.11.pdf IPR Review of Ballot SMC013: Enable PQC Algorithms for S/MIME This Review Notice is sent pursuant to Section 4.1 of the CA/Browser Forum’s Intellectual Property Rights Policy (v1.3). This Review Period of 30 days is for one Final Maintenance Guidelines. The complete Draft Maintenance Guideline that is the subject of this Review Notice is attached to this email, and may be found at: https://cabforum.org/uploads/CA-Browser-Forum-SMIMEBR-1.0.11-Redline.pdf Summary of Review Ballot for Review: SMC013: Enable PQC Algorithms for S/MIME Start of Review Period: 2025-07-21 20:00:00 UTC End of Review Period: 2025-08-20 20:00:00 UTC Members with any Essential Claim(s) to exclude must forward a written Notice to Exclude Essential Claims to the Working Group Chair (email to Stephen Davidson) and also submit a copy to the CA/B Forum public mailing list (email to public at cabforum.org) before the end of the Review Period. For details, please see the current version of the CA/Browser Forum Intellectual Property Rights Policy. (An optional template for submitting an Exclusion Notice is available at https://cabforum.org/wp-content/uploads/Template-for-Exclusion-Notice.pdf ) Results of Ballot SMC013: Enable PQC Algorithms for S/MIME The voting period for SMC013: Enable PQC Algorithms for S/MIME has completed. The ballot has: PASSED Voting Results Certificate Issuers 20 votes in total: 19 voting YES: Actalis S.p.A., Asseco Data Systems SA (Certum), Carillon Information Security Inc., DigiCert, Disig, D-TRUST, eMudhra, GlobalSign, HARICA, IdenTrust, Logius PKIoverheid, MSC Trustgate Sdn Bhd, OISTE Foundation, SECOM Trust Systems, Sectigo, SSL.com, SwissSign, TWCA, VikingCloud 0 voting NO: 1 ABSTAIN: Entrust Certificate Consumers 3 votes in total: 2 voting YES: Mozilla, rundQuadrat 1 voting NO: Microsoft 0 ABSTAIN: Bylaws Requirements Bylaw 2.3(6) requires: _ In order for a ballot to be adopted by the Forum, two‐thirds (2/3) or more of the votes cast by the Voting Members in the Certificate Issuer category must be in favour of the ballot. This requirement was MET. _ at least fifty percent (50%) plus one (1) of the votes cast by the Voting Members in the Certificate Consumer category must be in favour of the ballot. This requirement was MET. At least one (1) Voting Member in each category must vote in favour of a ballot for the ballot to be adopted. This requirement was MET. Bylaw 2.3(7) requires: A ballot result will be considered valid only when more than half of the number of currently active Voting Members has participated. The number of currently active Voting Members is the average number of Voting Member organizations that have participated in the previous three (3) Forum Meetings and Forum Teleconferences. the quorum was 10 for this ballot. This requirement was MET. This ballot now enters the IP Rights Review Period to permit members to review the ballot for relevant IP rights issues. This will be notified in a separate email. Ballot SMC013: Enable PQC Algorithms for S/MIME Summary: This ballot introduces specifications for the use of two post-quantum cryptography (PQC) algorithms, as standardized by the U.S. National Institute of Standards and Technology (NIST), in the S/MIME BR: ML-DSA, or Module-Lattice-Based Digital Signature Algorithm, a digital signature scheme; and ML-KEM, or Module-Lattice-Based Key-Encapsulation Mechanism, a key encapsulation mechanism. The ballot specifies single-key/non-hybrid PQC certificates that do not rely upon pre-quantum algorithms. The

---

_Home » All CA/Browser Forum Posts » Ballot SMC013: Enable PQC Algorithms for S/MIME Ballot SMC013: Enable PQC Algorithms for S/MIME The Intellectual Property Review (IPR) period for Ballot SMC013 (Enable PQC Algorithms for S/MIME) has completed. No IPR Exclusion Notices were filed, and the ballot is adopted as of August 22, 2025. The new S/MIME BR v.1.0.11 have been published to the CABF public website in accordance with the Bylaws: https://cabforum.org/uploads/CA-Browser-Forum-SMIMEBR-1.0.11.pdf IPR Review of Ballot SMC013: Enable PQC Algorithms_
