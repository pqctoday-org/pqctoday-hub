---
reference_id: draft-ietf-lamps-pq-composite-sigs-14
document_type: PKI/Certificate
document_status: Internet-Draft (In IETF Last Call)
date_published: 2023-03-02
date_updated: 2026-01-07
region: International
migration_urgency: Medium
local_file: public/library/draft-ietf-lamps-pq-composite-sigs-14.html
---

# Composite ML-DSA for Use in X.509 PKI and CMS

## Authors

**Organization:** IETF LAMPS

## Scope

**Industries:** Gov; Regulated industries; Finance
**Region:** International
**Document type:** PKI/Certificate

## How It Relates to PQC

Hybrid certificate signatures

**Dependencies:** FIPS 204; FIPS 186-5; RFC 5280

## PQC Risk Profile

**Harvest Now, Decrypt Later:** Not directly addressed by this document.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** **HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to quantum forgery. Code signing, firmware integrity, and legally binding digital signatures depend on adopting post-quantum signature schemes.

**Migration urgency:** Medium

## PQC Key Types & Mechanisms

| Field                  | Value                         |
| ---------------------- | ----------------------------- |
| Algorithm family       | RSA/ECDSA + ML-DSA            |
| Security levels        | L2,L3,L5                      |
| Protocol / tool impact | Hybrid certificate signatures |
| Toolchain support      | OpenSSL; BoringSSL            |

## Short Description

Composite signatures combining RSA/ECDSA/Ed25519 with ML-DSA for hybrid PKI. In IETF Last Call with SECDIR and GENART reviews. Expires July 2026.

## Long Description

Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan Registration Important dates Request a session Session requests Upcoming meetings Upcoming meetings Past meetings Past meetings Meeting proceedings Other IPR disclosures Liaison statements IESG agenda NomComs Downref registry Statistics I-Ds/RFCs Meetings API Help Release notes System status Report a bug User Sign in Password reset Preferences New account List subscriptions IETF Lists IRTF Lists IAB Lists RFC-Editor Lists Report a bug Sign in Composite ML-DSA for use in X.509 Public Key Infrastructure draft-ietf-lamps-pq-composite-sigs-14 Status IESG evaluation record IESG writeups Email expansions History Versions: 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 Document Type Active Internet-Draft ( lamps WG ) Authors Mike Ounsworth , John Gray , Massimiliano Pala , Jan Klaußner , Scott Fluhrer Last updated 2026-02-16 (Latest revision 2026-01-07) Replaces draft-ounsworth-pq-composite-sigs RFC stream Internet Engineering Task Force (IETF) Intended RFC status Proposed Standard Formats txt htmlized bibtex bibxml Reviews SECDIR IE

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists Documents Search Recent I-Ds Submit an Internet-Draft RFC streams IAB IRTF ISE Editorial Subseries STD BCP FYI Meetings Agenda Materials Floor plan_
