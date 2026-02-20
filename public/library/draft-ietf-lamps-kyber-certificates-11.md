---
reference_id: draft-ietf-lamps-kyber-certificates-11
document_type: PKI/Certificate
document_status: Internet-Draft
date_published: 2022-06-03
date_updated: 2025-07-22
region: International
migration_urgency: High
local_file: public/library/draft-ietf-lamps-kyber-certificates-11.html
---

# Algorithm Identifiers for ML-KEM in X.509 PKI

## Authors

**Organization:** IETF LAMPS

## Scope

**Industries:** Web PKI; IoT; Enterprise
**Region:** International
**Document type:** PKI/Certificate

## How It Relates to PQC

Certificates with ML-KEM keys

**Dependencies:** FIPS 203; RFC 5280

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                         |
| ---------------------- | ----------------------------- |
| Algorithm family       | Lattice-based                 |
| Security levels        | L1,L3,L5                      |
| Protocol / tool impact | Certificates with ML-KEM keys |
| Toolchain support      | OpenSSL provider; PKI CAs     |

## Short Description

Defines X.509 OIDs and structures for ML-KEM public keys in certificates.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Internet X.509 Public Key Infrastructure - Algorithm Identifiers for the Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM) draft-ietf-lamps-kyber-certificates-11 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 04 05 06 07 08 09 10 11 Document Type Active Internet-Draft ( lamps WG ) Authors Sean Turner , Panos Kampanakis , Jake Massimo , Bas Westerbaan Last updated 2026-02-09 (Latest revision 2025-07-22) RFC stream Internet Engineering Task Force (IETF) Intended RFC status Proposed Standard Formats txt htmlized bibtex bibxml Reviews GENART IETF Last Call review (of -10) by Mallory Knodel Ready w/nits Additional resources Mailing list discussion

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
