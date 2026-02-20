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

## Author & Organization

**Organization:** IETF LAMPS

## Scope

**Industries:** Gov; Regulated industries; Finance
**Region:** International
**Document type:** PKI/Certificate

## How It Relates to PQC

Hybrid certificates and CMS

**Dependencies:** FIPS 203; RFC 8017; RFC 5280

## Risks Addressed

**Migration urgency:** Medium
**Security levels:** L1,L3,L5

## PQC Key Types & Mechanisms

| Field                  | Value                       |
| ---------------------- | --------------------------- |
| Algorithm family       | RSA/ECDH + ML-KEM           |
| Security levels        | L1,L3,L5                    |
| Protocol / tool impact | Hybrid certificates and CMS |
| Toolchain support      | OpenSSL; BoringSSL          |

## Description

Composite (classical+PQC) KEM combining RSA-OAEP/ECDH/X25519/X448 with ML-KEM for X.509 and CMS. In WG Last Call. Expires July 2026.

---

_Skip to main content Datatracker Groups By area/parent Apps & Realtime General Internet Ops & Management Routing Security Web and Internet Transport IESG IAB IRTF IETF LLC RFC Editor Other Active AGs Active Areas Active Directorates Active IAB Workshops Active Programs Active RAGs Active Teams New work Chartering groups BOFs BOF Requests Other groups Concluded groups Non-WG lists_
