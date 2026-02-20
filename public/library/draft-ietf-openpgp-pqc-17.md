---
reference_id: draft-ietf-openpgp-pqc-17
document_type: Protocol
document_status: Internet-Draft (Submitted to IESG)
date_published: 2023-07-01
date_updated: 2026-01-13
region: International
migration_urgency: Medium
local_file: public/library/draft-ietf-openpgp-pqc-17.html
---

# Post-Quantum Cryptography in OpenPGP

## Authors

**Organization:** IETF OpenPGP WG

## Scope

**Industries:** Email; File Encryption; Code Signing
**Region:** International
**Document type:** Protocol

## How It Relates to PQC

OpenPGP/GPG with PQC

**Dependencies:** FIPS 203; FIPS 204; FIPS 205; RFC 9580

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** Not directly addressed by this document.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| Algorithm family       | Lattice+ECDH/EdDSA; Hash-based                          |
| Security levels        | L3,L5                                                   |
| Protocol / tool impact | OpenPGP/GPG with PQC                                    |
| Toolchain support      | GnuPG; OpenPGP.js; GopenPGP; Thunderbird (experimental) |

## Short Description

PQC for OpenPGP: composite ML-KEM+ECC encryption composite ML-DSA+ECC signatures and standalone SLH-DSA. Submitted to IESG for publication as Proposed Standard. Expires July 2026.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Post-Quantum Cryptography in OpenPGP draft-ietf-openpgp-pqc-17 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 Document Type Active Internet-Draft ( openpgp WG ) Authors Stavros Kousidis , Johannes Roth , Falko Strenzke , Aron Wussler Last updated 2026-01-13 Replaces draft-wussler-openpgp-pqc RFC stream Internet Engineering Task Force (IETF) Intended RFC status Proposed Standard Formats txt html xml htmlized

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
