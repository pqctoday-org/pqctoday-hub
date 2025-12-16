# TLS Certificates Directory

This directory contains TLS certificates and keys used for testing and development of the TLS 1.3 Basics learning module.

## Structure

```
certs/
├── pqc/              # Post-Quantum Cryptography certificates
│   ├── pqc_root.*    # PQC Root CA (ML-DSA-44)
│   ├── pqc_server.*  # PQC Server certificate
│   └── pqc_client.*  # PQC Client certificate
├── rsa/              # RSA certificates
│   ├── rsa_root.*    # RSA Root CA (2048-bit)
│   ├── rsa_server.*  # RSA Server certificate
│   └── rsa_client.*  # RSA Client certificate
└── root.*            # Legacy root certificates
```

## File Types

- `.key` - Private keys (never commit to version control)
- `.crt` - X.509 certificates (PEM format)
- `.csr` - Certificate Signing Requests
- `.srl` - Serial number files for CA operations

## Certificate Details

### PQC Certificates
- **Algorithm**: ML-DSA-44 (FIPS 204 - Module-Lattice Digital Signature Algorithm)
- **Key Size**: ~2.5 KB (post-quantum secure)
- **Validity**: 365 days
- **Purpose**: Testing TLS 1.3 with post-quantum signatures

### RSA Certificates
- **Algorithm**: RSA 2048-bit
- **Key Size**: 2048 bits
- **Validity**: 365 days
- **Purpose**: Testing TLS 1.3 with classical signatures

## Regenerating Certificates

Certificates are generated using the `regen_all_certs.sh` script in the project root. This script uses OpenSSL 3.6.0 with PQC support.

**Note**: All certificate files in this directory are gitignored and should never be committed to version control.

## Security Notice

⚠️ **These certificates are for DEVELOPMENT and TESTING ONLY**

- Do NOT use these certificates in production
- Private keys are generated locally and should remain private
- Certificates are self-signed and not trusted by browsers
- Used exclusively for the TLS 1.3 learning module demonstrations
