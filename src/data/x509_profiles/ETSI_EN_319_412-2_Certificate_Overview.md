# ETSI EN 319 412-2: Natural Person Certificate Requirements

> **Official Documentation:** [ETSI EN 319 412-2 V2.2.1 (Latest Published Version)](https://www.etsi.org/deliver/etsi_en/319400_319499/31941202/02.02.01_60/en_31941202v020201p.pdf)
>
> **ETSI Standards Portal:** [https://www.etsi.org/standards](https://www.etsi.org/standards)

---

## Overview

ETSI EN 319 412-2 specifies requirements for **Natural Person Certificates** within the European trust services framework under eIDAS regulation.

---

## Certificate Profiles Defined

| Profile        | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| **NCP**        | Normalized Certificate Policy – Standard assurance level                  |
| **NCP+**       | Certificates where private key resides in a QSCD                          |
| **QCP-n**      | Qualified certificates for natural persons (electronic signatures)        |
| **QCP-n-qscd** | Qualified certificates with keys on a Qualified Signature Creation Device |

---

## Key Technical Requirements

### Subject Field (Mandatory)

- `commonName` (CN) – Natural person's name
- `countryName` (C) – Country of the CA or subject
- `serialNumber` – Unique identifier when names aren't unique (often national ID)

### Certificate Extensions

- `keyUsage` – Typically `nonRepudiation` (contentCommitment) for qualified signatures
- `certificatePolicies` – Must reference applicable OID from EN 319 411-1/411-2
- `qcStatements` – Critical for qualified certificates, indicating QC compliance and QSCD usage

### QC Statements OIDs (per EN 319 412-5)

| OID                        | Purpose                            |
| -------------------------- | ---------------------------------- |
| `id-etsi-qcs-QcCompliance` | Indicates a qualified certificate  |
| `id-etsi-qcs-QcSSCD`       | Indicates private key is on a QSCD |

---

## Practical Recommendations

For enterprise deployments requiring legal validity under eIDAS:

1. Use **QCP-n-qscd** profile for qualified electronic signatures with highest legal standing
2. Ensure your TSP (Trust Service Provider) is listed on the **EU Trusted List**
3. Implement certificate lifecycle management aligned with **EN 319 411-1/411-2**

---

## Related Standards

- **EN 319 411-1/411-2** – Policy and security requirements for TSPs
- **EN 319 412-5** – QC Statements and certificate extensions
- **eIDAS Regulation (EU) 910/2014** – Legal framework for electronic identification and trust services

---

_Document generated for reference purposes. Always consult the official ETSI publications for authoritative guidance._
