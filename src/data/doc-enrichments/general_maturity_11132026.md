---
generated: 2026-11-13
category: Technical Standards
document_count: 1
requirement_count: 3
---

## Quantum-resistant-signing-on-AWS-Part-1-Build-a-software-sup
- **Source**: Quantum-resistant signing on AWS, Part 1: Build a software supply chain with ML-DSA
- **URL**: https://aws.amazon.com/blogs/security/quantum-resistant-signing-on-aws-part-1-build-a-software-supply-chain-with-ml-dsa/
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Protect integrity of signed artifacts and their signatures by enabling S3 Object Lock (WORM), or at minimum S3 Versioning with restricted write access.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Before a code-signing certificate expires, re-sign active artifacts with a newly issued certificate, or otherwise ensure long-term verifiability (longer validity or RFC 3161 timestamping) for artifacts that must outlive the certificate.
    - _T3 Repeatable · software_: Make EXTERNAL_MU (externally computed 64-byte mu via OpenSSL 3.5) the pipeline's default KMS ML-DSA signing method for artifacts of any size; use RAW message type only for inputs of fixed, small size.
