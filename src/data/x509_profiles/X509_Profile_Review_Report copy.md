# X.509 Certificate Profile Review Report

**Date:** December 3, 2025  
**Standards Validated:** CA/B Forum TLS BR 2.1.x, ETSI EN 319 412-2, 3GPP TS 33.310, RFC 9310  
**OpenSSL Target:** v3.5.4  

---

## Executive Summary

I reviewed 11 X.509 certificate and CSR profile CSV files against their respective standards and OpenSSL 3.5.4 compatibility. **Multiple issues were identified and corrected.**

| Status | Count |
|--------|-------|
| ✅ Profiles with no issues | 6 |
| 🔧 Profiles corrected | 5 |
| **Total files** | **11** |

---

## Issues Found and Corrections Made

### 1. Cert-GeneralIT_CABF_TLSBR_2025.csv

**Issue:** Missing mandatory extensions for CA/B Forum TLS Baseline Requirements

| Missing Extension | OID | Requirement |
|------------------|-----|-------------|
| extendedKeyUsage | 2.5.29.37 | **MUST** include `serverAuth` for TLS server certificates |
| subjectKeyIdentifier | 2.5.29.14 | **SHOULD** be included per RFC 5280 |
| certificatePolicies | 2.5.29.32 | **MUST** include at least one policy OID per TLS BR |
| authorityKeyIdentifier | 2.5.29.35 | **MUST** be included for non-self-signed certificates |

**Correction:** Added all four missing extensions with proper OIDs and validation rules.

---

### 2. Cert-Telecom_3GPP_TS33310_2025.csv

**Issue:** Incorrect OID for `nftypes` extension

| Field | Before (Incorrect) | After (Correct) |
|-------|-------------------|-----------------|
| OID | 1.3.6.1.5.5.7.1.26 | 1.3.6.1.5.5.7.1.34 |
| Standard | Draft/Pre-RFC | **RFC 9310** (January 2023) |

**Correction:** Updated to RFC 9310 standardized OID `1.3.6.1.5.5.7.1.34` (id-pe-nftype).

---

### 3. Cert-Financial_ETSI_EN319412-2_2025.csv

**Issues:** Multiple OpenSSL 3.5.4 compatibility problems

| Issue | Before (Incorrect) | After (Correct) |
|-------|-------------------|-----------------|
| basicConstraints | Critical=TRUE for EE | Critical=FALSE |
| keyUsage | contentCommitment | nonRepudiation |
| qcStatements example | id-etsi-qcs-QcCompliance | ASN1:SEQUENCE:qcs |
| Missing extensions | - | SKI, AKI, AIA, CDP added |
| Algorithm examples | - | OpenSSL command syntax |

**Corrections:**
- `basicConstraints` set to non-critical for end-entity certs
- `keyUsage` uses `nonRepudiation` (OpenSSL doesn't recognize `contentCommitment`)
- `qcStatements` example shows proper ASN.1 sequence syntax for OpenSSL config
- Added missing RFC 5280 required extensions
- All example values now show OpenSSL-compatible syntax

---

### 4. Cert-RootCA-Financial_ETSI_EN319412-2_2025.csv

**Issue:** Algorithm parameters and missing OpenSSL syntax hints

**Corrections:**
- Added explicit OpenSSL command syntax in examples
- Proper algorithm parameter specifications (NULL vs absent)
- Added ML-DSA-87 option for highest security level

---

### 5. CSR-Financial_ETSI_EN319412-2_2025.csv

**Issue:** keyUsage used incorrect terminology

| Issue | Before | After |
|-------|--------|-------|
| keyUsage | contentCommitment | nonRepudiation |

**Correction:** Changed to OpenSSL-compatible `nonRepudiation` keyword.

---

## PQC Algorithm OID Verification

All Post-Quantum Cryptography OIDs are correct per NIST FIPS 203/204/205:

### ML-DSA (FIPS 204) - Digital Signatures

| Algorithm | OID | Security Level | Status |
|-----------|-----|----------------|--------|
| ML-DSA-44 | 2.16.840.1.101.3.4.3.17 | Level 2 (128-bit) | ✅ Correct |
| ML-DSA-65 | 2.16.840.1.101.3.4.3.18 | Level 3 (192-bit) | ✅ Correct |
| ML-DSA-87 | 2.16.840.1.101.3.4.3.19 | Level 5 (256-bit) | ✅ Correct |

### ML-KEM (FIPS 203) - Key Encapsulation

| Algorithm | OID | Security Level | Status |
|-----------|-----|----------------|--------|
| ML-KEM-512 | 2.16.840.1.101.3.4.4.1 | Level 1 | ✅ Correct |
| ML-KEM-768 | 2.16.840.1.101.3.4.4.2 | Level 3 | ✅ Correct |
| ML-KEM-1024 | 2.16.840.1.101.3.4.4.3 | Level 5 | ✅ Correct |

---

## OpenSSL 3.5.4 Compatibility

All profiles are fully compatible with OpenSSL 3.5.4:

| Feature | Support Status |
|---------|---------------|
| ML-DSA (FIPS 204) | ✅ Native support since v3.5.0 |
| ML-KEM (FIPS 203) | ✅ Native support since v3.5.0 |
| SLH-DSA (FIPS 205) | ✅ Native support since v3.5.0 |
| Classical algorithms (ECDSA, RSA) | ✅ Full support |
| All X.509 extension OIDs | ✅ Full support |
| RFC 9310 NFTypes extension | ✅ Supported via custom extension |

**OpenSSL 3.5 Command Examples:**

```bash
# Generate ML-DSA-65 key
openssl genpkey -algorithm ML-DSA-65 -out ml-dsa-65.key

# Generate ML-KEM-768 key
openssl genpkey -algorithm ML-KEM-768 -out ml-kem-768.key

# List available signature algorithms
openssl list -signature-algorithms

# List available KEM algorithms  
openssl list -kem-algorithms
```

---

## Profile Summary by Standard

### CA/B Forum TLS Baseline Requirements (General IT)

| File | Scope | Status |
|------|-------|--------|
| Cert-GeneralIT_CABF_TLSBR_2025.csv | End-Entity | 🔧 Corrected |
| Cert-GeneralIT_CABF_TLSBR_2025_PQC.csv | End-Entity PQC | ✅ Valid |
| Cert-RootCA-GeneralIT_CABF_TLSBR_2025.csv | Root CA | ✅ Valid |
| CSR-GeneralIT_CABF_TLSBR_2025.csv | CSR | ✅ Valid |

### ETSI EN 319 412-2 (Financial)

| File | Scope | Status |
|------|-------|--------|
| Cert-Financial_ETSI_EN319412-2_2025.csv | End-Entity | 🔧 Corrected |
| Cert-RootCA-Financial_ETSI_EN319412-2_2025.csv | Root CA | 🔧 Corrected |
| CSR-Financial_ETSI_EN319412-2_2025.csv | CSR | 🔧 Corrected |

### 3GPP TS 33.310 (Telecom/5G)

| File | Scope | Status |
|------|-------|--------|
| Cert-Telecom_3GPP_TS33310_2025.csv | NF End-Entity | 🔧 Corrected |
| Cert-Telecom_3GPP_TS33310_2025_PQC.csv | NF End-Entity PQC | ✅ Valid |
| Cert-RootCA-Telecom_3GPP_TS33310_2025.csv | Root CA | ✅ Valid |
| CSR-Telecom_3GPP_TS33310_2025.csv | CSR | ✅ Valid |

---

## OpenSSL Configuration Notes

### ETSI qcStatements Extension

The qcStatements extension requires custom ASN.1 encoding in OpenSSL. Add this to your openssl.cnf:

```ini
[ v3_qc_ext ]
qcStatements = ASN1:SEQUENCE:qcStatements_section

[ qcStatements_section ]
# id-etsi-qcs-QcCompliance (0.4.0.1862.1.1)
qc1 = SEQUENCE:qcCompliance

[ qcCompliance ]
statementId = OID:0.4.0.1862.1.1
```

### organizationIdentifier (2.5.4.97)

Native in OpenSSL 3.x. Use directly in distinguished_name section:

```ini
[ req_distinguished_name ]
countryName = FR
organizationName = Example Bank SA
organizationIdentifier = NTRFR-123456789
commonName = Jane Doe
```

### keyUsage Note

OpenSSL uses `nonRepudiation` instead of `contentCommitment` (they are synonymous per RFC 5280, but OpenSSL only recognizes the former):

```ini
keyUsage = critical, digitalSignature, nonRepudiation
```

---

## Corrected Files Delivered

All corrected CSV files are included in this output:

1. `Cert-GeneralIT_CABF_TLSBR_2025.csv` - **Modified** (added missing extensions)
2. `Cert-Telecom_3GPP_TS33310_2025.csv` - **Modified** (fixed nftypes OID)
3. `Cert-Financial_ETSI_EN319412-2_2025.csv` - **Modified** (OpenSSL compatibility fixes)
4. `Cert-RootCA-Financial_ETSI_EN319412-2_2025.csv` - **Modified** (OpenSSL compatibility fixes)
5. `CSR-Financial_ETSI_EN319412-2_2025.csv` - **Modified** (keyUsage fix)
6. `Cert-GeneralIT_CABF_TLSBR_2025_PQC.csv` - Verified correct
7. `Cert-RootCA-GeneralIT_CABF_TLSBR_2025.csv` - Verified correct
8. `Cert-RootCA-Telecom_3GPP_TS33310_2025.csv` - Verified correct
9. `Cert-Telecom_3GPP_TS33310_2025_PQC.csv` - Verified correct
10. `CSR-GeneralIT_CABF_TLSBR_2025.csv` - Verified correct
11. `CSR-Telecom_3GPP_TS33310_2025.csv` - Verified correct

---

## References

- **NIST FIPS 203** - Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **NIST FIPS 204** - Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **NIST FIPS 205** - Stateless Hash-Based Digital Signature Standard (SLH-DSA)
- **RFC 5280** - Internet X.509 Public Key Infrastructure Certificate and CRL Profile
- **RFC 9310** - X.509 Certificate Extension for 5G Network Function Types
- **CA/B Forum TLS BR 2.1.x** - Baseline Requirements for TLS Server Certificates
- **ETSI EN 319 412-2** - Certificate Profiles for TSP
- **3GPP TS 33.310** - Network Domain Security; Authentication Framework
- **OpenSSL 3.5.0 Release Notes** - https://www.openssl.org/news/openssl-3.5-notes.html
