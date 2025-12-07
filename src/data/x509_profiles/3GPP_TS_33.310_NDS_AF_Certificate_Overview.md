# 3GPP TS 33.310: Network Domain Security – Authentication Framework (NDS/AF)

> **Official Documentation:** [3GPP TS 33.310 (Latest Version - V19.4.0)](https://www.3gpp.org/DynaReport/33310.htm)
>
> **ETSI Publication:** [ETSI TS 133 310](https://www.etsi.org/deliver/etsi_ts/133300_133399/133310/)
>
> **Technical Content:** [Tech-Invite TS 33.310](https://www.tech-invite.com/3m33/tinv-3gpp-33-310.html)

---

## Overview

3GPP TS 33.310 specifies a **scalable entity authentication framework** for 3GPP network nodes using X.509 certificates. It defines certificate profiles, trust models, and protocols for securing inter-operator and intra-operator communications via IPsec (NDS/IP) and TLS.

---

## Scope

| Domain                     | Description                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| **NDS/IP**                 | IPsec-based security for Za (inter-SEG) and Zb (intra-domain) interfaces   |
| **TLS**                    | TLS-based authentication for inter-operator communications (IMS, GBA, SBA) |
| **Base Station Enrolment** | Certificate provisioning for eNodeB/gNodeB via CMPv2                       |
| **5GC SBA**                | Service Based Architecture certificates for NFs, SCP, SEPP                 |

---

## Certificate Profiles Defined

### End Entity Certificates

| Profile                      | Use Case                                             |
| ---------------------------- | ---------------------------------------------------- |
| **SEG Certificate**          | Security Gateway authentication (IPsec Za interface) |
| **NE Certificate**           | Network Element authentication (Zb interface)        |
| **TLS Client Certificate**   | TLS client authentication                            |
| **TLS Server Certificate**   | TLS server authentication                            |
| **Base Station Certificate** | eNodeB/gNodeB backhaul security                      |

### 5GC SBA Certificates (Release 15+)

| Profile               | Use Case                                          |
| --------------------- | ------------------------------------------------- |
| **NF Certificate**    | Network Function producer/consumer authentication |
| **SCP Certificate**   | Service Communication Proxy                       |
| **SEPP Intra-domain** | Security Edge Protection Proxy (within PLMN)      |
| **SEPP Inter-domain** | SEPP for inter-PLMN/inter-SNPN roaming            |

### CA Certificates

| Profile                | Use Case                                              |
| ---------------------- | ----------------------------------------------------- |
| **Interconnection CA** | Issues cross-certificates to other operators' SEG CAs |
| **SEG CA**             | Issues certificates to SEGs within operator domain    |
| **TLS CA**             | Issues certificates to TLS entities                   |
| **NE CA**              | Issues certificates to Network Elements               |

---

## Key Technical Requirements

### Common Certificate Rules (Clause 6.1.1)

- **Version:** X.509 v3
- **Compliance:** RFC 5280 with 3GPP-specific amendments (3GPP overrides RFC 5280 on conflicts)
- **Serial Number:** Unique within CA
- **Signature Algorithm:**
  - RSA (2048-bit minimum) or ECDSA (P-256 recommended for 5GC SBA)
  - SHA-256 or stronger hash algorithms

### SEG Certificate Profile (Clause 6.1.3)

| Field/Extension         | Requirement                                      |
| ----------------------- | ------------------------------------------------ |
| `subject`               | Distinguished Name identifying the SEG           |
| `issuer`                | SEG CA subject name                              |
| `keyUsage`              | `digitalSignature`, `keyEncipherment` (critical) |
| `extKeyUsage`           | `id-kp-ipsecIKE` (OID 1.3.6.1.5.5.7.3.17)        |
| `subjectAltName`        | IP address or FQDN of the SEG                    |
| `crlDistributionPoints` | Mandatory – points to operator's CRL             |

### TLS Entity Certificate Profile (Clause 6.1.3a)

| Field/Extension  | Requirement                                  |
| ---------------- | -------------------------------------------- |
| `keyUsage`       | `digitalSignature` (critical)                |
| `extKeyUsage`    | `id-kp-serverAuth` and/or `id-kp-clientAuth` |
| `subjectAltName` | DNS name (mandatory for TLS per RFC 6125)    |

### 5GC SBA Certificate Profile (Clause 6.1.3c)

| Field/Extension  | Requirement                                                |
| ---------------- | ---------------------------------------------------------- |
| `subjectAltName` | FQDN in format: `<nf-type>.<mnc>.mcc<MCC>.3gppnetwork.org` |
| `signature`      | ECDSA recommended (RSA optional)                           |
| `extKeyUsage`    | `id-kp-serverAuth`, `id-kp-clientAuth`                     |

**SEPP Inter-PLMN FQDN Format:**

```
sepp<SEPP-id>.5gc.mnc<MNC>.mcc<MCC>.3gppnetwork.org
```

### CA Certificate Profile (Clause 6.1.4)

| Field/Extension         | Requirement                                              |
| ----------------------- | -------------------------------------------------------- |
| `basicConstraints`      | `CA:TRUE`, `pathLenConstraint` as appropriate (critical) |
| `keyUsage`              | `keyCertSign`, `cRLSign` (critical)                      |
| `crlDistributionPoints` | Mandatory for cross-certification                        |

---

## Trust Models

| Model                  | Description                                     |
| ---------------------- | ----------------------------------------------- |
| **Simple Trust Model** | Direct cross-certification between operator CAs |
| **Bridge CA Model**    | Centralized Bridge CA for multi-operator trust  |
| **Hierarchical**       | Root CA → Intermediate CA → End Entity          |

---

## Certificate Lifecycle Management

### Supported Protocols

| Protocol             | Use Case                                          |
| -------------------- | ------------------------------------------------- |
| **CMPv2 (RFC 4210)** | Preferred for SEG, NE, and base station enrolment |
| **PKCS#10**          | Manual certificate requests (fallback)            |
| **ACME**             | 5GC NF certificate management (Release 19+)       |

### Revocation

- **CRL:** Mandatory; accessed via LDAP or HTTP
- **OCSP:** Optional; accessed via HTTP
- CRL/OCSP must be accessible to interconnecting operators

---

## Key Interfaces

| Interface | Description                       | Security                            |
| --------- | --------------------------------- | ----------------------------------- |
| **Za**    | Between SEGs (inter-operator)     | IPsec with IKEv2 (mandatory)        |
| **Zb**    | Between NE and SEG (intra-domain) | IPsec (optional)                    |
| **N32**   | Between SEPPs (5GC roaming)       | TLS 1.2+ with mutual authentication |

---

## Recent Updates (Release 18/19)

| Feature             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| **Annex I**         | Guidance for 5GC certificate management procedures      |
| **Annex J**         | ACME-based certificate management for 5GC NFs           |
| **SEPP Inter-SNPN** | Certificate profiles for Standalone Non-Public Networks |

---

## Related Specifications

| Specification | Description                                 |
| ------------- | ------------------------------------------- |
| **TS 33.210** | NDS/IP – IP network layer security          |
| **TS 33.501** | 5G System security architecture             |
| **TS 33.203** | Access security for IP-based services (IMS) |
| **TS 33.220** | Generic Bootstrapping Architecture (GBA)    |
| **TS 23.003** | Numbering, addressing, and identification   |
| **RFC 5280**  | X.509 PKI Certificate and CRL Profile       |
| **RFC 4210**  | CMPv2 – Certificate Management Protocol     |

---

## Implementation Considerations

1. **Cross-Certification:** Essential for inter-operator IPsec/TLS connectivity
2. **Repository Access:** SEGs use LDAP; TLS entities may use HTTP
3. **5GC SBA:** ECDSA preferred over RSA for performance
4. **Base Station Enrolment:** Vendor certificate → Operator certificate swap via CMPv2
5. **FQDN Naming:** Follow 3GPP naming conventions for SBA certificates

---

_Document generated for reference purposes. Always consult the official 3GPP/ETSI publications for authoritative and current guidance._
