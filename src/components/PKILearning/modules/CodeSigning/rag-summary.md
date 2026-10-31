# Code Signing & Supply Chain Security Module

This module teaches post-quantum code signing and software supply chain security. Code signing is the cryptographic mechanism that guarantees software integrity and publisher authenticity. Every operating system, package manager, and app store relies on digital signatures to verify that binaries have not been tampered with after publication. The module covers supply chain attack case studies (SolarWinds, 3CX, Codecov), the quantum threat amplifier for supply chains, PQC signing algorithms (ML-DSA, SLH-DSA, LMS), certificate chain architecture, package manager signing status, Sigstore keyless signing, and secure boot/firmware signing with CNSA 2.0 timelines.

## Key Concepts

- **Supply chain attacks**: SolarWinds (2020, Orion software build system compromised; the vulnerability shipped in updates released March to June 2020 and was not in the source code repository; CISA reports the malicious Orion library was then signed by the legitimate SolarWinds code signing certificate; fewer than 18,000 customers may have had an installation), 3CX (2023, Mandiant: the compromise began with a tampered X_TRADER installer signed by Trading Technologies International, Inc, which led to a trojanized 3CX DesktopApp; the first software supply chain attack Mandiant had seen lead to another), Codecov (2021, Bash Uploader script modified without authorization to export CI-related information)
- **Quantum amplifier for supply chains**: Quantum computers transform supply chain risk from key theft to key forgery via Shor's algorithm; adversaries could derive any publisher's private key from their public certificate; HNDL applied to signed artifacts enables future signature forgery; a quantum-compromised Root CA key affects the entire ecosystem simultaneously
- **Classical vs PQC code signing algorithms**: ECDSA P-256 (64 B sig, quantum vulnerable), RSA-4096 (512 B sig, quantum vulnerable), ML-DSA-44 (2,420 B sig, quantum safe), ML-DSA-87 (4,627 B sig, quantum safe), SLH-DSA-128s (7,856 B sig, quantum safe); PQC signatures are 38-123x larger than ECDSA but acceptable for code signing since verification is per-install
- **Code signing certificate chains**: Root CA (ML-DSA-87, strongest), Intermediate CA (ML-DSA-65), end-entity Code Signing Certificate (ML-DSA-44, EKU OID 1.3.6.1.5.5.7.3.3, 1-year validity); PQC timestamping (RFC 3161) requires PQC-capable TSAs
- **Package manager signing**: RPM leading with hybrid ML-DSA-87+Ed448 in RHEL 10.1, with the RSA signature kept in the package for older systems; npm and PyPI sign through Sigstore, whose ML-DSA support is listed as experimental
- **Sigstore keyless signing**: Identity-based trust (GitHub/Google auth) with short-lived certificates from Fulcio CA; all signatures recorded in Rekor transparency log; centralizes PQC migration to Fulcio and Rekor infrastructure
- **Secure boot and firmware signing**: Trust chain from immutable root of trust (ROM/TPM) through UEFI Secure Boot, OS kernel, to runtime firmware; firmware keys have 10-20 year lifetimes making them priority PQC migration targets
- **CNSA 2.0 mandate**: NSA permits ML-DSA-87 or the stateful LMS/XMSS schemes specified by SP 800-208 for firmware/software signing in National Security Systems; the category guidance says prefer CNSA 2.0 signing from 2025 and use it exclusively by 2030. FAQ version 2.2 mandates CNSA 2.0 algorithms for NSS by 2031 unless otherwise noted; 2035 is the separate NSM-10 objective.
- **LMS vs ML-DSA for firmware**: LMS offers compact signatures (2.5 KB) and tiny public keys (56 B), fast verification (~0.1 ms), CNSA 2.0 compliant, but requires stateful monotonic counter; ML-DSA is stateless but has larger signatures (3.3 KB) and public keys (1.9 KB)

## Workshop Activities

1. **Binary Signing**: Sign a file hash with ML-DSA and verify the signature interactively
2. **Certificate Chain Builder**: Build a complete PQC code signing certificate chain (Root CA, Intermediate CA, end-entity)
3. **Package Signing**: Simulate RPM-style ML-DSA-87+Ed448 hybrid package signing
4. **Sigstore Flow**: Walk through keyless signing workflow including OIDC authentication, Fulcio certificate issuance, and Rekor transparency log recording
5. **Secure Boot Chain**: Explore firmware signing trust chain with LMS, XMSS, and ML-DSA across boot stages

## Related Standards

- FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- NIST SP 800-208 (LMS/HSS and XMSS)
- NSA CNSA 2.0 guidance for firmware/software signing
- RFC 3161 (Internet X.509 PKI Time-Stamp Protocol)
- IETF composite signatures draft (hybrid classical + PQC)
- Sigstore (Fulcio, Rekor, Cosign)
- SLSA and in-toto supply chain verification frameworks
