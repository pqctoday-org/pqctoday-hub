---
reference_id: draft-ietf-lamps-pq-composite-kem-12
document_type: PKI/Certificate
document_status: Internet-Draft (In WG Last Call)
date_published: 2023-03-02
date_updated: 2026-01-08
region: International
migration_urgency: Medium
local_file: public/library/draft-ietf-lamps-pq-composite-kem-12.html
---

# Composite ML-KEM for Use in X.509 PKI and CMS

## Authors

**Organization:** IETF LAMPS

## Scope

**Industries:** Gov; Regulated industries; Finance
**Region:** International
**Document type:** PKI/Certificate

## How It Relates to PQC

Hybrid certificates and CMS

**Dependencies:** FIPS 203; RFC 8017; RFC 5280

## PQC Risk Profile

**Harvest Now, Decrypt Later:** **HIGH** — Encrypted data captured today can be decrypted by a future quantum computer (harvest-now-decrypt-later attack). Adopting this specification is critical to protect long-lived confidential data.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                       |
| ---------------------- | --------------------------- |
| Algorithm family       | RSA/ECDH + ML-KEM           |
| Security levels        | L1,L3,L5                    |
| Protocol / tool impact | Hybrid certificates and CMS |
| Toolchain support      | OpenSSL; BoringSSL          |

## Short Description

Composite (classical+PQC) KEM combining RSA-OAEP/ECDH/X25519/X448 with ML-KEM for X.509 and CMS. In WG Last Call. Expires July 2026.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Composite ML-KEM for use in X.509 Public Key Infrastructure draft-ietf-lamps-pq-composite-kem-12 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 04 05 06 07 08 09 10 11 12 Document Type Active Internet-Draft ( lamps WG ) Authors Mike Ounsworth , John Gray , Massimiliano Pala , Jan Klaußner , Scott Fluhrer Last updated 2026-01-07 Replaces draft-ounsworth-pq-composite-kem RFC stream Internet Engineering Task Force (IETF) Intended RFC status (None) Formats txt htmlized bibtex bibxml Additional resources GitHub Repository

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
