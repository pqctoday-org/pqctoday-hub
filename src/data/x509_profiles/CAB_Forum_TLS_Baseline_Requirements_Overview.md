# CA/Browser Forum TLS Baseline Requirements Overview

> **Official Documentation:** [CA/Browser Forum TLS BR v2.1.9 (Latest)](https://cabforum.org/working-groups/server/baseline-requirements/requirements/)
>
> **Document Repository:** [https://cabforum.org/working-groups/server/baseline-requirements/documents/](https://cabforum.org/working-groups/server/baseline-requirements/documents/)
>
> **GitHub Repository:** [https://github.com/cabforum/servercert](https://github.com/cabforum/servercert)

---

## Overview

The **Baseline Requirements for the Issuance and Management of Publicly-Trusted TLS Server Certificates** establish minimum standards that Certification Authorities (CAs) must follow when issuing TLS/SSL certificates trusted by browsers and operating systems.

---

## Certificate Types Covered

| Type                             | Description                                         |
| -------------------------------- | --------------------------------------------------- |
| **DV (Domain Validation)**       | Validates domain control only                       |
| **OV (Organization Validation)** | Validates domain + organization identity            |
| **EV (Extended Validation)**     | Highest validation level with verified legal entity |

---

## Key Technical Requirements

### Certificate Profile

- **Version:** X.509 v3
- **Serial Number:** Minimum 64 bits of entropy from a CSPRNG
- **Validity Period:** Maximum 398 days (reducing to 47 days by 2029 per SC-081v3)
- **Key Size Minimums:**
  - RSA: 2048 bits (3072+ recommended)
  - ECDSA: P-256, P-384, or P-521

### Required Extensions

| Extension               | Requirement                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `basicConstraints`      | CA:FALSE for subscriber certificates                         |
| `keyUsage`              | `digitalSignature`, optionally `keyEncipherment`             |
| `extKeyUsage`           | `id-kp-serverAuth` (required), `id-kp-clientAuth` (optional) |
| `subjectAltName`        | MUST contain all FQDNs; CN is deprecated for domain names    |
| `certificatePolicies`   | MUST include CA/B Forum Reserved Policy OID                  |
| `authorityInfoAccess`   | OCSP responder URL required                                  |
| `crlDistributionPoints` | CRL URL required                                             |

### CA/Browser Forum Policy OIDs

| OID              | Certificate Type            |
| ---------------- | --------------------------- |
| `2.23.140.1.2.1` | Domain Validated (DV)       |
| `2.23.140.1.2.2` | Organization Validated (OV) |
| `2.23.140.1.1`   | Extended Validation (EV)    |

---

## Domain Validation Methods (Section 3.2.2.4)

Approved methods include:

1. **Email to Domain Contact** – Validation via WHOIS/DNS admin contact
2. **HTTP Practical Demonstration** – File placed at `/.well-known/pki-validation/`
3. **DNS Change** – TXT or CNAME record with random value
4. **ACME Challenge** – Automated validation per RFC 8555
5. **Phone Confirmation** – Call to verified domain contact

**Note:** Wildcard certificates have restricted validation methods.

---

## Revocation Requirements

- **CRL:** CAs MUST publish CRLs; update at least every 7 days
- **OCSP:** MUST be available; responses valid for max 10 days
- **Revocation Timeline:**
  - Within 24 hours for key compromise
  - Within 5 days for other issues
- **Reason Codes:** Required for Subordinate CA certificate revocations

---

## CA Security Requirements

- HSM required for Root CA private keys
- Annual compliance audits (WebTrust or ETSI)
- Network security and segmentation
- Multi-person control for CA signing operations
- Incident response and vulnerability management

---

## Recent Key Changes (2024-2025)

| Ballot       | Change                                                  |
| ------------ | ------------------------------------------------------- |
| **SC-081v3** | Certificate lifespan reduction to 47 days by 2029       |
| **SC-085**   | DNSSEC validation required for CAA lookups (March 2026) |
| **SC-062**   | Major restructuring to RFC 3647 format (v2.0.0)         |

---

## Compliance & Auditing

Acceptable audit schemes:

- **WebTrust for CAs** – SSL Baseline with Network Security
- **ETSI EN 319 411-1** – Policy requirements for TSPs

---

## Related Standards

- **CA/B Forum EV Guidelines** – Extended Validation specific requirements
- **RFC 5280** – Internet X.509 PKI Certificate and CRL Profile
- **RFC 6960** – OCSP
- **RFC 8555** – ACME Protocol
- **ETSI EN 319 411-1/411-2** – European TSP policy requirements

---

_Document generated for reference purposes. Always consult the official CA/Browser Forum publications for authoritative and current guidance._
