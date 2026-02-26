# Code Signing & Supply Chain Security Module

This module teaches post-quantum code signing and software supply chain security. Code signing is the cryptographic mechanism that guarantees software integrity and publisher authenticity. Every operating system, package manager, and app store relies on digital signatures to verify that binaries have not been tampered with after publication. The module covers supply chain attack case studies (SolarWinds, 3CX, Codecov), the quantum threat amplifier for supply chains, PQC signing algorithms (ML-DSA, SLH-DSA, LMS), certificate chain architecture, package manager signing status, Sigstore keyless signing, and secure boot/firmware signing with CNSA 2.0 timelines.

## Key Concepts

- **Supply chain attacks**: SolarWinds (2020, trojanized Orion update signed with legitimate certificate, ~18,000 organizations affected), 3CX (2023, cascading upstream dependency compromise), Codecov (2021, unsigned CI script modified to exfiltrate environment variables)
- **Quantum amplifier for supply chains**: Quantum computers transform supply chain risk from key theft to key forgery via Shor's algorithm; adversaries could derive any publisher's private key from their public certificate; HNDL applied to signed artifacts enables future signature forgery; a quantum-compromised Root CA key affects the entire ecosystem simultaneously
- **Classical vs PQC code signing algorithms**: ECDSA P-256 (64 B sig, quantum vulnerable), RSA-4096 (512 B sig, quantum vulnerable), ML-DSA-44 (2,420 B sig, quantum safe), ML-DSA-87 (4,627 B sig, quantum safe), SLH-DSA-128s (7,856 B sig, quantum safe); PQC signatures are 38-123x larger than ECDSA but acceptable for code signing since verification is per-install
- **Code signing certificate chains**: Root CA (ML-DSA-87, strongest), Intermediate CA (ML-DSA-65), end-entity Code Signing Certificate (ML-DSA-44, EKU OID 1.3.6.1.5.5.7.3.3, 1-year validity); PQC timestamping (RFC 3161) requires PQC-capable TSAs
- **Package manager signing**: RPM leading with hybrid ML-DSA-87+Ed448 in RHEL 10; most others (npm, PyPI, Maven, NuGet, APT/DPKG) rely on upstream Sigstore PQC adoption; hybrid signing provides backward compatibility
- **Sigstore keyless signing**: Identity-based trust (GitHub/Google auth) with short-lived certificates from Fulcio CA; all signatures recorded in Rekor transparency log; centralizes PQC migration to Fulcio and Rekor infrastructure
- **Secure boot and firmware signing**: Trust chain from immutable root of trust (ROM/TPM) through UEFI Secure Boot, OS kernel, to runtime firmware; firmware keys have 10-20 year lifetimes making them priority PQC migration targets
- **CNSA 2.0 mandate**: NSA mandates LMS/HSS or XMSS for firmware/software signing in National Security Systems; 2025 prefer CNSA 2.0 algorithms, 2030 all NSS must use CNSA 2.0, 2033-35 full quantum-resistant enforcement
- **LMS vs ML-DSA for firmware**: LMS offers compact signatures (2.5 KB) and tiny public keys (56 B), fast verification (~0.1 ms), CNSA 2.0 compliant, but requires stateful monotonic counter; ML-DSA is stateless but has larger signatures (3.3 KB) and public keys (1.9 KB)

## Workshop Activities

1. **Binary Signing**: Sign a file hash with ML-DSA and verify the signature interactively
2. **Certificate Chain Builder**: Build a complete PQC code signing certificate chain (Root CA, Intermediate CA, end-entity)
3. **Package Signing**: Simulate RPM-style hybrid ML-DSA-87+Ed448 composite package signing
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
